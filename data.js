/* WHERE 見積書メーカー — data layer */

window.WHERE_DATA = (() => {
  const PLANS = [
    { id: 'id',          name: 'IDプラン',                  monthly: 100000, target: '従量', overage: 200,  meta: 'ターゲット数：従量 / 超過 ¥200/カウント' },
    { id: 'trial',       name: 'トライアルプラン',          monthly: 300000, target: 250,    overage: 1200, meta: '最大 250 / 超過 ¥1,200/カウント' },
    { id: 'entry',       name: 'エントリプラン',            monthly: 400000, target: 333,    overage: 1100, meta: '最大 333 / 超過 ¥1,100/カウント' },
    { id: 'standard',    name: 'スタンダードプラン',        monthly: 500000, target: 500,    overage: 1000, meta: '最大 500 / 超過 ¥1,000/カウント' },
    { id: 'advance',     name: 'アドバンスプラン',          monthly: 700000, target: 1000,   overage: 700,  meta: '最大 1,000 / 超過 ¥700/カウント' },
    { id: 'pro',         name: 'プロフェッショナルプラン',  monthly: 1000000, target: 1700,  overage: 600,  meta: '最大 1,700 / 超過 ¥600/カウント' },
    { id: 'specialist',  name: 'スペシャリストプラン',      monthly: 1500000, target: 2800,  overage: 550,  meta: '最大 2,800 / 超過 ¥550/カウント' },
    { id: 'expert',      name: 'エキスパートプラン',        monthly: 2000000, target: 4000,  overage: 500,  meta: '最大 4,000 / 超過 ¥500/カウント' },
    { id: 'scale',       name: 'スケールプラン',            monthly: 3000000, target: 7500,  overage: 400,  meta: '最大 7,500 / 超過 ¥400/カウント' },
    { id: 'enterprise',  name: 'エンタープライズプラン',    monthly: 4000000, target: 13500, overage: 300,  meta: '最大 13,500 / 超過 ¥300/カウント' },
  ];

  const DM_PLANS = [
    { id: 'basic',    name: 'ベーシック',  unit: 330, meta: '¥330/通' },
    { id: 'standard', name: 'スタンダード', unit: 460, meta: '¥460/通' },
    { id: 'premium',  name: 'プレミアム',   unit: 620, meta: '¥620/通' },
  ];

  const REPS = [
    '阿部 文哉','大多和 奈岐','落合 健太','鎌田 紗耶加','金子 莉奈',
    '境 健太','佐藤 瞭','鈴木 優仁子','須藤 大貴','高野 智樹',
    '野出 貴代','萩原 稲一郎','藤井 富実矢','村山 知輝','山本 哲郎',
    '渡辺 悠太','関根 ゆたか','田續 陸','宮城 りな'
  ];

  const SUBJECTS = [
    'WHERE利用費',
    'WHERE利用費 / DM費用',
    'WHERE利用費 / DM費用 / 反響対応費用',
  ];

  // Default form state — preset 2 (WHERE+DM) for the primary preview
  const defaultForm = (preset = 'where_dm') => ({
    customer: '株式会社サンプル不動産',
    subject: preset === 'where' ? SUBJECTS[0] : preset === 'where_dm_call' ? SUBJECTS[2] : SUBJECTS[1],
    startDate: '2026-05-01',
    endDate:   '2027-04-30',
    issueDate: '2026-04-13',
    expireDate:'2026-05-31',
    rep: '落合 健太',
    months: 12,
    industry: '不動産',
    onboarding: { include: true, amount: 1500000, qty: 1 },
    license:    { plan: 'pro', monthly: 600000, months: 12, special: true },
    dm: {
      include: preset !== 'where',
      plan: 'standard',
      monthlyCount: 300,
      maxItems: 4,
      designSides: 2,
    },
    inquiry: {
      include: preset === 'where_dm_call',
      monthly: 85000,
      setup: 45000,
      monthlyCap: 50,
    },
    registry: { included: 100, overage: 500 },
    note: '本見積書の有効期限は 2026/5/31 とさせて頂きます。',
    customRows: [],
    deviated: false,
  });

  const fmt = (n) => {
    if (n === 0 || n == null || isNaN(n)) return '-';
    return Number(n).toLocaleString('en-US');
  };
  const fmtY = (n) => {
    if (n === 0 || n == null || isNaN(n)) return '¥-';
    return '¥' + Number(n).toLocaleString('en-US');
  };

  // Build line items from form (initial template generation).
  function buildLines(f) {
    const lines = [];
    let group = 1;

    if (f.onboarding.include) {
      lines.push({
        id: 'g-onb', kind: 'group', no: group++,
        label: `${group-1}) WHERE導入支援費用`,
        qty: f.onboarding.qty, unit: '式',
        price: f.onboarding.amount, total: f.onboarding.amount * f.onboarding.qty,
        source: 'onboarding',
      });
      lines.push({ id: 'd-onb-1', kind: 'detail', label: '– 初期設定・活用設計 / アカウント開設・初回オンボーディング', source: 'onboarding' });
      lines.push({ id: 'd-onb-2', kind: 'detail', label: '– 運用ガイド / 業界別テンプレート提供（不動産・再エネ）', source: 'onboarding' });
    }

    if (f.license) {
      const plan = PLANS.find(p => p.id === f.license.plan) || PLANS[0];
      const total = (f.license.monthly || 0) * (f.license.months || 0);
      const labelPlan = f.license.special ? '特別プラン' : plan.name;
      lines.push({
        id: 'g-lic', kind: 'group', no: group++,
        label: `${group-1}) WHEREライセンス費用`,
        qty: f.license.months, unit: 'ヶ月',
        price: f.license.monthly, total,
        source: 'license',
      });
      lines.push({ id: 'd-lic-1', kind: 'detail', label: `– ${labelPlan}（候補地探索 / オーナー名寄せ / リスト出力）`, source: 'license' });
      lines.push({ id: 'd-lic-2', kind: 'detail', label: `– ターゲット数 上限：${plan.target === '従量' ? '従量制' : plan.target.toLocaleString() + '件'} / 超過単価 ¥${plan.overage}/カウント`, source: 'license' });
    }

    if (f.dm.include) {
      const dm = DM_PLANS.find(p => p.id === f.dm.plan) || DM_PLANS[0];
      const monthlyDM = dm.unit * f.dm.monthlyCount;
      const designFee = (f.dm.designSides || 0) * 50000;
      const totalDM = monthlyDM * f.months;
      lines.push({
        id: 'g-dm', kind: 'group', no: group++,
        label: `${group-1}) DM費用`,
        qty: f.months, unit: 'ヶ月',
        price: monthlyDM, total: totalDM,
        source: 'dm',
      });
      lines.push({ id: 'd-dm-1', kind: 'detail', label: `– ${dm.name}DM / 月間 ${f.dm.monthlyCount.toLocaleString()}通 × @¥${dm.unit}`, source: 'dm' });
      lines.push({ id: 'd-dm-2', kind: 'detail', label: `– 封入点数 最大 ${f.dm.maxItems}点 / 反響QR・効果計測タグ付与`, source: 'dm' });
      if (designFee > 0) {
        lines.push({
          id: 'g-dm-design', kind: 'group', no: group++,
          label: `${group-1}) DMデザイン構成費`,
          qty: f.dm.designSides, unit: '面',
          price: 50000, total: designFee,
          source: 'dm',
        });
        lines.push({ id: 'd-dm-design-1', kind: 'detail', label: '– 各面ごとのレイアウト設計・初稿制作・1回までの修正対応含む', source: 'dm' });
      }
    }

    if (f.inquiry.include) {
      const monthly = f.inquiry.monthly * f.months;
      lines.push({
        id: 'g-inq', kind: 'group', no: group++,
        label: `${group-1}) 反響対応費用`,
        qty: f.months, unit: 'ヶ月',
        price: f.inquiry.monthly, total: monthly,
        source: 'inquiry',
      });
      lines.push({ id: 'd-inq-1', kind: 'detail', label: `– 一次受電・着信対応・ヒアリング代行（月間 上限 ${f.inquiry.monthlyCap} 件）`, source: 'inquiry' });
      lines.push({
        id: 'g-inq-setup', kind: 'group', no: group++,
        label: `${group-1}) 反響対応 初期費用`,
        qty: 1, unit: '式',
        price: f.inquiry.setup, total: f.inquiry.setup,
        source: 'inquiry',
      });
      lines.push({ id: 'd-inq-setup-1', kind: 'detail', label: '– 専用回線設置 / 受電スクリプト作成 / オペレータ研修', source: 'inquiry' });
    }

    // custom rows appended at end
    for (const r of f.customRows) {
      lines.push({
        id: r.id, kind: 'group', no: group++,
        label: `${group-1}) ${r.label || '（新規項目）'}`,
        qty: r.qty || 1, unit: r.unit || '式',
        price: r.price || 0, total: (r.qty || 1) * (r.price || 0),
        source: 'custom',
      });
    }

    return lines;
  }

  function subTotal(lines) {
    return lines.filter(l => l.kind === 'group').reduce((s, l) => s + (l.total || 0), 0);
  }
  function tax(s) { return Math.floor(s * 0.10); }

  function sectionSubtotal(f, key) {
    if (key === 'onboarding') return f.onboarding.include ? f.onboarding.amount * f.onboarding.qty : 0;
    if (key === 'license')    return (f.license.monthly || 0) * (f.license.months || 0);
    if (key === 'dm') {
      if (!f.dm.include) return 0;
      const dm = DM_PLANS.find(p => p.id === f.dm.plan) || DM_PLANS[0];
      return dm.unit * f.dm.monthlyCount * f.months + (f.dm.designSides || 0) * 50000;
    }
    if (key === 'inquiry')    return f.inquiry.include ? f.inquiry.monthly * f.months + f.inquiry.setup : 0;
    if (key === 'custom')     return f.customRows.reduce((s, r) => s + (r.qty || 1) * (r.price || 0), 0);
    return 0;
  }

  return { PLANS, DM_PLANS, REPS, SUBJECTS, defaultForm, buildLines, subTotal, tax, fmt, fmtY, sectionSubtotal };
})();
