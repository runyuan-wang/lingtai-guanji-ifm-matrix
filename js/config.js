/* ============================================================
 * config.js — 全局配置（灵台·观己 轻量版）
 * 二维码只编码项目首页 URL，永不编码任何个人健康数据。
 * 部署时把 PROJECT_HOME_URL 改成新首页地址即可。
 * ============================================================ */
window.GJ = window.GJ || {};

GJ.CONFIG = {
  // 项目首页（二维码唯一编码内容）
  PROJECT_HOME_URL: 'https://lingtai-guanji.vercel.app/',
  // localStorage 暂存键
  STORAGE_KEY: 'lingtai-guanji-light-v1',
  // PNG 导出倍率（≥2）
  PNG_SCALE: 2,
};
