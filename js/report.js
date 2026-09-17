/* ============================================================
 * report.js — 报告渲染、二维码、高清 PNG 长图导出
 * 报告结构（与人类规格一致）：
 *   顶部 → 本次所见 → 功能医学时间轴 → 功能医学矩阵 →
 *   观己故事 → 生活脉络 → 二维码 → 专业边界说明
 * 二维码只编码 config.js 中的项目首页 URL，不编码任何健康数据。
 * PNG 导出：HTML 报告预览 + html2canvas（≥2×，高度随内容自动变化）。
 * ============================================================ */
window.GJ = window.GJ || {};

/* ---------- 用 vendored qrcode.js（Kazuhiko Arase, MIT）绘制二维码 ---------- */
GJ.drawQR = function (canvas, url, size) {
  size = size || 220;
  const qr = qrcode(0, 'M'); /* 自动选版本，M 级纠错 */
  qr.addData(url);
  qr.make();
  const n = qr.getModuleCount();
  const cell = Math.floor(size / (n + 8)); /* 4 格静默区 */
  const real = cell * (n + 8);
  canvas.width = real;
  canvas.height = real;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, real, real);
  ctx.fillStyle = '#253047';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (qr.isDark(r, c)) {
        ctx.fillRect((c + 4) * cell, (r + 4) * cell, cell, cell);
      }
    }
  }
  return canvas;
};

/* ---------- 报告构建 ---------- */
GJ.reportBuild = function (container, state) {
  const st = GJ.storyGenerate(state);
  const profile = state.profile || {};
  const dateStr = profile.date || '';
  const nameStr = profile.name || '未署名';
  const sexStr = profile.sex ? ' · ' + profile.sex : '';
  const ageStr = profile.age ? ' · ' + profile.age + ' 岁' : '';
  const hw = [profile.height && '身高 ' + profile.height, profile.weight && '体重 ' + profile.weight]
    .filter(Boolean).join('，');

  container.innerHTML =
    '<div class="rp-paper" id="rp-paper">' +

    /* 1 · 报告顶部 */
    '  <div class="rp-head">' +
    '    <div class="rp-brand">灵台 · 观己</div>' +
    '    <div class="rp-kind">功能医学观察报告</div>' +
    '    <div class="rp-meta">' + GJ.escHtml(nameStr) + GJ.escHtml(ageStr) + GJ.escHtml(sexStr) +
         (dateStr ? ' · ' + GJ.escHtml(dateStr) : '') + '</div>' +
    (hw ? '    <div class="rp-meta rp-meta-sub">' + GJ.escHtml(hw) + '</div>' : '') +
    '    <div class="rp-summary-line">' + GJ.escHtml(st.summary) + '</div>' +
    '  </div>' +

    /* 2 · 本次所见 */
    '  <div class="rp-section">' +
    '    <div class="rp-sec-title"><span class="rp-sec-zh">本次所见</span><span class="rp-sec-en">What This Record Shows</span></div>' +
    '    <div class="rp-kws">' +
         st.keywords.map(function (k) { return '<span class="rp-kw">' + GJ.escHtml(k) + '</span>'; }).join('') +
    '    </div>' +
    '  </div>' +

    /* 3 · 功能医学时间轴（主区域） */
    '  <div class="rp-section">' +
    '    <div class="rp-sec-title"><span class="rp-sec-zh">功能医学时间轴</span><span class="rp-sec-en">Functional Medicine Timeline</span></div>' +
    '    <div class="rp-timeline" id="rp-timeline"></div>' +
    '  </div>' +

    /* 4 · 功能医学矩阵（主区域） */
    '  <div class="rp-section">' +
    '    <div class="rp-sec-title"><span class="rp-sec-zh">功能医学矩阵</span><span class="rp-sec-en">IFM Functional Medicine Matrix</span></div>' +
    '    <div class="rp-matrix" id="rp-matrix"></div>' +
    '  </div>' +

    /* 5 · 观己故事 */
    '  <div class="rp-section rp-story-sec">' +
    '    <div class="rp-sec-title"><span class="rp-sec-zh">观己故事</span><span class="rp-sec-en">Your Story of Self-Observation</span></div>' +
    '    <div class="rp-story-sub">把零散的身体信号，慢慢连成自己的时间线。</div>' +
    '    <div class="rp-story">' + GJ.escHtml(st.story) + '</div>' +
    '  </div>' +

    /* 6 · 生活脉络 */
    '  <div class="rp-section">' +
    '    <div class="rp-sec-title"><span class="rp-sec-zh">生活脉络</span><span class="rp-sec-en">Lifestyle Context</span></div>' +
    '    <div class="rp-life" id="rp-life"></div>' +
    '  </div>' +

    /* 7 · 二维码 */
    '  <div class="rp-section rp-qr-sec">' +
    '    <div class="rp-qr-box"><canvas id="rp-qrcode"></canvas></div>' +
    '    <div class="rp-qr-text">扫码再次记录 · 回到灵台 · 观己</div>' +
    '    <div class="rp-qr-url">' + GJ.escHtml(GJ.CONFIG.PROJECT_HOME_URL) + '</div>' +
    '  </div>' +

    /* 8 · 专业边界 */
    '  <div class="rp-disclaimer">本工具用于健康资料整理、自我观察与专业沟通辅助，不构成诊断、治疗、用药、营养治疗处方或临床决策依据。</div>' +
    '</div>';

  /* 填充时间轴与矩阵 */
  GJ.timelineRenderReport(container.querySelector('#rp-timeline'), state);
  GJ.matrixRenderReport(container.querySelector('#rp-matrix'), state);

  /* 生活脉络小卡片 */
  const lifeBox = container.querySelector('#rp-life');
  const anyLife = GJ.LIFESTYLE_FIELDS.some(function (f) { return (state.lifestyle[f.key] || '').trim(); });
  if (anyLife) {
    lifeBox.innerHTML = GJ.LIFESTYLE_FIELDS
      .filter(function (f) { return (state.lifestyle[f.key] || '').trim(); })
      .map(function (f) {
        return '<div class="rp-life-card"><div class="rp-life-zh">' + f.zh + '</div>' +
               '<div class="rp-life-txt">' + GJ.escHtml(state.lifestyle[f.key].trim()) + '</div></div>';
      }).join('');
  } else {
    lifeBox.innerHTML = '<div class="tl-empty">本次未填写生活方式记录。</div>';
  }

  /* 绘制二维码：只编码项目首页 URL */
  GJ.drawQR(container.querySelector('#rp-qrcode'), GJ.CONFIG.PROJECT_HOME_URL, 220);

  return st; /* 返回故事结果，便于 app.js 显示字数等 */
};

/* ---------- PNG 长图导出（html2canvas，≥2×） ---------- */
GJ.reportExportPNG = function (reportContainer) {
  const el = reportContainer.querySelector('#rp-paper') || reportContainer;
  if (typeof html2canvas !== 'function') {
    return Promise.reject(new Error('html2canvas 未加载'));
  }
  return html2canvas(el, {
    scale: GJ.CONFIG.PNG_SCALE,
    backgroundColor: '#FAF7F1',
    useCORS: true,
    logging: false,
    windowWidth: el.scrollWidth + 40,
  }).then(function (canvas) {
    return canvas.toDataURL('image/png');
  });
};
