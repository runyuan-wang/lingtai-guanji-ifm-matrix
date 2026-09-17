/* ============================================================
 * app.js — 页面状态、表单、本地暂存、流程编排
 * 单页轻流程：填写资料 → 记录时间轴事件 → 标记矩阵节点 →
 * 生成观己报告 → 保存 PNG 长图 / 返回修改。
 * 所有数据只存在浏览器 localStorage，不上传、不同步。
 * ============================================================ */
window.GJ = window.GJ || {};

/* 初始状态 */
GJ.defaultState = function () {
  return {
    profile: { name: '', age: '', sex: '', date: '', height: '', weight: '' },
    lifestyle: { diet: '', sleep: '', bowel: '', exercise: '', stress: '', medication: '', supplements: '' },
    events: [],
    nodeClues: {},
  };
};

GJ.state = GJ.defaultState();

/* ---------- localStorage 暂存 ---------- */
GJ.save = function () {
  try {
    localStorage.setItem(GJ.CONFIG.STORAGE_KEY, JSON.stringify(GJ.state));
  } catch (e) { /* 隐私模式等场景静默失败，不影响使用 */ }
};

GJ.load = function () {
  try {
    const raw = localStorage.getItem(GJ.CONFIG.STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    const st = GJ.defaultState();
    Object.keys(st.profile).forEach(function (k) { if (data.profile && data.profile[k]) st.profile[k] = data.profile[k]; });
    Object.keys(st.lifestyle).forEach(function (k) { if (data.lifestyle && data.lifestyle[k]) st.lifestyle[k] = data.lifestyle[k]; });
    if (Array.isArray(data.events)) st.events = data.events;
    if (data.nodeClues && typeof data.nodeClues === 'object') st.nodeClues = data.nodeClues;
    GJ.state = st;
  } catch (e) { /* 损坏数据则从零开始 */ }
};

GJ.clearSaved = function () {
  try { localStorage.removeItem(GJ.CONFIG.STORAGE_KEY); } catch (e) {}
  GJ.state = GJ.defaultState();
};

/* ---------- 页面初始化 ---------- */
document.addEventListener('DOMContentLoaded', function () {
  GJ.load();

  const $ = function (sel) { return document.querySelector(sel); };

  /* 基础资料 */
  const profileFields = ['name', 'age', 'sex', 'date', 'height', 'weight'];
  profileFields.forEach(function (k) {
    const el = $('#pf-' + k);
    if (!el) return;
    el.value = GJ.state.profile[k] || '';
    el.addEventListener('input', function () {
      GJ.state.profile[k] = el.value;
      GJ.save();
    });
  });

  /* 生活方式 */
  const lifeBox = $('#lifestyle-box');
  GJ.LIFESTYLE_FIELDS.forEach(function (f) {
    const label = document.createElement('label');
    label.className = 'life-field';
    label.innerHTML = '<span class="life-zh">' + f.zh + '</span>' +
      '<input type="text" id="life-' + f.key + '" placeholder="' + f.placeholder + '">';
    lifeBox.appendChild(label);
    const input = label.querySelector('input');
    input.value = GJ.state.lifestyle[f.key] || '';
    input.addEventListener('input', function () {
      GJ.state.lifestyle[f.key] = input.value;
      GJ.save();
    });
  });

  /* 时间轴事件 */
  const tlList = $('#timeline-list');
  const tlFormBox = $('#timeline-form-box');
  let editingId = null;

  function refreshTimeline() {
    GJ.timelineRenderList(tlList, GJ.state, function (id) {
      editingId = id;
      renderTlForm();
      tlFormBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, function (id) {
      if (!window.confirm('确定删除这条事件吗？')) return;
      GJ.state.events = GJ.state.events.filter(function (e) { return e.id !== id; });
      GJ.save();
      refreshTimeline();
      refreshMatrix();
    });
  }

  function renderTlForm() {
    GJ.timelineRenderForm(tlFormBox, GJ.state, editingId, function () {
      editingId = null;
      tlFormBox.innerHTML = '';
      GJ.save();
      refreshTimeline();
      refreshMatrix(); /* 事件可能关联节点，矩阵联动 */
    }, function () {
      editingId = null;
      tlFormBox.innerHTML = '';
    });
  }

  $('#btn-add-event').addEventListener('click', function () {
    editingId = null;
    renderTlForm();
    tlFormBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  /* 矩阵录入 */
  const mxBox = $('#matrix-input-box');
  function refreshMatrix() {
    GJ.matrixRenderInput(mxBox, GJ.state, function () { GJ.save(); });
  }

  refreshTimeline();
  refreshMatrix();

  /* 生成报告 */
  const editView = $('#edit-view');
  const reportView = $('#report-view');
  const reportBox = $('#report-box');
  const storyMeta = $('#story-meta');

  $('#btn-generate').addEventListener('click', function () {
    const hasContent = GJ.state.events.length > 0 ||
      Object.keys(GJ.state.nodeClues).some(function (k) { return (GJ.state.nodeClues[k] || '').trim(); });
    if (!hasContent) {
      window.alert('先至少记录一条时间轴事件，或在矩阵里填写一条线索，再生成报告。');
      return;
    }
    GJ.save();
    const st = GJ.reportBuild(reportBox, GJ.state);
    storyMeta.textContent = '观己故事 · ' + st.chars + ' 字';
    editView.style.display = 'none';
    reportView.style.display = 'block';
    window.scrollTo(0, 0);
  });

  /* 返回修改 */
  $('#btn-back-edit').addEventListener('click', function () {
    reportView.style.display = 'none';
    editView.style.display = 'block';
    refreshTimeline();
    refreshMatrix();
    window.scrollTo(0, 0);
  });

  /* 保存 PNG 长图 */
  const btnPng = $('#btn-save-png');
  const pngStatus = $('#png-status');
  btnPng.addEventListener('click', function () {
    btnPng.disabled = true;
    pngStatus.textContent = '正在生成高清长图，请稍候……';
    GJ.reportExportPNG(reportBox).then(function (dataUrl) {
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = '灵台观己报告.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      pngStatus.textContent = '长图已生成并保存。';
      btnPng.disabled = false;
    }).catch(function (err) {
      pngStatus.textContent = '长图生成失败：' + err.message;
      btnPng.disabled = false;
    });
  });

  /* 清空本地记录 */
  $('#btn-clear').addEventListener('click', function () {
    if (!window.confirm('确定清空浏览器里保存的全部本地记录吗？此操作不可撤销。')) return;
    GJ.clearSaved();
    /* 重置表单显示 */
    profileFields.forEach(function (k) {
      const el = $('#pf-' + k);
      if (el) el.value = '';
    });
    GJ.LIFESTYLE_FIELDS.forEach(function (f) {
      const el = $('#life-' + f.key);
      if (el) el.value = '';
    });
    editingId = null;
    $('#timeline-form-box').innerHTML = '';
    refreshTimeline();
    refreshMatrix();
  });
});
