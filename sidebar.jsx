/* WHERE 見積書メーカー — Sidebar (left form panel) */
/* eslint-disable */
const { useState, useMemo, useRef } = React;

const Chev = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 6 15 12 9 18"/></svg>
);
const SearchIco = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
);

function Accordion({ num, title, pill, subtotal, openId, setOpen, id, muted, children }) {
  const open = openId === id;
  return (
    <div className={`acc ${open ? 'open' : ''} ${muted ? 'muted' : ''}`}>
      <div className="acc-head" onClick={() => setOpen(open ? null : id)}>
        <div className="acc-num">{num}</div>
        <div className="acc-title">
          {title}
          {pill && <span className={`pill pill-${pill.kind}`}>{pill.text}</span>}
        </div>
        <div className={`acc-subtotal ${subtotal === 0 || subtotal == null ? 'zero' : ''}`}>
          {subtotal == null ? '' : (subtotal === 0 ? '—' : '¥' + subtotal.toLocaleString('en-US'))}
        </div>
        <div className="acc-chev"><Chev /></div>
      </div>
      {open && <div className="acc-body">{children}</div>}
    </div>
  );
}

function Toggle({ on, onChange, label, desc }) {
  return (
    <div className="toggle-row">
      <div>
        <div className="lbl">{label}</div>
        {desc && <div className="desc">{desc}</div>}
      </div>
      <div className={`toggle ${on ? 'on' : ''}`} onClick={() => onChange(!on)} />
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="field">
      <div className="label">
        <span>{label}</span>
        {hint && <span className="hint">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Sidebar({ form, setForm, openSection, setOpenSection, focusOn = null }) {
  const D = window.WHERE_DATA;
  const set = (path, v) => {
    setForm(prev => {
      const next = { ...prev };
      const parts = path.split('.');
      let o = next;
      for (let i = 0; i < parts.length - 1; i++) {
        o[parts[i]] = { ...o[parts[i]] };
        o = o[parts[i]];
      }
      o[parts[parts.length - 1]] = v;
      return next;
    });
  };

  const sub = (k) => D.sectionSubtotal(form, k);

  return (
    <aside className="sidebar" data-screen-label="Sidebar">
      <div className="sidebar-head">
        <div className="sb-tabbar">
          <div className="sb-tab active">入力</div>
          <div className="sb-tab">テンプレート</div>
          <div className="sb-tab">履歴</div>
        </div>
        <div className="sb-search">
          <SearchIco />
          <input placeholder="セクション・項目を検索" />
          <span style={{fontFamily:'var(--font-mono)', fontSize:10, color:'var(--muted-3)'}}>⌘K</span>
        </div>
      </div>

      <div className="sidebar-body scroll-thin">
        {/* ① 顧客情報 */}
        <Accordion num="1" id="customer" openId={openSection} setOpen={setOpenSection}
                   title="顧客情報" subtotal={null}>
          <Field label="顧客名">
            <input className="input" value={form.customer} onChange={e => set('customer', e.target.value)} placeholder="株式会社○○" />
          </Field>
          <Field label="件名" hint="プリセット選択で行構成が変わります">
            <select className="select" value={form.subject} onChange={e => set('subject', e.target.value)}>
              {D.SUBJECTS.map(s => <option key={s}>{s}</option>)}
              <option value="__custom">カスタム入力…</option>
            </select>
          </Field>
          <div className="field-row">
            <Field label="ご利用期間 開始">
              <input type="date" className="input" value={form.startDate} onChange={e => set('startDate', e.target.value)} />
            </Field>
            <Field label="ご利用期間 終了">
              <input type="date" className="input" value={form.endDate} onChange={e => set('endDate', e.target.value)} />
            </Field>
          </div>
          <div className="field-row">
            <Field label="発行日">
              <input type="date" className="input" value={form.issueDate} onChange={e => set('issueDate', e.target.value)} />
            </Field>
            <Field label="有効期限">
              <input type="date" className="input" value={form.expireDate} onChange={e => set('expireDate', e.target.value)} />
            </Field>
          </div>
          <Field label="営業担当者">
            <select className="select" value={form.rep} onChange={e => set('rep', e.target.value)}>
              {D.REPS.map(r => <option key={r}>{r}</option>)}
            </select>
          </Field>
        </Accordion>

        {/* ② 契約条件 */}
        <Accordion num="2" id="contract" openId={openSection} setOpen={setOpenSection}
                   title="契約条件" subtotal={null}>
          <Field label="契約期間">
            <select className="select" value={form.months} onChange={e => set('months', Number(e.target.value))}>
              {Array.from({length: 12}, (_, i) => i + 1).map(m => <option key={m} value={m}>{m} ヶ月</option>)}
            </select>
          </Field>
          <Field label="業種">
            <div className="radio">
              <div className={form.industry === '不動産' ? 'active' : ''} onClick={() => set('industry', '不動産')}>不動産</div>
              <div className={form.industry === '再エネ' ? 'active' : ''} onClick={() => set('industry', '再エネ')}>再エネ</div>
            </div>
          </Field>
        </Accordion>

        {/* ③ 導入支援 */}
        <Accordion num="3" id="onboarding" openId={openSection} setOpen={setOpenSection}
                   title="WHERE導入支援費用"
                   pill={{ kind: form.onboarding.include ? 'on' : 'off', text: form.onboarding.include ? '含める' : 'スキップ' }}
                   subtotal={sub('onboarding')}>
          <Toggle on={form.onboarding.include} onChange={v => set('onboarding.include', v)}
                  label="初期費用を含める" desc="ライセンス月額 ×2.5 で自動算出" />
          <div className="field-row">
            <Field label="金額" hint="編集可">
              <div className="input-wrap">
                <input className="input num with-suffix" value={form.onboarding.amount}
                       onChange={e => set('onboarding.amount', Number(e.target.value) || 0)} />
                <span className="input-suffix">円</span>
              </div>
            </Field>
            <Field label="数量">
              <div className="input-wrap">
                <input className="input num with-suffix" value={form.onboarding.qty}
                       onChange={e => set('onboarding.qty', Number(e.target.value) || 1)} />
                <span className="input-suffix">式</span>
              </div>
            </Field>
          </div>
        </Accordion>

        {/* ④ ライセンス */}
        <Accordion num="4" id="license" openId={openSection} setOpen={setOpenSection}
                   title="WHEREライセンス費用"
                   pill={{ kind: 'on', text: '必須' }}
                   subtotal={sub('license')}>
          <Field label="プラン">
            <div className="plan-list scroll-thin">
              {D.PLANS.map(p => (
                <div key={p.id}
                     className={`plan-row ${form.license.plan === p.id ? 'active' : ''}`}
                     onClick={() => { set('license.plan', p.id); set('license.monthly', p.monthly); }}>
                  <div>
                    <div className="name">{p.name}</div>
                    <div className="meta">{p.meta}</div>
                  </div>
                  <div className="price">¥{p.monthly.toLocaleString('en-US')}<span style={{fontSize:9, color:'var(--muted-2)', fontWeight:400}}>/月</span></div>
                </div>
              ))}
            </div>
          </Field>
          <div className="field-row">
            <Field label="月額単価" hint="特別プラン用に編集可">
              <div className="input-wrap">
                <input className="input num with-suffix" value={form.license.monthly}
                       onChange={e => set('license.monthly', Number(e.target.value) || 0)} />
                <span className="input-suffix">円</span>
              </div>
            </Field>
            <Field label="期間">
              <div className="input-wrap">
                <input className="input num with-suffix" value={form.license.months}
                       onChange={e => set('license.months', Number(e.target.value) || 0)} />
                <span className="input-suffix">ヶ月</span>
              </div>
            </Field>
          </div>
          <label className="checkbox">
            <input type="checkbox" checked={form.license.special} onChange={e => set('license.special', e.target.checked)} />
            「特別プラン」表記を有効にする
          </label>
        </Accordion>

        {/* ⑤ DM */}
        <div ref={focusOn === 'dm' ? (el) => el && el.scrollIntoView : null}>
        <Accordion num="5" id="dm" openId={openSection} setOpen={setOpenSection}
                   title="DM費用"
                   pill={{ kind: form.dm.include ? 'on' : 'off', text: form.dm.include ? '含める' : 'スキップ' }}
                   subtotal={sub('dm')}>
          <Toggle on={form.dm.include} onChange={v => set('dm.include', v)}
                  label="DM費用を含める" desc="ターゲットへの直送DM" />
          <Field label="DMプラン">
            <div className="plan-list scroll-thin" style={{maxHeight: 'none'}}>
              {D.DM_PLANS.map(p => (
                <div key={p.id}
                     className={`plan-row ${form.dm.plan === p.id ? 'active' : ''}`}
                     onClick={() => set('dm.plan', p.id)}>
                  <div>
                    <div className="name">{p.name}</div>
                    <div className="meta">{p.meta}</div>
                  </div>
                  <div className="price">¥{p.unit}<span style={{fontSize:9, color:'var(--muted-2)', fontWeight:400}}>/通</span></div>
                </div>
              ))}
            </div>
          </Field>
          <div className="field-row">
            <Field label="月間通数">
              <div className="input-wrap">
                <input className="input num with-suffix" value={form.dm.monthlyCount}
                       onChange={e => set('dm.monthlyCount', Number(e.target.value) || 0)} />
                <span className="input-suffix">通</span>
              </div>
            </Field>
            <Field label="封入点数 最大">
              <div className="input-wrap">
                <input className="input num with-suffix" value={form.dm.maxItems}
                       onChange={e => set('dm.maxItems', Number(e.target.value) || 0)} />
                <span className="input-suffix">点</span>
              </div>
            </Field>
          </div>
          <Field label="デザイン構成費" hint="¥50,000 / 面">
            <div className="field-row">
              <div className="input-wrap">
                <input className="input num with-suffix" value={form.dm.designSides}
                       onChange={e => set('dm.designSides', Number(e.target.value) || 0)} />
                <span className="input-suffix">面</span>
              </div>
              <div className="input-wrap">
                <input className="input num with-suffix" readOnly value={(form.dm.designSides || 0) * 50000} />
                <span className="input-suffix">円</span>
              </div>
            </div>
          </Field>
        </Accordion>
        </div>

        {/* ⑥ 反響対応 */}
        <Accordion num="6" id="inquiry" openId={openSection} setOpen={setOpenSection}
                   title="反響対応費用"
                   pill={{ kind: form.inquiry.include ? 'on' : 'off', text: form.inquiry.include ? '含める' : 'スキップ' }}
                   subtotal={sub('inquiry')}>
          <Toggle on={form.inquiry.include} onChange={v => set('inquiry.include', v)}
                  label="反響対応を含める" desc="一次受電・ヒアリング代行" />
          <div className="field-row">
            <Field label="月額単価">
              <div className="input-wrap">
                <input className="input num with-suffix" value={form.inquiry.monthly}
                       onChange={e => set('inquiry.monthly', Number(e.target.value) || 0)} />
                <span className="input-suffix">円</span>
              </div>
            </Field>
            <Field label="月間上限件数">
              <div className="input-wrap">
                <input className="input num with-suffix" value={form.inquiry.monthlyCap}
                       onChange={e => set('inquiry.monthlyCap', Number(e.target.value) || 0)} />
                <span className="input-suffix">件</span>
              </div>
            </Field>
          </div>
          <Field label="初期費用" hint="回線設置・スクリプト作成費">
            <div className="input-wrap">
              <input className="input num with-suffix" value={form.inquiry.setup}
                     onChange={e => set('inquiry.setup', Number(e.target.value) || 0)} />
              <span className="input-suffix">円</span>
            </div>
          </Field>
        </Accordion>

        {/* ⑦ 謄本・備考 */}
        <Accordion num="7" id="registry" openId={openSection} setOpen={setOpenSection}
                   title="謄本取得・備考" subtotal={null}>
          <div className="field-row">
            <Field label="登記情報 含む件数">
              <div className="input-wrap">
                <input className="input num with-suffix" value={form.registry.included}
                       onChange={e => set('registry.included', Number(e.target.value) || 0)} />
                <span className="input-suffix">件</span>
              </div>
            </Field>
            <Field label="超過時単価">
              <div className="input-wrap">
                <input className="input num with-suffix" value={form.registry.overage}
                       onChange={e => set('registry.overage', Number(e.target.value) || 0)} />
                <span className="input-suffix">円</span>
              </div>
            </Field>
          </div>
          <Field label="カスタム備考">
            <textarea className="input" style={{height: 60, padding: 6, fontSize: 11, lineHeight: 1.5, resize: 'vertical'}}
                      value={form.note} onChange={e => set('note', e.target.value)} />
          </Field>
        </Accordion>

        {/* ⑧ Custom row */}
        <div style={{padding: '14px 14px 4px 14px'}}>
          <button className="add-custom" onClick={() => {
            const id = 'cust-' + Date.now();
            set('customRows', [...form.customRows, { id, label: '', qty: 1, unit: '式', price: 0 }]);
          }}>
            ＋ カスタム項目を追加
          </button>
        </div>
      </div>

      <div className="sidebar-foot">
        <div className="sb-totalrow"><span>小計</span><span className="num">¥{D.subTotal(D.buildLines(form)).toLocaleString('en-US')}</span></div>
        <div className="sb-totalrow"><span>消費税 (10%)</span><span className="num">¥{D.tax(D.subTotal(D.buildLines(form))).toLocaleString('en-US')}</span></div>
        <div className="sb-totalrow grand"><span>合計</span><span className="num">¥{(D.subTotal(D.buildLines(form)) + D.tax(D.subTotal(D.buildLines(form)))).toLocaleString('en-US')}</span></div>
      </div>
    </aside>
  );
}

window.WHERE_Sidebar = Sidebar;
