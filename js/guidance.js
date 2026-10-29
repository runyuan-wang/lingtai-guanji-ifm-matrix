/* 固定本地规则：整理观察线索并提供可选择的小动作，不作诊断。 */
window.GJ = window.GJ || {};
GJ.guidanceBuild = function (answers, matrix) {
  var a = GJ.normalizeAnswers ? GJ.normalizeAnswers(answers) : (answers || {});
  var nodes = matrix && Array.isArray(matrix.nodes) ? matrix.nodes : [];
  var adviceTrace = [];
  function has(key, values) {
    var actual = Array.isArray(a[key]) ? a[key] : (a[key] ? [a[key]] : []);
    return values.some(function (value) { return actual.indexOf(value) >= 0; });
  }
  function add(list, text) { if (text && list.indexOf(text) < 0) list.push(text); }
  function mark(card, rule) { adviceTrace.push({ card: card, rule: rule }); }
  function card(key, title, text, actions) { return { key: key, title: title, text: text, actions: actions }; }
  var recorded = nodes.filter(function (node) { return node.count > 0; });
  var concentrated = recorded.filter(function (node) { return node.level >= 2; });
  var some = recorded.filter(function (node) { return node.level === 1; });
  function names(list) { return list.map(function (node) { return node.name; }); }
  var analysis = [];
  if (concentrated.length) analysis.push(GJ.joinNatural(names(concentrated)) + '这几处留下的线索较多，可以先从最贴近当下的一处慢慢看起。');
  if (some.length) analysis.push(GJ.joinNatural(names(some)) + '也有一些记录，和其他生活片段并排看会更完整。');
  if (!recorded.length) analysis.push('这次没有形成具体的节点记录；可能是选择了平稳描述，也可能有题目留空。留白本身不说明身体一定正常或异常。');
  analysis.push('这些分类只整理本次填写，不代表器官功能、疾病风险或身体严重程度。下面的动作只是可选的小尝试，不必一次全部做到。');
  var importantEvent = has('stress', ['event']) || has('changes', ['event']);
  if (has('sleep', ['tired'])) {
    analysis.push('“睡够了还是累”说的是睡后恢复感，和难入睡是两条不同线索；可以先并看实际睡眠时长、夜间清醒和白天精神。');
    mark('analysis', 'sleep.tired');
  }
  if (importantEvent) {
    analysis.push('最近的重要事件先作为生活背景留在时间线上；它是否带来压力，仍由你自己的感受来判断。');
    mark('analysis', 'stress.important-event');
  }

  function nodeNote(node) {
    var opts = node.clues.map(function (clue) { return clue.option; });
    function includes(key, values) {
      return node.clues.some(function (clue) { return clue.question === key && values.indexOf(clue.option) >= 0; });
    }
    if (node.id === 'assimilation') {
      if (includes('digestion', ['bloating', 'reflux', 'diarrhea', 'constipation', 'irregular', 'food', 'other'])) return '腹胀、反酸或排便等具体感受可以和进餐情境放在一起回看，先观察何时出现，不急着归因。';
      if (includes('food', ['outside'])) return '外食是这段饮食安排的一部分；下一顿实际搭配比给外食贴标签更值得留意。';
      if (includes('food', ['irregular', 'low', 'much', 'changed'])) return '饮食节奏或食欲的变化可以从最近的一餐开始观察，一次只挑容易做到的一处。';
      return '饮食和消化相关记录可以从一顿饭及之后的感受开始对照，不必马上解释原因。';
    }
    if (node.id === 'defense') return '最近身体不舒服时，不必急着把每件事都安排好；保留这段经历和恢复过程，之后回看会更清楚。';
    if (node.id === 'energy') {
      if (includes('sleep', ['fall', 'wake']) && includes('energy', ['afternoon'])) return '夜里的睡眠和下午的精神都值得照顾；先给自己留几分钟缓一缓，再回看睡得较顺的第二天是否轻松些。';
      if (includes('sleep', ['tired'])) return includes('energy', ['morning', 'afternoon', 'restore', 'sometimes', 'often']) ? '睡后仍累和白天的精力变化值得一起照顾；先留意哪段时间稍轻松，给重要的事找个合适的时段。' : '睡够后仍觉得累，值得给这份恢复感多一点关注；先留意醒后和白天的感受，不必逼自己更努力入睡。';
      if (includes('energy', ['morning', 'afternoon', 'restore', 'sometimes', 'often'])) return '精力在一天中的起伏各有具体时段；简单记下何时明显、何时缓和，便于看自己的节奏。';
      return '睡眠和精力的记录可以放在同一条时间线上回顾，看看哪些日子感觉不同。';
    }
    if (node.id === 'elimination') return '排便不顺的日子，先留意时间、饮食和饮水，给自己一点从容，不用急着一次改变所有习惯。';
    if (node.id === 'transport') return '当前问卷没有直接对应这个主题的具体记录，先保留为空白。';
    if (node.id === 'communication') return '这次填写没有直接的周期或信号沟通记录，不从其他主题推测具体变化。';
    if (node.id === 'structural') {
      if (includes('activity', ['body'])) return '身体原因暂时限制活动这条信息值得尊重；按已有安排来，不用通用活动目标衡量自己。';
      if (includes('changes', ['exercise'])) return '活动量变化可以和活动后的身体感受一起回看，调整时以当下舒适度为准。';
      return '活动相关记录可以帮助你看见自己的节奏；身体不适或既有安排优先于通用目标。';
    }
    if (node.id === 'mes') {
      if (includes('stress', ['event']) || includes('changes', ['event'])) return '重要事件先只是时间线上的背景；是否让你感到压力，不需要由这张表替你决定。';
      if (includes('stress', ['little', 'clear', 'anxious', 'low'])) return '压力或情绪的具体感受可以从出现的时刻和当时情境来理解，给自己留一点不急着下结论的空间。';
      return '你留下的生活变化可以作为背景慢慢回看，不预设它带来了什么感受。';
    }
    return opts.length ? '这处记录先作为观察线索保留，不急着替它解释。' : '';
  }
  var nodeNotes = recorded.map(function (node) {
    return { id: node.id, title: node.name, text: nodeNote(node) };
  });

  var sleepActions = [];
  var sleepText = '';
  if (has('sleep', ['good'])) {
    sleepText = '最近睡得挺好，这份记录可以提醒你留住已经合适的节奏，不必为了报告另改作息。';
    add(sleepActions, '之后若状态有变化，再简单记下入睡、夜醒和起床后的精神，看看哪些原有做法仍适合你。');
    mark('sleep', 'sleep.good');
  } else {
    if (has('sleep', ['tired'])) {
      sleepText = '睡够了仍觉得累，先了解这种恢复感何时出现，比把重点放在“更努力入睡”更贴近这条记录。';
      add(sleepActions, '接下来几天并排记下大致睡眠时长、起床后的精神和白天较清醒的时段；费神的事若能选择时间，可放在自己较清醒的时候。');
      mark('sleep', 'sleep.tired');
    }
    if (has('sleep', ['fall'])) {
      if (!sleepText) sleepText = '入睡不容易时，白天的信息和待办可能还没从脑中收尾；给睡前留一点缓冲，看看是否更合自己的节奏。';
      add(sleepActions, '明晚可以试一次睡前约 30 分钟的固定收尾：调暗刺眼灯光，把手机放到伸手不易拿到处；若有事惦记，就写下那件事和明天再处理的时间，先替自己存个档。');
      mark('sleep', 'sleep.fall');
    }
    if (has('sleep', ['wake'])) {
      if (!sleepText) sleepText = '夜里容易醒，醒来的次数不必直接等同整夜都没休息；先从可观察的环境和时间入手。';
      add(sleepActions, '今晚先看看能调整的光线或噪声；若又醒来，第二天简单记下时间和当时环境，再和白天精神一起回顾。');
      mark('sleep', 'sleep.wake');
    }
    if (has('sleep', ['sometimes', 'often']) && !has('sleep', ['fall', 'wake'])) {
      if (!sleepText) sleepText = '睡眠有时或经常不顺，先把睡前和起床的节奏看清楚，比立刻要求自己睡好更实际。';
      add(sleepActions, '挑一个容易维持的起床时间试几天；睡前约 30 分钟减少屏幕信息，顺手记下入睡、夜醒和醒后精神，不只看睡了多久。');
      mark('sleep', 'sleep.general');
    }
  }
  if (has('changes', ['routine']) && !has('sleep', ['good'])) {
    add(sleepActions, '作息有变化时，可以先选一个现实可行的起床时间作为锚点，维持几天再看白天精力；不用一下补齐所有习惯。');
    mark('sleep', 'sleep.routine');
  }
  if (has('energy', ['sometimes', 'often'])) {
    add(sleepActions, '若疲劳有时出现，接下来几天标出较累和较清醒的时段，并顺手记前一晚睡眠与当天活动，看看时间上有什么不同。');
    mark('sleep', 'energy.pattern');
  }
  if (has('energy', ['morning'])) {
    add(sleepActions, '早上特别累的话，可以把起床时间、醒后精神和前一晚的收尾记在一起，先看清晨这段时间线。');
    mark('sleep', 'energy.morning');
  }
  if (has('energy', ['afternoon'])) {
    add(sleepActions, has('activity', ['body']) ? '下午容易没精神时，给自己几分钟安静休息或换个舒服姿势，留意前后感受；这里不额外要求起身活动。' : '下午容易没精神时，试着离座几分钟接杯水，或安静歇一会儿，再感受这段休息前后的精神变化。');
    mark('sleep', 'energy.afternoon');
  }
  if (has('energy', ['restore'])) {
    add(sleepActions, has('activity', ['body']) ? '休息后仍不太恢复时，先比较睡眠和安静休息后的感受；按已有的活动或康复安排来，不额外加离座练习。' : '休息后仍不太恢复，可以分别记下睡眠、安静休息或短暂离座后的感受，比较哪一种对你更合适。');
    mark('sleep', 'energy.restore');
  }
  if (!sleepText) {
    if (has('energy', ['good'])) {
      sleepText = '目前精力不错，留住已经适合自己的休息节奏就很好。';
      add(sleepActions, '若想做个简单回顾，可以记下最近哪种休息安排让你感觉不错，照着保留即可。');
      mark('sleep', 'energy.good');
    } else {
      sleepText = '这部分没有具体睡眠困扰记录，不必把留空当成问题；若想观察，可以从一晚的收尾开始。';
      add(sleepActions, '今晚若方便，在睡前约 30 分钟调暗干扰灯光、暂放屏幕信息；明早只记起床时间和醒后的精神即可。');
      mark('sleep', 'sleep.default');
    }
  }

  var activityActions = [];
  var activityText = '';
  if (has('activity', ['regular'])) {
    activityText = '活动已经比较规律，保持身体熟悉的频率就好，不需要因为这份报告临时加量。';
    add(activityActions, '挑一次现有活动，在结束后和第二天各记一句恢复感，用自己的感受确认当前节奏。');
    mark('movement', 'movement.regular');
  } else if (has('activity', ['body'])) {
    activityText = '身体原因让活动暂时少一些时，先照顾当下限制；通用的起身、步行或加量目标不一定适合你。';
    add(activityActions, '若走动会加重不适，可把常用物品放在顺手处，必要时请人帮忙，减少眼下额外负担；已有活动或康复安排就按原定方式进行，不因这份报告一概减少活动。');
    add(activityActions, '若在考虑新的活动方式，让了解你身体情况的专业人士帮忙判断会更合适；不必以完成运动目标为要求。');
    mark('movement', 'movement.body');
  } else if (has('activity', ['more'])) {
    activityText = '最近活动增加了，给身体留出适应和恢复的时间，比连续往上加更稳妥。';
    add(activityActions, '下一次活动前留一点休息，并记下当天和第二天的感受；若恢复变慢，可以先回到较轻松的版本。');
    mark('movement', 'movement.more');
  } else if (has('activity', ['little'])) {
    activityText = '活动不多也不必立刻变成一套锻炼计划；把开始门槛放低，更容易找到适合日常的节奏。';
    add(activityActions, '明天若身体感觉合适，选一顿饭后在走廊或楼下慢走几分钟再回来，只做这一次就够了。');
    add(activityActions, '久坐时也可以把接水、回消息或手头告一段落当作提示，起身舒展一下再继续。');
    mark('movement', 'movement.little');
  } else if (has('activity', ['less'])) {
    activityText = '活动最近减少了，可以先找回原来较轻松的一小段，不用马上回到过去的量。';
    add(activityActions, '挑一个方便的日子试试短一些的熟悉活动，结束后记下身体感受，再决定下次是否照做或调整。');
    mark('movement', 'movement.less');
  } else if (has('activity', ['sometimes'])) {
    activityText = '偶尔活动已经是一个起点；若你想增加一点，把它接在已有日常后会比较省力。';
    add(activityActions, '选一餐后、下班或下课后，安排一小段步行或轻柔活动，事后只留意是否容易坚持、恢复如何。');
    mark('movement', 'movement.sometimes');
  } else {
    activityText = '这里没有具体活动状态记录，不用据此判断活动不足；先看看日常节奏，再决定是否想尝试一小步。';
    add(activityActions, '若你愿意，可以先留意久坐最常出现的时段；觉得合适时，把一次接水或饭后作为活动几分钟的提示。');
    mark('movement', 'movement.default');
  }
  if (has('changes', ['exercise']) && !has('activity', ['body', 'regular', 'more'])) {
    add(activityActions, '活动量有变化时，把前后做的活动类型和恢复感放在一起看；下一次若要调整，只动一处就好。');
    mark('movement', 'movement.change');
  }

  var nutritionActions = [];
  var nutritionText = '';
  var digestionIssue = has('digestion', ['bloating', 'reflux', 'diarrhea', 'constipation', 'irregular', 'food', 'other']);
  if (has('food', ['outside'])) {
    nutritionText = '忙的时候用外卖或外食安排一餐很常见，外食本身不必被当成问题；可以从下一顿实际搭配看起。';
    add(nutritionActions, '下一顿点餐时先看看有没有蔬菜，再选鱼、蛋、豆腐或肉中的一样；缺蔬菜就加一份，饮品可以选白水。');
    mark('nutrition', 'nutrition.outside');
  } else if (has('food', ['irregular'])) {
    nutritionText = '吃饭时间常被打乱时，不必一下要求三餐全固定；先照顾最容易漏掉的一餐。';
    add(nutritionActions, '明天挑最忙的一餐设个提醒，提前备一份方便带走的主食和鸡蛋或豆腐，再配容易吃到的水果或蔬菜。');
    mark('nutrition', 'nutrition.irregular');
  } else if (has('food', ['low'])) {
    nutritionText = '食欲下降时，一次吃很多可能更有压力；下一餐先以容易接受、少量多样为准。';
    add(nutritionActions, '下一餐试试容易入口的软米饭或粥，配少量鸡蛋或豆腐和熟蔬菜；按自己的感受分次吃，记下哪种质地更容易接受。');
    mark('nutrition', 'nutrition.low');
  } else if (has('food', ['much'])) {
    nutritionText = '容易吃得多时，可以先把注意力放回进餐速度和饱腹感，不用跳过下一餐来补偿。';
    add(nutritionActions, '下一餐把蔬菜、蛋白质食物和主食放在一起，坐下来按舒服的速度吃；中间停一下感受饱腹，再决定要不要添。');
    mark('nutrition', 'nutrition.much');
  } else if (has('food', ['changed'])) {
    nutritionText = '饮食近期变化较大时，先看清变化发生在哪一餐，再挑一项熟悉的安排慢慢找回来。';
    add(nutritionActions, '用今天的三餐照片或几句话记下变化，选一项最容易恢复的习惯，例如熟悉的一餐或一种蔬菜；一次只动一个变量。');
    mark('nutrition', 'nutrition.changed');
  } else if (has('food', ['regular', 'same'])) {
    nutritionText = '饮食比较规律或近期没有明显变化，可以保留已经适合自己的搭配，不必突然严格限制。';
    add(nutritionActions, '下一顿简单看看有没有主食、蔬菜，以及鱼、蛋、豆腐或肉中的一样；照平常舒服的方式吃就好。');
    mark('nutrition', 'nutrition.regular');
  } else {
    nutritionText = '这部分没有具体饮食状态记录，不代表饮食有问题；若想观察，从下一顿看清搭配就可以。';
    add(nutritionActions, '下一顿记下吃了什么和大概时间，看看是否有蔬菜、主食和一种蛋白质食物，之后再决定要不要调整一处。');
    mark('nutrition', 'nutrition.default');
  }
  if (has('changes', ['diet']) && !has('food', ['changed'])) {
    add(nutritionActions, '饮食变化也出现在近期背景里；可以对照是哪一餐、时间或搭配变了，下一餐只挑最容易安排的一处，例如补一份蔬菜，不必把所有变化都改回去。');
    mark('nutrition', 'nutrition.changed-context');
  }
  if (!has('food', ['outside'])) add(nutritionActions, '白天可以分次喝水；如果下一顿原本会选含糖饮料，试着换成白水，再看看自己感觉如何。');
  if (has('digestion', ['food'])) {
    add(nutritionActions, '若某些食物后容易不舒服，下一次只记食物种类、大概份量、进餐时间和之后的感受；先观察一个变量，不凭一次反应长期排除一大类食物。');
    mark('nutrition', 'nutrition.food-reaction');
  } else if (digestionIssue) {
    add(nutritionActions, '腹胀、反酸或排便变化出现时，可以顺手记下那餐吃了什么、吃得多快和之后的感受；先观察，不急着长期忌口。');
    mark('nutrition', 'nutrition.digestion');
  }

  var stressActions = [];
  var stressText = '';
  var stressIssue = has('stress', ['little', 'clear', 'anxious', 'low']) || has('changes', ['pressure']);
  if (has('stress', ['skip'])) {
    stressText = '你选择暂时不回答，这里就留白；不需要补充内容，也不必为了报告做放松练习。';
    add(stressActions, '先保留其他你愿意记录的部分就好；之后若想补充，只写下一个让自己稍微放松的时刻也可以。');
    mark('stress', 'stress.skip');
  } else {
    if (has('stress', ['relaxed'])) {
      stressText = '最近比较放松是一条值得留住的感受，可以继续给已经有效的休息方式留位置。';
      add(stressActions, '选一件确实让你放松的事，在下周先留出一个具体时段；忙起来时，也可以尽量保住这段空隙。');
      mark('stress', 'stress.relaxed');
    } else if (has('stress', ['low'])) {
      stressText = '情绪低落时，先把眼前的要求缩小一些，完成一件日常小事就已经够了。';
      add(stressActions, '找个相对安静的时刻，做几轮缓慢呼吸或轻柔拉伸，再只选接下来最容易的一步；若想说出来，可以看看下面的人际支持做法。');
      mark('stress', 'stress.low');
    } else if (has('stress', ['clear', 'anxious'])) {
      stressText = '压力或紧张比较明显时，脑中的事情容易挤在一起；先把一件事放到纸上，给自己一点整理空间。';
      add(stressActions, '写下眼下最占注意力的一件事，做几轮缓慢呼吸或轻柔拉伸，再圈出今天能处理的一个小步骤。');
      add(stressActions, '若思绪还很紧，看看周围并说出眼前三样物品，让注意力先回到此刻，再决定是否继续手头的事。');
      mark('stress', 'stress.short-pause');
    } else if (has('stress', ['little'])) {
      stressText = '有一点压力时，不必等到一天结束才休息；在感觉紧起来的时候插入短暂停顿就可以。';
      add(stressActions, '双脚找到地面支撑，做几轮慢呼吸，再说出眼前三样物品；几分钟后，按自己的状态决定是否继续原来的事。');
      mark('stress', 'stress.short-pause');
    } else if (has('changes', ['pressure'])) {
      stressText = '近期压力增加出现在生活变化里；如果它确实带来紧绷，可以先试一个短暂停，不必预设每次都如此。';
      add(stressActions, '暂停几分钟，把最占注意力的一件事写下来，再做几轮缓慢呼吸或轻柔拉伸，只留下一个下一步。');
      mark('stress', 'stress.pressure');
    } else if (importantEvent) {
      stressText = '这件重要的事先作为生活背景保留；如果它没有带来压力，就不需要额外做什么。';
      mark('stress', 'stress.event-context');
    } else {
      stressText = '目前没有具体的压力或情绪记录，不用把留白解释成有压力；以后若留意到紧绷，再从当时情境看起。';
      add(stressActions, '下次若注意到紧起来，可以做几轮缓慢呼吸或轻柔拉伸，再记下什么让自己稍微松一点。');
      mark('stress', 'stress.default');
    }
    if (has('changes', ['pressure']) && has('stress', ['relaxed'])) {
      add(stressActions, '如果近期变化开始让你紧绷，可以沿用已经有效的放松方式，并在下个忙碌时段前留几分钟空隙。');
      mark('stress', 'stress.pressure');
    }
    if (importantEvent) {
      add(stressActions, '如果这件重要的事带来压力，可以离开当前任务几分钟，慢慢呼吸或轻柔拉伸，再决定下一步；若没有压力感，就不必强加练习。');
      mark('stress', 'stress.important-event');
    }
  }

  var relationshipActions = [];
  var relationshipText = '';
  if (has('stress', ['skip'])) {
    relationshipText = '既然你选择暂不回答压力与情绪，这里也不要求为了报告联系谁。';
    add(relationshipActions, '若以后自己想开口，可以从一位让你安心的人和一句简单近况开始；说多少由你决定。');
    mark('relationships', 'relationships.skip');
  } else if (stressIssue) {
    relationshipText = '如果最近的压力或情绪让你想找人聊聊，可以先把开口缩成一条简单消息。';
    add(relationshipActions, '选一位可信任的人，先问“你现在方便听我聊十分钟吗？”；之后说说最近发生了什么，再告诉对方你想被倾听，还是想一起想办法。');
    mark('relationships', 'relationships.ask');
  } else if (has('stress', ['relaxed'])) {
    relationshipText = '联系节奏舒服就可以，不需要为了增加社交而勉强自己。';
    add(relationshipActions, '若有想保持联系的人，可以发一句近况，再约一个双方方便的聊天或见面时间。');
    mark('relationships', 'relationships.keep');
  } else {
    relationshipText = '这里没有具体的人际困扰记录，不必额外制造社交任务；有需要时再想到支持也来得及。';
    add(relationshipActions, '若想分享这次记录，先问一位安心的人是否方便，再说明你希望对方倾听，还是陪你一起整理下一步。');
    mark('relationships', 'relationships.default');
  }
  if (importantEvent && !has('stress', ['skip'])) {
    add(relationshipActions, '如果这件重要的事让你想找人谈，可以先问一位可信任的人是否方便，再说说这件事，以及你需要倾听还是一起整理下一步。');
    mark('relationships', 'relationships.important-event');
  }

  return {
    analysis: analysis,
    nodeNotes: nodeNotes,
    adviceTrace: adviceTrace,
    lifestyle: [
      card('sleep', '睡眠与休息', sleepText, sleepActions),
      card('movement', '运动与活动', activityText, activityActions),
      card('nutrition', '营养与水分', nutritionText, nutritionActions),
      card('stress', '压力调适', stressText, stressActions),
      card('relationships', '人际与支持', relationshipText, relationshipActions)
    ]
  };
};
