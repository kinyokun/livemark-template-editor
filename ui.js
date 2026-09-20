// 界面：模版库、画布交互、按节点类型分的检查器。
//
// 结构照 App 的 `TemplateEditor.tsx` / `Inspectors.tsx`（Documentation/POSTER.md 第 7 节）：
// 选中的是树上的一个节点，检查器第一行是工具条，接着三到五样常用的，其余折进「更多」，
// 末尾是所有节点共用的「布局」块。树的增删改一律走 core.js 里 App 自己的那几个函数
// （insertAfter / moveNode / wrapNode / unwrapNode …），所以两边的行为不会走样。
(function (global) {
  'use strict';

  var LM = global.LMCore, R = global.LMRender, S = global.LMSample;
  var STORE_KEY = 'livemark.templates.v2';
  var CANVAS = 'canvas';

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
  function deg(v) { return Math.round(v) + '°'; }
  function pt(v) { return Math.round(v) + ' pt'; }
  function ratio(v) { return v.toFixed(2); }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }

  function mimeFor(base64) {
    var head = base64.slice(0, 16);
    if (head.indexOf('iVBOR') === 0) return 'image/png';
    if (head.indexOf('/9j/') === 0) return 'image/jpeg';
    if (head.indexOf('R0lGOD') === 0) return 'image/gif';
    if (head.indexOf('UklGR') === 0) return 'image/webp';
    return 'image/heic';
  }

  function dataURL(source) {
    if (!source) return null;
    if (source.uri) return source.uri;
    if (source.data) {
      return source.data.indexOf('data:') === 0
        ? source.data
        : 'data:' + mimeFor(source.data) + ';base64,' + source.data;
    }
    return null;
  }

  // MARK: - 图片缓存
  //
  // 键就是 `SceneImageSource.key`，和 App 的 PaintContext 一样。

  function ImageStore(onLoad) {
    this.map = new Map();
    this.pending = {};
    this.onLoad = onLoad;
  }
  ImageStore.prototype.sync = function (sources) {
    var self = this;
    sources.forEach(function (source) {
      if (self.map.has(source.key) || self.pending[source.key]) return;
      var url = dataURL(source);
      if (!url) return;
      self.pending[source.key] = true;
      var img = new Image();
      img.onload = function () {
        delete self.pending[source.key];
        self.map.set(source.key, img);
        self.onLoad();
      };
      img.onerror = function () {
        delete self.pending[source.key];
        self.map.set(source.key, null);
      };
      img.src = url;
    });
  };
  /// 实况照片的那一段视频：鼠标停上去静音播放。
  ImageStore.prototype.putVideo = function (key, video) { this.map.set(key, video); };

  // MARK: - 应用

  function App() {
    this.template = LM.builtInTemplate('经典票根');
    this.selection = CANVAS;
    this.preview = S.defaultPreview();
    this.zoom = 1;
    this.history = [];
    this.more = false;              // 检查器的「更多」是否展开
    this.focusMode = 'all';         // 图层聚焦：all（全部）/ dim（突出）/ solo（单独）
    this.layoutMode = false;        // 布局模式：只显示框线，自由拖拽换容器
    this.sideTab = 'library';       // 左栏页签：library（模版）/ layers（图层）
    this.library = this.loadLibrary();
    this.frames = {};
    this.scene = null;
    var self = this;
    this.images = new ImageStore(function () { self.draw(); });
    this.canvas = document.getElementById('canvas');
    this.overlay = document.getElementById('overlay');
    this.bindCanvas();
    this.bindKeys();
  }

  // MARK: 模版库（localStorage）

  App.prototype.loadLibrary = function () {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  };
  App.prototype.saveLibrary = function () {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(this.library));
    } catch (e) {
      this.toast('存不下了：浏览器的本地存储满了，导出成文件吧');
    }
  };
  App.prototype.storeTemplate = function () {
    var copy = clone(this.template);
    copy.updatedAt = LM.isoString();
    var index = -1;
    for (var i = 0; i < this.library.length; i++) if (this.library[i].id === copy.id) index = i;
    if (index >= 0) this.library[index] = copy; else this.library.push(copy);
    this.saveLibrary();
    this.refresh();
    this.toast('已存入模版库');
  };

  // MARK: 撤销（一条链，滑杆的连续拖动自动合并）

  App.prototype.edit = function (tag, mutate) {
    var before = clone(this.template);
    var last = this.history[this.history.length - 1];
    if (!(tag && last && last.tag === tag)) this.history.push({ tag: tag, template: before });
    if (this.history.length > 80) this.history.shift();
    var draft = clone(this.template);
    mutate(draft);
    this.template = LM.sanitizeTemplate(draft);
    if (this.selection !== CANVAS && !LM.findNode(this.template.root, this.selection)) {
      this.selection = CANVAS;
    }
    this.refresh();
  };
  App.prototype.undo = function () {
    var entry = this.history.pop();
    if (!entry) return this.toast('没有可撤销的了');
    this.template = entry.template;
    if (this.selection !== CANVAS && !LM.findNode(this.template.root, this.selection)) {
      this.selection = CANVAS;
    }
    this.refresh();
  };
  App.prototype.replaceTemplate = function (template, keepHistory) {
    if (!keepHistory) this.history = [];
    this.template = LM.sanitizeTemplate(template);
    this.selection = CANVAS;
    this.more = false;
    this.refresh();
  };

  // MARK: 选中的节点

  App.prototype.node = function () {
    if (this.selection === CANVAS) return null;
    return LM.findNode(this.template.root, this.selection);
  };
  App.prototype.isRoot = function (id) { return this.template.root.id === id; };

  App.prototype.updateSelected = function (tag, mutate) {
    var id = this.selection;
    if (id === CANVAS) return;
    this.edit(tag, function (draft) {
      draft.root = LM.updateNode(draft.root, id, function (node) {
        var copy = clone(node);
        mutate(copy);
        return copy;
      });
    });
  };
  App.prototype.updateCanvas = function (tag, mutate) {
    this.edit(tag, function (draft) { mutate(draft.canvas); });
  };

  // MARK: - 渲染

  App.prototype.buildScene = function () {
    var context = S.context(this.preview);
    this.context = context;
    this.scene = LM.buildScene(this.template, context, { placeholders: true });
    this.images.sync(LM.sceneImageSources(this.scene));
    return this.scene;
  };

  App.prototype.draw = function () {
    var scene = this.scene || this.buildScene();
    var dpr = window.devicePixelRatio || 1;
    var view = this.zoom;
    var w = scene.width, hgt = scene.height;
    this.canvas.width = Math.round(w * view * dpr);
    this.canvas.height = Math.round(hgt * view * dpr);
    this.canvas.style.width = (w * view) + 'px';
    this.canvas.style.height = (hgt * view) + 'px';
    this.overlay.width = this.canvas.width;
    this.overlay.height = this.canvas.height;
    this.overlay.style.width = this.canvas.style.width;
    this.overlay.style.height = this.canvas.style.height;

    var ctx = this.canvas.getContext('2d');
    ctx.setTransform(dpr * view, 0, 0, dpr * view, 0, 0);
    ctx.clearRect(0, 0, w, hgt);
    this.frames = R.paintScene(ctx, scene, this.images.map, this.paintOptions ? this.paintOptions() : null);
    this.drawOverlay();

    var note = document.getElementById('sizeNote');
    if (note) {
      var pixels = LM.posterPixelSize(this.template, scene);
      note.textContent = Math.round(w) + ' × ' + Math.round(hgt) + ' pt · 导出 ' +
        pixels.width + ' × ' + pixels.height + ' px';
    }
  };

  App.prototype.drawOverlay = function () {
    var ctx = this.overlay.getContext('2d');
    var dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr * this.zoom, 0, 0, dpr * this.zoom, 0, 0);
    ctx.clearRect(0, 0, this.scene.width, this.scene.height);
    if (this.layoutMode && this.drawWireframes) this.drawWireframes(ctx);
    var frame = this.frameFor(this.selection);
    if (frame) {
      var laid = this.selection === CANVAS ? null : this.scene.layout.byID[this.selection];
      var box = laid && laid.rotation ? R.boundingBox(frame, laid.rotation) : frame;
      ctx.save();
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1 / this.zoom;
      ctx.setLineDash(this.selection === CANVAS ? [4, 3] : []);
      ctx.strokeRect(box.x + 0.5 / this.zoom, box.y + 0.5 / this.zoom,
        Math.max(0, box.width - 1 / this.zoom), Math.max(0, box.height - 1 / this.zoom));
      ctx.setLineDash([]);
      if (this.selection !== CANVAS) {
        var s = 5 / this.zoom;
        ctx.fillStyle = '#3b82f6';
        [[box.x, box.y], [box.x + box.width, box.y],
         [box.x, box.y + box.height], [box.x + box.width, box.y + box.height]].forEach(function (p) {
          ctx.fillRect(p[0] - s / 2, p[1] - s / 2, s, s);
        });
      }
      ctx.restore();
    }
    if (this.layoutMode && this.drawLayoutDrag) this.drawLayoutDrag(ctx);
  };

  /// 选中框用的框：画过的图元优先（带溢出量），没画的（比如透明容器）退回排版结果。
  App.prototype.frameFor = function (id) {
    if (this.frames[id]) return this.frames[id];
    if (id === CANVAS || !this.scene) return null;
    var laid = this.scene.layout.byID[id];
    return laid && !laid.collapsed ? laid.frame : null;
  };

  App.prototype.refresh = function () {
    this.buildScene();
    this.draw();
    this.renderLibrary();
    this.renderInspector();
    this.renderTopBar();
    if (this.renderStageTools) this.renderStageTools();
  };

  App.prototype.toast = function (message) {
    var node = document.getElementById('toast');
    node.textContent = message;
    node.classList.add('on');
    clearTimeout(this._toast);
    this._toast = setTimeout(function () { node.classList.remove('on'); }, 2200);
  };

  // MARK: - 顶栏与图层名

  App.prototype.layerTitle = function (node) {
    if (!node) return '画布与底图';
    if (LM.isStackNode(node)) {
      return (node.direction === 'row' ? '行容器' : '列容器') + ' · ' + node.children.length + ' 项';
    }
    if (LM.isTextNode(node)) {
      return node.field === '自定义文字' ? ('文字「' + (node.text || '空') + '」') : ('文字 · ' + node.field);
    }
    if (LM.isImageNode(node)) {
      if (node.isSticker) return '贴纸';
      if (node.source === 'cover') return '封面';
      return LM.nodeIsLivePhoto(node) ? '实况照片' : '图片';
    }
    if (LM.isShapeNode(node)) return '形状 · ' + node.shape;
    return '间隔';
  };

  App.prototype.renderTopBar = function () {
    var label = document.getElementById('layerName');
    if (label) label.textContent = this.layerTitle(this.node());
    var note = document.getElementById('canvasNote');
    if (note) {
      note.textContent = LM.countNodes(this.template.root) + ' / ' + LM.MAX_NODES + ' 个图层 · 缩放 ' + pct(this.zoom);
    }
  };

  /// 整棵树，缩进表示层级；容器排在自己的子节点前面。
  App.prototype.layerRows = function () {
    var rows = [];
    var self = this;
    LM.walkNodes(this.template.root, function (node, info) {
      rows.push({ node: node, depth: info.depth, title: self.layerTitle(node) });
    });
    return rows;
  };

  // MARK: - 模版库侧栏

  App.prototype.renderLibrary = function () {
    var self = this;
    var box = document.getElementById('library');
    box.textContent = '';

    if (this.renderSideTabs) this.renderSideTabs(box);
    if (this.sideTab === 'layers' && this.renderLayersPanel) {
      this.renderLayersPanel(box);
      return;
    }

    box.appendChild(h('div', { class: 'section-title', text: '内置风格' }));
    LM.SHARE_STYLES.forEach(function (style) {
      box.appendChild(h('button', {
        class: 'lib-item' + (LM.styleForTemplateID(self.template.id) === style ? ' on' : ''),
        text: style,
        onclick: function () { self.replaceTemplate(LM.builtInTemplate(style)); },
      }));
    });

    box.appendChild(h('div', { class: 'section-title', text: '起始排版' }));
    LM.STARTERS.forEach(function (starter) {
      box.appendChild(h('button', {
        class: 'lib-item', title: starter.subtitle,
        text: starter.id,
        onclick: function () { self.replaceTemplate(LM.starterTemplate(starter.id)); },
      }));
    });

    box.appendChild(h('div', { class: 'section-title', text: '我的模版' }));
    if (!this.library.length) {
      box.appendChild(h('div', { class: 'empty', text: '还没有存过。改完点顶部「存入模版库」。' }));
    }
    this.library.forEach(function (item, index) {
      var row = h('div', { class: 'lib-row' + (item.id === self.template.id ? ' on' : '') });
      row.appendChild(h('button', {
        class: 'lib-item grow', text: item.name,
        onclick: function () { self.replaceTemplate(clone(item)); },
      }));
      row.appendChild(h('button', {
        class: 'icon-btn', text: '✎', title: '改名',
        onclick: function () {
          var name = prompt('模版名', item.name);
          if (name === null) return;
          item.name = name.trim() || item.name;
          if (self.template.id === item.id) self.template.name = item.name;
          self.saveLibrary();
          self.refresh();
        },
      }));
      row.appendChild(h('button', {
        class: 'icon-btn', text: '⧉', title: '复制',
        onclick: function () {
          var copy = clone(item);
          copy.id = LM.randomUUID();
          copy.name = item.name + ' 副本';
          self.library.splice(index + 1, 0, copy);
          self.saveLibrary();
          self.refresh();
        },
      }));
      row.appendChild(h('button', {
        class: 'icon-btn', text: '␡', title: '删除',
        onclick: function () {
          if (!confirm('删掉「' + item.name + '」？')) return;
          self.library.splice(index, 1);
          self.saveLibrary();
          self.refresh();
        },
      }));
      box.appendChild(row);
    });

    box.appendChild(h('div', { class: 'divider' }));
    box.appendChild(h('div', { class: 'section-title', text: '预览' }));
    box.appendChild(this.select('示例记录', S.RECORDS.map(function (entry, i) {
      return { value: String(i), label: entry.record.title };
    }), String(this.preview.sample), function (value) {
      self.preview.sample = Number(value);
      self.refresh();
    }));
    box.appendChild(this.select('封面', [{ value: '', label: '跟着记录' }].concat(
      S.COVER_KEYS.map(function (key) { return { value: key, label: key }; })
    ), this.preview.cover === null ? '' : this.preview.cover, function (value) {
      self.preview.cover = value === '' ? null : value;
      self.refresh();
    }));
    box.appendChild(this.segmented('主题色', S.ACCENTS.map(function (a) { return a.id; }),
      this.preview.accent, function (value) { self.preview.accent = value; self.refresh(); }));
    box.appendChild(this.textInput('开场白', this.preview.headline, function (value) {
      self.preview.headline = value;
      self.refresh();
    }));
    box.appendChild(this.textInput('署名', this.preview.author, function (value) {
      self.preview.author = value;
      self.refresh();
    }));

    box.appendChild(h('div', { class: 'section-title', text: '分享开关' }));
    var checks = h('div', { class: 'checks' });
    S.TOGGLES.forEach(function (toggle) {
      checks.appendChild(h('label', { class: 'toggle' + (toggle.private ? ' private' : '') }, [
        h('input', {
          type: 'checkbox', checked: self.preview.options[toggle.key],
          onchange: function () {
            var next = {};
            next[toggle.key] = this.checked;
            self.preview.options = Object.assign({}, self.preview.options, next);
            self.refresh();
          },
        }),
        h('span', { text: toggle.label }),
      ]));
    });
    box.appendChild(checks);
    box.appendChild(h('div', { class: 'private-note', text: '票价 / 座位 / 同行人是私人字段，和 App 一样默认不印。' }));
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
      },
    });
    return h('div', { class: 'field' }, [
      h('div', { class: 'slider-head' }, [h('span', { text: title }), out]),
      input,
    ]);
  };

  App.prototype.toggle = function (title, on, onChange) {
    return h('label', { class: 'field toggle' }, [
      h('span', { text: title }),
      h('input', { type: 'checkbox', checked: on, onchange: function () { onChange(this.checked); } }),
    ]);
  };

  App.prototype.segmented = function (title, options, value, onChange) {
    var seg = h('div', { class: 'seg' });
    options.forEach(function (option) {
      var v = typeof option === 'string' ? option : option.value;
      var label = typeof option === 'string' ? option : option.label;
      seg.appendChild(h('button', {
        class: value === v ? 'on' : '', text: label,
        onclick: function () { onChange(v); },
      }));
    });
    return fieldBox(title, seg);
  };

  App.prototype.select = function (title, options, value, onChange) {
    var node = h('select', { onchange: function () { onChange(this.value); } },
      options.map(function (option) {
        var v = typeof option === 'string' ? option : option.value;
        var label = typeof option === 'string' ? option : option.label;
        return h('option', { value: v, text: label, selected: v === value });
      }));
    return fieldBox(title, node);
  };

  App.prototype.textInput = function (title, value, onChange, multiline) {
    var node = h(multiline ? 'textarea' : 'input', {
      value: value === undefined || value === null ? '' : value,
      oninput: function () { onChange(this.value); },
    });
    if (multiline) node.value = value || '';
    return fieldBox(title, node);
  };

  App.prototype.fieldSelect = function (title, value, onChange) {
    var node = h('select', { onchange: function () { onChange(this.value); } });
    LM.TEMPLATE_FIELD_GROUPS.forEach(function (group) {
      var optgroup = h('optgroup', { label: group });
      LM.TEMPLATE_FIELDS.filter(function (field) { return LM.fieldGroup(field) === group; })
        .forEach(function (field) {
          optgroup.appendChild(h('option', {
            value: field, text: field + (LM.isPrivateField(field) ? ' ·私人' : ''),
            selected: field === value,
          }));
        });
      node.appendChild(optgroup);
    });
    return fieldBox(title, node);
  };

  /// 颜色：预设色 + 取色器 + 十六进制 + 主题色开关。
  App.prototype.colorControl = function (title, value, accent, onColor, onAccent) {
    var hex = LM.colorHexString(value);
    var hexInput = h('input', { type: 'text', value: hex, spellcheck: 'false' });
    var picker = h('input', { type: 'color', value: hex.slice(0, 7) });
    function apply(next) {
      var color = LM.colorFromHexString(next);
      if (!color) return;
      hexInput.value = LM.colorHexString(color);
      picker.value = LM.colorHexString(color).slice(0, 7);
      onColor(color);
    }
    picker.addEventListener('input', function () { apply(this.value); });
    hexInput.addEventListener('change', function () { apply(this.value); });

    var presets = h('div', { class: 'presets' });
    LM.COLOR_PRESETS.forEach(function (color) {
      var css = LM.colorHexString(color);
      presets.appendChild(h('button', {
        class: 'preset', style: 'background:' + css, title: css,
        onclick: function () { apply(css); },
      }));
    });

    var rows = [h('span', { class: 'lab', text: title }), h('div', { class: 'color-row' }, [picker, hexInput]), presets];
    if (onAccent) {
      rows.push(this.segmented('', ['固定颜色', '主题色', '主题深色'], accent || '固定颜色', function (v) {
        onAccent(v === '固定颜色' ? undefined : v);
      }));
    }
    return h('div', { class: 'field' }, rows);
  };

  /// 尺寸规则：撑满 / 包住 / 固定 pt / 父宽的比例。
  App.prototype.sizeRule = function (title, rule, onChange, tag) {
    var self = this;
    var kind = rule === 'fill' ? 'fill' : rule === 'hug' || rule === undefined ? 'hug'
      : typeof rule === 'number' ? 'fixed' : 'fraction';
    var box = h('div', { class: 'field group' });
    box.appendChild(this.segmented(title, [
      { value: 'fill', label: '撑满' }, { value: 'hug', label: '包住' },
      { value: 'fixed', label: '固定' }, { value: 'fraction', label: '比例' },
    ], kind, function (next) {
      if (next === 'fill') onChange('fill');
      else if (next === 'hug') onChange('hug');
      else if (next === 'fixed') onChange(120);
      else onChange({ fraction: 0.5 });
    }));
    if (kind === 'fixed') {
      box.appendChild(this.slider('', rule, LM.SIZE_RANGE[0], 600, 1, pt, function (v) {
        onChange(v);
      }, tag + ':fixed'));
    } else if (kind === 'fraction') {
      box.appendChild(this.slider('', rule.fraction, LM.FRACTION_RANGE[0], 1.5, 0.01, pct, function (v) {
        onChange({ fraction: v });
      }, tag + ':fraction'));
    }
    return box;
  };

  App.prototype.paddingControl = function (title, value, onChange, tag) {
    var self = this;
    var padding = value || LM.ZERO_PADDING;
    var box = h('div', { class: 'field group' });
    box.appendChild(h('span', { class: 'lab', text: title }));
    var uniform = padding.top === padding.right && padding.right === padding.bottom && padding.bottom === padding.left;
    box.appendChild(this.slider('四边', uniform ? padding.top : padding.top,
      LM.PADDING_RANGE[0], 80, 1, pt, function (v) {
        onChange({ top: v, right: v, bottom: v, left: v });
      }, tag + ':all'));
    var row = h('div', { class: 'row' });
    [['上', 'top'], ['右', 'right'], ['下', 'bottom'], ['左', 'left']].forEach(function (pair) {
      row.appendChild(h('label', { class: 'mini' }, [
        h('span', { text: pair[0] }),
        h('input', {
          type: 'number', value: padding[pair[1]], min: 0, max: 200,
          oninput: function () {
            var next = Object.assign({}, padding);
            next[pair[1]] = Number(this.value) || 0;
            onChange(next);
          },
        }),
      ]));
    });
    box.appendChild(row);
    return box;
  };

  App.prototype.disclosure = function (title, build) {
    var self = this;
    var box = h('div', { class: 'disclosure' + (this.more ? ' open' : '') });
    box.appendChild(h('button', {
      class: 'disclosure-head', text: (this.more ? '▾ ' : '▸ ') + title,
      onclick: function () { self.more = !self.more; self.renderInspector(); },
    }));
    if (this.more) {
      var body = h('div', { class: 'disclosure-body' });
      build(body);
      box.appendChild(body);
    }
    return box;
  };

  // MARK: - 检查器

  App.prototype.renderInspector = function () {
    var box = document.getElementById('inspector');
    box.textContent = '';
    var node = this.node();
    if (!node) { this.canvasInspector(box); return; }
    box.appendChild(this.toolbar(node));
    if (LM.isStackNode(node)) this.stackInspector(box, node);
    else if (LM.isTextNode(node)) this.textInspector(box, node);
    else if (LM.isImageNode(node)) this.imageInspector(box, node);
    else if (LM.isShapeNode(node)) this.shapeInspector(box, node);
    else this.spacerInspector(box, node);
    box.appendChild(this.layoutBlock(node));
  };

  /// 每个节点检查器的第一行：字形 + 图层名 …… 上移 / 下移 / 复制 / 删除。
  App.prototype.toolbar = function (node) {
    var self = this;
    var root = this.isRoot(node.id);
    var bar = h('div', { class: 'insp-title' }, [
      h('span', { class: 'grow', text: this.layerTitle(node) }),
    ]);
    function button(label, title, disabled, action) {
      return h('button', { class: 'icon-btn', text: label, title: title, disabled: disabled, onclick: action });
    }
    bar.appendChild(button('↑', '上移（往后垫）', root, function () {
      self.edit(null, function (draft) { draft.root = LM.moveNode(draft.root, node.id, 'up'); });
    }));
    bar.appendChild(button('↓', '下移（往前压）', root, function () {
      self.edit(null, function (draft) { draft.root = LM.moveNode(draft.root, node.id, 'down'); });
    }));
    bar.appendChild(button('⧉', '复制', root, function () { self.duplicate(node); }));
    bar.appendChild(button('␡', '删除', root, function () {
      self.edit(null, function (draft) { draft.root = LM.removeNode(draft.root, node.id); });
      self.selection = CANVAS;
      self.refresh();
    }));
    return bar;
  };

  App.prototype.canvasInspector = function (box) {
    var self = this;
    var canvas = this.template.canvas;
    box.appendChild(h('div', { class: 'insp-title' }, [h('span', { class: 'grow', text: '画布与底图' })]));

    box.appendChild(this.textInput('模版名', this.template.name, function (value) {
      self.edit('name', function (draft) { draft.name = value; });
    }));
    box.appendChild(this.colorControl('底色', canvas.background, canvas.backgroundAccent,
      function (color) { self.updateCanvas('bg', function (c) { c.background = color; }); },
      function (accent) { self.updateCanvas(null, function (c) { c.backgroundAccent = accent; }); }));

    // 底图
    var image = canvas.image;
    var imageRow = h('div', { class: 'row' });
    imageRow.appendChild(h('button', {
      class: 'btn small', text: image ? '更换底图' : '选择底图',
      onclick: function () { global.app.pickCanvasImage(); },
    }));
    if (image) {
      imageRow.appendChild(h('button', {
        class: 'btn small', text: '移除',
        onclick: function () { self.updateCanvas(null, function (c) { delete c.image; }); },
      }));
    }
    box.appendChild(fieldBox('底图', imageRow));
    if (image) {
      box.appendChild(this.slider('横向位置', image.focusX, 0, 1, 0.01, pct, function (v) {
        self.updateCanvas('focusX', function (c) { c.image = Object.assign({}, c.image, { focusX: v }); });
      }));
      box.appendChild(this.slider('纵向位置', image.focusY, 0, 1, 0.01, pct, function (v) {
        self.updateCanvas('focusY', function (c) { c.image = Object.assign({}, c.image, { focusY: v }); });
      }));
      box.appendChild(this.slider('缩放', image.zoom, LM.ZOOM_RANGE[0], LM.ZOOM_RANGE[1], 0.01, pct, function (v) {
        self.updateCanvas('imgZoom', function (c) { c.image = Object.assign({}, c.image, { zoom: v }); });
      }));
      box.appendChild(this.slider('不透明度', image.opacity, LM.OPACITY_RANGE[0], 1, 0.01, pct, function (v) {
        self.updateCanvas('imgOpacity', function (c) { c.image = Object.assign({}, c.image, { opacity: v }); });
      }));
    }

    box.appendChild(this.paddingControl('内边距', canvas.padding, function (next) {
      self.updateCanvas('canvasPad', function (c) { c.padding = next; });
    }, 'canvasPad'));

    box.appendChild(this.disclosure('更多', function (body) {
      var fixed = typeof canvas.height === 'object';
      body.appendChild(self.segmented('高度', [
        { value: 'hug', label: '跟着内容' }, { value: 'aspect', label: '固定比例' },
      ], fixed ? 'aspect' : 'hug', function (value) {
        self.updateCanvas(null, function (c) { c.height = value === 'hug' ? 'hug' : { aspect: 1.3333333333333333 }; });
      }));
      if (fixed) {
        var chips = h('div', { class: 'chips' });
        LM.ASPECT_PRESETS.forEach(function (preset) {
          chips.appendChild(h('button', {
            class: 'chip' + (Math.abs(canvas.height.aspect - preset[1]) < 0.001 ? ' on' : ''),
            text: preset[0],
            onclick: function () { self.updateCanvas(null, function (c) { c.height = { aspect: preset[1] }; }); },
          }));
        });
        body.appendChild(fieldBox('', chips));
        body.appendChild(self.slider('比例', canvas.height.aspect,
          LM.ASPECT_RANGE[0], LM.ASPECT_RANGE[1], 0.01, ratio, function (v) {
            self.updateCanvas('aspect', function (c) { c.height = { aspect: v }; });
          }));
      }
      var widthChips = h('div', { class: 'chips' });
      var current = canvas.exportWidth || LM.DEFAULT_EXPORT_WIDTH;
      LM.EXPORT_WIDTH_PRESETS.forEach(function (width) {
        widthChips.appendChild(h('button', {
          class: 'chip' + (current === width ? ' on' : ''), text: width + ' px',
          onclick: function () { self.updateCanvas(null, function (c) { c.exportWidth = width; }); },
        }));
      });
      body.appendChild(fieldBox('导出宽度', widthChips));
      body.appendChild(h('div', { class: 'hint', text: '高度永远跟着排版走，不用设。' }));
    }));
  };

  App.prototype.stackInspector = function (box, node) {
    var self = this;
    box.appendChild(this.colorControl('底色', node.fill || LM.Palette.white, node.fillAccent,
      function (color) { self.updateSelected('fill', function (n) { n.fill = color; }); },
      function (accent) { self.updateSelected(null, function (n) { n.fillAccent = accent; }); }));
    if (node.fill) {
      box.appendChild(h('button', {
        class: 'btn small', text: '去掉底色',
        onclick: function () { self.updateSelected(null, function (n) { delete n.fill; delete n.fillAccent; }); },
      }));
    }
    box.appendChild(this.slider('间距', node.gap || 0, LM.GAP_RANGE[0], 60, 1, pt, function (v) {
      self.updateSelected('gap', function (n) { n.gap = v; });
    }));
    box.appendChild(this.paddingControl('内边距', node.padding, function (next) {
      self.updateSelected('pad', function (n) { n.padding = next; });
    }, 'pad'));
    box.appendChild(this.slider('圆角', node.cornerRadius || 0,
      LM.CORNER_RADIUS_RANGE[0], 80, 1, pt, function (v) {
        self.updateSelected('radius', function (n) { n.cornerRadius = v; });
      }));

    box.appendChild(this.disclosure('更多', function (body) {
      body.appendChild(self.segmented('方向', [
        { value: 'column', label: '列' }, { value: 'row', label: '行' },
      ], node.direction, function (value) {
        self.updateSelected(null, function (n) { n.direction = value; });
      }));
      body.appendChild(self.segmented('交叉轴对齐', [
        { value: 'start', label: '首' }, { value: 'center', label: '中' },
        { value: 'end', label: '尾' }, { value: 'stretch', label: '拉伸' },
      ], node.align || 'stretch', function (value) {
        self.updateSelected(null, function (n) { n.align = value; });
      }));
      body.appendChild(self.select('主轴分布', [
        { value: 'start', label: '靠首' }, { value: 'center', label: '居中' },
        { value: 'end', label: '靠尾' }, { value: 'spaceBetween', label: '两端对齐' },
        { value: 'spaceAround', label: '环绕均分' }, { value: 'spaceEvenly', label: '完全均分' },
      ], node.justify || 'start', function (value) {
        self.updateSelected(null, function (n) { n.justify = value; });
      }));
      var stroke = node.stroke;
      body.appendChild(self.toggle('描边', !!stroke, function (on) {
        self.updateSelected(null, function (n) {
          if (on) n.stroke = { width: 1, color: LM.Palette.ink, dashLength: 0, dashGap: 0 };
          else delete n.stroke;
        });
      }));
      if (stroke) {
        body.appendChild(self.slider('线宽', stroke.width, 0.5, LM.STROKE_RANGE[1], 0.5, function (v) {
          return v.toFixed(1) + ' pt';
        }, function (v) {
          self.updateSelected('strokeW', function (n) { n.stroke = Object.assign({}, n.stroke, { width: v }); });
        }));
        body.appendChild(self.colorControl('描边色', stroke.color, stroke.accent,
          function (color) {
            self.updateSelected('strokeC', function (n) { n.stroke = Object.assign({}, n.stroke, { color: color }); });
          },
          function (accent) {
            self.updateSelected(null, function (n) { n.stroke = Object.assign({}, n.stroke, { accent: accent }); });
          }));
        body.appendChild(self.slider('虚线段', stroke.dashLength || 0, 0, LM.DASH_RANGE[1], 1, pt, function (v) {
          self.updateSelected('dashL', function (n) { n.stroke = Object.assign({}, n.stroke, { dashLength: v }); });
        }));
        body.appendChild(self.slider('虚线间隔', stroke.dashGap || 0, 0, LM.DASH_RANGE[1], 1, pt, function (v) {
          self.updateSelected('dashG', function (n) { n.stroke = Object.assign({}, n.stroke, { dashGap: v }); });
        }));
      }
      body.appendChild(self.toggle('超出裁掉', node.clip === true, function (on) {
        self.updateSelected(null, function (n) { n.clip = on; });
      }));
      body.appendChild(self.toggle('空时收起', node.collapseWhenEmpty !== false, function (on) {
        self.updateSelected(null, function (n) { n.collapseWhenEmpty = on; });
      }));
    }));
  };

  App.prototype.textInspector = function (box, node) {
    var self = this;
    box.appendChild(this.fieldSelect('字段', node.field, function (value) {
      self.updateSelected(null, function (n) {
        n.field = value;
        n.fontSize = LM.suggestedSize(value);
        n.weight = LM.suggestedWeight(value);
        n.design = LM.suggestedDesign(value);
      });
    }));
    if (node.field === '自定义文字') {
      box.appendChild(this.textInput('内容', node.text, function (value) {
        self.updateSelected('text', function (n) { n.text = value; });
      }, true));
    }
    box.appendChild(this.slider('字号', node.fontSize,
      LM.FONT_SIZE_RANGE[0], LM.FONT_SIZE_RANGE[1], 0.5, function (v) { return v.toFixed(1) + ' pt'; },
      function (v) { self.updateSelected('size', function (n) { n.fontSize = v; }); }));
    box.appendChild(this.segmented('字重', LM.TEMPLATE_WEIGHTS, node.weight, function (value) {
      self.updateSelected(null, function (n) { n.weight = value; });
    }));
    box.appendChild(this.segmented('对齐', LM.TEMPLATE_ALIGNMENTS, node.alignment, function (value) {
      self.updateSelected(null, function (n) { n.alignment = value; });
    }));
    box.appendChild(this.colorControl('颜色', node.color, node.accent,
      function (color) { self.updateSelected('color', function (n) { n.color = color; }); },
      function (accent) { self.updateSelected(null, function (n) { n.accent = accent; }); }));

    box.appendChild(this.disclosure('更多', function (body) {
      body.appendChild(self.segmented('字体', LM.TEMPLATE_FONT_DESIGNS, node.design, function (value) {
        self.updateSelected(null, function (n) { n.design = value; });
      }));
      body.appendChild(self.textInput('小标题', node.label, function (value) {
        self.updateSelected('label', function (n) { n.label = value; });
      }));
      body.appendChild(self.toggle('小票行（标签左、值右）', node.inlineLabel === true, function (on) {
        self.updateSelected(null, function (n) { n.inlineLabel = on; });
      }));
      body.appendChild(self.slider('字距', node.tracking, LM.TRACKING_RANGE[0], LM.TRACKING_RANGE[1], 0.1,
        function (v) { return v.toFixed(1); },
        function (v) { self.updateSelected('tracking', function (n) { n.tracking = v; }); }));
      body.appendChild(self.slider('行数上限', node.lineLimit,
        LM.LINE_LIMIT_RANGE[0], LM.LINE_LIMIT_RANGE[1], 1, String,
        function (v) { self.updateSelected('lines', function (n) { n.lineLimit = v; }); }));
      body.appendChild(self.toggle('全大写', node.uppercase === true, function (on) {
        self.updateSelected(null, function (n) { n.uppercase = on; });
      }));
      body.appendChild(self.toggle('芯片底色', !!node.chip, function (on) {
        self.updateSelected(null, function (n) {
          if (on) n.chip = LM.Palette.cream; else { delete n.chip; delete n.chipAccent; }
        });
      }));
      if (node.chip) {
        body.appendChild(self.colorControl('芯片色', node.chip, node.chipAccent,
          function (color) { self.updateSelected('chip', function (n) { n.chip = color; }); },
          function (accent) { self.updateSelected(null, function (n) { n.chipAccent = accent; }); }));
      }
      body.appendChild(self.toggle('没值时收起', node.hideWhenEmpty !== false, function (on) {
        self.updateSelected(null, function (n) { n.hideWhenEmpty = on; });
      }));
    }));
  };

  App.prototype.imageInspector = function (box, node) {
    var self = this;
    var row = h('div', { class: 'row' });
    row.appendChild(h('button', {
      class: 'btn small', text: '换图',
      onclick: function () { global.app.pickImage(node.id); },
    }));
    row.appendChild(h('button', {
      class: 'btn small', text: '换贴纸',
      onclick: function () { global.app.pickSticker(node.id); },
    }));
    if (node.source !== 'cover') {
      row.appendChild(h('button', {
        class: 'btn small', text: '用记录封面',
        onclick: function () {
          self.updateSelected(null, function (n) {
            n.source = 'cover';
            delete n.video;
            delete n.imageAspect;
            n.isSticker = false;
          });
        },
      }));
    }
    box.appendChild(fieldBox('图片', row));

    var chips = h('div', { class: 'chips' });
    LM.IMAGE_ASPECT_PRESETS.forEach(function (preset) {
      var on = preset[1] === 'natural' ? node.aspect === 'natural'
        : typeof node.aspect === 'number' && Math.abs(node.aspect - preset[1]) < 0.001;
      chips.appendChild(h('button', {
        class: 'chip' + (on ? ' on' : ''), text: preset[0],
        onclick: function () { self.updateSelected(null, function (n) { n.aspect = preset[1]; }); },
      }));
    });
    box.appendChild(fieldBox('框比例', chips));
    if (typeof node.aspect === 'number') {
      box.appendChild(this.slider('', node.aspect, 0.3, 2.5, 0.01, ratio, function (v) {
        self.updateSelected('aspect', function (n) { n.aspect = v; });
      }));
    }
    box.appendChild(this.slider('缩放', node.zoom, LM.ZOOM_RANGE[0], LM.ZOOM_RANGE[1], 0.01, pct, function (v) {
      self.updateSelected('zoom', function (n) { n.zoom = v; });
    }));
    box.appendChild(this.slider('圆角', node.cornerRadius || 0,
      LM.CORNER_RADIUS_RANGE[0], 200, 1, pt, function (v) {
        self.updateSelected('radius', function (n) { n.cornerRadius = v; });
      }));
    box.appendChild(h('div', { class: 'hint', text: '在画布上拖这张图 = 调「露出哪一段」。' }));

    box.appendChild(this.disclosure('更多', function (body) {
      body.appendChild(self.segmented('填充方式', [
        { value: 'cover', label: '裁满' }, { value: 'contain', label: '完整' },
      ], node.fit || 'cover', function (value) {
        self.updateSelected(null, function (n) { n.fit = value; });
      }));
      body.appendChild(self.slider('横向位置', node.focusX, 0, 1, 0.01, pct, function (v) {
        self.updateSelected('focusX', function (n) { n.focusX = v; });
      }));
      body.appendChild(self.slider('纵向位置', node.focusY, 0, 1, 0.01, pct, function (v) {
        self.updateSelected('focusY', function (n) { n.focusY = v; });
      }));
      body.appendChild(self.slider('倾斜', node.tilt, LM.TILT_RANGE[0], LM.TILT_RANGE[1], 0.5, deg, function (v) {
        self.updateSelected('tilt', function (n) { n.tilt = v; });
      }));
      body.appendChild(self.slider('白边', node.border || 0, LM.BORDER_RANGE[0], LM.BORDER_RANGE[1], 1, pt,
        function (v) { self.updateSelected('border', function (n) { n.border = v; }); }));
      body.appendChild(self.toggle('投影', node.shadow === true, function (on) {
        self.updateSelected(null, function (n) { n.shadow = on; });
      }));
      if (LM.nodeIsLivePhoto(node)) {
        body.appendChild(h('div', { class: 'hint', text: '这一层带实况视频；鼠标停上去会静音播放。' }));
        body.appendChild(h('button', {
          class: 'btn small', text: '去掉实况',
          onclick: function () { self.updateSelected(null, function (n) { delete n.video; }); },
        }));
      } else {
        body.appendChild(h('button', {
          class: 'btn small', text: '加一段实况视频',
          onclick: function () { global.app.pickLiveVideo(node.id); },
        }));
      }
    }));
  };

  App.prototype.shapeInspector = function (box, node) {
    var self = this;
    box.appendChild(this.select('形状', LM.TEMPLATE_SHAPES, node.shape, function (value) {
      self.updateSelected(null, function (n) {
        n.shape = value;
        n.height = LM.defaultShapeHeight(value);
      });
    }));
    box.appendChild(this.colorControl('颜色', node.color, node.accent,
      function (color) { self.updateSelected('color', function (n) { n.color = color; }); },
      function (accent) { self.updateSelected(null, function (n) { n.accent = accent; }); }));
    box.appendChild(this.slider('高度', typeof node.height === 'number' ? node.height : 40,
      1, 400, 1, pt, function (v) {
        self.updateSelected('height', function (n) { n.height = v; });
      }));

    box.appendChild(this.disclosure('更多', function (body) {
      body.appendChild(self.slider('线宽', node.strokeWidth || 0,
        LM.STROKE_RANGE[0], LM.STROKE_RANGE[1], 0.5, function (v) { return v.toFixed(1) + ' pt'; },
        function (v) { self.updateSelected('stroke', function (n) { n.strokeWidth = v; }); }));
      body.appendChild(self.slider('圆角', node.cornerRadius || 0,
        LM.CORNER_RADIUS_RANGE[0], 80, 1, pt, function (v) {
          self.updateSelected('radius', function (n) { n.cornerRadius = v; });
        }));
      body.appendChild(self.slider('虚线段 / 齿长', node.dashLength || 0, 0, LM.DASH_RANGE[1], 1, pt, function (v) {
        self.updateSelected('dashL', function (n) { n.dashLength = v; });
      }));
      body.appendChild(self.slider('虚线间隔 / 疏密', node.dashGap || 0, 0, LM.DASH_RANGE[1], 1, pt, function (v) {
        self.updateSelected('dashG', function (n) { n.dashGap = v; });
      }));
      body.appendChild(h('div', { class: 'hint', text: '唱片纹 / 点阵 / 胶片孔 / 锯齿边用这两根滑杆调疏密与大小。' }));
    }));
  };

  App.prototype.spacerInspector = function (box) {
    box.appendChild(h('div', { class: 'hint', text: '间隔：把剩下的空间占掉。画布是「固定比例」时才撑得开，跟着内容时它等于 0。' }));
  };

  /// 所有节点共用的「布局」块。
  App.prototype.layoutBlock = function (node) {
    var self = this;
    var box = h('div', { class: 'panel' });
    box.appendChild(h('div', { class: 'section-title', text: '布局' }));
    if (this.isRoot(node.id)) {
      box.appendChild(h('div', { class: 'hint', text: '这是根容器：宽永远撑满，高跟着画布。' }));
    }
    box.appendChild(this.sizeRule('宽', node.width, function (rule) {
      self.updateSelected(null, function (n) { n.width = rule; });
    }, 'w'));
    box.appendChild(this.sizeRule('高', node.height, function (rule) {
      self.updateSelected(null, function (n) { n.height = rule; });
    }, 'h'));

    var absolute = node.position === 'absolute';
    box.appendChild(this.segmented('位置', [
      { value: 'flow', label: '自动布局' }, { value: 'absolute', label: '绝对定位' },
    ], absolute ? 'absolute' : 'flow', function (value) {
      self.updateSelected(null, function (n) { n.position = value; });
    }));
    if (absolute) {
      var grid = h('div', { class: 'anchors' });
      LM.ANCHORS.forEach(function (anchor) {
        grid.appendChild(h('button', {
          class: 'anchor' + ((node.anchor || 'center') === anchor ? ' on' : ''),
          title: anchor, text: '•',
          onclick: function () { self.updateSelected(null, function (n) { n.anchor = anchor; }); },
        }));
      });
      box.appendChild(fieldBox('锚点', grid));
      box.appendChild(this.slider('横向位移', node.offsetX || 0, -200, 200, 1, pt, function (v) {
        self.updateSelected('offX', function (n) { n.offsetX = v; });
      }));
      box.appendChild(this.slider('纵向位移', node.offsetY || 0, -200, 200, 1, pt, function (v) {
        self.updateSelected('offY', function (n) { n.offsetY = v; });
      }));
    }

    if (!this.isRoot(node.id)) {
      var actions = h('div', { class: 'row' });
      actions.appendChild(h('button', {
        class: 'btn small', text: '装进列',
        onclick: function () {
          self.edit(null, function (draft) { draft.root = LM.wrapNode(draft.root, node.id, 'column'); });
        },
      }));
      actions.appendChild(h('button', {
        class: 'btn small', text: '装进行',
        onclick: function () {
          self.edit(null, function (draft) { draft.root = LM.wrapNode(draft.root, node.id, 'row'); });
        },
      }));
      actions.appendChild(h('button', {
        class: 'btn small', text: '移出到父级',
        onclick: function () {
          self.edit(null, function (draft) { draft.root = LM.unwrapNode(draft.root, node.id); });
        },
      }));
      box.appendChild(actions);
    }

    box.appendChild(this.slider('旋转', node.rotation || 0, -45, 45, 0.5, deg, function (v) {
      self.updateSelected('rotation', function (n) { n.rotation = v; });
    }));
    box.appendChild(this.slider('不透明度', node.opacity === undefined ? 1 : node.opacity,
      LM.OPACITY_RANGE[0], 1, 0.01, pct, function (v) {
        self.updateSelected('opacity', function (n) { n.opacity = v; });
      }));
    box.appendChild(this.toggle('显示', node.visible !== false, function (on) {
      self.updateSelected(null, function (n) { n.visible = on; });
    }));
    return box;
  };

  // MARK: - 增删改层

  App.prototype.insert = function (node) {
    var self = this;
    var target = this.selection;
    this.edit(null, function (draft) {
      var anchor = target === CANVAS ? null : LM.findNode(draft.root, target);
      if (anchor && LM.isStackNode(anchor)) draft.root = LM.insertInto(draft.root, anchor.id, node);
      else if (anchor) draft.root = LM.insertAfter(draft.root, anchor.id, node);
      else draft.root = LM.insertInto(draft.root, draft.root.id, node);
    });
    this.selection = node.id;
    this.more = false;
    this.refresh();
  };

  App.prototype.duplicate = function (node) {
    var copy = LM.sanitizeNode(clone(node));
    // id 去重交给 sanitizeTemplate：整棵子树重新发 id。
    LM.walkNodes(copy, function (child) { child.id = LM.randomUUID(); });
    var self = this;
    this.edit(null, function (draft) { draft.root = LM.insertAfter(draft.root, node.id, copy); });
    this.selection = copy.id;
    this.refresh();
  };

  App.prototype.addText = function (field) {
    this.insert(LM.makeTextNode(field, {
      fontSize: LM.suggestedSize(field),
      weight: LM.suggestedWeight(field),
      design: LM.suggestedDesign(field),
    }));
  };
  App.prototype.addShape = function (shape) {
    this.insert(LM.makeShapeNode(shape, { height: LM.defaultShapeHeight(shape) }));
  };
  App.prototype.addStack = function (direction) {
    this.insert(LM.makeStackNode(direction, { gap: 8, children: [] }));
  };
  App.prototype.addSpacer = function () { this.insert(LM.makeSpacerNode()); };
  App.prototype.addCover = function () { this.insert(LM.makeImageNode('cover', { aspect: 1 })); };

  // MARK: - 画布交互

  App.prototype.point = function (event) {
    var rect = this.canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) / this.zoom,
      y: (event.clientY - rect.top) / this.zoom,
    };
  };

  /// 命中测试：文字与图片先，形状与容器其次，间隔最后；同档里深的先、后画的先。
  App.prototype.hits = function (point) {
    var self = this;
    var out = [];
    var order = { text: 0, image: 0, shape: 1, stack: 1, spacer: 2 };
    this.scene.items.forEach(function (item, index) {
      if (item.kind === 'clipBegin' || item.kind === 'clipEnd' || item.kind === 'mask') return;
      var laid = self.scene.layout.byID[item.id];
      if (!laid) return;
      var frame = self.frames[item.id] || item.frame;
      var box = item.rotation ? R.boundingBox(frame, item.rotation) : frame;
      if (point.x < box.x || point.x > box.x + box.width) return;
      if (point.y < box.y || point.y > box.y + box.height) return;
      out.push({ id: item.id, rank: order[laid.kind] === undefined ? 1 : order[laid.kind],
        depth: laid.depth, index: index });
    });
    out.sort(function (a, b) {
      if (a.rank !== b.rank) return a.rank - b.rank;
      if (a.depth !== b.depth) return b.depth - a.depth;
      return b.index - a.index;
    });
    return out;
  };

  App.prototype.bindCanvas = function () {
    var self = this;
    var drag = null;

    this.overlay.addEventListener('pointerdown', function (event) {
      var point = self.point(event);
      var hits = self.layoutMode && self.layoutHits ? self.layoutHits(point) : self.hits(point);
      var ids = hits.map(function (hit) { return hit.id; });
      var next;
      if (!ids.length) {
        next = CANVAS;
      } else {
        // 原地再点一下换到下面的那一层。
        var at = ids.indexOf(self.selection);
        next = at >= 0 && self._clickedSame ? ids[(at + 1) % ids.length] : ids[0];
      }
      self._clickedSame = next === self.selection;
      if (next !== self.selection) { self.selection = next; self.more = false; self.refresh(); }
      drag = { start: point, moved: false, id: next, node: next === CANVAS ? null : LM.findNode(self.template.root, next) };
      if (next !== CANVAS) drag.before = clone(LM.findNode(self.template.root, next));
      self.overlay.setPointerCapture(event.pointerId);
    });

    this.overlay.addEventListener('pointermove', function (event) {
      if (!drag) return;
      var point = self.point(event);
      var dx = point.x - drag.start.x, dy = point.y - drag.start.y;
      if (!drag.moved && Math.abs(dx) < 2 && Math.abs(dy) < 2) return;
      drag.moved = true;
      self._clickedSame = false;
      var node = drag.node;

      if (self.layoutMode) {
        // 布局模式：拖动 = 换容器 / 换位，松手才落地。
        if (drag.id !== CANVAS && node && !self.isRoot(node.id)) self.layoutDragMove(drag, point);
        return;
      }

      if (drag.id === CANVAS) {
        // 底图：同一套规则，框是整张画布。
        var frame = self.frames[CANVAS];
        if (!self.template.canvas.image || !frame || !frame.overflowX === undefined) return;
        self.dragFocus(null, frame, drag, dx, dy);
        return;
      }
      if (!node) return;
      if (LM.isImageNode(node)) {
        self.dragFocus(node, self.frames[node.id], drag, dx, dy);
      } else if (node.position === 'absolute') {
        self.updateSelected('drag', function (n) {
          n.offsetX = (drag.before.offsetX || 0) + dx;
          n.offsetY = (drag.before.offsetY || 0) + dy;
        });
      } else {
        self.dragReorder(node, point);
      }
    });

    this.overlay.addEventListener('pointerup', function (event) {
      if (drag) self.overlay.releasePointerCapture(event.pointerId);
      if (drag && self.layoutMode && drag.moved && self.layoutDragEnd) self.layoutDragEnd(drag);
      drag = null;
    });

    this.canvas.parentNode.parentNode.addEventListener('wheel', function (event) {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      self.zoom = Math.min(3, Math.max(0.3, self.zoom * (event.deltaY < 0 ? 1.08 : 0.93)));
      self.draw();
      self.renderTopBar();
    }, { passive: false });
  };

  /// 拖图片 = 改「露出哪一段」：位移除以溢出量，溢出为 0 的轴不动。
  App.prototype.dragFocus = function (node, frame, drag, dx, dy) {
    if (!frame) return;
    var ox = frame.overflowX || 0, oy = frame.overflowY || 0;
    var self = this;
    var base = node ? drag.before : this.template.canvas.image;
    var nextX = ox > 0.01 ? Math.min(1, Math.max(0, base.focusX - dx / ox)) : base.focusX;
    var nextY = oy > 0.01 ? Math.min(1, Math.max(0, base.focusY - dy / oy)) : base.focusY;
    if (node) {
      this.updateSelected('drag', function (n) { n.focusX = nextX; n.focusY = nextY; });
    } else {
      this.updateCanvas('drag', function (canvas) {
        canvas.image = Object.assign({}, canvas.image, { focusX: nextX, focusY: nextY });
      });
    }
  };

  /// 拖普通节点 = 在兄弟里换位：拖过相邻节点的中线就交换。
  App.prototype.dragReorder = function (node, point) {
    var parent = LM.parentOf(this.template.root, node.id);
    if (!parent) return;
    var index = parent.children.findIndex(function (child) { return child.id === node.id; });
    if (index < 0) return;
    var row = parent.direction === 'row';
    var self = this;
    var neighbour = function (step) {
      var sibling = parent.children[index + step];
      if (!sibling) return null;
      var frame = self.frames[sibling.id];
      return frame ? { id: sibling.id, frame: frame } : null;
    };
    var previous = neighbour(-1), next = neighbour(1);
    var value = row ? point.x : point.y;
    if (previous) {
      var pm = row ? previous.frame.x + previous.frame.width / 2 : previous.frame.y + previous.frame.height / 2;
      if (value < pm) {
        this.edit('reorder', function (draft) { draft.root = LM.moveNode(draft.root, node.id, 'up'); });
        return;
      }
    }
    if (next) {
      var nm = row ? next.frame.x + next.frame.width / 2 : next.frame.y + next.frame.height / 2;
      if (value > nm) {
        this.edit('reorder', function (draft) { draft.root = LM.moveNode(draft.root, node.id, 'down'); });
      }
    }
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
        var node = self.node();
        if (node && !self.isRoot(node.id)) self.duplicate(node);
        return;
      }
      if (event.key === 'Escape') { self.selection = CANVAS; self.refresh(); return; }
      if (!meta && (event.key === 'l' || event.key === 'L')) {
        event.preventDefault();
        self.setLayoutMode(!self.layoutMode);
        return;
      }
      var current = self.node();
      if (!current || self.isRoot(current.id)) return;
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        self.edit(null, function (draft) { draft.root = LM.removeNode(draft.root, current.id); });
        self.selection = CANVAS;
        self.refresh();
        return;
      }
      var step = event.shiftKey ? 10 : 1;
      var moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      var move = moves[event.key];
      if (!move) return;
      event.preventDefault();
      if (current.position === 'absolute') {
        self.updateSelected('nudge', function (n) {
          n.offsetX = (n.offsetX || 0) + move[0];
          n.offsetY = (n.offsetY || 0) + move[1];
        });
      } else {
        self.edit(null, function (draft) {
          draft.root = LM.moveNode(draft.root, current.id, move[1] < 0 || move[0] < 0 ? 'up' : 'down');
        });
      }
    });
  };

  global.LMUI = { h: h, pct: pct, pt: pt, deg: deg, ratio: ratio, dataURL: dataURL, mimeFor: mimeFor };
  global.LMApp = App;
})(window);
