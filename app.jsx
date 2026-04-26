/* WHERE 見積書メーカー — App shell + 4 artboards */
/* eslint-disable */

const { useState: useS, useEffect: useE } = React;

const SaveIco = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
const PdfIco = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
const ExcelIco = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 8l8 8M16 8l-8 8"/></svg>;
const WarnIco = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L1 21h22L12 2zm0 7v5m0 4v.01" stroke="#fff" strokeWidth="0" /><path d="M12 2L1 21h22z M11 10v4h2v-4zm0 6v2h2v-2z"/></svg>;
const CheckIco = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="5 12 10 17 19 8"/></svg>;

function Topbar({ onExport }) {
  return (
    <div className="topbar">
      <div className="topbar-left">
        <img src="assets/logo-where.png" alt="WHERE" className="topbar-logo" />
        <div className="topbar-divider" />
        <div className="topbar-title">見積書メーカー</div>
        <div className="topbar-meta">
          <span className="crumb">FS / 提案フェーズ</span>
          <span className="crumb-sep">/</span>
          <span className="doc-id">EST-2026-0413-0017</span>
        </div>
      </div>
      <div />
      <div className="topbar-right">
        <button className="btn btn-ghost"><SaveIco />下書き保存 <span className="kbd">⌘S</span></button>
        <button className="btn"><ExcelIco />Excel出力</button>
        <button className="btn btn-primary" onClick={onExport}><PdfIco />PDF出力</button>
      </div>
    </div>
  );
}

function PreviewToolbar({ zoom, setZoom }) {
  return (
    <div className="preview-toolbar">
      <div className="left">
        <span style={{fontWeight: 600, color: 'var(--ink)'}}>プレビュー</span>
        <span style={{fontSize: 11}}>A4・縦・1ページ</span>
      </div>
      <div className="center">
        <button className="zoom-btn">−</button>
        <span style={{minWidth: 46, textAlign: 'center'}}>{zoom}%</span>
        <button className="zoom-btn">＋</button>
        <span style={{margin: '0 6px', color: 'var(--muted-3)'}}>·</span>
        <span>1 / 1</span>
      </div>
      <div className="right">
        <button className="btn btn-ghost" style={{fontSize: 11}}>テンプレート再適用</button>
        <button className="btn btn-ghost btn-icon" title="グリッド">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
        </button>
      </div>
    </div>
  );
}

function PreviewFooter({ form, deviated }) {
  const D = window.WHERE_DATA;
  const sub = D.subTotal(D.buildLines(form));
  const tax = D.tax(sub);
  const grand = sub + tax;
  return (
    <div className="preview-foot">
      <div>
        {deviated ? (
          <div className="deviation">
            <WarnIco /> テンプレートから外れています — 手動で 2 行を編集
          </div>
        ) : (
          <div style={{color: 'var(--muted)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 6}}>
            <CheckIco /> テンプレートに準拠
          </div>
        )}
      </div>
      <div style={{display: 'flex', alignItems: 'baseline', gap: 14}}>
        <span className="label">税込合計</span>
        <span className="grand">¥{grand.toLocaleString('en-US')}</span>
        <span className="label">（小計 ¥{sub.toLocaleString('en-US')} ／ 消費税 ¥{tax.toLocaleString('en-US')}）</span>
      </div>
      <div style={{textAlign: 'right', fontSize: 11, color: 'var(--muted-2)'}}>
        最終更新 <span style={{fontFamily: 'var(--font-en)'}}>14:23</span>・自動保存済み
      </div>
    </div>
  );
}

function PdfModal({ form, onClose }) {
  const D = window.WHERE_DATA;
  const sub = D.subTotal(D.buildLines(form));
  const tax = D.tax(sub);
  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-head">
          <h3>PDFとして出力</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M2 2l10 10M12 2L2 12"/></svg>
          </button>
        </div>
        <div className="modal-body">
          <div style={{fontSize: 12, color: 'var(--muted)'}}>出力前のチェック</div>

          <div className="validation-row ok">
            <CheckIco />
            <div>消費税の計算が小計と一致 <span style={{fontFamily: 'var(--font-en)', fontWeight: 600, marginLeft: 6}}>¥{tax.toLocaleString('en-US')}</span></div>
            <span style={{fontSize: 10, fontFamily: 'var(--font-en)'}}>OK</span>
          </div>

          <div className="validation-row warn">
            <WarnIco />
            <div>有効期限が発行日から <b>48日後</b>。30日以内の設定が推奨です</div>
            <button className="btn" style={{height: 22, fontSize: 10.5, padding: '0 8px'}}>修正</button>
          </div>

          <div className="validation-row ok">
            <CheckIco />
            <div>営業担当者・登録番号・社印枠 すべて設定済み</div>
            <span style={{fontSize: 10, fontFamily: 'var(--font-en)'}}>OK</span>
          </div>

          <div style={{display: 'grid', gap: 6, marginTop: 4}}>
            <div className="label">出力ファイル名</div>
            <input className="input" defaultValue={`見積書_${form.customer}_2026-04-13.pdf`} />
          </div>

          <label className="checkbox" style={{marginTop: 4}}>
            <input type="checkbox" defaultChecked /> 社内ドラフト共有リンクも合わせて発行
          </label>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>キャンセル</button>
          <button className="btn btn-primary" onClick={onClose}>PDFをダウンロード</button>
        </div>
      </div>
    </div>
  );
}

function App({ form, hoverRow, hoverInsert, isEditing, editTarget, openSection, deviated, showModal }) {
  const Sidebar = window.WHERE_Sidebar;
  const Preview = window.WHERE_Preview;
  const [, force] = useS(0);
  const [_form, _setForm] = useS(form);
  const [_open, _setOpen] = useS(openSection);
  useE(() => { _setForm(form); }, [form]);
  useE(() => { _setOpen(openSection); }, [openSection]);

  return (
    <div className="app">
      <Topbar onExport={() => {}} />
      <div className="main">
        <Sidebar form={_form} setForm={_setForm} openSection={_open} setOpenSection={_setOpen} />
        <div className="preview-pane">
          <PreviewToolbar zoom={92} />
          <div className="preview-scroll">
            <Preview form={_form}
                     hoverRow={hoverRow}
                     hoverInsert={hoverInsert}
                     isEditing={isEditing}
                     editTarget={editTarget}
                     deviated={deviated} />
          </div>
          <PreviewFooter form={_form} deviated={deviated} />
        </div>
      </div>
      {showModal && <PdfModal form={_form} onClose={() => {}} />}
    </div>
  );
}

window.WHERE_App = App;
window.WHERE_PdfModal = PdfModal;
