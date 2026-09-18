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
GJ.reportBuild = function (container, state) {
  var a = GJ.normalizeAnswers ? GJ.normalizeAnswers(state && state.answers) : (state && state.answers) || {};
  if (state && state.answers) state.answers = a;
  var nickname = (a.nickname || '').trim();
  var title = nickname ? GJ.escape(nickname) + '的观己小记' : '这一份观己小记';
  var now = new Date();
  var date = now.getFullYear() + '.' + String(now.getMonth() + 1).padStart(2, '0') + '.' + String(now.getDate()).padStart(2, '0');
  var story = GJ.storyGenerate(a);
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
  if (a.sleep && a.sleep.length) observe.push('可以继续记录睡眠变化时，白天精力有没有一起变化。');
  if (a.digestion && a.digestion.length) observe.push('可以继续留意胃肠感受出现时，饮食、压力或作息是否也被记录下来。');
  if (a.stress && a.stress.length) observe.push('可以继续记下压力和情绪变化，以及哪些日子相对舒服。');
  if (!observe.length) observe.push('可以继续记录接下来几天的身体感受、生活节奏，以及让你觉得舒服的时刻。');
  var freeText = (a.note || '').trim();
  var q10 = GJ.isAffirmativeMedication(a.medication) && a.medNotes && a.medNotes.trim() ? a.medNotes.trim() : '';
  var html = '<article id="report-paper" class="report-paper">' +
    '<header class="report-header"><div class="report-brand">灵台 · 观己</div><div class="report-kicker">个人观己报告</div><h1>' + title + '</h1><p class="report-date">' + date + '</p><p class="report-intro">' + GJ.escape(story.summary) + '</p></header>';
  html += reportSection('01', '你最近最在意的', '<p>' + (focusLabels.length ? '最近，你主要记录了' + GJ.escape(GJ.joinNatural(focusLabels)) + '方面的变化。' : '这次暂时没有选择具体的主题，之后也可以从任何一个感受开始记录。') + '</p>');
  html += reportSection('02', '这些变化大概在什么时候', '<p>' + (story.context ? GJ.escape(story.context) + '。' : '这次还没有填写持续时间或之前的生活变化。') + '</p>' + (changeLabels.length ? '<p class="report-secondary">之前或同时，你选择了：' + GJ.escape(GJ.joinNatural(changeLabels)) + '。</p>' : ''));
  html += reportSection('03', '最近的生活状态', '<div class="status-grid">' + (cards.length ? cards.join('') : '<p class="report-muted">这次还没有填写生活状态。</p>') + '</div>' + (q10 ? '<p class="report-secondary">药物或补充剂记录：' + GJ.escape(q10) + '</p>' : ''));
  html += reportSection('04', '可以继续观察什么', reportList(observe, '之后可以继续记录让你在意的变化。'));
  if (freeText) html += reportSection('05', '我还记录了', '<div class="free-note">' + GJ.escape(freeText).replace(/\n/g, '<br>') + '</div>');
  html += '<section class="report-share"><canvas id="report-qr" aria-label="项目首页二维码"></canvas><p>回到灵台 · 观己</p><small>' + GJ.escape(GJ.CONFIG.PROJECT_HOME_URL) + '</small></section>';
  html += '<p class="report-disclaimer">本工具用于自我观察与资料整理，不用于疾病诊断，也不提供治疗或用药建议。所有填写内容仅保存在当前浏览器中。</p></article>';
  container.innerHTML = html;
  GJ.drawQR(container.querySelector('#report-qr'), GJ.CONFIG.PROJECT_HOME_URL, 224);
  return { title: title, date: date, focus: focusLabels, context: story.context };
};
GJ.reportExportPNG = function (container) {
  var paper = container.querySelector('#report-paper');
  if (!paper || typeof html2canvas !== 'function') return Promise.reject(new Error('报告图片工具未加载'));
  return html2canvas(paper, {scale: GJ.CONFIG.PNG_SCALE, backgroundColor: '#f7f3ed', useCORS: true, logging: false, width: paper.scrollWidth, windowWidth: paper.scrollWidth}).then(function (canvas) {
    var dataUrl = canvas.toDataURL('image/png');
    window.__lastPngDataUrl = dataUrl;
    return dataUrl;
  });
};
