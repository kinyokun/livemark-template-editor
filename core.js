// 由 scripts/build_web_editor.js 从 App 的 TypeScript 源码生成，不要手改。
// 源文件：src/core/template/model.ts、src/core/template/layout.ts、src/core/template/document.ts、src/core/template/builtins.ts、src/features/share/scene.ts
//
// 浏览器里用 window.LMCore 拿到它们的全部导出（同名的按 core/template/model → core/template/layout → core/template/document → core/template/builtins → share/scene 覆盖）。
(function (global) {
  'use strict';

  var ALIASES = {
    "@/core/template/model": "core/template/model",
    "@/core/template/layout": "core/template/layout",
    "@/core/template/document": "core/template/document",
    "@/core/template/builtins": "core/template/builtins",
    "@/core/labels": "shims/labels",
    "@/core/models": "shims/models",
    "@/i18n": "shims/i18n"
  };
  var factories = {};
  var cache = {};

  function define(id, factory) { factories[id] = factory; }

  function join(from, request) {
    var parts = from.split('/').slice(0, -1).concat(request.split('/'));
    var stack = [];
    for (var i = 0; i < parts.length; i++) {
      var part = parts[i];
      if (part === '.' || part === '') continue;
      if (part === '..') { stack.pop(); continue; }
      stack.push(part);
    }
    return stack.join('/');
  }

  function requireFrom(from) {
    return function (request) {
      var id = request.charAt(0) === '.' ? join(from, request) : (ALIASES[request] || request);
      if (cache[id]) return cache[id].exports;
      var factory = factories[id];
      if (!factory) throw new Error('模块找不到：' + request + '（来自 ' + from + '）');
      var module = { exports: {} };
      cache[id] = module;
      factory(module, module.exports, requireFrom(id));
      return module.exports;
    };
  }

  define("core/template/model", function (module, exports, require) {
    "use strict";
    // 分享模版的纯数据模型（海报体系 v2：响应式盒子树）。
    // 设计规格见 Documentation/POSTER.md 第 1 节。
    //
    // v1 是「一张固定比例的画布上堆绝对定位的元素」；v2 改成一棵盒子树：
    // 每个 stack 按 Figma Auto Layout / CSS flex 的规则摆放子节点，字段没值时那一块整个收起，
    // 画布高度跟着内容走。排版规则不在这里，在 layout.ts；这里只有数据：默认值、取值范围、
    // 清洗（sanitize）、树的编辑操作，以及「一个字段印什么字」。
    //
    // 不 import react / react-native / expo；随机数与时间可注入，方便测试。
    // 长度单位一律是 pt，画布宽固定 360 pt；导出时整棵树按 exportWidth / 360 放大。
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.STARTERS = exports.TEMPLATE_NODE_KINDS = exports.ZERO_PADDING = exports.ANCHORS = exports.JUSTIFIES = exports.ALIGNS = exports.TEMPLATE_FIELD_GROUPS = exports.TEMPLATE_FIELDS = exports.TEMPLATE_SHAPES = exports.TEMPLATE_ACCENTS = exports.TEMPLATE_ALIGNMENTS = exports.TEMPLATE_FONT_DESIGNS = exports.TEMPLATE_WEIGHTS = exports.COLOR_PRESETS = exports.Palette = exports.IMAGE_ASPECT_PRESETS = exports.ASPECT_PRESETS = exports.TILT_RANGE = exports.ZOOM_RANGE = exports.FOCUS_RANGE = exports.IMAGE_ASPECT_RANGE = exports.GROW_RANGE = exports.OFFSET_RANGE = exports.FRACTION_RANGE = exports.SIZE_RANGE = exports.BORDER_RANGE = exports.DASH_RANGE = exports.STROKE_RANGE = exports.CORNER_RADIUS_RANGE = exports.PADDING_RANGE = exports.GAP_RANGE = exports.OPACITY_RANGE = exports.ROTATION_RANGE = exports.LINE_LIMIT_RANGE = exports.TRACKING_RANGE = exports.FONT_SIZE_RANGE = exports.MAX_NAME_LENGTH = exports.MAX_DEPTH = exports.MAX_NODES = exports.DEFAULT_TEMPLATE_NAME = exports.ASPECT_RANGE = exports.EXPORT_WIDTH_RANGE = exports.EXPORT_WIDTH_PRESETS = exports.DEFAULT_EXPORT_WIDTH = exports.CANVAS_WIDTH = void 0;
    exports.makeColor = makeColor;
    exports.colorFromHex = colorFromHex;
    exports.colorFromHexString = colorFromHexString;
    exports.clampColor = clampColor;
    exports.colorHexString = colorHexString;
    exports.colorLuminance = colorLuminance;
    exports.isDarkColor = isDarkColor;
    exports.contrastingColor = contrastingColor;
    exports.colorDistance = colorDistance;
    exports.isPrivateField = isPrivateField;
    exports.templateFieldSymbol = templateFieldSymbol;
    exports.fieldGroup = fieldGroup;
    exports.suggestedSize = suggestedSize;
    exports.suggestedWeight = suggestedWeight;
    exports.suggestedDesign = suggestedDesign;
    exports.clamp = clamp;
    exports.roundHalfAwayFromZero = roundHalfAwayFromZero;
    exports.prefixChars = prefixChars;
    exports.isUUID = isUUID;
    exports.randomUUID = randomUUID;
    exports.isoString = isoString;
    exports.resolveEnvironment = resolveEnvironment;
    exports.padding = padding;
    exports.isZeroPadding = isZeroPadding;
    exports.isStackNode = isStackNode;
    exports.isTextNode = isTextNode;
    exports.isImageNode = isImageNode;
    exports.isShapeNode = isShapeNode;
    exports.isSpacerNode = isSpacerNode;
    exports.defaultShapeHeight = defaultShapeHeight;
    exports.defaultCanvas = defaultCanvas;
    exports.defaultTextNode = defaultTextNode;
    exports.makeTextNode = makeTextNode;
    exports.makeImageNode = makeImageNode;
    exports.makeShapeNode = makeShapeNode;
    exports.makeStackNode = makeStackNode;
    exports.makeSpacerNode = makeSpacerNode;
    exports.defaultTemplate = defaultTemplate;
    exports.nodeHasOwnImage = nodeHasOwnImage;
    exports.nodeIsLivePhoto = nodeIsLivePhoto;
    exports.templateHasImage = templateHasImage;
    exports.templateHasLivePhoto = templateHasLivePhoto;
    exports.exportPixelWidth = exportPixelWidth;
    exports.exportScale = exportScale;
    exports.walkNodes = walkNodes;
    exports.countNodes = countNodes;
    exports.treeDepth = treeDepth;
    exports.findNode = findNode;
    exports.parentOf = parentOf;
    exports.nodePath = nodePath;
    exports.mapNodes = mapNodes;
    exports.replaceNode = replaceNode;
    exports.updateNode = updateNode;
    exports.insertInto = insertInto;
    exports.insertAfter = insertAfter;
    exports.removeNode = removeNode;
    exports.moveNode = moveNode;
    exports.wrapNode = wrapNode;
    exports.unwrapNode = unwrapNode;
    exports.sanitizeSizeRule = sanitizeSizeRule;
    exports.sanitizePadding = sanitizePadding;
    exports.sanitizeNode = sanitizeNode;
    exports.sanitizeCanvasImage = sanitizeCanvasImage;
    exports.sanitizeCanvas = sanitizeCanvas;
    exports.sanitizeTemplate = sanitizeTemplate;
    exports.starterSubtitle = starterSubtitle;
    exports.starterTemplate = starterTemplate;
    exports.defaultPosterOptions = defaultPosterOptions;
    exports.formatLongDate = formatLongDate;
    exports.formatTime = formatTime;
    exports.starsText = starsText;
    exports.memoryNumber = memoryNumber;
    exports.makeCardBits = makeCardBits;
    exports.templateText = templateText;
    // MARK: - 常量
    exports.CANVAS_WIDTH = 360;
    exports.DEFAULT_EXPORT_WIDTH = 1080;
    /** 导出宽度的三枚芯片；高度永远跟排版走，所以只有宽度可选。 */
    exports.EXPORT_WIDTH_PRESETS = [1080, 1440, 2160];
    exports.EXPORT_WIDTH_RANGE = [540, 2160];
    /** 画布固定比例时的高 / 宽。 */
    exports.ASPECT_RANGE = [0.5, 2.2];
    exports.DEFAULT_TEMPLATE_NAME = '我的模版';
    /** 一棵树最多 120 个节点、最深 8 层（根算第 1 层）。 */
    exports.MAX_NODES = 120;
    exports.MAX_DEPTH = 8;
    exports.MAX_NAME_LENGTH = 40;
    // 数值范围：sanitize 一律按这些夹住，模版永远编码不出 NaN，也不会排出天文数字。
    exports.FONT_SIZE_RANGE = [6, 120];
    exports.TRACKING_RANGE = [-2, 12];
    exports.LINE_LIMIT_RANGE = [1, 20];
    exports.ROTATION_RANGE = [-180, 180];
    exports.OPACITY_RANGE = [0.05, 1];
    exports.GAP_RANGE = [0, 200];
    exports.PADDING_RANGE = [0, 200];
    exports.CORNER_RADIUS_RANGE = [0, 200];
    exports.STROKE_RANGE = [0, 40];
    exports.DASH_RANGE = [0, 80];
    exports.BORDER_RANGE = [0, 40];
    /** 固定 pt 的宽 / 高，以及 min/max。 */
    exports.SIZE_RANGE = [0, 2000];
    /** `{ fraction }` 是父内容盒的比例。 */
    exports.FRACTION_RANGE = [0.02, 2];
    /** 绝对定位相对锚点的位移（pt）。 */
    exports.OFFSET_RANGE = [-1000, 1000];
    /** 主轴 `fill` 的权重。 */
    exports.GROW_RANGE = [0, 100];
    /** 图片框的高 / 宽。 */
    exports.IMAGE_ASPECT_RANGE = [0.02, 50];
    // 图在框里的显示区域（POSTER.md 第 3 节）：object-position + 放大 + 倾斜。
    exports.FOCUS_RANGE = [0, 1];
    exports.ZOOM_RANGE = [1, 3];
    exports.TILT_RANGE = [-45, 45];
    /** 画布固定比例的预设，值是 高 / 宽。 */
    exports.ASPECT_PRESETS = [
        ['3:4', 4 / 3],
        ['4:5', 1.25],
        ['1:1', 1],
        ['9:16', 16 / 9],
        ['2:3', 1.5],
    ];
    /** 图片框比例的预设，值是 高 / 宽；`原图` 表示跟着图片本身，不裁。 */
    exports.IMAGE_ASPECT_PRESETS = [
        ['原图', 'natural'],
        ['1:1', 1],
        ['4:5', 1.25],
        ['3:4', 4 / 3],
        ['16:9', 9 / 16],
        ['2:3', 1.5],
    ];
    function makeColor(red, green, blue, alpha = 1) {
        return { red, green, blue, alpha };
    }
    /** 0xRRGGBB + 可选 alpha，和 Swift 的 `ColorValue(hex:alpha:)` 一致。 */
    function colorFromHex(hex, alpha = 1) {
        return makeColor(((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255, alpha);
    }
    /** 接受 `#rrggbb`、`rrggbb`、`#rrggbbaa`；不合法返回 null。 */
    function colorFromHexString(hexString) {
        let text = String(hexString !== null && hexString !== void 0 ? hexString : '').trim();
        if (text.startsWith('#'))
            text = text.slice(1);
        if (!/^[0-9a-fA-F]+$/.test(text) || (text.length !== 6 && text.length !== 8))
            return null;
        const value = parseInt(text, 16);
        if (text.length === 6)
            return colorFromHex(value);
        return makeColor(((value >>> 24) & 255) / 255, ((value >>> 16) & 255) / 255, ((value >>> 8) & 255) / 255, (value & 255) / 255);
    }
    function clampColor(value) {
        const fix = (v, fallback) => typeof v === 'number' && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : fallback;
        if (!value || typeof value !== 'object')
            return makeColor(0, 0, 0, 1);
        const color = value;
        return makeColor(fix(color.red, 0), fix(color.green, 0), fix(color.blue, 0), fix(color.alpha, 1));
    }
    /** `#rrggbb`，alpha < 0.999 时补两位。 */
    function colorHexString(value) {
        const c = clampColor(value);
        const part = (v) => {
            const s = Math.round(v * 255).toString(16);
            return s.length < 2 ? '0' + s : s;
        };
        const base = '#' + part(c.red) + part(c.green) + part(c.blue);
        return c.alpha < 0.999 ? base + part(c.alpha) : base;
    }
    /** sRGB 相对亮度，黑 0 白 1。 */
    function colorLuminance(value) {
        const c = clampColor(value);
        const linear = (channel) => channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
        return 0.2126 * linear(c.red) + 0.7152 * linear(c.green) + 0.0722 * linear(c.blue);
    }
    function isDarkColor(value) {
        return colorLuminance(value) < 0.4;
    }
    /** 压在这个颜色上还读得清的墨色或米色。 */
    function contrastingColor(value) {
        return isDarkColor(value) ? { ...exports.Palette.cream } : { ...exports.Palette.ink };
    }
    function colorDistance(a, b) {
        const dr = a.red - b.red;
        const dg = a.green - b.green;
        const db = a.blue - b.blue;
        return Math.sqrt(dr * dr + dg * dg + db * db);
    }
    /** ColorValue 的命名色，和 Swift 的静态常量同名同值。 */
    exports.Palette = {
        ink: colorFromHex(0x20251f),
        cream: colorFromHex(0xf6f3e9),
        white: colorFromHex(0xffffff),
        black: colorFromHex(0x000000),
        night: colorFromHex(0x141618),
        stamp: colorFromHex(0xc4553f),
        gold: colorFromHex(0xc9a24a),
        lilac: colorFromHex(0xbba7ef),
        lime: colorFromHex(0xd8eb97),
        coral: colorFromHex(0xf4ab8e),
        sky: colorFromHex(0xadcfe5),
    };
    /** 每个颜色控件旁边的快捷色，顺序同 Swift 的 `ColorValue.presets`。 */
    exports.COLOR_PRESETS = [
        exports.Palette.ink,
        exports.Palette.white,
        exports.Palette.cream,
        exports.Palette.night,
        exports.Palette.stamp,
        exports.Palette.gold,
        exports.Palette.lilac,
        exports.Palette.lime,
        exports.Palette.coral,
        exports.Palette.sky,
    ];
    // MARK: - 枚举
    exports.TEMPLATE_WEIGHTS = ['细', '常规', '中等', '半粗', '粗体', '特粗'];
    exports.TEMPLATE_FONT_DESIGNS = ['黑体', '宋体', '圆体', '等宽'];
    exports.TEMPLATE_ALIGNMENTS = ['左对齐', '居中', '右对齐'];
    exports.TEMPLATE_ACCENTS = ['主题色', '主题深色'];
    exports.TEMPLATE_SHAPES = [
        '矩形',
        '圆形',
        '直线',
        '唱片纹',
        '点阵',
        '胶片孔',
        '锯齿边',
        '渐变',
    ];
    exports.TEMPLATE_FIELDS = [
        '名称',
        '副标题',
        '艺人 / 卡司',
        '类型',
        '英文类型',
        '日期',
        '数字日期',
        '时间',
        '场馆',
        '城市',
        '城市与场馆',
        '月日',
        '年份',
        '评分星星',
        '心情',
        '金句',
        '感想',
        '曲目单',
        '票价',
        '座位',
        '同行人',
        '开场白',
        '署名',
        '余响标识',
        '编号',
        '条码',
        '自定义文字',
    ];
    exports.TEMPLATE_FIELD_GROUPS = [
        '基本信息',
        '时间与地点',
        '我的感受',
        '私人信息',
        '装饰与署名',
    ];
    /** 座位、票价、同行人：分享开关没打开就不印。 */
    const PRIVATE_FIELDS = ['票价', '座位', '同行人'];
    function isPrivateField(field) {
        return PRIVATE_FIELDS.includes(field);
    }
    const TEMPLATE_FIELD_SYMBOLS = {
        名称: 'textformat',
        副标题: 'text.alignleft',
        '艺人 / 卡司': 'person.2',
        类型: 'square.grid.2x2',
        英文类型: 'textformat.abc',
        日期: 'calendar',
        数字日期: 'number',
        时间: 'clock',
        场馆: 'building.2',
        城市: 'mappin',
        城市与场馆: 'mappin.and.ellipse',
        月日: 'calendar.day.timeline.left',
        年份: 'calendar.badge.clock',
        评分星星: 'star',
        心情: 'face.smiling',
        金句: 'quote.opening',
        感想: 'text.quote',
        曲目单: 'music.note.list',
        票价: 'yensign',
        座位: 'chair',
        同行人: 'figure.2',
        开场白: 'text.bubble',
        署名: 'signature',
        余响标识: 'sparkle',
        编号: 'number',
        条码: 'barcode',
        自定义文字: 'square.and.pencil',
    };
    /** 「添加元素」菜单里每个字段行首的图标；和记录字段（`recordFieldSymbol`）用同一套字形。 */
    function templateFieldSymbol(field) {
        return TEMPLATE_FIELD_SYMBOLS[field];
    }
    function fieldGroup(field) {
        switch (field) {
            case '名称':
            case '副标题':
            case '艺人 / 卡司':
            case '类型':
            case '英文类型':
                return '基本信息';
            case '日期':
            case '数字日期':
            case '时间':
            case '场馆':
            case '城市':
            case '城市与场馆':
            case '月日':
            case '年份':
                return '时间与地点';
            case '评分星星':
            case '心情':
            case '金句':
            case '感想':
            case '曲目单':
                return '我的感受';
            case '票价':
            case '座位':
            case '同行人':
                return '私人信息';
            default:
                return '装饰与署名';
        }
    }
    function suggestedSize(field) {
        switch (field) {
            case '名称':
                return 28;
            case '金句':
                return 15;
            case '余响标识':
                return 16;
            case '英文类型':
            case '编号':
            case '署名':
            case '开场白':
                return 10;
            default:
                return 12;
        }
    }
    function suggestedWeight(field) {
        switch (field) {
            case '名称':
            case '余响标识':
            case '月日':
                return '特粗';
            case '数字日期':
            case '类型':
            case '英文类型':
            case '编号':
                return '粗体';
            case '金句':
                return '中等';
            default:
                return '常规';
        }
    }
    function suggestedDesign(field) {
        switch (field) {
            case '金句':
            case '感想':
                return '宋体';
            case '英文类型':
            case '编号':
            case '署名':
            case '时间':
            case '数字日期':
            case '年份':
                return '等宽';
            default:
                return '黑体';
        }
    }
    // MARK: - 数值工具
    function clamp(value, range, fallback) {
        if (typeof value !== 'number' || !Number.isFinite(value))
            return fallback;
        return Math.min(range[1], Math.max(range[0], value));
    }
    function num(value, fallback) {
        return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
    }
    /** Swift 的 `rounded()` 是四舍五入并远离零；JS 的 Math.round 对负半数不一样。 */
    function roundHalfAwayFromZero(value) {
        return value < 0 ? -Math.round(-value) : Math.round(value);
    }
    /** Swift `String.prefix(n)`：按字符数截断。 */
    function prefixChars(text, n) {
        return Array.from(String(text !== null && text !== void 0 ? text : '')).slice(0, n).join('');
    }
    function optionalBool(value) {
        return value === undefined || value === null ? undefined : !!value;
    }
    function optionalClamp(value, range, fallback) {
        return value === undefined || value === null ? undefined : clamp(value, range, fallback);
    }
    // MARK: - 身份与时间（可注入）
    const UUID_PATTERN = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    function isUUID(text) {
        return typeof text === 'string' && UUID_PATTERN.test(text);
    }
    /** 大写连字符 UUID v4，和 Swift `UUID().uuidString` 一样的写法。 */
    function randomUUID() {
        const bytes = new Uint8Array(16);
        const crypto = globalThis.crypto;
        if (crypto && typeof crypto.getRandomValues === 'function') {
            crypto.getRandomValues(bytes);
        }
        else {
            for (let i = 0; i < 16; i++)
                bytes[i] = Math.floor(Math.random() * 256);
        }
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        const hex = [];
        for (let i = 0; i < 16; i++) {
            const s = bytes[i].toString(16).toUpperCase();
            hex.push(s.length < 2 ? '0' + s : s);
        }
        return (hex.slice(0, 4).join('') +
            '-' +
            hex.slice(4, 6).join('') +
            '-' +
            hex.slice(6, 8).join('') +
            '-' +
            hex.slice(8, 10).join('') +
            '-' +
            hex.slice(10, 16).join(''));
    }
    /** Swift 的 `.iso8601` 不带小数秒。 */
    function isoString(date = new Date()) {
        return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
    }
    function resolveEnvironment(env) {
        var _a, _b;
        return { newID: (_a = env === null || env === void 0 ? void 0 : env.newID) !== null && _a !== void 0 ? _a : randomUUID, now: (_b = env === null || env === void 0 ? void 0 : env.now) !== null && _b !== void 0 ? _b : (() => isoString()) };
    }
    /** 交叉轴对齐；`stretch` 对 hug 节点等于 `start`。 */
    exports.ALIGNS = ['start', 'center', 'end', 'stretch'];
    /** 主轴分布；只有父有确定高 / 宽且有剩余时才看得出来。 */
    exports.JUSTIFIES = [
        'start',
        'center',
        'end',
        'spaceBetween',
        'spaceAround',
        'spaceEvenly',
    ];
    /** 绝对定位的锚点（九宫格），相对父的 padding box。 */
    exports.ANCHORS = [
        'topLeft',
        'top',
        'topRight',
        'left',
        'center',
        'right',
        'bottomLeft',
        'bottom',
        'bottomRight',
    ];
    exports.ZERO_PADDING = { top: 0, right: 0, bottom: 0, left: 0 };
    function padding(a, b, c, d) {
        if (b === undefined)
            return { top: a, right: a, bottom: a, left: a };
        if (c === undefined)
            return { top: a, right: b, bottom: a, left: b };
        return { top: a, right: b, bottom: c !== null && c !== void 0 ? c : 0, left: d !== null && d !== void 0 ? d : 0 };
    }
    function isZeroPadding(value) {
        return !value || (!value.top && !value.right && !value.bottom && !value.left);
    }
    exports.TEMPLATE_NODE_KINDS = ['stack', 'text', 'image', 'shape', 'spacer'];
    function isStackNode(node) {
        return node.kind === 'stack';
    }
    function isTextNode(node) {
        return node.kind === 'text';
    }
    function isImageNode(node) {
        return node.kind === 'image';
    }
    function isShapeNode(node) {
        return node.kind === 'shape';
    }
    function isSpacerNode(node) {
        return node.kind === 'spacer';
    }
    // MARK: - 默认值与工厂
    /** 形状没给高度时的缺省高：直线 1 pt，其余 40 pt。 */
    function defaultShapeHeight(shape) {
        return shape === '直线' ? 1 : 40;
    }
    function defaultCanvas() {
        return {
            width: exports.CANVAS_WIDTH,
            height: 'hug',
            padding: padding(24),
            background: { ...exports.Palette.cream },
        };
    }
    function defaultTextNode(field, env) {
        return {
            kind: 'text',
            id: resolveEnvironment(env).newID(),
            field,
            text: field === '自定义文字' ? '写点什么' : '',
            label: '',
            fontSize: suggestedSize(field),
            weight: suggestedWeight(field),
            design: suggestedDesign(field),
            alignment: '左对齐',
            color: { ...exports.Palette.ink },
            // 全大写的英文小字排得开一点才好看，和 v1 的 makeElement 一致。
            tracking: field === '英文类型' || field === '编号' || field === '署名' ? 2 : 0,
            lineLimit: 3,
            uppercase: false,
        };
    }
    function makeTextNode(field, overrides = {}, env) {
        return definedOnly({ ...defaultTextNode(field, env), ...overrides, kind: 'text', field });
    }
    function makeImageNode(source, overrides = {}, env) {
        const base = {
            kind: 'image',
            id: resolveEnvironment(env).newID(),
            source,
            // 记录封面不知道原图多大，先按正方形；自带的图缺省不裁，跟着原图比例。
            aspect: source === 'cover' ? 1 : 'natural',
            fit: 'cover',
            focusX: 0.5,
            focusY: 0.5,
            zoom: 1,
            tilt: 0,
        };
        return definedOnly({ ...base, ...overrides, kind: 'image', source });
    }
    function makeShapeNode(shape, overrides = {}, env) {
        const base = {
            kind: 'shape',
            id: resolveEnvironment(env).newID(),
            shape,
            color: { ...exports.Palette.ink },
        };
        return definedOnly({ ...base, ...overrides, kind: 'shape', shape });
    }
    function makeStackNode(direction, overrides = {}, env) {
        const base = {
            kind: 'stack',
            id: resolveEnvironment(env).newID(),
            direction,
            children: [],
        };
        return definedOnly({ ...base, ...overrides, kind: 'stack', direction });
    }
    function makeSpacerNode(env) {
        return { kind: 'spacer', id: resolveEnvironment(env).newID() };
    }
    function defaultTemplate(env) {
        const e = resolveEnvironment(env);
        const now = e.now();
        return {
            id: e.newID(),
            name: exports.DEFAULT_TEMPLATE_NAME,
            canvas: defaultCanvas(),
            root: makeStackNode('column', { gap: 12 }, env),
            createdAt: now,
            updatedAt: now,
        };
    }
    // MARK: - 节点性质
    function nodeHasOwnImage(node) {
        return node.source !== 'cover';
    }
    function nodeIsLivePhoto(node) {
        return isImageNode(node) && !!node.video;
    }
    function templateHasImage(template) {
        const image = template.canvas.image;
        return !!image && (!!image.data || !!image.asset);
    }
    function templateHasLivePhoto(template) {
        let found = false;
        walkNodes(template.root, (node) => {
            if (nodeIsLivePhoto(node))
                found = true;
        });
        return found;
    }
    /** 导出宽度（px）；缺省 1080。高度只有排完版才知道，所以没有 exportPixelHeight。 */
    function exportPixelWidth(template) {
        const width = template.canvas.exportWidth;
        return typeof width === 'number' && Number.isFinite(width) ? width : exports.DEFAULT_EXPORT_WIDTH;
    }
    /** 360 pt 画布到导出像素的倍数。 */
    function exportScale(template) {
        return exportPixelWidth(template) / exports.CANVAS_WIDTH;
    }
    /** 前序遍历：父先于子，子按 children 的顺序（画的顺序另见 layout.ts）。 */
    function walkNodes(root, visit) {
        const step = (node, parent, depth, index) => {
            visit(node, { parent, depth, index });
            if (isStackNode(node)) {
                node.children.forEach((child, childIndex) => step(child, node, depth + 1, childIndex));
            }
        };
        step(root, null, 1, 0);
    }
    function countNodes(root) {
        let count = 0;
        walkNodes(root, () => {
            count += 1;
        });
        return count;
    }
    /** 根算第 1 层。 */
    function treeDepth(root) {
        let deepest = 0;
        walkNodes(root, (_node, info) => {
            if (info.depth > deepest)
                deepest = info.depth;
        });
        return deepest;
    }
    function findNode(root, id) {
        let found = null;
        walkNodes(root, (node) => {
            if (!found && node.id === id)
                found = node;
        });
        return found;
    }
    function parentOf(root, id) {
        let found = null;
        walkNodes(root, (node, info) => {
            if (!found && node.id === id)
                found = info.parent;
        });
        return found;
    }
    /** 从根到这个节点的 id 串（含自己）；找不到就是空数组。 */
    function nodePath(root, id) {
        const path = [];
        const step = (node, trail) => {
            const next = [...trail, node.id];
            if (node.id === id) {
                path.push(...next);
                return true;
            }
            return isStackNode(node) ? node.children.some((child) => step(child, next)) : false;
        };
        step(root, []);
        return path;
    }
    /** 自底向上映射：先映射子节点，再把带着新子节点的自己交给 fn。 */
    function mapNodes(root, fn) {
        const mapped = isStackNode(root)
            ? { ...root, children: root.children.map((child) => mapNodes(child, fn)) }
            : root;
        return fn(mapped);
    }
    /** 同 mapNodes，但保证根还是 stack（fn 想把根换成别的类型时原样退回）。 */
    function mapRoot(root, fn) {
        const next = mapNodes(root, fn);
        return isStackNode(next) ? next : root;
    }
    function replaceNode(root, id, next) {
        return mapRoot(root, (node) => (node.id === id ? next : node));
    }
    function updateNode(root, id, fn) {
        return mapRoot(root, (node) => (node.id === id ? fn(node) : node));
    }
    /** 装进某个容器；`index` 省略就放在末尾。 */
    function insertInto(root, parentID, node, index) {
        return mapRoot(root, (current) => {
            if (current.id !== parentID || !isStackNode(current))
                return current;
            const children = current.children.slice();
            const at = index === undefined ? children.length : Math.min(children.length, Math.max(0, index));
            children.splice(at, 0, node);
            return { ...current, children };
        });
    }
    /** 插在某个节点之后；目标是容器（或就是根）时插进它末尾。 */
    function insertAfter(root, siblingID, node) {
        const target = findNode(root, siblingID);
        if (!target)
            return insertInto(root, root.id, node);
        if (isStackNode(target))
            return insertInto(root, siblingID, node);
        const parent = parentOf(root, siblingID);
        if (!parent)
            return insertInto(root, root.id, node);
        const index = parent.children.findIndex((child) => child.id === siblingID);
        return insertInto(root, parent.id, node, index + 1);
    }
    function removeNode(root, id) {
        if (root.id === id)
            return root; // 根删不掉
        return mapRoot(root, (node) => isStackNode(node)
            ? { ...node, children: node.children.filter((child) => child.id !== id) }
            : node);
    }
    /** 在兄弟里上移 / 下移一位；到头了就原样返回。 */
    function moveNode(root, id, direction) {
        const parent = parentOf(root, id);
        if (!parent)
            return root;
        const index = parent.children.findIndex((child) => child.id === id);
        const target = direction === 'up' ? index - 1 : index + 1;
        if (index < 0 || target < 0 || target >= parent.children.length)
            return root;
        const children = parent.children.slice();
        const [moved] = children.splice(index, 1);
        children.splice(target, 0, moved);
        return replaceNode(root, parent.id, { ...parent, children });
    }
    /** 装进一个新容器（行 / 列）；新容器顶替它原来的位置。 */
    function wrapNode(root, id, direction, env) {
        const node = findNode(root, id);
        if (!node || node.id === root.id)
            return root;
        const wrapper = makeStackNode(direction, { children: [node] }, env);
        return replaceNode(root, id, wrapper);
    }
    /**
     * 移出到父级：把节点从它所在的容器里拿出来，放在那个容器后面；
     * 容器因此空掉就一并删除（正好是 wrapNode 的逆操作）。已经在根里的节点没有「外面」，原样返回。
     */
    function unwrapNode(root, id) {
        const parent = parentOf(root, id);
        if (!parent || parent.id === root.id)
            return root;
        const grand = parentOf(root, parent.id);
        if (!grand)
            return root;
        const node = findNode(parent, id);
        if (!node)
            return root;
        const trimmed = {
            ...parent,
            children: parent.children.filter((child) => child.id !== id),
        };
        const children = [];
        for (const child of grand.children) {
            if (child.id !== parent.id) {
                children.push(child);
                continue;
            }
            if (trimmed.children.length > 0)
                children.push(trimmed);
            children.push(node);
        }
        return replaceNode(root, grand.id, { ...grand, children });
    }
    // MARK: - 清洗
    function definedOnly(value) {
        const out = {};
        for (const [key, entry] of Object.entries(value)) {
            if (entry !== undefined)
                out[key] = entry;
        }
        return out;
    }
    /**
     * 等于缺省值的可选字段一律收成 undefined，模型因此是「规范形」：
     * 文件里省掉缺省值、读回来又是同一棵树，往返严格相等。
     */
    function dropDefault(value, fallback) {
        return value === undefined || value === fallback ? undefined : value;
    }
    function enumOrUndefined(raw, values) {
        return values.includes(raw) ? raw : undefined;
    }
    function accentOrUndefined(raw) {
        return enumOrUndefined(raw, exports.TEMPLATE_ACCENTS);
    }
    function sanitizeSizeRule(raw) {
        if (raw === 'hug' || raw === 'fill')
            return raw;
        if (typeof raw === 'number' && Number.isFinite(raw))
            return clamp(raw, exports.SIZE_RANGE, 0);
        if (raw && typeof raw === 'object') {
            const fraction = raw.fraction;
            if (typeof fraction === 'number' && Number.isFinite(fraction)) {
                return { fraction: clamp(fraction, exports.FRACTION_RANGE, 1) };
            }
        }
        return undefined;
    }
    /** 四边都是 0 的内边距等于没有内边距，省掉它，编码与比较都干净。 */
    function sanitizePadding(raw) {
        if (!raw || typeof raw !== 'object')
            return undefined;
        const value = raw;
        const box = {
            top: clamp(value.top, exports.PADDING_RANGE, 0),
            right: clamp(value.right, exports.PADDING_RANGE, 0),
            bottom: clamp(value.bottom, exports.PADDING_RANGE, 0),
            left: clamp(value.left, exports.PADDING_RANGE, 0),
        };
        return isZeroPadding(box) ? undefined : box;
    }
    function sanitizeStroke(raw) {
        if (!raw || typeof raw !== 'object')
            return undefined;
        const value = raw;
        return definedOnly({
            width: clamp(value.width, exports.STROKE_RANGE, 1),
            color: clampColor(value.color),
            accent: accentOrUndefined(value.accent),
            dashLength: dropDefault(optionalClamp(value.dashLength, exports.DASH_RANGE, 0), 0),
            dashGap: dropDefault(optionalClamp(value.dashGap, exports.DASH_RANGE, 0), 0),
        });
    }
    function sanitizeImageSource(raw) {
        if (raw && typeof raw === 'object') {
            const data = raw.data;
            if (typeof data === 'string' && data)
                return { data };
            const asset = raw.asset;
            if (asset && typeof asset === 'object')
                return { asset: asset };
        }
        return 'cover';
    }
    function sanitizeVideoSource(raw) {
        if (!raw || typeof raw !== 'object')
            return undefined;
        const data = raw.data;
        if (typeof data === 'string' && data)
            return { data };
        const asset = raw.asset;
        if (asset && typeof asset === 'object')
            return { asset: asset };
        return undefined;
    }
    function sanitizeFrameAspect(raw) {
        if (raw === 'natural')
            return 'natural';
        return clamp(raw, exports.IMAGE_ASPECT_RANGE, 1);
    }
    function takeID(raw, context) {
        const id = isUUID(raw) ? String(raw).toUpperCase() : context.env.newID();
        // 重复的 id 会让选中、命中测试与编辑操作指错人，重生一个。
        const unique = context.seen.has(id) ? context.env.newID() : id;
        context.seen.add(unique);
        return unique;
    }
    function sanitizeBase(raw, context) {
        return definedOnly({
            id: takeID(raw.id, context),
            visible: dropDefault(optionalBool(raw.visible), true),
            opacity: dropDefault(optionalClamp(raw.opacity, exports.OPACITY_RANGE, 1), 1),
            rotation: dropDefault(optionalClamp(raw.rotation, exports.ROTATION_RANGE, 0), 0),
            position: raw.position === 'absolute' ? 'absolute' : undefined,
            anchor: dropDefault(enumOrUndefined(raw.anchor, exports.ANCHORS), 'center'),
            offsetX: dropDefault(optionalClamp(raw.offsetX, exports.OFFSET_RANGE, 0), 0),
            offsetY: dropDefault(optionalClamp(raw.offsetY, exports.OFFSET_RANGE, 0), 0),
            // 宽的缺省就是 fill，写不写一个样，收掉。
            width: dropDefault(sanitizeSizeRule(raw.width), 'fill'),
            height: sanitizeSizeRule(raw.height),
            minWidth: dropDefault(optionalClamp(raw.minWidth, exports.SIZE_RANGE, 0), 0),
            maxWidth: dropDefault(optionalClamp(raw.maxWidth, exports.SIZE_RANGE, 0), 0),
            minHeight: dropDefault(optionalClamp(raw.minHeight, exports.SIZE_RANGE, 0), 0),
            maxHeight: dropDefault(optionalClamp(raw.maxHeight, exports.SIZE_RANGE, 0), 0),
            grow: dropDefault(optionalClamp(raw.grow, exports.GROW_RANGE, 1), 1),
            alignSelf: enumOrUndefined(raw.alignSelf, exports.ALIGNS),
        });
    }
    function sanitizeNodeIn(raw, context, depth) {
        var _a, _b, _c, _d, _e, _f, _g;
        // 超过上限的节点整个丢掉：树再怎么手改，排版的代价都有上界。
        if (!raw || typeof raw !== 'object' || Array.isArray(raw))
            return null;
        if (context.budget <= 0 || depth > exports.MAX_DEPTH)
            return null;
        const value = raw;
        const kind = value.kind;
        if (!exports.TEMPLATE_NODE_KINDS.includes(kind))
            return null; // 不认识的种类跳过
        context.budget -= 1;
        const base = sanitizeBase(value, context);
        switch (kind) {
            case 'stack': {
                const rawChildren = Array.isArray(value.children) ? value.children : [];
                const children = [];
                for (const child of rawChildren) {
                    const node = sanitizeNodeIn(child, context, depth + 1);
                    if (node)
                        children.push(node);
                }
                return definedOnly({
                    ...base,
                    kind: 'stack',
                    direction: value.direction === 'row' ? 'row' : 'column',
                    gap: dropDefault(optionalClamp(value.gap, exports.GAP_RANGE, 0), 0),
                    padding: sanitizePadding(value.padding),
                    align: dropDefault(enumOrUndefined(value.align, exports.ALIGNS), 'stretch'),
                    justify: dropDefault(enumOrUndefined(value.justify, exports.JUSTIFIES), 'start'),
                    fill: value.fill === undefined || value.fill === null ? undefined : clampColor(value.fill),
                    fillAccent: accentOrUndefined(value.fillAccent),
                    cornerRadius: dropDefault(optionalClamp(value.cornerRadius, exports.CORNER_RADIUS_RANGE, 0), 0),
                    stroke: sanitizeStroke(value.stroke),
                    clip: dropDefault(optionalBool(value.clip), false),
                    collapseWhenEmpty: dropDefault(optionalBool(value.collapseWhenEmpty), true),
                    children,
                });
            }
            case 'text':
                return definedOnly({
                    ...base,
                    kind: 'text',
                    field: (_a = enumOrUndefined(value.field, exports.TEMPLATE_FIELDS)) !== null && _a !== void 0 ? _a : '自定义文字',
                    text: prefixChars((_b = value.text) !== null && _b !== void 0 ? _b : '', 300),
                    label: prefixChars((_c = value.label) !== null && _c !== void 0 ? _c : '', 40),
                    inlineLabel: dropDefault(optionalBool(value.inlineLabel), false),
                    fontSize: clamp(value.fontSize, exports.FONT_SIZE_RANGE, 12),
                    weight: (_d = enumOrUndefined(value.weight, exports.TEMPLATE_WEIGHTS)) !== null && _d !== void 0 ? _d : '常规',
                    design: (_e = enumOrUndefined(value.design, exports.TEMPLATE_FONT_DESIGNS)) !== null && _e !== void 0 ? _e : '黑体',
                    alignment: (_f = enumOrUndefined(value.alignment, exports.TEMPLATE_ALIGNMENTS)) !== null && _f !== void 0 ? _f : '左对齐',
                    color: clampColor(value.color),
                    accent: accentOrUndefined(value.accent),
                    tracking: clamp(value.tracking, exports.TRACKING_RANGE, 0),
                    lineLimit: Math.min(exports.LINE_LIMIT_RANGE[1], Math.max(exports.LINE_LIMIT_RANGE[0], Math.round(num(value.lineLimit, 3)))),
                    uppercase: !!value.uppercase,
                    chip: value.chip === undefined || value.chip === null ? undefined : clampColor(value.chip),
                    chipAccent: accentOrUndefined(value.chipAccent),
                    hideWhenEmpty: dropDefault(optionalBool(value.hideWhenEmpty), true),
                });
            case 'image':
                return definedOnly({
                    ...base,
                    kind: 'image',
                    source: sanitizeImageSource(value.source),
                    imageAspect: optionalClamp(value.imageAspect, exports.IMAGE_ASPECT_RANGE, 1),
                    isSticker: dropDefault(optionalBool(value.isSticker), false),
                    video: sanitizeVideoSource(value.video),
                    aspect: sanitizeFrameAspect(value.aspect),
                    fit: value.fit === 'contain' ? 'contain' : 'cover',
                    focusX: clamp(value.focusX, exports.FOCUS_RANGE, 0.5),
                    focusY: clamp(value.focusY, exports.FOCUS_RANGE, 0.5),
                    zoom: clamp(value.zoom, exports.ZOOM_RANGE, 1),
                    tilt: clamp(value.tilt, exports.TILT_RANGE, 0),
                    cornerRadius: dropDefault(optionalClamp(value.cornerRadius, exports.CORNER_RADIUS_RANGE, 0), 0),
                    border: dropDefault(optionalClamp(value.border, exports.BORDER_RANGE, 0), 0),
                    shadow: dropDefault(optionalBool(value.shadow), false),
                });
            case 'shape':
                return definedOnly({
                    ...base,
                    kind: 'shape',
                    shape: (_g = enumOrUndefined(value.shape, exports.TEMPLATE_SHAPES)) !== null && _g !== void 0 ? _g : '矩形',
                    color: clampColor(value.color),
                    accent: accentOrUndefined(value.accent),
                    cornerRadius: dropDefault(optionalClamp(value.cornerRadius, exports.CORNER_RADIUS_RANGE, 0), 0),
                    strokeWidth: dropDefault(optionalClamp(value.strokeWidth, exports.STROKE_RANGE, 0), 0),
                    dashLength: dropDefault(optionalClamp(value.dashLength, exports.DASH_RANGE, 0), 0),
                    dashGap: dropDefault(optionalClamp(value.dashGap, exports.DASH_RANGE, 0), 0),
                });
            default:
                return definedOnly({ ...base, kind: 'spacer' });
        }
    }
    function newContext(env) {
        return { env: resolveEnvironment(env), seen: new Set(), budget: exports.MAX_NODES };
    }
    /** 单个节点（连同子树）的清洗；不认识的种类返回 null。 */
    function sanitizeNode(raw, env) {
        return sanitizeNodeIn(raw, newContext(env), 1);
    }
    function sanitizeCanvasImage(raw) {
        if (!raw || typeof raw !== 'object')
            return undefined;
        const value = raw;
        const data = typeof value.data === 'string' && value.data ? value.data : undefined;
        const asset = value.asset && typeof value.asset === 'object' ? value.asset : undefined;
        if (!data && !asset)
            return undefined;
        return definedOnly({
            data,
            asset,
            imageAspect: optionalClamp(value.imageAspect, exports.IMAGE_ASPECT_RANGE, 1),
            focusX: clamp(value.focusX, exports.FOCUS_RANGE, 0.5),
            focusY: clamp(value.focusY, exports.FOCUS_RANGE, 0.5),
            zoom: clamp(value.zoom, exports.ZOOM_RANGE, 1),
            opacity: clamp(value.opacity, [0, 1], 1),
        });
    }
    function sanitizeCanvas(raw) {
        var _a;
        const value = (raw && typeof raw === 'object' ? raw : {});
        const rawHeight = value.height;
        const aspect = rawHeight && typeof rawHeight === 'object'
            ? rawHeight.aspect
            : undefined;
        return definedOnly({
            width: exports.CANVAS_WIDTH,
            height: typeof aspect === 'number' && Number.isFinite(aspect)
                ? { aspect: clamp(aspect, exports.ASPECT_RANGE, 1.4) }
                : 'hug',
            padding: (_a = sanitizePadding(value.padding)) !== null && _a !== void 0 ? _a : exports.ZERO_PADDING,
            background: clampColor(value.background),
            backgroundAccent: accentOrUndefined(value.backgroundAccent),
            image: sanitizeCanvasImage(value.image),
            exportWidth: optionalClamp(value.exportWidth, exports.EXPORT_WIDTH_RANGE, exports.DEFAULT_EXPORT_WIDTH),
        });
    }
    /**
     * 每个数都有界、id 不重复、节点数与深度有上限、根一定是 column stack。
     * 解码就是清洗：文件里写的就是这个形状，所以手改过的文件污染不了档案。
     */
    function sanitizeTemplate(raw, env) {
        var _a;
        const context = newContext(env);
        const value = (raw && typeof raw === 'object' ? raw : {});
        const trimmed = prefixChars(String((_a = value.name) !== null && _a !== void 0 ? _a : '').trim(), exports.MAX_NAME_LENGTH);
        const sanitizedRoot = sanitizeNodeIn(value.root, context, 1);
        // 根必须是 column stack：不是 stack 的（或整个缺了的）就现做一个把它装进去。
        const root = sanitizedRoot && isStackNode(sanitizedRoot)
            ? { ...sanitizedRoot, direction: 'column' }
            : {
                kind: 'stack',
                id: takeID(undefined, context),
                direction: 'column',
                children: sanitizedRoot ? [sanitizedRoot] : [],
            };
        return {
            id: isUUID(value.id) ? String(value.id).toUpperCase() : context.env.newID(),
            name: trimmed || exports.DEFAULT_TEMPLATE_NAME,
            canvas: sanitizeCanvas(value.canvas),
            root,
            createdAt: typeof value.createdAt === 'string' ? value.createdAt : context.env.now(),
            updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : context.env.now(),
        };
    }
    // MARK: - 起始排版
    exports.STARTERS = [
        { id: '拍立得', subtitle: '白边相纸，下方手写一句' },
        { id: '展览海报', subtitle: '大字标题压在封面上' },
        { id: '信息票根', subtitle: '封面在上，字段整齐排在下方' },
        { id: '空白画布', subtitle: '只有底色，全部自己来' },
    ];
    function starterSubtitle(starter) {
        return exports.STARTERS.find((item) => item.id === starter).subtitle;
    }
    /**
     * 四种起点。写法与内置风格同构（一棵响应式的树），只是简单得多：
     * 起点是「给用户改的底子」，所以每一块都能删掉而不会塌。
     */
    function starterTemplate(starter, name, env) {
        const base = defaultTemplate(env);
        const stack = (direction, overrides, children) => makeStackNode(direction, { ...overrides, children }, env);
        const text = (field, overrides) => makeTextNode(field, overrides, env);
        const cover = (overrides) => makeImageNode('cover', overrides, env);
        // 过一遍 sanitize：起点因此和从文件里读回来的模版一模一样（规范形）。
        const template = (canvas, root) => sanitizeTemplate({ ...base, name: name !== null && name !== void 0 ? name : starter, canvas, root }, env);
        switch (starter) {
            case '拍立得':
                return template({
                    ...defaultCanvas(),
                    padding: padding(20, 24),
                    background: colorFromHex(0xf2ecdd),
                }, stack('column', { gap: 14 }, [
                    stack('row', { gap: 8, align: 'center' }, [
                        text('余响标识', { fontSize: 12, lineLimit: 1 }),
                        text('英文类型', { fontSize: 8, alignment: '右对齐', lineLimit: 1 }),
                    ]),
                    cover({ aspect: 0.92, cornerRadius: 2, border: 12, shadow: true, rotation: -2 }),
                    text('名称', { fontSize: 22, alignment: '居中', lineLimit: 2 }),
                    text('日期', { fontSize: 11, alignment: '居中', lineLimit: 1 }),
                    text('开场白', {
                        fontSize: 10,
                        design: '宋体',
                        alignment: '居中',
                        lineLimit: 1,
                        opacity: 0.7,
                    }),
                ]));
            case '展览海报':
                return template({
                    ...defaultCanvas(),
                    height: { aspect: 1.5 },
                    padding: exports.ZERO_PADDING,
                    background: { ...exports.Palette.night },
                },
                // 封面是 flow 的、撑满整张画布；字压在它上面，所以走绝对定位（画在 flow 之后）。
                stack('column', {}, [
                    cover({ height: 'fill', cornerRadius: 0 }),
                    stack('column', {
                        position: 'absolute',
                        anchor: 'center',
                        height: 'fill',
                        padding: padding(28, 24),
                        gap: 8,
                    }, [
                        stack('row', { gap: 8, align: 'center' }, [
                            text('英文类型', { fontSize: 9, lineLimit: 1, color: { ...exports.Palette.white } }),
                            text('余响标识', {
                                fontSize: 14,
                                alignment: '右对齐',
                                lineLimit: 1,
                                color: { ...exports.Palette.white },
                            }),
                        ]),
                        makeSpacerNode(env),
                        text('名称', { fontSize: 36, lineLimit: 3, color: { ...exports.Palette.white } }),
                        text('城市与场馆', {
                            fontSize: 11,
                            lineLimit: 1,
                            color: { ...exports.Palette.white },
                            opacity: 0.85,
                        }),
                        text('数字日期', {
                            fontSize: 11,
                            lineLimit: 1,
                            color: { ...exports.Palette.white },
                            opacity: 0.85,
                        }),
                    ]),
                ]));
            case '信息票根':
                return template({ ...defaultCanvas(), padding: padding(22, 24), background: { ...exports.Palette.cream } }, stack('column', { gap: 12 }, [
                    cover({ aspect: 0.78, cornerRadius: 14, shadow: true }),
                    text('开场白', {
                        fontSize: 10,
                        weight: '半粗',
                        color: colorFromHex(0x6e58a8),
                        tracking: 2,
                        lineLimit: 1,
                    }),
                    text('名称', { fontSize: 26, lineLimit: 2 }),
                    stack('row', { gap: 12 }, [
                        text('日期', { fontSize: 11, label: 'DATE', lineLimit: 1 }),
                        text('城市与场馆', { fontSize: 11, label: 'VENUE', alignment: '右对齐', lineLimit: 2 }),
                    ]),
                    text('金句', { fontSize: 14, lineLimit: 3 }),
                    stack('row', { gap: 12, align: 'center' }, [
                        text('署名', { fontSize: 8, lineLimit: 1 }),
                        text('条码', { fontSize: 12, width: 'hug', alignment: '右对齐', lineLimit: 1 }),
                    ]),
                ]));
            default:
                // 空白画布给一个固定比例，不然空树的画布只有内边距那么高，没处下手。
                return template({ ...defaultCanvas(), height: { aspect: 1.4 } }, makeStackNode('column', { gap: 12 }, env));
        }
    }
    function defaultPosterOptions() {
        return {
            showDate: true,
            showVenue: true,
            showRating: true,
            showNote: true,
            showQuote: true,
            showSetlist: true,
            showAuthor: true,
            showPrice: false,
            showSeat: false,
            showCompanions: false,
            headline: '',
            locale: 'zh-Hans',
        };
    }
    function toDate(value) {
        if (!value)
            return null;
        const date = value instanceof Date ? value : new Date(value);
        return Number.isFinite(date.getTime()) ? date : null;
    }
    /** 活动当地的年月日时分：有时区偏移就按偏移算，否则按设备本地时区。 */
    function dateParts(record) {
        const date = toDate(record.date);
        if (!date)
            return null;
        if (typeof record.utcOffsetSeconds === 'number' && Number.isFinite(record.utcOffsetSeconds)) {
            const shifted = new Date(date.getTime() + record.utcOffsetSeconds * 1000);
            return {
                year: shifted.getUTCFullYear(),
                month: shifted.getUTCMonth() + 1,
                day: shifted.getUTCDate(),
                hour: shifted.getUTCHours(),
                minute: shifted.getUTCMinutes(),
            };
        }
        return {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate(),
            hour: date.getHours(),
            minute: date.getMinutes(),
        };
    }
    function pad(value, width) {
        return String(value).padStart(width, '0');
    }
    const EN_MONTHS = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
    ];
    /** `.dateTime.year().month().day()` 在简体中文与英文下的写法。 */
    function formatLongDate(parts, locale) {
        if (locale === 'en')
            return `${EN_MONTHS[parts.month - 1]} ${parts.day}, ${parts.year}`;
        return `${parts.year}年${parts.month}月${parts.day}日`;
    }
    /** `.dateTime.hour().minute()`：中文 24 小时制，英文 12 小时制。 */
    function formatTime(parts, locale) {
        if (locale === 'en') {
            const suffix = parts.hour < 12 ? 'AM' : 'PM';
            const hour = parts.hour % 12 === 0 ? 12 : parts.hour % 12;
            return `${hour}:${pad(parts.minute, 2)} ${suffix}`;
        }
        return `${pad(parts.hour, 2)}:${pad(parts.minute, 2)}`;
    }
    function starsText(rating) {
        const value = Math.min(5, Math.max(0, Math.round(rating)));
        return '★'.repeat(value) + '☆'.repeat(5 - value);
    }
    /** 记忆编号：UUID 字符串的 UTF-8 字节滚动求和，四位。 */
    function memoryNumber(id) {
        let value = 0;
        for (const byte of utf8Bytes(String(id)))
            value = (value * 31 + byte) % 10000;
        return String(value).padStart(4, '0');
    }
    function utf8Bytes(text) {
        const bytes = [];
        for (let i = 0; i < text.length; i++) {
            let code = text.charCodeAt(i);
            if (code >= 0xd800 && code <= 0xdbff && i + 1 < text.length) {
                const next = text.charCodeAt(i + 1);
                if (next >= 0xdc00 && next <= 0xdfff) {
                    code = (code - 0xd800) * 0x400 + (next - 0xdc00) + 0x10000;
                    i++;
                }
            }
            if (code < 0x80)
                bytes.push(code);
            else if (code < 0x800)
                bytes.push(0xc0 | (code >> 6), 0x80 | (code & 63));
            else if (code < 0x10000)
                bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 63), 0x80 | (code & 63));
            else
                bytes.push(0xf0 | (code >> 18), 0x80 | ((code >> 12) & 63), 0x80 | ((code >> 6) & 63), 0x80 | (code & 63));
        }
        return bytes;
    }
    function setlistLines(record) {
        const value = record.setlist;
        if (!value)
            return [];
        const lines = Array.isArray(value) ? value.slice() : String(value).split(/\r\n|\r|\n/);
        return lines.map((line) => String(line).trim()).filter((line) => line.length > 0);
    }
    function makeCardBits(record, options = defaultPosterOptions(), author = '') {
        var _a, _b, _c, _d, _e, _f, _g;
        const locale = (_a = options.locale) !== null && _a !== void 0 ? _a : 'zh-Hans';
        const parts = dateParts(record);
        const hasDate = record.hasConfirmedDate !== false;
        const hasTime = hasDate && record.hasConfirmedTime !== false;
        const showDate = options.showDate && hasDate && !!parts;
        const present = (text) => (text ? text : null);
        const city = (_b = record.city) !== null && _b !== void 0 ? _b : '';
        const venue = (_c = record.venue) !== null && _c !== void 0 ? _c : '';
        const locationLine = [city, venue].filter((item) => item.length > 0).join(' · ');
        const rating = options.showRating && ((_d = record.rating) !== null && _d !== void 0 ? _d : 0) > 0 ? record.rating : null;
        return {
            record,
            options,
            author,
            kindName: (_e = record.kindName) !== null && _e !== void 0 ? _e : '',
            kindEnglish: (_f = record.kindEnglish) !== null && _f !== void 0 ? _f : '',
            headline: present(options.headline.trim()),
            date: showDate && parts ? formatLongDate(parts, locale) : null,
            dateNumeric: showDate && parts
                ? `${pad(parts.year, 4)}.${pad(parts.month, 2)}.${pad(parts.day, 2)}`
                : null,
            dayMonth: showDate && parts ? `${pad(parts.month, 2)}.${pad(parts.day, 2)}` : null,
            year: showDate && parts ? String(parts.year) : null,
            time: options.showDate && hasTime && parts ? formatTime(parts, locale) : null,
            venue: options.showVenue ? present(locationLine) : null,
            city: options.showVenue ? present(city) : null,
            quote: options.showQuote ? present(record.quote) : null,
            note: options.showNote ? present(record.note) : null,
            rating,
            mood: options.showRating ? present(record.mood) : null,
            price: options.showPrice && typeof record.price === 'number'
                ? `${record.price.toFixed(2)} ${(_g = record.currency) !== null && _g !== void 0 ? _g : 'CNY'}`
                : null,
            seat: options.showSeat ? present(record.seat) : null,
            companions: options.showCompanions ? present(record.companions) : null,
            signature: options.showAuthor ? author : null,
            setlist: options.showSetlist ? setlistLines(record) : [],
            stars: rating === null ? '' : starsText(rating),
        };
    }
    function templateText(node, bits) {
        const raw = rawTemplateText(node, bits);
        if (raw === null)
            return null;
        return node.uppercase ? raw.toUpperCase() : raw;
    }
    function rawTemplateText(element, bits) {
        const record = bits.record;
        const present = (text) => (text ? text : null);
        switch (element.field) {
            case '名称':
                return present(record.title);
            case '副标题':
                return present(record.subtitle);
            case '艺人 / 卡司':
                return present(record.performers);
            case '类型':
                return bits.kindName;
            case '英文类型':
                return bits.kindEnglish;
            case '日期':
                return bits.date;
            case '数字日期':
                return bits.dateNumeric;
            case '时间':
                return bits.time;
            case '场馆':
                return bits.options.showVenue ? present(record.venue) : null;
            case '城市':
                return bits.city;
            case '城市与场馆':
                return bits.venue;
            case '月日':
                return bits.dayMonth;
            case '年份':
                return bits.year;
            case '评分星星':
                return bits.rating === null ? null : bits.stars;
            case '心情':
                return present(bits.mood);
            case '金句':
                return bits.quote;
            case '感想':
                return bits.note;
            case '曲目单':
                return bits.setlist.length ? bits.setlist.join('\n') : null;
            case '票价':
                return bits.price;
            case '座位':
                return bits.seat;
            case '同行人':
                return bits.companions;
            case '开场白':
                return bits.headline;
            case '署名':
                return bits.signature === null ? null : 'COLLECTED BY ' + bits.signature;
            case '余响标识':
                return 'LIVEMARK';
            case '编号':
                return 'NO. ' + memoryNumber(record.id);
            case '条码':
                return String(record.id).toUpperCase();
            default:
                return present(element.text);
        }
    }

  });

  define("core/template/layout", function (module, exports, require) {
    "use strict";
    // 海报的排版引擎：一棵盒子树 + 一份「这条记录里每个文字节点印什么」→ 一串带 frame 的图元。
    // 设计规格见 Documentation/POSTER.md 第 2 节。
    //
    // 语义照 Figma Auto Layout / CSS flex 的一个小子集定义（hug / fill / fixed / fraction、
    // padding、gap、align、justify、绝对定位），自己写而不用 Yoga：
    //   * 纯 TypeScript，不 import react / react-native / skia，跨平台结果逐位一致，可以在 Jest 里断言；
    //   * 文字有多高只有画笔知道，所以量文字这件事由调用方注入（`Measure`），引擎本身没有字体概念。
    //
    // 画的顺序照 Figma 的图层顺序：前序遍历，父（底色 / 描边）先于子，同一个 stack 的子节点
    // **按 children 数组的顺序**画，绝对定位的也在这个顺序里——排在前面的垫在下面，排在后面的压在上面。
    // 于是「垫在内容底下的装饰」写得出来（点阵纸纹放第一个），编辑器的上移 / 下移对绝对定位节点同样有效。
    //
    // 性能：一次排版只走一遍树，除 measure 外全是加减乘；120 个节点远在 1 ms 以内。
    // measure 的调用次数 = text 节点数：每个节点在最终宽度上量一次；宽度规则是 hug 的还要先量一次
    // 「不换行的固有宽」（maxWidth = Infinity），所以最多两次，同一个请求由缓存兜住。
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.layoutTemplate = layoutTemplate;
    const model_1 = require("./model");
    function finite(value, fallback = 0) {
        return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
    }
    // MARK: - 规则 1：收起判定（自底向上）
    function isCollapsed(node, context) {
        const cached = context.collapsed.get(node.id);
        if (cached !== undefined)
            return cached;
        const value = computeCollapsed(node, context);
        context.collapsed.set(node.id, value);
        return value;
    }
    function computeCollapsed(node, context) {
        var _a;
        if (node.visible === false)
            return true;
        if (node.kind === 'text') {
            const value = (_a = context.values[node.id]) !== null && _a !== void 0 ? _a : null;
            return value === null && node.hideWhenEmpty !== false;
        }
        if (node.kind === 'stack') {
            if (node.collapseWhenEmpty === false)
                return false;
            // spacer 不算「有内容」：只剩弹簧的容器等于空的。绝对定位的子节点也不算，
            // 不然一枚贴纸就能把空卡片留在海报上；要留住这种容器就写 collapseWhenEmpty: false。
            const hasContent = node.children.some((child) => {
                var _a;
                return ((_a = child.position) !== null && _a !== void 0 ? _a : 'flow') !== 'absolute' &&
                    child.kind !== 'spacer' &&
                    !isCollapsed(child, context);
            });
            return !hasContent;
        }
        return false;
    }
    // MARK: - 尺寸规则
    function widthRule(node) {
        var _a;
        return (_a = node.width) !== null && _a !== void 0 ? _a : 'fill';
    }
    /** undefined 表示「自然高」：文字量出来的、图片按比例算的、形状的缺省高、容器的 hug。 */
    function heightRule(node) {
        if (node.height !== undefined)
            return node.height;
        return node.kind === 'spacer' ? 'fill' : undefined;
    }
    function fractionOf(rule) {
        return rule && typeof rule === 'object' ? finite(rule.fraction, 1) : null;
    }
    function clampWidth(node, value) {
        let out = value;
        if (node.maxWidth !== undefined)
            out = Math.min(out, node.maxWidth);
        if (node.minWidth !== undefined)
            out = Math.max(out, node.minWidth);
        return Math.max(0, out);
    }
    function clampHeight(node, value) {
        let out = value;
        if (node.maxHeight !== undefined)
            out = Math.min(out, node.maxHeight);
        if (node.minHeight !== undefined)
            out = Math.max(out, node.minHeight);
        return Math.max(0, out);
    }
    function imageAspect(node) {
        var _a;
        if (node.kind !== 'image')
            return 1;
        if (node.aspect === 'natural')
            return finite((_a = node.imageAspect) !== null && _a !== void 0 ? _a : 1, 1);
        return finite(node.aspect, 1);
    }
    // MARK: - 量文字
    function measureText(node, maxWidth, context) {
        var _a, _b, _c;
        const key = node.id + '|' + (Number.isFinite(maxWidth) ? String(maxWidth) : 'inf');
        const hit = context.cache.get(key);
        if (hit)
            return hit;
        const value = (_a = context.values[node.id]) !== null && _a !== void 0 ? _a : null;
        const measured = context.measure({
            text: value !== null && value !== void 0 ? value : '',
            label: node.label,
            inlineLabel: !!node.inlineLabel,
            fontSize: node.fontSize,
            weight: node.weight,
            design: node.design,
            alignment: node.alignment,
            tracking: node.tracking,
            lineLimit: node.lineLimit,
            chip: !!node.chip || !!node.chipAccent,
            barcode: node.field === '条码',
            maxWidth,
        });
        const safe = {
            width: Math.max(0, finite((_b = measured === null || measured === void 0 ? void 0 : measured.width) !== null && _b !== void 0 ? _b : 0)),
            height: Math.max(0, finite((_c = measured === null || measured === void 0 ? void 0 : measured.height) !== null && _c !== void 0 ? _c : 0)),
        };
        context.cache.set(key, safe);
        return safe;
    }
    // MARK: - 规则 2：宽度
    /** hug：按内容有多宽。`avail` 是上限（行里是「当下剩余」）。 */
    function hugWidth(node, avail, context) {
        var _a, _b;
        switch (node.kind) {
            case 'text':
                // 不换行时的固有宽；比可用宽还宽就只能换行，那就等于可用宽。
                return Math.min(measureText(node, Infinity, context).width, avail);
            case 'image': {
                // 高度给了定数时反推宽度（极简留白的 96 × 124 小图），否则只能撑满。
                const rule = heightRule(node);
                return typeof rule === 'number' ? rule / Math.max(0.01, imageAspect(node)) : avail;
            }
            case 'stack': {
                const pad = (_a = node.padding) !== null && _a !== void 0 ? _a : model_1.ZERO_PADDING;
                const inner = Math.max(0, avail - pad.left - pad.right);
                const gap = (_b = node.gap) !== null && _b !== void 0 ? _b : 0;
                const flow = flowChildren(node, context);
                if (flow.length === 0)
                    return pad.left + pad.right;
                const widths = flow.map((child) => intrinsicWidth(child, inner, context));
                const content = node.direction === 'row'
                    ? widths.reduce((sum, value) => sum + value, 0) + gap * (flow.length - 1)
                    : widths.reduce((most, value) => Math.max(most, value), 0);
                return Math.min(avail, content + pad.left + pad.right);
            }
            default:
                return avail;
        }
    }
    /** 一个子节点「想要」多宽：定数与比例照算，fill 与 hug 都按内容。 */
    function intrinsicWidth(node, avail, context) {
        const rule = widthRule(node);
        if (typeof rule === 'number')
            return clampWidth(node, rule);
        const fraction = fractionOf(rule);
        if (fraction !== null)
            return clampWidth(node, avail * fraction);
        return clampWidth(node, hugWidth(node, avail, context));
    }
    /** 列方向（或绝对定位）里子节点的最终宽度：fill 撑满可用宽。 */
    function resolveWidth(node, avail, context) {
        const rule = widthRule(node);
        if (rule === 'fill')
            return clampWidth(node, avail);
        return intrinsicWidth(node, avail, context);
    }
    // MARK: - 规则 3：高度
    function naturalHeight(node, width, context) {
        switch (node.kind) {
            case 'text':
                return measureText(node, width, context).height;
            case 'image':
                return width * imageAspect(node);
            case 'shape':
                return (0, model_1.defaultShapeHeight)(node.shape);
            default:
                return 0; // spacer：hug 的父里等于 0
        }
    }
    /**
     * 父给子定高：定数照用，比例按父内容高，fill 交给主轴分配（返回 null 表示「还没定」）。
     * `available` 是父的内容高，null 表示父自己也是 hug。
     */
    function assignedHeight(node, available) {
        const rule = heightRule(node);
        if (typeof rule === 'number')
            return rule;
        const fraction = fractionOf(rule);
        if (fraction !== null)
            return available === null ? null : available * fraction;
        return null;
    }
    function isFlexibleHeight(node) {
        return heightRule(node) === 'fill';
    }
    function growOf(node) {
        const value = node.grow === undefined ? 1 : finite(node.grow, 1);
        return Math.max(0, value);
    }
    // MARK: - 规则 4：摆放
    function alignFor(child, stack) {
        var _a, _b;
        return (_b = (_a = child.alignSelf) !== null && _a !== void 0 ? _a : stack.align) !== null && _b !== void 0 ? _b : 'stretch';
    }
    /** 交叉轴上的位置：stretch 对已经定好大小的节点等于 start。 */
    function alignOffset(align, available, size) {
        const free = Math.max(0, available - size);
        if (align === 'center')
            return free / 2;
        if (align === 'end')
            return free;
        return 0;
    }
    function distribute(justify, free, count) {
        if (free <= 0 || count === 0)
            return { start: 0, between: 0 };
        switch (justify) {
            case 'center':
                return { start: free / 2, between: 0 };
            case 'end':
                return { start: free, between: 0 };
            case 'spaceBetween':
                return count > 1 ? { start: 0, between: free / (count - 1) } : { start: 0, between: 0 };
            case 'spaceAround': {
                const slot = free / count;
                return { start: slot / 2, between: slot };
            }
            case 'spaceEvenly': {
                const slot = free / (count + 1);
                return { start: slot, between: slot };
            }
            default:
                return { start: 0, between: 0 };
        }
    }
    function anchorFactors(anchor) {
        const x = anchor.includes('Left') || anchor === 'left' ? 0 : anchor.includes('Right') || anchor === 'right' ? 1 : 0.5;
        const y = anchor.startsWith('top') ? 0 : anchor.startsWith('bottom') ? 1 : 0.5;
        return [x, y];
    }
    function flowChildren(stack, context) {
        return stack.children.filter((child) => { var _a; return !isCollapsed(child, context) && ((_a = child.position) !== null && _a !== void 0 ? _a : 'flow') !== 'absolute'; });
    }
    function absoluteChildren(stack, context) {
        return stack.children.filter((child) => !isCollapsed(child, context) && child.position === 'absolute');
    }
    // MARK: - 排一个节点
    function layoutNode(node, width, height, context) {
        if ((0, model_1.isStackNode)(node))
            return layoutStack(node, width, height, context);
        const own = height === null ? naturalHeight(node, width, context) : height;
        return { node, width, height: clampHeight(node, own), x: 0, y: 0, children: [] };
    }
    function layoutStack(stack, width, height, context) {
        var _a, _b, _c;
        const pad = (_a = stack.padding) !== null && _a !== void 0 ? _a : model_1.ZERO_PADDING;
        const gap = (_b = stack.gap) !== null && _b !== void 0 ? _b : 0;
        const contentWidth = Math.max(0, width - pad.left - pad.right);
        const contentHeight = height === null ? null : Math.max(0, height - pad.top - pad.bottom);
        const flow = flowChildren(stack, context);
        const boxes = stack.direction === 'row'
            ? layoutRow(stack, flow, contentWidth, contentHeight, gap, context)
            : layoutColumn(stack, flow, contentWidth, contentHeight, gap, context);
        // 自己的高：给定就用给定的，否则 hug（列 = 子高之和 + 间距，行 = 最高的那个）。
        const used = stack.direction === 'row'
            ? boxes.reduce((most, box) => Math.max(most, box.height), 0)
            : boxes.reduce((sum, box) => sum + box.height, 0) + gap * Math.max(0, boxes.length - 1);
        const innerHeight = contentHeight === null ? used : contentHeight;
        const outerHeight = clampHeight(stack, innerHeight + pad.top + pad.bottom);
        const finalInner = Math.max(0, outerHeight - pad.top - pad.bottom);
        place(stack, boxes, pad, gap, contentWidth, finalInner);
        // 规则 5：绝对定位的子节点等父盒定好再排，相对 padding box；不参与父的 hug。
        const absolutes = absoluteChildren(stack, context).map((child) => layoutAbsolute(child, pad, contentWidth, finalInner, context));
        // 规则 6：算是分两轮算的，画却按 children 原来的顺序画，绝对定位的不再一律靠后。
        const ordered = [];
        let flowIndex = 0;
        let absoluteIndex = 0;
        for (const child of stack.children) {
            if (isCollapsed(child, context))
                continue;
            ordered.push(((_c = child.position) !== null && _c !== void 0 ? _c : 'flow') === 'absolute' ? absolutes[absoluteIndex++] : boxes[flowIndex++]);
        }
        return {
            node: stack,
            width,
            height: outerHeight,
            x: 0,
            y: 0,
            children: ordered,
        };
    }
    function layoutColumn(stack, flow, contentWidth, contentHeight, gap, context) {
        const boxes = [];
        const flexible = [];
        let fixedSum = 0;
        flow.forEach((child, index) => {
            const childWidth = resolveWidth(child, contentWidth, context);
            const flexible1 = isFlexibleHeight(child) && contentHeight !== null;
            if (flexible1) {
                // 先占个位，等会儿按 grow 分剩余高度。
                boxes.push({ node: child, width: childWidth, height: 0, x: 0, y: 0, children: [] });
                flexible.push(index);
                return;
            }
            const box = layoutNode(child, childWidth, assignedHeight(child, contentHeight), context);
            fixedSum += box.height;
            boxes.push(box);
        });
        if (flexible.length > 0 && contentHeight !== null) {
            const free = Math.max(0, contentHeight - fixedSum - gap * Math.max(0, flow.length - 1));
            const totalGrow = flexible.reduce((sum, index) => sum + growOf(flow[index]), 0);
            for (const index of flexible) {
                const share = totalGrow > 0 ? (free * growOf(flow[index])) / totalGrow : 0;
                boxes[index] = layoutNode(flow[index], boxes[index].width, clampHeight(flow[index], share), context);
            }
        }
        return boxes;
    }
    function layoutRow(stack, flow, contentWidth, contentHeight, gap, context) {
        const widths = new Array(flow.length).fill(0);
        const fills = [];
        let remaining = Math.max(0, contentWidth - gap * Math.max(0, flow.length - 1));
        flow.forEach((child, index) => {
            if (widthRule(child) === 'fill') {
                fills.push(index);
                return;
            }
            // hug 的上限是当下剩余，先到先得；定数与比例照算（可能超出，超了也不缩）。
            const value = widthRule(child) === 'hug'
                ? clampWidth(child, hugWidth(child, Math.max(0, remaining), context))
                : intrinsicWidth(child, contentWidth, context);
            widths[index] = value;
            remaining -= value;
        });
        if (fills.length > 0) {
            const free = Math.max(0, remaining);
            const totalGrow = fills.reduce((sum, index) => sum + growOf(flow[index]), 0);
            for (const index of fills) {
                const share = totalGrow > 0 ? (free * growOf(flow[index])) / totalGrow : 0;
                widths[index] = clampWidth(flow[index], share);
            }
        }
        // 行的内容高：给定就用给定的，否则取最高的那个（fill 高的子节点跟着这个高）。
        const boxes = flow.map((child, index) => isFlexibleHeight(child)
            ? { node: child, width: widths[index], height: 0, x: 0, y: 0, children: [] }
            : layoutNode(child, widths[index], assignedHeight(child, contentHeight), context));
        const natural = boxes.reduce((most, box) => Math.max(most, box.height), 0);
        const rowHeight = contentHeight === null ? natural : contentHeight;
        flow.forEach((child, index) => {
            if (!isFlexibleHeight(child))
                return;
            boxes[index] = layoutNode(child, widths[index], clampHeight(child, rowHeight), context);
        });
        return boxes;
    }
    function place(stack, boxes, pad, gap, contentWidth, contentHeight) {
        var _a;
        const justify = (_a = stack.justify) !== null && _a !== void 0 ? _a : 'start';
        if (stack.direction === 'row') {
            const used = boxes.reduce((sum, box) => sum + box.width, 0) + gap * Math.max(0, boxes.length - 1);
            const spread = distribute(justify, contentWidth - used, boxes.length);
            let x = pad.left + spread.start;
            for (const box of boxes) {
                box.x = x;
                box.y = pad.top + alignOffset(alignFor(box.node, stack), contentHeight, box.height);
                x += box.width + gap + spread.between;
            }
            return;
        }
        const used = boxes.reduce((sum, box) => sum + box.height, 0) + gap * Math.max(0, boxes.length - 1);
        const spread = distribute(justify, contentHeight - used, boxes.length);
        let y = pad.top + spread.start;
        for (const box of boxes) {
            box.x = pad.left + alignOffset(alignFor(box.node, stack), contentWidth, box.width);
            box.y = y;
            y += box.height + gap + spread.between;
        }
    }
    function layoutAbsolute(node, pad, contentWidth, contentHeight, context) {
        var _a, _b, _c;
        const width = resolveWidth(node, contentWidth, context);
        const rule = heightRule(node);
        const assigned = rule === 'fill' ? contentHeight : assignedHeight(node, contentHeight);
        const box = layoutNode(node, width, assigned === null ? null : clampHeight(node, assigned), context);
        const [ax, ay] = anchorFactors((_a = node.anchor) !== null && _a !== void 0 ? _a : 'center');
        box.x = pad.left + contentWidth * ax - box.width * ax + finite((_b = node.offsetX) !== null && _b !== void 0 ? _b : 0);
        box.y = pad.top + contentHeight * ay - box.height * ay + finite((_c = node.offsetY) !== null && _c !== void 0 ? _c : 0);
        return box;
    }
    // MARK: - 规则 6 / 7 / 8：画的顺序、旋转、画布
    function layoutTemplate(template, values, measure) {
        var _a;
        const context = {
            values: values !== null && values !== void 0 ? values : {},
            measure,
            cache: new Map(),
            collapsed: new Map(),
        };
        const canvas = template.canvas;
        const pad = (_a = canvas.padding) !== null && _a !== void 0 ? _a : model_1.ZERO_PADDING;
        const width = model_1.CANVAS_WIDTH;
        const fixedHeight = typeof canvas.height === 'object'
            ? (0, model_1.roundHalfAwayFromZero)(width * finite(canvas.height.aspect, 1.4))
            : null;
        const rootWidth = Math.max(0, width - pad.left - pad.right);
        const rootHeight = fixedHeight === null ? null : Math.max(0, fixedHeight - pad.top - pad.bottom);
        // 根永不收起：整张海报空着也要留一张画布给用户下手。
        const rootBox = layoutStack(template.root, rootWidth, rootHeight, context);
        rootBox.x = pad.left;
        rootBox.y = pad.top;
        const height = fixedHeight === null ? rootBox.height + pad.top + pad.bottom : fixedHeight;
        const nodes = [];
        const byID = {};
        const emit = (box, parent, depth, originX, originY, opacity) => {
            var _a, _b;
            const x = originX + box.x;
            const y = originY + box.y;
            const own = opacity * finite((_a = box.node.opacity) !== null && _a !== void 0 ? _a : 1, 1);
            const laid = {
                id: box.node.id,
                kind: box.node.kind,
                node: box.node,
                frame: { x, y, width: box.width, height: box.height },
                rotation: finite((_b = box.node.rotation) !== null && _b !== void 0 ? _b : 0),
                opacity: own,
                collapsed: false,
                depth,
                ...(parent === undefined ? {} : { parent }),
            };
            nodes.push(laid);
            byID[laid.id] = laid;
            for (const child of box.children)
                emit(child, box.node.id, depth + 1, x, y, own);
        };
        emit(rootBox, undefined, 1, 0, 0, 1);
        // 收起的节点不画，但编辑器的图层面板要知道它们还在树上。
        const mark = (node, parent, depth) => {
            if (!byID[node.id]) {
                byID[node.id] = {
                    id: node.id,
                    kind: node.kind,
                    node,
                    frame: { x: 0, y: 0, width: 0, height: 0 },
                    rotation: 0,
                    opacity: 0,
                    collapsed: true,
                    depth,
                    ...(parent === undefined ? {} : { parent }),
                };
            }
            if ((0, model_1.isStackNode)(node)) {
                for (const child of node.children)
                    mark(child, node.id, depth + 1);
            }
        };
        mark(template.root, undefined, 1);
        return { width, height, nodes, byID };
    }

  });

  define("core/template/document", function (module, exports, require) {
    "use strict";
    // `.lmtemplate` 文件（版本 2：响应式盒子树）。设计规格见 Documentation/POSTER.md 第 6 节。
    //
    // 文件只带模版和它的图，别的什么都没有：没有记录、没有设置、没有私人字段。
    // 导入永远换一个新身份，所以收到别人的文件不会盖掉自己已有的模版。
    //
    // 编码规范：键按字典序（`stableStringify`）、日期 ISO-8601 无小数秒、图为 base64、
    // UUID 大写连字符、**等于缺省值的字段整把省掉**（visible / opacity / rotation / position /
    // fit / focus / zoom / tilt / hideWhenEmpty / collapseWhenEmpty …）。
    // 解码宽松：每个字段 `?? 默认值`，不认识的 kind 跳过，坏节点跳过而不是整份失败——
    // 这两件事都由 model.ts 的 `sanitizeTemplate` 做，所以「解码」就是「清洗」。
    //
    // `encodeTemplate` 同时是档案里的形状：v2 模版存在档案的新键 `posterTemplates` 下
    // （Swift 版的 `shareTemplates` 原样保留、不读不写）。文件里不许有资产引用，
    // 档案里可以，所以剥离资产是 `encodeTemplateDocument` 的事，不是 `encodeTemplate` 的事。
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TemplateDocumentError = exports.MAX_FILE_BYTES = exports.MAX_VIDEO_BYTES = exports.MAX_BYTES = exports.TEMPLATE_CONTENT_TYPE = exports.TEMPLATE_FILE_EXTENSIONS = exports.LEGACY_TEMPLATE_FILE_EXTENSIONS = exports.TEMPLATE_FILE_EXTENSION = exports.TEMPLATE_DOCUMENT_APP = exports.TEMPLATE_DOCUMENT_VERSION = void 0;
    exports.utf8ByteLength = utf8ByteLength;
    exports.base64ByteCount = base64ByteCount;
    exports.isSupportedImage = isSupportedImage;
    exports.isSupportedVideo = isSupportedVideo;
    exports.stableStringify = stableStringify;
    exports.encodeNode = encodeNode;
    exports.encodeCanvas = encodeCanvas;
    exports.encodeTemplate = encodeTemplate;
    exports.decodeTemplate = decodeTemplate;
    exports.encodeTemplateDocument = encodeTemplateDocument;
    exports.templateFileName = templateFileName;
    exports.decodeTemplateDocument = decodeTemplateDocument;
    exports.isTemplateFileName = isTemplateFileName;
    exports.looksLikeTemplateDocument = looksLikeTemplateDocument;
    exports.templateDocumentBody = templateDocumentBody;
    const model_1 = require("./model");
    // MARK: - 常量
    exports.TEMPLATE_DOCUMENT_VERSION = 2;
    exports.TEMPLATE_DOCUMENT_APP = 'Livemark';
    /**
     * 0.11.0 build 31 起模版和备份一样写成 `.livemark`（gzip 过的 JSON，见 core/gzip.ts）；
     * 0.10.0 build 27 到 build 30 写的是 `.lmtemplate`，更早的是 `.encoretemplate`，都仍能打开。
     * 同一个扩展名下备份与模版靠内容分辨（`looksLikeTemplateDocument`）。
     */
    exports.TEMPLATE_FILE_EXTENSION = 'livemark';
    exports.LEGACY_TEMPLATE_FILE_EXTENSIONS = ['lmtemplate', 'encoretemplate'];
    exports.TEMPLATE_FILE_EXTENSIONS = [
        exports.TEMPLATE_FILE_EXTENSION,
        ...exports.LEGACY_TEMPLATE_FILE_EXTENSIONS,
    ];
    /** 旧扩展名的 UTI；新文件用 backup.ts 的 `LIVEMARK_CONTENT_TYPE`。 */
    exports.TEMPLATE_CONTENT_TYPE = 'cc.kinyo.encore.template';
    /** 一张图片、以及一个没有视频的文件的上限。 */
    exports.MAX_BYTES = 8 * 1024 * 1024;
    /** 实况照片的视频，以及带视频的整个文件。 */
    exports.MAX_VIDEO_BYTES = 40 * 1024 * 1024;
    exports.MAX_FILE_BYTES = 64 * 1024 * 1024;
    class TemplateDocumentError extends Error {
        constructor(code, version) {
            super(code);
            this.name = 'TemplateDocumentError';
            this.code = code;
            this.version = version;
        }
    }
    exports.TemplateDocumentError = TemplateDocumentError;
    // MARK: - 字节
    /** 不依赖 TextEncoder：算一段字符串的 UTF-8 字节数。 */
    function utf8ByteLength(text) {
        let bytes = 0;
        for (let i = 0; i < text.length; i++) {
            const code = text.charCodeAt(i);
            if (code < 0x80)
                bytes += 1;
            else if (code < 0x800)
                bytes += 2;
            else if (code >= 0xd800 && code <= 0xdbff && i + 1 < text.length) {
                const next = text.charCodeAt(i + 1);
                if (next >= 0xdc00 && next <= 0xdfff) {
                    bytes += 4;
                    i++;
                }
                else
                    bytes += 3;
            }
            else
                bytes += 3;
        }
        return bytes;
    }
    const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    /** base64 的前若干字节，只为看魔数。 */
    function base64Bytes(text, limit) {
        const clean = String(text).replace(/[^A-Za-z0-9+/]/g, '');
        const out = [];
        let buffer = 0;
        let bits = 0;
        for (let i = 0; i < clean.length && out.length < limit; i++) {
            const index = B64.indexOf(clean.charAt(i));
            if (index < 0)
                continue;
            buffer = (buffer << 6) | index;
            bits += 6;
            if (bits >= 8) {
                bits -= 8;
                out.push((buffer >> bits) & 255);
            }
        }
        return out;
    }
    /** base64 解出来有多少字节，不用真的解码。 */
    function base64ByteCount(text) {
        const clean = String(text).replace(/[^A-Za-z0-9+/=]/g, '');
        let pad = 0;
        if (clean.charAt(clean.length - 1) === '=')
            pad++;
        if (clean.charAt(clean.length - 2) === '=')
            pad++;
        return Math.floor(clean.length / 4) * 3 - pad;
    }
    function bytesOf(value, limit) {
        if (typeof value === 'string')
            return base64Bytes(value, limit);
        return Array.from(value).slice(0, limit);
    }
    function ascii(bytes, from, to) {
        let text = '';
        for (let i = from; i < to; i++)
            text += String.fromCharCode(bytes[i]);
        return text;
    }
    const HEIF_BRANDS = ['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1', 'avif'];
    const VIDEO_BRANDS = ['qt  ', 'isom', 'mp41', 'mp42', 'M4V ', 'avc1'];
    /**
     * 只看魔数，所以不需要图片解码器也能测。
     * 过了这一关的文件仍然可能解不出图；那时编辑器退回纯色底，和缺图一样。
     */
    function isSupportedImage(value) {
        const b = bytesOf(value, 12);
        if (b.length < 12)
            return false;
        if (b[0] === 0x89 &&
            b[1] === 0x50 &&
            b[2] === 0x4e &&
            b[3] === 0x47 &&
            b[4] === 0x0d &&
            b[5] === 0x0a &&
            b[6] === 0x1a &&
            b[7] === 0x0a)
            return true; // PNG
        if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff)
            return true; // JPEG
        if (ascii(b, 0, 4) === 'GIF8')
            return true;
        if (ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 12) === 'WEBP')
            return true;
        if (ascii(b, 4, 8) === 'ftyp')
            return HEIF_BRANDS.includes(ascii(b, 8, 12));
        return false;
    }
    /** 只认 QuickTime / MP4——实况照片的视频就是这两种。 */
    function isSupportedVideo(value) {
        const b = bytesOf(value, 12);
        if (b.length < 12 || ascii(b, 4, 8) !== 'ftyp')
            return false;
        return VIDEO_BRANDS.includes(ascii(b, 8, 12));
    }
    // MARK: - 规范化编码
    /** JSON.stringify 按插入顺序排键，Swift 按字典序，所以自己排。 */
    function stableStringify(value) {
        if (value === null)
            return 'null';
        const type = typeof value;
        if (type === 'number') {
            if (!Number.isFinite(value))
                throw new TemplateDocumentError('invalidData');
            return JSON.stringify(value);
        }
        if (type === 'boolean' || type === 'string')
            return JSON.stringify(value);
        if (Array.isArray(value))
            return '[' + value.map(stableStringify).join(',') + ']';
        const object = value;
        const keys = Object.keys(object)
            .filter((key) => object[key] !== undefined)
            .sort();
        return ('{' +
            keys.map((key) => JSON.stringify(key) + ':' + stableStringify(object[key])).join(',') +
            '}');
    }
    // MARK: - 编码（省略缺省值）
    function encodeColor(color) {
        return { alpha: color.alpha, blue: color.blue, green: color.green, red: color.red };
    }
    function encodeSize(rule) {
        return typeof rule === 'object' ? { fraction: rule.fraction } : rule;
    }
    function encodePadding(box) {
        return { bottom: box.bottom, left: box.left, right: box.right, top: box.top };
    }
    function encodeStroke(stroke) {
        const out = { color: encodeColor(stroke.color), width: stroke.width };
        if (stroke.accent)
            out.accent = stroke.accent;
        if (stroke.dashLength)
            out.dashLength = stroke.dashLength;
        if (stroke.dashGap)
            out.dashGap = stroke.dashGap;
        return out;
    }
    function encodeImageSource(source) {
        if (source === 'cover')
            return 'cover';
        if ('data' in source)
            return { data: source.data };
        return { asset: source.asset };
    }
    /**
     * 一个节点。`kind` 与 `id` 永远写；其余只写「和缺省值不一样」的那些。
     * 模型本身已经是规范形（sanitize 把等于缺省值的可选字段收成 undefined），
     * 所以这里的判断几乎都是「有没有」。
     */
    function encodeNode(node) {
        const out = { id: node.id, kind: node.kind };
        if (node.visible === false)
            out.visible = false;
        if (node.opacity !== undefined)
            out.opacity = node.opacity;
        if (node.rotation)
            out.rotation = node.rotation;
        if (node.position === 'absolute')
            out.position = 'absolute';
        if (node.anchor)
            out.anchor = node.anchor;
        if (node.offsetX)
            out.offsetX = node.offsetX;
        if (node.offsetY)
            out.offsetY = node.offsetY;
        if (node.width !== undefined)
            out.width = encodeSize(node.width);
        if (node.height !== undefined)
            out.height = encodeSize(node.height);
        if (node.minWidth)
            out.minWidth = node.minWidth;
        if (node.maxWidth)
            out.maxWidth = node.maxWidth;
        if (node.minHeight)
            out.minHeight = node.minHeight;
        if (node.maxHeight)
            out.maxHeight = node.maxHeight;
        if (node.grow !== undefined)
            out.grow = node.grow;
        if (node.alignSelf)
            out.alignSelf = node.alignSelf;
        switch (node.kind) {
            case 'stack':
                out.direction = node.direction;
                out.children = node.children.map(encodeNode);
                if (node.gap)
                    out.gap = node.gap;
                if (node.padding)
                    out.padding = encodePadding(node.padding);
                if (node.align)
                    out.align = node.align;
                if (node.justify)
                    out.justify = node.justify;
                if (node.fill)
                    out.fill = encodeColor(node.fill);
                if (node.fillAccent)
                    out.fillAccent = node.fillAccent;
                if (node.cornerRadius)
                    out.cornerRadius = node.cornerRadius;
                if (node.stroke)
                    out.stroke = encodeStroke(node.stroke);
                if (node.clip)
                    out.clip = true;
                if (node.collapseWhenEmpty === false)
                    out.collapseWhenEmpty = false;
                break;
            case 'text':
                out.field = node.field;
                out.fontSize = node.fontSize;
                out.weight = node.weight;
                out.design = node.design;
                out.alignment = node.alignment;
                out.color = encodeColor(node.color);
                out.lineLimit = node.lineLimit;
                if (node.text)
                    out.text = node.text;
                if (node.label)
                    out.label = node.label;
                if (node.inlineLabel)
                    out.inlineLabel = true;
                if (node.accent)
                    out.accent = node.accent;
                if (node.tracking)
                    out.tracking = node.tracking;
                if (node.uppercase)
                    out.uppercase = true;
                if (node.chip)
                    out.chip = encodeColor(node.chip);
                if (node.chipAccent)
                    out.chipAccent = node.chipAccent;
                if (node.hideWhenEmpty === false)
                    out.hideWhenEmpty = false;
                break;
            case 'image':
                out.source = encodeImageSource(node.source);
                if (node.aspect !== 1)
                    out.aspect = node.aspect;
                if (node.fit !== 'cover')
                    out.fit = node.fit;
                if (node.focusX !== 0.5)
                    out.focusX = node.focusX;
                if (node.focusY !== 0.5)
                    out.focusY = node.focusY;
                if (node.zoom !== 1)
                    out.zoom = node.zoom;
                if (node.tilt)
                    out.tilt = node.tilt;
                if (node.imageAspect !== undefined)
                    out.imageAspect = node.imageAspect;
                if (node.isSticker)
                    out.isSticker = true;
                if (node.video)
                    out.video = encodeImageSource(node.video);
                if (node.cornerRadius)
                    out.cornerRadius = node.cornerRadius;
                if (node.border)
                    out.border = node.border;
                if (node.shadow)
                    out.shadow = true;
                break;
            case 'shape':
                out.shape = node.shape;
                out.color = encodeColor(node.color);
                if (node.accent)
                    out.accent = node.accent;
                if (node.cornerRadius)
                    out.cornerRadius = node.cornerRadius;
                if (node.strokeWidth)
                    out.strokeWidth = node.strokeWidth;
                if (node.dashLength)
                    out.dashLength = node.dashLength;
                if (node.dashGap)
                    out.dashGap = node.dashGap;
                break;
            default:
                break; // spacer 只有 base
        }
        return out;
    }
    function encodeCanvas(canvas) {
        const out = {
            background: encodeColor(canvas.background),
            // 宽永远是 360，不进文件。
            height: canvas.height === 'hug' ? 'hug' : { aspect: canvas.height.aspect },
        };
        if (!isZeroBox(canvas.padding))
            out.padding = encodePadding(canvas.padding);
        if (canvas.backgroundAccent)
            out.backgroundAccent = canvas.backgroundAccent;
        if (canvas.exportWidth !== undefined)
            out.exportWidth = canvas.exportWidth;
        const image = canvas.image;
        if (image) {
            const value = {};
            if (image.data)
                value.data = image.data;
            if (image.asset)
                value.asset = image.asset;
            if (image.imageAspect !== undefined)
                value.imageAspect = image.imageAspect;
            if (image.focusX !== 0.5)
                value.focusX = image.focusX;
            if (image.focusY !== 0.5)
                value.focusY = image.focusY;
            if (image.zoom !== 1)
                value.zoom = image.zoom;
            if (image.opacity !== 1)
                value.opacity = image.opacity;
            out.image = value;
        }
        return out;
    }
    function isZeroBox(box) {
        return !box || (!box.top && !box.right && !box.bottom && !box.left);
    }
    /** 档案（`posterTemplates`）与文件共用的形状。 */
    function encodeTemplate(template) {
        return {
            canvas: encodeCanvas(template.canvas),
            createdAt: template.createdAt,
            id: template.id,
            name: template.name,
            root: encodeNode(template.root),
            updatedAt: template.updatedAt,
        };
    }
    /** 解码 = 清洗：编码写出来的就是模型的形状，缺的字段各自退回缺省值。 */
    function decodeTemplate(raw, env) {
        return (0, model_1.sanitizeTemplate)(raw, env);
    }
    function collectMedia(template) {
        const images = [];
        const videos = [];
        let assets = false;
        const image = template.canvas.image;
        if (image === null || image === void 0 ? void 0 : image.data)
            images.push(image.data);
        if (image === null || image === void 0 ? void 0 : image.asset)
            assets = true;
        (0, model_1.walkNodes)(template.root, (node) => {
            if (node.kind !== 'image')
                return;
            if (node.source !== 'cover') {
                if ('data' in node.source)
                    images.push(node.source.data);
                else
                    assets = true;
            }
            if (node.video) {
                if ('data' in node.video)
                    videos.push(node.video.data);
                else
                    assets = true;
            }
        });
        return { images, videos, assets };
    }
    /** 文件里只认内联的字节：带资产引用的模版得先由调用方把原图取出来。 */
    function checkMedia(media) {
        if (media.assets)
            throw new TemplateDocumentError('invalidData');
        for (const data of media.images) {
            if (!isSupportedImage(data))
                throw new TemplateDocumentError('unsupportedImage');
            if (base64ByteCount(data) > exports.MAX_BYTES)
                throw new TemplateDocumentError('tooLarge');
        }
        for (const data of media.videos) {
            if (!isSupportedVideo(data))
                throw new TemplateDocumentError('unsupportedImage');
            if (base64ByteCount(data) > exports.MAX_VIDEO_BYTES)
                throw new TemplateDocumentError('tooLarge');
        }
    }
    // MARK: - 写
    /**
     * `template` 必须已经把图放在身上（`{ data }`）；调用方先把存好的资产取出来，
     * 和完整备份的做法一样。返回模版文件的 JSON 文本（落盘前再 gzip 成 `.livemark`）。
     */
    function encodeTemplateDocument(template, env) {
        const e = (0, model_1.resolveEnvironment)(env);
        const value = (0, model_1.sanitizeTemplate)(template, env);
        checkMedia(collectMedia(value));
        const text = stableStringify({
            app: exports.TEMPLATE_DOCUMENT_APP,
            exportedAt: e.now(),
            template: encodeTemplate(value),
            version: exports.TEMPLATE_DOCUMENT_VERSION,
        });
        const limit = (0, model_1.templateHasLivePhoto)(value) ? exports.MAX_FILE_BYTES : exports.MAX_BYTES;
        if (utf8ByteLength(text) > limit)
            throw new TemplateDocumentError('tooLarge');
        return text;
    }
    /** 一个哪个文件系统都收得下、又说得清自己是什么的文件名。 */
    function templateFileName(template) {
        var _a;
        const cleaned = String((_a = template.name) !== null && _a !== void 0 ? _a : '')
            .split(/[/\\:?%*|"<>\n\r]/)
            .join('-');
        const trimmed = (0, model_1.prefixChars)(cleaned.trim(), 40);
        return (trimmed || '我的模版') + '.' + exports.TEMPLATE_FILE_EXTENSION;
    }
    // MARK: - 读
    /**
     * 读出来的模版可以直接存：已清洗、换了新身份，节点 id 也去过重，
     * 手改过的文件污染不了档案。版本 1 是 v1 的绝对定位模版，明确不兼容。
     */
    function decodeTemplateDocument(text, env) {
        const e = (0, model_1.resolveEnvironment)(env);
        const bytes = utf8ByteLength(text);
        if (bytes > exports.MAX_FILE_BYTES)
            throw new TemplateDocumentError('tooLarge');
        let document;
        try {
            document = JSON.parse(text);
        }
        catch {
            throw new TemplateDocumentError('invalidData');
        }
        if (!document || typeof document !== 'object' || Array.isArray(document)) {
            throw new TemplateDocumentError('invalidData');
        }
        const object = document;
        // 这四个键缺一个就是「读不出来」，和 Swift 的合成解码器一致。
        if (typeof object.version !== 'number' ||
            typeof object.app !== 'string' ||
            typeof object.exportedAt !== 'string' ||
            Number.isNaN(Date.parse(object.exportedAt)) ||
            !object.template ||
            typeof object.template !== 'object' ||
            Array.isArray(object.template)) {
            throw new TemplateDocumentError('invalidData');
        }
        if (object.version !== exports.TEMPLATE_DOCUMENT_VERSION) {
            throw new TemplateDocumentError('unsupportedVersion', object.version);
        }
        const rawTemplate = object.template;
        // 一份模版至少得有棵树；没有 root 的多半是别的东西改了扩展名。
        if (!rawTemplate.root || typeof rawTemplate.root !== 'object' || Array.isArray(rawTemplate.root)) {
            throw new TemplateDocumentError('invalidData');
        }
        const sanitized = decodeTemplate(rawTemplate, env);
        if (bytes > ((0, model_1.templateHasLivePhoto)(sanitized) ? exports.MAX_FILE_BYTES : exports.MAX_BYTES)) {
            throw new TemplateDocumentError('tooLarge');
        }
        checkMedia(collectMedia(sanitized));
        const now = e.now();
        return { ...sanitized, id: e.newID(), createdAt: now, updatedAt: now };
    }
    /** 文件名的扩展名是不是我们认的（新名或旧名）。 */
    function isTemplateFileName(name) {
        const parts = String(name).toLowerCase().split('.');
        return parts.length > 1 && exports.TEMPLATE_FILE_EXTENSIONS.includes(parts[parts.length - 1]);
    }
    /** 导入前的一眼判断：这串文本像不像一个模版文件。 */
    function looksLikeTemplateDocument(text) {
        try {
            const object = JSON.parse(text);
            return (!!object &&
                typeof object === 'object' &&
                typeof object.version === 'number' &&
                !!object.template &&
                (object.app === exports.TEMPLATE_DOCUMENT_APP || (0, model_1.isUUID)(object.template.id)));
        }
        catch {
            return false;
        }
    }
    function templateDocumentBody(template, exportedAt = (0, model_1.isoString)()) {
        return {
            version: exports.TEMPLATE_DOCUMENT_VERSION,
            app: exports.TEMPLATE_DOCUMENT_APP,
            exportedAt,
            template: encodeTemplate((0, model_1.sanitizeTemplate)(template)),
        };
    }

  });

  define("core/template/builtins", function (module, exports, require) {
    "use strict";
    // 九种内置风格（海报体系 v2）。设计规格见 Documentation/POSTER.md 第 5 节。
    //
    // 内置风格就是普通模版，只是由代码写死，所以工坊用同一个编辑器去改它们：
    // 每一条带子、每一根线、每一张贴纸、每一行字都是树上的一个节点。
    //
    // v1 是在 360 × H 的画布上写死每个元素的中心点；v2 改成「同一水平线上的几块写成 row、
    // 上下相继的写成 column」，字号 / 字重 / 字体 / 颜色 / 不透明度 / 字距 / 行数照搬 v1，
    // 于是观感照旧，但每一块都是响应式的：一个字段没值，那一块收起，海报自己变短。
    //
    // 每种风格的 id 固定，节点 id 也固定（风格前缀 + 前序序号），
    // 草稿、存下来的副本与出厂排版因此对得上谁是谁。
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BUILT_IN_TEMPLATE_IDS = exports.SHARE_STYLES = void 0;
    exports.templateIDForStyle = templateIDForStyle;
    exports.styleForTemplateID = styleForTemplateID;
    exports.isBuiltInTemplate = isBuiltInTemplate;
    exports.col = col;
    exports.row = row;
    exports.band = band;
    exports.text = text;
    exports.micro = micro;
    exports.image = image;
    exports.cover = cover;
    exports.shape = shape;
    exports.rule = rule;
    exports.spacer = spacer;
    exports.abs = abs;
    exports.builtInTemplate = builtInTemplate;
    exports.builtInTemplates = builtInTemplates;
    const model_1 = require("./model");
    // MARK: - 风格与固定标识
    exports.SHARE_STYLES = [
        '经典票根',
        '杂志封面',
        '电影字幕',
        '艺术海报',
        '登机牌',
        '手帐拼贴',
        '黑胶唱片',
        '回忆小票',
        '极简留白',
    ];
    const TEMPLATE_ID_PREFIX = '4C49564D-4152-4B00-8000-0000000000';
    function templateIDForStyle(style) {
        const index = exports.SHARE_STYLES.indexOf(style);
        return TEMPLATE_ID_PREFIX + String(index + 1).padStart(2, '0');
    }
    function styleForTemplateID(id) {
        var _a;
        const upper = String(id).toUpperCase();
        return (_a = exports.SHARE_STYLES.find((style) => templateIDForStyle(style) === upper)) !== null && _a !== void 0 ? _a : null;
    }
    exports.BUILT_IN_TEMPLATE_IDS = exports.SHARE_STYLES.map(templateIDForStyle);
    function isBuiltInTemplate(template) {
        return exports.BUILT_IN_TEMPLATE_IDS.includes(String(template.id).toUpperCase());
    }
    // MARK: - 颜色
    const PAPER = (0, model_1.colorFromHex)(0xf6f3e9);
    const INK = (0, model_1.colorFromHex)(0x20251f);
    const NIGHT = (0, model_1.colorFromHex)(0x141618);
    const NOTCH = (0, model_1.colorFromHex)(0xe4e0d4);
    const RECEIPT_PAPER = (0, model_1.colorFromHex)(0xfcfbf6);
    const JOURNAL_PAPER = (0, model_1.colorFromHex)(0xf2ecdd);
    const SUBTITLE_GOLD = (0, model_1.colorFromHex)(0xf2d27a);
    const DISC = (0, model_1.colorFromHex)(0x1b1d1c);
    const WHITE = model_1.Palette.white;
    function toPadding(value) {
        if (value === undefined)
            return undefined;
        if (typeof value === 'number')
            return (0, model_1.padding)(value);
        if (Array.isArray(value))
            return (0, model_1.padding)(value[0], value[1]);
        return value;
    }
    function baseOf(options) {
        return {
            width: options.width,
            height: options.height,
            grow: options.grow,
            alignSelf: options.alignSelf,
            opacity: options.opacity,
            rotation: options.rotation,
        };
    }
    function stack(direction, options, children) {
        return (0, model_1.makeStackNode)(direction, {
            ...baseOf(options),
            gap: options.gap,
            padding: toPadding(options.padding),
            align: options.align,
            justify: options.justify,
            fill: options.fill,
            fillAccent: options.fillAccent,
            cornerRadius: options.radius,
            stroke: options.stroke,
            clip: options.clip,
            collapseWhenEmpty: options.keep ? false : undefined,
            children: children.slice(),
        });
    }
    function col(options, children) {
        return stack('column', options, children);
    }
    function row(options, children) {
        return stack('row', options, children);
    }
    /** 有底色的 stack：小票的纸、手帐的相纸、票根的色带。 */
    function band(options, children) {
        return stack('column', options, children);
    }
    function text(field, options = {}) {
        return (0, model_1.makeTextNode)(field, {
            ...baseOf(options),
            fontSize: options.size,
            weight: options.weight,
            design: options.design,
            alignment: options.align,
            color: options.color,
            accent: options.accent,
            tracking: options.tracking,
            lineLimit: options.lines,
            label: options.label,
            text: options.text,
            uppercase: options.uppercase,
            chip: options.chip,
            chipAccent: options.chipAccent,
            inlineLabel: options.inline,
            hideWhenEmpty: options.keep ? false : undefined,
        });
    }
    /** 票根上那种小号等宽说明字：“ADMIT ONE”、“NO. 12”。 */
    function micro(field, options = {}) {
        return text(field, {
            size: 8,
            weight: '半粗',
            design: '等宽',
            tracking: 2,
            lines: 1,
            uppercase: true,
            ...options,
        });
    }
    function image(source, options = {}) {
        return (0, model_1.makeImageNode)(source, {
            ...baseOf(options),
            aspect: options.aspect,
            fit: options.fit,
            cornerRadius: options.radius,
            border: options.border,
            shadow: options.shadow,
            focusX: options.focusX,
            focusY: options.focusY,
            zoom: options.zoom,
            tilt: options.tilt,
        });
    }
    /** 记录封面。 */
    function cover(options = {}) {
        return image('cover', options);
    }
    function shape(kind, options = {}) {
        var _a, _b, _c;
        return (0, model_1.makeShapeNode)(kind, {
            ...baseOf(options),
            height: (_a = options.height) !== null && _a !== void 0 ? _a : options.h,
            color: options.color,
            accent: options.accent,
            cornerRadius: options.radius,
            strokeWidth: options.stroke,
            dashLength: (_b = options.dash) === null || _b === void 0 ? void 0 : _b[0],
            dashGap: (_c = options.dash) === null || _c === void 0 ? void 0 : _c[1],
        });
    }
    /** 一根 1 pt 的线，可虚可实。 */
    function rule(options = {}) {
        return shape('直线', { h: 1, stroke: 1, color: INK, ...options });
    }
    function spacer() {
        return (0, model_1.makeSpacerNode)();
    }
    /** 绝对定位：贴纸、印章、撕口的缺口圆、压在封面上的字。 */
    function abs(node, anchor, offset = {}) {
        var _a, _b;
        return {
            ...node,
            position: 'absolute',
            anchor,
            offsetX: (_a = offset.x) !== null && _a !== void 0 ? _a : 0,
            offsetY: (_b = offset.y) !== null && _b !== void 0 ? _b : 0,
        };
    }
    // MARK: - 组合件
    /** 票根与登机牌上那条带缺口的虚线撕口：一根虚线 + 压在画布左右边缘的两个圆。 */
    function perforation(notch = NOTCH, ink = INK) {
        return col({ height: 22, justify: 'center', keep: true }, [
            rule({ width: 316, alignSelf: 'center', color: ink, opacity: 0.28, dash: [3, 4] }),
            abs(shape('圆形', { width: 22, h: 22, color: notch }), 'left', { x: -11 }),
            abs(shape('圆形', { width: 22, h: 22, color: notch }), 'right', { x: 11 }),
        ]);
    }
    /** 小票的一行：标签在左，值靠右；值没有时整行消失。 */
    function receiptRow(field, label, weight = '中等') {
        return text(field, {
            size: 11,
            weight,
            design: '等宽',
            align: '右对齐',
            lines: 2,
            label,
            inline: true,
        });
    }
    function canvasOf(background, options = {}) {
        var _a;
        return {
            width: 360,
            height: options.aspect === undefined ? 'hug' : { aspect: options.aspect },
            padding: (_a = toPadding(options.padding)) !== null && _a !== void 0 ? _a : model_1.ZERO_PADDING,
            background: { ...background },
            ...(options.accent ? { backgroundAccent: options.accent } : {}),
        };
    }
    // MARK: - 经典票根
    // 顶部色带 → 封面 5:6 → 开场白 / 名称 / 副标题 → 两列信息 ×2 → 评分 | 心情 → 撕口 → 标识 | 条码。
    function ticket() {
        return {
            canvas: canvasOf(PAPER),
            root: col({}, [
                row({ height: 44, padding: [0, 24], align: 'center', fillAccent: '主题色' }, [
                    micro('自定义文字', { text: 'ADMIT ONE' }),
                    micro('编号', { align: '右对齐' }),
                ]),
                cover({ aspect: 5 / 6 }),
                col({ padding: [20, 24], gap: 10 }, [
                    text('开场白', { size: 10, weight: '半粗', accent: '主题深色', tracking: 2, lines: 1 }),
                    text('名称', { size: 26, weight: '特粗', tracking: -0.5, lines: 2 }),
                    text('副标题', { size: 11, lines: 1, opacity: 0.7 }),
                    row({ gap: 8 }, [
                        text('日期', { size: 12, weight: '半粗', lines: 1, label: 'DATE' }),
                        text('城市与场馆', { size: 12, weight: '半粗', lines: 2, label: 'VENUE' }),
                    ]),
                    row({ gap: 8 }, [
                        text('座位', { size: 12, weight: '半粗', lines: 1, label: 'SEAT' }),
                        text('票价', { size: 12, weight: '半粗', lines: 1, label: 'PRICE' }),
                    ]),
                    row({ gap: 8, align: 'center' }, [
                        text('评分星星', { size: 11, lines: 1 }),
                        text('心情', { size: 10, weight: '中等', align: '右对齐', lines: 1 }),
                    ]),
                ]),
                perforation(),
                row({ padding: [14, 24], align: 'center' }, [
                    text('余响标识', { size: 14, lines: 1 }),
                    text('条码', { size: 11, lines: 1, width: 88, align: '右对齐' }),
                ]),
            ]),
        };
    }
    // MARK: - 杂志封面
    // 固定比例画布；封面铺满，两条渐变压在上面，字分上下两组由 spacer 撑开。
    function magazine() {
        return {
            canvas: canvasOf(NIGHT, { aspect: 1.72 }),
            root: col({}, [
                cover({ height: 'fill' }),
                abs(shape('渐变', { h: 210, color: model_1.Palette.black, opacity: 0.62 }), 'top'),
                abs(shape('渐变', { h: 340, color: model_1.Palette.black, opacity: 0.9, rotation: 180 }), 'bottom'),
                abs(col({ height: 'fill', padding: [30, 22], gap: 10 }, [
                    col({ gap: 8 }, [
                        text('余响标识', {
                            size: 62,
                            weight: '特粗',
                            color: WHITE,
                            tracking: -2,
                            lines: 1,
                        }),
                        shape('矩形', { width: 46, h: 3, accent: '主题色' }),
                        row({ gap: 8, align: 'center' }, [
                            micro('英文类型', { color: WHITE }),
                            micro('编号', { align: '右对齐', color: WHITE }),
                        ]),
                    ]),
                    spacer(),
                    col({ gap: 8 }, [
                        text('开场白', { size: 10, weight: '粗体', accent: '主题色', tracking: 2, lines: 1 }),
                        text('名称', { size: 32, weight: '特粗', color: WHITE, tracking: -1, lines: 3 }),
                        text('金句', {
                            size: 13,
                            weight: '中等',
                            design: '宋体',
                            color: WHITE,
                            lines: 2,
                            opacity: 0.92,
                        }),
                        text('城市与场馆', {
                            size: 10,
                            weight: '半粗',
                            color: WHITE,
                            tracking: 0.5,
                            lines: 1,
                            opacity: 0.85,
                        }),
                        row({ gap: 8, align: 'center' }, [
                            text('日期', {
                                size: 10,
                                weight: '半粗',
                                color: WHITE,
                                tracking: 0.5,
                                lines: 1,
                                opacity: 0.85,
                            }),
                            text('评分星星', { size: 10, align: '右对齐', color: WHITE, lines: 1 }),
                        ]),
                        row({ gap: 8, align: 'center' }, [
                            text('余响标识', { size: 14, color: WHITE, lines: 1 }),
                            text('条码', { size: 10, color: WHITE, lines: 1, width: 72, align: '右对齐' }),
                        ]),
                    ]),
                ]), 'center'),
            ]),
        };
    }
    // MARK: - 电影字幕
    // 胶片孔 → 顶行 → 封面 → 金句芯片 → 居中的一叠 → 底行 → 胶片孔。
    function cinema() {
        const sprocket = () => shape('胶片孔', { h: 8, width: 328, alignSelf: 'center', color: PAPER, radius: 2, dash: [18, 10], opacity: 0.4 });
        return {
            canvas: canvasOf(NIGHT),
            root: col({}, [
                col({ padding: [16, 16], gap: 14 }, [
                    sprocket(),
                    row({ gap: 8, align: 'center' }, [
                        micro('自定义文字', { text: 'NOW SHOWING', color: WHITE, opacity: 0.6 }),
                        micro('时间', { align: '右对齐', color: WHITE, opacity: 0.6 }),
                    ]),
                ]),
                cover({ aspect: 340 / 360 }),
                col({ padding: [20, 24], gap: 12, align: 'center' }, [
                    text('金句', {
                        size: 14,
                        weight: '中等',
                        align: '居中',
                        color: SUBTITLE_GOLD,
                        lines: 2,
                        chip: (0, model_1.colorFromHex)(0x000000, 0.55),
                    }),
                    text('开场白', {
                        size: 9,
                        weight: '中等',
                        design: '等宽',
                        align: '居中',
                        color: WHITE,
                        tracking: 2,
                        lines: 1,
                        opacity: 0.6,
                    }),
                    text('名称', { size: 24, weight: '粗体', align: '居中', color: WHITE, lines: 2 }),
                    text('城市与场馆', {
                        size: 10,
                        weight: '中等',
                        align: '居中',
                        color: WHITE,
                        lines: 1,
                        opacity: 0.65,
                    }),
                    text('日期', {
                        size: 10,
                        weight: '中等',
                        align: '居中',
                        color: WHITE,
                        lines: 1,
                        opacity: 0.65,
                    }),
                    text('评分星星', { size: 10, align: '居中', color: WHITE, lines: 1 }),
                    text('感想', { size: 11, align: '居中', color: WHITE, lines: 2, opacity: 0.7 }),
                ]),
                col({ padding: [10, 16], gap: 14 }, [
                    row({ gap: 8, align: 'center' }, [
                        text('余响标识', { size: 14, color: WHITE, lines: 1 }),
                        micro('英文类型', { align: '右对齐', color: WHITE }),
                    ]),
                    sprocket(),
                ]),
            ]),
        };
    }
    // MARK: - 艺术海报
    // 顶行 → 大标题 → 圆形封面 → 月日 + 年份 | 开场白 + 地点 + 评分 → 金句 → 底行。
    function poster() {
        return {
            canvas: canvasOf(model_1.Palette.lilac, { padding: [24, 24], accent: '主题色' }),
            root: col({ gap: 16 }, [
                row({ gap: 8, align: 'center' }, [
                    micro('余响标识'),
                    micro('英文类型', { align: '右对齐' }),
                ]),
                text('名称', { size: 40, weight: '特粗', tracking: -2, lines: 2 }),
                cover({ aspect: 1.04, radius: 156 }),
                row({ gap: 12 }, [
                    col({ gap: 2 }, [
                        text('月日', { size: 44, weight: '特粗', tracking: -2, lines: 1 }),
                        text('年份', { size: 8, weight: '半粗', tracking: 2, lines: 1 }),
                    ]),
                    col({ gap: 4 }, [
                        text('开场白', { size: 11, weight: '粗体', align: '右对齐', tracking: 1, lines: 2 }),
                        text('城市与场馆', { size: 10, align: '右对齐', lines: 1, opacity: 0.8 }),
                        text('评分星星', { size: 9, align: '右对齐', lines: 1 }),
                    ]),
                ]),
                text('金句', { size: 13, weight: '中等', design: '宋体', lines: 2 }),
                row({ gap: 8, align: 'center' }, [
                    text('余响标识', { size: 14, lines: 1 }),
                    micro('编号', { align: '右对齐' }),
                ]),
            ]),
        };
    }
    // MARK: - 登机牌
    // 黑色色带 → 封面 2:1 → FROM ✈ TO → 名称 → 三列 ×2 → 票价 | 同行人 → 金句 → 撕口 → 署名 → 标识 | 条码。
    function boarding() {
        return {
            canvas: canvasOf(PAPER),
            root: col({}, [
                row({ height: 40, padding: [0, 22], align: 'center', fill: INK }, [
                    micro('自定义文字', { text: '✈ LIVEMARK AIR · BOARDING PASS', color: PAPER }),
                    micro('英文类型', { align: '右对齐', color: PAPER, width: 120 }),
                ]),
                cover({ aspect: 0.5 }),
                col({ padding: [18, 22], gap: 14 }, [
                    row({ gap: 10, align: 'center' }, [
                        text('自定义文字', {
                            size: 28,
                            weight: '特粗',
                            lines: 1,
                            label: 'FROM',
                            text: '日常',
                            width: 'hug',
                        }),
                        col({ gap: 2, align: 'center' }, [
                            text('自定义文字', { size: 13, align: '居中', lines: 1, opacity: 0.5, text: '✈' }),
                            rule({ width: 70, alignSelf: 'center', dash: [2, 3], opacity: 0.5 }),
                        ]),
                        text('自定义文字', {
                            size: 28,
                            weight: '特粗',
                            align: '右对齐',
                            lines: 1,
                            label: 'TO',
                            text: '现场',
                            width: 'hug',
                        }),
                    ]),
                    text('名称', { size: 18, weight: '粗体', lines: 2 }),
                    row({ gap: 10 }, [
                        text('数字日期', { size: 12, weight: '半粗', design: '黑体', lines: 1, label: 'DATE' }),
                        text('时间', { size: 12, weight: '半粗', design: '黑体', lines: 1, label: 'BOARDING' }),
                        text('城市', { size: 12, weight: '半粗', lines: 1, label: 'GATE' }),
                    ]),
                    row({ gap: 10 }, [
                        text('场馆', { size: 12, weight: '半粗', lines: 2, label: 'VENUE' }),
                        text('座位', { size: 12, weight: '半粗', lines: 1, label: 'SEAT' }),
                        text('心情', { size: 12, weight: '半粗', lines: 1, label: 'CLASS' }),
                    ]),
                    row({ gap: 10 }, [
                        text('票价', { size: 12, weight: '半粗', lines: 1, label: 'FARE' }),
                        text('同行人', { size: 12, weight: '半粗', lines: 1, label: 'TRAVELLING WITH', grow: 2 }),
                    ]),
                    text('金句', { size: 12, weight: '中等', design: '宋体', lines: 2, opacity: 0.85 }),
                ]),
                perforation(),
                col({ padding: [14, 22], gap: 12 }, [
                    text('署名', { size: 8, lines: 1, opacity: 0.7, label: 'PASSENGER' }),
                    row({ gap: 8, align: 'center' }, [
                        text('余响标识', { size: 11, lines: 1 }),
                        text('条码', { size: 14, lines: 1, width: 104, align: '右对齐' }),
                    ]),
                ]),
            ]),
        };
    }
    // MARK: - 手帐拼贴
    // 点阵底（绝对定位铺满，排在第一个所以垫在最底下）→ dear diary | 数字日期 → 相纸（白底微倾）
    // → 三枚芯片 → 名称 / 感想 / 地点 / 日期 | 评分 / 署名 → 和纸胶带（排在最后，压在最上面）。
    function journal() {
        return {
            // 画布不留内边距：点阵纸纹要铺满整张海报，内边距交给里面那一列。
            canvas: canvasOf(JOURNAL_PAPER),
            root: col({}, [
                // 点阵纸纹排在第一个 = 垫在所有内容底下，高度跟着内容走。
                abs(shape('点阵', {
                    height: 'fill',
                    color: model_1.Palette.black,
                    stroke: 1.5,
                    dash: [0, 18],
                    opacity: 0.07,
                }), 'center'),
                col({ padding: [26, 26], gap: 16 }, [
                    row({ gap: 8, align: 'center' }, [
                        text('自定义文字', {
                            size: 22,
                            weight: '中等',
                            design: '宋体',
                            lines: 1,
                            text: 'dear diary,',
                        }),
                        text('数字日期', {
                            size: 11,
                            weight: '粗体',
                            align: '右对齐',
                            color: model_1.Palette.stamp,
                            lines: 1,
                            opacity: 0.85,
                            rotation: 6,
                            width: 'hug',
                        }),
                    ]),
                    band({ fill: WHITE, radius: 1, padding: 10, gap: 10, rotation: -2.5 }, [
                        cover({ aspect: 320 / 286, radius: 2, rotation: -2.5 }),
                        text('开场白', { size: 12, design: '宋体', align: '居中', lines: 2, rotation: -2.5 }),
                    ]),
                    row({ gap: 8 }, [
                        text('类型', {
                            size: 10,
                            weight: '粗体',
                            align: '居中',
                            lines: 1,
                            rotation: -3,
                            chipAccent: '主题色',
                        }),
                        text('心情', {
                            size: 10,
                            weight: '粗体',
                            align: '居中',
                            lines: 1,
                            rotation: 2,
                            chip: model_1.Palette.lime,
                        }),
                        text('城市', {
                            size: 10,
                            weight: '粗体',
                            align: '居中',
                            lines: 1,
                            rotation: -2,
                            chip: model_1.Palette.coral,
                        }),
                    ]),
                    text('名称', { size: 22, weight: '粗体', design: '宋体', lines: 2 }),
                    text('感想', { size: 12, design: '宋体', lines: 3 }),
                    text('城市与场馆', { size: 9, weight: '中等', design: '等宽', lines: 1, opacity: 0.6 }),
                    row({ gap: 8, align: 'center' }, [
                        text('日期', { size: 9, weight: '中等', design: '等宽', lines: 1, opacity: 0.6 }),
                        text('评分星星', { size: 11, align: '右对齐', color: model_1.Palette.stamp, lines: 1 }),
                    ]),
                    row({ gap: 8, align: 'center' }, [
                        text('余响标识', { size: 14, lines: 1 }),
                        text('署名', { size: 7, align: '右对齐', lines: 1, opacity: 0.6 }),
                    ]),
                ]),
                // 那片和纸胶带排在最后 = 压在标题那一行上。
                abs(shape('矩形', { width: 92, h: 24, accent: '主题色', rotation: 6, opacity: 0.85 }), 'top', {
                    y: 56,
                }),
            ]),
        };
    }
    // MARK: - 黑胶唱片
    // 顶行 → 唱片（封面与黑胶叠在一起）→ 名称 → 曲目单（没有就整块收起，海报变短）→ 金句 → 地点 → 日期 | 评分 → 标识 | 署名。
    function vinyl() {
        return {
            canvas: canvasOf(model_1.Palette.lilac, { padding: [24, 24], accent: '主题色' }),
            root: col({ gap: 16 }, [
                row({ gap: 8, align: 'center' }, [
                    micro('自定义文字', { text: 'SIDE A' }),
                    micro('自定义文字', { align: '右对齐', text: '33⅓ RPM · STEREO' }),
                ]),
                // 全是绝对定位：黑胶在下、封面盖在左边，顺序就是画的顺序。
                col({ height: 250, keep: true }, [
                    abs(shape('圆形', { width: 250, h: 250, color: DISC }), 'right', { x: 16 }),
                    abs(shape('唱片纹', {
                        width: 218,
                        h: 218,
                        color: WHITE,
                        stroke: 1,
                        dash: [0, 8],
                        opacity: 0.09,
                    }), 'right'),
                    abs(shape('圆形', { width: 96, h: 96, accent: '主题色' }), 'right', { x: -61 }),
                    abs(text('自定义文字', { size: 9, weight: '特粗', align: '居中', lines: 1, text: '33⅓', width: 80 }), 'right', { x: -69, y: -18 }),
                    abs(text('英文类型', {
                        size: 6,
                        weight: '粗体',
                        design: '等宽',
                        align: '居中',
                        tracking: 1,
                        lines: 2,
                        width: 80,
                    }), 'right', { x: -69, y: 20 }),
                    abs(shape('圆形', { width: 9, h: 9, color: DISC }), 'right', { x: -104.5 }),
                    abs(cover({ aspect: 1, width: { fraction: 0.8 }, shadow: true }), 'left'),
                ]),
                text('名称', { size: 26, weight: '特粗', tracking: -0.5, lines: 2 }),
                text('曲目单', { size: 12, weight: '中等', lines: 5 }),
                text('金句', { size: 14, weight: '中等', design: '宋体', lines: 2 }),
                text('城市与场馆', { size: 10, weight: '中等', lines: 1, opacity: 0.7 }),
                row({ gap: 8, align: 'center' }, [
                    text('日期', { size: 10, weight: '中等', lines: 1, opacity: 0.7 }),
                    text('评分星星', { size: 10, align: '右对齐', lines: 1 }),
                ]),
                row({ gap: 8, align: 'center' }, [
                    text('余响标识', { size: 14, lines: 1 }),
                    text('署名', { size: 7, align: '右对齐', lines: 1, opacity: 0.7 }),
                ]),
            ]),
        };
    }
    // MARK: - 回忆小票
    // 锯齿边的纸里：抬头 → 封面 → 虚线 → 类型 | x 1 → 名称 → 小票行 ×6 → 虚线 → 票价 ×2 → 虚线 → 金句 / 感想 / 条码 / 署名 / 开场白。
    function receipt() {
        const serration = (anchor, y) => abs(shape('锯齿边', { h: 18, color: RECEIPT_PAPER, dash: [9, 0] }), anchor, { y });
        return {
            canvas: canvasOf(model_1.Palette.lilac, { padding: 18, accent: '主题色' }),
            root: col({}, [
                band({ fill: RECEIPT_PAPER, padding: [20, 26], gap: 12, keep: true }, [
                    text('余响标识', { size: 16, weight: '特粗', design: '等宽', align: '居中', lines: 1 }),
                    micro('自定义文字', { align: '居中', text: '* MEMORY RECEIPT *' }),
                    row({ gap: 8, align: 'center' }, [
                        text('数字日期', { size: 9, design: '等宽', lines: 1, opacity: 0.6 }),
                        text('时间', { size: 9, design: '等宽', align: '右对齐', lines: 1, opacity: 0.6 }),
                    ]),
                    cover({ aspect: 1.2, width: { fraction: 0.55 }, alignSelf: 'center' }),
                    rule({ opacity: 0.4, dash: [4, 3] }),
                    row({ gap: 8, align: 'center' }, [
                        text('类型', { size: 11, weight: '中等', design: '等宽', lines: 1 }),
                        text('自定义文字', {
                            size: 11,
                            weight: '中等',
                            design: '等宽',
                            align: '右对齐',
                            lines: 1,
                            text: 'x 1',
                            width: 'hug',
                        }),
                    ]),
                    text('名称', { size: 13, weight: '粗体', design: '等宽', align: '居中', lines: 2 }),
                    col({ gap: 8 }, [
                        receiptRow('日期', 'DATE'),
                        receiptRow('城市与场馆', 'VENUE'),
                        receiptRow('座位', 'SEAT'),
                        receiptRow('同行人', 'WITH'),
                        receiptRow('评分星星', 'RATING'),
                        receiptRow('心情', 'MOOD'),
                    ]),
                    rule({ opacity: 0.4, dash: [4, 3] }),
                    col({ gap: 8 }, [receiptRow('票价', 'TICKET'), receiptRow('票价', 'TOTAL', '特粗')]),
                    rule({ opacity: 0.4, dash: [4, 3] }),
                    text('金句', {
                        size: 11,
                        weight: '中等',
                        design: '等宽',
                        align: '居中',
                        lines: 2,
                        opacity: 0.85,
                    }),
                    text('感想', { size: 10, design: '等宽', align: '居中', lines: 3, opacity: 0.7 }),
                    text('条码', { size: 14, align: '居中', lines: 1, width: 190, alignSelf: 'center' }),
                    text('署名', { size: 8, design: '等宽', align: '居中', lines: 1, opacity: 0.6 }),
                    text('开场白', { size: 9, design: '等宽', align: '居中', lines: 1, opacity: 0.6 }),
                ]),
                // 纸的上下两排齿：挂在根上（根没有内边距，锚点就是纸的边），
                // 一半压在纸上（同色、看不见），一半露在外面。
                serration('top', -9),
                serration('bottom', 9),
            ]),
        };
    }
    // MARK: - 极简留白
    // 顶行 → 线 → 开场白 → 名称 + 副标题 | 小封面 → 线 → 地点 + 日期 | 评分 → 金句 → 感想 → 底行。
    function minimal() {
        return {
            canvas: canvasOf(WHITE, { padding: [28, 28] }),
            root: col({ gap: 18 }, [
                row({ gap: 8, align: 'center' }, [micro('余响标识'), micro('编号', { align: '右对齐' })]),
                rule({}),
                text('开场白', { size: 11, lines: 1, opacity: 0.6 }),
                row({ gap: 16 }, [
                    col({ gap: 10 }, [
                        text('名称', { size: 32, weight: '常规', design: '宋体', lines: 3 }),
                        text('副标题', { size: 11, lines: 2, opacity: 0.6 }),
                    ]),
                    cover({ width: 96, height: 124, aspect: 124 / 96 }),
                ]),
                rule({}),
                row({ gap: 12 }, [
                    col({ gap: 6 }, [
                        text('城市与场馆', { size: 10, weight: '中等', design: '等宽', lines: 2, opacity: 0.75 }),
                        text('日期', { size: 10, weight: '中等', design: '等宽', lines: 1, opacity: 0.75 }),
                    ]),
                    text('评分星星', { size: 9, align: '右对齐', lines: 1, width: 100 }),
                ]),
                text('金句', { size: 15, design: '宋体', lines: 3 }),
                text('感想', { size: 12, lines: 4, opacity: 0.7 }),
                row({ gap: 8, align: 'center' }, [
                    text('余响标识', { size: 14, lines: 1 }),
                    text('英文类型', {
                        size: 9,
                        weight: '中等',
                        design: '等宽',
                        align: '右对齐',
                        tracking: 3,
                        lines: 1,
                        opacity: 0.6,
                    }),
                ]),
            ]),
        };
    }
    // MARK: - 出厂
    const BUILDERS = {
        经典票根: ticket,
        杂志封面: magazine,
        电影字幕: cinema,
        艺术海报: poster,
        登机牌: boarding,
        手帐拼贴: journal,
        黑胶唱片: vinyl,
        回忆小票: receipt,
        极简留白: minimal,
    };
    const EPOCH = (0, model_1.isoString)(new Date(0));
    const fixedEnvironment = { newID: () => '00000000-0000-0000-0000-000000000000', now: () => EPOCH };
    /** 节点 id：风格前缀 + 前序序号，每次生成都一样。 */
    function withFixedIDs(node, prefix, counter) {
        counter.n += 1;
        const id = prefix + String(counter.n).padStart(12, '0');
        if (!(0, model_1.isStackNode)(node))
            return { ...node, id };
        return {
            ...node,
            id,
            children: node.children.map((child) => withFixedIDs(child, prefix, counter)),
        };
    }
    /**
     * 这种风格出厂时的排版。每次调用结果都一样，所以工坊不缓存，
     * 生成一份不过是几次值拷贝。出来的就是清洗过的规范形。
     */
    function builtInTemplate(style) {
        const built = BUILDERS[style]();
        const id = templateIDForStyle(style);
        // 第四组编上风格序号，九种风格的节点 id 因此互不相同，也不会撞上模版自己的 id。
        const prefix = '4C49564D-4152-4B00-800' + String(exports.SHARE_STYLES.indexOf(style) + 1) + '-';
        const root = withFixedIDs(built.root, prefix, { n: 0 });
        return (0, model_1.sanitizeTemplate)({ id, name: style, canvas: built.canvas, root, createdAt: EPOCH, updatedAt: EPOCH }, fixedEnvironment);
    }
    function builtInTemplates() {
        return exports.SHARE_STYLES.map(builtInTemplate);
    }

  });

  define("share/scene", function (module, exports, require) {
    "use strict";
    // 海报的「场景」：一份模版 + 一条记录 → 一串按绘制顺序排好的图元。
    // 设计规格见 Documentation/POSTER.md 第 3、4 节。
    //
    // 三段式（照 Vercel Satori 的分法）：
    //   1. 这条记录里每个文字节点印什么 —— `templateText`（`core/template/model.ts`）；
    //   2. 排版 —— `layoutTemplate`（`core/template/layout.ts`，纯 TS，文字测量注入）；
    //   3. 翻成图元 —— 这个文件。
    //
    // 这一层除了量文字（`skiaMeasure`）不碰 react / react-native，几何与取值都能在
    // Jest 里直接断言。预览（TemplateCard）与导出（exportService）画的是同一份场景，
    // 所以屏幕上那张和存下来的那张不会差。
    //
    // 坐标：画布永远 360 pt 宽，高由内容决定（`layout.height`）；图元的 frame 是
    // **左上角 + 宽高**，`rotation` 绕 frame 中心转（祖先的旋转已经乘进来了）。
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.typeDisplayName = typeDisplayName;
    exports.posterRecord = posterRecord;
    exports.posterOptions = posterOptions;
    exports.makeCardContext = makeCardContext;
    exports.resolveColor = resolveColor;
    exports.resolveValues = resolveValues;
    exports.buildScene = buildScene;
    exports.measurePoster = measurePoster;
    exports.posterPixelSize = posterPixelSize;
    exports.sceneImageSources = sceneImageSources;
    const labels_1 = require("@/core/labels");
    const models_1 = require("@/core/models");
    const layout_1 = require("@/core/template/layout");
    const model_1 = require("@/core/template/model");
    const i18n_1 = require("@/i18n");
    const measure_1 = require("./measure");
    function assetSource(asset) {
        const value = asset;
        if (!value || typeof value.digest !== 'string')
            return null;
        return {
            key: `asset-${value.digest}`,
            digest: value.digest,
            uri: typeof value.filePath === 'string' ? value.filePath : undefined,
        };
    }
    function nodeImageSource(node, context) {
        if (node.source === 'cover')
            return context.cover.source;
        if ('data' in node.source && node.source.data) {
            return { key: `element-${node.id}`, data: node.source.data };
        }
        if ('asset' in node.source)
            return assetSource(node.source.asset);
        return null;
    }
    function canvasImageSource(template, image) {
        if (!image)
            return null;
        if (image.data)
            return { key: `template-${template.id}`, data: image.data };
        return assetSource(image.asset);
    }
    // MARK: - 记录 → 卡片内容
    /** 一个内建类型的名字跟着界面语言走；用户自己起的名字原样印。 */
    function typeDisplayName(type) {
        return type.isBuiltIn ? (0, i18n_1.t)(type.name) : type.name;
    }
    /** `EventRecord` → 海报只认的那几项。 */
    function posterRecord(record, type) {
        var _a, _b;
        return {
            id: record.id,
            title: record.title,
            subtitle: record.subtitle,
            performers: record.performers,
            kindName: type ? typeDisplayName(type) : undefined,
            kindEnglish: type === null || type === void 0 ? void 0 : type.english,
            date: record.date,
            hasConfirmedDate: record.dateUnconfirmed !== true,
            hasConfirmedTime: record.timeUnconfirmed !== true,
            utcOffsetSeconds: (_a = record.sourceUTCOffset) !== null && _a !== void 0 ? _a : null,
            city: record.city,
            venue: record.venue,
            seat: record.seat,
            price: (_b = record.price) !== null && _b !== void 0 ? _b : null,
            currency: record.currency,
            companions: record.companions,
            rating: record.rating,
            mood: (0, labels_1.moodDisplay)(record.mood),
            quote: record.quote,
            note: record.note,
            setlist: record.setlist,
        };
    }
    /** `ShareOptions` → 海报读的那十个开关。 */
    function posterOptions(options, locale) {
        return {
            showDate: options.showDate,
            showVenue: options.showVenue,
            showRating: options.showRating,
            showNote: options.showNote,
            showQuote: options.showQuote,
            showSetlist: options.showSetlist,
            showAuthor: options.showAuthor,
            showPrice: options.showPrice,
            showSeat: options.showSeat,
            showCompanions: options.showCompanions,
            headline: options.headline,
            locale: locale !== null && locale !== void 0 ? locale : ((0, i18n_1.getLanguage)() === 'en' ? 'en' : 'zh-Hans'),
        };
    }
    function accentColor(theme) {
        var _a;
        return (_a = (0, model_1.colorFromHexString)((0, models_1.accentHex)(theme))) !== null && _a !== void 0 ? _a : { ...model_1.Palette.lilac };
    }
    function accentDeepColor(theme) {
        var _a;
        return (_a = (0, model_1.colorFromHexString)((0, models_1.accentDeepHex)(theme))) !== null && _a !== void 0 ? _a : { ...model_1.Palette.ink };
    }
    function coverSource(record) {
        if (record.coverAsset) {
            return {
                key: `asset-${record.coverAsset.digest}`,
                digest: record.coverAsset.digest,
                uri: record.coverAsset.filePath,
            };
        }
        if (record.coverData && record.coverData.length > 0) {
            return { key: `cover-${record.id}`, digest: `cover-${record.id}`, bytes: record.coverData };
        }
        return null;
    }
    /** 把一条记录、一组开关和一个署名合成卡片要印的全部内容。 */
    function makeCardContext(record, options, author, types) {
        const type = types ? (0, models_1.catalogResolve)(types, record) : undefined;
        return {
            bits: (0, model_1.makeCardBits)(posterRecord(record, type), posterOptions(options), author),
            accent: accentColor(options.accent),
            deep: accentDeepColor(options.accent),
            cover: { source: coverSource(record), artwork: record.artwork, title: record.title },
        };
    }
    // MARK: - 颜色解析
    /** 图层跟主题色走时用工坊里选的那枚，否则用它自己的值。 */
    function resolveColor(value, accent, context) {
        if (accent === '主题色')
            return context.accent;
        if (accent === '主题深色')
            return context.deep;
        return (0, model_1.clampColor)(value);
    }
    // MARK: - 每个文字节点印什么
    /**
     * 每个 text 节点在这条记录 + 这组分享开关下的值。
     * 占位模式（编辑器）把 null 换成 `[字段名]`，所以编辑时没有东西收起，每一块都摆得到。
     */
    function resolveValues(template, context, placeholders = false) {
        const values = {};
        (0, model_1.walkNodes)(template.root, (node) => {
            if (!(0, model_1.isTextNode)(node))
                return;
            const value = (0, model_1.templateText)(node, context.bits);
            values[node.id] = value === null && placeholders ? '[' + (0, i18n_1.t)(node.field) + ']' : value;
        });
        return values;
    }
    const IDENTITY = { a: 1, b: 0, tx: 0, ty: 0, angle: 0 };
    function applyPoint(t, x, y) {
        return { x: t.a * x - t.b * y + t.tx, y: t.b * x + t.a * y + t.ty };
    }
    /** `parent ∘ 绕 (cx, cy) 转 degrees`。 */
    function compose(parent, degrees, cx, cy) {
        if (degrees === 0)
            return parent;
        const radians = (degrees * Math.PI) / 180;
        const cos = Math.cos(radians);
        const sin = Math.sin(radians);
        // 绕 (cx, cy) 转：先把点挪到原点、转、再挪回去，平移量就是这个。
        const bx = cx - (cos * cx - sin * cy);
        const by = cy - (sin * cx + cos * cy);
        const moved = applyPoint(parent, bx, by);
        return {
            a: parent.a * cos - parent.b * sin,
            b: parent.b * cos + parent.a * sin,
            tx: moved.x,
            ty: moved.y,
            angle: parent.angle + degrees,
        };
    }
    function buildScene(template, context, options = {}) {
        var _a;
        const placeholders = options.placeholders === true;
        const values = resolveValues(template, context, placeholders);
        const layout = (0, layout_1.layoutTemplate)(template, values, measure_1.skiaMeasure);
        const pass = (_a = options.pass) !== null && _a !== void 0 ? _a : null;
        const emitted = emitItems(layout, context, values, placeholders);
        let items = emitted.items;
        let paintsBackground = true;
        if (pass) {
            const index = emitted.items.findIndex((item) => item.id === pass.layerID);
            if (index < 0) {
                // 找不到那一层：`under` 等于整张，其余什么都不画。
                items = pass.mode === 'under' ? emitted.items : [];
                paintsBackground = pass.mode === 'under';
            }
            else if (pass.mode === 'under') {
                items = [...emitted.items.slice(0, index), ...closers(emitted, index)];
            }
            else if (pass.mode === 'over') {
                items = [...openers(emitted, index), ...emitted.items.slice(index + 1)];
                paintsBackground = false;
            }
            else {
                const target = emitted.items[index];
                items = [
                    ...openers(emitted, index),
                    ...(target.kind === 'image' ? [maskItem(target)] : []),
                    ...closers(emitted, index),
                ];
                paintsBackground = false;
            }
        }
        const source = canvasImageSource(template, template.canvas.image);
        const image = template.canvas.image;
        return {
            width: layout.width,
            height: layout.height,
            paintsBackground,
            background: resolveColor(template.canvas.background, template.canvas.backgroundAccent, context),
            backgroundImage: paintsBackground && source && image
                ? {
                    source,
                    focusX: image.focusX,
                    focusY: image.focusY,
                    zoom: image.zoom,
                    opacity: image.opacity,
                }
                : null,
            items,
            layout,
        };
    }
    /** 切片时补上的裁切：这个位置还开着的，从里到外一层层关掉。 */
    function closers(emitted, index) {
        var _a;
        const open = (_a = emitted.clips[index]) !== null && _a !== void 0 ? _a : [];
        return open
            .slice()
            .reverse()
            .map((id) => ({ ...emitted.openers.get(id), kind: 'clipEnd' }));
    }
    /** 切片时补上的裁切：这个位置开着的，从外到里一层层再开一遍。 */
    function openers(emitted, index) {
        var _a;
        const open = (_a = emitted.clips[index]) !== null && _a !== void 0 ? _a : [];
        return open.map((id) => emitted.openers.get(id));
    }
    function maskItem(item) {
        // 蒙版盖的是真正有画面的那一块：白边里面。
        const border = item.border;
        return {
            kind: 'mask',
            id: item.id,
            frame: {
                x: item.frame.x + border,
                y: item.frame.y + border,
                width: Math.max(0, item.frame.width - border * 2),
                height: Math.max(0, item.frame.height - border * 2),
            },
            rotation: item.rotation,
            opacity: 1,
            cornerRadius: Math.max(0, item.cornerRadius - border),
        };
    }
    function emitItems(layout, context, values, placeholders) {
        var _a, _b;
        const items = [];
        const clips = [];
        const openers = new Map();
        const transforms = new Map();
        const open = [];
        const push = (item) => {
            items.push(item);
            clips.push(open.map((entry) => entry.id));
        };
        for (const laid of layout.nodes) {
            while (open.length > 0 && laid.depth <= open[open.length - 1].depth) {
                const closed = open.pop();
                push({ ...openers.get(closed.id), kind: 'clipEnd' });
            }
            const parent = laid.parent ? ((_a = transforms.get(laid.parent)) !== null && _a !== void 0 ? _a : IDENTITY) : IDENTITY;
            const cx = laid.frame.x + laid.frame.width / 2;
            const cy = laid.frame.y + laid.frame.height / 2;
            transforms.set(laid.id, compose(parent, laid.rotation, cx, cy));
            const center = applyPoint(parent, cx, cy);
            const frame = {
                x: center.x - laid.frame.width / 2,
                y: center.y - laid.frame.height / 2,
                width: laid.frame.width,
                height: laid.frame.height,
            };
            const base = {
                id: laid.id,
                frame,
                rotation: parent.angle + laid.rotation,
                opacity: laid.opacity,
            };
            const node = laid.node;
            if ((0, model_1.isStackNode)(node)) {
                push(stackFill(node, base, context));
                if (node.clip === true) {
                    const opener = {
                        ...base,
                        kind: 'clipBegin',
                        cornerRadius: (_b = node.cornerRadius) !== null && _b !== void 0 ? _b : 0,
                    };
                    openers.set(laid.id, opener);
                    push(opener);
                    open.push({ id: laid.id, depth: laid.depth });
                }
                continue;
            }
            push(nodeItem(node, base, context, values, placeholders));
        }
        while (open.length > 0) {
            const closed = open.pop();
            push({ ...openers.get(closed.id), kind: 'clipEnd' });
        }
        return { items, clips, openers };
    }
    function stackFill(node, base, context) {
        var _a, _b, _c, _d;
        const stroke = node.stroke;
        return {
            ...base,
            kind: 'fill',
            color: node.fill !== undefined || node.fillAccent !== undefined
                ? resolveColor((_a = node.fill) !== null && _a !== void 0 ? _a : model_1.Palette.ink, node.fillAccent, context)
                : null,
            cornerRadius: (_b = node.cornerRadius) !== null && _b !== void 0 ? _b : 0,
            stroke: stroke && stroke.width > 0
                ? {
                    width: stroke.width,
                    color: resolveColor(stroke.color, stroke.accent, context),
                    dashLength: (_c = stroke.dashLength) !== null && _c !== void 0 ? _c : 0,
                    dashGap: (_d = stroke.dashGap) !== null && _d !== void 0 ? _d : 0,
                }
                : null,
        };
    }
    function nodeItem(node, base, context, values, placeholders) {
        var _a, _b, _c, _d, _e, _f, _g;
        if ((0, model_1.isImageNode)(node)) {
            return {
                ...base,
                kind: 'image',
                source: nodeImageSource(node, context),
                fit: node.fit,
                focusX: node.focusX,
                focusY: node.focusY,
                zoom: node.zoom,
                tilt: node.tilt,
                cornerRadius: (_a = node.cornerRadius) !== null && _a !== void 0 ? _a : 0,
                border: (_b = node.border) !== null && _b !== void 0 ? _b : 0,
                shadow: node.shadow === true,
                isSticker: node.isSticker === true,
                isLive: (0, model_1.nodeIsLivePhoto)(node),
                artwork: node.source === 'cover' ? context.cover.artwork : null,
                title: context.cover.title,
            };
        }
        if (node.kind === 'shape') {
            return {
                ...base,
                kind: 'shape',
                shape: node.shape,
                color: resolveColor(node.color, node.accent, context),
                strokeWidth: (_c = node.strokeWidth) !== null && _c !== void 0 ? _c : 0,
                dashLength: (_d = node.dashLength) !== null && _d !== void 0 ? _d : 0,
                dashGap: (_e = node.dashGap) !== null && _e !== void 0 ? _e : 0,
                cornerRadius: (_f = node.cornerRadius) !== null && _f !== void 0 ? _f : 0,
            };
        }
        if ((0, model_1.isTextNode)(node)) {
            const resolved = (_g = values[node.id]) !== null && _g !== void 0 ? _g : null;
            const chip = node.chip !== undefined
                ? resolveColor(node.chip, node.chipAccent, context)
                : node.chipAccent !== undefined
                    ? resolveColor(model_1.Palette.ink, node.chipAccent, context)
                    : null;
            return {
                ...base,
                kind: 'text',
                field: node.field,
                value: resolved !== null && resolved !== void 0 ? resolved : '',
                // 占位模式下的值是 `[字段名]`，画笔把它印淡一点再套一圈虚线框。
                placeholder: placeholders && (0, model_1.templateText)(node, context.bits) === null,
                content: node.field === '条码' ? 'barcode' : 'text',
                barcodeSeed: String(context.bits.record.id).toUpperCase(),
                label: node.label,
                inlineLabel: node.inlineLabel === true && node.label.length > 0,
                fontSize: node.fontSize,
                weight: node.weight,
                design: node.design,
                align: node.alignment,
                tracking: node.tracking,
                lineLimit: node.lineLimit,
                color: resolveColor(node.color, node.accent, context),
                chip,
            };
        }
        // 间隔：什么都不画，但选中框、命中测试要它的框。
        return { ...base, kind: 'fill', color: null, cornerRadius: 0, stroke: null };
    }
    // 按对象身份记最近的八份：模版与内容都是不可变值，换一份就是换一个对象。
    const sizeCache = [];
    /**
     * 排一次版，只要尺寸。编辑器与工坊在渲染之前就得知道画布有多高（好算缩放倍数），
     * 而高度只有排完版才知道，所以这里同步排一次；同一份模版 + 同一份内容有缓存。
     */
    function measurePoster(template, context, options = {}) {
        const placeholders = options.placeholders === true;
        const hit = sizeCache.find((entry) => entry.template === template &&
            entry.context === context &&
            entry.placeholders === placeholders);
        if (hit)
            return { width: hit.width, height: hit.height };
        const scene = buildScene(template, context, { placeholders });
        const size = { width: scene.width, height: scene.height };
        sizeCache.unshift({ template, context, placeholders, ...size });
        if (sizeCache.length > 8)
            sizeCache.pop();
        return size;
    }
    /** 海报导出的像素尺寸。高度跟着排版走，所以要有场景才算得出来。 */
    function posterPixelSize(template, scene, pixelWidth) {
        const width = Math.round(pixelWidth !== null && pixelWidth !== void 0 ? pixelWidth : (0, model_1.exportPixelWidth)(template));
        return {
            width: Math.max(1, width),
            height: Math.max(1, Math.round((width * scene.height) / model_1.CANVAS_WIDTH)),
        };
    }
    /** 场景里所有要解码的图（预览与导出都先把它们准备好）。 */
    function sceneImageSources(scene) {
        var _a;
        const out = [];
        const seen = new Set();
        const push = (source) => {
            if (!source || seen.has(source.key))
                return;
            seen.add(source.key);
            out.push(source);
        };
        push((_a = scene.backgroundImage) === null || _a === void 0 ? void 0 : _a.source);
        for (const item of scene.items) {
            if (item.kind === 'image')
                push(item.source);
        }
        return out;
    }

  });

  define("shims/labels", function (module, exports, require) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.moodDisplay = moodDisplay;
    function moodDisplay(mood) {
        return mood;
    }

  });

  define("shims/models", function (module, exports, require) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.accentHex = accentHex;
    exports.accentDeepHex = accentDeepHex;
    exports.catalogResolve = catalogResolve;
    const HEX = {
        鸢尾紫: '#bba7ef',
        苔藓绿: '#d8eb97',
        珊瑚橘: '#f4ab8e',
        远山蓝: '#adcfe5',
    };
    const DEEP = {
        鸢尾紫: '#6e58a8',
        苔藓绿: '#5e7a32',
        珊瑚橘: '#c2603a',
        远山蓝: '#3e6e8e',
    };
    function accentHex(accent) {
        var _a;
        return (_a = HEX[accent]) !== null && _a !== void 0 ? _a : HEX['鸢尾紫'];
    }
    function accentDeepHex(accent) {
        var _a;
        return (_a = DEEP[accent]) !== null && _a !== void 0 ? _a : DEEP['鸢尾紫'];
    }
    function catalogResolve(_catalog, _record) {
        return undefined;
    }

  });

  define("shims/i18n", function (module, exports, require) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getLanguage = getLanguage;
    exports.t = t;
    // 工坊只有中文；字段名本身就是中文键，原样返回。
    function getLanguage() {
        return 'zh-Hans';
    }
    function t(key) {
        return key;
    }

  });

  define("share/measure", function (module, exports, require) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.skiaMeasure = void 0;
    const skiaMeasure = (request) => {
        const hook = globalThis.LMMeasure;
        if (!hook)
            throw new Error('LMMeasure 还没注入：core.js 要在 render.js 之后用');
        return hook(request);
    };
    exports.skiaMeasure = skiaMeasure;

  });

  var require = requireFrom('');
  var core = {};
  ["core/template/model","core/template/layout","core/template/document","core/template/builtins","share/scene"].forEach(function (id) {
    var exported = require(id);
    Object.keys(exported).forEach(function (key) {
      if (key !== '__esModule' && key !== 'default') core[key] = exported[key];
    });
  });
  global.LMCore = core;
})(typeof window !== 'undefined' ? window : globalThis);
