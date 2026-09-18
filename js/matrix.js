/* 内部整理映射：只给报告模板使用，不在用户界面展示专业框架。 */
window.GJ = window.GJ || {};
GJ.OBSERVATION_GROUPS = {
  sleep: '睡眠与恢复',
  energy: '白天精力',
  digestion: '胃肠感受',
  food: '饮食节奏',
  stress: '压力与情绪',
  activity: '活动与运动',
  medication: '正在使用的内容'
};
GJ.groupForFocus = function (key) {
  return GJ.OBSERVATION_GROUPS[key] || '最近在意的主题';
};
