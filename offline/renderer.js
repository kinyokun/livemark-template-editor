globalThis.LMOfflineBuild={"engineVersion":"livemark-ck041-cpu-748a487ac98025e36726","canvasKitVersion":"0.41.0","backend":"software","fonts":{"Caveat-Bold.ttf":"0a71de7c0f19f93aac97312f369b69518ae4ef1d93a2ccecc1cd67bd2cf75781","Caveat.ttf":"56b8a8a43664c2bf81e18832a2f0e0d63828a28cd2f5761ec00751dd5bb88103","CormorantGaramond-Bold.ttf":"a0c3bb83a7987fb951a98b45f0f00160dc1b73e6393af70d2033d92795d9f694","CormorantGaramond.ttf":"5f0c208aa786fb8793a6f608dddace859a953af5daf35653405fa191798d626e","LXGWWenKaiTC-Bold.ttf":"5c9feadfd928f3ae3860e7d001ad3d0d0c55b0157fff08cd4d51b51aca677f23","LXGWWenKaiTC-Regular.ttf":"4fcc5aec11cbbf737b0cfab7b63796f7f280087a7a656b2f13342cd5e5318d95","NotoEmoji-Regular.ttf":"5af8eae90f965bd51bedee7507a692369d9ea5a6d271abe655af18d86c078391","NotoSansSC-Bold.ttf":"35e0f43ccc3b9f08f3c92e9e8176423226ebe43f9e48353bbb8f93ec3fd5a539","NotoSansSC.ttf":"f202dac4ea2a718e6269ca986774b2a0a0e117032fa2fade78f8f37143e2e0cf","NotoSerifSC-Bold.ttf":"c522280c17862eaf924e6fd30e736cd2cb237de52fc31cbb6b93cfc47f15ae38","NotoSerifSC.ttf":"2ddc6ff165a90a20fbc05ce503af454955e8ce67afc54e53d291614bb578169b","PlayfairDisplay-Bold.ttf":"4291782b6305de93ef8ec5084788f3a1c680ed980336f5d4384960676d7b4149","PlayfairDisplay.ttf":"9ae96c60234c4376ac172b3410924c98cb0e39900a9d7345bbda6c5309532ab7","SpaceGrotesk-Bold.ttf":"4e330c1557b9576614b9a3d4dd80ab5510234c4e8aaae9b434f4b2e542b3dabe","SpaceGrotesk.ttf":"21ec382ecb51435de457a5bf9e313fe5f4eba933c94ce8e4a1cbe9994df41a25","ZCOOLXiaoWei-Regular.ttf":"a42b620140f493db42f741351dfbf343c0936d58588ee8004b8b2a218d997ff1"},"wasmSha256":"eb68c7a7f602d8cb89915352c4471a2d26edfd72000f78202cb1fe32ce1f9dc4"};
(function(global){
const modules={"src/features/share/offline/engine.js":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sha256_1 = require("src/core/sha256.ts");
const model_1 = require("src/core/template/model.ts");
const canvas_1 = require("src/core/template/canvas.ts");
const fontCatalog_1 = require("src/core/template/fontCatalog.ts");
const scene_1 = require("src/features/share/scene.ts");
const painter_1 = require("src/features/share/painter.ts");
const measure_1 = require("src/features/share/measure.ts");
const fontRuntime_1 = require("src/features/share/fontRuntime.ts");
const requirements_1 = require("src/features/share/offline/requirements.ts");
const skiaAdapter_1 = require("src/features/share/offline/skiaAdapter.js");
let initialization, kit, fontBaseURL, queue = Promise.resolve();
const fontFaces = new Map(), fontData = new Map();
const version = globalThis.LMOfflineBuild?.engineVersion || 'development';
const base64Bytes = value => Uint8Array.from(atob(value.replace(/^data:[^,]*,/, '')), char => char.charCodeAt(0));
function base64(bytes) {
    let value = '';
    for (let start = 0; start < bytes.length; start += 8192)
        value += String.fromCharCode(...bytes.subarray(start, start + 8192));
    return btoa(value);
}
async function init(options = {}) {
    if (options.fontBaseURL)
        fontBaseURL = options.fontBaseURL;
    if (!initialization)
        initialization = (async () => {
            const factory = options.CanvasKitInit || globalThis.CanvasKitInit;
            if (!factory)
                throw new Error('离线绘图引擎未加载。');
            kit = await factory({ wasmBinary: options.wasmBinary,
                locateFile: file => options.wasmURL || file });
            (0, skiaAdapter_1.initializeSkia)(kit);
            return { engineVersion: version, backend: 'CanvasKit CPU', canvasKitVersion: '0.41.0' };
        })().catch(error => { initialization = undefined; throw error; });
    return initialization;
}
async function fontBytes(requirement, supplied) {
    const key = requirement.file;
    const provided = supplied.find(font => font.file === key || !font.file && font.id === requirement.id && (font.weight || 400) === requirement.weight);
    if (provided) {
        if (fontData.get(key)?.base64 === provided.data)
            return fontData.get(key).bytes;
        const bytes = base64Bytes(provided.data);
        const expected = globalThis.LMOfflineBuild?.fonts?.[key];
        if (expected && (0, sha256_1.sha256Hex)(bytes) !== expected)
            throw new Error('内置字体版本不一致：' + key);
        fontData.set(key, { bytes, base64: provided.data });
        return bytes;
    }
    if (fontData.has(key))
        return fontData.get(key).bytes;
    if (!fontBaseURL)
        throw new Error('离线字体缺失：' + key);
    const response = await fetch(fontBaseURL.replace(/\/$/, '') + '/' + encodeURIComponent(key));
    if (!response.ok)
        throw new Error('字体文件未能加载：' + key);
    const bytes = new Uint8Array(await response.arrayBuffer()), expected = globalThis.LMOfflineBuild?.fonts?.[key];
    if (expected && (0, sha256_1.sha256Hex)(bytes) !== expected)
        throw new Error('内置字体版本不一致：' + key);
    fontData.set(key, { bytes });
    return bytes;
}
async function registerFonts(template, supplied) {
    for (const requirement of (0, requirements_1.requiredFonts)(template)) {
        if (fontFaces.has(requirement.file))
            continue;
        const bytes = await fontBytes(requirement, supplied);
        const face = skiaAdapter_1.Skia.Typeface.MakeFreeTypeFaceFromData(skiaAdapter_1.Skia.Data.fromBytes(bytes));
        if (!face)
            throw new Error('无法读取字体：' + requirement.file);
        if (!(0, fontRuntime_1.fontIsRegistered)(requirement.id))
            (0, fontRuntime_1.registerPosterTypefaces)(requirement.id, version + ':' + requirement.id, [face]);
        else
            (0, fontRuntime_1.posterFontProvider)().registerFont(face, (0, fontCatalog_1.posterFontFamily)(requirement.id));
        fontFaces.set(requirement.file, face);
        fontData.delete(requirement.file);
    }
    const customIDs = new Set();
    (0, model_1.walkNodes)(template.root, node => { if (node.kind === 'text' && node.fontId && !(0, fontCatalog_1.posterFont)(node.fontId))
        customIDs.add(node.fontId); });
    for (const id of customIDs) {
        const asset = template.fontAssets?.find(font => font.id === id);
        if (!asset)
            throw new Error('缺少导入字体：' + id);
        const key = 'custom:' + id, previous = fontData.get(key);
        if (previous?.base64 === asset.data && fontFaces.has(key))
            continue;
        const bytes = base64Bytes(asset.data), digest = (0, sha256_1.sha256Hex)(bytes);
        if (asset.sha256 && asset.sha256.toLowerCase() !== digest)
            throw new Error('导入字体校验失败：' + asset.name);
        const face = skiaAdapter_1.Skia.Typeface.MakeFreeTypeFaceFromData(skiaAdapter_1.Skia.Data.fromBytes(bytes));
        if (!face)
            throw new Error('无法读取导入字体：' + asset.name);
        (0, fontRuntime_1.registerPosterTypefaces)(id, digest, [face], asset.weight || (0, fontCatalog_1.fontFileWeight)(bytes));
        fontFaces.set(key, face);
        fontData.set(key, { base64: asset.data });
    }
    (0, measure_1.clearMeasureCache)();
}
function loadImages(scene, supplied) {
    const images = new Map(), assets = new Map(supplied.map(asset => [asset.key, asset.data]));
    for (const source of (0, scene_1.sceneImageSources)(scene)) {
        const encoded = assets.get(source.key) || source.data;
        const bytes = encoded ? base64Bytes(encoded) : source.bytes instanceof Uint8Array ? source.bytes : Array.isArray(source.bytes) ? Uint8Array.from(source.bytes) : null;
        if (!bytes)
            throw new Error('离线图片缺失：' + source.key);
        const image = skiaAdapter_1.Skia.Image.MakeImageFromEncoded(skiaAdapter_1.Skia.Data.fromBytes(bytes));
        if (!image)
            throw new Error('这张图片无法由共享引擎解码，请使用 PNG、JPEG 或 WebP。');
        images.set(source.key, image);
    }
    return images;
}
function liveGeometry(scene, images, pixelWidth) {
    const pixelScale = pixelWidth / scene.width;
    return scene.items.filter(item => item.kind === 'image').map(item => {
        const image = images.get(item.source?.key), width = Math.max(1, item.frame.width - item.border * 2), height = Math.max(1, item.frame.height - item.border * 2);
        let scale = item.zoom, offsetX = 0, offsetY = 0;
        if (image) {
            const placed = (0, painter_1.imagePlacement)({ frameWidth: width, frameHeight: height, imageWidth: image.width(), imageHeight: image.height(), fit: item.fit, focusX: item.focusX, focusY: item.focusY, zoom: item.zoom });
            const cover = Math.max(width / image.width(), height / image.height());
            scale = Math.max(.00001, placed.width / image.width() / cover);
            offsetX = (placed.x + placed.overflowX / 2) / (scale * width);
            offsetY = (placed.y + placed.overflowY / 2) / (scale * height);
        }
        return { id: item.id, frame: { x: (item.frame.x + item.border) * pixelScale, y: (item.frame.y + item.border) * pixelScale, width: width * pixelScale, height: height * pixelScale },
            scale, offsetX, offsetY, placementRotation: item.tilt, rotation: item.rotation };
    });
}
async function renderNow(request) {
    await init();
    const template = (0, model_1.sanitizeTemplate)(request.template);
    if (template.root.layout !== 'canvas' || (0, canvas_1.validateCanvasRelations)(template).length)
        throw new Error('模版结构无效。');
    await registerFonts(template, request.fonts || []);
    (0, skiaAdapter_1.beginRenderResources)();
    try {
        const fullScene = (0, scene_1.buildScene)(template, request.context, { placeholders: false });
        const scene = request.pass ? (0, scene_1.buildScene)(template, request.context, { placeholders: false, pass: request.pass }) : fullScene;
        if (!request.allowOverflow && fullScene.layout.overflow?.length)
            throw new Error('有内容超出边界，请调整元素或改为长图后再导出。');
        const width = Math.max(1, Math.round(request.pixelWidth || (0, model_1.exportPixelWidth)(template))), height = Math.max(1, Math.round(scene.height * width / scene.width));
        if (!Number.isFinite(width) || !Number.isFinite(height) || width * height > 40000000)
            throw new Error('这张长图太大，请降低导出宽度或减少内容。');
        const images = loadImages(fullScene, request.assets || []);
        const surface = skiaAdapter_1.Skia.Surface.Make(width, height);
        if (!surface)
            throw new Error('无法创建离线导出画布。');
        const canvas = surface.getCanvas();
        canvas.clear(Float32Array.of(0, 0, 0, 0));
        canvas.scale(width / scene.width, width / scene.width);
        (0, painter_1.paintScene)(canvas, scene, { images });
        surface.flush();
        const image = surface.makeImageSnapshot(), png = image.encodeToBytes(skiaAdapter_1.ImageFormat.PNG, 100);
        const pixels = image.ref.readPixels(0, 0, { width, height, colorType: kit.ColorType.RGBA_8888, alphaType: kit.AlphaType.Unpremul, colorSpace: kit.ColorSpace.SRGB });
        if (!pixels)
            throw new Error('无法读取导出像素。');
        return { pngBase64: base64(png), width, height, pixelHash: (0, sha256_1.sha256Hex)(pixels), pngHash: (0, sha256_1.sha256Hex)(png), engineVersion: version,
            liveLayers: liveGeometry(fullScene, images, width), layout: { width: fullScene.width, height: fullScene.height,
                nodes: Object.values(fullScene.layout.byID).map(node => ({ id: node.id, kind: node.kind, frame: node.frame, rotation: node.rotation, collapsed: node.collapsed })) } };
    }
    finally {
        (0, measure_1.clearMeasureCache)();
        (0, skiaAdapter_1.endRenderResources)();
    }
}
function render(request) {
    const task = queue.catch(() => { }).then(() => renderNow(request));
    queue = task.then(() => { }, () => { });
    return task;
}
globalThis.LMOfflineRenderer = { init, render, requiredFonts: requirements_1.requiredFonts, engineVersion: version, backend: 'CanvasKit CPU' };

},
"src/core/sha256.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sha256Bytes = sha256Bytes;
exports.sha256Hex = sha256Hex;
exports.sha256Text = sha256Text;
exports.toHex = toHex;
exports.utf8Encode = utf8Encode;
exports.utf8Decode = utf8Decode;
const K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);
const HEX = '0123456789abcdef';
function sha256Bytes(input) {
    const h = new Uint32Array([
        0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
    ]);
    const length = input.length;
    const withPadding = (((length + 8) >> 6) + 1) << 6;
    const block = new Uint8Array(withPadding);
    block.set(input);
    block[length] = 0x80;
    const bits = length * 8;
    const high = Math.floor(bits / 0x100000000);
    const low = bits >>> 0;
    block[withPadding - 8] = (high >>> 24) & 0xff;
    block[withPadding - 7] = (high >>> 16) & 0xff;
    block[withPadding - 6] = (high >>> 8) & 0xff;
    block[withPadding - 5] = high & 0xff;
    block[withPadding - 4] = (low >>> 24) & 0xff;
    block[withPadding - 3] = (low >>> 16) & 0xff;
    block[withPadding - 2] = (low >>> 8) & 0xff;
    block[withPadding - 1] = low & 0xff;
    const w = new Uint32Array(64);
    for (let offset = 0; offset < withPadding; offset += 64) {
        for (let i = 0; i < 16; i += 1) {
            const j = offset + i * 4;
            w[i] = ((block[j] << 24) | (block[j + 1] << 16) | (block[j + 2] << 8) | block[j + 3]) >>> 0;
        }
        for (let i = 16; i < 64; i += 1) {
            const a = w[i - 15];
            const b = w[i - 2];
            const s0 = (((a >>> 7) | (a << 25)) ^ ((a >>> 18) | (a << 14)) ^ (a >>> 3)) >>> 0;
            const s1 = (((b >>> 17) | (b << 15)) ^ ((b >>> 19) | (b << 13)) ^ (b >>> 10)) >>> 0;
            w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
        }
        let [a, b, c, d, e, f, g, hh] = [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7]];
        for (let i = 0; i < 64; i += 1) {
            const s1 = (((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7))) >>> 0;
            const ch = ((e & f) ^ (~e & g)) >>> 0;
            const t1 = (hh + s1 + ch + K[i] + w[i]) >>> 0;
            const s0 = (((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10))) >>> 0;
            const maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
            const t2 = (s0 + maj) >>> 0;
            hh = g;
            g = f;
            f = e;
            e = (d + t1) >>> 0;
            d = c;
            c = b;
            b = a;
            a = (t1 + t2) >>> 0;
        }
        h[0] = (h[0] + a) >>> 0;
        h[1] = (h[1] + b) >>> 0;
        h[2] = (h[2] + c) >>> 0;
        h[3] = (h[3] + d) >>> 0;
        h[4] = (h[4] + e) >>> 0;
        h[5] = (h[5] + f) >>> 0;
        h[6] = (h[6] + g) >>> 0;
        h[7] = (h[7] + hh) >>> 0;
    }
    const out = new Uint8Array(32);
    for (let i = 0; i < 8; i += 1) {
        out[i * 4] = (h[i] >>> 24) & 0xff;
        out[i * 4 + 1] = (h[i] >>> 16) & 0xff;
        out[i * 4 + 2] = (h[i] >>> 8) & 0xff;
        out[i * 4 + 3] = h[i] & 0xff;
    }
    return out;
}
function sha256Hex(input) {
    return toHex(sha256Bytes(input));
}
function sha256Text(text) {
    return sha256Hex(utf8Encode(text));
}
function toHex(bytes) {
    let out = '';
    for (let i = 0; i < bytes.length; i += 1) {
        out += HEX[bytes[i] >> 4] + HEX[bytes[i] & 0x0f];
    }
    return out;
}
function utf8Encode(text) {
    const out = [];
    for (let i = 0; i < text.length; i += 1) {
        let code = text.charCodeAt(i);
        if (code >= 0xd800 && code <= 0xdbff && i + 1 < text.length) {
            const next = text.charCodeAt(i + 1);
            if (next >= 0xdc00 && next <= 0xdfff) {
                code = (code - 0xd800) * 0x400 + (next - 0xdc00) + 0x10000;
                i += 1;
            }
        }
        if (code < 0x80)
            out.push(code);
        else if (code < 0x800)
            out.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
        else if (code < 0x10000)
            out.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
        else {
            out.push(0xf0 | (code >> 18), 0x80 | ((code >> 12) & 0x3f), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
        }
    }
    return Uint8Array.from(out);
}
function utf8Decode(bytes) {
    let out = '';
    let i = 0;
    while (i < bytes.length) {
        const byte = bytes[i];
        let code;
        if (byte < 0x80) {
            code = byte;
            i += 1;
        }
        else if (byte < 0xe0) {
            code = ((byte & 0x1f) << 6) | (bytes[i + 1] & 0x3f);
            i += 2;
        }
        else if (byte < 0xf0) {
            code = ((byte & 0x0f) << 12) | ((bytes[i + 1] & 0x3f) << 6) | (bytes[i + 2] & 0x3f);
            i += 3;
        }
        else {
            code =
                ((byte & 0x07) << 18) |
                    ((bytes[i + 1] & 0x3f) << 12) |
                    ((bytes[i + 2] & 0x3f) << 6) |
                    (bytes[i + 3] & 0x3f);
            i += 4;
        }
        if (code > 0xffff) {
            code -= 0x10000;
            out += String.fromCharCode(0xd800 + (code >> 10), 0xdc00 + (code & 0x3ff));
        }
        else {
            out += String.fromCharCode(code);
        }
    }
    return out;
}

},
"src/core/template/model.ts":function(require,module,exports){
"use strict";
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
exports.defaultFontID = defaultFontID;
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
exports.sanitizeGrid = sanitizeGrid;
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
exports.CANVAS_WIDTH = 360;
exports.DEFAULT_EXPORT_WIDTH = 1080;
exports.EXPORT_WIDTH_PRESETS = [1080, 1440, 2160];
exports.EXPORT_WIDTH_RANGE = [540, 2160];
exports.ASPECT_RANGE = [0.5, 2.2];
exports.DEFAULT_TEMPLATE_NAME = '我的模版';
exports.MAX_NODES = 120;
exports.MAX_DEPTH = 8;
exports.MAX_NAME_LENGTH = 40;
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
exports.SIZE_RANGE = [0, 2000];
exports.FRACTION_RANGE = [0.02, 2];
exports.OFFSET_RANGE = [-1000, 1000];
exports.GROW_RANGE = [0, 100];
exports.IMAGE_ASPECT_RANGE = [0.02, 50];
exports.FOCUS_RANGE = [0, 1];
exports.ZOOM_RANGE = [1, 3];
exports.TILT_RANGE = [-45, 45];
exports.ASPECT_PRESETS = [
    ['3:4', 4 / 3],
    ['4:5', 1.25],
    ['1:1', 1],
    ['9:16', 16 / 9],
    ['2:3', 1.5],
];
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
function colorFromHex(hex, alpha = 1) {
    return makeColor(((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255, alpha);
}
function colorFromHexString(hexString) {
    let text = String(hexString ?? '').trim();
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
function colorHexString(value) {
    const c = clampColor(value);
    const part = (v) => {
        const s = Math.round(v * 255).toString(16);
        return s.length < 2 ? '0' + s : s;
    };
    const base = '#' + part(c.red) + part(c.green) + part(c.blue);
    return c.alpha < 0.999 ? base + part(c.alpha) : base;
}
function colorLuminance(value) {
    const c = clampColor(value);
    const linear = (channel) => channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
    return 0.2126 * linear(c.red) + 0.7152 * linear(c.green) + 0.0722 * linear(c.blue);
}
function isDarkColor(value) {
    return colorLuminance(value) < 0.4;
}
function contrastingColor(value) {
    return isDarkColor(value) ? { ...exports.Palette.cream } : { ...exports.Palette.ink };
}
function colorDistance(a, b) {
    const dr = a.red - b.red;
    const dg = a.green - b.green;
    const db = a.blue - b.blue;
    return Math.sqrt(dr * dr + dg * dg + db * db);
}
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
function clamp(value, range, fallback) {
    if (typeof value !== 'number' || !Number.isFinite(value))
        return fallback;
    return Math.min(range[1], Math.max(range[0], value));
}
function num(value, fallback) {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
function roundHalfAwayFromZero(value) {
    return value < 0 ? -Math.round(-value) : Math.round(value);
}
function prefixChars(text, n) {
    return Array.from(String(text ?? '')).slice(0, n).join('');
}
function optionalBool(value) {
    return value === undefined || value === null ? undefined : !!value;
}
function optionalClamp(value, range, fallback) {
    return value === undefined || value === null ? undefined : clamp(value, range, fallback);
}
const UUID_PATTERN = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
function isUUID(text) {
    return typeof text === 'string' && UUID_PATTERN.test(text);
}
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
function isoString(date = new Date()) {
    return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}
function resolveEnvironment(env) {
    return { newID: env?.newID ?? randomUUID, now: env?.now ?? (() => isoString()) };
}
exports.ALIGNS = ['start', 'center', 'end', 'stretch'];
exports.JUSTIFIES = [
    'start',
    'center',
    'end',
    'spaceBetween',
    'spaceAround',
    'spaceEvenly',
];
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
    return { top: a, right: b, bottom: c ?? 0, left: d ?? 0 };
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
function defaultFontID(design) {
    return { 黑体: 'noto-sans-sc', 宋体: 'noto-serif-sc', 圆体: 'lxgw-wenkai', 等宽: 'space-grotesk' }[design];
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
        fontId: defaultFontID(suggestedDesign(field)),
        alignment: '左对齐',
        color: { ...exports.Palette.ink },
        tracking: field === '英文类型' || field === '编号' || field === '署名' ? 2 : 0,
        lineLimit: 3,
        uppercase: false,
    };
}
function makeTextNode(field, overrides = {}, env) {
    const base = defaultTextNode(field, env);
    return definedOnly({ ...base, ...overrides, fontId: overrides.fontId ?? defaultFontID(overrides.design ?? base.design), kind: 'text', field });
}
function makeImageNode(source, overrides = {}, env) {
    const base = {
        kind: 'image',
        id: resolveEnvironment(env).newID(),
        source,
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
        root: makeStackNode('column', { layout: 'canvas' }, env),
        createdAt: now,
        updatedAt: now,
    };
}
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
function exportPixelWidth(template) {
    const width = template.canvas.exportWidth;
    return typeof width === 'number' && Number.isFinite(width) ? width : exports.DEFAULT_EXPORT_WIDTH;
}
function exportScale(template) {
    return exportPixelWidth(template) / exports.CANVAS_WIDTH;
}
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
function mapNodes(root, fn) {
    const mapped = isStackNode(root)
        ? { ...root, children: root.children.map((child) => mapNodes(child, fn)) }
        : root;
    return fn(mapped);
}
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
        return root;
    return mapRoot(root, (node) => isStackNode(node)
        ? { ...node, children: node.children.filter((child) => child.id !== id) }
        : node);
}
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
function wrapNode(root, id, direction, env) {
    const node = findNode(root, id);
    if (!node || node.id === root.id)
        return root;
    const wrapper = makeStackNode(direction, { children: [node] }, env);
    return replaceNode(root, id, wrapper);
}
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
function definedOnly(value) {
    const out = {};
    for (const [key, entry] of Object.entries(value)) {
        if (entry !== undefined)
            out[key] = entry;
    }
    return out;
}
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
function sanitizeHandwriting(raw) {
    if (!raw || typeof raw !== 'object')
        return undefined;
    const value = raw;
    if (!['pencilkit', 'strokes-v1'].includes(value.format) || typeof value.data !== 'string')
        return undefined;
    return definedOnly({ format: value.format, data: value.data, portableStrokes: typeof value.portableStrokes === 'string' ? value.portableStrokes : undefined, width: clamp(value.width, [1, 20000], 360), height: clamp(value.height, [1, 20000], 240) });
}
function sanitizeFrameAspect(raw) {
    if (raw === 'natural')
        return 'natural';
    return clamp(raw, exports.IMAGE_ASPECT_RANGE, 1);
}
function takeID(raw, context) {
    const id = isUUID(raw) ? String(raw).toUpperCase() : context.env.newID();
    const unique = context.seen.has(id) ? context.env.newID() : id;
    context.seen.add(unique);
    return unique;
}
function sanitizeFrame(raw) {
    if (!raw || typeof raw !== 'object')
        return undefined;
    const value = raw;
    return {
        x: clamp(value.x, [-20000, 20000], 0), y: clamp(value.y, [-20000, 20000], 0),
        width: clamp(value.width, [1, 20000], 120), height: clamp(value.height, [0, 20000], 32),
    };
}
function referenceID(raw) {
    return typeof raw === 'string' && raw.length > 0 ? (isUUID(raw) ? raw.toUpperCase() : prefixChars(raw, 100)) : undefined;
}
function sanitizeFollow(raw) {
    if (!raw || typeof raw !== 'object')
        return undefined;
    const value = raw;
    const targetId = referenceID(value.targetId);
    return targetId ? { targetId, gap: clamp(value.gap, [0, 2000], 12) } : undefined;
}
function sanitizeGrid(raw) {
    if (!raw || typeof raw !== 'object')
        return undefined;
    const value = raw;
    const rows = Math.round(clamp(value.rows, [1, 64], 2)), columns = Math.round(clamp(value.columns, [1, 12], 2));
    const merges = (Array.isArray(value.merges) ? value.merges : []).slice(0, 768).map(cell => ({
        row: Math.round(clamp(cell?.row, [0, rows - 1], 0)), column: Math.round(clamp(cell?.column, [0, columns - 1], 0)),
        rowSpan: Math.round(clamp(cell?.rowSpan, [1, rows], 1)), colSpan: Math.round(clamp(cell?.colSpan, [1, columns], 1)),
    })).filter(cell => cell.rowSpan > 1 || cell.colSpan > 1);
    return definedOnly({ rows, columns, columnGap: clamp(value.columnGap, [0, 120], 12), rowGap: clamp(value.rowGap, [0, 120], 12),
        columnWeights: Array.isArray(value.columnWeights) ? Array.from({ length: columns }, (_, i) => clamp(value.columnWeights[i], [.05, 100], 1)) : undefined,
        rowHeights: Array.isArray(value.rowHeights) ? Array.from({ length: rows }, (_, i) => value.rowHeights[i] == null ? null : clamp(value.rowHeights[i], [1, 2000], 40)) : undefined,
        collapseEmptyRows: dropDefault(optionalBool(value.collapseEmptyRows), true), merges: merges.length ? merges : undefined });
}
function sanitizeFontAssets(raw) {
    if (!Array.isArray(raw))
        return undefined;
    const seen = new Set();
    const assets = [];
    for (const item of raw.slice(0, 12)) {
        if (!item || typeof item !== 'object' || !item.id || typeof item.data !== 'string' || !['ttf', 'otf'].includes(item.format))
            continue;
        const id = referenceID(item.id);
        if (seen.has(id))
            continue;
        seen.add(id);
        assets.push(definedOnly({ id, name: prefixChars(item.name || id, 100), data: item.data, format: item.format, weight: optionalClamp(item.weight, [1, 1000], 400),
            sha256: typeof item.sha256 === 'string' ? item.sha256 : undefined,
            license: typeof item.license === 'string' ? prefixChars(item.license, 2000) : undefined }));
    }
    return assets.length ? assets : undefined;
}
function sanitizeBase(raw, context) {
    return definedOnly({
        id: takeID(raw.id, context),
        name: typeof raw.name === 'string' && raw.name.trim() ? prefixChars(raw.name.trim(), 80) : undefined,
        frame: sanitizeFrame(raw.frame),
        locked: dropDefault(optionalBool(raw.locked), false),
        groupId: referenceID(raw.groupId),
        regionId: referenceID(raw.regionId),
        cell: raw.cell && typeof raw.cell === 'object' ? {
            row: Math.round(clamp(raw.cell.row, [0, 63], 0)),
            column: Math.round(clamp(raw.cell.column, [0, 11], 0)),
        } : undefined,
        decoration: dropDefault(optionalBool(raw.decoration), false),
        follow: sanitizeFollow(raw.follow),
        visible: dropDefault(optionalBool(raw.visible), true),
        opacity: dropDefault(optionalClamp(raw.opacity, exports.OPACITY_RANGE, 1), 1),
        rotation: dropDefault(optionalClamp(raw.rotation, exports.ROTATION_RANGE, 0), 0),
        position: raw.position === 'absolute' ? 'absolute' : undefined,
        anchor: dropDefault(enumOrUndefined(raw.anchor, exports.ANCHORS), 'center'),
        offsetX: dropDefault(optionalClamp(raw.offsetX, exports.OFFSET_RANGE, 0), 0),
        offsetY: dropDefault(optionalClamp(raw.offsetY, exports.OFFSET_RANGE, 0), 0),
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
    if (!raw || typeof raw !== 'object' || Array.isArray(raw))
        return null;
    if (context.budget <= 0 || depth > exports.MAX_DEPTH)
        return null;
    const value = raw;
    const kind = value.kind;
    if (!exports.TEMPLATE_NODE_KINDS.includes(kind))
        return null;
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
                layout: enumOrUndefined(value.layout, ['canvas', 'region', 'grid']),
                grid: sanitizeGrid(value.grid),
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
                binding: value.binding && typeof value.binding === 'object' && value.binding.kind === 'custom' && referenceID(value.binding.definitionId)
                    ? { kind: 'custom', definitionId: referenceID(value.binding.definitionId), name: prefixChars(value.binding.name ?? '自定义词条', 100) } : undefined,
                fontId: referenceID(value.fontId) ?? defaultFontID(enumOrUndefined(value.design, exports.TEMPLATE_FONT_DESIGNS) ?? '黑体'),
                autoHeight: dropDefault(optionalBool(value.autoHeight), true),
                field: enumOrUndefined(value.field, exports.TEMPLATE_FIELDS) ?? '自定义文字',
                text: prefixChars(value.text ?? '', 30000),
                label: prefixChars(value.label ?? '', 40),
                inlineLabel: dropDefault(optionalBool(value.inlineLabel), false),
                fontSize: clamp(value.fontSize, exports.FONT_SIZE_RANGE, 12),
                weight: enumOrUndefined(value.weight, exports.TEMPLATE_WEIGHTS) ?? '常规',
                design: enumOrUndefined(value.design, exports.TEMPLATE_FONT_DESIGNS) ??
                    '黑体',
                alignment: enumOrUndefined(value.alignment, exports.TEMPLATE_ALIGNMENTS) ??
                    '左对齐',
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
                handwriting: sanitizeHandwriting(value.handwriting),
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
                shape: enumOrUndefined(value.shape, exports.TEMPLATE_SHAPES) ?? '矩形',
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
        padding: sanitizePadding(value.padding) ?? exports.ZERO_PADDING,
        background: clampColor(value.background),
        backgroundAccent: accentOrUndefined(value.backgroundAccent),
        image: sanitizeCanvasImage(value.image),
        exportWidth: optionalClamp(value.exportWidth, exports.EXPORT_WIDTH_RANGE, exports.DEFAULT_EXPORT_WIDTH),
    });
}
function sanitizeTemplate(raw, env) {
    const context = newContext(env);
    const value = (raw && typeof raw === 'object' ? raw : {});
    const trimmed = prefixChars(String(value.name ?? '').trim(), exports.MAX_NAME_LENGTH);
    const sanitizedRoot = sanitizeNodeIn(value.root, context, 1);
    const root = sanitizedRoot && isStackNode(sanitizedRoot)
        ? { ...sanitizedRoot, direction: 'column' }
        : {
            kind: 'stack',
            id: takeID(undefined, context),
            direction: 'column',
            children: sanitizedRoot ? [sanitizedRoot] : [],
        };
    return definedOnly({
        fontAssets: sanitizeFontAssets(value.fontAssets),
        id: isUUID(value.id) ? String(value.id).toUpperCase() : context.env.newID(),
        name: trimmed || exports.DEFAULT_TEMPLATE_NAME,
        canvas: sanitizeCanvas(value.canvas),
        root,
        createdAt: typeof value.createdAt === 'string' ? value.createdAt : context.env.now(),
        updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : context.env.now(),
    });
}
exports.STARTERS = [
    { id: '拍立得', subtitle: '白边相纸，下方手写一句' },
    { id: '展览海报', subtitle: '大字标题压在封面上' },
    { id: '信息票根', subtitle: '封面在上，字段整齐排在下方' },
    { id: '空白画布', subtitle: '只有底色，全部自己来' },
];
function starterSubtitle(starter) {
    return exports.STARTERS.find((item) => item.id === starter).subtitle;
}
function starterTemplate(starter, name, env) {
    const base = defaultTemplate(env);
    const nodes = [];
    const width = 312;
    if (starter !== '空白画布') {
        const cover = makeImageNode('cover', { frame: { x: 0, y: 0, width, height: starter === '展览海报' ? 380 : 250 },
            border: starter === '拍立得' ? 12 : 0, cornerRadius: 4, shadow: starter === '拍立得' }, env);
        const title = makeTextNode('名称', { frame: { x: 0, y: 0, width, height: 40 }, fontSize: 28,
            follow: { targetId: cover.id, gap: 18 } }, env);
        const date = makeTextNode('日期', { frame: { x: 0, y: 0, width, height: 22 }, fontSize: 12,
            follow: { targetId: title.id, gap: 10 } }, env);
        const venue = makeTextNode('城市与场馆', { frame: { x: 0, y: 0, width, height: 22 }, fontSize: 12,
            follow: { targetId: date.id, gap: 6 } }, env);
        const quote = makeTextNode('金句', { frame: { x: 0, y: 0, width, height: 22 }, fontSize: 15,
            follow: { targetId: venue.id, gap: 18 }, design: '宋体' }, env);
        const information = makeStackNode('column', { name: '文字与信息', layout: 'grid', children: [],
            frame: { x: 0, y: 0, width, height: 0 }, follow: { targetId: cover.id, gap: 18 },
            grid: { rows: 3, columns: 2, rowGap: 12, columnGap: 16, merges: [{ row: 0, column: 0, colSpan: 2 }, { row: 2, column: 0, colSpan: 2 }] } }, env);
        nodes.push(cover, information, { ...title, regionId: information.id, cell: { row: 0, column: 0 }, follow: undefined }, { ...date, regionId: information.id, cell: { row: 1, column: 0 }, follow: undefined }, { ...venue, regionId: information.id, cell: { row: 1, column: 1 }, follow: undefined }, { ...quote, regionId: information.id, cell: { row: 2, column: 0 }, follow: undefined });
    }
    return sanitizeTemplate({ ...base, name: name ?? starter,
        canvas: { ...base.canvas, height: starter === '空白画布' ? { aspect: 1.4 } : 'hug' },
        root: { ...base.root, layout: 'canvas', children: nodes } }, env);
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
function formatLongDate(parts, locale) {
    if (locale === 'en')
        return `${EN_MONTHS[parts.month - 1]} ${parts.day}, ${parts.year}`;
    return `${parts.year}年${parts.month}月${parts.day}日`;
}
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
    const locale = options.locale ?? 'zh-Hans';
    const parts = dateParts(record);
    const hasDate = record.hasConfirmedDate !== false;
    const hasTime = hasDate && record.hasConfirmedTime !== false;
    const showDate = options.showDate && hasDate && !!parts;
    const present = (text) => (text ? text : null);
    const city = record.city ?? '';
    const venue = record.venue ?? '';
    const locationLine = [city, venue].filter((item) => item.length > 0).join(' · ');
    const rating = options.showRating && (record.rating ?? 0) > 0 ? record.rating : null;
    return {
        record,
        options,
        author,
        kindName: record.kindName ?? '',
        kindEnglish: record.kindEnglish ?? '',
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
            ? `${record.price.toFixed(2)} ${record.currency ?? 'CNY'}`
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

},
"src/core/template/canvas.ts":function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.canvasElements = canvasElements;
exports.ensureCanvas = ensureCanvas;
exports.elementFrame = elementFrame;
exports.expandSelectionIDs = expandSelectionIDs;
exports.canvasWorldFrame = canvasWorldFrame;
exports.moveElements = moveElements;
exports.resizeElement = resizeElement;
exports.rotateElements = rotateElements;
exports.selectionBounds = selectionBounds;
exports.alignElements = alignElements;
exports.distributeElements = distributeElements;
exports.groupElements = groupElements;
exports.ungroupElements = ungroupElements;
exports.validateCanvasRelations = validateCanvasRelations;
exports.setElementFollow = setElementFollow;
exports.setElementsRegion = setElementsRegion;
exports.deleteElements = deleteElements;
exports.duplicateElements = duplicateElements;
exports.createContentRegion = createContentRegion;
exports.resizeElements = resizeElements;
exports.rotateSelection = rotateSelection;
const model_1 = require("src/core/template/model.ts");
const grid_1 = require("src/core/template/grid.ts");
__exportStar(require("src/core/template/grid.ts"), exports);
function canvasElements(template) {
    return template.root.children;
}
function ensureCanvas(template) {
    if (template.root.layout === 'canvas')
        return template;
    const fresh = (0, model_1.defaultTemplate)();
    return { ...fresh, id: template.id, name: template.name, canvas: template.canvas };
}
function elementFrame(node) {
    return node.frame ?? { x: 0, y: 0, width: typeof node.width === 'number' ? node.width : 160,
        height: typeof node.height === 'number' ? node.height : node.kind === 'image' ? 160 : 40 };
}
function edit(template, fn) {
    return { ...template, root: { ...template.root, layout: 'canvas', children: template.root.children.map(fn) } };
}
function expandSelectionIDs(template, ids) {
    const wanted = new Set(ids);
    const groups = new Set(canvasElements(template).filter(n => wanted.has(n.id) && n.groupId).map(n => n.groupId));
    for (const node of canvasElements(template))
        if (node.groupId && groups.has(node.groupId))
            wanted.add(node.id);
    return [...wanted];
}
function movableSelection(template, ids) {
    const selected = new Set(expandSelectionIDs(template, ids));
    return new Set(canvasElements(template).filter(n => selected.has(n.id) && !n.locked && !(n.regionId && selected.has(n.regionId))).map(n => n.id));
}
function regionAngle(template, node) {
    return node.regionId ? canvasElements(template).find(n => n.id === node.regionId)?.rotation ?? 0 : 0;
}
function rotateDelta(x, y, degrees) {
    const radians = degrees * Math.PI / 180;
    return { x: x * Math.cos(radians) - y * Math.sin(radians), y: x * Math.sin(radians) + y * Math.cos(radians) };
}
function canvasWorldFrame(template, node, layout) {
    const frame = layout.byID[node.id]?.frame;
    const owner = node.regionId ? layout.byID[node.regionId]?.frame : undefined;
    if (!frame || !owner)
        return frame;
    const cx = owner.x + owner.width / 2, cy = owner.y + owner.height / 2;
    const delta = rotateDelta(frame.x + frame.width / 2 - cx, frame.y + frame.height / 2 - cy, regionAngle(template, node));
    return { ...frame, x: cx + delta.x - frame.width / 2, y: cy + delta.y - frame.height / 2 };
}
function frameFromWorld(template, node, frame, layout) {
    const owner = node.regionId ? layout.byID[node.regionId]?.frame : layout.byID[template.root.id]?.frame;
    if (!owner)
        return frame;
    const cx = owner.x + owner.width / 2, cy = owner.y + owner.height / 2;
    const delta = rotateDelta(frame.x + frame.width / 2 - cx, frame.y + frame.height / 2 - cy, -regionAngle(template, node));
    return { ...frame, x: cx + delta.x - frame.width / 2 - owner.x, y: cy + delta.y - frame.height / 2 - owner.y };
}
function moveElements(template, ids, dx, dy) {
    if (!Number.isFinite(dx) || !Number.isFinite(dy))
        return template;
    const selected = movableSelection(template, ids);
    return edit(template, node => {
        if (!selected.has(node.id))
            return node;
        const frame = elementFrame(node);
        const local = rotateDelta(dx, dy, -regionAngle(template, node));
        const targetMoves = node.follow && selected.has(node.follow.targetId);
        return { ...node, frame: { ...frame, x: frame.x + local.x, y: node.follow ? frame.y : frame.y + local.y },
            ...(node.follow ? { follow: { ...node.follow, gap: Math.max(0, node.follow.gap + (targetMoves ? 0 : local.y)) } } : {}) };
    });
}
function resizeElement(template, id, next, options = {}) {
    const node = canvasElements(template).find(n => n.id === id);
    if (!node || node.locked)
        return template;
    const old = elementFrame(node);
    const frame = { x: Number.isFinite(next.x) ? next.x : old.x, y: Number.isFinite(next.y) ? next.y : old.y,
        width: Math.max(8, Number.isFinite(next.width) ? next.width : old.width),
        height: Math.max(8, Number.isFinite(next.height) ? next.height : old.height) };
    const sx = frame.width / Math.max(1, old.width);
    const sy = node.kind === 'stack' && node.layout === 'grid' ? sx : frame.height / Math.max(1, old.height);
    return edit(template, item => {
        if (item.id === id)
            return { ...item, frame,
                ...(item.kind === 'stack' && item.layout === 'grid' && item.grid ? { grid: { ...item.grid,
                        columnGap: item.grid.columnGap * sx, rowGap: item.grid.rowGap * sy,
                        rowHeights: item.grid.rowHeights?.map(height => height == null ? null : height * sy) } } : {}),
                ...(item.kind === 'text' && options.scaleText ? { fontSize: Math.max(6, Math.min(120, item.fontSize * sx)) } : {}) };
        if (item.regionId !== id || options.scaleChildren === false)
            return item;
        const f = elementFrame(item);
        return { ...item, frame: { x: f.x * sx, y: f.y * sy, width: f.width * sx, height: f.height * sy },
            ...(item.follow ? { follow: { ...item.follow, gap: item.follow.gap * sy } } : {}),
            ...(item.kind === 'text' && options.scaleText ? { fontSize: Math.max(6, Math.min(120, item.fontSize * sx)) } : {}) };
    });
}
function rotateElements(template, ids, degrees) {
    const selected = movableSelection(template, ids);
    return edit(template, n => selected.has(n.id) ? { ...n, rotation: ((degrees + 180) % 360 + 360) % 360 - 180 } : n);
}
function selectionBounds(template, ids, layout) {
    const selected = movableSelection(template, ids);
    const frames = canvasElements(template).filter(n => selected.has(n.id)).map(n => canvasWorldFrame(template, n, layout)).filter((f) => !!f);
    if (!frames.length)
        return null;
    const x = Math.min(...frames.map(f => f.x));
    const y = Math.min(...frames.map(f => f.y));
    return { x, y, width: Math.max(...frames.map(f => f.x + f.width)) - x, height: Math.max(...frames.map(f => f.y + f.height)) - y };
}
function alignElements(template, ids, mode, layout) {
    const selected = movableSelection(template, ids);
    const bounds = selectionBounds(template, [...selected], layout);
    if (!bounds)
        return template;
    const target = selected.size === 1 ? { x: 0, y: 0, width: model_1.CANVAS_WIDTH, height: layout.height } : bounds;
    return edit(template, node => {
        const world = canvasWorldFrame(template, node, layout);
        if (!selected.has(node.id) || !world)
            return node;
        let dx = 0;
        let dy = 0;
        if (mode === 'left')
            dx = target.x - world.x;
        if (mode === 'center')
            dx = target.x + (target.width - world.width) / 2 - world.x;
        if (mode === 'right')
            dx = target.x + target.width - world.width - world.x;
        if (mode === 'top')
            dy = target.y - world.y;
        if (mode === 'middle')
            dy = target.y + (target.height - world.height) / 2 - world.y;
        if (mode === 'bottom')
            dy = target.y + target.height - world.height - world.y;
        return { ...node, follow: undefined, frame: frameFromWorld(template, node, { ...world, x: world.x + dx, y: world.y + dy }, layout) };
    });
}
function distributeElements(template, ids, axis, layout) {
    const selected = movableSelection(template, ids);
    const entries = canvasElements(template).filter(n => selected.has(n.id) && layout.byID[n.id]).map(n => ({ node: n, frame: canvasWorldFrame(template, n, layout) }));
    if (entries.length < 3)
        return template;
    const horizontal = axis === 'horizontal';
    entries.sort((a, b) => horizontal ? a.frame.x - b.frame.x : a.frame.y - b.frame.y);
    const first = entries[0].frame;
    const last = entries[entries.length - 1].frame;
    const length = entries.reduce((sum, e) => sum + (horizontal ? e.frame.width : e.frame.height), 0);
    const gap = ((horizontal ? last.x + last.width - first.x : last.y + last.height - first.y) - length) / (entries.length - 1);
    const positions = new Map();
    let cursor = horizontal ? first.x : first.y;
    for (const e of entries) {
        positions.set(e.node.id, cursor);
        cursor += (horizontal ? e.frame.width : e.frame.height) + gap;
    }
    return edit(template, node => {
        const position = positions.get(node.id);
        if (position === undefined)
            return node;
        const world = canvasWorldFrame(template, node, layout);
        return { ...node, follow: undefined, frame: frameFromWorld(template, node, { ...world,
                x: horizontal ? position : world.x, y: horizontal ? world.y : position }, layout) };
    });
}
function groupElements(template, ids, env) {
    const wanted = movableSelection(template, ids);
    const nodes = canvasElements(template).filter(n => wanted.has(n.id));
    if (nodes.length < 2 || new Set(nodes.map(n => n.regionId ?? '')).size > 1)
        return template;
    const groupId = (0, model_1.resolveEnvironment)(env).newID();
    return edit(template, n => wanted.has(n.id) ? { ...n, groupId } : n);
}
function ungroupElements(template, ids) {
    const wanted = new Set(expandSelectionIDs(template, ids));
    return edit(template, n => wanted.has(n.id) ? { ...n, groupId: undefined } : n);
}
function validateCanvasRelations(template) {
    if (template.root.layout !== 'canvas')
        return [];
    const nodes = canvasElements(template);
    const byID = new Map(nodes.map(n => [n.id, n]));
    const errors = [];
    for (const n of nodes) {
        if (n.kind === 'stack' && (!['region', 'grid'].includes(n.layout ?? '') || n.children.length || n.regionId))
            errors.push(`invalid region:${n.id}`);
        if (n.kind === 'stack' && n.layout === 'grid')
            errors.push(...(0, grid_1.validateGrid)(template, n));
        if (n.regionId) {
            const owner = byID.get(n.regionId);
            if (!owner || owner.kind !== 'stack' || !['region', 'grid'].includes(owner.layout ?? ''))
                errors.push(`missing region:${n.id}`);
        }
        if (n.cell && (!n.regionId || !(0, grid_1.gridLayer)(template, n.regionId)))
            errors.push(`orphan cell:${n.id}`);
        if (n.follow) {
            const target = byID.get(n.follow.targetId);
            if (!target || target.id === n.id || target.regionId !== n.regionId || target.decoration)
                errors.push(`invalid follow:${n.id}`);
        }
    }
    const done = new Set();
    const visiting = new Set();
    const visit = (id) => {
        if (visiting.has(id)) {
            errors.push(`follow cycle:${id}`);
            return;
        }
        if (done.has(id))
            return;
        visiting.add(id);
        const target = byID.get(id)?.follow?.targetId;
        if (target && byID.has(target))
            visit(target);
        visiting.delete(id);
        done.add(id);
    };
    nodes.forEach(n => visit(n.id));
    return errors;
}
function setElementFollow(template, id, targetId, gap = 12, layout) {
    const node = canvasElements(template).find(n => n.id === id);
    if (!node || node.locked)
        return template;
    const world = layout?.byID[id]?.frame;
    const owner = node.regionId ? layout?.byID[node.regionId]?.frame : layout?.byID[template.root.id]?.frame;
    const next = edit(template, n => n.id === id ? { ...n, follow: targetId ? { targetId, gap: Math.max(0, gap) } : undefined,
        ...(!targetId && world ? { frame: { ...elementFrame(n), x: world.x - (owner?.x ?? 0), y: world.y - (owner?.y ?? 0) } } : {}) } : n);
    return validateCanvasRelations(next).length ? template : next;
}
function setElementsRegion(template, ids, regionId, layout) {
    const selected = movableSelection(template, ids);
    const grid = regionId ? (0, grid_1.gridLayer)(template, regionId) : undefined;
    if (grid?.grid) {
        let result = template;
        for (const id of selected) {
            let placed = false;
            for (let row = 0; row < grid.grid.rows && !placed; row++)
                for (let column = 0; column < grid.grid.columns; column++) {
                    const cell = (0, grid_1.gridCellAt)(grid.grid, row, column);
                    if (cell.row !== row || cell.column !== column)
                        continue;
                    if (result.root.children.some(n => n.regionId === regionId && n.cell?.row === row && n.cell.column === column))
                        continue;
                    const next = (0, grid_1.setGridCell)(result, id, regionId, { row, column });
                    if (next !== result) {
                        result = next;
                        placed = true;
                        break;
                    }
                }
            if (!placed)
                return template;
        }
        return result;
    }
    const region = regionId ? canvasElements(template).find(n => n.id === regionId && n.kind === 'stack' && n.layout === 'region') : null;
    if (regionId && !region)
        return template;
    const next = edit(template, n => {
        if (!selected.has(n.id) || n.kind === 'stack')
            return n;
        const world = canvasWorldFrame(template, n, layout);
        if (!world)
            return n;
        const moved = { ...n, regionId: regionId ?? undefined, cell: undefined };
        return { ...moved, follow: undefined,
            rotation: (n.rotation ?? 0) + regionAngle(template, n) - regionAngle(template, moved),
            frame: frameFromWorld(template, moved, world, layout) };
    });
    return edit(next, n => n.follow && next.root.children.find(t => t.id === n.follow.targetId)?.regionId !== n.regionId ? { ...n, follow: undefined } : n);
}
function deleteElements(template, ids) {
    const remove = movableSelection(template, ids);
    for (const n of canvasElements(template))
        if (n.regionId && remove.has(n.regionId))
            remove.add(n.id);
    const byID = new Map(canvasElements(template).map(n => [n.id, n]));
    const children = canvasElements(template).filter(n => !remove.has(n.id)).map(n => {
        if (!n.follow || !remove.has(n.follow.targetId))
            return n;
        let previous = byID.get(n.follow.targetId);
        const seen = new Set();
        while (previous && remove.has(previous.id) && previous.follow && !seen.has(previous.id)) {
            seen.add(previous.id);
            previous = byID.get(previous.follow.targetId);
        }
        if (previous && !remove.has(previous.id))
            return { ...n, follow: { ...n.follow, targetId: previous.id } };
        return { ...n, follow: undefined, frame: { ...elementFrame(n), y: previous ? elementFrame(previous).y : elementFrame(n).y } };
    });
    return { ...template, root: { ...template.root, children } };
}
function duplicateElements(template, ids, env) {
    const selected = new Set(expandSelectionIDs(template, ids));
    for (const n of canvasElements(template))
        if (n.regionId && selected.has(n.regionId))
            selected.add(n.id);
    const e = (0, model_1.resolveEnvironment)(env);
    const remap = new Map();
    const groups = new Map();
    for (const id of selected)
        remap.set(id, e.newID());
    let copies = canvasElements(template).filter(n => selected.has(n.id)).map(n => {
        if (n.groupId && !groups.has(n.groupId))
            groups.set(n.groupId, e.newID());
        const frame = elementFrame(n);
        const copiedOwner = n.regionId && remap.has(n.regionId);
        return { ...n, id: remap.get(n.id), groupId: n.groupId ? groups.get(n.groupId) : undefined,
            regionId: copiedOwner ? remap.get(n.regionId) : n.regionId,
            follow: n.follow ? { ...n.follow, targetId: remap.get(n.follow.targetId) ?? n.follow.targetId } : undefined,
            frame: { ...frame, x: frame.x + (copiedOwner ? 0 : 12), y: frame.y + (copiedOwner ? 0 : 12) } };
    });
    const taken = new Set(canvasElements(template).filter(n => n.cell).map(n => `${n.regionId}:${n.cell.row}:${n.cell.column}`));
    const placed = [];
    for (const copy of copies) {
        const owner = copy.regionId ? (0, grid_1.gridLayer)(template, copy.regionId) : undefined;
        if (!owner?.grid || !copy.cell) {
            placed.push(copy);
            continue;
        }
        let cell;
        for (let row = 0; row < owner.grid.rows && !cell; row++)
            for (let column = 0; column < owner.grid.columns; column++) {
                const at = (0, grid_1.gridCellAt)(owner.grid, row, column), key = `${owner.id}:${row}:${column}`;
                if (at.row === row && at.column === column && !taken.has(key)) {
                    cell = { row, column };
                    taken.add(key);
                    break;
                }
            }
        if (!cell)
            return template;
        placed.push({ ...copy, cell });
    }
    copies = placed;
    return { ...template, root: { ...template.root, children: [...template.root.children, ...copies] } };
}
function createContentRegion(frame, env) {
    return (0, model_1.makeStackNode)('column', { layout: 'region', frame, padding: { top: 12, right: 12, bottom: 12, left: 12 }, children: [] }, env);
}
function resizeElements(template, ids, target, layout, options = {}) {
    const selected = movableSelection(template, ids);
    const bounds = selectionBounds(template, [...selected], layout);
    if (!bounds)
        return template;
    const sx = Math.max(1, target.width) / Math.max(1, bounds.width);
    const sy = Math.max(1, target.height) / Math.max(1, bounds.height);
    let result = template;
    for (const id of selected) {
        const node = canvasElements(result).find(n => n.id === id);
        const world = canvasWorldFrame(template, node, layout);
        if (!world)
            continue;
        result = setElementFollow(result, id, null, 0, layout);
        result = resizeElement(result, id, frameFromWorld(template, node, {
            x: target.x + (world.x - bounds.x) * sx,
            y: target.y + (world.y - bounds.y) * sy,
            width: world.width * sx, height: world.height * sy,
        }, layout), options);
    }
    return result;
}
function rotateSelection(template, ids, deltaDegrees, layout) {
    if (!Number.isFinite(deltaDegrees))
        return template;
    const selected = movableSelection(template, ids);
    const bounds = selectionBounds(template, [...selected], layout);
    if (!bounds)
        return template;
    const cx = bounds.x + bounds.width / 2;
    const cy = bounds.y + bounds.height / 2;
    const radians = deltaDegrees * Math.PI / 180;
    const c = Math.cos(radians);
    const s = Math.sin(radians);
    return edit(template, node => {
        const world = canvasWorldFrame(template, node, layout);
        if (!selected.has(node.id) || !world)
            return node;
        const dx = world.x + world.width / 2 - cx;
        const dy = world.y + world.height / 2 - cy;
        return { ...node, follow: undefined,
            rotation: ((((node.rotation ?? 0) + deltaDegrees + 180) % 360) + 360) % 360 - 180,
            frame: frameFromWorld(template, node, { ...world, x: cx + dx * c - dy * s - world.width / 2,
                y: cy + dx * s + dy * c - world.height / 2 }, layout) };
    });
}

},
"src/core/template/grid.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gridLayer = void 0;
exports.createGridLayer = createGridLayer;
exports.gridCellAt = gridCellAt;
exports.gridCellForNode = gridCellForNode;
exports.gridCellFrames = gridCellFrames;
exports.validateGrid = validateGrid;
exports.setGridCell = setGridCell;
exports.mergeGridCells = mergeGridCells;
exports.splitGridCell = splitGridCell;
exports.resizeGrid = resizeGrid;
exports.insertGridTrack = insertGridTrack;
exports.deleteGridTrack = deleteGridTrack;
const model_1 = require("src/core/template/model.ts");
const span = (cell) => ({ row: cell.row, column: cell.column, rowSpan: cell.rowSpan ?? 1, colSpan: cell.colSpan ?? 1 });
const inside = (cell, row, column) => row >= cell.row && column >= cell.column && row < cell.row + (cell.rowSpan ?? 1) && column < cell.column + (cell.colSpan ?? 1);
const intersects = (a, b) => a.row < b.row + (b.rowSpan ?? 1) && b.row < a.row + (a.rowSpan ?? 1) && a.column < b.column + (b.colSpan ?? 1) && b.column < a.column + (a.colSpan ?? 1);
const contains = (a, b) => inside(a, b.row, b.column) && inside(a, b.row + (b.rowSpan ?? 1) - 1, b.column + (b.colSpan ?? 1) - 1);
const gridLayer = (template, id) => template.root.children.find((n) => n.id === id && n.kind === 'stack' && n.layout === 'grid');
exports.gridLayer = gridLayer;
const replace = (template, change) => ({ ...template, root: { ...template.root, children: template.root.children.map(change) } });
function createGridLayer(frame, columns = 2, rows = 2, env) {
    return (0, model_1.makeStackNode)('column', { name: '网格图层', layout: 'grid', frame: { ...frame, height: 0 }, padding: model_1.ZERO_PADDING,
        grid: (0, model_1.sanitizeGrid)({ rows, columns, rowGap: 12, columnGap: 12 }), children: [] }, env);
}
function gridCellAt(grid, row, column) {
    return span(grid.merges?.find(cell => inside(cell, row, column)) ?? { row, column });
}
function gridCellForNode(template, node) {
    const layer = node.regionId ? (0, exports.gridLayer)(template, node.regionId) : undefined;
    return layer?.grid && node.cell ? gridCellAt(layer.grid, node.cell.row, node.cell.column) : undefined;
}
function gridCellFrames(template, layerId, layout) {
    const layer = (0, exports.gridLayer)(template, layerId), tracks = layout.grids?.[layerId], owner = layout.byID[layerId]?.frame;
    if (!layer?.grid || !tracks || !owner)
        return [];
    const result = [], angle = (layer.rotation ?? 0) * Math.PI / 180;
    for (let row = 0; row < layer.grid.rows; row++)
        for (let column = 0; column < layer.grid.columns; column++) {
            const cell = gridCellAt(layer.grid, row, column);
            if (cell.row !== row || cell.column !== column)
                continue;
            const x = tracks.columnOffsets[column], y = tracks.rowOffsets[row];
            const lastColumn = column + cell.colSpan - 1, lastRow = row + cell.rowSpan - 1;
            const width = tracks.columnOffsets[lastColumn] + tracks.columnWidths[lastColumn] - x;
            const height = tracks.rowOffsets[lastRow] + tracks.rowHeights[lastRow] - y;
            const dx = x + width / 2 - owner.width / 2, dy = y + height / 2 - owner.height / 2;
            result.push({ ...cell, localFrame: { x, y, width, height },
                frame: { x: owner.x + owner.width / 2 + dx * Math.cos(angle) - dy * Math.sin(angle) - width / 2,
                    y: owner.y + owner.height / 2 + dx * Math.sin(angle) + dy * Math.cos(angle) - height / 2, width, height },
                rotation: layer.rotation ?? 0, collapsed: height <= .01 });
        }
    return result;
}
function validateGrid(template, layer) {
    const grid = layer.grid, errors = [];
    if (!grid || !Number.isInteger(grid.rows) || !Number.isInteger(grid.columns) || grid.rows < 1 || grid.rows > 64 || grid.columns < 1 || grid.columns > 12)
        return [`invalid grid:${layer.id}`];
    const valid = (cell) => [cell.row, cell.column, cell.rowSpan ?? 1, cell.colSpan ?? 1].every(Number.isInteger) && cell.row >= 0 && cell.column >= 0 && (cell.rowSpan ?? 1) > 0 && (cell.colSpan ?? 1) > 0 && cell.row + (cell.rowSpan ?? 1) <= grid.rows && cell.column + (cell.colSpan ?? 1) <= grid.columns;
    const merges = grid.merges ?? [];
    merges.forEach((cell, i) => { if (!valid(cell))
        errors.push(`grid bounds:${layer.id}`); if (merges.slice(i + 1).some(next => intersects(cell, next)))
        errors.push(`grid overlap:${layer.id}`); });
    const occupied = new Set();
    for (const node of template.root.children.filter(n => n.regionId === layer.id)) {
        if (node.decoration && !node.cell)
            continue;
        if (!node.cell || !valid(node.cell)) {
            errors.push(`grid cell:${node.id}`);
            continue;
        }
        const cell = gridCellAt(grid, node.cell.row, node.cell.column), key = `${cell.row}:${cell.column}`;
        if (cell.row !== node.cell.row || cell.column !== node.cell.column || occupied.has(key) || node.follow)
            errors.push(`grid content:${node.id}`);
        occupied.add(key);
    }
    return errors;
}
function setGridCell(template, nodeId, layerId, requested) {
    const layer = (0, exports.gridLayer)(template, layerId), node = template.root.children.find(n => n.id === nodeId);
    if (!layer?.grid || layer.locked || !node || node.locked || node.kind === 'stack' || requested.row < 0 || requested.column < 0 || requested.row >= layer.grid.rows || requested.column >= layer.grid.columns)
        return template;
    const cell = gridCellAt(layer.grid, Math.floor(requested.row), Math.floor(requested.column));
    const occupied = template.root.children.find(n => n.id !== nodeId && n.regionId === layerId && n.cell?.row === cell.row && n.cell.column === cell.column);
    if (occupied && (occupied.locked || node.regionId !== layerId || !node.cell))
        return template;
    return replace(template, n => n.id === nodeId ? { ...n, regionId: layerId, cell: { row: cell.row, column: cell.column }, follow: undefined, groupId: undefined } : n.id === occupied?.id ? { ...n, cell: node.cell } : n);
}
function mergeGridCells(template, layerId, requested) {
    const layer = (0, exports.gridLayer)(template, layerId), cell = span(requested);
    if (!layer?.grid || layer.locked)
        return { template, error: 'invalidGrid' };
    if (![cell.row, cell.column, cell.rowSpan, cell.colSpan].every(Number.isInteger) || cell.row < 0 || cell.column < 0 || cell.rowSpan < 1 || cell.colSpan < 1 || cell.row + cell.rowSpan > layer.grid.rows || cell.column + cell.colSpan > layer.grid.columns)
        return { template, error: 'outOfBounds' };
    if (layer.grid.merges?.some(old => intersects(old, cell) && !contains(cell, old)))
        return { template, error: 'overlappingMerge' };
    const content = template.root.children.filter(n => n.regionId === layerId && n.cell && inside(cell, n.cell.row, n.cell.column));
    if (content.length > 1)
        return { template, error: 'multipleContent' };
    const merges = [...(layer.grid.merges ?? []).filter(old => !intersects(old, cell)), ...(cell.rowSpan > 1 || cell.colSpan > 1 ? [cell] : [])];
    return { template: replace(template, n => n.id === layerId ? { ...layer, grid: { ...layer.grid, merges: merges.length ? merges : undefined } } : n.id === content[0]?.id ? { ...n, cell: { row: cell.row, column: cell.column } } : n) };
}
function splitGridCell(template, layerId, row, column) {
    const layer = (0, exports.gridLayer)(template, layerId);
    if (!layer?.grid || layer.locked)
        return template;
    const merges = (layer.grid.merges ?? []).filter(cell => !inside(cell, row, column));
    return replace(template, n => n.id === layerId ? { ...layer, grid: { ...layer.grid, merges: merges.length ? merges : undefined } } : n);
}
function resizeGrid(template, layerId, rows, columns) {
    const layer = (0, exports.gridLayer)(template, layerId);
    if (!layer?.grid || layer.locked)
        return template;
    rows = Math.max(1, Math.min(64, Math.round(rows)));
    columns = Math.max(1, Math.min(12, Math.round(columns)));
    if (!Number.isFinite(rows) || !Number.isFinite(columns))
        return template;
    const grid = (0, model_1.sanitizeGrid)({ ...layer.grid, rows, columns, merges: layer.grid.merges?.filter(cell => cell.row + (cell.rowSpan ?? 1) <= rows && cell.column + (cell.colSpan ?? 1) <= columns) });
    const positions = new Map(), taken = new Set();
    const members = template.root.children.filter(n => n.regionId === layerId && n.cell);
    const displaced = [];
    for (const node of members) {
        const cell = node.cell, key = `${cell.row}:${cell.column}`;
        if (cell.row < rows && cell.column < columns && !taken.has(key)) {
            positions.set(node.id, cell);
            taken.add(key);
        }
        else
            displaced.push(node);
    }
    for (const node of displaced) {
        let available;
        for (let row = 0; row < rows && !available; row++)
            for (let column = 0; column < columns; column++) {
                const cell = gridCellAt(grid, row, column), key = `${row}:${column}`;
                if (cell.row === row && cell.column === column && !taken.has(key)) {
                    available = { row, column };
                    taken.add(key);
                    break;
                }
            }
        if (!available)
            return template;
        positions.set(node.id, available);
    }
    return replace(template, n => n.id === layerId ? { ...layer, grid } : positions.has(n.id) ? { ...n, cell: positions.get(n.id) } : n);
}
function insertGridTrack(template, layerId, axis, at) {
    const layer = (0, exports.gridLayer)(template, layerId);
    if (!layer?.grid || layer.locked)
        return template;
    const grid = layer.grid, count = axis === 'row' ? grid.rows : grid.columns;
    if (count >= (axis === 'row' ? 64 : 12))
        return template;
    const index = Math.max(0, Math.min(count, Math.floor(at))), spanKey = axis === 'row' ? 'rowSpan' : 'colSpan';
    const merges = grid.merges?.map(raw => { const cell = span(raw); return cell[axis] >= index ? { ...cell, [axis]: cell[axis] + 1 } : cell[axis] + cell[spanKey] > index ? { ...cell, [spanKey]: cell[spanKey] + 1 } : cell; });
    const tracks = axis === 'row' ? Array.from({ length: count }, (_, i) => grid.rowHeights?.[i] ?? null) : Array.from({ length: count }, (_, i) => grid.columnWeights?.[i] ?? 1);
    tracks.splice(index, 0, axis === 'row' ? null : 1);
    const next = { ...grid, [axis === 'row' ? 'rows' : 'columns']: count + 1, [axis === 'row' ? 'rowHeights' : 'columnWeights']: tracks, merges };
    return replace(template, n => n.id === layerId ? { ...layer, grid: next } : n.regionId === layerId && n.cell && n.cell[axis] >= index ? { ...n, cell: { ...n.cell, [axis]: n.cell[axis] + 1 } } : n);
}
function deleteGridTrack(template, layerId, axis, at) {
    const layer = (0, exports.gridLayer)(template, layerId);
    if (!layer?.grid || layer.locked)
        return { template, error: 'invalidGrid' };
    const grid = layer.grid, count = axis === 'row' ? grid.rows : grid.columns, index = Math.floor(at);
    if (count <= 1 || index < 0 || index >= count)
        return { template, error: 'outOfBounds' };
    if (template.root.children.some(n => n.regionId === layerId && n.cell?.[axis] === index))
        return { template, error: 'occupied' };
    const spanKey = axis === 'row' ? 'rowSpan' : 'colSpan';
    const merges = grid.merges?.map(raw => { const cell = span(raw); return cell[axis] > index ? { ...cell, [axis]: cell[axis] - 1 } : cell[axis] <= index && cell[axis] + cell[spanKey] > index ? { ...cell, [spanKey]: cell[spanKey] - 1 } : cell; }).filter(cell => cell.rowSpan > 0 && cell.colSpan > 0 && (cell.rowSpan > 1 || cell.colSpan > 1));
    const tracks = axis === 'row' ? Array.from({ length: count }, (_, i) => grid.rowHeights?.[i] ?? null) : Array.from({ length: count }, (_, i) => grid.columnWeights?.[i] ?? 1);
    tracks.splice(index, 1);
    const next = { ...grid, [axis === 'row' ? 'rows' : 'columns']: count - 1, [axis === 'row' ? 'rowHeights' : 'columnWeights']: tracks, merges };
    return { template: replace(template, n => n.id === layerId ? { ...layer, grid: next } : n.regionId === layerId && n.cell && n.cell[axis] > index ? { ...n, cell: { ...n.cell, [axis]: n.cell[axis] - 1 } } : n) };
}

},
"src/core/template/fontCatalog.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_IMPORTED_FONT_BYTES = exports.DEFAULT_POSTER_FONT_ID = exports.FONT_CATALOG = void 0;
exports.posterFont = posterFont;
exports.posterFontFamily = posterFontFamily;
exports.posterFontFallback = posterFontFallback;
exports.posterFontChain = posterFontChain;
exports.posterFontWeight = posterFontWeight;
exports.fontFileWeight = fontFileWeight;
exports.fontFileVariations = fontFileVariations;
exports.FONT_CATALOG = [
    { id: 'noto-sans-sc', name: '思源黑体', latinName: 'Noto Sans SC', category: 'sans', coverage: 'chinese', file: 'NotoSansSC.ttf', boldFile: 'NotoSansSC-Bold.ttf', sample: '把这一刻，留给以后', license: 'noto-sans-sc-OFL.txt' },
    { id: 'noto-serif-sc', name: '思源宋体', latinName: 'Noto Serif SC', category: 'serif', coverage: 'chinese', file: 'NotoSerifSC.ttf', boldFile: 'NotoSerifSC-Bold.ttf', sample: '愿我们总有歌可唱', license: 'noto-serif-sc-OFL.txt' },
    { id: 'lxgw-wenkai', name: '霞鹜文楷', latinName: 'LXGW WenKai TC', category: 'handwriting', coverage: 'chinese', file: 'LXGWWenKaiTC-Regular.ttf', boldFile: 'LXGWWenKaiTC-Bold.ttf', sample: '见过你，便不算辜负', license: 'lxgw-wenkai-OFL.txt' },
    { id: 'zcool-xiaowei', name: '站酷小薇体', latinName: 'ZCOOL XiaoWei', category: 'display', coverage: 'chinese', file: 'ZCOOLXiaoWei-Regular.ttf', sample: '今夜的星光与回声', license: 'zcool-xiaowei-OFL.txt' },
    { id: 'space-grotesk', name: '太空黑体', latinName: 'Space Grotesk', category: 'sans', coverage: 'latin', file: 'SpaceGrotesk.ttf', boldFile: 'SpaceGrotesk-Bold.ttf', fallbackId: 'noto-sans-sc', sample: 'LIVE / 留住现场 2026', license: 'space-grotesk-OFL.txt' },
    { id: 'playfair', name: '优雅衬线', latinName: 'Playfair Display', category: 'serif', coverage: 'latin', file: 'PlayfairDisplay.ttf', boldFile: 'PlayfairDisplay-Bold.ttf', fallbackId: 'noto-serif-sc', sample: 'Encore / 再见一面', license: 'playfair-OFL.txt' },
    { id: 'cormorant', name: '古典书刊', latinName: 'Cormorant Garamond', category: 'serif', coverage: 'latin', file: 'CormorantGaramond.ttf', boldFile: 'CormorantGaramond-Bold.ttf', fallbackId: 'noto-serif-sc', sample: 'A Night to Remember / 记忆', license: 'cormorant-OFL.txt' },
    { id: 'caveat', name: '随手写', latinName: 'Caveat', category: 'handwriting', coverage: 'latin', file: 'Caveat.ttf', boldFile: 'Caveat-Bold.ttf', fallbackId: 'lxgw-wenkai', sample: 'Wish you were here / 想见你', license: 'caveat-OFL.txt' },
];
exports.DEFAULT_POSTER_FONT_ID = 'noto-sans-sc';
exports.MAX_IMPORTED_FONT_BYTES = 32 * 1024 * 1024;
function posterFont(id) {
    return id ? exports.FONT_CATALOG.find((font) => font.id === id) : undefined;
}
function posterFontFamily(id) {
    return `LivemarkPoster_${id.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
}
function posterFontFallback(id) {
    return posterFont(id)?.fallbackId ?? (id === exports.DEFAULT_POSTER_FONT_ID ? undefined : exports.DEFAULT_POSTER_FONT_ID);
}
function posterFontChain(id) {
    const result = [];
    let current = id;
    while (current && !result.includes(current)) {
        result.push(current);
        current = posterFontFallback(current);
    }
    return result;
}
function posterFontWeight(id, requested, importedWeight = 400) {
    const font = posterFont(id);
    if (!font)
        return importedWeight;
    return font.boldFile && requested >= 550 ? 700 : 400;
}
function fontFileWeight(bytes) {
    const variation = fontFileVariations(bytes).find((axis) => axis.tag === 'wght');
    if (variation)
        return Math.max(1, Math.min(1000, Math.round(variation.value)));
    if (bytes.byteLength < 12)
        return 400;
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const count = view.getUint16(4, false);
    if (count > 256 || 12 + count * 16 > bytes.length)
        return 400;
    for (let index = 0; index < count; index += 1) {
        const position = 12 + index * 16;
        const tag = String.fromCharCode(...bytes.subarray(position, position + 4));
        const offset = view.getUint32(position + 8, false);
        const length = view.getUint32(position + 12, false);
        if (tag === 'OS/2' && length >= 8 && offset + 8 <= bytes.length) {
            const weight = view.getUint16(offset + 4, false);
            return weight >= 1 && weight <= 1000 ? weight : 400;
        }
    }
    return 400;
}
function fontFileVariations(bytes) {
    if (bytes.byteLength < 12)
        return [];
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const count = view.getUint16(4, false);
    if (count > 256 || 12 + count * 16 > bytes.length)
        return [];
    for (let index = 0; index < count; index += 1) {
        const position = 12 + index * 16;
        const tag = String.fromCharCode(...bytes.subarray(position, position + 4));
        if (tag !== 'fvar')
            continue;
        const offset = view.getUint32(position + 8, false);
        const length = view.getUint32(position + 12, false);
        if (length < 16 || offset + length > bytes.length)
            return [];
        const axesOffset = view.getUint16(offset + 4, false);
        const axisCount = view.getUint16(offset + 8, false);
        const axisSize = view.getUint16(offset + 10, false);
        if (axisCount > 64 || axisSize < 20 || axesOffset + axisCount * axisSize > length)
            return [];
        const result = [];
        for (let axis = 0; axis < axisCount; axis += 1) {
            const start = offset + axesOffset + axis * axisSize;
            const axisTag = String.fromCharCode(...bytes.subarray(start, start + 4));
            if (/^[A-Za-z0-9 ]{4}$/.test(axisTag))
                result.push({ tag: axisTag, value: view.getInt32(start + 8, false) / 65536 });
        }
        return result;
    }
    return [];
}

},
"src/features/share/scene.ts":function(require,module,exports){
"use strict";
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
const uuid_1 = require("src/core/uuid.ts");
const customFields_1 = require("src/core/customFields.ts");
const labels_1 = require("src/core/labels.ts");
const models_1 = require("src/core/models.ts");
const layout_1 = require("src/core/template/layout.ts");
const model_1 = require("src/core/template/model.ts");
const i18n_1 = require("virtual:i18n");
const measure_1 = require("src/features/share/measure.ts");
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
const inlineImageIdentities = new Map();
function inlineImageKey(owner, data) {
    const previous = inlineImageIdentities.get(owner);
    if (previous?.data === data)
        return previous.key;
    const key = `${owner}-${(0, uuid_1.derivedUUID)(data)}`;
    inlineImageIdentities.set(owner, { data, key });
    if (inlineImageIdentities.size > 32)
        inlineImageIdentities.delete(inlineImageIdentities.keys().next().value);
    return key;
}
function nodeImageSource(node, context) {
    if (node.source === 'cover')
        return context.cover.source;
    if ('data' in node.source && node.source.data) {
        return { key: inlineImageKey(`element-${node.id}`, node.source.data), data: node.source.data };
    }
    if ('asset' in node.source)
        return assetSource(node.source.asset);
    return null;
}
function canvasImageSource(template, image) {
    if (!image)
        return null;
    if (image.data)
        return { key: inlineImageKey(`template-${template.id}`, image.data), data: image.data };
    return assetSource(image.asset);
}
function typeDisplayName(type) {
    return type.isBuiltIn ? (0, i18n_1.t)(type.name) : type.name;
}
function posterRecord(record, type) {
    return {
        id: record.id,
        title: record.title,
        subtitle: record.subtitle,
        performers: record.performers,
        kindName: type ? typeDisplayName(type) : undefined,
        kindEnglish: type?.english,
        date: record.date,
        hasConfirmedDate: record.dateUnconfirmed !== true,
        hasConfirmedTime: record.timeUnconfirmed !== true,
        utcOffsetSeconds: record.sourceUTCOffset ?? null,
        city: record.city,
        venue: record.venue,
        seat: record.seat,
        price: record.price ?? null,
        currency: record.currency,
        companions: record.companions,
        rating: record.rating,
        mood: (0, labels_1.moodDisplay)(record.mood),
        quote: record.quote,
        note: record.note,
        setlist: record.setlist,
    };
}
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
        locale: locale ?? ((0, i18n_1.getLanguage)() === 'en' ? 'en' : 'zh-Hans'),
    };
}
function accentColor(theme) {
    return (0, model_1.colorFromHexString)((0, models_1.accentHex)(theme)) ?? { ...model_1.Palette.lilac };
}
function accentDeepColor(theme) {
    return (0, model_1.colorFromHexString)((0, models_1.accentDeepHex)(theme)) ?? { ...model_1.Palette.ink };
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
function makeCardContext(record, options, author, types, definitions) {
    const type = types ? (0, models_1.catalogResolve)(types, record) : undefined;
    return {
        bits: (0, model_1.makeCardBits)(posterRecord(record, type), posterOptions(options), author),
        customFields: Object.fromEntries((0, customFields_1.customFieldsForRecord)(record, types, definitions)
            .map(field => [field.id, field.isPrivate && !options.showCustomPrivate ? null : field.value.trim() || null])),
        accent: accentColor(options.accent),
        deep: accentDeepColor(options.accent),
        cover: { source: coverSource(record), artwork: record.artwork, title: record.title },
    };
}
function resolveColor(value, accent, context) {
    if (accent === '主题色')
        return context.accent;
    if (accent === '主题深色')
        return context.deep;
    return (0, model_1.clampColor)(value);
}
function resolveValues(template, context, placeholders = false) {
    const values = {};
    (0, model_1.walkNodes)(template.root, (node) => {
        if (!(0, model_1.isTextNode)(node))
            return;
        const value = resolvedText(node, context);
        values[node.id] = value === null && placeholders ? '[' + (node.binding?.name ?? (0, i18n_1.t)(node.field)) + ']' : value;
    });
    return values;
}
function resolvedText(node, context) {
    if (node.binding?.kind === 'custom')
        return context.customFields?.[node.binding.definitionId] ?? null;
    return (0, model_1.templateText)(node, context.bits);
}
const IDENTITY = { a: 1, b: 0, tx: 0, ty: 0, angle: 0 };
function applyPoint(t, x, y) {
    return { x: t.a * x - t.b * y + t.tx, y: t.b * x + t.a * y + t.ty };
}
function compose(parent, degrees, cx, cy) {
    if (degrees === 0)
        return parent;
    const radians = (degrees * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
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
    const placeholders = options.placeholders === true;
    const values = resolveValues(template, context, placeholders);
    const layout = (0, layout_1.layoutTemplate)(template, values, measure_1.skiaMeasure, { editingGridId: options.editingGridId });
    const pass = options.pass ?? null;
    const emitted = emitItems(layout, context, values, placeholders);
    let items = emitted.items;
    let paintsBackground = true;
    if (pass) {
        const index = emitted.items.findIndex((item) => item.id === pass.layerID);
        if (index < 0) {
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
function closers(emitted, index) {
    const open = emitted.clips[index] ?? [];
    return open
        .slice()
        .reverse()
        .map((id) => ({ ...emitted.openers.get(id), kind: 'clipEnd' }));
}
function openers(emitted, index) {
    const open = emitted.clips[index] ?? [];
    return open.map((id) => emitted.openers.get(id));
}
function maskItem(item) {
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
    const items = [];
    const clips = [];
    const openers = new Map();
    const transforms = new Map();
    const open = [];
    const root = layout.nodes[0]?.node;
    const canvasMode = root?.kind === 'stack' && root.layout === 'canvas';
    const push = (item) => {
        items.push(item);
        clips.push(open.map((entry) => entry.id));
    };
    for (const laid of layout.nodes) {
        while (open.length > 0 && laid.depth <= open[open.length - 1].depth) {
            const closed = open.pop();
            push({ ...openers.get(closed.id), kind: 'clipEnd' });
        }
        const parent = laid.parent ? (transforms.get(laid.parent) ?? IDENTITY) : IDENTITY;
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
                    cornerRadius: node.cornerRadius ?? 0,
                };
                openers.set(laid.id, opener);
                push(opener);
                open.push({ id: laid.id, depth: laid.depth });
            }
            continue;
        }
        push(nodeItem(node, base, context, values, placeholders, canvasMode));
    }
    while (open.length > 0) {
        const closed = open.pop();
        push({ ...openers.get(closed.id), kind: 'clipEnd' });
    }
    return { items, clips, openers };
}
function stackFill(node, base, context) {
    const stroke = node.stroke;
    return {
        ...base,
        kind: 'fill',
        color: node.fill !== undefined || node.fillAccent !== undefined
            ? resolveColor(node.fill ?? model_1.Palette.ink, node.fillAccent, context)
            : null,
        cornerRadius: node.cornerRadius ?? 0,
        stroke: stroke && stroke.width > 0
            ? {
                width: stroke.width,
                color: resolveColor(stroke.color, stroke.accent, context),
                dashLength: stroke.dashLength ?? 0,
                dashGap: stroke.dashGap ?? 0,
            }
            : null,
    };
}
function nodeItem(node, base, context, values, placeholders, canvasMode) {
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
            cornerRadius: node.cornerRadius ?? 0,
            border: node.border ?? 0,
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
            strokeWidth: node.strokeWidth ?? 0,
            dashLength: node.dashLength ?? 0,
            dashGap: node.dashGap ?? 0,
            cornerRadius: node.cornerRadius ?? 0,
        };
    }
    if ((0, model_1.isTextNode)(node)) {
        const resolved = values[node.id] ?? null;
        const chip = node.chip !== undefined
            ? resolveColor(node.chip, node.chipAccent, context)
            : node.chipAccent !== undefined
                ? resolveColor(model_1.Palette.ink, node.chipAccent, context)
                : null;
        return {
            ...base,
            kind: 'text',
            field: node.field,
            value: resolved ?? '',
            placeholder: placeholders && resolvedText(node, context) === null,
            content: node.field === '条码' ? 'barcode' : 'text',
            barcodeSeed: String(context.bits.record.id).toUpperCase(),
            label: node.label,
            inlineLabel: node.inlineLabel === true && node.label.length > 0,
            fontSize: node.fontSize,
            fontId: node.fontId,
            weight: node.weight,
            design: node.design,
            align: node.alignment,
            tracking: node.tracking,
            lineLimit: canvasMode || node.frame && node.autoHeight !== false ? 10000 : node.lineLimit,
            color: resolveColor(node.color, node.accent, context),
            chip,
        };
    }
    return { ...base, kind: 'fill', color: null, cornerRadius: 0, stroke: null };
}
const sizeCache = [];
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
function posterPixelSize(template, scene, pixelWidth) {
    const width = Math.round(pixelWidth ?? (0, model_1.exportPixelWidth)(template));
    return {
        width: Math.max(1, width),
        height: Math.max(1, Math.round((width * scene.height) / model_1.CANVAS_WIDTH)),
    };
}
function sceneImageSources(scene) {
    const out = [];
    const seen = new Set();
    const push = (source) => {
        if (!source || seen.has(source.key))
            return;
        seen.add(source.key);
        out.push(source);
    };
    push(scene.backgroundImage?.source);
    for (const item of scene.items) {
        if (item.kind === 'image')
            push(item.source);
    }
    return out;
}

},
"src/core/uuid.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUUID = isUUID;
exports.normalizeUUID = normalizeUUID;
exports.uuidFromBytes = uuidFromBytes;
exports.randomUUID = randomUUID;
exports.derivedUUID = derivedUUID;
const sha256_1 = require("src/core/sha256.ts");
const PATTERN = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i;
function isUUID(value) {
    return typeof value === 'string' && PATTERN.test(value);
}
function normalizeUUID(value) {
    return isUUID(value) ? value.toUpperCase() : undefined;
}
function uuidFromBytes(bytes) {
    let hex = '';
    for (let i = 0; i < 16; i += 1)
        hex += bytes[i].toString(16).padStart(2, '0').toUpperCase();
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}
const defaultRandom = () => Math.random();
function randomUUID(random = defaultRandom) {
    const bytes = new Uint8Array(16);
    for (let i = 0; i < 16; i += 1)
        bytes[i] = Math.floor(random() * 256) & 0xff;
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    return uuidFromBytes(bytes);
}
function derivedUUID(name) {
    const digest = (0, sha256_1.sha256Bytes)((0, sha256_1.utf8Encode)(name)).slice(0, 16);
    digest[6] = (digest[6] & 0x0f) | 0x50;
    digest[8] = (digest[8] & 0x3f) | 0x80;
    return uuidFromBytes(digest);
}

},
"src/core/customFields.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customFieldDefinitionId = customFieldDefinitionId;
exports.typeWithFieldIdentities = typeWithFieldIdentities;
exports.customFieldsForRecord = customFieldsForRecord;
exports.ensureCustomFieldDefinitions = ensureCustomFieldDefinitions;
exports.renamePresetFields = renamePresetFields;
const models_1 = require("src/core/models.ts");
const uuid_1 = require("src/core/uuid.ts");
function customFieldDefinitionId(typeId, name) {
    return (0, uuid_1.derivedUUID)(`livemark.custom-field:${typeId}:${name.trim()}`);
}
function typeWithFieldIdentities(type) {
    return { ...type, entryDefinitionIds: type.entries.map((name, index) => (0, uuid_1.normalizeUUID)(type.entryDefinitionIds?.[index]) ?? customFieldDefinitionId(type.id, name)) };
}
function customFieldsForRecord(record, types, definitions = []) {
    const type = types ? (0, models_1.catalogResolve)(types, record) : undefined;
    const owner = record.typeID ?? (0, models_1.builtInTypeID)(record.kind);
    const counts = new Map();
    record.extraFields.forEach((field) => counts.set(field.key.trim(), (counts.get(field.key.trim()) ?? 0) + 1));
    const result = record.extraFields.filter((field) => field.key.trim()).map((field) => {
        const index = type?.entries.indexOf(field.key.trim()) ?? -1;
        const id = (0, uuid_1.normalizeUUID)(field.definitionId) ?? (counts.get(field.key.trim()) > 1
            ? (0, uuid_1.derivedUUID)(`livemark.custom-field-instance:${field.id}`)
            : (index >= 0 ? (0, uuid_1.normalizeUUID)(type?.entryDefinitionIds?.[index]) : undefined) ?? customFieldDefinitionId(owner, field.key));
        const definition = definitions.find((item) => item.id === id);
        return { id, name: field.key.trim() || definition?.name || '', value: field.value,
            isPrivate: field.isPrivate === true || definition?.isPrivate === true };
    });
    type?.entries.forEach((name, index) => {
        const id = (0, uuid_1.normalizeUUID)(type.entryDefinitionIds?.[index]) ?? customFieldDefinitionId(type.id, name);
        if (!result.some((field) => field.id === id || field.name === name)) {
            const definition = definitions.find((item) => item.id === id);
            result.push({ id, name: definition?.name ?? name, value: '', isPrivate: definition?.isPrivate === true });
        }
    });
    return result;
}
function ensureCustomFieldDefinitions(archive) {
    const types = (0, models_1.makeRecordTypeCatalog)(archive.recordTypes, archive.hiddenRecordTypes);
    const definitions = new Map((archive.customFieldDefinitions ?? []).map((item) => [item.id, { ...item }]));
    const upsertType = (type) => {
        const identified = typeWithFieldIdentities(type);
        identified.entries.forEach((name, index) => {
            const id = identified.entryDefinitionIds[index];
            definitions.set(id, { ...definitions.get(id), id, ownerTypeId: type.id, name });
        });
        return identified;
    };
    types.types.forEach(upsertType);
    if (archive.recordTypes)
        archive.recordTypes = archive.recordTypes.map(upsertType);
    const bindRecord = (record) => {
        const fields = customFieldsForRecord(record, types, [...definitions.values()]);
        return { ...record, extraFields: record.extraFields.map((field) => {
                if (!field.key.trim())
                    return field;
                const resolved = fields.shift();
                const previous = definitions.get(resolved.id);
                definitions.set(resolved.id, { id: resolved.id, ownerTypeId: previous?.ownerTypeId ?? record.typeID ?? (0, models_1.builtInTypeID)(record.kind),
                    name: previous?.name ?? field.key.trim(), ...(previous?.isPrivate || field.isPrivate ? { isPrivate: true } : {}) });
                return { ...field, definitionId: resolved.id, ...(resolved.isPrivate ? { isPrivate: true } : {}) };
            }) };
    };
    archive.records = archive.records.map(bindRecord);
    archive.deletedRecords = archive.deletedRecords?.map((item) => ({ ...item, record: bindRecord(item.record) }));
    const applyPrivacy = (record) => ({ ...record, extraFields: record.extraFields.map((field) => field.definitionId && definitions.get(field.definitionId)?.isPrivate ? { ...field, isPrivate: true } : field) });
    archive.records = archive.records.map(applyPrivacy);
    archive.deletedRecords = archive.deletedRecords?.map((item) => ({ ...item, record: applyPrivacy(item.record) }));
    if (definitions.size)
        archive.customFieldDefinitions = [...definitions.values()];
}
function renamePresetFields(archive, previous, next) {
    const before = typeWithFieldIdentities(previous);
    const after = typeWithFieldIdentities(next);
    const changes = new Map();
    after.entries.forEach((name, index) => {
        const id = after.entryDefinitionIds[index];
        const oldIndex = before.entryDefinitionIds.indexOf(id);
        if (oldIndex >= 0 && before.entries[oldIndex] !== name)
            changes.set(id, { before: before.entries[oldIndex], after: name });
    });
    const rename = (record) => ({ ...record, extraFields: record.extraFields.map((field) => {
            const change = field.definitionId ? changes.get(field.definitionId) : undefined;
            return change && field.key === change.before ? { ...field, key: change.after } : field;
        }) });
    archive.records = archive.records.map(rename);
    archive.deletedRecords = archive.deletedRecords?.map((item) => ({ ...item, record: rename(item.record) }));
}

},
"src/core/models.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BUILT_IN_CATALOG = exports.RECORD_FIELDS = exports.RecordField = exports.ARCHIVE_VERSION = exports.LEGACY_SIGNATURE = exports.SHARE_STYLES = exports.ShareStyle = exports.APPEARANCES = exports.Appearance = exports.SWIFT_GALLERY_LAYOUTS = exports.GALLERY_LAYOUTS = exports.GalleryLayout = exports.TILE_FIELDS = exports.TileField = exports.ACCENT_THEMES = exports.AccentTheme = exports.SETLIST_PREVIEW_COUNT = exports.RECENT_VENUE_LIMIT = exports.EVENT_REMINDER_PURPOSES = exports.EventReminderPurpose = exports.COVER_ARTS = exports.CoverArt = exports.RECORD_STATUSES = exports.RecordStatus = exports.EVENT_KINDS = exports.EventKind = void 0;
exports.isEventKind = isEventKind;
exports.eventKindSymbol = eventKindSymbol;
exports.eventKindEnglish = eventKindEnglish;
exports.isRecordStatus = isRecordStatus;
exports.isCoverArt = isCoverArt;
exports.eventKindArtwork = eventKindArtwork;
exports.venueHasCoordinate = venueHasCoordinate;
exports.venueQuery = venueQuery;
exports.placeNameKey = placeNameKey;
exports.sanitizeRecentVenues = sanitizeRecentVenues;
exports.addingRecentVenue = addingRecentVenue;
exports.makeEventRecord = makeEventRecord;
exports.makeExtraField = makeExtraField;
exports.makeMemoryPhoto = makeMemoryPhoto;
exports.makeEventReminder = makeEventReminder;
exports.hasConfirmedDate = hasConfirmedDate;
exports.hasConfirmedTime = hasConfirmedTime;
exports.acceptsReminders = acceptsReminders;
exports.locationLine = locationLine;
exports.searchableText = searchableText;
exports.eventTimeZoneOffsetSeconds = eventTimeZoneOffsetSeconds;
exports.eventDateParts = eventDateParts;
exports.calendarDay = calendarDay;
exports.startsBy = startsBy;
exports.setlistTrackLine = setlistTrackLine;
exports.setlistTrackNumber = setlistTrackNumber;
exports.setlistPreview = setlistPreview;
exports.reconcileSetlist = reconcileSetlist;
exports.songs = songs;
exports.isValidLink = isValidLink;
exports.setlistLink = setlistLink;
exports.isAccentTheme = isAccentTheme;
exports.accentHex = accentHex;
exports.accentDeepHex = accentDeepHex;
exports.accentTintHex = accentTintHex;
exports.isTileField = isTileField;
exports.tileFieldSymbol = tileFieldSymbol;
exports.isSwiftGalleryLayout = isSwiftGalleryLayout;
exports.isGalleryLayout = isGalleryLayout;
exports.galleryLayoutSymbol = galleryLayoutSymbol;
exports.tileFieldsAvailable = tileFieldsAvailable;
exports.isAppearance = isAppearance;
exports.isShareStyle = isShareStyle;
exports.shareStyleSymbol = shareStyleSymbol;
exports.shareStyleTagline = shareStyleTagline;
exports.makeShareOptions = makeShareOptions;
exports.makeAppSettings = makeAppSettings;
exports.normalizeTileFields = normalizeTileFields;
exports.galleryOf = galleryOf;
exports.withGallery = withGallery;
exports.fieldsFor = fieldsFor;
exports.setFieldsFor = setFieldsFor;
exports.makeArchive = makeArchive;
exports.isRecordField = isRecordField;
exports.recordFieldTitle = recordFieldTitle;
exports.recordFieldSymbol = recordFieldSymbol;
exports.recordFieldIsMoney = recordFieldIsMoney;
exports.recordFieldIsPrivate = recordFieldIsPrivate;
exports.recordFieldIsOptionalMoney = recordFieldIsOptionalMoney;
exports.recordHasField = recordHasField;
exports.isFallbackType = isFallbackType;
exports.makeRecordType = makeRecordType;
exports.copyRecordType = copyRecordType;
exports.builtInTypeID = builtInTypeID;
exports.defaultFields = defaultFields;
exports.builtInRecordType = builtInRecordType;
exports.builtInRecordTypes = builtInRecordTypes;
exports.sanitizeRecordType = sanitizeRecordType;
exports.recordTypeShows = recordTypeShows;
exports.recordTypeEquals = recordTypeEquals;
exports.makeRecordTypeCatalog = makeRecordTypeCatalog;
exports.catalogPresets = catalogPresets;
exports.catalogIsHidden = catalogIsHidden;
exports.catalogFallbackKind = catalogFallbackKind;
exports.catalogType = catalogType;
exports.catalogResolve = catalogResolve;
exports.catalogBuiltIn = catalogBuiltIn;
const uuid_1 = require("src/core/uuid.ts");
exports.EventKind = {
    concert: '演唱会',
    film: '电影',
    theatre: '戏剧',
    musical: '音乐剧',
    live: 'Livehouse',
    festival: '音乐节',
    exhibition: '展览',
    other: '其他',
};
exports.EVENT_KINDS = [
    exports.EventKind.concert,
    exports.EventKind.film,
    exports.EventKind.theatre,
    exports.EventKind.musical,
    exports.EventKind.live,
    exports.EventKind.festival,
    exports.EventKind.exhibition,
    exports.EventKind.other,
];
function isEventKind(value) {
    return typeof value === 'string' && exports.EVENT_KINDS.includes(value);
}
const KIND_SYMBOLS = {
    演唱会: 'waveform',
    电影: 'film',
    戏剧: 'theatermasks',
    音乐剧: 'music.note',
    Livehouse: 'guitars',
    音乐节: 'sun.max',
    展览: 'photo.artframe',
    其他: 'sparkles',
};
const KIND_ENGLISH = {
    演唱会: 'CONCERT',
    电影: 'FILM',
    戏剧: 'THEATRE',
    音乐剧: 'MUSICAL',
    Livehouse: 'LIVE',
    音乐节: 'FESTIVAL',
    展览: 'EXHIBITION',
    其他: 'EVENT',
};
function eventKindSymbol(kind) {
    return KIND_SYMBOLS[kind];
}
function eventKindEnglish(kind) {
    return KIND_ENGLISH[kind];
}
exports.RecordStatus = {
    attended: '看过',
    upcoming: '待赴约',
    wishlist: '心愿单',
    cancelled: '已取消',
};
exports.RECORD_STATUSES = [
    exports.RecordStatus.attended,
    exports.RecordStatus.upcoming,
    exports.RecordStatus.wishlist,
    exports.RecordStatus.cancelled,
];
function isRecordStatus(value) {
    return typeof value === 'string' && exports.RECORD_STATUSES.includes(value);
}
exports.CoverArt = {
    orbit: 'orbit',
    bloom: 'bloom',
    curtain: 'curtain',
    wave: 'wave',
    sunset: 'sunset',
    geometry: 'geometry',
};
exports.COVER_ARTS = [
    exports.CoverArt.orbit,
    exports.CoverArt.bloom,
    exports.CoverArt.curtain,
    exports.CoverArt.wave,
    exports.CoverArt.sunset,
    exports.CoverArt.geometry,
];
function isCoverArt(value) {
    return typeof value === 'string' && exports.COVER_ARTS.includes(value);
}
function eventKindArtwork(kind) {
    switch (kind) {
        case exports.EventKind.film:
            return exports.CoverArt.orbit;
        case exports.EventKind.theatre:
        case exports.EventKind.musical:
            return exports.CoverArt.curtain;
        case exports.EventKind.exhibition:
            return exports.CoverArt.geometry;
        case exports.EventKind.festival:
            return exports.CoverArt.bloom;
        default:
            return exports.CoverArt.wave;
    }
}
exports.EventReminderPurpose = {
    start: '开演',
    ticketSale: '抢票',
    other: '其他',
};
exports.EVENT_REMINDER_PURPOSES = [
    exports.EventReminderPurpose.start,
    exports.EventReminderPurpose.ticketSale,
    exports.EventReminderPurpose.other,
];
function venueHasCoordinate(location) {
    return location.latitude !== undefined && location.longitude !== undefined;
}
function venueQuery(city, venue) {
    return [city, venue]
        .map((value) => value.trim())
        .filter((value) => value.length > 0)
        .join(' ');
}
function placeNameKey(name) {
    return name.trim().normalize('NFKC').toLowerCase();
}
exports.RECENT_VENUE_LIMIT = 20;
function sanitizeRecentVenues(list) {
    if (list === undefined)
        return undefined;
    const seen = new Set();
    const kept = [];
    for (const item of list) {
        const name = (item?.name ?? '').trim();
        const key = placeNameKey(name);
        if (key.length === 0 || seen.has(key))
            continue;
        seen.add(key);
        kept.push({ name });
        if (kept.length === exports.RECENT_VENUE_LIMIT)
            break;
    }
    return kept;
}
function addingRecentVenue(name, list) {
    const trimmed = name.trim();
    const key = placeNameKey(trimmed);
    if (key.length === 0)
        return list;
    const existing = sanitizeRecentVenues(list) ?? [];
    return [{ name: trimmed }, ...existing.filter((item) => placeNameKey(item.name) !== key)].slice(0, exports.RECENT_VENUE_LIMIT);
}
function makeEventRecord(overrides = {}, options = {}) {
    const newID = options.newID ?? uuid_1.randomUUID;
    const now = options.now ?? (() => new Date());
    const stamp = now();
    return {
        id: newID(),
        title: '',
        subtitle: '',
        kind: exports.EventKind.concert,
        status: exports.RecordStatus.attended,
        date: stamp,
        city: '',
        venue: '',
        seat: '',
        currency: 'CNY',
        performers: '',
        director: '',
        durationMinutes: 0,
        language: '',
        format: '',
        companions: '',
        rating: 0,
        mood: '',
        note: '',
        quote: '',
        setlist: '',
        reminders: [],
        tags: [],
        collection: '',
        sourceURL: '',
        sourceName: '',
        coverURL: '',
        artwork: exports.CoverArt.orbit,
        photos: [],
        extraFields: [],
        favorite: false,
        createdAt: stamp,
        updatedAt: stamp,
        ...overrides,
    };
}
function makeExtraField(overrides = {}, options = {}) {
    return { id: (options.newID ?? uuid_1.randomUUID)(), key: '', value: '', ...overrides };
}
function makeMemoryPhoto(overrides = {}, options = {}) {
    return {
        id: (options.newID ?? uuid_1.randomUUID)(),
        data: new Uint8Array(0),
        caption: '',
        ...overrides,
    };
}
function makeEventReminder(overrides, options = {}) {
    return {
        id: (options.newID ?? uuid_1.randomUUID)(),
        purpose: exports.EventReminderPurpose.start,
        enabled: true,
        ...overrides,
    };
}
function hasConfirmedDate(record) {
    return record.dateUnconfirmed !== true;
}
function hasConfirmedTime(record) {
    return hasConfirmedDate(record) && record.timeUnconfirmed !== true;
}
function acceptsReminders(record) {
    return record.status === exports.RecordStatus.upcoming || record.status === exports.RecordStatus.wishlist;
}
function locationLine(record) {
    return [record.city, record.venue].filter((value) => value.length > 0).join(' · ');
}
function searchableText(record) {
    return [
        record.title,
        record.subtitle,
        record.city,
        record.venue,
        record.performers,
        record.director,
        record.note,
        record.quote,
        record.collection,
        record.companions,
        record.kind,
        ...record.tags,
        ...record.extraFields.flatMap((field) => [field.key, field.value]),
    ].join(' ');
}
function eventTimeZoneOffsetSeconds(record, at = record.date) {
    if (record.sourceUTCOffset !== undefined && Number.isFinite(record.sourceUTCOffset)) {
        return record.sourceUTCOffset;
    }
    return -at.getTimezoneOffset() * 60;
}
function eventDateParts(record, value = record.date) {
    if (record.sourceUTCOffset === undefined || !Number.isFinite(record.sourceUTCOffset)) {
        return {
            year: value.getFullYear(),
            month: value.getMonth() + 1,
            day: value.getDate(),
            hour: value.getHours(),
            minute: value.getMinutes(),
            second: value.getSeconds(),
        };
    }
    const shifted = new Date(value.getTime() + record.sourceUTCOffset * 1000);
    return {
        year: shifted.getUTCFullYear(),
        month: shifted.getUTCMonth() + 1,
        day: shifted.getUTCDate(),
        hour: shifted.getUTCHours(),
        minute: shifted.getUTCMinutes(),
        second: shifted.getUTCSeconds(),
    };
}
function calendarDay(record) {
    const parts = eventDateParts(record);
    return new Date(parts.year, parts.month - 1, parts.day);
}
function startsBy(record) {
    if (hasConfirmedTime(record))
        return record.date;
    const parts = eventDateParts(record);
    const offset = eventTimeZoneOffsetSeconds(record);
    const midnightUTC = Date.UTC(parts.year, parts.month - 1, parts.day + 1);
    return new Date(midnightUTC - offset * 1000);
}
function setlistTrackLine(track) {
    return track.title
        .split(/\r\n|\r|\n/)
        .map((piece) => piece.trim())
        .filter((piece) => piece.length > 0)
        .join(' ');
}
function setlistTrackNumber(index) {
    return String(index).padStart(2, '0');
}
exports.SETLIST_PREVIEW_COUNT = 12;
function setlistPreview(songs, expanded) {
    return expanded || songs.length <= exports.SETLIST_PREVIEW_COUNT
        ? songs
        : songs.slice(0, exports.SETLIST_PREVIEW_COUNT);
}
function reconcileSetlist(text, saved) {
    const remaining = [...saved];
    const result = [];
    for (const raw of text.split(/\r\n|\r|\n/)) {
        const line = raw.trim();
        if (line.length === 0)
            continue;
        const index = remaining.findIndex((track) => setlistTrackLine(track) === line || track.legacyURL === line);
        if (index >= 0)
            result.push(remaining.splice(index, 1)[0]);
        else
            result.push({ title: line });
    }
    return result;
}
function songs(record) {
    return reconcileSetlist(record.setlist, record.setlistTracks ?? []);
}
function isValidLink(value) {
    const match = /^([a-zA-Z][a-zA-Z0-9+.-]*):\/\/([^/?#]*)/.exec(value.trim());
    if (!match)
        return false;
    const scheme = match[1].toLowerCase();
    if (scheme !== 'http' && scheme !== 'https')
        return false;
    const authority = match[2];
    if (authority.includes('@'))
        return false;
    return authority.length > 0;
}
function setlistLink(record) {
    const value = record.setlistSourceURL;
    if (value === undefined)
        return undefined;
    return isValidLink(value) ? value.trim() : undefined;
}
exports.AccentTheme = {
    lilac: '鸢尾紫',
    green: '苔藓绿',
    coral: '珊瑚橘',
    blue: '远山蓝',
};
exports.ACCENT_THEMES = [
    exports.AccentTheme.lilac,
    exports.AccentTheme.green,
    exports.AccentTheme.coral,
    exports.AccentTheme.blue,
];
function isAccentTheme(value) {
    return typeof value === 'string' && exports.ACCENT_THEMES.includes(value);
}
const ACCENT_HEX = {
    鸢尾紫: '#bba7ef',
    苔藓绿: '#d8eb97',
    珊瑚橘: '#f4ab8e',
    远山蓝: '#adcfe5',
};
const ACCENT_DEEP_HEX = {
    鸢尾紫: '#6e58a8',
    苔藓绿: '#5e7a32',
    珊瑚橘: '#c2603a',
    远山蓝: '#3e6e8e',
};
const ACCENT_TINT = {
    鸢尾紫: { light: '#6e58a8', dark: '#b3a0ea' },
    苔藓绿: { light: '#5b7631', dark: '#a8c47a' },
    珊瑚橘: { light: '#af5634', dark: '#ee9a7c' },
    远山蓝: { light: '#3e6e8e', dark: '#8fbad8' },
};
function accentHex(accent) {
    return ACCENT_HEX[accent];
}
function accentDeepHex(accent) {
    return ACCENT_DEEP_HEX[accent];
}
function accentTintHex(accent, scheme) {
    return ACCENT_TINT[accent][scheme];
}
exports.TileField = {
    kind: '类型',
    date: '时间',
    city: '城市',
    venue: '场馆',
    title: '标题',
    rating: '评分',
    attended: '已赴约',
    favorite: '喜欢',
    count: '场次',
};
exports.TILE_FIELDS = [
    exports.TileField.kind,
    exports.TileField.date,
    exports.TileField.city,
    exports.TileField.venue,
    exports.TileField.title,
    exports.TileField.rating,
    exports.TileField.attended,
    exports.TileField.favorite,
    exports.TileField.count,
];
function isTileField(value) {
    return typeof value === 'string' && exports.TILE_FIELDS.includes(value);
}
const TILE_FIELD_SYMBOLS = {
    类型: 'square.grid.2x2',
    时间: 'calendar',
    城市: 'mappin',
    场馆: 'building.2',
    标题: 'text.alignleft',
    评分: 'star',
    已赴约: 'checkmark.seal',
    喜欢: 'heart',
    场次: 'number',
};
function tileFieldSymbol(field) {
    return TILE_FIELD_SYMBOLS[field];
}
exports.GalleryLayout = {
    grid: '海报墙',
    tickets: '票根剧场',
    showcase: '展柜',
    list: '极简列表',
    calendar: '日历',
    artists: '艺人',
};
exports.GALLERY_LAYOUTS = [
    exports.GalleryLayout.grid,
    exports.GalleryLayout.tickets,
    exports.GalleryLayout.showcase,
    exports.GalleryLayout.list,
    exports.GalleryLayout.calendar,
    exports.GalleryLayout.artists,
];
exports.SWIFT_GALLERY_LAYOUTS = [
    exports.GalleryLayout.grid,
    exports.GalleryLayout.tickets,
    exports.GalleryLayout.showcase,
    exports.GalleryLayout.list,
];
function isSwiftGalleryLayout(value) {
    return typeof value === 'string' && exports.SWIFT_GALLERY_LAYOUTS.includes(value);
}
function isGalleryLayout(value) {
    return typeof value === 'string' && exports.GALLERY_LAYOUTS.includes(value);
}
const GALLERY_SYMBOLS = {
    海报墙: 'square.grid.2x2',
    票根剧场: 'ticket',
    展柜: 'rectangle.portrait.on.rectangle.portrait.angled',
    极简列表: 'list.bullet',
    日历: 'calendar',
    艺人: 'person.2',
};
function galleryLayoutSymbol(layout) {
    return GALLERY_SYMBOLS[layout];
}
function tileFieldsAvailable(layout) {
    switch (layout) {
        case exports.GalleryLayout.grid:
            return [
                exports.TileField.kind,
                exports.TileField.date,
                exports.TileField.city,
                exports.TileField.title,
                exports.TileField.rating,
                exports.TileField.attended,
                exports.TileField.favorite,
            ];
        case exports.GalleryLayout.artists:
            return [exports.TileField.count];
        case exports.GalleryLayout.calendar:
            return [];
        default:
            return [
                exports.TileField.kind,
                exports.TileField.date,
                exports.TileField.city,
                exports.TileField.venue,
                exports.TileField.title,
                exports.TileField.rating,
                exports.TileField.attended,
                exports.TileField.favorite,
            ];
    }
}
exports.Appearance = {
    light: '纸白',
    dark: '夜幕',
    system: '跟随系统',
};
exports.APPEARANCES = [
    exports.Appearance.light,
    exports.Appearance.dark,
    exports.Appearance.system,
];
function isAppearance(value) {
    return typeof value === 'string' && exports.APPEARANCES.includes(value);
}
exports.ShareStyle = {
    ticket: '经典票根',
    magazine: '杂志封面',
    cinema: '电影字幕',
    poster: '艺术海报',
    boarding: '登机牌',
    journal: '手帐拼贴',
    vinyl: '黑胶唱片',
    receipt: '回忆小票',
    minimal: '极简留白',
};
exports.SHARE_STYLES = [
    exports.ShareStyle.ticket,
    exports.ShareStyle.magazine,
    exports.ShareStyle.cinema,
    exports.ShareStyle.poster,
    exports.ShareStyle.boarding,
    exports.ShareStyle.journal,
    exports.ShareStyle.vinyl,
    exports.ShareStyle.receipt,
    exports.ShareStyle.minimal,
];
function isShareStyle(value) {
    return typeof value === 'string' && exports.SHARE_STYLES.includes(value);
}
const SHARE_STYLE_SYMBOLS = {
    经典票根: 'ticket',
    杂志封面: 'book.closed',
    电影字幕: 'film',
    艺术海报: 'photo.artframe',
    登机牌: 'airplane.departure',
    手帐拼贴: 'book.pages',
    黑胶唱片: 'opticaldisc',
    回忆小票: 'receipt',
    极简留白: 'square',
};
const SHARE_STYLE_TAGLINES = {
    经典票根: 'ADMIT ONE',
    杂志封面: 'COVER STORY',
    电影字幕: 'NOW SHOWING',
    艺术海报: 'CULTURE CLUB',
    登机牌: 'BOARDING PASS',
    手帐拼贴: 'DEAR DIARY',
    黑胶唱片: 'SIDE A',
    回忆小票: 'PAID IN FULL',
    极简留白: 'THE EDIT',
};
function shareStyleSymbol(style) {
    return SHARE_STYLE_SYMBOLS[style];
}
function shareStyleTagline(style) {
    return SHARE_STYLE_TAGLINES[style];
}
function makeShareOptions(overrides = {}) {
    return {
        style: exports.ShareStyle.ticket,
        accent: exports.AccentTheme.lilac,
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
        showCustomPrivate: false,
        headline: '',
        ...overrides,
    };
}
exports.LEGACY_SIGNATURE = '为值得的瞬间，留一点余响。';
function makeAppSettings(overrides = {}) {
    return {
        name: '收藏家',
        signature: '',
        accent: exports.AccentTheme.lilac,
        layout: exports.GalleryLayout.grid,
        artistWall: false,
        homeCalendar: false,
        appearance: exports.Appearance.system,
        soundEnabled: true,
        hapticsEnabled: true,
        motionEnabled: true,
        showRatings: true,
        listTimeline: true,
        showPinBadge: true,
        gridColumns: 2,
        tileFields: [...exports.TILE_FIELDS],
        ticketFields: [...exports.TILE_FIELDS],
        showcaseFields: [...exports.TILE_FIELDS],
        listFields: [...exports.TILE_FIELDS],
        artistFields: [...exports.TILE_FIELDS],
        osmGeocoding: true,
        defaultKind: exports.EventKind.concert,
        favoriteShareStyle: exports.ShareStyle.ticket,
        remindersEnabled: false,
        reminderHour: 9,
        ...overrides,
    };
}
function normalizeTileFields(values) {
    const set = new Set(values);
    return exports.TILE_FIELDS.filter((field) => set.has(field));
}
function galleryOf(settings) {
    if (settings.homeCalendar)
        return exports.GalleryLayout.calendar;
    return settings.artistWall ? exports.GalleryLayout.artists : settings.layout;
}
function withGallery(settings, value) {
    const next = {
        ...settings,
        artistWall: value === exports.GalleryLayout.artists,
        homeCalendar: value === exports.GalleryLayout.calendar,
    };
    if (isSwiftGalleryLayout(value))
        next.layout = value;
    return next;
}
function fieldsFor(settings, layout) {
    const stored = (() => {
        switch (layout) {
            case exports.GalleryLayout.grid:
                return settings.tileFields;
            case exports.GalleryLayout.tickets:
                return settings.ticketFields;
            case exports.GalleryLayout.showcase:
                return settings.showcaseFields;
            case exports.GalleryLayout.list:
            case exports.GalleryLayout.calendar:
                return settings.listFields;
            case exports.GalleryLayout.artists:
                return settings.artistFields;
        }
    })();
    const available = new Set(tileFieldsAvailable(layout));
    return normalizeTileFields(stored).filter((field) => available.has(field));
}
function setFieldsFor(settings, value, layout) {
    const fields = normalizeTileFields(value);
    switch (layout) {
        case exports.GalleryLayout.grid:
            return { ...settings, tileFields: fields };
        case exports.GalleryLayout.tickets:
            return { ...settings, ticketFields: fields };
        case exports.GalleryLayout.showcase:
            return { ...settings, showcaseFields: fields };
        case exports.GalleryLayout.list:
        case exports.GalleryLayout.calendar:
            return { ...settings, listFields: fields };
        case exports.GalleryLayout.artists:
            return { ...settings, artistFields: fields };
    }
}
exports.ARCHIVE_VERSION = 2;
function makeArchive(overrides = {}) {
    return {
        version: exports.ARCHIVE_VERSION,
        records: [],
        settings: makeAppSettings(),
        hasOnboarded: false,
        isDemo: false,
        ...overrides,
    };
}
exports.RecordField = {
    performers: 'performers',
    director: 'director',
    duration: 'duration',
    language: 'language',
    format: 'format',
    endDate: 'endDate',
    seat: 'seat',
    price: 'price',
    facePrice: 'facePrice',
    extraCost: 'extraCost',
    companions: 'companions',
    mood: 'mood',
    quote: 'quote',
    setlist: 'setlist',
    collection: 'collection',
};
exports.RECORD_FIELDS = [
    exports.RecordField.performers,
    exports.RecordField.director,
    exports.RecordField.duration,
    exports.RecordField.language,
    exports.RecordField.format,
    exports.RecordField.endDate,
    exports.RecordField.seat,
    exports.RecordField.price,
    exports.RecordField.facePrice,
    exports.RecordField.extraCost,
    exports.RecordField.companions,
    exports.RecordField.mood,
    exports.RecordField.quote,
    exports.RecordField.setlist,
    exports.RecordField.collection,
];
function isRecordField(value) {
    return typeof value === 'string' && exports.RECORD_FIELDS.includes(value);
}
const RECORD_FIELD_TITLES = {
    performers: '演出者',
    director: '导演',
    duration: '时长',
    language: '语言',
    format: '版本',
    endDate: '结束时间',
    seat: '座位',
    price: '实付',
    facePrice: '票面价',
    extraCost: '其他花费',
    companions: '同行人',
    mood: '心情',
    quote: '金句',
    setlist: '曲目',
    collection: '专辑',
};
const RECORD_FIELD_SYMBOLS = {
    performers: 'person.2',
    director: 'megaphone',
    duration: 'clock',
    language: 'globe',
    format: 'sparkles.tv',
    endDate: 'calendar.badge.plus',
    seat: 'chair',
    price: 'yensign',
    facePrice: 'ticket',
    extraCost: 'tram',
    companions: 'figure.2',
    mood: 'face.smiling',
    quote: 'quote.opening',
    setlist: 'music.note.list',
    collection: 'square.stack',
};
function recordFieldTitle(field) {
    return RECORD_FIELD_TITLES[field];
}
function recordFieldSymbol(field) {
    return RECORD_FIELD_SYMBOLS[field];
}
function recordFieldIsMoney(field) {
    return (field === exports.RecordField.price ||
        field === exports.RecordField.facePrice ||
        field === exports.RecordField.extraCost);
}
function recordFieldIsPrivate(field) {
    return field === exports.RecordField.seat || recordFieldIsMoney(field) || field === exports.RecordField.companions;
}
function recordFieldIsOptionalMoney(field) {
    return field === exports.RecordField.facePrice || field === exports.RecordField.extraCost;
}
function recordHasField(record, field) {
    switch (field) {
        case exports.RecordField.performers:
            return record.performers.length > 0;
        case exports.RecordField.director:
            return record.director.length > 0;
        case exports.RecordField.duration:
            return record.durationMinutes > 0;
        case exports.RecordField.language:
            return record.language.length > 0;
        case exports.RecordField.format:
            return record.format.length > 0;
        case exports.RecordField.endDate:
            return record.endDate !== undefined;
        case exports.RecordField.seat:
            return record.seat.length > 0;
        case exports.RecordField.price:
            return record.price !== undefined;
        case exports.RecordField.facePrice:
            return record.facePrice !== undefined;
        case exports.RecordField.extraCost:
            return record.extraCost !== undefined || (record.extraCostNote ?? '').length > 0;
        case exports.RecordField.companions:
            return record.companions.length > 0;
        case exports.RecordField.mood:
            return record.mood.length > 0;
        case exports.RecordField.quote:
            return record.quote.length > 0;
        case exports.RecordField.setlist:
            return record.setlist.length > 0;
        case exports.RecordField.collection:
            return record.collection.length > 0;
    }
}
function isFallbackType(type) {
    return type.isBuiltIn && type.base === exports.EventKind.other;
}
function makeRecordType(values, options = {}) {
    return {
        id: (options.newID ?? uuid_1.randomUUID)(),
        isBuiltIn: false,
        artwork: exports.CoverArt.wave,
        fields: [],
        entries: [],
        ...values,
    };
}
function copyRecordType(type, options = {}) {
    return {
        id: (options.newID ?? uuid_1.randomUUID)(),
        base: type.base,
        isBuiltIn: false,
        name: type.name,
        english: type.english,
        symbol: type.symbol,
        artwork: type.artwork,
        fields: [...type.fields],
        entries: [...type.entries],
    };
}
function builtInTypeID(kind) {
    return (0, uuid_1.derivedUUID)('encore.recordtype.' + kind);
}
function defaultFields(kind) {
    const money = [exports.RecordField.seat, exports.RecordField.price, exports.RecordField.companions];
    const feeling = [exports.RecordField.mood, exports.RecordField.quote, exports.RecordField.collection];
    switch (kind) {
        case exports.EventKind.concert:
            return [exports.RecordField.performers, exports.RecordField.endDate, exports.RecordField.setlist, ...money, ...feeling];
        case exports.EventKind.live:
            return [exports.RecordField.performers, exports.RecordField.setlist, ...money, ...feeling];
        case exports.EventKind.festival:
            return [exports.RecordField.performers, exports.RecordField.endDate, exports.RecordField.setlist, ...money, ...feeling];
        case exports.EventKind.film:
            return [
                exports.RecordField.director,
                exports.RecordField.performers,
                exports.RecordField.duration,
                exports.RecordField.language,
                exports.RecordField.format,
                ...money,
                ...feeling,
            ];
        case exports.EventKind.theatre:
            return [
                exports.RecordField.performers,
                exports.RecordField.director,
                exports.RecordField.duration,
                exports.RecordField.language,
                ...money,
                ...feeling,
            ];
        case exports.EventKind.musical:
            return [
                exports.RecordField.performers,
                exports.RecordField.director,
                exports.RecordField.duration,
                exports.RecordField.language,
                exports.RecordField.setlist,
                ...money,
                ...feeling,
            ];
        case exports.EventKind.exhibition:
            return [
                exports.RecordField.duration,
                exports.RecordField.language,
                exports.RecordField.endDate,
                ...money,
                ...feeling,
            ];
        case exports.EventKind.other:
            return exports.RECORD_FIELDS.filter((field) => !recordFieldIsOptionalMoney(field));
    }
}
function builtInRecordType(kind) {
    return {
        id: builtInTypeID(kind),
        base: kind,
        isBuiltIn: true,
        name: kind,
        english: eventKindEnglish(kind),
        symbol: eventKindSymbol(kind),
        artwork: eventKindArtwork(kind),
        fields: defaultFields(kind),
        entries: [],
    };
}
function builtInRecordTypes() {
    return exports.EVENT_KINDS.map(builtInRecordType);
}
function truncate(value, limit) {
    return Array.from(value).slice(0, limit).join('');
}
function sanitizeRecordType(type) {
    const name = truncate(type.name.trim(), 12) || type.base;
    const english = truncate(type.english.trim(), 16).toUpperCase() || eventKindEnglish(type.base);
    const symbol = type.symbol.trim().length === 0 ? eventKindSymbol(type.base) : type.symbol;
    const has = new Set(type.fields);
    const fields = exports.RECORD_FIELDS.filter((field) => has.has(field));
    const seen = new Set();
    const entries = [];
    const entryDefinitionIds = [];
    for (const [index, entry] of type.entries.entries()) {
        const value = truncate(entry.trim(), 20);
        if (value.length === 0 || seen.has(value))
            continue;
        seen.add(value);
        entries.push(value);
        if (type.entryDefinitionIds)
            entryDefinitionIds.push((0, uuid_1.normalizeUUID)(type.entryDefinitionIds[index]) ?? (0, uuid_1.derivedUUID)(`livemark.custom-field:${type.id}:${value}`));
        if (entries.length === 8)
            break;
    }
    return { ...type, name, english, symbol, fields, entries, ...(type.entryDefinitionIds ? { entryDefinitionIds } : {}) };
}
function recordTypeShows(type, field) {
    return type.fields.includes(field);
}
function recordTypeEquals(a, b) {
    return (a.id === b.id &&
        a.base === b.base &&
        a.isBuiltIn === b.isBuiltIn &&
        a.name === b.name &&
        a.english === b.english &&
        a.symbol === b.symbol &&
        a.artwork === b.artwork &&
        a.fields.length === b.fields.length &&
        a.fields.every((field, index) => field === b.fields[index]) &&
        a.entries.length === b.entries.length &&
        a.entries.every((entry, index) => entry === b.entries[index]));
}
function makeRecordTypeCatalog(stored, hidden = undefined) {
    const hiddenSet = new Set(hidden ?? []);
    const kept = (stored ?? []).filter((type) => !(type.isBuiltIn && hiddenSet.has(type.id)));
    const customised = new Set(kept.filter((type) => type.isBuiltIn).map((type) => type.id));
    const missing = builtInRecordTypes().filter((type) => !customised.has(type.id) && !hiddenSet.has(type.id));
    return { types: [...kept, ...missing] };
}
exports.BUILT_IN_CATALOG = { types: builtInRecordTypes() };
function catalogPresets(catalog) {
    return exports.EVENT_KINDS.map((kind) => catalogBuiltIn(catalog, kind));
}
function catalogIsHidden(catalog, kind) {
    return !catalog.types.some((type) => type.isBuiltIn && type.base === kind);
}
function catalogFallbackKind(catalog, kind) {
    return catalogIsHidden(catalog, kind) ? exports.EventKind.other : kind;
}
function catalogType(catalog, id) {
    if (id === undefined)
        return undefined;
    return catalog.types.find((type) => type.id === id);
}
function catalogResolve(catalog, record) {
    return (catalogType(catalog, record.typeID) ??
        catalog.types.find((type) => type.isBuiltIn && type.base === record.kind) ??
        builtInRecordType(record.kind));
}
function catalogBuiltIn(catalog, kind) {
    return (catalog.types.find((type) => type.isBuiltIn && type.base === kind) ?? builtInRecordType(kind));
}

},
"src/core/labels.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MOOD_OPTIONS = void 0;
exports.moodDisplay = moodDisplay;
exports.MOOD_OPTIONS = [
    '心动',
    '沉醉',
    '震撼',
    '回味',
    '治愈',
    '快乐',
    '流泪',
    '平静',
    '失望',
    '期待',
];
function moodDisplay(mood) {
    return exports.MOOD_OPTIONS.includes(mood) ? mood : mood;
}

},
"src/core/template/layout.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.layoutTemplate = layoutTemplate;
const canvasLayout_1 = require("src/core/template/canvasLayout.ts");
const model_1 = require("src/core/template/model.ts");
function finite(value, fallback = 0) {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
function isCollapsed(node, context) {
    const cached = context.collapsed.get(node.id);
    if (cached !== undefined)
        return cached;
    const value = computeCollapsed(node, context);
    context.collapsed.set(node.id, value);
    return value;
}
function computeCollapsed(node, context) {
    if (node.visible === false)
        return true;
    if (node.kind === 'text') {
        const value = context.values[node.id] ?? null;
        return value === null && node.hideWhenEmpty !== false;
    }
    if (node.kind === 'stack') {
        if (node.collapseWhenEmpty === false)
            return false;
        const hasContent = node.children.some((child) => (child.position ?? 'flow') !== 'absolute' &&
            child.kind !== 'spacer' &&
            !isCollapsed(child, context));
        return !hasContent;
    }
    return false;
}
function widthRule(node) {
    return node.width ?? 'fill';
}
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
    if (node.kind !== 'image')
        return 1;
    if (node.aspect === 'natural')
        return finite(node.imageAspect ?? 1, 1);
    return finite(node.aspect, 1);
}
function measureText(node, maxWidth, context) {
    const key = node.id + '|' + (Number.isFinite(maxWidth) ? String(maxWidth) : 'inf');
    const hit = context.cache.get(key);
    if (hit)
        return hit;
    const value = context.values[node.id] ?? null;
    const measured = context.measure({
        text: value ?? '',
        label: node.label,
        inlineLabel: !!node.inlineLabel,
        fontSize: node.fontSize,
        fontId: node.fontId,
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
        width: Math.max(0, finite(measured?.width ?? 0)),
        height: Math.max(0, finite(measured?.height ?? 0)),
    };
    context.cache.set(key, safe);
    return safe;
}
function hugWidth(node, avail, context) {
    switch (node.kind) {
        case 'text':
            return Math.min(measureText(node, Infinity, context).width, avail);
        case 'image': {
            const rule = heightRule(node);
            return typeof rule === 'number' ? rule / Math.max(0.01, imageAspect(node)) : avail;
        }
        case 'stack': {
            const pad = node.padding ?? model_1.ZERO_PADDING;
            const inner = Math.max(0, avail - pad.left - pad.right);
            const gap = node.gap ?? 0;
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
function intrinsicWidth(node, avail, context) {
    const rule = widthRule(node);
    if (typeof rule === 'number')
        return clampWidth(node, rule);
    const fraction = fractionOf(rule);
    if (fraction !== null)
        return clampWidth(node, avail * fraction);
    return clampWidth(node, hugWidth(node, avail, context));
}
function resolveWidth(node, avail, context) {
    const rule = widthRule(node);
    if (rule === 'fill')
        return clampWidth(node, avail);
    return intrinsicWidth(node, avail, context);
}
function naturalHeight(node, width, context) {
    switch (node.kind) {
        case 'text':
            return measureText(node, width, context).height;
        case 'image':
            return width * imageAspect(node);
        case 'shape':
            return (0, model_1.defaultShapeHeight)(node.shape);
        default:
            return 0;
    }
}
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
function alignFor(child, stack) {
    return child.alignSelf ?? stack.align ?? 'stretch';
}
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
    return stack.children.filter((child) => !isCollapsed(child, context) && (child.position ?? 'flow') !== 'absolute');
}
function absoluteChildren(stack, context) {
    return stack.children.filter((child) => !isCollapsed(child, context) && child.position === 'absolute');
}
function layoutNode(node, width, height, context) {
    if ((0, model_1.isStackNode)(node))
        return layoutStack(node, width, height, context);
    const own = height === null ? naturalHeight(node, width, context) : height;
    return { node, width, height: clampHeight(node, own), x: 0, y: 0, children: [] };
}
function layoutStack(stack, width, height, context) {
    const pad = stack.padding ?? model_1.ZERO_PADDING;
    const gap = stack.gap ?? 0;
    const contentWidth = Math.max(0, width - pad.left - pad.right);
    const contentHeight = height === null ? null : Math.max(0, height - pad.top - pad.bottom);
    const flow = flowChildren(stack, context);
    const boxes = stack.direction === 'row'
        ? layoutRow(stack, flow, contentWidth, contentHeight, gap, context)
        : layoutColumn(stack, flow, contentWidth, contentHeight, gap, context);
    const used = stack.direction === 'row'
        ? boxes.reduce((most, box) => Math.max(most, box.height), 0)
        : boxes.reduce((sum, box) => sum + box.height, 0) + gap * Math.max(0, boxes.length - 1);
    const innerHeight = contentHeight === null ? used : contentHeight;
    const outerHeight = clampHeight(stack, innerHeight + pad.top + pad.bottom);
    const finalInner = Math.max(0, outerHeight - pad.top - pad.bottom);
    place(stack, boxes, pad, gap, contentWidth, finalInner);
    const absolutes = absoluteChildren(stack, context).map((child) => layoutAbsolute(child, pad, contentWidth, finalInner, context));
    const ordered = [];
    let flowIndex = 0;
    let absoluteIndex = 0;
    for (const child of stack.children) {
        if (isCollapsed(child, context))
            continue;
        ordered.push((child.position ?? 'flow') === 'absolute' ? absolutes[absoluteIndex++] : boxes[flowIndex++]);
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
    const justify = stack.justify ?? 'start';
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
    const width = resolveWidth(node, contentWidth, context);
    const rule = heightRule(node);
    const assigned = rule === 'fill' ? contentHeight : assignedHeight(node, contentHeight);
    const box = layoutNode(node, width, assigned === null ? null : clampHeight(node, assigned), context);
    const [ax, ay] = anchorFactors(node.anchor ?? 'center');
    box.x = pad.left + contentWidth * ax - box.width * ax + finite(node.offsetX ?? 0);
    box.y = pad.top + contentHeight * ay - box.height * ay + finite(node.offsetY ?? 0);
    return box;
}
function layoutTemplate(template, values, measure, options = {}) {
    if (template.root.layout === 'canvas')
        return (0, canvasLayout_1.layoutCanvas)(template, values, measure, options);
    const context = {
        values: values ?? {},
        measure,
        cache: new Map(),
        collapsed: new Map(),
    };
    const canvas = template.canvas;
    const pad = canvas.padding ?? model_1.ZERO_PADDING;
    const width = model_1.CANVAS_WIDTH;
    const fixedHeight = typeof canvas.height === 'object'
        ? (0, model_1.roundHalfAwayFromZero)(width * finite(canvas.height.aspect, 1.4))
        : null;
    const rootWidth = Math.max(0, width - pad.left - pad.right);
    const rootHeight = fixedHeight === null ? null : Math.max(0, fixedHeight - pad.top - pad.bottom);
    const rootBox = layoutStack(template.root, rootWidth, rootHeight, context);
    rootBox.x = pad.left;
    rootBox.y = pad.top;
    const height = fixedHeight === null ? rootBox.height + pad.top + pad.bottom : fixedHeight;
    const nodes = [];
    const byID = {};
    const emit = (box, parent, depth, originX, originY, opacity) => {
        const x = originX + box.x;
        const y = originY + box.y;
        const own = opacity * finite(box.node.opacity ?? 1, 1);
        const laid = {
            id: box.node.id,
            kind: box.node.kind,
            node: box.node,
            frame: { x, y, width: box.width, height: box.height },
            rotation: finite(box.node.rotation ?? 0),
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

},
"src/core/template/canvasLayout.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.layoutCanvas = layoutCanvas;
const model_1 = require("src/core/template/model.ts");
const canvas_1 = require("src/core/template/canvas.ts");
const grid_1 = require("src/core/template/grid.ts");
const MAX_CONTENT_HEIGHT = 20000;
function layoutCanvas(template, values, measure, options = {}) {
    const source = template.root.children;
    const grids = {};
    const scopes = new Map();
    for (const node of source) {
        const key = node.regionId ?? '';
        scopes.set(key, [...(scopes.get(key) ?? []), node]);
    }
    const measureNode = (node, width) => {
        if (node.kind !== 'text')
            return { width, height: (0, canvas_1.elementFrame)(node).height };
        return measure({ text: values[node.id] ?? '', label: node.label, inlineLabel: !!node.inlineLabel,
            fontSize: node.fontSize, fontId: node.fontId, weight: node.weight, design: node.design,
            alignment: node.alignment, tracking: node.tracking, lineLimit: 10000,
            chip: !!node.chip || !!node.chipAccent, barcode: node.field === '条码', maxWidth: width });
    };
    const solveGrid = (owner) => {
        const grid = owner.grid, members = scopes.get(owner.id) ?? [], pad = owner.padding ?? model_1.ZERO_PADDING;
        const initial = (0, canvas_1.elementFrame)(owner), editing = options.editingGridId === owner.id;
        const available = Math.max(1, initial.width - pad.left - pad.right - (grid.columns - 1) * grid.columnGap);
        const weights = Array.from({ length: grid.columns }, (_, i) => Math.max(.05, grid.columnWeights?.[i] ?? 1));
        const sum = weights.reduce((a, b) => a + b, 0), columnWidths = weights.map(weight => available * weight / sum);
        const columnOffsets = [];
        let x = pad.left;
        columnWidths.forEach(width => { columnOffsets.push(x); x += width + grid.columnGap; });
        const rowHeights = Array.from({ length: grid.rows }, (_, i) => grid.rowHeights?.[i] ?? 0);
        const active = Array.from({ length: grid.rows }, () => editing || grid.collapseEmptyRows === false);
        const entries = members.map(node => {
            const frame = (0, canvas_1.elementFrame)(node), cell = node.cell ? (0, grid_1.gridCellAt)(grid, node.cell.row, node.cell.column) : undefined;
            const collapsed = node.visible === false || (node.kind === 'text' && (values[node.id] ?? null) === null && node.hideWhenEmpty !== false);
            if (!cell || cell.row < 0 || cell.column < 0 || cell.row + cell.rowSpan > grid.rows || cell.column + cell.colSpan > grid.columns)
                return { node, frame, collapsed, overflow: false, cell: undefined, natural: frame.height };
            const last = cell.column + cell.colSpan - 1;
            const width = columnOffsets[last] + columnWidths[last] - columnOffsets[cell.column];
            const natural = node.kind === 'text' ? measureNode(node, width).height : node.kind === 'image' ? width * (node.imageAspect ?? frame.height / Math.max(1, frame.width)) : frame.height;
            if (!collapsed && !node.decoration) {
                for (let row = cell.row; row < cell.row + cell.rowSpan; row++)
                    active[row] = true;
                if (cell.rowSpan === 1 && grid.rowHeights?.[cell.row] == null)
                    rowHeights[cell.row] = Math.max(rowHeights[cell.row], natural);
            }
            return { node, frame: { x: columnOffsets[cell.column], y: 0, width, height: natural }, collapsed, overflow: false, cell, natural };
        });
        for (let row = 0; row < grid.rows; row++) {
            if (!active[row])
                rowHeights[row] = 0;
            else if ((editing || grid.collapseEmptyRows === false) && grid.rowHeights?.[row] == null)
                rowHeights[row] = Math.max(40, rowHeights[row]);
        }
        for (const entry of entries.filter(e => e.cell && !e.collapsed && !e.node.decoration).sort((a, b) => a.cell.rowSpan - b.cell.rowSpan)) {
            const cell = entry.cell;
            if (cell.rowSpan === 1)
                continue;
            const rows = Array.from({ length: cell.rowSpan }, (_, i) => cell.row + i);
            const height = rows.reduce((total, row) => total + rowHeights[row], 0) + grid.rowGap * Math.max(0, rows.filter(row => active[row]).length - 1);
            const flexible = rows.filter(row => grid.rowHeights?.[row] == null);
            if (height < entry.natural && flexible.length)
                for (const row of flexible)
                    rowHeights[row] += (entry.natural - height) / flexible.length;
        }
        const rowOffsets = [];
        let y = pad.top, hasRow = false;
        for (let row = 0; row < grid.rows; row++) {
            if (active[row] && rowHeights[row] > 0) {
                if (hasRow)
                    y += grid.rowGap;
                rowOffsets.push(y);
                y += rowHeights[row];
                hasRow = true;
            }
            else
                rowOffsets.push(y);
        }
        grids[owner.id] = { columnOffsets, columnWidths, rowOffsets, rowHeights };
        const children = entries.map(entry => {
            const cell = entry.cell;
            if (!cell)
                return entry;
            const last = cell.row + cell.rowSpan - 1, cellHeight = rowOffsets[last] + rowHeights[last] - rowOffsets[cell.row];
            let height = entry.node.kind === 'text' && entry.node.autoHeight !== false ? entry.natural : cellHeight;
            if (entry.node.kind !== 'text' && entry.node.alignSelf && entry.node.alignSelf !== 'stretch')
                height = Math.min(cellHeight, entry.natural);
            const offset = entry.node.alignSelf === 'center' ? (cellHeight - height) / 2 : entry.node.alignSelf === 'end' ? cellHeight - height : 0;
            return { node: entry.node, frame: { ...entry.frame, y: rowOffsets[cell.row] + offset, height: entry.collapsed ? 0 : height }, collapsed: entry.collapsed,
                overflow: !entry.collapsed && ((entry.node.kind === 'text' && entry.natural > cellHeight + .5) || height > MAX_CONTENT_HEIGHT) };
        });
        return { children, height: Math.max(initial.height, Math.min(MAX_CONTENT_HEIGHT, y + pad.bottom)), empty: !entries.some(e => !e.collapsed && !e.node.decoration && e.node.kind !== 'spacer') };
    };
    const solveScope = (scopeID) => {
        const nodes = scopes.get(scopeID) ?? [];
        const byID = new Map(nodes.map(n => [n.id, n]));
        const computed = new Map();
        const pending = new Set();
        const solve = (node) => {
            const cached = computed.get(node.id);
            if (cached)
                return cached;
            const initial = (0, canvas_1.elementFrame)(node);
            if (pending.has(node.id))
                return { node, frame: { ...initial, height: 0 }, collapsed: true, overflow: true };
            pending.add(node.id);
            let collapsed = node.visible === false || (node.kind === 'text' && (values[node.id] ?? null) === null && node.hideWhenEmpty !== false);
            let height = initial.height;
            let overflow = false;
            let children;
            if (node.kind === 'text' && !collapsed) {
                const natural = measureNode(node, Math.max(1, initial.width));
                height = node.autoHeight === false ? initial.height : Math.min(MAX_CONTENT_HEIGHT, natural.height);
                overflow = natural.height > height + 0.5;
            }
            if (node.kind === 'stack' && node.layout === 'region' && !scopeID) {
                children = solveScope(node.id);
                const content = children.filter(c => !c.collapsed && !c.node.decoration && c.node.kind !== 'spacer');
                collapsed || (collapsed = node.collapseWhenEmpty !== false && content.length === 0);
                const padding = node.padding ?? model_1.ZERO_PADDING;
                height = Math.max(initial.height, ...content.map(c => c.frame.y + c.frame.height + padding.bottom));
            }
            if (node.kind === 'stack' && node.layout === 'grid' && node.grid && !scopeID) {
                const resolved = solveGrid(node);
                children = resolved.children;
                height = resolved.height;
                collapsed || (collapsed = options.editingGridId !== node.id && node.collapseWhenEmpty !== false && resolved.empty);
            }
            let y = initial.y;
            if (node.follow) {
                let target = byID.get(node.follow.targetId);
                const visited = new Set([node.id]);
                let earliestY = initial.y;
                while (target && !visited.has(target.id)) {
                    visited.add(target.id);
                    const resolved = solve(target);
                    earliestY = (0, canvas_1.elementFrame)(target).y;
                    if (!resolved.collapsed) {
                        y = resolved.frame.y + resolved.frame.height + node.follow.gap;
                        break;
                    }
                    target = target.follow ? byID.get(target.follow.targetId) : undefined;
                    if (!target)
                        y = earliestY;
                }
            }
            const value = { node, frame: { ...initial, y, height: collapsed ? 0 : Math.max(0, height) }, collapsed, overflow, children };
            computed.set(node.id, value);
            pending.delete(node.id);
            return value;
        };
        return nodes.map(solve);
    };
    const top = solveScope('');
    const padding = template.canvas.padding ?? model_1.ZERO_PADDING;
    const fixed = template.canvas.height === 'hug' ? null : Math.round(model_1.CANVAS_WIDTH * template.canvas.height.aspect);
    const contentBottom = Math.max(0, ...top.filter(n => !n.collapsed && !n.node.decoration).map(n => n.frame.y + n.frame.height));
    const height = fixed ?? Math.min(MAX_CONTENT_HEIGHT, Math.max(120, contentBottom + padding.top + padding.bottom));
    const nodes = [];
    const byID = {};
    const overflow = new Set();
    const root = { id: template.root.id, kind: 'stack', node: template.root,
        frame: { x: padding.left, y: padding.top, width: Math.max(0, model_1.CANVAS_WIDTH - padding.left - padding.right), height: Math.max(0, height - padding.top - padding.bottom) },
        rotation: template.root.rotation ?? 0, opacity: template.root.opacity ?? 1, collapsed: false, depth: 1 };
    nodes.push(root);
    byID[root.id] = root;
    const emit = (entry, parent) => {
        const collapsed = entry.collapsed || parent.collapsed;
        const laid = { id: entry.node.id, kind: entry.node.kind, node: entry.node,
            frame: { ...entry.frame, x: parent.frame.x + entry.frame.x, y: parent.frame.y + entry.frame.y },
            rotation: entry.node.rotation ?? 0, opacity: collapsed ? 0 : parent.opacity * (entry.node.opacity ?? 1),
            collapsed, depth: parent.depth + 1, parent: parent.id };
        byID[laid.id] = laid;
        if (!collapsed) {
            nodes.push(laid);
            if (entry.overflow || (!entry.node.decoration && (laid.frame.x < 0 || laid.frame.x + laid.frame.width > model_1.CANVAS_WIDTH + 0.5 || laid.frame.y < 0 || laid.frame.y + laid.frame.height > height + 0.5)))
                overflow.add(laid.id);
        }
        for (const child of entry.children ?? [])
            emit(child, laid);
    };
    top.forEach(entry => emit(entry, root));
    for (const node of source)
        if (!byID[node.id])
            byID[node.id] = { id: node.id, kind: node.kind, node, frame: (0, canvas_1.elementFrame)(node), rotation: node.rotation ?? 0, opacity: 0, collapsed: true, depth: 2, parent: root.id };
    return { width: model_1.CANVAS_WIDTH, height, nodes, byID, grids, overflow: [...overflow] };
}

},
"virtual:i18n":function(require,module,exports){
exports.getLanguage = () => "zh-Hans"; exports.t = key => key;
},
"src/features/share/measure.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.skiaMeasure = exports.LABEL_ALPHA = exports.LABEL_WEIGHT = exports.LABEL_TRACKING = exports.LABEL_SIZE = exports.LABEL_GAP = exports.CHIP_V_PADDING = exports.CHIP_H_PADDING = void 0;
exports.layoutParagraph = layoutParagraph;
exports.layoutTextBlock = layoutTextBlock;
exports.blockInput = blockInput;
exports.clearMeasureCache = clearMeasureCache;
exports.measureCacheSize = measureCacheSize;
const react_native_skia_1 = require("src/features/share/offline/skiaAdapter.js");
const fonts_1 = require("src/features/share/offline/fontAdapter.js");
const fontRuntime_1 = require("src/features/share/fontRuntime.ts");
exports.CHIP_H_PADDING = 0.6;
exports.CHIP_V_PADDING = 0.35;
exports.LABEL_GAP = 0.25;
exports.LABEL_SIZE = 0.42;
exports.LABEL_TRACKING = 2;
exports.LABEL_WEIGHT = 600;
exports.LABEL_ALPHA = 0.6;
const UNBOUNDED = 100000;
function layoutOnce(spec, size, maxWidth) {
    const bounded = Number.isFinite(maxWidth) ? Math.max(1, maxWidth) : UNBOUNDED;
    const textStyle = {
        color: spec.color,
        fontFamilies: spec.families,
        fontSize: size,
        fontStyle: { weight: spec.weight },
        letterSpacing: spec.letterSpacing,
        heightMultiplier: fonts_1.LINE_HEIGHT_MULTIPLIER,
    };
    const builder = react_native_skia_1.Skia.ParagraphBuilder.Make({
        textAlign: spec.align,
        maxLines: spec.maxLines,
        ellipsis: '…',
        textStyle,
    }, (0, fontRuntime_1.posterFontProvider)());
    builder.pushStyle(textStyle);
    builder.addText(spec.text);
    builder.pop();
    const paragraph = builder.build();
    paragraph.layout(bounded);
    const intrinsic = paragraph.getMaxIntrinsicWidth();
    return {
        paragraph,
        width: Number.isFinite(maxWidth) ? paragraph.getLongestLine() : intrinsic,
        height: paragraph.getHeight(),
        intrinsic,
        laidOutWidth: bounded,
    };
}
function layoutParagraph(spec) {
    const first = layoutOnce(spec, spec.size, spec.maxWidth);
    if (!Number.isFinite(spec.maxWidth))
        return first;
    if (spec.maxLines !== 1 || first.intrinsic <= spec.maxWidth + 0.5)
        return first;
    const factor = Math.max(fonts_1.MIN_SCALE_FACTOR, spec.maxWidth / Math.max(1, first.intrinsic));
    return layoutOnce(spec, spec.size * factor, spec.maxWidth);
}
const BARCODE_HEIGHT = 2.6;
const BARCODE_WIDTH = 12;
const BLACK = Float32Array.of(0, 0, 0, 1);
const DEFAULT_COLORS = { value: BLACK, label: BLACK };
function layoutTextBlock(input, colors = DEFAULT_COLORS) {
    const fs = Math.max(1, input.fontSize);
    const hpad = input.chip ? fs * exports.CHIP_H_PADDING : 0;
    const vpad = input.chip ? fs * exports.CHIP_V_PADDING : 0;
    const bounded = Number.isFinite(input.maxWidth);
    const available = bounded ? Math.max(1, input.maxWidth - hpad * 2) : Infinity;
    const inlineRow = input.inlineLabel && input.label.length > 0;
    const measuredValue = layoutParagraph({
        text: input.text,
        families: (0, fonts_1.fontFamilies)(input.design, input.fontId),
        weight: (0, fonts_1.fontWeight)(input.weight, input.fontId),
        size: fs,
        letterSpacing: input.tracking,
        color: colors.value,
        align: inlineRow ? react_native_skia_1.TextAlign.Right : (0, fonts_1.textAlign)(input.alignment),
        maxLines: inlineRow ? 1 : Math.max(1, input.lineLimit),
        maxWidth: available,
    });
    const value = input.barcode && !inlineRow
        ? {
            ...measuredValue,
            width: bounded ? available : fs * BARCODE_WIDTH,
            laidOutWidth: bounded ? available : fs * BARCODE_WIDTH,
            height: fs * BARCODE_HEIGHT,
        }
        : measuredValue;
    let label = null;
    if (input.label.length > 0) {
        label = layoutParagraph({
            text: input.label,
            families: inlineRow || input.fontId ? (0, fonts_1.fontFamilies)(input.design, input.fontId) : (0, fonts_1.LABEL_FAMILIES)(),
            weight: inlineRow ? (0, fonts_1.fontWeight)(input.weight, input.fontId) : input.fontId ? (0, fonts_1.fontWeight)('半粗', input.fontId) : exports.LABEL_WEIGHT,
            size: inlineRow ? fs : Math.max(6, fs * exports.LABEL_SIZE),
            letterSpacing: inlineRow ? input.tracking : exports.LABEL_TRACKING,
            color: colors.label,
            align: react_native_skia_1.TextAlign.Left,
            maxLines: 1,
            maxWidth: available,
        });
    }
    const gap = fs * exports.LABEL_GAP;
    const contentWidth = inlineRow
        ? bounded
            ? available
            :
                (label ? label.width : 0) + fs * 1.5 + value.width
        : Math.min(available, Math.max(value.width, label ? label.width : 0));
    const contentHeight = inlineRow
        ? Math.max(value.height, label ? label.height : 0)
        : value.height + (label ? label.height + gap : 0);
    return {
        width: contentWidth + hpad * 2,
        height: contentHeight + vpad * 2,
        contentWidth,
        contentHeight,
        hpad,
        vpad,
        available,
        gap,
        value,
        label,
    };
}
function blockInput(request) {
    return {
        text: request.text,
        label: request.label,
        inlineLabel: request.inlineLabel,
        fontSize: request.fontSize,
        weight: request.weight,
        design: request.design,
        fontId: request.fontId,
        alignment: request.alignment,
        tracking: request.tracking,
        lineLimit: request.lineLimit,
        chip: request.chip,
        barcode: request.barcode,
        maxWidth: request.maxWidth,
    };
}
const CACHE_LIMIT = 500;
const cache = new Map();
function cacheKey(request) {
    return [
        request.text,
        request.label,
        request.inlineLabel ? 1 : 0,
        request.fontSize,
        request.weight,
        request.design,
        request.fontId ?? '',
        (0, fontRuntime_1.posterFontRevision)(),
        request.alignment,
        request.tracking,
        request.lineLimit,
        request.chip ? 1 : 0,
        request.barcode ? 1 : 0,
        Number.isFinite(request.maxWidth) ? request.maxWidth : 'inf',
    ].join('');
}
const skiaMeasure = (request) => {
    const key = cacheKey(request);
    const hit = cache.get(key);
    if (hit) {
        cache.delete(key);
        cache.set(key, hit);
        return hit;
    }
    const block = layoutTextBlock(blockInput(request));
    const measured = { width: block.width, height: block.height };
    if (cache.size >= CACHE_LIMIT) {
        const oldest = cache.keys().next();
        if (!oldest.done)
            cache.delete(oldest.value);
    }
    cache.set(key, measured);
    return measured;
};
exports.skiaMeasure = skiaMeasure;
function clearMeasureCache() {
    cache.clear();
}
function measureCacheSize() {
    return cache.size;
}

},
"src/features/share/offline/skiaAdapter.js":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Skia = exports.TextAlign = exports.FontWeight = exports.BlendMode = exports.TileMode = exports.StrokeJoin = exports.StrokeCap = exports.PaintStyle = exports.MipmapMode = exports.ImageFormat = exports.FilterMode = exports.ClipOp = exports.BlurStyle = void 0;
exports.initializeSkia = initializeSkia;
exports.beginRenderResources = beginRenderResources;
exports.endRenderResources = endRenderResources;
const JsiSkia_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkia.ts");
var types_1 = require("node_modules/@shopify/react-native-skia/src/skia/types/index.ts");
Object.defineProperty(exports, "BlurStyle", { enumerable: true, get: function () { return types_1.BlurStyle; } });
Object.defineProperty(exports, "ClipOp", { enumerable: true, get: function () { return types_1.ClipOp; } });
Object.defineProperty(exports, "FilterMode", { enumerable: true, get: function () { return types_1.FilterMode; } });
Object.defineProperty(exports, "ImageFormat", { enumerable: true, get: function () { return types_1.ImageFormat; } });
Object.defineProperty(exports, "MipmapMode", { enumerable: true, get: function () { return types_1.MipmapMode; } });
Object.defineProperty(exports, "PaintStyle", { enumerable: true, get: function () { return types_1.PaintStyle; } });
Object.defineProperty(exports, "StrokeCap", { enumerable: true, get: function () { return types_1.StrokeCap; } });
Object.defineProperty(exports, "StrokeJoin", { enumerable: true, get: function () { return types_1.StrokeJoin; } });
Object.defineProperty(exports, "TileMode", { enumerable: true, get: function () { return types_1.TileMode; } });
Object.defineProperty(exports, "BlendMode", { enumerable: true, get: function () { return types_1.BlendMode; } });
Object.defineProperty(exports, "FontWeight", { enumerable: true, get: function () { return types_1.FontWeight; } });
Object.defineProperty(exports, "TextAlign", { enumerable: true, get: function () { return types_1.TextAlign; } });
let resources = null;
const proxies = new WeakMap();
function wrap(value) {
    if (!value || typeof value !== 'object' || ArrayBuffer.isView(value) || value instanceof ArrayBuffer)
        return value;
    if (value.__typename__ && value.__typename__ !== 'Canvas' && typeof value.dispose === 'function' && resources)
        resources.add(value);
    if (proxies.has(value))
        return proxies.get(value);
    const proxy = new Proxy(value, { get(target, key) {
            const child = target[key];
            if (key === 'ref' || key === 'CanvasKit')
                return child;
            if (typeof child === 'function')
                return (...args) => wrap(child.apply(target, args));
            return child && typeof child === 'object' && !ArrayBuffer.isView(child) ? wrap(child) : child;
        } });
    proxies.set(value, proxy);
    return proxy;
}
function initializeSkia(CanvasKit) {
    const api = (0, JsiSkia_1.JsiSkApi)(CanvasKit);
    api.Surface.MakeOffscreen = (width, height) => api.Surface.Make(width, height);
    exports.Skia = wrap(api);
}
function beginRenderResources() { resources = new Set(); }
function endRenderResources() {
    const owned = resources;
    resources = null;
    if (owned)
        [...owned].reverse().forEach(resource => { try {
            resource.dispose();
        }
        catch { } });
}

},
"node_modules/@shopify/react-native-skia/src/skia/web/JsiSkia.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsiSkApi = void 0;
const JsiSkPoint_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkPoint.ts");
const JsiSkPaint_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkPaint.ts");
const JsiSkRect_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkRect.ts");
const JsiSkColor_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkColor.ts");
const JsiSkSurfaceFactory_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkSurfaceFactory.ts");
const JsiSkRRect_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkRRect.ts");
const JsiSkRSXform_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkRSXform.ts");
const JsiSkContourMeasureIter_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkContourMeasureIter.ts");
const JsiSkPictureRecorder_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkPictureRecorder.ts");
const JsiSkPictureFactory_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkPictureFactory.ts");
const JsiSkPathFactory_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkPathFactory.ts");
const JsiSkPathBuilderFactory_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkPathBuilderFactory.ts");
const JsiSkMatrix_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkMatrix.ts");
const JsiSkColorFilterFactory_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkColorFilterFactory.ts");
const JsiSkTypefaceFactory_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkTypefaceFactory.tsx");
const JsiSkMaskFilterFactory_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkMaskFilterFactory.ts");
const JsiSkRuntimeEffectFactory_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkRuntimeEffectFactory.ts");
const JsiSkImageFilterFactory_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkImageFilterFactory.ts");
const JsiSkShaderFactory_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkShaderFactory.ts");
const JsiSkPathEffectFactory_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkPathEffectFactory.ts");
const JsiSkDataFactory_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkDataFactory.ts");
const JsiSkImageFactory_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkImageFactory.ts");
const JsiSkSVGFactory_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkSVGFactory.ts");
const JsiSkTextBlobFactory_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkTextBlobFactory.ts");
const JsiSkFont_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkFont.ts");
const JsiSkVerticesFactory_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkVerticesFactory.ts");
const JsiSkPath_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkPath.ts");
const JsiSkTypeface_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkTypeface.ts");
const JsiSkTypefaceFontProviderFactory_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkTypefaceFontProviderFactory.ts");
const JsiSkFontMgrFactory_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkFontMgrFactory.ts");
const JsiSkAnimatedImageFactory_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkAnimatedImageFactory.ts");
const JsiSkParagraphBuilderFactory_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkParagraphBuilderFactory.ts");
const JsiSkNativeBufferFactory_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkNativeBufferFactory.ts");
const JsiVideo_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiVideo.ts");
const Host_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/Host.ts");
const JsiSkottieFactory_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkottieFactory.ts");
const JsiSkApi = (CanvasKit) => ({
    Point: (x, y) => new JsiSkPoint_1.JsiSkPoint(CanvasKit, Float32Array.of(x, y)),
    RuntimeShaderBuilder: (_) => {
        return (0, Host_1.throwNotImplementedOnRNWeb)();
    },
    RRectXY: (rect, rx, ry) => new JsiSkRRect_1.JsiSkRRect(CanvasKit, rect, rx, ry),
    RSXform: (scos, ssin, tx, ty) => new JsiSkRSXform_1.JsiSkRSXform(CanvasKit, Float32Array.of(scos, ssin, tx, ty)),
    RSXformFromRadians: (scale, r, tx, ty, px, py) => {
        const s = Math.sin(r) * scale;
        const c = Math.cos(r) * scale;
        return new JsiSkRSXform_1.JsiSkRSXform(CanvasKit, Float32Array.of(c, s, tx - c * px + s * py, ty - s * px - c * py));
    },
    Color: JsiSkColor_1.Color,
    ContourMeasureIter: (path, forceClosed, resScale) => (() => {
        const p = JsiSkPath_1.JsiSkPath.pathFromValue(path);
        const iter = new JsiSkContourMeasureIter_1.JsiSkContourMeasureIter(CanvasKit, new CanvasKit.ContourMeasureIter(p, forceClosed, resScale));
        p.delete();
        return iter;
    })(),
    Paint: () => {
        const paint = new JsiSkPaint_1.JsiSkPaint(CanvasKit, new CanvasKit.Paint());
        paint.setAntiAlias(true);
        return paint;
    },
    PictureRecorder: () => new JsiSkPictureRecorder_1.JsiSkPictureRecorder(CanvasKit, new CanvasKit.PictureRecorder()),
    Picture: new JsiSkPictureFactory_1.JsiSkPictureFactory(CanvasKit),
    Path: new JsiSkPathFactory_1.JsiSkPathFactory(CanvasKit),
    PathBuilder: new JsiSkPathBuilderFactory_1.JsiSkPathBuilderFactory(CanvasKit),
    Matrix: (matrix) => new JsiSkMatrix_1.JsiSkMatrix(CanvasKit, matrix
        ? Float32Array.of(...matrix)
        : Float32Array.of(...CanvasKit.Matrix.identity())),
    ColorFilter: new JsiSkColorFilterFactory_1.JsiSkColorFilterFactory(CanvasKit),
    Font: (typeface, size) => new JsiSkFont_1.JsiSkFont(CanvasKit, new CanvasKit.Font(typeface === undefined ? null : JsiSkTypeface_1.JsiSkTypeface.fromValue(typeface), size)),
    Typeface: new JsiSkTypefaceFactory_1.JsiSkTypefaceFactory(CanvasKit),
    MaskFilter: new JsiSkMaskFilterFactory_1.JsiSkMaskFilterFactory(CanvasKit),
    RuntimeEffect: new JsiSkRuntimeEffectFactory_1.JsiSkRuntimeEffectFactory(CanvasKit),
    ImageFilter: new JsiSkImageFilterFactory_1.JsiSkImageFilterFactory(CanvasKit),
    Shader: new JsiSkShaderFactory_1.JsiSkShaderFactory(CanvasKit),
    PathEffect: new JsiSkPathEffectFactory_1.JsiSkPathEffectFactory(CanvasKit),
    MakeVertices: JsiSkVerticesFactory_1.MakeVertices.bind(null, CanvasKit),
    Data: new JsiSkDataFactory_1.JsiSkDataFactory(CanvasKit),
    Image: new JsiSkImageFactory_1.JsiSkImageFactory(CanvasKit),
    AnimatedImage: new JsiSkAnimatedImageFactory_1.JsiSkAnimatedImageFactory(CanvasKit),
    SVG: new JsiSkSVGFactory_1.JsiSkSVGFactory(CanvasKit),
    TextBlob: new JsiSkTextBlobFactory_1.JsiSkTextBlobFactory(CanvasKit),
    XYWHRect: (x, y, width, height) => {
        return new JsiSkRect_1.JsiSkRect(CanvasKit, CanvasKit.XYWHRect(x, y, width, height));
    },
    Surface: new JsiSkSurfaceFactory_1.JsiSkSurfaceFactory(CanvasKit),
    TypefaceFontProvider: new JsiSkTypefaceFontProviderFactory_1.JsiSkTypefaceFontProviderFactory(CanvasKit),
    FontMgr: new JsiSkFontMgrFactory_1.JsiSkFontMgrFactory(CanvasKit),
    ParagraphBuilder: new JsiSkParagraphBuilderFactory_1.JsiSkParagraphBuilderFactory(CanvasKit),
    NativeBuffer: new JsiSkNativeBufferFactory_1.JsiSkNativeBufferFactory(CanvasKit),
    Skottie: new JsiSkottieFactory_1.JsiSkottieFactory(CanvasKit),
    Video: JsiVideo_1.createVideo.bind(null, CanvasKit),
    Context: (_surface, _width, _height) => {
        return (0, Host_1.throwNotImplementedOnRNWeb)();
    },
    Recorder: () => {
        return (0, Host_1.throwNotImplementedOnRNWeb)();
    },
    getDevice: () => {
        return (0, Host_1.throwNotImplementedOnRNWeb)();
    },
    hasDevice: () => {
        return false;
    },
});
exports.JsiSkApi = JsiSkApi;

},
"node_modules/@shopify/react-native-skia/src/skia/web/JsiSkPoint.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsiSkPoint = void 0;
const Host_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/Host.ts");
class JsiSkPoint extends Host_1.BaseHostObject {
    static fromValue(point) {
        if (point instanceof JsiSkPoint) {
            return point.ref;
        }
        return new Float32Array([point.x, point.y]);
    }
    constructor(CanvasKit, ref) {
        super(CanvasKit, ref, "Point");
    }
    get x() {
        return this.ref[0];
    }
    get y() {
        return this.ref[1];
    }
}
exports.JsiSkPoint = JsiSkPoint;

},
"node_modules/@shopify/react-native-skia/src/skia/web/Host.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optEnum = exports.getEnum = exports.HostObject = exports.BaseHostObject = exports.Host = exports.throwNotImplementedOnRNWeb = void 0;
const throwNotImplementedOnRNWeb = () => {
    if (typeof jest !== "undefined") {
        return jest.fn();
    }
    throw new Error("Not implemented on React Native Web");
};
exports.throwNotImplementedOnRNWeb = throwNotImplementedOnRNWeb;
class Host {
    constructor(CanvasKit) {
        this.CanvasKit = CanvasKit;
    }
}
exports.Host = Host;
class BaseHostObject extends Host {
    constructor(CanvasKit, ref, typename) {
        super(CanvasKit);
        this.ref = ref;
        this.__typename__ = typename;
    }
    dispose() {
        this[Symbol.dispose]();
    }
    [Symbol.dispose]() {
        if (this.ref !== null &&
            typeof this.ref === "object" &&
            "delete" in this.ref &&
            typeof this.ref.delete === "function") {
            this.ref.delete();
        }
    }
}
exports.BaseHostObject = BaseHostObject;
class HostObject extends BaseHostObject {
    static fromValue(value) {
        return value.ref;
    }
}
exports.HostObject = HostObject;
const getEnum = (CanvasKit, name, v) => {
    const e = CanvasKit[name];
    if (typeof e !== "function") {
        throw new Error(`${name} is not an number`);
    }
    const result = Object.values(e).find((entry) => entry !== null &&
        typeof entry === "object" &&
        "value" in entry &&
        entry.value === v);
    if (!result) {
        throw new Error(`Enum ${name} does not have value ${v} on React Native Web`);
    }
    return result;
};
exports.getEnum = getEnum;
const optEnum = (CanvasKit, name, v) => {
    return v === undefined ? undefined : (0, exports.getEnum)(CanvasKit, name, v);
};
exports.optEnum = optEnum;

},
"node_modules/@shopify/react-native-skia/src/skia/web/JsiSkPaint.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsiSkPaint = void 0;
const Host_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/Host.ts");
const JsiSkColorFilter_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkColorFilter.ts");
const JsiSkImageFilter_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkImageFilter.ts");
const JsiSkMaskFilter_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkMaskFilter.ts");
const JsiSkPathEffect_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkPathEffect.ts");
const JsiSkShader_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkShader.ts");
const kBlendModePlusDarker = 1001;
const kBlendModePlusLighter = 1002;
const plusDarkerSkSL = `
    vec4 main(vec4 src, vec4 dst) {
        float outAlpha = src.a + dst.a - src.a * dst.a;
        vec3 srcUnpremul = src.a > 0.0 ? src.rgb / src.a : vec3(0.0);
        vec3 dstUnpremul = dst.a > 0.0 ? dst.rgb / dst.a : vec3(0.0);
        vec3 blended = max(vec3(0.0), srcUnpremul + dstUnpremul - vec3(1.0));
        return vec4(blended * outAlpha, outAlpha);
    }
`;
const plusLighterSkSL = `
    vec4 main(vec4 src, vec4 dst) {
        float outAlpha = src.a + dst.a - src.a * dst.a;
        vec3 srcUnpremul = src.a > 0.0 ? src.rgb / src.a : vec3(0.0);
        vec3 dstUnpremul = dst.a > 0.0 ? dst.rgb / dst.a : vec3(0.0);
        vec3 blended = min(vec3(1.0), srcUnpremul + dstUnpremul);
        return vec4(blended * outAlpha, outAlpha);
    }
`;
const blenderCache = new WeakMap();
const getBlenderCache = (ck) => {
    let cache = blenderCache.get(ck);
    if (!cache) {
        cache = { plusDarker: null, plusLighter: null };
        blenderCache.set(ck, cache);
    }
    return cache;
};
class JsiSkPaint extends Host_1.HostObject {
    constructor(CanvasKit, ref) {
        super(CanvasKit, ref, "Paint");
    }
    copy() {
        return new JsiSkPaint(this.CanvasKit, this.ref.copy());
    }
    assign(paint) {
        this.ref = paint.ref.copy();
    }
    reset() {
        this.ref = new this.CanvasKit.Paint();
    }
    getAlphaf() {
        return this.getColor()[3];
    }
    getColor() {
        return this.ref.getColor();
    }
    getStrokeCap() {
        return this.ref.getStrokeCap().value;
    }
    getStrokeJoin() {
        return this.ref.getStrokeJoin().value;
    }
    getStrokeMiter() {
        return this.ref.getStrokeMiter();
    }
    getStrokeWidth() {
        return this.ref.getStrokeWidth();
    }
    setAlphaf(alpha) {
        this.ref.setAlphaf(alpha);
    }
    setAntiAlias(aa) {
        this.ref.setAntiAlias(aa);
    }
    setDither(dither) {
        this.ref.setDither(dither);
    }
    setBlendMode(blendMode) {
        if (blendMode === kBlendModePlusDarker) {
            const cache = getBlenderCache(this.CanvasKit);
            if (!cache.plusDarker) {
                const effect = this.CanvasKit.RuntimeEffect.MakeForBlender(plusDarkerSkSL);
                if (effect) {
                    cache.plusDarker = effect.makeBlender([]);
                }
            }
            if (cache.plusDarker) {
                this.ref.setBlender(cache.plusDarker);
            }
        }
        else if (blendMode === kBlendModePlusLighter) {
            const cache = getBlenderCache(this.CanvasKit);
            if (!cache.plusLighter) {
                const effect = this.CanvasKit.RuntimeEffect.MakeForBlender(plusLighterSkSL);
                if (effect) {
                    cache.plusLighter = effect.makeBlender([]);
                }
            }
            if (cache.plusLighter) {
                this.ref.setBlender(cache.plusLighter);
            }
        }
        else {
            this.ref.setBlendMode((0, Host_1.getEnum)(this.CanvasKit, "BlendMode", blendMode));
        }
    }
    setColor(color) {
        this.ref.setColor(color);
    }
    setColorFilter(filter) {
        this.ref.setColorFilter(filter ? JsiSkColorFilter_1.JsiSkColorFilter.fromValue(filter) : null);
    }
    setImageFilter(filter) {
        this.ref.setImageFilter(filter ? JsiSkImageFilter_1.JsiSkImageFilter.fromValue(filter) : null);
    }
    setMaskFilter(filter) {
        this.ref.setMaskFilter(filter ? JsiSkMaskFilter_1.JsiSkMaskFilter.fromValue(filter) : null);
    }
    setPathEffect(effect) {
        this.ref.setPathEffect(effect ? JsiSkPathEffect_1.JsiSkPathEffect.fromValue(effect) : null);
    }
    setShader(shader) {
        this.ref.setShader(shader ? JsiSkShader_1.JsiSkShader.fromValue(shader) : null);
    }
    setStrokeCap(cap) {
        this.ref.setStrokeCap((0, Host_1.getEnum)(this.CanvasKit, "StrokeCap", cap));
    }
    setStrokeJoin(join) {
        this.ref.setStrokeJoin((0, Host_1.getEnum)(this.CanvasKit, "StrokeJoin", join));
    }
    setStrokeMiter(limit) {
        this.ref.setStrokeMiter(limit);
    }
    setStrokeWidth(width) {
        this.ref.setStrokeWidth(width);
    }
    setStyle(style) {
        this.ref.setStyle({ value: style });
    }
}
exports.JsiSkPaint = JsiSkPaint;

},
"node_modules/@shopify/react-native-skia/src/skia/web/JsiSkColorFilter.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsiSkColorFilter = void 0;
const Host_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/Host.ts");
class JsiSkColorFilter extends Host_1.HostObject {
    constructor(CanvasKit, ref) {
        super(CanvasKit, ref, "ColorFilter");
    }
}
exports.JsiSkColorFilter = JsiSkColorFilter;

},
"node_modules/@shopify/react-native-skia/src/skia/web/JsiSkImageFilter.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsiSkImageFilter = void 0;
const Host_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/Host.ts");
class JsiSkImageFilter extends Host_1.HostObject {
    constructor(CanvasKit, ref) {
        super(CanvasKit, ref, "ImageFilter");
    }
}
exports.JsiSkImageFilter = JsiSkImageFilter;

},
"node_modules/@shopify/react-native-skia/src/skia/web/JsiSkMaskFilter.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsiSkMaskFilter = void 0;
const Host_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/Host.ts");
class JsiSkMaskFilter extends Host_1.HostObject {
    constructor(CanvasKit, ref) {
        super(CanvasKit, ref, "MaskFilter");
    }
}
exports.JsiSkMaskFilter = JsiSkMaskFilter;

},
"node_modules/@shopify/react-native-skia/src/skia/web/JsiSkPathEffect.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsiSkPathEffect = void 0;
const Host_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/Host.ts");
class JsiSkPathEffect extends Host_1.HostObject {
    constructor(CanvasKit, ref) {
        super(CanvasKit, ref, "PathEffect");
    }
}
exports.JsiSkPathEffect = JsiSkPathEffect;

},
"node_modules/@shopify/react-native-skia/src/skia/web/JsiSkShader.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsiSkShader = void 0;
const Host_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/Host.ts");
class JsiSkShader extends Host_1.HostObject {
    constructor(CanvasKit, ref) {
        super(CanvasKit, ref, "Shader");
    }
}
exports.JsiSkShader = JsiSkShader;

},
"node_modules/@shopify/react-native-skia/src/skia/web/JsiSkRect.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsiSkRect = void 0;
const Host_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/Host.ts");
class JsiSkRect extends Host_1.BaseHostObject {
    static fromValue(CanvasKit, rect) {
        if (rect instanceof JsiSkRect) {
            return rect.ref;
        }
        return CanvasKit.XYWHRect(rect.x, rect.y, rect.width, rect.height);
    }
    constructor(CanvasKit, ref) {
        super(CanvasKit, ref, "Rect");
    }
    setXYWH(x, y, width, height) {
        this.ref[0] = x;
        this.ref[1] = y;
        this.ref[2] = x + width;
        this.ref[3] = y + height;
    }
    get x() {
        return this.ref[0];
    }
    get y() {
        return this.ref[1];
    }
    get width() {
        return this.ref[2] - this.ref[0];
    }
    get height() {
        return this.ref[3] - this.ref[1];
    }
}
exports.JsiSkRect = JsiSkRect;

},
"node_modules/@shopify/react-native-skia/src/skia/web/JsiSkColor.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Color = void 0;
const alphaf = (c) => ((c >> 24) & 255) / 255;
const red = (c) => (c >> 16) & 255;
const green = (c) => (c >> 8) & 255;
const blue = (c) => c & 255;
const CSSColorTable = {
    transparent: Float32Array.of(0, 0, 0, 0),
    aliceblue: Float32Array.of(240, 248, 255, 1),
    antiquewhite: Float32Array.of(250, 235, 215, 1),
    aqua: Float32Array.of(0, 255, 255, 1),
    aquamarine: Float32Array.of(127, 255, 212, 1),
    azure: Float32Array.of(240, 255, 255, 1),
    beige: Float32Array.of(245, 245, 220, 1),
    bisque: Float32Array.of(255, 228, 196, 1),
    black: Float32Array.of(0, 0, 0, 1),
    blanchedalmond: Float32Array.of(255, 235, 205, 1),
    blue: Float32Array.of(0, 0, 255, 1),
    blueviolet: Float32Array.of(138, 43, 226, 1),
    brown: Float32Array.of(165, 42, 42, 1),
    burlywood: Float32Array.of(222, 184, 135, 1),
    cadetblue: Float32Array.of(95, 158, 160, 1),
    chartreuse: Float32Array.of(127, 255, 0, 1),
    chocolate: Float32Array.of(210, 105, 30, 1),
    coral: Float32Array.of(255, 127, 80, 1),
    cornflowerblue: Float32Array.of(100, 149, 237, 1),
    cornsilk: Float32Array.of(255, 248, 220, 1),
    crimson: Float32Array.of(220, 20, 60, 1),
    cyan: Float32Array.of(0, 255, 255, 1),
    darkblue: Float32Array.of(0, 0, 139, 1),
    darkcyan: Float32Array.of(0, 139, 139, 1),
    darkgoldenrod: Float32Array.of(184, 134, 11, 1),
    darkgray: Float32Array.of(169, 169, 169, 1),
    darkgreen: Float32Array.of(0, 100, 0, 1),
    darkgrey: Float32Array.of(169, 169, 169, 1),
    darkkhaki: Float32Array.of(189, 183, 107, 1),
    darkmagenta: Float32Array.of(139, 0, 139, 1),
    darkolivegreen: Float32Array.of(85, 107, 47, 1),
    darkorange: Float32Array.of(255, 140, 0, 1),
    darkorchid: Float32Array.of(153, 50, 204, 1),
    darkred: Float32Array.of(139, 0, 0, 1),
    darksalmon: Float32Array.of(233, 150, 122, 1),
    darkseagreen: Float32Array.of(143, 188, 143, 1),
    darkslateblue: Float32Array.of(72, 61, 139, 1),
    darkslategray: Float32Array.of(47, 79, 79, 1),
    darkslategrey: Float32Array.of(47, 79, 79, 1),
    darkturquoise: Float32Array.of(0, 206, 209, 1),
    darkviolet: Float32Array.of(148, 0, 211, 1),
    deeppink: Float32Array.of(255, 20, 147, 1),
    deepskyblue: Float32Array.of(0, 191, 255, 1),
    dimgray: Float32Array.of(105, 105, 105, 1),
    dimgrey: Float32Array.of(105, 105, 105, 1),
    dodgerblue: Float32Array.of(30, 144, 255, 1),
    firebrick: Float32Array.of(178, 34, 34, 1),
    floralwhite: Float32Array.of(255, 250, 240, 1),
    forestgreen: Float32Array.of(34, 139, 34, 1),
    fuchsia: Float32Array.of(255, 0, 255, 1),
    gainsboro: Float32Array.of(220, 220, 220, 1),
    ghostwhite: Float32Array.of(248, 248, 255, 1),
    gold: Float32Array.of(255, 215, 0, 1),
    goldenrod: Float32Array.of(218, 165, 32, 1),
    gray: Float32Array.of(128, 128, 128, 1),
    green: Float32Array.of(0, 128, 0, 1),
    greenyellow: Float32Array.of(173, 255, 47, 1),
    grey: Float32Array.of(128, 128, 128, 1),
    honeydew: Float32Array.of(240, 255, 240, 1),
    hotpink: Float32Array.of(255, 105, 180, 1),
    indianred: Float32Array.of(205, 92, 92, 1),
    indigo: Float32Array.of(75, 0, 130, 1),
    ivory: Float32Array.of(255, 255, 240, 1),
    khaki: Float32Array.of(240, 230, 140, 1),
    lavender: Float32Array.of(230, 230, 250, 1),
    lavenderblush: Float32Array.of(255, 240, 245, 1),
    lawngreen: Float32Array.of(124, 252, 0, 1),
    lemonchiffon: Float32Array.of(255, 250, 205, 1),
    lightblue: Float32Array.of(173, 216, 230, 1),
    lightcoral: Float32Array.of(240, 128, 128, 1),
    lightcyan: Float32Array.of(224, 255, 255, 1),
    lightgoldenrodyellow: Float32Array.of(250, 250, 210, 1),
    lightgray: Float32Array.of(211, 211, 211, 1),
    lightgreen: Float32Array.of(144, 238, 144, 1),
    lightgrey: Float32Array.of(211, 211, 211, 1),
    lightpink: Float32Array.of(255, 182, 193, 1),
    lightsalmon: Float32Array.of(255, 160, 122, 1),
    lightseagreen: Float32Array.of(32, 178, 170, 1),
    lightskyblue: Float32Array.of(135, 206, 250, 1),
    lightslategray: Float32Array.of(119, 136, 153, 1),
    lightslategrey: Float32Array.of(119, 136, 153, 1),
    lightsteelblue: Float32Array.of(176, 196, 222, 1),
    lightyellow: Float32Array.of(255, 255, 224, 1),
    lime: Float32Array.of(0, 255, 0, 1),
    limegreen: Float32Array.of(50, 205, 50, 1),
    linen: Float32Array.of(250, 240, 230, 1),
    magenta: Float32Array.of(255, 0, 255, 1),
    maroon: Float32Array.of(128, 0, 0, 1),
    mediumaquamarine: Float32Array.of(102, 205, 170, 1),
    mediumblue: Float32Array.of(0, 0, 205, 1),
    mediumorchid: Float32Array.of(186, 85, 211, 1),
    mediumpurple: Float32Array.of(147, 112, 219, 1),
    mediumseagreen: Float32Array.of(60, 179, 113, 1),
    mediumslateblue: Float32Array.of(123, 104, 238, 1),
    mediumspringgreen: Float32Array.of(0, 250, 154, 1),
    mediumturquoise: Float32Array.of(72, 209, 204, 1),
    mediumvioletred: Float32Array.of(199, 21, 133, 1),
    midnightblue: Float32Array.of(25, 25, 112, 1),
    mintcream: Float32Array.of(245, 255, 250, 1),
    mistyrose: Float32Array.of(255, 228, 225, 1),
    moccasin: Float32Array.of(255, 228, 181, 1),
    navajowhite: Float32Array.of(255, 222, 173, 1),
    navy: Float32Array.of(0, 0, 128, 1),
    oldlace: Float32Array.of(253, 245, 230, 1),
    olive: Float32Array.of(128, 128, 0, 1),
    olivedrab: Float32Array.of(107, 142, 35, 1),
    orange: Float32Array.of(255, 165, 0, 1),
    orangered: Float32Array.of(255, 69, 0, 1),
    orchid: Float32Array.of(218, 112, 214, 1),
    palegoldenrod: Float32Array.of(238, 232, 170, 1),
    palegreen: Float32Array.of(152, 251, 152, 1),
    paleturquoise: Float32Array.of(175, 238, 238, 1),
    palevioletred: Float32Array.of(219, 112, 147, 1),
    papayawhip: Float32Array.of(255, 239, 213, 1),
    peachpuff: Float32Array.of(255, 218, 185, 1),
    peru: Float32Array.of(205, 133, 63, 1),
    pink: Float32Array.of(255, 192, 203, 1),
    plum: Float32Array.of(221, 160, 221, 1),
    powderblue: Float32Array.of(176, 224, 230, 1),
    purple: Float32Array.of(128, 0, 128, 1),
    rebeccapurple: Float32Array.of(102, 51, 153, 1),
    red: Float32Array.of(255, 0, 0, 1),
    rosybrown: Float32Array.of(188, 143, 143, 1),
    royalblue: Float32Array.of(65, 105, 225, 1),
    saddlebrown: Float32Array.of(139, 69, 19, 1),
    salmon: Float32Array.of(250, 128, 114, 1),
    sandybrown: Float32Array.of(244, 164, 96, 1),
    seagreen: Float32Array.of(46, 139, 87, 1),
    seashell: Float32Array.of(255, 245, 238, 1),
    sienna: Float32Array.of(160, 82, 45, 1),
    silver: Float32Array.of(192, 192, 192, 1),
    skyblue: Float32Array.of(135, 206, 235, 1),
    slateblue: Float32Array.of(106, 90, 205, 1),
    slategray: Float32Array.of(112, 128, 144, 1),
    slategrey: Float32Array.of(112, 128, 144, 1),
    snow: Float32Array.of(255, 250, 250, 1),
    springgreen: Float32Array.of(0, 255, 127, 1),
    steelblue: Float32Array.of(70, 130, 180, 1),
    tan: Float32Array.of(210, 180, 140, 1),
    teal: Float32Array.of(0, 128, 128, 1),
    thistle: Float32Array.of(216, 191, 216, 1),
    tomato: Float32Array.of(255, 99, 71, 1),
    turquoise: Float32Array.of(64, 224, 208, 1),
    violet: Float32Array.of(238, 130, 238, 1),
    wheat: Float32Array.of(245, 222, 179, 1),
    white: Float32Array.of(255, 255, 255, 1),
    whitesmoke: Float32Array.of(245, 245, 245, 1),
    yellow: Float32Array.of(255, 255, 0, 1),
    yellowgreen: Float32Array.of(154, 205, 50, 1),
};
const clampCSSByte = (j) => {
    const i = Math.round(j);
    return i < 0 ? 0 : i > 255 ? 255 : i;
};
const clampCSSFloat = (f) => {
    return f < 0 ? 0 : f > 1 ? 1 : f;
};
const parseCSSInt = (str) => {
    if (str[str.length - 1] === "%") {
        return clampCSSByte((parseFloat(str) / 100) * 255);
    }
    return clampCSSByte(parseInt(str));
};
const parseCSSFloat = (str) => {
    if (str === undefined) {
        return 1;
    }
    if (str[str.length - 1] === "%") {
        return clampCSSFloat(parseFloat(str) / 100);
    }
    return clampCSSFloat(parseFloat(str));
};
const CSSHueToRGB = (m1, m2, h) => {
    if (h < 0) {
        h += 1;
    }
    else if (h > 1) {
        h -= 1;
    }
    if (h * 6 < 1) {
        return m1 + (m2 - m1) * h * 6;
    }
    if (h * 2 < 1) {
        return m2;
    }
    if (h * 3 < 2) {
        return m1 + (m2 - m1) * (2 / 3 - h) * 6;
    }
    return m1;
};
const parseCSSColor = (cssStr) => {
    var str = cssStr.replace(/ /g, "").toLowerCase();
    if (str in CSSColorTable) {
        const cl = CSSColorTable[str];
        if (cl) {
            return Float32Array.of(...cl);
        }
        return null;
    }
    if (str[0] === "#") {
        if (str.length === 4) {
            var iv = parseInt(str.substr(1), 16);
            if (!(iv >= 0 && iv <= 0xfff)) {
                return null;
            }
            return [
                ((iv & 0xf00) >> 4) | ((iv & 0xf00) >> 8),
                (iv & 0xf0) | ((iv & 0xf0) >> 4),
                (iv & 0xf) | ((iv & 0xf) << 4),
                1,
            ];
        }
        else if (str.length === 7) {
            var iv = parseInt(str.substr(1), 16);
            if (!(iv >= 0 && iv <= 0xffffff)) {
                return null;
            }
            return [(iv & 0xff0000) >> 16, (iv & 0xff00) >> 8, iv & 0xff, 1];
        }
        else if (str.length === 9) {
            var iv = parseInt(str.substr(1), 16);
            if (!(iv >= 0 && iv <= 0xffffffff)) {
                return null;
            }
            return [
                ((iv & 0xff000000) >> 24) & 0xff,
                (iv & 0xff0000) >> 16,
                (iv & 0xff00) >> 8,
                (iv & 0xff) / 255,
            ];
        }
        return null;
    }
    var op = str.indexOf("("), ep = str.indexOf(")");
    if (op !== -1 && ep + 1 === str.length) {
        var fname = str.substr(0, op);
        var params = str.substr(op + 1, ep - (op + 1)).split(",");
        var alpha = 1;
        switch (fname) {
            case "rgba":
                if (params.length !== 4) {
                    return null;
                }
                alpha = parseCSSFloat(params.pop());
            case "rgb":
                if (params.length !== 3) {
                    return null;
                }
                return [
                    parseCSSInt(params[0]),
                    parseCSSInt(params[1]),
                    parseCSSInt(params[2]),
                    alpha,
                ];
            case "hsla":
                if (params.length !== 4) {
                    return null;
                }
                alpha = parseCSSFloat(params.pop());
            case "hsl":
                if (params.length !== 3) {
                    return null;
                }
                var h = (((parseFloat(params[0]) % 360) + 360) % 360) / 360;
                var s = parseCSSFloat(params[1]);
                var l = parseCSSFloat(params[2]);
                var m2 = l <= 0.5 ? l * (s + 1) : l + s - l * s;
                var m1 = l * 2 - m2;
                return [
                    clampCSSByte(CSSHueToRGB(m1, m2, h + 1 / 3) * 255),
                    clampCSSByte(CSSHueToRGB(m1, m2, h) * 255),
                    clampCSSByte(CSSHueToRGB(m1, m2, h - 1 / 3) * 255),
                    alpha,
                ];
            default:
                return null;
        }
    }
    return null;
};
const Color = (color) => {
    if (color instanceof Float32Array) {
        return color;
    }
    else if (Array.isArray(color)) {
        return new Float32Array(color);
    }
    else if (typeof color === "string") {
        const r = parseCSSColor(color);
        const rgba = r === null ? CSSColorTable.black : r;
        return Float32Array.of(rgba[0] / 255, rgba[1] / 255, rgba[2] / 255, rgba[3]);
    }
    else {
        return Float32Array.of(red(color) / 255, green(color) / 255, blue(color) / 255, alphaf(color));
    }
};
exports.Color = Color;

},
"node_modules/@shopify/react-native-skia/src/skia/web/JsiSkSurfaceFactory.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsiSkSurfaceFactory = void 0;
const Host_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/Host.ts");
const JsiSkSurface_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkSurface.ts");
class JsiSkSurfaceFactory extends Host_1.Host {
    constructor(CanvasKit) {
        super(CanvasKit);
    }
    Make(width, height) {
        return new JsiSkSurface_1.JsiSkSurface(this.CanvasKit, this.CanvasKit.MakeSurface(width, height));
    }
    MakeOffscreen(width, height) {
        const OC = globalThis.OffscreenCanvas;
        let surface;
        if (OC === undefined) {
            return this.Make(width, height);
        }
        else {
            const offscreen = new OC(width, height);
            const webglContext = this.CanvasKit.GetWebGLContext(offscreen);
            const grContext = this.CanvasKit.MakeWebGLContext(webglContext);
            if (!grContext) {
                throw new Error("Could not make a graphics context");
            }
            surface = this.CanvasKit.MakeRenderTarget(grContext, width, height);
        }
        if (!surface) {
            return null;
        }
        return new JsiSkSurface_1.JsiSkSurface(this.CanvasKit, surface);
    }
}
exports.JsiSkSurfaceFactory = JsiSkSurfaceFactory;

},
"node_modules/@shopify/react-native-skia/src/skia/web/JsiSkSurface.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsiSkSurface = void 0;
const Host_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/Host.ts");
const JsiSkCanvas_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkCanvas.ts");
const JsiSkImage_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkImage.ts");
const JsiSkRect_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkRect.ts");
class JsiSkSurface extends Host_1.HostObject {
    constructor(CanvasKit, ref) {
        super(CanvasKit, ref, "Surface");
    }
    [Symbol.dispose]() {
        this.ref.dispose();
    }
    flush() {
        this.ref.flush();
    }
    width() {
        return this.ref.width();
    }
    height() {
        return this.ref.height();
    }
    getCanvas() {
        return new JsiSkCanvas_1.JsiSkCanvas(this.CanvasKit, this.ref.getCanvas());
    }
    makeImageSnapshot(bounds, outputImage) {
        const image = this.ref.makeImageSnapshot(bounds
            ? Array.from(JsiSkRect_1.JsiSkRect.fromValue(this.CanvasKit, bounds))
            : undefined);
        if (outputImage) {
            outputImage.ref = image;
        }
        return new JsiSkImage_1.JsiSkImage(this.CanvasKit, image);
    }
    getNativeTextureUnstable() {
        console.warn("getBackendTexture is not implemented on Web");
        return null;
    }
}
exports.JsiSkSurface = JsiSkSurface;

},
"node_modules/@shopify/react-native-skia/src/skia/web/JsiSkCanvas.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsiSkCanvas = void 0;
const types_1 = require("node_modules/@shopify/react-native-skia/src/skia/types/index.ts");
const Host_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/Host.ts");
const JsiSkPaint_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkPaint.ts");
const JsiSkRect_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkRect.ts");
const JsiSkRRect_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkRRect.ts");
const JsiSkImage_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkImage.ts");
const JsiSkVertices_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkVertices.ts");
const JsiSkPath_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkPath.ts");
const JsiSkFont_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkFont.ts");
const JsiSkTextBlob_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkTextBlob.ts");
const JsiSkPicture_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkPicture.ts");
const JsiSkMatrix_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkMatrix.ts");
const JsiSkImageFilter_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkImageFilter.ts");
const JsiSkPoint_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkPoint.ts");
const JsiSkRSXform_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkRSXform.ts");
class JsiSkCanvas extends Host_1.HostObject {
    constructor(CanvasKit, ref) {
        super(CanvasKit, ref, "Canvas");
    }
    drawRect(rect, paint) {
        this.ref.drawRect(JsiSkRect_1.JsiSkRect.fromValue(this.CanvasKit, rect), JsiSkPaint_1.JsiSkPaint.fromValue(paint));
    }
    drawImage(image, x, y, paint) {
        this.ref.drawImage(JsiSkImage_1.JsiSkImage.fromValue(image), x, y, paint ? JsiSkPaint_1.JsiSkPaint.fromValue(paint) : paint);
    }
    drawImageRect(img, src, dest, paint, fastSample) {
        this.ref.drawImageRect(JsiSkImage_1.JsiSkImage.fromValue(img), JsiSkRect_1.JsiSkRect.fromValue(this.CanvasKit, src), JsiSkRect_1.JsiSkRect.fromValue(this.CanvasKit, dest), JsiSkPaint_1.JsiSkPaint.fromValue(paint), fastSample);
    }
    drawImageCubic(img, left, top, B, C, paint) {
        this.ref.drawImageCubic(JsiSkImage_1.JsiSkImage.fromValue(img), left, top, B, C, paint ? JsiSkPaint_1.JsiSkPaint.fromValue(paint) : paint);
    }
    drawImageOptions(img, left, top, fm, mm, paint) {
        this.ref.drawImageOptions(JsiSkImage_1.JsiSkImage.fromValue(img), left, top, (0, Host_1.getEnum)(this.CanvasKit, "FilterMode", fm), (0, Host_1.getEnum)(this.CanvasKit, "MipmapMode", mm), paint ? JsiSkPaint_1.JsiSkPaint.fromValue(paint) : paint);
    }
    drawImageNine(img, center, dest, filter, paint) {
        this.ref.drawImageNine(JsiSkImage_1.JsiSkImage.fromValue(img), Array.from(JsiSkRect_1.JsiSkRect.fromValue(this.CanvasKit, center)), JsiSkRect_1.JsiSkRect.fromValue(this.CanvasKit, dest), (0, Host_1.getEnum)(this.CanvasKit, "FilterMode", filter), paint ? JsiSkPaint_1.JsiSkPaint.fromValue(paint) : paint);
    }
    drawImageRectCubic(img, src, dest, B, C, paint) {
        this.ref.drawImageRectCubic(JsiSkImage_1.JsiSkImage.fromValue(img), JsiSkRect_1.JsiSkRect.fromValue(this.CanvasKit, src), JsiSkRect_1.JsiSkRect.fromValue(this.CanvasKit, dest), B, C, paint ? JsiSkPaint_1.JsiSkPaint.fromValue(paint) : paint);
    }
    drawImageRectOptions(img, src, dest, fm, mm, paint) {
        this.ref.drawImageRectOptions(JsiSkImage_1.JsiSkImage.fromValue(img), JsiSkRect_1.JsiSkRect.fromValue(this.CanvasKit, src), JsiSkRect_1.JsiSkRect.fromValue(this.CanvasKit, dest), (0, Host_1.getEnum)(this.CanvasKit, "FilterMode", fm), (0, Host_1.getEnum)(this.CanvasKit, "MipmapMode", mm), paint ? JsiSkPaint_1.JsiSkPaint.fromValue(paint) : paint);
    }
    drawPaint(paint) {
        this.ref.drawPaint(JsiSkPaint_1.JsiSkPaint.fromValue(paint));
    }
    drawLine(x0, y0, x1, y1, paint) {
        this.ref.drawLine(x0, y0, x1, y1, JsiSkPaint_1.JsiSkPaint.fromValue(paint));
    }
    drawCircle(cx, cy, radius, paint) {
        this.ref.drawCircle(cx, cy, radius, JsiSkPaint_1.JsiSkPaint.fromValue(paint));
    }
    drawVertices(verts, mode, paint) {
        this.ref.drawVertices(JsiSkVertices_1.JsiSkVertices.fromValue(verts), (0, Host_1.getEnum)(this.CanvasKit, "BlendMode", mode), JsiSkPaint_1.JsiSkPaint.fromValue(paint));
    }
    drawPatch(cubics, colors, texs, mode, paint) {
        this.ref.drawPatch(cubics.map(({ x, y }) => [x, y]).flat(), colors, texs ? texs.flatMap((p) => Array.from(JsiSkPoint_1.JsiSkPoint.fromValue(p))) : texs, mode ? (0, Host_1.getEnum)(this.CanvasKit, "BlendMode", mode) : null, paint ? JsiSkPaint_1.JsiSkPaint.fromValue(paint) : undefined);
    }
    restoreToCount(saveCount) {
        this.ref.restoreToCount(saveCount);
    }
    getTotalMatrix() {
        return new JsiSkMatrix_1.JsiSkMatrix(this.CanvasKit, Float32Array.of(...this.ref.getTotalMatrix()));
    }
    drawPoints(mode, points, paint) {
        this.ref.drawPoints((0, Host_1.getEnum)(this.CanvasKit, "PointMode", mode), points.map(({ x, y }) => [x, y]).flat(), JsiSkPaint_1.JsiSkPaint.fromValue(paint));
    }
    drawArc(oval, startAngle, sweepAngle, useCenter, paint) {
        this.ref.drawArc(JsiSkRect_1.JsiSkRect.fromValue(this.CanvasKit, oval), startAngle, sweepAngle, useCenter, JsiSkPaint_1.JsiSkPaint.fromValue(paint));
    }
    drawRRect(rrect, paint) {
        this.ref.drawRRect(JsiSkRRect_1.JsiSkRRect.fromValue(this.CanvasKit, rrect), JsiSkPaint_1.JsiSkPaint.fromValue(paint));
    }
    drawDRRect(outer, inner, paint) {
        this.ref.drawDRRect(JsiSkRRect_1.JsiSkRRect.fromValue(this.CanvasKit, outer), JsiSkRRect_1.JsiSkRRect.fromValue(this.CanvasKit, inner), JsiSkPaint_1.JsiSkPaint.fromValue(paint));
    }
    drawOval(oval, paint) {
        this.ref.drawOval(JsiSkRect_1.JsiSkRect.fromValue(this.CanvasKit, oval), JsiSkPaint_1.JsiSkPaint.fromValue(paint));
    }
    drawPath(path, paint) {
        const p = JsiSkPath_1.JsiSkPath.pathFromValue(path);
        this.ref.drawPath(p, JsiSkPaint_1.JsiSkPaint.fromValue(paint));
        p.delete();
    }
    drawText(str, x, y, paint, font) {
        this.ref.drawText(str, x, y, JsiSkPaint_1.JsiSkPaint.fromValue(paint), JsiSkFont_1.JsiSkFont.fromValue(font));
    }
    drawTextBlob(blob, x, y, paint) {
        this.ref.drawTextBlob(JsiSkTextBlob_1.JsiSkTextBlob.fromValue(blob), x, y, JsiSkPaint_1.JsiSkPaint.fromValue(paint));
    }
    drawGlyphs(glyphs, positions, x, y, font, paint) {
        this.ref.drawGlyphs(glyphs, positions.map((p) => [p.x, p.y]).flat(), x, y, JsiSkFont_1.JsiSkFont.fromValue(font), JsiSkPaint_1.JsiSkPaint.fromValue(paint));
    }
    drawSvg(svg, _width, _height) {
        const image = this.CanvasKit.MakeImageFromCanvasImageSource(svg.ref);
        this.ref.drawImage(image, 0, 0);
    }
    save() {
        return this.ref.save();
    }
    saveLayer(paint, bounds, backdrop, flags) {
        return this.ref.saveLayer(paint ? JsiSkPaint_1.JsiSkPaint.fromValue(paint) : undefined, bounds ? JsiSkRect_1.JsiSkRect.fromValue(this.CanvasKit, bounds) : bounds, backdrop ? JsiSkImageFilter_1.JsiSkImageFilter.fromValue(backdrop) : backdrop, flags);
    }
    restore() {
        this.ref.restore();
    }
    rotate(rotationInDegrees, rx, ry) {
        this.ref.rotate(rotationInDegrees, rx, ry);
    }
    scale(sx, sy) {
        this.ref.scale(sx, sy);
    }
    skew(sx, sy) {
        this.ref.skew(sx, sy);
    }
    translate(dx, dy) {
        this.ref.translate(dx, dy);
    }
    drawColor(color, blendMode) {
        this.ref.drawColor(color, blendMode ? (0, Host_1.getEnum)(this.CanvasKit, "BlendMode", blendMode) : undefined);
    }
    clear(color) {
        this.ref.clear(color);
    }
    clipPath(path, op, doAntiAlias) {
        const p = JsiSkPath_1.JsiSkPath.pathFromValue(path);
        this.ref.clipPath(p, (0, Host_1.getEnum)(this.CanvasKit, "PathOp", op), doAntiAlias);
        p.delete();
    }
    clipRect(rect, op, doAntiAlias) {
        this.ref.clipRect(JsiSkRect_1.JsiSkRect.fromValue(this.CanvasKit, rect), (0, Host_1.getEnum)(this.CanvasKit, "PathOp", op), doAntiAlias);
    }
    clipRRect(rrect, op, doAntiAlias) {
        this.ref.clipRRect(JsiSkRRect_1.JsiSkRRect.fromValue(this.CanvasKit, rrect), (0, Host_1.getEnum)(this.CanvasKit, "PathOp", op), doAntiAlias);
    }
    concat(m) {
        this.ref.concat(Array.isArray(m) ? m : JsiSkMatrix_1.JsiSkMatrix.fromValue(m));
    }
    drawPicture(skp) {
        this.ref.drawPicture(JsiSkPicture_1.JsiSkPicture.fromValue(skp));
    }
    drawAtlas(atlas, srcs, dsts, paint, blendMode, colors, sampling) {
        const src = srcs.flatMap((s) => Array.from(JsiSkRect_1.JsiSkRect.fromValue(this.CanvasKit, s)));
        const dst = dsts.flatMap((s) => Array.from(JsiSkRSXform_1.JsiSkRSXform.fromValue(s)));
        let cls;
        if (colors) {
            cls = new Uint32Array(colors.length);
            for (let i = 0; i < colors.length; i++) {
                const [r, g, b, a] = colors[i];
                cls[i] = this.CanvasKit.ColorAsInt(r * 255, g * 255, b * 255, a * 255);
            }
        }
        let ckSampling = {
            filter: this.CanvasKit.FilterMode.Linear,
            mipmap: this.CanvasKit.MipmapMode.None,
        };
        if (sampling && (0, types_1.isCubicSampling)(sampling)) {
            ckSampling = sampling;
        }
        else if (sampling) {
            ckSampling = {
                filter: (0, Host_1.getEnum)(this.CanvasKit, "FilterMode", sampling.filter),
                mipmap: sampling.mipmap
                    ? (0, Host_1.getEnum)(this.CanvasKit, "MipmapMode", sampling.mipmap)
                    : this.CanvasKit.MipmapMode.None,
            };
        }
        this.ref.drawAtlas(JsiSkImage_1.JsiSkImage.fromValue(atlas), src, dst, JsiSkPaint_1.JsiSkPaint.fromValue(paint), blendMode
            ? (0, Host_1.getEnum)(this.CanvasKit, "BlendMode", blendMode)
            : this.CanvasKit.BlendMode.DstOver, cls, ckSampling);
    }
    readPixels(srcX, srcY, imageInfo) {
        const pxInfo = {
            width: imageInfo.width,
            height: imageInfo.height,
            colorSpace: this.CanvasKit.ColorSpace.SRGB,
            alphaType: (0, Host_1.getEnum)(this.CanvasKit, "AlphaType", imageInfo.alphaType),
            colorType: (0, Host_1.getEnum)(this.CanvasKit, "ColorType", imageInfo.colorType),
        };
        return this.ref.readPixels(srcX, srcY, pxInfo);
    }
}
exports.JsiSkCanvas = JsiSkCanvas;

},
"node_modules/@shopify/react-native-skia/src/skia/types/index.ts":function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/Picture/index.ts"), exports);
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/Data/index.ts"), exports);
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/SVG/index.ts"), exports);
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/Surface/index.ts"), exports);
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/Vertices/index.ts"), exports);
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/RuntimeEffect/index.ts"), exports);
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/Shader/index.ts"), exports);
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/Image/index.ts"), exports);
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/AnimatedImage/index.ts"), exports);
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/ColorFilter/index.ts"), exports);
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/ImageFilter/index.ts"), exports);
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/Font/index.ts"), exports);
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/Typeface/index.ts"), exports);
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/Paint/index.ts"), exports);
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/Path/index.ts"), exports);
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/Color.ts"), exports);
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/Canvas.ts"), exports);
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/ContourMeasure.tsx"), exports);
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/MaskFilter.ts"), exports);
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/Matrix.ts"), exports);
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/PathEffect.ts"), exports);
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/Point.ts"), exports);
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/Rect.ts"), exports);
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/RRect.ts"), exports);
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/RSXform.ts"), exports);
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/JsiInstance.ts"), exports);
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/Skia.ts"), exports);
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/TextBlob.ts"), exports);
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/Size.ts"), exports);
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/Paragraph/index.ts"), exports);
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/Matrix4.ts"), exports);
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/NativeBuffer/index.ts"), exports);
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/Recorder.ts"), exports);
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/Video/index.ts"), exports);
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/Skottie.ts"), exports);

},
"node_modules/@shopify/react-native-skia/src/skia/types/Picture/index.ts":function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/Picture/Picture.ts"), exports);
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/Picture/PictureRecorder.ts"), exports);
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/Picture/PictureFactory.ts"), exports);

},
"node_modules/@shopify/react-native-skia/src/skia/types/Picture/Picture.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},
"node_modules/@shopify/react-native-skia/src/skia/types/Picture/PictureRecorder.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},
"node_modules/@shopify/react-native-skia/src/skia/types/Picture/PictureFactory.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},
"node_modules/@shopify/react-native-skia/src/skia/types/Data/index.ts":function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/Data/Data.ts"), exports);
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/Data/DataFactory.ts"), exports);

},
"node_modules/@shopify/react-native-skia/src/skia/types/Data/Data.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRNModule = void 0;
const isRNModule = (mod) => typeof mod === "number";
exports.isRNModule = isRNModule;

},
"node_modules/@shopify/react-native-skia/src/skia/types/Data/DataFactory.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},
"node_modules/@shopify/react-native-skia/src/skia/types/SVG/index.ts":function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/SVG/SVG.ts"), exports);
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/SVG/SVGFactory.ts"), exports);

},
"node_modules/@shopify/react-native-skia/src/skia/types/SVG/SVG.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},
"node_modules/@shopify/react-native-skia/src/skia/types/SVG/SVGFactory.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},
"node_modules/@shopify/react-native-skia/src/skia/types/Surface/index.ts":function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/Surface/Surface.ts"), exports);
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/Surface/SurfaceFactory.ts"), exports);

},
"node_modules/@shopify/react-native-skia/src/skia/types/Surface/Surface.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},
"node_modules/@shopify/react-native-skia/src/skia/types/Surface/SurfaceFactory.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ColorSpace = void 0;
exports.ColorSpace = {
    SRGB: "srgb",
    DisplayP3: "display-p3",
};

},
"node_modules/@shopify/react-native-skia/src/skia/types/Vertices/index.ts":function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/Vertices/Vertices.tsx"), exports);

},
"node_modules/@shopify/react-native-skia/src/skia/types/Vertices/Vertices.tsx":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VertexMode = void 0;
var VertexMode;
(function (VertexMode) {
    VertexMode[VertexMode["Triangles"] = 0] = "Triangles";
    VertexMode[VertexMode["TriangleStrip"] = 1] = "TriangleStrip";
    VertexMode[VertexMode["TriangleFan"] = 2] = "TriangleFan";
})(VertexMode || (exports.VertexMode = VertexMode = {}));

},
"node_modules/@shopify/react-native-skia/src/skia/types/RuntimeEffect/index.ts":function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/RuntimeEffect/RuntimeEffect.ts"), exports);
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/RuntimeEffect/RuntimeEffectFactory.ts"), exports);

},
"node_modules/@shopify/react-native-skia/src/skia/types/RuntimeEffect/RuntimeEffect.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},
"node_modules/@shopify/react-native-skia/src/skia/types/RuntimeEffect/RuntimeEffectFactory.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},
"node_modules/@shopify/react-native-skia/src/skia/types/Shader/index.ts":function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/Shader/Shader.ts"), exports);
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/Shader/ShaderFactory.ts"), exports);

},
"node_modules/@shopify/react-native-skia/src/skia/types/Shader/Shader.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processUniforms = exports.isShader = void 0;
const isShader = (obj) => obj !== null && obj.__typename__ === "Shader";
exports.isShader = isShader;
const isVector = (obj) => {
    "worklet";
    return obj.x !== undefined && obj.y !== undefined;
};
function processValue(values, value) {
    "worklet";
    if (typeof value === "number") {
        values.push(value);
    }
    else if (Array.isArray(value)) {
        value.forEach((v) => processValue(values, v));
    }
    else if (isVector(value)) {
        values.push(value.x, value.y);
    }
    else if (value instanceof Float32Array) {
        values.push(...value);
    }
}
const processUniforms = (source, uniforms, builder) => {
    "worklet";
    const result = [];
    const uniformsCount = source.getUniformCount();
    for (let i = 0; i < uniformsCount; i++) {
        const name = source.getUniformName(i);
        const value = uniforms[name];
        if (value === undefined) {
            throw new Error(`The runtime effect has the uniform value "${name}" declared, but it is missing from the uniforms property of the Runtime effect.`);
        }
        if (builder === undefined) {
            processValue(result, value);
        }
        else {
            const uniformValue = [];
            processValue(uniformValue, value);
            builder.setUniform(name, uniformValue);
            result.push(...uniformValue);
        }
    }
    return result;
};
exports.processUniforms = processUniforms;

},
"node_modules/@shopify/react-native-skia/src/skia/types/Shader/ShaderFactory.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},
"node_modules/@shopify/react-native-skia/src/skia/types/Image/index.ts":function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/Image/Image.ts"), exports);
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/Image/ImageFactory.ts"), exports);
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/Image/ColorType.ts"), exports);

},
"node_modules/@shopify/react-native-skia/src/skia/types/Image/Image.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MakeCubic = exports.CubicSampling = exports.CatmullRomCubicSampling = exports.MitchellCubicSampling = exports.isCubicSampling = exports.ImageFormat = exports.MipmapMode = exports.FilterMode = void 0;
var FilterMode;
(function (FilterMode) {
    FilterMode[FilterMode["Nearest"] = 0] = "Nearest";
    FilterMode[FilterMode["Linear"] = 1] = "Linear";
})(FilterMode || (exports.FilterMode = FilterMode = {}));
var MipmapMode;
(function (MipmapMode) {
    MipmapMode[MipmapMode["None"] = 0] = "None";
    MipmapMode[MipmapMode["Nearest"] = 1] = "Nearest";
    MipmapMode[MipmapMode["Linear"] = 2] = "Linear";
})(MipmapMode || (exports.MipmapMode = MipmapMode = {}));
var ImageFormat;
(function (ImageFormat) {
    ImageFormat[ImageFormat["JPEG"] = 3] = "JPEG";
    ImageFormat[ImageFormat["PNG"] = 4] = "PNG";
    ImageFormat[ImageFormat["WEBP"] = 6] = "WEBP";
})(ImageFormat || (exports.ImageFormat = ImageFormat = {}));
const isCubicSampling = (sampling) => {
    "worklet";
    return "B" in sampling && "C" in sampling;
};
exports.isCubicSampling = isCubicSampling;
exports.MitchellCubicSampling = { B: 1 / 3.0, C: 1 / 3.0 };
exports.CatmullRomCubicSampling = { B: 0, C: 1 / 2.0 };
exports.CubicSampling = { B: 0, C: 0 };
const MakeCubic = (B, C) => ({ B, C });
exports.MakeCubic = MakeCubic;

},
"node_modules/@shopify/react-native-skia/src/skia/types/Image/ImageFactory.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlphaType = void 0;
var AlphaType;
(function (AlphaType) {
    AlphaType[AlphaType["Unknown"] = 0] = "Unknown";
    AlphaType[AlphaType["Opaque"] = 1] = "Opaque";
    AlphaType[AlphaType["Premul"] = 2] = "Premul";
    AlphaType[AlphaType["Unpremul"] = 3] = "Unpremul";
})(AlphaType || (exports.AlphaType = AlphaType = {}));

},
"node_modules/@shopify/react-native-skia/src/skia/types/Image/ColorType.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ColorType = void 0;
var ColorType;
(function (ColorType) {
    ColorType[ColorType["Unknown"] = 0] = "Unknown";
    ColorType[ColorType["Alpha_8"] = 1] = "Alpha_8";
    ColorType[ColorType["RGB_565"] = 2] = "RGB_565";
    ColorType[ColorType["ARGB_4444"] = 3] = "ARGB_4444";
    ColorType[ColorType["RGBA_8888"] = 4] = "RGBA_8888";
    ColorType[ColorType["RGB_888x"] = 5] = "RGB_888x";
    ColorType[ColorType["BGRA_8888"] = 6] = "BGRA_8888";
    ColorType[ColorType["RGBA_1010102"] = 7] = "RGBA_1010102";
    ColorType[ColorType["BGRA_1010102"] = 8] = "BGRA_1010102";
    ColorType[ColorType["RGB_101010x"] = 9] = "RGB_101010x";
    ColorType[ColorType["BGR_101010x"] = 10] = "BGR_101010x";
    ColorType[ColorType["BGR_101010x_XR"] = 11] = "BGR_101010x_XR";
    ColorType[ColorType["BGRA_10101010_XR"] = 12] = "BGRA_10101010_XR";
    ColorType[ColorType["RGBA_10x6"] = 13] = "RGBA_10x6";
    ColorType[ColorType["Gray_8"] = 14] = "Gray_8";
    ColorType[ColorType["RGBA_F16Norm"] = 15] = "RGBA_F16Norm";
    ColorType[ColorType["RGBA_F16"] = 16] = "RGBA_F16";
    ColorType[ColorType["RGB_F16F16F16x"] = 17] = "RGB_F16F16F16x";
    ColorType[ColorType["RGBA_F32"] = 18] = "RGBA_F32";
})(ColorType || (exports.ColorType = ColorType = {}));

},
"node_modules/@shopify/react-native-skia/src/skia/types/AnimatedImage/index.ts":function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/AnimatedImage/AnimatedImage.ts"), exports);
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/AnimatedImage/AnimatedImageFactory.ts"), exports);

},
"node_modules/@shopify/react-native-skia/src/skia/types/AnimatedImage/AnimatedImage.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},
"node_modules/@shopify/react-native-skia/src/skia/types/AnimatedImage/AnimatedImageFactory.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},
"node_modules/@shopify/react-native-skia/src/skia/types/ColorFilter/index.ts":function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/ColorFilter/ColorFilter.ts"), exports);
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/ColorFilter/ColorFilterFactory.ts"), exports);

},
"node_modules/@shopify/react-native-skia/src/skia/types/ColorFilter/ColorFilter.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isColorFilter = void 0;
const isColorFilter = (obj) => obj !== null && obj.__typename__ === "ColorFilter";
exports.isColorFilter = isColorFilter;

},
"node_modules/@shopify/react-native-skia/src/skia/types/ColorFilter/ColorFilterFactory.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},
"node_modules/@shopify/react-native-skia/src/skia/types/ImageFilter/index.ts":function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/ImageFilter/ImageFilter.ts"), exports);
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/ImageFilter/ImageFilterFactory.ts"), exports);

},
"node_modules/@shopify/react-native-skia/src/skia/types/ImageFilter/ImageFilter.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isImageFilter = exports.TileMode = void 0;
var TileMode;
(function (TileMode) {
    TileMode[TileMode["Clamp"] = 0] = "Clamp";
    TileMode[TileMode["Repeat"] = 1] = "Repeat";
    TileMode[TileMode["Mirror"] = 2] = "Mirror";
    TileMode[TileMode["Decal"] = 3] = "Decal";
})(TileMode || (exports.TileMode = TileMode = {}));
const isImageFilter = (obj) => obj !== null && obj.__typename__ === "ImageFilter";
exports.isImageFilter = isImageFilter;

},
"node_modules/@shopify/react-native-skia/src/skia/types/ImageFilter/ImageFilterFactory.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ColorChannel = void 0;
var ColorChannel;
(function (ColorChannel) {
    ColorChannel[ColorChannel["R"] = 0] = "R";
    ColorChannel[ColorChannel["G"] = 1] = "G";
    ColorChannel[ColorChannel["B"] = 2] = "B";
    ColorChannel[ColorChannel["A"] = 3] = "A";
})(ColorChannel || (exports.ColorChannel = ColorChannel = {}));

},
"node_modules/@shopify/react-native-skia/src/skia/types/Font/index.ts":function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/Font/Font.ts"), exports);
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/Font/FontMgr.ts"), exports);
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/Font/FontMgrFactory.ts"), exports);

},
"node_modules/@shopify/react-native-skia/src/skia/types/Font/Font.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FontStyle = exports.FontHinting = exports.FontEdging = exports.FontSlant = exports.FontWidth = exports.FontWeight = void 0;
const fontStyle = (weight, width, slant) => ({ weight, width, slant });
var FontWeight;
(function (FontWeight) {
    FontWeight[FontWeight["Invisible"] = 0] = "Invisible";
    FontWeight[FontWeight["Thin"] = 100] = "Thin";
    FontWeight[FontWeight["ExtraLight"] = 200] = "ExtraLight";
    FontWeight[FontWeight["Light"] = 300] = "Light";
    FontWeight[FontWeight["Normal"] = 400] = "Normal";
    FontWeight[FontWeight["Medium"] = 500] = "Medium";
    FontWeight[FontWeight["SemiBold"] = 600] = "SemiBold";
    FontWeight[FontWeight["Bold"] = 700] = "Bold";
    FontWeight[FontWeight["ExtraBold"] = 800] = "ExtraBold";
    FontWeight[FontWeight["Black"] = 900] = "Black";
    FontWeight[FontWeight["ExtraBlack"] = 1000] = "ExtraBlack";
})(FontWeight || (exports.FontWeight = FontWeight = {}));
var FontWidth;
(function (FontWidth) {
    FontWidth[FontWidth["UltraCondensed"] = 1] = "UltraCondensed";
    FontWidth[FontWidth["ExtraCondensed"] = 2] = "ExtraCondensed";
    FontWidth[FontWidth["Condensed"] = 3] = "Condensed";
    FontWidth[FontWidth["SemiCondensed"] = 4] = "SemiCondensed";
    FontWidth[FontWidth["Normal"] = 5] = "Normal";
    FontWidth[FontWidth["SemiExpanded"] = 6] = "SemiExpanded";
    FontWidth[FontWidth["Expanded"] = 7] = "Expanded";
    FontWidth[FontWidth["ExtraExpanded"] = 8] = "ExtraExpanded";
    FontWidth[FontWidth["UltraExpanded"] = 9] = "UltraExpanded";
})(FontWidth || (exports.FontWidth = FontWidth = {}));
var FontSlant;
(function (FontSlant) {
    FontSlant[FontSlant["Upright"] = 0] = "Upright";
    FontSlant[FontSlant["Italic"] = 1] = "Italic";
    FontSlant[FontSlant["Oblique"] = 2] = "Oblique";
})(FontSlant || (exports.FontSlant = FontSlant = {}));
var FontEdging;
(function (FontEdging) {
    FontEdging[FontEdging["Alias"] = 0] = "Alias";
    FontEdging[FontEdging["AntiAlias"] = 1] = "AntiAlias";
    FontEdging[FontEdging["SubpixelAntiAlias"] = 2] = "SubpixelAntiAlias";
})(FontEdging || (exports.FontEdging = FontEdging = {}));
var FontHinting;
(function (FontHinting) {
    FontHinting[FontHinting["None"] = 0] = "None";
    FontHinting[FontHinting["Slight"] = 1] = "Slight";
    FontHinting[FontHinting["Normal"] = 2] = "Normal";
    FontHinting[FontHinting["Full"] = 3] = "Full";
})(FontHinting || (exports.FontHinting = FontHinting = {}));
exports.FontStyle = {
    Normal: fontStyle(FontWeight.Normal, FontWidth.Normal, FontSlant.Upright),
    Bold: fontStyle(FontWeight.Bold, FontWidth.Normal, FontSlant.Upright),
    Italic: fontStyle(FontWeight.Normal, FontWidth.Normal, FontSlant.Italic),
    BoldItalic: fontStyle(FontWeight.Bold, FontWidth.Normal, FontSlant.Italic),
};

},
"node_modules/@shopify/react-native-skia/src/skia/types/Font/FontMgr.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},
"node_modules/@shopify/react-native-skia/src/skia/types/Font/FontMgrFactory.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},
"node_modules/@shopify/react-native-skia/src/skia/types/Typeface/index.ts":function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/Typeface/Typeface.ts"), exports);
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/Typeface/TypefaceFactory.ts"), exports);

},
"node_modules/@shopify/react-native-skia/src/skia/types/Typeface/Typeface.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},
"node_modules/@shopify/react-native-skia/src/skia/types/Typeface/TypefaceFactory.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},
"node_modules/@shopify/react-native-skia/src/skia/types/Paint/index.ts":function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/Paint/Paint.ts"), exports);
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/Paint/BlendMode.ts"), exports);

},
"node_modules/@shopify/react-native-skia/src/skia/types/Paint/Paint.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPaint = exports.StrokeJoin = exports.StrokeCap = exports.PaintStyle = void 0;
var PaintStyle;
(function (PaintStyle) {
    PaintStyle[PaintStyle["Fill"] = 0] = "Fill";
    PaintStyle[PaintStyle["Stroke"] = 1] = "Stroke";
})(PaintStyle || (exports.PaintStyle = PaintStyle = {}));
var StrokeCap;
(function (StrokeCap) {
    StrokeCap[StrokeCap["Butt"] = 0] = "Butt";
    StrokeCap[StrokeCap["Round"] = 1] = "Round";
    StrokeCap[StrokeCap["Square"] = 2] = "Square";
})(StrokeCap || (exports.StrokeCap = StrokeCap = {}));
var StrokeJoin;
(function (StrokeJoin) {
    StrokeJoin[StrokeJoin["Miter"] = 0] = "Miter";
    StrokeJoin[StrokeJoin["Round"] = 1] = "Round";
    StrokeJoin[StrokeJoin["Bevel"] = 2] = "Bevel";
})(StrokeJoin || (exports.StrokeJoin = StrokeJoin = {}));
const isPaint = (obj) => obj !== null && obj.__typename__ === "Paint";
exports.isPaint = isPaint;

},
"node_modules/@shopify/react-native-skia/src/skia/types/Paint/BlendMode.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlendMode = void 0;
var BlendMode;
(function (BlendMode) {
    BlendMode[BlendMode["Clear"] = 0] = "Clear";
    BlendMode[BlendMode["Src"] = 1] = "Src";
    BlendMode[BlendMode["Dst"] = 2] = "Dst";
    BlendMode[BlendMode["SrcOver"] = 3] = "SrcOver";
    BlendMode[BlendMode["DstOver"] = 4] = "DstOver";
    BlendMode[BlendMode["SrcIn"] = 5] = "SrcIn";
    BlendMode[BlendMode["DstIn"] = 6] = "DstIn";
    BlendMode[BlendMode["SrcOut"] = 7] = "SrcOut";
    BlendMode[BlendMode["DstOut"] = 8] = "DstOut";
    BlendMode[BlendMode["SrcATop"] = 9] = "SrcATop";
    BlendMode[BlendMode["DstATop"] = 10] = "DstATop";
    BlendMode[BlendMode["Xor"] = 11] = "Xor";
    BlendMode[BlendMode["Plus"] = 12] = "Plus";
    BlendMode[BlendMode["Modulate"] = 13] = "Modulate";
    BlendMode[BlendMode["Screen"] = 14] = "Screen";
    BlendMode[BlendMode["Overlay"] = 15] = "Overlay";
    BlendMode[BlendMode["Darken"] = 16] = "Darken";
    BlendMode[BlendMode["Lighten"] = 17] = "Lighten";
    BlendMode[BlendMode["ColorDodge"] = 18] = "ColorDodge";
    BlendMode[BlendMode["ColorBurn"] = 19] = "ColorBurn";
    BlendMode[BlendMode["HardLight"] = 20] = "HardLight";
    BlendMode[BlendMode["SoftLight"] = 21] = "SoftLight";
    BlendMode[BlendMode["Difference"] = 22] = "Difference";
    BlendMode[BlendMode["Exclusion"] = 23] = "Exclusion";
    BlendMode[BlendMode["Multiply"] = 24] = "Multiply";
    BlendMode[BlendMode["Hue"] = 25] = "Hue";
    BlendMode[BlendMode["Saturation"] = 26] = "Saturation";
    BlendMode[BlendMode["Color"] = 27] = "Color";
    BlendMode[BlendMode["Luminosity"] = 28] = "Luminosity";
    BlendMode[BlendMode["PlusDarker"] = 1001] = "PlusDarker";
    BlendMode[BlendMode["PlusLighter"] = 1002] = "PlusLighter";
})(BlendMode || (exports.BlendMode = BlendMode = {}));

},
"node_modules/@shopify/react-native-skia/src/skia/types/Path/index.ts":function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/Path/Path.ts"), exports);
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/Path/PathBuilder.ts"), exports);
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/Path/PathBuilderFactory.ts"), exports);
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/Path/PathFactory.ts"), exports);

},
"node_modules/@shopify/react-native-skia/src/skia/types/Path/Path.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPath = exports.PathVerb = exports.PathOp = exports.FillType = void 0;
var FillType;
(function (FillType) {
    FillType[FillType["Winding"] = 0] = "Winding";
    FillType[FillType["EvenOdd"] = 1] = "EvenOdd";
    FillType[FillType["InverseWinding"] = 2] = "InverseWinding";
    FillType[FillType["InverseEvenOdd"] = 3] = "InverseEvenOdd";
})(FillType || (exports.FillType = FillType = {}));
var PathOp;
(function (PathOp) {
    PathOp[PathOp["Difference"] = 0] = "Difference";
    PathOp[PathOp["Intersect"] = 1] = "Intersect";
    PathOp[PathOp["Union"] = 2] = "Union";
    PathOp[PathOp["XOR"] = 3] = "XOR";
    PathOp[PathOp["ReverseDifference"] = 4] = "ReverseDifference";
})(PathOp || (exports.PathOp = PathOp = {}));
var PathVerb;
(function (PathVerb) {
    PathVerb[PathVerb["Move"] = 0] = "Move";
    PathVerb[PathVerb["Line"] = 1] = "Line";
    PathVerb[PathVerb["Quad"] = 2] = "Quad";
    PathVerb[PathVerb["Conic"] = 3] = "Conic";
    PathVerb[PathVerb["Cubic"] = 4] = "Cubic";
    PathVerb[PathVerb["Close"] = 5] = "Close";
})(PathVerb || (exports.PathVerb = PathVerb = {}));
const isPath = (obj) => {
    "worklet";
    return obj !== null && obj.__typename__ === "Path";
};
exports.isPath = isPath;

},
"node_modules/@shopify/react-native-skia/src/skia/types/Path/PathBuilder.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},
"node_modules/@shopify/react-native-skia/src/skia/types/Path/PathBuilderFactory.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},
"node_modules/@shopify/react-native-skia/src/skia/types/Path/PathFactory.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},
"node_modules/@shopify/react-native-skia/src/skia/types/Color.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},
"node_modules/@shopify/react-native-skia/src/skia/types/Canvas.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SaveLayerFlag = exports.ClipOp = void 0;
var ClipOp;
(function (ClipOp) {
    ClipOp[ClipOp["Difference"] = 0] = "Difference";
    ClipOp[ClipOp["Intersect"] = 1] = "Intersect";
})(ClipOp || (exports.ClipOp = ClipOp = {}));
var SaveLayerFlag;
(function (SaveLayerFlag) {
    SaveLayerFlag[SaveLayerFlag["SaveLayerInitWithPrevious"] = 4] = "SaveLayerInitWithPrevious";
    SaveLayerFlag[SaveLayerFlag["SaveLayerF16ColorType"] = 16] = "SaveLayerF16ColorType";
})(SaveLayerFlag || (exports.SaveLayerFlag = SaveLayerFlag = {}));

},
"node_modules/@shopify/react-native-skia/src/skia/types/ContourMeasure.tsx":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},
"node_modules/@shopify/react-native-skia/src/skia/types/MaskFilter.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isMaskFilter = exports.BlurStyle = void 0;
var BlurStyle;
(function (BlurStyle) {
    BlurStyle[BlurStyle["Normal"] = 0] = "Normal";
    BlurStyle[BlurStyle["Solid"] = 1] = "Solid";
    BlurStyle[BlurStyle["Outer"] = 2] = "Outer";
    BlurStyle[BlurStyle["Inner"] = 3] = "Inner";
})(BlurStyle || (exports.BlurStyle = BlurStyle = {}));
const isMaskFilter = (obj) => obj !== null && obj.__typename__ === "MaskFilter";
exports.isMaskFilter = isMaskFilter;

},
"node_modules/@shopify/react-native-skia/src/skia/types/Matrix.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toDegrees = exports.processTransform = exports.isMatrix = void 0;
const Matrix4_1 = require("node_modules/@shopify/react-native-skia/src/skia/types/Matrix4.ts");
const isMatrix = (obj) => obj !== null && obj.__typename__ === "Matrix";
exports.isMatrix = isMatrix;
const processTransform = (m, transforms) => {
    "worklet";
    const m3 = (0, Matrix4_1.processTransform3d)(transforms);
    m.concat(m3);
    return m;
};
exports.processTransform = processTransform;
const toDegrees = (rad) => {
    return (rad * 180) / Math.PI;
};
exports.toDegrees = toDegrees;

},
"node_modules/@shopify/react-native-skia/src/skia/types/Matrix4.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupCamera = exports.invert4 = exports.convertToAffineMatrix = exports.convertToColumnMajor3 = exports.convertToColumnMajor = exports.processTransform3d = exports.rotateY = exports.rotateX = exports.rotateZ = exports.scale = exports.pivot = exports.toMatrix3 = exports.multiply4 = exports.mapPoint3d = exports.matrixVecMul4 = exports.perspective = exports.translate = exports.Matrix4 = void 0;
const exhaustiveCheck = (a) => {
    "worklet";
    throw new Error(`Unexhaustive handling for ${a}`);
};
const Matrix4 = () => {
    "worklet";
    return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
};
exports.Matrix4 = Matrix4;
const translate = (x, y, z = 0) => {
    "worklet";
    return [1, 0, 0, x, 0, 1, 0, y, 0, 0, 1, z, 0, 0, 0, 1];
};
exports.translate = translate;
const perspective = (p) => {
    "worklet";
    return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, -1 / p, 1];
};
exports.perspective = perspective;
const normalizeVec = (vec) => {
    "worklet";
    const [x, y, z] = vec;
    const length = Math.sqrt(x * x + y * y + z * z);
    if (length === 0) {
        return [0, 0, 0];
    }
    return [x / length, y / length, z / length];
};
const rotatedUnitSinCos = (axisVec, sinAngle, cosAngle) => {
    "worklet";
    const x = axisVec[0];
    const y = axisVec[1];
    const z = axisVec[2];
    const c = cosAngle;
    const s = sinAngle;
    const t = 1 - c;
    return [
        t * x * x + c,
        t * x * y - s * z,
        t * x * z + s * y,
        0,
        t * x * y + s * z,
        t * y * y + c,
        t * y * z - s * x,
        0,
        t * x * z - s * y,
        t * y * z + s * x,
        t * z * z + c,
        0,
        0,
        0,
        0,
        1,
    ];
};
const matrixVecMul4 = (m, v) => {
    "worklet";
    return [
        m[0] * v[0] + m[1] * v[1] + m[2] * v[2] + m[3] * v[3],
        m[4] * v[0] + m[5] * v[1] + m[6] * v[2] + m[7] * v[3],
        m[8] * v[0] + m[9] * v[1] + m[10] * v[2] + m[11] * v[3],
        m[12] * v[0] + m[13] * v[1] + m[14] * v[2] + m[15] * v[3],
    ];
};
exports.matrixVecMul4 = matrixVecMul4;
const mapPoint3d = (m, v) => {
    "worklet";
    const r = (0, exports.matrixVecMul4)(m, [...v, 1]);
    return [r[0] / r[3], r[1] / r[3], r[2] / r[3]];
};
exports.mapPoint3d = mapPoint3d;
const multiply4 = (a, b) => {
    "worklet";
    const result = new Array(16).fill(0);
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            result[i * 4 + j] =
                a[i * 4] * b[j] +
                    a[i * 4 + 1] * b[j + 4] +
                    a[i * 4 + 2] * b[j + 8] +
                    a[i * 4 + 3] * b[j + 12];
        }
    }
    return result;
};
exports.multiply4 = multiply4;
const skewY = (angle) => {
    "worklet";
    return [1, Math.tan(angle), 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
};
const skewX = (angle) => {
    "worklet";
    return [1, 0, 0, 0, Math.tan(angle), 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
};
const toMatrix3 = (m) => {
    "worklet";
    return [m[0], m[1], m[3], m[4], m[5], m[7], m[12], m[13], m[15]];
};
exports.toMatrix3 = toMatrix3;
const rotate = (axis, value) => {
    "worklet";
    return rotatedUnitSinCos(normalizeVec(axis), Math.sin(value), Math.cos(value));
};
const pivot = (m, p) => {
    "worklet";
    return (0, exports.multiply4)((0, exports.translate)(p.x, p.y), (0, exports.multiply4)(m, (0, exports.translate)(-p.x, -p.y)));
};
exports.pivot = pivot;
const scale = (sx, sy, sz = 1, p) => {
    "worklet";
    const m4 = [sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0, 0, 0, 0, 1];
    if (p) {
        return (0, exports.pivot)(m4, p);
    }
    return m4;
};
exports.scale = scale;
const rotateAxis = (axis, angle, p) => {
    "worklet";
    const result = rotate(axis, angle);
    if (p) {
        return (0, exports.pivot)(result, p);
    }
    return result;
};
const rotateZ = (value, p) => {
    "worklet";
    return rotateAxis([0, 0, 1], value, p);
};
exports.rotateZ = rotateZ;
const rotateX = (value, p) => {
    "worklet";
    return rotateAxis([1, 0, 0], value, p);
};
exports.rotateX = rotateX;
const rotateY = (value, p) => {
    "worklet";
    return rotateAxis([0, 1, 0], value, p);
};
exports.rotateY = rotateY;
const processTransform3d = (transforms) => {
    "worklet";
    return transforms.reduce((acc, val) => {
        const key = Object.keys(val)[0];
        const transform = val;
        if (key === "translateX") {
            const value = transform[key];
            return (0, exports.multiply4)(acc, (0, exports.translate)(value, 0, 0));
        }
        if (key === "translate") {
            const [x, y, z = 0] = transform[key];
            return (0, exports.multiply4)(acc, (0, exports.translate)(x, y, z));
        }
        if (key === "translateY") {
            const value = transform[key];
            return (0, exports.multiply4)(acc, (0, exports.translate)(0, value, 0));
        }
        if (key === "translateZ") {
            const value = transform[key];
            return (0, exports.multiply4)(acc, (0, exports.translate)(0, 0, value));
        }
        if (key === "scale") {
            const value = transform[key];
            return (0, exports.multiply4)(acc, (0, exports.scale)(value, value, 1));
        }
        if (key === "scaleX") {
            const value = transform[key];
            return (0, exports.multiply4)(acc, (0, exports.scale)(value, 1, 1));
        }
        if (key === "scaleY") {
            const value = transform[key];
            return (0, exports.multiply4)(acc, (0, exports.scale)(1, value, 1));
        }
        if (key === "skewX") {
            const value = transform[key];
            return (0, exports.multiply4)(acc, skewX(value));
        }
        if (key === "skewY") {
            const value = transform[key];
            return (0, exports.multiply4)(acc, skewY(value));
        }
        if (key === "rotateX") {
            const value = transform[key];
            return (0, exports.multiply4)(acc, rotate([1, 0, 0], value));
        }
        if (key === "rotateY") {
            const value = transform[key];
            return (0, exports.multiply4)(acc, rotate([0, 1, 0], value));
        }
        if (key === "perspective") {
            const value = transform[key];
            return (0, exports.multiply4)(acc, (0, exports.perspective)(value));
        }
        if (key === "rotate" || key === "rotateZ") {
            const value = transform[key];
            return (0, exports.multiply4)(acc, rotate([0, 0, 1], value));
        }
        if (key === "matrix") {
            const value = transform[key];
            return (0, exports.multiply4)(acc, value);
        }
        return exhaustiveCheck(key);
    }, (0, exports.Matrix4)());
};
exports.processTransform3d = processTransform3d;
const convertToColumnMajor = (rowMajorMatrix) => {
    "worklet";
    const colMajorMatrix = new Array(16);
    const size = 4;
    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            colMajorMatrix[col * size + row] = rowMajorMatrix[row * size + col];
        }
    }
    return colMajorMatrix;
};
exports.convertToColumnMajor = convertToColumnMajor;
const convertToColumnMajor3 = (rowMajorMatrix) => {
    "worklet";
    const colMajorMatrix = new Array(9);
    const size = 3;
    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            colMajorMatrix[col * size + row] = rowMajorMatrix[row * size + col];
        }
    }
    return colMajorMatrix;
};
exports.convertToColumnMajor3 = convertToColumnMajor3;
const convertToAffineMatrix = (m4) => {
    "worklet";
    const a = m4[0];
    const b = m4[1];
    const c = m4[4];
    const d = m4[5];
    const tx = m4[12];
    const ty = m4[13];
    return [a, b, c, d, tx, ty];
};
exports.convertToAffineMatrix = convertToAffineMatrix;
const det3x3 = (a00, a01, a02, a10, a11, a12, a20, a21, a22) => {
    "worklet";
    return (a00 * (a11 * a22 - a12 * a21) +
        a01 * (a12 * a20 - a10 * a22) +
        a02 * (a10 * a21 - a11 * a20));
};
const invert4 = (m) => {
    "worklet";
    const a00 = m[0], a01 = m[1], a02 = m[2], a03 = m[3];
    const a10 = m[4], a11 = m[5], a12 = m[6], a13 = m[7];
    const a20 = m[8], a21 = m[9], a22 = m[10], a23 = m[11];
    const a30 = m[12], a31 = m[13], a32 = m[14], a33 = m[15];
    const b00 = det3x3(a11, a12, a13, a21, a22, a23, a31, a32, a33);
    const b01 = -det3x3(a10, a12, a13, a20, a22, a23, a30, a32, a33);
    const b02 = det3x3(a10, a11, a13, a20, a21, a23, a30, a31, a33);
    const b03 = -det3x3(a10, a11, a12, a20, a21, a22, a30, a31, a32);
    const b10 = -det3x3(a01, a02, a03, a21, a22, a23, a31, a32, a33);
    const b11 = det3x3(a00, a02, a03, a20, a22, a23, a30, a32, a33);
    const b12 = -det3x3(a00, a01, a03, a20, a21, a23, a30, a31, a33);
    const b13 = det3x3(a00, a01, a02, a20, a21, a22, a30, a31, a32);
    const b20 = det3x3(a01, a02, a03, a11, a12, a13, a31, a32, a33);
    const b21 = -det3x3(a00, a02, a03, a10, a12, a13, a30, a32, a33);
    const b22 = det3x3(a00, a01, a03, a10, a11, a13, a30, a31, a33);
    const b23 = -det3x3(a00, a01, a02, a10, a11, a12, a30, a31, a32);
    const b30 = -det3x3(a01, a02, a03, a11, a12, a13, a21, a22, a23);
    const b31 = det3x3(a00, a02, a03, a10, a12, a13, a20, a22, a23);
    const b32 = -det3x3(a00, a01, a03, a10, a11, a13, a20, a21, a23);
    const b33 = det3x3(a00, a01, a02, a10, a11, a12, a20, a21, a22);
    const det = a00 * b00 + a01 * b01 + a02 * b02 + a03 * b03;
    if (Math.abs(det) < 1e-8) {
        return (0, exports.Matrix4)();
    }
    const invDet = 1.0 / det;
    return [
        b00 * invDet,
        b10 * invDet,
        b20 * invDet,
        b30 * invDet,
        b01 * invDet,
        b11 * invDet,
        b21 * invDet,
        b31 * invDet,
        b02 * invDet,
        b12 * invDet,
        b22 * invDet,
        b32 * invDet,
        b03 * invDet,
        b13 * invDet,
        b23 * invDet,
        b33 * invDet,
    ];
};
exports.invert4 = invert4;
const vecSub = (a, b) => {
    "worklet";
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
};
const vecCross = (a, b) => {
    "worklet";
    return [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0],
    ];
};
const lookat = (eyeVec, centerVec, upVec) => {
    "worklet";
    const f = normalizeVec(vecSub(centerVec, eyeVec));
    const u = normalizeVec(upVec);
    const s = normalizeVec(vecCross(f, u));
    const uf = vecCross(s, f);
    const m = [
        s[0],
        uf[0],
        -f[0],
        eyeVec[0],
        s[1],
        uf[1],
        -f[1],
        eyeVec[1],
        s[2],
        uf[2],
        -f[2],
        eyeVec[2],
        0,
        0,
        0,
        1,
    ];
    return (0, exports.invert4)(m);
};
const perspectiveMatrix = (near, far, angle) => {
    "worklet";
    const dInv = 1 / (far - near);
    const halfAngle = angle / 2;
    const cot = Math.cos(halfAngle) / Math.sin(halfAngle);
    return [
        cot,
        0,
        0,
        0,
        0,
        cot,
        0,
        0,
        0,
        0,
        (far + near) * dInv,
        2 * far * near * dInv,
        0,
        0,
        -1,
        1,
    ];
};
const setupCamera = (area, zscale, cam) => {
    "worklet";
    const camera = lookat(cam.eye, cam.coa, cam.up);
    const p = perspectiveMatrix(cam.near, cam.far, cam.angle);
    const center = [(area[0] + area[2]) / 2, (area[1] + area[3]) / 2, 0];
    const viewScale = [
        (area[2] - area[0]) / 2,
        (area[3] - area[1]) / 2,
        zscale,
    ];
    const viewport = (0, exports.multiply4)((0, exports.translate)(center[0], center[1], center[2]), (0, exports.scale)(viewScale[0], viewScale[1], viewScale[2]));
    return (0, exports.multiply4)((0, exports.multiply4)(viewport, p), (0, exports.multiply4)(camera, (0, exports.invert4)(viewport)));
};
exports.setupCamera = setupCamera;

},
"node_modules/@shopify/react-native-skia/src/skia/types/PathEffect.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Path1DEffectStyle = exports.isPathEffect = void 0;
const isPathEffect = (obj) => obj !== null && obj.__typename__ === "PathEffect";
exports.isPathEffect = isPathEffect;
var Path1DEffectStyle;
(function (Path1DEffectStyle) {
    Path1DEffectStyle[Path1DEffectStyle["Translate"] = 0] = "Translate";
    Path1DEffectStyle[Path1DEffectStyle["Rotate"] = 1] = "Rotate";
    Path1DEffectStyle[Path1DEffectStyle["Morph"] = 2] = "Morph";
})(Path1DEffectStyle || (exports.Path1DEffectStyle = Path1DEffectStyle = {}));

},
"node_modules/@shopify/react-native-skia/src/skia/types/Point.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PointMode = void 0;
var PointMode;
(function (PointMode) {
    PointMode[PointMode["Points"] = 0] = "Points";
    PointMode[PointMode["Lines"] = 1] = "Lines";
    PointMode[PointMode["Polygon"] = 2] = "Polygon";
})(PointMode || (exports.PointMode = PointMode = {}));

},
"node_modules/@shopify/react-native-skia/src/skia/types/Rect.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRect = void 0;
const isRect = (def) => {
    "worklet";
    if (typeof def === "object" && def !== null) {
        const rect = def;
        return (typeof rect.x === "number" &&
            typeof rect.y === "number" &&
            typeof rect.width === "number" &&
            typeof rect.height === "number");
    }
    return false;
};
exports.isRect = isRect;

},
"node_modules/@shopify/react-native-skia/src/skia/types/RRect.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRRect = void 0;
const isRRect = (def) => {
    "worklet";
    return (typeof def === "object" &&
        def !== null &&
        typeof def.rect === "object");
};
exports.isRRect = isRRect;

},
"node_modules/@shopify/react-native-skia/src/skia/types/RSXform.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},
"node_modules/@shopify/react-native-skia/src/skia/types/JsiInstance.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},
"node_modules/@shopify/react-native-skia/src/skia/types/Skia.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},
"node_modules/@shopify/react-native-skia/src/skia/types/TextBlob.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},
"node_modules/@shopify/react-native-skia/src/skia/types/Size.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},
"node_modules/@shopify/react-native-skia/src/skia/types/Paragraph/index.ts":function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/Paragraph/TypefaceFontProvider.ts"), exports);
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/Paragraph/TypefaceFontProviderFactory.ts"), exports);
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/Paragraph/Paragraph.ts"), exports);
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/Paragraph/ParagraphBuilder.ts"), exports);
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/Paragraph/ParagraphStyle.ts"), exports);
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/Paragraph/TextStyle.ts"), exports);

},
"node_modules/@shopify/react-native-skia/src/skia/types/Paragraph/TypefaceFontProvider.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},
"node_modules/@shopify/react-native-skia/src/skia/types/Paragraph/TypefaceFontProviderFactory.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},
"node_modules/@shopify/react-native-skia/src/skia/types/Paragraph/Paragraph.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},
"node_modules/@shopify/react-native-skia/src/skia/types/Paragraph/ParagraphBuilder.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaceholderAlignment = void 0;
var PlaceholderAlignment;
(function (PlaceholderAlignment) {
    PlaceholderAlignment[PlaceholderAlignment["Baseline"] = 0] = "Baseline";
    PlaceholderAlignment[PlaceholderAlignment["AboveBaseline"] = 1] = "AboveBaseline";
    PlaceholderAlignment[PlaceholderAlignment["BelowBaseline"] = 2] = "BelowBaseline";
    PlaceholderAlignment[PlaceholderAlignment["Top"] = 3] = "Top";
    PlaceholderAlignment[PlaceholderAlignment["Bottom"] = 4] = "Bottom";
    PlaceholderAlignment[PlaceholderAlignment["Middle"] = 5] = "Middle";
})(PlaceholderAlignment || (exports.PlaceholderAlignment = PlaceholderAlignment = {}));

},
"node_modules/@shopify/react-native-skia/src/skia/types/Paragraph/ParagraphStyle.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextHeightBehavior = exports.TextAlign = exports.TextDirection = void 0;
var TextDirection;
(function (TextDirection) {
    TextDirection[TextDirection["RTL"] = 0] = "RTL";
    TextDirection[TextDirection["LTR"] = 1] = "LTR";
})(TextDirection || (exports.TextDirection = TextDirection = {}));
var TextAlign;
(function (TextAlign) {
    TextAlign[TextAlign["Left"] = 0] = "Left";
    TextAlign[TextAlign["Right"] = 1] = "Right";
    TextAlign[TextAlign["Center"] = 2] = "Center";
    TextAlign[TextAlign["Justify"] = 3] = "Justify";
    TextAlign[TextAlign["Start"] = 4] = "Start";
    TextAlign[TextAlign["End"] = 5] = "End";
})(TextAlign || (exports.TextAlign = TextAlign = {}));
var TextHeightBehavior;
(function (TextHeightBehavior) {
    TextHeightBehavior[TextHeightBehavior["All"] = 0] = "All";
    TextHeightBehavior[TextHeightBehavior["DisableFirstAscent"] = 1] = "DisableFirstAscent";
    TextHeightBehavior[TextHeightBehavior["DisableLastDescent"] = 2] = "DisableLastDescent";
    TextHeightBehavior[TextHeightBehavior["DisableAll"] = 3] = "DisableAll";
})(TextHeightBehavior || (exports.TextHeightBehavior = TextHeightBehavior = {}));

},
"node_modules/@shopify/react-native-skia/src/skia/types/Paragraph/TextStyle.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextBaseline = exports.TextDecorationStyle = exports.TextDecoration = void 0;
var TextDecoration;
(function (TextDecoration) {
    TextDecoration[TextDecoration["NoDecoration"] = 0] = "NoDecoration";
    TextDecoration[TextDecoration["Underline"] = 1] = "Underline";
    TextDecoration[TextDecoration["Overline"] = 2] = "Overline";
    TextDecoration[TextDecoration["LineThrough"] = 4] = "LineThrough";
})(TextDecoration || (exports.TextDecoration = TextDecoration = {}));
var TextDecorationStyle;
(function (TextDecorationStyle) {
    TextDecorationStyle[TextDecorationStyle["Solid"] = 0] = "Solid";
    TextDecorationStyle[TextDecorationStyle["Double"] = 1] = "Double";
    TextDecorationStyle[TextDecorationStyle["Dotted"] = 2] = "Dotted";
    TextDecorationStyle[TextDecorationStyle["Dashed"] = 3] = "Dashed";
    TextDecorationStyle[TextDecorationStyle["Wavy"] = 4] = "Wavy";
})(TextDecorationStyle || (exports.TextDecorationStyle = TextDecorationStyle = {}));
var TextBaseline;
(function (TextBaseline) {
    TextBaseline[TextBaseline["Alphabetic"] = 0] = "Alphabetic";
    TextBaseline[TextBaseline["Ideographic"] = 1] = "Ideographic";
})(TextBaseline || (exports.TextBaseline = TextBaseline = {}));

},
"node_modules/@shopify/react-native-skia/src/skia/types/NativeBuffer/index.ts":function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/NativeBuffer/NativeBufferFactory.ts"), exports);

},
"node_modules/@shopify/react-native-skia/src/skia/types/NativeBuffer/NativeBufferFactory.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isNativeBufferNode = exports.isNativeBufferWeb = exports.isNativeBufferAddr = exports.CanvasKitWebGLBuffer = void 0;
class CanvasKitWebGLBuffer {
}
exports.CanvasKitWebGLBuffer = CanvasKitWebGLBuffer;
const isNativeBufferAddr = (buffer) => buffer instanceof BigInt;
exports.isNativeBufferAddr = isNativeBufferAddr;
const isNativeBufferWeb = (buffer) => buffer instanceof HTMLVideoElement ||
    buffer instanceof HTMLCanvasElement ||
    buffer instanceof ImageBitmap ||
    buffer instanceof OffscreenCanvas ||
    (typeof VideoFrame !== "undefined" && buffer instanceof VideoFrame) ||
    buffer instanceof HTMLImageElement ||
    buffer instanceof SVGImageElement ||
    buffer instanceof CanvasKitWebGLBuffer;
exports.isNativeBufferWeb = isNativeBufferWeb;
const isNativeBufferNode = (buffer) => buffer instanceof ArrayBuffer;
exports.isNativeBufferNode = isNativeBufferNode;

},
"node_modules/@shopify/react-native-skia/src/skia/types/Recorder.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},
"node_modules/@shopify/react-native-skia/src/skia/types/Video/index.ts":function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("node_modules/@shopify/react-native-skia/src/skia/types/Video/Video.ts"), exports);

},
"node_modules/@shopify/react-native-skia/src/skia/types/Video/Video.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},
"node_modules/@shopify/react-native-skia/src/skia/types/Skottie.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModifierKey = exports.InputState = exports.ResizePolicy = exports.VerticalTextAlign = exports.LineBreakType = void 0;
var LineBreakType;
(function (LineBreakType) {
    LineBreakType[LineBreakType["SoftLineBreak"] = 0] = "SoftLineBreak";
    LineBreakType[LineBreakType["HardtLineBreak"] = 1] = "HardtLineBreak";
})(LineBreakType || (exports.LineBreakType = LineBreakType = {}));
var VerticalTextAlign;
(function (VerticalTextAlign) {
    VerticalTextAlign[VerticalTextAlign["Top"] = 0] = "Top";
    VerticalTextAlign[VerticalTextAlign["TopBaseline"] = 1] = "TopBaseline";
    VerticalTextAlign[VerticalTextAlign["VisualTop"] = 2] = "VisualTop";
    VerticalTextAlign[VerticalTextAlign["VisualCenter"] = 3] = "VisualCenter";
    VerticalTextAlign[VerticalTextAlign["VisualBottom"] = 4] = "VisualBottom";
})(VerticalTextAlign || (exports.VerticalTextAlign = VerticalTextAlign = {}));
var ResizePolicy;
(function (ResizePolicy) {
    ResizePolicy[ResizePolicy["None"] = 0] = "None";
    ResizePolicy[ResizePolicy["ScaleToFit"] = 1] = "ScaleToFit";
    ResizePolicy[ResizePolicy["DownscaleToFit"] = 2] = "DownscaleToFit";
})(ResizePolicy || (exports.ResizePolicy = ResizePolicy = {}));
var InputState;
(function (InputState) {
    InputState[InputState["Down"] = 0] = "Down";
    InputState[InputState["Up"] = 1] = "Up";
    InputState[InputState["Move"] = 2] = "Move";
    InputState[InputState["Right"] = 3] = "Right";
    InputState[InputState["Left"] = 4] = "Left";
})(InputState || (exports.InputState = InputState = {}));
var ModifierKey;
(function (ModifierKey) {
    ModifierKey[ModifierKey["None"] = 0] = "None";
    ModifierKey[ModifierKey["Shift"] = 1] = "Shift";
    ModifierKey[ModifierKey["Control"] = 2] = "Control";
    ModifierKey[ModifierKey["Option"] = 3] = "Option";
    ModifierKey[ModifierKey["Command"] = 4] = "Command";
    ModifierKey[ModifierKey["FirstPress"] = 5] = "FirstPress";
})(ModifierKey || (exports.ModifierKey = ModifierKey = {}));

},
"node_modules/@shopify/react-native-skia/src/skia/web/JsiSkRRect.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsiSkRRect = void 0;
const Host_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/Host.ts");
const JsiSkRect_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkRect.ts");
class JsiSkRRect extends Host_1.BaseHostObject {
    [Symbol.dispose]() {
    }
    static fromValue(CanvasKit, rect) {
        if (rect instanceof JsiSkRect_1.JsiSkRect) {
            return rect.ref;
        }
        if ("topLeft" in rect &&
            "topRight" in rect &&
            "bottomRight" in rect &&
            "bottomLeft" in rect) {
            return Float32Array.of(rect.rect.x, rect.rect.y, rect.rect.x + rect.rect.width, rect.rect.y + rect.rect.height, rect.topLeft.x, rect.topLeft.y, rect.topRight.x, rect.topRight.y, rect.bottomRight.x, rect.bottomRight.y, rect.bottomLeft.x, rect.bottomLeft.y);
        }
        return CanvasKit.RRectXY(JsiSkRect_1.JsiSkRect.fromValue(CanvasKit, rect.rect), rect.rx, rect.ry);
    }
    constructor(CanvasKit, rect, rx, ry) {
        if (rx === Infinity || ry === Infinity) {
            rx = ry = 0;
        }
        if (rect.width < rx + rx || rect.height < ry + ry) {
            const scale = Math.min(rect.width / (rx + rx), rect.height / (ry + ry));
            rx *= scale;
            ry *= scale;
        }
        const ref = CanvasKit.RRectXY(JsiSkRect_1.JsiSkRect.fromValue(CanvasKit, rect), rx, ry);
        super(CanvasKit, ref, "RRect");
    }
    get rx() {
        return this.ref[4];
    }
    get ry() {
        return this.ref[5];
    }
    get rect() {
        return new JsiSkRect_1.JsiSkRect(this.CanvasKit, Float32Array.of(this.ref[0], this.ref[1], this.ref[2], this.ref[3]));
    }
}
exports.JsiSkRRect = JsiSkRRect;

},
"node_modules/@shopify/react-native-skia/src/skia/web/JsiSkImage.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsiSkImage = exports.toBase64String = void 0;
const Host_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/Host.ts");
const JsiSkMatrix_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkMatrix.ts");
const JsiSkShader_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkShader.ts");
const toBase64String = (bytes) => {
    if (typeof Buffer !== "undefined") {
        return Buffer.from(bytes).toString("base64");
    }
    else {
        var CHUNK_SIZE = 0x8000;
        var index = 0;
        var { length } = bytes;
        var result = "";
        var slice;
        while (index < length) {
            slice = bytes.slice(index, Math.min(index + CHUNK_SIZE, length));
            result += String.fromCharCode.apply(null, slice);
            index += CHUNK_SIZE;
        }
        return btoa(result);
    }
};
exports.toBase64String = toBase64String;
class JsiSkImage extends Host_1.HostObject {
    constructor(CanvasKit, ref) {
        super(CanvasKit, ref, "Image");
    }
    height() {
        return this.ref.height();
    }
    width() {
        return this.ref.width();
    }
    getImageInfo() {
        const info = this.ref.getImageInfo();
        return {
            width: info.width,
            height: info.height,
            colorType: info.colorType.value,
            alphaType: info.alphaType.value,
        };
    }
    makeShaderOptions(tx, ty, fm, mm, localMatrix) {
        return new JsiSkShader_1.JsiSkShader(this.CanvasKit, this.ref.makeShaderOptions((0, Host_1.getEnum)(this.CanvasKit, "TileMode", tx), (0, Host_1.getEnum)(this.CanvasKit, "TileMode", ty), (0, Host_1.getEnum)(this.CanvasKit, "FilterMode", fm), (0, Host_1.getEnum)(this.CanvasKit, "MipmapMode", mm), localMatrix ? JsiSkMatrix_1.JsiSkMatrix.fromValue(localMatrix) : undefined));
    }
    makeShaderCubic(tx, ty, B, C, localMatrix) {
        return new JsiSkShader_1.JsiSkShader(this.CanvasKit, this.ref.makeShaderCubic((0, Host_1.getEnum)(this.CanvasKit, "TileMode", tx), (0, Host_1.getEnum)(this.CanvasKit, "TileMode", ty), B, C, localMatrix ? JsiSkMatrix_1.JsiSkMatrix.fromValue(localMatrix) : undefined));
    }
    encodeToBytes(fmt, quality) {
        let result;
        if (fmt && quality) {
            result = this.ref.encodeToBytes((0, Host_1.getEnum)(this.CanvasKit, "ImageFormat", fmt), quality);
        }
        else if (fmt) {
            result = this.ref.encodeToBytes((0, Host_1.getEnum)(this.CanvasKit, "ImageFormat", fmt));
        }
        else {
            result = this.ref.encodeToBytes();
        }
        if (!result) {
            throw new Error("encodeToBytes failed");
        }
        return result;
    }
    encodeToBase64(fmt, quality) {
        const bytes = this.encodeToBytes(fmt, quality);
        return (0, exports.toBase64String)(bytes);
    }
    readPixels(srcX, srcY, imageInfo) {
        const info = this.getImageInfo();
        const pxInfo = {
            colorSpace: this.CanvasKit.ColorSpace.SRGB,
            width: imageInfo?.width ?? info.width,
            height: imageInfo?.height ?? info.height,
            alphaType: (0, Host_1.getEnum)(this.CanvasKit, "AlphaType", (imageInfo ?? info).alphaType),
            colorType: (0, Host_1.getEnum)(this.CanvasKit, "ColorType", (imageInfo ?? info).colorType),
        };
        return this.ref.readPixels(srcX ?? 0, srcY ?? 0, pxInfo);
    }
    makeNonTextureImage() {
        const partialInfo = this.ref.getImageInfo();
        const colorSpace = this.ref.getColorSpace();
        const info = {
            ...partialInfo,
            colorSpace,
        };
        const pixels = this.ref.readPixels(0, 0, info);
        if (!pixels) {
            throw new Error("Could not read pixels from image");
        }
        const img = this.CanvasKit.MakeImage(info, pixels, info.width * 4);
        if (!img) {
            throw new Error("Could not create image from bytes");
        }
        return new JsiSkImage(this.CanvasKit, img);
    }
    getNativeTextureUnstable() {
        console.warn("getBackendTexture is not implemented on Web");
        return null;
    }
}
exports.JsiSkImage = JsiSkImage;

},
"node_modules/@shopify/react-native-skia/src/skia/web/JsiSkMatrix.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsiSkMatrix = void 0;
const types_1 = require("node_modules/@shopify/react-native-skia/src/skia/types/index.ts");
const Host_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/Host.ts");
const isMatrixHostObject = (obj) => !Array.isArray(obj);
class JsiSkMatrix extends Host_1.HostObject {
    constructor(CanvasKit, ref) {
        super(CanvasKit, ref, "Matrix");
    }
    preMultiply(matrix) {
        this.ref.set(this.CanvasKit.Matrix.multiply(this.ref, matrix));
    }
    postMultiply(matrix) {
        this.ref.set(this.CanvasKit.Matrix.multiply(matrix, this.ref));
    }
    concat(matrix) {
        this.preMultiply(isMatrixHostObject(matrix)
            ? JsiSkMatrix.fromValue(matrix)
            : matrix.length === 16
                ? (0, types_1.toMatrix3)(matrix)
                : [...matrix]);
        return this;
    }
    translate(x, y) {
        this.preMultiply(this.CanvasKit.Matrix.translated(x, y));
        return this;
    }
    postTranslate(x, y) {
        this.postMultiply(this.CanvasKit.Matrix.translated(x, y));
        return this;
    }
    scale(x, y) {
        this.preMultiply(this.CanvasKit.Matrix.scaled(x, y ?? x));
        return this;
    }
    postScale(x, y) {
        this.postMultiply(this.CanvasKit.Matrix.scaled(x, y ?? x));
        return this;
    }
    skew(x, y) {
        this.preMultiply(this.CanvasKit.Matrix.skewed(x, y));
        return this;
    }
    postSkew(x, y) {
        this.postMultiply(this.CanvasKit.Matrix.skewed(x, y));
        return this;
    }
    rotate(value) {
        this.preMultiply(this.CanvasKit.Matrix.rotated(value));
        return this;
    }
    postRotate(value) {
        this.postMultiply(this.CanvasKit.Matrix.rotated(value));
        return this;
    }
    identity() {
        this.ref.set(this.CanvasKit.Matrix.identity());
        return this;
    }
    get() {
        return Array.from(this.ref);
    }
}
exports.JsiSkMatrix = JsiSkMatrix;

},
"node_modules/@shopify/react-native-skia/src/skia/web/JsiSkVertices.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsiSkVertices = void 0;
const Host_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/Host.ts");
const JsiSkRect_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkRect.ts");
class JsiSkVertices extends Host_1.HostObject {
    constructor(CanvasKit, ref) {
        super(CanvasKit, ref, "Vertices");
    }
    bounds() {
        return new JsiSkRect_1.JsiSkRect(this.CanvasKit, this.ref.bounds());
    }
    uniqueID() {
        return this.ref.uniqueID();
    }
}
exports.JsiSkVertices = JsiSkVertices;

},
"node_modules/@shopify/react-native-skia/src/skia/web/JsiSkPath.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsiSkPath = exports.toMatrix3x3 = void 0;
const types_1 = require("node_modules/@shopify/react-native-skia/src/skia/types/index.ts");
const Host_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/Host.ts");
const JsiSkPoint_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkPoint.ts");
const JsiSkRect_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkRect.ts");
const JsiSkRRect_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkRRect.ts");
const JsiSkMatrix_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkMatrix.ts");
const CommandCount = {
    [types_1.PathVerb.Move]: 3,
    [types_1.PathVerb.Line]: 3,
    [types_1.PathVerb.Quad]: 5,
    [types_1.PathVerb.Conic]: 6,
    [types_1.PathVerb.Cubic]: 7,
    [types_1.PathVerb.Close]: 1,
};
const shownDeprecationWarnings = new Set();
const warnDeprecatedPathMethod = (methodName, suggestion) => {
    if (shownDeprecationWarnings.has(methodName)) {
        return;
    }
    shownDeprecationWarnings.add(methodName);
    console.warn(`[react-native-skia] SkPath.${methodName}() is deprecated and will be removed in a future release. ${suggestion} See migration guide: https://shopify.github.io/react-native-skia/docs/shapes/path-migration`);
};
const toMatrix3x3 = (m) => {
    let matrix = m instanceof JsiSkMatrix_1.JsiSkMatrix
        ? Array.from(JsiSkMatrix_1.JsiSkMatrix.fromValue(m))
        : m;
    if (matrix.length === 16) {
        matrix = [
            matrix[0],
            matrix[1],
            matrix[3],
            matrix[4],
            matrix[5],
            matrix[7],
            matrix[12],
            matrix[13],
            matrix[15],
        ];
    }
    else if (matrix.length !== 9) {
        throw new Error(`Invalid matrix length: ${matrix.length}`);
    }
    return matrix;
};
exports.toMatrix3x3 = toMatrix3x3;
class JsiSkPath extends Host_1.HostObject {
    constructor(CanvasKit, ref) {
        super(CanvasKit, ref, "Path");
    }
    asPath() {
        return this.ref.snapshot();
    }
    static pathFromValue(value) {
        return JsiSkPath.fromValue(value).snapshot();
    }
    addPath(src, matrix, extend = false) {
        warnDeprecatedPathMethod("addPath", "Use Skia.PathBuilder.Make().addPath() instead.");
        const srcBuilder = JsiSkPath.fromValue(src);
        const srcPath = srcBuilder.snapshot();
        const args = [
            srcPath,
            ...(matrix ? JsiSkMatrix_1.JsiSkMatrix.fromValue(matrix) : []),
            extend,
        ];
        this.ref.addPath(...args);
        srcPath.delete();
        return this;
    }
    addArc(oval, startAngleInDegrees, sweepAngleInDegrees) {
        warnDeprecatedPathMethod("addArc", "Use Skia.PathBuilder.Make().addArc() instead.");
        this.ref.addArc(JsiSkRect_1.JsiSkRect.fromValue(this.CanvasKit, oval), startAngleInDegrees, sweepAngleInDegrees);
        return this;
    }
    addOval(oval, isCCW, startIndex) {
        warnDeprecatedPathMethod("addOval", "Use Skia.Path.Oval() or Skia.PathBuilder.Make().addOval() instead.");
        this.ref.addOval(JsiSkRect_1.JsiSkRect.fromValue(this.CanvasKit, oval), isCCW, startIndex);
        return this;
    }
    addPoly(points, close) {
        warnDeprecatedPathMethod("addPoly", "Use Skia.Path.Polygon() or Skia.PathBuilder.Make().addPoly() instead.");
        this.ref.addPolygon(points.map((p) => Array.from(JsiSkPoint_1.JsiSkPoint.fromValue(p))).flat(), close);
        return this;
    }
    addRect(rect, isCCW) {
        warnDeprecatedPathMethod("addRect", "Use Skia.Path.Rect() or Skia.PathBuilder.Make().addRect() instead.");
        this.ref.addRect(JsiSkRect_1.JsiSkRect.fromValue(this.CanvasKit, rect), isCCW);
        return this;
    }
    addRRect(rrect, isCCW) {
        warnDeprecatedPathMethod("addRRect", "Use Skia.Path.RRect() or Skia.PathBuilder.Make().addRRect() instead.");
        this.ref.addRRect(JsiSkRRect_1.JsiSkRRect.fromValue(this.CanvasKit, rrect), isCCW);
        return this;
    }
    addCircle(x, y, r) {
        warnDeprecatedPathMethod("addCircle", "Use Skia.Path.Circle() or Skia.PathBuilder.Make().addCircle() instead.");
        this.ref.addCircle(x, y, r);
        return this;
    }
    moveTo(x, y) {
        warnDeprecatedPathMethod("moveTo", "Use Skia.PathBuilder.Make().moveTo() instead.");
        this.ref.moveTo(x, y);
        return this;
    }
    rMoveTo(x, y) {
        warnDeprecatedPathMethod("rMoveTo", "Use Skia.PathBuilder.Make().rMoveTo() instead.");
        this.ref.rMoveTo(x, y);
        return this;
    }
    lineTo(x, y) {
        warnDeprecatedPathMethod("lineTo", "Use Skia.PathBuilder.Make().lineTo() instead.");
        this.ref.lineTo(x, y);
        return this;
    }
    rLineTo(x, y) {
        warnDeprecatedPathMethod("rLineTo", "Use Skia.PathBuilder.Make().rLineTo() instead.");
        this.ref.rLineTo(x, y);
        return this;
    }
    quadTo(x1, y1, x2, y2) {
        warnDeprecatedPathMethod("quadTo", "Use Skia.PathBuilder.Make().quadTo() instead.");
        this.ref.quadTo(x1, y1, x2, y2);
        return this;
    }
    rQuadTo(x1, y1, x2, y2) {
        warnDeprecatedPathMethod("rQuadTo", "Use Skia.PathBuilder.Make().rQuadTo() instead.");
        this.ref.rQuadTo(x1, y1, x2, y2);
        return this;
    }
    conicTo(x1, y1, x2, y2, w) {
        warnDeprecatedPathMethod("conicTo", "Use Skia.PathBuilder.Make().conicTo() instead.");
        this.ref.conicTo(x1, y1, x2, y2, w);
        return this;
    }
    rConicTo(x1, y1, x2, y2, w) {
        warnDeprecatedPathMethod("rConicTo", "Use Skia.PathBuilder.Make().rConicTo() instead.");
        this.ref.rConicTo(x1, y1, x2, y2, w);
        return this;
    }
    cubicTo(cpx1, cpy1, cpx2, cpy2, x, y) {
        warnDeprecatedPathMethod("cubicTo", "Use Skia.PathBuilder.Make().cubicTo() instead.");
        this.ref.cubicTo(cpx1, cpy1, cpx2, cpy2, x, y);
        return this;
    }
    rCubicTo(cpx1, cpy1, cpx2, cpy2, x, y) {
        warnDeprecatedPathMethod("rCubicTo", "Use Skia.PathBuilder.Make().rCubicTo() instead.");
        this.ref.rCubicTo(cpx1, cpy1, cpx2, cpy2, x, y);
        return this;
    }
    close() {
        warnDeprecatedPathMethod("close", "Use Skia.PathBuilder.Make().close() instead.");
        this.ref.close();
        return this;
    }
    reset() {
        warnDeprecatedPathMethod("reset", "Use Skia.PathBuilder.Make().reset() instead.");
        const newBuilder = new this.CanvasKit.PathBuilder();
        if (this.ref !== null &&
            typeof this.ref === "object" &&
            "delete" in this.ref &&
            typeof this.ref.delete === "function") {
            this.ref.delete();
        }
        this.ref = newBuilder;
        return this;
    }
    rewind() {
        warnDeprecatedPathMethod("rewind", "Use Skia.PathBuilder.Make().reset() instead.");
        return this.reset();
    }
    arcToOval(oval, startAngleInDegrees, sweepAngleInDegrees, forceMoveTo) {
        warnDeprecatedPathMethod("arcToOval", "Use Skia.PathBuilder.Make().arcToOval() instead.");
        this.ref.arcToOval(JsiSkRect_1.JsiSkRect.fromValue(this.CanvasKit, oval), startAngleInDegrees, sweepAngleInDegrees, forceMoveTo);
        return this;
    }
    arcToRotated(rx, ry, xAxisRotateInDegrees, useSmallArc, isCCW, x, y) {
        warnDeprecatedPathMethod("arcToRotated", "Use Skia.PathBuilder.Make().arcToRotated() instead.");
        this.ref.arcToRotated(rx, ry, xAxisRotateInDegrees, useSmallArc, isCCW, x, y);
        return this;
    }
    rArcTo(rx, ry, xAxisRotateInDegrees, useSmallArc, isCCW, dx, dy) {
        warnDeprecatedPathMethod("rArcTo", "Use Skia.PathBuilder.Make().rArcTo() instead.");
        this.ref.rArcTo(rx, ry, xAxisRotateInDegrees, useSmallArc, isCCW, dx, dy);
        return this;
    }
    arcToTangent(x1, y1, x2, y2, radius) {
        warnDeprecatedPathMethod("arcToTangent", "Use Skia.PathBuilder.Make().arcToTangent() instead.");
        this.ref.arcToTangent(x1, y1, x2, y2, radius);
        return this;
    }
    setFillType(fill) {
        warnDeprecatedPathMethod("setFillType", "Use Skia.PathBuilder.Make().setFillType() instead.");
        this.ref.setFillType((0, Host_1.getEnum)(this.CanvasKit, "FillType", fill));
        return this;
    }
    setIsVolatile(_volatile) {
        warnDeprecatedPathMethod("setIsVolatile", "Use Skia.PathBuilder.Make().setIsVolatile() instead.");
        return this;
    }
    offset(dx, dy) {
        warnDeprecatedPathMethod("offset", "Use Skia.PathBuilder.Make().offset() instead.");
        this.ref.offset(dx, dy);
        return this;
    }
    transform(m) {
        warnDeprecatedPathMethod("transform", "Use Skia.PathBuilder.Make().transform() instead.");
        const matrix = (0, exports.toMatrix3x3)(m);
        this.ref.transform(matrix);
        return this;
    }
    makeAsWinding() {
        warnDeprecatedPathMethod("makeAsWinding", "Use Skia.Path.AsWinding(path) instead.");
        const path = this.asPath();
        const result = path.makeAsWinding();
        path.delete();
        if (result === null) {
            return null;
        }
        const old = this.ref;
        this.ref = new this.CanvasKit.PathBuilder(result);
        result.delete();
        old.delete();
        return this;
    }
    simplify() {
        warnDeprecatedPathMethod("simplify", "Use Skia.Path.Simplify(path) instead.");
        const path = this.asPath();
        const result = path.makeSimplified();
        path.delete();
        if (result === null) {
            return false;
        }
        const old = this.ref;
        this.ref = new this.CanvasKit.PathBuilder(result);
        result.delete();
        old.delete();
        return true;
    }
    op(path, op) {
        warnDeprecatedPathMethod("op", "Use Skia.Path.MakeFromOp() instead.");
        const self = this.asPath();
        const other = JsiSkPath.fromValue(path).snapshot();
        const result = self.makeCombined(other, (0, Host_1.getEnum)(this.CanvasKit, "PathOp", op));
        self.delete();
        other.delete();
        if (result === null) {
            return false;
        }
        const old = this.ref;
        this.ref = new this.CanvasKit.PathBuilder(result);
        result.delete();
        old.delete();
        return true;
    }
    dash(on, off, phase) {
        warnDeprecatedPathMethod("dash", "Use Skia.Path.Dash(path, on, off, phase) instead.");
        const path = this.asPath();
        const result = path.makeDashed(on, off, phase);
        path.delete();
        if (result === null) {
            return false;
        }
        const old = this.ref;
        this.ref = new this.CanvasKit.PathBuilder(result);
        result.delete();
        old.delete();
        return true;
    }
    stroke(opts) {
        warnDeprecatedPathMethod("stroke", "Use Skia.Path.Stroke(path, opts) instead.");
        const path = this.asPath();
        const result = path.makeStroked(opts === undefined
            ? undefined
            : {
                width: opts.width,
                miter_limit: opts.miter_limit,
                precision: opts.precision,
                join: (0, Host_1.optEnum)(this.CanvasKit, "StrokeJoin", opts.join),
                cap: (0, Host_1.optEnum)(this.CanvasKit, "StrokeCap", opts.cap),
            });
        path.delete();
        if (result === null) {
            return null;
        }
        const old = this.ref;
        this.ref = new this.CanvasKit.PathBuilder(result);
        result.delete();
        old.delete();
        return this;
    }
    trim(start, stop, isComplement) {
        warnDeprecatedPathMethod("trim", "Use Skia.Path.Trim(path, start, end, isComplement) instead.");
        const startT = Math.min(Math.max(start, 0), 1);
        const stopT = Math.min(Math.max(stop, 0), 1);
        if (startT === 0 && stopT === 1 && !isComplement) {
            return this;
        }
        const path = this.asPath();
        const result = path.makeTrimmed(startT, stopT, isComplement);
        path.delete();
        if (result === null) {
            return null;
        }
        const old = this.ref;
        this.ref = new this.CanvasKit.PathBuilder(result);
        result.delete();
        old.delete();
        return this;
    }
    countPoints() {
        return this.ref.countPoints();
    }
    computeTightBounds() {
        const path = this.asPath();
        const result = new JsiSkRect_1.JsiSkRect(this.CanvasKit, path.computeTightBounds());
        path.delete();
        return result;
    }
    contains(x, y) {
        const path = this.asPath();
        const result = path.contains(x, y);
        path.delete();
        return result;
    }
    copy() {
        const path = this.asPath();
        const result = new JsiSkPath(this.CanvasKit, new this.CanvasKit.PathBuilder(path));
        path.delete();
        return result;
    }
    equals(other) {
        const p1 = this.asPath();
        const p2 = JsiSkPath.fromValue(other).snapshot();
        const result = p1.equals(p2);
        p1.delete();
        p2.delete();
        return result;
    }
    getBounds() {
        return new JsiSkRect_1.JsiSkRect(this.CanvasKit, this.ref.getBounds());
    }
    getFillType() {
        const path = this.asPath();
        const result = path.getFillType().value;
        path.delete();
        return result;
    }
    getPoint(index) {
        const path = this.asPath();
        const result = new JsiSkPoint_1.JsiSkPoint(this.CanvasKit, path.getPoint(index));
        path.delete();
        return result;
    }
    isEmpty() {
        return this.ref.isEmpty();
    }
    isVolatile() {
        return false;
    }
    getLastPt() {
        const count = this.ref.countPoints();
        if (count === 0) {
            return { x: 0, y: 0 };
        }
        const path = this.asPath();
        const pt = path.getPoint(count - 1);
        path.delete();
        return { x: pt[0], y: pt[1] };
    }
    toSVGString() {
        const path = this.asPath();
        const result = path.toSVGString();
        path.delete();
        return result;
    }
    isInterpolatable(path2) {
        const p1 = this.asPath();
        const p2 = JsiSkPath.fromValue(path2).snapshot();
        const result = this.CanvasKit.Path.CanInterpolate(p1, p2);
        p1.delete();
        p2.delete();
        return result;
    }
    interpolate(end, weight, output) {
        const p1 = this.asPath();
        const p2 = JsiSkPath.fromValue(end).snapshot();
        const path = this.CanvasKit.Path.MakeFromPathInterpolation(p1, p2, weight);
        p1.delete();
        p2.delete();
        if (path === null) {
            return null;
        }
        if (output) {
            const outRef = output;
            const old = outRef.ref;
            outRef.ref = new this.CanvasKit.PathBuilder(path);
            path.delete();
            old.delete();
            return output;
        }
        const result = new JsiSkPath(this.CanvasKit, new this.CanvasKit.PathBuilder(path));
        path.delete();
        return result;
    }
    toCmds() {
        const path = this.asPath();
        const cmds = path.toCmds();
        path.delete();
        const result = cmds.reduce((acc, cmd, i) => {
            if (i === 0) {
                acc.push([]);
            }
            const current = acc[acc.length - 1];
            if (current.length === 0) {
                current.push(cmd);
                const length = CommandCount[current[0]];
                if (current.length === length && i !== cmds.length - 1) {
                    acc.push([]);
                }
            }
            else {
                const length = CommandCount[current[0]];
                if (current.length < length) {
                    current.push(cmd);
                }
                if (current.length === length && i !== cmds.length - 1) {
                    acc.push([]);
                }
            }
            return acc;
        }, []);
        return result;
    }
}
exports.JsiSkPath = JsiSkPath;

},
"node_modules/@shopify/react-native-skia/src/skia/web/JsiSkFont.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsiSkFont = void 0;
const Host_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/Host.ts");
const JsiSkPaint_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkPaint.ts");
const JsiSkPoint_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkPoint.ts");
const JsiSkRect_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkRect.ts");
const JsiSkTypeface_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkTypeface.ts");
class JsiSkFont extends Host_1.HostObject {
    constructor(CanvasKit, ref) {
        super(CanvasKit, ref, "Font");
    }
    measureText(_text, _paint) {
        return (0, Host_1.throwNotImplementedOnRNWeb)();
    }
    getTextWidth(text, paint) {
        const ids = this.getGlyphIDs(text);
        const widths = this.getGlyphWidths(ids, paint);
        return widths.reduce((a, b) => a + b, 0);
    }
    getMetrics() {
        const result = this.ref.getMetrics();
        return {
            ascent: result.ascent,
            descent: result.descent,
            leading: result.leading,
            bounds: result.bounds
                ? new JsiSkRect_1.JsiSkRect(this.CanvasKit, result.bounds)
                : undefined,
        };
    }
    getGlyphIDs(str, numCodePoints) {
        return [...this.ref.getGlyphIDs(str, numCodePoints)];
    }
    getGlyphWidths(glyphs, paint) {
        return [
            ...this.ref.getGlyphWidths(glyphs, paint ? JsiSkPaint_1.JsiSkPaint.fromValue(paint) : null),
        ];
    }
    getGlyphIntercepts(glyphs, positions, top, bottom) {
        return [
            ...this.ref.getGlyphIntercepts(glyphs, positions.map((p) => Array.from(JsiSkPoint_1.JsiSkPoint.fromValue(p))).flat(), top, bottom),
        ];
    }
    getScaleX() {
        return this.ref.getScaleX();
    }
    getSize() {
        return this.ref.getSize();
    }
    getSkewX() {
        return this.ref.getSkewX();
    }
    isEmbolden() {
        return this.ref.isEmbolden();
    }
    getTypeface() {
        const tf = this.ref.getTypeface();
        return tf ? new JsiSkTypeface_1.JsiSkTypeface(this.CanvasKit, tf) : null;
    }
    setEdging(edging) {
        this.ref.setEdging((0, Host_1.getEnum)(this.CanvasKit, "FontEdging", edging));
    }
    setEmbeddedBitmaps(embeddedBitmaps) {
        this.ref.setEmbeddedBitmaps(embeddedBitmaps);
    }
    setHinting(hinting) {
        this.ref.setHinting((0, Host_1.getEnum)(this.CanvasKit, "FontHinting", hinting));
    }
    setLinearMetrics(linearMetrics) {
        this.ref.setLinearMetrics(linearMetrics);
    }
    setScaleX(sx) {
        this.ref.setScaleX(sx);
    }
    setSize(points) {
        this.ref.setSize(points);
    }
    setSkewX(sx) {
        this.ref.setSkewX(sx);
    }
    setEmbolden(embolden) {
        this.ref.setEmbolden(embolden);
    }
    setSubpixel(subpixel) {
        this.ref.setSubpixel(subpixel);
    }
    setTypeface(face) {
        this.ref.setTypeface(face ? JsiSkTypeface_1.JsiSkTypeface.fromValue(face) : null);
    }
}
exports.JsiSkFont = JsiSkFont;

},
"node_modules/@shopify/react-native-skia/src/skia/web/JsiSkTypeface.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsiSkTypeface = void 0;
const Host_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/Host.ts");
class JsiSkTypeface extends Host_1.HostObject {
    constructor(CanvasKit, ref) {
        super(CanvasKit, ref, "Typeface");
    }
    get bold() {
        console.warn("Typeface.bold is deprecated and will be removed in a future release. The property will return false.");
        return false;
    }
    get italic() {
        console.warn("Typeface.italic is deprecated and will be removed in a future release. The property will return false.");
        return false;
    }
    getGlyphIDs(str, numCodePoints) {
        return Array.from(this.ref.getGlyphIDs(str, numCodePoints));
    }
}
exports.JsiSkTypeface = JsiSkTypeface;

},
"node_modules/@shopify/react-native-skia/src/skia/web/JsiSkTextBlob.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsiSkTextBlob = void 0;
const Host_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/Host.ts");
class JsiSkTextBlob extends Host_1.HostObject {
    constructor(CanvasKit, ref) {
        super(CanvasKit, ref, "TextBlob");
    }
}
exports.JsiSkTextBlob = JsiSkTextBlob;

},
"node_modules/@shopify/react-native-skia/src/skia/web/JsiSkPicture.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsiSkPicture = void 0;
const Host_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/Host.ts");
const JsiSkShader_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkShader.ts");
const JsiSkMatrix_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkMatrix.ts");
const JsiSkRect_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkRect.ts");
class JsiSkPicture extends Host_1.HostObject {
    constructor(CanvasKit, ref) {
        super(CanvasKit, ref, "Picture");
    }
    makeShader(tmx, tmy, mode, localMatrix, tileRect) {
        return new JsiSkShader_1.JsiSkShader(this.CanvasKit, this.ref.makeShader((0, Host_1.getEnum)(this.CanvasKit, "TileMode", tmx), (0, Host_1.getEnum)(this.CanvasKit, "TileMode", tmy), (0, Host_1.getEnum)(this.CanvasKit, "FilterMode", mode), localMatrix ? JsiSkMatrix_1.JsiSkMatrix.fromValue(localMatrix) : undefined, tileRect ? JsiSkRect_1.JsiSkRect.fromValue(this.CanvasKit, tileRect) : undefined));
    }
    serialize() {
        return this.ref.serialize();
    }
}
exports.JsiSkPicture = JsiSkPicture;

},
"node_modules/@shopify/react-native-skia/src/skia/web/JsiSkRSXform.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsiSkRSXform = void 0;
const Host_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/Host.ts");
class JsiSkRSXform extends Host_1.BaseHostObject {
    static fromValue(rsxform) {
        if (rsxform instanceof JsiSkRSXform) {
            return rsxform.ref;
        }
        return Float32Array.of(rsxform.scos, rsxform.ssin, rsxform.tx, rsxform.ty);
    }
    constructor(CanvasKit, ref) {
        super(CanvasKit, ref, "RSXform");
    }
    set(scos, ssin, tx, ty) {
        this.ref[0] = scos;
        this.ref[1] = ssin;
        this.ref[2] = tx;
        this.ref[3] = ty;
    }
    get scos() {
        return this.ref[0];
    }
    get ssin() {
        return this.ref[1];
    }
    get tx() {
        return this.ref[2];
    }
    get ty() {
        return this.ref[3];
    }
}
exports.JsiSkRSXform = JsiSkRSXform;

},
"node_modules/@shopify/react-native-skia/src/skia/web/JsiSkContourMeasureIter.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsiSkContourMeasureIter = void 0;
const Host_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/Host.ts");
const JsiSkContourMeasure_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkContourMeasure.ts");
class JsiSkContourMeasureIter extends Host_1.HostObject {
    constructor(CanvasKit, ref) {
        super(CanvasKit, ref, "ContourMeasureIter");
    }
    next() {
        const result = this.ref.next();
        if (result === null) {
            return null;
        }
        return new JsiSkContourMeasure_1.JsiSkContourMeasure(this.CanvasKit, result);
    }
}
exports.JsiSkContourMeasureIter = JsiSkContourMeasureIter;

},
"node_modules/@shopify/react-native-skia/src/skia/web/JsiSkContourMeasure.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsiSkContourMeasure = void 0;
const Host_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/Host.ts");
const JsiSkPath_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkPath.ts");
const JsiSkPoint_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkPoint.ts");
class JsiSkContourMeasure extends Host_1.HostObject {
    constructor(CanvasKit, ref) {
        super(CanvasKit, ref, "ContourMeasure");
    }
    getPosTan(distance) {
        const posTan = this.ref.getPosTan(distance);
        return [
            new JsiSkPoint_1.JsiSkPoint(this.CanvasKit, posTan.slice(0, 2)),
            new JsiSkPoint_1.JsiSkPoint(this.CanvasKit, posTan.slice(2)),
        ];
    }
    getSegment(startD, stopD, startWithMoveTo) {
        const segment = this.ref.getSegment(startD, stopD, startWithMoveTo);
        const builder = new this.CanvasKit.PathBuilder(segment);
        segment.delete();
        return new JsiSkPath_1.JsiSkPath(this.CanvasKit, builder);
    }
    isClosed() {
        return this.ref.isClosed();
    }
    length() {
        return this.ref.length();
    }
}
exports.JsiSkContourMeasure = JsiSkContourMeasure;

},
"node_modules/@shopify/react-native-skia/src/skia/web/JsiSkPictureRecorder.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsiSkPictureRecorder = void 0;
const Host_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/Host.ts");
const JsiSkCanvas_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkCanvas.ts");
const JsiSkPicture_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkPicture.ts");
const JsiSkRect_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkRect.ts");
class JsiSkPictureRecorder extends Host_1.HostObject {
    constructor(CanvasKit, ref) {
        super(CanvasKit, ref, "PictureRecorder");
    }
    beginRecording(bounds) {
        return new JsiSkCanvas_1.JsiSkCanvas(this.CanvasKit, this.ref.beginRecording(bounds
            ? JsiSkRect_1.JsiSkRect.fromValue(this.CanvasKit, bounds)
            : Float32Array.of(0, 0, 2000000, 2000000)));
    }
    finishRecordingAsPicture() {
        return new JsiSkPicture_1.JsiSkPicture(this.CanvasKit, this.ref.finishRecordingAsPicture());
    }
}
exports.JsiSkPictureRecorder = JsiSkPictureRecorder;

},
"node_modules/@shopify/react-native-skia/src/skia/web/JsiSkPictureFactory.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsiSkPictureFactory = void 0;
const Host_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/Host.ts");
const JsiSkPicture_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkPicture.ts");
class JsiSkPictureFactory extends Host_1.Host {
    constructor(CanvasKit) {
        super(CanvasKit);
    }
    MakePicture(bytes) {
        const pic = this.CanvasKit.MakePicture(bytes);
        if (pic === null) {
            return null;
        }
        return new JsiSkPicture_1.JsiSkPicture(this.CanvasKit, pic);
    }
}
exports.JsiSkPictureFactory = JsiSkPictureFactory;

},
"node_modules/@shopify/react-native-skia/src/skia/web/JsiSkPathFactory.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsiSkPathFactory = void 0;
const Host_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/Host.ts");
const JsiSkPath_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkPath.ts");
const JsiSkPoint_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkPoint.ts");
const JsiSkRect_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkRect.ts");
const JsiSkRRect_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkRRect.ts");
const pinT = (t) => Math.min(Math.max(t, 0), 1);
class JsiSkPathFactory extends Host_1.Host {
    constructor(CanvasKit) {
        super(CanvasKit);
    }
    Make() {
        return new JsiSkPath_1.JsiSkPath(this.CanvasKit, new this.CanvasKit.PathBuilder());
    }
    MakeFromSVGString(str) {
        const path = this.CanvasKit.Path.MakeFromSVGString(str);
        if (path === null) {
            return null;
        }
        const result = new JsiSkPath_1.JsiSkPath(this.CanvasKit, new this.CanvasKit.PathBuilder(path));
        path.delete();
        return result;
    }
    MakeFromOp(one, two, op) {
        const p1 = JsiSkPath_1.JsiSkPath.fromValue(one).snapshot();
        const p2 = JsiSkPath_1.JsiSkPath.fromValue(two).snapshot();
        const path = this.CanvasKit.Path.MakeFromOp(p1, p2, (0, Host_1.getEnum)(this.CanvasKit, "PathOp", op));
        p1.delete();
        p2.delete();
        if (path === null) {
            return null;
        }
        const result = new JsiSkPath_1.JsiSkPath(this.CanvasKit, new this.CanvasKit.PathBuilder(path));
        path.delete();
        return result;
    }
    MakeFromCmds(cmds) {
        const path = this.CanvasKit.Path.MakeFromCmds(cmds.flat());
        if (path === null) {
            return null;
        }
        const result = new JsiSkPath_1.JsiSkPath(this.CanvasKit, new this.CanvasKit.PathBuilder(path));
        path.delete();
        return result;
    }
    MakeFromText(_text, _x, _y, _font) {
        return (0, Host_1.throwNotImplementedOnRNWeb)();
    }
    Rect(rect, isCCW) {
        const builder = new this.CanvasKit.PathBuilder();
        builder.addRect(JsiSkRect_1.JsiSkRect.fromValue(this.CanvasKit, rect), isCCW);
        return new JsiSkPath_1.JsiSkPath(this.CanvasKit, builder);
    }
    Oval(rect, isCCW, startIndex) {
        const builder = new this.CanvasKit.PathBuilder();
        builder.addOval(JsiSkRect_1.JsiSkRect.fromValue(this.CanvasKit, rect), isCCW, startIndex);
        return new JsiSkPath_1.JsiSkPath(this.CanvasKit, builder);
    }
    Circle(x, y, r) {
        const builder = new this.CanvasKit.PathBuilder();
        builder.addCircle(x, y, r);
        return new JsiSkPath_1.JsiSkPath(this.CanvasKit, builder);
    }
    RRect(rrect, isCCW) {
        const builder = new this.CanvasKit.PathBuilder();
        builder.addRRect(JsiSkRRect_1.JsiSkRRect.fromValue(this.CanvasKit, rrect), isCCW);
        return new JsiSkPath_1.JsiSkPath(this.CanvasKit, builder);
    }
    Line(p1, p2) {
        const builder = new this.CanvasKit.PathBuilder();
        const pt1 = JsiSkPoint_1.JsiSkPoint.fromValue(p1);
        const pt2 = JsiSkPoint_1.JsiSkPoint.fromValue(p2);
        builder.moveTo(pt1[0], pt1[1]);
        builder.lineTo(pt2[0], pt2[1]);
        return new JsiSkPath_1.JsiSkPath(this.CanvasKit, builder);
    }
    Polygon(points, close) {
        const builder = new this.CanvasKit.PathBuilder();
        builder.addPolygon(points.map((p) => Array.from(JsiSkPoint_1.JsiSkPoint.fromValue(p))).flat(), close);
        return new JsiSkPath_1.JsiSkPath(this.CanvasKit, builder);
    }
    Stroke(srcPath, opts) {
        const path = JsiSkPath_1.JsiSkPath.fromValue(srcPath).snapshot();
        const result = path.makeStroked(opts === undefined
            ? undefined
            : {
                width: opts.width,
                miter_limit: opts.miter_limit,
                precision: opts.precision,
                join: (0, Host_1.optEnum)(this.CanvasKit, "StrokeJoin", opts.join),
                cap: (0, Host_1.optEnum)(this.CanvasKit, "StrokeCap", opts.cap),
            });
        path.delete();
        if (result === null) {
            return null;
        }
        const r = new JsiSkPath_1.JsiSkPath(this.CanvasKit, new this.CanvasKit.PathBuilder(result));
        result.delete();
        return r;
    }
    Trim(srcPath, start, end, isComplement) {
        const startT = pinT(start);
        const stopT = pinT(end);
        const path = JsiSkPath_1.JsiSkPath.fromValue(srcPath).snapshot();
        if (startT <= 0 && stopT >= 1 && !isComplement) {
            const r = new JsiSkPath_1.JsiSkPath(this.CanvasKit, new this.CanvasKit.PathBuilder(path));
            path.delete();
            return r;
        }
        const result = path.makeTrimmed(startT, stopT, isComplement);
        path.delete();
        if (result === null) {
            return null;
        }
        const r = new JsiSkPath_1.JsiSkPath(this.CanvasKit, new this.CanvasKit.PathBuilder(result));
        result.delete();
        return r;
    }
    Simplify(srcPath) {
        const path = JsiSkPath_1.JsiSkPath.fromValue(srcPath).snapshot();
        const result = path.makeSimplified();
        path.delete();
        if (result === null) {
            return null;
        }
        const r = new JsiSkPath_1.JsiSkPath(this.CanvasKit, new this.CanvasKit.PathBuilder(result));
        result.delete();
        return r;
    }
    Dash(srcPath, on, off, phase) {
        const path = JsiSkPath_1.JsiSkPath.fromValue(srcPath).snapshot();
        const result = path.makeDashed(on, off, phase);
        path.delete();
        if (result === null) {
            return null;
        }
        const r = new JsiSkPath_1.JsiSkPath(this.CanvasKit, new this.CanvasKit.PathBuilder(result));
        result.delete();
        return r;
    }
    AsWinding(srcPath) {
        const path = JsiSkPath_1.JsiSkPath.fromValue(srcPath).snapshot();
        const result = path.makeAsWinding();
        path.delete();
        if (result === null) {
            return null;
        }
        const r = new JsiSkPath_1.JsiSkPath(this.CanvasKit, new this.CanvasKit.PathBuilder(result));
        result.delete();
        return r;
    }
    Interpolate(start, end, weight) {
        const p1 = JsiSkPath_1.JsiSkPath.fromValue(start).snapshot();
        const p2 = JsiSkPath_1.JsiSkPath.fromValue(end).snapshot();
        const path = this.CanvasKit.Path.MakeFromPathInterpolation(p1, p2, weight);
        p1.delete();
        p2.delete();
        if (path === null) {
            return null;
        }
        const r = new JsiSkPath_1.JsiSkPath(this.CanvasKit, new this.CanvasKit.PathBuilder(path));
        path.delete();
        return r;
    }
}
exports.JsiSkPathFactory = JsiSkPathFactory;

},
"node_modules/@shopify/react-native-skia/src/skia/web/JsiSkPathBuilderFactory.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsiSkPathBuilderFactory = void 0;
const Host_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/Host.ts");
const JsiSkPath_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkPath.ts");
const JsiSkPathBuilder_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkPathBuilder.ts");
class JsiSkPathBuilderFactory extends Host_1.Host {
    constructor(CanvasKit) {
        super(CanvasKit);
    }
    Make() {
        return new JsiSkPathBuilder_1.JsiSkPathBuilder(this.CanvasKit, new this.CanvasKit.PathBuilder());
    }
    MakeFromPath(path) {
        const srcBuilder = JsiSkPath_1.JsiSkPath.fromValue(path);
        const srcPath = srcBuilder.snapshot();
        const builder = new this.CanvasKit.PathBuilder(srcPath);
        srcPath.delete();
        return new JsiSkPathBuilder_1.JsiSkPathBuilder(this.CanvasKit, builder);
    }
}
exports.JsiSkPathBuilderFactory = JsiSkPathBuilderFactory;

},
"node_modules/@shopify/react-native-skia/src/skia/web/JsiSkPathBuilder.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsiSkPathBuilder = void 0;
const Host_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/Host.ts");
const JsiSkPath_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkPath.ts");
const JsiSkMatrix_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkMatrix.ts");
const JsiSkPoint_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkPoint.ts");
const JsiSkRect_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkRect.ts");
const JsiSkRRect_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkRRect.ts");
class JsiSkPathBuilder extends Host_1.HostObject {
    constructor(CanvasKit, ref) {
        super(CanvasKit, ref, "PathBuilder");
    }
    moveTo(x, y) {
        this.ref.moveTo(x, y);
        return this;
    }
    rMoveTo(x, y) {
        this.ref.rMoveTo(x, y);
        return this;
    }
    lineTo(x, y) {
        this.ref.lineTo(x, y);
        return this;
    }
    rLineTo(x, y) {
        this.ref.rLineTo(x, y);
        return this;
    }
    quadTo(x1, y1, x2, y2) {
        this.ref.quadTo(x1, y1, x2, y2);
        return this;
    }
    rQuadTo(x1, y1, x2, y2) {
        this.ref.rQuadTo(x1, y1, x2, y2);
        return this;
    }
    conicTo(x1, y1, x2, y2, w) {
        this.ref.conicTo(x1, y1, x2, y2, w);
        return this;
    }
    rConicTo(x1, y1, x2, y2, w) {
        this.ref.rConicTo(x1, y1, x2, y2, w);
        return this;
    }
    cubicTo(x1, y1, x2, y2, x3, y3) {
        this.ref.cubicTo(x1, y1, x2, y2, x3, y3);
        return this;
    }
    rCubicTo(x1, y1, x2, y2, x3, y3) {
        this.ref.rCubicTo(x1, y1, x2, y2, x3, y3);
        return this;
    }
    close() {
        this.ref.close();
        return this;
    }
    arcToOval(oval, startAngleInDegrees, sweepAngleInDegrees, forceMoveTo) {
        this.ref.arcToOval(JsiSkRect_1.JsiSkRect.fromValue(this.CanvasKit, oval), startAngleInDegrees, sweepAngleInDegrees, forceMoveTo);
        return this;
    }
    arcToRotated(rx, ry, xAxisRotateInDegrees, useSmallArc, isCCW, x, y) {
        this.ref.arcToRotated(rx, ry, xAxisRotateInDegrees, useSmallArc, isCCW, x, y);
        return this;
    }
    rArcTo(rx, ry, xAxisRotateInDegrees, useSmallArc, isCCW, dx, dy) {
        this.ref.rArcTo(rx, ry, xAxisRotateInDegrees, useSmallArc, isCCW, dx, dy);
        return this;
    }
    arcToTangent(x1, y1, x2, y2, radius) {
        this.ref.arcToTangent(x1, y1, x2, y2, radius);
        return this;
    }
    addRect(rect, isCCW) {
        this.ref.addRect(JsiSkRect_1.JsiSkRect.fromValue(this.CanvasKit, rect), isCCW);
        return this;
    }
    addOval(oval, isCCW, startIndex) {
        this.ref.addOval(JsiSkRect_1.JsiSkRect.fromValue(this.CanvasKit, oval), isCCW, startIndex);
        return this;
    }
    addArc(oval, startAngleInDegrees, sweepAngleInDegrees) {
        this.ref.addArc(JsiSkRect_1.JsiSkRect.fromValue(this.CanvasKit, oval), startAngleInDegrees, sweepAngleInDegrees);
        return this;
    }
    addRRect(rrect, isCCW) {
        this.ref.addRRect(JsiSkRRect_1.JsiSkRRect.fromValue(this.CanvasKit, rrect), isCCW);
        return this;
    }
    addCircle(x, y, r, _isCCW) {
        this.ref.addCircle(x, y, r);
        return this;
    }
    addPoly(points, close) {
        this.ref.addPolygon(points.map((p) => Array.from(JsiSkPoint_1.JsiSkPoint.fromValue(p))).flat(), close);
        return this;
    }
    addPath(src, matrix, extend = false) {
        const srcPath = JsiSkPath_1.JsiSkPath.pathFromValue(src);
        const args = [
            srcPath,
            ...(matrix ? JsiSkMatrix_1.JsiSkMatrix.fromValue(matrix) : []),
            extend,
        ];
        this.ref.addPath(...args);
        srcPath.delete();
        return this;
    }
    setFillType(fill) {
        this.ref.setFillType((0, Host_1.getEnum)(this.CanvasKit, "FillType", fill));
        return this;
    }
    setIsVolatile(_isVolatile) {
        return this;
    }
    reset() {
        const newBuilder = new this.CanvasKit.PathBuilder();
        if (this.ref !== null &&
            typeof this.ref === "object" &&
            "delete" in this.ref &&
            typeof this.ref.delete === "function") {
            this.ref.delete();
        }
        this.ref = newBuilder;
        return this;
    }
    offset(dx, dy) {
        this.ref.offset(dx, dy);
        return this;
    }
    transform(m) {
        const matrix = (0, JsiSkPath_1.toMatrix3x3)(m);
        this.ref.transform(matrix);
        return this;
    }
    computeBounds() {
        return new JsiSkRect_1.JsiSkRect(this.CanvasKit, this.ref.getBounds());
    }
    isEmpty() {
        return this.ref.isEmpty();
    }
    getLastPt() {
        const count = this.ref.countPoints();
        if (count === 0) {
            return { x: 0, y: 0 };
        }
        const path = this.ref.snapshot();
        const pt = path.getPoint(count - 1);
        path.delete();
        return { x: pt[0], y: pt[1] };
    }
    countPoints() {
        return this.ref.countPoints();
    }
    build() {
        const path = this.ref.snapshot();
        const builder = new this.CanvasKit.PathBuilder(path);
        path.delete();
        return new JsiSkPath_1.JsiSkPath(this.CanvasKit, builder);
    }
    detach() {
        const path = this.ref.detach();
        const builder = new this.CanvasKit.PathBuilder(path);
        path.delete();
        return new JsiSkPath_1.JsiSkPath(this.CanvasKit, builder);
    }
}
exports.JsiSkPathBuilder = JsiSkPathBuilder;

},
"node_modules/@shopify/react-native-skia/src/skia/web/JsiSkColorFilterFactory.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsiSkColorFilterFactory = void 0;
const Host_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/Host.ts");
const JsiSkColorFilter_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkColorFilter.ts");
class JsiSkColorFilterFactory extends Host_1.Host {
    constructor(CanvasKit) {
        super(CanvasKit);
    }
    MakeMatrix(cMatrix) {
        return new JsiSkColorFilter_1.JsiSkColorFilter(this.CanvasKit, this.CanvasKit.ColorFilter.MakeMatrix(cMatrix));
    }
    MakeBlend(color, mode) {
        return new JsiSkColorFilter_1.JsiSkColorFilter(this.CanvasKit, this.CanvasKit.ColorFilter.MakeBlend(color, (0, Host_1.getEnum)(this.CanvasKit, "BlendMode", mode)));
    }
    MakeCompose(outer, inner) {
        return new JsiSkColorFilter_1.JsiSkColorFilter(this.CanvasKit, this.CanvasKit.ColorFilter.MakeCompose(JsiSkColorFilter_1.JsiSkColorFilter.fromValue(outer), JsiSkColorFilter_1.JsiSkColorFilter.fromValue(inner)));
    }
    MakeLerp(t, dst, src) {
        return new JsiSkColorFilter_1.JsiSkColorFilter(this.CanvasKit, this.CanvasKit.ColorFilter.MakeLerp(t, JsiSkColorFilter_1.JsiSkColorFilter.fromValue(dst), JsiSkColorFilter_1.JsiSkColorFilter.fromValue(src)));
    }
    MakeLinearToSRGBGamma() {
        return new JsiSkColorFilter_1.JsiSkColorFilter(this.CanvasKit, this.CanvasKit.ColorFilter.MakeLinearToSRGBGamma());
    }
    MakeSRGBToLinearGamma() {
        return new JsiSkColorFilter_1.JsiSkColorFilter(this.CanvasKit, this.CanvasKit.ColorFilter.MakeSRGBToLinearGamma());
    }
    MakeLumaColorFilter() {
        return new JsiSkColorFilter_1.JsiSkColorFilter(this.CanvasKit, this.CanvasKit.ColorFilter.MakeLuma());
    }
}
exports.JsiSkColorFilterFactory = JsiSkColorFilterFactory;

},
"node_modules/@shopify/react-native-skia/src/skia/web/JsiSkTypefaceFactory.tsx":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsiSkTypefaceFactory = void 0;
const Host_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/Host.ts");
const JsiSkTypeface_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkTypeface.ts");
class JsiSkTypefaceFactory extends Host_1.Host {
    constructor(CanvasKit) {
        super(CanvasKit);
    }
    MakeFreeTypeFaceFromData(data) {
        const tf = this.CanvasKit.Typeface.MakeFreeTypeFaceFromData(JsiSkTypeface_1.JsiSkTypeface.fromValue(data));
        if (tf === null) {
            return null;
        }
        return new JsiSkTypeface_1.JsiSkTypeface(this.CanvasKit, tf);
    }
}
exports.JsiSkTypefaceFactory = JsiSkTypefaceFactory;

},
"node_modules/@shopify/react-native-skia/src/skia/web/JsiSkMaskFilterFactory.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsiSkMaskFilterFactory = void 0;
const Host_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/Host.ts");
const JsiSkMaskFilter_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkMaskFilter.ts");
class JsiSkMaskFilterFactory extends Host_1.Host {
    constructor(CanvasKit) {
        super(CanvasKit);
    }
    MakeBlur(style, sigma, respectCTM) {
        return new JsiSkMaskFilter_1.JsiSkMaskFilter(this.CanvasKit, this.CanvasKit.MaskFilter.MakeBlur((0, Host_1.getEnum)(this.CanvasKit, "BlurStyle", style), sigma, respectCTM));
    }
}
exports.JsiSkMaskFilterFactory = JsiSkMaskFilterFactory;

},
"node_modules/@shopify/react-native-skia/src/skia/web/JsiSkRuntimeEffectFactory.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsiSkRuntimeEffectFactory = void 0;
const Host_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/Host.ts");
const JsiSkRuntimeEffect_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkRuntimeEffect.ts");
class JsiSkRuntimeEffectFactory extends Host_1.Host {
    constructor(CanvasKit) {
        super(CanvasKit);
    }
    Make(sksl) {
        const re = this.CanvasKit.RuntimeEffect.Make(sksl);
        if (re === null) {
            return null;
        }
        return new JsiSkRuntimeEffect_1.JsiSkRuntimeEffect(this.CanvasKit, re, sksl);
    }
}
exports.JsiSkRuntimeEffectFactory = JsiSkRuntimeEffectFactory;

},
"node_modules/@shopify/react-native-skia/src/skia/web/JsiSkRuntimeEffect.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsiSkRuntimeEffect = void 0;
const Host_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/Host.ts");
const JsiSkMatrix_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkMatrix.ts");
const JsiSkShader_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkShader.ts");
class JsiSkRuntimeEffect extends Host_1.HostObject {
    constructor(CanvasKit, ref, sksl) {
        super(CanvasKit, ref, "RuntimeEffect");
        this.sksl = sksl;
    }
    source() {
        return this.sksl;
    }
    makeShader(uniforms, localMatrix) {
        return new JsiSkShader_1.JsiSkShader(this.CanvasKit, this.ref.makeShader(uniforms, localMatrix !== undefined
            ? JsiSkMatrix_1.JsiSkMatrix.fromValue(localMatrix)
            : localMatrix));
    }
    makeShaderWithChildren(uniforms, children, localMatrix) {
        return new JsiSkShader_1.JsiSkShader(this.CanvasKit, this.ref.makeShaderWithChildren(uniforms, children?.map((child) => JsiSkShader_1.JsiSkShader.fromValue(child)), localMatrix !== undefined
            ? JsiSkMatrix_1.JsiSkMatrix.fromValue(localMatrix)
            : localMatrix));
    }
    getUniform(index) {
        return this.ref.getUniform(index);
    }
    getUniformCount() {
        return this.ref.getUniformCount();
    }
    getUniformFloatCount() {
        return this.ref.getUniformFloatCount();
    }
    getUniformName(index) {
        return this.ref.getUniformName(index);
    }
}
exports.JsiSkRuntimeEffect = JsiSkRuntimeEffect;

},
"node_modules/@shopify/react-native-skia/src/skia/web/JsiSkImageFilterFactory.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsiSkImageFilterFactory = void 0;
const Host_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/Host.ts");
const JsiSkImageFilter_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkImageFilter.ts");
const JsiSkColorFilter_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkColorFilter.ts");
class JsiSkImageFilterFactory extends Host_1.Host {
    constructor(CanvasKit) {
        super(CanvasKit);
    }
    MakeRuntimeShaderWithChildren(_builder, _sampleRadius, _childShaderNames, _inputs) {
        throw (0, Host_1.throwNotImplementedOnRNWeb)();
    }
    MakeArithmetic(_k1, _k2, _k3, _k4, _enforcePMColor, _background, _foreground, _cropRect) {
        throw (0, Host_1.throwNotImplementedOnRNWeb)();
    }
    MakeCrop(_rect, _tileMode, _input) {
        throw (0, Host_1.throwNotImplementedOnRNWeb)();
    }
    MakeEmpty() {
        throw (0, Host_1.throwNotImplementedOnRNWeb)();
    }
    MakeImage(_image, _srcRect, _dstRect, _filterMode, _mipmap) {
        throw (0, Host_1.throwNotImplementedOnRNWeb)();
    }
    MakeMagnifier(_lensBounds, _zoomAmount, _inset, _filterMode, _mipmap, _input, _cropRect) {
        throw (0, Host_1.throwNotImplementedOnRNWeb)();
    }
    MakeMatrixConvolution(_kernelSizeX, _kernelSizeY, _kernel, _gain, _bias, _kernelOffsetX, _kernelOffsetY, _tileMode, _convolveAlpha, _input, _cropRect) {
        throw (0, Host_1.throwNotImplementedOnRNWeb)();
    }
    MakeMatrixTransform(_matrix, _filterMode, _mipmap, _input) {
        throw (0, Host_1.throwNotImplementedOnRNWeb)();
    }
    MakeMerge(_filters, _cropRect) {
        throw (0, Host_1.throwNotImplementedOnRNWeb)();
    }
    MakePicture(_picture, _targetRect) {
        throw (0, Host_1.throwNotImplementedOnRNWeb)();
    }
    MakeTile(_src, _dst, _input) {
        throw (0, Host_1.throwNotImplementedOnRNWeb)();
    }
    MakeDistantLitDiffuse(_direction, _lightColor, _surfaceScale, _kd, _input, _cropRect) {
        throw (0, Host_1.throwNotImplementedOnRNWeb)();
    }
    MakePointLitDiffuse(_location, _lightColor, _surfaceScale, _kd, _input, _cropRect) {
        throw (0, Host_1.throwNotImplementedOnRNWeb)();
    }
    MakeSpotLitDiffuse(_location, _target, _falloffExponent, _cutoffAngle, _lightColor, _surfaceScale, _kd, _input, _cropRect) {
        throw (0, Host_1.throwNotImplementedOnRNWeb)();
    }
    MakeDistantLitSpecular(_direction, _lightColor, _surfaceScale, _ks, _shininess, _input, _cropRect) {
        throw (0, Host_1.throwNotImplementedOnRNWeb)();
    }
    MakePointLitSpecular(_location, _lightColor, _surfaceScale, _ks, _shininess, _input, _cropRect) {
        throw (0, Host_1.throwNotImplementedOnRNWeb)();
    }
    MakeSpotLitSpecular(_location, _target, _falloffExponent, _cutoffAngle, _lightColor, _surfaceScale, _ks, _shininess, _input, _cropRect) {
        throw (0, Host_1.throwNotImplementedOnRNWeb)();
    }
    MakeOffset(dx, dy, input, cropRect) {
        const inputFilter = input === null || input === undefined
            ? null
            : JsiSkImageFilter_1.JsiSkImageFilter.fromValue(input);
        if (cropRect) {
            console.warn("cropRect is not supported on React Native Web for MakeOffset");
        }
        const filter = this.CanvasKit.ImageFilter.MakeOffset(dx, dy, inputFilter);
        return new JsiSkImageFilter_1.JsiSkImageFilter(this.CanvasKit, filter);
    }
    MakeDisplacementMap(channelX, channelY, scale, in1, input, cropRect) {
        const inputFilter = input === null || input === undefined
            ? null
            : JsiSkImageFilter_1.JsiSkImageFilter.fromValue(input);
        if (cropRect) {
            console.warn("cropRect is not supported on React Native Web for MakeDisplacementMap");
        }
        const filter = this.CanvasKit.ImageFilter.MakeDisplacementMap((0, Host_1.getEnum)(this.CanvasKit, "ColorChannel", channelX), (0, Host_1.getEnum)(this.CanvasKit, "ColorChannel", channelY), scale, JsiSkImageFilter_1.JsiSkImageFilter.fromValue(in1), inputFilter);
        return new JsiSkImageFilter_1.JsiSkImageFilter(this.CanvasKit, filter);
    }
    MakeShader(shader, dither, cropRect) {
        if (dither !== undefined) {
            console.warn("dither parameter is not supported on React Native Web for MakeShader");
        }
        if (cropRect) {
            console.warn("cropRect is not supported on React Native Web for MakeShader");
        }
        const filter = this.CanvasKit.ImageFilter.MakeShader(JsiSkImageFilter_1.JsiSkImageFilter.fromValue(shader));
        return new JsiSkImageFilter_1.JsiSkImageFilter(this.CanvasKit, filter);
    }
    MakeBlur(sigmaX, sigmaY, mode, input, cropRect) {
        if (cropRect) {
            console.warn("cropRect is not supported on React Native Web for MakeBlur");
        }
        return new JsiSkImageFilter_1.JsiSkImageFilter(this.CanvasKit, this.CanvasKit.ImageFilter.MakeBlur(sigmaX, sigmaY, (0, Host_1.getEnum)(this.CanvasKit, "TileMode", mode), input === null || input === undefined
            ? null
            : JsiSkImageFilter_1.JsiSkImageFilter.fromValue(input)));
    }
    MakeColorFilter(colorFilter, input, cropRect) {
        if (cropRect) {
            console.warn("cropRect is not supported on React Native Web for MakeColorFilter");
        }
        return new JsiSkImageFilter_1.JsiSkImageFilter(this.CanvasKit, this.CanvasKit.ImageFilter.MakeColorFilter(JsiSkColorFilter_1.JsiSkColorFilter.fromValue(colorFilter), input === null || input === undefined
            ? null
            : JsiSkImageFilter_1.JsiSkImageFilter.fromValue(input)));
    }
    MakeCompose(outer, inner) {
        return new JsiSkImageFilter_1.JsiSkImageFilter(this.CanvasKit, this.CanvasKit.ImageFilter.MakeCompose(outer === null ? null : JsiSkImageFilter_1.JsiSkImageFilter.fromValue(outer), inner === null ? null : JsiSkImageFilter_1.JsiSkImageFilter.fromValue(inner)));
    }
    MakeDropShadow(dx, dy, sigmaX, sigmaY, color, input, cropRect) {
        const inputFilter = input === null || input === undefined
            ? null
            : JsiSkImageFilter_1.JsiSkImageFilter.fromValue(input);
        if (cropRect) {
            console.warn("cropRect is not supported on React Native Web for MakeDropShadow");
        }
        const filter = this.CanvasKit.ImageFilter.MakeDropShadow(dx, dy, sigmaX, sigmaY, color, inputFilter);
        return new JsiSkImageFilter_1.JsiSkImageFilter(this.CanvasKit, filter);
    }
    MakeDropShadowOnly(dx, dy, sigmaX, sigmaY, color, input, cropRect) {
        const inputFilter = input === null || input === undefined
            ? null
            : JsiSkImageFilter_1.JsiSkImageFilter.fromValue(input);
        if (cropRect) {
            console.warn("cropRect is not supported on React Native Web for MakeDropShadowOnly");
        }
        const filter = this.CanvasKit.ImageFilter.MakeDropShadowOnly(dx, dy, sigmaX, sigmaY, color, inputFilter);
        return new JsiSkImageFilter_1.JsiSkImageFilter(this.CanvasKit, filter);
    }
    MakeErode(rx, ry, input, cropRect) {
        const inputFilter = input === null || input === undefined
            ? null
            : JsiSkImageFilter_1.JsiSkImageFilter.fromValue(input);
        if (cropRect) {
            console.warn("cropRect is not supported on React Native Web for MakeErode");
        }
        const filter = this.CanvasKit.ImageFilter.MakeErode(rx, ry, inputFilter);
        return new JsiSkImageFilter_1.JsiSkImageFilter(this.CanvasKit, filter);
    }
    MakeDilate(rx, ry, input, cropRect) {
        const inputFilter = input === null || input === undefined
            ? null
            : JsiSkImageFilter_1.JsiSkImageFilter.fromValue(input);
        if (cropRect) {
            console.warn("cropRect is not supported on React Native Web for MakeDilate");
        }
        const filter = this.CanvasKit.ImageFilter.MakeDilate(rx, ry, inputFilter);
        return new JsiSkImageFilter_1.JsiSkImageFilter(this.CanvasKit, filter);
    }
    MakeBlend(mode, background, foreground, cropRect) {
        const inputFilter = foreground === null || foreground === undefined
            ? null
            : JsiSkImageFilter_1.JsiSkImageFilter.fromValue(foreground);
        if (cropRect) {
            console.warn("cropRect is not supported on React Native Web for MakeBlend");
        }
        const filter = this.CanvasKit.ImageFilter.MakeBlend((0, Host_1.getEnum)(this.CanvasKit, "BlendMode", mode), JsiSkImageFilter_1.JsiSkImageFilter.fromValue(background), inputFilter);
        return new JsiSkImageFilter_1.JsiSkImageFilter(this.CanvasKit, filter);
    }
    MakeRuntimeShader(_builder, _childShaderName, _input) {
        return (0, Host_1.throwNotImplementedOnRNWeb)();
    }
}
exports.JsiSkImageFilterFactory = JsiSkImageFilterFactory;

},
"node_modules/@shopify/react-native-skia/src/skia/web/JsiSkShaderFactory.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsiSkShaderFactory = void 0;
const Host_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/Host.ts");
const JsiSkMatrix_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkMatrix.ts");
const JsiSkPoint_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkPoint.ts");
const JsiSkShader_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkShader.ts");
class JsiSkShaderFactory extends Host_1.Host {
    constructor(CanvasKit) {
        super(CanvasKit);
    }
    MakeLinearGradient(start, end, colors, pos, mode, localMatrix, flags) {
        return new JsiSkShader_1.JsiSkShader(this.CanvasKit, this.CanvasKit.Shader.MakeLinearGradient(JsiSkPoint_1.JsiSkPoint.fromValue(start), JsiSkPoint_1.JsiSkPoint.fromValue(end), colors, pos, (0, Host_1.getEnum)(this.CanvasKit, "TileMode", mode), localMatrix === undefined
            ? undefined
            : JsiSkMatrix_1.JsiSkMatrix.fromValue(localMatrix), flags));
    }
    MakeRadialGradient(center, radius, colors, pos, mode, localMatrix, flags) {
        return new JsiSkShader_1.JsiSkShader(this.CanvasKit, this.CanvasKit.Shader.MakeRadialGradient(JsiSkPoint_1.JsiSkPoint.fromValue(center), radius, colors, pos, (0, Host_1.getEnum)(this.CanvasKit, "TileMode", mode), localMatrix === undefined
            ? undefined
            : JsiSkMatrix_1.JsiSkMatrix.fromValue(localMatrix), flags));
    }
    MakeTwoPointConicalGradient(start, startRadius, end, endRadius, colors, pos, mode, localMatrix, flags) {
        return new JsiSkShader_1.JsiSkShader(this.CanvasKit, this.CanvasKit.Shader.MakeTwoPointConicalGradient(JsiSkPoint_1.JsiSkPoint.fromValue(start), startRadius, JsiSkPoint_1.JsiSkPoint.fromValue(end), endRadius, colors, pos, (0, Host_1.getEnum)(this.CanvasKit, "TileMode", mode), localMatrix === undefined
            ? undefined
            : JsiSkMatrix_1.JsiSkMatrix.fromValue(localMatrix), flags));
    }
    MakeSweepGradient(cx, cy, colors, pos, mode, localMatrix, flags, startAngleInDegrees, endAngleInDegrees) {
        return new JsiSkShader_1.JsiSkShader(this.CanvasKit, this.CanvasKit.Shader.MakeSweepGradient(cx, cy, colors, pos, (0, Host_1.getEnum)(this.CanvasKit, "TileMode", mode), localMatrix === undefined || localMatrix === null
            ? undefined
            : JsiSkMatrix_1.JsiSkMatrix.fromValue(localMatrix), flags, startAngleInDegrees, endAngleInDegrees));
    }
    MakeTurbulence(baseFreqX, baseFreqY, octaves, seed, tileW, tileH) {
        return new JsiSkShader_1.JsiSkShader(this.CanvasKit, this.CanvasKit.Shader.MakeTurbulence(baseFreqX, baseFreqY, octaves, seed, tileW, tileH));
    }
    MakeFractalNoise(baseFreqX, baseFreqY, octaves, seed, tileW, tileH) {
        return new JsiSkShader_1.JsiSkShader(this.CanvasKit, this.CanvasKit.Shader.MakeFractalNoise(baseFreqX, baseFreqY, octaves, seed, tileW, tileH));
    }
    MakeBlend(mode, one, two) {
        return new JsiSkShader_1.JsiSkShader(this.CanvasKit, this.CanvasKit.Shader.MakeBlend((0, Host_1.getEnum)(this.CanvasKit, "BlendMode", mode), JsiSkShader_1.JsiSkShader.fromValue(one), JsiSkShader_1.JsiSkShader.fromValue(two)));
    }
    MakeColor(color) {
        return new JsiSkShader_1.JsiSkShader(this.CanvasKit, this.CanvasKit.Shader.MakeColor(color, this.CanvasKit.ColorSpace.SRGB));
    }
}
exports.JsiSkShaderFactory = JsiSkShaderFactory;

},
"node_modules/@shopify/react-native-skia/src/skia/web/JsiSkPathEffectFactory.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsiSkPathEffectFactory = void 0;
const Host_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/Host.ts");
const JsiSkMatrix_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkMatrix.ts");
const JsiSkPath_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkPath.ts");
const JsiSkPathEffect_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkPathEffect.ts");
class JsiSkPathEffectFactory extends Host_1.Host {
    constructor(CanvasKit) {
        super(CanvasKit);
    }
    MakeCorner(radius) {
        const pe = this.CanvasKit.PathEffect.MakeCorner(radius);
        if (pe === null) {
            return null;
        }
        return new JsiSkPathEffect_1.JsiSkPathEffect(this.CanvasKit, pe);
    }
    MakeDash(intervals, phase) {
        const pe = this.CanvasKit.PathEffect.MakeDash(intervals, phase);
        return new JsiSkPathEffect_1.JsiSkPathEffect(this.CanvasKit, pe);
    }
    MakeDiscrete(segLength, dev, seedAssist) {
        const pe = this.CanvasKit.PathEffect.MakeDiscrete(segLength, dev, seedAssist);
        return new JsiSkPathEffect_1.JsiSkPathEffect(this.CanvasKit, pe);
    }
    MakeCompose(_outer, _inner) {
        return (0, Host_1.throwNotImplementedOnRNWeb)();
    }
    MakeSum(_outer, _inner) {
        return (0, Host_1.throwNotImplementedOnRNWeb)();
    }
    MakeLine2D(width, matrix) {
        const pe = this.CanvasKit.PathEffect.MakeLine2D(width, JsiSkMatrix_1.JsiSkMatrix.fromValue(matrix));
        if (pe === null) {
            return null;
        }
        return new JsiSkPathEffect_1.JsiSkPathEffect(this.CanvasKit, pe);
    }
    MakePath1D(path, advance, phase, style) {
        const p = JsiSkPath_1.JsiSkPath.pathFromValue(path);
        const pe = this.CanvasKit.PathEffect.MakePath1D(p, advance, phase, (0, Host_1.getEnum)(this.CanvasKit, "Path1DEffect", style));
        p.delete();
        if (pe === null) {
            return null;
        }
        return new JsiSkPathEffect_1.JsiSkPathEffect(this.CanvasKit, pe);
    }
    MakePath2D(matrix, path) {
        const p = JsiSkPath_1.JsiSkPath.pathFromValue(path);
        const pe = this.CanvasKit.PathEffect.MakePath2D(JsiSkMatrix_1.JsiSkMatrix.fromValue(matrix), p);
        p.delete();
        if (pe === null) {
            return null;
        }
        return new JsiSkPathEffect_1.JsiSkPathEffect(this.CanvasKit, pe);
    }
}
exports.JsiSkPathEffectFactory = JsiSkPathEffectFactory;

},
"node_modules/@shopify/react-native-skia/src/skia/web/JsiSkDataFactory.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsiSkDataFactory = void 0;
const Host_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/Host.ts");
const JsiSkData_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkData.ts");
class JsiSkDataFactory extends Host_1.Host {
    constructor(CanvasKit) {
        super(CanvasKit);
    }
    fromURI(uri) {
        return fetch(uri)
            .then((response) => response.arrayBuffer())
            .then((data) => new JsiSkData_1.JsiSkData(this.CanvasKit, data));
    }
    fromBytes(bytes) {
        return new JsiSkData_1.JsiSkData(this.CanvasKit, bytes);
    }
    fromBase64(base64) {
        const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
        return this.fromBytes(bytes);
    }
}
exports.JsiSkDataFactory = JsiSkDataFactory;

},
"node_modules/@shopify/react-native-skia/src/skia/web/JsiSkData.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsiSkData = void 0;
const Host_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/Host.ts");
class JsiSkData extends Host_1.HostObject {
    constructor(CanvasKit, ref) {
        super(CanvasKit, ref, "Data");
    }
}
exports.JsiSkData = JsiSkData;

},
"node_modules/@shopify/react-native-skia/src/skia/web/JsiSkImageFactory.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsiSkImageFactory = void 0;
const types_1 = require("node_modules/@shopify/react-native-skia/src/skia/types/index.ts");
const Host_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/Host.ts");
const JsiSkImage_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkImage.ts");
const JsiSkData_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkData.ts");
class JsiSkImageFactory extends Host_1.Host {
    constructor(CanvasKit) {
        super(CanvasKit);
    }
    MakeNull() {
        return new JsiSkImage_1.JsiSkImage(this.CanvasKit, null);
    }
    MakeImageFromViewTag(viewTag) {
        const view = viewTag;
        console.log(view);
        return Promise.resolve(null);
    }
    MakeImageFromNativeBuffer(buffer, surface, image) {
        if (!(0, types_1.isNativeBufferWeb)(buffer)) {
            throw new Error("Invalid NativeBuffer");
        }
        if (!surface) {
            let img;
            if (buffer instanceof HTMLImageElement ||
                buffer instanceof HTMLVideoElement ||
                buffer instanceof ImageBitmap) {
                img = this.CanvasKit.MakeLazyImageFromTextureSource(buffer);
            }
            else if (buffer instanceof types_1.CanvasKitWebGLBuffer) {
                img = buffer.toImage();
            }
            else {
                img = this.CanvasKit.MakeImageFromCanvasImageSource(buffer);
            }
            return new JsiSkImage_1.JsiSkImage(this.CanvasKit, img);
        }
        else if (!image) {
            const img = surface.makeImageFromTextureSource(buffer);
            return new JsiSkImage_1.JsiSkImage(this.CanvasKit, img);
        }
        else {
            const img = surface.updateTextureFromSource(image, buffer);
            return new JsiSkImage_1.JsiSkImage(this.CanvasKit, img);
        }
    }
    MakeImageFromEncoded(encoded) {
        const image = this.CanvasKit.MakeImageFromEncoded(JsiSkData_1.JsiSkData.fromValue(encoded));
        if (image === null) {
            return null;
        }
        return new JsiSkImage_1.JsiSkImage(this.CanvasKit, image);
    }
    MakeImageFromNativeTextureUnstable() {
        return (0, Host_1.throwNotImplementedOnRNWeb)();
    }
    MakeImage(info, data, bytesPerRow) {
        const image = this.CanvasKit.MakeImage({
            alphaType: (0, Host_1.getEnum)(this.CanvasKit, "AlphaType", info.alphaType),
            colorSpace: this.CanvasKit.ColorSpace.SRGB,
            colorType: (0, Host_1.getEnum)(this.CanvasKit, "ColorType", info.colorType),
            height: info.height,
            width: info.width,
        }, JsiSkData_1.JsiSkData.fromValue(data), bytesPerRow);
        if (image === null) {
            return null;
        }
        return new JsiSkImage_1.JsiSkImage(this.CanvasKit, image);
    }
    MakeImageFromTexture(_texture) {
        return (0, Host_1.throwNotImplementedOnRNWeb)();
    }
    MakeTextureFromImage(_image) {
        return (0, Host_1.throwNotImplementedOnRNWeb)();
    }
}
exports.JsiSkImageFactory = JsiSkImageFactory;

},
"node_modules/@shopify/react-native-skia/src/skia/web/JsiSkSVGFactory.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsiSkSVGFactory = void 0;
const Host_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/Host.ts");
const JsiSkSVG_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkSVG.ts");
class JsiSkSVGFactory extends Host_1.Host {
    constructor(CanvasKit) {
        super(CanvasKit);
    }
    MakeFromData(data) {
        const decoder = new TextDecoder("utf-8");
        const str = decoder.decode(data.ref);
        return this.MakeFromString(str);
    }
    MakeFromString(str) {
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(str, "image/svg+xml");
        const svgElement = svgDoc.documentElement;
        const attrWidth = svgElement.getAttribute("width");
        const attrHeight = svgElement.getAttribute("height");
        let width = attrWidth ? parseFloat(attrWidth) : null;
        let height = attrHeight ? parseFloat(attrHeight) : null;
        const svgDataUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(str);
        const img = new Image();
        img.src = svgDataUrl;
        img.style.display = "none";
        img.alt = "SVG Image";
        if (!width || !height) {
            const viewBox = svgElement.getAttribute("viewBox");
            if (viewBox) {
                const viewBoxValues = viewBox.split(" ");
                if (viewBoxValues.length === 4) {
                    width = width || parseFloat(viewBoxValues[2]);
                    height = height || parseFloat(viewBoxValues[3]);
                }
            }
        }
        if (width && height) {
            img.width = width;
            img.height = height;
        }
        img.onerror = (e) => {
            console.error("SVG failed to load", e);
        };
        document.body.appendChild(img);
        return new JsiSkSVG_1.JsiSkSVG(this.CanvasKit, img);
    }
}
exports.JsiSkSVGFactory = JsiSkSVGFactory;

},
"node_modules/@shopify/react-native-skia/src/skia/web/JsiSkSVG.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsiSkSVG = void 0;
const Host_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/Host.ts");
class JsiSkSVG extends Host_1.HostObject {
    constructor(CanvasKit, ref) {
        super(CanvasKit, ref, "SVG");
    }
    width() {
        return this.ref.width;
    }
    height() {
        return this.ref.height;
    }
    [Symbol.dispose]() {
        if (this.ref.parentNode) {
            this.ref.parentNode.removeChild(this.ref);
        }
    }
}
exports.JsiSkSVG = JsiSkSVG;

},
"node_modules/@shopify/react-native-skia/src/skia/web/JsiSkTextBlobFactory.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsiSkTextBlobFactory = void 0;
const Host_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/Host.ts");
const JsiSkFont_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkFont.ts");
const JsiSkTextBlob_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkTextBlob.ts");
const JsiSkRSXform_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkRSXform.ts");
class JsiSkTextBlobFactory extends Host_1.Host {
    constructor(CanvasKit) {
        super(CanvasKit);
    }
    MakeFromText(str, font) {
        return new JsiSkTextBlob_1.JsiSkTextBlob(this.CanvasKit, this.CanvasKit.TextBlob.MakeFromText(str, JsiSkFont_1.JsiSkFont.fromValue(font)));
    }
    MakeFromGlyphs(glyphs, font) {
        return new JsiSkTextBlob_1.JsiSkTextBlob(this.CanvasKit, this.CanvasKit.TextBlob.MakeFromGlyphs(glyphs, JsiSkFont_1.JsiSkFont.fromValue(font)));
    }
    MakeFromRSXform(str, rsxforms, font) {
        return new JsiSkTextBlob_1.JsiSkTextBlob(this.CanvasKit, this.CanvasKit.TextBlob.MakeFromRSXform(str, rsxforms.map((f) => Array.from(JsiSkRSXform_1.JsiSkRSXform.fromValue(f))).flat(), JsiSkFont_1.JsiSkFont.fromValue(font)));
    }
    MakeFromRSXformGlyphs(glyphs, rsxforms, font) {
        const transforms = rsxforms.flatMap((s) => Array.from(JsiSkRSXform_1.JsiSkRSXform.fromValue(s)));
        return new JsiSkTextBlob_1.JsiSkTextBlob(this.CanvasKit, this.CanvasKit.TextBlob.MakeFromRSXformGlyphs(glyphs, transforms, JsiSkFont_1.JsiSkFont.fromValue(font)));
    }
}
exports.JsiSkTextBlobFactory = JsiSkTextBlobFactory;

},
"node_modules/@shopify/react-native-skia/src/skia/web/JsiSkVerticesFactory.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MakeVertices = void 0;
const JsiSkVertices_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkVertices.ts");
const Host_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/Host.ts");
const concat = (...arrays) => {
    let totalLength = 0;
    for (const arr of arrays) {
        totalLength += arr.length;
    }
    const result = new Float32Array(totalLength);
    let offset = 0;
    for (const arr of arrays) {
        result.set(arr, offset);
        offset += arr.length;
    }
    return result;
};
const MakeVertices = (CanvasKit, mode, positions, textureCoordinates, colors, indices, isVolatile) => new JsiSkVertices_1.JsiSkVertices(CanvasKit, CanvasKit.MakeVertices((0, Host_1.getEnum)(CanvasKit, "VertexMode", mode), positions.map(({ x, y }) => [x, y]).flat(), (textureCoordinates || []).map(({ x, y }) => [x, y]).flat(), !colors ? null : colors.reduce((a, c) => concat(a, c)), indices, isVolatile));
exports.MakeVertices = MakeVertices;

},
"node_modules/@shopify/react-native-skia/src/skia/web/JsiSkTypefaceFontProviderFactory.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsiSkTypefaceFontProviderFactory = void 0;
const Host_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/Host.ts");
const JsiSkTypefaceFontProvider_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkTypefaceFontProvider.ts");
class JsiSkTypefaceFontProviderFactory extends Host_1.Host {
    constructor(CanvasKit) {
        super(CanvasKit);
    }
    Make() {
        const tf = this.CanvasKit.TypefaceFontProvider.Make();
        return new JsiSkTypefaceFontProvider_1.JsiSkTypefaceFontProvider(this.CanvasKit, tf);
    }
}
exports.JsiSkTypefaceFontProviderFactory = JsiSkTypefaceFontProviderFactory;

},
"node_modules/@shopify/react-native-skia/src/skia/web/JsiSkTypefaceFontProvider.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsiSkTypefaceFontProvider = void 0;
const Host_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/Host.ts");
class JsiSkTypefaceFontProvider extends Host_1.HostObject {
    constructor(CanvasKit, ref) {
        super(CanvasKit, ref, "FontMgr");
    }
    matchFamilyStyle(_name, _style) {
        return (0, Host_1.throwNotImplementedOnRNWeb)();
    }
    countFamilies() {
        return this.ref.countFamilies();
    }
    getFamilyName(index) {
        return this.ref.getFamilyName(index);
    }
    registerFont(typeface, familyName) {
        const strLen = lengthBytesUTF8(familyName) + 1;
        const strPtr = this.CanvasKit._malloc(strLen);
        stringToUTF8(this.CanvasKit, familyName, strPtr, strLen);
        this.ref._registerFont(typeface.ref, strPtr);
    }
}
exports.JsiSkTypefaceFontProvider = JsiSkTypefaceFontProvider;
const lengthBytesUTF8 = (str) => {
    const encoder = new TextEncoder();
    const utf8 = encoder.encode(str);
    return utf8.length;
};
const stringToUTF8 = (CanvasKit, str, outPtr, maxBytesToWrite) => {
    const encoder = new TextEncoder();
    const utf8 = encoder.encode(str);
    const heap = CanvasKit.HEAPU8;
    if (utf8.length > maxBytesToWrite) {
        throw new Error("Not enough space to write UTF8 encoded string");
    }
    for (let i = 0; i < utf8.length; i++) {
        heap[outPtr + i] = utf8[i];
    }
    if (utf8.length < maxBytesToWrite) {
        heap[outPtr + utf8.length] = 0;
    }
};

},
"node_modules/@shopify/react-native-skia/src/skia/web/JsiSkFontMgrFactory.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsiSkFontMgrFactory = void 0;
const Host_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/Host.ts");
const JsiSkFontMgr_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkFontMgr.ts");
class JsiSkFontMgrFactory extends Host_1.Host {
    constructor(CanvasKit) {
        super(CanvasKit);
    }
    System() {
        const fontMgr = this.CanvasKit.TypefaceFontProvider.Make();
        if (!fontMgr) {
            throw new Error("Couldn't create system font manager");
        }
        return new JsiSkFontMgr_1.JsiSkFontMgr(this.CanvasKit, fontMgr);
    }
}
exports.JsiSkFontMgrFactory = JsiSkFontMgrFactory;

},
"node_modules/@shopify/react-native-skia/src/skia/web/JsiSkFontMgr.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsiSkFontMgr = void 0;
const Host_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/Host.ts");
class JsiSkFontMgr extends Host_1.HostObject {
    constructor(CanvasKit, ref) {
        super(CanvasKit, ref, "FontMgr");
    }
    dispose() {
        this[Symbol.dispose]();
    }
    countFamilies() {
        return this.ref.countFamilies();
    }
    getFamilyName(index) {
        return this.ref.getFamilyName(index);
    }
    matchFamilyStyle(_familyName, _fontStyle) {
        return (0, Host_1.throwNotImplementedOnRNWeb)();
    }
}
exports.JsiSkFontMgr = JsiSkFontMgr;

},
"node_modules/@shopify/react-native-skia/src/skia/web/JsiSkAnimatedImageFactory.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsiSkAnimatedImageFactory = void 0;
const Host_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/Host.ts");
const JsiSkData_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkData.ts");
const JsiSkAnimatedImage_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkAnimatedImage.ts");
class JsiSkAnimatedImageFactory extends Host_1.Host {
    constructor(CanvasKit) {
        super(CanvasKit);
    }
    MakeAnimatedImageFromEncoded(encoded) {
        const image = this.CanvasKit.MakeAnimatedImageFromEncoded(JsiSkData_1.JsiSkData.fromValue(encoded));
        if (image === null) {
            return null;
        }
        return new JsiSkAnimatedImage_1.JsiSkAnimatedImage(this.CanvasKit, image);
    }
}
exports.JsiSkAnimatedImageFactory = JsiSkAnimatedImageFactory;

},
"node_modules/@shopify/react-native-skia/src/skia/web/JsiSkAnimatedImage.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsiSkAnimatedImage = void 0;
const Host_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/Host.ts");
const JsiSkImage_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkImage.ts");
class JsiSkAnimatedImage extends Host_1.HostObject {
    constructor(CanvasKit, ref) {
        super(CanvasKit, ref, "AnimatedImage");
    }
    decodeNextFrame() {
        return this.ref.decodeNextFrame();
    }
    currentFrameDuration() {
        return this.ref.currentFrameDuration();
    }
    getFrameCount() {
        return this.ref.getFrameCount();
    }
    getCurrentFrame() {
        const image = this.ref.makeImageAtCurrentFrame();
        if (image === null) {
            return null;
        }
        return new JsiSkImage_1.JsiSkImage(this.CanvasKit, image);
    }
}
exports.JsiSkAnimatedImage = JsiSkAnimatedImage;

},
"node_modules/@shopify/react-native-skia/src/skia/web/JsiSkParagraphBuilderFactory.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsiSkParagraphBuilderFactory = void 0;
const Host_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/Host.ts");
const JsiSkParagraphBuilder_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkParagraphBuilder.ts");
const JsiSkParagraphStyle_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkParagraphStyle.ts");
const JsiSkTypefaceFontProvider_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkTypefaceFontProvider.ts");
class JsiSkParagraphBuilderFactory extends Host_1.Host {
    constructor(CanvasKit) {
        super(CanvasKit);
    }
    Make(paragraphStyle, typefaceProvider) {
        const style = new this.CanvasKit.ParagraphStyle(JsiSkParagraphStyle_1.JsiSkParagraphStyle.toParagraphStyle(this.CanvasKit, paragraphStyle ?? {}));
        if (typefaceProvider === undefined) {
            throw new Error("SkTypefaceFontProvider is required on React Native Web.");
        }
        const fontCollection = this.CanvasKit.FontCollection.Make();
        fontCollection.setDefaultFontManager(JsiSkTypefaceFontProvider_1.JsiSkTypefaceFontProvider.fromValue(typefaceProvider));
        fontCollection.enableFontFallback();
        return new JsiSkParagraphBuilder_1.JsiSkParagraphBuilder(this.CanvasKit, this.CanvasKit.ParagraphBuilder.MakeFromFontCollection(style, fontCollection));
    }
}
exports.JsiSkParagraphBuilderFactory = JsiSkParagraphBuilderFactory;

},
"node_modules/@shopify/react-native-skia/src/skia/web/JsiSkParagraphBuilder.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsiSkParagraphBuilder = void 0;
const types_1 = require("node_modules/@shopify/react-native-skia/src/skia/types/index.ts");
const Host_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/Host.ts");
const JsiSkParagraph_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkParagraph.ts");
const JsiSkTextStyle_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkTextStyle.ts");
const JsiSkPaint_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkPaint.ts");
class JsiSkParagraphBuilder extends Host_1.HostObject {
    constructor(CanvasKit, ref) {
        super(CanvasKit, ref, "ParagraphBuilder");
    }
    addPlaceholder(width = 0, height = 0, alignment = types_1.PlaceholderAlignment.Baseline, baseline = types_1.TextBaseline.Alphabetic, offset = 0) {
        this.ref.addPlaceholder(width, height, { value: alignment }, { value: baseline }, offset);
        return this;
    }
    addText(text) {
        this.ref.addText(text);
        return this;
    }
    build() {
        return new JsiSkParagraph_1.JsiSkParagraph(this.CanvasKit, this.ref.build());
    }
    reset() {
        this.ref.reset();
    }
    pushStyle(style, foregroundPaint, backgroundPaint) {
        const textStyle = JsiSkTextStyle_1.JsiSkTextStyle.toTextStyle(style);
        if (foregroundPaint || backgroundPaint) {
            const fg = foregroundPaint
                ? JsiSkPaint_1.JsiSkPaint.fromValue(foregroundPaint)
                : this.makePaint(textStyle.color ?? Float32Array.of(0, 0, 0, 1));
            const bg = backgroundPaint
                ? JsiSkPaint_1.JsiSkPaint.fromValue(backgroundPaint)
                : this.makePaint(textStyle.backgroundColor ?? Float32Array.of(0, 0, 0, 0));
            this.ref.pushPaintStyle(new this.CanvasKit.TextStyle(textStyle), fg, bg);
        }
        else {
            this.ref.pushStyle(new this.CanvasKit.TextStyle(textStyle));
        }
        return this;
    }
    pop() {
        this.ref.pop();
        return this;
    }
    makePaint(color) {
        const paint = new this.CanvasKit.Paint();
        paint.setColor(color);
        return paint;
    }
}
exports.JsiSkParagraphBuilder = JsiSkParagraphBuilder;

},
"node_modules/@shopify/react-native-skia/src/skia/web/JsiSkParagraph.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsiSkParagraph = void 0;
const Host_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/Host.ts");
const JsiSkRect_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkRect.ts");
class JsiSkParagraph extends Host_1.HostObject {
    constructor(CanvasKit, ref) {
        super(CanvasKit, ref, "Paragraph");
    }
    getMinIntrinsicWidth() {
        return this.ref.getMinIntrinsicWidth();
    }
    getMaxIntrinsicWidth() {
        return this.ref.getMaxIntrinsicWidth();
    }
    getLongestLine() {
        return this.ref.getLongestLine();
    }
    layout(width) {
        this.ref.layout(width);
    }
    paint(canvas, x, y) {
        canvas.ref.drawParagraph(this.ref, x, y);
    }
    getHeight() {
        return this.ref.getHeight();
    }
    getMaxWidth() {
        return this.ref.getMaxWidth();
    }
    getGlyphPositionAtCoordinate(x, y) {
        return this.ref.getGlyphPositionAtCoordinate(x, y).pos;
    }
    getRectsForPlaceholders() {
        return this.ref.getRectsForPlaceholders().map(({ rect, dir }) => ({
            rect: new JsiSkRect_1.JsiSkRect(this.CanvasKit, rect),
            direction: dir.value,
        }));
    }
    getRectsForRange(start, end) {
        return this.ref
            .getRectsForRange(start, end, { value: 0 }, { value: 0 })
            .map(({ rect }) => new JsiSkRect_1.JsiSkRect(this.CanvasKit, rect));
    }
    getLineMetrics() {
        return this.ref.getLineMetrics();
    }
}
exports.JsiSkParagraph = JsiSkParagraph;

},
"node_modules/@shopify/react-native-skia/src/skia/web/JsiSkTextStyle.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsiSkTextStyle = void 0;
class JsiSkTextStyle {
    static toTextStyle(value) {
        return {
            backgroundColor: value.backgroundColor,
            color: value.color,
            decoration: value.decoration,
            decorationColor: value.decorationColor,
            decorationStyle: value.decorationStyle
                ? { value: value.decorationStyle }
                : undefined,
            decorationThickness: value.decorationThickness,
            fontFamilies: value.fontFamilies,
            fontSize: value.fontSize,
            fontStyle: value.fontStyle
                ? {
                    slant: value.fontStyle.slant
                        ? { value: value.fontStyle.slant }
                        : undefined,
                    weight: value.fontStyle.weight
                        ? { value: value.fontStyle.weight }
                        : undefined,
                    width: value.fontStyle.width
                        ? { value: value.fontStyle.width }
                        : undefined,
                }
                : undefined,
            fontFeatures: value.fontFeatures,
            foregroundColor: value.foregroundColor,
            fontVariations: value.fontVariations,
            halfLeading: value.halfLeading,
            heightMultiplier: value.heightMultiplier,
            letterSpacing: value.letterSpacing,
            locale: value.locale,
            shadows: value.shadows
                ? value.shadows.map((shadow) => ({
                    blurRadius: shadow.blurRadius,
                    color: shadow.color,
                    offset: shadow.offset
                        ? [shadow.offset.x, shadow.offset.y]
                        : undefined,
                }))
                : undefined,
            textBaseline: value.textBaseline
                ? { value: value.textBaseline }
                : undefined,
            wordSpacing: value.wordSpacing,
        };
    }
}
exports.JsiSkTextStyle = JsiSkTextStyle;

},
"node_modules/@shopify/react-native-skia/src/skia/web/JsiSkParagraphStyle.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsiSkParagraphStyle = void 0;
const types_1 = require("node_modules/@shopify/react-native-skia/src/skia/types/index.ts");
class JsiSkParagraphStyle {
    static toParagraphStyle(ck, value) {
        const ps = new ck.ParagraphStyle({ textStyle: { color: ck.BLACK } });
        ps.disableHinting = value.disableHinting ?? ps.disableHinting;
        ps.ellipsis = value.ellipsis ?? ps.ellipsis;
        ps.heightMultiplier = value.heightMultiplier ?? ps.heightMultiplier;
        ps.maxLines = value.maxLines ?? ps.maxLines;
        ps.replaceTabCharacters =
            value.replaceTabCharacters ?? ps.replaceTabCharacters;
        ps.textAlign =
            value.textAlign !== undefined ? { value: value.textAlign } : ps.textAlign;
        ps.textDirection =
            value.textDirection !== undefined
                ? { value: value.textDirection === types_1.TextDirection.LTR ? 1 : 0 }
                : ps.textDirection;
        ps.textHeightBehavior =
            value.textHeightBehavior !== undefined
                ? { value: value.textHeightBehavior }
                : ps.textHeightBehavior;
        ps.strutStyle = ps.strutStyle ?? {};
        ps.strutStyle.fontFamilies =
            value.strutStyle?.fontFamilies ?? ps.strutStyle.fontFamilies;
        ps.strutStyle.fontSize =
            value.strutStyle?.fontSize ?? ps.strutStyle.fontSize;
        ps.strutStyle.heightMultiplier =
            value.strutStyle?.heightMultiplier ?? ps.strutStyle.heightMultiplier;
        ps.strutStyle.leading = value.strutStyle?.leading ?? ps.strutStyle.leading;
        ps.strutStyle.forceStrutHeight =
            value.strutStyle?.forceStrutHeight ?? ps.strutStyle.forceStrutHeight;
        ps.strutStyle.fontStyle = ps.strutStyle.fontStyle ?? {};
        ps.strutStyle.fontStyle.slant =
            value.strutStyle?.fontStyle?.slant !== undefined
                ? { value: value.strutStyle.fontStyle.slant }
                : ps.strutStyle.fontStyle.slant;
        ps.strutStyle.fontStyle.width =
            value.strutStyle?.fontStyle?.width !== undefined
                ? { value: value.strutStyle.fontStyle.width }
                : ps.strutStyle.fontStyle.width;
        ps.strutStyle.fontStyle.weight =
            value.strutStyle?.fontStyle?.weight !== undefined
                ? { value: value.strutStyle.fontStyle.weight }
                : ps.strutStyle.fontStyle.weight;
        ps.strutStyle.halfLeading =
            value.strutStyle?.halfLeading ?? ps.strutStyle.halfLeading;
        ps.strutStyle.strutEnabled =
            value.strutStyle?.strutEnabled ?? ps.strutStyle.strutEnabled;
        return ps;
    }
}
exports.JsiSkParagraphStyle = JsiSkParagraphStyle;

},
"node_modules/@shopify/react-native-skia/src/skia/web/JsiSkNativeBufferFactory.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsiSkNativeBufferFactory = void 0;
const Host_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/Host.ts");
class JsiSkNativeBufferFactory extends Host_1.Host {
    constructor(CanvasKit) {
        super(CanvasKit);
    }
    MakeFromImage(image) {
        const info = image.getImageInfo();
        const uint8ClampedArray = new Uint8ClampedArray(image.readPixels());
        const imageData = new ImageData(uint8ClampedArray, info.width, info.height);
        const canvas = new OffscreenCanvas(info.width, info.height);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
            throw new Error("Failed to get 2d context from canvas");
        }
        ctx.putImageData(imageData, 0, 0);
        return canvas;
    }
    Release(_nativeBuffer) {
    }
}
exports.JsiSkNativeBufferFactory = JsiSkNativeBufferFactory;

},
"node_modules/@shopify/react-native-skia/src/skia/web/JsiVideo.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsiVideo = exports.createVideo = void 0;
const CanvasKitWebGLBufferImpl_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/CanvasKitWebGLBufferImpl.ts");
const JsiSkImageFactory_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkImageFactory.ts");
const Host_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/Host.ts");
const createVideo = async (CanvasKit, url) => {
    const video = document.createElement("video");
    return new Promise((resolve, reject) => {
        video.src = url;
        video.style.display = "none";
        video.crossOrigin = "anonymous";
        video.volume = 0;
        video.addEventListener("loadedmetadata", () => {
            document.body.appendChild(video);
            resolve(new JsiVideo(new JsiSkImageFactory_1.JsiSkImageFactory(CanvasKit), video));
        });
        video.addEventListener("error", () => {
            reject(new Error(`Failed to load video from URL: ${url}`));
        });
    });
};
exports.createVideo = createVideo;
class JsiVideo {
    constructor(ImageFactory, videoElement) {
        this.ImageFactory = ImageFactory;
        this.videoElement = videoElement;
        this.__typename__ = "Video";
        this.webglBuffer = null;
        document.body.appendChild(this.videoElement);
    }
    duration() {
        return this.videoElement.duration * 1000;
    }
    framerate() {
        return (0, Host_1.throwNotImplementedOnRNWeb)();
    }
    currentTime() {
        return this.videoElement.currentTime * 1000;
    }
    setSurface(surface) {
        this.webglBuffer = new CanvasKitWebGLBufferImpl_1.CanvasKitWebGLBufferImpl(surface, this.videoElement);
    }
    nextImage() {
        return this.ImageFactory.MakeImageFromNativeBuffer(this.webglBuffer ? this.webglBuffer : this.videoElement);
    }
    seek(time) {
        if (isNaN(time)) {
            throw new Error(`Invalid time: ${time}`);
        }
        this.videoElement.currentTime = time / 1000;
    }
    rotation() {
        return 0;
    }
    size() {
        return {
            width: this.videoElement.videoWidth,
            height: this.videoElement.videoHeight,
        };
    }
    pause() {
        this.videoElement.pause();
    }
    play() {
        this.videoElement.play();
    }
    setVolume(volume) {
        this.videoElement.volume = volume;
    }
    setLooping(looping) {
        this.videoElement.loop = looping;
    }
    isPlaying() {
        return !this.videoElement.paused && !this.videoElement.ended;
    }
    [Symbol.dispose]() {
        if (this.videoElement.parentNode) {
            this.videoElement.parentNode.removeChild(this.videoElement);
        }
    }
    dispose() {
        this[Symbol.dispose]();
    }
}
exports.JsiVideo = JsiVideo;

},
"node_modules/@shopify/react-native-skia/src/skia/web/CanvasKitWebGLBufferImpl.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CanvasKitWebGLBufferImpl = void 0;
const types_1 = require("node_modules/@shopify/react-native-skia/src/skia/types/index.ts");
class CanvasKitWebGLBufferImpl extends types_1.CanvasKitWebGLBuffer {
    constructor(surface, source) {
        super();
        this.surface = surface;
        this.source = source;
        this.image = null;
    }
    toImage() {
        if (this.image === null) {
            this.image = this.surface.makeImageFromTextureSource(this.source);
        }
        if (this.image === null) {
            throw new Error("Failed to create image from texture source");
        }
        this.surface.updateTextureFromSource(this.image, this.source);
        return this.image;
    }
}
exports.CanvasKitWebGLBufferImpl = CanvasKitWebGLBufferImpl;

},
"node_modules/@shopify/react-native-skia/src/skia/web/JsiSkottieFactory.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsiSkottieFactory = void 0;
const Host_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/Host.ts");
const JsiSkottieAnimation_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkottieAnimation.ts");
class JsiSkottieFactory extends Host_1.Host {
    constructor(CanvasKit) {
        super(CanvasKit);
    }
    Make(json, assets) {
        const rawAssets = {};
        for (const [key, value] of Object.entries(assets ?? {})) {
            rawAssets[key] = value.ref;
        }
        const animation = this.CanvasKit.MakeManagedAnimation(json, rawAssets);
        if (!animation) {
            throw new Error("Failed to create SkottieAnimation");
        }
        return new JsiSkottieAnimation_1.JsiSkottieAnimation(this.CanvasKit, animation);
    }
}
exports.JsiSkottieFactory = JsiSkottieFactory;

},
"node_modules/@shopify/react-native-skia/src/skia/web/JsiSkottieAnimation.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsiSkottieAnimation = void 0;
const Host_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/Host.ts");
const JsiSkTypeface_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkTypeface.ts");
const JsiSkColor_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkColor.ts");
const JsiSkRect_1 = require("node_modules/@shopify/react-native-skia/src/skia/web/JsiSkRect.ts");
class JsiSkottieAnimation extends Host_1.HostObject {
    constructor(CanvasKit, ref) {
        super(CanvasKit, ref, "SkottieAnimation");
    }
    getOpacityProps() {
        return this.ref.getOpacityProps();
    }
    getTextProps() {
        return this.ref.getTextProps();
    }
    getColorProps() {
        return this.ref
            .getColorProps()
            .map(({ key, value }) => ({ key, value: (0, JsiSkColor_1.Color)(value) }));
    }
    getTransformProps() {
        return this.ref.getTransformProps().map(({ key, value }) => ({
            key,
            value: {
                anchor: { x: value.anchor[0], y: value.anchor[1] },
                position: { x: value.position[0], y: value.position[1] },
                scale: { x: value.scale[0], y: value.scale[1] },
                rotation: value.rotation,
                skew: value.skew,
                skewAxis: value.skew_axis,
            },
        }));
    }
    setColor(key, color) {
        return this.ref.setColor(key, color);
    }
    setText(key, text, size) {
        return this.ref.setText(key, text, size);
    }
    setOpacity(key, opacity) {
        return this.ref.setOpacity(key, opacity);
    }
    setTransform(key, anchor, position, scale, rotation, skew, skewAxis) {
        const a = Float32Array.of(anchor.x, anchor.y);
        const p = Float32Array.of(position.x, position.y);
        const s = Float32Array.of(scale.x, scale.y);
        return this.ref.setTransform(key, a, p, s, rotation, skew, skewAxis);
    }
    getSlotInfo() {
        return this.ref.getSlotInfo();
    }
    setColorSlot(key, color) {
        return this.ref.setColorSlot(key, color);
    }
    setScalarSlot(key, scalar) {
        return this.ref.setScalarSlot(key, scalar);
    }
    setVec2Slot(key, vec2) {
        return this.ref.setVec2Slot(key, Float32Array.of(vec2.x, vec2.y));
    }
    setTextSlot(key, text) {
        const txt = {
            typeface: text.typeface && text.typeface instanceof JsiSkTypeface_1.JsiSkTypeface
                ? text.typeface.ref
                : null,
            text: text.text ?? "",
            textSize: text.textSize ?? 0,
            minTextSize: text.minTextSize ?? 0,
            maxTextSize: text.maxTextSize ?? Number.MAX_VALUE,
            strokeWidth: text.strokeWidth ?? 0,
            lineHeight: text.lineHeight ?? 0,
            lineShift: text.lineShift ?? 0,
            ascent: text.ascent,
            maxLines: text.maxLines,
            horizAlign: this.CanvasKit.TextAlign.Left,
            vertAlign: this.CanvasKit.VerticalTextAlign.Top,
            strokeJoin: this.CanvasKit.StrokeJoin.Miter,
            direction: this.CanvasKit.TextDirection.LTR,
            linebreak: this.CanvasKit.LineBreakType.HardLineBreak,
            resize: this.CanvasKit.ResizePolicy.None,
            boundingBox: text.boundingBox
                ? this.CanvasKit.XYWHRect(text.boundingBox.x, text.boundingBox.y, text.boundingBox.width, text.boundingBox.height)
                : [0, 0, 0, 0],
            fillColor: text.fillColor
                ? (0, JsiSkColor_1.Color)(text.fillColor)
                : this.CanvasKit.TRANSPARENT,
            strokeColor: text.strokeColor
                ? (0, JsiSkColor_1.Color)(text.strokeColor)
                : this.CanvasKit.TRANSPARENT,
        };
        return this.ref.setTextSlot(key, txt);
    }
    setImageSlot(key, assetName) {
        return this.ref.setImageSlot(key, assetName);
    }
    getColorSlot(key) {
        const color = this.ref.getColorSlot(key);
        return color;
    }
    getScalarSlot(key) {
        return this.ref.getScalarSlot(key);
    }
    getVec2Slot(key) {
        const vec2 = this.ref.getVec2Slot(key);
        if (!vec2) {
            return null;
        }
        return { x: vec2[0], y: vec2[1] };
    }
    getTextSlot(key) {
        const result = this.ref.getTextSlot(key);
        const textSlot = {};
        if (result) {
            if (result.typeface) {
                textSlot.typeface = new JsiSkTypeface_1.JsiSkTypeface(this.CanvasKit, result.typeface);
            }
            if (result.text) {
                textSlot.text = result.text;
            }
            if (result.textSize) {
                textSlot.textSize = result.textSize;
            }
            if (result.minTextSize) {
                textSlot.minTextSize = result.minTextSize;
            }
            if (result.maxTextSize) {
                textSlot.maxTextSize = result.maxTextSize;
            }
            if (result.strokeWidth) {
                textSlot.strokeWidth = result.strokeWidth;
            }
            if (result.lineHeight) {
                textSlot.lineHeight = result.lineHeight;
            }
            if (result.lineShift) {
                textSlot.lineShift = result.lineShift;
            }
            if (result.ascent) {
                textSlot.ascent = result.ascent;
            }
            if (result.maxLines) {
                textSlot.maxLines = result.maxLines;
            }
        }
        return textSlot;
    }
    duration() {
        return this.ref.duration();
    }
    fps() {
        return this.ref.fps();
    }
    render(canvas, dstRect) {
        const [width, height] = this.ref.size();
        this.ref.render(canvas.ref, dstRect && dstRect instanceof JsiSkRect_1.JsiSkRect
            ? dstRect.ref
            : Float32Array.of(0, 0, width, height));
    }
    seekFrame(frame, damageRect) {
        const result = this.ref.seekFrame(frame);
        if (damageRect && damageRect instanceof JsiSkRect_1.JsiSkRect) {
            damageRect.ref[0] = result[0];
            damageRect.ref[1] = result[1];
            damageRect.ref[2] = result[2];
            damageRect.ref[3] = result[3];
        }
    }
    size() {
        const [width, height] = this.ref.size();
        return { width, height };
    }
    version() {
        return this.ref.version();
    }
}
exports.JsiSkottieAnimation = JsiSkottieAnimation;

},
"src/features/share/offline/fontAdapter.js":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MIN_SCALE_FACTOR = exports.LINE_HEIGHT_MULTIPLIER = exports.LABEL_FAMILIES = void 0;
exports.fontFamilies = fontFamilies;
exports.fontWeight = fontWeight;
exports.textAlign = textAlign;
const react_native_skia_1 = require("src/features/share/offline/skiaAdapter.js");
const fontCatalog_1 = require("src/core/template/fontCatalog.ts");
const fontRuntime_1 = require("src/features/share/fontRuntime.ts");
const requirements_1 = require("src/features/share/offline/requirements.ts");
function fontFamilies(design, fontId) { return [...(0, fontCatalog_1.posterFontChain)(fontId || requirements_1.DEFAULT_FONT_IDS[design] || 'noto-sans-sc'), requirements_1.OFFLINE_EMOJI_FONT.id].map(fontCatalog_1.posterFontFamily); }
const LABEL_FAMILIES = () => fontFamilies('等宽', 'space-grotesk');
exports.LABEL_FAMILIES = LABEL_FAMILIES;
const WEIGHTS = { 细: react_native_skia_1.FontWeight.Light, 常规: react_native_skia_1.FontWeight.Normal, 中等: react_native_skia_1.FontWeight.Medium, 半粗: react_native_skia_1.FontWeight.SemiBold, 粗体: react_native_skia_1.FontWeight.Bold, 特粗: react_native_skia_1.FontWeight.Black };
function fontWeight(weight, fontId) { const id = fontId || 'noto-sans-sc'; return (0, fontCatalog_1.posterFontWeight)(id, WEIGHTS[weight] || react_native_skia_1.FontWeight.Normal, (0, fontRuntime_1.registeredFontWeight)(id)); }
function textAlign(alignment) { return { 左对齐: react_native_skia_1.TextAlign.Left, 居中: react_native_skia_1.TextAlign.Center, 右对齐: react_native_skia_1.TextAlign.Right }[alignment] ?? react_native_skia_1.TextAlign.Left; }
exports.LINE_HEIGHT_MULTIPLIER = 1.4;
exports.MIN_SCALE_FACTOR = 0.7;

},
"src/features/share/fontRuntime.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.posterFontProvider = posterFontProvider;
exports.posterFontRevision = posterFontRevision;
exports.fontIsRegistered = fontIsRegistered;
exports.registeredFontIdentity = registeredFontIdentity;
exports.registeredFontWeight = registeredFontWeight;
exports.subscribePosterFonts = subscribePosterFonts;
exports.registerPosterTypefaces = registerPosterTypefaces;
const react_native_skia_1 = require("src/features/share/offline/skiaAdapter.js");
const fontCatalog_1 = require("src/core/template/fontCatalog.ts");
let provider;
let revision = 0;
const identities = new Map();
const retainedFaces = new Map();
const singleWeights = new Map();
const listeners = new Set();
function posterFontProvider() { return provider; }
function posterFontRevision() { return revision; }
function fontIsRegistered(id) { return identities.has(id); }
function registeredFontIdentity(id) { return identities.get(id); }
function registeredFontWeight(id) { return singleWeights.get(id); }
function subscribePosterFonts(listener) {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
}
function registerPosterTypefaces(id, identity, faces, singleWeight) {
    const existing = identities.get(id);
    if (existing && existing !== identity)
        throw new Error(`字体标识冲突：${id}`);
    if (existing)
        return;
    provider ?? (provider = react_native_skia_1.Skia.TypefaceFontProvider.Make());
    faces.forEach((face) => provider.registerFont(face, (0, fontCatalog_1.posterFontFamily)(id)));
    retainedFaces.set(id, faces);
    identities.set(id, identity);
    if (singleWeight !== undefined)
        singleWeights.set(id, singleWeight);
    revision += 1;
    listeners.forEach((listener) => listener());
}

},
"src/features/share/offline/requirements.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_FONT_IDS = exports.OFFLINE_EMOJI_FONT = void 0;
exports.requiredFonts = requiredFonts;
const fontCatalog_1 = require("src/core/template/fontCatalog.ts");
const model_1 = require("src/core/template/model.ts");
exports.OFFLINE_EMOJI_FONT = { id: 'noto-emoji', file: 'NotoEmoji-Regular.ttf', weight: 400 };
exports.DEFAULT_FONT_IDS = { 黑体: 'noto-sans-sc', 宋体: 'noto-serif-sc', 圆体: 'lxgw-wenkai', 等宽: 'space-grotesk' };
const WEIGHTS = { 细: 300, 常规: 400, 中等: 500, 半粗: 600, 粗体: 700, 特粗: 900 };
function requiredFonts(template) {
    const result = new Map();
    (0, model_1.walkNodes)(template.root, node => {
        if (node.kind !== 'text')
            return;
        const id = node.fontId || exports.DEFAULT_FONT_IDS[node.design] || 'noto-sans-sc';
        const custom = template.fontAssets?.find(asset => asset.id === id);
        const requested = [(0, fontCatalog_1.posterFontWeight)(id, WEIGHTS[node.weight] || 400, custom?.weight)];
        if (node.label)
            requested.push((0, fontCatalog_1.posterFontWeight)(id, node.inlineLabel ? WEIGHTS[node.weight] || 400 : 600, custom?.weight));
        for (const family of (0, fontCatalog_1.posterFontChain)(id)) {
            const definition = (0, fontCatalog_1.posterFont)(family);
            if (!definition)
                continue;
            for (const weight of requested) {
                const bold = !!definition.boldFile && weight >= 550, file = bold ? definition.boldFile : definition.file;
                result.set(file, { id: family, file, weight: bold ? 700 : 400 });
            }
        }
        result.set(exports.OFFLINE_EMOJI_FONT.file, exports.OFFLINE_EMOJI_FONT);
    });
    return [...result.values()];
}

},
"src/features/share/painter.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CANVAS_LAYER_ID = void 0;
exports.skColor = skColor;
exports.imagePlacement = imagePlacement;
exports.paintScene = paintScene;
exports.boundingBox = boundingBox;
exports.renderScenePNG = renderScenePNG;
const react_native_skia_1 = require("src/features/share/offline/skiaAdapter.js");
const paths_1 = require("src/design/artwork/paths.ts");
const ArtworkPainter_1 = require("src/design/artwork/ArtworkPainter.ts");
const measure_1 = require("src/features/share/measure.ts");
exports.CANVAS_LAYER_ID = 'canvas';
function skColor(value, alpha = 1) {
    return Float32Array.of(value.red, value.green, value.blue, value.alpha * alpha);
}
const WHITE = Float32Array.of(1, 1, 1, 1);
function fillPaint(color) {
    const paint = react_native_skia_1.Skia.Paint();
    paint.setAntiAlias(true);
    paint.setStyle(react_native_skia_1.PaintStyle.Fill);
    paint.setColor(color);
    return paint;
}
function strokePaint(color, width, dash) {
    const paint = react_native_skia_1.Skia.Paint();
    paint.setAntiAlias(true);
    paint.setStyle(react_native_skia_1.PaintStyle.Stroke);
    paint.setStrokeWidth(width);
    paint.setColor(color);
    if (dash && dash[0] > 0 && dash[1] > 0)
        paint.setPathEffect(react_native_skia_1.Skia.PathEffect.MakeDash(dash, 0));
    return paint;
}
const rect = (x, y, width, height) => react_native_skia_1.Skia.XYWHRect(x, y, width, height);
function imagePlacement(input) {
    const fw = Math.max(0, input.frameWidth);
    const fh = Math.max(0, input.frameHeight);
    const iw = input.imageWidth;
    const ih = input.imageHeight;
    if (!(iw > 0) || !(ih > 0)) {
        return { x: 0, y: 0, width: fw, height: fh, overflowX: 0, overflowY: 0 };
    }
    const zoom = Number.isFinite(input.zoom) && input.zoom > 0 ? input.zoom : 1;
    const base = input.fit === 'contain' ? Math.min(fw / iw, fh / ih) : Math.max(fw / iw, fh / ih);
    const scale = base * zoom;
    const width = iw * scale;
    const height = ih * scale;
    const overflowX = width - fw;
    const overflowY = height - fh;
    return {
        x: unsigned(-overflowX * clamp01(input.focusX)),
        y: unsigned(-overflowY * clamp01(input.focusY)),
        width,
        height,
        overflowX,
        overflowY,
    };
}
function unsigned(value) {
    return value === 0 ? 0 : value;
}
function clamp01(value) {
    if (!Number.isFinite(value))
        return 0.5;
    return Math.min(1, Math.max(0, value));
}
function drawPlacedImage(canvas, image, x, y, width, height, placement, paint) {
    const iw = image.width();
    const ih = image.height();
    const placed = imagePlacement({
        frameWidth: width,
        frameHeight: height,
        imageWidth: iw,
        imageHeight: ih,
        ...placement,
    });
    if (!(iw > 0) || !(ih > 0))
        return placed;
    canvas.drawImageRectOptions(image, rect(0, 0, iw, ih), rect(x + placed.x, y + placed.y, placed.width, placed.height), react_native_skia_1.FilterMode.Linear, react_native_skia_1.MipmapMode.Linear, paint ?? null);
    return placed;
}
function paintScene(canvas, scene, context) {
    var _a;
    const frames = {};
    frames[exports.CANVAS_LAYER_ID] = { x: 0, y: 0, width: scene.width, height: scene.height };
    canvas.save();
    if (context.clipToCanvas !== false)
        canvas.clipRect(rect(0, 0, scene.width, scene.height), react_native_skia_1.ClipOp.Intersect, true);
    if (scene.paintsBackground) {
        canvas.drawRect(rect(0, 0, scene.width, scene.height), fillPaint(skColor(scene.background)));
        const background = scene.backgroundImage;
        const image = background ? (context.images.get(background.source.key) ?? null) : null;
        if (background && image) {
            canvas.save();
            canvas.clipRect(rect(0, 0, scene.width, scene.height), react_native_skia_1.ClipOp.Intersect, true);
            const paint = react_native_skia_1.Skia.Paint();
            paint.setAlphaf(background.opacity);
            const placed = drawPlacedImage(canvas, image, 0, 0, scene.width, scene.height, { fit: 'cover', focusX: background.focusX, focusY: background.focusY, zoom: background.zoom }, paint);
            frames[exports.CANVAS_LAYER_ID] = {
                x: 0,
                y: 0,
                width: scene.width,
                height: scene.height,
                overflowX: placed.overflowX,
                overflowY: placed.overflowY,
            };
            canvas.restore();
        }
    }
    let clipDepth = 0;
    for (const item of scene.items) {
        if (item.kind === 'clipBegin' || item.kind === 'clipEnd') {
            if (item.kind === 'clipBegin') {
                beginClip(canvas, item);
                clipDepth += 1;
                frames[_a = item.id] ?? (frames[_a] = { ...item.frame });
            }
            else if (clipDepth > 0) {
                canvas.restore();
                clipDepth -= 1;
            }
            continue;
        }
        frames[item.id] = paintItem(canvas, item, context);
    }
    while (clipDepth > 0) {
        canvas.restore();
        clipDepth -= 1;
    }
    canvas.restore();
    return frames;
}
function beginClip(canvas, item) {
    const { x, y, width, height } = item.frame;
    const radius = item.cornerRadius;
    canvas.save();
    if (item.rotation === 0) {
        canvas.clipRRect(react_native_skia_1.Skia.RRectXY(rect(x, y, width, height), radius, radius), react_native_skia_1.ClipOp.Intersect, true);
        return;
    }
    const cx = x + width / 2;
    const cy = y + height / 2;
    canvas.translate(cx, cy);
    canvas.rotate(item.rotation, 0, 0);
    canvas.clipRRect(react_native_skia_1.Skia.RRectXY(rect(-width / 2, -height / 2, width, height), radius, radius), react_native_skia_1.ClipOp.Intersect, true);
    canvas.rotate(-item.rotation, 0, 0);
    canvas.translate(-cx, -cy);
}
function paintItem(canvas, item, context) {
    const { x, y, width, height } = item.frame;
    canvas.save();
    canvas.translate(x, y);
    if (item.rotation !== 0)
        canvas.rotate(item.rotation, width / 2, height / 2);
    let layered = false;
    if (item.opacity < 1) {
        const paint = react_native_skia_1.Skia.Paint();
        paint.setAlphaf(item.opacity);
        canvas.saveLayer(paint);
        layered = true;
    }
    let placed = null;
    switch (item.kind) {
        case 'fill':
            paintFill(canvas, item, width, height);
            break;
        case 'image':
            placed = paintImage(canvas, item, context, width, height);
            break;
        case 'shape':
            paintShape(canvas, item, width, height);
            break;
        case 'mask':
            canvas.drawRRect(react_native_skia_1.Skia.RRectXY(rect(0, 0, width, height), item.cornerRadius, item.cornerRadius), fillPaint(WHITE));
            break;
        default:
            paintText(canvas, item, width);
            break;
    }
    if (layered)
        canvas.restore();
    canvas.restore();
    return placed
        ? { x, y, width, height, overflowX: placed.overflowX, overflowY: placed.overflowY }
        : { x, y, width, height };
}
function boundingBox(frame, degrees) {
    const radians = (degrees * Math.PI) / 180;
    const cos = Math.abs(Math.cos(radians));
    const sin = Math.abs(Math.sin(radians));
    const w = frame.width * cos + frame.height * sin;
    const h = frame.width * sin + frame.height * cos;
    return {
        x: frame.x + frame.width / 2 - w / 2,
        y: frame.y + frame.height / 2 - h / 2,
        width: w,
        height: h,
    };
}
function paintFill(canvas, item, width, height) {
    const radius = item.cornerRadius;
    if (item.color) {
        canvas.drawRRect(react_native_skia_1.Skia.RRectXY(rect(0, 0, width, height), radius, radius), fillPaint(skColor(item.color)));
    }
    const stroke = item.stroke;
    if (stroke) {
        const inset = react_native_skia_1.Skia.RRectXY(rect(stroke.width / 2, stroke.width / 2, Math.max(0, width - stroke.width), Math.max(0, height - stroke.width)), radius, radius);
        const dash = stroke.dashLength > 0 && stroke.dashGap > 0 ? [stroke.dashLength, stroke.dashGap] : undefined;
        canvas.drawRRect(inset, strokePaint(skColor(stroke.color), stroke.width, dash));
    }
}
function paintImage(canvas, item, context, width, height) {
    const radius = item.cornerRadius;
    const border = Math.max(0, Math.min(item.border, Math.min(width, height) / 2));
    const outer = rect(0, 0, width, height);
    const rounded = react_native_skia_1.Skia.RRectXY(outer, radius, radius);
    if (item.shadow) {
        const paint = fillPaint(Float32Array.of(0, 0, 0, 0.22));
        paint.setMaskFilter(react_native_skia_1.Skia.MaskFilter.MakeBlur(react_native_skia_1.BlurStyle.Normal, 6, true));
        canvas.save();
        canvas.translate(0, 8);
        canvas.drawRRect(rounded, paint);
        canvas.restore();
    }
    canvas.save();
    canvas.clipRRect(rounded, react_native_skia_1.ClipOp.Intersect, true);
    if (border > 0)
        canvas.drawRRect(rounded, fillPaint(WHITE));
    const innerW = Math.max(0, width - border * 2);
    const innerH = Math.max(0, height - border * 2);
    const innerRadius = Math.max(0, radius - border);
    canvas.save();
    canvas.clipRRect(react_native_skia_1.Skia.RRectXY(rect(border, border, innerW, innerH), innerRadius, innerRadius), react_native_skia_1.ClipOp.Intersect, true);
    if (item.tilt !== 0) {
        canvas.translate(border + innerW / 2, border + innerH / 2);
        canvas.rotate(item.tilt, 0, 0);
        canvas.translate(-(border + innerW / 2), -(border + innerH / 2));
    }
    const image = item.source ? (context.images.get(item.source.key) ?? null) : null;
    let placed = null;
    if (image) {
        placed = drawPlacedImage(canvas, image, border, border, innerW, innerH, {
            fit: item.fit,
            focusX: item.focusX,
            focusY: item.focusY,
            zoom: item.zoom,
        });
    }
    else if (item.artwork !== null) {
        canvas.save();
        canvas.translate(border, border);
        (0, ArtworkPainter_1.drawArtworkSheet)(canvas, (0, ArtworkPainter_1.coverArt)(item.artwork), innerW, innerH);
        canvas.restore();
    }
    canvas.restore();
    canvas.restore();
    return placed;
}
function paintShape(canvas, item, w, h) {
    const x = 0;
    const y = 0;
    const color = skColor(item.color);
    const stroke = item.strokeWidth;
    const dash = item.dashLength > 0 && item.dashGap > 0 ? [item.dashLength, item.dashGap] : undefined;
    const radius = item.cornerRadius;
    switch (item.shape) {
        case '矩形': {
            const rr = react_native_skia_1.Skia.RRectXY(rect(x, y, w, h), radius, radius);
            if (stroke > 0) {
                const inset = react_native_skia_1.Skia.RRectXY(rect(x + stroke / 2, y + stroke / 2, w - stroke, h - stroke), radius, radius);
                canvas.drawRRect(inset, strokePaint(color, stroke, dash));
            }
            else
                canvas.drawRRect(rr, fillPaint(color));
            break;
        }
        case '圆形': {
            if (stroke > 0) {
                canvas.drawOval(rect(x + stroke / 2, y + stroke / 2, w - stroke, h - stroke), strokePaint(color, stroke, dash));
            }
            else
                canvas.drawOval(rect(x, y, w, h), fillPaint(color));
            break;
        }
        case '直线': {
            const paint = strokePaint(color, Math.max(0.5, stroke), dash);
            paint.setStrokeCap(react_native_skia_1.StrokeCap.Butt);
            const path = react_native_skia_1.Skia.PathBuilder.Make();
            path.moveTo(x, y + h / 2);
            path.lineTo(x + w, y + h / 2);
            canvas.drawPath(path.build(), paint);
            break;
        }
        case '唱片纹': {
            const gap = Math.max(2, item.dashGap > 0 ? item.dashGap : 8);
            const side = Math.min(w, h);
            const count = Math.max(1, Math.floor(side / 2 / gap));
            const paint = strokePaint(color, Math.max(0.5, stroke));
            for (let i = 0; i < count; i += 1) {
                const pad = i * gap;
                canvas.drawOval(rect(x + pad, y + pad, w - pad * 2, h - pad * 2), paint);
            }
            break;
        }
        case '点阵': {
            const gap = Math.max(3, item.dashGap > 0 ? item.dashGap : 18);
            const diameter = Math.max(0.5, stroke > 0 ? stroke : 1.5);
            const paint = fillPaint(color);
            for (let px = gap / 2; px < w; px += gap) {
                for (let py = gap / 2; py < h; py += gap) {
                    canvas.drawOval(rect(x + px - diameter / 2, y + py - diameter / 2, diameter, diameter), paint);
                }
            }
            break;
        }
        case '胶片孔': {
            const hole = Math.max(2, item.dashLength > 0 ? item.dashLength : 14);
            const gap = Math.max(1, item.dashGap > 0 ? item.dashGap : 10);
            const count = Math.max(1, Math.floor((w + gap) / (hole + gap)));
            const total = count * hole + (count - 1) * gap;
            const paint = fillPaint(color);
            let px = (w - total) / 2;
            for (let i = 0; i < count; i += 1) {
                canvas.drawRRect(react_native_skia_1.Skia.RRectXY(rect(x + px, y, hole, h), radius, radius), paint);
                px += hole + gap;
            }
            break;
        }
        case '锯齿边': {
            const tooth = Math.max(2, item.dashLength > 0 ? item.dashLength : 9);
            canvas.drawPath(zigzagPath(x, y, w, h, tooth), fillPaint(color));
            break;
        }
        case '渐变': {
            const paint = react_native_skia_1.Skia.Paint();
            paint.setAntiAlias(true);
            paint.setShader(react_native_skia_1.Skia.Shader.MakeLinearGradient({ x: 0, y }, { x: 0, y: y + h }, [skColor(item.color), skColor(item.color, 0)], null, react_native_skia_1.TileMode.Clamp));
            canvas.drawRect(rect(x, y, w, h), paint);
            break;
        }
    }
}
function zigzagPath(x, y, w, h, tooth) {
    const path = react_native_skia_1.Skia.PathBuilder.Make();
    const count = Math.max(1, Math.floor(w / tooth));
    const step = w / count;
    path.moveTo(x, y + tooth);
    for (let i = 0; i < count; i += 1) {
        path.lineTo(x + step * (i + 0.5), y);
        path.lineTo(x + step * (i + 1), y + tooth);
    }
    path.lineTo(x + w, y + h - tooth);
    for (let i = 0; i < count; i += 1) {
        path.lineTo(x + w - step * (i + 0.5), y + h);
        path.lineTo(x + w - step * (i + 1), y + h - tooth);
    }
    path.close();
    return path.build();
}
function paintText(canvas, item, frameWidth) {
    const fs = item.fontSize;
    const color = skColor(item.color, item.placeholder ? 0.45 : 1);
    const block = (0, measure_1.layoutTextBlock)({
        text: item.value,
        label: item.label,
        inlineLabel: item.inlineLabel,
        fontSize: fs,
        weight: item.weight,
        design: item.design,
        fontId: item.fontId,
        alignment: item.align,
        tracking: item.tracking,
        lineLimit: item.lineLimit,
        chip: item.chip !== null,
        barcode: item.content === 'barcode',
        maxWidth: frameWidth,
    }, { value: color, label: skColor(item.color, item.inlineLabel ? 1 : 0.6) });
    const boxWidth = block.width;
    const boxHeight = block.height;
    const boxX = item.align === '左对齐' ? 0 : item.align === '居中' ? (frameWidth - boxWidth) / 2 : frameWidth - boxWidth;
    const boxY = 0;
    if (item.chip) {
        canvas.drawRRect(react_native_skia_1.Skia.RRectXY(rect(boxX, boxY, boxWidth, boxHeight), fs * 0.5, fs * 0.5), fillPaint(skColor(item.chip)));
    }
    const originY = boxY + block.vpad;
    const blockX = boxX + block.hpad;
    const contentWidth = block.contentWidth;
    const shift = (width) => item.align === '左对齐' ? 0 : item.align === '居中' ? (contentWidth - width) / 2 : contentWidth - width;
    if (item.inlineLabel && block.label) {
        block.label.paragraph.paint(canvas, blockX, originY);
        block.value.paragraph.paint(canvas, blockX + shift(block.value.laidOutWidth), originY);
    }
    else {
        let cursor = originY;
        if (block.label) {
            block.label.paragraph.paint(canvas, blockX + shift(block.label.width), cursor);
            cursor += block.label.height + block.gap;
        }
        if (item.content === 'barcode') {
            paintBarcode(canvas, item, blockX, cursor, contentWidth, block.value.height);
        }
        else {
            block.value.paragraph.paint(canvas, blockX + shift(block.value.laidOutWidth), cursor);
        }
    }
    if (item.placeholder) {
        canvas.drawRRect(react_native_skia_1.Skia.RRectXY(rect(boxX, boxY, boxWidth, boxHeight), 4, 4), strokePaint(skColor(item.color, 0.5), 1, [3, 3]));
    }
}
function paintBarcode(canvas, item, x, y, width, height) {
    const paint = fillPaint(skColor(item.color));
    for (const bar of (0, paths_1.barcodeBars)(item.barcodeSeed, width)) {
        canvas.drawRect(rect(x + bar.x, y, bar.width, height), paint);
    }
}
function renderScenePNG(scene, context, pixelWidth) {
    const scale = pixelWidth / scene.width;
    const width = Math.max(1, Math.round(pixelWidth));
    const height = Math.max(1, Math.round(scene.height * scale));
    const surface = react_native_skia_1.Skia.Surface.MakeOffscreen(width, height) ?? react_native_skia_1.Skia.Surface.Make(width, height);
    if (!surface)
        return null;
    const canvas = surface.getCanvas();
    canvas.save();
    canvas.scale(scale, scale);
    paintScene(canvas, scene, context);
    canvas.restore();
    surface.flush();
    return surface.makeImageSnapshot().encodeToBytes(react_native_skia_1.ImageFormat.PNG, 100);
}

},
"src/design/artwork/paths.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GRAIN_TILE_SIDE = exports.TICKET_MIN_POSTER_ROOM = exports.TICKET_POSTER_RATIO = exports.TICKET_TEAR_HEIGHT = exports.TICKET_CUTOUT = exports.TICKET_RADIUS = void 0;
exports.stubLayout = stubLayout;
exports.ticketSpec = ticketSpec;
exports.receiptPoints = receiptPoints;
exports.barcodeSalt = barcodeSalt;
exports.barcodeBars = barcodeBars;
exports.grainTileDots = grainTileDots;
exports.fitInsets = fitInsets;
exports.TICKET_RADIUS = 22;
exports.TICKET_CUTOUT = 10;
exports.TICKET_TEAR_HEIGHT = 1;
exports.TICKET_POSTER_RATIO = 0.74;
exports.TICKET_MIN_POSTER_ROOM = 160;
function stubLayout(frame, infoHeight, aspect) {
    const ratio = aspect && aspect > 0 ? aspect : exports.TICKET_POSTER_RATIO;
    const room = Math.max(exports.TICKET_MIN_POSTER_ROOM, frame.height - infoHeight);
    const width = Math.max(0, Math.min(frame.width, room * ratio));
    const posterHeight = width / ratio;
    const height = posterHeight + exports.TICKET_TEAR_HEIGHT + infoHeight;
    return {
        width,
        posterHeight,
        height,
        split: posterHeight / Math.max(1, posterHeight + infoHeight),
        overflows: height > frame.height,
    };
}
function ticketSpec(rect, cutout = 10, split = 0.72) {
    const y = rect.y + rect.height * split;
    return {
        rect,
        radius: exports.TICKET_RADIUS,
        cutouts: [
            { cx: rect.x, cy: y, r: cutout },
            { cx: rect.x + rect.width, cy: y, r: cutout },
        ],
        bounds: {
            x: rect.x - cutout,
            y: rect.y,
            width: rect.width + cutout * 2,
            height: rect.height,
        },
    };
}
function receiptPoints(rect, tooth = 8) {
    const count = Math.max(1, Math.trunc(rect.width / tooth));
    const step = rect.width / count;
    const minX = rect.x;
    const maxX = rect.x + rect.width;
    const minY = rect.y;
    const maxY = rect.y + rect.height;
    const points = [{ x: minX, y: minY + tooth }];
    for (let i = 0; i < count; i += 1) {
        points.push({ x: minX + step * (i + 0.5), y: minY });
        points.push({ x: minX + step * (i + 1), y: minY + tooth });
    }
    points.push({ x: maxX, y: maxY - tooth });
    for (let i = 0; i < count; i += 1) {
        points.push({ x: maxX - step * (i + 0.5), y: maxY });
        points.push({ x: maxX - step * (i + 1), y: maxY - tooth });
    }
    return points;
}
function barcodeSalt(seed) {
    let sum = 0;
    for (const byte of utf8Bytes(seed))
        sum += byte;
    return sum;
}
function utf8Bytes(text) {
    const out = [];
    for (let i = 0; i < text.length; i += 1) {
        const code = text.codePointAt(i);
        if (code > 0xffff)
            i += 1;
        if (code < 0x80)
            out.push(code);
        else if (code < 0x800)
            out.push(0xc0 | (code >> 6), 0x80 | (code & 63));
        else if (code < 0x10000)
            out.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 63), 0x80 | (code & 63));
        else
            out.push(0xf0 | (code >> 18), 0x80 | ((code >> 12) & 63), 0x80 | ((code >> 6) & 63), 0x80 | (code & 63));
    }
    return Uint8Array.from(out);
}
function barcodeBars(seed, width) {
    const salt = barcodeSalt(seed);
    const bars = [];
    for (let i = 0; i < 56; i += 1) {
        if ((i * 13 + salt) % 7 < 5) {
            bars.push({
                x: (i / 56) * width,
                width: Math.max(1, ((width / 90) * (i % 3 + 1)) / 2),
            });
        }
    }
    return bars;
}
exports.GRAIN_TILE_SIDE = 256;
let tile = null;
function grainTileDots(side = exports.GRAIN_TILE_SIDE) {
    if (side === exports.GRAIN_TILE_SIDE && tile)
        return tile;
    const list = [];
    for (let i = 0; i < 520; i += 1) {
        list.push({
            x: (((i * 127 + 31) % 419) / 419) * side,
            y: (((i * 59 + 7) % 397) / 397) * side,
            d: i % 9 === 0 ? 1.2 : 0.8,
        });
    }
    if (side === exports.GRAIN_TILE_SIDE)
        tile = Object.freeze(list);
    return list;
}
function fitInsets(aspect, size, cropTolerance) {
    const zero = { width: 0, height: 0 };
    if (!aspect || aspect <= 0 || size.width <= 0 || size.height <= 0)
        return zero;
    const frameAspect = size.width / size.height;
    const ratio = Math.min(aspect, frameAspect) / Math.max(aspect, frameAspect);
    if (1 - ratio <= cropTolerance)
        return zero;
    const shown = aspect > frameAspect
        ? { width: size.width, height: size.width / aspect }
        : { width: size.height * aspect, height: size.height };
    return { width: (size.width - shown.width) / 2, height: (size.height - shown.height) / 2 };
}

},
"src/design/artwork/ArtworkPainter.ts":function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rgba = rgba;
exports.petalPath = petalPath;
exports.leafPath = leafPath;
exports.ridgePath = ridgePath;
exports.drawArtwork = drawArtwork;
exports.drawArtworkGrain = drawArtworkGrain;
exports.drawArtworkSheet = drawArtworkSheet;
exports.renderArtworkPNG = renderArtworkPNG;
const react_native_skia_1 = require("src/features/share/offline/skiaAdapter.js");
const seed_1 = require("src/design/artwork/seed.ts");
__exportStar(require("src/design/artwork/seed.ts"), exports);
function rgba(hex, alpha = 1) {
    return Float32Array.of(((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255, alpha);
}
function fade(hex) {
    return rgba(hex, 0);
}
const WHITE = rgba(0xffffff);
function fill(color) {
    const paint = react_native_skia_1.Skia.Paint();
    paint.setAntiAlias(true);
    paint.setColor(color);
    return paint;
}
function shaded(shader) {
    const paint = react_native_skia_1.Skia.Paint();
    paint.setAntiAlias(true);
    paint.setShader(shader);
    return paint;
}
function stroke(color, width) {
    const paint = fill(color);
    paint.setStyle(react_native_skia_1.PaintStyle.Stroke);
    paint.setStrokeWidth(width);
    return paint;
}
function strokeShaded(shader, width) {
    const paint = shaded(shader);
    paint.setStyle(react_native_skia_1.PaintStyle.Stroke);
    paint.setStrokeWidth(width);
    return paint;
}
function linear(x0, y0, x1, y1, colors, positions = null) {
    return react_native_skia_1.Skia.Shader.MakeLinearGradient({ x: x0, y: y0 }, { x: x1, y: y1 }, colors, positions, react_native_skia_1.TileMode.Clamp);
}
function radial(cx, cy, startRadius, endRadius, colors, positions = null) {
    const stops = positions ?? colors.map((_, i) => (colors.length === 1 ? 0 : i / (colors.length - 1)));
    if (startRadius <= 0 || endRadius <= 0) {
        return react_native_skia_1.Skia.Shader.MakeRadialGradient({ x: cx, y: cy }, Math.max(endRadius, 0.0001), colors, stops, react_native_skia_1.TileMode.Clamp);
    }
    const mapped = stops.map((t) => (startRadius + t * (endRadius - startRadius)) / endRadius);
    return react_native_skia_1.Skia.Shader.MakeRadialGradient({ x: cx, y: cy }, endRadius, [colors[0], ...colors], [0, ...mapped], react_native_skia_1.TileMode.Clamp);
}
const rect = (x, y, w, h) => react_native_skia_1.Skia.XYWHRect(x, y, w, h);
function rectPath(x, y, w, h) {
    return react_native_skia_1.Skia.Path.Rect(rect(x, y, w, h));
}
function ovalPath(x, y, w, h) {
    return react_native_skia_1.Skia.Path.Oval(rect(x, y, w, h));
}
function roundedPath(x, y, w, h, r) {
    return react_native_skia_1.Skia.Path.RRect(react_native_skia_1.Skia.RRectXY(rect(x, y, w, h), r, r));
}
const degrees = (radians) => (radians * 180) / Math.PI;
function petalPath(cx, cy, angle, length, width) {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const px = -dy * width;
    const py = dx * width;
    const path = react_native_skia_1.Skia.PathBuilder.Make();
    path.moveTo(cx, cy);
    path.cubicTo(cx + dx * length * 0.18 + px, cy + dy * length * 0.18 + py, cx + dx * length * 0.78 + px * 0.8, cy + dy * length * 0.78 + py * 0.8, cx + dx * length, cy + dy * length);
    path.cubicTo(cx + dx * length * 0.78 - px * 0.8, cy + dy * length * 0.78 - py * 0.8, cx + dx * length * 0.18 - px, cy + dy * length * 0.18 - py, cx, cy);
    path.close();
    return path.build();
}
function leafPath(ax, ay, bx, by, bulge) {
    const mx = (ax + bx) / 2;
    const my = (ay + by) / 2;
    const vx = bx - ax;
    const vy = by - ay;
    const len = Math.max(0.0001, Math.hypot(vx, vy));
    const nx = (-vy / len) * bulge;
    const ny = (vx / len) * bulge;
    const path = react_native_skia_1.Skia.PathBuilder.Make();
    path.moveTo(ax, ay);
    path.quadTo(mx + nx, my + ny, bx, by);
    path.quadTo(mx - nx, my - ny, ax, ay);
    path.close();
    return path.build();
}
function ridgePath(w, baseY, amp, phase, floorY) {
    const path = react_native_skia_1.Skia.PathBuilder.Make();
    path.moveTo(0, floorY);
    for (let i = 0; i <= 40; i += 1) {
        const t = i / 40;
        const u = t * 3.4 + phase;
        const f = Math.sin(u) * 0.5 + Math.sin(u * 2.3 + 1.1) * 0.3 + Math.sin(u * 4.7) * 0.12;
        path.lineTo(t * w, baseY - amp * (0.55 + f * 0.45));
    }
    path.lineTo(w, floorY);
    path.close();
    return path.build();
}
function drawArtwork(canvas, art, w, h) {
    const params = (0, seed_1.artworkParams)(art);
    switch (art) {
        case 'orbit':
            return orbit(canvas, w, h, params);
        case 'sunset':
            return sunset(canvas, w, h, params);
        case 'bloom':
            return bloom(canvas, w, h, params);
        case 'curtain':
            return curtain(canvas, w, h, params);
        case 'wave':
            return wave(canvas, w, h, params);
        case 'geometry':
            return geometry(canvas, w, h);
    }
}
function drawArtworkGrain(canvas, w, h) {
    const d = Math.max(0.45, Math.min(w, h) * 0.0015);
    const paint = fill(rgba(0xffffff, 0.18));
    for (const dot of (0, seed_1.artworkGrainDots)()) {
        canvas.drawOval(rect(dot.x * w, dot.y * h, d, d), paint);
    }
}
function drawArtworkSheet(canvas, art, w, h) {
    canvas.drawRect(rect(0, 0, w, h), fill(rgba(seed_1.coverArtBackground[art])));
    drawArtwork(canvas, art, w, h);
    drawArtworkGrain(canvas, w, h);
}
function orbit(canvas, w, h, params) {
    const s = Math.min(w, h);
    const cx = w * 0.5;
    const cy = h * 0.56;
    canvas.drawRect(rect(0, 0, w, h), shaded(linear(w * 0.15, 0, w * 0.85, h, [rgba(0x070b1c), rgba(0x111a3c), rgba(0x2a2050)])));
    canvas.drawRect(rect(0, 0, w, h), shaded(radial(w * 0.78, h * 0.12, 0, w * 0.9, [rgba(0x49539b, 0.35), fade(0x49539b)])));
    params.stars.forEach((star, i) => {
        const d = Math.max(0.55, s * (0.0022 + star.bright * star.bright * 0.0046));
        const tint = i % 11 === 0 ? 0xcfd8ff : 0xffffff;
        canvas.drawOval(rect(star.x * w, star.y * h, d, d), fill(rgba(tint, 0.3 + star.bright * 0.6)));
    });
    const bright = [
        [0.12, 0.155],
        [0.33, 0.065],
        [0.63, 0.115],
        [0.88, 0.235],
        [0.075, 0.62],
        [0.91, 0.74],
        [0.45, 0.9],
    ];
    for (const [ux, uy] of bright) {
        const x = w * ux;
        const y = h * uy;
        const halo = s * 0.032;
        canvas.drawOval(rect(x - halo, y - halo, halo * 2, halo * 2), shaded(radial(x, y, 0, halo, [rgba(0xdce6ff, 0.24), fade(0xdce6ff)])));
        const d = Math.max(1, s * 0.0075);
        canvas.drawOval(rect(x - d / 2, y - d / 2, d, d), fill(WHITE));
    }
    for (let i = 0; i < 5; i += 1) {
        const rx = w * (0.3 + i * 0.088);
        const ry = rx * (0.26 + i * 0.012);
        const tilt = -0.3 + i * 0.035;
        canvas.save();
        canvas.translate(cx, cy);
        canvas.rotate(degrees(tilt), 0, 0);
        canvas.drawOval(rect(-rx, -ry, rx * 2, ry * 2), stroke(rgba(0xe9d3a4, 0.46 - i * 0.06), Math.max(0.5, s * 0.0028)));
        canvas.restore();
    }
    const pr = w * 0.185;
    canvas.drawOval(rect(cx - pr * 2.2, cy - pr * 2.2, pr * 4.4, pr * 4.4), shaded(radial(cx, cy, pr * 0.9, pr * 2.2, [rgba(0x6e7bd0, 0.3), fade(0x6e7bd0)])));
    const disc = ovalPath(cx - pr, cy - pr, pr * 2, pr * 2);
    canvas.drawPath(disc, shaded(radial(cx - pr * 0.42, cy - pr * 0.46, pr * 0.06, pr * 1.75, [
        rgba(0xfdf3dc),
        rgba(0xeacaa0),
        rgba(0xb9846f),
        rgba(0x4a3352),
        rgba(0x241c3c),
    ])));
    canvas.save();
    canvas.clipPath(disc, react_native_skia_1.ClipOp.Intersect, true);
    for (const spot of params.spots) {
        const rr = pr * spot.r;
        const x = cx + spot.x * pr;
        const y = cy + spot.y * pr;
        canvas.drawOval(rect(x - rr, y - rr, rr * 2, rr * 0.86), fill(rgba(0x6b4b52, 0.16)));
    }
    canvas.restore();
    canvas.drawPath(disc, stroke(rgba(0xffe9c4, 0.22), Math.max(0.5, s * 0.0022)));
    const frontRX = w * 0.3;
    const frontRY = frontRX * 0.26;
    canvas.save();
    canvas.clipRect(rect(0, cy, w, h - cy), react_native_skia_1.ClipOp.Intersect, true);
    canvas.translate(cx, cy);
    canvas.rotate(degrees(-0.3), 0, 0);
    canvas.drawOval(rect(-frontRX, -frontRY, frontRX * 2, frontRY * 2), stroke(rgba(0xf3dfb4, 0.7), Math.max(0.6, s * 0.0034)));
    canvas.restore();
    const comet = react_native_skia_1.Skia.PathBuilder.Make();
    comet.moveTo(w * 0.04, h * 0.235);
    comet.quadTo(w * 0.26, h * 0.09, w * 0.47, h * 0.075);
    canvas.drawPath(comet.build(), strokeShaded(linear(w * 0.04, 0, w * 0.47, 0, [fade(0xfff2d6), rgba(0xfff2d6, 0.85)]), Math.max(0.6, s * 0.0038)));
    const head = Math.max(1.2, s * 0.012);
    canvas.drawOval(rect(w * 0.47 - head, h * 0.075 - head, head * 2, head * 2), shaded(radial(w * 0.47, h * 0.075, 0, head * 2, [WHITE, fade(0xfff2d6)])));
}
function sunset(canvas, w, h, params) {
    const s = Math.min(w, h);
    const horizon = h * 0.615;
    canvas.drawRect(rect(0, 0, w, horizon), shaded(linear(0, 0, 0, horizon, [rgba(0x3b2154), rgba(0x7c3a63), rgba(0xc55a61), rgba(0xee8f5f), rgba(0xf9ce92)], [0, 0.3, 0.58, 0.82, 1])));
    params.clouds.forEach((cloud, i) => {
        const t = i / 4;
        const cw = w * cloud.width;
        const ch = Math.max(1.4, s * cloud.height);
        const x = w * cloud.x;
        const y = h * 0.1 + t * h * 0.3;
        const bodyAlpha = 0.3 - t * 0.14;
        canvas.drawPath(roundedPath(x, y, cw, ch, ch / 2), shaded(linear(x, 0, x + cw, 0, [rgba(0x4a2450, 0), rgba(0x4a2450, bodyAlpha), rgba(0x4a2450, 0)], [0, 0.45, 1])));
        const litAlpha = 0.16 + t * 0.14;
        canvas.drawPath(roundedPath(x + cw * 0.12, y + ch * 0.55, cw * 0.66, ch * 0.45, ch / 4), shaded(linear(x, 0, x + cw, 0, [rgba(0xffc98d, 0), rgba(0xffc98d, litAlpha), rgba(0xffc98d, 0)], [0, 0.5, 1])));
    });
    const sunR = w * 0.27;
    const sunX = w * 0.5;
    const sunY = horizon - sunR * 0.42;
    canvas.drawOval(rect(sunX - sunR * 2, sunY - sunR * 2, sunR * 4, sunR * 4), shaded(radial(sunX, sunY, sunR * 0.8, sunR * 2, [rgba(0xffb56a, 0.45), fade(0xffb56a)])));
    canvas.saveLayer(undefined, rect(sunX - sunR, sunY - sunR, sunR * 2, sunR * 2));
    canvas.drawOval(rect(sunX - sunR, sunY - sunR, sunR * 2, sunR * 2), shaded(linear(0, sunY - sunR, 0, sunY + sunR * 0.45, [rgba(0xfff3c0), rgba(0xffc86e), rgba(0xf4746b)])));
    const cut = fill(rgba(0x000000));
    cut.setBlendMode(react_native_skia_1.BlendMode.DstOut);
    for (let i = 0; i < 8; i += 1) {
        const gap = sunR * (0.012 + i * 0.011);
        const y = sunY - sunR * 0.62 + i * sunR * 0.165;
        canvas.drawRect(rect(sunX - sunR, y, sunR * 2, gap), cut);
    }
    canvas.restore();
    canvas.drawPath(ridgePath(w, horizon, h * 0.11, 0.6, horizon), fill(rgba(0x74385f, 0.85)));
    canvas.drawPath(ridgePath(w, horizon, h * 0.072, 2.4, horizon), fill(rgba(0x3e1e40)));
    canvas.drawRect(rect(0, horizon, w, h - horizon), shaded(linear(0, horizon, 0, h, [rgba(0xc2585f), rgba(0x8a3b55), rgba(0x341d3d)])));
    canvas.save();
    canvas.clipRect(rect(0, horizon, w, h - horizon), react_native_skia_1.ClipOp.Intersect, true);
    canvas.drawRect(rect(0, horizon, w, h - horizon), shaded(radial(sunX, horizon, 0, w * 0.62, [rgba(0xffb070, 0.5), fade(0xffb070)])));
    canvas.restore();
    canvas.drawRect(rect(0, horizon - Math.max(0.6, s * 0.003), w, Math.max(0.8, s * 0.004)), fill(rgba(0xffe3ae, 0.7)));
    params.reflections.forEach((item, i) => {
        const t = i / 15;
        const y = horizon + t * t * (h - horizon) * 0.94 + (h - horizon) * 0.03;
        const bar = Math.max(0.8, s * (0.004 + t * 0.008));
        const half = sunR * (1 - t * 0.45) * item.half;
        const tone = fill(rgba(0xffd79a, 0.5 - t * 0.38));
        if (item.split) {
            const gap = half * item.cut;
            canvas.drawPath(roundedPath(sunX - half, y, half - gap, bar, bar / 2), tone);
            canvas.drawPath(roundedPath(sunX + gap, y, half - gap, bar, bar / 2), tone);
        }
        else {
            canvas.drawPath(roundedPath(sunX - half, y, half * 2, bar, bar / 2), tone);
        }
    });
}
function bloom(canvas, w, h, params) {
    const s = Math.min(w, h);
    const hair = Math.max(0.5, s * 0.0022);
    canvas.drawRect(rect(0, 0, w, h), shaded(linear(0, 0, 0, h, [rgba(0x12332a), rgba(0x27543f), rgba(0x1a3b2f)])));
    canvas.drawRect(rect(0, 0, w, h), shaded(radial(w * 0.38, h * 0.4, 0, w * 0.72, [rgba(0x7fae7e, 0.32), fade(0x7fae7e)])));
    const stems = [
        [0.34, 0.42, 0.44, 1.02],
        [0.74, 0.66, 0.6, 1.02],
        [0.8, 0.22, 0.66, 1.02],
    ];
    for (const [tipX, tipY, footX, footY] of stems) {
        const path = react_native_skia_1.Skia.PathBuilder.Make();
        path.moveTo(w * footX, h * footY);
        path.cubicTo(w * (footX + 0.06), h * (footY - 0.25), w * (tipX - 0.05), h * (tipY + 0.28), w * tipX, h * tipY);
        canvas.drawPath(path.build(), stroke(rgba(0x8fbe8c, 0.85), Math.max(1, s * 0.008)));
    }
    const leaves = [
        [0.42, 0.92, 0.1, 0.7, 0.075],
        [0.5, 0.78, 0.84, 0.64, -0.085],
        [0.62, 0.99, 0.94, 0.86, -0.06],
        [0.36, 0.66, 0.08, 0.48, 0.055],
    ];
    for (const [ax, ay, bx, by, bulge] of leaves) {
        const a = { x: w * ax, y: h * ay };
        const b = { x: w * bx, y: h * by };
        const shape = leafPath(a.x, a.y, b.x, b.y, w * bulge);
        canvas.drawPath(shape, shaded(linear(a.x, a.y, b.x, b.y, [rgba(0x5a9a63), rgba(0x2c5b40)])));
        canvas.drawPath(shape, stroke(rgba(0xbbddb0, 0.35), hair));
        const vein = react_native_skia_1.Skia.PathBuilder.Make();
        vein.moveTo(a.x, a.y);
        vein.lineTo(b.x, b.y);
        canvas.drawPath(vein.build(), stroke(rgba(0xc9e3bc, 0.3), hair));
        for (let k = 1; k <= 3; k += 1) {
            const t = k / 4;
            const mx = a.x + (b.x - a.x) * t;
            const my = a.y + (b.y - a.y) * t;
            const nx = -(b.y - a.y);
            const ny = b.x - a.x;
            const len = Math.max(0.0001, Math.hypot(nx, ny));
            const reach = w * bulge * 0.62 * (1 - Math.abs(t - 0.5));
            const side = react_native_skia_1.Skia.PathBuilder.Make();
            side.moveTo(mx, my);
            side.lineTo(mx + (nx / len) * reach, my + (ny / len) * reach);
            side.moveTo(mx, my);
            side.lineTo(mx - (nx / len) * reach, my - (ny / len) * reach);
            canvas.drawPath(side.build(), stroke(rgba(0xc9e3bc, 0.22), hair));
        }
    }
    const buds = [
        [0.795, 0.215, 0.052],
        [0.735, 0.655, 0.044],
    ];
    for (const [ux, uy, ur] of buds) {
        const cx = w * ux;
        const cy = h * uy;
        const r = w * ur;
        for (let k = 0; k < 3; k += 1) {
            const angle = -1.57 + (k - 1) * 0.5;
            const shape = petalPath(cx, cy + r * 1.1, angle, r * 2.1, r * 0.62);
            canvas.drawPath(shape, shaded(linear(0, cy - r, 0, cy + r * 1.2, [rgba(0xf6dcc2), rgba(0xe39b95)])));
            canvas.drawPath(shape, stroke(rgba(0x7a3f46, 0.25), hair));
        }
        const calyx = react_native_skia_1.Skia.PathBuilder.Make();
        calyx.moveTo(cx - r * 0.5, cy + r);
        calyx.quadTo(cx, cy + r * 1.9, cx + r * 0.5, cy + r);
        calyx.close();
        canvas.drawPath(calyx.build(), fill(rgba(0x3f7a4e)));
    }
    const flowers = [
        [0.355, 0.415, 0.275, [0xfdf0dc, 0xf2b7a8], [0xf7cdb4, 0xde8e8f]],
        [0.755, 0.735, 0.165, [0xfbe3be, 0xe8a86d], [0xf8d3a4, 0xd98c63]],
    ];
    for (const [ux, uy, ur, outer, inner] of flowers) {
        const cx = w * ux;
        const cy = h * uy;
        const r = w * ur;
        for (let p = 0; p < 9; p += 1) {
            const angle = (p * Math.PI * 2) / 9 + 0.18;
            const shape = petalPath(cx, cy, angle, r * params.petalLengths[p], r * 0.36);
            canvas.drawPath(shape, shaded(linear(cx, cy - r, cx, cy + r, [rgba(outer[0]), rgba(outer[1])])));
            canvas.drawPath(shape, stroke(rgba(0x7a3f46, 0.28), hair));
        }
        for (let p = 0; p < 7; p += 1) {
            const angle = (p * Math.PI * 2) / 7 + 0.55;
            const shape = petalPath(cx, cy, angle, r * 0.58, r * 0.24);
            canvas.drawPath(shape, shaded(linear(cx, cy - r * 0.6, cx, cy + r * 0.6, [rgba(inner[0]), rgba(inner[1])])));
            canvas.drawPath(shape, stroke(rgba(0x7a3f46, 0.22), hair));
        }
        const core = r * 0.2;
        canvas.drawOval(rect(cx - core, cy - core, core * 2, core * 2), shaded(radial(cx - core * 0.3, cy - core * 0.3, 0, core * 1.4, [rgba(0xf3c267), rgba(0xb86a38)])));
        for (let k = 0; k < 12; k += 1) {
            const angle = (k * Math.PI) / 6;
            const d = Math.max(0.8, r * 0.035);
            const x = cx + Math.cos(angle) * core * 1.45 - d / 2;
            const y = cy + Math.sin(angle) * core * 1.45 - d / 2;
            canvas.drawOval(rect(x, y, d, d), fill(rgba(0x8a4a2e, 0.75)));
        }
    }
}
function curtain(canvas, w, h, params) {
    const s = Math.min(w, h);
    const floorY = h * 0.855;
    canvas.drawRect(rect(0, 0, w, h), shaded(linear(0, 0, 0, h, [rgba(0x5a1424), rgba(0x360c18)])));
    const folds = 13;
    for (let i = 0; i < folds; i += 1) {
        const t0 = i / folds;
        const t1 = (i + 1) / folds;
        const topL = t0 * w;
        const topR = t1 * w;
        const botL = (0.5 + (t0 - 0.5) * 0.9) * w;
        const botR = (0.5 + (t1 - 0.5) * 0.9) * w;
        const path = react_native_skia_1.Skia.PathBuilder.Make();
        path.moveTo(topL, 0);
        path.lineTo(topR, 0);
        path.cubicTo(topR, h * 0.45, botR, h * 0.7, botR, h);
        path.lineTo(botL, h);
        path.cubicTo(botL, h * 0.7, topL, h * 0.45, topL, 0);
        path.close();
        canvas.drawPath(path.build(), shaded(linear(topL, 0, topR, 0, [rgba(0x3e0d1a), rgba(0xa8324a, params.foldLight[i]), rgba(0x4a1020)], [0, 0.42, 1])));
        const crest = react_native_skia_1.Skia.PathBuilder.Make();
        crest.moveTo(topL + (topR - topL) * 0.42, 0);
        crest.cubicTo(topL + (topR - topL) * 0.42, h * 0.45, botL + (botR - botL) * 0.42, h * 0.7, botL + (botR - botL) * 0.42, h);
        canvas.drawPath(crest.build(), stroke(rgba(0xe08a8a, 0.16), Math.max(0.6, s * 0.004)));
    }
    canvas.drawRect(rect(0, floorY, w, h - floorY), shaded(linear(0, floorY, 0, h, [rgba(0x2a0b15), rgba(0x180509)])));
    canvas.drawRect(rect(0, floorY, w, Math.max(0.7, s * 0.0035)), fill(rgba(0xc9a24a, 0.55)));
    for (let i = 0; i < 3; i += 1) {
        const spread = 0.34 - i * 0.11;
        const neck = 0.05 - i * 0.012;
        const cone = react_native_skia_1.Skia.PathBuilder.Make();
        cone.moveTo(w * (0.5 - neck), 0);
        cone.lineTo(w * (0.5 + neck), 0);
        cone.lineTo(w * (0.5 + spread), floorY);
        cone.lineTo(w * (0.5 - spread), floorY);
        cone.close();
        const paint = shaded(linear(0, 0, 0, floorY, [rgba(0xffe6b0, 0.15), rgba(0xffc978, 0.03)]));
        paint.setBlendMode(react_native_skia_1.BlendMode.Plus);
        canvas.drawPath(cone.build(), paint);
    }
    const poolW = w * 0.46;
    const poolH = (h - floorY) * 1.1;
    canvas.save();
    canvas.clipRect(rect(0, floorY, w, h - floorY), react_native_skia_1.ClipOp.Intersect, true);
    canvas.drawOval(rect(w * 0.5 - poolW, floorY - poolH * 0.2, poolW * 2, poolH * 1.4), shaded(radial(w * 0.5, floorY + poolH * 0.3, 0, poolW * 0.95, [rgba(0xffd98f, 0.45), fade(0xffd98f)])));
    canvas.restore();
    const scallops = 4;
    const top = h * 0.115;
    const low = h * 0.225;
    const valance = react_native_skia_1.Skia.PathBuilder.Make();
    valance.moveTo(0, 0);
    valance.lineTo(w, 0);
    valance.lineTo(w, top);
    const edge = react_native_skia_1.Skia.PathBuilder.Make();
    edge.moveTo(w, top);
    for (let i = scallops - 1; i >= 0; i -= 1) {
        const x0 = (w * (i + 1)) / scallops;
        const x1 = (w * i) / scallops;
        const cxp = (x0 + x1) / 2;
        valance.quadTo(cxp, low, x1, top);
        edge.quadTo(cxp, low, x1, top);
    }
    valance.close();
    const valanceShape = valance.build();
    canvas.drawPath(valanceShape, shaded(linear(0, 0, 0, low, [rgba(0x93203a), rgba(0x5e1425)])));
    canvas.save();
    canvas.clipPath(valanceShape, react_native_skia_1.ClipOp.Intersect, true);
    for (let i = 0; i < 10; i += 1) {
        canvas.drawRect(rect((w * i) / 10, 0, w / 20, low), fill(rgba(0x3e0d1a, 0.22)));
    }
    canvas.restore();
    canvas.drawPath(edge.build(), stroke(rgba(0xc9a24a, 0.85), Math.max(0.8, s * 0.005)));
    for (let i = 0; i < scallops; i += 1) {
        const x = (w * (i + 0.5)) / scallops;
        const y = top + (low - top) * 0.5;
        const cord = react_native_skia_1.Skia.PathBuilder.Make();
        cord.moveTo(x, y);
        cord.lineTo(x, y + h * 0.035);
        canvas.drawPath(cord.build(), stroke(rgba(0xc9a24a, 0.7), Math.max(0.6, s * 0.003)));
        const d = Math.max(1.6, s * 0.016);
        canvas.drawOval(rect(x - d / 2, y + h * 0.035, d, d * 1.4), fill(rgba(0xd9b463)));
    }
}
function wave(canvas, w, h, params) {
    const s = Math.min(w, h);
    canvas.drawRect(rect(0, 0, w, h), shaded(linear(0, 0, 0, h, [rgba(0x262b21), rgba(0x171913)])));
    const bars = 23;
    const baseY = h * 0.265;
    const barW = (w * 0.62) / (bars * 2 - 1);
    const left = w * 0.19;
    params.barLevels.forEach((level, i) => {
        const tall = h * 0.1 * level;
        const x = left + i * barW * 2;
        const tone = i % 4 === 0 ? 0xe0a93f : 0xede3cc;
        canvas.drawPath(roundedPath(x, baseY - tall, barW, tall, barW / 2), fill(rgba(tone, 0.35 + level * 0.5)));
    });
    canvas.drawRect(rect(left, baseY, w * 0.62, Math.max(0.7, s * 0.0035)), fill(rgba(0xede3cc, 0.45)));
    for (let i = 0; i < 3; i += 1) {
        const line = react_native_skia_1.Skia.PathBuilder.Make();
        for (let p = 0; p <= 90; p += 1) {
            const t = p / 90;
            const u = t * Math.PI * 2 * (1.2 + i * 1.1) + i * 1.7;
            const x = t * w;
            const y = h * (0.37 + i * 0.012) + Math.sin(u) * h * 0.022;
            if (p === 0)
                line.moveTo(x, y);
            else
                line.lineTo(x, y);
        }
        canvas.drawPath(line.build(), stroke(rgba(i === 1 ? 0xe0a93f : 0xede3cc, 0.3 - i * 0.06), Math.max(0.5, s * 0.0024)));
    }
    const layers = [
        [0.495, 0.055, 1.15, 0.0, 0x46503a, 0x2c3327, 0.8],
        [0.575, 0.06, 1.6, 1.4, 0x687646, 0x343b29, 0.74],
        [0.655, 0.052, 2.2, 2.8, 0x9a8740, 0x3e3e28, 0.7],
        [0.735, 0.056, 2.9, 4.2, 0xc9a24a, 0x4e4124, 0.7],
        [0.825, 0.046, 3.6, 5.6, 0xede3cc, 0x7a7050, 0.74],
    ];
    for (const [baseline, amp, cycles, phase, crestColor, footColor, alpha] of layers) {
        const area = react_native_skia_1.Skia.PathBuilder.Make();
        const crest = react_native_skia_1.Skia.PathBuilder.Make();
        for (let i = 0; i <= 96; i += 1) {
            const t = i / 96;
            const u = t * Math.PI * 2 * cycles + phase;
            const f = Math.sin(u) * 0.72 + Math.sin(u * 2 + phase) * 0.28;
            const x = t * w;
            const y = h * baseline + f * h * amp;
            if (i === 0) {
                area.moveTo(x, y);
                crest.moveTo(x, y);
            }
            else {
                area.lineTo(x, y);
                crest.lineTo(x, y);
            }
        }
        area.lineTo(w, h);
        area.lineTo(0, h);
        area.close();
        canvas.drawPath(area.build(), shaded(linear(0, h * baseline, 0, h, [rgba(crestColor, alpha), rgba(footColor, alpha * 0.25)])));
        canvas.drawPath(crest.build(), stroke(rgba(crestColor, 0.85), Math.max(0.6, s * 0.0032)));
    }
}
function geometry(canvas, w, h) {
    const s = Math.min(w, h);
    const hair = Math.max(0.5, s * 0.0022);
    const ink = 0x2a2721;
    canvas.drawRect(rect(0, 0, w, h), shaded(linear(0, 0, 0, h, [rgba(0xf2e7cb), rgba(0xe6d6ae)])));
    for (let i = 1; i < 6; i += 1) {
        canvas.drawRect(rect((w * i) / 6, 0, hair, h), fill(rgba(ink, 0.07)));
    }
    for (let i = 1; i < 8; i += 1) {
        canvas.drawRect(rect(0, (h * i) / 8, w, hair), fill(rgba(ink, 0.07)));
    }
    const quarterR = w * 0.44;
    const quarter = react_native_skia_1.Skia.PathBuilder.Make();
    quarter.addArc(rect(w - quarterR, h - quarterR, quarterR * 2, quarterR * 2), 180, 90);
    canvas.drawPath(quarter.build(), stroke(rgba(0x2b4c7e, 0.85), Math.max(1.2, s * 0.018)));
    const baseY = h * 0.6;
    const bigR = w * 0.345;
    const half = react_native_skia_1.Skia.PathBuilder.Make();
    half.addArc(rect(w * 0.5 - bigR, baseY - bigR, bigR * 2, bigR * 2), 180, 180);
    half.close();
    canvas.drawPath(half.build(), shaded(linear(0, baseY - bigR, 0, baseY, [rgba(0xc9603f), rgba(0xa8412f)])));
    canvas.drawRect(rect(w * 0.1, h * 0.2, w * 0.33, h * 0.235), fill(rgba(0x2b4c7e, 0.8)));
    const mR = w * 0.125;
    canvas.drawOval(rect(w * 0.72 - mR, h * 0.295 - mR, mR * 2, mR * 2), fill(rgba(0xd79a33, 0.85)));
    const ringR = w * 0.115;
    canvas.drawOval(rect(w * 0.3 - ringR, h * 0.145 - ringR, ringR * 2, ringR * 2), stroke(rgba(ink, 0.7), Math.max(0.8, s * 0.005)));
    canvas.drawRect(rect(w * 0.06, baseY, w * 0.88, Math.max(0.8, s * 0.004)), fill(rgba(ink, 0.82)));
    const hatch = { x: w * 0.08, y: h * 0.665, width: w * 0.33, height: h * 0.185 };
    canvas.save();
    canvas.clipRect(rect(hatch.x, hatch.y, hatch.width, hatch.height), react_native_skia_1.ClipOp.Intersect, true);
    for (let i = 0; i < 20; i += 1) {
        const x = hatch.x - hatch.height + i * w * 0.028;
        const line = react_native_skia_1.Skia.PathBuilder.Make();
        line.moveTo(x, hatch.y + hatch.height);
        line.lineTo(x + hatch.height, hatch.y);
        canvas.drawPath(line.build(), stroke(rgba(0x2b4c7e, 0.55), hair * 1.6));
    }
    canvas.restore();
    const triangle = react_native_skia_1.Skia.PathBuilder.Make();
    triangle.moveTo(w * 0.45, h * 0.85);
    triangle.lineTo(w * 0.58, h * 0.85);
    triangle.lineTo(w * 0.515, h * 0.715);
    triangle.close();
    canvas.drawPath(triangle.build(), fill(rgba(ink)));
    const corners = [
        [0.075, 0.06],
        [0.925, 0.06],
        [0.075, 0.94],
        [0.925, 0.94],
    ];
    for (const [ux, uy] of corners) {
        const x = w * ux;
        const y = h * uy;
        const arm = s * 0.022;
        canvas.drawRect(rect(x - arm, y - hair / 2, arm * 2, hair), fill(rgba(ink, 0.45)));
        canvas.drawRect(rect(x - hair / 2, y - arm, hair, arm * 2), fill(rgba(ink, 0.45)));
    }
}
function renderArtworkPNG(size, params) {
    const scale = params.scale ?? 1;
    const width = Math.max(1, Math.round(size.width * scale));
    const height = Math.max(1, Math.round(size.height * scale));
    const surface = react_native_skia_1.Skia.Surface.MakeOffscreen(width, height) ?? react_native_skia_1.Skia.Surface.Make(width, height);
    if (!surface)
        return null;
    const canvas = surface.getCanvas();
    canvas.save();
    canvas.scale(scale, scale);
    if (params.background !== false) {
        canvas.drawRect(rect(0, 0, size.width, size.height), fill(rgba(seed_1.coverArtBackground[params.art])));
    }
    drawArtwork(canvas, params.art, size.width, size.height);
    if (params.grain !== false)
        drawArtworkGrain(canvas, size.width, size.height);
    canvas.restore();
    surface.flush();
    return surface.makeImageSnapshot().encodeToBytes();
}

},
"src/design/artwork/seed.ts":function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.coverArtBackground = exports.coverArtName = exports.COVER_ARTS = void 0;
exports.noise = noise;
exports.isCoverArt = isCoverArt;
exports.coverArt = coverArt;
exports.artworkForKind = artworkForKind;
exports.artworkForImportedKind = artworkForImportedKind;
exports.artworkParams = artworkParams;
exports.artworkGrainDots = artworkGrainDots;
const MASK = (1n << 64n) - 1n;
const M1 = 0x9e3779b97f4a7c15n;
const M2 = 0xbf58476d1ce4e5b9n;
const cache = new Map();
function noise(seed) {
    const key = Math.trunc(seed);
    const known = cache.get(key);
    if (known !== undefined)
        return known;
    let x = (BigInt.asUintN(64, BigInt(key + 1)) * M1) & MASK;
    x ^= x >> 29n;
    x = (x * M2) & MASK;
    x ^= x >> 32n;
    const value = Number(x >> 11n) / 9007199254740992;
    if (cache.size > 4000)
        cache.clear();
    cache.set(key, value);
    return value;
}
exports.COVER_ARTS = ['orbit', 'bloom', 'curtain', 'wave', 'sunset', 'geometry'];
function isCoverArt(value) {
    return exports.COVER_ARTS.includes(value);
}
function coverArt(value) {
    return value && isCoverArt(value) ? value : 'orbit';
}
exports.coverArtName = {
    orbit: '星际漫游',
    bloom: '花开现场',
    curtain: '天鹅绒幕',
    wave: '声音形状',
    sunset: '落日派对',
    geometry: '几何诗歌',
};
exports.coverArtBackground = {
    orbit: 0x0f1530,
    sunset: 0xc55a61,
    bloom: 0x1f4635,
    curtain: 0x4a1020,
    wave: 0x1f241b,
    geometry: 0xecdfc0,
};
function artworkForKind(kind) {
    switch (kind) {
        case '电影':
            return 'orbit';
        case '戏剧':
        case '音乐剧':
            return 'curtain';
        case '展览':
            return 'geometry';
        case '音乐节':
            return 'bloom';
        default:
            return 'wave';
    }
}
function artworkForImportedKind(kind) {
    if (kind === '电影')
        return 'orbit';
    if (kind === '戏剧' || kind === '音乐剧')
        return 'curtain';
    return 'wave';
}
const EMPTY = Object.freeze([]);
function orbitStars() {
    const list = [];
    for (let i = 0; i < 130; i += 1) {
        list.push({ x: noise(i * 2), y: noise(i * 2 + 1), bright: noise(i * 2 + 701) });
    }
    return list;
}
function orbitSpots() {
    const list = [];
    for (let i = 0; i < 6; i += 1) {
        list.push({
            r: 0.08 + noise(i + 311) * 0.13,
            x: -0.75 + noise(i * 2 + 401) * 1.2,
            y: -0.8 + noise(i * 2 + 402) * 1.3,
        });
    }
    return list;
}
function sunsetClouds() {
    const list = [];
    for (let i = 0; i < 5; i += 1) {
        list.push({
            width: 0.26 + noise(i + 21) * 0.42,
            height: 0.008 + noise(i + 41) * 0.012,
            x: -0.08 + noise(i + 61) * 0.85,
        });
    }
    return list;
}
function sunsetReflections() {
    const list = [];
    for (let i = 0; i < 16; i += 1) {
        list.push({
            half: 0.45 + noise(i + 131) * 0.55,
            cut: 0.2 + noise(i + 151) * 0.3,
            split: i % 3 === 1,
        });
    }
    return list;
}
function bloomPetals() {
    const list = [];
    for (let p = 0; p < 9; p += 1)
        list.push(0.93 + noise(p + 11) * 0.14);
    return list;
}
function curtainFolds() {
    const list = [];
    for (let i = 0; i < 13; i += 1)
        list.push(0.55 + noise(i + 71) * 0.45);
    return list;
}
function waveBars() {
    const list = [];
    for (let i = 0; i < 23; i += 1) {
        const envelope = Math.sin(i * 0.46) * 0.5 + 0.5;
        list.push(0.22 + (envelope * 0.62 + noise(i + 17) * 0.38) * 0.78);
    }
    return list;
}
const params = new Map();
function artworkParams(art) {
    const known = params.get(art);
    if (known)
        return known;
    const value = Object.freeze({
        art,
        background: exports.coverArtBackground[art],
        stars: art === 'orbit' ? Object.freeze(orbitStars()) : EMPTY,
        spots: art === 'orbit' ? Object.freeze(orbitSpots()) : EMPTY,
        clouds: art === 'sunset' ? Object.freeze(sunsetClouds()) : EMPTY,
        reflections: art === 'sunset' ? Object.freeze(sunsetReflections()) : EMPTY,
        petalLengths: art === 'bloom' ? Object.freeze(bloomPetals()) : EMPTY,
        foldLight: art === 'curtain' ? Object.freeze(curtainFolds()) : EMPTY,
        barLevels: art === 'wave' ? Object.freeze(waveBars()) : EMPTY,
    });
    params.set(art, value);
    return value;
}
let grain = null;
function artworkGrainDots() {
    if (grain)
        return grain;
    const list = [];
    for (let i = 0; i < 350; i += 1) {
        list.push({ x: noise(i * 2 + 9001), y: noise(i * 2 + 9002) });
    }
    grain = Object.freeze(list);
    return grain;
}

}};
const cache={};function require(id){if(cache[id])return cache[id].exports;if(!modules[id])throw new Error("Missing module "+id);const module=cache[id]={exports:{}};modules[id](require,module,module.exports);return module.exports;}require("src/features/share/offline/engine.js");
})(globalThis);
