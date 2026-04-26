/**
 * WHERE 見積書メーカー — Gmail content-script
 *
 * Gmail の compose（メール作成）ダイアログを検出し、送信ボタン横に
 * 「WHERE 見積書を作成」ボタンを注入する。
 */
(function () {
  'use strict';

  const LOG_PREFIX = '[WHERE]';
  const log = (...args) => console.log(LOG_PREFIX, ...args);

  log('content-script loaded', location.href);

  const BUTTON_CLASS = 'where-estimate-btn';
  const composeRegistry = new WeakMap(); // composeEl -> { id, recipient }

  // -----------------------------------------------------------------
  // compose 検出: 「送信」ボタンを起点に compose 全体を特定する
  //   - 送信ボタンは [role="button"] かつ aria-label or data-tooltip に "送信" / "Send" を含む
  // -----------------------------------------------------------------
  function findComposeRoots() {
    const roots = new Set();
    // 送信ボタン候補を全部洗い出す
    const candidates = document.querySelectorAll(
      '[role="button"][aria-label], [role="button"][data-tooltip], div[role="button"]'
    );
    for (const btn of candidates) {
      const label = (btn.getAttribute('aria-label') || '') +
                    ' ' + (btn.getAttribute('data-tooltip') || '');
      if (!/送信|\bSend\b/i.test(label)) continue;
      // 送信ボタンを含む compose ダイアログ要素を遡って取得
      let el = btn;
      while (el && el !== document.body) {
        if (el.matches('div[role="dialog"]')) { roots.add(el); break; }
        // popout window 内の場合 dialog 役割が無いので、フォーム要素を root とする
        if (el.tagName === 'FORM') { roots.add(el); break; }
        el = el.parentElement;
      }
    }
    return Array.from(roots);
  }

  // -----------------------------------------------------------------
  // compose にボタン注入
  // -----------------------------------------------------------------
  function injectIntoCompose(composeEl) {
    if (!composeEl) return;
    if (composeEl.querySelector('.' + BUTTON_CLASS)) return; // 既に注入済み

    // 送信ボタンを compose 内で再取得（compose ローカルスコープ）
    const sendBtn = Array.from(
      composeEl.querySelectorAll('[role="button"]')
    ).find(b => {
      const t = (b.getAttribute('aria-label') || '') + ' ' + (b.getAttribute('data-tooltip') || '');
      return /送信|\bSend\b/i.test(t);
    });
    if (!sendBtn) {
      log('send button not found inside compose', composeEl);
      return;
    }

    const id = 'compose-' + Math.random().toString(36).slice(2, 10);
    const recipient = extractRecipient(composeEl);
    composeRegistry.set(composeEl, { id, recipient });

    const btn = document.createElement('div');
    btn.className = BUTTON_CLASS;
    btn.setAttribute('role', 'button');
    btn.setAttribute('tabindex', '0');
    btn.title = 'WHERE 見積書メーカーを開く';
    btn.style.cssText = `
      display: inline-flex; align-items: center; gap: 6px;
      margin-left: 8px; padding: 8px 14px;
      background: #1e3a8a; color: #fff;
      border: 0; border-radius: 4px;
      font-size: 13px; font-family: 'Noto Sans JP', sans-serif;
      cursor: pointer; font-weight: 600;
      box-shadow: 0 1px 2px rgba(0,0,0,.15);
      vertical-align: middle;
      white-space: nowrap;
      user-select: none;
    `;
    btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="vertical-align:middle"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="14" x2="15" y2="14"/><line x1="9" y1="17" x2="13" y2="17"/></svg><span>WHERE 見積書を作成</span>';
    btn.onmouseenter = () => { btn.style.background = '#1e40af'; };
    btn.onmouseleave = () => { btn.style.background = '#1e3a8a'; };
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openEditor(id, recipient, composeEl);
    });

    // 送信ボタンの直後に挿入
    const parent = sendBtn.parentElement;
    if (parent) {
      // sendBtn の親が table cell 等の場合、その親（td 横並び）にスパンとして追加できないので
      // sendBtn の隣に直接 sibling として置く
      sendBtn.insertAdjacentElement('afterend', btn);
      log('button injected into compose', { id, recipient, sendBtn });
    }
  }

  function extractRecipient(composeEl) {
    const tos = composeEl.querySelectorAll('input[name="to"], textarea[name="to"], [aria-label*="宛先"], [aria-label*="To"]');
    for (const el of tos) {
      const v = el.value || el.textContent || '';
      if (v && v.includes('@')) return v.trim();
    }
    return '';
  }

  // -----------------------------------------------------------------
  // エディタを別ウィンドウで開く
  // -----------------------------------------------------------------
  function openEditor(composeId, recipient, composeEl) {
    chrome.storage.local.get(['editorUrl'], (cfg) => {
      const url = cfg.editorUrl ||
        'https://tanaka-where.github.io/WHERE_Estimate_Maker/WHERE%20%E8%A6%8B%E7%A9%8D%E6%9B%B8%E3%83%A1%E3%83%BC%E3%82%AB%E3%83%BC.html';
      const u = new URL(url);
      u.searchParams.set('source', 'gmail-extension');
      u.searchParams.set('composeId', composeId);
      if (recipient) u.searchParams.set('to', recipient);

      const win = window.open(u.toString(), 'where-editor-' + composeId,
        'width=1440,height=940,resizable=yes,scrollbars=yes');
      if (!win) { alert('ポップアップがブロックされました。ブラウザの設定で許可してください。'); return; }

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
  // 完了処理：PDF を compose に添付 + Drive保存
  // -----------------------------------------------------------------
  async function handleCompletion(payload, composeEl) {
    const { filename, base64, mime, form } = payload;
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const blob = new Blob([bytes], { type: mime });
    const file = new File([blob], filename, { type: mime });

    const attached = attachToCompose(composeEl, file);
    showToast(attached ? 'PDFを添付しました' : '添付に失敗 — ダウンロードしました');
    if (!attached) {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    }

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

  function attachToCompose(composeEl, file) {
    try {
      const target = composeEl.querySelector('[contenteditable="true"]') || composeEl;
      const dt = new DataTransfer();
      dt.items.add(file);
      target.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
      return true;
    } catch (e) {
      console.error(LOG_PREFIX, 'attach failed', e);
      return false;
    }
  }

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
  // 監視
  // -----------------------------------------------------------------
  let scanScheduled = false;
  function scan() {
    scanScheduled = false;
    const composes = findComposeRoots();
    if (composes.length) {
      log('found ' + composes.length + ' compose(s)');
      composes.forEach(injectIntoCompose);
    }
  }
  function scheduleScan() {
    if (scanScheduled) return;
    scanScheduled = true;
    setTimeout(scan, 200); // デバウンス
  }

  const observer = new MutationObserver(() => scheduleScan());
  observer.observe(document.body, { childList: true, subtree: true });

  // 初回スキャン（複数回試行：ページ初期化遅延に対応）
  setTimeout(scan, 500);
  setTimeout(scan, 1500);
  setTimeout(scan, 3000);

  // 開発者向けデバッグ用にグローバル公開
  window.__WHERE_DEBUG = { scan, findComposeRoots };
  log('ready. window.__WHERE_DEBUG.scan() で手動スキャン可能');
})();
