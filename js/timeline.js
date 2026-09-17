/* ============================================================
 * timeline.js — 功能医学时间轴
 * 承担：事件发生顺序 + 可能的因果线索 + 身体演变过程。
 * 沿用 IFM 的 Antecedents / Triggers / Mediators 三因分类，
 * 另加「当前表现」标记现在。时间轴用于建立“可能的因果假设”，
 * 不等于已经证明医学因果，因此全篇使用“同一时期出现 / 可能相关 /
 * 值得继续观察”的克制表达。
 * ============================================================ */
window.GJ = window.GJ || {};

/* 事件分类（ATM + 当前表现） */
GJ.ATM_TYPES = [
  { key: 'antecedent', zh: '前因', en: 'Antecedent', zhfull: '前因 · 易感背景',
    desc: '更早的背景：遗传、童年经历、长期习惯、既往疾病、长期环境等。' },
  { key: 'trigger',    zh: '诱因', en: 'Trigger',    zhfull: '诱因 · 触发事件',
    desc: '触发事件：感染、手术、创伤、明显饮食变化、重大生活事件等。' },
  { key: 'mediator',   zh: '介质', en: 'Mediator',   zhfull: '介质 · 持续影响',
    desc: '持续影响：长期睡眠不足、慢性压力、持续不良饮食、活动不足等。' },
  { key: 'current',    zh: '当前表现', en: 'Current',  zhfull: '当前表现',
    desc: '现在主要的身体感受与困扰。' },
];

/* 事件可选信号标签（身体 / 生活变化的线索类型） */
GJ.EVENT_SIGNALS = [
  { key: 'symptom',     zh: '出现症状' },
  { key: 'disease',     zh: '发生疾病' },
  { key: 'medication',  zh: '使用药物' },
  { key: 'supplement',  zh: '开始补充剂' },
  { key: 'stress',      zh: '明显压力事件' },
  { key: 'diet',        zh: '饮食变化' },
  { key: 'sleep',       zh: '睡眠变化' },
  { key: 'infection',   zh: '感染' },
  { key: 'surgery',     zh: '手术' },
  { key: 'lifeevent',   zh: '重大生活事件' },
  { key: 'testresult',  zh: '新的检查结果' },
];

/* 空事件模板 */
GJ.newEvent = function () {
  return {
    id: 'ev-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 1e6).toString(36),
    time: '',
    title: '',
    desc: '',
    atm: 'trigger',
    bodyChange: '',      /* 身体发生了什么变化 */
    lifestyleChange: '', /* 当时有哪些生活方式变化 */
    signals: [],         /* GJ.EVENT_SIGNALS 的 key 列表 */
    nodes: [],           /* 关联的 IFM 节点 id 列表 */
  };
};

GJ.atmDef = function (key) {
  return GJ.ATM_TYPES.find((t) => t.key === key) || GJ.ATM_TYPES[1];
};

/* ---------- 保守的日历时间比较（原则：宁可不排序，也不制造假先后） ----------
 * 只识别结构明确的日历写法：2025 / 2025-06 / 2025-06-15，
 * 以及 2025年 / 2025年6月 / 2025年6月15日、斜线或点号的等价形式。
 * 年龄、人生阶段、模糊短语与不存在的日期一律返回 null。 */
GJ.parseEventCalendar = function (str) {
  const s = String(str || '').trim().replace(/\s+/g, '');
  let m = s.match(/^(\d{4})(?:年)?$/);
  if (m) {
    const y = +m[1];
    if (y < 1000) return null;
    return { start: y * 10000 + 101, end: y * 10000 + 1231, precision: 'year' };
  }

  m = s.match(/^(\d{4})[-\/.](\d{1,2})$/) || s.match(/^(\d{4})年(\d{1,2})月$/);
  if (m) {
    const y = +m[1], mo = +m[2];
    if (y < 1000 || mo < 1 || mo > 12) return null;
    const lastDay = new Date(Date.UTC(y, mo, 0)).getUTCDate();
    return { start: y * 10000 + mo * 100 + 1, end: y * 10000 + mo * 100 + lastDay, precision: 'month' };
  }

  m = s.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})$/) ||
    s.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日?$/);
  if (m) {
    const y = +m[1], mo = +m[2], d = +m[3];
    if (y < 1000 || mo < 1 || mo > 12) return null;
    const lastDay = new Date(Date.UTC(y, mo, 0)).getUTCDate();
    if (d < 1 || d > lastDay) return null;
    const value = y * 10000 + mo * 100 + d;
    return { start: value, end: value, precision: 'day' };
  }
  return null;
};

/* 返回 -1 / 0 / 1；两个精度不同且区间重叠的时间无法可靠判断，返回 null。 */
GJ.compareCalendarRanges = function (a, b) {
  if (a.end < b.start) return -1;
  if (a.start > b.end) return 1;
  if (a.start === b.start && a.end === b.end) return 0;
  return null;
};

/* 只有整个事件集合都能形成可靠的日历先后，才允许整体排序或声称“最近”。 */
GJ.calendarOrderItems = function (events) {
  const items = (events || []).map(function (event, index) {
    return { event: event, index: index, calendar: GJ.parseEventCalendar(event && event.time) };
  });
  if (!items.length || items.some(function (item) { return item.calendar === null; })) return null;
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      if (GJ.compareCalendarRanges(items[i].calendar, items[j].calendar) === null) return null;
    }
  }
  return items;
};

GJ.sortEventsConservatively = function (events) {
  const items = GJ.calendarOrderItems(events);
  if (!items) return (events || []).slice();
  return items.sort(function (a, b) {
    const compared = GJ.compareCalendarRanges(a.calendar, b.calendar);
    return compared === 0 ? a.index - b.index : compared;
  }).map(function (item) { return item.event; });
};

GJ.latestComparableEvent = function (events) {
  const items = GJ.calendarOrderItems(events);
  if (!items || !items.length) return null;
  items.sort(function (a, b) {
    const compared = GJ.compareCalendarRanges(a.calendar, b.calendar);
    return compared === 0 ? a.index - b.index : compared;
  });
  return items[items.length - 1].event;
};

/* ---------- 事件表单渲染（新增 / 编辑共用） ---------- */

GJ.timelineRenderForm = function (container, state, editingId, onSaved, onCancel) {
  const ev = editingId
    ? state.events.find((e) => e.id === editingId)
    : null;
  const draft = ev ? JSON.parse(JSON.stringify(ev)) : GJ.newEvent();

  container.innerHTML =
    '<div class="tl-form-title">' + (ev ? '编辑事件' : '添加时间轴事件') + '</div>' +
    '<div class="tl-form-grid">' +
    '  <label>时间<input id="tlf-time" type="text" placeholder="推荐统一写 2025 / 2025-06 / 2025-06-15；也接受 30 岁、大学期间等" value="' + GJ.escHtml(draft.time) + '"></label>' +
    '  <label>事件标题 *<input id="tlf-title" type="text" placeholder="如：开始出现明显胃肠不适" value="' + GJ.escHtml(draft.title) + '"></label>' +
    '</div>' +
    '<label>简短描述<textarea id="tlf-desc" rows="2" placeholder="这件事大致是什么？一两句话即可">' + GJ.escHtml(draft.desc) + '</textarea></label>' +
    '<div class="tl-form-grid">' +
    '  <label>身体发生了什么变化<input id="tlf-body" type="text" placeholder="如：饭后容易腹胀" value="' + GJ.escHtml(draft.bodyChange) + '"></label>' +
    '  <label>当时的生活方式变化<input id="tlf-life" type="text" placeholder="如：开始经常加班、吃饭不规律" value="' + GJ.escHtml(draft.lifestyleChange) + '"></label>' +
    '</div>' +
    '<div class="tl-field-title">事件类型（IFM 三因 + 当前表现）</div>' +
    '<div class="tl-atm-opts">' +
    GJ.ATM_TYPES.map(function (t) {
      return '<label class="tl-atm-opt"><input type="radio" name="tlf-atm" value="' + t.key + '"' +
        (draft.atm === t.key ? ' checked' : '') + '><span><b>' + t.zh + '</b><i>' + t.desc + '</i></span></label>';
    }).join('') +
    '</div>' +
    '<div class="tl-field-title">相关信号（可多选）</div>' +
    '<div class="tl-sig-opts">' +
    GJ.EVENT_SIGNALS.map(function (s) {
      return '<label class="tl-sig-opt"><input type="checkbox" value="' + s.key + '"' +
        (draft.signals.indexOf(s.key) !== -1 ? ' checked' : '') + '>' + s.zh + '</label>';
    }).join('') +
    '</div>' +
    '<div class="tl-field-title">关联 IFM 功能节点（可多选，与时间轴互相呼应）</div>' +
    '<div class="tl-node-opts">' +
    GJ.NODES.map(function (n) {
      return '<label class="tl-node-opt"><input type="checkbox" value="' + n.id + '"' +
        (draft.nodes.indexOf(n.id) !== -1 ? ' checked' : '') + '>' + n.zh + '<i>' + n.en + '</i></label>';
    }).join('') +
    '<label class="tl-node-opt tl-node-mes"><input type="checkbox" value="mes"' +
      (draft.nodes.indexOf('mes') !== -1 ? ' checked' : '') + '>心理·情绪·精神<i>MES 中心核</i></label>' +
    '</div>' +
    '<div class="tl-form-btns">' +
    '  <button type="button" class="btn btn-primary" id="tlf-save">保存事件</button>' +
    '  <button type="button" class="btn btn-ghost" id="tlf-cancel">取消</button>' +
    '</div>';

  container.querySelector('#tlf-save').addEventListener('click', function () {
    const title = container.querySelector('#tlf-title').value.trim();
    if (!title) {
      container.querySelector('#tlf-title').focus();
      container.querySelector('#tlf-title').classList.add('input-err');
      return;
    }
    draft.time = container.querySelector('#tlf-time').value.trim();
    draft.title = title;
    draft.desc = container.querySelector('#tlf-desc').value.trim();
    draft.bodyChange = container.querySelector('#tlf-body').value.trim();
    draft.lifestyleChange = container.querySelector('#tlf-life').value.trim();
    const atmEl = container.querySelector('input[name="tlf-atm"]:checked');
    draft.atm = atmEl ? atmEl.value : 'trigger';
    draft.signals = Array.prototype.map.call(
      container.querySelectorAll('.tl-sig-opts input:checked'),
      function (el) { return el.value; }
    );
    draft.nodes = Array.prototype.map.call(
      container.querySelectorAll('.tl-node-opts input:checked'),
      function (el) { return el.value; }
    );
    if (ev) {
      Object.assign(ev, draft);
    } else {
      state.events.push(draft);
    }
    onSaved();
  });
  container.querySelector('#tlf-cancel').addEventListener('click', onCancel);
};

/* ---------- 事件列表渲染（录入页） ---------- */

GJ.timelineRenderList = function (container, state, onEdit, onDelete, onChange) {
  container.innerHTML = '';
  if (!state.events.length) {
    container.innerHTML = '<div class="tl-empty">还没有记录事件。点下方「添加事件」，把重要的健康与生活变化按时间放进来。</div>';
    return;
  }
  /* 列表按可严格比较的日历时间排序；无法比较的事件保持录入顺序 */
  const sorted = GJ.sortEventsConservatively(state.events);
  sorted.forEach(function (ev) {
    const atm = GJ.atmDef(ev.atm);
    const nodeNames = (ev.nodes || [])
      .map(function (id) { const d = GJ.matrixNodeDef(id); return d ? d.zh : id; })
      .join('、');
    const sigNames = (ev.signals || [])
      .map(function (k) { const s = GJ.EVENT_SIGNALS.find(function (x) { return x.key === k; }); return s ? s.zh : k; })
      .join(' · ');
    const item = document.createElement('div');
    item.className = 'tl-item atm-' + atm.key;
    item.innerHTML =
      '<div class="tl-item-head"><span class="tl-time">' + GJ.escHtml(ev.time || '时间未填') + '</span>' +
      '<span class="tl-badge">' + atm.zh + '</span></div>' +
      '<div class="tl-title">' + GJ.escHtml(ev.title) + '</div>' +
      (ev.desc ? '<div class="tl-desc">' + GJ.escHtml(ev.desc) + '</div>' : '') +
      (ev.bodyChange ? '<div class="tl-meta">身体变化：' + GJ.escHtml(ev.bodyChange) + '</div>' : '') +
      (ev.lifestyleChange ? '<div class="tl-meta">生活方式：' + GJ.escHtml(ev.lifestyleChange) + '</div>' : '') +
      (sigNames ? '<div class="tl-sigs">' + GJ.escHtml(sigNames) + '</div>' : '') +
      (nodeNames ? '<div class="tl-nodes">关联节点：' + GJ.escHtml(nodeNames) + '</div>' : '') +
      '<div class="tl-item-btns">' +
      '<button type="button" class="btn-mini" data-act="edit">编辑</button>' +
      '<button type="button" class="btn-mini btn-mini-danger" data-act="del">删除</button></div>';
    item.querySelector('[data-act="edit"]').addEventListener('click', function () { onEdit(ev.id); });
    item.querySelector('[data-act="del"]').addEventListener('click', function () { onDelete(ev.id); });
    container.appendChild(item);
  });
};

/* ---------- 报告时间轴渲染（主视觉区域之一） ---------- */

GJ.timelineRenderReport = function (container, state) {
  container.innerHTML = '';
  if (!state.events.length) {
    container.innerHTML = '<div class="tl-empty">本次没有时间轴事件。</div>';
    return;
  }
  const sorted = GJ.sortEventsConservatively(state.events);
  sorted.forEach(function (ev) {
    const atm = GJ.atmDef(ev.atm);
    const nodeNames = (ev.nodes || [])
      .map(function (id) { const d = GJ.matrixNodeDef(id); return d ? d.zh : id; })
      .join('、');
    const sigNames = (ev.signals || [])
      .map(function (k) { const s = GJ.EVENT_SIGNALS.find(function (x) { return x.key === k; }); return s ? s.zh : k; })
      .join(' · ');
    const row = document.createElement('div');
    row.className = 'rp-tl-row atm-' + atm.key;
    row.innerHTML =
      '<div class="rp-tl-rail"><span class="rp-tl-dot"></span></div>' +
      '<div class="rp-tl-body">' +
      '  <div class="rp-tl-head"><span class="rp-tl-time">' + GJ.escHtml(ev.time || '时间未填') + '</span>' +
      '  <span class="rp-tl-badge">' + atm.zhfull + '</span></div>' +
      '  <div class="rp-tl-title">' + GJ.escHtml(ev.title) + '</div>' +
      (ev.desc ? '<div class="rp-tl-desc">' + GJ.escHtml(ev.desc) + '</div>' : '') +
      (ev.bodyChange || ev.lifestyleChange
        ? '<div class="rp-tl-meta">' +
          (ev.bodyChange ? '<span>身体变化：' + GJ.escHtml(ev.bodyChange) + '</span>' : '') +
          (ev.lifestyleChange ? '<span>生活方式：' + GJ.escHtml(ev.lifestyleChange) + '</span>' : '') +
          '</div>'
        : '') +
      (sigNames ? '<div class="rp-tl-sigs">' + GJ.escHtml(sigNames) + '</div>' : '') +
      (nodeNames ? '<div class="rp-tl-nodes">关联 IFM 节点：' + GJ.escHtml(nodeNames) + '</div>' : '') +
      '</div>';
    container.appendChild(row);
  });
  /* 克制的因果说明 */
  const note = document.createElement('div');
  note.className = 'rp-tl-note';
  note.textContent = '时间轴呈现的是事件发生的顺序与同一时期出现的线索，用于建立可能的因果假设；它们可能相关，值得继续观察，也可以与专业人员讨论。';
  container.appendChild(note);
};
