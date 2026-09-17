// 界面：模版库、画布交互、三个检查器。控件与文案照 TemplateEditor.swift /
// TemplateEditorInspectors.swift 来，能用图标或禁用态说清楚的就不写句子。
(function (global) {
  'use strict';

  var LM = global.LM, R = global.LMRender;
  var STORE_KEY = 'livemark.templates.v1';

  // MARK: - 小工具

  function h(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') node.className = attrs[k];
      else if (k === 'text') node.textContent = attrs[k];
      else if (k === 'html') node.innerHTML = attrs[k];
      else if (k.slice(0, 2) === 'on') node.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] === true) node.setAttribute(k, '');
      else if (attrs[k] !== false && attrs[k] !== null && attrs[k] !== undefined) node.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) node.appendChild(c); });
    return node;
  }
  function pct(v) { return Math.round(v * 100) + '%'; }
  function signedPct(v) { return (v >= 0 ? '+' : '') + Math.round(v * 100) + '%'; }
  function deg(v) { return v.toFixed(1) + '°'; }
  function one(v) { return v.toFixed(1); }
  function pt(v) { return String(Math.round(v)); }
  function ratio(v) { return v.toFixed(2); }
  function px(v) { return Math.round(v) + ' px'; }

  function mimeFor(base64) {
    var head = base64.slice(0, 16);
    if (head.indexOf('iVBOR') === 0) return 'image/png';
    if (head.indexOf('/9j/') === 0) return 'image/jpeg';
    if (head.indexOf('R0lGOD') === 0) return 'image/gif';
    if (head.indexOf('UklGR') === 0) return 'image/webp';
    return 'image/heic';
  }

  // MARK: - 图片缓存

  function ImageStore(onLoad) {
    this.cache = {};
    this.onLoad = onLoad;
  }
  ImageStore.prototype.get = function (key, base64) {
    if (!base64) return null;
    var entry = this.cache[key];
    if (entry && entry.data === base64) return entry.ready ? entry.img : null;
    var img = new Image();
    var self = this;
    var record = { data: base64, img: img, ready: false };
    this.cache[key] = record;
    img.onload = function () { record.ready = true; self.onLoad(); };
    img.onerror = function () { record.ready = false; };
    img.src = base64.indexOf('data:') === 0 ? base64 : 'data:' + mimeFor(base64) + ';base64,' + base64;
    return null;
  };

  // MARK: - 应用

  function App() {
    var self = this;
    this.options = LM.defaultOptions();
    this.records = LM.samples();
    this.recordIndex = 0;
    this.selection = 'canvas';
    this.frames = {};
    this.undoStack = [];
    this.lastUndoTag = null;
    this.lastUndoTime = 0;
    this.starterUndo = null;
    this.videos = {};
    this.hoverElement = null;
    this.images = new ImageStore(function () { self.render(); });
    this.covers = {};
    this.library = this.loadLibrary();
    this.builtIns = (global.LIVEMARK_BUILTIN_TEMPLATES || []).map(function (doc) { return LM.sanitize(doc.template); });
    this.currentSource = null;
    this.loadCovers();
    this.template = this.builtIns.length ? this.openCopy(this.builtIns[0]) : LM.starter('信息票根');
  }

  App.prototype.loadCovers = function () {
    var self = this;
    var data = global.LIVEMARK_COVERS || {};
    Object.keys(data).forEach(function (name) {
      var img = new Image();
      img.onload = function () { self.render(); };
      img.src = data[name];
      self.covers[name] = img;
    });
  };
  App.prototype.record = function () { return this.records[this.recordIndex]; };
  App.prototype.coverImage = function () {
    var img = this.covers[this.record().cover];
    return img && img.complete && img.naturalWidth ? img : null;
  };
  App.prototype.accent = function () {
    var id = this.options.accent;
    for (var i = 0; i < LM.ACCENTS.length; i++) if (LM.ACCENTS[i].id === id) return LM.ACCENTS[i];
    return LM.ACCENTS[0];
  };
  App.prototype.env = function (placeholders) {
    var accent = this.accent();
    return {
      bits: LM.bitsFor(this.record(), this.options),
      accentHex: accent.hex, deepHex: accent.deepHex,
      images: this.images, coverImage: this.coverImage(),
      placeholders: !!placeholders,
      videoFor: this.videoFor.bind(this)
    };
  };
  App.prototype.openCopy = function (template) {
    var copy = LM.sanitize(LM.clone(template));
    copy.id = LM.uuid();
    copy.elements.forEach(function (el) { el.id = LM.uuid(); });
    return copy;
  };

  // MARK: 模版库

  App.prototype.loadLibrary = function () {
    try {
      var raw = global.localStorage.getItem(STORE_KEY);
      if (!raw) return [];
      return JSON.parse(raw).map(LM.sanitize);
    } catch (e) { return []; }
  };
  App.prototype.saveLibrary = function () {
    try { global.localStorage.setItem(STORE_KEY, JSON.stringify(this.library)); }
    catch (e) { this.toast('浏览器存不下了', true); }
  };

  // MARK: 撤销

  App.prototype.snapshot = function () { return JSON.stringify(this.template); };
  App.prototype.pushUndo = function (tag) {
    var now = Date.now();
    if (tag && tag === this.lastUndoTag && now - this.lastUndoTime < 700) { this.lastUndoTime = now; return; }
    this.undoStack.push(this.snapshot());
    if (this.undoStack.length > 60) this.undoStack.shift();
    this.lastUndoTag = tag || null;
    this.lastUndoTime = now;
  };
  App.prototype.undo = function () {
    if (!this.undoStack.length) { this.toast('没有可撤销的'); return; }
    this.template = JSON.parse(this.undoStack.pop());
    this.lastUndoTag = null;
    if (this.selectedElement() === null && this.selection !== 'canvas' && this.selection !== 'cover') this.selection = 'canvas';
    this.refresh();
  };
  /// 改一处：先存快照，再改，再重画。tag 相同且很近的连续改动合并成一步。
  /// 带 tag 的是连续改动（滑杆、输入框）：只重画，不重建检查器，免得拖动时控件被换掉。
  /// 不带 tag 的会改变界面结构，整块重建。
  App.prototype.edit = function (tag, fn) {
    this.pushUndo(tag);
    fn(this.template);
    if (tag) { this.render(); this.updateBars(); } else { this.refresh(); }
  };

  App.prototype.selectedElement = function () {
    var id = this.selection;
    for (var i = 0; i < this.template.elements.length; i++) if (this.template.elements[i].id === id) return this.template.elements[i];
    return null;
  };

  // MARK: 实况照片

  App.prototype.videoFor = function (el) {
    if (!LM.isLivePhoto(el)) return null;
    return this.hoverElement === el.id ? this.videos[el.id] : null;
  };
  App.prototype.ensureVideo = function (el) {
    var self = this;
    if (this.videos[el.id]) return this.videos[el.id];
    var video = document.createElement('video');
    video.muted = true; video.playsInline = true; video.loop = true;
    video.src = 'data:video/mp4;base64,' + el.videoData;
    video.addEventListener('timeupdate', function () { if (self.hoverElement === el.id) self.render(); });
    this.videos[el.id] = video;
    return video;
  };

  // MARK: - 渲染

  App.prototype.refresh = function () {
    this.render();
    this.buildLibrary();
    this.buildInspector();
    this.updateBars();
  };
  App.prototype.render = function () {
    var t = this.template;
    var wrap = document.getElementById('canvasWrap');
    var availW = Math.max(120, wrap.clientWidth - 36);
    var availH = Math.max(120, wrap.clientHeight - 36);
    var height = LM.canvasHeight(t);
    var s = Math.min(availW / LM.CANVAS_W, availH / height);
    s = Math.max(0.2, Math.min(s, 2.2));
    this.viewScale = s;
    var dpr = Math.min(3, global.devicePixelRatio || 1);
    var cssW = LM.CANVAS_W * s, cssH = height * s;
    var canvas = document.getElementById('canvas');
    var overlay = document.getElementById('overlay');
    [canvas, overlay].forEach(function (c) {
      c.style.width = cssW + 'px'; c.style.height = cssH + 'px';
      c.width = Math.round(cssW * dpr); c.height = Math.round(cssH * dpr);
    });
    document.getElementById('board').style.width = cssW + 'px';
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr * s, 0, 0, dpr * s, 0, 0);
    ctx.clearRect(0, 0, LM.CANVAS_W, height);
    this.frames = R.draw(ctx, t, this.env(true));
    this.drawOverlay(overlay, dpr, s);
    document.getElementById('sizeNote').textContent =
      '导出 ' + Math.round(LM.exportPixelWidth(t)) + ' × ' + Math.round(LM.exportPixelHeight(t)) + ' px';
  };
  App.prototype.drawOverlay = function (overlay, dpr, s) {
    var ctx = overlay.getContext('2d');
    ctx.setTransform(dpr * s, 0, 0, dpr * s, 0, 0);
    ctx.clearRect(0, 0, LM.CANVAS_W, LM.canvasHeight(this.template));
    var frame = this.selectionFrame();
    if (!frame) return;
    ctx.save();
    ctx.strokeStyle = '#c4553f';
    ctx.lineWidth = 1.5 / s;
    ctx.setLineDash([5 / s, 4 / s]);
    ctx.strokeRect(frame.x - 3, frame.y - 3, frame.w + 6, frame.h + 6);
    ctx.setLineDash([]);
    ctx.fillStyle = '#c4553f';
    var r = 3.5 / s;
    this.handles(frame).forEach(function (p) {
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
    });
    ctx.restore();
  };
  App.prototype.handles = function (frame) {
    return [
      { x: frame.x - 3, y: frame.y - 3 }, { x: frame.x + frame.w + 3, y: frame.y - 3 },
      { x: frame.x - 3, y: frame.y + frame.h + 3 }, { x: frame.x + frame.w + 3, y: frame.y + frame.h + 3 }
    ];
  };
  App.prototype.selectionFrame = function () {
    if (this.selection === 'canvas') return null;
    if (this.selection === 'cover') return this.template.cover.visible ? this.frames.cover : null;
    return this.frames[this.selection] || null;
  };

  // MARK: - 顶栏与图层名

  App.prototype.layerTitle = function (el) {
    if (LM.hasImage(el)) {
      if (LM.isLivePhoto(el)) return '实况照片';
      return el.isSticker === true ? '系统贴纸' : '图片图层';
    }
    if (el.shape) return el.shape;
    if (el.field === '自定义文字') return '文字 · ' + LM.prefix(el.text, 8);
    return LM.fieldName(el.field);
  };
  App.prototype.selectionTitle = function () {
    if (this.selection === 'canvas') return '画布与底图';
    if (this.selection === 'cover') return '封面图层';
    var el = this.selectedElement();
    return el ? this.layerTitle(el) : '信息';
  };
  App.prototype.updateBars = function () {
    document.getElementById('layerName').textContent = this.selectionTitle();
    var note = document.getElementById('canvasNote');
    if (this.template.elements.length >= LM.MAX_ELEMENTS) { note.textContent = '最多 80 个元素'; note.className = 'hint warn'; }
    else { note.textContent = this.template.name; note.className = 'hint'; }
    document.getElementById('btnAddElement').disabled = this.template.elements.length >= LM.MAX_ELEMENTS;
  };

  App.prototype.toast = function (text, warn) {
    var node = document.getElementById('toast');
    node.textContent = text;
    node.className = 'toast on' + (warn ? ' warn' : '');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(function () { node.className = 'toast'; }, 2200);
  };

  // MARK: - 模版库侧栏

  App.prototype.buildLibrary = function () {
    var self = this;
    var box = document.getElementById('library');
    box.innerHTML = '';
    box.appendChild(h('div', { class: 'section-title', text: '内置模版' }));
    this.builtIns.forEach(function (t) {
      box.appendChild(self.libItem(t.name, '', function () { self.openTemplate(self.openCopy(t), 'builtin:' + t.name); }, self.currentSource === 'builtin:' + t.name));
    });
    box.appendChild(h('div', { class: 'section-title', text: '起始排版' }));
    LM.STARTERS.forEach(function (s) {
      box.appendChild(self.libItem(s.id, s.subtitle, function () { self.openTemplate(LM.starter(s.id), 'starter:' + s.id); }, self.currentSource === 'starter:' + s.id));
    });
    box.appendChild(h('div', { class: 'section-title', text: '我的模版' }));
    if (!this.library.length) box.appendChild(h('div', { class: 'empty', text: '还没有保存的模版' }));
    this.library.forEach(function (t, index) {
      var row = h('div', { class: 'lib-row' });
      row.appendChild(self.libItem(t.name, '', function () { self.openTemplate(self.openCopy(t), 'saved:' + t.id); }, self.currentSource === 'saved:' + t.id));
      row.appendChild(h('button', {
        class: 'icon-btn', title: '重命名', text: '✎', onclick: function () {
          var name = prompt('模版名称', t.name);
          if (name === null) return;
          t.name = LM.prefix(name.trim(), 40) || t.name;
          self.saveLibrary(); self.buildLibrary();
        }
      }));
      row.appendChild(h('button', {
        class: 'icon-btn', title: '复制', text: '⧉', onclick: function () {
          var copy = self.openCopy(t);
          copy.name = LM.prefix(t.name + ' 副本', 40);
          self.library.splice(index + 1, 0, copy);
          self.saveLibrary(); self.buildLibrary();
        }
      }));
      row.appendChild(h('button', {
        class: 'icon-btn', title: '删除', text: '␡', onclick: function () {
          if (!confirm('删除「' + t.name + '」？')) return;
          self.library.splice(index, 1);
          self.saveLibrary(); self.buildLibrary();
        }
      }));
      box.appendChild(row);
    });
    box.appendChild(this.previewPanel());
  };
  App.prototype.libItem = function (name, sub, onclick, on) {
    return h('button', { class: 'lib-item' + (on ? ' on' : ''), onclick: onclick }, [
      h('span', { class: 'thumb' }),
      h('span', { class: 'name' }, [document.createTextNode(name), sub ? h('span', { class: 'sub', text: sub }) : null])
    ]);
  };
  App.prototype.openTemplate = function (template, source) {
    this.pushUndo('open');
    this.template = template;
    this.currentSource = source || null;
    this.selection = 'canvas';
    this.starterUndo = null;
    this.refresh();
  };

  App.prototype.previewPanel = function () {
    var self = this;
    var panel = h('div', { class: 'panel' });
    panel.appendChild(h('div', { class: 'section-title', text: '预览' }));
    var select = h('select', {
      onchange: function () { self.recordIndex = Number(this.value); self.refresh(); }
    }, this.records.map(function (r, i) {
      return h('option', { value: i, text: r.title, selected: i === self.recordIndex });
    }));
    panel.appendChild(h('div', { class: 'field' }, [select]));

    var swatches = h('div', { class: 'swatches' });
    LM.ACCENTS.forEach(function (a) {
      swatches.appendChild(h('button', {
        class: 'swatch' + (self.options.accent === a.id ? ' on' : ''),
        style: 'background:' + a.hex, title: a.name,
        onclick: function () { self.options.accent = a.id; self.refresh(); }
      }));
    });
    panel.appendChild(swatches);

    var headline = h('input', {
      type: 'text', placeholder: '开场白', value: this.options.headline,
      oninput: function () { self.options.headline = this.value; self.render(); }
    });
    var author = h('input', {
      type: 'text', placeholder: '署名', value: this.options.author,
      oninput: function () { self.options.author = this.value; self.render(); }
    });
    panel.appendChild(h('div', { class: 'field' }, [headline]));
    panel.appendChild(h('div', { class: 'field' }, [author]));

    var details = h('details', { class: 'switches' }, [h('summary', { text: '分享开关' })]);
    var grid = h('div', { class: 'checks' });
    [['showDate', '日期'], ['showVenue', '地点'], ['showRating', '评分'], ['showQuote', '金句'],
     ['showNote', '感想'], ['showSetlist', '曲目'], ['showAuthor', '署名'],
     ['showPrice', '票价'], ['showSeat', '座位'], ['showCompanions', '同行']].forEach(function (pair) {
      var input = h('input', {
        type: 'checkbox', checked: self.options[pair[0]],
        onchange: function () { self.options[pair[0]] = this.checked; self.render(); }
      });
      grid.appendChild(h('label', {}, [input, h('span', { text: pair[1] })]));
    });
    details.appendChild(grid);
    details.appendChild(h('div', { class: 'private-note', text: '票价 / 座位 / 同行默认不印' }));
    panel.appendChild(details);
    return panel;
  };

  // MARK: - 检查器控件

  function fieldBox(label, control) {
    return h('div', { class: 'field' }, [label ? h('span', { class: 'lab', text: label }) : null, control]);
  }
  App.prototype.slider = function (title, value, min, max, step, format, onInput, tag) {
    var out = h('b', { text: format(value) });
    var input = h('input', {
      type: 'range', min: min, max: max, step: step, value: value,
      oninput: function () {
        var v = Number(this.value);
        out.textContent = format(v);
        onInput(v, tag || title);
      }
    });
    return h('div', { class: 'field' }, [
      h('div', { class: 'slider-head' }, [h('span', { text: title }), out]),
      input
    ]);
  };
  App.prototype.toggle = function (title, on, onChange) {
    var self = this;
    return h('div', { class: 'field toggle' }, [
      h('span', { text: title }),
      h('input', { type: 'checkbox', checked: on, onchange: function () { onChange(this.checked); } })
    ]);
  };
  App.prototype.segmented = function (title, options, value, onChange) {
    var seg = h('div', { class: 'seg' });
    options.forEach(function (o) {
      seg.appendChild(h('button', {
        class: value === o ? 'on' : '', text: o,
        onclick: function () { onChange(o); }
      }));
    });
    return fieldBox(title, seg);
  };
  App.prototype.select = function (title, options, value, onChange) {
    var node = h('select', { onchange: function () { onChange(this.value); } },
      options.map(function (o) {
        var v = typeof o === 'string' ? o : o.value, label = typeof o === 'string' ? o : o.label;
        return h('option', { value: v, text: label, selected: v === value });
      }));
    return fieldBox(title, node);
  };
  App.prototype.groupedFieldSelect = function (title, value, onChange) {
    var node = h('select', { onchange: function () { onChange(this.value); } });
    LM.FIELD_GROUPS.forEach(function (group) {
      var optgroup = h('optgroup', { label: group });
      LM.FIELDS.filter(function (f) { return f.group === group; }).forEach(function (f) {
        optgroup.appendChild(h('option', { value: f.raw, text: f.name, selected: f.raw === value }));
      });
      node.appendChild(optgroup);
    });
    return fieldBox(title, node);
  };
  /// 颜色：预设色 + 取色器 + 十六进制。
  App.prototype.colorControl = function (title, value, onChange, extra) {
    var hexInput = h('input', { type: 'text', value: LM.colorHex(value), spellcheck: 'false' });
    var picker = h('input', { type: 'color', value: LM.colorHex(value).slice(0, 7) });
    function apply(hex) {
      var c = LM.colorFromHex(hex);
      if (!c) return;
      hexInput.value = LM.colorHex(c);
      picker.value = LM.colorHex(c).slice(0, 7);
      onChange(c);
    }
    picker.addEventListener('input', function () { apply(this.value); });
    hexInput.addEventListener('change', function () { apply(this.value); });
    var row = h('div', { class: 'color-row' }, [picker, hexInput]);
    var presets = h('div', { class: 'presets' });
    var list = LM.COLOR_PRESETS.slice();
    (extra || []).forEach(function (c) { list.push({ name: '对比色', hex: LM.colorHex(c) }); });
    list.forEach(function (p) {
      presets.appendChild(h('button', {
        class: 'preset', style: 'background:' + p.hex, title: p.name,
        onclick: function () { apply(p.hex); }
      }));
    });
    return h('div', { class: 'field' }, [h('span', { class: 'lab', text: title }), row, presets]);
  };
  App.prototype.accentPicker = function (title, value, onChange) {
    return this.segmented(title, ['固定颜色', '主题色', '主题深色'], value || '固定颜色', function (v) {
      onChange(v === '固定颜色' ? null : v);
    });
  };

  // MARK: - 检查器

  App.prototype.buildInspector = function () {
    var box = document.getElementById('inspector');
    box.innerHTML = '';
    box.appendChild(h('div', { class: 'insp-title', text: this.selectionTitle() }));
    if (this.selection === 'canvas') this.canvasInspector(box);
    else if (this.selection === 'cover') this.coverInspector(box);
    else {
      var el = this.selectedElement();
      if (!el) { this.selection = 'canvas'; this.canvasInspector(box); }
      else if (LM.hasImage(el)) this.imageInspector(box, el);
      else if (el.shape) this.shapeInspector(box, el);
      else this.textInspector(box, el);
    }
  };

  App.prototype.canvasInspector = function (box) {
    var self = this, t = this.template;
    box.appendChild(fieldBox('模版名称', h('input', {
      type: 'text', value: t.name,
      oninput: function () { var v = this.value; self.edit('name', function (x) { x.name = LM.prefix(v, 40); }); }
    })));

    var chips = h('div', { class: 'chips' });
    LM.ASPECT_PRESETS.forEach(function (p) {
      chips.appendChild(h('button', {
        class: 'chip' + (Math.abs(t.aspect - p[1]) < 0.005 ? ' on' : ''), text: p[0],
        onclick: function () { self.edit(null, function (x) { x.aspect = LM.clamp(p[1], LM.ASPECT_RANGE, x.aspect); }); }
      }));
    });
    if (t.imageData) {
      chips.appendChild(h('button', {
        class: 'chip', text: '跟随底图',
        onclick: function () { self.fitAspectToImage(); }
      }));
    }
    box.appendChild(fieldBox('画布比例', chips));
    box.appendChild(this.slider('高宽比', t.aspect, LM.ASPECT_RANGE[0], LM.ASPECT_RANGE[1], 0.01, ratio, function (v) {
      self.edit('aspect', function (x) { x.aspect = v; });
    }));

    // 导出尺寸
    var wInput = h('input', {
      type: 'number', min: 540, max: 2160, step: 10, value: Math.round(LM.exportPixelWidth(t)),
      onchange: function () {
        var v = Number(this.value);
        self.edit(null, function (x) { LM.setExportWidth(x, v); });
      }
    });
    var hInput = h('input', {
      type: 'number', min: 300, max: 4752, step: 10, value: Math.round(LM.exportPixelHeight(t)),
      onchange: function () {
        var v = Number(this.value);
        self.edit(null, function (x) { LM.setExportHeight(x, v); });
      }
    });
    box.appendChild(h('div', { class: 'field' }, [
      h('span', { class: 'lab', text: '导出尺寸（px）' }),
      h('div', { class: 'row' }, [wInput, h('span', { text: '×' }), hInput])
    ]));
    box.appendChild(this.toggle('锁定比例', LM.isAspectLocked(t), function (on) {
      self.edit(null, function (x) { x.aspectLocked = on ? undefined : false; });
    }));

    box.appendChild(this.accentPicker('跟随主题色', t.backgroundAccent, function (v) {
      self.edit(null, function (x) { x.backgroundAccent = v || undefined; });
    }));
    if (!t.backgroundAccent) {
      box.appendChild(this.colorControl('底色', t.background, function (c) {
        self.edit('bg', function (x) { x.background = c; });
      }));
    }

    box.appendChild(h('div', { class: 'divider' }));
    var actions = h('div', { class: 'actions' }, [
      h('button', { class: 'btn small', text: t.imageData ? '更换底图' : '选择底图', onclick: function () { self.pickBaseImage(); } })
    ]);
    if (t.imageData) actions.appendChild(h('button', {
      class: 'btn small danger', text: '移除底图',
      onclick: function () { self.edit(null, function (x) { x.imageData = undefined; }); }
    }));
    box.appendChild(fieldBox('底图', actions));
    if (t.imageData) {
      box.appendChild(this.slider('缩放', t.imageScale, 0.5, 3, 0.01, pct, function (v) { self.edit('is', function (x) { x.imageScale = v; }); }));
      box.appendChild(this.slider('横向位置', t.imageOffsetX, -1, 1, 0.005, signedPct, function (v) { self.edit('ix', function (x) { x.imageOffsetX = v; }); }));
      box.appendChild(this.slider('纵向位置', t.imageOffsetY, -1, 1, 0.005, signedPct, function (v) { self.edit('iy', function (x) { x.imageOffsetY = v; }); }));
      box.appendChild(this.slider('不透明度', t.imageOpacity, 0, 1, 0.01, pct, function (v) { self.edit('io', function (x) { x.imageOpacity = v; }); }));
    }

    box.appendChild(h('div', { class: 'divider' }));
    box.appendChild(this.toggle('封面图层', t.cover.visible, function (on) {
      self.edit(null, function (x) { x.cover.visible = on; });
    }));

    box.appendChild(h('div', { class: 'divider' }));
    var starters = h('div', { class: 'chips' });
    LM.STARTERS.forEach(function (s) {
      starters.appendChild(h('button', {
        class: 'chip', text: s.id, title: s.subtitle,
        onclick: function () { self.applyStarter(s.id); }
      }));
    });
    box.appendChild(fieldBox('起始排版', starters));
    if (this.starterUndoShown()) {
      var undo = this.starterUndo;
      box.appendChild(h('div', { class: 'actions' }, [
        h('span', { class: 'hint', text: '已套用「' + undo.name + '」' }),
        h('button', { class: 'btn small', text: '撤销', onclick: function () { self.undoStarter(); } })
      ]));
    }
  };

  App.prototype.starterUndoShown = function () {
    var u = this.starterUndo;
    if (!u) return false;
    var t = this.template;
    return JSON.stringify(t.cover) === u.cover && JSON.stringify(t.elements) === u.elements &&
      JSON.stringify(t.background) === u.background && t.aspect === u.aspect;
  };
  App.prototype.applyStarter = function (kind) {
    var fresh = LM.starter(kind);
    var before = JSON.parse(this.snapshot());
    this.pushUndo(null);
    var t = this.template;
    t.cover = fresh.cover;
    t.elements = fresh.elements;
    if (!t.imageData) { t.background = fresh.background; t.aspect = fresh.aspect; }
    this.selection = 'canvas';
    this.starterUndo = {
      name: kind, before: before,
      cover: JSON.stringify(t.cover), elements: JSON.stringify(t.elements),
      background: JSON.stringify(t.background), aspect: t.aspect
    };
    this.refresh();
  };
  App.prototype.undoStarter = function () {
    var u = this.starterUndo;
    if (!u) return;
    var t = this.template;
    t.cover = u.before.cover; t.elements = u.before.elements;
    t.background = u.before.background; t.aspect = u.before.aspect;
    this.starterUndo = null;
    this.selection = 'canvas';
    this.refresh();
  };
  App.prototype.fitAspectToImage = function () {
    var self = this;
    var img = this.images.get('base:' + this.template.id, this.template.imageData);
    if (!img) { this.toast('底图还在读取'); return; }
    this.edit(null, function (x) {
      x.aspect = LM.clamp(img.naturalHeight / img.naturalWidth, LM.ASPECT_RANGE, x.aspect);
    });
  };

  App.prototype.coverInspector = function (box) {
    var self = this, c = this.template.cover;
    box.appendChild(this.toggle('封面图层', c.visible, function (on) {
      self.edit(null, function (x) { x.cover.visible = on; });
    }));
    function s(title, key, min, max, step, format, tag) {
      box.appendChild(self.slider(title, c[key], min, max, step, format, function (v) {
        self.edit(tag, function (x) { x.cover[key] = v; });
      }));
    }
    s('横向位置', 'x', -0.5, 1.5, 0.005, pct, 'cx');
    s('纵向位置', 'y', -0.5, 1.5, 0.005, pct, 'cy');
    s('宽度', 'width', 0.05, 2, 0.005, pct, 'cw');
    s('高度', 'height', 0.05, 2, 0.005, pct, 'ch');
    s('圆角', 'cornerRadius', 0, 200, 1, pt, 'cr');
    s('旋转', 'rotation', -180, 180, 0.5, deg, 'crot');
    s('白边', 'border', 0, 40, 1, pt, 'cb');
    s('不透明度', 'opacity', 0.05, 1, 0.01, pct, 'co');
    box.appendChild(this.toggle('投影', c.shadow, function (on) {
      self.edit(null, function (x) { x.cover.shadow = on; });
    }));

    var split = LM.coverSplit(this.template), count = this.template.elements.length;
    box.appendChild(h('div', { class: 'actions' }, [
      h('button', {
        class: 'btn small', text: '上移一层', disabled: split >= count,
        onclick: function () { self.edit(null, function (x) { x.cover.layer = Math.min(x.elements.length, LM.coverSplit(x) + 1); }); }
      }),
      h('button', {
        class: 'btn small', text: '下移一层', disabled: split === 0,
        onclick: function () { self.edit(null, function (x) { x.cover.layer = Math.max(0, LM.coverSplit(x) - 1); }); }
      })
    ]));

    box.appendChild(h('div', { class: 'divider' }));
    box.appendChild(h('span', { class: 'lab', text: '框内位置' }));
    function p(title, key, min, max, step, format, tag) {
      box.appendChild(self.slider(title, c.content[key], min, max, step, format, function (v) {
        self.edit(tag, function (x) { x.cover.content[key] = v; });
      }));
    }
    p('缩放', 'scale', 0.5, 3, 0.01, pct, 'ps');
    p('横向偏移', 'offsetX', -1, 1, 0.005, signedPct, 'px');
    p('纵向偏移', 'offsetY', -1, 1, 0.005, signedPct, 'py');
    p('倾斜', 'rotation', -45, 45, 0.5, deg, 'pr');
    box.appendChild(h('div', { class: 'actions' }, [
      h('button', {
        class: 'btn small', text: '铺满画布',
        onclick: function () {
          self.edit(null, function (x) {
            x.cover.x = 0.5; x.cover.y = 0.5; x.cover.width = 1; x.cover.height = 1;
            x.cover.cornerRadius = 0; x.cover.rotation = 0;
          });
        }
      }),
      h('button', {
        class: 'btn small', text: '重置',
        onclick: function () { self.edit(null, function (x) { x.cover.content = LM.defaultPlacement(); }); }
      })
    ]));
  };

  App.prototype.elementActions = function (box, el) {
    var self = this;
    var index = this.template.elements.indexOf(el);
    box.appendChild(h('div', { class: 'divider' }));
    box.appendChild(h('div', { class: 'actions' }, [
      h('button', { class: 'btn small', text: '复制', disabled: this.template.elements.length >= LM.MAX_ELEMENTS, onclick: function () { self.duplicate(el.id); } }),
      h('button', {
        class: 'btn small', text: '上移', disabled: index >= this.template.elements.length - 1,
        onclick: function () { self.reorder(el.id, 1); }
      }),
      h('button', {
        class: 'btn small', text: '下移', disabled: index <= 0,
        onclick: function () { self.reorder(el.id, -1); }
      }),
      h('button', { class: 'btn small danger', text: '删除', onclick: function () { self.remove(el.id); } })
    ]));
  };

  App.prototype.textInspector = function (box, el) {
    var self = this;
    function change(tag, fn) { self.edit(tag, function () { fn(el); }); }

    box.appendChild(this.groupedFieldSelect('内容', el.field, function (v) { change(null, function (e) { e.field = v; }); }));
    if (LM.fieldInfo(el.field).priv) box.appendChild(h('div', { class: 'hint', text: '🔒 私人信息 · 由分享开关控制' }));
    if (el.field === '自定义文字') {
      box.appendChild(fieldBox('自定义文字', h('textarea', {
        value: el.text, oninput: function () { var v = this.value; change('text', function (e) { e.text = LM.prefix(v, 300); }); }
      })));
    }
    box.appendChild(fieldBox('小标题（如 DATE）', h('input', {
      type: 'text', value: el.label,
      oninput: function () { var v = this.value; change('label', function (e) { e.label = LM.prefix(v, 40); }); },
      onchange: function () { self.buildInspector(); }
    })));
    if (el.label) {
      box.appendChild(this.toggle('小标题同一行', el.inlineLabel === true, function (on) {
        change(null, function (e) { e.inlineLabel = on ? true : undefined; });
      }));
    }
    box.appendChild(this.slider('字号', el.fontSize, 6, 120, 0.5, one, function (v) { change('fs', function (e) { e.fontSize = v; }); }));
    box.appendChild(this.select('字重', LM.WEIGHTS, el.weight, function (v) { change(null, function (e) { e.weight = v; }); }));
    box.appendChild(this.select('字体', LM.DESIGNS, el.design, function (v) { change(null, function (e) { e.design = v; }); }));
    box.appendChild(this.segmented('对齐', LM.ALIGNMENTS, el.alignment, function (v) { change(null, function (e) { e.alignment = v; }); }));
    box.appendChild(this.accentPicker('跟随主题色', el.accent, function (v) { change(null, function (e) { e.accent = v || undefined; }); }));
    if (!el.accent) {
      box.appendChild(this.colorControl('文字颜色', el.color, function (c) { change('col', function (e) { e.color = c; }); },
        [LM.contrasting(this.template.background)]));
    }
    box.appendChild(this.slider('宽度', el.width, 0.1, 1.5, 0.005, pct, function (v) { change('w', function (e) { e.width = v; }); }));
    box.appendChild(this.slider('字距', el.tracking, -2, 12, 0.1, one, function (v) { change('tr', function (e) { e.tracking = v; }); }));
    box.appendChild(this.slider('旋转', el.rotation, -180, 180, 0.5, deg, function (v) { change('rot', function (e) { e.rotation = v; }); }));
    box.appendChild(this.slider('不透明度', el.opacity, 0.05, 1, 0.01, pct, function (v) { change('op', function (e) { e.opacity = v; }); }));
    box.appendChild(this.slider('行数', el.lineLimit, 1, 20, 1, pt, function (v) { change('ll', function (e) { e.lineLimit = Math.round(v); }); }));
    box.appendChild(this.toggle('英文大写', el.uppercase, function (on) { change(null, function (e) { e.uppercase = on; }); }));
    box.appendChild(this.toggle('底色标签', !!(el.chip || el.chipAccent), function (on) {
      change(null, function (e) {
        e.chip = on ? LM.contrasting(e.color) : undefined;
        if (!on) e.chipAccent = undefined;
      });
    }));
    if (el.chip || el.chipAccent) {
      box.appendChild(this.accentPicker('标签跟随主题色', el.chipAccent, function (v) {
        change(null, function (e) {
          e.chipAccent = v || undefined;
          if (v) e.chip = undefined; else if (!e.chip) e.chip = LM.contrasting(e.color);
        });
      }));
      if (!el.chipAccent) {
        box.appendChild(this.colorControl('标签底色', el.chip || LM.INK, function (c) { change('chip', function (e) { e.chip = c; }); }));
      }
    }
    this.elementActions(box, el);
  };

  App.prototype.imageInspector = function (box, el) {
    var self = this;
    function change(tag, fn) { self.edit(tag, function () { fn(el); }); }
    var sticker = el.isSticker === true;
    box.appendChild(h('div', { class: 'actions' }, [
      h('button', {
        class: 'btn small', text: sticker ? '换贴纸' : '换图片',
        onclick: function () { if (sticker) self.openStickerPicker(el.id); else self.pickElementImage(el.id); }
      })
    ]));
    if (LM.isLivePhoto(el)) box.appendChild(h('div', { class: 'hint', text: '实况照片 · 鼠标悬停播放' }));
    box.appendChild(this.slider('横向位置', el.x, -0.5, 1.5, 0.005, pct, function (v) { change('ex', function (e) { e.x = v; }); }));
    box.appendChild(this.slider('纵向位置', el.y, -0.5, 1.5, 0.005, pct, function (v) { change('ey', function (e) { e.y = v; }); }));
    box.appendChild(this.slider('宽度', el.width, 0.1, 1.5, 0.005, pct, function (v) { change('ew', function (e) { e.width = v; }); }));

    var framed = typeof el.imageFrameAspect === 'number';
    box.appendChild(this.slider('框高', framed ? el.imageFrameAspect : (el.imageAspect || 1), 0.1, 3, 0.01, ratio, function (v) {
      change('efa', function (e) {
        e.imageFrameAspect = v;
        if (!e.imagePlacement) e.imagePlacement = LM.defaultPlacement();
      });
    }));
    if (framed) {
      var p = el.imagePlacement || LM.defaultPlacement();
      box.appendChild(h('span', { class: 'lab', text: '框内位置' }));
      box.appendChild(this.slider('缩放', p.scale, 0.5, 3, 0.01, pct, function (v) { change('ips', function (e) { e.imagePlacement.scale = v; }); }));
      box.appendChild(this.slider('横向偏移', p.offsetX, -1, 1, 0.005, signedPct, function (v) { change('ipx', function (e) { e.imagePlacement.offsetX = v; }); }));
      box.appendChild(this.slider('纵向偏移', p.offsetY, -1, 1, 0.005, signedPct, function (v) { change('ipy', function (e) { e.imagePlacement.offsetY = v; }); }));
      box.appendChild(this.slider('倾斜', p.rotation, -45, 45, 0.5, deg, function (v) { change('ipr', function (e) { e.imagePlacement.rotation = v; }); }));
      box.appendChild(h('div', { class: 'actions' }, [
        h('button', {
          class: 'btn small', text: '按图片',
          onclick: function () { change(null, function (e) { e.imageFrameAspect = undefined; e.imagePlacement = undefined; }); }
        })
      ]));
    }
    box.appendChild(this.slider('旋转', el.rotation, -180, 180, 0.5, deg, function (v) { change('erot', function (e) { e.rotation = v; }); }));
    box.appendChild(this.slider('不透明度', el.opacity, 0.05, 1, 0.01, pct, function (v) { change('eop', function (e) { e.opacity = v; }); }));
    this.elementActions(box, el);
  };

  App.prototype.shapeInspector = function (box, el) {
    var self = this;
    function change(tag, fn) { self.edit(tag, function () { fn(el); }); }
    var shape = el.shape;
    box.appendChild(this.select('形状', LM.SHAPES, shape, function (v) { change(null, function (e) { e.shape = v; }); }));
    box.appendChild(this.accentPicker('跟随主题色', el.accent, function (v) { change(null, function (e) { e.accent = v || undefined; }); }));
    if (!el.accent) {
      box.appendChild(this.colorControl('颜色', el.color, function (c) { change('scol', function (e) { e.color = c; }); },
        [LM.contrasting(this.template.background)]));
    }
    box.appendChild(this.slider('横向位置', el.x, -0.5, 1.5, 0.005, pct, function (v) { change('sx', function (e) { e.x = v; }); }));
    box.appendChild(this.slider('纵向位置', el.y, -0.5, 1.5, 0.005, pct, function (v) { change('sy', function (e) { e.y = v; }); }));
    box.appendChild(this.slider('宽度', el.width, 0.02, 1.5, 0.005, pct, function (v) { change('sw', function (e) { e.width = v; }); }));
    box.appendChild(this.slider('高度', el.shapeHeight === undefined ? 0.1 : el.shapeHeight, 0.002, 3, 0.002, pct, function (v) { change('sh', function (e) { e.shapeHeight = v; }); }));
    if (['矩形', '胶片孔'].indexOf(shape) >= 0) {
      box.appendChild(this.slider('圆角', el.cornerRadius || 0, 0, 200, 1, pt, function (v) { change('scr', function (e) { e.cornerRadius = v; }); }));
    }
    if (['矩形', '圆形', '直线', '唱片纹', '点阵'].indexOf(shape) >= 0) {
      box.appendChild(this.slider('线宽', el.strokeWidth || 0, 0, 40, 0.5, one, function (v) { change('ss', function (e) { e.strokeWidth = v; }); }));
    }
    var lengthTitle = shape === '胶片孔' ? '孔宽' : (shape === '锯齿边' ? '齿距' : '虚线段长');
    var gapTitle = ['唱片纹', '点阵'].indexOf(shape) >= 0 ? '间距' : '虚线间隔';
    if (['矩形', '圆形', '直线', '胶片孔', '锯齿边'].indexOf(shape) >= 0) {
      box.appendChild(this.slider(lengthTitle, el.dashLength || 0, 0, 80, 0.5, one, function (v) { change('sdl', function (e) { e.dashLength = v; }); }));
    }
    if (['矩形', '圆形', '直线', '胶片孔', '唱片纹', '点阵'].indexOf(shape) >= 0) {
      box.appendChild(this.slider(gapTitle, el.dashGap || 0, 0, 80, 0.5, one, function (v) { change('sdg', function (e) { e.dashGap = v; }); }));
    }
    box.appendChild(this.slider('旋转', el.rotation, -180, 180, 0.5, deg, function (v) { change('srot', function (e) { e.rotation = v; }); }));
    box.appendChild(this.slider('不透明度', el.opacity, 0.05, 1, 0.01, pct, function (v) { change('sop', function (e) { e.opacity = v; }); }));
    this.elementActions(box, el);
  };

  // MARK: - 增删改层

  App.prototype.addField = function (field) {
    var self = this;
    if (this.template.elements.length >= LM.MAX_ELEMENTS) return;
    var t = this.template;
    var ink = t.imageData ? LM.clone(LM.WHITE) : LM.contrasting(t.background);
    var el = LM.makeElement(field, { x: 0.5, y: 0.5 + (t.elements.length % 5) * 0.05, color: ink });
    if (field === '自定义文字' || field === '名称') el.alignment = '居中';
    this.edit(null, function (x) { x.elements.push(el); });
    this.selection = el.id;
    this.refresh();
  };
  App.prototype.addShape = function (shape) {
    var t = this.template;
    if (t.elements.length >= LM.MAX_ELEMENTS) return;
    var ink = t.imageData ? LM.clone(LM.WHITE) : LM.contrasting(t.background);
    var sizes;
    switch (shape) {
      case '直线': sizes = [0.8, 0.004, 1]; break;
      case '唱片纹': sizes = [0.5, 0.5, 1]; break;
      case '点阵': sizes = [1, t.aspect, 1.5]; break;
      case '胶片孔': sizes = [0.9, 0.022, null]; break;
      case '渐变': sizes = [1, 0.6, null]; break;
      default: sizes = [0.4, 0.25, null];
    }
    var dash = shape === '唱片纹' ? [0, 8] : (shape === '点阵' ? [0, 18] : (shape === '胶片孔' ? [18, 10] : null));
    var el = LM.makeShape(shape, {
      x: 0.5, y: 0.5, width: sizes[0], height: sizes[1], color: ink,
      stroke: sizes[2], dash: dash
    });
    if (shape === '点阵' || shape === '唱片纹') el.opacity = 0.15;
    el = LM.sanitizeElement(el);
    this.edit(null, function (x) { x.elements.push(el); });
    this.selection = el.id;
    this.refresh();
  };
  App.prototype.addImageElement = function (base64, aspect, sticker, videoBase64) {
    if (this.template.elements.length >= LM.MAX_ELEMENTS) return;
    var el = LM.defaultElement();
    el.field = '自定义文字';
    el.x = 0.5; el.y = 0.5; el.width = sticker ? 0.3 : 0.55;
    el.imageData = base64;
    el.imageAspect = LM.clamp(aspect, [0.02, 50], 1);
    if (sticker) el.isSticker = true;
    if (videoBase64) el.videoData = videoBase64;
    el = LM.sanitizeElement(el);
    this.edit(null, function (x) { x.elements.push(el); });
    this.selection = el.id;
    this.refresh();
  };
  App.prototype.duplicate = function (id) {
    var self = this;
    if (this.template.elements.length >= LM.MAX_ELEMENTS) return;
    var source = null;
    this.template.elements.forEach(function (e) { if (e.id === id) source = e; });
    if (!source) return;
    var copy = LM.clone(source);
    copy.id = LM.uuid();
    copy.y = Math.min(1.5, copy.y + 0.06);
    this.edit(null, function (x) { x.elements.push(copy); });
    this.selection = copy.id;
    this.refresh();
  };
  App.prototype.reorder = function (id, delta) {
    var list = this.template.elements;
    var i = -1;
    list.forEach(function (e, index) { if (e.id === id) i = index; });
    var target = i + delta;
    if (i < 0 || target < 0 || target >= list.length) return;
    this.edit(null, function (x) {
      var tmp = x.elements[i]; x.elements[i] = x.elements[target]; x.elements[target] = tmp;
    });
  };
  App.prototype.remove = function (id) {
    this.edit(null, function (x) { x.elements = x.elements.filter(function (e) { return e.id !== id; }); });
    this.selection = 'canvas';
    this.refresh();
  };

  // MARK: - 画布交互

  App.prototype.hitTest = function (point) {
    var t = this.template, self = this;
    var split = LM.coverSplit(t);
    function hit(list) {
      for (var i = list.length - 1; i >= 0; i--) {
        var frame = self.frames[list[i].id];
        if (frame && point.x >= frame.x - 8 && point.x <= frame.x + frame.w + 8 &&
          point.y >= frame.y - 8 && point.y <= frame.y + frame.h + 8) return list[i].id;
      }
      return null;
    }
    var above = hit(t.elements.slice(split));
    if (above) return above;
    var cover = this.frames.cover;
    if (t.cover.visible && cover && point.x >= cover.x && point.x <= cover.x + cover.w &&
      point.y >= cover.y && point.y <= cover.y + cover.h) return 'cover';
    var below = hit(t.elements.slice(0, split));
    if (below) return below;
    return 'canvas';
  };
  App.prototype.originOf = function (layer) {
    var t = this.template;
    if (layer === 'canvas') return t.imageData ? { x: t.imageOffsetX, y: t.imageOffsetY } : null;
    if (layer === 'cover') return { x: t.cover.x, y: t.cover.y };
    var el = this.selectedElement();
    return el ? { x: el.x, y: el.y } : null;
  };
  App.prototype.moveLayer = function (layer, point) {
    var t = this.template;
    if (layer === 'canvas') {
      t.imageOffsetX = LM.clamp(point.x, LM.OFFSET_RANGE, 0);
      t.imageOffsetY = LM.clamp(point.y, LM.OFFSET_RANGE, 0);
    } else if (layer === 'cover') {
      t.cover.x = LM.clamp(point.x, [-0.5, 1.5], 0.5);
      t.cover.y = LM.clamp(point.y, [-0.5, 1.5], 0.5);
    } else {
      var el = this.selectedElement();
      if (!el) return;
      el.x = LM.clamp(point.x, [-0.5, 1.5], 0.5);
      el.y = LM.clamp(point.y, [-0.5, 1.5], 0.5);
    }
  };
  App.prototype.sizesOf = function (layer) {
    var t = this.template;
    if (layer === 'canvas') return [t.imageScale, 0];
    if (layer === 'cover') return [t.cover.width, t.cover.height];
    var el = this.selectedElement();
    if (!el) return [22, 0];
    if (LM.isShape(el)) return [el.width, el.shapeHeight === undefined ? 0.1 : el.shapeHeight];
    return [LM.hasImage(el) ? el.width : el.fontSize, 0];
  };
  App.prototype.resizeLayer = function (layer, size) {
    var t = this.template;
    if (layer === 'canvas') { if (t.imageData) t.imageScale = LM.clamp(size[0], LM.SCALE_RANGE, 1); return; }
    if (layer === 'cover') {
      t.cover.width = LM.clamp(size[0], [0.05, 2], 0.78);
      t.cover.height = LM.clamp(size[1], [0.05, 2], 0.5);
      return;
    }
    var el = this.selectedElement();
    if (!el) return;
    if (LM.isShape(el)) {
      el.width = LM.clamp(size[0], [0.02, 1.5], 0.55);
      el.shapeHeight = LM.clamp(size[1], [0.002, 3], 0.1);
    } else if (LM.hasImage(el)) {
      el.width = LM.clamp(size[0], [0.1, 1.5], 0.55);
    } else {
      el.fontSize = LM.clamp(size[0], [6, 120], 22);
    }
  };

  App.prototype.bindCanvas = function () {
    var self = this;
    var overlay = document.getElementById('overlay');
    var canvas = document.getElementById('canvas');
    var drag = null;

    function toCanvas(event) {
      var rect = canvas.getBoundingClientRect();
      return { x: (event.clientX - rect.left) / self.viewScale, y: (event.clientY - rect.top) / self.viewScale };
    }
    canvas.addEventListener('pointerdown', function (event) {
      var point = toCanvas(event);
      var frame = self.selectionFrame();
      var handleIndex = -1;
      if (frame) {
        self.handles(frame).forEach(function (p, i) {
          if (Math.abs(p.x - point.x) < 9 / self.viewScale && Math.abs(p.y - point.y) < 9 / self.viewScale) handleIndex = i;
        });
      }
      if (handleIndex >= 0) {
        var cx = frame.x + frame.w / 2, cy = frame.y + frame.h / 2;
        drag = {
          mode: 'resize', base: self.sizesOf(self.selection),
          distance: Math.max(2, Math.hypot(point.x - cx, point.y - cy)), cx: cx, cy: cy
        };
        self.pushUndo(null);
      } else {
        var layer = self.hitTest(point);
        if (layer !== self.selection) { self.selection = layer; self.refresh(); }
        var origin = self.originOf(layer);
        if (!origin) { drag = null; canvas.setPointerCapture(event.pointerId); return; }
        drag = { mode: 'move', origin: origin, start: point };
        self.pushUndo(null);
      }
      canvas.setPointerCapture(event.pointerId);
      event.preventDefault();
    });
    canvas.addEventListener('pointermove', function (event) {
      var point = toCanvas(event);
      if (!drag) {
        var over = self.hitTest(point);
        var el = null;
        self.template.elements.forEach(function (e) { if (e.id === over) el = e; });
        var live = el && LM.isLivePhoto(el) ? el : null;
        if (live && self.hoverElement !== live.id) {
          self.hoverElement = live.id;
          var video = self.ensureVideo(live);
          video.currentTime = 0;
          var promise = video.play();
          if (promise && promise.catch) promise.catch(function () {});
        } else if (!live && self.hoverElement) {
          var old = self.videos[self.hoverElement];
          if (old) old.pause();
          self.hoverElement = null;
          self.render();
        }
        return;
      }
      if (drag.mode === 'move') {
        var H = LM.canvasHeight(self.template);
        self.moveLayer(self.selection, {
          x: drag.origin.x + (point.x - drag.start.x) / LM.CANVAS_W,
          y: drag.origin.y + (point.y - drag.start.y) / H
        });
      } else {
        var factor = Math.hypot(point.x - drag.cx, point.y - drag.cy) / drag.distance;
        self.resizeLayer(self.selection, [drag.base[0] * factor, drag.base[1] * factor]);
      }
      self.render();
      event.preventDefault();
    });
    function endDrag() { if (drag) { drag = null; self.buildInspector(); } }
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);
    canvas.addEventListener('wheel', function (event) {
      event.preventDefault();
      var base = self.sizesOf(self.selection);
      var factor = 1 - event.deltaY * 0.0025;
      self.pushUndo('wheel');
      self.resizeLayer(self.selection, [base[0] * factor, base[1] * factor]);
      self.render();
      clearTimeout(self._wheelTimer);
      self._wheelTimer = setTimeout(function () { self.buildInspector(); }, 250);
    }, { passive: false });
  };

  // MARK: - 键盘

  App.prototype.bindKeys = function () {
    var self = this;
    document.addEventListener('keydown', function (event) {
      var tag = (event.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      var meta = event.metaKey || event.ctrlKey;
      if (meta && event.key.toLowerCase() === 'z') { event.preventDefault(); self.undo(); return; }
      if (meta && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        if (self.selectedElement()) self.duplicate(self.selection);
        return;
      }
      if (event.key === 'Backspace' || event.key === 'Delete') {
        if (self.selectedElement()) { event.preventDefault(); self.remove(self.selection); }
        return;
      }
      var step = event.shiftKey ? 0.02 : 0.004;
      var dx = 0, dy = 0;
      if (event.key === 'ArrowLeft') dx = -step;
      else if (event.key === 'ArrowRight') dx = step;
      else if (event.key === 'ArrowUp') dy = -step;
      else if (event.key === 'ArrowDown') dy = step;
      else if (event.key === 'Escape') { self.selection = 'canvas'; self.refresh(); return; }
      else return;
      event.preventDefault();
      var origin = self.originOf(self.selection);
      if (!origin) return;
      self.pushUndo('nudge');
      self.moveLayer(self.selection, { x: origin.x + dx, y: origin.y + dy });
      self.render();
      clearTimeout(self._nudgeTimer);
      self._nudgeTimer = setTimeout(function () { self.buildInspector(); }, 250);
    });
  };

  global.LMApp = App;
  global.LMUI = { h: h, pct: pct, deg: deg, one: one, mimeFor: mimeFor };
})(window);
