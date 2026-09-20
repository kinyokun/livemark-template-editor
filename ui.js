/* Browser services. Document geometry and commands live in the shared TypeScript core. */
(function (global) {
  'use strict';
  const LM = global.LMCore;
  function h(tag, props = {}, children = []) {
    const element = document.createElement(tag);
    Object.entries(props).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (key === 'text') element.textContent = value;
      else if (key === 'class') element.className = value;
      else if (key === 'style' && typeof value === 'object') Object.assign(element.style, value);
      else if (key.startsWith('on')) element.addEventListener(key.slice(2), value);
      else if (key in element) element[key] = value;
      else element.setAttribute(key, value);
    });
    children.forEach(child => { if (child) element.append(child); });
    return element;
  }
  function button(text, onclick, extra = {}) { return h('button', { text, onclick, type: 'button', ...extra }); }
  function field(name, value, onchange, props = {}) {
    const control = h(props.multiline ? 'textarea' : 'input', { value, ...props, onchange: event => onchange(event.target.value) });
    control.setAttribute('aria-label', name);
    return h('label', { class: 'field' }, [h('span', { text: name }), control]);
  }
  function select(name, value, options, onchange) {
    return h('label', { class: 'field' }, [h('span', { text: name }), h('select', { value, 'aria-label': name, onchange: event => onchange(event.target.value) },
      options.map(option => h('option', { value: option[0], text: option[1], selected: option[0] === value }))) ]);
  }
  function check(name, checked, onchange) { return h('label', { class: 'check' }, [h('span', { text: name }), h('input', { type: 'checkbox', checked, onchange: e => onchange(e.target.checked) })]); }
  let timer;
  function toast(message) { const node = document.getElementById('toast'); node.textContent = message; node.classList.add('show'); clearTimeout(timer); timer = setTimeout(() => node.classList.remove('show'), 4000); }
  function dialog(title, children) {
    const modal = document.getElementById('picker');
    document.getElementById('pickerTitle').textContent = title;
    document.getElementById('pickerBody').replaceChildren(...children);
    if (!modal.open) modal.showModal();
  }
  const closeDialog = () => document.getElementById('picker').close();
  document.getElementById('closePicker').onclick = closeDialog;
  const db = new Promise((resolve, reject) => {
    const request = indexedDB.open('LivemarkPosterCanvasV3', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('documents');
    request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
  });
  async function storage(key, value) {
    const database = await db;
    return new Promise((resolve, reject) => {
      const tx = database.transaction('documents', value === undefined ? 'readonly' : 'readwrite');
      const store = tx.objectStore('documents');
      const request = value === undefined ? store.get(key) : store.put(value, key);
      let result;
      request.onsuccess = () => { result = request.result; };
      tx.oncomplete = () => resolve(result); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error);
    });
  }
  const loaded = new Map(), loading = new Map(), importedWeights = new Map();
  function family(id) {
    return LM.posterFontChain(id).map(value => '"' + LM.posterFontFamily(value) + '"').join(',') + ',sans-serif';
  }
  function weight(id, requested) { return id ? LM.posterFontWeight(id, requested, importedWeights.get(id) || 400) : requested; }
  async function ensureFont(id, assets = []) {
    const definition = LM.posterFont(id), asset = assets.find(font => font.id === id);
    if (!definition && !asset) throw new Error('缺少字体：' + id + '，请导入字体或重新选择。');
    const identity = definition ? 'bundled:' + id : await digest(base64Bytes(asset.data));
    if (asset?.sha256 && asset.sha256.toLowerCase() !== identity) throw new Error('字体校验失败：' + asset.name);
    if (loaded.has(id) && loaded.get(id) !== identity) throw new Error('字体标识冲突：' + id);
    if (!loaded.has(id)) {
      const key = id + identity;
      if (!loading.has(key)) loading.set(key, (async () => {
        const source = definition ? 'url("fonts/' + definition.file + '")' : base64Bytes(asset.data).buffer;
        const fontWeight = definition ? 400 : LM.fontFileWeight(base64Bytes(asset.data));
        const axes = definition ? [] : LM.fontFileVariations(base64Bytes(asset.data));
        const face = new FontFace(LM.posterFontFamily(id), source, { weight: String(fontWeight), ...(axes.length ? { variationSettings: axes.map(axis => '"' + axis.tag + '" ' + axis.value).join(', ') } : {}) });
        await face.load(); document.fonts.add(face);
        if (definition?.boldFile) {
          const bold = new FontFace(LM.posterFontFamily(id), 'url("fonts/' + definition.boldFile + '")', { weight: '700' });
          await bold.load(); document.fonts.add(bold);
        }
        if (!definition) importedWeights.set(id, fontWeight);
        loaded.set(id, identity);
        global.LMRender.clearMeasureCache();
      })());
      try { await loading.get(key); } finally { loading.delete(key); }
    }
    const fallback = LM.posterFontFallback(id);
    if (fallback) await ensureFont(fallback, assets);
  }
  async function ensureFonts(template) {
    const ids = new Set(); LM.walkNodes(template.root, node => { if (node.kind === 'text' && node.fontId) ids.add(node.fontId); });
    for (const id of ids) await ensureFont(id, template.fontAssets);
  }
  function base64Bytes(text) { return Uint8Array.from(atob(text), char => char.charCodeAt(0)); }
  function base64(bytes) { let result = ''; for (let i = 0; i < bytes.length; i += 8192) result += String.fromCharCode(...bytes.subarray(i, i + 8192)); return btoa(result); }
  async function digest(bytes) { return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))).map(n => n.toString(16).padStart(2, '0')).join(''); }
  async function readURL(file) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); }); }
  function imageURL(source) { if (source.uri) return source.uri; if (!source.data) return null; return source.data.startsWith('data:') ? source.data : 'data:image/' + (source.data.startsWith('/9j/') ? 'jpeg' : source.data.startsWith('UklGR') ? 'webp' : 'png') + ';base64,' + source.data; }
  const images = new Map(), pendingImages = new Map();
  async function loadImages(scene) {
    await Promise.all(LM.sceneImageSources(scene).map(async source => {
      if (images.has(source.key)) return;
      if (!pendingImages.has(source.key)) pendingImages.set(source.key, new Promise(resolve => {
        const url = imageURL(source); if (!url) { images.set(source.key, null); resolve(); return; }
        const image = new Image(); image.onload = () => { images.set(source.key, image); resolve(); }; image.onerror = () => { images.set(source.key, null); resolve(); }; image.src = url;
      }));
      await pendingImages.get(source.key); pendingImages.delete(source.key);
    }));
    return images;
  }
  function download(blob, name) { const url = URL.createObjectURL(blob), link = h('a', { href: url, download: name }); link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
  global.LMUI = { h, button, field, select, check, toast, dialog, closeDialog, storage, ensureFont, ensureFonts, family, weight, readURL, base64, base64Bytes, digest, loadImages, images, download };
})(window);
