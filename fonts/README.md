# Poster fonts

Eight real font families are bundled for offline poster editing. Every family is
licensed under SIL Open Font License 1.1; keep the corresponding `*-OFL.txt` when
redistributing these files. `manifest.json` records the upstream URL, byte count,
SHA-256, and generated instances. Files retain their complete upstream glyph set;
Chinese text is not limited to a sample-character subset.

| Choice | Upstream family | Included weights |
| --- | --- | --- |
| 思源黑体 | Noto Sans SC | 400, 700 |
| 思源宋体 | Noto Serif SC | 400, 700 |
| 霞鹜文楷 | LXGW WenKai TC | 400, 700 |
| 站酷小薇体 | ZCOOL XiaoWei | 400 |
| 太空黑体 | Space Grotesk | 400, 700 |
| 优雅衬线 | Playfair Display | 400, 700 |
| 古典书刊 | Cormorant Garamond | 400, 700 |
| 随手写 | Caveat | 400, 700 |

Noto Sans SC and Noto Serif SC are the Simplified Chinese Google Fonts releases
of the Source Han/Noto CJK collaboration. LXGW WenKai TC includes Simplified and
Traditional Chinese. Latin choices explicitly pair with a bundled Chinese face;
Noto Sans SC is the final bundled text fallback. The app and web use the same stable
aliases from `src/core/template/fontCatalog.ts`.

`NotoEmoji-Regular.ttf` is a fixed monochrome emoji fallback, not a ninth font
picker choice. It is a full-glyph static weight-400 instance of Google's Noto
Emoji 3.002 variable font, with `glyf` outlines and GSUB sequences rather than
color bitmap dependencies. Its internal ID is `noto-emoji`; the shared alias is
`LivemarkPoster_noto-emoji`. The source, checksum, and derivation are recorded in
the manifest, and `noto-emoji-OFL.txt` accompanies it. A CanvasKit CPU paragraph
render was checked for a face, music note, microphone, ticket, variation-selector
heart, family ZWJ sequence, and skin-tone sequence. This does not establish full
Unicode emoji coverage or equivalence to the platform's color emoji.

## Static instances

The upstream Noto Sans/Serif, Space Grotesk, Cormorant, Playfair, and Caveat files
are variable TTFs. Their default weights are not all 400. React Native Skia's
typeface loader exposes the default instance, while browsers can select a
different axis value. To keep measurement and painting consistent, these files
are full-glyph static 400/700 instances made with fonttools 4.65.0:

```python
font = TTFont(upstream_path)
instance = instantiateVariableFont(
    font, {"wght": 400}, inplace=False, optimize=True, updateFontNames=True
)
instance.save(output_path)
```

Repeat for 700. The original downloaded font checksum is retained as
`upstreamSha256`; each output's checksum is recorded in `instances`. WenKai and
XiaoWei are unmodified upstream static fonts. No font contains the reserved
family name `Source` in a newly named derivative.

## Browser integration

Copy this folder as `fonts/` beside the standalone editor. Register both
`file` and optional `boldFile` with the catalog alias and explicit FontFace
weights 400/700. Await the font and its `posterFontChain()` before measuring or
drawing. Use `posterFontWeight()` to avoid synthesized weights unavailable in
Skia. Fonts selected by built-in IDs do not need to be embedded again in every
template; imported fonts are embedded in `fontAssets` and additionally cached in
the app's documents directory.

Imported single-face fonts keep their actual default weight. The original
font's license and redistribution permission remain applicable when sharing a
template containing that font.
