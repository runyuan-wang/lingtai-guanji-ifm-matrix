/* 问卷答案 → IFM 观察节点：只整理真实选项，不推断疾病、风险或严重程度。 */
window.GJ = window.GJ || {};
GJ.IFM_NODES = [
  { id: 'assimilation', name: '同化', subtitle: '消化与吸收', english: 'Assimilation' },
  { id: 'defense', name: '防御与修复', subtitle: '身体防御与修复', english: 'Defense & Repair' },
  { id: 'energy', name: '能量', subtitle: '精力与恢复', english: 'Energy' },
  { id: 'elimination', name: '生物转化与清除', subtitle: '代谢与清除', english: 'Biotransformation & Elimination' },
  { id: 'transport', name: '运输', subtitle: '体内运输', english: 'Transport' },
  { id: 'communication', name: '沟通', subtitle: '激素与信号沟通', english: 'Communication' },
  { id: 'structural', name: '结构完整性', subtitle: '身体结构与活动', english: 'Structural Integrity' },
  { id: 'mes', name: '心理 · 情绪 · 精神', subtitle: '压力与情绪', english: 'Mind / Emotion / Spirit' }
];
GJ.IFM_LEVEL_LABELS = ['未记录', '有记录', '记录较多'];

/*
 * nodes 中的答案计入“记录线索”；context 只保留背景，不增加计数。
 * 空规则表示仅由原有时间/报告区域呈现，或不作任何节点推断。
 * 当前问卷没有直接支持 transport 的选项，因此该节点可以保持未记录。
 */
GJ.IFM_MAPPING = {
  focus: {
    sleep: { nodes: ['energy'] },
    energy: { nodes: ['energy'] },
    digestion: { nodes: ['assimilation'] },
    food: { nodes: ['assimilation'] },
    weight: { nodes: ['energy', 'assimilation'] },
    stress: { nodes: ['mes'] },
    discomfort: { nodes: ['structural'] },
    skin: { nodes: ['defense', 'elimination'] },
    cycle: { nodes: ['communication'] },
    other: { nodes: [] }
  },
  duration: {
    days: { nodes: [] },
    weeks: { nodes: [] },
    months: { nodes: [] },
    half: { nodes: [] },
    long: { nodes: [] },
    unclear: { nodes: [] }
  },
  changes: {
    pressure: { nodes: ['mes'] },
    routine: { nodes: ['energy'] },
    diet: { nodes: ['assimilation'] },
    sick: { nodes: ['defense'] },
    medicine: { nodes: [], context: ['elimination'] },
    move: { nodes: [] },
    event: { nodes: ['mes'] },
    exercise: { nodes: ['structural', 'energy'] },
    none: { nodes: [] },
    other: { nodes: [] }
  },
  sleep: {
    good: { nodes: [], context: ['energy'] },
    sometimes: { nodes: ['energy'] },
    often: { nodes: ['energy'] },
    fall: { nodes: ['energy'] },
    wake: { nodes: ['energy'] },
    tired: { nodes: ['energy'] }
  },
  energy: {
    good: { nodes: [], context: ['energy'] },
    sometimes: { nodes: ['energy'] },
    often: { nodes: ['energy'] },
    morning: { nodes: ['energy'] },
    afternoon: { nodes: ['energy'] },
    restore: { nodes: ['energy'] }
  },
  digestion: {
    normal: { nodes: [], context: ['assimilation'] },
    bloating: { nodes: ['assimilation'] },
    reflux: { nodes: ['assimilation'] },
    diarrhea: { nodes: ['assimilation', 'elimination'] },
    constipation: { nodes: ['assimilation', 'elimination'] },
    irregular: { nodes: ['assimilation', 'elimination'] },
    food: { nodes: ['assimilation'] },
    other: { nodes: ['assimilation'] }
  },
  food: {
    regular: { nodes: [], context: ['assimilation'] },
    irregular: { nodes: ['assimilation'] },
    outside: { nodes: ['assimilation'] },
    low: { nodes: ['assimilation'] },
    much: { nodes: ['assimilation'] },
    changed: { nodes: ['assimilation'] },
    same: { nodes: [], context: ['assimilation'] }
  },
  stress: {
    relaxed: { nodes: [], context: ['mes'] },
    little: { nodes: ['mes'] },
    clear: { nodes: ['mes'] },
    anxious: { nodes: ['mes'] },
    low: { nodes: ['mes'] },
    event: { nodes: ['mes'] },
    skip: { nodes: [] }
  },
  activity: {
    regular: { nodes: [], context: ['structural'] },
    sometimes: { nodes: [], context: ['structural'] },
    little: { nodes: ['structural', 'energy'] },
    less: { nodes: ['structural', 'energy'] },
    more: { nodes: ['structural', 'energy'] },
    body: { nodes: ['structural'] }
  },
  medication: {
    none: { nodes: [] },
    medicine: { nodes: [], context: ['elimination'] },
    supplement: { nodes: [], context: ['elimination'] },
    both: { nodes: [], context: ['elimination'] },
    unsure: { nodes: [] }
  }
};

GJ.ifmLevelForCount = function (count) {
  if (count >= 3) return 2;
  if (count >= 1) return 1;
  return 0;
};

GJ.matrixBuildFromAnswers = function (answers) {
  var a = GJ.normalizeAnswers ? GJ.normalizeAnswers(answers) : (answers || {});
  var seenClues = {};
  var seenContexts = {};
  var nodes = GJ.IFM_NODES.map(function (definition) {
    return {
      id: definition.id,
      name: definition.name,
      subtitle: definition.subtitle,
      english: definition.english,
      count: 0,
      level: 0,
      levelLabel: GJ.IFM_LEVEL_LABELS[0],
      clues: [],
      contexts: []
    };
  });
  var nodesById = {};
  nodes.forEach(function (node) { nodesById[node.id] = node; });

  Object.keys(GJ.IFM_MAPPING).forEach(function (questionKey) {
    var value = a[questionKey];
    var selected = Array.isArray(value) ? value : (value ? [value] : []);
    selected.forEach(function (optionKey) {
      var rule = GJ.IFM_MAPPING[questionKey][optionKey];
      var labels = GJ.QUESTION_LABELS && GJ.QUESTION_LABELS[questionKey];
      if (!rule || !labels || !Object.prototype.hasOwnProperty.call(labels, optionKey)) return;
      var clue = { question: questionKey, option: optionKey, label: labels[optionKey] };
      (rule.nodes || []).slice(0, 2).forEach(function (nodeId) {
        var node = nodesById[nodeId];
        var key = nodeId + '|' + questionKey + '|' + optionKey;
        if (!node || seenClues[key]) return;
        seenClues[key] = true;
        node.clues.push(clue);
      });
      (rule.context || []).forEach(function (nodeId) {
        var node = nodesById[nodeId];
        var key = nodeId + '|' + questionKey + '|' + optionKey;
        if (!node || seenContexts[key]) return;
        seenContexts[key] = true;
        node.contexts.push(clue);
      });
    });
  });

  nodes.forEach(function (node) {
    node.count = node.clues.length;
    node.level = GJ.ifmLevelForCount(node.count);
    node.levelLabel = GJ.IFM_LEVEL_LABELS[node.level];
  });
  return { nodes: nodes };
};
