// Template-only format fixtures. No user records or media are loaded or exported.
(function (global) {
  'use strict';
  const LM = global.LMCore;
  const ACCENTS = [
    { id: '鸢尾紫', hex: '#bba7ef', deep: '#6e58a8' },
    { id: '苔藓绿', hex: '#d8eb97', deep: '#5e7a32' },
    { id: '珊瑚橘', hex: '#f4ab8e', deep: '#c2603a' },
    { id: '远山蓝', hex: '#adcfe5', deep: '#3e6e8e' },
  ];
  const base = {
    id: '00000000-0000-4000-8000-000000000001',
    title: '活动名称', subtitle: '副标题内容', performers: '演出者名称', kindName: '演出', kindEnglish: 'EVENT',
    date: new Date('2026-01-01T19:30:00'), hasConfirmedDate: true, hasConfirmedTime: true,
    city: '城市', venue: '场馆名称', seat: '座位内容', price: 100, currency: 'CNY', companions: '同行人',
    rating: 5, mood: '开心', note: '这里是感想内容，用于查看文字的字号、行距与换行。', quote: '这里是一句金句。', setlist: ['曲目一', '曲目二', '曲目三'],
  };
  const RECORDS = [
    { label: '常规内容', record: base },
    { label: '长内容 · 检查换行', record: { ...base, title: '较长的活动名称，用于检查换行和模块高度', venue: '较长的场馆名称与具体地点', note: '较长的感想内容，用于检查自动行高与后续模块的跟随位置。'.repeat(8), quote: '较长的金句示例，检查不同列宽下的文字效果。' } },
    { label: '缺省内容 · 检查收起', record: { ...base, subtitle: '', performers: '', city: '', venue: '', seat: '', price: 0, companions: '', rating: 0, mood: '', note: '', quote: '', setlist: [] } },
  ];
  const accentByID = id => ACCENTS.find(value => value.id === id) || ACCENTS[0];
  function defaultPreview() { return { sample: 0, accent: '鸢尾紫', author: '署名', options: LM.defaultPosterOptions() }; }
  function context(preview) {
    const record = (RECORDS[preview.sample] || RECORDS[0]).record, accent = accentByID(preview.accent);
    const options = { ...LM.defaultPosterOptions(), showDate: true, showVenue: true, showRating: true, showQuote: true, showNote: true, showSetlist: true, showAuthor: true, showPrice: true, showSeat: true, showCompanions: true, locale: 'zh-Hans' };
    return { bits: LM.makeCardBits(record, options, '署名'), accent: LM.colorFromHexString(accent.hex), deep: LM.colorFromHexString(accent.deep), cover: { source: null, artwork: null, title: '封面占位' } };
  }
  global.LMSample = { ACCENTS, RECORDS, defaultPreview, context, accentByID };
})(window);
