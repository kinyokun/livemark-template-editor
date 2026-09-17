// 启动：菜单、选图、导入导出、拖放。
(function (global) {
  'use strict';

  var LM = global.LM, h = global.LMUI.h;
  var app = new global.LMApp();
  global.app = app;

  // MARK: - 弹出菜单

  var openMenu = null;
  function closeMenu() { if (openMenu) { openMenu.remove(); openMenu = null; } }
  document.addEventListener('pointerdown', function (event) {
    if (openMenu && !openMenu.contains(event.target) && !event.target.closest('.menu-wrap')) closeMenu();
  }, true);

  function showMenu(anchor, build, alignRight) {
    if (openMenu) { closeMenu(); return; }
    var menu = h('div', { class: 'menu' + (alignRight ? ' right' : '') });
    build(menu, function () { closeMenu(); });
    anchor.parentNode.appendChild(menu);
    openMenu = menu;
  }
  function item(label, onclick) {
    return h('button', { text: label, onclick: onclick });
  }

  document.getElementById('btnLayerMenu').addEventListener('click', function () {
    var anchor = this;
    showMenu(anchor, function (menu, close) {
      menu.appendChild(item('画布与底图', function () { close(); app.selection = 'canvas'; app.refresh(); }));
      menu.appendChild(item('封面图层', function () {
        close(); app.selection = 'cover';
        app.edit(null, function (x) { x.cover.visible = true; });
      }));
      if (app.template.elements.length) {
        menu.appendChild(h('div', { class: 'sep' }));
        // 上面的层在列表里排前面，和画布上的叠放顺序反过来看更顺手。
        app.template.elements.slice().reverse().forEach(function (el) {
          menu.appendChild(item(app.layerTitle(el), function () {
            close(); app.selection = el.id; app.refresh();
          }));
        });
      }
    });
  });

  document.getElementById('btnAddElement').addEventListener('click', function () {
    var anchor = this;
    showMenu(anchor, function (menu, close) {
      menu.appendChild(h('div', { class: 'head', text: '图片与贴纸' }));
      menu.appendChild(item('图片', function () { close(); pickImage(null); }));
      menu.appendChild(item('贴纸', function () { close(); openStickerPicker(null); }));
      menu.appendChild(item('实况照片', function () { close(); pickLivePhoto(); }));
      menu.appendChild(h('div', { class: 'head', text: '形状' }));
      LM.SHAPES.forEach(function (s) {
        menu.appendChild(item(s, function () { close(); app.addShape(s); }));
      });
      LM.FIELD_GROUPS.forEach(function (group) {
        menu.appendChild(h('div', { class: 'head', text: group }));
        LM.FIELDS.filter(function (f) { return f.group === group; }).forEach(function (f) {
          menu.appendChild(item(f.name, function () { close(); app.addField(f.raw); }));
        });
      });
    });
  });

  // MARK: - 选图

  var pendingImage = null;   // {replaceID} 或 null（新增）
  var pendingLive = null;    // {base64, aspect}

  function readFile(file, asText) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = function () { reject(new Error('读不出来')); };
      if (asText) reader.readAsText(file); else reader.readAsDataURL(file);
    });
  }
  function base64Of(dataURL) { return String(dataURL).split(',')[1] || ''; }
  function imageSize(dataURL) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve({ w: img.naturalWidth, h: img.naturalHeight }); };
      img.onerror = function () { reject(new Error('图片无法读取')); };
      img.src = dataURL;
    });
  }

  var fileImage = document.getElementById('filePickImage');
  var fileVideo = document.getElementById('filePickVideo');

  function pickImage(replaceID) { pendingImage = { replaceID: replaceID, live: false }; fileImage.value = ''; fileImage.click(); }
  function pickLivePhoto() { pendingImage = { replaceID: null, live: true }; fileImage.value = ''; fileImage.click(); }

  fileImage.addEventListener('change', function () {
    var file = this.files && this.files[0];
    if (!file || !pendingImage) return;
    var job = pendingImage;
    readFile(file, false).then(function (dataURL) {
      var base64 = base64Of(dataURL);
      if (!LM.isSupportedImage(base64)) { app.toast('图片格式不支持', true); return; }
      if (LM.base64ByteCount(base64) > LM.MAX_BYTES) { app.toast('图片太大（上限 8 MB）', true); return; }
      return imageSize(dataURL).then(function (size) {
        var aspect = size.h / size.w;
        if (job.live) {
          pendingLive = { base64: base64, aspect: aspect };
          fileVideo.value = '';
          fileVideo.click();
        } else if (job.replaceID) {
          app.edit(null, function (x) {
            x.elements.forEach(function (e) {
              if (e.id !== job.replaceID) return;
              e.imageData = base64;
              e.imageAspect = LM.clamp(aspect, [0.02, 50], 1);
            });
          });
        } else if (job.base) {
          app.edit(null, function (x) { x.imageData = base64; });
          app.fitAspectToImage();
        } else {
          app.addImageElement(base64, aspect, false, null);
        }
      });
    }).catch(function (error) { app.toast(error.message || '图片无法读取', true); });
  });

  fileVideo.addEventListener('change', function () {
    var file = this.files && this.files[0];
    if (!file || !pendingLive) { pendingLive = null; return; }
    var still = pendingLive;
    pendingLive = null;
    readFile(file, false).then(function (dataURL) {
      var base64 = base64Of(dataURL);
      if (!LM.isSupportedVideo(base64)) { app.toast('视频格式不支持（要 .mov / .mp4）', true); return; }
      if (LM.base64ByteCount(base64) > LM.MAX_VIDEO_BYTES) { app.toast('视频太大（上限 40 MB）', true); return; }
      app.addImageElement(still.base64, still.aspect, false, base64);
      app.toast('实况照片已加入');
    }).catch(function (error) { app.toast(error.message || '视频读不出来', true); });
  });

  // 底图
  global.LMApp.prototype.pickBaseImage = function () {
    pendingImage = { replaceID: null, live: false, base: true };
    fileImage.value = '';
    fileImage.click();
  };
  global.LMApp.prototype.pickElementImage = function (id) { pickImage(id); };

  // MARK: - 贴纸

  var STICKERS = ['🎫', '🎟️', '🎤', '🎧', '🎬', '🍿', '🎭', '🎹', '🎸', '🥁', '🎺', '🎻',
    '⭐️', '✨', '💫', '🌙', '☀️', '🌈', '🔥', '💛', '💜', '🩵', '🌿', '🌸',
    '📷', '📼', '💌', '📌', '✂️', '🧡', '🎁', '🕰️'];
  function stickerPNG(emoji) {
    var canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 256;
    var ctx = canvas.getContext('2d');
    ctx.font = '200px "Apple Color Emoji", "Noto Color Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 128, 140);
    return canvas.toDataURL('image/png');
  }
  function openStickerPicker(replaceID) {
    var anchor = document.getElementById('btnAddElement');
    showMenu(anchor, function (menu, close) {
      menu.appendChild(h('div', { class: 'head', text: '系统贴纸' }));
      var grid = h('div', { class: 'cols' });
      STICKERS.forEach(function (emoji) {
        grid.appendChild(h('button', {
          text: emoji, onclick: function () {
            close();
            var base64 = base64Of(stickerPNG(emoji));
            if (replaceID) {
              app.edit(null, function (x) {
                x.elements.forEach(function (e) {
                  if (e.id !== replaceID) return;
                  e.imageData = base64; e.imageAspect = 1; e.isSticker = true;
                });
              });
            } else {
              app.addImageElement(base64, 1, true, null);
            }
          }
        }));
      });
      menu.appendChild(grid);
    });
  }
  global.LMApp.prototype.openStickerPicker = function (id) { openStickerPicker(id); };

  // MARK: - 导入 / 导出

  function download(blob, name) {
    var url = URL.createObjectURL(blob);
    var link = h('a', { href: url, download: name });
    document.body.appendChild(link);
    link.click();
    setTimeout(function () { URL.revokeObjectURL(url); link.remove(); }, 1000);
  }

  function exportFile() {
    try {
      var template = LM.sanitize(app.template);
      template.updatedAt = LM.isoNow();
      var text = LM.encodeDocument(template);
      download(new Blob([text], { type: 'application/json' }), LM.fileName(template));
      app.toast('已导出 ' + LM.fileName(template));
    } catch (error) {
      app.toast(error.message || '导出失败', true);
    }
  }

  /// PNG 从 <canvas> 出，尺寸是模版自己的导出尺寸；占位框不印。
  function renderToCanvas(template, scaleOverride) {
    var width = scaleOverride || LM.exportPixelWidth(template);
    var height = Math.round(width * template.aspect);
    var canvas = document.createElement('canvas');
    canvas.width = Math.round(width);
    canvas.height = height;
    var ctx = canvas.getContext('2d');
    var scale = width / LM.CANVAS_W;
    ctx.fillStyle = template.backgroundAccent
      ? (template.backgroundAccent === '主题深色' ? app.accent().deepHex : app.accent().hex)
      : LM.colorCSS(template.background);
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    global.LMRender.draw(ctx, template, app.env(false));
    return canvas;
  }
  function exportPNG() {
    var template = LM.sanitize(app.template);
    var canvas = renderToCanvas(template);
    try {
      canvas.toBlob(function (blob) {
        if (!blob) { app.toast('导出图片失败', true); return; }
        download(blob, (template.name || '模版') + '.png');
        app.toast('已导出 ' + canvas.width + ' × ' + canvas.height + ' px');
      }, 'image/png');
    } catch (error) {
      app.toast('画布被外部图片污染，无法导出', true);
    }
  }
  global.LMExport = { renderToCanvas: renderToCanvas };

  function importText(text, name) {
    var parsed;
    try { parsed = JSON.parse(text); } catch (e) { app.toast('不是模版文件', true); return 0; }
    var documents = Array.isArray(parsed) ? parsed : [parsed];
    var added = 0, failed = 0, last = null;
    documents.forEach(function (doc) {
      try {
        var template = LM.decodeDocument(JSON.stringify(doc));
        app.library.push(template);
        last = template;
        added++;
      } catch (error) { failed++; }
    });
    app.saveLibrary();
    if (last) app.openTemplate(app.openCopy(last), 'saved:' + last.id);
    else app.refresh();
    if (failed) app.toast('导入 ' + added + ' 个，' + failed + ' 个读不出来', added === 0);
    else app.toast('已导入 ' + added + ' 个模版');
    return added;
  }
  global.LMImport = importText;

  document.getElementById('btnImport').addEventListener('click', function () {
    var input = document.getElementById('fileImport');
    input.value = '';
    input.click();
  });
  document.getElementById('fileImport').addEventListener('change', function () {
    var file = this.files && this.files[0];
    if (!file) return;
    if (file.size > LM.MAX_FILE_BYTES) { app.toast('文件过大', true); return; }
    readFile(file, true).then(function (text) { importText(text, file.name); })
      .catch(function () { app.toast('文件读不出来', true); });
  });
  document.getElementById('btnExportFile').addEventListener('click', exportFile);
  document.getElementById('btnExportPNG').addEventListener('click', exportPNG);
  document.getElementById('btnSave').addEventListener('click', function () {
    var template = LM.sanitize(app.template);
    template.updatedAt = LM.isoNow();
    var index = -1;
    app.library.forEach(function (t, i) { if (t.id === template.id) index = i; });
    if (index >= 0) app.library[index] = template; else app.library.push(template);
    app.currentSource = 'saved:' + template.id;
    app.saveLibrary();
    app.refresh();
    app.toast('已存入模版库');
  });

  // 拖放
  var veil = document.getElementById('dropVeil');
  var dragDepth = 0;
  global.addEventListener('dragenter', function (event) { event.preventDefault(); dragDepth++; veil.className = 'drop-veil on'; });
  global.addEventListener('dragleave', function (event) { event.preventDefault(); if (--dragDepth <= 0) { dragDepth = 0; veil.className = 'drop-veil'; } });
  global.addEventListener('dragover', function (event) { event.preventDefault(); });
  global.addEventListener('drop', function (event) {
    event.preventDefault();
    dragDepth = 0;
    veil.className = 'drop-veil';
    var file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
    if (!file) return;
    if (file.size > LM.MAX_FILE_BYTES) { app.toast('文件过大', true); return; }
    readFile(file, true).then(function (text) { importText(text, file.name); })
      .catch(function () { app.toast('文件读不出来', true); });
  });

  // MARK: - 启动

  app.bindCanvas();
  app.bindKeys();
  app.refresh();
  global.addEventListener('resize', function () { app.render(); });
  // 字体晚一步就位，排版会变，所以字体加载完再画一次。
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { app.render(); });
  global.__ready = true;
})(window);
