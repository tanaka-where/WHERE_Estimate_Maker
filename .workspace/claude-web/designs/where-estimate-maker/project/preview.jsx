/* WHERE 見積書メーカー — Quote preview (right pane, A4) */
/* eslint-disable */

const formatJPDate = (s) => {
  if (!s) return '';
  const d = new Date(s);
  if (isNaN(d)) return s;
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
};

function EditableCell({ value, onChange, className, style, editingForced, suffix, prefix, mono }) {
  const ref = React.useRef(null);
  const cls = `editable ${className || ''} ${editingForced ? 'editing' : ''}`;
  return (
    <span
      ref={ref}
      className={cls}
      style={{...style, fontFamily: mono ? 'var(--font-en)' : undefined, fontVariantNumeric: mono ? 'tabular-nums' : undefined}}
      contentEditable
      suppressContentEditableWarning
      onBlur={(e) => onChange && onChange(e.currentTarget.textContent)}
    >
      {prefix}{value}{suffix}
    </span>
  );
}

function QuoteRow({ line, idx, hoverRow, hoverInsert, onClick, isEditing, editTarget }) {
  const D = window.WHERE_DATA;
  const showActions = hoverRow === line.id;
  const showInsert = hoverInsert === line.id;
  const isFresh = line._fresh;
  const cls = [
    'q-row',
    line.kind === 'group' ? 'head-row' : 'detail-row',
    showActions ? 'show-actions' : '',
    showInsert ? 'show-insert' : '',
    isFresh ? 'fresh' : '',
  ].join(' ');

  if (line.kind === 'detail') {
    return (
      <tr className={cls} data-row-id={line.id}>
        <td className="col-no" />
        <td className="item">{line.label}
          <div className="row-actions">
            <button className="row-act-btn grip" title="ドラッグで並べ替え">
              <svg width="8" height="10" viewBox="0 0 8 10" fill="currentColor"><circle cx="2" cy="2" r="1"/><circle cx="6" cy="2" r="1"/><circle cx="2" cy="5" r="1"/><circle cx="6" cy="5" r="1"/><circle cx="2" cy="8" r="1"/><circle cx="6" cy="8" r="1"/></svg>
            </button>
            <button className="row-act-btn del" title="行を削除">
              <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 1l7 7M8 1l-7 7"/></svg>
            </button>
          </div>
          <div className="row-insert"><button className="ins-btn">+</button></div>
        </td>
        <td className="num center" />
        <td className="num center" />
        <td className="num" />
        <td className="num" />
      </tr>
    );
  }

  const editingItem = isEditing && editTarget === line.id;

  return (
    <tr className={cls} data-row-id={line.id}>
      <td className="col-no center">{line.no}</td>
      <td className="item">
        <span className={`editable ${editingItem ? 'editing' : ''}`}>{line.label}</span>
        <div className="row-actions">
          <button className="row-act-btn grip" title="ドラッグで並べ替え">
            <svg width="8" height="10" viewBox="0 0 8 10" fill="currentColor"><circle cx="2" cy="2" r="1"/><circle cx="6" cy="2" r="1"/><circle cx="2" cy="5" r="1"/><circle cx="6" cy="5" r="1"/><circle cx="2" cy="8" r="1"/><circle cx="6" cy="8" r="1"/></svg>
          </button>
          <button className="row-act-btn del" title="行を削除">
            <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 1l7 7M8 1l-7 7"/></svg>
          </button>
        </div>
        <div className="row-insert"><button className="ins-btn">+</button></div>
      </td>
      <td className="num center">{line.qty}</td>
      <td className="num center">{line.unit}</td>
      <td className="num">{D.fmt(line.price)}</td>
      <td className="num">{D.fmt(line.total)}</td>
    </tr>
  );
}

function Preview({ form, hoverRow, hoverInsert, isEditing, editTarget, deviated }) {
  const D = window.WHERE_DATA;
  const lines = D.buildLines(form);
  const sub = D.subTotal(lines);
  const tax = D.tax(sub);
  const grand = sub + tax;

  return (
    <div className="paper" data-screen-label="Quote A4">
      {deviated && (
        <div className="q-deviation">
          <svg width="11" height="11" viewBox="0 0 11 11" fill="currentColor"><path d="M5.5 0L11 10H0z" /></svg>
          テンプレートから外れています
        </div>
      )}

      <div className="q-head">
        <h1 className="q-title">御　見　積　書</h1>
        <img src="assets/logo-where.png" alt="WHERE" className="q-logo" />
      </div>

      <div className="q-meta">
        <div className="q-cust">
          <div className="name">
            <span className="editable">{form.customer}</span>
            <span className="honorific">御中</span>
          </div>
          <div style={{fontSize: 10.5, color: 'var(--muted)', marginTop: 6}}>
            <span style={{display:'inline-block', width: 56, color:'var(--muted-2)'}}>件名</span>
            <span className="editable">{form.subject}</span>
          </div>
          <div style={{fontSize: 10.5, color: 'var(--muted)'}}>
            <span style={{display:'inline-block', width: 56, color:'var(--muted-2)'}}>ご利用期間</span>
            <span className="editable" style={{fontFamily:'var(--font-en)'}}>{formatJPDate(form.startDate)} ～ {formatJPDate(form.endDate)}</span>
          </div>
        </div>
        <div className="q-vendor">
          <div style={{fontSize: 10.5, color: 'var(--muted)'}}>発行日 <span style={{fontFamily:'var(--font-en)'}}>{formatJPDate(form.issueDate)}</span></div>
          <div style={{marginTop: 8}}>東京都文京区湯島四丁目1番16号</div>
          <div>Gate Cross HONGO 7階</div>
          <div className="corp">株式会社WHERE</div>
          <div>営業担当：{form.rep}</div>
          <div className="reg">登録番号：T1010001224810</div>
        </div>
      </div>

      <div className="q-amounts">
        <div className="lbl">金額</div>
        <div className="num big">¥{grand.toLocaleString('en-US')}</div>
        <div className="lbl">別途消費税</div>
        <div className="num">¥{tax.toLocaleString('en-US')}</div>
      </div>

      <table className="q-table">
        <colgroup>
          <col className="col-no" />
          <col className="col-item" />
          <col className="col-qty" />
          <col className="col-unit" />
          <col className="col-price" />
          <col className="col-total" />
        </colgroup>
        <thead>
          <tr>
            <th>No.</th>
            <th>項目</th>
            <th>数量</th>
            <th>単位</th>
            <th>単価</th>
            <th>金額</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line, i) => (
            <QuoteRow key={line.id}
                      line={line} idx={i}
                      hoverRow={hoverRow}
                      hoverInsert={hoverInsert}
                      isEditing={isEditing}
                      editTarget={editTarget} />
          ))}
          {/* fill rows */}
          {Array.from({length: Math.max(0, 14 - lines.length)}).map((_, i) => (
            <tr key={'pad-' + i} className="q-row">
              <td className="col-no" />
              <td />
              <td />
              <td />
              <td className="num" />
              <td className="num" />
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={4} style={{border: 'none', background: 'transparent'}} />
            <td>小計</td>
            <td className="num">{D.fmt(sub)}</td>
          </tr>
          <tr>
            <td colSpan={4} style={{border: 'none', background: 'transparent'}} />
            <td>消費税 (10%)</td>
            <td className="num">{D.fmt(tax)}</td>
          </tr>
          <tr className="grand">
            <td colSpan={4} style={{border: 'none', background: 'transparent'}} />
            <td>合計</td>
            <td className="num">¥{grand.toLocaleString('en-US')}</td>
          </tr>
        </tfoot>
      </table>

      <div className="q-notes">
        <h4>備考</h4>
        <ul>
          <li><span className="editable">本見積書の有効期限は {formatJPDate(form.expireDate)} とさせて頂きます。</span></li>
          {form.license.special && <li><span className="editable">本見積書は 特別プラン を {form.license.months}ヶ月間 の継続利用とする金額です。</span></li>}
          <li><span className="editable">不動産登記情報取得件数：{form.registry.included} カウントを含む。超過分は ¥{form.registry.overage.toLocaleString('en-US')}/件 にて別途ご請求いたします。</span></li>
          {form.note && form.note !== '本見積書の有効期限は 2026/5/31 とさせて頂きます。' && (
            <li><span className="editable">{form.note}</span></li>
          )}
          <li>請求書は月次後払いにて発行いたします。お支払い条件は別途契約書にて取り交わしさせて頂きます。</li>
        </ul>
      </div>

      <div className="q-stamp">
        <div className="box"><div className="head">担当</div></div>
        <div className="box"><div className="head">確認</div></div>
        <div className="box"><div className="head">承認</div></div>
      </div>
    </div>
  );
}

window.WHERE_Preview = Preview;
