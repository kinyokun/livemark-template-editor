// 画布绘制：照着 App 的 `src/features/share/painter.ts` + `measure.ts` 重画一遍。
//
// 排版、收起、文件格式都在 core.js 里（那是 App 的 TypeScript 原样编译过来的），
// 只有这两件事是平台相关、必须在这里重写的：
//
//   1. 量文字 —— 手机上是 Skia 段落，这里是 Canvas 2D 的 measureText。
//      排版引擎通过全局 `LMMeasure` 拿它（core.js 里的 share/measure 垫片会调）。
//   2. 画 —— 手机上是 SkCanvas，这里是 CanvasRenderingContext2D。
//
// 坐标和 App 完全一致：画布 360 pt 宽，高由内容决定；每个图元是「左上角 + 宽高」的
// frame，`rotation` 绕 frame 中心转；导出时整体乘 scale。
(function (global) {
  'use strict';

  // MARK: - 字体（对应 share/fonts.ts）

  var FAMILY = {
    黑体: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", system-ui, "Noto Sans CJK SC", sans-serif',
    宋体: 'Georgia, "Songti SC", "Source Han Serif SC", "Noto Serif CJK SC", serif',
    圆体: 'ui-rounded, "SF Pro Rounded", -apple-system, "PingFang SC", system-ui, sans-serif',
    等宽: 'ui-monospace, Menlo, "SF Mono", Monaco, "PingFang SC", monospace',
  };
  var WEIGHT = { 细: 300, 常规: 400, 中等: 500, 半粗: 600, 粗体: 700, 特粗: 900 };

  // measure.ts 里的常数，量与画共用。
  var CHIP_H_PADDING = 0.6;
  var CHIP_V_PADDING = 0.35;
  var LABEL_GAP = 0.25;
  var LABEL_SIZE = 0.42;
  var LABEL_TRACKING = 2;
  var LABEL_WEIGHT = 600;
  var LABEL_ALPHA = 0.6;
  var LINE_HEIGHT_MULTIPLIER = 1.4;
  var MIN_SCALE_FACTOR = 0.7;
  var BARCODE_HEIGHT = 2.6;
  var BARCODE_WIDTH = 12;

  /// 量文字用的离屏上下文：只用来 measureText，不画。
  var scratch = document.createElement('canvas').getContext('2d');

  function fontString(size, weight, design) {
    return (WEIGHT[weight] || 400) + ' ' + size + 'px ' + (FAMILY[design] || FAMILY['黑体']);
  }

  function applyFont(ctx, spec) {
    ctx.font = (spec.weight || 400) + ' ' + spec.size + 'px ' + spec.family;
    // letterSpacing 是新 API；不支持的浏览器上字距只能当 0（README 已注明）。
    if ('letterSpacing' in ctx) ctx.letterSpacing = (spec.letterSpacing || 0) + 'px';
  }

  function textWidth(spec, text) {
    applyFont(scratch, spec);
    return scratch.measureText(text).width;
  }

  /// 一行文字的上下伸展：用来把基线摆在行框里（Skia 的 heightMultiplier 是行框总高）。
  function fontMetrics(spec) {
    applyFont(scratch, spec);
    var m = scratch.measureText('喜Ag');
    var ascent = m.fontBoundingBoxAscent;
    var descent = m.fontBoundingBoxDescent;
    if (!isFinite(ascent) || !ascent) { ascent = spec.size * 0.95; descent = spec.size * 0.25; }
    return { ascent: ascent, descent: descent };
  }

  // MARK: - 断行
  //
  // Skia 的段落排版认中日韩逐字可断、拉丁按词断，这里照做。

  function isCJK(ch) {
    var c = ch.charCodeAt(0);
    return (c >= 0x2e80 && c <= 0x9fff) || (c >= 0xf900 && c <= 0xfaff) ||
      (c >= 0xff00 && c <= 0xffef) || (c >= 0x3000 && c <= 0x303f);
  }

  function tokenize(text) {
    var tokens = [], buffer = '';
    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i);
      if (isCJK(ch)) {
        if (buffer) { tokens.push(buffer); buffer = ''; }
        tokens.push(ch);
      } else if (ch === ' ') {
        buffer += ch;
        tokens.push(buffer);
        buffer = '';
      } else {
        buffer += ch;
      }
    }
    if (buffer) tokens.push(buffer);
    return tokens;
  }

  function wrapParagraph(spec, text, maxWidth) {
    if (!text) return [''];
    if (textWidth(spec, text) <= maxWidth) return [text];
    var tokens = tokenize(text), lines = [], line = '';
    for (var i = 0; i < tokens.length; i++) {
      var next = line + tokens[i];
      if (line && textWidth(spec, next.replace(/\s+$/, '')) > maxWidth) {
        lines.push(line.replace(/\s+$/, ''));
        line = tokens[i].replace(/^\s+/, '');
      } else {
        line = next;
      }
      // 一个词自己就超宽：硬拆。
      while (textWidth(spec, line) > maxWidth && line.length > 1) {
        var cut = line.length;
        while (cut > 1 && textWidth(spec, line.slice(0, cut)) > maxWidth) cut--;
        lines.push(line.slice(0, cut));
        line = line.slice(cut);
      }
    }
    lines.push(line.replace(/\s+$/, ''));
    return lines;
  }

  function wrapAll(spec, text, maxWidth) {
    var out = [];
    String(text === undefined || text === null ? '' : text).split('\n').forEach(function (part) {
      wrapParagraph(spec, part, maxWidth).forEach(function (line) { out.push(line); });
    });
    return out;
  }

  // MARK: - 段落（对应 measure.ts 的 layoutParagraph）

  function layoutOnce(spec, size, maxWidth) {
    var sized = {
      family: spec.family, weight: spec.weight, size: size,
      letterSpacing: spec.letterSpacing, align: spec.align,
    };
    var bounded = isFinite(maxWidth) ? Math.max(1, maxWidth) : Infinity;
    var lines = isFinite(bounded)
      ? wrapAll(sized, spec.text, bounded)
      : String(spec.text || '').split('\n');
    // 不换行有多宽：省略号与换行都不算进去。
    var intrinsic = 0;
    String(spec.text || '').split('\n').forEach(function (part) {
      intrinsic = Math.max(intrinsic, textWidth(sized, part));
    });
    if (lines.length > spec.maxLines) {
      lines = lines.slice(0, spec.maxLines);
      var last = lines[lines.length - 1];
      while (last.length > 1 && textWidth(sized, last + '…') > bounded) last = last.slice(0, -1);
      lines[lines.length - 1] = last + '…';
    }
    var longest = 0;
    lines.forEach(function (line) { longest = Math.max(longest, textWidth(sized, line)); });
    var lineHeight = size * LINE_HEIGHT_MULTIPLIER;
    var metrics = fontMetrics(sized);
    return {
      lines: lines,
      spec: sized,
      lineHeight: lineHeight,
      baseline: (lineHeight - (metrics.ascent + metrics.descent)) / 2 + metrics.ascent,
      width: isFinite(maxWidth) ? Math.min(longest, bounded) : intrinsic,
      height: lineHeight * lines.length,
      intrinsic: intrinsic,
      laidOutWidth: isFinite(bounded) ? bounded : intrinsic,
    };
  }

  /// 单行放不下时按 SwiftUI 的 minimumScaleFactor(0.7) 缩一次。
  function layoutParagraph(spec) {
    var first = layoutOnce(spec, spec.size, spec.maxWidth);
    if (!isFinite(spec.maxWidth)) return first;
    if (spec.maxLines !== 1 || first.intrinsic <= spec.maxWidth + 0.5) return first;
    var factor = Math.max(MIN_SCALE_FACTOR, spec.maxWidth / Math.max(1, first.intrinsic));
    return layoutOnce(spec, spec.size * factor, spec.maxWidth);
  }

  // MARK: - 一块文字（对应 measure.ts 的 layoutTextBlock）

  function layoutTextBlock(input) {
    var fs = Math.max(1, input.fontSize);
    var hpad = input.chip ? fs * CHIP_H_PADDING : 0;
    var vpad = input.chip ? fs * CHIP_V_PADDING : 0;
    var bounded = isFinite(input.maxWidth);
    var available = bounded ? Math.max(1, input.maxWidth - hpad * 2) : Infinity;
    var inlineRow = input.inlineLabel && (input.label || '').length > 0;

    var measuredValue = layoutParagraph({
      text: input.text,
      family: FAMILY[input.design] || FAMILY['黑体'],
      weight: WEIGHT[input.weight] || 400,
      size: fs,
      letterSpacing: input.tracking,
      align: inlineRow ? '右对齐' : input.alignment,
      maxLines: inlineRow ? 1 : Math.max(1, input.lineLimit),
      maxWidth: available,
    });

    // 条码那一块只借段落对象定位置，几何按竖条来。
    var value = measuredValue;
    if (input.barcode && !inlineRow) {
      value = Object.assign({}, measuredValue, {
        width: bounded ? available : fs * BARCODE_WIDTH,
        laidOutWidth: bounded ? available : fs * BARCODE_WIDTH,
        height: fs * BARCODE_HEIGHT,
      });
    }

    var label = null;
    if ((input.label || '').length > 0) {
      label = layoutParagraph({
        text: input.label,
        family: inlineRow ? (FAMILY[input.design] || FAMILY['黑体']) : FAMILY['等宽'],
        weight: inlineRow ? (WEIGHT[input.weight] || 400) : LABEL_WEIGHT,
        size: inlineRow ? fs : Math.max(6, fs * LABEL_SIZE),
        letterSpacing: inlineRow ? input.tracking : LABEL_TRACKING,
        align: '左对齐',
        maxLines: 1,
        maxWidth: available,
      });
    }

    var gap = fs * LABEL_GAP;
    var contentWidth = inlineRow
      ? (bounded ? available : (label ? label.width : 0) + fs * 1.5 + value.width)
      : Math.min(available, Math.max(value.width, label ? label.width : 0));
    var contentHeight = inlineRow
      ? Math.max(value.height, label ? label.height : 0)
      : value.height + (label ? label.height + gap : 0);

    return {
      width: contentWidth + hpad * 2,
      height: contentHeight + vpad * 2,
      contentWidth: contentWidth,
      contentHeight: contentHeight,
      hpad: hpad, vpad: vpad, available: available, gap: gap,
      value: value, label: label,
    };
  }

  /// 排版引擎注入的「量一段文字要多大」。core.js 的垫片调的就是它。
  var cache = new Map();
  function measure(request) {
    var key = [
      request.text, request.label, request.inlineLabel ? 1 : 0, request.fontSize,
      request.weight, request.design, request.alignment, request.tracking,
      request.lineLimit, request.chip ? 1 : 0, request.barcode ? 1 : 0,
      isFinite(request.maxWidth) ? request.maxWidth : 'inf',
    ].join('');
    var hit = cache.get(key);
    if (hit) return hit;
    var block = layoutTextBlock(request);
    var out = { width: block.width, height: block.height };
    if (cache.size >= 800) cache.clear();
    cache.set(key, out);
    return out;
  }

  function clearMeasureCache() { cache.clear(); }

  global.LMMeasure = measure;

  // MARK: - 颜色与路径

  function css(color, alpha) {
    if (!color) return 'rgba(0,0,0,0)';
    var a = color.alpha * (alpha === undefined ? 1 : alpha);
    return 'rgba(' + Math.round(color.red * 255) + ',' + Math.round(color.green * 255) + ',' +
      Math.round(color.blue * 255) + ',' + a + ')';
  }

  function roundedRectPath(ctx, x, y, w, h, r) {
    var radius = Math.max(0, Math.min(r, Math.min(w, h) / 2));
    ctx.beginPath();
    if (radius <= 0) { ctx.rect(x, y, w, h); return; }
    // 圆角大到顶格（艺术海报的圆封面就是这样）：Skia 的 RRect 这时就是个椭圆，
    // 下面那套「比圆弧稍平」的贝塞尔会画成一块方疙瘩，所以直接走椭圆。
    if (radius >= Math.min(w, h) / 2 - 0.01) {
      ctx.ellipse(x + w / 2, y + h / 2, Math.max(0.01, w / 2), Math.max(0.01, h / 2), 0, 0, Math.PI * 2);
      ctx.closePath();
      return;
    }
    // .continuous 圆角的近似：贝塞尔比圆弧稍平一点。
    var k = radius * 0.2;
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.bezierCurveTo(x + w - k, y, x + w, y + k, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.bezierCurveTo(x + w, y + h - k, x + w - k, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.bezierCurveTo(x + k, y + h, x, y + h - k, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.bezierCurveTo(x, y + k, x + k, y, x + radius, y);
    ctx.closePath();
  }

  function ovalPath(ctx, x, y, w, h) {
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, Math.max(0.01, w / 2), Math.max(0.01, h / 2), 0, 0, Math.PI * 2);
  }

  function dashOf(length, gap) {
    return (length > 0 && gap > 0) ? [length, gap] : [];
  }

  // MARK: - 图片的裁切（POSTER.md 第 3 节，和 painter.ts 的 imagePlacement 同一份公式）

  function imagePlacement(input) {
    var fw = Math.max(0, input.frameWidth);
    var fh = Math.max(0, input.frameHeight);
    var iw = input.imageWidth, ih = input.imageHeight;
    if (!(iw > 0) || !(ih > 0)) {
      return { x: 0, y: 0, width: fw, height: fh, overflowX: 0, overflowY: 0 };
    }
    var zoom = isFinite(input.zoom) && input.zoom > 0 ? input.zoom : 1;
    var base = input.fit === 'contain' ? Math.min(fw / iw, fh / ih) : Math.max(fw / iw, fh / ih);
    var scale = base * zoom;
    var width = iw * scale, height = ih * scale;
    var overflowX = width - fw, overflowY = height - fh;
    return {
      x: -overflowX * clamp01(input.focusX),
      y: -overflowY * clamp01(input.focusY),
      width: width, height: height,
      overflowX: overflowX, overflowY: overflowY,
    };
  }

  function clamp01(value) {
    if (!isFinite(value)) return 0.5;
    return Math.min(1, Math.max(0, value));
  }

  function sourceSize(source) {
    if (!source) return null;
    var w = source.videoWidth || source.naturalWidth || source.width;
    var h = source.videoHeight || source.naturalHeight || source.height;
    return (w && h) ? { width: w, height: h } : null;
  }

  function drawPlacedImage(ctx, image, x, y, width, height, placement) {
    var size = sourceSize(image);
    if (!size) return null;
    var placed = imagePlacement({
      frameWidth: width, frameHeight: height,
      imageWidth: size.width, imageHeight: size.height,
      fit: placement.fit, focusX: placement.focusX,
      focusY: placement.focusY, zoom: placement.zoom,
    });
    ctx.drawImage(image, x + placed.x, y + placed.y, placed.width, placed.height);
    return placed;
  }

  // MARK: - 画一整张场景（对应 painter.ts 的 paintScene）

  var CANVAS_LAYER_ID = 'canvas';

  /// images：Map<key, HTMLImageElement | HTMLVideoElement | null>
  /// 回填每一层的框（画布 pt，未旋转），编辑器拿它做命中测试与选中框；
  /// 图片层还带溢出量，拖动改 focus 要除以它。
  function paintScene(ctx, scene, images) {
    var frames = {};
    frames[CANVAS_LAYER_ID] = { x: 0, y: 0, width: scene.width, height: scene.height };
    ctx.save();
    ctx.textBaseline = 'alphabetic';
    ctx.beginPath();
    ctx.rect(0, 0, scene.width, scene.height);
    ctx.clip();

    if (scene.paintsBackground) {
      ctx.fillStyle = css(scene.background);
      ctx.fillRect(0, 0, scene.width, scene.height);
      var background = scene.backgroundImage;
      var image = background ? (images.get(background.source.key) || null) : null;
      if (background && image) {
        ctx.save();
        ctx.globalAlpha *= background.opacity;
        var placed = drawPlacedImage(ctx, image, 0, 0, scene.width, scene.height, {
          fit: 'cover', focusX: background.focusX,
          focusY: background.focusY, zoom: background.zoom,
        });
        if (placed) {
          frames[CANVAS_LAYER_ID] = {
            x: 0, y: 0, width: scene.width, height: scene.height,
            overflowX: placed.overflowX, overflowY: placed.overflowY,
          };
        }
        ctx.restore();
      }
    }

    var clipDepth = 0;
    scene.items.forEach(function (item) {
      if (item.kind === 'clipBegin') {
        beginClip(ctx, item);
        clipDepth += 1;
        if (!frames[item.id]) frames[item.id] = Object.assign({}, item.frame);
        return;
      }
      if (item.kind === 'clipEnd') {
        if (clipDepth > 0) { ctx.restore(); clipDepth -= 1; }
        return;
      }
      frames[item.id] = paintItem(ctx, item, images);
    });
    while (clipDepth > 0) { ctx.restore(); clipDepth -= 1; }
    ctx.restore();
    return frames;
  }

  /// 裁切留给后面的子节点，所以只 save 不 restore。
  function beginClip(ctx, item) {
    var f = item.frame;
    ctx.save();
    if (item.rotation !== 0) {
      var cx = f.x + f.width / 2, cy = f.y + f.height / 2;
      ctx.translate(cx, cy);
      ctx.rotate(item.rotation * Math.PI / 180);
      roundedRectPath(ctx, -f.width / 2, -f.height / 2, f.width, f.height, item.cornerRadius);
      ctx.clip();
      ctx.rotate(-item.rotation * Math.PI / 180);
      ctx.translate(-cx, -cy);
      return;
    }
    roundedRectPath(ctx, f.x, f.y, f.width, f.height, item.cornerRadius);
    ctx.clip();
  }

  function paintItem(ctx, item, images) {
    var f = item.frame;
    ctx.save();
    ctx.translate(f.x, f.y);
    if (item.rotation !== 0) {
      ctx.translate(f.width / 2, f.height / 2);
      ctx.rotate(item.rotation * Math.PI / 180);
      ctx.translate(-f.width / 2, -f.height / 2);
    }
    if (item.opacity < 1) ctx.globalAlpha *= item.opacity;

    var placed = null;
    switch (item.kind) {
      case 'fill': paintFill(ctx, item, f.width, f.height); break;
      case 'image': placed = paintImage(ctx, item, images, f.width, f.height); break;
      case 'shape': paintShape(ctx, item, f.width, f.height); break;
      case 'mask':
        ctx.fillStyle = '#ffffff';
        roundedRectPath(ctx, 0, 0, f.width, f.height, item.cornerRadius);
        ctx.fill();
        break;
      default: paintText(ctx, item, f.width); break;
    }
    ctx.restore();
    return placed
      ? { x: f.x, y: f.y, width: f.width, height: f.height, overflowX: placed.overflowX, overflowY: placed.overflowY }
      : { x: f.x, y: f.y, width: f.width, height: f.height };
  }

  /// 转过角度以后的外接矩形：命中测试要一个轴对齐的框时用它。
  function boundingBox(frame, degrees) {
    var radians = degrees * Math.PI / 180;
    var cos = Math.abs(Math.cos(radians)), sin = Math.abs(Math.sin(radians));
    var w = frame.width * cos + frame.height * sin;
    var h = frame.width * sin + frame.height * cos;
    return {
      x: frame.x + frame.width / 2 - w / 2,
      y: frame.y + frame.height / 2 - h / 2,
      width: w, height: h,
    };
  }

  // MARK: - 容器的底色与描边

  function paintFill(ctx, item, width, height) {
    if (item.color) {
      ctx.fillStyle = css(item.color);
      roundedRectPath(ctx, 0, 0, width, height, item.cornerRadius);
      ctx.fill();
    }
    var stroke = item.stroke;
    if (stroke) {
      ctx.save();
      // strokeBorder 画在边框内侧，先往里收半个线宽。
      ctx.strokeStyle = css(stroke.color);
      ctx.lineWidth = stroke.width;
      ctx.setLineDash(dashOf(stroke.dashLength, stroke.dashGap));
      roundedRectPath(ctx, stroke.width / 2, stroke.width / 2,
        Math.max(0, width - stroke.width), Math.max(0, height - stroke.width), item.cornerRadius);
      ctx.stroke();
      ctx.restore();
    }
  }

  // MARK: - 图片

  function paintImage(ctx, item, images, width, height) {
    var radius = item.cornerRadius;
    var border = Math.max(0, Math.min(item.border, Math.min(width, height) / 2));

    if (item.shadow) {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.22)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 8;
      ctx.fillStyle = border > 0 ? '#ffffff' : 'rgba(0,0,0,0.9)';
      roundedRectPath(ctx, 0, 0, width, height, radius);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    roundedRectPath(ctx, 0, 0, width, height, radius);
    ctx.clip();
    // 相纸白边：白底铺满整个框，图片往里缩这么多。
    if (border > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
    }

    var innerW = Math.max(0, width - border * 2);
    var innerH = Math.max(0, height - border * 2);
    var innerRadius = Math.max(0, radius - border);
    ctx.save();
    roundedRectPath(ctx, border, border, innerW, innerH, innerRadius);
    ctx.clip();
    // 图在框内的倾斜：框不转，图转（框自己转是节点的 rotation）。
    if (item.tilt !== 0) {
      ctx.translate(border + innerW / 2, border + innerH / 2);
      ctx.rotate(item.tilt * Math.PI / 180);
      ctx.translate(-(border + innerW / 2), -(border + innerH / 2));
    }
    var image = item.source ? (images.get(item.source.key) || null) : null;
    var placed = null;
    if (image) {
      placed = drawPlacedImage(ctx, image, border, border, innerW, innerH, {
        fit: item.fit, focusX: item.focusX, focusY: item.focusY, zoom: item.zoom,
      });
    } else if (item.artwork !== null && item.artwork !== undefined) {
      // 记录没有封面原图：手机上画一张程序化封面，这里画一块同色系的底
      // （README「做不到的事」里记了这一条）。
      paintArtworkFallback(ctx, item.artwork, border, border, innerW, innerH);
    } else if (!item.isSticker) {
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      ctx.fillRect(border, border, innerW, innerH);
    }
    ctx.restore();
    ctx.restore();
    return placed;
  }

  var ARTWORK_TINTS = {
    bloom: ['#f6d9e0', '#c98ba6'], curtain: ['#e7dcc8', '#b08d5c'],
    geometry: ['#dbe4ef', '#7d94b5'], orbit: ['#e3dcf1', '#8d7ab8'],
    sunset: ['#fbe0cd', '#d98b5f'], wave: ['#d7e8e8', '#6f9d9d'],
  };

  function paintArtworkFallback(ctx, artwork, x, y, w, h) {
    var tint = ARTWORK_TINTS[artwork] || ['#e8e4d8', '#9a9384'];
    var gradient = ctx.createLinearGradient(x, y, x, y + h);
    gradient.addColorStop(0, tint[0]);
    gradient.addColorStop(1, tint[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, w, h);
  }

  // MARK: - 形状（对应 painter.ts 的 paintShape）

  function paintShape(ctx, item, w, h) {
    var color = css(item.color);
    var stroke = item.strokeWidth;
    var dash = dashOf(item.dashLength, item.dashGap);
    var radius = item.cornerRadius;
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.setLineDash(dash);
    switch (item.shape) {
      case '矩形':
        if (stroke > 0) {
          ctx.lineWidth = stroke;
          roundedRectPath(ctx, stroke / 2, stroke / 2, Math.max(0.01, w - stroke), Math.max(0.01, h - stroke), radius);
          ctx.stroke();
        } else {
          roundedRectPath(ctx, 0, 0, w, h, radius);
          ctx.fill();
        }
        break;
      case '圆形':
        if (stroke > 0) {
          ctx.lineWidth = stroke;
          ovalPath(ctx, stroke / 2, stroke / 2, Math.max(0.01, w - stroke), Math.max(0.01, h - stroke));
          ctx.stroke();
        } else {
          ovalPath(ctx, 0, 0, w, h);
          ctx.fill();
        }
        break;
      case '直线':
        // 高度就是线宽那一档，线画在框的正中间。
        ctx.lineWidth = Math.max(0.5, stroke);
        ctx.lineCap = 'butt';
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.stroke();
        break;
      case '唱片纹': {
        var gap = Math.max(2, item.dashGap > 0 ? item.dashGap : 8);
        var side = Math.min(w, h);
        var count = Math.max(1, Math.floor(side / 2 / gap));
        ctx.lineWidth = Math.max(0.5, stroke);
        ctx.setLineDash([]);
        for (var i = 0; i < count; i++) {
          var pad = i * gap;
          if (w - pad * 2 <= 0 || h - pad * 2 <= 0) break;
          ovalPath(ctx, pad, pad, w - pad * 2, h - pad * 2);
          ctx.stroke();
        }
        break;
      }
      case '点阵': {
        var dgap = Math.max(3, item.dashGap > 0 ? item.dashGap : 18);
        var diameter = Math.max(0.5, stroke > 0 ? stroke : 1.5);
        ctx.setLineDash([]);
        for (var px = dgap / 2; px < w; px += dgap) {
          for (var py = dgap / 2; py < h; py += dgap) {
            ovalPath(ctx, px - diameter / 2, py - diameter / 2, diameter, diameter);
            ctx.fill();
          }
        }
        break;
      }
      case '胶片孔': {
        var hole = Math.max(2, item.dashLength > 0 ? item.dashLength : 14);
        var hgap = Math.max(1, item.dashGap > 0 ? item.dashGap : 10);
        var n = Math.max(1, Math.floor((w + hgap) / (hole + hgap)));
        var total = n * hole + (n - 1) * hgap;
        var hx = (w - total) / 2;
        ctx.setLineDash([]);
        for (var k = 0; k < n; k++) {
          roundedRectPath(ctx, hx, 0, hole, h, radius);
          ctx.fill();
          hx += hole + hgap;
        }
        break;
      }
      case '锯齿边': {
        var tooth = Math.max(2, item.dashLength > 0 ? item.dashLength : 9);
        ctx.setLineDash([]);
        zigzagPath(ctx, 0, 0, w, h, tooth);
        ctx.fill();
        break;
      }
      case '渐变': {
        var grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, css(item.color));
        grad.addColorStop(1, css(item.color, 0));
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
        break;
      }
    }
    ctx.restore();
  }

  /// 小票的上下锯齿。
  function zigzagPath(ctx, x, y, w, h, tooth) {
    var count = Math.max(1, Math.floor(w / tooth));
    var step = w / count;
    ctx.beginPath();
    ctx.moveTo(x, y + tooth);
    for (var i = 0; i < count; i++) {
      ctx.lineTo(x + step * (i + 0.5), y);
      ctx.lineTo(x + step * (i + 1), y + tooth);
    }
    ctx.lineTo(x + w, y + h - tooth);
    for (var j = 0; j < count; j++) {
      ctx.lineTo(x + w - step * (j + 0.5), y + h);
      ctx.lineTo(x + w - step * (j + 1), y + h - tooth);
    }
    ctx.closePath();
  }

  // MARK: - 文字（对应 painter.ts 的 paintText）

  function drawParagraph(ctx, paragraph, x, y, color) {
    applyFont(ctx, paragraph.spec);
    ctx.fillStyle = color;
    ctx.textBaseline = 'alphabetic';
    for (var i = 0; i < paragraph.lines.length; i++) {
      var line = paragraph.lines[i];
      var lw = textWidth(paragraph.spec, line);
      var lx = x;
      if (paragraph.spec.align === '居中') lx = x + (paragraph.laidOutWidth - lw) / 2;
      else if (paragraph.spec.align === '右对齐') lx = x + paragraph.laidOutWidth - lw;
      ctx.fillText(line, lx, y + paragraph.baseline + paragraph.lineHeight * i);
    }
  }

  function paintText(ctx, item, frameWidth) {
    var fs = item.fontSize;
    var valueColor = css(item.color, item.placeholder ? 0.45 : 1);
    var labelColor = css(item.color, item.inlineLabel ? 1 : LABEL_ALPHA);
    var block = layoutTextBlock({
      text: item.value, label: item.label, inlineLabel: item.inlineLabel,
      fontSize: fs, weight: item.weight, design: item.design,
      alignment: item.align, tracking: item.tracking, lineLimit: item.lineLimit,
      chip: item.chip !== null && item.chip !== undefined,
      barcode: item.content === 'barcode', maxWidth: frameWidth,
    });

    var boxWidth = block.width, boxHeight = block.height;
    var boxX = item.align === '左对齐' ? 0
      : item.align === '居中' ? (frameWidth - boxWidth) / 2 : frameWidth - boxWidth;

    if (item.chip) {
      ctx.fillStyle = css(item.chip);
      roundedRectPath(ctx, boxX, 0, boxWidth, boxHeight, fs * 0.5);
      ctx.fill();
    }

    var originY = block.vpad;
    var blockX = boxX + block.hpad;
    var contentWidth = block.contentWidth;
    // 段落本来就排在整格宽上，画之前不重排，只把它整体挪进那一块（和 SwiftUI 一样）。
    var shift = function (width) {
      if (item.align === '左对齐') return 0;
      if (item.align === '居中') return (contentWidth - width) / 2;
      return contentWidth - width;
    };

    var inlineRow = item.inlineLabel && block.label;
    if (inlineRow) {
      // 小票行：标签贴左，值贴右。
      drawParagraph(ctx, block.label, blockX, originY, labelColor);
      drawParagraph(ctx, block.value, blockX + shift(block.value.laidOutWidth), originY, valueColor);
    } else {
      var cursor = originY;
      if (block.label) {
        drawParagraph(ctx, block.label, blockX + shift(block.label.width), cursor, labelColor);
        cursor += block.label.height + block.gap;
      }
      if (item.content === 'barcode') {
        // 条码不是字：那段文字只用来定这一块有多高，画出来的是竖条。
        paintBarcode(ctx, item, blockX, cursor, contentWidth, block.value.height);
      } else {
        drawParagraph(ctx, block.value, blockX + shift(block.value.laidOutWidth), cursor, valueColor);
      }
    }

    if (item.placeholder) {
      ctx.save();
      ctx.strokeStyle = css(item.color, 0.5);
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      roundedRectPath(ctx, boxX, 0, boxWidth, boxHeight, 4);
      ctx.stroke();
      ctx.restore();
    }
  }

  function barcodeSalt(seed) {
    var bytes = new TextEncoder().encode(String(seed || ''));
    var sum = 0;
    for (var i = 0; i < bytes.length; i++) sum += bytes[i];
    return sum;
  }

  function paintBarcode(ctx, item, x, y, width, height) {
    var salt = barcodeSalt(item.barcodeSeed);
    ctx.fillStyle = css(item.color);
    for (var i = 0; i < 56; i++) {
      if ((i * 13 + salt) % 7 < 5) {
        var bx = (i / 56) * width;
        var bw = Math.max(1, ((width / 90) * ((i % 3) + 1)) / 2);
        ctx.fillRect(x + bx, y, bw, height);
      }
    }
  }

  // MARK: - 导出

  /// 把场景画到一个新的 canvas 上（导出 PNG 用）。pixelWidth 是模版自己的 exportWidth。
  function renderToCanvas(scene, images, pixelWidth) {
    var scale = pixelWidth / scene.width;
    var canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(pixelWidth));
    canvas.height = Math.max(1, Math.round(scene.height * scale));
    var ctx = canvas.getContext('2d');
    ctx.save();
    ctx.scale(scale, scale);
    paintScene(ctx, scene, images);
    ctx.restore();
    return canvas;
  }

  global.LMRender = {
    paintScene: paintScene,
    renderToCanvas: renderToCanvas,
    imagePlacement: imagePlacement,
    layoutTextBlock: layoutTextBlock,
    boundingBox: boundingBox,
    roundedRectPath: roundedRectPath,
    clearMeasureCache: clearMeasureCache,
    css: css,
    fontString: fontString,
    FAMILY: FAMILY,
    WEIGHT: WEIGHT,
    CANVAS_LAYER_ID: CANVAS_LAYER_ID,
  };
})(window);
