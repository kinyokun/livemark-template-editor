// 预览用的内容：四条示例记录、六张示意封面、主题色，以及「分享开关」。
//
// 和 App 的关系：记录一进海报就被收窄成 `PosterRecord`（core.js 里的类型），
// 取值、收起、日期写法全部交给 `makeCardBits` / `templateText` —— 也就是 App 自己
// 那份代码。这里只负责提供素材，不再重写一遍取值规则。
(function (global) {
  'use strict';

  var LM = global.LMCore;

  // MARK: - 主题色（对应 App 的 AccentTheme）

  var ACCENTS = [
    { id: '鸢尾紫', hex: '#bba7ef', deep: '#6e58a8' },
    { id: '苔藓绿', hex: '#d8eb97', deep: '#5e7a32' },
    { id: '珊瑚橘', hex: '#f4ab8e', deep: '#c2603a' },
    { id: '远山蓝', hex: '#adcfe5', deep: '#3e6e8e' },
  ];

  function accentByID(id) {
    for (var i = 0; i < ACCENTS.length; i++) if (ACCENTS[i].id === id) return ACCENTS[i];
    return ACCENTS[0];
  }

  // MARK: - 示例记录

  function sampleDate(days, hour, minute) {
    var d = new Date();
    d.setDate(d.getDate() - days);
    d.setHours(hour, minute, 0, 0);
    return d;
  }

  function sampleID(n) {
    return '00000000-0000-4000-8000-' + String(n).padStart(12, '0');
  }

  var RECORDS = [
    {
      key: 'sunset', cover: 'sunset',
      record: {
        id: sampleID(1),
        title: '落日飞车', subtitle: '让浪漫发生 · 夏夜特别场',
        performers: '落日飞车 Sunset Rollercoaster',
        kindName: 'Livehouse', kindEnglish: 'LIVE',
        date: sampleDate(3, 19, 30), hasConfirmedDate: true, hasConfirmedTime: true,
        city: '上海', venue: '万代南梦宫上海文化中心',
        seat: '一层 · 站席', price: 380, currency: 'CNY', companions: '一起听歌的人',
        rating: 5, mood: '沉醉',
        note: '灯暗下来的那一秒，整个世界只剩下音乐。\n\n最后一首歌响起的时候，忽然想把这个夏天再过一遍。',
        quote: '把夏天调成慢速播放。',
        setlist: ['My Jinji', 'Burgundy Red', 'Vanilla', 'Candlelight'],
      },
    },
    {
      key: 'orbit', cover: 'orbit',
      record: {
        id: sampleID(2),
        title: '星际穿越', subtitle: 'INTERSTELLAR · 4K 重映',
        performers: 'Matthew McConaughey / Anne Hathaway',
        kindName: '电影', kindEnglish: 'FILM',
        date: sampleDate(8, 19, 30), hasConfirmedDate: true, hasConfirmedTime: true,
        city: '上海', venue: '上海影城',
        seat: '8 排 12 座', price: 85, currency: 'CNY', companions: '',
        rating: 5, mood: '震撼',
        note: '在巨大的银幕前，我们都是宇宙里小小的一颗尘埃。',
        quote: '爱是我们能够感知的，超越时空维度的东西。',
        setlist: [],
      },
    },
    {
      key: 'curtain', cover: 'curtain',
      record: {
        id: sampleID(3),
        title: '睡不醒的梦', subtitle: '2026 巡演 · 杭州站',
        performers: '余响实验剧团',
        kindName: '戏剧', kindEnglish: 'THEATRE',
        date: sampleDate(17, 19, 30), hasConfirmedDate: true, hasConfirmedTime: true,
        city: '杭州', venue: '杭州大剧院',
        seat: '池座 5 排 8 座', price: 280, currency: 'CNY', companions: '',
        rating: 4, mood: '回味',
        note: '散场之后，沿着河边走了很久。故事还没有结束。',
        quote: '有些相遇，像梦里亮着的一盏灯。',
        setlist: [],
      },
    },
    {
      key: 'bloom', cover: 'bloom',
      record: {
        id: sampleID(4),
        title: '春日漫游音乐节', subtitle: '双日通票 · 苏州站',
        performers: '',
        kindName: '音乐节', kindEnglish: 'FESTIVAL',
        date: sampleDate(-14, 19, 30), hasConfirmedDate: true, hasConfirmedTime: true,
        city: '苏州', venue: '太湖音乐营地',
        seat: '', price: 399, currency: 'CNY', companions: '',
        rating: 0, mood: '期待',
        note: '', quote: '', setlist: [],
      },
    },
  ];

  var COVER_KEYS = ['sunset', 'orbit', 'curtain', 'bloom', 'geometry', 'wave', '无封面'];

  // MARK: - 预览设置

  function defaultPreview() {
    return {
      sample: 0,
      cover: null,          // null = 跟着示例记录走
      accent: '鸢尾紫',
      author: '我',
      headline: '',
      options: LM.defaultPosterOptions(),
    };
  }

  /// 预览设置 → `CardContext`：海报要的全部上下文。
  function context(preview) {
    var entry = RECORDS[preview.sample] || RECORDS[0];
    var accent = accentByID(preview.accent);
    var coverKey = preview.cover === null || preview.cover === undefined ? entry.cover : preview.cover;
    var data = coverKey === '无封面' ? null : (global.LIVEMARK_COVERS || {})[coverKey];
    var options = Object.assign({}, preview.options, { locale: 'zh-Hans' });
    return {
      bits: LM.makeCardBits(entry.record, options, preview.author),
      accent: LM.colorFromHexString(accent.hex) || LM.Palette.lilac,
      deep: LM.colorFromHexString(accent.deep) || LM.Palette.ink,
      cover: {
        // 封面也走 `SceneImageSource`：key 是图片缓存的键，uri 是 data URL。
        source: data ? { key: 'cover:' + coverKey, digest: coverKey, uri: data } : null,
        artwork: coverKey === '无封面' ? entry.cover : coverKey,
        title: entry.record.title,
      },
    };
  }

  /// 「分享开关」：和 App 的分享工坊一一对应，私人的三项默认关着。
  var TOGGLES = [
    { key: 'showDate', label: '日期' },
    { key: 'showVenue', label: '地点' },
    { key: 'showRating', label: '评分与心情' },
    { key: 'showQuote', label: '金句' },
    { key: 'showNote', label: '感想' },
    { key: 'showSetlist', label: '曲目单' },
    { key: 'showAuthor', label: '署名' },
    { key: 'showPrice', label: '票价', private: true },
    { key: 'showSeat', label: '座位', private: true },
    { key: 'showCompanions', label: '同行人', private: true },
  ];

  global.LMSample = {
    ACCENTS: ACCENTS,
    RECORDS: RECORDS,
    COVER_KEYS: COVER_KEYS,
    TOGGLES: TOGGLES,
    defaultPreview: defaultPreview,
    context: context,
    accentByID: accentByID,
  };
})(window);
