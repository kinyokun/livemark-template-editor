// 画布绘制：照着 Encore/Features/TemplateCard.swift 重画一遍。
// 所有坐标都在 360 pt 宽的画布上，画布高 = round(360 × aspect)；导出时整体乘 scale。
(function (global) {
  'use strict';

  var LM = global.LM;
  var W0 = LM.CANVAS_W;

  var FAMILY = {
    '黑体': '-apple-system, BlinkMacSystemFont, "PingFang SC", system-ui, "Noto Sans CJK SC", "Microsoft YaHei", sans-serif',
    '宋体': '"Songti SC", "Source Han Serif SC", "Noto Serif CJK SC", "Noto Serif", Georgia, serif',
    '圆体': 'ui-rounded, "SF Pro Rounded", -apple-system, "Hiragino Maru Gothic ProN", "PingFang SC", system-ui, sans-serif',
    '等宽': 'ui-monospace, "SF Mono", Menlo, Monaco, "Noto Sans Mono CJK SC", "PingFang SC", monospace'
  };

  function fontString(size, weight, design) {
    return (LM.WEIGHT_CSS[weight] || 400) + ' ' + size + 'px ' + (FAMILY[design] || FAMILY['黑体']);
  }
  function setFont(ctx, size, weight, design, tracking) {
    ctx.font = fontString(size, weight, design);
    if ('letterSpacing' in ctx) ctx.letterSpacing = (tracking || 0) + 'px';
  }
  function measure(ctx, text) {
    var m = ctx.measureText(text);
    return m.width;
  }
  function lineMetrics(ctx, size) {
    var m = ctx.measureText('喜Ag');
    var ascent = m.fontBoundingBoxAscent, descent = m.fontBoundingBoxDescent;
    if (!isFinite(ascent) || !ascent) { ascent = size * 0.95; descent = size * 0.25; }
    return { ascent: ascent, descent: descent, height: ascent + descent };
  }

  // MARK: - 断行

  function isCJK(ch) {
    var c = ch.charCodeAt(0);
    return (c >= 0x2e80 && c <= 0x9fff) || (c >= 0xf900 && c <= 0xfaff) || (c >= 0xff00 && c <= 0xffef) ||
      (c >= 0x3000 && c <= 0x303f);
  }
  /// 把一段文字切成断行点：中日韩逐字可断，拉丁词按空格断。
  function tokenize(text) {
    var tokens = [], buffer = '';
    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i);
      if (isCJK(ch)) {
        if (buffer) { tokens.push(buffer); buffer = ''; }
        tokens.push(ch);
      } else if (ch === ' ') {
        buffer += ch;
        tokens.push(buffer); buffer = '';
      } else {
        buffer += ch;
      }
    }
    if (buffer) tokens.push(buffer);
    return tokens;
  }
  function wrapParagraph(ctx, text, maxWidth) {
    if (!text) return [''];
    if (measure(ctx, text) <= maxWidth) return [text];
    var tokens = tokenize(text), lines = [], line = '';
    for (var i = 0; i < tokens.length; i++) {
      var next = line + tokens[i];
      if (line && measure(ctx, next.replace(/\s+$/, '')) > maxWidth) {
        lines.push(line.replace(/\s+$/, ''));
        line = tokens[i].replace(/^\s+/, '');
      } else {
        line = next;
      }
      // 一个词自己就超宽：硬拆。
      while (measure(ctx, line) > maxWidth && line.length > 1) {
        var cut = line.length;
        while (cut > 1 && measure(ctx, line.slice(0, cut)) > maxWidth) cut--;
        lines.push(line.slice(0, cut));
        line = line.slice(cut);
      }
    }
    lines.push(line.replace(/\s+$/, ''));
    return lines;
  }
  function wrapAll(ctx, text, maxWidth) {
    var out = [];
    String(text).split('\n').forEach(function (p) {
      wrapParagraph(ctx, p, maxWidth).forEach(function (l) { out.push(l); });
    });
    return out;
  }

  /// 排一段文字：先按原字号排，排不下就缩到 0.7（minimumScaleFactor），再多就截断。
  function layoutText(ctx, text, spec) {
    var size = spec.size, lines, scale = 1;
    for (var step = 0; step <= 15; step++) {
      scale = 1 - step * 0.02;
      if (scale < 0.7) { scale = 0.7; }
      setFont(ctx, size * scale, spec.weight, spec.design, (spec.tracking || 0) * scale);
      lines = wrapAll(ctx, text, spec.maxWidth);
      if (lines.length <= spec.lineLimit || scale <= 0.7) break;
    }
    if (lines.length > spec.lineLimit) {
      lines = lines.slice(0, spec.lineLimit);
      var last = lines[lines.length - 1];
      while (last.length > 1 && measure(ctx, last + '…') > spec.maxWidth) last = last.slice(0, -1);
      lines[lines.length - 1] = last + '…';
    }
    var metrics = lineMetrics(ctx, size * scale);
    var advance = metrics.height + size * scale * 0.2;
    var width = 0;
    lines.forEach(function (l) { width = Math.max(width, measure(ctx, l)); });
    return {
      lines: lines, scale: scale, size: size * scale, tracking: (spec.tracking || 0) * scale,
      weight: spec.weight, design: spec.design,
      ascent: metrics.ascent, advance: advance,
      width: Math.min(width, spec.maxWidth),
      height: metrics.height + advance * (lines.length - 1)
    };
  }
  function drawLayout(ctx, layout, x, y, blockWidth, align) {
    setFont(ctx, layout.size, layout.weight, layout.design, layout.tracking);
    ctx.textBaseline = 'alphabetic';
    for (var i = 0; i < layout.lines.length; i++) {
      var line = layout.lines[i];
      var lw = measure(ctx, line);
      var lx = x;
      if (align === '居中') lx = x + (blockWidth - lw) / 2;
      else if (align === '右对齐') lx = x + blockWidth - lw;
      ctx.fillText(line, lx, y + layout.ascent + layout.advance * i);
    }
  }

  // MARK: - 形状小工具

  function roundedRectPath(ctx, x, y, w, h, r) {
    var radius = Math.max(0, Math.min(r, Math.min(w, h) / 2));
    ctx.beginPath();
    if (radius <= 0) { ctx.rect(x, y, w, h); return; }
    // .continuous 的近似：贝塞尔比圆弧稍平一点。
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
  function ellipsePath(ctx, x, y, w, h) {
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, Math.max(0.01, w / 2), Math.max(0.01, h / 2), 0, 0, Math.PI * 2);
  }
  function starPath(ctx, cx, cy, outer) {
    var inner = outer * 0.45;
    ctx.beginPath();
    for (var i = 0; i < 10; i++) {
      var r = i % 2 === 0 ? outer : inner;
      var a = -Math.PI / 2 + i * Math.PI / 5;
      var px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }
  /// scaledToFill：图片铺满 w×h，多出来的部分留给外层裁掉。
  function fillRect(iw, ih, w, h) {
    var s = Math.max(w / iw, h / ih);
    return { w: iw * s, h: ih * s };
  }

  // MARK: - 元素的尺寸与绘制

  function accentColor(value, accent, env) {
    if (accent === '主题色') return env.accentHex;
    if (accent === '主题深色') return env.deepHex;
    return LM.colorCSS(value);
  }

  function chipColor(el) {
    if (el.chip) return el.chip;
    if (el.chipAccent) return LM.INK;
    return null;
  }

  /// 量一个元素：返回它在画布上的宽高，以及一个把内容画进 (0,0,w,h) 的函数。
  function layoutElement(ctx, el, env) {
    var boxW = el.width * W0;
    var color = accentColor(el.color, el.accent, env);

    if (LM.hasImage(el)) {
      var h = boxW * LM.frameAspect(el);
      return { w: boxW, h: h, kind: 'image', draw: function (c) { drawImageLayer(c, el, boxW, h, env); } };
    }
    if (el.shape) {
      var sh = (el.shapeHeight === undefined || el.shapeHeight === null ? 0.1 : el.shapeHeight) * W0;
      return { w: boxW, h: sh, kind: 'shape', draw: function (c) { drawShape(c, el, boxW, sh, color); } };
    }

    var value = LM.textValue(el, env.bits);
    if (value === null && !env.placeholders) return null;
    var missing = value === null;
    var text = missing ? '[' + LM.fieldName(el.field) + ']' : value;

    var chip = chipColor(el);
    var hpad = el.chip ? el.fontSize * 0.6 : 0;
    var vpad = el.chip ? el.fontSize * 0.35 : 0;
    var availW = Math.max(4, boxW - hpad * 2);
    var inline = el.inlineLabel === true && !!el.label;
    var spacing = el.fontSize * 0.25;

    // 小标题
    var labelLayout = null, labelSize = Math.max(6, el.fontSize * 0.42);
    if (el.label) {
      if (inline) {
        setFont(ctx, el.fontSize, el.weight, el.design, el.tracking);
        labelLayout = layoutText(ctx, el.label, {
          size: el.fontSize, weight: el.weight, design: el.design,
          tracking: el.tracking, lineLimit: 1, maxWidth: availW
        });
      } else {
        labelLayout = layoutText(ctx, el.label, {
          size: labelSize, weight: '半粗', design: '等宽', tracking: 2, lineLimit: 1, maxWidth: availW
        });
      }
    }

    var valueW = availW, valueH = 0, valueLayout = null, valueKind = 'text';
    var valueAvail = inline && labelLayout ? Math.max(10, availW - labelLayout.width - el.fontSize) : availW;
    if (el.field === '评分星星' && !missing) {
      valueKind = 'stars';
      valueW = el.fontSize * 1.1 * 5 + 3 * 4;
      valueH = el.fontSize * 1.0;
    } else if (el.field === '条码' && !missing) {
      valueKind = 'barcode';
      valueW = valueAvail;
      valueH = el.fontSize * 2.6;
    } else {
      valueLayout = layoutText(ctx, text, {
        size: el.fontSize, weight: el.weight, design: el.design, tracking: el.tracking,
        lineLimit: missing ? 1 : el.lineLimit, maxWidth: valueAvail
      });
      valueW = valueLayout.width;
      valueH = valueLayout.height;
    }

    var blockW, blockH;
    if (inline && labelLayout) {
      blockW = availW;
      blockH = Math.max(labelLayout.height, valueH);
    } else if (labelLayout) {
      blockW = Math.max(labelLayout.width, valueW);
      blockH = labelLayout.height + spacing + valueH;
    } else {
      blockW = valueW;
      blockH = valueH;
    }
    blockW = Math.min(blockW, availW);

    var pw = blockW + hpad * 2, ph = blockH + vpad * 2;
    var offsetX = 0;
    if (el.alignment === '居中') offsetX = (boxW - pw) / 2;
    else if (el.alignment === '右对齐') offsetX = boxW - pw;

    return {
      w: boxW, h: ph, kind: 'text', contentX: offsetX, contentW: pw,
      draw: function (c) {
        c.save();
        c.translate(offsetX, 0);
        if (chip) {
          c.fillStyle = accentColor(chip, el.chipAccent, env);
          roundedRectPath(c, 0, 0, pw, ph, el.fontSize * 0.5);
          c.fill();
        }
        c.translate(hpad, vpad);
        c.fillStyle = color;
        if (inline && labelLayout) {
          drawLayout(c, labelLayout, 0, 0, labelLayout.width, '左对齐');
          var right = blockW - Math.min(valueW, valueAvail);
          drawValue(c, right, 0, Math.min(valueW, valueAvail));
        } else {
          var y = 0;
          if (labelLayout) {
            c.globalAlpha *= 0.6;
            drawLayout(c, labelLayout, alignX(labelLayout.width), 0, labelLayout.width, el.alignment);
            c.globalAlpha /= 0.6;
            y = labelLayout.height + spacing;
          }
          drawValue(c, alignX(valueW), y, valueW);
        }
        c.restore();
        if (missing) {
          c.save();
          c.translate(offsetX, 0);
          c.globalAlpha *= 0.5;
          c.strokeStyle = color;
          c.lineWidth = 1;
          c.setLineDash([3, 3]);
          roundedRectPath(c, 0.5, 0.5, pw - 1, ph - 1, 4);
          c.stroke();
          c.setLineDash([]);
          c.restore();
        }
        function alignX(w) {
          if (el.alignment === '居中') return (blockW - w) / 2;
          if (el.alignment === '右对齐') return blockW - w;
          return 0;
        }
        function drawValue(c2, x, y, w) {
          if (valueKind === 'stars') {
            drawStars(c2, x, y, el.fontSize, env.bits.rating || 0, color);
          } else if (valueKind === 'barcode') {
            drawBarcode(c2, x, y, w, valueH, env.bits.record.id.toUpperCase(), color);
          } else {
            c2.save();
            if (missing) c2.globalAlpha *= 0.45;
            c2.fillStyle = color;
            drawLayout(c2, valueLayout, x, y, w, el.alignment);
            c2.restore();
          }
        }
      }
    };
  }

  function drawStars(ctx, x, y, size, rating, color) {
    var cell = size * 1.1;
    for (var i = 0; i < 5; i++) {
      var cx = x + i * (cell + 3) + cell / 2, cy = y + size * 0.5;
      starPath(ctx, cx, cy, size * 0.5);
      ctx.save();
      ctx.globalAlpha *= (i < rating ? 1 : 0.25);
      if (i < rating) { ctx.fillStyle = color; ctx.fill(); }
      else { ctx.strokeStyle = color; ctx.lineWidth = Math.max(0.5, size * 0.08); ctx.stroke(); }
      ctx.restore();
    }
  }

  function drawBarcode(ctx, x, y, w, h, seed, color) {
    var bytes = new TextEncoder().encode(seed), salt = 0;
    for (var i = 0; i < bytes.length; i++) salt += bytes[i];
    ctx.fillStyle = color;
    for (var b = 0; b < 56; b++) {
      if ((b * 13 + salt) % 7 < 5) {
        var bx = b / 56 * w;
        var bw = Math.max(1, w / 90 * (b % 3 + 1) / 2);
        ctx.fillRect(x + bx, y, bw, h);
      }
    }
  }

  function drawImageLayer(ctx, el, w, h, env) {
    var img = env.images.get(el.id, el.imageData);
    var video = env.videoFor ? env.videoFor(el) : null;
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.clip();
    var source = (video && video.readyState >= 2 && !video.paused) ? video : img;
    if (source) {
      var iw = source.videoWidth || source.naturalWidth || source.width;
      var ih = source.videoHeight || source.naturalHeight || source.height;
      if (iw && ih) {
        var p = el.imagePlacement || LM.defaultPlacement();
        var size = fillRect(iw, ih, w, h);
        ctx.translate(w / 2 + p.offsetX * w, h / 2 + p.offsetY * h);
        ctx.rotate(p.rotation * Math.PI / 180);
        ctx.scale(p.scale, p.scale);
        ctx.drawImage(source, -size.w / 2, -size.h / 2, size.w, size.h);
      }
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      ctx.fillRect(0, 0, w, h);
    }
    ctx.restore();
    if (env.placeholders && LM.isLivePhoto(el)) drawLiveBadge(ctx, 6, 6);
  }

  function drawLiveBadge(ctx, x, y) {
    ctx.save();
    var h = 12, w = 30;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    roundedRectPath(ctx, x, y, w, h, h / 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    setFont(ctx, 7, '粗体', '等宽', 0.6);
    ctx.textBaseline = 'middle';
    ctx.fillText('LIVE', x + 6, y + h / 2 + 0.5);
    ctx.restore();
  }

  function dashArray(el) {
    var length = el.dashLength || 0, gap = el.dashGap || 0;
    return (length > 0 && gap > 0) ? [length, gap] : [];
  }

  function drawShape(ctx, el, w, h, color) {
    var stroke = el.strokeWidth || 0;
    var radius = el.cornerRadius || 0;
    var dash = dashArray(el);
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.setLineDash(dash);
    switch (el.shape) {
      case '矩形':
        if (stroke > 0) {
          ctx.lineWidth = stroke;
          roundedRectPath(ctx, stroke / 2, stroke / 2, Math.max(0.01, w - stroke), Math.max(0.01, h - stroke), Math.max(0, radius - stroke / 2));
          ctx.stroke();
        } else {
          roundedRectPath(ctx, 0, 0, w, h, radius);
          ctx.fill();
        }
        break;
      case '圆形':
        if (stroke > 0) {
          ctx.lineWidth = stroke;
          ellipsePath(ctx, stroke / 2, stroke / 2, Math.max(0.01, w - stroke), Math.max(0.01, h - stroke));
          ctx.stroke();
        } else {
          ellipsePath(ctx, 0, 0, w, h);
          ctx.fill();
        }
        break;
      case '直线':
        ctx.lineWidth = Math.max(0.5, stroke);
        ctx.lineCap = 'butt';
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w, 0); ctx.stroke();
        break;
      case '唱片纹': {
        var gap = Math.max(2, el.dashGap === undefined || el.dashGap === null ? 8 : el.dashGap);
        var side = Math.min(w, h);
        var count = Math.max(1, Math.floor(side / 2 / gap));
        ctx.lineWidth = Math.max(0.5, stroke);
        ctx.setLineDash([]);
        for (var i = 0; i < count; i++) {
          var inset = i * gap;
          if (w - inset * 2 <= 0 || h - inset * 2 <= 0) break;
          ellipsePath(ctx, inset, inset, w - inset * 2, h - inset * 2);
          ctx.stroke();
        }
        break;
      }
      case '点阵': {
        var dgap = Math.max(3, el.dashGap === undefined || el.dashGap === null ? 18 : el.dashGap);
        var diameter = Math.max(0.5, stroke > 0 ? stroke : 1.5);
        ctx.setLineDash([]);
        for (var x = dgap / 2; x < w; x += dgap) {
          for (var y = dgap / 2; y < h; y += dgap) {
            ctx.beginPath();
            ctx.ellipse(x, y, diameter / 2, diameter / 2, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        break;
      }
      case '胶片孔': {
        var hole = Math.max(2, el.dashLength === undefined || el.dashLength === null ? 14 : el.dashLength);
        var hgap = Math.max(1, el.dashGap === undefined || el.dashGap === null ? 10 : el.dashGap);
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
        var tooth = Math.max(2, el.dashLength === undefined || el.dashLength === null ? 9 : el.dashLength);
        var cnt = Math.max(1, Math.floor(w / tooth));
        var step = w / cnt;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(0, tooth);
        for (var t = 0; t < cnt; t++) {
          ctx.lineTo(step * (t + 0.5), 0);
          ctx.lineTo(step * (t + 1), tooth);
        }
        ctx.lineTo(w, h - tooth);
        for (var t2 = 0; t2 < cnt; t2++) {
          ctx.lineTo(w - step * (t2 + 0.5), h);
          ctx.lineTo(w - step * (t2 + 1), h - tooth);
        }
        ctx.closePath();
        ctx.fill();
        break;
      }
      case '渐变': {
        var grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, color);
        grad.addColorStop(1, transparent(color));
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
        break;
      }
    }
    ctx.restore();
  }

  function transparent(css) {
    if (css.indexOf('rgba(') === 0) return css.replace(/,\s*[\d.]+\)$/, ',0)');
    if (css.indexOf('rgb(') === 0) return css.replace('rgb(', 'rgba(').replace(')', ',0)');
    if (css.charAt(0) === '#') {
      var hex = css.slice(1);
      if (hex.length === 3) hex = hex.split('').map(function (c) { return c + c; }).join('');
      return 'rgba(' + parseInt(hex.slice(0, 2), 16) + ',' + parseInt(hex.slice(2, 4), 16) + ',' + parseInt(hex.slice(4, 6), 16) + ',0)';
    }
    return 'rgba(0,0,0,0)';
  }

  // MARK: - 封面

  function drawCover(ctx, template, env, W, H) {
    var cover = template.cover;
    var w = Math.max(1, cover.width * W), h = Math.max(1, cover.height * H);
    var b = cover.border;
    var outerW = w + b * 2, outerH = h + b * 2;
    ctx.save();
    ctx.translate(cover.x * W, cover.y * H);
    ctx.rotate(cover.rotation * Math.PI / 180);
    ctx.globalAlpha *= cover.opacity;
    if (cover.shadow) {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.22)';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 8;
      ctx.fillStyle = b > 0 ? '#ffffff' : 'rgba(0,0,0,0.9)';
      roundedRectPath(ctx, -outerW / 2, -outerH / 2, outerW, outerH, cover.cornerRadius);
      ctx.fill();
      ctx.restore();
    }
    roundedRectPath(ctx, -outerW / 2, -outerH / 2, outerW, outerH, cover.cornerRadius);
    ctx.save();
    ctx.clip();
    if (b > 0) { ctx.fillStyle = '#ffffff'; ctx.fillRect(-outerW / 2, -outerH / 2, outerW, outerH); }
    // 相纸里面：图片按 scaledToFill 铺满 w×h，再按 content 缩放 / 平移 / 倾斜。
    ctx.beginPath(); ctx.rect(-w / 2, -h / 2, w, h); ctx.clip();
    var img = env.coverImage;
    var p = cover.content;
    if (img && (img.naturalWidth || img.width)) {
      var size = fillRect(img.naturalWidth || img.width, img.naturalHeight || img.height, w, h);
      ctx.translate(p.offsetX * w, p.offsetY * h);
      ctx.rotate(p.rotation * Math.PI / 180);
      ctx.scale(p.scale, p.scale);
      ctx.drawImage(img, -size.w / 2, -size.h / 2, size.w, size.h);
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      ctx.fillRect(-w / 2, -h / 2, w, h);
    }
    ctx.restore();
    ctx.restore();
    return { x: cover.x * W - outerW / 2, y: cover.y * H - outerH / 2, w: outerW, h: outerH };
  }

  // MARK: - 整张卡

  /// env: {bits, accentHex, deepHex, images, coverImage, placeholders, videoFor}
  /// 回填 frames（画布坐标，未旋转的外框），编辑器拿它做命中测试与选中框。
  function draw(ctx, template, env) {
    var W = W0, H = LM.canvasHeight(template);
    var frames = {};
    ctx.save();
    ctx.textBaseline = 'alphabetic';
    // 底色
    ctx.fillStyle = template.backgroundAccent
      ? (template.backgroundAccent === '主题深色' ? env.deepHex : env.accentHex)
      : LM.colorCSS(template.background);
    ctx.fillRect(0, 0, W, H);
    // 底图
    var base = template.imageData ? env.images.get('base:' + template.id, template.imageData) : null;
    if (base && (base.naturalWidth || base.width)) {
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
      ctx.globalAlpha *= template.imageOpacity;
      var size = fillRect(base.naturalWidth || base.width, base.naturalHeight || base.height, W, H);
      ctx.translate(W / 2 + template.imageOffsetX * W, H / 2 + template.imageOffsetY * H);
      ctx.scale(template.imageScale, template.imageScale);
      ctx.drawImage(base, -size.w / 2, -size.h / 2, size.w, size.h);
      ctx.restore();
    }
    // 元素与封面，按 cover.layer 夹在中间
    var split = LM.coverSplit(template);
    function drawElements(list) {
      list.forEach(function (el) {
        var layout = layoutElement(ctx, el, env);
        if (!layout) return;
        var cx = el.x * W, cy = el.y * H;
        frames[el.id] = { x: cx - layout.w / 2, y: cy - layout.h / 2, w: layout.w, h: layout.h };
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(el.rotation * Math.PI / 180);
        ctx.globalAlpha *= el.opacity;
        ctx.translate(-layout.w / 2, -layout.h / 2);
        layout.draw(ctx);
        ctx.restore();
      });
    }
    drawElements(template.elements.slice(0, split));
    if (template.cover.visible) frames.cover = drawCover(ctx, template, env, W, H);
    drawElements(template.elements.slice(split));
    ctx.restore();
    return frames;
  }

  global.LMRender = {
    draw: draw, FAMILY: FAMILY, fontString: fontString,
    roundedRectPath: roundedRectPath, layoutElement: layoutElement
  };
})(window);
