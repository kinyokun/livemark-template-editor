// 左栏「图层」页签：整棵图层树常驻显示，点选、控制显示、上下移、删除。
// 只是编辑器界面，不碰模版数据结构。
(function (global) {
  'use strict';

  var LM = global.LMCore;
  var App = global.LMApp;
  var CANVAS = 'canvas';

  function ui() { return global.LMUI.h; }

  function kindIcon(node) {
    if (LM.isStackNode(node)) return node.direction === 'row' ? '⇄' : '⇅';
    if (LM.isTextNode(node)) return 'T';
    if (LM.isImageNode(node)) return node.isSticker ? '☺' : '▣';
    if (LM.isShapeNode(node)) return '◆';
    return '…';
  }

  // MARK: - 页签

  App.prototype.renderSideTabs = function (box) {
    var self = this;
    var h = ui();
    var tabs = h('div', { class: 'side-tabs' });
    [['library', '模版'], ['layers', '图层']].forEach(function (tab) {
      tabs.appendChild(h('button', {
        class: 'side-tab' + (self.sideTab === tab[0] ? ' on' : ''),
        text: tab[1],
        onclick: function () {
          if (self.sideTab === tab[0]) return;
          self.sideTab = tab[0];
          self.renderLibrary();
        },
      }));
    });
    box.appendChild(tabs);
  };

  // MARK: - 图层树

  App.prototype.renderLayersPanel = function (box) {
    var self = this;
    var h = ui();

    box.appendChild(h('div', { class: 'section-title', text: '图层' }));

    // 画布那一行
    var canvasRow = h('div', { class: 'layer-row' + (this.selection === CANVAS ? ' on' : '') });
    canvasRow.appendChild(h('button', {
      class: 'layer-main', text: '▦ 画布与底图',
      onclick: function () { self.selectLayer(CANVAS); },
    }));
    box.appendChild(canvasRow);

    this.layerRows().forEach(function (entry) {
      var node = entry.node;
      var laid = self.scene && self.scene.layout.byID[node.id];
      var collapsed = laid && laid.collapsed;
      var hidden = node.visible === false;
      var isRoot = self.isRoot(node.id);

      var row = h('div', {
        class: 'layer-row' + (self.selection === node.id ? ' on' : '') +
          (collapsed || hidden ? ' faded' : ''),
      });
      row.style.paddingLeft = ((entry.depth - 1) * 14 + 4) + 'px';

      row.appendChild(h('button', {
        class: 'layer-main',
        text: kindIcon(node) + ' ' + entry.title + (collapsed && !hidden ? '（已收起）' : ''),
        title: entry.title,
        onclick: function () { self.selectLayer(node.id); },
      }));

      if (!isRoot) {
        row.appendChild(h('button', {
          class: 'icon-btn layer-act', text: hidden ? '◌' : '◉',
          title: hidden ? '显示' : '隐藏',
          onclick: function () {
            self.edit(null, function (draft) {
              draft.root = LM.updateNode(draft.root, node.id, function (n) {
                return Object.assign({}, n, { visible: hidden });
              });
            });
          },
        }));
        row.appendChild(h('button', {
          class: 'icon-btn layer-act', text: '␡', title: '删除',
          onclick: function () {
            self.edit(null, function (draft) { draft.root = LM.removeNode(draft.root, node.id); });
            if (self.selection === node.id) self.selection = CANVAS;
            self.refresh();
          },
        }));
      }
      box.appendChild(row);
    });

    box.appendChild(h('div', {
      class: 'hint layers-hint',
      text: '开「布局模式」后可在画布上直接把元素拖进别的行 / 列。',
    }));
  };

  /// 选中某一层（图层树与布局模式共用）。
  App.prototype.selectLayer = function (id) {
    if (this.selection === id) return;
    this.selection = id;
    this.more = false;
    this.refresh();
  };
})(window);
