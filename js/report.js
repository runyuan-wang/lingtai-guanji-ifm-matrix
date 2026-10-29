/* 报告、二维码与真实 PNG 导出。所有用户文字均通过 textContent/转义进入 DOM。 */
window.GJ = window.GJ || {};
GJ.escape = function (value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];
  });
};
GJ.drawQR = function (canvas, url, size) {
  var qr = qrcode(0, 'M');
  qr.addData(url);
  qr.make();
  var count = qr.getModuleCount();
  var cell = Math.max(3, Math.floor((size || 220) / (count + 8)));
  var real = cell * (count + 8);
  canvas.width = real;
  canvas.height = real;
  var ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, real, real);
  ctx.fillStyle = '#273744';
  for (var r = 0; r < count; r += 1) {
    for (var c = 0; c < count; c += 1) {
      if (qr.isDark(r, c)) ctx.fillRect((c + 4) * cell, (r + 4) * cell, cell, cell);
    }
  }
  return canvas;
};
function reportSection(number, title, body) {
  return '<section class="report-section"><div class="report-section-heading"><span class="report-number">' + number + '</span><h2>' + title + '</h2></div>' + body + '</section>';
}
function reportList(items, emptyText) {
  var usable = (items || []).filter(function (item) { return String(item || '').trim(); });
  if (!usable.length) return '<p class="report-muted">' + GJ.escape(emptyText) + '</p>';
  return '<ul class="report-list">' + usable.map(function (item) { return '<li>' + GJ.escape(item) + '</li>'; }).join('') + '</ul>';
}
function reportMatrixNode(node, extraClass, note) {
  var clues = node.clues.map(function (clue) {
    return '<li>' + GJ.escape(clue.label) + '</li>';
  }).join('');
  return '<section class="ifm-node ifm-level-' + node.level + (node.count ? ' ifm-node-recorded' : ' ifm-node-empty') + (extraClass ? ' ' + extraClass : '') + '" data-node="' + GJ.escape(node.id) + '" data-level="' + node.level + '">' +
    '<div class="ifm-node-heading"><div><h3>' + GJ.escape(node.name) + '</h3><p class="ifm-node-subtitle">' + GJ.escape(node.subtitle) + '</p></div><span class="ifm-node-status">' + GJ.escape(node.levelLabel) + '</span></div>' +
    '<p class="ifm-node-english">' + GJ.escape(node.english) + '</p>' +
    '<p class="ifm-node-count">' + node.count + ' 条记录线索</p>' +
    (clues ? '<ul class="ifm-clues" aria-label="来源线索">' + clues + '</ul>' : '') +
    (note ? '<p class="ifm-node-note">' + GJ.escape(note) + '</p>' : '') +
    '</section>';
}
function reportMatrix(matrix) {
  var recordedFirst = matrix.nodes.slice().sort(function (a, b) { return (b.count > 0) - (a.count > 0) || b.count - a.count; });
  var notes = {};
  (matrix.nodeNotes || []).forEach(function (note) { notes[note.id] = note.text; });
  return '<p class="ifm-intro">基于你这次填写的内容，将记录整理到几个观察主题中。</p>' +
    '<div class="ifm-legend" aria-label="记录数量等级"><span><i class="ifm-swatch ifm-level-0" aria-hidden="true"></i>0 条 · 未记录</span><span><i class="ifm-swatch ifm-level-1" aria-hidden="true"></i>1–2 条 · 有记录</span><span><i class="ifm-swatch ifm-level-2" aria-hidden="true"></i>≥3 条 · 记录较多</span></div>' +
    '<div class="ifm-map"><p class="body-story">' + GJ.escape(matrix.story || '这次还没有足够线索串成故事；留白也可以是观己的一部分。') + '</p><div class="ifm-node-grid">' + recordedFirst.map(function (node) { return reportMatrixNode(node, node.id === 'mes' ? 'ifm-node-mes' : '', notes[node.id]); }).join('') + '</div></div>' +
    '<p class="ifm-context-note">正常 / 无明显问题、跳过项和药物 / 补充剂记录只作背景，不计入线索数。</p>' +
    '<p class="ifm-disclaimer">这里的颜色深浅只表示本次填写中相关线索的多少，不代表疾病风险、严重程度或诊断结果。</p>';
}
GJ.reportBuild = function (container, state) {
  var a = GJ.normalizeAnswers ? GJ.normalizeAnswers(state && state.answers) : (state && state.answers) || {};
  if (state && state.answers) state.answers = a;
  var nickname = (a.nickname || '').trim();
  var title = nickname ? GJ.escape(nickname) + '的观己小记' : '这一份观己小记';
  var now = new Date();
  var date = now.getFullYear() + '.' + String(now.getMonth() + 1).padStart(2, '0') + '.' + String(now.getDate()).padStart(2, '0');
  var story = GJ.storyGenerate(a);
  var matrix = GJ.matrixBuildFromAnswers(a);
  matrix.story = story.crossModule;
  var guidance = GJ.guidanceBuild(a, matrix);
  var focusLabels = (a.focus || []).map(function (key) { return GJ.QUESTION_LABELS.focus[key]; }).filter(Boolean);
  var changeLabels = (a.changes || []).map(function (key) { return GJ.QUESTION_LABELS.changes[key]; }).filter(Boolean);
  var cards = [];
  function addCard(label, value) {
    if (value) cards.push('<div class="status-card"><span class="status-label">' + GJ.escape(label) + '</span><strong>' + GJ.escape(value) + '</strong></div>');
  }
  addCard('睡眠', GJ.selectedText(a.sleep, GJ.QUESTION_LABELS.sleep));
  addCard('精力', GJ.selectedText(a.energy, GJ.QUESTION_LABELS.energy));
  addCard('胃肠', GJ.selectedText(a.digestion, GJ.QUESTION_LABELS.digestion));
  addCard('饮食', GJ.selectedText(a.food, GJ.QUESTION_LABELS.food));
  addCard('压力', GJ.selectedText(a.stress, GJ.QUESTION_LABELS.stress));
  addCard('活动', GJ.selectedText(a.activity, GJ.QUESTION_LABELS.activity));
  addCard('记录', GJ.selectedText(a.medication, GJ.QUESTION_LABELS.medication));
  var observe = [];
  if (a.sleep && a.sleep.length) observe.push('建议继续记录睡眠变化时，白天精力有没有一起变化。');
  if (a.digestion && a.digestion.length) observe.push('建议继续留意胃肠感受出现时，饮食、压力或作息是否也被记录下来。');
  if (a.stress && a.stress.length && a.stress.indexOf('skip') < 0) observe.push('建议继续记下压力和情绪变化，以及哪些日子相对舒服。');
  if (!observe.length) observe.push('建议继续记录接下来几天的身体感受、生活节奏，以及让你觉得舒服的时刻。');
  var analysisHtml = '<div class="guidance-analysis">' + guidance.analysis.map(function (text) { return '<p>' + GJ.escape(text) + '</p>'; }).join('') + '</div>';
  matrix.nodeNotes = guidance.nodeNotes;
  var lifestyleHtml = guidance.lifestyle.map(function (item) {
    var actions = (item.actions || []).filter(Boolean);
    var actionHtml = actions.length ? '<ul class="report-list lifestyle-actions">' + actions.map(function (action) { return '<li>' + GJ.escape(action) + '</li>'; }).join('') + '</ul>' : '';
    return '<section class="lifestyle-card" data-guidance="' + GJ.escape(item.key) + '"><h3>' + GJ.escape(item.title) + '</h3><p>' + GJ.escape(item.text) + '</p>' + actionHtml + '</section>';
  }).join('');
  var freeText = (a.note || '').trim();
  var q10 = GJ.isAffirmativeMedication(a.medication) && a.medNotes && a.medNotes.trim() ? a.medNotes.trim() : '';
  var html = '<article id="report-paper" class="report-paper">' +
    '<header class="report-header"><div class="report-brand">灵台 · 观己</div><div class="report-kicker">个人观己报告</div><h1>' + title + '</h1><p class="report-date">' + date + '</p><p class="report-intro">' + GJ.escape(story.summary) + '</p></header>';
  html += reportSection('01', '你最近最在意的', '<p>' + (focusLabels.length ? '最近，你的注意力更多落在' + GJ.escape(GJ.joinNatural(focusLabels)) + '这些主题上。' : '这次暂时没有选定具体主题，之后也可以从任何一个感受开始。') + '</p>');
  html += reportSection('02', '这些变化大概在什么时候', '<p>' + (story.context ? GJ.escape(story.context) + '。' : '这次还没有填写持续时间或之前的生活变化。') + '</p>' + (changeLabels.length ? '<p class="report-secondary">放回时间线上看，前后还出现了：' + GJ.escape(GJ.joinNatural(changeLabels)) + '。</p>' : ''));
  html += reportSection('03', '最近的生活状态', '<div class="status-grid">' + (cards.length ? cards.join('') : '<p class="report-muted">这次还没有填写生活状态。</p>') + '</div>' + (q10 ? '<p class="report-secondary">药物或补充剂记录：' + GJ.escape(q10) + '</p>' : ''));
  html += reportSection('04', '身体观察地图', reportMatrix(matrix));
  html += reportSection('05', '这次可以怎样理解', analysisHtml);
  html += reportSection('06', '五类生活方式建议', '<p>先从最贴近你目前生活的一小步开始，不需要一次全部做到。</p><div class="lifestyle-grid">' + lifestyleHtml + '</div>');
  html += reportSection('07', '建议继续观察什么', reportList(observe, '之后建议继续记录让你在意的变化。'));
  if (freeText) html += reportSection('08', '我还记录了', '<div class="free-note">' + GJ.escape(freeText).replace(/\n/g, '<br>') + '</div>');
  html += '<section class="report-share"><canvas id="report-qr" aria-label="项目首页二维码"></canvas><p>回到灵台 · 观己</p><small>' + GJ.escape(GJ.CONFIG.PROJECT_HOME_URL) + '</small></section>';
  html += '<p class="report-disclaimer">本问卷及结果仅供参考，不构成医学诊断、治疗或用药建议。如需详细评估或个体化建议，请咨询医生或相关专业人士。<br>所有填写内容仅保存在当前浏览器中。</p></article>';
  container.innerHTML = html;
  GJ.drawQR(container.querySelector('#report-qr'), GJ.CONFIG.PROJECT_HOME_URL, 224);
  return { title: title, date: date, focus: focusLabels, context: story.context, matrix: matrix };
};
GJ.reportExportPNG = function (container) {
  var paper = container.querySelector('#report-paper');
  if (!paper || typeof html2canvas !== 'function') return Promise.reject(new Error('报告图片工具未加载'));
  return html2canvas(paper, {scale: GJ.CONFIG.PNG_SCALE, backgroundColor: '#f7f3ed', useCORS: true, logging: false, width: paper.scrollWidth, windowWidth: window.innerWidth}).then(function (canvas) {
    var dataUrl = canvas.toDataURL('image/png');
    window.__lastPngDataUrl = dataUrl;
    return dataUrl;
  });
};
