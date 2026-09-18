/* 灵台 · 观己：状态、逐题交互与本地保存。 */
window.GJ = window.GJ || {};

GJ.QUESTION_LABELS = {
  focus: { sleep: '睡眠', energy: '精力 / 疲劳', digestion: '胃肠 / 排便', food: '饮食', weight: '体重变化', stress: '情绪 / 压力', discomfort: '疼痛或其他身体不适', skin: '皮肤状态', cycle: '女性周期相关', other: '其他' },
  duration: { days: '最近几天', weeks: '几周左右', months: '几个月', half: '半年以上', long: '很久了', unclear: '说不清' },
  changes: { pressure: '工作 / 学习压力增加', routine: '经常熬夜或作息变化', diet: '饮食发生变化', sick: '生病或身体不舒服', medicine: '开始 / 停止某种药物或补充剂', move: '旅行 / 搬家 / 环境变化', event: '情绪事件', exercise: '运动量明显改变', none: '没有特别注意到', other: '其他' },
  sleep: { good: '挺好的', sometimes: '偶尔睡不好', often: '经常睡不好', fall: '很难入睡', wake: '容易醒', tired: '睡够了还是累' },
  energy: { good: '精力不错', sometimes: '偶尔觉得累', often: '经常疲劳', morning: '早上特别累', afternoon: '下午容易没精神', restore: '休息后也不太恢复' },
  digestion: { normal: '基本正常', bloating: '容易腹胀', reflux: '容易反酸 / 烧心', diarrhea: '容易腹泻', constipation: '容易便秘', irregular: '排便不规律', food: '吃某些东西容易不舒服', other: '其他' },
  food: { regular: '比较规律', irregular: '经常不按时吃', outside: '外卖 / 外食比较多', low: '食欲下降', much: '容易吃很多', changed: '最近饮食变化比较大', same: '没有特别变化' },
  stress: { relaxed: '比较放松', little: '有一点压力', clear: '压力比较明显', anxious: '容易焦虑 / 紧张', low: '情绪低落', event: '最近发生了一些重要的事', skip: '不太想回答' },
  activity: { regular: '活动比较规律', sometimes: '偶尔运动', little: '很少运动', less: '最近明显减少', more: '最近明显增加', body: '身体原因暂时活动较少' },
  medication: { none: '没有', medicine: '有药物', supplement: '有营养补充剂', both: '都有', unsure: '不确定 / 不想填写' }
};
GJ.QUESTIONS = [
  { key: 'focus', title: '最近，你最想弄清楚哪方面的状态？', hint: '可以多选，最多选择 3 个。', multiple: true, auto: false, options: [['sleep','睡眠'],['energy','精力 / 疲劳'],['digestion','胃肠 / 排便'],['food','饮食'],['weight','体重变化'],['stress','情绪 / 压力'],['discomfort','疼痛或其他身体不适'],['skin','皮肤状态'],['cycle','女性周期相关'],['other','其他']] },
  { key: 'duration', title: '这种变化大概持续多久了？', hint: '不用精确到某一天，凭最近的感觉选择即可。', multiple: false, auto: true, options: [['days','最近几天'],['weeks','几周左右'],['months','几个月'],['half','半年以上'],['long','很久了'],['unclear','说不清']] },
  { key: 'changes', title: '在它出现或变明显之前，生活有没有发生什么变化？', hint: '可以多选；如果没有特别注意到，也可以直接选择它。', multiple: true, auto: false, options: [['pressure','工作 / 学习压力增加'],['routine','经常熬夜或作息变化'],['diet','饮食发生变化'],['sick','生病或身体不舒服'],['medicine','开始 / 停止某种药物或补充剂'],['move','旅行 / 搬家 / 环境变化'],['event','情绪事件'],['exercise','运动量明显改变'],['none','没有特别注意到'],['other','其他']] },
  { key: 'sleep', title: '最近睡得怎么样？', hint: '可以多选，按你的实际感受选择。', multiple: true, auto: false, options: [['good','挺好的'],['sometimes','偶尔睡不好'],['often','经常睡不好'],['fall','很难入睡'],['wake','容易醒'],['tired','睡够了还是累']] },
  { key: 'energy', title: '最近的精力怎么样？', hint: '选择最接近最近状态的描述。', multiple: false, auto: true, options: [['good','精力不错'],['sometimes','偶尔觉得累'],['often','经常疲劳'],['morning','早上特别累'],['afternoon','下午容易没精神'],['restore','休息后也不太恢复']] },
  { key: 'digestion', title: '最近胃肠和排便怎么样？', hint: '可以多选，也可以先跳过。', multiple: true, auto: false, options: [['normal','基本正常'],['bloating','容易腹胀'],['reflux','容易反酸 / 烧心'],['diarrhea','容易腹泻'],['constipation','容易便秘'],['irregular','排便不规律'],['food','吃某些东西容易不舒服'],['other','其他']] },
  { key: 'food', title: '最近吃饭大概是什么状态？', hint: '这里没有好坏评价，只记录最近的样子。', multiple: false, auto: true, options: [['regular','比较规律'],['irregular','经常不按时吃'],['outside','外卖 / 外食比较多'],['low','食欲下降'],['much','容易吃很多'],['changed','最近饮食变化比较大'],['same','没有特别变化']] },
  { key: 'stress', title: '最近压力和情绪怎么样？', hint: '这只是自我观察，不需要给自己下结论。', multiple: true, auto: false, options: [['relaxed','比较放松'],['little','有一点压力'],['clear','压力比较明显'],['anxious','容易焦虑 / 紧张'],['low','情绪低落'],['event','最近发生了一些重要的事'],['skip','不太想回答']] },
  { key: 'activity', title: '最近活动和运动大概怎样？', hint: '选择最贴近最近生活的描述。', multiple: false, auto: true, options: [['regular','活动比较规律'],['sometimes','偶尔运动'],['little','很少运动'],['less','最近明显减少'],['more','最近明显增加'],['body','身体原因暂时活动较少']] },
  { key: 'medication', title: '最近有没有正在使用的药物或补充剂？', hint: '不需要填写剂量；这一题也可以选择不确定。', multiple: false, auto: false, options: [['none','没有'],['medicine','有药物'],['supplement','有营养补充剂'],['both','都有'],['unsure','不确定 / 不想填写']], note: true },
  { key: 'note', title: '还有什么是你觉得可能有关，想一起记下来的吗？', hint: '完全选填。可以写生活变化、身体感受，或最近特别在意的事情。', input: 'textarea', multiple: false, auto: false },
  { key: 'nickname', title: '这份观己报告怎么称呼你？', hint: '选填；不填写也可以直接生成报告。', input: 'nickname', multiple: false, auto: false }
];
GJ.defaultAnswers = function () {
  return { focus: [], duration: '', changes: [], sleep: [], energy: '', digestion: [], food: '', stress: [], activity: '', medication: '', medNotes: '', note: '', nickname: '' };
};
GJ.selectedText = function (value, labels) {
  var values = Array.isArray(value) ? value : (value ? [value] : []);
  return values.map(function (key) {
    return labels && Object.prototype.hasOwnProperty.call(labels, key) && typeof labels[key] === 'string' ? labels[key] : '';
  }).filter(Boolean).join('、');
};
GJ.MUTUALLY_EXCLUSIVE = {
  changes: { none: ['pressure', 'routine', 'diet', 'sick', 'medicine', 'move', 'event', 'exercise', 'other'] },
  sleep: { good: ['sometimes', 'often', 'fall', 'wake', 'tired'] },
  digestion: { normal: ['bloating', 'reflux', 'diarrhea', 'constipation', 'irregular', 'food', 'other'] },
  stress: { relaxed: ['little', 'clear', 'anxious', 'low'], skip: ['relaxed', 'little', 'clear', 'anxious', 'low', 'event'] }
};
GJ.isAffirmativeMedication = function (value) {
  return value === 'medicine' || value === 'supplement' || value === 'both';
};
GJ.normalizeMultiAnswer = function (key, value) {
  var input = Array.isArray(value) ? value : [];
  var question = GJ.QUESTIONS.filter(function (item) { return item.key === key; })[0];
  var allowed = {};
  if (question && question.options) question.options.forEach(function (option) { allowed[option[0]] = true; });
  var result = [];
  input.forEach(function (item) {
    if (typeof item !== 'string' || !allowed[item] || result.indexOf(item) >= 0) return;
    var conflicts = [];
    Object.keys(GJ.MUTUALLY_EXCLUSIVE[key] || {}).forEach(function (neutral) {
      var members = GJ.MUTUALLY_EXCLUSIVE[key][neutral];
      if (item === neutral) conflicts = conflicts.concat(members);
      else if (members.indexOf(item) >= 0) conflicts.push(neutral);
    });
    result = result.filter(function (existing) { return conflicts.indexOf(existing) < 0; });
    result.push(item);
  });
  if (key === 'focus') result = result.slice(0, 3);
  return result;
};
GJ.normalizeAnswers = function (answers) {
  var source = answers && typeof answers === 'object' ? answers : {};
  var clean = GJ.defaultAnswers();
  GJ.QUESTIONS.forEach(function (question) {
    if (question.options) {
      var options = {};
      question.options.forEach(function (option) { options[option[0]] = true; });
      if (question.multiple) {
        clean[question.key] = GJ.normalizeMultiAnswer(question.key, source[question.key]);
      } else {
        clean[question.key] = typeof source[question.key] === 'string' && options[source[question.key]] ? source[question.key] : '';
      }
    } else if (question.input === 'textarea' || question.input === 'nickname') {
      clean[question.key] = typeof source[question.key] === 'string' ? source[question.key] : '';
    }
  });
  clean.medNotes = typeof source.medNotes === 'string' ? source.medNotes : '';
  if (!GJ.isAffirmativeMedication(clean.medication)) clean.medNotes = '';
  return clean;
};
GJ.defaultState = function () { return { started: false, completed: false, step: 0, answers: GJ.defaultAnswers() }; };
GJ.state = GJ.defaultState();
GJ.save = function () {
  try {
    if (GJ.state && GJ.state.answers) GJ.state.answers = GJ.normalizeAnswers(GJ.state.answers);
    localStorage.setItem(GJ.CONFIG.STORAGE_KEY, JSON.stringify(GJ.state));
  } catch (error) { /* 本地存储不可用时仍可继续使用 */ }
};
GJ.load = function () {
  var fresh = GJ.defaultState();
  try {
    var raw = localStorage.getItem(GJ.CONFIG.STORAGE_KEY);
    if (!raw) return fresh;
    var saved = JSON.parse(raw);
    if (!saved || typeof saved !== 'object') return fresh;
    fresh.started = saved.started === true;
    fresh.completed = saved.completed === true;
    var savedStep = Number(saved.step);
    fresh.step = Number.isFinite(savedStep) ? Math.max(0, Math.min(GJ.QUESTIONS.length - 1, Math.floor(savedStep))) : 0;
    if (saved.answers && typeof saved.answers === 'object') fresh.answers = GJ.normalizeAnswers(saved.answers);
  } catch (error) { return fresh; }
  fresh.answers = GJ.normalizeAnswers(fresh.answers);
  return fresh;
};
function byId(id) { return document.getElementById(id); }
function setVisible(id, visible) { byId(id).hidden = !visible; }
function saveAndKeep() { GJ.save(); }
function currentQuestion() { return GJ.QUESTIONS[GJ.state.step]; }
function answerValue(question) { return GJ.state.answers[question.key]; }
function hasAnswer(question) {
  var value = answerValue(question);
  return Array.isArray(value) ? value.length > 0 : Boolean(value && String(value).trim());
}
function showWelcome() {
  setVisible('welcome-view', true); setVisible('question-view', false); setVisible('report-view', false);
  var start = byId('start-button');
  start.textContent = GJ.state.completed ? '查看我的报告' : (GJ.state.started ? '继续观己' : '开始观己');
}
function showQuestion() {
  setVisible('welcome-view', false); setVisible('question-view', true); setVisible('report-view', false);
  renderQuestion(); window.scrollTo(0, 0);
}
function showReport() {
  setVisible('welcome-view', false); setVisible('question-view', false); setVisible('report-view', true);
  GJ.reportBuild(byId('report-box'), GJ.state); byId('report-status').textContent = '';
  window.scrollTo(0, 0);
}
function optionSelected(question, value) {
  var answer = GJ.state.answers[question.key];
  if (question.multiple) {
    var list = Array.isArray(answer) ? answer.slice() : [];
    var index = list.indexOf(value);
    if (index >= 0) list.splice(index, 1);
    else {
      if (question.key === 'focus' && list.length >= 3) {
        byId('question-feedback').textContent = '这一题最多选择 3 个。';
        return;
      }
      list.push(value);
    }
    GJ.state.answers[question.key] = GJ.normalizeMultiAnswer(question.key, list);
  } else {
    GJ.state.answers[question.key] = value;
    if (question.key === 'medication' && !GJ.isAffirmativeMedication(value)) GJ.state.answers.medNotes = '';
  }
  GJ.state.answers = GJ.normalizeAnswers(GJ.state.answers);
  saveAndKeep(); renderQuestion();
  if (!question.multiple && question.auto) {
    window.setTimeout(function () { if (GJ.state.step === GJ.QUESTIONS.indexOf(question)) advance(); }, 220);
  }
}
function renderQuestion() {
  var question = currentQuestion();
  var index = GJ.state.step;
  byId('progress-label').textContent = (index + 1) + ' / ' + GJ.QUESTIONS.length;
  byId('progress-bar').style.width = (((index + 1) / GJ.QUESTIONS.length) * 100) + '%';
  var stage = byId('question-stage');
  var html = '<p class="question-count">第 ' + (index + 1) + ' 题</p><h1 class="question-title">' + GJ.escape(question.title) + '</h1><p class="question-hint">' + GJ.escape(question.hint || '') + '</p>';
  if (question.options) {
    html += '<div class="option-list" role="group" aria-label="' + GJ.escape(question.title) + '">';
    question.options.forEach(function (option) {
      var selected = Array.isArray(answerValue(question)) ? answerValue(question).indexOf(option[0]) >= 0 : answerValue(question) === option[0];
      html += '<button type="button" class="option-card' + (selected ? ' selected' : '') + '" data-option="' + GJ.escape(option[0]) + '" aria-pressed="' + selected + '"><span class="option-check" aria-hidden="true">' + (selected ? '✓' : '') + '</span><span>' + GJ.escape(option[1]) + '</span></button>';
    });
    html += '</div>';
    if (question.note && GJ.isAffirmativeMedication(answerValue(question))) html += '<label class="optional-note">想记录的话，可以写下相关内容。<textarea id="med-notes" rows="3" placeholder="选填">' + GJ.escape(GJ.state.answers.medNotes || '') + '</textarea></label>';
  } else if (question.input === 'textarea') {
    html += '<label class="long-input"><span class="sr-only">自由记录</span><textarea id="free-note" rows="7" maxlength="1200" placeholder="写下你想一起记住的内容……"></textarea><span class="input-caption">可以写得详细一些，内容只保存在当前浏览器。</span></label>';
  } else {
    html += '<label class="long-input nickname-input"><span class="sr-only">昵称</span><input id="nickname" type="text" maxlength="40" placeholder="例如：圆酱"><span class="input-caption">选填</span></label>';
  }
  html += '<p id="question-feedback" class="question-feedback" role="status"></p>';
  stage.innerHTML = html;
  if (question.input === 'textarea') byId('free-note').value = GJ.state.answers.note || '';
  if (question.input === 'nickname') byId('nickname').value = GJ.state.answers.nickname || '';
  Array.prototype.forEach.call(stage.querySelectorAll('.option-card'), function (button) {
    button.addEventListener('click', function () { optionSelected(question, button.getAttribute('data-option')); });
  });
  if (question.note && GJ.isAffirmativeMedication(answerValue(question)) && byId('med-notes')) byId('med-notes').addEventListener('input', function () { GJ.state.answers.medNotes = this.value; saveAndKeep(); });
  if (question.input === 'textarea') byId('free-note').addEventListener('input', function () { GJ.state.answers.note = this.value; saveAndKeep(); });
  if (question.input === 'nickname') byId('nickname').addEventListener('input', function () { GJ.state.answers.nickname = this.value; saveAndKeep(); });
  byId('previous-button').disabled = false;
  byId('next-button').textContent = index === GJ.QUESTIONS.length - 1 ? '生成我的观己报告 →' : '下一题 →';
}
function collectInput() {
  var question = currentQuestion();
  if (question.input === 'textarea' && byId('free-note')) GJ.state.answers.note = byId('free-note').value;
  if (question.input === 'nickname' && byId('nickname')) GJ.state.answers.nickname = byId('nickname').value;
  if (question.note && byId('med-notes')) GJ.state.answers.medNotes = byId('med-notes').value;
  saveAndKeep();
}
function advance() {
  collectInput();
  if (GJ.state.step < GJ.QUESTIONS.length - 1) { GJ.state.step += 1; saveAndKeep(); renderQuestion(); window.scrollTo(0, 0); }
  else { GJ.state.completed = true; GJ.state.started = true; saveAndKeep(); showReport(); }
}
function goPrevious() {
  collectInput();
  if (GJ.state.step > 0) { GJ.state.step -= 1; saveAndKeep(); renderQuestion(); window.scrollTo(0, 0); }
  else showWelcome();
}
document.addEventListener('DOMContentLoaded', function () {
  GJ.state = GJ.load();
  GJ.save();
  byId('start-button').addEventListener('click', function () {
    if (GJ.state.completed) { showReport(); return; }
    GJ.state.started = true; saveAndKeep(); showQuestion();
  });
  byId('next-button').addEventListener('click', advance);
  byId('previous-button').addEventListener('click', goPrevious);
  byId('question-home').addEventListener('click', showWelcome);
  byId('report-edit').addEventListener('click', function () {
    GJ.state.completed = false; GJ.state.started = true; GJ.state.step = GJ.QUESTIONS.length - 1; saveAndKeep(); showQuestion();
  });
  byId('save-png').addEventListener('click', function () {
    var button = this; var status = byId('report-status'); button.disabled = true; status.textContent = '正在生成长图，请稍候……';
    GJ.reportExportPNG(byId('report-box')).then(function (dataUrl) {
      var link = document.createElement('a'); link.href = dataUrl; link.download = '灵台·观己报告.png'; link.click();
      status.textContent = '长图已生成。'; button.disabled = false;
    }).catch(function (error) { status.textContent = '长图生成失败：' + error.message; button.disabled = false; });
  });
  if (GJ.state.completed) showReport(); else if (GJ.state.started) showQuestion(); else showWelcome();
  window.__appReady = true;
});
