// 启动：图层菜单、添加元素、选图、导入导出、拖放。
(function (global) {
  'use strict';

  var LM = global.LMCore, R = global.LMRender, S = global.LMSample, h = global.LMUI.h;
  var app = new global.LMApp();
  global.app = app;

  // MARK: - 弹出菜单

  var openMenu = null;
  function closeMenu() { if (openMenu) { openMenu.remove(); openMenu = null; } }
  document.addEventListener('pointerdown', function (event) {
    if (openMenu && !openMenu.contains(event.target) && !event.target.closest('.menu-wrap')) closeMenu();
  }, true);

  function showMenu(anchor, build) {
    if (openMenu) { closeMenu(); return; }
    var menu = h('div', { class: 'menu' });
    build(menu, closeMenu);
    anchor.parentNode.appendChild(menu);
    openMenu = menu;
  }
  function item(label, onclick, extra) {
    return h('button', Object.assign({ text: label, onclick: onclick }, extra || {}));
  }

  // MARK: 图层菜单（整棵树，缩进表示层级）

  document.getElementById('btnLayerMenu').addEventListener('click', function () {
    var anchor = this;
    showMenu(anchor, function (menu, close) {
      menu.appendChild(item('画布与底图', function () {
        close();
        app.selection = 'canvas';
        app.more = false;
        app.refresh();
      }, { class: app.selection === 'canvas' ? 'on' : '' }));
      menu.appendChild(h('div', { class: 'sep' }));
      app.layerRows().forEach(function (row) {
        menu.appendChild(item('　'.repeat(row.depth) + row.title, function () {
          close();
          app.selection = row.node.id;
          app.more = false;
          app.refresh();
        }, { class: app.selection === row.node.id ? 'on' : '' }));
      });
    });
  });

  // MARK: 添加元素（一级只剩四项，其余进子菜单）

  document.getElementById('btnAddElement').addEventListener('click', function () {
    var anchor = this;
    showMenu(anchor, function (menu, close) {
      menu.appendChild(h('div', { class: 'head', text: '图片与贴纸' }));
      menu.appendChild(item('图片', function () { close(); pickImage(null); }));
      menu.appendChild(item('贴纸', function () { close(); pickSticker(null); }));
      menu.appendChild(item('记录封面', function () { close(); app.addCover(); }));
      menu.appendChild(item('实况照片', function () { close(); pickLivePhoto(); }));

      menu.appendChild(h('div', { class: 'head', text: '文字' }));
      LM.TEMPLATE_FIELD_GROUPS.forEach(function (group) {
        var sub = h('details', { class: 'sub' }, [h('summary', { text: group })]);
        LM.TEMPLATE_FIELDS.filter(function (field) { return LM.fieldGroup(field) === group; })
          .forEach(function (field) {
            sub.appendChild(item(field, function () { close(); app.addText(field); }));
          });
        menu.appendChild(sub);
      });

      menu.appendChild(h('div', { class: 'head', text: '形状' }));
      var shapes = h('details', { class: 'sub' }, [h('summary', { text: '八种形状' })]);
      LM.TEMPLATE_SHAPES.forEach(function (shape) {
        shapes.appendChild(item(shape, function () { close(); app.addShape(shape); }));
      });
      menu.appendChild(shapes);

      menu.appendChild(h('div', { class: 'head', text: '布局' }));
      menu.appendChild(item('列容器', function () { close(); app.addStack('column'); }));
      menu.appendChild(item('行容器', function () { close(); app.addStack('row'); }));
      menu.appendChild(item('间隔', function () { close(); app.addSpacer(); }));
    });
  });

  // MARK: - 选图

  var pickTarget = null;
  var pickKind = 'image';

  function readFile(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function base64Of(dataURL) {
    var comma = dataURL.indexOf(',');
    return comma >= 0 ? dataURL.slice(comma + 1) : dataURL;
  }

  function imageAspect(dataURL) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () { resolve(img.naturalHeight / img.naturalWidth); };
      img.onerror = function () { resolve(1); };
      img.src = dataURL;
    });
  }

  document.getElementById('filePickImage').addEventListener('change', function () {
    var file = this.files && this.files[0];
    this.value = '';
    if (!file) return;
    readFile(file).then(function (url) {
      var data = base64Of(url);
      if (!LM.isSupportedImage(data)) { app.toast('这个图片格式 App 不收（PNG / JPEG / GIF / WebP / HEIF）'); return; }
      return imageAspect(url).then(function (aspect) {
        if (pickKind === 'canvas') {
          app.updateCanvas(null, function (canvas) {
            canvas.image = { data: data, imageAspect: aspect, focusX: 0.5, focusY: 0.5, zoom: 1, opacity: 1 };
          });
          return;
        }
        if (pickTarget) {
          app.selection = pickTarget;
          app.updateSelected(null, function (node) {
            node.source = { data: data };
            node.imageAspect = aspect;
            node.isSticker = false;
            delete node.video;
          });
          return;
        }
        app.insert(LM.makeImageNode({ data: data }, { imageAspect: aspect, aspect: 'natural' }));
      });
    });
  });

  function pickImage(target) {
    pickTarget = target;
    pickKind = 'image';
    document.getElementById('filePickImage').click();
  }
  app.pickImage = pickImage;
  app.pickCanvasImage = function () {
    pickTarget = null;
    pickKind = 'canvas';
    document.getElementById('filePickImage').click();
  };

  // MARK: 贴纸（表情画成 256 px 透明 PNG，和 App 的 renderStickerPNG 一样）

  var STICKER_SIDE = 256;

  function renderSticker(text) {
    var glyph = Array.from(String(text).trim()).slice(0, 2).join('');
    if (!glyph) return null;
    var canvas = document.createElement('canvas');
    canvas.width = STICKER_SIDE;
    canvas.height = STICKER_SIDE;
    var ctx = canvas.getContext('2d');
    ctx.font = Math.round(STICKER_SIDE * 0.78) + 'px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(glyph, STICKER_SIDE / 2, STICKER_SIDE / 2 + STICKER_SIDE * 0.04);
    return canvas.toDataURL('image/png');
  }

  function pickSticker(target) {
    var glyph = prompt('贴纸：输入一个表情（最多两个字符）', '✨');
    if (glyph === null) return;
    var url = renderSticker(glyph);
    if (!url) { app.toast('这个字符画不出来'); return; }
    var data = base64Of(url);
    if (target) {
      app.selection = target;
      app.updateSelected(null, function (node) {
        node.source = { data: data };
        node.imageAspect = 1;
        node.isSticker = true;
        node.aspect = 1;
        delete node.video;
      });
      return;
    }
    app.insert(LM.makeImageNode({ data: data }, {
      imageAspect: 1, aspect: 1, isSticker: true, width: 72, position: 'absolute', anchor: 'topRight',
    }));
  }
  app.pickSticker = pickSticker;

  // MARK: 实况照片

  var liveTarget = null;

  document.getElementById('filePickVideo').addEventListener('change', function () {
    var file = this.files && this.files[0];
    this.value = '';
    if (!file) return;
    readFile(file).then(function (url) {
      var data = base64Of(url);
      if (!LM.isSupportedVideo(data)) { app.toast('这段视频 App 不收（.mov / .mp4）'); return; }
      if (!liveTarget) { app.toast('先选一张图片再加实况'); return; }
      app.selection = liveTarget;
      app.updateSelected(null, function (node) { node.video = { data: data }; });
      app.toast('实况照片已加上：鼠标停在图层上会静音播放');
    });
  });

  function pickLiveVideo(target) {
    liveTarget = target;
    document.getElementById('filePickVideo').click();
  }
  app.pickLiveVideo = pickLiveVideo;

  /// 「实况照片」＝ 先挑一张图，再挑一段视频。
  function pickLivePhoto() {
    pickTarget = null;
    pickKind = 'image';
    var input = document.getElementById('filePickImage');
    var once = function () {
      input.removeEventListener('change', once);
      setTimeout(function () {
        if (app.selection !== 'canvas') pickLiveVideo(app.selection);
      }, 300);
    };
    input.addEventListener('change', once);
    input.click();
  }

  // 停在实况图层上就播一遍。
  var liveVideos = {};
  app.overlay.addEventListener('pointermove', function (event) {
    var hits = app.hits(app.point(event));
    hits.forEach(function (hit) {
      var node = LM.findNode(app.template.root, hit.id);
      if (!node || !LM.isImageNode(node) || !LM.nodeIsLivePhoto(node)) return;
      var source = node.video && node.video.data;
      if (!source) return;
      var key = 'live:' + hit.id;
      var video = liveVideos[key];
      if (!video) {
        video = document.createElement('video');
        video.muted = true;
        video.playsInline = true;
        video.src = 'data:video/mp4;base64,' + source;
        liveVideos[key] = video;
      }
      if (video.paused) video.play().catch(function () {});
    });
  });

  // MARK: - gzip（`.livemark` 的外壳；不支持的浏览器写明文 JSON，App 照读）

  function gzip(text) {
    if (typeof CompressionStream === 'undefined') {
      return Promise.resolve(new TextEncoder().encode(text));
    }
    var stream = new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'));
    return new Response(stream).arrayBuffer().then(function (buffer) { return new Uint8Array(buffer); });
  }

  function gunzip(bytes) {
    if (bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b) {
      if (typeof DecompressionStream === 'undefined') {
        return Promise.reject(new Error('这个浏览器解不开 gzip，换 Chrome / Edge / Safari 16.4 以上'));
      }
      var stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
      return new Response(stream).text();
    }
    return Promise.resolve(new TextDecoder().decode(bytes));
  }

  function download(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = h('a', { href: url, download: name });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  // MARK: - 导入导出

  document.getElementById('btnSave').addEventListener('click', function () { app.storeTemplate(); });

  document.getElementById('btnExportFile').addEventListener('click', function () {
    var text;
    try {
      text = LM.encodeTemplateDocument(app.template);
    } catch (error) {
      app.toast(describe(error));
      return;
    }
    gzip(text).then(function (bytes) {
      download(new Blob([bytes], { type: 'application/gzip' }), LM.templateFileName(app.template));
      app.toast('已导出 ' + LM.templateFileName(app.template));
    });
  });

  function describe(error) {
    if (error && error.code === 'tooLarge') return '太大了：带图的模版上限 8 MB，带实况的 64 MB';
    if (error && error.code === 'unsupportedVersion') return '这个模版文件来自旧版本（v1），这一版打不开了';
    if (error && error.code === 'empty') return '空画布导不出来，先放点东西进去';
    return (error && error.message) ? error.message : '出错了';
  }

  function importText(text) {
    var parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      app.toast('这不是一个模版文件');
      return;
    }
    // 一次导入一个数组也行（例如从别处导出的一组模版）。
    var list = Array.isArray(parsed) ? parsed : [parsed];
    var added = 0, failure = null;
    list.forEach(function (entry) {
      try {
        var template = LM.decodeTemplateDocument(JSON.stringify(entry));
        app.library.push(template);
        added += 1;
        app.replaceTemplate(template);
      } catch (error) {
        failure = error;
      }
    });
    if (!added) { app.toast(describe(failure)); return; }
    app.saveLibrary();
    app.refresh();
    app.toast('导入了 ' + added + ' 个模版');
  }

  function importFile(file) {
    file.arrayBuffer().then(function (buffer) {
      return gunzip(new Uint8Array(buffer));
    }).then(importText).catch(function (error) {
      app.toast(describe(error));
    });
  }

  document.getElementById('btnImport').addEventListener('click', function () {
    document.getElementById('fileImport').click();
  });
  document.getElementById('fileImport').addEventListener('change', function () {
    var file = this.files && this.files[0];
    this.value = '';
    if (file) importFile(file);
  });

  // MARK: 导出图片

  document.getElementById('btnExportPNG').addEventListener('click', function () {
    // 导出的那张不带占位虚线框：和 App 的导出走同一条路（placeholders: false）。
    var scene = LM.buildScene(app.template, app.context, { placeholders: false });
    app.images.sync(LM.sceneImageSources(scene));
    var width = LM.exportPixelWidth(app.template);
    var canvas = R.renderToCanvas(scene, app.images.map, width);
    canvas.toBlob(function (blob) {
      if (!blob) { app.toast('导不出来'); return; }
      download(blob, (app.template.name || '海报') + '.png');
      app.toast('已导出 ' + canvas.width + ' × ' + canvas.height + ' px');
    }, 'image/png');
  });

  // MARK: - 拖放导入

  var veil = document.getElementById('dropVeil');
  ['dragenter', 'dragover'].forEach(function (name) {
    document.addEventListener(name, function (event) {
      event.preventDefault();
      veil.classList.add('on');
    });
  });
  ['dragleave', 'drop'].forEach(function (name) {
    document.addEventListener(name, function (event) {
      event.preventDefault();
      if (name === 'dragleave' && event.relatedTarget) return;
      veil.classList.remove('on');
    });
  });
  document.addEventListener('drop', function (event) {
    var file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
    if (file) importFile(file);
  });

  // MARK: - 起飞

  app.refresh();
})(window);
