/**
 * WHERE 見積書メーカー — Gmail content-script
 *
 * Gmail のメール作成（compose）ダイアログを検出し、ツールバーに
 * 「WHERE 見積書を作成」ボタンを注入する。クリックすると見積書メーカー
 * のエディタを別ウィンドウで開き、PDF生成完了の postMessage を待ち受け、
 * compose の添付ファイル欄に PDF を投入する。同時に background.js に
 * Drive保存・Slack通知を依頼する。
 */
(function () {
  'use strict';

  const BUTTON_CLASS = 'where-estimate-btn';
  const composeRegistry = new WeakMap(); // composeEl -> { id, recipient }

  // -----------------------------------------------------------------
  // 編集中の compose を検出してボタン注入
  // -----------------------------------------------------------------
  function injectIntoCompose(composeEl) {
    if (composeEl.querySelector('.' + BUTTON_CLASS)) return;
    // Gmail の compose ツールバー（送信ボタン横）を取得
    const toolbar = composeEl.querySelector('[gh="ts"]') ||
                    composeEl.querySelector('div[role="toolbar"]') ||
                    composeEl.querySelector('td.gU.Up');
    if (!toolbar) return;

    const id = 'compose-' + Math.random().toString(36).slice(2, 10);
    const recipient = extractRecipient(composeEl);
    composeRegistry.set(composeEl, { id, recipient });

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = BUTTON_CLASS;
    btn.title = 'WHERE 見積書メーカーを開く';
    btn.style.cssText = `
      display: inline-flex; align-items: center; gap: 6px;
      margin-left: 8px; padding: 6px 12px;
      background: #1e3a8a; color: #fff;
      border: 0; border-radius: 4px;
      font-size: 12px; font-family: 'Noto Sans JP', sans-serif;
      cursor: pointer; font-weight: 600;
      box-shadow: 0 1px 2px rgba(0,0,0,.15);
    `;
    btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="14" x2="15" y2="14"/><line x1="9" y1="17" x2="13" y2="17"/></svg>WHERE 見積書を作成';
    btn.onmouseenter = () => { btn.style.background = '#1e40af'; };
    btn.onmouseleave = () => { btn.style.background = '#1e3a8a'; };
    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      openEditor(id, recipient, composeEl);
    };

    toolbar.appendChild(btn);
  }

  function extractRecipient(composeEl) {
    const toField = composeEl.querySelector('[name="to"], input[aria-label*="宛先"], input[aria-label*="To"]');
    return toField ? (toField.value || '') : '';
  }

  // -----------------------------------------------------------------
  // エディタを別ウィンドウで開く
  // -----------------------------------------------------------------
  function openEditor(composeId, recipient, composeEl) {
    chrome.storage.local.get(['editorUrl'], (cfg) => {
      const url = cfg.editorUrl ||
        'https://[YOUR-GITHUB-USER].github.io/WHERE_Estimate_Maker/WHERE%20%E8%A6%8B%E7%A9%8D%E6%9B%B8%E3%83%A1%E3%83%BC%E3%82%AB%E3%83%BC.html';
      const u = new URL(url);
      u.searchParams.set('source', 'gmail-extension');
      u.searchParams.set('composeId', composeId);
      if (recipient) u.searchParams.set('to', recipient);

      const win = window.open(u.toString(), 'where-editor-' + composeId,
        'width=1440,height=940,resizable=yes,scrollbars=yes');
      if (!win) { alert('ポップアップがブロックされました。ブラウザの設定で許可してください。'); return; }

      // 完了通知の postMessage を待ち受け
      const onMsg = (ev) => {
        const d = ev.data;
        if (!d || d.type !== 'WHERE_ESTIMATE_COMPLETE') return;
        if (d.composeId !== composeId) return;
        window.removeEventListener('message', onMsg);
        handleCompletion(d, composeEl);
        try { win.close(); } catch (e) {}
      };
      window.addEventListener('message', onMsg);
    });
  }

  // -----------------------------------------------------------------
  // 完了処理：PDF を compose に添付 + Drive保存 + Slack通知
  // -----------------------------------------------------------------
  async function handleCompletion(payload, composeEl) {
    const { filename, base64, mime, form } = payload;
    // base64 → Blob
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const blob = new Blob([bytes], { type: mime });
    const file = new File([blob], filename, { type: mime });

    // 1) Gmail compose に添付
    const attached = attachToCompose(composeEl, file);
    showToast(attached ? 'PDFを添付しました' : '添付に失敗 — ダウンロードしました');
    if (!attached) {
      // フォールバック：ダウンロードのみ
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    }

    // 2) Drive保存・Slack通知（settings に応じて実行）
    chrome.storage.local.get(['enableDrive', 'enableSlack', 'slackWebhook', 'driveFolder'], async (cfg) => {
      if (cfg.enableDrive) {
        chrome.runtime.sendMessage({
          type: 'SAVE_TO_DRIVE',
          filename, base64, mime, folderId: cfg.driveFolder || ''
        }, (resp) => {
          if (resp?.ok) showToast('Driveに保存しました');
          else if (resp?.error) showToast('Drive保存失敗: ' + resp.error);
        });
      }
      if (cfg.enableSlack && cfg.slackWebhook) {
        chrome.runtime.sendMessage({
          type: 'POST_TO_SLACK',
          webhook: cfg.slackWebhook,
          form, filename
        }, (resp) => {
          if (resp?.ok) showToast('Slackに投稿しました');
          else if (resp?.error) showToast('Slack投稿失敗: ' + resp.error);
        });
      }
    });
  }

  // -----------------------------------------------------------------
  // Gmail compose に File を添付
  // (DataTransferオブジェクトを drop イベントとして dispatch)
  // -----------------------------------------------------------------
  function attachToCompose(composeEl, file) {
    try {
      // compose 内の最も内側の dropzone（通常は本文エリア）を探す
      const target = composeEl.querySelector('[role="dialog"] [g_editable="true"]') ||
                     composeEl.querySelector('[contenteditable="true"]') ||
                     composeEl;
      const dt = new DataTransfer();
      dt.items.add(file);
      const drop = new DragEvent('drop', {
        bubbles: true, cancelable: true,
        dataTransfer: dt
      });
      target.dispatchEvent(drop);
      return true;
    } catch (e) {
      console.error('[WHERE] attach failed', e);
      return false;
    }
  }

  // -----------------------------------------------------------------
  // トースト
  // -----------------------------------------------------------------
  function showToast(msg) {
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = `
      position: fixed; bottom: 24px; left: 50%;
      transform: translateX(-50%);
      background: #0a0a0a; color: #fff;
      padding: 10px 18px; border-radius: 999px;
      font: 12px 'Noto Sans JP'; z-index: 99999;
      box-shadow: 0 8px 24px rgba(0,0,0,.25);
    `;
    document.body.appendChild(t);
    setTimeout(() => { t.remove(); }, 3000);
  }

  // -----------------------------------------------------------------
  // 監視：DOM 変更を観察して compose を検出
  // -----------------------------------------------------------------
  function scan() {
    document.querySelectorAll('div[role="dialog"][aria-label*="メッセージ"], div[role="dialog"][aria-label*="Message"]')
      .forEach(injectIntoCompose);
    // 旧UI / pop-out 対応
    document.querySelectorAll('.nH.aHU, .nH.Hd[role="region"]').forEach(injectIntoCompose);
  }

  const observer = new MutationObserver(() => scan());
  observer.observe(document.body, { childList: true, subtree: true });
  scan();
})();
