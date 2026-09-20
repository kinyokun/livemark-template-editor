// 由 scripts/build_web_editor.js 从 App 的 TypeScript 源码生成，不要手改。
// 源文件：src/core/models.ts、src/core/uuid.ts、src/core/sha256.ts、src/core/customFields.ts、src/core/template/canvas.ts、src/core/template/grid.ts、src/core/template/canvasLayout.ts、src/core/template/fontCatalog.ts、src/core/template/model.ts、src/core/template/layout.ts、src/core/template/document.ts、src/core/template/builtins.ts、src/features/share/scene.ts
//
// 浏览器里用 window.LMCore 拿到它们的全部导出（同名的按 core/models → core/customFields → core/template/fontCatalog → core/template/canvas → core/template/model → core/template/layout → core/template/document → core/template/builtins → share/scene 覆盖）。
(function (global) {
  'use strict';

  var ALIASES = {
    "@/core/uuid": "core/uuid",
    "@/core/template/model": "core/template/model",
    "@/core/template/layout": "core/template/layout",
    "@/core/template/document": "core/template/document",
    "@/core/template/builtins": "core/template/builtins",
    "@/core/labels": "shims/labels",
    "@/core/models": "core/models",
    "@/core/customFields": "core/customFields",
    "@/i18n": "shims/i18n"
  };
  var factories = {};
  var cache = {};

  function define(id, factory) { factories[id] = factory; }

  function join(from, request) {
    var parts = from.split('/').slice(0, -1).concat(request.split('/'));
    var stack = [];
    for (var i = 0; i < parts.length; i++) {
      var part = parts[i];
      if (part === '.' || part === '') continue;
      if (part === '..') { stack.pop(); continue; }
      stack.push(part);
    }
    return stack.join('/');
  }

  function requireFrom(from) {
    return function (request) {
      var id = request.charAt(0) === '.' ? join(from, request) : (ALIASES[request] || request);
      if (cache[id]) return cache[id].exports;
      var factory = factories[id];
      if (!factory) throw new Error('模块找不到：' + request + '（来自 ' + from + '）');
      var module = { exports: {} };
      cache[id] = module;
      factory(module, module.exports, requireFrom(id));
      return module.exports;
    };
  }

  define("core/models", function (module, exports, require) {
    "use strict";
    // 档案里的模型。对应 Swift 的 `Encore/Core/Models.swift` 与 `Encore/Core/RecordType.swift`
    // （以及 `SetlistTrack.swift`、`EventReminder.swift`、`VenueLocation.swift`、`Places.swift`
    // 里那几个随记录一起存的小类型）。
    //
    // 硬约束：
    // - 枚举的原始值是中文，存储时保持中文原文。
    // - 可选字段用 `undefined` 表示 Swift 的 `nil`；编码时那个键直接不出现。
    // - 二进制用 `Uint8Array`；编码成 base64（见 archive.ts）。
    // - 这一层不 import react / react-native / expo，也不做文件 IO。
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BUILT_IN_CATALOG = exports.RECORD_FIELDS = exports.RecordField = exports.ARCHIVE_VERSION = exports.LEGACY_SIGNATURE = exports.SHARE_STYLES = exports.ShareStyle = exports.APPEARANCES = exports.Appearance = exports.SWIFT_GALLERY_LAYOUTS = exports.GALLERY_LAYOUTS = exports.GalleryLayout = exports.TILE_FIELDS = exports.TileField = exports.ACCENT_THEMES = exports.AccentTheme = exports.SETLIST_PREVIEW_COUNT = exports.RECENT_VENUE_LIMIT = exports.EVENT_REMINDER_PURPOSES = exports.EventReminderPurpose = exports.COVER_ARTS = exports.CoverArt = exports.RECORD_STATUSES = exports.RecordStatus = exports.EVENT_KINDS = exports.EventKind = void 0;
    exports.isEventKind = isEventKind;
    exports.eventKindSymbol = eventKindSymbol;
    exports.eventKindEnglish = eventKindEnglish;
    exports.isRecordStatus = isRecordStatus;
    exports.isCoverArt = isCoverArt;
    exports.eventKindArtwork = eventKindArtwork;
    exports.venueHasCoordinate = venueHasCoordinate;
    exports.venueQuery = venueQuery;
    exports.placeNameKey = placeNameKey;
    exports.sanitizeRecentVenues = sanitizeRecentVenues;
    exports.addingRecentVenue = addingRecentVenue;
    exports.makeEventRecord = makeEventRecord;
    exports.makeExtraField = makeExtraField;
    exports.makeMemoryPhoto = makeMemoryPhoto;
    exports.makeEventReminder = makeEventReminder;
    exports.hasConfirmedDate = hasConfirmedDate;
    exports.hasConfirmedTime = hasConfirmedTime;
    exports.acceptsReminders = acceptsReminders;
    exports.locationLine = locationLine;
    exports.searchableText = searchableText;
    exports.eventTimeZoneOffsetSeconds = eventTimeZoneOffsetSeconds;
    exports.eventDateParts = eventDateParts;
    exports.calendarDay = calendarDay;
    exports.startsBy = startsBy;
    exports.setlistTrackLine = setlistTrackLine;
    exports.setlistTrackNumber = setlistTrackNumber;
    exports.setlistPreview = setlistPreview;
    exports.reconcileSetlist = reconcileSetlist;
    exports.songs = songs;
    exports.isValidLink = isValidLink;
    exports.setlistLink = setlistLink;
    exports.isAccentTheme = isAccentTheme;
    exports.accentHex = accentHex;
    exports.accentDeepHex = accentDeepHex;
    exports.accentTintHex = accentTintHex;
    exports.isTileField = isTileField;
    exports.tileFieldSymbol = tileFieldSymbol;
    exports.isSwiftGalleryLayout = isSwiftGalleryLayout;
    exports.isGalleryLayout = isGalleryLayout;
    exports.galleryLayoutSymbol = galleryLayoutSymbol;
    exports.tileFieldsAvailable = tileFieldsAvailable;
    exports.isAppearance = isAppearance;
    exports.isShareStyle = isShareStyle;
    exports.shareStyleSymbol = shareStyleSymbol;
    exports.shareStyleTagline = shareStyleTagline;
    exports.makeShareOptions = makeShareOptions;
    exports.makeAppSettings = makeAppSettings;
    exports.normalizeTileFields = normalizeTileFields;
    exports.galleryOf = galleryOf;
    exports.withGallery = withGallery;
    exports.fieldsFor = fieldsFor;
    exports.setFieldsFor = setFieldsFor;
    exports.makeArchive = makeArchive;
    exports.isRecordField = isRecordField;
    exports.recordFieldTitle = recordFieldTitle;
    exports.recordFieldSymbol = recordFieldSymbol;
    exports.recordFieldIsMoney = recordFieldIsMoney;
    exports.recordFieldIsPrivate = recordFieldIsPrivate;
    exports.recordFieldIsOptionalMoney = recordFieldIsOptionalMoney;
    exports.recordHasField = recordHasField;
    exports.isFallbackType = isFallbackType;
    exports.makeRecordType = makeRecordType;
    exports.copyRecordType = copyRecordType;
    exports.builtInTypeID = builtInTypeID;
    exports.defaultFields = defaultFields;
    exports.builtInRecordType = builtInRecordType;
    exports.builtInRecordTypes = builtInRecordTypes;
    exports.sanitizeRecordType = sanitizeRecordType;
    exports.recordTypeShows = recordTypeShows;
    exports.recordTypeEquals = recordTypeEquals;
    exports.makeRecordTypeCatalog = makeRecordTypeCatalog;
    exports.catalogPresets = catalogPresets;
    exports.catalogIsHidden = catalogIsHidden;
    exports.catalogFallbackKind = catalogFallbackKind;
    exports.catalogType = catalogType;
    exports.catalogResolve = catalogResolve;
    exports.catalogBuiltIn = catalogBuiltIn;
    const uuid_1 = require("./uuid");
    // MARK: - EventKind
    exports.EventKind = {
        concert: '演唱会',
        film: '电影',
        theatre: '戏剧',
        musical: '音乐剧',
        live: 'Livehouse',
        festival: '音乐节',
        exhibition: '展览',
        other: '其他',
    };
    /** `EventKind.allCases` 的顺序。 */
    exports.EVENT_KINDS = [
        exports.EventKind.concert,
        exports.EventKind.film,
        exports.EventKind.theatre,
        exports.EventKind.musical,
        exports.EventKind.live,
        exports.EventKind.festival,
        exports.EventKind.exhibition,
        exports.EventKind.other,
    ];
    function isEventKind(value) {
        return typeof value === 'string' && exports.EVENT_KINDS.includes(value);
    }
    const KIND_SYMBOLS = {
        演唱会: 'waveform',
        电影: 'film',
        戏剧: 'theatermasks',
        音乐剧: 'music.note',
        Livehouse: 'guitars',
        音乐节: 'sun.max',
        展览: 'photo.artframe',
        其他: 'sparkles',
    };
    const KIND_ENGLISH = {
        演唱会: 'CONCERT',
        电影: 'FILM',
        戏剧: 'THEATRE',
        音乐剧: 'MUSICAL',
        Livehouse: 'LIVE',
        音乐节: 'FESTIVAL',
        展览: 'EXHIBITION',
        其他: 'EVENT',
    };
    function eventKindSymbol(kind) {
        return KIND_SYMBOLS[kind];
    }
    function eventKindEnglish(kind) {
        return KIND_ENGLISH[kind];
    }
    // MARK: - RecordStatus
    exports.RecordStatus = {
        attended: '看过',
        upcoming: '待赴约',
        wishlist: '心愿单',
        cancelled: '已取消',
    };
    exports.RECORD_STATUSES = [
        exports.RecordStatus.attended,
        exports.RecordStatus.upcoming,
        exports.RecordStatus.wishlist,
        exports.RecordStatus.cancelled,
    ];
    function isRecordStatus(value) {
        return typeof value === 'string' && exports.RECORD_STATUSES.includes(value);
    }
    // MARK: - CoverArt
    exports.CoverArt = {
        orbit: 'orbit',
        bloom: 'bloom',
        curtain: 'curtain',
        wave: 'wave',
        sunset: 'sunset',
        geometry: 'geometry',
    };
    exports.COVER_ARTS = [
        exports.CoverArt.orbit,
        exports.CoverArt.bloom,
        exports.CoverArt.curtain,
        exports.CoverArt.wave,
        exports.CoverArt.sunset,
        exports.CoverArt.geometry,
    ];
    function isCoverArt(value) {
        return typeof value === 'string' && exports.COVER_ARTS.includes(value);
    }
    /** 新建这一种记录时的默认封面插画（Swift `EventKind.artwork`）。 */
    function eventKindArtwork(kind) {
        switch (kind) {
            case exports.EventKind.film:
                return exports.CoverArt.orbit;
            case exports.EventKind.theatre:
            case exports.EventKind.musical:
                return exports.CoverArt.curtain;
            case exports.EventKind.exhibition:
                return exports.CoverArt.geometry;
            case exports.EventKind.festival:
                return exports.CoverArt.bloom;
            default:
                return exports.CoverArt.wave;
        }
    }
    exports.EventReminderPurpose = {
        start: '开演',
        ticketSale: '抢票',
        other: '其他',
    };
    exports.EVENT_REMINDER_PURPOSES = [
        exports.EventReminderPurpose.start,
        exports.EventReminderPurpose.ticketSale,
        exports.EventReminderPurpose.other,
    ];
    function venueHasCoordinate(location) {
        return location.latitude !== undefined && location.longitude !== undefined;
    }
    /** `[城市, 场馆]` 去空白后用空格连起来，两端共用同一把尺。 */
    function venueQuery(city, venue) {
        return [city, venue]
            .map((value) => value.trim())
            .filter((value) => value.length > 0)
            .join(' ');
    }
    /** 名字折叠：大小写与全角半角算同一个地点（Swift `ArtistName.key`）。 */
    function placeNameKey(name) {
        return name.trim().normalize('NFKC').toLowerCase();
    }
    /** 最多留几条最近场馆。 */
    exports.RECENT_VENUE_LIMIT = 20;
    /** 空名字丢掉、折叠后重名只留第一条、最多 20 条；`undefined` 原样返回。 */
    function sanitizeRecentVenues(list) {
        var _a;
        if (list === undefined)
            return undefined;
        const seen = new Set();
        const kept = [];
        for (const item of list) {
            const name = ((_a = item === null || item === void 0 ? void 0 : item.name) !== null && _a !== void 0 ? _a : '').trim();
            const key = placeNameKey(name);
            if (key.length === 0 || seen.has(key))
                continue;
            seen.add(key);
            kept.push({ name });
            if (kept.length === exports.RECENT_VENUE_LIMIT)
                break;
        }
        return kept;
    }
    /** 刚用过的场馆放到最前面。 */
    function addingRecentVenue(name, list) {
        var _a;
        const trimmed = name.trim();
        const key = placeNameKey(trimmed);
        if (key.length === 0)
            return list;
        const existing = (_a = sanitizeRecentVenues(list)) !== null && _a !== void 0 ? _a : [];
        return [{ name: trimmed }, ...existing.filter((item) => placeNameKey(item.name) !== key)].slice(0, exports.RECENT_VENUE_LIMIT);
    }
    /** 新记录的全部默认值，和 Swift 的属性默认值一一对应。 */
    function makeEventRecord(overrides = {}, options = {}) {
        var _a, _b;
        const newID = (_a = options.newID) !== null && _a !== void 0 ? _a : uuid_1.randomUUID;
        const now = (_b = options.now) !== null && _b !== void 0 ? _b : (() => new Date());
        const stamp = now();
        return {
            id: newID(),
            title: '',
            subtitle: '',
            kind: exports.EventKind.concert,
            status: exports.RecordStatus.attended,
            date: stamp,
            city: '',
            venue: '',
            seat: '',
            currency: 'CNY',
            performers: '',
            director: '',
            durationMinutes: 0,
            language: '',
            format: '',
            companions: '',
            rating: 0,
            mood: '',
            note: '',
            quote: '',
            setlist: '',
            reminders: [],
            tags: [],
            collection: '',
            sourceURL: '',
            sourceName: '',
            coverURL: '',
            artwork: exports.CoverArt.orbit,
            photos: [],
            extraFields: [],
            favorite: false,
            createdAt: stamp,
            updatedAt: stamp,
            ...overrides,
        };
    }
    function makeExtraField(overrides = {}, options = {}) {
        var _a;
        return { id: ((_a = options.newID) !== null && _a !== void 0 ? _a : uuid_1.randomUUID)(), key: '', value: '', ...overrides };
    }
    function makeMemoryPhoto(overrides = {}, options = {}) {
        var _a;
        return {
            id: ((_a = options.newID) !== null && _a !== void 0 ? _a : uuid_1.randomUUID)(),
            data: new Uint8Array(0),
            caption: '',
            ...overrides,
        };
    }
    function makeEventReminder(overrides, options = {}) {
        var _a;
        return {
            id: ((_a = options.newID) !== null && _a !== void 0 ? _a : uuid_1.randomUUID)(),
            purpose: exports.EventReminderPurpose.start,
            enabled: true,
            ...overrides,
        };
    }
    // MARK: - EventRecord 的派生量
    function hasConfirmedDate(record) {
        return record.dateUnconfirmed !== true;
    }
    function hasConfirmedTime(record) {
        return hasConfirmedDate(record) && record.timeUnconfirmed !== true;
    }
    function acceptsReminders(record) {
        return record.status === exports.RecordStatus.upcoming || record.status === exports.RecordStatus.wishlist;
    }
    function locationLine(record) {
        return [record.city, record.venue].filter((value) => value.length > 0).join(' · ');
    }
    function searchableText(record) {
        return [
            record.title,
            record.subtitle,
            record.city,
            record.venue,
            record.performers,
            record.director,
            record.note,
            record.quote,
            record.collection,
            record.companions,
            record.kind,
            ...record.tags,
            ...record.extraFields.flatMap((field) => [field.key, field.value]),
        ].join(' ');
    }
    /** 活动自己的时区偏移（秒）。没有 `sourceUTCOffset` 就是本机时区。 */
    function eventTimeZoneOffsetSeconds(record, at = record.date) {
        if (record.sourceUTCOffset !== undefined && Number.isFinite(record.sourceUTCOffset)) {
            return record.sourceUTCOffset;
        }
        // JS 的 getTimezoneOffset 是「本地减 UTC 的负数分钟」。
        return -at.getTimezoneOffset() * 60;
    }
    /** 一个时刻在活动时区里的年月日时分秒。 */
    function eventDateParts(record, value = record.date) {
        if (record.sourceUTCOffset === undefined || !Number.isFinite(record.sourceUTCOffset)) {
            return {
                year: value.getFullYear(),
                month: value.getMonth() + 1,
                day: value.getDate(),
                hour: value.getHours(),
                minute: value.getMinutes(),
                second: value.getSeconds(),
            };
        }
        const shifted = new Date(value.getTime() + record.sourceUTCOffset * 1000);
        return {
            year: shifted.getUTCFullYear(),
            month: shifted.getUTCMonth() + 1,
            day: shifted.getUTCDate(),
            hour: shifted.getUTCHours(),
            minute: shifted.getUTCMinutes(),
            second: shifted.getUTCSeconds(),
        };
    }
    /**
     * 日记里那一天：按**活动时区**取年月日，再按**本机时区**落到当天零点。
     * 在家看一场海外演出时，日历上仍然是当地的那一天。
     */
    function calendarDay(record) {
        const parts = eventDateParts(record);
        return new Date(parts.year, parts.month - 1, parts.day);
    }
    /**
     * 这一场算作开始的时刻。时间没确认时存下来的钟点只是占位，
     * 于是整个活动日都还在前面。
     */
    function startsBy(record) {
        if (hasConfirmedTime(record))
            return record.date;
        const parts = eventDateParts(record);
        const offset = eventTimeZoneOffsetSeconds(record);
        // 活动时区的次日零点。
        const midnightUTC = Date.UTC(parts.year, parts.month - 1, parts.day + 1);
        return new Date(midnightUTC - offset * 1000);
    }
    /** 曲目文本里的一行：换行拍平，两端去空白。 */
    function setlistTrackLine(track) {
        return track.title
            .split(/\r\n|\r|\n/)
            .map((piece) => piece.trim())
            .filter((piece) => piece.length > 0)
            .join(' ');
    }
    /** 行号：补到两位，超过两位不截断。 */
    function setlistTrackNumber(index) {
        return String(index).padStart(2, '0');
    }
    exports.SETLIST_PREVIEW_COUNT = 12;
    function setlistPreview(songs, expanded) {
        return expanded || songs.length <= exports.SETLIST_PREVIEW_COUNT
            ? songs
            : songs.slice(0, exports.SETLIST_PREVIEW_COUNT);
    }
    /**
     * 正在编辑的文本与已保存的曲目配对：匹配上的消耗掉那一条，
     * 于是同一首歌唱两次也分得开。1.8 那种还是地址的行按 `legacyURL` 配。
     */
    function reconcileSetlist(text, saved) {
        const remaining = [...saved];
        const result = [];
        for (const raw of text.split(/\r\n|\r|\n/)) {
            const line = raw.trim();
            if (line.length === 0)
                continue;
            const index = remaining.findIndex((track) => setlistTrackLine(track) === line || track.legacyURL === line);
            if (index >= 0)
                result.push(remaining.splice(index, 1)[0]);
            else
                result.push({ title: line });
        }
        return result;
    }
    function songs(record) {
        var _a;
        return reconcileSetlist(record.setlist, (_a = record.setlistTracks) !== null && _a !== void 0 ? _a : []);
    }
    /** 应用愿意打开的地址：http(s)、有主机名、不带用户名密码（Swift `LinkURL.valid`）。 */
    function isValidLink(value) {
        const match = /^([a-zA-Z][a-zA-Z0-9+.-]*):\/\/([^/?#]*)/.exec(value.trim());
        if (!match)
            return false;
        const scheme = match[1].toLowerCase();
        if (scheme !== 'http' && scheme !== 'https')
            return false;
        const authority = match[2];
        if (authority.includes('@'))
            return false; // 用户名 / 密码
        return authority.length > 0;
    }
    /** 这份曲目是从哪个歌单导入的，且它仍读得出是个能打开的地址。 */
    function setlistLink(record) {
        const value = record.setlistSourceURL;
        if (value === undefined)
            return undefined;
        return isValidLink(value) ? value.trim() : undefined;
    }
    // MARK: - AccentTheme
    exports.AccentTheme = {
        lilac: '鸢尾紫',
        green: '苔藓绿',
        coral: '珊瑚橘',
        blue: '远山蓝',
    };
    exports.ACCENT_THEMES = [
        exports.AccentTheme.lilac,
        exports.AccentTheme.green,
        exports.AccentTheme.coral,
        exports.AccentTheme.blue,
    ];
    function isAccentTheme(value) {
        return typeof value === 'string' && exports.ACCENT_THEMES.includes(value);
    }
    /** 印刷用的主题色（海报、回顾卡、导出、小组件）。 */
    const ACCENT_HEX = {
        鸢尾紫: '#bba7ef',
        苔藓绿: '#d8eb97',
        珊瑚橘: '#f4ab8e',
        远山蓝: '#adcfe5',
    };
    /** 同色相的深一档，纸上能当字和线（Swift `AccentTheme.deepHex`）。 */
    const ACCENT_DEEP_HEX = {
        鸢尾紫: '#6e58a8',
        苔藓绿: '#5e7a32',
        珊瑚橘: '#c2603a',
        远山蓝: '#3e6e8e',
    };
    /**
     * 界面上的强调色（导航按钮、链接行、开关、统计柱）：浅色一档、深色一档。
     * 浅色下珊瑚橘与苔藓绿比 `deep` 再深一点，是为了正文大小的对比度。
     * 对应 Swift `AccentTheme.tintUIColor`。
     */
    const ACCENT_TINT = {
        鸢尾紫: { light: '#6e58a8', dark: '#b3a0ea' },
        苔藓绿: { light: '#5b7631', dark: '#a8c47a' },
        珊瑚橘: { light: '#af5634', dark: '#ee9a7c' },
        远山蓝: { light: '#3e6e8e', dark: '#8fbad8' },
    };
    function accentHex(accent) {
        return ACCENT_HEX[accent];
    }
    function accentDeepHex(accent) {
        return ACCENT_DEEP_HEX[accent];
    }
    function accentTintHex(accent, scheme) {
        return ACCENT_TINT[accent][scheme];
    }
    // MARK: - TileField / GalleryLayout / Appearance
    exports.TileField = {
        kind: '类型',
        date: '时间',
        city: '城市',
        venue: '场馆',
        title: '标题',
        rating: '评分',
        attended: '已赴约',
        favorite: '喜欢',
        count: '场次',
    };
    exports.TILE_FIELDS = [
        exports.TileField.kind,
        exports.TileField.date,
        exports.TileField.city,
        exports.TileField.venue,
        exports.TileField.title,
        exports.TileField.rating,
        exports.TileField.attended,
        exports.TileField.favorite,
        exports.TileField.count,
    ];
    function isTileField(value) {
        return typeof value === 'string' && exports.TILE_FIELDS.includes(value);
    }
    const TILE_FIELD_SYMBOLS = {
        类型: 'square.grid.2x2',
        时间: 'calendar',
        城市: 'mappin',
        场馆: 'building.2',
        标题: 'text.alignleft',
        评分: 'star',
        已赴约: 'checkmark.seal',
        喜欢: 'heart',
        场次: 'number',
    };
    function tileFieldSymbol(field) {
        return TILE_FIELD_SYMBOLS[field];
    }
    exports.GalleryLayout = {
        grid: '海报墙',
        tickets: '票根剧场',
        showcase: '展柜',
        list: '极简列表',
        calendar: '日历',
        artists: '艺人',
    };
    exports.GALLERY_LAYOUTS = [
        exports.GalleryLayout.grid,
        exports.GalleryLayout.tickets,
        exports.GalleryLayout.showcase,
        exports.GalleryLayout.list,
        exports.GalleryLayout.calendar,
        exports.GalleryLayout.artists,
    ];
    /**
     * 1.9 及更早的 `AppSettings.layout` 只认得这四个。日历与艺人是这一版新增的读法，
     * 各有自己的布尔键（`homeCalendar` / `artistWall`），于是旧版本读到新档案不会整份打不开。
     */
    exports.SWIFT_GALLERY_LAYOUTS = [
        exports.GalleryLayout.grid,
        exports.GalleryLayout.tickets,
        exports.GalleryLayout.showcase,
        exports.GalleryLayout.list,
    ];
    function isSwiftGalleryLayout(value) {
        return typeof value === 'string' && exports.SWIFT_GALLERY_LAYOUTS.includes(value);
    }
    function isGalleryLayout(value) {
        return typeof value === 'string' && exports.GALLERY_LAYOUTS.includes(value);
    }
    const GALLERY_SYMBOLS = {
        海报墙: 'square.grid.2x2',
        票根剧场: 'ticket',
        展柜: 'rectangle.portrait.on.rectangle.portrait.angled',
        极简列表: 'list.bullet',
        日历: 'calendar',
        艺人: 'person.2',
    };
    function galleryLayoutSymbol(layout) {
        return GALLERY_SYMBOLS[layout];
    }
    /** 每种版式上能开能关的项。 */
    function tileFieldsAvailable(layout) {
        switch (layout) {
            case exports.GalleryLayout.grid:
                return [
                    exports.TileField.kind,
                    exports.TileField.date,
                    exports.TileField.city,
                    exports.TileField.title,
                    exports.TileField.rating,
                    exports.TileField.attended,
                    exports.TileField.favorite,
                ];
            case exports.GalleryLayout.artists:
                return [exports.TileField.count];
            // 日历上每一行印的是日记行，印哪几项不由这里开关。
            case exports.GalleryLayout.calendar:
                return [];
            default:
                return [
                    exports.TileField.kind,
                    exports.TileField.date,
                    exports.TileField.city,
                    exports.TileField.venue,
                    exports.TileField.title,
                    exports.TileField.rating,
                    exports.TileField.attended,
                    exports.TileField.favorite,
                ];
        }
    }
    exports.Appearance = {
        light: '纸白',
        dark: '夜幕',
        system: '跟随系统',
    };
    exports.APPEARANCES = [
        exports.Appearance.light,
        exports.Appearance.dark,
        exports.Appearance.system,
    ];
    function isAppearance(value) {
        return typeof value === 'string' && exports.APPEARANCES.includes(value);
    }
    // MARK: - ShareStyle / ShareOptions
    exports.ShareStyle = {
        ticket: '经典票根',
        magazine: '杂志封面',
        cinema: '电影字幕',
        poster: '艺术海报',
        boarding: '登机牌',
        journal: '手帐拼贴',
        vinyl: '黑胶唱片',
        receipt: '回忆小票',
        minimal: '极简留白',
    };
    exports.SHARE_STYLES = [
        exports.ShareStyle.ticket,
        exports.ShareStyle.magazine,
        exports.ShareStyle.cinema,
        exports.ShareStyle.poster,
        exports.ShareStyle.boarding,
        exports.ShareStyle.journal,
        exports.ShareStyle.vinyl,
        exports.ShareStyle.receipt,
        exports.ShareStyle.minimal,
    ];
    function isShareStyle(value) {
        return typeof value === 'string' && exports.SHARE_STYLES.includes(value);
    }
    const SHARE_STYLE_SYMBOLS = {
        经典票根: 'ticket',
        杂志封面: 'book.closed',
        电影字幕: 'film',
        艺术海报: 'photo.artframe',
        登机牌: 'airplane.departure',
        手帐拼贴: 'book.pages',
        黑胶唱片: 'opticaldisc',
        回忆小票: 'receipt',
        极简留白: 'square',
    };
    const SHARE_STYLE_TAGLINES = {
        经典票根: 'ADMIT ONE',
        杂志封面: 'COVER STORY',
        电影字幕: 'NOW SHOWING',
        艺术海报: 'CULTURE CLUB',
        登机牌: 'BOARDING PASS',
        手帐拼贴: 'DEAR DIARY',
        黑胶唱片: 'SIDE A',
        回忆小票: 'PAID IN FULL',
        极简留白: 'THE EDIT',
    };
    function shareStyleSymbol(style) {
        return SHARE_STYLE_SYMBOLS[style];
    }
    function shareStyleTagline(style) {
        return SHARE_STYLE_TAGLINES[style];
    }
    function makeShareOptions(overrides = {}) {
        return {
            style: exports.ShareStyle.ticket,
            accent: exports.AccentTheme.lilac,
            showDate: true,
            showVenue: true,
            showRating: true,
            showNote: true,
            showQuote: true,
            showSetlist: true,
            showAuthor: true,
            showPrice: false,
            showSeat: false,
            showCompanions: false,
            showCustomPrivate: false,
            headline: '',
            ...overrides,
        };
    }
    /** 1.6 及更早发过的默认签名；只有用户自己写的句子才留下。 */
    exports.LEGACY_SIGNATURE = '为值得的瞬间，留一点余响。';
    function makeAppSettings(overrides = {}) {
        return {
            name: '收藏家',
            signature: '',
            accent: exports.AccentTheme.lilac,
            layout: exports.GalleryLayout.grid,
            artistWall: false,
            homeCalendar: false,
            // 没选过就跟着系统走。这只是「键缺席时读什么」：老档案与备份里显式存下的
            // 「纸白」「夜幕」照旧原样读出来（见 `decodeSettingsJSON`），写出去也照旧带这个键。
            appearance: exports.Appearance.system,
            soundEnabled: true,
            hapticsEnabled: true,
            motionEnabled: true,
            showRatings: true,
            listTimeline: true,
            showPinBadge: true,
            gridColumns: 2,
            tileFields: [...exports.TILE_FIELDS],
            ticketFields: [...exports.TILE_FIELDS],
            showcaseFields: [...exports.TILE_FIELDS],
            listFields: [...exports.TILE_FIELDS],
            artistFields: [...exports.TILE_FIELDS],
            osmGeocoding: true,
            defaultKind: exports.EventKind.concert,
            favoriteShareStyle: exports.ShareStyle.ticket,
            remindersEnabled: false,
            reminderHour: 9,
            ...overrides,
        };
    }
    /** 去重并按 `TILE_FIELDS` 的顺序排好，Set 在这一层就是有序数组。 */
    function normalizeTileFields(values) {
        const set = new Set(values);
        return exports.TILE_FIELDS.filter((field) => set.has(field));
    }
    /** 首页现在读的是哪一面墙：`layout`，除非日历或艺人墙开着。 */
    function galleryOf(settings) {
        if (settings.homeCalendar)
            return exports.GalleryLayout.calendar;
        return settings.artistWall ? exports.GalleryLayout.artists : settings.layout;
    }
    /** 设置展示版式，三个键同时保持一致，`layout` 里永远不会留下旧版本读不了的值。 */
    function withGallery(settings, value) {
        const next = {
            ...settings,
            artistWall: value === exports.GalleryLayout.artists,
            homeCalendar: value === exports.GalleryLayout.calendar,
        };
        if (isSwiftGalleryLayout(value))
            next.layout = value;
        return next;
    }
    /** 这一版式现在印哪些项：存下来的那一份与这一版式有的项求交集。 */
    function fieldsFor(settings, layout) {
        const stored = (() => {
            switch (layout) {
                case exports.GalleryLayout.grid:
                    return settings.tileFields;
                case exports.GalleryLayout.tickets:
                    return settings.ticketFields;
                case exports.GalleryLayout.showcase:
                    return settings.showcaseFields;
                case exports.GalleryLayout.list:
                case exports.GalleryLayout.calendar:
                    return settings.listFields;
                case exports.GalleryLayout.artists:
                    return settings.artistFields;
            }
        })();
        const available = new Set(tileFieldsAvailable(layout));
        return normalizeTileFields(stored).filter((field) => available.has(field));
    }
    function setFieldsFor(settings, value, layout) {
        const fields = normalizeTileFields(value);
        switch (layout) {
            case exports.GalleryLayout.grid:
                return { ...settings, tileFields: fields };
            case exports.GalleryLayout.tickets:
                return { ...settings, ticketFields: fields };
            case exports.GalleryLayout.showcase:
                return { ...settings, showcaseFields: fields };
            case exports.GalleryLayout.list:
            case exports.GalleryLayout.calendar:
                return { ...settings, listFields: fields };
            case exports.GalleryLayout.artists:
                return { ...settings, artistFields: fields };
        }
    }
    exports.ARCHIVE_VERSION = 2;
    function makeArchive(overrides = {}) {
        return {
            version: exports.ARCHIVE_VERSION,
            records: [],
            settings: makeAppSettings(),
            hasOnboarded: false,
            isDemo: false,
            ...overrides,
        };
    }
    // MARK: - RecordField
    exports.RecordField = {
        performers: 'performers',
        director: 'director',
        duration: 'duration',
        language: 'language',
        format: 'format',
        endDate: 'endDate',
        seat: 'seat',
        price: 'price',
        facePrice: 'facePrice',
        extraCost: 'extraCost',
        companions: 'companions',
        mood: 'mood',
        quote: 'quote',
        setlist: 'setlist',
        collection: 'collection',
    };
    /** `RecordField.allCases` 的顺序，`sanitizeRecordType` 按它排序。 */
    exports.RECORD_FIELDS = [
        exports.RecordField.performers,
        exports.RecordField.director,
        exports.RecordField.duration,
        exports.RecordField.language,
        exports.RecordField.format,
        exports.RecordField.endDate,
        exports.RecordField.seat,
        exports.RecordField.price,
        exports.RecordField.facePrice,
        exports.RecordField.extraCost,
        exports.RecordField.companions,
        exports.RecordField.mood,
        exports.RecordField.quote,
        exports.RecordField.setlist,
        exports.RecordField.collection,
    ];
    function isRecordField(value) {
        return typeof value === 'string' && exports.RECORD_FIELDS.includes(value);
    }
    const RECORD_FIELD_TITLES = {
        performers: '演出者',
        director: '导演',
        duration: '时长',
        language: '语言',
        format: '版本',
        endDate: '结束时间',
        seat: '座位',
        price: '实付',
        facePrice: '票面价',
        extraCost: '其他花费',
        companions: '同行人',
        mood: '心情',
        quote: '金句',
        setlist: '曲目',
        collection: '专辑',
    };
    const RECORD_FIELD_SYMBOLS = {
        performers: 'person.2',
        director: 'megaphone',
        duration: 'clock',
        language: 'globe',
        format: 'sparkles.tv',
        endDate: 'calendar.badge.plus',
        seat: 'chair',
        price: 'yensign',
        facePrice: 'ticket',
        extraCost: 'tram',
        companions: 'figure.2',
        mood: 'face.smiling',
        quote: 'quote.opening',
        setlist: 'music.note.list',
        collection: 'square.stack',
    };
    function recordFieldTitle(field) {
        return RECORD_FIELD_TITLES[field];
    }
    function recordFieldSymbol(field) {
        return RECORD_FIELD_SYMBOLS[field];
    }
    /** 三个金额。一个分享开关、一个导出开关管全部。 */
    function recordFieldIsMoney(field) {
        return (field === exports.RecordField.price ||
            field === exports.RecordField.facePrice ||
            field === exports.RecordField.extraCost);
    }
    /** 座位、三个金额、同行人：任何输出默认不含。 */
    function recordFieldIsPrivate(field) {
        return field === exports.RecordField.seat || recordFieldIsMoney(field) || field === exports.RecordField.companions;
    }
    /** 要用户自己打开的两个金额，任何类型都不默认提供。 */
    function recordFieldIsOptionalMoney(field) {
        return field === exports.RecordField.facePrice || field === exports.RecordField.extraCost;
    }
    /** 这条记录已经为这个词条填过东西了吗。 */
    function recordHasField(record, field) {
        var _a;
        switch (field) {
            case exports.RecordField.performers:
                return record.performers.length > 0;
            case exports.RecordField.director:
                return record.director.length > 0;
            case exports.RecordField.duration:
                return record.durationMinutes > 0;
            case exports.RecordField.language:
                return record.language.length > 0;
            case exports.RecordField.format:
                return record.format.length > 0;
            case exports.RecordField.endDate:
                return record.endDate !== undefined;
            case exports.RecordField.seat:
                return record.seat.length > 0;
            case exports.RecordField.price:
                return record.price !== undefined;
            case exports.RecordField.facePrice:
                return record.facePrice !== undefined;
            case exports.RecordField.extraCost:
                return record.extraCost !== undefined || ((_a = record.extraCostNote) !== null && _a !== void 0 ? _a : '').length > 0;
            case exports.RecordField.companions:
                return record.companions.length > 0;
            case exports.RecordField.mood:
                return record.mood.length > 0;
            case exports.RecordField.quote:
                return record.quote.length > 0;
            case exports.RecordField.setlist:
                return record.setlist.length > 0;
            case exports.RecordField.collection:
                return record.collection.length > 0;
        }
    }
    /** 唯一不会消失的类型：类型被删掉时记录都回到它这里。 */
    function isFallbackType(type) {
        return type.isBuiltIn && type.base === exports.EventKind.other;
    }
    function makeRecordType(values, options = {}) {
        var _a;
        return {
            id: ((_a = options.newID) !== null && _a !== void 0 ? _a : uuid_1.randomUUID)(),
            isBuiltIn: false,
            artwork: exports.CoverArt.wave,
            fields: [],
            entries: [],
            ...values,
        };
    }
    /** 从预设复制一个用户类型：外观与词条相同，id 是自己的。 */
    function copyRecordType(type, options = {}) {
        var _a;
        return {
            id: ((_a = options.newID) !== null && _a !== void 0 ? _a : uuid_1.randomUUID)(),
            base: type.base,
            isBuiltIn: false,
            name: type.name,
            english: type.english,
            symbol: type.symbol,
            artwork: type.artwork,
            fields: [...type.fields],
            entries: [...type.entries],
        };
    }
    /**
     * 每种内建类型的固定 id：由种类名的 SHA-256 派生（写成版本 5 的形状）。
     * 跨设备与重装保持不变，改过名的内建仍能和指向它的记录对上。
     */
    function builtInTypeID(kind) {
        return (0, uuid_1.derivedUUID)('encore.recordtype.' + kind);
    }
    /** 一种内建类型默认摆出哪些词条。 */
    function defaultFields(kind) {
        const money = [exports.RecordField.seat, exports.RecordField.price, exports.RecordField.companions];
        const feeling = [exports.RecordField.mood, exports.RecordField.quote, exports.RecordField.collection];
        switch (kind) {
            case exports.EventKind.concert:
                return [exports.RecordField.performers, exports.RecordField.endDate, exports.RecordField.setlist, ...money, ...feeling];
            case exports.EventKind.live:
                return [exports.RecordField.performers, exports.RecordField.setlist, ...money, ...feeling];
            case exports.EventKind.festival:
                return [exports.RecordField.performers, exports.RecordField.endDate, exports.RecordField.setlist, ...money, ...feeling];
            case exports.EventKind.film:
                return [
                    exports.RecordField.director,
                    exports.RecordField.performers,
                    exports.RecordField.duration,
                    exports.RecordField.language,
                    exports.RecordField.format,
                    ...money,
                    ...feeling,
                ];
            case exports.EventKind.theatre:
                return [
                    exports.RecordField.performers,
                    exports.RecordField.director,
                    exports.RecordField.duration,
                    exports.RecordField.language,
                    ...money,
                    ...feeling,
                ];
            case exports.EventKind.musical:
                return [
                    exports.RecordField.performers,
                    exports.RecordField.director,
                    exports.RecordField.duration,
                    exports.RecordField.language,
                    exports.RecordField.setlist,
                    ...money,
                    ...feeling,
                ];
            case exports.EventKind.exhibition:
                return [
                    exports.RecordField.duration,
                    exports.RecordField.language,
                    exports.RecordField.endDate,
                    ...money,
                    ...feeling,
                ];
            case exports.EventKind.other:
                return exports.RECORD_FIELDS.filter((field) => !recordFieldIsOptionalMoney(field));
        }
    }
    function builtInRecordType(kind) {
        return {
            id: builtInTypeID(kind),
            base: kind,
            isBuiltIn: true,
            name: kind,
            english: eventKindEnglish(kind),
            symbol: eventKindSymbol(kind),
            artwork: eventKindArtwork(kind),
            fields: defaultFields(kind),
            entries: [],
        };
    }
    function builtInRecordTypes() {
        return exports.EVENT_KINDS.map(builtInRecordType);
    }
    /** 按码点数截断，中日韩字符与 Swift 的 `String.prefix` 结果一致。 */
    function truncate(value, limit) {
        return Array.from(value).slice(0, limit).join('');
    }
    /**
     * 每张卡与每个选择器要排的字都有上限，重复的去掉。
     * 恢复备份前每个类型都过一次这里，`validateArchive` 也按它校验。
     */
    function sanitizeRecordType(type) {
        var _a;
        const name = truncate(type.name.trim(), 12) || type.base;
        const english = truncate(type.english.trim(), 16).toUpperCase() || eventKindEnglish(type.base);
        const symbol = type.symbol.trim().length === 0 ? eventKindSymbol(type.base) : type.symbol;
        const has = new Set(type.fields);
        const fields = exports.RECORD_FIELDS.filter((field) => has.has(field));
        const seen = new Set();
        const entries = [];
        const entryDefinitionIds = [];
        for (const [index, entry] of type.entries.entries()) {
            const value = truncate(entry.trim(), 20);
            if (value.length === 0 || seen.has(value))
                continue;
            seen.add(value);
            entries.push(value);
            if (type.entryDefinitionIds)
                entryDefinitionIds.push((_a = (0, uuid_1.normalizeUUID)(type.entryDefinitionIds[index])) !== null && _a !== void 0 ? _a : (0, uuid_1.derivedUUID)(`livemark.custom-field:${type.id}:${value}`));
            if (entries.length === 8)
                break;
        }
        return { ...type, name, english, symbol, fields, entries, ...(type.entryDefinitionIds ? { entryDefinitionIds } : {}) };
    }
    function recordTypeShows(type, field) {
        return type.fields.includes(field);
    }
    /** 两个类型逐字段相等（`validateArchive` 用它比对 `sanitized`）。 */
    function recordTypeEquals(a, b) {
        return (a.id === b.id &&
            a.base === b.base &&
            a.isBuiltIn === b.isBuiltIn &&
            a.name === b.name &&
            a.english === b.english &&
            a.symbol === b.symbol &&
            a.artwork === b.artwork &&
            a.fields.length === b.fields.length &&
            a.fields.every((field, index) => field === b.fields[index]) &&
            a.entries.length === b.entries.length &&
            a.entries.every((entry, index) => entry === b.entries[index]));
    }
    /**
     * 存下来的类型在前（用户自己的顺序），没动过的内建补在后面。
     * 旧档案解出来正好是那八种。
     */
    function makeRecordTypeCatalog(stored, hidden = undefined) {
        const hiddenSet = new Set(hidden !== null && hidden !== void 0 ? hidden : []);
        const kept = (stored !== null && stored !== void 0 ? stored : []).filter((type) => !(type.isBuiltIn && hiddenSet.has(type.id)));
        const customised = new Set(kept.filter((type) => type.isBuiltIn).map((type) => type.id));
        const missing = builtInRecordTypes().filter((type) => !customised.has(type.id) && !hiddenSet.has(type.id));
        return { types: [...kept, ...missing] };
    }
    exports.BUILT_IN_CATALOG = { types: builtInRecordTypes() };
    /** 新类型能从哪些预设起步：每种内建，带上用户自己的改动。 */
    function catalogPresets(catalog) {
        return exports.EVENT_KINDS.map((kind) => catalogBuiltIn(catalog, kind));
    }
    function catalogIsHidden(catalog, kind) {
        return !catalog.types.some((type) => type.isBuiltIn && type.base === kind);
    }
    /** 类型被删掉时记录落到哪种种类。 */
    function catalogFallbackKind(catalog, kind) {
        return catalogIsHidden(catalog, kind) ? exports.EventKind.other : kind;
    }
    function catalogType(catalog, id) {
        if (id === undefined)
            return undefined;
        return catalog.types.find((type) => type.id === id);
    }
    /** 这条记录用哪个类型画：它指向的那个，否则它这种种类的内建，否则兜底。 */
    function catalogResolve(catalog, record) {
        var _a, _b;
        return ((_b = (_a = catalogType(catalog, record.typeID)) !== null && _a !== void 0 ? _a : catalog.types.find((type) => type.isBuiltIn && type.base === record.kind)) !== null && _b !== void 0 ? _b : builtInRecordType(record.kind));
    }
    /** 某一种种类的内建类型，带上用户改过的名字。 */
    function catalogBuiltIn(catalog, kind) {
        var _a;
        return ((_a = catalog.types.find((type) => type.isBuiltIn && type.base === kind)) !== null && _a !== void 0 ? _a : builtInRecordType(kind));
    }

  });

  define("core/uuid", function (module, exports, require) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isUUID = isUUID;
    exports.normalizeUUID = normalizeUUID;
    exports.uuidFromBytes = uuidFromBytes;
    exports.randomUUID = randomUUID;
    exports.derivedUUID = derivedUUID;
    // UUID：档案里一律是**大写连字符**形式（Swift `UUID.uuidString` 的写法）。
    const sha256_1 = require("./sha256");
    const PATTERN = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i;
    function isUUID(value) {
        return typeof value === 'string' && PATTERN.test(value);
    }
    /** 认得出就返回大写形式，认不出返回 `undefined`（宽松解码用）。 */
    function normalizeUUID(value) {
        return isUUID(value) ? value.toUpperCase() : undefined;
    }
    /** 16 字节转 UUID 字符串。 */
    function uuidFromBytes(bytes) {
        let hex = '';
        for (let i = 0; i < 16; i += 1)
            hex += bytes[i].toString(16).padStart(2, '0').toUpperCase();
        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
    }
    const defaultRandom = () => Math.random();
    /** 版本 4 UUID。 */
    function randomUUID(random = defaultRandom) {
        const bytes = new Uint8Array(16);
        for (let i = 0; i < 16; i += 1)
            bytes[i] = Math.floor(random() * 256) & 0xff;
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        return uuidFromBytes(bytes);
    }
    /**
     * 名字派生的 UUID，和 Swift `RecordType.builtInID` 逐字节一致：
     * SHA-256 取前 16 字节，版本位写 5、variant 位写 RFC 4122。
     *
     * 注意它不是标准的版本 5（标准要先拼命名空间 UUID 再用 SHA-1）；这里照抄
     * Swift 的算法，是为了让内建类型的 id 两端一模一样。
     */
    function derivedUUID(name) {
        const digest = (0, sha256_1.sha256Bytes)((0, sha256_1.utf8Encode)(name)).slice(0, 16);
        digest[6] = (digest[6] & 0x0f) | 0x50;
        digest[8] = (digest[8] & 0x3f) | 0x80;
        return uuidFromBytes(digest);
    }

  });

  define("core/sha256", function (module, exports, require) {
    "use strict";
    // 纯 TypeScript 的 SHA-256。core 层不引入 expo-crypto，所以摘要在这里自己算；
    // 需要平台实现时用 `HashFunction` 注入（见 repository.ts 的 `sha256` 参数）。
    //
    // 对应 Swift 的 `MediaAsset.digest`（`CryptoKit.SHA256`，小写十六进制）。
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.sha256Bytes = sha256Bytes;
    exports.sha256Hex = sha256Hex;
    exports.sha256Text = sha256Text;
    exports.toHex = toHex;
    exports.utf8Encode = utf8Encode;
    exports.utf8Decode = utf8Decode;
    const K = new Uint32Array([
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
    ]);
    const HEX = '0123456789abcdef';
    /** SHA-256 的原始 32 字节。 */
    function sha256Bytes(input) {
        const h = new Uint32Array([
            0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
        ]);
        const length = input.length;
        // 填充：0x80，补零到 56 (mod 64)，再加 8 字节的位长度（大端）。
        const withPadding = (((length + 8) >> 6) + 1) << 6;
        const block = new Uint8Array(withPadding);
        block.set(input);
        block[length] = 0x80;
        const bits = length * 8;
        // 长度最多 2^53，高 32 位用除法算，避免 32 位移位溢出。
        const high = Math.floor(bits / 0x100000000);
        const low = bits >>> 0;
        block[withPadding - 8] = (high >>> 24) & 0xff;
        block[withPadding - 7] = (high >>> 16) & 0xff;
        block[withPadding - 6] = (high >>> 8) & 0xff;
        block[withPadding - 5] = high & 0xff;
        block[withPadding - 4] = (low >>> 24) & 0xff;
        block[withPadding - 3] = (low >>> 16) & 0xff;
        block[withPadding - 2] = (low >>> 8) & 0xff;
        block[withPadding - 1] = low & 0xff;
        const w = new Uint32Array(64);
        for (let offset = 0; offset < withPadding; offset += 64) {
            for (let i = 0; i < 16; i += 1) {
                const j = offset + i * 4;
                w[i] = ((block[j] << 24) | (block[j + 1] << 16) | (block[j + 2] << 8) | block[j + 3]) >>> 0;
            }
            for (let i = 16; i < 64; i += 1) {
                const a = w[i - 15];
                const b = w[i - 2];
                const s0 = (((a >>> 7) | (a << 25)) ^ ((a >>> 18) | (a << 14)) ^ (a >>> 3)) >>> 0;
                const s1 = (((b >>> 17) | (b << 15)) ^ ((b >>> 19) | (b << 13)) ^ (b >>> 10)) >>> 0;
                w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
            }
            let [a, b, c, d, e, f, g, hh] = [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7]];
            for (let i = 0; i < 64; i += 1) {
                const s1 = (((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7))) >>> 0;
                const ch = ((e & f) ^ (~e & g)) >>> 0;
                const t1 = (hh + s1 + ch + K[i] + w[i]) >>> 0;
                const s0 = (((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10))) >>> 0;
                const maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
                const t2 = (s0 + maj) >>> 0;
                hh = g;
                g = f;
                f = e;
                e = (d + t1) >>> 0;
                d = c;
                c = b;
                b = a;
                a = (t1 + t2) >>> 0;
            }
            h[0] = (h[0] + a) >>> 0;
            h[1] = (h[1] + b) >>> 0;
            h[2] = (h[2] + c) >>> 0;
            h[3] = (h[3] + d) >>> 0;
            h[4] = (h[4] + e) >>> 0;
            h[5] = (h[5] + f) >>> 0;
            h[6] = (h[6] + g) >>> 0;
            h[7] = (h[7] + hh) >>> 0;
        }
        const out = new Uint8Array(32);
        for (let i = 0; i < 8; i += 1) {
            out[i * 4] = (h[i] >>> 24) & 0xff;
            out[i * 4 + 1] = (h[i] >>> 16) & 0xff;
            out[i * 4 + 2] = (h[i] >>> 8) & 0xff;
            out[i * 4 + 3] = h[i] & 0xff;
        }
        return out;
    }
    /** 小写十六进制摘要，和 Swift 的 `MediaAsset.digest` 一字不差。 */
    function sha256Hex(input) {
        return toHex(sha256Bytes(input));
    }
    /** UTF-8 文本的摘要。 */
    function sha256Text(text) {
        return sha256Hex(utf8Encode(text));
    }
    function toHex(bytes) {
        let out = '';
        for (let i = 0; i < bytes.length; i += 1) {
            out += HEX[bytes[i] >> 4] + HEX[bytes[i] & 0x0f];
        }
        return out;
    }
    /** UTF-8 编码，不依赖 TextEncoder（RN 老引擎上不保证有）。 */
    function utf8Encode(text) {
        const out = [];
        for (let i = 0; i < text.length; i += 1) {
            let code = text.charCodeAt(i);
            if (code >= 0xd800 && code <= 0xdbff && i + 1 < text.length) {
                const next = text.charCodeAt(i + 1);
                if (next >= 0xdc00 && next <= 0xdfff) {
                    code = (code - 0xd800) * 0x400 + (next - 0xdc00) + 0x10000;
                    i += 1;
                }
            }
            if (code < 0x80)
                out.push(code);
            else if (code < 0x800)
                out.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
            else if (code < 0x10000)
                out.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
            else {
                out.push(0xf0 | (code >> 18), 0x80 | ((code >> 12) & 0x3f), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
            }
        }
        return Uint8Array.from(out);
    }
    /** UTF-8 解码。 */
    function utf8Decode(bytes) {
        let out = '';
        let i = 0;
        while (i < bytes.length) {
            const byte = bytes[i];
            let code;
            if (byte < 0x80) {
                code = byte;
                i += 1;
            }
            else if (byte < 0xe0) {
                code = ((byte & 0x1f) << 6) | (bytes[i + 1] & 0x3f);
                i += 2;
            }
            else if (byte < 0xf0) {
                code = ((byte & 0x0f) << 12) | ((bytes[i + 1] & 0x3f) << 6) | (bytes[i + 2] & 0x3f);
                i += 3;
            }
            else {
                code =
                    ((byte & 0x07) << 18) |
                        ((bytes[i + 1] & 0x3f) << 12) |
                        ((bytes[i + 2] & 0x3f) << 6) |
                        (bytes[i + 3] & 0x3f);
                i += 4;
            }
            if (code > 0xffff) {
                code -= 0x10000;
                out += String.fromCharCode(0xd800 + (code >> 10), 0xdc00 + (code & 0x3ff));
            }
            else {
                out += String.fromCharCode(code);
            }
        }
        return out;
    }

  });

  define("core/customFields", function (module, exports, require) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.customFieldDefinitionId = customFieldDefinitionId;
    exports.typeWithFieldIdentities = typeWithFieldIdentities;
    exports.customFieldsForRecord = customFieldsForRecord;
    exports.ensureCustomFieldDefinitions = ensureCustomFieldDefinitions;
    exports.renamePresetFields = renamePresetFields;
    const models_1 = require("./models");
    const uuid_1 = require("./uuid");
    function customFieldDefinitionId(typeId, name) {
        return (0, uuid_1.derivedUUID)(`livemark.custom-field:${typeId}:${name.trim()}`);
    }
    function typeWithFieldIdentities(type) {
        return { ...type, entryDefinitionIds: type.entries.map((name, index) => { var _a, _b; return (_b = (0, uuid_1.normalizeUUID)((_a = type.entryDefinitionIds) === null || _a === void 0 ? void 0 : _a[index])) !== null && _b !== void 0 ? _b : customFieldDefinitionId(type.id, name); }) };
    }
    /** Legacy names are used once to establish an identity. Existing identities always win. */
    function customFieldsForRecord(record, types, definitions = []) {
        var _a;
        const type = types ? (0, models_1.catalogResolve)(types, record) : undefined;
        const owner = (_a = record.typeID) !== null && _a !== void 0 ? _a : (0, models_1.builtInTypeID)(record.kind);
        const counts = new Map();
        record.extraFields.forEach((field) => { var _a; return counts.set(field.key.trim(), ((_a = counts.get(field.key.trim())) !== null && _a !== void 0 ? _a : 0) + 1); });
        const result = record.extraFields.filter((field) => field.key.trim()).map((field) => {
            var _a, _b, _c, _d;
            const index = (_a = type === null || type === void 0 ? void 0 : type.entries.indexOf(field.key.trim())) !== null && _a !== void 0 ? _a : -1;
            const id = (_b = (0, uuid_1.normalizeUUID)(field.definitionId)) !== null && _b !== void 0 ? _b : (counts.get(field.key.trim()) > 1
                ? (0, uuid_1.derivedUUID)(`livemark.custom-field-instance:${field.id}`)
                : (_d = (index >= 0 ? (0, uuid_1.normalizeUUID)((_c = type === null || type === void 0 ? void 0 : type.entryDefinitionIds) === null || _c === void 0 ? void 0 : _c[index]) : undefined)) !== null && _d !== void 0 ? _d : customFieldDefinitionId(owner, field.key));
            const definition = definitions.find((item) => item.id === id);
            return { id, name: field.key.trim() || (definition === null || definition === void 0 ? void 0 : definition.name) || '', value: field.value,
                isPrivate: field.isPrivate === true || (definition === null || definition === void 0 ? void 0 : definition.isPrivate) === true };
        });
        type === null || type === void 0 ? void 0 : type.entries.forEach((name, index) => {
            var _a, _b, _c;
            const id = (_b = (0, uuid_1.normalizeUUID)((_a = type.entryDefinitionIds) === null || _a === void 0 ? void 0 : _a[index])) !== null && _b !== void 0 ? _b : customFieldDefinitionId(type.id, name);
            if (!result.some((field) => field.id === id || field.name === name)) {
                const definition = definitions.find((item) => item.id === id);
                result.push({ id, name: (_c = definition === null || definition === void 0 ? void 0 : definition.name) !== null && _c !== void 0 ? _c : name, value: '', isPrivate: (definition === null || definition === void 0 ? void 0 : definition.isPrivate) === true });
            }
        });
        return result;
    }
    /** Additive identity backfill; never removes or changes record values. Called inside a save transaction. */
    function ensureCustomFieldDefinitions(archive) {
        var _a, _b, _c;
        const types = (0, models_1.makeRecordTypeCatalog)(archive.recordTypes, archive.hiddenRecordTypes);
        const definitions = new Map(((_a = archive.customFieldDefinitions) !== null && _a !== void 0 ? _a : []).map((item) => [item.id, { ...item }]));
        const upsertType = (type) => {
            const identified = typeWithFieldIdentities(type);
            identified.entries.forEach((name, index) => {
                const id = identified.entryDefinitionIds[index];
                definitions.set(id, { ...definitions.get(id), id, ownerTypeId: type.id, name });
            });
            return identified;
        };
        // Built-in presets need no stored type; their deterministic identities are enough.
        types.types.forEach(upsertType);
        if (archive.recordTypes)
            archive.recordTypes = archive.recordTypes.map(upsertType);
        const bindRecord = (record) => {
            const fields = customFieldsForRecord(record, types, [...definitions.values()]);
            return { ...record, extraFields: record.extraFields.map((field) => {
                    var _a, _b, _c;
                    if (!field.key.trim())
                        return field;
                    const resolved = fields.shift();
                    const previous = definitions.get(resolved.id);
                    definitions.set(resolved.id, { id: resolved.id, ownerTypeId: (_b = (_a = previous === null || previous === void 0 ? void 0 : previous.ownerTypeId) !== null && _a !== void 0 ? _a : record.typeID) !== null && _b !== void 0 ? _b : (0, models_1.builtInTypeID)(record.kind),
                        name: (_c = previous === null || previous === void 0 ? void 0 : previous.name) !== null && _c !== void 0 ? _c : field.key.trim(), ...((previous === null || previous === void 0 ? void 0 : previous.isPrivate) || field.isPrivate ? { isPrivate: true } : {}) });
                    return { ...field, definitionId: resolved.id, ...(resolved.isPrivate ? { isPrivate: true } : {}) };
                }) };
        };
        archive.records = archive.records.map(bindRecord);
        archive.deletedRecords = (_b = archive.deletedRecords) === null || _b === void 0 ? void 0 : _b.map((item) => ({ ...item, record: bindRecord(item.record) }));
        // A private instance discovered later must protect earlier instances in this same save.
        const applyPrivacy = (record) => ({ ...record, extraFields: record.extraFields.map((field) => { var _a; return field.definitionId && ((_a = definitions.get(field.definitionId)) === null || _a === void 0 ? void 0 : _a.isPrivate) ? { ...field, isPrivate: true } : field; }) });
        archive.records = archive.records.map(applyPrivacy);
        archive.deletedRecords = (_c = archive.deletedRecords) === null || _c === void 0 ? void 0 : _c.map((item) => ({ ...item, record: applyPrivacy(item.record) }));
        if (definitions.size)
            archive.customFieldDefinitions = [...definitions.values()];
    }
    /** Rename only untouched preset labels, preserving per-record labels and every value. */
    function renamePresetFields(archive, previous, next) {
        var _a;
        const before = typeWithFieldIdentities(previous);
        const after = typeWithFieldIdentities(next);
        const changes = new Map();
        after.entries.forEach((name, index) => {
            const id = after.entryDefinitionIds[index];
            const oldIndex = before.entryDefinitionIds.indexOf(id);
            if (oldIndex >= 0 && before.entries[oldIndex] !== name)
                changes.set(id, { before: before.entries[oldIndex], after: name });
        });
        const rename = (record) => ({ ...record, extraFields: record.extraFields.map((field) => {
                const change = field.definitionId ? changes.get(field.definitionId) : undefined;
                return change && field.key === change.before ? { ...field, key: change.after } : field;
            }) });
        archive.records = archive.records.map(rename);
        archive.deletedRecords = (_a = archive.deletedRecords) === null || _a === void 0 ? void 0 : _a.map((item) => ({ ...item, record: rename(item.record) }));
    }

  });

  define("core/template/canvas", function (module, exports, require) {
    "use strict";
    var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = { enumerable: true, get: function() { return m[k]; } };
        }
        Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
    }));
    var __exportStar = (this && this.__exportStar) || function(m, exports) {
        for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.canvasElements = canvasElements;
    exports.ensureCanvas = ensureCanvas;
    exports.elementFrame = elementFrame;
    exports.expandSelectionIDs = expandSelectionIDs;
    exports.canvasWorldFrame = canvasWorldFrame;
    exports.moveElements = moveElements;
    exports.resizeElement = resizeElement;
    exports.rotateElements = rotateElements;
    exports.selectionBounds = selectionBounds;
    exports.alignElements = alignElements;
    exports.distributeElements = distributeElements;
    exports.groupElements = groupElements;
    exports.ungroupElements = ungroupElements;
    exports.validateCanvasRelations = validateCanvasRelations;
    exports.setElementFollow = setElementFollow;
    exports.setElementsRegion = setElementsRegion;
    exports.deleteElements = deleteElements;
    exports.duplicateElements = duplicateElements;
    exports.createContentRegion = createContentRegion;
    exports.resizeElements = resizeElements;
    exports.rotateSelection = rotateSelection;
    /** Pure document commands shared by touch and desktop editors. Coordinates are 360pt canvas units. */
    const model_1 = require("./model");
    const grid_1 = require("./grid");
    __exportStar(require("./grid"), exports);
    function canvasElements(template) {
        return template.root.children;
    }
    function ensureCanvas(template) {
        if (template.root.layout === 'canvas')
            return template;
        // v2 documents are deliberately not migrated. Keep identity/name, start a clean canvas.
        const fresh = (0, model_1.defaultTemplate)();
        return { ...fresh, id: template.id, name: template.name, canvas: template.canvas };
    }
    function elementFrame(node) {
        var _a;
        return (_a = node.frame) !== null && _a !== void 0 ? _a : { x: 0, y: 0, width: typeof node.width === 'number' ? node.width : 160,
            height: typeof node.height === 'number' ? node.height : node.kind === 'image' ? 160 : 40 };
    }
    function edit(template, fn) {
        return { ...template, root: { ...template.root, layout: 'canvas', children: template.root.children.map(fn) } };
    }
    function expandSelectionIDs(template, ids) {
        const wanted = new Set(ids);
        const groups = new Set(canvasElements(template).filter(n => wanted.has(n.id) && n.groupId).map(n => n.groupId));
        for (const node of canvasElements(template))
            if (node.groupId && groups.has(node.groupId))
                wanted.add(node.id);
        return [...wanted];
    }
    function movableSelection(template, ids) {
        const selected = new Set(expandSelectionIDs(template, ids));
        return new Set(canvasElements(template).filter(n => selected.has(n.id) && !n.locked && !(n.regionId && selected.has(n.regionId))).map(n => n.id));
    }
    function regionAngle(template, node) {
        var _a, _b;
        return node.regionId ? (_b = (_a = canvasElements(template).find(n => n.id === node.regionId)) === null || _a === void 0 ? void 0 : _a.rotation) !== null && _b !== void 0 ? _b : 0 : 0;
    }
    function rotateDelta(x, y, degrees) {
        const radians = degrees * Math.PI / 180;
        return { x: x * Math.cos(radians) - y * Math.sin(radians), y: x * Math.sin(radians) + y * Math.cos(radians) };
    }
    /** Same unrotated rectangle about the transformed center used by scene.items. */
    function canvasWorldFrame(template, node, layout) {
        var _a, _b;
        const frame = (_a = layout.byID[node.id]) === null || _a === void 0 ? void 0 : _a.frame;
        const owner = node.regionId ? (_b = layout.byID[node.regionId]) === null || _b === void 0 ? void 0 : _b.frame : undefined;
        if (!frame || !owner)
            return frame;
        const cx = owner.x + owner.width / 2, cy = owner.y + owner.height / 2;
        const delta = rotateDelta(frame.x + frame.width / 2 - cx, frame.y + frame.height / 2 - cy, regionAngle(template, node));
        return { ...frame, x: cx + delta.x - frame.width / 2, y: cy + delta.y - frame.height / 2 };
    }
    function frameFromWorld(template, node, frame, layout) {
        var _a, _b;
        const owner = node.regionId ? (_a = layout.byID[node.regionId]) === null || _a === void 0 ? void 0 : _a.frame : (_b = layout.byID[template.root.id]) === null || _b === void 0 ? void 0 : _b.frame;
        if (!owner)
            return frame;
        const cx = owner.x + owner.width / 2, cy = owner.y + owner.height / 2;
        const delta = rotateDelta(frame.x + frame.width / 2 - cx, frame.y + frame.height / 2 - cy, -regionAngle(template, node));
        return { ...frame, x: cx + delta.x - frame.width / 2 - owner.x, y: cy + delta.y - frame.height / 2 - owner.y };
    }
    function moveElements(template, ids, dx, dy) {
        if (!Number.isFinite(dx) || !Number.isFinite(dy))
            return template;
        const selected = movableSelection(template, ids);
        return edit(template, node => {
            if (!selected.has(node.id))
                return node;
            const frame = elementFrame(node);
            const local = rotateDelta(dx, dy, -regionAngle(template, node));
            // A follower whose target also moves must not receive the vertical delta twice.
            const targetMoves = node.follow && selected.has(node.follow.targetId);
            return { ...node, frame: { ...frame, x: frame.x + local.x, y: node.follow ? frame.y : frame.y + local.y },
                ...(node.follow ? { follow: { ...node.follow, gap: Math.max(0, node.follow.gap + (targetMoves ? 0 : local.y)) } } : {}) };
        });
    }
    function resizeElement(template, id, next, options = {}) {
        const node = canvasElements(template).find(n => n.id === id);
        if (!node || node.locked)
            return template;
        const old = elementFrame(node);
        const frame = { x: Number.isFinite(next.x) ? next.x : old.x, y: Number.isFinite(next.y) ? next.y : old.y,
            width: Math.max(8, Number.isFinite(next.width) ? next.width : old.width),
            height: Math.max(8, Number.isFinite(next.height) ? next.height : old.height) };
        const sx = frame.width / Math.max(1, old.width);
        const sy = node.kind === 'stack' && node.layout === 'grid' ? sx : frame.height / Math.max(1, old.height);
        return edit(template, item => {
            var _a;
            if (item.id === id)
                return { ...item, frame,
                    ...(item.kind === 'stack' && item.layout === 'grid' && item.grid ? { grid: { ...item.grid,
                            columnGap: item.grid.columnGap * sx, rowGap: item.grid.rowGap * sy,
                            rowHeights: (_a = item.grid.rowHeights) === null || _a === void 0 ? void 0 : _a.map(height => height == null ? null : height * sy) } } : {}),
                    ...(item.kind === 'text' && options.scaleText ? { fontSize: Math.max(6, Math.min(120, item.fontSize * sx)) } : {}) };
            if (item.regionId !== id || options.scaleChildren === false)
                return item;
            const f = elementFrame(item);
            return { ...item, frame: { x: f.x * sx, y: f.y * sy, width: f.width * sx, height: f.height * sy },
                ...(item.follow ? { follow: { ...item.follow, gap: item.follow.gap * sy } } : {}),
                ...(item.kind === 'text' && options.scaleText ? { fontSize: Math.max(6, Math.min(120, item.fontSize * sx)) } : {}) };
        });
    }
    function rotateElements(template, ids, degrees) {
        const selected = movableSelection(template, ids);
        return edit(template, n => selected.has(n.id) ? { ...n, rotation: ((degrees + 180) % 360 + 360) % 360 - 180 } : n);
    }
    function selectionBounds(template, ids, layout) {
        const selected = movableSelection(template, ids);
        const frames = canvasElements(template).filter(n => selected.has(n.id)).map(n => canvasWorldFrame(template, n, layout)).filter((f) => !!f);
        if (!frames.length)
            return null;
        const x = Math.min(...frames.map(f => f.x));
        const y = Math.min(...frames.map(f => f.y));
        return { x, y, width: Math.max(...frames.map(f => f.x + f.width)) - x, height: Math.max(...frames.map(f => f.y + f.height)) - y };
    }
    function alignElements(template, ids, mode, layout) {
        const selected = movableSelection(template, ids);
        const bounds = selectionBounds(template, [...selected], layout);
        if (!bounds)
            return template;
        const target = selected.size === 1 ? { x: 0, y: 0, width: model_1.CANVAS_WIDTH, height: layout.height } : bounds;
        return edit(template, node => {
            const world = canvasWorldFrame(template, node, layout);
            if (!selected.has(node.id) || !world)
                return node;
            let dx = 0;
            let dy = 0;
            if (mode === 'left')
                dx = target.x - world.x;
            if (mode === 'center')
                dx = target.x + (target.width - world.width) / 2 - world.x;
            if (mode === 'right')
                dx = target.x + target.width - world.width - world.x;
            if (mode === 'top')
                dy = target.y - world.y;
            if (mode === 'middle')
                dy = target.y + (target.height - world.height) / 2 - world.y;
            if (mode === 'bottom')
                dy = target.y + target.height - world.height - world.y;
            // Alignment is an explicit fixed-position command; preserve actual position when detaching.
            return { ...node, follow: undefined, frame: frameFromWorld(template, node, { ...world, x: world.x + dx, y: world.y + dy }, layout) };
        });
    }
    function distributeElements(template, ids, axis, layout) {
        const selected = movableSelection(template, ids);
        const entries = canvasElements(template).filter(n => selected.has(n.id) && layout.byID[n.id]).map(n => ({ node: n, frame: canvasWorldFrame(template, n, layout) }));
        if (entries.length < 3)
            return template;
        const horizontal = axis === 'horizontal';
        entries.sort((a, b) => horizontal ? a.frame.x - b.frame.x : a.frame.y - b.frame.y);
        const first = entries[0].frame;
        const last = entries[entries.length - 1].frame;
        const length = entries.reduce((sum, e) => sum + (horizontal ? e.frame.width : e.frame.height), 0);
        const gap = ((horizontal ? last.x + last.width - first.x : last.y + last.height - first.y) - length) / (entries.length - 1);
        const positions = new Map();
        let cursor = horizontal ? first.x : first.y;
        for (const e of entries) {
            positions.set(e.node.id, cursor);
            cursor += (horizontal ? e.frame.width : e.frame.height) + gap;
        }
        return edit(template, node => {
            const position = positions.get(node.id);
            if (position === undefined)
                return node;
            const world = canvasWorldFrame(template, node, layout);
            return { ...node, follow: undefined, frame: frameFromWorld(template, node, { ...world,
                    x: horizontal ? position : world.x, y: horizontal ? world.y : position }, layout) };
        });
    }
    function groupElements(template, ids, env) {
        const wanted = movableSelection(template, ids);
        const nodes = canvasElements(template).filter(n => wanted.has(n.id));
        if (nodes.length < 2 || new Set(nodes.map(n => { var _a; return (_a = n.regionId) !== null && _a !== void 0 ? _a : ''; })).size > 1)
            return template;
        const groupId = (0, model_1.resolveEnvironment)(env).newID();
        return edit(template, n => wanted.has(n.id) ? { ...n, groupId } : n);
    }
    function ungroupElements(template, ids) {
        const wanted = new Set(expandSelectionIDs(template, ids));
        return edit(template, n => wanted.has(n.id) ? { ...n, groupId: undefined } : n);
    }
    /** Invalid relationships are rejected at import and never committed by editing commands. */
    function validateCanvasRelations(template) {
        var _a, _b;
        if (template.root.layout !== 'canvas')
            return [];
        const nodes = canvasElements(template);
        const byID = new Map(nodes.map(n => [n.id, n]));
        const errors = [];
        for (const n of nodes) {
            if (n.kind === 'stack' && (!['region', 'grid'].includes((_a = n.layout) !== null && _a !== void 0 ? _a : '') || n.children.length || n.regionId))
                errors.push(`invalid region:${n.id}`);
            if (n.kind === 'stack' && n.layout === 'grid')
                errors.push(...(0, grid_1.validateGrid)(template, n));
            if (n.regionId) {
                const owner = byID.get(n.regionId);
                if (!owner || owner.kind !== 'stack' || !['region', 'grid'].includes((_b = owner.layout) !== null && _b !== void 0 ? _b : ''))
                    errors.push(`missing region:${n.id}`);
            }
            if (n.cell && (!n.regionId || !(0, grid_1.gridLayer)(template, n.regionId)))
                errors.push(`orphan cell:${n.id}`);
            if (n.follow) {
                const target = byID.get(n.follow.targetId);
                if (!target || target.id === n.id || target.regionId !== n.regionId || target.decoration)
                    errors.push(`invalid follow:${n.id}`);
            }
        }
        const done = new Set();
        const visiting = new Set();
        const visit = (id) => {
            var _a, _b;
            if (visiting.has(id)) {
                errors.push(`follow cycle:${id}`);
                return;
            }
            if (done.has(id))
                return;
            visiting.add(id);
            const target = (_b = (_a = byID.get(id)) === null || _a === void 0 ? void 0 : _a.follow) === null || _b === void 0 ? void 0 : _b.targetId;
            if (target && byID.has(target))
                visit(target);
            visiting.delete(id);
            done.add(id);
        };
        nodes.forEach(n => visit(n.id));
        return errors;
    }
    function setElementFollow(template, id, targetId, gap = 12, layout) {
        var _a, _b, _c;
        const node = canvasElements(template).find(n => n.id === id);
        if (!node || node.locked)
            return template;
        const world = (_a = layout === null || layout === void 0 ? void 0 : layout.byID[id]) === null || _a === void 0 ? void 0 : _a.frame;
        const owner = node.regionId ? (_b = layout === null || layout === void 0 ? void 0 : layout.byID[node.regionId]) === null || _b === void 0 ? void 0 : _b.frame : (_c = layout === null || layout === void 0 ? void 0 : layout.byID[template.root.id]) === null || _c === void 0 ? void 0 : _c.frame;
        const next = edit(template, n => {
            var _a, _b;
            return n.id === id ? { ...n, follow: targetId ? { targetId, gap: Math.max(0, gap) } : undefined,
                ...(!targetId && world ? { frame: { ...elementFrame(n), x: world.x - ((_a = owner === null || owner === void 0 ? void 0 : owner.x) !== null && _a !== void 0 ? _a : 0), y: world.y - ((_b = owner === null || owner === void 0 ? void 0 : owner.y) !== null && _b !== void 0 ? _b : 0) } } : {}) } : n;
        });
        return validateCanvasRelations(next).length ? template : next;
    }
    function setElementsRegion(template, ids, regionId, layout) {
        const selected = movableSelection(template, ids);
        const grid = regionId ? (0, grid_1.gridLayer)(template, regionId) : undefined;
        if (grid === null || grid === void 0 ? void 0 : grid.grid) {
            let result = template;
            for (const id of selected) {
                let placed = false;
                for (let row = 0; row < grid.grid.rows && !placed; row++)
                    for (let column = 0; column < grid.grid.columns; column++) {
                        const cell = (0, grid_1.gridCellAt)(grid.grid, row, column);
                        if (cell.row !== row || cell.column !== column)
                            continue;
                        if (result.root.children.some(n => { var _a; return n.regionId === regionId && ((_a = n.cell) === null || _a === void 0 ? void 0 : _a.row) === row && n.cell.column === column; }))
                            continue;
                        const next = (0, grid_1.setGridCell)(result, id, regionId, { row, column });
                        if (next !== result) {
                            result = next;
                            placed = true;
                            break;
                        }
                    }
                if (!placed)
                    return template;
            }
            return result;
        }
        const region = regionId ? canvasElements(template).find(n => n.id === regionId && n.kind === 'stack' && n.layout === 'region') : null;
        if (regionId && !region)
            return template;
        const next = edit(template, n => {
            var _a;
            if (!selected.has(n.id) || n.kind === 'stack')
                return n;
            const world = canvasWorldFrame(template, n, layout);
            if (!world)
                return n;
            const moved = { ...n, regionId: regionId !== null && regionId !== void 0 ? regionId : undefined, cell: undefined };
            return { ...moved, follow: undefined,
                rotation: ((_a = n.rotation) !== null && _a !== void 0 ? _a : 0) + regionAngle(template, n) - regionAngle(template, moved),
                frame: frameFromWorld(template, moved, world, layout) };
        });
        // Followers left outside the moved region detach instead of becoming dangling constraints.
        return edit(next, n => { var _a; return n.follow && ((_a = next.root.children.find(t => t.id === n.follow.targetId)) === null || _a === void 0 ? void 0 : _a.regionId) !== n.regionId ? { ...n, follow: undefined } : n; });
    }
    function deleteElements(template, ids) {
        const remove = movableSelection(template, ids);
        for (const n of canvasElements(template))
            if (n.regionId && remove.has(n.regionId))
                remove.add(n.id);
        const byID = new Map(canvasElements(template).map(n => [n.id, n]));
        const children = canvasElements(template).filter(n => !remove.has(n.id)).map(n => {
            if (!n.follow || !remove.has(n.follow.targetId))
                return n;
            let previous = byID.get(n.follow.targetId);
            const seen = new Set();
            while (previous && remove.has(previous.id) && previous.follow && !seen.has(previous.id)) {
                seen.add(previous.id);
                previous = byID.get(previous.follow.targetId);
            }
            if (previous && !remove.has(previous.id))
                return { ...n, follow: { ...n.follow, targetId: previous.id } };
            return { ...n, follow: undefined, frame: { ...elementFrame(n), y: previous ? elementFrame(previous).y : elementFrame(n).y } };
        });
        return { ...template, root: { ...template.root, children } };
    }
    function duplicateElements(template, ids, env) {
        const selected = new Set(expandSelectionIDs(template, ids));
        for (const n of canvasElements(template))
            if (n.regionId && selected.has(n.regionId))
                selected.add(n.id);
        const e = (0, model_1.resolveEnvironment)(env);
        const remap = new Map();
        const groups = new Map();
        for (const id of selected)
            remap.set(id, e.newID());
        let copies = canvasElements(template).filter(n => selected.has(n.id)).map(n => {
            var _a;
            if (n.groupId && !groups.has(n.groupId))
                groups.set(n.groupId, e.newID());
            const frame = elementFrame(n);
            const copiedOwner = n.regionId && remap.has(n.regionId);
            return { ...n, id: remap.get(n.id), groupId: n.groupId ? groups.get(n.groupId) : undefined,
                regionId: copiedOwner ? remap.get(n.regionId) : n.regionId,
                follow: n.follow ? { ...n.follow, targetId: (_a = remap.get(n.follow.targetId)) !== null && _a !== void 0 ? _a : n.follow.targetId } : undefined,
                frame: { ...frame, x: frame.x + (copiedOwner ? 0 : 12), y: frame.y + (copiedOwner ? 0 : 12) } };
        });
        const taken = new Set(canvasElements(template).filter(n => n.cell).map(n => `${n.regionId}:${n.cell.row}:${n.cell.column}`));
        const placed = [];
        for (const copy of copies) {
            const owner = copy.regionId ? (0, grid_1.gridLayer)(template, copy.regionId) : undefined;
            if (!(owner === null || owner === void 0 ? void 0 : owner.grid) || !copy.cell) {
                placed.push(copy);
                continue;
            }
            let cell;
            for (let row = 0; row < owner.grid.rows && !cell; row++)
                for (let column = 0; column < owner.grid.columns; column++) {
                    const at = (0, grid_1.gridCellAt)(owner.grid, row, column), key = `${owner.id}:${row}:${column}`;
                    if (at.row === row && at.column === column && !taken.has(key)) {
                        cell = { row, column };
                        taken.add(key);
                        break;
                    }
                }
            if (!cell)
                return template;
            placed.push({ ...copy, cell });
        }
        copies = placed;
        return { ...template, root: { ...template.root, children: [...template.root.children, ...copies] } };
    }
    function createContentRegion(frame, env) {
        return (0, model_1.makeStackNode)('column', { layout: 'region', frame, padding: { top: 12, right: 12, bottom: 12, left: 12 }, children: [] }, env);
    }
    /** Scale a selection about a supplied world-space bounding box, including its text if requested. */
    function resizeElements(template, ids, target, layout, options = {}) {
        const selected = movableSelection(template, ids);
        const bounds = selectionBounds(template, [...selected], layout);
        if (!bounds)
            return template;
        const sx = Math.max(1, target.width) / Math.max(1, bounds.width);
        const sy = Math.max(1, target.height) / Math.max(1, bounds.height);
        let result = template;
        for (const id of selected) {
            const node = canvasElements(result).find(n => n.id === id);
            const world = canvasWorldFrame(template, node, layout);
            if (!world)
                continue;
            result = setElementFollow(result, id, null, 0, layout);
            result = resizeElement(result, id, frameFromWorld(template, node, {
                x: target.x + (world.x - bounds.x) * sx,
                y: target.y + (world.y - bounds.y) * sy,
                width: world.width * sx, height: world.height * sy,
            }, layout), options);
        }
        return result;
    }
    /** Rotate every selected object's center about the selection center. Delta is in degrees. */
    function rotateSelection(template, ids, deltaDegrees, layout) {
        if (!Number.isFinite(deltaDegrees))
            return template;
        const selected = movableSelection(template, ids);
        const bounds = selectionBounds(template, [...selected], layout);
        if (!bounds)
            return template;
        const cx = bounds.x + bounds.width / 2;
        const cy = bounds.y + bounds.height / 2;
        const radians = deltaDegrees * Math.PI / 180;
        const c = Math.cos(radians);
        const s = Math.sin(radians);
        return edit(template, node => {
            var _a;
            const world = canvasWorldFrame(template, node, layout);
            if (!selected.has(node.id) || !world)
                return node;
            const dx = world.x + world.width / 2 - cx;
            const dy = world.y + world.height / 2 - cy;
            return { ...node, follow: undefined,
                rotation: (((((_a = node.rotation) !== null && _a !== void 0 ? _a : 0) + deltaDegrees + 180) % 360) + 360) % 360 - 180,
                frame: frameFromWorld(template, node, { ...world, x: cx + dx * c - dy * s - world.width / 2,
                    y: cy + dx * s + dy * c - world.height / 2 }, layout) };
        });
    }

  });

  define("core/template/grid", function (module, exports, require) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.gridLayer = void 0;
    exports.createGridLayer = createGridLayer;
    exports.gridCellAt = gridCellAt;
    exports.gridCellForNode = gridCellForNode;
    exports.gridCellFrames = gridCellFrames;
    exports.validateGrid = validateGrid;
    exports.setGridCell = setGridCell;
    exports.mergeGridCells = mergeGridCells;
    exports.splitGridCell = splitGridCell;
    exports.resizeGrid = resizeGrid;
    exports.insertGridTrack = insertGridTrack;
    exports.deleteGridTrack = deleteGridTrack;
    const model_1 = require("./model");
    const span = (cell) => { var _a, _b; return ({ row: cell.row, column: cell.column, rowSpan: (_a = cell.rowSpan) !== null && _a !== void 0 ? _a : 1, colSpan: (_b = cell.colSpan) !== null && _b !== void 0 ? _b : 1 }); };
    const inside = (cell, row, column) => { var _a, _b; return row >= cell.row && column >= cell.column && row < cell.row + ((_a = cell.rowSpan) !== null && _a !== void 0 ? _a : 1) && column < cell.column + ((_b = cell.colSpan) !== null && _b !== void 0 ? _b : 1); };
    const intersects = (a, b) => { var _a, _b, _c, _d; return a.row < b.row + ((_a = b.rowSpan) !== null && _a !== void 0 ? _a : 1) && b.row < a.row + ((_b = a.rowSpan) !== null && _b !== void 0 ? _b : 1) && a.column < b.column + ((_c = b.colSpan) !== null && _c !== void 0 ? _c : 1) && b.column < a.column + ((_d = a.colSpan) !== null && _d !== void 0 ? _d : 1); };
    const contains = (a, b) => { var _a, _b; return inside(a, b.row, b.column) && inside(a, b.row + ((_a = b.rowSpan) !== null && _a !== void 0 ? _a : 1) - 1, b.column + ((_b = b.colSpan) !== null && _b !== void 0 ? _b : 1) - 1); };
    const gridLayer = (template, id) => template.root.children.find((n) => n.id === id && n.kind === 'stack' && n.layout === 'grid');
    exports.gridLayer = gridLayer;
    const replace = (template, change) => ({ ...template, root: { ...template.root, children: template.root.children.map(change) } });
    function createGridLayer(frame, columns = 2, rows = 2, env) {
        return (0, model_1.makeStackNode)('column', { name: '网格图层', layout: 'grid', frame: { ...frame, height: 0 }, padding: model_1.ZERO_PADDING,
            grid: (0, model_1.sanitizeGrid)({ rows, columns, rowGap: 12, columnGap: 12 }), children: [] }, env);
    }
    function gridCellAt(grid, row, column) {
        var _a, _b;
        return span((_b = (_a = grid.merges) === null || _a === void 0 ? void 0 : _a.find(cell => inside(cell, row, column))) !== null && _b !== void 0 ? _b : { row, column });
    }
    function gridCellForNode(template, node) {
        const layer = node.regionId ? (0, exports.gridLayer)(template, node.regionId) : undefined;
        return (layer === null || layer === void 0 ? void 0 : layer.grid) && node.cell ? gridCellAt(layer.grid, node.cell.row, node.cell.column) : undefined;
    }
    function gridCellFrames(template, layerId, layout) {
        var _a, _b, _c, _d;
        const layer = (0, exports.gridLayer)(template, layerId), tracks = (_a = layout.grids) === null || _a === void 0 ? void 0 : _a[layerId], owner = (_b = layout.byID[layerId]) === null || _b === void 0 ? void 0 : _b.frame;
        if (!(layer === null || layer === void 0 ? void 0 : layer.grid) || !tracks || !owner)
            return [];
        const result = [], angle = ((_c = layer.rotation) !== null && _c !== void 0 ? _c : 0) * Math.PI / 180;
        for (let row = 0; row < layer.grid.rows; row++)
            for (let column = 0; column < layer.grid.columns; column++) {
                const cell = gridCellAt(layer.grid, row, column);
                if (cell.row !== row || cell.column !== column)
                    continue;
                const x = tracks.columnOffsets[column], y = tracks.rowOffsets[row];
                const lastColumn = column + cell.colSpan - 1, lastRow = row + cell.rowSpan - 1;
                const width = tracks.columnOffsets[lastColumn] + tracks.columnWidths[lastColumn] - x;
                const height = tracks.rowOffsets[lastRow] + tracks.rowHeights[lastRow] - y;
                const dx = x + width / 2 - owner.width / 2, dy = y + height / 2 - owner.height / 2;
                result.push({ ...cell, localFrame: { x, y, width, height },
                    frame: { x: owner.x + owner.width / 2 + dx * Math.cos(angle) - dy * Math.sin(angle) - width / 2,
                        y: owner.y + owner.height / 2 + dx * Math.sin(angle) + dy * Math.cos(angle) - height / 2, width, height },
                    rotation: (_d = layer.rotation) !== null && _d !== void 0 ? _d : 0, collapsed: height <= .01 });
            }
        return result;
    }
    function validateGrid(template, layer) {
        var _a;
        const grid = layer.grid, errors = [];
        if (!grid || !Number.isInteger(grid.rows) || !Number.isInteger(grid.columns) || grid.rows < 1 || grid.rows > 64 || grid.columns < 1 || grid.columns > 12)
            return [`invalid grid:${layer.id}`];
        const valid = (cell) => { var _a, _b, _c, _d, _e, _f; return [cell.row, cell.column, (_a = cell.rowSpan) !== null && _a !== void 0 ? _a : 1, (_b = cell.colSpan) !== null && _b !== void 0 ? _b : 1].every(Number.isInteger) && cell.row >= 0 && cell.column >= 0 && ((_c = cell.rowSpan) !== null && _c !== void 0 ? _c : 1) > 0 && ((_d = cell.colSpan) !== null && _d !== void 0 ? _d : 1) > 0 && cell.row + ((_e = cell.rowSpan) !== null && _e !== void 0 ? _e : 1) <= grid.rows && cell.column + ((_f = cell.colSpan) !== null && _f !== void 0 ? _f : 1) <= grid.columns; };
        const merges = (_a = grid.merges) !== null && _a !== void 0 ? _a : [];
        merges.forEach((cell, i) => { if (!valid(cell))
            errors.push(`grid bounds:${layer.id}`); if (merges.slice(i + 1).some(next => intersects(cell, next)))
            errors.push(`grid overlap:${layer.id}`); });
        const occupied = new Set();
        for (const node of template.root.children.filter(n => n.regionId === layer.id)) {
            if (node.decoration && !node.cell)
                continue;
            if (!node.cell || !valid(node.cell)) {
                errors.push(`grid cell:${node.id}`);
                continue;
            }
            const cell = gridCellAt(grid, node.cell.row, node.cell.column), key = `${cell.row}:${cell.column}`;
            if (cell.row !== node.cell.row || cell.column !== node.cell.column || occupied.has(key) || node.follow)
                errors.push(`grid content:${node.id}`);
            occupied.add(key);
        }
        return errors;
    }
    /** Existing content in the same layer swaps cells. Cross-layer conflicts are left unchanged. */
    function setGridCell(template, nodeId, layerId, requested) {
        const layer = (0, exports.gridLayer)(template, layerId), node = template.root.children.find(n => n.id === nodeId);
        if (!(layer === null || layer === void 0 ? void 0 : layer.grid) || layer.locked || !node || node.locked || node.kind === 'stack' || requested.row < 0 || requested.column < 0 || requested.row >= layer.grid.rows || requested.column >= layer.grid.columns)
            return template;
        const cell = gridCellAt(layer.grid, Math.floor(requested.row), Math.floor(requested.column));
        const occupied = template.root.children.find(n => { var _a; return n.id !== nodeId && n.regionId === layerId && ((_a = n.cell) === null || _a === void 0 ? void 0 : _a.row) === cell.row && n.cell.column === cell.column; });
        if (occupied && (occupied.locked || node.regionId !== layerId || !node.cell))
            return template;
        return replace(template, n => n.id === nodeId ? { ...n, regionId: layerId, cell: { row: cell.row, column: cell.column }, follow: undefined, groupId: undefined } : n.id === (occupied === null || occupied === void 0 ? void 0 : occupied.id) ? { ...n, cell: node.cell } : n);
    }
    function mergeGridCells(template, layerId, requested) {
        var _a, _b;
        const layer = (0, exports.gridLayer)(template, layerId), cell = span(requested);
        if (!(layer === null || layer === void 0 ? void 0 : layer.grid) || layer.locked)
            return { template, error: 'invalidGrid' };
        if (![cell.row, cell.column, cell.rowSpan, cell.colSpan].every(Number.isInteger) || cell.row < 0 || cell.column < 0 || cell.rowSpan < 1 || cell.colSpan < 1 || cell.row + cell.rowSpan > layer.grid.rows || cell.column + cell.colSpan > layer.grid.columns)
            return { template, error: 'outOfBounds' };
        if ((_a = layer.grid.merges) === null || _a === void 0 ? void 0 : _a.some(old => intersects(old, cell) && !contains(cell, old)))
            return { template, error: 'overlappingMerge' };
        const content = template.root.children.filter(n => n.regionId === layerId && n.cell && inside(cell, n.cell.row, n.cell.column));
        if (content.length > 1)
            return { template, error: 'multipleContent' };
        const merges = [...((_b = layer.grid.merges) !== null && _b !== void 0 ? _b : []).filter(old => !intersects(old, cell)), ...(cell.rowSpan > 1 || cell.colSpan > 1 ? [cell] : [])];
        return { template: replace(template, n => { var _a; return n.id === layerId ? { ...layer, grid: { ...layer.grid, merges: merges.length ? merges : undefined } } : n.id === ((_a = content[0]) === null || _a === void 0 ? void 0 : _a.id) ? { ...n, cell: { row: cell.row, column: cell.column } } : n; }) };
    }
    function splitGridCell(template, layerId, row, column) {
        var _a;
        const layer = (0, exports.gridLayer)(template, layerId);
        if (!(layer === null || layer === void 0 ? void 0 : layer.grid) || layer.locked)
            return template;
        const merges = ((_a = layer.grid.merges) !== null && _a !== void 0 ? _a : []).filter(cell => !inside(cell, row, column));
        return replace(template, n => n.id === layerId ? { ...layer, grid: { ...layer.grid, merges: merges.length ? merges : undefined } } : n);
    }
    /** Shrinking relocates displaced cells only when all content still fits. Otherwise it is a no-op. */
    function resizeGrid(template, layerId, rows, columns) {
        var _a;
        const layer = (0, exports.gridLayer)(template, layerId);
        if (!(layer === null || layer === void 0 ? void 0 : layer.grid) || layer.locked)
            return template;
        rows = Math.max(1, Math.min(64, Math.round(rows)));
        columns = Math.max(1, Math.min(12, Math.round(columns)));
        if (!Number.isFinite(rows) || !Number.isFinite(columns))
            return template;
        const grid = (0, model_1.sanitizeGrid)({ ...layer.grid, rows, columns, merges: (_a = layer.grid.merges) === null || _a === void 0 ? void 0 : _a.filter(cell => { var _a, _b; return cell.row + ((_a = cell.rowSpan) !== null && _a !== void 0 ? _a : 1) <= rows && cell.column + ((_b = cell.colSpan) !== null && _b !== void 0 ? _b : 1) <= columns; }) });
        const positions = new Map(), taken = new Set();
        const members = template.root.children.filter(n => n.regionId === layerId && n.cell);
        const displaced = [];
        for (const node of members) {
            const cell = node.cell, key = `${cell.row}:${cell.column}`;
            if (cell.row < rows && cell.column < columns && !taken.has(key)) {
                positions.set(node.id, cell);
                taken.add(key);
            }
            else
                displaced.push(node);
        }
        for (const node of displaced) {
            let available;
            for (let row = 0; row < rows && !available; row++)
                for (let column = 0; column < columns; column++) {
                    const cell = gridCellAt(grid, row, column), key = `${row}:${column}`;
                    if (cell.row === row && cell.column === column && !taken.has(key)) {
                        available = { row, column };
                        taken.add(key);
                        break;
                    }
                }
            if (!available)
                return template;
            positions.set(node.id, available);
        }
        return replace(template, n => n.id === layerId ? { ...layer, grid } : positions.has(n.id) ? { ...n, cell: positions.get(n.id) } : n);
    }
    function insertGridTrack(template, layerId, axis, at) {
        var _a;
        const layer = (0, exports.gridLayer)(template, layerId);
        if (!(layer === null || layer === void 0 ? void 0 : layer.grid) || layer.locked)
            return template;
        const grid = layer.grid, count = axis === 'row' ? grid.rows : grid.columns;
        if (count >= (axis === 'row' ? 64 : 12))
            return template;
        const index = Math.max(0, Math.min(count, Math.floor(at))), spanKey = axis === 'row' ? 'rowSpan' : 'colSpan';
        const merges = (_a = grid.merges) === null || _a === void 0 ? void 0 : _a.map(raw => { const cell = span(raw); return cell[axis] >= index ? { ...cell, [axis]: cell[axis] + 1 } : cell[axis] + cell[spanKey] > index ? { ...cell, [spanKey]: cell[spanKey] + 1 } : cell; });
        const tracks = axis === 'row' ? Array.from({ length: count }, (_, i) => { var _a, _b; return (_b = (_a = grid.rowHeights) === null || _a === void 0 ? void 0 : _a[i]) !== null && _b !== void 0 ? _b : null; }) : Array.from({ length: count }, (_, i) => { var _a, _b; return (_b = (_a = grid.columnWeights) === null || _a === void 0 ? void 0 : _a[i]) !== null && _b !== void 0 ? _b : 1; });
        tracks.splice(index, 0, axis === 'row' ? null : 1);
        const next = { ...grid, [axis === 'row' ? 'rows' : 'columns']: count + 1, [axis === 'row' ? 'rowHeights' : 'columnWeights']: tracks, merges };
        return replace(template, n => n.id === layerId ? { ...layer, grid: next } : n.regionId === layerId && n.cell && n.cell[axis] >= index ? { ...n, cell: { ...n.cell, [axis]: n.cell[axis] + 1 } } : n);
    }
    function deleteGridTrack(template, layerId, axis, at) {
        var _a;
        const layer = (0, exports.gridLayer)(template, layerId);
        if (!(layer === null || layer === void 0 ? void 0 : layer.grid) || layer.locked)
            return { template, error: 'invalidGrid' };
        const grid = layer.grid, count = axis === 'row' ? grid.rows : grid.columns, index = Math.floor(at);
        if (count <= 1 || index < 0 || index >= count)
            return { template, error: 'outOfBounds' };
        if (template.root.children.some(n => { var _a; return n.regionId === layerId && ((_a = n.cell) === null || _a === void 0 ? void 0 : _a[axis]) === index; }))
            return { template, error: 'occupied' };
        const spanKey = axis === 'row' ? 'rowSpan' : 'colSpan';
        const merges = (_a = grid.merges) === null || _a === void 0 ? void 0 : _a.map(raw => { const cell = span(raw); return cell[axis] > index ? { ...cell, [axis]: cell[axis] - 1 } : cell[axis] <= index && cell[axis] + cell[spanKey] > index ? { ...cell, [spanKey]: cell[spanKey] - 1 } : cell; }).filter(cell => cell.rowSpan > 0 && cell.colSpan > 0 && (cell.rowSpan > 1 || cell.colSpan > 1));
        const tracks = axis === 'row' ? Array.from({ length: count }, (_, i) => { var _a, _b; return (_b = (_a = grid.rowHeights) === null || _a === void 0 ? void 0 : _a[i]) !== null && _b !== void 0 ? _b : null; }) : Array.from({ length: count }, (_, i) => { var _a, _b; return (_b = (_a = grid.columnWeights) === null || _a === void 0 ? void 0 : _a[i]) !== null && _b !== void 0 ? _b : 1; });
        tracks.splice(index, 1);
        const next = { ...grid, [axis === 'row' ? 'rows' : 'columns']: count - 1, [axis === 'row' ? 'rowHeights' : 'columnWeights']: tracks, merges };
        return { template: replace(template, n => n.id === layerId ? { ...layer, grid: next } : n.regionId === layerId && n.cell && n.cell[axis] > index ? { ...n, cell: { ...n.cell, [axis]: n.cell[axis] - 1 } } : n) };
    }

  });

  define("core/template/canvasLayout", function (module, exports, require) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.layoutCanvas = layoutCanvas;
    /** Deterministic v3 geometry: flat free objects, one-level regions and vertical follow links. */
    const model_1 = require("./model");
    const canvas_1 = require("./canvas");
    const grid_1 = require("./grid");
    const MAX_CONTENT_HEIGHT = 20000;
    function layoutCanvas(template, values, measure, options = {}) {
        var _a, _b, _c, _d, _e, _f;
        const source = template.root.children;
        const grids = {};
        const scopes = new Map();
        for (const node of source) {
            const key = (_a = node.regionId) !== null && _a !== void 0 ? _a : '';
            scopes.set(key, [...((_b = scopes.get(key)) !== null && _b !== void 0 ? _b : []), node]);
        }
        const measureNode = (node, width) => {
            var _a;
            if (node.kind !== 'text')
                return { width, height: (0, canvas_1.elementFrame)(node).height };
            return measure({ text: (_a = values[node.id]) !== null && _a !== void 0 ? _a : '', label: node.label, inlineLabel: !!node.inlineLabel,
                fontSize: node.fontSize, fontId: node.fontId, weight: node.weight, design: node.design,
                alignment: node.alignment, tracking: node.tracking, lineLimit: 10000,
                chip: !!node.chip || !!node.chipAccent, barcode: node.field === '条码', maxWidth: width });
        };
        const solveGrid = (owner) => {
            var _a, _b, _c;
            const grid = owner.grid, members = (_a = scopes.get(owner.id)) !== null && _a !== void 0 ? _a : [], pad = (_b = owner.padding) !== null && _b !== void 0 ? _b : model_1.ZERO_PADDING;
            const initial = (0, canvas_1.elementFrame)(owner), editing = options.editingGridId === owner.id;
            const available = Math.max(1, initial.width - pad.left - pad.right - (grid.columns - 1) * grid.columnGap);
            const weights = Array.from({ length: grid.columns }, (_, i) => { var _a, _b; return Math.max(.05, (_b = (_a = grid.columnWeights) === null || _a === void 0 ? void 0 : _a[i]) !== null && _b !== void 0 ? _b : 1); });
            const sum = weights.reduce((a, b) => a + b, 0), columnWidths = weights.map(weight => available * weight / sum);
            const columnOffsets = [];
            let x = pad.left;
            columnWidths.forEach(width => { columnOffsets.push(x); x += width + grid.columnGap; });
            const rowHeights = Array.from({ length: grid.rows }, (_, i) => { var _a, _b; return (_b = (_a = grid.rowHeights) === null || _a === void 0 ? void 0 : _a[i]) !== null && _b !== void 0 ? _b : 0; });
            const active = Array.from({ length: grid.rows }, () => editing || grid.collapseEmptyRows === false);
            const entries = members.map(node => {
                var _a, _b, _c;
                const frame = (0, canvas_1.elementFrame)(node), cell = node.cell ? (0, grid_1.gridCellAt)(grid, node.cell.row, node.cell.column) : undefined;
                const collapsed = node.visible === false || (node.kind === 'text' && ((_a = values[node.id]) !== null && _a !== void 0 ? _a : null) === null && node.hideWhenEmpty !== false);
                if (!cell || cell.row < 0 || cell.column < 0 || cell.row + cell.rowSpan > grid.rows || cell.column + cell.colSpan > grid.columns)
                    return { node, frame, collapsed, overflow: false, cell: undefined, natural: frame.height };
                const last = cell.column + cell.colSpan - 1;
                const width = columnOffsets[last] + columnWidths[last] - columnOffsets[cell.column];
                const natural = node.kind === 'text' ? measureNode(node, width).height : node.kind === 'image' ? width * ((_b = node.imageAspect) !== null && _b !== void 0 ? _b : frame.height / Math.max(1, frame.width)) : frame.height;
                if (!collapsed && !node.decoration) {
                    for (let row = cell.row; row < cell.row + cell.rowSpan; row++)
                        active[row] = true;
                    if (cell.rowSpan === 1 && ((_c = grid.rowHeights) === null || _c === void 0 ? void 0 : _c[cell.row]) == null)
                        rowHeights[cell.row] = Math.max(rowHeights[cell.row], natural);
                }
                return { node, frame: { x: columnOffsets[cell.column], y: 0, width, height: natural }, collapsed, overflow: false, cell, natural };
            });
            for (let row = 0; row < grid.rows; row++) {
                if (!active[row])
                    rowHeights[row] = 0;
                else if ((editing || grid.collapseEmptyRows === false) && ((_c = grid.rowHeights) === null || _c === void 0 ? void 0 : _c[row]) == null)
                    rowHeights[row] = Math.max(40, rowHeights[row]);
            }
            // Spanning content grows only automatic rows. Fixed tracks remain fixed and report overflow.
            for (const entry of entries.filter(e => e.cell && !e.collapsed && !e.node.decoration).sort((a, b) => a.cell.rowSpan - b.cell.rowSpan)) {
                const cell = entry.cell;
                if (cell.rowSpan === 1)
                    continue;
                const rows = Array.from({ length: cell.rowSpan }, (_, i) => cell.row + i);
                const height = rows.reduce((total, row) => total + rowHeights[row], 0) + grid.rowGap * Math.max(0, rows.filter(row => active[row]).length - 1);
                const flexible = rows.filter(row => { var _a; return ((_a = grid.rowHeights) === null || _a === void 0 ? void 0 : _a[row]) == null; });
                if (height < entry.natural && flexible.length)
                    for (const row of flexible)
                        rowHeights[row] += (entry.natural - height) / flexible.length;
            }
            const rowOffsets = [];
            let y = pad.top, hasRow = false;
            for (let row = 0; row < grid.rows; row++) {
                if (active[row] && rowHeights[row] > 0) {
                    if (hasRow)
                        y += grid.rowGap;
                    rowOffsets.push(y);
                    y += rowHeights[row];
                    hasRow = true;
                }
                else
                    rowOffsets.push(y);
            }
            grids[owner.id] = { columnOffsets, columnWidths, rowOffsets, rowHeights };
            const children = entries.map(entry => {
                const cell = entry.cell;
                if (!cell)
                    return entry;
                const last = cell.row + cell.rowSpan - 1, cellHeight = rowOffsets[last] + rowHeights[last] - rowOffsets[cell.row];
                let height = entry.node.kind === 'text' && entry.node.autoHeight !== false ? entry.natural : cellHeight;
                if (entry.node.kind !== 'text' && entry.node.alignSelf && entry.node.alignSelf !== 'stretch')
                    height = Math.min(cellHeight, entry.natural);
                const offset = entry.node.alignSelf === 'center' ? (cellHeight - height) / 2 : entry.node.alignSelf === 'end' ? cellHeight - height : 0;
                return { node: entry.node, frame: { ...entry.frame, y: rowOffsets[cell.row] + offset, height: entry.collapsed ? 0 : height }, collapsed: entry.collapsed,
                    overflow: !entry.collapsed && ((entry.node.kind === 'text' && entry.natural > cellHeight + .5) || height > MAX_CONTENT_HEIGHT) };
            });
            return { children, height: Math.max(initial.height, Math.min(MAX_CONTENT_HEIGHT, y + pad.bottom)), empty: !entries.some(e => !e.collapsed && !e.node.decoration && e.node.kind !== 'spacer') };
        };
        const solveScope = (scopeID) => {
            var _a;
            const nodes = (_a = scopes.get(scopeID)) !== null && _a !== void 0 ? _a : [];
            const byID = new Map(nodes.map(n => [n.id, n]));
            const computed = new Map();
            const pending = new Set();
            const solve = (node) => {
                var _a, _b;
                const cached = computed.get(node.id);
                if (cached)
                    return cached;
                const initial = (0, canvas_1.elementFrame)(node);
                // Invalid imported/caller-created cycles are bounded even before document validation.
                if (pending.has(node.id))
                    return { node, frame: { ...initial, height: 0 }, collapsed: true, overflow: true };
                pending.add(node.id);
                let collapsed = node.visible === false || (node.kind === 'text' && ((_a = values[node.id]) !== null && _a !== void 0 ? _a : null) === null && node.hideWhenEmpty !== false);
                let height = initial.height;
                let overflow = false;
                let children;
                if (node.kind === 'text' && !collapsed) {
                    const natural = measureNode(node, Math.max(1, initial.width));
                    height = node.autoHeight === false ? initial.height : Math.min(MAX_CONTENT_HEIGHT, natural.height);
                    overflow = natural.height > height + 0.5;
                }
                if (node.kind === 'stack' && node.layout === 'region' && !scopeID) {
                    children = solveScope(node.id);
                    const content = children.filter(c => !c.collapsed && !c.node.decoration && c.node.kind !== 'spacer');
                    collapsed || (collapsed = node.collapseWhenEmpty !== false && content.length === 0);
                    const padding = (_b = node.padding) !== null && _b !== void 0 ? _b : model_1.ZERO_PADDING;
                    height = Math.max(initial.height, ...content.map(c => c.frame.y + c.frame.height + padding.bottom));
                }
                if (node.kind === 'stack' && node.layout === 'grid' && node.grid && !scopeID) {
                    const resolved = solveGrid(node);
                    children = resolved.children;
                    height = resolved.height;
                    collapsed || (collapsed = options.editingGridId !== node.id && node.collapseWhenEmpty !== false && resolved.empty);
                }
                let y = initial.y;
                if (node.follow) {
                    let target = byID.get(node.follow.targetId);
                    const visited = new Set([node.id]);
                    let earliestY = initial.y;
                    while (target && !visited.has(target.id)) {
                        visited.add(target.id);
                        const resolved = solve(target);
                        earliestY = (0, canvas_1.elementFrame)(target).y;
                        if (!resolved.collapsed) {
                            y = resolved.frame.y + resolved.frame.height + node.follow.gap;
                            break;
                        }
                        target = target.follow ? byID.get(target.follow.targetId) : undefined;
                        if (!target)
                            y = earliestY;
                    }
                }
                const value = { node, frame: { ...initial, y, height: collapsed ? 0 : Math.max(0, height) }, collapsed, overflow, children };
                computed.set(node.id, value);
                pending.delete(node.id);
                return value;
            };
            return nodes.map(solve);
        };
        const top = solveScope('');
        const padding = (_c = template.canvas.padding) !== null && _c !== void 0 ? _c : model_1.ZERO_PADDING;
        const fixed = template.canvas.height === 'hug' ? null : Math.round(model_1.CANVAS_WIDTH * template.canvas.height.aspect);
        const contentBottom = Math.max(0, ...top.filter(n => !n.collapsed && !n.node.decoration).map(n => n.frame.y + n.frame.height));
        const height = fixed !== null && fixed !== void 0 ? fixed : Math.min(MAX_CONTENT_HEIGHT, Math.max(120, contentBottom + padding.top + padding.bottom));
        const nodes = [];
        const byID = {};
        const overflow = new Set();
        const root = { id: template.root.id, kind: 'stack', node: template.root,
            frame: { x: padding.left, y: padding.top, width: Math.max(0, model_1.CANVAS_WIDTH - padding.left - padding.right), height: Math.max(0, height - padding.top - padding.bottom) },
            rotation: (_d = template.root.rotation) !== null && _d !== void 0 ? _d : 0, opacity: (_e = template.root.opacity) !== null && _e !== void 0 ? _e : 1, collapsed: false, depth: 1 };
        nodes.push(root);
        byID[root.id] = root;
        const emit = (entry, parent) => {
            var _a, _b, _c;
            const collapsed = entry.collapsed || parent.collapsed;
            const laid = { id: entry.node.id, kind: entry.node.kind, node: entry.node,
                frame: { ...entry.frame, x: parent.frame.x + entry.frame.x, y: parent.frame.y + entry.frame.y },
                rotation: (_a = entry.node.rotation) !== null && _a !== void 0 ? _a : 0, opacity: collapsed ? 0 : parent.opacity * ((_b = entry.node.opacity) !== null && _b !== void 0 ? _b : 1),
                collapsed, depth: parent.depth + 1, parent: parent.id };
            byID[laid.id] = laid;
            if (!collapsed) {
                nodes.push(laid);
                if (entry.overflow || (!entry.node.decoration && (laid.frame.x < 0 || laid.frame.x + laid.frame.width > model_1.CANVAS_WIDTH + 0.5 || laid.frame.y < 0 || laid.frame.y + laid.frame.height > height + 0.5)))
                    overflow.add(laid.id);
            }
            for (const child of (_c = entry.children) !== null && _c !== void 0 ? _c : [])
                emit(child, laid);
        };
        top.forEach(entry => emit(entry, root));
        // A missing owner cannot cause a node to disappear from the editor's recovery list.
        for (const node of source)
            if (!byID[node.id])
                byID[node.id] = { id: node.id, kind: node.kind, node, frame: (0, canvas_1.elementFrame)(node), rotation: (_f = node.rotation) !== null && _f !== void 0 ? _f : 0, opacity: 0, collapsed: true, depth: 2, parent: root.id };
        return { width: model_1.CANVAS_WIDTH, height, nodes, byID, grids, overflow: [...overflow] };
    }

  });

  define("core/template/fontCatalog", function (module, exports, require) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MAX_IMPORTED_FONT_BYTES = exports.DEFAULT_POSTER_FONT_ID = exports.FONT_CATALOG = void 0;
    exports.posterFont = posterFont;
    exports.posterFontFamily = posterFontFamily;
    exports.posterFontFallback = posterFontFallback;
    exports.posterFontChain = posterFontChain;
    exports.posterFontWeight = posterFontWeight;
    exports.fontFileWeight = fontFileWeight;
    exports.fontFileVariations = fontFileVariations;
    /** All eight entries are distinct, bundled OFL fonts, not aliases of system fonts. */
    exports.FONT_CATALOG = [
        { id: 'noto-sans-sc', name: '思源黑体', latinName: 'Noto Sans SC', category: 'sans', coverage: 'chinese', file: 'NotoSansSC.ttf', boldFile: 'NotoSansSC-Bold.ttf', sample: '把这一刻，留给以后', license: 'noto-sans-sc-OFL.txt' },
        { id: 'noto-serif-sc', name: '思源宋体', latinName: 'Noto Serif SC', category: 'serif', coverage: 'chinese', file: 'NotoSerifSC.ttf', boldFile: 'NotoSerifSC-Bold.ttf', sample: '愿我们总有歌可唱', license: 'noto-serif-sc-OFL.txt' },
        { id: 'lxgw-wenkai', name: '霞鹜文楷', latinName: 'LXGW WenKai TC', category: 'handwriting', coverage: 'chinese', file: 'LXGWWenKaiTC-Regular.ttf', boldFile: 'LXGWWenKaiTC-Bold.ttf', sample: '见过你，便不算辜负', license: 'lxgw-wenkai-OFL.txt' },
        { id: 'zcool-xiaowei', name: '站酷小薇体', latinName: 'ZCOOL XiaoWei', category: 'display', coverage: 'chinese', file: 'ZCOOLXiaoWei-Regular.ttf', sample: '今夜的星光与回声', license: 'zcool-xiaowei-OFL.txt' },
        { id: 'space-grotesk', name: '太空黑体', latinName: 'Space Grotesk', category: 'sans', coverage: 'latin', file: 'SpaceGrotesk.ttf', boldFile: 'SpaceGrotesk-Bold.ttf', fallbackId: 'noto-sans-sc', sample: 'LIVE / 留住现场 2026', license: 'space-grotesk-OFL.txt' },
        { id: 'playfair', name: '优雅衬线', latinName: 'Playfair Display', category: 'serif', coverage: 'latin', file: 'PlayfairDisplay.ttf', boldFile: 'PlayfairDisplay-Bold.ttf', fallbackId: 'noto-serif-sc', sample: 'Encore / 再见一面', license: 'playfair-OFL.txt' },
        { id: 'cormorant', name: '古典书刊', latinName: 'Cormorant Garamond', category: 'serif', coverage: 'latin', file: 'CormorantGaramond.ttf', boldFile: 'CormorantGaramond-Bold.ttf', fallbackId: 'noto-serif-sc', sample: 'A Night to Remember / 记忆', license: 'cormorant-OFL.txt' },
        { id: 'caveat', name: '随手写', latinName: 'Caveat', category: 'handwriting', coverage: 'latin', file: 'Caveat.ttf', boldFile: 'Caveat-Bold.ttf', fallbackId: 'lxgw-wenkai', sample: 'Wish you were here / 想见你', license: 'caveat-OFL.txt' },
    ];
    exports.DEFAULT_POSTER_FONT_ID = 'noto-sans-sc';
    exports.MAX_IMPORTED_FONT_BYTES = 32 * 1024 * 1024;
    function posterFont(id) {
        return id ? exports.FONT_CATALOG.find((font) => font.id === id) : undefined;
    }
    /** Stable alias shared by Skia and the standalone web editor. */
    function posterFontFamily(id) {
        return `LivemarkPoster_${id.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    }
    function posterFontFallback(id) {
        var _a, _b;
        return (_b = (_a = posterFont(id)) === null || _a === void 0 ? void 0 : _a.fallbackId) !== null && _b !== void 0 ? _b : (id === exports.DEFAULT_POSTER_FONT_ID ? undefined : exports.DEFAULT_POSTER_FONT_ID);
    }
    function posterFontChain(id) {
        const result = [];
        let current = id;
        while (current && !result.includes(current)) {
            result.push(current);
            current = posterFontFallback(current);
        }
        return result;
    }
    /** Do not ask a renderer to synthesize an unavailable weight. */
    function posterFontWeight(id, requested, importedWeight = 400) {
        const font = posterFont(id);
        if (!font)
            return importedWeight;
        return font.boldFile && requested >= 550 ? 700 : 400;
    }
    /** SFNT's default weight (also the default instance of a variable TTF). */
    function fontFileWeight(bytes) {
        const variation = fontFileVariations(bytes).find((axis) => axis.tag === 'wght');
        if (variation)
            return Math.max(1, Math.min(1000, Math.round(variation.value)));
        if (bytes.byteLength < 12)
            return 400;
        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        const count = view.getUint16(4, false);
        if (count > 256 || 12 + count * 16 > bytes.length)
            return 400;
        for (let index = 0; index < count; index += 1) {
            const position = 12 + index * 16;
            const tag = String.fromCharCode(...bytes.subarray(position, position + 4));
            const offset = view.getUint32(position + 8, false);
            const length = view.getUint32(position + 12, false);
            if (tag === 'OS/2' && length >= 8 && offset + 8 <= bytes.length) {
                const weight = view.getUint16(offset + 4, false);
                return weight >= 1 && weight <= 1000 ? weight : 400;
            }
        }
        return 400;
    }
    /** Browser FontFace can pin every variable axis to the instance Skia actually loads. */
    function fontFileVariations(bytes) {
        if (bytes.byteLength < 12)
            return [];
        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        const count = view.getUint16(4, false);
        if (count > 256 || 12 + count * 16 > bytes.length)
            return [];
        for (let index = 0; index < count; index += 1) {
            const position = 12 + index * 16;
            const tag = String.fromCharCode(...bytes.subarray(position, position + 4));
            if (tag !== 'fvar')
                continue;
            const offset = view.getUint32(position + 8, false);
            const length = view.getUint32(position + 12, false);
            if (length < 16 || offset + length > bytes.length)
                return [];
            const axesOffset = view.getUint16(offset + 4, false);
            const axisCount = view.getUint16(offset + 8, false);
            const axisSize = view.getUint16(offset + 10, false);
            if (axisCount > 64 || axisSize < 20 || axesOffset + axisCount * axisSize > length)
                return [];
            const result = [];
            for (let axis = 0; axis < axisCount; axis += 1) {
                const start = offset + axesOffset + axis * axisSize;
                const axisTag = String.fromCharCode(...bytes.subarray(start, start + 4));
                if (/^[A-Za-z0-9 ]{4}$/.test(axisTag))
                    result.push({ tag: axisTag, value: view.getInt32(start + 8, false) / 65536 });
            }
            return result;
        }
        return [];
    }

  });

  define("core/template/model", function (module, exports, require) {
    "use strict";
    // 分享模版的纯数据模型（v3：自由画布、平面对象、有限内容跟随）。
    // 设计规格见 Documentation/POSTER.md 第 1 节。
    //
    // 新文档的 root 只是平面对象集合，regionId / follow 表达有限的内容适配。
    // 不 import react / react-native / expo；随机数与时间可注入。
    // 长度使用 360 pt 逻辑画布；显示缩放与导出分辨率不改变文档坐标。
    // 老的 StackNode 辅助类型保留为内部调用接口，编辑器不暴露行列树。
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.STARTERS = exports.TEMPLATE_NODE_KINDS = exports.ZERO_PADDING = exports.ANCHORS = exports.JUSTIFIES = exports.ALIGNS = exports.TEMPLATE_FIELD_GROUPS = exports.TEMPLATE_FIELDS = exports.TEMPLATE_SHAPES = exports.TEMPLATE_ACCENTS = exports.TEMPLATE_ALIGNMENTS = exports.TEMPLATE_FONT_DESIGNS = exports.TEMPLATE_WEIGHTS = exports.COLOR_PRESETS = exports.Palette = exports.IMAGE_ASPECT_PRESETS = exports.ASPECT_PRESETS = exports.TILT_RANGE = exports.ZOOM_RANGE = exports.FOCUS_RANGE = exports.IMAGE_ASPECT_RANGE = exports.GROW_RANGE = exports.OFFSET_RANGE = exports.FRACTION_RANGE = exports.SIZE_RANGE = exports.BORDER_RANGE = exports.DASH_RANGE = exports.STROKE_RANGE = exports.CORNER_RADIUS_RANGE = exports.PADDING_RANGE = exports.GAP_RANGE = exports.OPACITY_RANGE = exports.ROTATION_RANGE = exports.LINE_LIMIT_RANGE = exports.TRACKING_RANGE = exports.FONT_SIZE_RANGE = exports.MAX_NAME_LENGTH = exports.MAX_DEPTH = exports.MAX_NODES = exports.DEFAULT_TEMPLATE_NAME = exports.ASPECT_RANGE = exports.EXPORT_WIDTH_RANGE = exports.EXPORT_WIDTH_PRESETS = exports.DEFAULT_EXPORT_WIDTH = exports.CANVAS_WIDTH = void 0;
    exports.makeColor = makeColor;
    exports.colorFromHex = colorFromHex;
    exports.colorFromHexString = colorFromHexString;
    exports.clampColor = clampColor;
    exports.colorHexString = colorHexString;
    exports.colorLuminance = colorLuminance;
    exports.isDarkColor = isDarkColor;
    exports.contrastingColor = contrastingColor;
    exports.colorDistance = colorDistance;
    exports.isPrivateField = isPrivateField;
    exports.templateFieldSymbol = templateFieldSymbol;
    exports.fieldGroup = fieldGroup;
    exports.suggestedSize = suggestedSize;
    exports.suggestedWeight = suggestedWeight;
    exports.suggestedDesign = suggestedDesign;
    exports.clamp = clamp;
    exports.roundHalfAwayFromZero = roundHalfAwayFromZero;
    exports.prefixChars = prefixChars;
    exports.isUUID = isUUID;
    exports.randomUUID = randomUUID;
    exports.isoString = isoString;
    exports.resolveEnvironment = resolveEnvironment;
    exports.padding = padding;
    exports.isZeroPadding = isZeroPadding;
    exports.isStackNode = isStackNode;
    exports.isTextNode = isTextNode;
    exports.isImageNode = isImageNode;
    exports.isShapeNode = isShapeNode;
    exports.isSpacerNode = isSpacerNode;
    exports.defaultShapeHeight = defaultShapeHeight;
    exports.defaultCanvas = defaultCanvas;
    exports.defaultFontID = defaultFontID;
    exports.defaultTextNode = defaultTextNode;
    exports.makeTextNode = makeTextNode;
    exports.makeImageNode = makeImageNode;
    exports.makeShapeNode = makeShapeNode;
    exports.makeStackNode = makeStackNode;
    exports.makeSpacerNode = makeSpacerNode;
    exports.defaultTemplate = defaultTemplate;
    exports.nodeHasOwnImage = nodeHasOwnImage;
    exports.nodeIsLivePhoto = nodeIsLivePhoto;
    exports.templateHasImage = templateHasImage;
    exports.templateHasLivePhoto = templateHasLivePhoto;
    exports.exportPixelWidth = exportPixelWidth;
    exports.exportScale = exportScale;
    exports.walkNodes = walkNodes;
    exports.countNodes = countNodes;
    exports.treeDepth = treeDepth;
    exports.findNode = findNode;
    exports.parentOf = parentOf;
    exports.nodePath = nodePath;
    exports.mapNodes = mapNodes;
    exports.replaceNode = replaceNode;
    exports.updateNode = updateNode;
    exports.insertInto = insertInto;
    exports.insertAfter = insertAfter;
    exports.removeNode = removeNode;
    exports.moveNode = moveNode;
    exports.wrapNode = wrapNode;
    exports.unwrapNode = unwrapNode;
    exports.sanitizeSizeRule = sanitizeSizeRule;
    exports.sanitizePadding = sanitizePadding;
    exports.sanitizeGrid = sanitizeGrid;
    exports.sanitizeNode = sanitizeNode;
    exports.sanitizeCanvasImage = sanitizeCanvasImage;
    exports.sanitizeCanvas = sanitizeCanvas;
    exports.sanitizeTemplate = sanitizeTemplate;
    exports.starterSubtitle = starterSubtitle;
    exports.starterTemplate = starterTemplate;
    exports.defaultPosterOptions = defaultPosterOptions;
    exports.formatLongDate = formatLongDate;
    exports.formatTime = formatTime;
    exports.starsText = starsText;
    exports.memoryNumber = memoryNumber;
    exports.makeCardBits = makeCardBits;
    exports.templateText = templateText;
    // MARK: - 常量
    exports.CANVAS_WIDTH = 360;
    exports.DEFAULT_EXPORT_WIDTH = 1080;
    /** 导出宽度的三枚芯片；高度永远跟排版走，所以只有宽度可选。 */
    exports.EXPORT_WIDTH_PRESETS = [1080, 1440, 2160];
    exports.EXPORT_WIDTH_RANGE = [540, 2160];
    /** 画布固定比例时的高 / 宽。 */
    exports.ASPECT_RANGE = [0.5, 2.2];
    exports.DEFAULT_TEMPLATE_NAME = '我的模版';
    /** 一棵树最多 120 个节点、最深 8 层（根算第 1 层）。 */
    exports.MAX_NODES = 120;
    exports.MAX_DEPTH = 8;
    exports.MAX_NAME_LENGTH = 40;
    // 数值范围：sanitize 一律按这些夹住，模版永远编码不出 NaN，也不会排出天文数字。
    exports.FONT_SIZE_RANGE = [6, 120];
    exports.TRACKING_RANGE = [-2, 12];
    exports.LINE_LIMIT_RANGE = [1, 20];
    exports.ROTATION_RANGE = [-180, 180];
    exports.OPACITY_RANGE = [0.05, 1];
    exports.GAP_RANGE = [0, 200];
    exports.PADDING_RANGE = [0, 200];
    exports.CORNER_RADIUS_RANGE = [0, 200];
    exports.STROKE_RANGE = [0, 40];
    exports.DASH_RANGE = [0, 80];
    exports.BORDER_RANGE = [0, 40];
    /** 固定 pt 的宽 / 高，以及 min/max。 */
    exports.SIZE_RANGE = [0, 2000];
    /** `{ fraction }` 是父内容盒的比例。 */
    exports.FRACTION_RANGE = [0.02, 2];
    /** 绝对定位相对锚点的位移（pt）。 */
    exports.OFFSET_RANGE = [-1000, 1000];
    /** 主轴 `fill` 的权重。 */
    exports.GROW_RANGE = [0, 100];
    /** 图片框的高 / 宽。 */
    exports.IMAGE_ASPECT_RANGE = [0.02, 50];
    // 图在框里的显示区域（POSTER.md 第 3 节）：object-position + 放大 + 倾斜。
    exports.FOCUS_RANGE = [0, 1];
    exports.ZOOM_RANGE = [1, 3];
    exports.TILT_RANGE = [-45, 45];
    /** 画布固定比例的预设，值是 高 / 宽。 */
    exports.ASPECT_PRESETS = [
        ['3:4', 4 / 3],
        ['4:5', 1.25],
        ['1:1', 1],
        ['9:16', 16 / 9],
        ['2:3', 1.5],
    ];
    /** 图片框比例的预设，值是 高 / 宽；`原图` 表示跟着图片本身，不裁。 */
    exports.IMAGE_ASPECT_PRESETS = [
        ['原图', 'natural'],
        ['1:1', 1],
        ['4:5', 1.25],
        ['3:4', 4 / 3],
        ['16:9', 9 / 16],
        ['2:3', 1.5],
    ];
    function makeColor(red, green, blue, alpha = 1) {
        return { red, green, blue, alpha };
    }
    /** 0xRRGGBB + 可选 alpha，和 Swift 的 `ColorValue(hex:alpha:)` 一致。 */
    function colorFromHex(hex, alpha = 1) {
        return makeColor(((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255, alpha);
    }
    /** 接受 `#rrggbb`、`rrggbb`、`#rrggbbaa`；不合法返回 null。 */
    function colorFromHexString(hexString) {
        let text = String(hexString !== null && hexString !== void 0 ? hexString : '').trim();
        if (text.startsWith('#'))
            text = text.slice(1);
        if (!/^[0-9a-fA-F]+$/.test(text) || (text.length !== 6 && text.length !== 8))
            return null;
        const value = parseInt(text, 16);
        if (text.length === 6)
            return colorFromHex(value);
        return makeColor(((value >>> 24) & 255) / 255, ((value >>> 16) & 255) / 255, ((value >>> 8) & 255) / 255, (value & 255) / 255);
    }
    function clampColor(value) {
        const fix = (v, fallback) => typeof v === 'number' && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : fallback;
        if (!value || typeof value !== 'object')
            return makeColor(0, 0, 0, 1);
        const color = value;
        return makeColor(fix(color.red, 0), fix(color.green, 0), fix(color.blue, 0), fix(color.alpha, 1));
    }
    /** `#rrggbb`，alpha < 0.999 时补两位。 */
    function colorHexString(value) {
        const c = clampColor(value);
        const part = (v) => {
            const s = Math.round(v * 255).toString(16);
            return s.length < 2 ? '0' + s : s;
        };
        const base = '#' + part(c.red) + part(c.green) + part(c.blue);
        return c.alpha < 0.999 ? base + part(c.alpha) : base;
    }
    /** sRGB 相对亮度，黑 0 白 1。 */
    function colorLuminance(value) {
        const c = clampColor(value);
        const linear = (channel) => channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
        return 0.2126 * linear(c.red) + 0.7152 * linear(c.green) + 0.0722 * linear(c.blue);
    }
    function isDarkColor(value) {
        return colorLuminance(value) < 0.4;
    }
    /** 压在这个颜色上还读得清的墨色或米色。 */
    function contrastingColor(value) {
        return isDarkColor(value) ? { ...exports.Palette.cream } : { ...exports.Palette.ink };
    }
    function colorDistance(a, b) {
        const dr = a.red - b.red;
        const dg = a.green - b.green;
        const db = a.blue - b.blue;
        return Math.sqrt(dr * dr + dg * dg + db * db);
    }
    /** ColorValue 的命名色，和 Swift 的静态常量同名同值。 */
    exports.Palette = {
        ink: colorFromHex(0x20251f),
        cream: colorFromHex(0xf6f3e9),
        white: colorFromHex(0xffffff),
        black: colorFromHex(0x000000),
        night: colorFromHex(0x141618),
        stamp: colorFromHex(0xc4553f),
        gold: colorFromHex(0xc9a24a),
        lilac: colorFromHex(0xbba7ef),
        lime: colorFromHex(0xd8eb97),
        coral: colorFromHex(0xf4ab8e),
        sky: colorFromHex(0xadcfe5),
    };
    /** 每个颜色控件旁边的快捷色，顺序同 Swift 的 `ColorValue.presets`。 */
    exports.COLOR_PRESETS = [
        exports.Palette.ink,
        exports.Palette.white,
        exports.Palette.cream,
        exports.Palette.night,
        exports.Palette.stamp,
        exports.Palette.gold,
        exports.Palette.lilac,
        exports.Palette.lime,
        exports.Palette.coral,
        exports.Palette.sky,
    ];
    // MARK: - 枚举
    exports.TEMPLATE_WEIGHTS = ['细', '常规', '中等', '半粗', '粗体', '特粗'];
    exports.TEMPLATE_FONT_DESIGNS = ['黑体', '宋体', '圆体', '等宽'];
    exports.TEMPLATE_ALIGNMENTS = ['左对齐', '居中', '右对齐'];
    exports.TEMPLATE_ACCENTS = ['主题色', '主题深色'];
    exports.TEMPLATE_SHAPES = [
        '矩形',
        '圆形',
        '直线',
        '唱片纹',
        '点阵',
        '胶片孔',
        '锯齿边',
        '渐变',
    ];
    exports.TEMPLATE_FIELDS = [
        '名称',
        '副标题',
        '艺人 / 卡司',
        '类型',
        '英文类型',
        '日期',
        '数字日期',
        '时间',
        '场馆',
        '城市',
        '城市与场馆',
        '月日',
        '年份',
        '评分星星',
        '心情',
        '金句',
        '感想',
        '曲目单',
        '票价',
        '座位',
        '同行人',
        '开场白',
        '署名',
        '余响标识',
        '编号',
        '条码',
        '自定义文字',
    ];
    exports.TEMPLATE_FIELD_GROUPS = [
        '基本信息',
        '时间与地点',
        '我的感受',
        '私人信息',
        '装饰与署名',
    ];
    /** 座位、票价、同行人：分享开关没打开就不印。 */
    const PRIVATE_FIELDS = ['票价', '座位', '同行人'];
    function isPrivateField(field) {
        return PRIVATE_FIELDS.includes(field);
    }
    const TEMPLATE_FIELD_SYMBOLS = {
        名称: 'textformat',
        副标题: 'text.alignleft',
        '艺人 / 卡司': 'person.2',
        类型: 'square.grid.2x2',
        英文类型: 'textformat.abc',
        日期: 'calendar',
        数字日期: 'number',
        时间: 'clock',
        场馆: 'building.2',
        城市: 'mappin',
        城市与场馆: 'mappin.and.ellipse',
        月日: 'calendar.day.timeline.left',
        年份: 'calendar.badge.clock',
        评分星星: 'star',
        心情: 'face.smiling',
        金句: 'quote.opening',
        感想: 'text.quote',
        曲目单: 'music.note.list',
        票价: 'yensign',
        座位: 'chair',
        同行人: 'figure.2',
        开场白: 'text.bubble',
        署名: 'signature',
        余响标识: 'sparkle',
        编号: 'number',
        条码: 'barcode',
        自定义文字: 'square.and.pencil',
    };
    /** 「添加元素」菜单里每个字段行首的图标；和记录字段（`recordFieldSymbol`）用同一套字形。 */
    function templateFieldSymbol(field) {
        return TEMPLATE_FIELD_SYMBOLS[field];
    }
    function fieldGroup(field) {
        switch (field) {
            case '名称':
            case '副标题':
            case '艺人 / 卡司':
            case '类型':
            case '英文类型':
                return '基本信息';
            case '日期':
            case '数字日期':
            case '时间':
            case '场馆':
            case '城市':
            case '城市与场馆':
            case '月日':
            case '年份':
                return '时间与地点';
            case '评分星星':
            case '心情':
            case '金句':
            case '感想':
            case '曲目单':
                return '我的感受';
            case '票价':
            case '座位':
            case '同行人':
                return '私人信息';
            default:
                return '装饰与署名';
        }
    }
    function suggestedSize(field) {
        switch (field) {
            case '名称':
                return 28;
            case '金句':
                return 15;
            case '余响标识':
                return 16;
            case '英文类型':
            case '编号':
            case '署名':
            case '开场白':
                return 10;
            default:
                return 12;
        }
    }
    function suggestedWeight(field) {
        switch (field) {
            case '名称':
            case '余响标识':
            case '月日':
                return '特粗';
            case '数字日期':
            case '类型':
            case '英文类型':
            case '编号':
                return '粗体';
            case '金句':
                return '中等';
            default:
                return '常规';
        }
    }
    function suggestedDesign(field) {
        switch (field) {
            case '金句':
            case '感想':
                return '宋体';
            case '英文类型':
            case '编号':
            case '署名':
            case '时间':
            case '数字日期':
            case '年份':
                return '等宽';
            default:
                return '黑体';
        }
    }
    // MARK: - 数值工具
    function clamp(value, range, fallback) {
        if (typeof value !== 'number' || !Number.isFinite(value))
            return fallback;
        return Math.min(range[1], Math.max(range[0], value));
    }
    function num(value, fallback) {
        return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
    }
    /** Swift 的 `rounded()` 是四舍五入并远离零；JS 的 Math.round 对负半数不一样。 */
    function roundHalfAwayFromZero(value) {
        return value < 0 ? -Math.round(-value) : Math.round(value);
    }
    /** Swift `String.prefix(n)`：按字符数截断。 */
    function prefixChars(text, n) {
        return Array.from(String(text !== null && text !== void 0 ? text : '')).slice(0, n).join('');
    }
    function optionalBool(value) {
        return value === undefined || value === null ? undefined : !!value;
    }
    function optionalClamp(value, range, fallback) {
        return value === undefined || value === null ? undefined : clamp(value, range, fallback);
    }
    // MARK: - 身份与时间（可注入）
    const UUID_PATTERN = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    function isUUID(text) {
        return typeof text === 'string' && UUID_PATTERN.test(text);
    }
    /** 大写连字符 UUID v4，和 Swift `UUID().uuidString` 一样的写法。 */
    function randomUUID() {
        const bytes = new Uint8Array(16);
        const crypto = globalThis.crypto;
        if (crypto && typeof crypto.getRandomValues === 'function') {
            crypto.getRandomValues(bytes);
        }
        else {
            for (let i = 0; i < 16; i++)
                bytes[i] = Math.floor(Math.random() * 256);
        }
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        const hex = [];
        for (let i = 0; i < 16; i++) {
            const s = bytes[i].toString(16).toUpperCase();
            hex.push(s.length < 2 ? '0' + s : s);
        }
        return (hex.slice(0, 4).join('') +
            '-' +
            hex.slice(4, 6).join('') +
            '-' +
            hex.slice(6, 8).join('') +
            '-' +
            hex.slice(8, 10).join('') +
            '-' +
            hex.slice(10, 16).join(''));
    }
    /** Swift 的 `.iso8601` 不带小数秒。 */
    function isoString(date = new Date()) {
        return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
    }
    function resolveEnvironment(env) {
        var _a, _b;
        return { newID: (_a = env === null || env === void 0 ? void 0 : env.newID) !== null && _a !== void 0 ? _a : randomUUID, now: (_b = env === null || env === void 0 ? void 0 : env.now) !== null && _b !== void 0 ? _b : (() => isoString()) };
    }
    /** 交叉轴对齐；`stretch` 对 hug 节点等于 `start`。 */
    exports.ALIGNS = ['start', 'center', 'end', 'stretch'];
    /** 主轴分布；只有父有确定高 / 宽且有剩余时才看得出来。 */
    exports.JUSTIFIES = [
        'start',
        'center',
        'end',
        'spaceBetween',
        'spaceAround',
        'spaceEvenly',
    ];
    /** 绝对定位的锚点（九宫格），相对父的 padding box。 */
    exports.ANCHORS = [
        'topLeft',
        'top',
        'topRight',
        'left',
        'center',
        'right',
        'bottomLeft',
        'bottom',
        'bottomRight',
    ];
    exports.ZERO_PADDING = { top: 0, right: 0, bottom: 0, left: 0 };
    function padding(a, b, c, d) {
        if (b === undefined)
            return { top: a, right: a, bottom: a, left: a };
        if (c === undefined)
            return { top: a, right: b, bottom: a, left: b };
        return { top: a, right: b, bottom: c !== null && c !== void 0 ? c : 0, left: d !== null && d !== void 0 ? d : 0 };
    }
    function isZeroPadding(value) {
        return !value || (!value.top && !value.right && !value.bottom && !value.left);
    }
    exports.TEMPLATE_NODE_KINDS = ['stack', 'text', 'image', 'shape', 'spacer'];
    function isStackNode(node) {
        return node.kind === 'stack';
    }
    function isTextNode(node) {
        return node.kind === 'text';
    }
    function isImageNode(node) {
        return node.kind === 'image';
    }
    function isShapeNode(node) {
        return node.kind === 'shape';
    }
    function isSpacerNode(node) {
        return node.kind === 'spacer';
    }
    // MARK: - 默认值与工厂
    /** 形状没给高度时的缺省高：直线 1 pt，其余 40 pt。 */
    function defaultShapeHeight(shape) {
        return shape === '直线' ? 1 : 40;
    }
    function defaultCanvas() {
        return {
            width: exports.CANVAS_WIDTH,
            height: 'hug',
            padding: padding(24),
            background: { ...exports.Palette.cream },
        };
    }
    function defaultFontID(design) {
        return { 黑体: 'noto-sans-sc', 宋体: 'noto-serif-sc', 圆体: 'lxgw-wenkai', 等宽: 'space-grotesk' }[design];
    }
    function defaultTextNode(field, env) {
        return {
            kind: 'text',
            id: resolveEnvironment(env).newID(),
            field,
            text: field === '自定义文字' ? '写点什么' : '',
            label: '',
            fontSize: suggestedSize(field),
            weight: suggestedWeight(field),
            design: suggestedDesign(field),
            fontId: defaultFontID(suggestedDesign(field)),
            alignment: '左对齐',
            color: { ...exports.Palette.ink },
            // 全大写的英文小字排得开一点才好看，和 v1 的 makeElement 一致。
            tracking: field === '英文类型' || field === '编号' || field === '署名' ? 2 : 0,
            lineLimit: 3,
            uppercase: false,
        };
    }
    function makeTextNode(field, overrides = {}, env) {
        var _a, _b;
        const base = defaultTextNode(field, env);
        return definedOnly({ ...base, ...overrides, fontId: (_a = overrides.fontId) !== null && _a !== void 0 ? _a : defaultFontID((_b = overrides.design) !== null && _b !== void 0 ? _b : base.design), kind: 'text', field });
    }
    function makeImageNode(source, overrides = {}, env) {
        const base = {
            kind: 'image',
            id: resolveEnvironment(env).newID(),
            source,
            // 记录封面不知道原图多大，先按正方形；自带的图缺省不裁，跟着原图比例。
            aspect: source === 'cover' ? 1 : 'natural',
            fit: 'cover',
            focusX: 0.5,
            focusY: 0.5,
            zoom: 1,
            tilt: 0,
        };
        return definedOnly({ ...base, ...overrides, kind: 'image', source });
    }
    function makeShapeNode(shape, overrides = {}, env) {
        const base = {
            kind: 'shape',
            id: resolveEnvironment(env).newID(),
            shape,
            color: { ...exports.Palette.ink },
        };
        return definedOnly({ ...base, ...overrides, kind: 'shape', shape });
    }
    function makeStackNode(direction, overrides = {}, env) {
        const base = {
            kind: 'stack',
            id: resolveEnvironment(env).newID(),
            direction,
            children: [],
        };
        return definedOnly({ ...base, ...overrides, kind: 'stack', direction });
    }
    function makeSpacerNode(env) {
        return { kind: 'spacer', id: resolveEnvironment(env).newID() };
    }
    function defaultTemplate(env) {
        const e = resolveEnvironment(env);
        const now = e.now();
        return {
            id: e.newID(),
            name: exports.DEFAULT_TEMPLATE_NAME,
            canvas: defaultCanvas(),
            root: makeStackNode('column', { layout: 'canvas' }, env),
            createdAt: now,
            updatedAt: now,
        };
    }
    // MARK: - 节点性质
    function nodeHasOwnImage(node) {
        return node.source !== 'cover';
    }
    function nodeIsLivePhoto(node) {
        return isImageNode(node) && !!node.video;
    }
    function templateHasImage(template) {
        const image = template.canvas.image;
        return !!image && (!!image.data || !!image.asset);
    }
    function templateHasLivePhoto(template) {
        let found = false;
        walkNodes(template.root, (node) => {
            if (nodeIsLivePhoto(node))
                found = true;
        });
        return found;
    }
    /** 导出宽度（px）；缺省 1080。高度只有排完版才知道，所以没有 exportPixelHeight。 */
    function exportPixelWidth(template) {
        const width = template.canvas.exportWidth;
        return typeof width === 'number' && Number.isFinite(width) ? width : exports.DEFAULT_EXPORT_WIDTH;
    }
    /** 360 pt 画布到导出像素的倍数。 */
    function exportScale(template) {
        return exportPixelWidth(template) / exports.CANVAS_WIDTH;
    }
    /** 前序遍历：父先于子，子按 children 的顺序（画的顺序另见 layout.ts）。 */
    function walkNodes(root, visit) {
        const step = (node, parent, depth, index) => {
            visit(node, { parent, depth, index });
            if (isStackNode(node)) {
                node.children.forEach((child, childIndex) => step(child, node, depth + 1, childIndex));
            }
        };
        step(root, null, 1, 0);
    }
    function countNodes(root) {
        let count = 0;
        walkNodes(root, () => {
            count += 1;
        });
        return count;
    }
    /** 根算第 1 层。 */
    function treeDepth(root) {
        let deepest = 0;
        walkNodes(root, (_node, info) => {
            if (info.depth > deepest)
                deepest = info.depth;
        });
        return deepest;
    }
    function findNode(root, id) {
        let found = null;
        walkNodes(root, (node) => {
            if (!found && node.id === id)
                found = node;
        });
        return found;
    }
    function parentOf(root, id) {
        let found = null;
        walkNodes(root, (node, info) => {
            if (!found && node.id === id)
                found = info.parent;
        });
        return found;
    }
    /** 从根到这个节点的 id 串（含自己）；找不到就是空数组。 */
    function nodePath(root, id) {
        const path = [];
        const step = (node, trail) => {
            const next = [...trail, node.id];
            if (node.id === id) {
                path.push(...next);
                return true;
            }
            return isStackNode(node) ? node.children.some((child) => step(child, next)) : false;
        };
        step(root, []);
        return path;
    }
    /** 自底向上映射：先映射子节点，再把带着新子节点的自己交给 fn。 */
    function mapNodes(root, fn) {
        const mapped = isStackNode(root)
            ? { ...root, children: root.children.map((child) => mapNodes(child, fn)) }
            : root;
        return fn(mapped);
    }
    /** 同 mapNodes，但保证根还是 stack（fn 想把根换成别的类型时原样退回）。 */
    function mapRoot(root, fn) {
        const next = mapNodes(root, fn);
        return isStackNode(next) ? next : root;
    }
    function replaceNode(root, id, next) {
        return mapRoot(root, (node) => (node.id === id ? next : node));
    }
    function updateNode(root, id, fn) {
        return mapRoot(root, (node) => (node.id === id ? fn(node) : node));
    }
    /** 装进某个容器；`index` 省略就放在末尾。 */
    function insertInto(root, parentID, node, index) {
        return mapRoot(root, (current) => {
            if (current.id !== parentID || !isStackNode(current))
                return current;
            const children = current.children.slice();
            const at = index === undefined ? children.length : Math.min(children.length, Math.max(0, index));
            children.splice(at, 0, node);
            return { ...current, children };
        });
    }
    /** 插在某个节点之后；目标是容器（或就是根）时插进它末尾。 */
    function insertAfter(root, siblingID, node) {
        const target = findNode(root, siblingID);
        if (!target)
            return insertInto(root, root.id, node);
        if (isStackNode(target))
            return insertInto(root, siblingID, node);
        const parent = parentOf(root, siblingID);
        if (!parent)
            return insertInto(root, root.id, node);
        const index = parent.children.findIndex((child) => child.id === siblingID);
        return insertInto(root, parent.id, node, index + 1);
    }
    function removeNode(root, id) {
        if (root.id === id)
            return root; // 根删不掉
        return mapRoot(root, (node) => isStackNode(node)
            ? { ...node, children: node.children.filter((child) => child.id !== id) }
            : node);
    }
    /** 在兄弟里上移 / 下移一位；到头了就原样返回。 */
    function moveNode(root, id, direction) {
        const parent = parentOf(root, id);
        if (!parent)
            return root;
        const index = parent.children.findIndex((child) => child.id === id);
        const target = direction === 'up' ? index - 1 : index + 1;
        if (index < 0 || target < 0 || target >= parent.children.length)
            return root;
        const children = parent.children.slice();
        const [moved] = children.splice(index, 1);
        children.splice(target, 0, moved);
        return replaceNode(root, parent.id, { ...parent, children });
    }
    /** 装进一个新容器（行 / 列）；新容器顶替它原来的位置。 */
    function wrapNode(root, id, direction, env) {
        const node = findNode(root, id);
        if (!node || node.id === root.id)
            return root;
        const wrapper = makeStackNode(direction, { children: [node] }, env);
        return replaceNode(root, id, wrapper);
    }
    /**
     * 移出到父级：把节点从它所在的容器里拿出来，放在那个容器后面；
     * 容器因此空掉就一并删除（正好是 wrapNode 的逆操作）。已经在根里的节点没有「外面」，原样返回。
     */
    function unwrapNode(root, id) {
        const parent = parentOf(root, id);
        if (!parent || parent.id === root.id)
            return root;
        const grand = parentOf(root, parent.id);
        if (!grand)
            return root;
        const node = findNode(parent, id);
        if (!node)
            return root;
        const trimmed = {
            ...parent,
            children: parent.children.filter((child) => child.id !== id),
        };
        const children = [];
        for (const child of grand.children) {
            if (child.id !== parent.id) {
                children.push(child);
                continue;
            }
            if (trimmed.children.length > 0)
                children.push(trimmed);
            children.push(node);
        }
        return replaceNode(root, grand.id, { ...grand, children });
    }
    // MARK: - 清洗
    function definedOnly(value) {
        const out = {};
        for (const [key, entry] of Object.entries(value)) {
            if (entry !== undefined)
                out[key] = entry;
        }
        return out;
    }
    /**
     * 等于缺省值的可选字段一律收成 undefined，模型因此是「规范形」：
     * 文件里省掉缺省值、读回来又是同一棵树，往返严格相等。
     */
    function dropDefault(value, fallback) {
        return value === undefined || value === fallback ? undefined : value;
    }
    function enumOrUndefined(raw, values) {
        return values.includes(raw) ? raw : undefined;
    }
    function accentOrUndefined(raw) {
        return enumOrUndefined(raw, exports.TEMPLATE_ACCENTS);
    }
    function sanitizeSizeRule(raw) {
        if (raw === 'hug' || raw === 'fill')
            return raw;
        if (typeof raw === 'number' && Number.isFinite(raw))
            return clamp(raw, exports.SIZE_RANGE, 0);
        if (raw && typeof raw === 'object') {
            const fraction = raw.fraction;
            if (typeof fraction === 'number' && Number.isFinite(fraction)) {
                return { fraction: clamp(fraction, exports.FRACTION_RANGE, 1) };
            }
        }
        return undefined;
    }
    /** 四边都是 0 的内边距等于没有内边距，省掉它，编码与比较都干净。 */
    function sanitizePadding(raw) {
        if (!raw || typeof raw !== 'object')
            return undefined;
        const value = raw;
        const box = {
            top: clamp(value.top, exports.PADDING_RANGE, 0),
            right: clamp(value.right, exports.PADDING_RANGE, 0),
            bottom: clamp(value.bottom, exports.PADDING_RANGE, 0),
            left: clamp(value.left, exports.PADDING_RANGE, 0),
        };
        return isZeroPadding(box) ? undefined : box;
    }
    function sanitizeStroke(raw) {
        if (!raw || typeof raw !== 'object')
            return undefined;
        const value = raw;
        return definedOnly({
            width: clamp(value.width, exports.STROKE_RANGE, 1),
            color: clampColor(value.color),
            accent: accentOrUndefined(value.accent),
            dashLength: dropDefault(optionalClamp(value.dashLength, exports.DASH_RANGE, 0), 0),
            dashGap: dropDefault(optionalClamp(value.dashGap, exports.DASH_RANGE, 0), 0),
        });
    }
    function sanitizeImageSource(raw) {
        if (raw && typeof raw === 'object') {
            const data = raw.data;
            if (typeof data === 'string' && data)
                return { data };
            const asset = raw.asset;
            if (asset && typeof asset === 'object')
                return { asset: asset };
        }
        return 'cover';
    }
    function sanitizeVideoSource(raw) {
        if (!raw || typeof raw !== 'object')
            return undefined;
        const data = raw.data;
        if (typeof data === 'string' && data)
            return { data };
        const asset = raw.asset;
        if (asset && typeof asset === 'object')
            return { asset: asset };
        return undefined;
    }
    function sanitizeHandwriting(raw) {
        if (!raw || typeof raw !== 'object')
            return undefined;
        const value = raw;
        if (!['pencilkit', 'strokes-v1'].includes(value.format) || typeof value.data !== 'string')
            return undefined;
        return definedOnly({ format: value.format, data: value.data, portableStrokes: typeof value.portableStrokes === 'string' ? value.portableStrokes : undefined, width: clamp(value.width, [1, 20000], 360), height: clamp(value.height, [1, 20000], 240) });
    }
    function sanitizeFrameAspect(raw) {
        if (raw === 'natural')
            return 'natural';
        return clamp(raw, exports.IMAGE_ASPECT_RANGE, 1);
    }
    function takeID(raw, context) {
        const id = isUUID(raw) ? String(raw).toUpperCase() : context.env.newID();
        // 重复的 id 会让选中、命中测试与编辑操作指错人，重生一个。
        const unique = context.seen.has(id) ? context.env.newID() : id;
        context.seen.add(unique);
        return unique;
    }
    function sanitizeFrame(raw) {
        if (!raw || typeof raw !== 'object')
            return undefined;
        const value = raw;
        return {
            x: clamp(value.x, [-20000, 20000], 0), y: clamp(value.y, [-20000, 20000], 0),
            width: clamp(value.width, [1, 20000], 120), height: clamp(value.height, [0, 20000], 32),
        };
    }
    function referenceID(raw) {
        return typeof raw === 'string' && raw.length > 0 ? (isUUID(raw) ? raw.toUpperCase() : prefixChars(raw, 100)) : undefined;
    }
    function sanitizeFollow(raw) {
        if (!raw || typeof raw !== 'object')
            return undefined;
        const value = raw;
        const targetId = referenceID(value.targetId);
        return targetId ? { targetId, gap: clamp(value.gap, [0, 2000], 12) } : undefined;
    }
    function sanitizeGrid(raw) {
        if (!raw || typeof raw !== 'object')
            return undefined;
        const value = raw;
        const rows = Math.round(clamp(value.rows, [1, 64], 2)), columns = Math.round(clamp(value.columns, [1, 12], 2));
        const merges = (Array.isArray(value.merges) ? value.merges : []).slice(0, 768).map(cell => ({
            row: Math.round(clamp(cell === null || cell === void 0 ? void 0 : cell.row, [0, rows - 1], 0)), column: Math.round(clamp(cell === null || cell === void 0 ? void 0 : cell.column, [0, columns - 1], 0)),
            rowSpan: Math.round(clamp(cell === null || cell === void 0 ? void 0 : cell.rowSpan, [1, rows], 1)), colSpan: Math.round(clamp(cell === null || cell === void 0 ? void 0 : cell.colSpan, [1, columns], 1)),
        })).filter(cell => cell.rowSpan > 1 || cell.colSpan > 1);
        return definedOnly({ rows, columns, columnGap: clamp(value.columnGap, [0, 120], 12), rowGap: clamp(value.rowGap, [0, 120], 12),
            columnWeights: Array.isArray(value.columnWeights) ? Array.from({ length: columns }, (_, i) => clamp(value.columnWeights[i], [.05, 100], 1)) : undefined,
            rowHeights: Array.isArray(value.rowHeights) ? Array.from({ length: rows }, (_, i) => value.rowHeights[i] == null ? null : clamp(value.rowHeights[i], [1, 2000], 40)) : undefined,
            collapseEmptyRows: dropDefault(optionalBool(value.collapseEmptyRows), true), merges: merges.length ? merges : undefined });
    }
    function sanitizeFontAssets(raw) {
        if (!Array.isArray(raw))
            return undefined;
        const seen = new Set();
        const assets = [];
        for (const item of raw.slice(0, 12)) {
            if (!item || typeof item !== 'object' || !item.id || typeof item.data !== 'string' || !['ttf', 'otf'].includes(item.format))
                continue;
            const id = referenceID(item.id);
            if (seen.has(id))
                continue;
            seen.add(id);
            assets.push(definedOnly({ id, name: prefixChars(item.name || id, 100), data: item.data, format: item.format, weight: optionalClamp(item.weight, [1, 1000], 400),
                sha256: typeof item.sha256 === 'string' ? item.sha256 : undefined,
                license: typeof item.license === 'string' ? prefixChars(item.license, 2000) : undefined }));
        }
        return assets.length ? assets : undefined;
    }
    function sanitizeBase(raw, context) {
        return definedOnly({
            id: takeID(raw.id, context),
            name: typeof raw.name === 'string' && raw.name.trim() ? prefixChars(raw.name.trim(), 80) : undefined,
            frame: sanitizeFrame(raw.frame),
            locked: dropDefault(optionalBool(raw.locked), false),
            groupId: referenceID(raw.groupId),
            regionId: referenceID(raw.regionId),
            cell: raw.cell && typeof raw.cell === 'object' ? {
                row: Math.round(clamp(raw.cell.row, [0, 63], 0)),
                column: Math.round(clamp(raw.cell.column, [0, 11], 0)),
            } : undefined,
            decoration: dropDefault(optionalBool(raw.decoration), false),
            follow: sanitizeFollow(raw.follow),
            visible: dropDefault(optionalBool(raw.visible), true),
            opacity: dropDefault(optionalClamp(raw.opacity, exports.OPACITY_RANGE, 1), 1),
            rotation: dropDefault(optionalClamp(raw.rotation, exports.ROTATION_RANGE, 0), 0),
            position: raw.position === 'absolute' ? 'absolute' : undefined,
            anchor: dropDefault(enumOrUndefined(raw.anchor, exports.ANCHORS), 'center'),
            offsetX: dropDefault(optionalClamp(raw.offsetX, exports.OFFSET_RANGE, 0), 0),
            offsetY: dropDefault(optionalClamp(raw.offsetY, exports.OFFSET_RANGE, 0), 0),
            // 宽的缺省就是 fill，写不写一个样，收掉。
            width: dropDefault(sanitizeSizeRule(raw.width), 'fill'),
            height: sanitizeSizeRule(raw.height),
            minWidth: dropDefault(optionalClamp(raw.minWidth, exports.SIZE_RANGE, 0), 0),
            maxWidth: dropDefault(optionalClamp(raw.maxWidth, exports.SIZE_RANGE, 0), 0),
            minHeight: dropDefault(optionalClamp(raw.minHeight, exports.SIZE_RANGE, 0), 0),
            maxHeight: dropDefault(optionalClamp(raw.maxHeight, exports.SIZE_RANGE, 0), 0),
            grow: dropDefault(optionalClamp(raw.grow, exports.GROW_RANGE, 1), 1),
            alignSelf: enumOrUndefined(raw.alignSelf, exports.ALIGNS),
        });
    }
    function sanitizeNodeIn(raw, context, depth) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        // 超过上限的节点整个丢掉：树再怎么手改，排版的代价都有上界。
        if (!raw || typeof raw !== 'object' || Array.isArray(raw))
            return null;
        if (context.budget <= 0 || depth > exports.MAX_DEPTH)
            return null;
        const value = raw;
        const kind = value.kind;
        if (!exports.TEMPLATE_NODE_KINDS.includes(kind))
            return null; // 不认识的种类跳过
        context.budget -= 1;
        const base = sanitizeBase(value, context);
        switch (kind) {
            case 'stack': {
                const rawChildren = Array.isArray(value.children) ? value.children : [];
                const children = [];
                for (const child of rawChildren) {
                    const node = sanitizeNodeIn(child, context, depth + 1);
                    if (node)
                        children.push(node);
                }
                return definedOnly({
                    ...base,
                    kind: 'stack',
                    layout: enumOrUndefined(value.layout, ['canvas', 'region', 'grid']),
                    grid: sanitizeGrid(value.grid),
                    direction: value.direction === 'row' ? 'row' : 'column',
                    gap: dropDefault(optionalClamp(value.gap, exports.GAP_RANGE, 0), 0),
                    padding: sanitizePadding(value.padding),
                    align: dropDefault(enumOrUndefined(value.align, exports.ALIGNS), 'stretch'),
                    justify: dropDefault(enumOrUndefined(value.justify, exports.JUSTIFIES), 'start'),
                    fill: value.fill === undefined || value.fill === null ? undefined : clampColor(value.fill),
                    fillAccent: accentOrUndefined(value.fillAccent),
                    cornerRadius: dropDefault(optionalClamp(value.cornerRadius, exports.CORNER_RADIUS_RANGE, 0), 0),
                    stroke: sanitizeStroke(value.stroke),
                    clip: dropDefault(optionalBool(value.clip), false),
                    collapseWhenEmpty: dropDefault(optionalBool(value.collapseWhenEmpty), true),
                    children,
                });
            }
            case 'text':
                return definedOnly({
                    ...base,
                    kind: 'text',
                    binding: value.binding && typeof value.binding === 'object' && value.binding.kind === 'custom' && referenceID(value.binding.definitionId)
                        ? { kind: 'custom', definitionId: referenceID(value.binding.definitionId), name: prefixChars((_a = value.binding.name) !== null && _a !== void 0 ? _a : '自定义词条', 100) } : undefined,
                    fontId: (_b = referenceID(value.fontId)) !== null && _b !== void 0 ? _b : defaultFontID((_c = enumOrUndefined(value.design, exports.TEMPLATE_FONT_DESIGNS)) !== null && _c !== void 0 ? _c : '黑体'),
                    autoHeight: dropDefault(optionalBool(value.autoHeight), true),
                    field: (_d = enumOrUndefined(value.field, exports.TEMPLATE_FIELDS)) !== null && _d !== void 0 ? _d : '自定义文字',
                    text: prefixChars((_e = value.text) !== null && _e !== void 0 ? _e : '', 30000),
                    label: prefixChars((_f = value.label) !== null && _f !== void 0 ? _f : '', 40),
                    inlineLabel: dropDefault(optionalBool(value.inlineLabel), false),
                    fontSize: clamp(value.fontSize, exports.FONT_SIZE_RANGE, 12),
                    weight: (_g = enumOrUndefined(value.weight, exports.TEMPLATE_WEIGHTS)) !== null && _g !== void 0 ? _g : '常规',
                    design: (_h = enumOrUndefined(value.design, exports.TEMPLATE_FONT_DESIGNS)) !== null && _h !== void 0 ? _h : '黑体',
                    alignment: (_j = enumOrUndefined(value.alignment, exports.TEMPLATE_ALIGNMENTS)) !== null && _j !== void 0 ? _j : '左对齐',
                    color: clampColor(value.color),
                    accent: accentOrUndefined(value.accent),
                    tracking: clamp(value.tracking, exports.TRACKING_RANGE, 0),
                    lineLimit: Math.min(exports.LINE_LIMIT_RANGE[1], Math.max(exports.LINE_LIMIT_RANGE[0], Math.round(num(value.lineLimit, 3)))),
                    uppercase: !!value.uppercase,
                    chip: value.chip === undefined || value.chip === null ? undefined : clampColor(value.chip),
                    chipAccent: accentOrUndefined(value.chipAccent),
                    hideWhenEmpty: dropDefault(optionalBool(value.hideWhenEmpty), true),
                });
            case 'image':
                return definedOnly({
                    ...base,
                    kind: 'image',
                    handwriting: sanitizeHandwriting(value.handwriting),
                    source: sanitizeImageSource(value.source),
                    imageAspect: optionalClamp(value.imageAspect, exports.IMAGE_ASPECT_RANGE, 1),
                    isSticker: dropDefault(optionalBool(value.isSticker), false),
                    video: sanitizeVideoSource(value.video),
                    aspect: sanitizeFrameAspect(value.aspect),
                    fit: value.fit === 'contain' ? 'contain' : 'cover',
                    focusX: clamp(value.focusX, exports.FOCUS_RANGE, 0.5),
                    focusY: clamp(value.focusY, exports.FOCUS_RANGE, 0.5),
                    zoom: clamp(value.zoom, exports.ZOOM_RANGE, 1),
                    tilt: clamp(value.tilt, exports.TILT_RANGE, 0),
                    cornerRadius: dropDefault(optionalClamp(value.cornerRadius, exports.CORNER_RADIUS_RANGE, 0), 0),
                    border: dropDefault(optionalClamp(value.border, exports.BORDER_RANGE, 0), 0),
                    shadow: dropDefault(optionalBool(value.shadow), false),
                });
            case 'shape':
                return definedOnly({
                    ...base,
                    kind: 'shape',
                    shape: (_k = enumOrUndefined(value.shape, exports.TEMPLATE_SHAPES)) !== null && _k !== void 0 ? _k : '矩形',
                    color: clampColor(value.color),
                    accent: accentOrUndefined(value.accent),
                    cornerRadius: dropDefault(optionalClamp(value.cornerRadius, exports.CORNER_RADIUS_RANGE, 0), 0),
                    strokeWidth: dropDefault(optionalClamp(value.strokeWidth, exports.STROKE_RANGE, 0), 0),
                    dashLength: dropDefault(optionalClamp(value.dashLength, exports.DASH_RANGE, 0), 0),
                    dashGap: dropDefault(optionalClamp(value.dashGap, exports.DASH_RANGE, 0), 0),
                });
            default:
                return definedOnly({ ...base, kind: 'spacer' });
        }
    }
    function newContext(env) {
        return { env: resolveEnvironment(env), seen: new Set(), budget: exports.MAX_NODES };
    }
    /** 单个节点（连同子树）的清洗；不认识的种类返回 null。 */
    function sanitizeNode(raw, env) {
        return sanitizeNodeIn(raw, newContext(env), 1);
    }
    function sanitizeCanvasImage(raw) {
        if (!raw || typeof raw !== 'object')
            return undefined;
        const value = raw;
        const data = typeof value.data === 'string' && value.data ? value.data : undefined;
        const asset = value.asset && typeof value.asset === 'object' ? value.asset : undefined;
        if (!data && !asset)
            return undefined;
        return definedOnly({
            data,
            asset,
            imageAspect: optionalClamp(value.imageAspect, exports.IMAGE_ASPECT_RANGE, 1),
            focusX: clamp(value.focusX, exports.FOCUS_RANGE, 0.5),
            focusY: clamp(value.focusY, exports.FOCUS_RANGE, 0.5),
            zoom: clamp(value.zoom, exports.ZOOM_RANGE, 1),
            opacity: clamp(value.opacity, [0, 1], 1),
        });
    }
    function sanitizeCanvas(raw) {
        var _a;
        const value = (raw && typeof raw === 'object' ? raw : {});
        const rawHeight = value.height;
        const aspect = rawHeight && typeof rawHeight === 'object'
            ? rawHeight.aspect
            : undefined;
        return definedOnly({
            width: exports.CANVAS_WIDTH,
            height: typeof aspect === 'number' && Number.isFinite(aspect)
                ? { aspect: clamp(aspect, exports.ASPECT_RANGE, 1.4) }
                : 'hug',
            padding: (_a = sanitizePadding(value.padding)) !== null && _a !== void 0 ? _a : exports.ZERO_PADDING,
            background: clampColor(value.background),
            backgroundAccent: accentOrUndefined(value.backgroundAccent),
            image: sanitizeCanvasImage(value.image),
            exportWidth: optionalClamp(value.exportWidth, exports.EXPORT_WIDTH_RANGE, exports.DEFAULT_EXPORT_WIDTH),
        });
    }
    /**
     * 每个数都有界、id 不重复、节点数与深度有上限、根一定是 column stack。
     * 解码就是清洗：文件里写的就是这个形状，所以手改过的文件污染不了档案。
     */
    function sanitizeTemplate(raw, env) {
        var _a;
        const context = newContext(env);
        const value = (raw && typeof raw === 'object' ? raw : {});
        const trimmed = prefixChars(String((_a = value.name) !== null && _a !== void 0 ? _a : '').trim(), exports.MAX_NAME_LENGTH);
        const sanitizedRoot = sanitizeNodeIn(value.root, context, 1);
        // 根必须是 column stack：不是 stack 的（或整个缺了的）就现做一个把它装进去。
        const root = sanitizedRoot && isStackNode(sanitizedRoot)
            ? { ...sanitizedRoot, direction: 'column' }
            : {
                kind: 'stack',
                id: takeID(undefined, context),
                direction: 'column',
                children: sanitizedRoot ? [sanitizedRoot] : [],
            };
        return definedOnly({
            fontAssets: sanitizeFontAssets(value.fontAssets),
            id: isUUID(value.id) ? String(value.id).toUpperCase() : context.env.newID(),
            name: trimmed || exports.DEFAULT_TEMPLATE_NAME,
            canvas: sanitizeCanvas(value.canvas),
            root,
            createdAt: typeof value.createdAt === 'string' ? value.createdAt : context.env.now(),
            updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : context.env.now(),
        });
    }
    // MARK: - 起始排版
    exports.STARTERS = [
        { id: '拍立得', subtitle: '白边相纸，下方手写一句' },
        { id: '展览海报', subtitle: '大字标题压在封面上' },
        { id: '信息票根', subtitle: '封面在上，字段整齐排在下方' },
        { id: '空白画布', subtitle: '只有底色，全部自己来' },
    ];
    function starterSubtitle(starter) {
        return exports.STARTERS.find((item) => item.id === starter).subtitle;
    }
    /**
     * 四种起点。写法与内置风格同构（一棵响应式的树），只是简单得多：
     * 起点是「给用户改的底子」，所以每一块都能删掉而不会塌。
     */
    function starterTemplate(starter, name, env) {
        const base = defaultTemplate(env);
        const nodes = [];
        const width = 312;
        if (starter !== '空白画布') {
            const cover = makeImageNode('cover', { frame: { x: 0, y: 0, width, height: starter === '展览海报' ? 380 : 250 },
                border: starter === '拍立得' ? 12 : 0, cornerRadius: 4, shadow: starter === '拍立得' }, env);
            const title = makeTextNode('名称', { frame: { x: 0, y: 0, width, height: 40 }, fontSize: 28,
                follow: { targetId: cover.id, gap: 18 } }, env);
            const date = makeTextNode('日期', { frame: { x: 0, y: 0, width, height: 22 }, fontSize: 12,
                follow: { targetId: title.id, gap: 10 } }, env);
            const venue = makeTextNode('城市与场馆', { frame: { x: 0, y: 0, width, height: 22 }, fontSize: 12,
                follow: { targetId: date.id, gap: 6 } }, env);
            const quote = makeTextNode('金句', { frame: { x: 0, y: 0, width, height: 22 }, fontSize: 15,
                follow: { targetId: venue.id, gap: 18 }, design: '宋体' }, env);
            const information = makeStackNode('column', { name: '文字与信息', layout: 'grid', children: [],
                frame: { x: 0, y: 0, width, height: 0 }, follow: { targetId: cover.id, gap: 18 },
                grid: { rows: 3, columns: 2, rowGap: 12, columnGap: 16, merges: [{ row: 0, column: 0, colSpan: 2 }, { row: 2, column: 0, colSpan: 2 }] } }, env);
            nodes.push(cover, information, { ...title, regionId: information.id, cell: { row: 0, column: 0 }, follow: undefined }, { ...date, regionId: information.id, cell: { row: 1, column: 0 }, follow: undefined }, { ...venue, regionId: information.id, cell: { row: 1, column: 1 }, follow: undefined }, { ...quote, regionId: information.id, cell: { row: 2, column: 0 }, follow: undefined });
        }
        return sanitizeTemplate({ ...base, name: name !== null && name !== void 0 ? name : starter,
            canvas: { ...base.canvas, height: starter === '空白画布' ? { aspect: 1.4 } : 'hug' },
            root: { ...base.root, layout: 'canvas', children: nodes } }, env);
    }
    function defaultPosterOptions() {
        return {
            showDate: true,
            showVenue: true,
            showRating: true,
            showNote: true,
            showQuote: true,
            showSetlist: true,
            showAuthor: true,
            showPrice: false,
            showSeat: false,
            showCompanions: false,
            headline: '',
            locale: 'zh-Hans',
        };
    }
    function toDate(value) {
        if (!value)
            return null;
        const date = value instanceof Date ? value : new Date(value);
        return Number.isFinite(date.getTime()) ? date : null;
    }
    /** 活动当地的年月日时分：有时区偏移就按偏移算，否则按设备本地时区。 */
    function dateParts(record) {
        const date = toDate(record.date);
        if (!date)
            return null;
        if (typeof record.utcOffsetSeconds === 'number' && Number.isFinite(record.utcOffsetSeconds)) {
            const shifted = new Date(date.getTime() + record.utcOffsetSeconds * 1000);
            return {
                year: shifted.getUTCFullYear(),
                month: shifted.getUTCMonth() + 1,
                day: shifted.getUTCDate(),
                hour: shifted.getUTCHours(),
                minute: shifted.getUTCMinutes(),
            };
        }
        return {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate(),
            hour: date.getHours(),
            minute: date.getMinutes(),
        };
    }
    function pad(value, width) {
        return String(value).padStart(width, '0');
    }
    const EN_MONTHS = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
    ];
    /** `.dateTime.year().month().day()` 在简体中文与英文下的写法。 */
    function formatLongDate(parts, locale) {
        if (locale === 'en')
            return `${EN_MONTHS[parts.month - 1]} ${parts.day}, ${parts.year}`;
        return `${parts.year}年${parts.month}月${parts.day}日`;
    }
    /** `.dateTime.hour().minute()`：中文 24 小时制，英文 12 小时制。 */
    function formatTime(parts, locale) {
        if (locale === 'en') {
            const suffix = parts.hour < 12 ? 'AM' : 'PM';
            const hour = parts.hour % 12 === 0 ? 12 : parts.hour % 12;
            return `${hour}:${pad(parts.minute, 2)} ${suffix}`;
        }
        return `${pad(parts.hour, 2)}:${pad(parts.minute, 2)}`;
    }
    function starsText(rating) {
        const value = Math.min(5, Math.max(0, Math.round(rating)));
        return '★'.repeat(value) + '☆'.repeat(5 - value);
    }
    /** 记忆编号：UUID 字符串的 UTF-8 字节滚动求和，四位。 */
    function memoryNumber(id) {
        let value = 0;
        for (const byte of utf8Bytes(String(id)))
            value = (value * 31 + byte) % 10000;
        return String(value).padStart(4, '0');
    }
    function utf8Bytes(text) {
        const bytes = [];
        for (let i = 0; i < text.length; i++) {
            let code = text.charCodeAt(i);
            if (code >= 0xd800 && code <= 0xdbff && i + 1 < text.length) {
                const next = text.charCodeAt(i + 1);
                if (next >= 0xdc00 && next <= 0xdfff) {
                    code = (code - 0xd800) * 0x400 + (next - 0xdc00) + 0x10000;
                    i++;
                }
            }
            if (code < 0x80)
                bytes.push(code);
            else if (code < 0x800)
                bytes.push(0xc0 | (code >> 6), 0x80 | (code & 63));
            else if (code < 0x10000)
                bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 63), 0x80 | (code & 63));
            else
                bytes.push(0xf0 | (code >> 18), 0x80 | ((code >> 12) & 63), 0x80 | ((code >> 6) & 63), 0x80 | (code & 63));
        }
        return bytes;
    }
    function setlistLines(record) {
        const value = record.setlist;
        if (!value)
            return [];
        const lines = Array.isArray(value) ? value.slice() : String(value).split(/\r\n|\r|\n/);
        return lines.map((line) => String(line).trim()).filter((line) => line.length > 0);
    }
    function makeCardBits(record, options = defaultPosterOptions(), author = '') {
        var _a, _b, _c, _d, _e, _f, _g;
        const locale = (_a = options.locale) !== null && _a !== void 0 ? _a : 'zh-Hans';
        const parts = dateParts(record);
        const hasDate = record.hasConfirmedDate !== false;
        const hasTime = hasDate && record.hasConfirmedTime !== false;
        const showDate = options.showDate && hasDate && !!parts;
        const present = (text) => (text ? text : null);
        const city = (_b = record.city) !== null && _b !== void 0 ? _b : '';
        const venue = (_c = record.venue) !== null && _c !== void 0 ? _c : '';
        const locationLine = [city, venue].filter((item) => item.length > 0).join(' · ');
        const rating = options.showRating && ((_d = record.rating) !== null && _d !== void 0 ? _d : 0) > 0 ? record.rating : null;
        return {
            record,
            options,
            author,
            kindName: (_e = record.kindName) !== null && _e !== void 0 ? _e : '',
            kindEnglish: (_f = record.kindEnglish) !== null && _f !== void 0 ? _f : '',
            headline: present(options.headline.trim()),
            date: showDate && parts ? formatLongDate(parts, locale) : null,
            dateNumeric: showDate && parts
                ? `${pad(parts.year, 4)}.${pad(parts.month, 2)}.${pad(parts.day, 2)}`
                : null,
            dayMonth: showDate && parts ? `${pad(parts.month, 2)}.${pad(parts.day, 2)}` : null,
            year: showDate && parts ? String(parts.year) : null,
            time: options.showDate && hasTime && parts ? formatTime(parts, locale) : null,
            venue: options.showVenue ? present(locationLine) : null,
            city: options.showVenue ? present(city) : null,
            quote: options.showQuote ? present(record.quote) : null,
            note: options.showNote ? present(record.note) : null,
            rating,
            mood: options.showRating ? present(record.mood) : null,
            price: options.showPrice && typeof record.price === 'number'
                ? `${record.price.toFixed(2)} ${(_g = record.currency) !== null && _g !== void 0 ? _g : 'CNY'}`
                : null,
            seat: options.showSeat ? present(record.seat) : null,
            companions: options.showCompanions ? present(record.companions) : null,
            signature: options.showAuthor ? author : null,
            setlist: options.showSetlist ? setlistLines(record) : [],
            stars: rating === null ? '' : starsText(rating),
        };
    }
    function templateText(node, bits) {
        const raw = rawTemplateText(node, bits);
        if (raw === null)
            return null;
        return node.uppercase ? raw.toUpperCase() : raw;
    }
    function rawTemplateText(element, bits) {
        const record = bits.record;
        const present = (text) => (text ? text : null);
        switch (element.field) {
            case '名称':
                return present(record.title);
            case '副标题':
                return present(record.subtitle);
            case '艺人 / 卡司':
                return present(record.performers);
            case '类型':
                return bits.kindName;
            case '英文类型':
                return bits.kindEnglish;
            case '日期':
                return bits.date;
            case '数字日期':
                return bits.dateNumeric;
            case '时间':
                return bits.time;
            case '场馆':
                return bits.options.showVenue ? present(record.venue) : null;
            case '城市':
                return bits.city;
            case '城市与场馆':
                return bits.venue;
            case '月日':
                return bits.dayMonth;
            case '年份':
                return bits.year;
            case '评分星星':
                return bits.rating === null ? null : bits.stars;
            case '心情':
                return present(bits.mood);
            case '金句':
                return bits.quote;
            case '感想':
                return bits.note;
            case '曲目单':
                return bits.setlist.length ? bits.setlist.join('\n') : null;
            case '票价':
                return bits.price;
            case '座位':
                return bits.seat;
            case '同行人':
                return bits.companions;
            case '开场白':
                return bits.headline;
            case '署名':
                return bits.signature === null ? null : 'COLLECTED BY ' + bits.signature;
            case '余响标识':
                return 'LIVEMARK';
            case '编号':
                return 'NO. ' + memoryNumber(record.id);
            case '条码':
                return String(record.id).toUpperCase();
            default:
                return present(element.text);
        }
    }

  });

  define("core/template/layout", function (module, exports, require) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.layoutTemplate = layoutTemplate;
    const canvasLayout_1 = require("./canvasLayout");
    // 海报的排版引擎：一棵盒子树 + 一份「这条记录里每个文字节点印什么」→ 一串带 frame 的图元。
    // 设计规格见 Documentation/POSTER.md 第 2 节。
    //
    // 语义照 Figma Auto Layout / CSS flex 的一个小子集定义（hug / fill / fixed / fraction、
    // padding、gap、align、justify、绝对定位），自己写而不用 Yoga：
    //   * 纯 TypeScript，不 import react / react-native / skia，跨平台结果逐位一致，可以在 Jest 里断言；
    //   * 文字有多高只有画笔知道，所以量文字这件事由调用方注入（`Measure`），引擎本身没有字体概念。
    //
    // 画的顺序照 Figma 的图层顺序：前序遍历，父（底色 / 描边）先于子，同一个 stack 的子节点
    // **按 children 数组的顺序**画，绝对定位的也在这个顺序里——排在前面的垫在下面，排在后面的压在上面。
    // 于是「垫在内容底下的装饰」写得出来（点阵纸纹放第一个），编辑器的上移 / 下移对绝对定位节点同样有效。
    //
    // 性能：一次排版只走一遍树，除 measure 外全是加减乘；120 个节点远在 1 ms 以内。
    // measure 的调用次数 = text 节点数：每个节点在最终宽度上量一次；宽度规则是 hug 的还要先量一次
    // 「不换行的固有宽」（maxWidth = Infinity），所以最多两次，同一个请求由缓存兜住。
    const model_1 = require("./model");
    function finite(value, fallback = 0) {
        return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
    }
    // MARK: - 规则 1：收起判定（自底向上）
    function isCollapsed(node, context) {
        const cached = context.collapsed.get(node.id);
        if (cached !== undefined)
            return cached;
        const value = computeCollapsed(node, context);
        context.collapsed.set(node.id, value);
        return value;
    }
    function computeCollapsed(node, context) {
        var _a;
        if (node.visible === false)
            return true;
        if (node.kind === 'text') {
            const value = (_a = context.values[node.id]) !== null && _a !== void 0 ? _a : null;
            return value === null && node.hideWhenEmpty !== false;
        }
        if (node.kind === 'stack') {
            if (node.collapseWhenEmpty === false)
                return false;
            // spacer 不算「有内容」：只剩弹簧的容器等于空的。绝对定位的子节点也不算，
            // 不然一枚贴纸就能把空卡片留在海报上；要留住这种容器就写 collapseWhenEmpty: false。
            const hasContent = node.children.some((child) => {
                var _a;
                return ((_a = child.position) !== null && _a !== void 0 ? _a : 'flow') !== 'absolute' &&
                    child.kind !== 'spacer' &&
                    !isCollapsed(child, context);
            });
            return !hasContent;
        }
        return false;
    }
    // MARK: - 尺寸规则
    function widthRule(node) {
        var _a;
        return (_a = node.width) !== null && _a !== void 0 ? _a : 'fill';
    }
    /** undefined 表示「自然高」：文字量出来的、图片按比例算的、形状的缺省高、容器的 hug。 */
    function heightRule(node) {
        if (node.height !== undefined)
            return node.height;
        return node.kind === 'spacer' ? 'fill' : undefined;
    }
    function fractionOf(rule) {
        return rule && typeof rule === 'object' ? finite(rule.fraction, 1) : null;
    }
    function clampWidth(node, value) {
        let out = value;
        if (node.maxWidth !== undefined)
            out = Math.min(out, node.maxWidth);
        if (node.minWidth !== undefined)
            out = Math.max(out, node.minWidth);
        return Math.max(0, out);
    }
    function clampHeight(node, value) {
        let out = value;
        if (node.maxHeight !== undefined)
            out = Math.min(out, node.maxHeight);
        if (node.minHeight !== undefined)
            out = Math.max(out, node.minHeight);
        return Math.max(0, out);
    }
    function imageAspect(node) {
        var _a;
        if (node.kind !== 'image')
            return 1;
        if (node.aspect === 'natural')
            return finite((_a = node.imageAspect) !== null && _a !== void 0 ? _a : 1, 1);
        return finite(node.aspect, 1);
    }
    // MARK: - 量文字
    function measureText(node, maxWidth, context) {
        var _a, _b, _c;
        const key = node.id + '|' + (Number.isFinite(maxWidth) ? String(maxWidth) : 'inf');
        const hit = context.cache.get(key);
        if (hit)
            return hit;
        const value = (_a = context.values[node.id]) !== null && _a !== void 0 ? _a : null;
        const measured = context.measure({
            text: value !== null && value !== void 0 ? value : '',
            label: node.label,
            inlineLabel: !!node.inlineLabel,
            fontSize: node.fontSize,
            fontId: node.fontId,
            weight: node.weight,
            design: node.design,
            alignment: node.alignment,
            tracking: node.tracking,
            lineLimit: node.lineLimit,
            chip: !!node.chip || !!node.chipAccent,
            barcode: node.field === '条码',
            maxWidth,
        });
        const safe = {
            width: Math.max(0, finite((_b = measured === null || measured === void 0 ? void 0 : measured.width) !== null && _b !== void 0 ? _b : 0)),
            height: Math.max(0, finite((_c = measured === null || measured === void 0 ? void 0 : measured.height) !== null && _c !== void 0 ? _c : 0)),
        };
        context.cache.set(key, safe);
        return safe;
    }
    // MARK: - 规则 2：宽度
    /** hug：按内容有多宽。`avail` 是上限（行里是「当下剩余」）。 */
    function hugWidth(node, avail, context) {
        var _a, _b;
        switch (node.kind) {
            case 'text':
                // 不换行时的固有宽；比可用宽还宽就只能换行，那就等于可用宽。
                return Math.min(measureText(node, Infinity, context).width, avail);
            case 'image': {
                // 高度给了定数时反推宽度（极简留白的 96 × 124 小图），否则只能撑满。
                const rule = heightRule(node);
                return typeof rule === 'number' ? rule / Math.max(0.01, imageAspect(node)) : avail;
            }
            case 'stack': {
                const pad = (_a = node.padding) !== null && _a !== void 0 ? _a : model_1.ZERO_PADDING;
                const inner = Math.max(0, avail - pad.left - pad.right);
                const gap = (_b = node.gap) !== null && _b !== void 0 ? _b : 0;
                const flow = flowChildren(node, context);
                if (flow.length === 0)
                    return pad.left + pad.right;
                const widths = flow.map((child) => intrinsicWidth(child, inner, context));
                const content = node.direction === 'row'
                    ? widths.reduce((sum, value) => sum + value, 0) + gap * (flow.length - 1)
                    : widths.reduce((most, value) => Math.max(most, value), 0);
                return Math.min(avail, content + pad.left + pad.right);
            }
            default:
                return avail;
        }
    }
    /** 一个子节点「想要」多宽：定数与比例照算，fill 与 hug 都按内容。 */
    function intrinsicWidth(node, avail, context) {
        const rule = widthRule(node);
        if (typeof rule === 'number')
            return clampWidth(node, rule);
        const fraction = fractionOf(rule);
        if (fraction !== null)
            return clampWidth(node, avail * fraction);
        return clampWidth(node, hugWidth(node, avail, context));
    }
    /** 列方向（或绝对定位）里子节点的最终宽度：fill 撑满可用宽。 */
    function resolveWidth(node, avail, context) {
        const rule = widthRule(node);
        if (rule === 'fill')
            return clampWidth(node, avail);
        return intrinsicWidth(node, avail, context);
    }
    // MARK: - 规则 3：高度
    function naturalHeight(node, width, context) {
        switch (node.kind) {
            case 'text':
                return measureText(node, width, context).height;
            case 'image':
                return width * imageAspect(node);
            case 'shape':
                return (0, model_1.defaultShapeHeight)(node.shape);
            default:
                return 0; // spacer：hug 的父里等于 0
        }
    }
    /**
     * 父给子定高：定数照用，比例按父内容高，fill 交给主轴分配（返回 null 表示「还没定」）。
     * `available` 是父的内容高，null 表示父自己也是 hug。
     */
    function assignedHeight(node, available) {
        const rule = heightRule(node);
        if (typeof rule === 'number')
            return rule;
        const fraction = fractionOf(rule);
        if (fraction !== null)
            return available === null ? null : available * fraction;
        return null;
    }
    function isFlexibleHeight(node) {
        return heightRule(node) === 'fill';
    }
    function growOf(node) {
        const value = node.grow === undefined ? 1 : finite(node.grow, 1);
        return Math.max(0, value);
    }
    // MARK: - 规则 4：摆放
    function alignFor(child, stack) {
        var _a, _b;
        return (_b = (_a = child.alignSelf) !== null && _a !== void 0 ? _a : stack.align) !== null && _b !== void 0 ? _b : 'stretch';
    }
    /** 交叉轴上的位置：stretch 对已经定好大小的节点等于 start。 */
    function alignOffset(align, available, size) {
        const free = Math.max(0, available - size);
        if (align === 'center')
            return free / 2;
        if (align === 'end')
            return free;
        return 0;
    }
    function distribute(justify, free, count) {
        if (free <= 0 || count === 0)
            return { start: 0, between: 0 };
        switch (justify) {
            case 'center':
                return { start: free / 2, between: 0 };
            case 'end':
                return { start: free, between: 0 };
            case 'spaceBetween':
                return count > 1 ? { start: 0, between: free / (count - 1) } : { start: 0, between: 0 };
            case 'spaceAround': {
                const slot = free / count;
                return { start: slot / 2, between: slot };
            }
            case 'spaceEvenly': {
                const slot = free / (count + 1);
                return { start: slot, between: slot };
            }
            default:
                return { start: 0, between: 0 };
        }
    }
    function anchorFactors(anchor) {
        const x = anchor.includes('Left') || anchor === 'left' ? 0 : anchor.includes('Right') || anchor === 'right' ? 1 : 0.5;
        const y = anchor.startsWith('top') ? 0 : anchor.startsWith('bottom') ? 1 : 0.5;
        return [x, y];
    }
    function flowChildren(stack, context) {
        return stack.children.filter((child) => { var _a; return !isCollapsed(child, context) && ((_a = child.position) !== null && _a !== void 0 ? _a : 'flow') !== 'absolute'; });
    }
    function absoluteChildren(stack, context) {
        return stack.children.filter((child) => !isCollapsed(child, context) && child.position === 'absolute');
    }
    // MARK: - 排一个节点
    function layoutNode(node, width, height, context) {
        if ((0, model_1.isStackNode)(node))
            return layoutStack(node, width, height, context);
        const own = height === null ? naturalHeight(node, width, context) : height;
        return { node, width, height: clampHeight(node, own), x: 0, y: 0, children: [] };
    }
    function layoutStack(stack, width, height, context) {
        var _a, _b, _c;
        const pad = (_a = stack.padding) !== null && _a !== void 0 ? _a : model_1.ZERO_PADDING;
        const gap = (_b = stack.gap) !== null && _b !== void 0 ? _b : 0;
        const contentWidth = Math.max(0, width - pad.left - pad.right);
        const contentHeight = height === null ? null : Math.max(0, height - pad.top - pad.bottom);
        const flow = flowChildren(stack, context);
        const boxes = stack.direction === 'row'
            ? layoutRow(stack, flow, contentWidth, contentHeight, gap, context)
            : layoutColumn(stack, flow, contentWidth, contentHeight, gap, context);
        // 自己的高：给定就用给定的，否则 hug（列 = 子高之和 + 间距，行 = 最高的那个）。
        const used = stack.direction === 'row'
            ? boxes.reduce((most, box) => Math.max(most, box.height), 0)
            : boxes.reduce((sum, box) => sum + box.height, 0) + gap * Math.max(0, boxes.length - 1);
        const innerHeight = contentHeight === null ? used : contentHeight;
        const outerHeight = clampHeight(stack, innerHeight + pad.top + pad.bottom);
        const finalInner = Math.max(0, outerHeight - pad.top - pad.bottom);
        place(stack, boxes, pad, gap, contentWidth, finalInner);
        // 规则 5：绝对定位的子节点等父盒定好再排，相对 padding box；不参与父的 hug。
        const absolutes = absoluteChildren(stack, context).map((child) => layoutAbsolute(child, pad, contentWidth, finalInner, context));
        // 规则 6：算是分两轮算的，画却按 children 原来的顺序画，绝对定位的不再一律靠后。
        const ordered = [];
        let flowIndex = 0;
        let absoluteIndex = 0;
        for (const child of stack.children) {
            if (isCollapsed(child, context))
                continue;
            ordered.push(((_c = child.position) !== null && _c !== void 0 ? _c : 'flow') === 'absolute' ? absolutes[absoluteIndex++] : boxes[flowIndex++]);
        }
        return {
            node: stack,
            width,
            height: outerHeight,
            x: 0,
            y: 0,
            children: ordered,
        };
    }
    function layoutColumn(stack, flow, contentWidth, contentHeight, gap, context) {
        const boxes = [];
        const flexible = [];
        let fixedSum = 0;
        flow.forEach((child, index) => {
            const childWidth = resolveWidth(child, contentWidth, context);
            const flexible1 = isFlexibleHeight(child) && contentHeight !== null;
            if (flexible1) {
                // 先占个位，等会儿按 grow 分剩余高度。
                boxes.push({ node: child, width: childWidth, height: 0, x: 0, y: 0, children: [] });
                flexible.push(index);
                return;
            }
            const box = layoutNode(child, childWidth, assignedHeight(child, contentHeight), context);
            fixedSum += box.height;
            boxes.push(box);
        });
        if (flexible.length > 0 && contentHeight !== null) {
            const free = Math.max(0, contentHeight - fixedSum - gap * Math.max(0, flow.length - 1));
            const totalGrow = flexible.reduce((sum, index) => sum + growOf(flow[index]), 0);
            for (const index of flexible) {
                const share = totalGrow > 0 ? (free * growOf(flow[index])) / totalGrow : 0;
                boxes[index] = layoutNode(flow[index], boxes[index].width, clampHeight(flow[index], share), context);
            }
        }
        return boxes;
    }
    function layoutRow(stack, flow, contentWidth, contentHeight, gap, context) {
        const widths = new Array(flow.length).fill(0);
        const fills = [];
        let remaining = Math.max(0, contentWidth - gap * Math.max(0, flow.length - 1));
        flow.forEach((child, index) => {
            if (widthRule(child) === 'fill') {
                fills.push(index);
                return;
            }
            // hug 的上限是当下剩余，先到先得；定数与比例照算（可能超出，超了也不缩）。
            const value = widthRule(child) === 'hug'
                ? clampWidth(child, hugWidth(child, Math.max(0, remaining), context))
                : intrinsicWidth(child, contentWidth, context);
            widths[index] = value;
            remaining -= value;
        });
        if (fills.length > 0) {
            const free = Math.max(0, remaining);
            const totalGrow = fills.reduce((sum, index) => sum + growOf(flow[index]), 0);
            for (const index of fills) {
                const share = totalGrow > 0 ? (free * growOf(flow[index])) / totalGrow : 0;
                widths[index] = clampWidth(flow[index], share);
            }
        }
        // 行的内容高：给定就用给定的，否则取最高的那个（fill 高的子节点跟着这个高）。
        const boxes = flow.map((child, index) => isFlexibleHeight(child)
            ? { node: child, width: widths[index], height: 0, x: 0, y: 0, children: [] }
            : layoutNode(child, widths[index], assignedHeight(child, contentHeight), context));
        const natural = boxes.reduce((most, box) => Math.max(most, box.height), 0);
        const rowHeight = contentHeight === null ? natural : contentHeight;
        flow.forEach((child, index) => {
            if (!isFlexibleHeight(child))
                return;
            boxes[index] = layoutNode(child, widths[index], clampHeight(child, rowHeight), context);
        });
        return boxes;
    }
    function place(stack, boxes, pad, gap, contentWidth, contentHeight) {
        var _a;
        const justify = (_a = stack.justify) !== null && _a !== void 0 ? _a : 'start';
        if (stack.direction === 'row') {
            const used = boxes.reduce((sum, box) => sum + box.width, 0) + gap * Math.max(0, boxes.length - 1);
            const spread = distribute(justify, contentWidth - used, boxes.length);
            let x = pad.left + spread.start;
            for (const box of boxes) {
                box.x = x;
                box.y = pad.top + alignOffset(alignFor(box.node, stack), contentHeight, box.height);
                x += box.width + gap + spread.between;
            }
            return;
        }
        const used = boxes.reduce((sum, box) => sum + box.height, 0) + gap * Math.max(0, boxes.length - 1);
        const spread = distribute(justify, contentHeight - used, boxes.length);
        let y = pad.top + spread.start;
        for (const box of boxes) {
            box.x = pad.left + alignOffset(alignFor(box.node, stack), contentWidth, box.width);
            box.y = y;
            y += box.height + gap + spread.between;
        }
    }
    function layoutAbsolute(node, pad, contentWidth, contentHeight, context) {
        var _a, _b, _c;
        const width = resolveWidth(node, contentWidth, context);
        const rule = heightRule(node);
        const assigned = rule === 'fill' ? contentHeight : assignedHeight(node, contentHeight);
        const box = layoutNode(node, width, assigned === null ? null : clampHeight(node, assigned), context);
        const [ax, ay] = anchorFactors((_a = node.anchor) !== null && _a !== void 0 ? _a : 'center');
        box.x = pad.left + contentWidth * ax - box.width * ax + finite((_b = node.offsetX) !== null && _b !== void 0 ? _b : 0);
        box.y = pad.top + contentHeight * ay - box.height * ay + finite((_c = node.offsetY) !== null && _c !== void 0 ? _c : 0);
        return box;
    }
    // MARK: - 规则 6 / 7 / 8：画的顺序、旋转、画布
    function layoutTemplate(template, values, measure, options = {}) {
        var _a;
        if (template.root.layout === 'canvas')
            return (0, canvasLayout_1.layoutCanvas)(template, values, measure, options);
        const context = {
            values: values !== null && values !== void 0 ? values : {},
            measure,
            cache: new Map(),
            collapsed: new Map(),
        };
        const canvas = template.canvas;
        const pad = (_a = canvas.padding) !== null && _a !== void 0 ? _a : model_1.ZERO_PADDING;
        const width = model_1.CANVAS_WIDTH;
        const fixedHeight = typeof canvas.height === 'object'
            ? (0, model_1.roundHalfAwayFromZero)(width * finite(canvas.height.aspect, 1.4))
            : null;
        const rootWidth = Math.max(0, width - pad.left - pad.right);
        const rootHeight = fixedHeight === null ? null : Math.max(0, fixedHeight - pad.top - pad.bottom);
        // 根永不收起：整张海报空着也要留一张画布给用户下手。
        const rootBox = layoutStack(template.root, rootWidth, rootHeight, context);
        rootBox.x = pad.left;
        rootBox.y = pad.top;
        const height = fixedHeight === null ? rootBox.height + pad.top + pad.bottom : fixedHeight;
        const nodes = [];
        const byID = {};
        const emit = (box, parent, depth, originX, originY, opacity) => {
            var _a, _b;
            const x = originX + box.x;
            const y = originY + box.y;
            const own = opacity * finite((_a = box.node.opacity) !== null && _a !== void 0 ? _a : 1, 1);
            const laid = {
                id: box.node.id,
                kind: box.node.kind,
                node: box.node,
                frame: { x, y, width: box.width, height: box.height },
                rotation: finite((_b = box.node.rotation) !== null && _b !== void 0 ? _b : 0),
                opacity: own,
                collapsed: false,
                depth,
                ...(parent === undefined ? {} : { parent }),
            };
            nodes.push(laid);
            byID[laid.id] = laid;
            for (const child of box.children)
                emit(child, box.node.id, depth + 1, x, y, own);
        };
        emit(rootBox, undefined, 1, 0, 0, 1);
        // 收起的节点不画，但编辑器的图层面板要知道它们还在树上。
        const mark = (node, parent, depth) => {
            if (!byID[node.id]) {
                byID[node.id] = {
                    id: node.id,
                    kind: node.kind,
                    node,
                    frame: { x: 0, y: 0, width: 0, height: 0 },
                    rotation: 0,
                    opacity: 0,
                    collapsed: true,
                    depth,
                    ...(parent === undefined ? {} : { parent }),
                };
            }
            if ((0, model_1.isStackNode)(node)) {
                for (const child of node.children)
                    mark(child, node.id, depth + 1);
            }
        };
        mark(template.root, undefined, 1);
        return { width, height, nodes, byID };
    }

  });

  define("core/template/document", function (module, exports, require) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TemplateDocumentError = exports.MAX_FILE_BYTES = exports.MAX_VIDEO_BYTES = exports.MAX_BYTES = exports.TEMPLATE_CONTENT_TYPE = exports.TEMPLATE_FILE_EXTENSIONS = exports.LEGACY_TEMPLATE_FILE_EXTENSIONS = exports.TEMPLATE_FILE_EXTENSION = exports.TEMPLATE_DOCUMENT_APP = exports.TEMPLATE_DOCUMENT_VERSION = void 0;
    exports.utf8ByteLength = utf8ByteLength;
    exports.base64ByteCount = base64ByteCount;
    exports.isSupportedImage = isSupportedImage;
    exports.isSupportedVideo = isSupportedVideo;
    exports.stableStringify = stableStringify;
    exports.encodeNode = encodeNode;
    exports.encodeCanvas = encodeCanvas;
    exports.encodeTemplate = encodeTemplate;
    exports.decodeTemplate = decodeTemplate;
    exports.encodeTemplateDocument = encodeTemplateDocument;
    exports.templateFileName = templateFileName;
    exports.decodeTemplateDocument = decodeTemplateDocument;
    exports.isTemplateFileName = isTemplateFileName;
    exports.looksLikeTemplateDocument = looksLikeTemplateDocument;
    exports.templateDocumentBody = templateDocumentBody;
    const fontCatalog_1 = require("./fontCatalog");
    const canvas_1 = require("./canvas");
    // `.livemark` 模版文件版本 3：平面画布、内容跟随、字体与可编辑手写资产。
    //
    // 文件只带模版和它的图，别的什么都没有：没有记录、没有设置、没有私人字段。
    // 导入永远换一个新身份，所以收到别人的文件不会盖掉自己已有的模版。
    //
    // 编码规范：键按字典序（`stableStringify`）、日期 ISO-8601 无小数秒、资产为 base64、
    // UUID 大写连字符、**等于缺省值的字段整把省掉**（visible / opacity / rotation / position /
    // fit / focus / zoom / tilt / hideWhenEmpty / collapseWhenEmpty …）。
    // 解码宽松：每个字段 `?? 默认值`，不认识的 kind 跳过，坏节点跳过而不是整份失败——
    // 这两件事都由 model.ts 的 `sanitizeTemplate` 做，所以「解码」就是「清洗」。
    //
    // `encodeTemplate` 同时是档案里的形状：v3 模版存在档案键 `posterTemplates` 下
    // （Swift 版的 `shareTemplates` 原样保留、不读不写）。文件里不许有资产引用，
    // 档案里可以，所以剥离资产是 `encodeTemplateDocument` 的事，不是 `encodeTemplate` 的事。
    const model_1 = require("./model");
    // MARK: - 常量
    exports.TEMPLATE_DOCUMENT_VERSION = 3;
    exports.TEMPLATE_DOCUMENT_APP = 'Livemark';
    /**
     * 0.11.0 build 31 起模版和备份一样写成 `.livemark`（gzip 过的 JSON，见 core/gzip.ts）；
     * 0.10.0 build 27 到 build 30 写的是 `.lmtemplate`，更早的是 `.encoretemplate`，都仍能打开。
     * 同一个扩展名下备份与模版靠内容分辨（`looksLikeTemplateDocument`）。
     */
    exports.TEMPLATE_FILE_EXTENSION = 'livemark';
    exports.LEGACY_TEMPLATE_FILE_EXTENSIONS = ['lmtemplate', 'encoretemplate'];
    exports.TEMPLATE_FILE_EXTENSIONS = [
        exports.TEMPLATE_FILE_EXTENSION,
        ...exports.LEGACY_TEMPLATE_FILE_EXTENSIONS,
    ];
    /** 旧扩展名的 UTI；新文件用 backup.ts 的 `LIVEMARK_CONTENT_TYPE`。 */
    exports.TEMPLATE_CONTENT_TYPE = 'cc.kinyo.encore.template';
    /** 一张图片、以及一个没有视频的文件的上限。 */
    exports.MAX_BYTES = 8 * 1024 * 1024;
    /** 实况照片的视频，以及带视频的整个文件。 */
    exports.MAX_VIDEO_BYTES = 40 * 1024 * 1024;
    exports.MAX_FILE_BYTES = 64 * 1024 * 1024;
    class TemplateDocumentError extends Error {
        constructor(code, version) {
            super(code);
            this.name = 'TemplateDocumentError';
            this.code = code;
            this.version = version;
        }
    }
    exports.TemplateDocumentError = TemplateDocumentError;
    // MARK: - 字节
    /** 不依赖 TextEncoder：算一段字符串的 UTF-8 字节数。 */
    function utf8ByteLength(text) {
        let bytes = 0;
        for (let i = 0; i < text.length; i++) {
            const code = text.charCodeAt(i);
            if (code < 0x80)
                bytes += 1;
            else if (code < 0x800)
                bytes += 2;
            else if (code >= 0xd800 && code <= 0xdbff && i + 1 < text.length) {
                const next = text.charCodeAt(i + 1);
                if (next >= 0xdc00 && next <= 0xdfff) {
                    bytes += 4;
                    i++;
                }
                else
                    bytes += 3;
            }
            else
                bytes += 3;
        }
        return bytes;
    }
    const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    /** base64 的前若干字节，只为看魔数。 */
    function base64Bytes(text, limit) {
        const clean = String(text).replace(/[^A-Za-z0-9+/]/g, '');
        const out = [];
        let buffer = 0;
        let bits = 0;
        for (let i = 0; i < clean.length && out.length < limit; i++) {
            const index = B64.indexOf(clean.charAt(i));
            if (index < 0)
                continue;
            buffer = (buffer << 6) | index;
            bits += 6;
            if (bits >= 8) {
                bits -= 8;
                out.push((buffer >> bits) & 255);
            }
        }
        return out;
    }
    /** base64 解出来有多少字节，不用真的解码。 */
    function base64ByteCount(text) {
        const clean = String(text).replace(/[^A-Za-z0-9+/=]/g, '');
        let pad = 0;
        if (clean.charAt(clean.length - 1) === '=')
            pad++;
        if (clean.charAt(clean.length - 2) === '=')
            pad++;
        return Math.floor(clean.length / 4) * 3 - pad;
    }
    function bytesOf(value, limit) {
        if (typeof value === 'string')
            return base64Bytes(value, limit);
        return Array.from(value).slice(0, limit);
    }
    function ascii(bytes, from, to) {
        let text = '';
        for (let i = from; i < to; i++)
            text += String.fromCharCode(bytes[i]);
        return text;
    }
    const HEIF_BRANDS = ['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1', 'avif'];
    const VIDEO_BRANDS = ['qt  ', 'isom', 'mp41', 'mp42', 'M4V ', 'avc1'];
    /**
     * 只看魔数，所以不需要图片解码器也能测。
     * 过了这一关的文件仍然可能解不出图；那时编辑器退回纯色底，和缺图一样。
     */
    function isSupportedImage(value) {
        const b = bytesOf(value, 12);
        if (b.length < 12)
            return false;
        if (b[0] === 0x89 &&
            b[1] === 0x50 &&
            b[2] === 0x4e &&
            b[3] === 0x47 &&
            b[4] === 0x0d &&
            b[5] === 0x0a &&
            b[6] === 0x1a &&
            b[7] === 0x0a)
            return true; // PNG
        if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff)
            return true; // JPEG
        if (ascii(b, 0, 4) === 'GIF8')
            return true;
        if (ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 12) === 'WEBP')
            return true;
        if (ascii(b, 4, 8) === 'ftyp')
            return HEIF_BRANDS.includes(ascii(b, 8, 12));
        return false;
    }
    /** 只认 QuickTime / MP4——实况照片的视频就是这两种。 */
    function isSupportedVideo(value) {
        const b = bytesOf(value, 12);
        if (b.length < 12 || ascii(b, 4, 8) !== 'ftyp')
            return false;
        return VIDEO_BRANDS.includes(ascii(b, 8, 12));
    }
    // MARK: - 规范化编码
    /** JSON.stringify 按插入顺序排键，Swift 按字典序，所以自己排。 */
    function stableStringify(value) {
        if (value === null)
            return 'null';
        const type = typeof value;
        if (type === 'number') {
            if (!Number.isFinite(value))
                throw new TemplateDocumentError('invalidData');
            return JSON.stringify(value);
        }
        if (type === 'boolean' || type === 'string')
            return JSON.stringify(value);
        if (Array.isArray(value))
            return '[' + value.map(stableStringify).join(',') + ']';
        const object = value;
        const keys = Object.keys(object)
            .filter((key) => object[key] !== undefined)
            .sort();
        return ('{' +
            keys.map((key) => JSON.stringify(key) + ':' + stableStringify(object[key])).join(',') +
            '}');
    }
    // MARK: - 编码（省略缺省值）
    function encodeColor(color) {
        return { alpha: color.alpha, blue: color.blue, green: color.green, red: color.red };
    }
    function encodeSize(rule) {
        return typeof rule === 'object' ? { fraction: rule.fraction } : rule;
    }
    function encodePadding(box) {
        return { bottom: box.bottom, left: box.left, right: box.right, top: box.top };
    }
    function encodeStroke(stroke) {
        const out = { color: encodeColor(stroke.color), width: stroke.width };
        if (stroke.accent)
            out.accent = stroke.accent;
        if (stroke.dashLength)
            out.dashLength = stroke.dashLength;
        if (stroke.dashGap)
            out.dashGap = stroke.dashGap;
        return out;
    }
    function encodeImageSource(source) {
        if (source === 'cover')
            return 'cover';
        if ('data' in source)
            return { data: source.data };
        return { asset: source.asset };
    }
    /**
     * 一个节点。`kind` 与 `id` 永远写；其余只写「和缺省值不一样」的那些。
     * 模型本身已经是规范形（sanitize 把等于缺省值的可选字段收成 undefined），
     * 所以这里的判断几乎都是「有没有」。
     */
    function encodeNode(node) {
        const out = { id: node.id, kind: node.kind };
        if (node.frame)
            out.frame = { ...node.frame };
        if (node.name)
            out.name = node.name;
        if (node.locked)
            out.locked = true;
        if (node.groupId)
            out.groupId = node.groupId;
        if (node.regionId)
            out.regionId = node.regionId;
        if (node.cell)
            out.cell = { ...node.cell };
        if (node.decoration)
            out.decoration = true;
        if (node.follow)
            out.follow = { ...node.follow };
        if (node.visible === false)
            out.visible = false;
        if (node.opacity !== undefined)
            out.opacity = node.opacity;
        if (node.rotation)
            out.rotation = node.rotation;
        if (node.position === 'absolute')
            out.position = 'absolute';
        if (node.anchor)
            out.anchor = node.anchor;
        if (node.offsetX)
            out.offsetX = node.offsetX;
        if (node.offsetY)
            out.offsetY = node.offsetY;
        if (node.width !== undefined)
            out.width = encodeSize(node.width);
        if (node.height !== undefined)
            out.height = encodeSize(node.height);
        if (node.minWidth)
            out.minWidth = node.minWidth;
        if (node.maxWidth)
            out.maxWidth = node.maxWidth;
        if (node.minHeight)
            out.minHeight = node.minHeight;
        if (node.maxHeight)
            out.maxHeight = node.maxHeight;
        if (node.grow !== undefined)
            out.grow = node.grow;
        if (node.alignSelf)
            out.alignSelf = node.alignSelf;
        switch (node.kind) {
            case 'stack':
                if (node.layout)
                    out.layout = node.layout;
                if (node.grid)
                    out.grid = { ...node.grid };
                out.direction = node.direction;
                out.children = node.children.map(encodeNode);
                if (node.gap)
                    out.gap = node.gap;
                if (node.padding)
                    out.padding = encodePadding(node.padding);
                if (node.align)
                    out.align = node.align;
                if (node.justify)
                    out.justify = node.justify;
                if (node.fill)
                    out.fill = encodeColor(node.fill);
                if (node.fillAccent)
                    out.fillAccent = node.fillAccent;
                if (node.cornerRadius)
                    out.cornerRadius = node.cornerRadius;
                if (node.stroke)
                    out.stroke = encodeStroke(node.stroke);
                if (node.clip)
                    out.clip = true;
                if (node.collapseWhenEmpty === false)
                    out.collapseWhenEmpty = false;
                break;
            case 'text':
                if (node.binding)
                    out.binding = { ...node.binding };
                if (node.fontId)
                    out.fontId = node.fontId;
                if (node.autoHeight === false)
                    out.autoHeight = false;
                out.field = node.field;
                out.fontSize = node.fontSize;
                out.weight = node.weight;
                out.design = node.design;
                out.alignment = node.alignment;
                out.color = encodeColor(node.color);
                out.lineLimit = node.lineLimit;
                if (node.text)
                    out.text = node.text;
                if (node.label)
                    out.label = node.label;
                if (node.inlineLabel)
                    out.inlineLabel = true;
                if (node.accent)
                    out.accent = node.accent;
                if (node.tracking)
                    out.tracking = node.tracking;
                if (node.uppercase)
                    out.uppercase = true;
                if (node.chip)
                    out.chip = encodeColor(node.chip);
                if (node.chipAccent)
                    out.chipAccent = node.chipAccent;
                if (node.hideWhenEmpty === false)
                    out.hideWhenEmpty = false;
                break;
            case 'image':
                if (node.handwriting)
                    out.handwriting = { ...node.handwriting };
                out.source = encodeImageSource(node.source);
                if (node.aspect !== 1)
                    out.aspect = node.aspect;
                if (node.fit !== 'cover')
                    out.fit = node.fit;
                if (node.focusX !== 0.5)
                    out.focusX = node.focusX;
                if (node.focusY !== 0.5)
                    out.focusY = node.focusY;
                if (node.zoom !== 1)
                    out.zoom = node.zoom;
                if (node.tilt)
                    out.tilt = node.tilt;
                if (node.imageAspect !== undefined)
                    out.imageAspect = node.imageAspect;
                if (node.isSticker)
                    out.isSticker = true;
                if (node.video)
                    out.video = encodeImageSource(node.video);
                if (node.cornerRadius)
                    out.cornerRadius = node.cornerRadius;
                if (node.border)
                    out.border = node.border;
                if (node.shadow)
                    out.shadow = true;
                break;
            case 'shape':
                out.shape = node.shape;
                out.color = encodeColor(node.color);
                if (node.accent)
                    out.accent = node.accent;
                if (node.cornerRadius)
                    out.cornerRadius = node.cornerRadius;
                if (node.strokeWidth)
                    out.strokeWidth = node.strokeWidth;
                if (node.dashLength)
                    out.dashLength = node.dashLength;
                if (node.dashGap)
                    out.dashGap = node.dashGap;
                break;
            default:
                break; // spacer 只有 base
        }
        return out;
    }
    function encodeCanvas(canvas) {
        const out = {
            background: encodeColor(canvas.background),
            // 宽永远是 360，不进文件。
            height: canvas.height === 'hug' ? 'hug' : { aspect: canvas.height.aspect },
        };
        if (!isZeroBox(canvas.padding))
            out.padding = encodePadding(canvas.padding);
        if (canvas.backgroundAccent)
            out.backgroundAccent = canvas.backgroundAccent;
        if (canvas.exportWidth !== undefined)
            out.exportWidth = canvas.exportWidth;
        const image = canvas.image;
        if (image) {
            const value = {};
            if (image.data)
                value.data = image.data;
            if (image.asset)
                value.asset = image.asset;
            if (image.imageAspect !== undefined)
                value.imageAspect = image.imageAspect;
            if (image.focusX !== 0.5)
                value.focusX = image.focusX;
            if (image.focusY !== 0.5)
                value.focusY = image.focusY;
            if (image.zoom !== 1)
                value.zoom = image.zoom;
            if (image.opacity !== 1)
                value.opacity = image.opacity;
            out.image = value;
        }
        return out;
    }
    function isZeroBox(box) {
        return !box || (!box.top && !box.right && !box.bottom && !box.left);
    }
    /** 档案（`posterTemplates`）与文件共用的形状。 */
    function encodeTemplate(template) {
        var _a;
        return {
            ...(((_a = template.fontAssets) === null || _a === void 0 ? void 0 : _a.length) ? { fontAssets: template.fontAssets.map(asset => ({ ...asset })) } : {}),
            canvas: encodeCanvas(template.canvas),
            createdAt: template.createdAt,
            id: template.id,
            name: template.name,
            root: encodeNode(template.root),
            updatedAt: template.updatedAt,
        };
    }
    /** 解码 = 清洗：编码写出来的就是模型的形状，缺的字段各自退回缺省值。 */
    function decodeTemplate(raw, env) {
        return (0, model_1.sanitizeTemplate)(raw, env);
    }
    function collectMedia(template) {
        const images = [];
        const videos = [];
        let assets = false;
        const image = template.canvas.image;
        if (image === null || image === void 0 ? void 0 : image.data)
            images.push(image.data);
        if (image === null || image === void 0 ? void 0 : image.asset)
            assets = true;
        (0, model_1.walkNodes)(template.root, (node) => {
            if (node.kind !== 'image')
                return;
            if (node.source !== 'cover') {
                if ('data' in node.source)
                    images.push(node.source.data);
                else
                    assets = true;
            }
            if (node.video) {
                if ('data' in node.video)
                    videos.push(node.video.data);
                else
                    assets = true;
            }
        });
        return { images, videos, assets };
    }
    /** 文件里只认内联的字节：带资产引用的模版得先由调用方把原图取出来。 */
    function checkMedia(media) {
        if (media.assets)
            throw new TemplateDocumentError('invalidData');
        for (const data of media.images) {
            if (!isSupportedImage(data))
                throw new TemplateDocumentError('unsupportedImage');
            if (base64ByteCount(data) > exports.MAX_BYTES)
                throw new TemplateDocumentError('tooLarge');
        }
        for (const data of media.videos) {
            if (!isSupportedVideo(data))
                throw new TemplateDocumentError('unsupportedImage');
            if (base64ByteCount(data) > exports.MAX_VIDEO_BYTES)
                throw new TemplateDocumentError('tooLarge');
        }
    }
    function checkCanvasDocument(template) {
        var _a;
        if (template.root.layout !== 'canvas' || (0, canvas_1.validateCanvasRelations)(template).length)
            throw new TemplateDocumentError('invalidData');
        for (const font of (_a = template.fontAssets) !== null && _a !== void 0 ? _a : []) {
            const bytes = base64Bytes(font.data, 4);
            const ttf = bytes[0] === 0 && bytes[1] === 1 && bytes[2] === 0 && bytes[3] === 0;
            const otf = ascii(bytes, 0, 4) === 'OTTO';
            if (!(font.format === 'ttf' ? ttf : otf))
                throw new TemplateDocumentError('invalidData');
            if (base64ByteCount(font.data) > fontCatalog_1.MAX_IMPORTED_FONT_BYTES)
                throw new TemplateDocumentError('tooLarge');
        }
    }
    // MARK: - 写
    /**
     * `template` 必须已经把图放在身上（`{ data }`）；调用方先把存好的资产取出来，
     * 和完整备份的做法一样。返回模版文件的 JSON 文本（落盘前再 gzip 成 `.livemark`）。
     */
    function encodeTemplateDocument(template, env) {
        var _a;
        const e = (0, model_1.resolveEnvironment)(env);
        const value = (0, model_1.sanitizeTemplate)(template, env);
        checkMedia(collectMedia(value));
        checkCanvasDocument(value);
        const text = stableStringify({
            app: exports.TEMPLATE_DOCUMENT_APP,
            exportedAt: e.now(),
            template: encodeTemplate(value),
            version: exports.TEMPLATE_DOCUMENT_VERSION,
        });
        const limit = (0, model_1.templateHasLivePhoto)(value) || ((_a = value.fontAssets) === null || _a === void 0 ? void 0 : _a.length) ? exports.MAX_FILE_BYTES : exports.MAX_BYTES;
        if (utf8ByteLength(text) > limit)
            throw new TemplateDocumentError('tooLarge');
        return text;
    }
    /** 一个哪个文件系统都收得下、又说得清自己是什么的文件名。 */
    function templateFileName(template) {
        var _a;
        const cleaned = String((_a = template.name) !== null && _a !== void 0 ? _a : '')
            .split(/[/\\:?%*|"<>\n\r]/)
            .join('-');
        const trimmed = (0, model_1.prefixChars)(cleaned.trim(), 40);
        return (trimmed || '我的模版') + '.' + exports.TEMPLATE_FILE_EXTENSION;
    }
    // MARK: - 读
    /**
     * 读出来的模版可以直接存：已清洗、换了新身份，节点 id 也去过重，
     * 手改过的文件污染不了档案。版本 1 是 v1 的绝对定位模版，明确不兼容。
     */
    function decodeTemplateDocument(text, env) {
        var _a;
        const e = (0, model_1.resolveEnvironment)(env);
        const bytes = utf8ByteLength(text);
        if (bytes > exports.MAX_FILE_BYTES)
            throw new TemplateDocumentError('tooLarge');
        let document;
        try {
            document = JSON.parse(text);
        }
        catch {
            throw new TemplateDocumentError('invalidData');
        }
        if (!document || typeof document !== 'object' || Array.isArray(document)) {
            throw new TemplateDocumentError('invalidData');
        }
        const object = document;
        // 这四个键缺一个就是「读不出来」，和 Swift 的合成解码器一致。
        if (typeof object.version !== 'number' ||
            typeof object.app !== 'string' ||
            typeof object.exportedAt !== 'string' ||
            Number.isNaN(Date.parse(object.exportedAt)) ||
            !object.template ||
            typeof object.template !== 'object' ||
            Array.isArray(object.template)) {
            throw new TemplateDocumentError('invalidData');
        }
        if (object.version !== exports.TEMPLATE_DOCUMENT_VERSION) {
            throw new TemplateDocumentError('unsupportedVersion', object.version);
        }
        const rawTemplate = object.template;
        // 一份模版至少得有棵树；没有 root 的多半是别的东西改了扩展名。
        if (!rawTemplate.root || typeof rawTemplate.root !== 'object' || Array.isArray(rawTemplate.root)) {
            throw new TemplateDocumentError('invalidData');
        }
        const sanitized = decodeTemplate(rawTemplate, env);
        checkCanvasDocument(sanitized);
        if (bytes > ((0, model_1.templateHasLivePhoto)(sanitized) || ((_a = sanitized.fontAssets) === null || _a === void 0 ? void 0 : _a.length) ? exports.MAX_FILE_BYTES : exports.MAX_BYTES)) {
            throw new TemplateDocumentError('tooLarge');
        }
        checkMedia(collectMedia(sanitized));
        const now = e.now();
        return { ...sanitized, id: e.newID(), createdAt: now, updatedAt: now };
    }
    /** 文件名的扩展名是不是我们认的（新名或旧名）。 */
    function isTemplateFileName(name) {
        const parts = String(name).toLowerCase().split('.');
        return parts.length > 1 && exports.TEMPLATE_FILE_EXTENSIONS.includes(parts[parts.length - 1]);
    }
    /** 导入前的一眼判断：这串文本像不像一个模版文件。 */
    function looksLikeTemplateDocument(text) {
        try {
            const object = JSON.parse(text);
            return (!!object &&
                typeof object === 'object' &&
                typeof object.version === 'number' &&
                !!object.template &&
                (object.app === exports.TEMPLATE_DOCUMENT_APP || (0, model_1.isUUID)(object.template.id)));
        }
        catch {
            return false;
        }
    }
    function templateDocumentBody(template, exportedAt = (0, model_1.isoString)()) {
        return {
            version: exports.TEMPLATE_DOCUMENT_VERSION,
            app: exports.TEMPLATE_DOCUMENT_APP,
            exportedAt,
            template: encodeTemplate((0, model_1.sanitizeTemplate)(template)),
        };
    }

  });

  define("core/template/builtins", function (module, exports, require) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BUILT_IN_TEMPLATE_IDS = exports.SHARE_STYLES = void 0;
    exports.templateIDForStyle = templateIDForStyle;
    exports.styleForTemplateID = styleForTemplateID;
    exports.isBuiltInTemplate = isBuiltInTemplate;
    exports.builtInTemplate = builtInTemplate;
    exports.builtInTemplates = builtInTemplates;
    /** Nine editable compositions: independent layers containing actual rows, columns and merged cells. */
    const model_1 = require("./model");
    exports.SHARE_STYLES = ['经典票根', '杂志封面', '电影字幕', '艺术海报', '登机牌', '手帐拼贴', '黑胶唱片', '回忆小票', '极简留白'];
    const PREFIX = '4C49564D-4152-4B00-8000-0000000000';
    const EPOCH = '1970-01-01T00:00:00Z';
    function templateIDForStyle(style) { return PREFIX + String(exports.SHARE_STYLES.indexOf(style) + 1).padStart(2, '0'); }
    function styleForTemplateID(id) { var _a; return (_a = exports.SHARE_STYLES.find(style => templateIDForStyle(style) === id.toUpperCase())) !== null && _a !== void 0 ? _a : null; }
    exports.BUILT_IN_TEMPLATE_IDS = exports.SHARE_STYLES.map(templateIDForStyle);
    function isBuiltInTemplate(template) { return exports.BUILT_IN_TEMPLATE_IDS.includes(template.id.toUpperCase()); }
    function builtInTemplate(style) {
        let serial = 0;
        const env = { now: () => EPOCH, newID: () => '4C49564D-4152-4B00-800' + (exports.SHARE_STYLES.indexOf(style) + 1) + '-' + String(++serial).padStart(12, '0') };
        const root = (0, model_1.makeStackNode)('column', { layout: 'canvas' }, env);
        const nodes = [];
        let canvas = (0, model_1.defaultCanvas)();
        const dark = style === '电影字幕' || style === '黑胶唱片';
        const ink = dark ? model_1.Palette.cream : model_1.Palette.ink;
        const push = (node) => { nodes.push(node); return node; };
        const text = (field, frame, options = {}) => push((0, model_1.makeTextNode)(field, { frame, color: ink, ...options }, env));
        const cover = (frame, options = {}) => push((0, model_1.makeImageNode)('cover', { frame, ...options }, env));
        const region = (frame, options = {}) => push((0, model_1.makeStackNode)('column', { layout: 'region', frame, padding: (0, model_1.padding)(0), children: [], ...options }, env));
        const shape = (kind, frame, color, options = {}) => push((0, model_1.makeShapeNode)(kind, { frame, color, ...options }, env));
        const after = (target, gap = 12) => ({ targetId: target.id, gap });
        const info = (owner, fields, size = 12, options = {}) => {
            var _a, _b, _c, _d, _e, _f;
            let previous;
            const inset = (_b = (_a = owner.padding) === null || _a === void 0 ? void 0 : _a.left) !== null && _b !== void 0 ? _b : 0;
            for (const field of fields) {
                previous = text(field, { x: inset, y: (_d = (_c = owner.padding) === null || _c === void 0 ? void 0 : _c.top) !== null && _d !== void 0 ? _d : 0, width: owner.frame.width - inset - ((_f = (_e = owner.padding) === null || _e === void 0 ? void 0 : _e.right) !== null && _f !== void 0 ? _f : 0), height: size * 1.4 }, {
                    regionId: owner.id, fontSize: size, ...(previous ? { follow: after(previous, 8) } : {}), ...options,
                });
            }
            return previous;
        };
        const memories = (target, width = 312, options = {}) => {
            const block = region({ x: 0, y: 0, width, height: 0 }, { follow: after(target, 20), ...options });
            info(block, ['金句', '感想', '曲目单'], 13, { design: style === '回忆小票' ? '等宽' : '宋体' });
            return block;
        };
        const signature = (target, options = {}) => text('署名', { x: 0, y: 0, width: 312, height: 16 }, { fontSize: 9, follow: after(target, 20), opacity: 0.65, ...options });
        switch (style) {
            case '经典票根': {
                const image = cover({ x: 0, y: 0, width: 312, height: 242 }, { cornerRadius: 10 });
                const body = region({ x: 0, y: 0, width: 312, height: 0 }, { follow: after(image, 0), fill: model_1.Palette.white, padding: (0, model_1.padding)(20), cornerRadius: 10 });
                const title = text('名称', { x: 20, y: 20, width: 272, height: 44 }, { regionId: body.id, fontSize: 28, weight: '粗体' });
                const performer = text('艺人 / 卡司', { x: 20, y: 20, width: 272, height: 20 }, { regionId: body.id, fontSize: 12, follow: after(title, 8) });
                const date = text('日期', { x: 20, y: 20, width: 272, height: 20 }, { regionId: body.id, fontSize: 12, label: 'DATE', follow: after(performer, 20) });
                text('城市与场馆', { x: 20, y: 20, width: 272, height: 22 }, { regionId: body.id, fontSize: 12, label: 'VENUE', follow: after(date, 12) });
                const line = shape('直线', { x: 0, y: 0, width: 312, height: 1 }, model_1.Palette.ink, { follow: after(body, 14), dashLength: 4, dashGap: 4, opacity: 0.4 });
                const notes = memories(line);
                const stamp = text('条码', { x: 0, y: 0, width: 160, height: 22 }, { fontSize: 10, follow: after(notes, 18) });
                signature(stamp);
                break;
            }
            case '杂志封面': {
                canvas = { ...canvas, height: { aspect: 1.72 }, padding: model_1.ZERO_PADDING, background: model_1.Palette.night };
                cover({ x: 0, y: 0, width: 360, height: 619 }, { decoration: true });
                shape('渐变', { x: 0, y: 290, width: 360, height: 330 }, model_1.Palette.black, { decoration: true, opacity: 0.65 });
                text('余响标识', { x: 24, y: 26, width: 312, height: 32 }, { fontSize: 26, color: model_1.Palette.white, tracking: 6 });
                text('英文类型', { x: 24, y: 78, width: 312, height: 15 }, { fontSize: 10, color: model_1.Palette.white, tracking: 3 });
                const body = region({ x: 24, y: 340, width: 312, height: 0 });
                const title = text('名称', { x: 0, y: 0, width: 312, height: 64 }, { regionId: body.id, fontSize: 36, weight: '特粗', color: model_1.Palette.white });
                const who = text('艺人 / 卡司', { x: 0, y: 0, width: 312, height: 24 }, { regionId: body.id, fontSize: 14, color: model_1.Palette.white, follow: after(title, 12) });
                const date = text('日期', { x: 0, y: 0, width: 312, height: 18 }, { regionId: body.id, fontSize: 11, color: model_1.Palette.white, follow: after(who, 16) });
                text('城市与场馆', { x: 0, y: 0, width: 312, height: 18 }, { regionId: body.id, fontSize: 11, color: model_1.Palette.white, follow: after(date, 5) });
                break;
            }
            case '电影字幕': {
                canvas = { ...canvas, padding: model_1.ZERO_PADDING, background: model_1.Palette.night };
                const image = cover({ x: 0, y: 0, width: 360, height: 224 });
                const body = region({ x: 30, y: 0, width: 300, height: 0 }, { follow: after(image, 24) });
                const title = text('名称', { x: 0, y: 0, width: 300, height: 38 }, { regionId: body.id, fontSize: 25, weight: '半粗', alignment: '居中' });
                const quote = text('金句', { x: 0, y: 0, width: 300, height: 24 }, { regionId: body.id, fontSize: 16, color: (0, model_1.colorFromHex)(0xf2d27a), design: '宋体', alignment: '居中', follow: after(title, 24) });
                const date = text('日期', { x: 0, y: 0, width: 300, height: 18 }, { regionId: body.id, fontSize: 10, alignment: '居中', opacity: 0.7, follow: after(quote, 22) });
                text('城市与场馆', { x: 0, y: 0, width: 300, height: 18 }, { regionId: body.id, fontSize: 10, alignment: '居中', opacity: 0.7, follow: after(date, 6) });
                const notes = region({ x: 30, y: 0, width: 300, height: 0 }, { follow: after(body, 20) });
                info(notes, ['感想'], 12, { alignment: '居中' });
                signature(notes, { frame: { x: 30, y: 0, width: 300, height: 36 }, alignment: '居中' });
                break;
            }
            case '艺术海报': {
                canvas = { ...canvas, background: model_1.Palette.lilac };
                text('英文类型', { x: 0, y: 0, width: 312, height: 20 }, { fontSize: 10, tracking: 5 });
                const title = text('名称', { x: 0, y: 36, width: 312, height: 70 }, { fontSize: 44, weight: '特粗', tracking: -1 });
                const image = cover({ x: 34, y: 0, width: 278, height: 330 }, { follow: after(title, 20), cornerRadius: 140 });
                const body = region({ x: 0, y: 0, width: 312, height: 0 }, { follow: after(image, 24) });
                info(body, ['艺人 / 卡司', '日期', '城市与场馆'], 12);
                const notes = memories(body);
                signature(notes);
                break;
            }
            case '登机牌': {
                canvas = { ...canvas, background: (0, model_1.colorFromHex)(0xe5edf1) };
                const header = text('英文类型', { x: 0, y: 0, width: 312, height: 20 }, { fontSize: 11, tracking: 4, color: (0, model_1.colorFromHex)(0x274455) });
                const title = text('名称', { x: 0, y: 0, width: 312, height: 50 }, { fontSize: 32, weight: '粗体', follow: after(header, 18) });
                const body = region({ x: 0, y: 0, width: 312, height: 156 }, { follow: after(title, 18), fill: model_1.Palette.white, padding: (0, model_1.padding)(16), cornerRadius: 8 });
                cover({ x: 16, y: 16, width: 100, height: 124 }, { regionId: body.id, cornerRadius: 3 });
                let previous;
                for (const field of ['日期', '城市与场馆', '座位', '票价'])
                    previous = text(field, { x: 132, y: 16, width: 164, height: 18 }, { regionId: body.id, fontSize: 11, label: field === '日期' ? 'DEPARTURE' : '', ...(previous ? { follow: after(previous, 10) } : {}) });
                const notes = memories(body);
                const barcode = text('条码', { x: 0, y: 0, width: 312, height: 28 }, { fontSize: 13, follow: after(notes, 22) });
                signature(barcode);
                break;
            }
            case '手帐拼贴': {
                canvas = { ...canvas, background: (0, model_1.colorFromHex)(0xf2ecdd) };
                shape('点阵', { x: 0, y: 0, width: 312, height: 760 }, (0, model_1.colorFromHex)(0xc4b79d), { decoration: true, opacity: 0.35 });
                const photo = region({ x: 8, y: 14, width: 296, height: 0 }, { fill: model_1.Palette.white, padding: (0, model_1.padding)(14), rotation: -3, collapseWhenEmpty: false });
                const image = cover({ x: 14, y: 14, width: 268, height: 270 }, { regionId: photo.id });
                text('名称', { x: 14, y: 14, width: 268, height: 36 }, { regionId: photo.id, fontSize: 22, design: '宋体', alignment: '居中', follow: after(image, 15) });
                shape('矩形', { x: 104, y: 2, width: 92, height: 24 }, model_1.Palette.gold, { regionId: photo.id, decoration: true, rotation: 4, opacity: 0.7 });
                const detail = region({ x: 0, y: 0, width: 312, height: 0 }, { follow: after(photo, 28) });
                info(detail, ['日期', '城市与场馆', '心情'], 11);
                const notes = memories(detail);
                signature(notes);
                break;
            }
            case '黑胶唱片': {
                canvas = { ...canvas, background: model_1.Palette.night };
                const hero = region({ x: 0, y: 0, width: 312, height: 282 }, { collapseWhenEmpty: false });
                shape('唱片纹', { x: 16, y: 0, width: 280, height: 280 }, (0, model_1.colorFromHex)(0x494b46), { regionId: hero.id, decoration: true });
                cover({ x: 78, y: 62, width: 156, height: 156 }, { regionId: hero.id, cornerRadius: 78 });
                const title = text('名称', { x: 0, y: 0, width: 312, height: 48 }, { fontSize: 29, weight: '半粗', alignment: '居中', follow: after(hero, 24) });
                const who = text('艺人 / 卡司', { x: 0, y: 0, width: 312, height: 20 }, { fontSize: 12, alignment: '居中', follow: after(title, 10), opacity: 0.75 });
                const details = region({ x: 0, y: 0, width: 312, height: 0 }, { follow: after(who, 20) });
                info(details, ['日期', '城市与场馆'], 11, { alignment: '居中' });
                const notes = memories(details);
                signature(notes);
                break;
            }
            case '回忆小票': {
                canvas = { ...canvas, padding: (0, model_1.padding)(28, 40), background: (0, model_1.colorFromHex)(0xfcfbf6) };
                const title = text('名称', { x: 0, y: 0, width: 280, height: 42 }, { fontSize: 25, design: '等宽', alignment: '居中', weight: '粗体' });
                const image = cover({ x: 0, y: 0, width: 280, height: 180 }, { follow: after(title, 20), cornerRadius: 2 });
                const details = region({ x: 0, y: 0, width: 280, height: 0 }, { follow: after(image, 22) });
                let previous;
                for (const field of ['日期', '时间', '城市与场馆', '票价', '座位', '同行人'])
                    previous = text(field, { x: 0, y: 0, width: 280, height: 18 }, { regionId: details.id, fontSize: 11, design: '等宽', label: field, ...(previous ? { follow: after(previous, 12) } : {}) });
                const line = shape('直线', { x: 0, y: 0, width: 280, height: 1 }, model_1.Palette.ink, { follow: after(details, 20), dashLength: 3, dashGap: 3 });
                const notes = memories(line, 280);
                const barcode = text('条码', { x: 0, y: 0, width: 280, height: 28 }, { fontSize: 13, follow: after(notes, 22) });
                signature(barcode, { frame: { x: 0, y: 0, width: 280, height: 16 }, alignment: '居中' });
                break;
            }
            case '极简留白': {
                canvas = { ...canvas, background: model_1.Palette.white };
                const header = region({ x: 0, y: 24, width: 312, height: 140 });
                cover({ x: 0, y: 0, width: 96, height: 124 }, { regionId: header.id });
                const title = text('名称', { x: 120, y: 8, width: 192, height: 60 }, { regionId: header.id, fontSize: 26, weight: '半粗' });
                text('艺人 / 卡司', { x: 120, y: 8, width: 192, height: 20 }, { regionId: header.id, fontSize: 11, follow: after(title, 12), opacity: 0.65 });
                const detail = region({ x: 0, y: 0, width: 312, height: 0 }, { follow: after(header, 40) });
                info(detail, ['日期', '城市与场馆'], 11);
                const notes = memories(detail, 312, { follow: after(detail, 32) });
                signature(notes);
                break;
            }
        }
        // Keep drawing order and identities stable while giving each content layer its own editable grid.
        const replacements = new Map();
        for (const owner of nodes.filter((node) => node.kind === 'stack')) {
            const members = nodes.filter(node => node.regionId === owner.id && !node.decoration);
            const first = members[0], labels = members.filter((node) => node.kind === 'text').map(node => node.field);
            let grid = { columns: 1, rows: Math.max(1, members.length), columnGap: 12, rowGap: 12 };
            const cells = members.map((node, row) => ({ id: node.id, row, column: 0 }));
            if (style === '登机牌' && (first === null || first === void 0 ? void 0 : first.kind) === 'image') {
                grid = { columns: 2, rows: 4, columnWeights: [100, 164], columnGap: 16, rowGap: 10, merges: [{ row: 0, column: 0, rowSpan: 4 }] };
                cells.forEach((cell, i) => { cell.row = Math.max(0, i - 1); cell.column = i ? 1 : 0; });
            }
            else if (style === '极简留白' && (first === null || first === void 0 ? void 0 : first.kind) === 'image') {
                grid = { columns: 2, rows: 2, columnWeights: [96, 192], columnGap: 24, rowGap: 12, merges: [{ row: 0, column: 0, rowSpan: 2 }] };
                cells.forEach((cell, i) => { cell.row = Math.max(0, i - 1); cell.column = i ? 1 : 0; });
            }
            else if (style === '黑胶唱片' && (first === null || first === void 0 ? void 0 : first.kind) === 'image') {
                grid = { columns: 4, rows: 1, columnGap: 0, rowGap: 0, rowHeights: [280], merges: [{ row: 0, column: 1, colSpan: 2 }] };
                cells[0].column = 1;
            }
            else if (style === '手帐拼贴' && (first === null || first === void 0 ? void 0 : first.kind) === 'image')
                grid = { ...grid, rowGap: 15 };
            const name = (first === null || first === void 0 ? void 0 : first.kind) === 'image' ? '封面组合' : labels.includes('感想') || labels.includes('金句') ? '感想与回忆' : labels.includes('名称') ? '标题与信息' : '记录信息';
            replacements.set(owner.id, { ...owner, name, layout: 'grid', grid });
            for (const cell of cells) {
                const node = members.find(item => item.id === cell.id);
                replacements.set(node.id, { ...node, follow: undefined, cell: { row: cell.row, column: cell.column },
                    ...(style === '黑胶唱片' && node.kind === 'image' ? { alignSelf: 'center' } : {}) });
            }
        }
        return (0, model_1.sanitizeTemplate)({ id: templateIDForStyle(style), name: style, canvas, root: { ...root, children: nodes.map(node => { var _a; return (_a = replacements.get(node.id)) !== null && _a !== void 0 ? _a : node; }) }, createdAt: EPOCH, updatedAt: EPOCH }, env);
    }
    function builtInTemplates() { return exports.SHARE_STYLES.map(builtInTemplate); }

  });

  define("share/scene", function (module, exports, require) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.typeDisplayName = typeDisplayName;
    exports.posterRecord = posterRecord;
    exports.posterOptions = posterOptions;
    exports.makeCardContext = makeCardContext;
    exports.resolveColor = resolveColor;
    exports.resolveValues = resolveValues;
    exports.buildScene = buildScene;
    exports.measurePoster = measurePoster;
    exports.posterPixelSize = posterPixelSize;
    exports.sceneImageSources = sceneImageSources;
    const uuid_1 = require("@/core/uuid");
    const customFields_1 = require("@/core/customFields");
    // 海报的「场景」：一份模版 + 一条记录 → 一串按绘制顺序排好的图元。
    // 设计规格见 Documentation/POSTER.md 第 3、4 节。
    //
    // 三段式（照 Vercel Satori 的分法）：
    //   1. 这条记录里每个文字节点印什么 —— `templateText`（`core/template/model.ts`）；
    //   2. 排版 —— `layoutTemplate`（`core/template/layout.ts`，纯 TS，文字测量注入）；
    //   3. 翻成图元 —— 这个文件。
    //
    // 这一层除了量文字（`skiaMeasure`）不碰 react / react-native，几何与取值都能在
    // Jest 里直接断言。预览（TemplateCard）与导出（exportService）画的是同一份场景，
    // 所以屏幕上那张和存下来的那张不会差。
    //
    // 坐标：画布永远 360 pt 宽，高由内容决定（`layout.height`）；图元的 frame 是
    // **左上角 + 宽高**，`rotation` 绕 frame 中心转（祖先的旋转已经乘进来了）。
    const labels_1 = require("@/core/labels");
    const models_1 = require("@/core/models");
    const layout_1 = require("@/core/template/layout");
    const model_1 = require("@/core/template/model");
    const i18n_1 = require("@/i18n");
    const measure_1 = require("./measure");
    function assetSource(asset) {
        const value = asset;
        if (!value || typeof value.digest !== 'string')
            return null;
        return {
            key: `asset-${value.digest}`,
            digest: value.digest,
            uri: typeof value.filePath === 'string' ? value.filePath : undefined,
        };
    }
    const inlineImageIdentities = new Map();
    function inlineImageKey(owner, data) {
        const previous = inlineImageIdentities.get(owner);
        if ((previous === null || previous === void 0 ? void 0 : previous.data) === data)
            return previous.key;
        const key = `${owner}-${(0, uuid_1.derivedUUID)(data)}`;
        inlineImageIdentities.set(owner, { data, key });
        if (inlineImageIdentities.size > 32)
            inlineImageIdentities.delete(inlineImageIdentities.keys().next().value);
        return key;
    }
    function nodeImageSource(node, context) {
        if (node.source === 'cover')
            return context.cover.source;
        if ('data' in node.source && node.source.data) {
            return { key: inlineImageKey(`element-${node.id}`, node.source.data), data: node.source.data };
        }
        if ('asset' in node.source)
            return assetSource(node.source.asset);
        return null;
    }
    function canvasImageSource(template, image) {
        if (!image)
            return null;
        if (image.data)
            return { key: inlineImageKey(`template-${template.id}`, image.data), data: image.data };
        return assetSource(image.asset);
    }
    // MARK: - 记录 → 卡片内容
    /** 一个内建类型的名字跟着界面语言走；用户自己起的名字原样印。 */
    function typeDisplayName(type) {
        return type.isBuiltIn ? (0, i18n_1.t)(type.name) : type.name;
    }
    /** `EventRecord` → 海报只认的那几项。 */
    function posterRecord(record, type) {
        var _a, _b;
        return {
            id: record.id,
            title: record.title,
            subtitle: record.subtitle,
            performers: record.performers,
            kindName: type ? typeDisplayName(type) : undefined,
            kindEnglish: type === null || type === void 0 ? void 0 : type.english,
            date: record.date,
            hasConfirmedDate: record.dateUnconfirmed !== true,
            hasConfirmedTime: record.timeUnconfirmed !== true,
            utcOffsetSeconds: (_a = record.sourceUTCOffset) !== null && _a !== void 0 ? _a : null,
            city: record.city,
            venue: record.venue,
            seat: record.seat,
            price: (_b = record.price) !== null && _b !== void 0 ? _b : null,
            currency: record.currency,
            companions: record.companions,
            rating: record.rating,
            mood: (0, labels_1.moodDisplay)(record.mood),
            quote: record.quote,
            note: record.note,
            setlist: record.setlist,
        };
    }
    /** `ShareOptions` → 海报读的那十个开关。 */
    function posterOptions(options, locale) {
        return {
            showDate: options.showDate,
            showVenue: options.showVenue,
            showRating: options.showRating,
            showNote: options.showNote,
            showQuote: options.showQuote,
            showSetlist: options.showSetlist,
            showAuthor: options.showAuthor,
            showPrice: options.showPrice,
            showSeat: options.showSeat,
            showCompanions: options.showCompanions,
            headline: options.headline,
            locale: locale !== null && locale !== void 0 ? locale : ((0, i18n_1.getLanguage)() === 'en' ? 'en' : 'zh-Hans'),
        };
    }
    function accentColor(theme) {
        var _a;
        return (_a = (0, model_1.colorFromHexString)((0, models_1.accentHex)(theme))) !== null && _a !== void 0 ? _a : { ...model_1.Palette.lilac };
    }
    function accentDeepColor(theme) {
        var _a;
        return (_a = (0, model_1.colorFromHexString)((0, models_1.accentDeepHex)(theme))) !== null && _a !== void 0 ? _a : { ...model_1.Palette.ink };
    }
    function coverSource(record) {
        if (record.coverAsset) {
            return {
                key: `asset-${record.coverAsset.digest}`,
                digest: record.coverAsset.digest,
                uri: record.coverAsset.filePath,
            };
        }
        if (record.coverData && record.coverData.length > 0) {
            return { key: `cover-${record.id}`, digest: `cover-${record.id}`, bytes: record.coverData };
        }
        return null;
    }
    /** 把一条记录、一组开关和一个署名合成卡片要印的全部内容。 */
    function makeCardContext(record, options, author, types, definitions) {
        const type = types ? (0, models_1.catalogResolve)(types, record) : undefined;
        return {
            bits: (0, model_1.makeCardBits)(posterRecord(record, type), posterOptions(options), author),
            customFields: Object.fromEntries((0, customFields_1.customFieldsForRecord)(record, types, definitions)
                .map(field => [field.id, field.isPrivate && !options.showCustomPrivate ? null : field.value.trim() || null])),
            accent: accentColor(options.accent),
            deep: accentDeepColor(options.accent),
            cover: { source: coverSource(record), artwork: record.artwork, title: record.title },
        };
    }
    // MARK: - 颜色解析
    /** 图层跟主题色走时用工坊里选的那枚，否则用它自己的值。 */
    function resolveColor(value, accent, context) {
        if (accent === '主题色')
            return context.accent;
        if (accent === '主题深色')
            return context.deep;
        return (0, model_1.clampColor)(value);
    }
    // MARK: - 每个文字节点印什么
    /**
     * 每个 text 节点在这条记录 + 这组分享开关下的值。
     * 占位模式（编辑器）把 null 换成 `[字段名]`，所以编辑时没有东西收起，每一块都摆得到。
     */
    function resolveValues(template, context, placeholders = false) {
        const values = {};
        (0, model_1.walkNodes)(template.root, (node) => {
            var _a, _b;
            if (!(0, model_1.isTextNode)(node))
                return;
            const value = resolvedText(node, context);
            values[node.id] = value === null && placeholders ? '[' + ((_b = (_a = node.binding) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : (0, i18n_1.t)(node.field)) + ']' : value;
        });
        return values;
    }
    function resolvedText(node, context) {
        var _a, _b, _c;
        if (((_a = node.binding) === null || _a === void 0 ? void 0 : _a.kind) === 'custom')
            return (_c = (_b = context.customFields) === null || _b === void 0 ? void 0 : _b[node.binding.definitionId]) !== null && _c !== void 0 ? _c : null;
        return (0, model_1.templateText)(node, context.bits);
    }
    const IDENTITY = { a: 1, b: 0, tx: 0, ty: 0, angle: 0 };
    function applyPoint(t, x, y) {
        return { x: t.a * x - t.b * y + t.tx, y: t.b * x + t.a * y + t.ty };
    }
    /** `parent ∘ 绕 (cx, cy) 转 degrees`。 */
    function compose(parent, degrees, cx, cy) {
        if (degrees === 0)
            return parent;
        const radians = (degrees * Math.PI) / 180;
        const cos = Math.cos(radians);
        const sin = Math.sin(radians);
        // 绕 (cx, cy) 转：先把点挪到原点、转、再挪回去，平移量就是这个。
        const bx = cx - (cos * cx - sin * cy);
        const by = cy - (sin * cx + cos * cy);
        const moved = applyPoint(parent, bx, by);
        return {
            a: parent.a * cos - parent.b * sin,
            b: parent.b * cos + parent.a * sin,
            tx: moved.x,
            ty: moved.y,
            angle: parent.angle + degrees,
        };
    }
    function buildScene(template, context, options = {}) {
        var _a;
        const placeholders = options.placeholders === true;
        const values = resolveValues(template, context, placeholders);
        const layout = (0, layout_1.layoutTemplate)(template, values, measure_1.skiaMeasure, { editingGridId: options.editingGridId });
        const pass = (_a = options.pass) !== null && _a !== void 0 ? _a : null;
        const emitted = emitItems(layout, context, values, placeholders);
        let items = emitted.items;
        let paintsBackground = true;
        if (pass) {
            const index = emitted.items.findIndex((item) => item.id === pass.layerID);
            if (index < 0) {
                // 找不到那一层：`under` 等于整张，其余什么都不画。
                items = pass.mode === 'under' ? emitted.items : [];
                paintsBackground = pass.mode === 'under';
            }
            else if (pass.mode === 'under') {
                items = [...emitted.items.slice(0, index), ...closers(emitted, index)];
            }
            else if (pass.mode === 'over') {
                items = [...openers(emitted, index), ...emitted.items.slice(index + 1)];
                paintsBackground = false;
            }
            else {
                const target = emitted.items[index];
                items = [
                    ...openers(emitted, index),
                    ...(target.kind === 'image' ? [maskItem(target)] : []),
                    ...closers(emitted, index),
                ];
                paintsBackground = false;
            }
        }
        const source = canvasImageSource(template, template.canvas.image);
        const image = template.canvas.image;
        return {
            width: layout.width,
            height: layout.height,
            paintsBackground,
            background: resolveColor(template.canvas.background, template.canvas.backgroundAccent, context),
            backgroundImage: paintsBackground && source && image
                ? {
                    source,
                    focusX: image.focusX,
                    focusY: image.focusY,
                    zoom: image.zoom,
                    opacity: image.opacity,
                }
                : null,
            items,
            layout,
        };
    }
    /** 切片时补上的裁切：这个位置还开着的，从里到外一层层关掉。 */
    function closers(emitted, index) {
        var _a;
        const open = (_a = emitted.clips[index]) !== null && _a !== void 0 ? _a : [];
        return open
            .slice()
            .reverse()
            .map((id) => ({ ...emitted.openers.get(id), kind: 'clipEnd' }));
    }
    /** 切片时补上的裁切：这个位置开着的，从外到里一层层再开一遍。 */
    function openers(emitted, index) {
        var _a;
        const open = (_a = emitted.clips[index]) !== null && _a !== void 0 ? _a : [];
        return open.map((id) => emitted.openers.get(id));
    }
    function maskItem(item) {
        // 蒙版盖的是真正有画面的那一块：白边里面。
        const border = item.border;
        return {
            kind: 'mask',
            id: item.id,
            frame: {
                x: item.frame.x + border,
                y: item.frame.y + border,
                width: Math.max(0, item.frame.width - border * 2),
                height: Math.max(0, item.frame.height - border * 2),
            },
            rotation: item.rotation,
            opacity: 1,
            cornerRadius: Math.max(0, item.cornerRadius - border),
        };
    }
    function emitItems(layout, context, values, placeholders) {
        var _a, _b, _c;
        const items = [];
        const clips = [];
        const openers = new Map();
        const transforms = new Map();
        const open = [];
        const root = (_a = layout.nodes[0]) === null || _a === void 0 ? void 0 : _a.node;
        const canvasMode = (root === null || root === void 0 ? void 0 : root.kind) === 'stack' && root.layout === 'canvas';
        const push = (item) => {
            items.push(item);
            clips.push(open.map((entry) => entry.id));
        };
        for (const laid of layout.nodes) {
            while (open.length > 0 && laid.depth <= open[open.length - 1].depth) {
                const closed = open.pop();
                push({ ...openers.get(closed.id), kind: 'clipEnd' });
            }
            const parent = laid.parent ? ((_b = transforms.get(laid.parent)) !== null && _b !== void 0 ? _b : IDENTITY) : IDENTITY;
            const cx = laid.frame.x + laid.frame.width / 2;
            const cy = laid.frame.y + laid.frame.height / 2;
            transforms.set(laid.id, compose(parent, laid.rotation, cx, cy));
            const center = applyPoint(parent, cx, cy);
            const frame = {
                x: center.x - laid.frame.width / 2,
                y: center.y - laid.frame.height / 2,
                width: laid.frame.width,
                height: laid.frame.height,
            };
            const base = {
                id: laid.id,
                frame,
                rotation: parent.angle + laid.rotation,
                opacity: laid.opacity,
            };
            const node = laid.node;
            if ((0, model_1.isStackNode)(node)) {
                push(stackFill(node, base, context));
                if (node.clip === true) {
                    const opener = {
                        ...base,
                        kind: 'clipBegin',
                        cornerRadius: (_c = node.cornerRadius) !== null && _c !== void 0 ? _c : 0,
                    };
                    openers.set(laid.id, opener);
                    push(opener);
                    open.push({ id: laid.id, depth: laid.depth });
                }
                continue;
            }
            push(nodeItem(node, base, context, values, placeholders, canvasMode));
        }
        while (open.length > 0) {
            const closed = open.pop();
            push({ ...openers.get(closed.id), kind: 'clipEnd' });
        }
        return { items, clips, openers };
    }
    function stackFill(node, base, context) {
        var _a, _b, _c, _d;
        const stroke = node.stroke;
        return {
            ...base,
            kind: 'fill',
            color: node.fill !== undefined || node.fillAccent !== undefined
                ? resolveColor((_a = node.fill) !== null && _a !== void 0 ? _a : model_1.Palette.ink, node.fillAccent, context)
                : null,
            cornerRadius: (_b = node.cornerRadius) !== null && _b !== void 0 ? _b : 0,
            stroke: stroke && stroke.width > 0
                ? {
                    width: stroke.width,
                    color: resolveColor(stroke.color, stroke.accent, context),
                    dashLength: (_c = stroke.dashLength) !== null && _c !== void 0 ? _c : 0,
                    dashGap: (_d = stroke.dashGap) !== null && _d !== void 0 ? _d : 0,
                }
                : null,
        };
    }
    function nodeItem(node, base, context, values, placeholders, canvasMode) {
        var _a, _b, _c, _d, _e, _f, _g;
        if ((0, model_1.isImageNode)(node)) {
            return {
                ...base,
                kind: 'image',
                source: nodeImageSource(node, context),
                fit: node.fit,
                focusX: node.focusX,
                focusY: node.focusY,
                zoom: node.zoom,
                tilt: node.tilt,
                cornerRadius: (_a = node.cornerRadius) !== null && _a !== void 0 ? _a : 0,
                border: (_b = node.border) !== null && _b !== void 0 ? _b : 0,
                shadow: node.shadow === true,
                isSticker: node.isSticker === true,
                isLive: (0, model_1.nodeIsLivePhoto)(node),
                artwork: node.source === 'cover' ? context.cover.artwork : null,
                title: context.cover.title,
            };
        }
        if (node.kind === 'shape') {
            return {
                ...base,
                kind: 'shape',
                shape: node.shape,
                color: resolveColor(node.color, node.accent, context),
                strokeWidth: (_c = node.strokeWidth) !== null && _c !== void 0 ? _c : 0,
                dashLength: (_d = node.dashLength) !== null && _d !== void 0 ? _d : 0,
                dashGap: (_e = node.dashGap) !== null && _e !== void 0 ? _e : 0,
                cornerRadius: (_f = node.cornerRadius) !== null && _f !== void 0 ? _f : 0,
            };
        }
        if ((0, model_1.isTextNode)(node)) {
            const resolved = (_g = values[node.id]) !== null && _g !== void 0 ? _g : null;
            const chip = node.chip !== undefined
                ? resolveColor(node.chip, node.chipAccent, context)
                : node.chipAccent !== undefined
                    ? resolveColor(model_1.Palette.ink, node.chipAccent, context)
                    : null;
            return {
                ...base,
                kind: 'text',
                field: node.field,
                value: resolved !== null && resolved !== void 0 ? resolved : '',
                // 占位模式下的值是 `[字段名]`，画笔把它印淡一点再套一圈虚线框。
                placeholder: placeholders && resolvedText(node, context) === null,
                content: node.field === '条码' ? 'barcode' : 'text',
                barcodeSeed: String(context.bits.record.id).toUpperCase(),
                label: node.label,
                inlineLabel: node.inlineLabel === true && node.label.length > 0,
                fontSize: node.fontSize,
                fontId: node.fontId,
                weight: node.weight,
                design: node.design,
                align: node.alignment,
                tracking: node.tracking,
                // v3 measures the full value, including grid members that have no free-object frame.
                // Fixed-height overflow is explicit; it must not silently become an ellipsis here.
                lineLimit: canvasMode || node.frame && node.autoHeight !== false ? 10000 : node.lineLimit,
                color: resolveColor(node.color, node.accent, context),
                chip,
            };
        }
        // 间隔：什么都不画，但选中框、命中测试要它的框。
        return { ...base, kind: 'fill', color: null, cornerRadius: 0, stroke: null };
    }
    // 按对象身份记最近的八份：模版与内容都是不可变值，换一份就是换一个对象。
    const sizeCache = [];
    /**
     * 排一次版，只要尺寸。编辑器与工坊在渲染之前就得知道画布有多高（好算缩放倍数），
     * 而高度只有排完版才知道，所以这里同步排一次；同一份模版 + 同一份内容有缓存。
     */
    function measurePoster(template, context, options = {}) {
        const placeholders = options.placeholders === true;
        const hit = sizeCache.find((entry) => entry.template === template &&
            entry.context === context &&
            entry.placeholders === placeholders);
        if (hit)
            return { width: hit.width, height: hit.height };
        const scene = buildScene(template, context, { placeholders });
        const size = { width: scene.width, height: scene.height };
        sizeCache.unshift({ template, context, placeholders, ...size });
        if (sizeCache.length > 8)
            sizeCache.pop();
        return size;
    }
    /** 海报导出的像素尺寸。高度跟着排版走，所以要有场景才算得出来。 */
    function posterPixelSize(template, scene, pixelWidth) {
        const width = Math.round(pixelWidth !== null && pixelWidth !== void 0 ? pixelWidth : (0, model_1.exportPixelWidth)(template));
        return {
            width: Math.max(1, width),
            height: Math.max(1, Math.round((width * scene.height) / model_1.CANVAS_WIDTH)),
        };
    }
    /** 场景里所有要解码的图（预览与导出都先把它们准备好）。 */
    function sceneImageSources(scene) {
        var _a;
        const out = [];
        const seen = new Set();
        const push = (source) => {
            if (!source || seen.has(source.key))
                return;
            seen.add(source.key);
            out.push(source);
        };
        push((_a = scene.backgroundImage) === null || _a === void 0 ? void 0 : _a.source);
        for (const item of scene.items) {
            if (item.kind === 'image')
                push(item.source);
        }
        return out;
    }

  });

  define("shims/labels", function (module, exports, require) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.moodDisplay = moodDisplay;
    function moodDisplay(mood) {
        return mood;
    }

  });

  define("shims/i18n", function (module, exports, require) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getLanguage = getLanguage;
    exports.t = t;
    // 工坊只有中文；字段名本身就是中文键，原样返回。
    function getLanguage() {
        return 'zh-Hans';
    }
    function t(key) {
        return key;
    }

  });

  define("share/measure", function (module, exports, require) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.skiaMeasure = void 0;
    const skiaMeasure = (request) => {
        const hook = globalThis.LMMeasure;
        if (!hook)
            throw new Error('LMMeasure 还没注入：core.js 要在 render.js 之后用');
        return hook(request);
    };
    exports.skiaMeasure = skiaMeasure;

  });

  var require = requireFrom('');
  var core = {};
  ["core/models","core/customFields","core/template/fontCatalog","core/template/canvas","core/template/model","core/template/layout","core/template/document","core/template/builtins","share/scene"].forEach(function (id) {
    var exported = require(id);
    Object.keys(exported).forEach(function (key) {
      if (key !== '__esModule' && key !== 'default') core[key] = exported[key];
    });
  });
  global.LMCore = core;
})(typeof window !== 'undefined' ? window : globalThis);
