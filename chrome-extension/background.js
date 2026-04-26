/**
 * WHERE 見積書メーカー — background service worker
 *
 * Drive へのアップロード（OAuth）と Slack Webhook 投稿を担う。
 */

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'SAVE_TO_DRIVE') {
    saveToDrive(msg).then(
      (result) => sendResponse({ ok: true, ...result }),
      (err) => sendResponse({ ok: false, error: String(err.message || err) })
    );
    return true; // keep channel open for async
  }
  if (msg.type === 'POST_TO_SLACK') {
    postToSlack(msg).then(
      (result) => sendResponse({ ok: true, ...result }),
      (err) => sendResponse({ ok: false, error: String(err.message || err) })
    );
    return true;
  }
});

// ----------------------------------------------------------------
// Google Drive へアップロード
// ----------------------------------------------------------------
async function saveToDrive({ filename, base64, mime, folderId }) {
  const token = await getAuthToken();
  // multipart アップロード
  const metadata = {
    name: filename,
    mimeType: mime
  };
  if (folderId) metadata.parents = [folderId];

  const boundary = '-------where-' + Math.random().toString(36).slice(2);
  const delim = '\r\n--' + boundary + '\r\n';
  const closeDelim = '\r\n--' + boundary + '--';

  const body =
    delim +
    'Content-Type: application/json\r\n\r\n' +
    JSON.stringify(metadata) +
    delim +
    'Content-Type: ' + mime + '\r\n' +
    'Content-Transfer-Encoding: base64\r\n\r\n' +
    base64 +
    closeDelim;

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'multipart/related; boundary=' + boundary
      },
      body
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Drive API ${res.status}: ${text}`);
  }
  return await res.json(); // { id, webViewLink }
}

function getAuthToken() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError || !token) {
        reject(new Error(chrome.runtime.lastError?.message || 'auth failed'));
      } else {
        resolve(token);
      }
    });
  });
}

// ----------------------------------------------------------------
// Slack Webhook
// ----------------------------------------------------------------
async function postToSlack({ webhook, form, filename }) {
  const total = form.grand ? '¥' + form.grand.toLocaleString('en-US') : '';
  const body = {
    text: `:page_facing_up: 新しい見積書が作成されました`,
    blocks: [
      { type: 'section', text: { type: 'mrkdwn', text: `*:page_facing_up: 見積書が作成されました*\n\`${filename}\`` } },
      { type: 'section', fields: [
        { type: 'mrkdwn', text: `*顧客*\n${form.customer || '—'}` },
        { type: 'mrkdwn', text: `*件名*\n${form.subject || '—'}` },
        { type: 'mrkdwn', text: `*担当*\n${form.rep || '—'}` },
        { type: 'mrkdwn', text: `*発行日*\n${form.issueDate || '—'}` },
        { type: 'mrkdwn', text: `*合計*\n${total}` }
      ]}
    ]
  };
  const res = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Slack ${res.status}: ${text}`);
  }
  return { posted: true };
}
