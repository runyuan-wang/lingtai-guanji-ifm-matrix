/* ============================================================
 * story.js — 规则式「观己故事」
 * 固定模板 + 用户真实填写信息 + 简单规则组合，80～150 字。
 * 语气：温和、克制、清楚、轻度东方文字气质；不玄学、不神秘、
 * 不诊断、不夸大因果、不制造恐慌。同一输入必得同一故事（确定性）。
 * ============================================================ */
window.GJ = window.GJ || {};

/* 生活方式字段定义（与 app.js 的录入区一致） */
GJ.LIFESTYLE_FIELDS = [
  { key: 'diet',        zh: '饮食',     placeholder: '如：经常吃外卖，蔬菜偏少' },
  { key: 'sleep',       zh: '睡眠',     placeholder: '如：长期 12 点后入睡，约 6 小时' },
  { key: 'bowel',       zh: '排便',     placeholder: '如：容易便秘，两三天一次' },
  { key: 'exercise',    zh: '运动',     placeholder: '如：很少运动，偶尔散步' },
  { key: 'stress',      zh: '压力与情绪', placeholder: '如：工作压力大，容易焦虑' },
  { key: 'medication',  zh: '用药',     placeholder: '如：长期服用某药物（选填）' },
  { key: 'supplements', zh: '补充剂',   placeholder: '如：维生素 D、鱼油（选填）' },
];

/* 稳定散列：同样输入 → 同样故事（不随时间变化） */
GJ.storyHash = function (state) {
  const levels = GJ.matrixCompute(state);
  const sig = {
    nodes: GJ.ALL_MATRIX_IDS.map(function (id) { return id + ':' + levels[id].count; }),
    atm: GJ.ATM_TYPES.map(function (t) {
      return t.key + ':' + state.events.filter(function (e) { return e.atm === t.key; }).length;
    }),
    life: GJ.LIFESTYLE_FIELDS.filter(function (f) { return (state.lifestyle[f.key] || '').trim(); })
      .map(function (f) { return f.key; }),
  };
  const s = JSON.stringify(sig);
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
};

/* 有记录的节点，按线索数从多到少 */
GJ.storyTopNodes = function (state, n) {
  const levels = GJ.matrixCompute(state);
  return GJ.ALL_MATRIX_IDS
    .map(function (id) { return levels[id]; })
    .filter(function (c) { return c.count > 0; })
    .sort(function (a, b) { return b.count - a.count; })
    .slice(0, n || 3)
    .map(function (c) {
      const d = GJ.matrixNodeDef(c.id);
      return { id: c.id, short: d.short || d.zh, zh: d.zh, count: c.count };
    });
};

/* 已填写的生活方式字段 */
GJ.storyFilledLifestyle = function (state) {
  return GJ.LIFESTYLE_FIELDS.filter(function (f) {
    return (state.lifestyle[f.key] || '').trim();
  });
};

/* ---------- 关键词（3～5 个，全部来自真实填写） ---------- */
GJ.storyKeywords = function (state) {
  const kw = [];
  GJ.storyTopNodes(state, 3).forEach(function (nd) {
    if (kw.indexOf(nd.short) === -1) kw.push(nd.short);
  });
  GJ.storyFilledLifestyle(state).forEach(function (f) {
    const label = f.zh === '压力与情绪' ? '压力' : f.zh;
    if (kw.indexOf(label) === -1 && kw.length < 5) kw.push(label);
  });
  return kw.slice(0, 5);
};

/* ---------- 一句话摘要 ---------- */
GJ.storySummary = function (state) {
  const tops = GJ.storyTopNodes(state, 3);
  if (tops.length >= 2) {
    const names = tops.map(function (t) { return t.short; });
    const last = names.pop();
    return '本次记录主要涉及' + names.join('、') + '与' + last + '相关线索。';
  }
  if (tops.length === 1) {
    return '本次记录主要涉及' + tops[0].short + '相关线索。';
  }
  const life = GJ.storyFilledLifestyle(state);
  if (life.length) {
    return '本次记录主要涉及' + life.slice(0, 3).map(function (f) { return f.zh === '压力与情绪' ? '压力' : f.zh; }).join('、') + '相关线索。';
  }
  return '本次记录刚刚开始，线索还在收集中。';
};

/* ---------- 观己故事主函数 ---------- */
GJ.storyGenerate = function (state) {
  const h = GJ.storyHash(state);
  const tops = GJ.storyTopNodes(state, 3);
  const life = GJ.storyFilledLifestyle(state);
  const events = state.events || [];
  const titled = events.filter(function (e) { return (e.title || '').trim(); });
  const current = titled.filter(function (e) { return e.atm === 'current'; });

  /* “最近”只在整个事件集合能形成可靠的日历先后时才成立；
   * 日期无效、混入年龄/阶段，或不同精度的区间彼此重叠时，都使用中性说法。 */
  const latestComparable = GJ.latestComparableEvent(titled);

  function clip(value, limit) {
    const clean = String(value || '').replace(/\s+/g, ' ').trim();
    return clean.length > limit ? clean.slice(0, limit) + '…' : clean;
  }

  const concern = current.length
    ? '这次最想继续看清的是“' + clip(current[current.length - 1].title, 16) + '”。'
    : latestComparable
      ? '沿时间回看，最近的一条身体线索是“' + clip(latestComparable.title, 16) + '”。'
      : titled.length
        ? '你记录的一条值得继续关注的身体线索是“' + clip(titled[titled.length - 1].title, 16) + '”。'
        : '这次还没有单独写下当前主要困扰。';

  const presentAtm = GJ.ATM_TYPES.filter(function (t) {
    return events.some(function (e) { return e.atm === t.key; });
  }).map(function (t) { return t.zh; });
  const timelineVariants = presentAtm.length
    ? [
        '沿时间轴回看，线索从' + presentAtm.join('、') + '逐步展开，各有先后。',
        '把时间轴铺开，' + presentAtm.join('、') + '在不同阶段留下了记录。',
      ]
    : ['时间轴上的演变还在等待更多记录。'];

  const nodesStr = tops.length ? tops.map(function (t) { return t.short; }).join('、') : '尚待补充的功能节点';
  const matrixVariants = [
    '横向看，这些线索主要落在' + nodesStr + '。',
    '从功能系统分布看，记录较集中在' + nodesStr + '。',
  ];

  let lifeSentence;
  if (life.length) {
    const details = life.slice(0, 2).map(function (f) {
      return f.zh + '“' + clip(state.lifestyle[f.key], 11) + '”';
    });
    lifeSentence = '生活里还记录了' + details.join('、') + '，它们也与身体感受交织在一起。';
  } else {
    lifeSentence = '生活方式线索尚待补充，也值得和身体感受放在一起观察。';
  }

  const endings = [
    '这些只是同一时期值得继续观察的关联，不是医学结论。',
    '这是一条值得继续记录和与专业人员讨论的轨迹，不是医学结论。',
  ];

  let story = concern +
    timelineVariants[h % timelineVariants.length] +
    matrixVariants[(h >>> 3) % matrixVariants.length] +
    lifeSentence +
    endings[(h >>> 6) % endings.length];

  const charsOf = function (value) { return value.replace(/\s/g, '').length; };
  if (charsOf(story) > 150 && life.length > 1) {
    const f = life[0];
    lifeSentence = '生活里还记录了' + f.zh + '“' + clip(state.lifestyle[f.key], 9) + '”，也值得一并观察。';
    story = concern + timelineVariants[0] + matrixVariants[0] + lifeSentence + endings[0];
  }
  if (charsOf(story) > 150) {
    story = concern + timelineVariants[0] + matrixVariants[0] + '生活方式也值得一并观察。' + endings[0];
  }
  if (charsOf(story) < 80) {
    story += '把之后的新变化继续记下来，才更容易看见这条轨迹怎样生长。';
  }

  return {
    story: story,
    chars: charsOf(story),
    summary: GJ.storySummary(state),
    keywords: GJ.storyKeywords(state),
  };
};
