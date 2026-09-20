# Livemark 海报工坊 · 画布版

网页和 App 共用 schema 3 模板、字段解析、网格布局、编辑命令和字体身份。PNG 导出统一使用固定版本的 CanvasKit CPU/WASM 引擎，复用同一份测量、绘制、字体字节与图片解码；记录内容不会发送到渲染服务。共有内容按像素一致验收，iOS 专属字体或素材不要求跨端复制。

## 本地运行

在 App 仓库根目录运行：

```sh
node scripts/build_web_editor.js
python3 -m http.server 8874 --bind 127.0.0.1 --directory Web/template-editor
```

打开 `http://127.0.0.1:8874`。构建脚本生成 `core.js`、`offline/` 导出引擎和 App 的内联引擎页面，并复制完整字库和 OFL 授权到 `fonts/`。生成文件应通过构建更新。使用 HTTP 本地服务，避免 `file://` 下字体加载、IndexedDB 和 Web Crypto 的浏览器限制。

首次导出会读取本站静态引擎和所需字体，随后在设备内计算。App 将完整引擎和字体打包到本地，不依赖网络。两端都不会回退到系统字体或另一套绘制实现来冒充一致导出；缺少资源会明确失败。

`scripts/publish_web_editor.sh` 会先构建再镜像到独立公开仓库；本次实现不自动发布。

## 编辑

- 点选元素，单指或鼠标拖动移动；四角缩放，上方圆点旋转。文字左右控制点只改宽度，让正文重新换行。
- 图片默认移动外框。点“裁剪图片”后，拖动才会调整框内内容；完成后回到移动模式。
- 两指、⌘/Ctrl 加滚轮缩放视口；空白处拖动平移。右键可选择重叠元素；图层列表支持锁定与选取。
- Shift 多选，支持组合、解组、对齐、等距分布。方向键微移，Shift 加方向键移动 10pt。⌘/Ctrl Z 撤销，⇧⌘/Ctrl Z 重做，⌘/Ctrl D 复制。
- 画布由多个图层组成。网格图层内部可以有多行多列和合并单元格，图层列表只显示整个层；“编辑内容”进入该层后，点格子添加内容、拖内容换格、拖列边界调宽，Shift 多选格子后合并或拆分。多项内容不能无损合并时会提示先移动内容。
- 网格自动行高随文字增长，空行可收起；编辑状态临时显示空格，导出不保留这些编辑占位。还可调整行列间距、固定行高，在指定位置插入或删除空行列。图层之间用“跟随前一项”顺延；固定画布溢出会提示并阻止导出。

## 字段、字体与手写

记录词条包含内置字段和用户自定义词条。自定义绑定存稳定 ID 与显示名称，不按名称偷偷重连。导入遇到缺失词条时，先逐项选择本地词条或明确留空，再导入。预览字段只保存在浏览器草稿中，不随模板导出。私人字段默认关闭。

八款字体包含中文黑体、宋体、文楷、小薇和四款西文。西文使用明确的中文回退链；预览、测量、导出等待同一份字体加载完成。内置字重使用真实静态 400/700 文件，小薇只有 400；导入单文件使用其默认字重。支持导入 TTF/OTF（每个不超过 32MB），文件哈希校验并嵌入模板依赖。字库和许可证来源见 `assets/fonts/poster/manifest.json`（构建后也在 `fonts/manifest.json`）。

手写画板生成透明图片和可编辑笔迹数据；iOS App 的 PencilKit 可以保留原生笔迹。没有“把任意文字自动变成本人笔迹”的私有系统能力。

## 保存与交换

草稿与“我的模版”使用 IndexedDB，能够存放完整字体依赖。内置模板保存为独立副本。撤销历史留在内存，当前草稿持久化；浏览器清理站点数据后需要从导出文件恢复。

“导出模版”输出 `.livemark` JSON；App 也接收该文件。导入兼容 gzip 包装，schema 1/2 按本次重做约定拒收，保留原文件与 App 原始记录。“导出图片”使用所选导出宽度、去除空字段占位，缺字体、缺图片或溢出时不会假装成功。超大长图受像素面积限制。

## 验证边界

网页编辑预览仍使用 Canvas 2D，App 编辑预览使用原生 Skia；预览不是像素一致性的验收输入。最终 PNG 统一通过 `offline/renderer.js`，App 的 `assets/poster-engine/engine.html` 包含完全相同的 JS 与 WASM。网页不生成系统 Live Photo 配对文件。

像素回归采用真实 WASM 软件渲染，分别在 Node/V8 加载网页包、在无窗口 WKWebView 加载 App 内联包；测试页面的 CSP 禁止联网。这可验证两种 JS 运行时和两种打包路径，不能替代 iOS/Android 真机手势、PencilKit 或内存压力验收。

```sh
node scripts/verify_poster_engine.js
swiftc scripts/render_poster_webkit.swift -o /tmp/livemark-poster-webkit
/tmp/livemark-poster-webkit "$PWD/assets/poster-engine/engine.html" "$PWD/.local/poster-parity/requests.json" "$PWD/.local/poster-parity/webkit"
node scripts/verify_poster_engine.js --compare
```

也可直接比较设备实际导出的两张图片：`node scripts/compare_poster_pngs.js app.png web.png`。它解码 RGBA 后逐像素比较，PNG 压缩方式或元数据不同不会被误判成像素差异。测试产物保存在 `.local/poster-parity/`，不进入发布包。
