/* ============================================================
 * matrix.js — IFM 功能医学矩阵（数据层 + 录入渲染 + 报告渲染）
 * 节点定义沿用旧项目 lingtai-guanji-ifm-matrix 的成熟结构：
 *   IFM 七大功能节点 + 中心 MES（心理 · 情绪 · 精神）。
 * 只表达中性观察层级：未记录 / 有记录 / 记录较多，不做任何风险评分。
 * ============================================================ */
window.GJ = window.GJ || {};

/* IFM 七大功能节点（官方术语，双语；short 用于故事与关键词） */
GJ.NODES = [
  { id: 'assimilation',       zh: '同化',     en: 'Assimilation',                 zhsub: '消化吸收',     short: '消化' },
  { id: 'defense',            zh: '防御与修复', en: 'Defense & Repair',             zhsub: '免疫 · 炎症', short: '防御' },
  { id: 'energy',             zh: '能量',     en: 'Energy',                       zhsub: '精力 · 线粒体', short: '能量' },
  { id: 'biotransformation',  zh: '生物转化与排泄', en: 'Biotransformation & Elimination', zhsub: '解毒 · 排泄', short: '生物转化' },
  { id: 'transport',          zh: '运输',     en: 'Transport',                    zhsub: '循环 · 血脂', short: '运输' },
  { id: 'communication',      zh: '沟通',     en: 'Communication',                zhsub: '内分泌 · 神经', short: '沟通' },
  { id: 'structural',         zh: '结构完整性', en: 'Structural Integrity',         zhsub: '关节 · 肌肉', short: '结构' },
];

/* MES 中心核（心理 · 情绪 · 精神）——矩阵的中心，不是第八个功能节点 */
GJ.MES = {
  id: 'mes',
  zh: '心理 · 情绪 · 精神',
  en: 'Mental · Emotional · Spiritual',
  zhsub: '中心核 · 身心的汇合处',
};

GJ.ALL_MATRIX_IDS = GJ.NODES.map((n) => n.id).concat([GJ.MES.id]);

/* 记录层级（中性观察语言，禁止风险/疾病措辞） */
GJ.LEVELS = ['未记录', '有记录', '记录较多'];

/* ---------- 工具 ---------- */

/* 把线索文本拆成条目（顿号/逗号/分号/换行分隔） */
GJ.matrixSplitClues = function (text) {
  if (!text || !text.trim()) return [];
  return text
    .split(/[、，,;；\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
};

/* 计算每个节点的观察结果：线索数、层级、线索条目、关联事件 */
GJ.matrixCompute = function (state) {
  const result = {};
  GJ.ALL_MATRIX_IDS.forEach((id) => {
    const cluesText = (state.nodeClues && state.nodeClues[id]) || '';
    const clueItems = GJ.matrixSplitClues(cluesText);
    const events = (state.events || []).filter((e) => (e.nodes || []).indexOf(id) !== -1);
    const count = clueItems.length + events.length;
    const level = count === 0 ? 0 : count >= 3 ? 2 : 1;
    /* 展示线索：用户填写的线索在前，关联事件标题在后，最多 3 条 */
    const shown = clueItems.concat(events.map((e) => e.title)).slice(0, 3);
    result[id] = { id: id, count: count, level: level, clues: shown, events: events };
  });
  return result;
};

/* ---------- 矩阵录入区渲染 ---------- */

GJ.matrixRenderInput = function (container, state, onChange) {
  const computed = GJ.matrixCompute(state);
  const defs = GJ.NODES.concat([GJ.MES]);
  container.innerHTML = '';
  defs.forEach((def) => {
    const c = computed[def.id];
    const card = document.createElement('div');
    card.className = 'mx-input-card' + (def.id === 'mes' ? ' mx-input-mes' : '');
    const isMes = def.id === 'mes';
    card.innerHTML =
      '<div class="mx-input-head"><span class="mx-zh">' + def.zh + '</span>' +
      '<span class="mx-en">' + def.en + '</span>' +
      (isMes ? '<span class="mx-tag-mes">中心核</span>' : '') +
      '<span class="mx-lv lv' + c.level + '">' + GJ.LEVELS[c.level] + '</span></div>' +
      '<div class="mx-sub">' + def.zhsub + (c.events.length ? ' · 关联事件 ' + c.events.length + ' 件' : ' · 暂无关联事件') + '</div>' +
      '<textarea class="mx-clues" rows="2" placeholder="相关线索，如：腹胀、排便变化、饮食节律不规律（选填）"></textarea>';
    const ta = card.querySelector('.mx-clues');
    ta.value = (state.nodeClues && state.nodeClues[def.id]) || '';
    ta.addEventListener('input', function () {
      state.nodeClues = state.nodeClues || {};
      state.nodeClues[def.id] = ta.value;
      /* 实时更新层级徽章 */
      const items = GJ.matrixSplitClues(ta.value);
      const cnt = items.length + c.events.length;
      const lv = cnt === 0 ? 0 : cnt >= 3 ? 2 : 1;
      const badge = card.querySelector('.mx-lv');
      badge.className = 'mx-lv lv' + lv;
      badge.textContent = GJ.LEVELS[lv];
      onChange();
    });
    container.appendChild(card);
  });
};

/* ---------- 报告矩阵渲染（七大节点环绕 MES 中心核） ---------- */

GJ.matrixRenderReport = function (container, state) {
  const computed = GJ.matrixCompute(state);
  container.innerHTML = '';

  const core = document.createElement('div');
  core.className = 'rp-mx-core';
  const mesC = computed[GJ.MES.id];
  core.innerHTML =
    '<div class="rp-mx-core-zh">' + GJ.MES.zh + '</div>' +
    '<div class="rp-mx-core-en">' + GJ.MES.en + '</div>' +
    '<div class="rp-mx-core-lv lv' + mesC.level + '">' + GJ.LEVELS[mesC.level] + '</div>' +
    (mesC.clues.length ? '<div class="rp-mx-core-clues">' + mesC.clues.map(escHtml).join(' · ') + '</div>' : '');
  container.appendChild(core);

  const ring = document.createElement('div');
  ring.className = 'rp-mx-ring';
  GJ.NODES.forEach((def) => {
    const c = computed[def.id];
    const cell = document.createElement('div');
    cell.className = 'rp-mx-cell lv' + c.level;
    cell.innerHTML =
      '<div class="rp-mx-zh">' + def.zh + '</div>' +
      '<div class="rp-mx-en">' + def.en + '</div>' +
      '<div class="rp-mx-sub">' + def.zhsub + '</div>' +
      '<div class="rp-mx-lv">' + GJ.LEVELS[c.level] + '</div>' +
      (c.clues.length
        ? '<div class="rp-mx-clues">' + c.clues.map(escHtml).join(' · ') + '</div>'
        : '<div class="rp-mx-clues rp-mx-none">本次未记录相关线索</div>');
    ring.appendChild(cell);
  });
  container.appendChild(ring);

  /* 图例：中性层级说明 */
  const legend = document.createElement('div');
  legend.className = 'rp-mx-legend';
  legend.innerHTML =
    '<span><i class="dot lv0"></i>未记录</span><span><i class="dot lv1"></i>有记录</span>' +
    '<span><i class="dot lv2"></i>记录较多</span>' +
    '<span class="rp-mx-note">层级仅表示记录多少，不是任何健康判断或结论。</span>';
  container.appendChild(legend);
};

/* 供其他模块使用：取节点定义 */
GJ.matrixNodeDef = function (id) {
  if (id === GJ.MES.id) return GJ.MES;
  return GJ.NODES.find((n) => n.id === id) || null;
};

function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
GJ.escHtml = escHtml;
