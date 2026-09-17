// 模版模型：和 Encore/Core/ShareTemplate.swift、TemplateDocument.swift 一一对应。
// 这里只放纯数据：默认值、取值范围、字段含义、文档的编码与解码。
// 画布绘制在 render.js，界面在 ui.js。
(function (global) {
  'use strict';

  // MARK: - 常量

  var CANVAS_W = 360;
  var DEFAULT_EXPORT_WIDTH = 1080;
  var EXPORT_WIDTH_RANGE = [540, 2160];
  var ASPECT_RANGE = [0.5, 2.2];
  var SCALE_RANGE = [0.5, 3];
  var OFFSET_RANGE = [-1, 1];
  var TILT_RANGE = [-45, 45];
  var MAX_ELEMENTS = 80;

  var MAX_BYTES = 8 * 1024 * 1024;
  var MAX_VIDEO_BYTES = 40 * 1024 * 1024;
  var MAX_FILE_BYTES = 64 * 1024 * 1024;

  // 分享工坊的四枚主题色（AccentTheme）。
  var ACCENTS = [
    { id: 'lilac', name: '云紫', hex: '#bba7ef', deepHex: '#6e58a8' },
    { id: 'green', name: '苔绿', hex: '#d8eb97', deepHex: '#5e7a32' },
    { id: 'coral', name: '珊瑚', hex: '#f4ab8e', deepHex: '#c2603a' },
    { id: 'blue', name: '远山蓝', hex: '#adcfe5', deepHex: '#3e6e8e' }
  ];

  // ColorValue.presets
  var COLOR_PRESETS = [
    { name: '墨', hex: '#20251f' },
    { name: '白', hex: '#ffffff' },
    { name: '纸', hex: '#f6f3e9' },
    { name: '夜', hex: '#141618' },
    { name: '印章', hex: '#c4553f' },
    { name: '金', hex: '#c9a24a' },
    { name: '云紫', hex: '#bba7ef' },
    { name: '苔绿', hex: '#d8eb97' },
    { name: '珊瑚', hex: '#f4ab8e' },
    { name: '远山蓝', hex: '#adcfe5' }
  ];

  var WEIGHTS = ['细', '常规', '中等', '半粗', '粗体', '特粗'];
  var WEIGHT_CSS = { '细': 300, '常规': 400, '中等': 500, '半粗': 600, '粗体': 700, '特粗': 900 };
  var DESIGNS = ['黑体', '宋体', '圆体', '等宽'];
  var ALIGNMENTS = ['左对齐', '居中', '右对齐'];
  var ACCENT_MODES = ['主题色', '主题深色'];
  var SHAPES = ['矩形', '圆形', '直线', '唱片纹', '点阵', '胶片孔', '锯齿边', '渐变'];

  var FIELD_GROUPS = ['基本信息', '时间与地点', '我的感受', '私人信息', '装饰与署名'];
  // raw = 存进档案的字；name = 界面上印的字（简体中文下两者一致，除了 余响标识）。
  var FIELDS = [
    { raw: '名称', name: '名称', group: '基本信息', size: 28, weight: '特粗', design: '黑体' },
    { raw: '副标题', name: '副标题', group: '基本信息', size: 12, weight: '常规', design: '黑体' },
    { raw: '艺人 / 卡司', name: '艺人 / 卡司', group: '基本信息', size: 12, weight: '常规', design: '黑体' },
    { raw: '类型', name: '类型', group: '基本信息', size: 12, weight: '粗体', design: '黑体' },
    { raw: '英文类型', name: '英文类型', group: '基本信息', size: 10, weight: '粗体', design: '等宽' },
    { raw: '日期', name: '日期', group: '时间与地点', size: 12, weight: '常规', design: '黑体' },
    { raw: '数字日期', name: '数字日期', group: '时间与地点', size: 12, weight: '粗体', design: '等宽' },
    { raw: '时间', name: '时间', group: '时间与地点', size: 12, weight: '常规', design: '等宽' },
    { raw: '场馆', name: '场馆', group: '时间与地点', size: 12, weight: '常规', design: '黑体' },
    { raw: '城市', name: '城市', group: '时间与地点', size: 12, weight: '常规', design: '黑体' },
    { raw: '城市与场馆', name: '城市与场馆', group: '时间与地点', size: 12, weight: '常规', design: '黑体' },
    { raw: '月日', name: '月日', group: '时间与地点', size: 12, weight: '特粗', design: '黑体' },
    { raw: '年份', name: '年份', group: '时间与地点', size: 12, weight: '常规', design: '等宽' },
    { raw: '评分星星', name: '评分星星', group: '我的感受', size: 12, weight: '常规', design: '黑体' },
    { raw: '心情', name: '心情', group: '我的感受', size: 12, weight: '常规', design: '黑体' },
    { raw: '金句', name: '金句', group: '我的感受', size: 15, weight: '中等', design: '宋体' },
    { raw: '感想', name: '感想', group: '我的感受', size: 12, weight: '常规', design: '宋体' },
    { raw: '曲目单', name: '曲目单', group: '我的感受', size: 12, weight: '常规', design: '黑体' },
    { raw: '票价', name: '票价', group: '私人信息', size: 12, weight: '常规', design: '黑体', priv: true },
    { raw: '座位', name: '座位', group: '私人信息', size: 12, weight: '常规', design: '黑体', priv: true },
    { raw: '同行人', name: '同行人', group: '私人信息', size: 12, weight: '常规', design: '黑体', priv: true },
    { raw: '开场白', name: '开场白', group: '装饰与署名', size: 10, weight: '常规', design: '黑体' },
    { raw: '署名', name: '署名', group: '装饰与署名', size: 10, weight: '常规', design: '等宽' },
    { raw: '余响标识', name: 'Livemark 标识', group: '装饰与署名', size: 16, weight: '特粗', design: '黑体' },
    { raw: '编号', name: '编号', group: '装饰与署名', size: 10, weight: '粗体', design: '等宽' },
    { raw: '条码', name: '条码', group: '装饰与署名', size: 12, weight: '常规', design: '黑体' },
    { raw: '自定义文字', name: '自定义文字', group: '装饰与署名', size: 12, weight: '常规', design: '黑体' }
  ];
  var FIELD_BY_RAW = {};
  FIELDS.forEach(function (f) { FIELD_BY_RAW[f.raw] = f; });
  function fieldInfo(raw) { return FIELD_BY_RAW[raw] || FIELD_BY_RAW['自定义文字']; }
  function fieldName(raw) { return fieldInfo(raw).name; }

  // MARK: - 数值

  function clamp(value, range, fallback) {
    if (typeof value !== 'number' || !isFinite(value)) return fallback;
    return Math.min(range[1], Math.max(range[0], value));
  }
  function num(value, fallback) {
    return (typeof value === 'number' && isFinite(value)) ? value : fallback;
  }
  function prefix(text, n) {
    var chars = Array.from(String(text == null ? '' : text));
    return chars.slice(0, n).join('');
  }

  // MARK: - 颜色

  function color(r, g, b, a) { return { red: r, green: g, blue: b, alpha: a === undefined ? 1 : a }; }
  function colorFromHex(hex) {
    var text = String(hex || '').trim();
    if (text.charAt(0) === '#') text = text.slice(1);
    if (!/^[0-9a-fA-F]+$/.test(text) || (text.length !== 6 && text.length !== 8)) return null;
    var value = parseInt(text, 16);
    if (text.length === 6) return color(((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255, 1);
    return color(((value >>> 24) & 255) / 255, ((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255);
  }
  function clampColor(value) {
    if (!value || typeof value !== 'object') return color(0.125, 0.145, 0.122);
    function fix(v, fb) { return (typeof v === 'number' && isFinite(v)) ? Math.min(1, Math.max(0, v)) : fb; }
    return color(fix(value.red, 0), fix(value.green, 0), fix(value.blue, 0), fix(value.alpha, 1));
  }
  function colorHex(value) {
    var c = clampColor(value);
    function part(v) { var s = Math.round(v * 255).toString(16); return s.length < 2 ? '0' + s : s; }
    var base = '#' + part(c.red) + part(c.green) + part(c.blue);
    return c.alpha < 0.999 ? base + part(c.alpha) : base;
  }
  function colorCSS(value) {
    var c = clampColor(value);
    return 'rgba(' + Math.round(c.red * 255) + ',' + Math.round(c.green * 255) + ',' + Math.round(c.blue * 255) + ',' + c.alpha + ')';
  }
  function luminance(value) {
    var c = clampColor(value);
    function lin(ch) { return ch <= 0.03928 ? ch / 12.92 : Math.pow((ch + 0.055) / 1.055, 2.4); }
    return 0.2126 * lin(c.red) + 0.7152 * lin(c.green) + 0.0722 * lin(c.blue);
  }
  function isDark(value) { return luminance(value) < 0.4; }
  var INK = colorFromHex('#20251f');
  var CREAM = colorFromHex('#f6f3e9');
  var WHITE = colorFromHex('#ffffff');
  var NIGHT = colorFromHex('#141618');
  function contrasting(value) { return isDark(value) ? clone(CREAM) : clone(INK); }

  function clone(value) { return JSON.parse(JSON.stringify(value)); }

  // MARK: - UUID / 日期

  function uuid() {
    var bytes = new Uint8Array(16);
    (global.crypto || global.msCrypto).getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    var hex = [];
    for (var i = 0; i < 16; i++) { var s = bytes[i].toString(16).toUpperCase(); hex.push(s.length < 2 ? '0' + s : s); }
    return hex.slice(0, 4).join('') + '-' + hex.slice(4, 6).join('') + '-' + hex.slice(6, 8).join('') +
      '-' + hex.slice(8, 10).join('') + '-' + hex.slice(10, 16).join('');
  }
  function isUUID(text) {
    return typeof text === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(text);
  }
  // Swift 的 .iso8601 不接受小数秒，所以这里也不写。
  function isoNow(date) { return (date || new Date()).toISOString().replace(/\.\d{3}Z$/, 'Z'); }

  // MARK: - 默认值

  function defaultPlacement() { return { scale: 1, offsetX: 0, offsetY: 0, rotation: 0 }; }
  function defaultCover() {
    return {
      visible: true, x: 0.5, y: 0.4, width: 0.78, height: 0.5, cornerRadius: 10,
      rotation: 0, opacity: 1, shadow: true, border: 0, content: defaultPlacement()
    };
  }
  function defaultElement() {
    return {
      id: uuid(), field: '名称', text: '', label: '', x: 0.5, y: 0.8, width: 0.84,
      fontSize: 22, weight: '粗体', design: '黑体', alignment: '左对齐',
      color: clone(INK), tracking: 0, rotation: 0, opacity: 1, lineLimit: 3, uppercase: false
    };
  }
  function defaultTemplate() {
    var now = isoNow();
    return {
      id: uuid(), name: '我的模版', aspect: 1.4, background: clone(CREAM),
      imageScale: 1, imageOffsetX: 0, imageOffsetY: 0, imageOpacity: 1,
      cover: defaultCover(), elements: [], createdAt: now, updatedAt: now
    };
  }

  function makeElement(field, opts) {
    opts = opts || {};
    var info = fieldInfo(field);
    var el = defaultElement();
    el.field = field;
    el.x = opts.x === undefined ? 0.5 : opts.x;
    el.y = opts.y === undefined ? 0.8 : opts.y;
    el.width = opts.width === undefined ? 0.84 : opts.width;
    el.color = opts.color ? clone(opts.color) : clone(INK);
    el.fontSize = opts.size === undefined ? info.size : opts.size;
    el.weight = info.weight;
    el.design = info.design;
    el.alignment = opts.alignment || '左对齐';
    if (field === '自定义文字') el.text = '写点什么';
    if (field === '英文类型' || field === '编号' || field === '署名') el.tracking = 2;
    return el;
  }
  function makeShape(shape, o) {
    var el = defaultElement();
    el.field = '自定义文字';
    el.x = o.x; el.y = o.y; el.width = o.width;
    el.color = o.color ? clone(o.color) : clone(INK);
    el.shape = shape;
    el.shapeHeight = o.height;
    el.cornerRadius = o.cornerRadius || 0;
    if (o.stroke !== undefined && o.stroke !== null) el.strokeWidth = o.stroke;
    if (o.dash) { el.dashLength = o.dash[0]; el.dashGap = o.dash[1]; }
    if (o.accent) el.accent = o.accent;
    el.rotation = o.rotation || 0;
    el.opacity = o.opacity === undefined ? 1 : o.opacity;
    return el;
  }

  // MARK: - 元素性质

  function hasImage(el) { return !!el.imageData; }
  function isShape(el) { return !!el.shape && !hasImage(el); }
  function isLivePhoto(el) { return hasImage(el) && !!el.videoData; }
  function frameAspect(el) {
    if (typeof el.imageFrameAspect === 'number') return el.imageFrameAspect;
    if (typeof el.imageAspect === 'number') return el.imageAspect;
    return 1;
  }
  function canvasHeight(t) { return Math.round(CANVAS_W * t.aspect); }
  function exportPixelWidth(t) { return typeof t.exportWidth === 'number' ? t.exportWidth : DEFAULT_EXPORT_WIDTH; }
  function exportPixelHeight(t) { return Math.round(exportPixelWidth(t) * t.aspect); }
  function isAspectLocked(t) { return t.aspectLocked === undefined || t.aspectLocked === null ? true : !!t.aspectLocked; }
  function setExportWidth(t, width) {
    var clamped = clamp(width, EXPORT_WIDTH_RANGE, exportPixelWidth(t));
    if (!isAspectLocked(t)) t.aspect = clamp(exportPixelHeight(t) / clamped, ASPECT_RANGE, t.aspect);
    t.exportWidth = clamped;
  }
  function setExportHeight(t, height) {
    if (isAspectLocked(t)) t.exportWidth = clamp(height / Math.max(0.01, t.aspect), EXPORT_WIDTH_RANGE, exportPixelWidth(t));
    else t.aspect = clamp(height / exportPixelWidth(t), ASPECT_RANGE, t.aspect);
  }
  function hasLivePhoto(t) { return (t.elements || []).some(isLivePhoto); }
  function coverSplit(t) { return Math.min(t.elements.length, Math.max(0, t.cover.layer || 0)); }

  // MARK: - 清洗（对应 Swift 的 sanitized）

  function sanitizePlacement(p) {
    if (!p) return null;
    return {
      scale: clamp(p.scale, SCALE_RANGE, 1),
      offsetX: clamp(p.offsetX, OFFSET_RANGE, 0),
      offsetY: clamp(p.offsetY, OFFSET_RANGE, 0),
      rotation: clamp(p.rotation, TILT_RANGE, 0)
    };
  }
  function optional(value, fn) { return (value === undefined || value === null) ? undefined : fn(value); }

  function sanitizeElement(raw) {
    var d = defaultElement();
    var el = {
      id: isUUID(raw.id) ? String(raw.id).toUpperCase() : uuid(),
      field: FIELD_BY_RAW[raw.field] ? raw.field : '自定义文字',
      text: prefix(raw.text === undefined ? '' : raw.text, 300),
      label: prefix(raw.label === undefined ? '' : raw.label, 40),
      x: clamp(raw.x, [-0.5, 1.5], 0.5),
      y: clamp(raw.y, [-0.5, 1.5], 0.5),
      width: clamp(raw.width, [0.02, 1.5], 0.84),
      fontSize: clamp(raw.fontSize, [6, 120], 22),
      weight: WEIGHTS.indexOf(raw.weight) >= 0 ? raw.weight : d.weight,
      design: DESIGNS.indexOf(raw.design) >= 0 ? raw.design : d.design,
      alignment: ALIGNMENTS.indexOf(raw.alignment) >= 0 ? raw.alignment : d.alignment,
      color: clampColor(raw.color),
      tracking: clamp(raw.tracking, [-2, 12], 0),
      rotation: clamp(raw.rotation, [-180, 180], 0),
      opacity: clamp(raw.opacity, [0.05, 1], 1),
      lineLimit: Math.min(20, Math.max(1, Math.round(num(raw.lineLimit, 3)))),
      uppercase: !!raw.uppercase
    };
    if (raw.chip !== undefined && raw.chip !== null) el.chip = clampColor(raw.chip);
    if (typeof raw.imageData === 'string' && raw.imageData) el.imageData = raw.imageData;
    if (raw.imageAspect !== undefined && raw.imageAspect !== null) el.imageAspect = clamp(raw.imageAspect, [0.02, 50], 1);
    if (raw.isSticker !== undefined && raw.isSticker !== null) el.isSticker = !!raw.isSticker;
    if (SHAPES.indexOf(raw.shape) >= 0) el.shape = raw.shape;
    if (raw.shapeHeight !== undefined && raw.shapeHeight !== null) el.shapeHeight = clamp(raw.shapeHeight, [0.002, 3], 0.1);
    if (raw.cornerRadius !== undefined && raw.cornerRadius !== null) el.cornerRadius = clamp(raw.cornerRadius, [0, 200], 0);
    if (raw.strokeWidth !== undefined && raw.strokeWidth !== null) el.strokeWidth = clamp(raw.strokeWidth, [0, 40], 0);
    if (raw.dashLength !== undefined && raw.dashLength !== null) el.dashLength = clamp(raw.dashLength, [0, 80], 0);
    if (raw.dashGap !== undefined && raw.dashGap !== null) el.dashGap = clamp(raw.dashGap, [0, 80], 0);
    if (ACCENT_MODES.indexOf(raw.accent) >= 0) el.accent = raw.accent;
    if (ACCENT_MODES.indexOf(raw.chipAccent) >= 0) el.chipAccent = raw.chipAccent;
    if (raw.inlineLabel !== undefined && raw.inlineLabel !== null) el.inlineLabel = !!raw.inlineLabel;
    if (raw.imageFrameAspect !== undefined && raw.imageFrameAspect !== null) el.imageFrameAspect = clamp(raw.imageFrameAspect, [0.02, 50], 1);
    var placement = sanitizePlacement(raw.imagePlacement);
    if (placement) el.imagePlacement = placement;
    if (typeof raw.videoData === 'string' && raw.videoData) el.videoData = raw.videoData;
    return el;
  }
  function sanitizeCover(raw) {
    raw = raw || {};
    var cover = {
      visible: raw.visible === undefined ? true : !!raw.visible,
      x: clamp(raw.x, [-0.5, 1.5], 0.5),
      y: clamp(raw.y, [-0.5, 1.5], 0.4),
      width: clamp(raw.width, [0.05, 2], 0.78),
      height: clamp(raw.height, [0.05, 2], 0.5),
      cornerRadius: clamp(raw.cornerRadius, [0, 200], 10),
      rotation: clamp(raw.rotation, [-180, 180], 0),
      opacity: clamp(raw.opacity, [0.05, 1], 1),
      shadow: raw.shadow === undefined ? true : !!raw.shadow,
      border: clamp(raw.border, [0, 40], 0),
      content: sanitizePlacement(raw.content) || defaultPlacement()
    };
    if (raw.layer !== undefined && raw.layer !== null) cover.layer = Math.min(80, Math.max(0, Math.round(num(raw.layer, 0))));
    return cover;
  }
  function sanitize(raw) {
    raw = raw || {};
    var name = prefix(String(raw.name === undefined ? '' : raw.name).trim(), 40);
    if (!name) name = '我的模版';
    var t = {
      id: isUUID(raw.id) ? String(raw.id).toUpperCase() : uuid(),
      name: name,
      aspect: clamp(raw.aspect, ASPECT_RANGE, 1.4),
      background: clampColor(raw.background),
      imageScale: clamp(raw.imageScale, SCALE_RANGE, 1),
      imageOffsetX: clamp(raw.imageOffsetX, OFFSET_RANGE, 0),
      imageOffsetY: clamp(raw.imageOffsetY, OFFSET_RANGE, 0),
      imageOpacity: clamp(raw.imageOpacity, [0, 1], 1),
      cover: sanitizeCover(raw.cover),
      elements: (Array.isArray(raw.elements) ? raw.elements : []).slice(0, MAX_ELEMENTS).map(sanitizeElement),
      createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : isoNow(),
      updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : isoNow()
    };
    if (raw.exportWidth !== undefined && raw.exportWidth !== null) t.exportWidth = clamp(raw.exportWidth, EXPORT_WIDTH_RANGE, DEFAULT_EXPORT_WIDTH);
    if (raw.aspectLocked !== undefined && raw.aspectLocked !== null) t.aspectLocked = !!raw.aspectLocked;
    if (ACCENT_MODES.indexOf(raw.backgroundAccent) >= 0) t.backgroundAccent = raw.backgroundAccent;
    if (typeof raw.imageData === 'string' && raw.imageData) t.imageData = raw.imageData;
    return t;
  }

  // MARK: - 编码（与 Swift 的 JSONEncoder(.sortedKeys) 同一份结构）

  // JSON.stringify 的键顺序是插入顺序，Swift 用的是字典序，所以自己排。
  function stableStringify(value) {
    if (value === null) return 'null';
    var type = typeof value;
    if (type === 'number') {
      if (!isFinite(value)) throw new Error('数值不是有限数');
      return JSON.stringify(value);
    }
    if (type === 'boolean' || type === 'string') return JSON.stringify(value);
    if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']';
    var keys = Object.keys(value).filter(function (k) { return value[k] !== undefined; }).sort();
    return '{' + keys.map(function (k) {
      return JSON.stringify(k) + ':' + stableStringify(value[k]);
    }).join(',') + '}';
  }

  // Swift 的 Optional 为 nil 时整把键省掉，所以这里把 undefined 的键剔干净。
  function encodeColor(c) {
    var v = clampColor(c);
    return { alpha: v.alpha, blue: v.blue, green: v.green, red: v.red };
  }
  function encodeElement(el) {
    var out = {
      alignment: el.alignment, color: encodeColor(el.color), design: el.design, field: el.field,
      fontSize: el.fontSize, id: el.id, label: el.label, lineLimit: el.lineLimit, opacity: el.opacity,
      rotation: el.rotation, text: el.text, tracking: el.tracking, uppercase: !!el.uppercase,
      weight: el.weight, width: el.width, x: el.x, y: el.y
    };
    if (el.accent) out.accent = el.accent;
    if (el.chip) out.chip = encodeColor(el.chip);
    if (el.chipAccent) out.chipAccent = el.chipAccent;
    if (el.cornerRadius !== undefined && el.cornerRadius !== null) out.cornerRadius = el.cornerRadius;
    if (el.dashGap !== undefined && el.dashGap !== null) out.dashGap = el.dashGap;
    if (el.dashLength !== undefined && el.dashLength !== null) out.dashLength = el.dashLength;
    if (el.imageAspect !== undefined && el.imageAspect !== null) out.imageAspect = el.imageAspect;
    if (el.imageData) out.imageData = el.imageData;
    if (el.imageFrameAspect !== undefined && el.imageFrameAspect !== null) out.imageFrameAspect = el.imageFrameAspect;
    if (el.imagePlacement) out.imagePlacement = el.imagePlacement;
    if (el.inlineLabel !== undefined && el.inlineLabel !== null) out.inlineLabel = !!el.inlineLabel;
    if (el.isSticker !== undefined && el.isSticker !== null) out.isSticker = !!el.isSticker;
    if (el.shape) out.shape = el.shape;
    if (el.shapeHeight !== undefined && el.shapeHeight !== null) out.shapeHeight = el.shapeHeight;
    if (el.strokeWidth !== undefined && el.strokeWidth !== null) out.strokeWidth = el.strokeWidth;
    if (el.videoData) out.videoData = el.videoData;
    return out;
  }
  function encodeCover(c) {
    var out = {
      border: c.border, content: c.content, cornerRadius: c.cornerRadius, height: c.height,
      opacity: c.opacity, rotation: c.rotation, shadow: !!c.shadow, visible: !!c.visible,
      width: c.width, x: c.x, y: c.y
    };
    if (c.layer !== undefined && c.layer !== null) out.layer = c.layer;
    return out;
  }
  function encodeTemplate(t) {
    var out = {
      aspect: t.aspect, background: encodeColor(t.background), cover: encodeCover(t.cover),
      createdAt: t.createdAt, elements: t.elements.map(encodeElement), id: t.id,
      imageOffsetX: t.imageOffsetX, imageOffsetY: t.imageOffsetY, imageOpacity: t.imageOpacity,
      imageScale: t.imageScale, name: t.name, updatedAt: t.updatedAt
    };
    if (t.aspectLocked !== undefined && t.aspectLocked !== null) out.aspectLocked = !!t.aspectLocked;
    if (t.backgroundAccent) out.backgroundAccent = t.backgroundAccent;
    if (t.exportWidth !== undefined && t.exportWidth !== null) out.exportWidth = t.exportWidth;
    if (t.imageData) out.imageData = t.imageData;
    return out;
  }

  // MARK: - 图片 / 视频的魔数（对应 TemplateDocument.isSupportedImage / isSupportedVideo）

  var B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  function base64Bytes(text, limit) {
    var clean = String(text).replace(/[^A-Za-z0-9+/]/g, '');
    var out = [], buffer = 0, bits = 0;
    for (var i = 0; i < clean.length && out.length < limit; i++) {
      var index = B64.indexOf(clean.charAt(i));
      if (index < 0) continue;
      buffer = (buffer << 6) | index; bits += 6;
      if (bits >= 8) { bits -= 8; out.push((buffer >> bits) & 255); }
    }
    return out;
  }
  function base64ByteCount(text) {
    var clean = String(text).replace(/[^A-Za-z0-9+/=]/g, '');
    var pad = 0;
    if (clean.charAt(clean.length - 1) === '=') pad++;
    if (clean.charAt(clean.length - 2) === '=') pad++;
    return Math.floor(clean.length / 4) * 3 - pad;
  }
  function ascii(bytes, from, to) {
    var s = '';
    for (var i = from; i < to; i++) s += String.fromCharCode(bytes[i]);
    return s;
  }
  function isSupportedImage(base64) {
    var b = base64Bytes(base64, 12);
    if (b.length < 12) return false;
    if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47 && b[4] === 0x0D && b[5] === 0x0A && b[6] === 0x1A && b[7] === 0x0A) return true;
    if (b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) return true;
    if (ascii(b, 0, 4) === 'GIF8') return true;
    if (ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 12) === 'WEBP') return true;
    if (ascii(b, 4, 8) === 'ftyp') {
      return ['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1', 'avif'].indexOf(ascii(b, 8, 12)) >= 0;
    }
    return false;
  }
  function isSupportedVideo(base64) {
    var b = base64Bytes(base64, 12);
    if (b.length < 12 || ascii(b, 4, 8) !== 'ftyp') return false;
    return ['qt  ', 'isom', 'mp41', 'mp42', 'M4V ', 'avc1'].indexOf(ascii(b, 8, 12)) >= 0;
  }

  // MARK: - 文档

  function DocumentError(message) { this.name = 'TemplateDocumentError'; this.message = message; }
  DocumentError.prototype = Object.create(Error.prototype);

  /// 返回 .encoretemplate 的文本；结构与 TemplateDocument.encode 一致。
  function encodeDocument(template) {
    var value = sanitize(template);
    // App 的解码器不收空画布，这里先拦下来，免得导出一个对面打不开的文件。
    if (!value.elements.length && !value.cover.visible) throw new DocumentError('空画布导不出，先加一层');
    value.elements.forEach(function (el) {
      if (el.imageData && !isSupportedImage(el.imageData)) throw new DocumentError('图片格式不支持');
      if (el.videoData) {
        if (!isSupportedVideo(el.videoData)) throw new DocumentError('视频格式不支持');
        if (base64ByteCount(el.videoData) > MAX_VIDEO_BYTES) throw new DocumentError('文件过大');
      }
    });
    if (value.imageData) {
      if (!isSupportedImage(value.imageData)) throw new DocumentError('图片格式不支持');
      if (base64ByteCount(value.imageData) > MAX_BYTES) throw new DocumentError('文件过大');
    }
    var text = stableStringify({
      app: 'Livemark', exportedAt: isoNow(), template: encodeTemplate(value), version: 1
    });
    var bytes = new TextEncoder().encode(text).length;
    if (bytes > (hasLivePhoto(value) ? MAX_FILE_BYTES : MAX_BYTES)) throw new DocumentError('文件过大');
    return text;
  }

  function fileName(template) {
    var cleaned = String(template.name || '').split(/[/\\:?%*|"<>\n\r]/).join('-');
    var trimmed = prefix(cleaned.trim(), 40);
    return (trimmed || '我的模版') + '.encoretemplate';
  }

  /// 解码一个文件，规则与 TemplateDocument.decode 一样：清洗、换新 id、去重。
  function decodeDocument(text) {
    var bytes = new TextEncoder().encode(text).length;
    if (bytes > MAX_FILE_BYTES) throw new DocumentError('文件过大');
    var doc;
    try { doc = JSON.parse(text); } catch (e) { throw new DocumentError('文件读不出来'); }
    if (!doc || typeof doc !== 'object' || !doc.template) throw new DocumentError('文件读不出来');
    if (typeof doc.version !== 'number' || doc.version > 1) throw new DocumentError('这个文件来自更新的版本');
    var rawElements = Array.isArray(doc.template.elements) ? doc.template.elements : [];
    var template = sanitize(doc.template);
    if (!template.elements.length && !template.cover.visible) throw new DocumentError('文件读不出来');
    if (bytes > (hasLivePhoto(template) ? MAX_FILE_BYTES : MAX_BYTES)) throw new DocumentError('文件过大');
    if (doc.template.imageAsset) throw new DocumentError('文件读不出来');
    if (template.imageData && !isSupportedImage(template.imageData)) throw new DocumentError('图片格式不支持');
    template.elements.forEach(function (el, i) {
      var raw = rawElements[i] || {};
      if (el.imageData) { if (!isSupportedImage(el.imageData)) throw new DocumentError('图片格式不支持'); }
      else if (raw.imageAsset) throw new DocumentError('文件读不出来');
      if (el.videoData) {
        if (!isSupportedVideo(el.videoData) || base64ByteCount(el.videoData) > MAX_VIDEO_BYTES || !el.imageData) throw new DocumentError('视频格式不支持');
      } else if (raw.videoAsset) throw new DocumentError('文件读不出来');
    });
    template.id = uuid();
    template.createdAt = isoNow();
    template.updatedAt = template.createdAt;
    var seen = {};
    template.elements.forEach(function (el) {
      if (seen[el.id]) el.id = uuid();
      seen[el.id] = true;
    });
    return template;
  }

  // MARK: - 起始排版（ShareTemplate.starter）

  var STARTERS = [
    { id: '拍立得', subtitle: '白边相纸，下方手写一句' },
    { id: '展览海报', subtitle: '大字标题压在封面上' },
    { id: '信息票根', subtitle: '封面在上，字段整齐排在下方' },
    { id: '空白画布', subtitle: '只有底色，全部自己来' }
  ];
  function starter(kind, name) {
    var t = defaultTemplate();
    t.name = name || kind;
    if (kind === '拍立得') {
      t.aspect = 1.3; t.background = colorFromHex('#f2ecdd');
      t.cover = sanitizeCover({ visible: true, x: 0.5, y: 0.4, width: 0.8, height: 0.56, cornerRadius: 2, rotation: -2, border: 12, opacity: 1, shadow: true, content: defaultPlacement() });
      t.elements = [
        makeElement('名称', { x: 0.5, y: 0.8, width: 0.8, alignment: '居中', size: 22 }),
        makeElement('日期', { x: 0.5, y: 0.88, width: 0.8, alignment: '居中', size: 11 }),
        makeElement('开场白', { x: 0.5, y: 0.94, width: 0.8, alignment: '居中', size: 10 }),
        makeElement('余响标识', { x: 0.2, y: 0.06, width: 0.36, size: 12 }),
        makeElement('英文类型', { x: 0.8, y: 0.06, width: 0.36, alignment: '右对齐', size: 8 })
      ];
      t.elements[2].design = '宋体'; t.elements[2].opacity = 0.7;
    } else if (kind === '展览海报') {
      t.aspect = 1.5; t.background = clone(NIGHT);
      t.cover = sanitizeCover({ visible: true, x: 0.5, y: 0.5, width: 1, height: 1, cornerRadius: 0, rotation: 0, border: 0, opacity: 1, shadow: false, content: defaultPlacement() });
      t.elements = [
        makeElement('名称', { x: 0.5, y: 0.78, width: 0.86, color: WHITE, size: 36 }),
        makeElement('城市与场馆', { x: 0.5, y: 0.9, width: 0.86, color: WHITE, size: 11 }),
        makeElement('数字日期', { x: 0.5, y: 0.94, width: 0.86, color: WHITE, size: 11 }),
        makeElement('英文类型', { x: 0.28, y: 0.06, width: 0.44, color: WHITE, size: 9 }),
        makeElement('余响标识', { x: 0.82, y: 0.06, width: 0.3, color: WHITE, alignment: '右对齐', size: 14 })
      ];
      t.elements[1].opacity = 0.85; t.elements[2].opacity = 0.85;
    } else if (kind === '信息票根') {
      t.aspect = 1.55; t.background = clone(CREAM);
      t.cover = sanitizeCover({ visible: true, x: 0.5, y: 0.3, width: 0.88, height: 0.44, cornerRadius: 14, rotation: 0, border: 0, opacity: 1, shadow: true, content: defaultPlacement() });
      t.elements = [
        makeElement('开场白', { x: 0.5, y: 0.575, width: 0.88, size: 10 }),
        makeElement('名称', { x: 0.5, y: 0.64, width: 0.88, size: 26 }),
        makeElement('日期', { x: 0.29, y: 0.75, width: 0.46, size: 11 }),
        makeElement('城市与场馆', { x: 0.71, y: 0.75, width: 0.38, alignment: '右对齐', size: 11 }),
        makeElement('金句', { x: 0.5, y: 0.84, width: 0.88, size: 14 }),
        makeElement('署名', { x: 0.29, y: 0.94, width: 0.46, size: 8 }),
        makeElement('条码', { x: 0.78, y: 0.94, width: 0.26, size: 12 })
      ];
      t.elements[0].color = colorFromHex('#6e58a8'); t.elements[0].tracking = 2; t.elements[0].weight = '半粗';
      t.elements[2].label = 'DATE'; t.elements[3].label = 'VENUE';
    } else {
      t.cover.visible = false;
    }
    return sanitize(t);
  }

  // MARK: - 示例记录（EventRecord.samples）

  function sampleDate(days, hour, minute) {
    var d = new Date();
    d.setDate(d.getDate() - days);
    d.setHours(hour, minute, 0, 0);
    return d;
  }
  function sampleID(n) { return '00000000-0000-4000-8000-' + String(n).padStart(12, '0'); }
  function memoryNumber(id) {
    var bytes = new TextEncoder().encode(id), value = 0;
    for (var i = 0; i < bytes.length; i++) value = (value * 31 + bytes[i]) % 10000;
    return String(value).padStart(4, '0');
  }

  function samples() {
    return [
      {
        id: sampleID(1), cover: 'sunset',
        title: '落日飞车', subtitle: '让浪漫发生 · 夏夜特别场',
        performers: '落日飞车 Sunset Rollercoaster',
        kindName: 'Livehouse', kindEnglish: 'LIVE',
        date: sampleDate(3, 19, 30), hasDate: true, hasTime: true,
        city: '上海', venue: '万代南梦宫上海文化中心',
        seat: '一层 · 站席', price: 380, currency: 'CNY', companions: '一起听歌的人',
        rating: 5, mood: '沉醉',
        note: '灯暗下来的那一秒，整个世界只剩下音乐。\n\n最后一首歌响起的时候，忽然想把这个夏天再过一遍。',
        quote: '把夏天调成慢速播放。',
        setlist: ['My Jinji', 'Burgundy Red', 'Vanilla', 'Candlelight']
      },
      {
        id: sampleID(2), cover: 'orbit',
        title: '星际穿越', subtitle: 'INTERSTELLAR · 4K 重映',
        performers: 'Matthew McConaughey / Anne Hathaway',
        kindName: '电影', kindEnglish: 'FILM',
        date: sampleDate(8, 19, 30), hasDate: true, hasTime: true,
        city: '上海', venue: '上海影城',
        seat: '8 排 12 座', price: 85, currency: 'CNY', companions: '',
        rating: 5, mood: '震撼',
        note: '在巨大的银幕前，我们都是宇宙里小小的一颗尘埃。',
        quote: '爱是我们能够感知的，超越时空维度的东西。',
        setlist: []
      },
      {
        id: sampleID(3), cover: 'curtain',
        title: '睡不醒的梦', subtitle: '2026 巡演 · 杭州站',
        performers: '余响实验剧团',
        kindName: '戏剧', kindEnglish: 'THEATRE',
        date: sampleDate(17, 19, 30), hasDate: true, hasTime: true,
        city: '杭州', venue: '杭州大剧院',
        seat: '池座 5 排 8 座', price: 280, currency: 'CNY', companions: '',
        rating: 4, mood: '回味',
        note: '散场之后，沿着河边走了很久。故事还没有结束。',
        quote: '有些相遇，像梦里亮着的一盏灯。',
        setlist: []
      },
      {
        id: sampleID(4), cover: 'bloom',
        title: '春日漫游音乐节', subtitle: '双日通票 · 苏州站',
        performers: '',
        kindName: '音乐节', kindEnglish: 'FESTIVAL',
        date: sampleDate(-14, 19, 30), hasDate: true, hasTime: true,
        city: '苏州', venue: '太湖音乐营地',
        seat: '', price: 399, currency: 'CNY', companions: '',
        rating: 0, mood: '期待',
        note: '', quote: '', setlist: []
      }
    ];
  }

  function defaultOptions() {
    return {
      accent: 'lilac', showDate: true, showVenue: true, showRating: true, showNote: true,
      showQuote: true, showSetlist: true, showAuthor: true,
      showPrice: false, showSeat: false, showCompanions: false,
      headline: '', author: '我'
    };
  }

  // MARK: - 字段取值（CardBits + TemplateText）

  function pad(n, width) { return String(n).padStart(width, '0'); }
  function bitsFor(record, options) {
    var d = record.date;
    var showDate = options.showDate && record.hasDate;
    return {
      record: record,
      options: options,
      kindName: record.kindName,
      kindEnglish: record.kindEnglish,
      headline: options.headline.trim() || null,
      date: showDate ? (d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日') : null,
      dateNumeric: showDate ? (pad(d.getFullYear(), 4) + '.' + pad(d.getMonth() + 1, 2) + '.' + pad(d.getDate(), 2)) : null,
      dayMonth: showDate ? (pad(d.getMonth() + 1, 2) + '.' + pad(d.getDate(), 2)) : null,
      year: showDate ? String(d.getFullYear()) : null,
      time: (options.showDate && record.hasTime) ? (pad(d.getHours(), 2) + ':' + pad(d.getMinutes(), 2)) : null,
      venueLine: (options.showVenue && [record.city, record.venue].filter(Boolean).length) ? [record.city, record.venue].filter(Boolean).join(' · ') : null,
      city: (options.showVenue && record.city) ? record.city : null,
      quote: (options.showQuote && record.quote) ? record.quote : null,
      note: (options.showNote && record.note) ? record.note : null,
      rating: (options.showRating && record.rating > 0) ? record.rating : null,
      mood: (options.showRating && record.mood) ? record.mood : null,
      price: options.showPrice && typeof record.price === 'number' ? (record.price.toFixed(2) + ' ' + record.currency) : null,
      seat: (options.showSeat && record.seat) ? record.seat : null,
      companions: (options.showCompanions && record.companions) ? record.companions : null,
      signature: options.showAuthor ? options.author : null,
      setlist: options.showSetlist ? record.setlist.slice() : []
    };
  }
  function stars(rating) {
    return new Array(rating + 1).join('★') + new Array(6 - rating).join('☆');
  }
  function rawValue(el, bits) {
    var r = bits.record;
    function present(text) { return text ? text : null; }
    switch (el.field) {
      case '名称': return present(r.title);
      case '副标题': return present(r.subtitle);
      case '艺人 / 卡司': return present(r.performers);
      case '类型': return bits.kindName;
      case '英文类型': return bits.kindEnglish;
      case '日期': return bits.date;
      case '数字日期': return bits.dateNumeric;
      case '时间': return bits.time;
      case '场馆': return bits.options.showVenue ? present(r.venue) : null;
      case '城市': return bits.city;
      case '城市与场馆': return bits.venueLine;
      case '月日': return bits.dayMonth;
      case '年份': return bits.year;
      case '评分星星': return bits.rating === null ? null : stars(bits.rating);
      case '心情': return present(bits.mood);
      case '金句': return bits.quote;
      case '感想': return bits.note;
      case '曲目单': return bits.setlist.length ? bits.setlist.join('\n') : null;
      case '票价': return bits.price;
      case '座位': return bits.seat;
      case '同行人': return bits.companions;
      case '开场白': return bits.headline;
      case '署名': return bits.signature ? 'COLLECTED BY ' + bits.signature : null;
      case '余响标识': return 'LIVEMARK';
      case '编号': return 'NO. ' + memoryNumber(r.id);
      case '条码': return r.id.toUpperCase();
      default: return present(el.text);
    }
  }
  function textValue(el, bits) {
    var raw = rawValue(el, bits);
    if (raw === null || raw === undefined) return null;
    return el.uppercase ? String(raw).toUpperCase() : String(raw);
  }

  global.LM = {
    CANVAS_W: CANVAS_W, DEFAULT_EXPORT_WIDTH: DEFAULT_EXPORT_WIDTH, EXPORT_WIDTH_RANGE: EXPORT_WIDTH_RANGE,
    ASPECT_RANGE: ASPECT_RANGE, SCALE_RANGE: SCALE_RANGE, OFFSET_RANGE: OFFSET_RANGE, TILT_RANGE: TILT_RANGE,
    MAX_ELEMENTS: MAX_ELEMENTS, MAX_BYTES: MAX_BYTES, MAX_VIDEO_BYTES: MAX_VIDEO_BYTES, MAX_FILE_BYTES: MAX_FILE_BYTES,
    ACCENTS: ACCENTS, COLOR_PRESETS: COLOR_PRESETS, WEIGHTS: WEIGHTS, WEIGHT_CSS: WEIGHT_CSS,
    DESIGNS: DESIGNS, ALIGNMENTS: ALIGNMENTS, ACCENT_MODES: ACCENT_MODES, SHAPES: SHAPES,
    FIELDS: FIELDS, FIELD_GROUPS: FIELD_GROUPS, fieldInfo: fieldInfo, fieldName: fieldName,
    ASPECT_PRESETS: [['3:4', 4 / 3], ['4:5', 1.25], ['1:1', 1], ['9:16', 16 / 9], ['2:3', 1.5]],
    clamp: clamp, clone: clone, prefix: prefix,
    color: color, colorFromHex: colorFromHex, clampColor: clampColor, colorHex: colorHex, colorCSS: colorCSS,
    luminance: luminance, isDark: isDark, contrasting: contrasting,
    INK: INK, CREAM: CREAM, WHITE: WHITE, NIGHT: NIGHT,
    uuid: uuid, isoNow: isoNow,
    defaultPlacement: defaultPlacement, defaultCover: defaultCover, defaultElement: defaultElement,
    defaultTemplate: defaultTemplate, makeElement: makeElement, makeShape: makeShape,
    hasImage: hasImage, isShape: isShape, isLivePhoto: isLivePhoto, frameAspect: frameAspect,
    canvasHeight: canvasHeight, exportPixelWidth: exportPixelWidth, exportPixelHeight: exportPixelHeight,
    isAspectLocked: isAspectLocked, setExportWidth: setExportWidth, setExportHeight: setExportHeight,
    hasLivePhoto: hasLivePhoto, coverSplit: coverSplit,
    sanitize: sanitize, sanitizeElement: sanitizeElement, sanitizeCover: sanitizeCover, sanitizePlacement: sanitizePlacement,
    stableStringify: stableStringify, encodeDocument: encodeDocument, decodeDocument: decodeDocument,
    fileName: fileName, isSupportedImage: isSupportedImage, isSupportedVideo: isSupportedVideo,
    base64ByteCount: base64ByteCount, DocumentError: DocumentError,
    STARTERS: STARTERS, starter: starter,
    samples: samples, defaultOptions: defaultOptions, bitsFor: bitsFor,
    textValue: textValue, rawValue: rawValue, memoryNumber: memoryNumber
  };
})(window);
