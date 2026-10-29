/* 问卷答案 → IFM 观察节点：只整理真实选项，不推断疾病、风险或严重程度。 */
window.GJ = window.GJ || {};
GJ.IFM_NODES = [
  { id: 'assimilation', name: '消化与吸收', subtitle: '同化', english: 'Assimilation' },
  { id: 'defense', name: '防御与修复', subtitle: '身体防御与修复', english: 'Defense & Repair' },
  { id: 'energy', name: '精力与恢复', subtitle: '能量', english: 'Energy' },
  { id: 'elimination', name: '代谢与清除', subtitle: '生物转化与清除', english: 'Biotransformation & Elimination' },
  { id: 'transport', name: '体内运输', subtitle: '运输', english: 'Transport' },
  { id: 'communication', name: '激素与信号沟通', subtitle: '沟通', english: 'Communication' },
  { id: 'structural', name: '身体结构与活动', subtitle: '结构完整性', english: 'Structural Integrity' },
  { id: 'mes', name: '压力与情绪', subtitle: '心理 · 情绪 · 精神', english: 'Mind / Emotion / Spirit' }
];
GJ.IFM_LEVEL_LABELS = ['未记录', '有记录', '记录较多'];

/*
 * nodes 中的答案计入“记录线索”；context 只保留背景，不增加计数。
 * 空规则表示仅由原有时间/报告区域呈现，或不作任何节点推断。
 * 当前问卷没有直接支持 transport 的选项，因此该节点可以保持未记录。
 */
/* 旧版真实 ID 到轻量版 ID 的唯一适配层；严重度 0/1/2/3 不在此迁移。 */
GJ.LEGACY_NODE_ADAPTERS = {
  assimilation: { from: 'assimilation', to: 'assimilation' },
  defense: { from: 'defense', to: 'defense' },
  energy: { from: 'energy', to: 'energy' },
  elimination: { from: 'biotransformation', to: 'elimination' },
  transport: { from: 'transport', to: 'transport' },
  communication: { from: 'communication', to: 'communication' },
  structural: { from: 'structure', to: 'structural' },
  mes: { from: 'mes', to: 'mes' }
};
GJ.LEGACY_LIFESTYLE_ADAPTERS = {
  sleep: { from: 'sleep', to: 'sleep' },
  movement: { from: 'exercise', to: 'movement' },
  nutrition: { from: 'nutrition', to: 'nutrition' },
  stress: { from: 'stress', to: 'stress' },
  relationships: { from: 'relationships', to: 'relationships' },
  mindfulness: { from: 'mindfulness', to: 'stress', note: '少量正念动作并入压力调适，不替代营养卡。' }
};

/* 每个真实选项都指向旧输入/规则原文摘要及建议分支；不是新增疾病规则。 */
GJ.LEGACY_OPTION_RULES = {
  focus: {
    sleep: { source: 'NODES.energy + MES.items_zh', legacy: '睡眠、睡后不解乏作为关注主题', advice: 'analysis.focus' },
    energy: { source: 'WIZARD_SYMPTOMS.energy', legacy: '长期疲劳 / 没精力作为关注主题', advice: 'analysis.focus' },
    digestion: { source: 'WIZARD_SYMPTOMS.assimilation', legacy: '消化吸收作为关注主题', advice: 'analysis.focus' },
    food: { source: 'lifestyle_directions.nutrition', legacy: '饮食与营养摄入作为关注主题', advice: 'analysis.focus' },
    weight: { source: 'DATA_GROUPS.body.weight + NODES.energy', legacy: '体重记录与食欲 / 营养摄入主题；不推定变化原因', advice: 'analysis.focus' },
    stress: { source: 'MES + ATM_OPTIONS.med', legacy: '情绪、压力持续偏高作为关注主题', advice: 'analysis.focus' },
    discomfort: { source: 'WIZARD_SYMPTOMS.structure', legacy: '疼痛 / 肌骨不适作为关注主题，不限定部位', advice: 'analysis.focus' },
    skin: { source: 'WIZARD_SYMPTOMS.defense', legacy: '皮肤状态只对应防御与修复关注；不对应排毒', advice: 'analysis.focus' },
    cycle: { source: 'WIZARD_SYMPTOMS.communication', legacy: '月经 / 生理周期相关关注；不推断激素问题', advice: 'analysis.focus' },
    other: { source: 'basic.mainfeel（仅主题格位）', legacy: '旧版无同名固定症状，保留为其他关注', advice: 'none' }
  },
  duration: {
    days: { source: '旧时间轴的时间顺序', legacy: '最近几天，仅作时间背景', advice: 'timeline.only' },
    weeks: { source: '旧时间轴的时间顺序', legacy: '几周左右，仅作时间背景', advice: 'timeline.only' },
    months: { source: '旧时间轴的时间顺序', legacy: '几个月，仅作时间背景', advice: 'timeline.only' },
    half: { source: '旧时间轴的时间顺序', legacy: '半年以上，仅作时间背景', advice: 'timeline.only' },
    long: { source: '旧时间轴的时间顺序', legacy: '很久了，仅作时间背景', advice: 'timeline.only' },
    unclear: { source: '旧时间轴允许资料缺口', legacy: '说不清，不补造持续时间', advice: 'none' }
  },
  changes: {
    pressure: { source: 'ATM_OPTIONS.med[1]', legacy: '压力持续偏高', advice: 'stress.pressure' },
    routine: { source: 'ATM_OPTIONS.ant[4] + med[0]', legacy: '长期睡眠作息不规律 / 睡眠不足或节律紊乱', advice: 'sleep.routine' },
    diet: { source: 'ATM_OPTIONS.tri[4]', legacy: '饮食模式突然改变', advice: 'nutrition.changed' },
    sick: { source: 'ATM_OPTIONS.tri（变化类别）', legacy: '生病或身体不适仅作触发背景，不改写为感染 / 免疫问题', advice: 'analysis.context' },
    medicine: { source: 'ATM_OPTIONS.ant[6] + tri[6]', legacy: '长期或近期药物 / 补剂变化，仅作背景', advice: 'context.only' },
    move: { source: 'ATM_OPTIONS.tri[9]', legacy: '旅行 / 搬家 / 环境变化，仅保留时间线', advice: 'timeline.only' },
    event: { source: 'ATM_OPTIONS.tri[3] + question_bank.mes', legacy: '明显情绪事件 / 重大生活事件；不预设带来压力', advice: 'stress.important-event' },
    exercise: { source: 'ATM_OPTIONS.ant[8] + question_bank.energy', legacy: '活动变化与活动后恢复作为同期背景', advice: 'movement.change' },
    none: { source: '旧 ATM 允许无明确触发因素', legacy: '没有特别注意到，不补造变化', advice: 'none' },
    other: { source: '旧 ATM 补充文本类别', legacy: '其他变化但未提供细节，不作关键词推断', advice: 'timeline.only' }
  },
  sleep: {
    good: { source: 'lifestyle_directions.sleep（非 weak）', legacy: '睡眠平稳，不触发薄弱项建议', advice: 'sleep.good' },
    sometimes: { source: 'WIZARD_SYMPTOMS.mes + by_weak.sleep', legacy: '睡不安稳 / 睡眠节律需要整理', advice: 'sleep.general' },
    often: { source: 'WIZARD_SYMPTOMS.mes + by_weak.sleep', legacy: '经常睡不好 / 睡眠节律需要整理', advice: 'sleep.general' },
    fall: { source: 'WIZARD_SYMPTOMS.mes.q[3]', legacy: '入睡难 / 睡不安稳', advice: 'sleep.fall' },
    wake: { source: 'WIZARD_SYMPTOMS.mes.q[3]', legacy: '睡不安稳，细化为容易醒', advice: 'sleep.wake' },
    tired: { source: 'WIZARD_SYMPTOMS.energy.q[1]', legacy: '睡了还是累；与入睡难分开处理', advice: 'sleep.tired' }
  },
  energy: {
    good: { source: 'NODES.energy（非症状选择）', legacy: '精力平稳，不触发疲劳规则', advice: 'energy.good' },
    sometimes: { source: 'WIZARD_SYMPTOMS.energy.q[0]', legacy: '疲劳 / 没精力的轻度当前记录', advice: 'energy.pattern' },
    often: { source: 'WIZARD_SYMPTOMS.energy.q[0]', legacy: '长期疲劳 / 没精力的当前对应；不补造长期', advice: 'energy.pattern' },
    morning: { source: 'question_bank.energy[0]', legacy: '疲劳的时间规律，具体到早上', advice: 'energy.morning' },
    afternoon: { source: 'question_bank.energy[0]', legacy: '疲劳的时间规律，具体到下午', advice: 'energy.afternoon' },
    restore: { source: 'NODES.energy + question_bank.energy[2]', legacy: '休息后恢复与活动后恢复线索；不推断营养或疾病原因', advice: 'energy.restore' }
  },
  digestion: {
    normal: { source: 'WIZARD_SYMPTOMS.assimilation（非症状选择）', legacy: '胃肠基本正常，不触发消化症状规则', advice: 'nutrition.regular' },
    bloating: { source: 'WIZARD_SYMPTOMS.assimilation.q[0]', legacy: '经常腹胀 / 胀气', advice: 'nutrition.digestion' },
    reflux: { source: 'WIZARD_SYMPTOMS.assimilation.q[2]', legacy: '反酸 / 烧心', advice: 'nutrition.digestion' },
    diarrhea: { source: 'WIZARD_SYMPTOMS.assimilation.q[1]', legacy: '容易腹泻；不归入排泄不畅', advice: 'nutrition.digestion' },
    constipation: { source: 'WIZARD_SYMPTOMS.assimilation.q[1] + biotransformation.q[1]', legacy: '容易便秘 / 排泄不畅', advice: 'nutrition.digestion' },
    irregular: { source: 'WIZARD_SYMPTOMS.assimilation（排便记录）', legacy: '排便不规律，不等同旧版排泄障碍', advice: 'nutrition.digestion' },
    food: { source: 'WIZARD_SYMPTOMS.assimilation.q[3] + question_bank.assimilation[1]', legacy: '吃某些食物不舒服 / 特定食物反应', advice: 'nutrition.food-reaction' },
    other: { source: 'WIZARD_SYMPTOMS.assimilation.q[4]', legacy: '消化不太好的其他记录，不补造具体症状', advice: 'nutrition.digestion' }
  },
  food: {
    regular: { source: 'lifestyle_directions.nutrition（非 weak）', legacy: '饮食规律，保留有效搭配', advice: 'nutrition.regular' },
    irregular: { source: 'ATM_OPTIONS.med[2] + by_weak.nutrition', legacy: '饮食不规律或摄入失衡', advice: 'nutrition.irregular' },
    outside: { source: 'ATM_OPTIONS.ant[2] + report-tail 营养建议', legacy: '外食较多；不外推高糖 / 高油', advice: 'nutrition.outside' },
    low: { source: 'NODES.energy.items_zh[8]', legacy: '食欲 / 营养摄入不足相关感受', advice: 'nutrition.low' },
    much: { source: 'report-tail 饮食模式', legacy: '容易吃很多，采用规律进餐与细嚼慢咽，不推定原因', advice: 'nutrition.much' },
    changed: { source: 'ATM_OPTIONS.tri[4] + by_weak.nutrition', legacy: '饮食模式突然改变', advice: 'nutrition.changed' },
    same: { source: 'lifestyle_directions.nutrition（非 weak）', legacy: '没有特别变化，保留有效搭配', advice: 'nutrition.regular' }
  },
  stress: {
    relaxed: { source: 'lifestyle_directions.stress（非 weak）', legacy: '当前较放松，不触发压力薄弱项', advice: 'stress.relaxed' },
    little: { source: 'ATM_OPTIONS.med[1] + by_weak.stress', legacy: '压力持续偏高的轻度当前记录', advice: 'stress.short-pause' },
    clear: { source: 'ATM_OPTIONS.med[1] + by_weak.stress', legacy: '压力持续偏高', advice: 'stress.short-pause' },
    anxious: { source: 'WIZARD_SYMPTOMS.mes.q[1]', legacy: '容易焦虑 / 紧张', advice: 'stress.short-pause' },
    low: { source: 'WIZARD_SYMPTOMS.mes.q[2]', legacy: '情绪低落的当前记录，不补造长期或诊断', advice: 'stress.low' },
    event: { source: 'ATM_OPTIONS.tri[3] + question_bank.mes[1]', legacy: '明显情绪事件 / 重大生活事件，条件式给放松建议', advice: 'stress.important-event' },
    skip: { source: '旧引擎允许资料缺失', legacy: '不太想回答，不补造压力或事件', advice: 'stress.skip' }
  },
  activity: {
    regular: { source: 'lifestyle_directions.exercise（非 weak）', legacy: '活动规律，不触发增加活动建议', advice: 'movement.regular' },
    sometimes: { source: 'by_weak.exercise', legacy: '偶尔活动，在现有基础上加一小步', advice: 'movement.sometimes' },
    little: { source: 'ATM_OPTIONS.ant[8] + by_weak.exercise', legacy: '运动不足或久坐 / 循序渐进活动', advice: 'movement.little' },
    less: { source: 'ATM_OPTIONS.ant[8] + question_bank.energy[2]', legacy: '活动减少与恢复记录，不强迫回到原量', advice: 'movement.less' },
    more: { source: 'NODES.energy（活动后恢复）', legacy: '活动增加，关注恢复而非继续加量', advice: 'movement.more' },
    body: { source: 'question_bank.structure[0]', legacy: '疼痛部位与活动受限情况；不套用 exercise weak 加量', advice: 'movement.body' }
  },
  medication: {
    none: { source: 'ATM_OPTIONS.ant[6]（否定记录）', legacy: '无药物 / 补剂背景，不触发规则', advice: 'none' },
    medicine: { source: 'ATM_OPTIONS.ant[6] + question_bank.biotransformation[1]', legacy: '用药史仅作背景，不给停换药建议', advice: 'context.only' },
    supplement: { source: 'ATM_OPTIONS.ant[6]', legacy: '补剂史仅作背景，不生成剂量', advice: 'context.only' },
    both: { source: 'ATM_OPTIONS.ant[6]', legacy: '药物与补剂史仅作背景', advice: 'context.only' },
    unsure: { source: '旧引擎资料缺口原则', legacy: '不确定 / 不想填写，不补造用药背景', advice: 'none' }
  }
};

GJ.IFM_MAPPING = {
  focus: {
    sleep: { nodes: [], context: ['energy'] },
    energy: { nodes: [], context: ['energy'] },
    digestion: { nodes: [], context: ['assimilation'] },
    food: { nodes: [], context: ['assimilation'] },
    weight: { nodes: [], context: ['energy', 'assimilation'] },
    stress: { nodes: [], context: ['mes'] },
    discomfort: { nodes: [], context: ['structural'] },
    skin: { nodes: [], context: ['defense'] },
    cycle: { nodes: [], context: ['communication'] },
    other: { nodes: [] }
  },
  duration: {
    days: { nodes: [] }, weeks: { nodes: [] }, months: { nodes: [] },
    half: { nodes: [] }, long: { nodes: [] }, unclear: { nodes: [] }
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
    sometimes: { nodes: ['energy'] }, often: { nodes: ['energy'] },
    fall: { nodes: ['energy'] }, wake: { nodes: ['energy'] }, tired: { nodes: ['energy'] }
  },
  energy: {
    good: { nodes: [], context: ['energy'] },
    sometimes: { nodes: ['energy'] }, often: { nodes: ['energy'] },
    morning: { nodes: ['energy'] }, afternoon: { nodes: ['energy'] }, restore: { nodes: ['energy'] }
  },
  digestion: {
    normal: { nodes: [], context: ['assimilation'] },
    bloating: { nodes: ['assimilation'] }, reflux: { nodes: ['assimilation'] },
    diarrhea: { nodes: ['assimilation'] },
    constipation: { nodes: ['assimilation', 'elimination'] },
    irregular: { nodes: ['assimilation'] },
    food: { nodes: ['assimilation'] }, other: { nodes: ['assimilation'] }
  },
  food: {
    regular: { nodes: [], context: ['assimilation'] },
    irregular: { nodes: ['assimilation'] }, outside: { nodes: ['assimilation'] },
    low: { nodes: ['assimilation'] }, much: { nodes: ['assimilation'] },
    changed: { nodes: ['assimilation'] }, same: { nodes: [], context: ['assimilation'] }
  },
  stress: {
    relaxed: { nodes: [], context: ['mes'] },
    little: { nodes: ['mes'] }, clear: { nodes: ['mes'] }, anxious: { nodes: ['mes'] },
    low: { nodes: ['mes'] }, event: { nodes: ['mes'] }, skip: { nodes: [] }
  },
  activity: {
    regular: { nodes: [], context: ['structural'] },
    sometimes: { nodes: [], context: ['structural'] },
    little: { nodes: ['structural', 'energy'] }, less: { nodes: ['structural', 'energy'] },
    more: { nodes: ['structural', 'energy'] }, body: { nodes: ['structural'] }
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

GJ.matrixTraceForOption = function (questionKey, optionKey) {
  var rule = GJ.IFM_MAPPING[questionKey] && GJ.IFM_MAPPING[questionKey][optionKey];
  var legacy = GJ.LEGACY_OPTION_RULES[questionKey] && GJ.LEGACY_OPTION_RULES[questionKey][optionKey];
  var labels = GJ.QUESTION_LABELS && GJ.QUESTION_LABELS[questionKey];
  if (!rule || !legacy || !labels || !Object.prototype.hasOwnProperty.call(labels, optionKey)) return null;
  function adapt(ids) {
    return (ids || []).map(function (id) {
      var adapter = GJ.LEGACY_NODE_ADAPTERS[id];
      return { legacyNode: adapter.from, currentNode: adapter.to };
    });
  }
  return {
    question: questionKey,
    option: optionKey,
    label: labels[optionKey],
    legacySource: legacy.source,
    legacyInput: legacy.legacy,
    adviceKey: legacy.advice,
    nodes: adapt(rule.nodes),
    contexts: adapt(rule.context)
  };
};

GJ.matrixBuildFromAnswers = function (answers) {
  var a = GJ.normalizeAnswers ? GJ.normalizeAnswers(answers) : (answers || {});
  var seenClues = {};
  var seenContexts = {};
  var seenTraces = {};
  var traces = [];
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
      if (questionKey === 'sleep' && ['sometimes', 'often'].indexOf(optionKey) >= 0 && ['fall', 'wake'].some(function (specific) { return (a.sleep || []).indexOf(specific) >= 0; })) return;
      var trace = GJ.matrixTraceForOption(questionKey, optionKey);
      if (!trace) return;
      var traceKey = questionKey + '|' + optionKey;
      if (!seenTraces[traceKey]) { seenTraces[traceKey] = true; traces.push(trace); }
      var rule = GJ.IFM_MAPPING[questionKey][optionKey];
      var clue = { question: questionKey, option: optionKey, label: trace.label, legacySource: trace.legacySource };
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
  return { nodes: nodes, traces: traces };
};
