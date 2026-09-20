# Livemark 模版工坊（浏览器版）

在电脑上排 Livemark 的海报模版，导出 `.livemark` 隔空投送到手机，点开即在 App 里打开。

## 打开

线上版：<https://kinyokun.github.io/livemark-template-editor/>。这几个文件同时躺在 App 仓库的 `Web/template-editor/` 和公开仓库 `kinyokun/livemark-template-editor`，后者由前者的 `scripts/publish_web_editor.sh` 镜像过来，别直接改公开仓库。

本地：直接双击 `index.html`，或者拖进浏览器。没有构建步骤，没有依赖，`file://` 与 `http://` 都能跑。

```sh
# 想用本地服务器也行，在这个文件夹里跑
python3 -m http.server 8731
```

支持 Chrome / Edge / Safari 16.4 以上（`.livemark` 是 gzip 的，要 `CompressionStream`）。

## 和 App 是同一份代码

页面里的 `core.js` **是 App 的 TypeScript 编译出来的**，不是照着重写的一份：

- 模型与清洗（`sanitizeTemplate`、各种取值范围）—— `src/core/template/model.ts`
- 排版引擎（hug / fill / fraction、padding、gap、对齐、绝对定位、收起）—— `src/core/template/layout.ts`
- 文件格式（`.livemark` 版本 2 的编解码）—— `src/core/template/document.ts`
- 九个内置风格与四种起点 —— `src/core/template/builtins.ts`
- 场景（模版 + 记录 → 一串按绘制顺序排好的图元）—— `src/features/share/scene.ts`

在 App 仓库里跑 `node scripts/build_web_editor.js` 重新生成。改了 App 的海报代码就重跑一次，网页这边不用动。

只有两件事是平台相关、在 `render.js` 里重写的：**量文字**（手机是 Skia 段落，这里是 Canvas 2D 的 `measureText`）和**画**（`SkCanvas` → `CanvasRenderingContext2D`）。常数、公式、绘制顺序都照 `painter.ts` / `measure.ts` 抄。

其余三个文件是工坊自己的界面：`sample.js`（四条示例记录、六张示意封面、分享开关）、`ui.js`（模版库、画布交互、检查器）、`app.js`（菜单、选图、导入导出）。

## 一眼看懂

- 左栏：九个内置风格、四种起始排版、你自己存的模版（存在浏览器 `localStorage` 里，可改名、复制、删除）。左栏下半是预览设置：换示例记录、换封面、换主题色、填开场白与署名、开关分享字段。
- 中间：画布。点选图层，拖动的含义跟着图层走 —— 图片层是「原图在框里露出哪一段」，绝对定位的层是位移，普通层是在兄弟里换位。`⌘` + 滚轮缩放视图。
- 右栏：选中对象的检查器。第一行是工具条（图层名、上移 / 下移 / 复制 / 删除），接着三到五样常用的，其余折进「更多」，末尾是所有节点共用的「布局」块（宽 / 高规则、位置与锚点、装进行 / 列、移出、旋转、不透明度、显示）。
- 快捷键：`Delete` 删除，方向键换位（绝对定位的是微调，按住 Shift 走大步），`⌘D` 复制，`⌘Z` 撤销，`Esc` 回到画布。

私人字段（票价 / 座位 / 同行人）默认不印，要在左下角「分享开关」里自己打开，和 App 一样。

## 响应式排版是什么意思

模版不是「一张固定比例的画布上堆绝对定位的元素」，而是一棵盒子树，每个盒子按 Figma Auto Layout / CSS flex 的规则摆放子节点（规格见 `Documentation/POSTER.md`）。两个后果在这里能直接看到：

- **字段没值，那一块整个收起**，海报自己变短。关掉左栏的「曲目单」，黑胶唱片那一版会短一截。
- **图进了框不会被裁死**：框比例、`cover` / `contain`、横纵位置、缩放、倾斜分别可调，拖动图片改的是「露出哪一段」（CSS 的 `object-position`），不是把裁好的那块平移出去露白。

## 和 App 对接

- **导出模版**：写出 `<模版名>.livemark`（gzip 过的 JSON，和 App 写的一模一样；`build 26` 以前的 `.lmtemplate` / `.encoretemplate` 也还收得进来）。编码规则由 `document.ts` 保证：键按字典序排、缺省值整把省掉、`Data` 走 base64、日期是不带小数秒的 ISO-8601、UUID 大写带横杠。空画布会被拦下，因为 App 的解码器也不收。
- **发送到手机**：把导出的文件隔空投送给自己，在手机上点开即进 Livemark，导入时 App 会重新发一个 id，不会覆盖你已有的模版。
- **导入**：点「导入」或把文件拖到页面上。gzip 与明文 JSON 都认（和 App 一样看魔数）。版本 1 的旧模版会被拒收，提示「这个模版文件来自旧版本（v1）」—— 海报体系 2026-09-18 重做过，这是有意的。
- **导出图片**：按模版自己的导出宽度（`exportWidth`，1080 / 1440 / 2160）用 `<canvas>` 画一遍再下载；高度永远跟着排版走。占位虚线框不会印上去。

## 做不到的事

- 画布是用 Canvas 2D 重画的，不是 Skia。字体度量、断行位置、`.continuous` 圆角、阴影模糊半径都是近似，和手机上的成品会有几像素的出入；**排版位置、尺寸、颜色、收起与否是精确的**（那部分是同一份代码算的）。
- 字距靠 `ctx.letterSpacing`，老浏览器上会当成 0。
- 记录没有封面原图时，App 画的是一张程序化封面；这里画的是同色系的一块底。
- SF Symbols 用不了：星星是自己画的五角星。
- 「实况照片」在这里只做成「一张图 + 一段 `.mov`/`.mp4`」：鼠标停在图层上会静音播放，导出的文件里 `video` 与 App 写的一样，但浏览器不生成真正的 Live Photo 配对。
- 贴纸是把一个表情画成 256 px 的透明 PNG（和 App 的 `renderStickerPNG` 同一个做法），不能像 iOS 那样粘贴系统表情贴纸。
- 预览用的是四条示例记录与六张示意封面，不读你真实的收藏。
- 模版存在浏览器本地，换浏览器或清缓存就没了；要留底就导出成文件。
- 撤销只有一条链（没有重做），自动合并连续的滑杆拖动。
