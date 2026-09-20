/* PNG export uses the same bundled CPU/WASM engine as the mobile WebView. */
(function (global) {
  'use strict';
  let ready;
  const scripts = new Map();
  function loadScript(source) {
    if (!scripts.has(source)) scripts.set(source, new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = source;
      script.onload = resolve;
      script.onerror = () => { scripts.delete(source); reject(new Error('导出引擎未能加载，请重新打开页面。')); };
      document.head.append(script);
    }));
    return scripts.get(source);
  }
  async function engine() {
    if (!ready) ready = (async () => {
      if (!global.CanvasKitInit) await loadScript('offline/canvaskit.js');
      if (!global.LMOfflineRenderer) await loadScript('offline/renderer.js');
      await global.LMOfflineRenderer.init({ wasmURL: new URL('offline/canvaskit.wasm', document.baseURI).href, fontBaseURL: new URL('fonts/', document.baseURI).href });
      return global.LMOfflineRenderer;
    })().catch(error => { ready = undefined; throw error; });
    return ready;
  }
  async function sourceBytes(source) {
    if (source.data) return source.data.includes(',') ? source.data.slice(source.data.indexOf(',') + 1) : source.data;
    if (!source.uri) throw new Error('图片缺少原始数据，请重新选择。');
    const url = new URL(source.uri, document.baseURI);
    if (!['data:', 'blob:'].includes(url.protocol) && url.origin !== new URL(document.baseURI).origin) throw new Error('请把图片嵌入模版后再离线导出。');
    const response = await fetch(url.href);
    if (!response.ok) throw new Error('图片未能读取，请重新选择。');
    return global.LMUI.base64(new Uint8Array(await response.arrayBuffer()));
  }
  async function render(template, context, pixelWidth) {
    // This pass only enumerates source identities. Export geometry is recomputed inside WASM.
    const sources = global.LMCore.sceneImageSources(global.LMCore.buildScene(template, context, { placeholders: false }));
    const assets = [];
    for (const source of sources) assets.push({ key: source.key, data: await sourceBytes(source) });
    const renderer = await engine();
    const result = await renderer.render({ template, context, pixelWidth, assets });
    if (!result.pngBase64) throw new Error('导出引擎没有生成图片，请重试。');
    return { ...result, blob: new Blob([global.LMUI.base64Bytes(result.pngBase64)], { type: 'image/png' }) };
  }
  global.LMOfflineExport = { render, engine };
})(window);
