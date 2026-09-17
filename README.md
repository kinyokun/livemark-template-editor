# Livemark 模版工坊（浏览器版）

在电脑上排 Livemark 的分享模版，导出 `.lmtemplate` 隔空投送到 iPhone，双击即在 App 里打开。

## 打开

线上版：<https://kinyokun.github.io/livemark-template-editor/>（公开仓库 `kinyokun/livemark-template-editor`，由 `scripts/publish_web_editor.sh` 从这里同步）。

本地：直接双击 `index.html`，或者拖进浏览器。没有构建步骤，没有依赖，`file://` 与 `http://` 都能跑。

```sh
# 想用本地服务器也行
cd Web/template-editor && python3 -m http.server 8731
```

支持 Chrome / Edge / Safari（近两年的版本）。

## 一眼看懂

- 左栏：九个内置模版、四种起始排版、你自己存的模版（存在浏览器 `localStorage` 里，可改名、复制、删除）。左栏底部是预览设置：换示例记录、换主题色、填开场白与署名、开关分享字段。
- 中间：画布。拖动移动，滚轮缩放，四角拉伸，点选图层。上方是图层菜单与「添加元素」。
- 右栏：选中对象的检查器，控件与 App 里的模版编辑器一一对应。
- 快捷键：`Delete` 删除图层，方向键微调（按住 Shift 走大步），`⌘D` 复制，`⌘Z` 撤销，`Esc` 回到画布。

私人字段（票价 / 座位 / 同行人）默认不印，要在左下角「分享开关」里自己打开，和 App 一样。

## 和 App 对接

- **导出模版**：写出 `<模版名>.lmtemplate`（build 26 以前叫 `.encoretemplate`，App 两种都收）。文件结构与 `TemplateDocument.encode` 一致：键按字典序排、`nil` 的键整把省掉、`Data` 走 base64、日期是不带小数秒的 ISO-8601、UUID 大写带横杠。空画布（没有元素且封面关掉）会被拦下，因为 App 的解码器也不收。
- **发送到 iPhone**：把导出的文件隔空投送给自己，在 iPhone 上点开即进 Livemark，导入时 App 会重新发一个 id，不会覆盖你已有的模版。
- **导入**：点「导入」或把文件拖到页面上。校验与 `TemplateDocument.decode` 同一套：版本号、8 MB / 40 MB 视频 / 64 MB 文件三道尺寸上限、PNG / JPEG / GIF / WebP / HEIF 的魔数、`qt  ` `isom` `mp41` `mp42` `M4V ` `avc1` 的视频魔数；带 `imageAsset` / `videoAsset` 的文件一律拒绝。也能一次导入一个 JSON 数组（例如 `builtins.json`）。
- **导出图片**：按模版自己的导出尺寸（`exportWidth`，默认 1080 宽）用 `<canvas>` 画一遍再下载，占位虚线框不会印上去。

`builtins.js` / `builtins.json` 由 `scripts/export_builtin_templates.sh` 从 Swift 代码生成，`covers.js` 由 `assets/cover-*.png` 转成 data URL（`file://` 下画布不能读本地图片文件，否则导不出 PNG）。这三个文件都不要手改。

## 做不到的事

- 画布是用 Canvas 2D 重画的，不是 SwiftUI。字体度量、断行位置、`.continuous` 圆角、阴影模糊半径都是近似，和手机上的成品会有几像素的出入；排版位置、尺寸、颜色是精确的。
- SF Symbols 用不了：星星是自己画的五角星，`photo.badge.exclamationmark` 之类的兜底图标换成了灰块。
- 「实况照片」在这里只做成「一张图 + 一段 `.mov`/`.mp4`」：鼠标停在图层上会静音播放，导出的文件里 `videoData` 与 App 写的一样，但浏览器不生成真正的 Live Photo 配对。
- 预览用的是 App 里那四条示例记录与六张示意封面，不读你真实的收藏。
- 模版存在浏览器本地，换浏览器或清缓存就没了；要留底就导出成文件。
- 撤销只有一条链（没有重做），自动合并连续的滑杆拖动。
