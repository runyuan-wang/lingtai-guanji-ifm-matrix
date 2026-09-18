/* 确定性模板：只复述真实选择，不补充因果、诊断或建议。 */
window.GJ = window.GJ || {};
GJ.storyGenerate = function (answers) {
  var a = GJ.normalizeAnswers ? GJ.normalizeAnswers(answers) : (answers || {});
  var focus = a.focus || [];
  var labels = focus.map(function (key) { return GJ.QUESTION_LABELS.focus[key] || ''; }).filter(Boolean);
  var focusText = GJ.joinNatural(labels);
  var duration = a.duration || '';
  var changes = a.changes || [];
  var context = GJ.observationContext(duration, changes);
  var pieces = [];
  if (focusText) pieces.push('最近主要在意' + focusText + '。');
  if (context) pieces.push(context + '。');
  if (a.note && a.note.trim()) pieces.push('你还写下了自己的补充记录。');
  if (!pieces.length) pieces.push('这次先从留意最近的自己开始。');
  return { summary: pieces.join(''), focusText: focusText, context: context };
};
