// 视图模式：图层聚焦（全部 / 突出 / 单独）与布局模式（只显示框线，拖拽换行 / 列）。
// 只是编辑器的显示与交互，不碰模版数据结构；导出走 render.js 的原始路径，不受影响。
(function (global) {
  'use strict';

  var LM = global.LMCore;
  var h = null; // ui.js 加载后从 LMUI 拿
  var App = global.LMApp;
  var CANVAS = 'canvas';

  function ui() {
    if (!h) h = global.LMUI.h;
    return h;
  }

  // MARK: - 画的时候每个图元的透明度

  /// draw() 把它传给 paintScene；返回 null 就是正常画。
  App.prototype.paintOptions = function () {
    if (this.layoutMode) {
      // 布局模式：整张调暗当底，框线画在 overlay 上。
      return { alphaFor: function () { return 0.35; } };
    }
    if (this.focusMode === 'all' || this.selection === CANVAS) return null;
    var node = this.node();
    if (!node) return null;
    var ids = {};
    LM.walkNodes(node, function (child) { ids[child.id] = true; });
    var solo = this.focusMode === 'solo';
    return {
      alphaFor: function (item) {
        if (ids[item.id]) return 1;
        return solo ? 0 : 0.16;
      },
    };
  };

  App.prototype.setFocusMode = function (mode) {
    if (this.focusMode === mode) return;
    this.focusMode = mode;
    this.draw();
    this.renderStageTools();
  };

  App.prototype.setLayoutMode = function (on) {
    this.layoutMode = !!on;
    this._layoutDrag = null;
    if (on) {
      this.sideTab = 'layers';
      this.toast('布局模式：拖任意元素换到别的行 / 列；再按 L 或点按钮退出');
    }
    this.refresh();
  };

  // MARK: - 舞台工具条（聚焦切换、布局模式、快速建行列、缩放）

  App.prototype.renderStageTools = function () {
    var self = this;
    var box = document.getElementById('stageTools');
    if (!box) return;
    var el = ui();
    box.textContent = '';

    // 布局模式开关
    box.appendChild(el('button', {
      class: 'btn small' + (this.layoutMode ? ' primary' : ''),
      text: this.layoutMode ? '退出布局模式' : '布局模式',
      title: '只显示框线，自由拖拽元素换行 / 列（快捷键 L）',
      onclick: function () { self.setLayoutMode(!self.layoutMode); },
    }));

    if (this.layoutMode) {
      // 快速创建行 / 列（插进选中容器，或选中元素之后）
      box.appendChild(el('button', {
        class: 'btn small', text: '＋ 行', title: '新建一个行容器',
        onclick: function () { self.addStack('row'); },
      }));
      box.appendChild(el('button', {
        class: 'btn small', text: '＋ 列', title: '新建一个列容器',
        onclick: function () { self.addStack('column'); },
      }));
      var node = this.node();
      if (node && !this.isRoot(node.id)) {
        box.appendChild(el('button', {
          class: 'btn small', text: '装进行',
          onclick: function () {
            self.edit(null, function (draft) { draft.root = LM.wrapNode(draft.root, node.id, 'row'); });
          },
        }));
        box.appendChild(el('button', {
          class: 'btn small', text: '装进列',
          onclick: function () {
            self.edit(null, function (draft) { draft.root = LM.wrapNode(draft.root, node.id, 'column'); });
          },
        }));
        box.appendChild(el('button', {
          class: 'btn small', text: '移出',
          title: '移出到父级容器',
          onclick: function () {
            self.edit(null, function (draft) { draft.root = LM.unwrapNode(draft.root, node.id); });
          },
        }));
      }
    } else {
      // 图层聚焦：选中图层时突出或单独显示它
      var seg = el('div', { class: 'seg-mini', title: '选中图层的显示方式' });
      var disabled = this.selection === CANVAS;
      [['all', '全部'], ['dim', '突出'], ['solo', '单独']].forEach(function (option) {
        seg.appendChild(el('button', {
          class: (!disabled && self.focusMode === option[0]) ? 'on' : '',
          text: option[1],
          disabled: disabled,
          title: disabled ? '先点选一个图层' :
            (option[0] === 'all' ? '所有图层正常显示' :
             option[0] === 'dim' ? '其他图层半透明，突出选中的' : '只显示选中的图层'),
          onclick: function () { self.setFocusMode(option[0]); },
        }));
      });
      box.appendChild(seg);
    }

    // 缩放
    var zoomBox = el('div', { class: 'zoom-box' });
    zoomBox.appendChild(el('button', {
      class: 'icon-btn', text: '−', title: '缩小',
      onclick: function () { self.setZoom(self.zoom / 1.15); },
    }));
    zoomBox.appendChild(el('button', {
      class: 'zoom-label', text: Math.round(this.zoom * 100) + '%', title: '回到 100%',
      onclick: function () { self.setZoom(1); },
    }));
    zoomBox.appendChild(el('button', {
      class: 'icon-btn', text: '＋', title: '放大',
      onclick: function () { self.setZoom(self.zoom * 1.15); },
    }));
    box.appendChild(zoomBox);
  };

  App.prototype.setZoom = function (value) {
    this.zoom = Math.min(3, Math.max(0.3, value));
    this.draw();
    this.renderTopBar();
    this.renderStageTools();
  };

  // MARK: - 布局模式：框线

  App.prototype.drawWireframes = function (ctx) {
    var self = this;
    var zoom = this.zoom;
    ctx.save();
    ctx.lineWidth = 1 / zoom;
    this.scene.layout.nodes.forEach(function (laid) {
      if (laid.collapsed) return;
      var f = laid.frame;
      if (laid.kind === 'stack') {
        var isRoot = self.isRoot(laid.id);
        ctx.strokeStyle = isRoot ? 'rgba(59, 130, 246, 0.35)' : 'rgba(59, 130, 246, 0.75)';
        ctx.setLineDash([4 / zoom, 3 / zoom]);
        ctx.strokeRect(f.x, f.y, f.width, f.height);
        ctx.setLineDash([]);
        if (!isRoot) {
          var tag = laid.node.direction === 'row' ? '行' : '列';
          var size = 9 / zoom;
          ctx.font = '600 ' + size + 'px sans-serif';
          ctx.fillStyle = 'rgba(59, 130, 246, 0.9)';
          ctx.fillText(tag, f.x + 3 / zoom, f.y + size + 2 / zoom);
        }
      } else {
        ctx.strokeStyle = 'rgba(32, 37, 31, 0.45)';
        ctx.strokeRect(f.x, f.y, f.width, f.height);
      }
    });
    ctx.restore();
  };

  // MARK: - 布局模式：拖拽换容器

  /// 布局模式下的命中测试：用排版结果（透明容器也能点到），深的先。
  App.prototype.layoutHits = function (point) {
    var out = [];
    this.scene.layout.nodes.forEach(function (laid, index) {
      if (laid.collapsed) return;
      var frame = laid.frame;
      var box = laid.rotation ? global.LMRender.boundingBox(frame, laid.rotation) : frame;
      if (point.x < box.x || point.x > box.x + box.width) return;
      if (point.y < box.y || point.y > box.y + box.height) return;
      // 叶子优先于容器，同档里深的先。
      out.push({ id: laid.id, rank: laid.kind === 'stack' ? 1 : 0, depth: laid.depth, index: index });
    });
    out.sort(function (a, b) {
      if (a.rank !== b.rank) return a.rank - b.rank;
      if (a.depth !== b.depth) return b.depth - a.depth;
      return b.index - a.index;
    });
    return out;
  };

  /// 指针下最深的、不在被拖子树里的容器，以及插入位置。
  App.prototype.dropTarget = function (point, draggedID) {
    var self = this;
    var dragged = LM.findNode(this.template.root, draggedID);
    if (!dragged) return null;
    var subtree = {};
    LM.walkNodes(dragged, function (node) { subtree[node.id] = true; });

    var best = null;
    var slack = 4;
    this.scene.layout.nodes.forEach(function (laid) {
      if (laid.kind !== 'stack' || laid.collapsed || subtree[laid.id]) return;
      var f = laid.frame;
      if (point.x < f.x - slack || point.x > f.x + f.width + slack) return;
      if (point.y < f.y - slack || point.y > f.y + f.height + slack) return;
      if (!best || laid.depth >= best.depth) best = laid;
    });
    if (!best) return null;

    var stack = best.node;
    var row = stack.direction === 'row';
    var value = row ? point.x : point.y;
    var index = stack.children.length;
    for (var i = 0; i < stack.children.length; i++) {
      var child = stack.children[i];
      if (child.id === draggedID) continue;
      var laidChild = this.scene.layout.byID[child.id];
      if (!laidChild || laidChild.collapsed) continue;
      var mid = row
        ? laidChild.frame.x + laidChild.frame.width / 2
        : laidChild.frame.y + laidChild.frame.height / 2;
      if (value < mid) { index = i; break; }
    }

    // 插入指示线的位置
    var frame = best.frame;
    var linePos = null;
    for (var j = index; j < stack.children.length && linePos === null; j++) {
      var after = stack.children[j];
      if (after.id === draggedID) continue;
      var la = this.scene.layout.byID[after.id];
      if (la && !la.collapsed) linePos = row ? la.frame.x - 2 : la.frame.y - 2;
    }
    if (linePos === null) {
      for (var k = Math.min(index, stack.children.length) - 1; k >= 0 && linePos === null; k--) {
        var before = stack.children[k];
        if (before.id === draggedID) continue;
        var lb = this.scene.layout.byID[before.id];
        if (lb && !lb.collapsed) {
          linePos = row ? lb.frame.x + lb.frame.width + 2 : lb.frame.y + lb.frame.height + 2;
        }
      }
    }
    if (linePos === null) linePos = row ? frame.x + 4 : frame.y + 4;
    var line = row
      ? { x1: linePos, y1: frame.y, x2: linePos, y2: frame.y + frame.height }
      : { x1: frame.x, y1: linePos, x2: frame.x + frame.width, y2: linePos };

    return { parentID: best.id, index: index, frame: frame, line: line };
  };

  App.prototype.layoutDragMove = function (drag, point) {
    this._layoutDrag = {
      id: drag.id,
      start: drag.start,
      point: point,
      frame: this.frameFor(drag.id),
      target: this.dropTarget(point, drag.id),
    };
    this.drawOverlay();
  };

  App.prototype.layoutDragEnd = function (drag) {
    var state = this._layoutDrag;
    this._layoutDrag = null;
    var target = state && state.target;
    if (!target) { this.drawOverlay(); return; }
    var id = drag.id;
    this.edit(null, function (draft) {
      var node = LM.findNode(draft.root, id);
      var parent = LM.parentOf(draft.root, id);
      if (!node || !parent) return;
      var index = target.index;
      if (parent.id === target.parentID) {
        var old = parent.children.findIndex(function (child) { return child.id === id; });
        if (old >= 0 && old < index) index -= 1;
      }
      draft.root = LM.removeNode(draft.root, id);
      draft.root = LM.insertInto(draft.root, target.parentID, node, index);
    });
  };

  App.prototype.drawLayoutDrag = function (ctx) {
    var state = this._layoutDrag;
    if (!state) return;
    var zoom = this.zoom;
    ctx.save();
    // 目标容器高亮
    if (state.target) {
      var f = state.target.frame;
      ctx.fillStyle = 'rgba(59, 130, 246, 0.08)';
      ctx.fillRect(f.x, f.y, f.width, f.height);
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.9)';
      ctx.lineWidth = 2 / zoom;
      ctx.strokeRect(f.x, f.y, f.width, f.height);
      // 插入位置
      var line = state.target.line;
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3 / zoom;
      ctx.beginPath();
      ctx.moveTo(line.x1, line.y1);
      ctx.lineTo(line.x2, line.y2);
      ctx.stroke();
    }
    // 被拖元素的影子跟着指针走
    if (state.frame) {
      var dx = state.point.x - state.start.x;
      var dy = state.point.y - state.start.y;
      var g = state.frame;
      ctx.globalAlpha = 0.6;
      ctx.setLineDash([3 / zoom, 3 / zoom]);
      ctx.strokeStyle = '#20251f';
      ctx.lineWidth = 1.5 / zoom;
      ctx.strokeRect(g.x + dx, g.y + dy, g.width, g.height);
    }
    ctx.restore();
  };
})(window);
