/* 依照本次实际选择串联生活片段；时间上的并列不写成因果。 */
window.GJ = window.GJ || {};
GJ.storyGenerate = function (answers) {
  var a = GJ.normalizeAnswers ? GJ.normalizeAnswers(answers) : (answers || {});
  var focus = a.focus || [];
  var labels = focus.map(function (key) { return GJ.QUESTION_LABELS.focus[key] || ''; }).filter(Boolean);
  var focusText = GJ.joinNatural(labels);
  var duration = a.duration || '';
  var changes = a.changes || [];
  var context = GJ.observationContext(duration, changes);
  function has(key, values) {
    var actual = Array.isArray(a[key]) ? a[key] : (a[key] ? [a[key]] : []);
    return values.some(function (value) { return actual.indexOf(value) >= 0; });
  }
  function picked(key, values, dictionary) {
    var actual = Array.isArray(a[key]) ? a[key] : (a[key] ? [a[key]] : []);
    return actual.filter(function (value) { return values.indexOf(value) >= 0; }).map(function (value) { return dictionary[value]; });
  }
  var sleepWords = picked('sleep', ['fall', 'wake', 'sometimes', 'often', 'tired'], {
    fall: '入睡不容易', wake: '夜里容易醒', sometimes: '偶尔睡不好', often: '经常睡不好', tired: '睡够后仍觉得累'
  });
  var energyWords = picked('energy', ['sometimes', 'often', 'morning', 'afternoon', 'restore'], {
    sometimes: '偶尔觉得累', often: '经常疲劳', morning: '早上特别累', afternoon: '下午容易没精神', restore: '休息后不太恢复'
  });
  var digestionWords = picked('digestion', ['bloating', 'reflux', 'diarrhea', 'constipation', 'irregular', 'food', 'other'], {
    bloating: '腹胀', reflux: '反酸或烧心', diarrhea: '腹泻', constipation: '便秘', irregular: '排便不规律', food: '某些食物后容易不舒服', other: '其他胃肠感受'
  });
  var pressureWords = picked('stress', ['little', 'clear', 'anxious', 'low'], {
    little: '有一点压力', clear: '压力比较明显', anxious: '容易焦虑或紧张', low: '情绪有些低落'
  });
  if (!pressureWords.length && has('changes', ['pressure']) && !has('stress', ['skip', 'relaxed'])) pressureWords.push('工作或学习上的压力增加了');
  var event = has('stress', ['event']) || has('changes', ['event']);
  var stressSkipped = has('stress', ['skip']);
  var parts = [];
  var hasSleep = sleepWords.length > 0;
  var hasEnergy = energyWords.length > 0;
  var hasDigestion = digestionWords.length > 0;
  var hasFood = has('food', ['outside', 'irregular', 'low', 'much', 'changed']);
  var hasThread = hasSleep || hasEnergy || hasDigestion || hasFood || pressureWords.length > 0 || event || has('activity', ['body']);
  var sleepPhrase = has('sleep', ['fall']) && has('sleep', ['wake'])
    ? '入睡不容易，也容易醒' + (has('sleep', ['tired']) ? '，睡够后仍觉得累' : '')
    : GJ.joinNatural(sleepWords);

  if (pressureWords.length) {
    parts.push('这阵子' + GJ.joinNatural(pressureWords) + '，这份感受值得先被看见。');
  } else if (event) {
    parts.push('最近有一件重要的事发生，它先作为生活背景留在这里；事情本身不等于压力。');
  }

  if (hasSleep && hasEnergy) {
    if (has('sleep', ['tired']) && !has('sleep', ['fall', 'wake', 'sometimes', 'often'])) {
      parts.push('睡够后仍觉得累，白天又有' + GJ.joinNatural(energyWords) + '的时段；恢复感和白天安排可以放在一起回看。');
    } else {
      parts.push('夜里' + sleepPhrase + '，白天又有' + GJ.joinNatural(energyWords) + '的时段，休息和白天安排可以放在一起照看。');
    }
    if (pressureWords.length) parts.push('如果紧张感和这些睡眠变化出现在相近的日子，可以并排记下，看看时间上是否有联系，不必先认定是谁造成了谁。');
  } else if (hasSleep) {
    if (has('sleep', ['tired']) && !has('sleep', ['fall', 'wake', 'sometimes', 'often'])) parts.push('睡够后仍觉得累；可以留意这种恢复感出现的时段和第二天的状态，它和入睡困难是不同线索。');
    else parts.push('夜里' + sleepPhrase + '；先看它出现在哪些晚上，以及第二天的感受，不必把不同睡眠体验混成一个问题。');
  } else if (hasEnergy) {
    parts.push(GJ.joinNatural(energyWords) + '，把较累和较清醒的时段简单记下来，能帮你看见自己的日内节奏。');
  }

  if (hasFood) {
    if (has('food', ['outside'])) parts.push('这阵子外食较多，只说明吃饭安排如此，并不能说明每餐搭配怎样；下一顿可以先看看有没有蔬菜，再搭配鱼、蛋、豆腐或肉中的一样。');
    else if (has('food', ['irregular'])) parts.push('吃饭时间有时不固定，可以先照顾最容易漏掉的一餐，不必一下把整天安排都改好。');
    else if (has('food', ['low'])) parts.push('食欲下降时，下一餐以容易接受的少量食物开始，按自己的感受来，不用勉强吃很多。');
    else if (has('food', ['much'])) parts.push('你也留意到容易吃得多；下一餐可以放慢一点，中途感受饱腹，不用跳餐补偿。');
    else if (has('food', ['changed'])) parts.push('饮食最近变化较大，可以先看看是哪一餐或哪种安排变了，再挑一件容易恢复的事。');
  }
  if (hasDigestion) {
    var detail = GJ.joinNatural(digestionWords);
    if (hasFood && has('food', ['outside'])) parts.push('你还提到' + detail + '；若外食安排和这些感受恰好在同一段时间，可以记下具体餐食与出现时点，先观察，不急着归因。');
    else if (hasFood) parts.push('同时，' + detail + '也值得按出现时间与当时餐食简单记下；一次只观察一个变化，不必立即长期忌口。');
    else parts.push('另外，' + detail + '可以和进餐时间、当时吃了什么一起回看，先找具体情境，不凭一条记录下结论。');
  }
  if (has('activity', ['body'])) parts.push('活动目前受到身体状况限制；已有安排和身体感受优先，不需要把增加活动当成目标。');
  if (!pressureWords.length && event && !stressSkipped) parts.push('如果这件事带来压力，可以找个方便的时候做几轮慢呼吸或轻柔拉伸；若没有这样的感受，就让它只作为背景即可。');
  if (stressSkipped && !hasSleep && !hasEnergy && !hasDigestion && !hasFood) parts.push('压力与情绪这部分你选择先留白，不需要补答；其他记录也可以各自保留。');

  var crossModule;
  if (!hasThread) {
    crossModule = '这次没有足够的已记录细节需要串联。正常感受、暂时跳过和留白都可以保留，不必为了形成故事而补出问题。';
    if (stressSkipped) crossModule += '压力与情绪这部分不需要补答。';
  } else {
    if (hasSleep && hasEnergy && !hasDigestion && !hasFood) parts.push('先挑一两天记下睡眠和白天精神，不用同时改好几种习惯。');
    else if ((hasDigestion || hasFood) && (hasSleep || hasEnergy)) parts.push(has('sleep', ['fall', 'wake', 'sometimes', 'often']) ? '可以从最容易的一步开始：今晚为睡前收尾留半小时，或在下一顿记下搭配与饭后感受；选一件做就够了。' : '可以先照顾白天的恢复感，或在下一顿记下搭配与饭后感受；挑最顺手的一件就好，不用一次改变所有习惯。');
    else if (hasDigestion || hasFood) parts.push('下一顿从一处小观察开始就好，不必今天把所有饮食习惯都改好。');
    else if (!has('activity', ['body']) && !(event && !pressureWords.length && !hasSleep && !hasEnergy && !hasDigestion && !hasFood)) parts.push('先选最顺手的一小步，观察几天再决定要不要继续。');
    crossModule = parts.join('');
  }
  var pieces = [];
  if (focusText) pieces.push('最近主要在意' + focusText + '。');
  if (context) pieces.push(context + '。');
  if (a.note && a.note.trim()) pieces.push('你还写下了自己的补充记录。');
  if (!pieces.length) pieces.push('这次先从留意最近的自己开始。');
  return { summary: pieces.join(''), focusText: focusText, context: context, crossModule: crossModule };
};
