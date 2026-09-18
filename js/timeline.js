/* 将问卷里用户选择的“持续多久”和“之前发生了什么”整理成中性语句。 */
window.GJ = window.GJ || {};
GJ.optionLabel = function (group, value) {
  var labels = GJ.QUESTION_LABELS && GJ.QUESTION_LABELS[group];
  return labels && Object.prototype.hasOwnProperty.call(labels, value) && typeof labels[value] === 'string' ? labels[value] : '';
};
GJ.joinNatural = function (items) {
  return (items || []).filter(function (item) { return typeof item === 'string' && item.trim(); }).join('、');
};
GJ.observationContext = function (duration, changes) {
  var parts = [];
  var durationLabel = GJ.optionLabel('duration', duration);
  var changeLabels = Array.isArray(changes) ? changes.map(function (key) { return GJ.optionLabel('changes', key); }).filter(Boolean) : [];
  if (durationLabel) parts.push('这些感受大概持续了' + durationLabel);
  if (changeLabels.length) parts.push('在它出现或变明显前后，也记录到' + GJ.joinNatural(changeLabels));
  return parts.join('；');
};
