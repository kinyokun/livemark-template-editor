(function (global) {
  'use strict';
  const LM = global.LMCore, R = global.LMRender, S = global.LMSample, U = global.LMUI;
  const { h, button, field, select, check, toast, dialog, closeDialog } = U;
  const $ = id => document.getElementById(id), clone = value => JSON.parse(JSON.stringify(value));
  const state = { template: LM.builtInTemplate(LM.SHARE_STYLES[0]), selection: [], past: [], future: [], preview: S.defaultPreview(),
    customFields: [], library: [], tab: 'templates', zoom: 1, scene: null, frames: {}, crop: false, drag: null, fontError: null,
    editingLayerId: null, cellSelection: [], cellAnchor: null, cellHover: null };
  let renderGeneration = 0, saveQueue = Promise.resolve(), toastTimer, libraryGeneration = 0;
  const nodes = () => state.template.root.children;
  const nodeByID = id => nodes().find(node => node.id === id);
  const selected = () => nodeByID(state.selection[0]);
  const label = node => (['网格图层', '内容图层'].includes(node.name) ? '内容模块' : node.name) || (node.kind === 'text' ? node.binding?.name || (node.field === '自定义文字' ? node.text.slice(0, 16) || '文字' : node.field) : { image: node.contentSlot === 'livePhoto' ? 'Live Photo 占位' : node.contentSlot === 'handwriting' ? '手写内容占位' : node.contentSlot === 'image' ? '图片占位' : '图片', shape: node.shape, stack: '内容模块', spacer: '间隔' }[node.kind]);
  const editingLayer = () => nodeByID(state.editingLayerId);
  const sceneOptions = () => ({ placeholders: state.preview.showEmptyFields === true });
  const actions = children => h('div', { class: 'actions' }, children);
  function context() {
    const value = S.context(state.preview);
    value.customFields = Object.fromEntries(state.customFields.map(item => [item.id, state.preview.sample === 2 ? null : item.name + (state.preview.sample === 1 ? ' · 较长的内容示例'.repeat(4) : '占位')]));
    return value;
  }
  function previewScene(template = state.template) {
    const scene = LM.buildScene(template, context(), sceneOptions());
    return { ...scene, backgroundImage: null, items: scene.items.map(item => {
      if (item.kind !== 'image') return item;
      const node = template.root.children.find(value => value.id === item.id);
      const kind = node?.contentSlot || (node?.video ? 'livePhoto' : node?.handwriting ? 'handwriting' : node?.source === 'cover' ? 'cover' : 'image');
      return { ...item, source: null, artwork: null, templatePlaceholder: { cover: '记录封面', image: '图片', livePhoto: 'Live Photo', handwriting: '手写内容' }[kind] || '图片' };
    }) };
  }
  function saveDraft() {
    const draft = { template: state.template, preview: state.preview, customFields: state.customFields };
    $('saveState').textContent = '正在保存草稿…';
    saveQueue = saveQueue.catch(() => {}).then(() => U.storage('draft', draft)).then(() => { $('saveState').textContent = '草稿已保存'; }).catch(() => { $('saveState').textContent = '草稿未保存'; toast('浏览器存储不可用，请先导出模板。'); });
  }
  function commit(template, before = state.template) {
    if (JSON.stringify(template) === JSON.stringify(before)) return;
    state.past.push(before); if (state.past.length > 60) state.past.shift(); state.future = [];
    state.template = template; saveDraft(); refresh();
  }
  function patch(id, changes) {
    const item = nodeByID(id); if (!item || item.locked) return;
    commit({ ...state.template, root: { ...state.template.root, children: nodes().map(node => node.id === id ? { ...node, ...changes } : node) } });
  }
  function patchCanvas(changes) { commit({ ...state.template, canvas: { ...state.template.canvas, ...changes } }); }
  function selectIDs(ids) { state.selection = LM.expandSelectionIDs(state.template, ids); state.crop = false; refreshPanels(); overlay(); }
  function add(node) {
    let next = { ...state.template, root: { ...state.template.root, children: [...nodes(), node] } };
    const layer = editingLayer(), cell = state.cellSelection[0];
    if (layer && cell && node.kind !== 'stack') {
      if (cellContent(cell)) { toast('这个格子已有内容，请先选择空格，或编辑原内容。'); return; }
      next = LM.setGridCell(next, node.id, layer.id, { row: cell.row, column: cell.column });
    }
    commit(next); selectIDs([node.id]); closeDialog();
  }
  function addText(fieldName, binding) {
    add(LM.makeTextNode(fieldName, { frame: { x: 32, y: 64, width: 250, height: 40 }, fontId: 'noto-sans-sc', fontSize: 22,
      text: fieldName === '自定义文字' && !binding ? '文字占位' : '', binding, autoHeight: true }));
  }
  function undo() { if (!state.past.length) return; state.future.push(state.template); state.template = state.past.pop(); state.selection = []; state.cellSelection=[]; saveDraft(); refresh(); }
  function redo() { if (!state.future.length) return; state.past.push(state.template); state.template = state.future.pop(); state.selection = []; state.cellSelection=[]; saveDraft(); refresh(); }
  function setTemplate(template) {
    state.template = clone(template); state.selection = []; state.past = []; state.future = []; state.crop = false; state.editingLayerId = null; state.cellSelection = [];
    saveDraft(); refresh();
  }
  function updateButtons() { $('undo').disabled = !state.past.length; $('redo').disabled = !state.future.length; $('documentName').value = state.template.name; $('zoomFit').textContent = Math.round(state.zoom * 100) + '%'; }
  async function render() {
    const generation = ++renderGeneration;
    try {
      await U.ensureFonts(state.template);
      if (generation !== renderGeneration) return;
      state.fontError = null;
      state.scene = previewScene();
      if (generation !== renderGeneration) return;
      paint();
      if (editingLayer()) inspector();
    } catch (error) {
      if (generation !== renderGeneration) return;
      state.fontError = error.message; $('overflow').hidden = false; $('overflow').textContent = error.message;
      toast(error.message);
    }
  }
  function paint() {
    const scene = state.scene; if (!scene) return;
    const dpr = Math.min(2, devicePixelRatio || 1), width = scene.width * state.zoom, height = scene.height * state.zoom;
    $('board').style.width = width + 'px'; $('board').style.height = height + 'px';
    for (const canvas of [$('canvas'), $('overlay')]) {
      canvas.width = Math.ceil(width * dpr); canvas.height = Math.ceil(height * dpr); canvas.style.width = width + 'px'; canvas.style.height = height + 'px';
    }
    const ctx = $('canvas').getContext('2d'); ctx.scale(state.zoom * dpr, state.zoom * dpr);
    state.frames = R.paintScene(ctx, scene, U.images); overlay();
    const overflow = scene.layout.overflow || [];
    $('overflow').hidden = !overflow.length; $('overflow').textContent = overflow.length ? '有内容超出边界。调整元素，或把画布改为长图后再导出。' : '';
  }
  function sceneItem(node) { return state.scene?.items.find(item => item.id === node.id && item.kind !== 'clipEnd'); }
  function frameFor(node) { return sceneItem(node)?.frame ?? state.scene?.layout.byID[node.id]?.frame; }
  function angleFor(node) { return sceneItem(node)?.rotation ?? node.rotation ?? 0; }
  function handlePoints(node) {
    const f = frameFor(node); if (!f) return [];
    const rad = angleFor(node) * Math.PI / 180, cx = f.x + f.width / 2, cy = f.y + f.height / 2;
    return [[-1,-1,'nw'],[1,-1,'ne'],[1,1,'se'],[-1,1,'sw'],[-1,0,'w'],[1,0,'e'],[0,-1,'rotate']].map(([x,y,name]) => {
      const localX = x * f.width / 2, localY = name === 'rotate' ? -f.height / 2 - 28 / state.zoom : y * f.height / 2;
      return { x: cx + localX * Math.cos(rad) - localY * Math.sin(rad), y: cy + localX * Math.sin(rad) + localY * Math.cos(rad), name };
    });
  }
  function overlay() {
    const canvas = $('overlay'), ctx = canvas.getContext('2d'), dpr = Math.min(2, devicePixelRatio || 1);
    ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.save(); ctx.scale(state.zoom * dpr, state.zoom * dpr);
    ctx.strokeStyle = '#6e8050'; ctx.fillStyle = '#fff'; ctx.lineWidth = 1.5 / state.zoom;
    for (const id of state.selection) {
      const node = nodeByID(id), f = node && frameFor(node); if (!f || state.scene?.layout.byID[id]?.collapsed) continue;
      ctx.save(); ctx.translate(f.x + f.width / 2, f.y + f.height / 2); ctx.rotate(angleFor(node) * Math.PI / 180);
      ctx.setLineDash(node.locked ? [4 / state.zoom, 4 / state.zoom] : []); ctx.strokeRect(-f.width / 2, -f.height / 2, f.width, f.height); ctx.restore();
    }
    const node = selected();
    if (state.selection.length === 1 && node && !node.locked && !state.editingLayerId) handlePoints(node).forEach(point => {
      ctx.beginPath(); ctx.arc(point.x, point.y, (point.name === 'rotate' ? 5 : 4) / state.zoom, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
    });
    if (state.editingLayerId && state.scene) {
      for (const cell of gridCells().filter(cell => !cell.collapsed)) {
        const f = cell.frame, active = state.cellSelection.some(value => value.row === cell.row && value.column === cell.column), hovered = state.cellHover?.row === cell.row && state.cellHover?.column === cell.column;
        ctx.save(); ctx.translate(f.x + f.width / 2, f.y + f.height / 2); ctx.rotate(cell.rotation * Math.PI / 180);
        ctx.fillStyle = hovered ? '#b9d48680' : active ? '#b9d48635' : 'transparent'; ctx.strokeStyle = active ? '#526d2e' : '#7f9176'; ctx.lineWidth = (active ? 2 : 1) / state.zoom;
        ctx.fillRect(-f.width / 2,-f.height / 2,f.width,f.height); ctx.strokeRect(-f.width / 2,-f.height / 2,f.width,f.height);
        if (!cellContent(cell)) { ctx.fillStyle = '#6e8050'; ctx.font = (13 / state.zoom) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('+',0,4 / state.zoom); }
        ctx.restore();
      }
    }
    ctx.restore();
  }
  function refresh() { updateButtons(); refreshPanels(); void render(); }
  function refreshPanels() {
    if (state.editingLayerId && !editingLayer()) { state.editingLayerId = null; state.cellSelection = []; }
    updateButtons(); sidebar(); inspector(); $('finishGrid').hidden = !state.editingLayerId;
    $('selectionHint').textContent = state.editingLayerId ? '模块编辑 · 空格在右侧选择 · Shift 多选' : state.crop ? '裁剪中 · 拖动调整画面，完成后恢复移动' : state.selection.length ? '拖动移动 · 角点缩放 · 圆点旋转' : '点选模块，再点“编辑内容”调整内部行列';
  }
  async function sidebar() {
    const panel = $('sidebar'), generation = ++libraryGeneration; panel.replaceChildren();
    $('tabTemplates').setAttribute('aria-pressed', state.tab === 'templates'); $('tabLayers').setAttribute('aria-pressed', state.tab === 'layers');
    if (state.tab === 'layers') {
      panel.append(h('p', { class: 'hint', text: '图层表示前后叠放顺序，列表上方在前。内容模块可以包含多行多列。' }));
      [...nodes()].filter(node => !node.regionId).reverse().forEach(node => panel.append(h('div', { class: 'layer' + (state.selection.includes(node.id) ? ' selected' : '') }, [
        button(label(node), event => { state.editingLayerId = null; state.cellSelection = []; selectIDs(event.shiftKey ? state.selection.includes(node.id) ? state.selection.filter(id => id !== node.id) : [...state.selection, node.id] : [node.id]); void render(); }),
        button(node.locked ? '解锁' : '锁定', () => commit({ ...state.template, root: { ...state.template.root, children: nodes().map(n => n.id === node.id ? { ...n, locked: !n.locked } : n) } }), { 'aria-label': (node.locked ? '解锁' : '锁定') + label(node) })
      ])));
      return;
    }
    panel.append(button('＋ 空白画布', () => setTemplate(LM.starterTemplate('空白画布')), { class: 'stretch' }));
    const groups = [['内置风格', LM.SHARE_STYLES.map(style => LM.builtInTemplate(style))], ['我的模板', state.library]];
    for (const [title, templates] of groups) {
      panel.append(h('h3', { text: title }));
      if (!templates.length) panel.append(h('p', { class: 'empty', text: '保存喜欢的排版，下次继续用。' }));
      const grid = h('div', { class: 'gallery' }); panel.append(grid);
      for (const template of templates) {
        const thumb = h('div', { class: 'thumb' }), tile = button('', () => setTemplate(template), { class: 'template' + (state.template.id === template.id ? ' selected' : '') });
        tile.append(thumb, h('span', { text: template.name })); grid.append(tile);
        // Lazy previews use the same scene renderer and wait for actual font bytes.
        void (async () => {
          try { await U.ensureFonts(template); if (generation !== libraryGeneration) return;
            const scene = previewScene(template);
            if (generation !== libraryGeneration) return;
            const canvas = R.renderToCanvas(scene, U.images, 150); canvas.style.maxHeight = '128px'; canvas.style.width = 'auto'; thumb.append(canvas);
          } catch { thumb.textContent = '预览未就绪'; }
        })();
      }
    }
  }
  function geometryPanel(node, panel) {
    const frame = LM.elementFrame(node);
    panel.append(h('h3', { text: '位置与尺寸' }));
    for (const pair of [[['x','横向'],['y','纵向']],[['width','宽度'],['height','高度']]]) panel.append(h('div', { class: 'row' }, pair.map(([key,title]) =>
      field(title, Math.round(frame[key]), value => commit(LM.resizeElement(state.template, node.id, { [key]: Number(value) }, { scaleChildren: true })), { type: 'number', step: 1 }))));
    panel.append(field('旋转', node.rotation || 0, value => commit(LM.rotateElements(state.template, state.selection, Number(value))), { type: 'number', step: 1 }));
  }
  function gridCells() { return state.editingLayerId && state.scene ? LM.gridCellFrames(state.template,state.editingLayerId,state.scene.layout) : []; }
  function cellContent(cell) {
    return nodes().find(node => node.regionId === state.editingLayerId && node.cell && node.cell.row >= cell.row && node.cell.row < cell.row + (cell.rowSpan || 1) && node.cell.column >= cell.column && node.cell.column < cell.column + (cell.colSpan || 1));
  }
  function enterGrid(layer) {
    if (!layer?.grid || layer.locked) return;
    state.editingLayerId = layer.id; state.selection = []; state.cellSelection = []; state.cellAnchor = null; state.crop = false; refresh();
  }
  function leaveGrid() {
    const id = state.editingLayerId; state.editingLayerId = null; state.cellSelection = []; state.cellHover = null; state.crop = false; state.selection = id ? [id] : []; refresh();
  }
  function selectCell(cell, extend) {
    if (extend && state.cellAnchor) {
      const anchor = state.cellAnchor, firstRow = Math.min(anchor.row,cell.row), lastRow = Math.max(anchor.row+(anchor.rowSpan||1),cell.row+(cell.rowSpan||1));
      const firstColumn = Math.min(anchor.column,cell.column), lastColumn = Math.max(anchor.column+(anchor.colSpan||1),cell.column+(cell.colSpan||1));
      state.cellSelection = gridCells().filter(value => value.row < lastRow && value.row+(value.rowSpan||1) > firstRow && value.column < lastColumn && value.column+(value.colSpan||1) > firstColumn);
    } else { state.cellSelection = [cell]; state.cellAnchor = cell; }
    const content = state.cellSelection.length === 1 ? cellContent(cell) : null;
    state.selection = content ? [content.id] : []; state.crop = false; refreshPanels(); overlay();
  }
  function gridControls(panel, layer) {
    const grid = layer.grid;
    panel.append(h('h2',{text:'正在编辑 · '+label(layer)}),button('完成模块编辑',leaveGrid,{class:'primary stretch'}));
    panel.append(h('p',{class:'hint',text:'画布保持实际排版。下面选择单元格，包括已收起的空行；Shift 点选多个格子可合并。'}));
    const structure = h('div', { class: 'module-cells', 'aria-label': '模块单元格', style: { gridTemplateColumns: 'repeat('+grid.columns+', minmax(56px, 1fr))' } });
    for (const cell of gridCells()) {
      const content = cellContent(cell), active = state.cellSelection.some(value => value.row === cell.row && value.column === cell.column);
      const coordinate = '第 '+(cell.row+1)+' 行，第 '+(cell.column+1)+' 列';
      const tile = button('', event => selectCell(cell,event.shiftKey), { class: 'module-cell'+(cell.collapsed?' collapsed':''), 'aria-label': coordinate, 'aria-pressed': active, 'data-cell': cell.row+':'+cell.column,
        style: { gridRow: (cell.row+1)+' / span '+(cell.rowSpan||1), gridColumn: (cell.column+1)+' / span '+(cell.colSpan||1) } });
      tile.append(h('small', { text: (cell.row+1)+' · '+(cell.column+1) }),h('span', { text: content ? label(content) : '＋ 添加' }));
      if(cell.collapsed)tile.append(h('small',{text:'已收起'}));
      structure.append(tile);
    }
    panel.append(h('div', { class: 'module-structure' }, [structure]));
    const changeSize = (rows,columns) => {
      const next = LM.resizeGrid(state.template,layer.id,Math.max(1,rows),Math.max(1,columns));
      if (next === state.template && (rows !== grid.rows || columns !== grid.columns)) toast('内容放不下，先移动或删除多余内容再减少行列。');
      else { state.cellSelection = []; state.selection = []; commit(next); }
    };
    panel.append(h('div',{class:'row'},[
      field('行数',grid.rows,value=>changeSize(Number(value),grid.columns),{type:'number',min:1,max:24}),
      field('列数',grid.columns,value=>changeSize(grid.rows,Number(value)),{type:'number',min:1,max:12})
    ]));
    panel.append(h('div',{class:'row'},[
      field('行间距',grid.rowGap,value=>patch(layer.id,{grid:{...grid,rowGap:Math.max(0,Number(value))}}),{type:'number',min:0}),
      field('列间距',grid.columnGap,value=>patch(layer.id,{grid:{...grid,columnGap:Math.max(0,Number(value))}}),{type:'number',min:0})
    ]));
    const selectedCells = state.cellSelection;
    if (selectedCells.length) {
      const cell = selectedCells[0];
      panel.append(h('h3',{text:selectedCells.length===1?'第 '+(cell.row+1)+' 行 · 第 '+(cell.column+1)+' 列':'已选 '+selectedCells.length+' 个格子'}));
      panel.append(actions([
        button('下方插入行',()=>{commit(LM.insertGridTrack(state.template,layer.id,'row',cell.row+(cell.rowSpan||1)));}),
        button('右侧插入列',()=>{commit(LM.insertGridTrack(state.template,layer.id,'column',cell.column+(cell.colSpan||1)));}),
        ...[['row','删除这行',cell.row],['column','删除这列',cell.column]].map(([axis,title,index])=>button(title,()=>{
          const result=LM.deleteGridTrack(state.template,layer.id,axis,index);if(result.error)toast('这一行或列仍有内容，先移动内容再删除。');else{state.cellSelection=[];state.selection=[];commit(result.template);}
        }))
      ]));
      panel.append(actions([
        button('合并单元格',()=>{
          const row=Math.min(...selectedCells.map(value=>value.row)),column=Math.min(...selectedCells.map(value=>value.column));
          const rowSpan=Math.max(...selectedCells.map(value=>value.row+(value.rowSpan||1)))-row,colSpan=Math.max(...selectedCells.map(value=>value.column+(value.colSpan||1)))-column;
          const result=LM.mergeGridCells(state.template,layer.id,{row,column,rowSpan,colSpan});
          if(result.error)toast('选区中有多项内容，先把多余内容移到其他格子再合并。');else{state.cellSelection=[{row,column,rowSpan,colSpan}];commit(result.template);}
        },{disabled:selectedCells.length<2}),
        button('拆分单元格',()=>{commit(LM.splitGridCell(state.template,layer.id,cell.row,cell.column));state.cellSelection=[];refreshPanels();},{disabled:selectedCells.length!==1||((cell.rowSpan||1)===1&&(cell.colSpan||1)===1)})
      ]));
      const heights=grid.rowHeights||[];
      panel.append(check('这一行随内容增高',heights[cell.row]==null,value=>{const rowHeights=Array.from({length:grid.rows},(_,index)=>heights[index]??null);rowHeights[cell.row]=value?null:state.scene.layout.grids?.[layer.id]?.rowHeights[cell.row]||48;patch(layer.id,{grid:{...grid,rowHeights}});}));
      if(heights[cell.row]!=null)panel.append(field('固定行高',heights[cell.row],value=>{const rowHeights=[...heights];rowHeights[cell.row]=Math.max(16,Number(value));patch(layer.id,{grid:{...grid,rowHeights}});},{type:'number',min:16}));
      if(selectedCells.length===1&&!cellContent(cell))panel.append(actions([button('文字',()=>addText('自定义文字')),button('记录词条',()=>fieldPicker()),button('图片',()=>addImageSlot('image'))]));
      if(selectedCells.length===1&&cellContent(cell))panel.append(select('移到单元格',cell.row+':'+cell.column,gridCells().map(target=>[target.row+':'+target.column,'第 '+(target.row+1)+' 行 · 第 '+(target.column+1)+' 列'+(cellContent(target)&&(target.row!==cell.row||target.column!==cell.column)?'（交换）':'')]),value=>{
        const target=gridCells().find(item=>item.row+':'+item.column===value),content=cellContent(cell);
        if(target&&content){commit(LM.setGridCell(state.template,content.id,layer.id,target));selectCell(target,false);}
      }));
    }
    panel.append(check('没有内容的行自动收起',grid.collapseEmptyRows!==false,value=>patch(layer.id,{grid:{...grid,collapseEmptyRows:value}})));
    const columns=h('details');columns.append(h('summary',{text:'精确调整列宽比例'}));
    for(let index=0;index<grid.columns;index++)columns.append(field('第 '+(index+1)+' 列',grid.columnWeights?.[index]||1,value=>{const columnWeights=Array.from({length:grid.columns},(_,i)=>grid.columnWeights?.[i]||1);columnWeights[index]=Math.max(.1,Number(value));patch(layer.id,{grid:{...grid,columnWeights}});},{type:'number',min:.1,step:.1}));
    panel.append(columns);
  }
  function inspector() {
    const panel = $('inspector'); panel.replaceChildren(); const node = selected();
    const layer = editingLayer();
    if (layer?.grid) { gridControls(panel,layer); if (!node || node.id===layer.id) return; panel.append(h('h3',{text:'单元格内容'})); }
    if (!node) { canvasPanel(panel); return; }
    panel.append(h('h2', { text: state.selection.length > 1 ? '已选 ' + state.selection.length + ' 个元素' : label(node) }));
    panel.append(actions([
      button('复制', () => commit(LM.duplicateElements(state.template, state.selection))),
      button(node.locked ? '解锁' : '锁定', () => commit({ ...state.template, root: { ...state.template.root, children: nodes().map(n => state.selection.includes(n.id) ? { ...n, locked: !node.locked } : n) } })),
      button('删除', () => { commit(LM.deleteElements(state.template, state.selection)); selectIDs([]); }, { class: 'danger', disabled: node.locked })
    ]));
    if (node.locked) { panel.append(h('p', { class: 'hint', text: '解锁后可以移动和修改。' })); return; }
    if (state.selection.length > 1) {
      panel.append(h('h3', { text: '一起调整' }), actions([button('组合', () => commit(LM.groupElements(state.template, state.selection))), button('解组', () => commit(LM.ungroupElements(state.template, state.selection)))]));
      panel.append(actions([['left','左对齐'],['center','水平居中'],['right','右对齐'],['top','顶对齐'],['middle','垂直居中'],['bottom','底对齐']].map(([mode,title]) => button(title, () => commit(LM.alignElements(state.template,state.selection,mode,state.scene.layout))))));
      panel.append(actions(['horizontal','vertical'].map(axis => button(axis === 'horizontal' ? '水平等距' : '垂直等距', () => commit(LM.distributeElements(state.template,state.selection,axis,state.scene.layout))))));
    } else if (node.kind === 'text') {
      panel.append(button(node.binding ? '词条：' + node.binding.name : '来源：' + node.field, () => fieldPicker(node.id), { class: 'stretch' }));
      if (node.binding && !state.customFields.some(item => item.id === node.binding.definitionId)) panel.append(h('p', { class: 'hint', text: '这是模板词条；在 App 使用时关联真实记录内容。' }));
      if (node.field === '自定义文字' && !node.binding) panel.append(field('文字内容', node.text, text => patch(node.id, { text }), { multiline: true }));
      panel.append(button('字体 · ' + (LM.posterFont(node.fontId)?.name || state.template.fontAssets?.find(font => font.id === node.fontId)?.name || '系统字体'), () => fontPicker(node), { class: 'stretch' }));
      panel.append(h('div', { class: 'row' }, [field('字号', node.fontSize, v => patch(node.id,{fontSize:Number(v)}), {type:'number',min:6,max:120}), select('字重',node.weight,LM.TEMPLATE_WEIGHTS.map(value=>[value,value]),value=>patch(node.id,{weight:value}))]));
      panel.append(select('对齐', node.alignment, LM.TEMPLATE_ALIGNMENTS.map(value=>[value,value]), alignment=>patch(node.id,{alignment})));
      panel.append(field('颜色',LM.colorHexString(node.color),value=>patch(node.id,{color:LM.colorFromHexString(value),accent:undefined}),{type:'color'}));
      panel.append(check('内容增多时自动增高',node.autoHeight!==false,value=>patch(node.id,{autoHeight:value})),check('没有内容时收起',node.hideWhenEmpty!==false,value=>patch(node.id,{hideWhenEmpty:value})));
      panel.append(field('小标题',node.label,value=>patch(node.id,{label:value})),field('字距',node.tracking,value=>patch(node.id,{tracking:Number(value)}),{type:'number',step:.2}));
    } else if (node.kind === 'image') {
      const slot = node.contentSlot || (node.video ? 'livePhoto' : node.handwriting ? 'handwriting' : node.source === 'cover' ? 'cover' : 'image');
      panel.append(select('内容类型',slot,[['cover','记录封面'],['image','图片占位'],['livePhoto','Live Photo · App 填充'],['handwriting','手写内容 · App 填充']],value=>patch(node.id,{source:'cover',contentSlot:value==='cover'?undefined:value,video:undefined,handwriting:undefined})));
      panel.append(h('p',{class:'hint',text:'这里只调整位置和样式。实际素材在 App 使用模板时填充，网页统一显示纯色占位。'}));
      panel.append(field('高宽比',node.regionId ? node.imageAspect||1 : LM.elementFrame(node).height/Math.max(1,LM.elementFrame(node).width),value=>{const ratio=Number(value);if(!Number.isFinite(ratio))return;const imageAspect=Math.max(.1,Math.min(10,ratio)),frame=LM.elementFrame(node);patch(node.id,{imageAspect,...(!node.regionId?{frame:{...frame,height:frame.width*imageAspect}}:{})});},{type:'number',min:.1,max:10,step:.1}));
      panel.append(select('图片填充',node.fit,[['cover','填满'],['contain','完整显示']],fit=>patch(node.id,{fit})));
      panel.append(field('圆角',node.cornerRadius||0,v=>patch(node.id,{cornerRadius:Number(v)}),{type:'number',min:0}),field('相纸白边',node.border||0,v=>patch(node.id,{border:Number(v)}),{type:'number',min:0}));
    } else if (node.kind === 'shape') {
      panel.append(select('形状',node.shape,LM.TEMPLATE_SHAPES.map(value=>[value,value]),shape=>patch(node.id,{shape})),field('颜色',LM.colorHexString(node.color),v=>patch(node.id,{color:LM.colorFromHexString(v),accent:undefined}),{type:'color'}));
    } else if (node.kind === 'stack') {
      panel.append(field('模块名称',label(node),value=>patch(node.id,{name:value.trim()||'内容模块'})));
      if(node.layout==='grid') panel.append(h('p',{class:'hint',text:'模块内可排列多行多列、合并单元格。模块整体可移动、旋转和缩放。'}),button('编辑内容',()=>enterGrid(node),{class:'primary stretch'}));
      else panel.append(h('p',{class:'hint',text:'这是一组内容，整体移动。'}));
      panel.append(field('区域底色',LM.colorHexString(node.fill||LM.Palette.white),value=>patch(node.id,{fill:LM.colorFromHexString(value)}),{type:'color'}));
    }
    if (layer) {
      panel.append(button('移出模块',()=>{const next=LM.setElementsRegion(state.template,[node.id],null,state.scene.layout);leaveGrid();commit(next);selectIDs([node.id]);}));
      return;
    }
    panel.append(h('h3',{text:'内容适配'}));
    if (node.kind!=='stack') panel.append(button('放入内容模块',()=>dialog('选择模块',nodes().filter(n=>n.layout==='grid').map(grid=>button(label(grid),()=>{
      const frames=LM.gridCellFrames(state.template,grid.id,state.scene.layout),empty=frames.find(cell=>!nodes().some(n=>n.regionId===grid.id&&n.cell?.row===cell.row&&n.cell?.column===cell.column));
      if(!empty){toast('这个网格没有空格。');return;}commit(LM.setGridCell(state.template,node.id,grid.id,empty));closeDialog();enterGrid(grid);
    })))));
    panel.append(select('跟随前一项',node.follow?.targetId||'',[['','独立位置'],...nodes().filter(n=>n.id!==node.id&&n.regionId===node.regionId&&!n.decoration).map(n=>[n.id,label(n)])],id=>{
      const next=LM.setElementFollow(state.template,node.id,id||null,node.follow?.gap??12,state.scene.layout); if(next===state.template&&id)toast('不能形成循环跟随关系。');else commit(next);
    }));
    if(node.follow)panel.append(field('跟随间距',node.follow.gap,v=>patch(node.id,{follow:{...node.follow,gap:Math.max(0,Number(v))}}),{type:'number',min:0}));
    if(node.regionId)panel.append(check('装饰元素，不撑开空区域',!!node.decoration,value=>patch(node.id,{decoration:value})));
    geometryPanel(node,panel);
    panel.append(h('h3',{text:'图层顺序'}),actions([button('前移一层',()=>reorder(node.id,1)),button('后移一层',()=>reorder(node.id,-1)),button('返回画布',()=>selectIDs([]))]));
  }
  function reorder(id,delta){const list=[...nodes()],node=nodeByID(id);if(!node||node.locked)return;const siblings=list.filter(item=>item.regionId===node.regionId),index=siblings.findIndex(item=>item.id===id),target=siblings[index+delta];if(!target)return;const i=list.indexOf(node),next=list.indexOf(target);[list[i],list[next]]=[list[next],list[i]];commit({...state.template,root:{...state.template.root,children:list}});}
  function canvasPanel(panel){
    panel.append(h('h2',{text:'画布'}),select('尺寸',state.template.canvas.height==='hug'?'hug':String(state.template.canvas.height.aspect),[['hug','长图 · 随内容增长'],['1','方形 1:1'],['1.3333333333333333','竖版 3:4'],['1.7777777777777777','故事 9:16']],value=>patchCanvas({height:value==='hug'?'hug':{aspect:Number(value)}})));
    panel.append(field('背景色',LM.colorHexString(state.template.canvas.background),value=>patchCanvas({background:LM.colorFromHexString(value),backgroundAccent:undefined}),{type:'color'}));
    panel.append(h('h3',{text:'排版测试'}),select('占位内容',String(state.preview.sample),S.RECORDS.map((item,index)=>[String(index),item.label]),value=>{state.preview.sample=Number(value);saveDraft();refresh();}));
    panel.append(h('p',{class:'hint',text:'用常规、长内容和缺省内容检查格式。示例不会写入模板；真实记录和素材在 App 中填充。'}));
    panel.append(button('管理自定义词条',()=>customFieldDialog()));
  }
  function fieldPicker(target){
    const bind=(fieldName,binding)=>{if(target)patch(target,{field:fieldName,binding,text:''});else addText(fieldName,binding);closeDialog();};
    dialog('选择记录词条',[
      ...LM.TEMPLATE_FIELDS.filter(name=>name!=='自定义文字').map(name=>button(name,()=>bind(name,undefined))),
      h('h3',{text:'自定义词条'}),...state.customFields.map(item=>button(item.name+(item.isPrivate?' · 私人':''),()=>bind('自定义文字',{kind:'custom',definitionId:item.id,name:item.name}))),
      button('＋ 新增自定义词条',()=>customFieldDialog(target)),button('固定文字',()=>bind('自定义文字',undefined))
    ]);
  }
  function customFieldDialog(target){
    let name='',privateValue=false;
    dialog('自定义词条',[
      ...state.customFields.map(item=>h('p',{class:'hint',text:item.name+(item.isPrivate?' · 私人词条':'')})),
      h('h3',{text:'新条目'}),field('名称',name,next=>name=next),check('私人条目',privateValue,next=>privateValue=next),
      button('保存并添加',()=>{if(!name.trim()){toast('请填写条目名称。');return;}if(state.customFields.some(item=>item.name===name.trim())){toast('同名条目已存在，请选择已有条目。');return;}
        const item={id:LM.randomUUID(),name:name.trim(),isPrivate:privateValue};state.customFields.push(item);saveDraft();
        if(target)patch(target,{field:'自定义文字',binding:{kind:'custom',definitionId:item.id,name:item.name},text:''});else addText('自定义文字',{kind:'custom',definitionId:item.id,name:item.name});closeDialog();},{class:'primary'})
    ]);
  }
  async function fontPicker(node){
    const sample=node.text||node.binding?.name||context().bits.values?.[node.field]||'把这一刻，留给以后 · Livemark';
    const entries=[...LM.FONT_CATALOG,...(state.template.fontAssets||[]).map(asset=>({...asset,latinName:'导入字体',coverage:'custom'}))];
    dialog('字体', [button('导入 TTF / OTF 字体',()=>{$('fileFont').dataset.target=node.id;$('fileFont').click();}),...entries.map(font=>{
      const preview=h('span',{class:'fontsample',text:sample}),item=button('',async()=>{try{await U.ensureFont(font.id,state.template.fontAssets);patch(node.id,{fontId:font.id});closeDialog();}catch(error){toast(error.message);}});
      item.append(h('span',{text:font.name}),h('span',{class:'fontmeta',text:font.coverage==='latin'?'西文 · 中文使用配套字库':font.latinName||'导入字体'}),preview);
      void U.ensureFont(font.id,state.template.fontAssets).then(()=>{preview.style.fontFamily=U.family(font.id);}).catch(()=>{preview.textContent='字体未能加载';});return item;
    })]);
  }
  $('fileFont').onchange=async event=>{const file=event.target.files[0],target=event.target.dataset.target;event.target.value='';if(!file)return;
    try{const bytes=new Uint8Array(await file.arrayBuffer());if(bytes.length>LM.MAX_IMPORTED_FONT_BYTES)throw new Error('字体文件超过32 MB。');
      const head=String.fromCharCode(...bytes.slice(0,4)),format=head==='OTTO'?'otf':bytes[0]===0&&bytes[1]===1&&bytes[2]===0&&bytes[3]===0?'ttf':null;if(!format)throw new Error('请选择有效的TTF或OTF字体。');
      const sha256=await U.digest(bytes),asset={id:'custom-'+sha256,name:file.name.replace(/\.(ttf|otf)$/i,''),data:U.base64(bytes),format,sha256};
      await U.ensureFont(asset.id,[asset]);
      commit({...state.template,fontAssets:[...(state.template.fontAssets||[]).filter(item=>item.id!==asset.id),asset],root:{...state.template.root,children:nodes().map(n=>n.id===target?{...n,fontId:asset.id}:n)}});closeDialog();
    }catch(error){toast(error.message);}};
  function addImageSlot(kind) {
    add(LM.makeImageNode('cover',{contentSlot:kind==='cover'?undefined:kind,imageAspect:kind==='handwriting'?.5:1,frame:{x:36,y:80,width:240,height:kind==='handwriting'?120:240},fit:kind==='handwriting'?'contain':'cover'}));
  }
  function pointerPoint(event){const rect=$('overlay').getBoundingClientRect();return{x:(event.clientX-rect.left)/state.zoom,y:(event.clientY-rect.top)/state.zoom};}
  function pointInRect(frame,rotation,point){const rad=-rotation*Math.PI/180,dx=point.x-frame.x-frame.width/2,dy=point.y-frame.y-frame.height/2;return{x:dx*Math.cos(rad)-dy*Math.sin(rad)+frame.width/2,y:dx*Math.sin(rad)+dy*Math.cos(rad)+frame.height/2};}
  function cellAt(point){return gridCells().find(cell=>{if(cell.collapsed)return false;const local=pointInRect(cell.frame,cell.rotation,point);return local.x>=0&&local.x<=cell.frame.width&&local.y>=0&&local.y<=cell.frame.height;});}
  function layerPoint(layer,point){return pointInRect(frameFor(layer),angleFor(layer),point);}
  function columnBoundary(layer,point){
    const tracks=state.scene?.layout.grids?.[layer.id];if(!tracks)return null;
    const local=layerPoint(layer,point);
    for(let index=0;index<layer.grid.columns-1;index++){
      const edge=tracks.columnOffsets[index]+tracks.columnWidths[index]+layer.grid.columnGap/2;
      if(Math.abs(local.x-edge)<7/state.zoom&&local.y>=0&&local.y<=frameFor(layer).height)return index;
    }
    return null;
  }
  function hit(node,point){const f=frameFor(node);if(!f)return false;const rad=-angleFor(node)*Math.PI/180,dx=point.x-f.x-f.width/2,dy=point.y-f.y-f.height/2;const x=dx*Math.cos(rad)-dy*Math.sin(rad),y=dx*Math.sin(rad)+dy*Math.cos(rad);return Math.abs(x)<=f.width/2&&Math.abs(y)<=f.height/2;}
  function hits(point){return [...nodes()].reverse().filter(node=>!node.locked&&(state.editingLayerId?node.regionId===state.editingLayerId:!node.regionId)&&hit(node,point)&&!state.scene?.layout.byID[node.id]?.collapsed);}
  const pointers=new Map();let pinch=null;
  $('overlay').onpointerdown=event=>{
    if(event.button!==0)return;const point=pointerPoint(event);pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});$('overlay').setPointerCapture(event.pointerId);
    if(pointers.size===2){if(state.drag){state.template=state.drag.before;state.drag=null;}const values=[...pointers.values()];pinch={distance:Math.hypot(values[1].x-values[0].x,values[1].y-values[0].y),zoom:state.zoom};return;}
    const layer=editingLayer();
    if(layer&&!state.crop){
      const boundary=columnBoundary(layer,point);
      if(boundary!==null){state.drag={mode:'gridColumn',before:state.template,layer,point:layerPoint(layer,point),index:boundary,widths:[...state.scene.layout.grids[layer.id].columnWidths]};event.preventDefault();return;}
      const cell=cellAt(point);if(!cell)return;selectCell(cell,event.shiftKey);if(event.shiftKey)return;
      const item=cellContent(cell);if(item&&!item.locked)state.drag={mode:'gridCell',before:state.template,point,node:item,cell,id:item.id,moved:false};
      $('overlay').focus();event.preventDefault();return;
    }
    let node=selected(),handle=node&&state.selection.length===1&&!node.locked&&!layer?handlePoints(node).find(p=>Math.hypot(p.x-point.x,p.y-point.y)<12/state.zoom):null;
    if(!handle){const found=hits(point);node=found[0];if(!node){selectIDs([]);return;}if(event.shiftKey){selectIDs(state.selection.includes(node.id)?state.selection.filter(id=>id!==node.id):[...state.selection,node.id]);return;}
      if(!state.selection.includes(node.id))selectIDs([node.id]);}
    const f=frameFor(node);state.drag={before:state.template,layout:state.scene.layout,point,frame:f,local:LM.elementFrame(node),node,id:node.id,mode:handle?.name||(state.crop&&node.kind==='image'?'crop':'move'),rotation:angleFor(node),ownRotation:node.rotation||0};
    $('overlay').focus();event.preventDefault();
  };
  $('overlay').onpointermove=event=>{
    if(pointers.has(event.pointerId))pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
    if(pinch&&pointers.size===2){const values=[...pointers.values()];setZoom(pinch.zoom*Math.hypot(values[1].x-values[0].x,values[1].y-values[0].y)/pinch.distance);return;}
    const drag=state.drag;if(!drag)return;const point=pointerPoint(event),dx=point.x-drag.point.x,dy=point.y-drag.point.y;
    if(drag.mode==='gridColumn'){
      const local=layerPoint(drag.layer,point),i=drag.index,total=drag.widths[i]+drag.widths[i+1],left=Math.max(16,Math.min(total-16,drag.widths[i]+local.x-drag.point.x));
      const columnWeights=[...drag.widths];columnWeights[i]=left;columnWeights[i+1]=total-left;
      state.template={...drag.before,root:{...drag.before.root,children:drag.before.root.children.map(node=>node.id===drag.layer.id?{...node,grid:{...node.grid,columnWeights}}:node)}};
    }else if(drag.mode==='gridCell'){
      drag.moved=drag.moved||Math.hypot(dx,dy)>4/state.zoom;state.cellHover=cellAt(point)||null;overlay();return;
    }else if(drag.mode==='move'){
      let x=dx,y=dy;const f=drag.frame;
      for(const target of [0,180,360]){if(Math.abs(f.x+x-target)<5/state.zoom)x=target-f.x;if(Math.abs(f.x+f.width/2+x-target)<5/state.zoom)x=target-f.x-f.width/2;}
      state.template=LM.moveElements(drag.before,state.selection,x,y);
    }else if(drag.mode==='crop'){
      const rad=-drag.rotation*Math.PI/180,localX=dx*Math.cos(rad)-dy*Math.sin(rad),localY=dx*Math.sin(rad)+dy*Math.cos(rad),frame=state.frames[drag.id]||drag.frame;
      const node={...drag.node,focusX:Math.max(0,Math.min(1,drag.node.focusX-localX/Math.max(1,frame.overflowX||drag.frame.width))),focusY:Math.max(0,Math.min(1,drag.node.focusY-localY/Math.max(1,frame.overflowY||drag.frame.height)))};
      state.template={...drag.before,root:{...drag.before.root,children:drag.before.root.children.map(n=>n.id===node.id?node:n)}};
    }else if(drag.mode==='rotate'){
      const cx=drag.frame.x+drag.frame.width/2,cy=drag.frame.y+drag.frame.height/2,start=Math.atan2(drag.point.y-cy,drag.point.x-cx),end=Math.atan2(point.y-cy,point.x-cx);
      let rotation=drag.ownRotation+(end-start)*180/Math.PI;if(event.shiftKey)rotation=Math.round(rotation/15)*15;state.template=LM.rotateElements(drag.before,state.selection,rotation);
    }else{
      const rad=drag.rotation*Math.PI/180,c=Math.cos(rad),s=Math.sin(rad),lx=dx*c+dy*s,ly=-dx*s+dy*c,sx=drag.mode.includes('w')?-1:1,sy=drag.mode.includes('n')?-1:1,side=drag.mode==='w'||drag.mode==='e';
      let width=Math.max(16,drag.local.width+sx*lx),height=side?drag.local.height:Math.max(16,drag.local.height+sy*ly);
      if(!side&&!event.altKey){const ratio=drag.local.height/drag.local.width;height=width*ratio;}
      const shiftX=sx*(width-drag.local.width)/2,shiftY=side?0:sy*(height-drag.local.height)/2;
      const frame={x:drag.local.x+(shiftX*c-shiftY*s)-(width-drag.local.width)/2,y:drag.local.y+(shiftX*s+shiftY*c)-(height-drag.local.height)/2,width,height};
      state.template=LM.resizeElement(drag.before,drag.id,frame,{scaleText:!side,scaleChildren:true});
    }
    state.scene=previewScene();paint();
  };
  function endPointer(event){
    pointers.delete(event.pointerId);if(pinch){if(pointers.size<2)pinch=null;return;}if(!state.drag)return;
    const drag=state.drag,before=drag.before;state.drag=null;
    if(drag.mode==='gridCell'){
      const target=state.cellHover;state.cellHover=null;
      if(drag.moved&&target&&(target.row!==drag.cell.row||target.column!==drag.cell.column)){
        const next=LM.setGridCell(before,drag.id,state.editingLayerId,target);state.cellSelection=[target];commit(next,before);
      }else overlay();
      return;
    }
    commit(state.template,before);
  }
  $('overlay').onpointerup=endPointer;
  $('overlay').onpointercancel=event=>{pointers.delete(event.pointerId);if(state.drag){state.template=state.drag.before;state.drag=null;refresh();}pinch=null;};
  $('overlay').oncontextmenu=event=>{event.preventDefault();const found=hits(pointerPoint(event));if(found.length)dialog('选择重叠的元素',found.map(node=>button(label(node),()=>{selectIDs([node.id]);closeDialog();})));};
  $('overlay').ondblclick=event=>{if(state.editingLayerId){const cell=cellAt(pointerPoint(event));if(cell&&!cellContent(cell)){selectCell(cell,false);fieldPicker();}return;}const layer=hits(pointerPoint(event)).find(node=>node.layout==='grid');if(layer)enterGrid(layer);};
  let pan=null;
  $('viewport').addEventListener('pointerdown',event=>{if(event.target!==$('viewport')&&event.button!==1)return;pan={x:event.clientX,y:event.clientY,left:$('viewport').scrollLeft,top:$('viewport').scrollTop};$('viewport').setPointerCapture(event.pointerId);});
  $('viewport').addEventListener('pointermove',event=>{if(!pan)return;$('viewport').scrollLeft=pan.left-event.clientX+pan.x;$('viewport').scrollTop=pan.top-event.clientY+pan.y;});
  $('viewport').addEventListener('pointerup',()=>pan=null);
  function setZoom(value){state.zoom=Math.max(.25,Math.min(3,value));paint();updateButtons();}
  $('viewport').addEventListener('wheel',event=>{if(event.ctrlKey||event.metaKey){event.preventDefault();setZoom(state.zoom*Math.exp(-event.deltaY*.003));}},{passive:false});
  $('zoomIn').onclick=()=>setZoom(state.zoom*1.15);$('zoomOut').onclick=()=>setZoom(state.zoom/1.15);$('zoomFit').onclick=()=>setZoom(Math.min(($('viewport').clientWidth-100)/360,($('viewport').clientHeight-100)/(state.scene?.height||600),1.5));
  document.addEventListener('keydown',event=>{
    if(event.target.matches('input,textarea,select')||$('picker').open)return;
    const cmd=event.metaKey||event.ctrlKey;
    if(cmd&&event.key.toLowerCase()==='z'){event.preventDefault();event.shiftKey?redo():undo();}
    else if(cmd&&event.key.toLowerCase()==='d'){event.preventDefault();commit(LM.duplicateElements(state.template,state.selection));}
    else if(event.key==='Delete'||event.key==='Backspace'){event.preventDefault();const ids=state.editingLayerId?state.cellSelection.map(cell=>cellContent(cell)?.id).filter(Boolean):state.selection;commit(LM.deleteElements(state.template,ids));selectIDs([]);}
    else if(event.key==='Escape'){state.editingLayerId?leaveGrid():selectIDs([]);}
    else if(event.key.startsWith('Arrow')){event.preventDefault();
      if(state.editingLayerId&&state.cellSelection.length){const cell=state.cellSelection[state.cellSelection.length-1],row=cell.row+(event.key==='ArrowDown'?(cell.rowSpan||1):event.key==='ArrowUp'?-1:0),column=cell.column+(event.key==='ArrowRight'?(cell.colSpan||1):event.key==='ArrowLeft'?-1:0);const next=gridCells().find(item=>row>=item.row&&row<item.row+(item.rowSpan||1)&&column>=item.column&&column<item.column+(item.colSpan||1));if(next)selectCell(next,event.shiftKey);}
      else{const amount=event.shiftKey?10:1;commit(LM.moveElements(state.template,state.selection,event.key==='ArrowLeft'?-amount:event.key==='ArrowRight'?amount:0,event.key==='ArrowUp'?-amount:event.key==='ArrowDown'?amount:0));}}
  });
  $('undo').onclick=undo;$('redo').onclick=redo;$('tabTemplates').onclick=()=>{state.tab='templates';void sidebar();};$('tabLayers').onclick=()=>{state.tab='layers';void sidebar();};
  $('documentName').onchange=event=>commit({...state.template,name:event.target.value.trim()||'我的模板'});
  $('addText').onclick=()=>addText('自定义文字');$('addField').onclick=()=>fieldPicker();$('addImage').onclick=()=>dialog('添加图片位置',[button('记录封面',()=>addImageSlot('cover')),button('图片占位',()=>addImageSlot('image'))]);
  $('addShape').onclick=()=>dialog('形状',LM.TEMPLATE_SHAPES.map(shape=>button(shape,()=>add(LM.makeShapeNode(shape,{frame:{x:40,y:80,width:220,height:shape==='直线'?4:80}})))));
  $('addInk').onclick=()=>addImageSlot('handwriting');$('addLive').onclick=()=>addImageSlot('livePhoto');$('addRegion').onclick=()=>{state.editingLayerId=null;state.cellSelection=[];const layer=LM.createGridLayer({x:20,y:60,width:280,height:160},2,3);add(layer);enterGrid(layer);};$('finishGrid').onclick=leaveGrid;
  $('btnSave').onclick=async()=>{try{const now=LM.isoString();const builtin=LM.SHARE_STYLES.some(style=>LM.builtInTemplate(style).id===state.template.id);const template={...state.template,id:builtin?LM.randomUUID():state.template.id,createdAt:builtin?now:state.template.createdAt,updatedAt:now};
    state.library=[...state.library.filter(item=>item.id!==template.id),template];await U.storage('library',state.library);state.template=template;saveDraft();refresh();toast('模板已保存。');}catch{toast('未能保存，请导出模板文件。');}};
  $('btnExportFile').onclick=async()=>{try{await U.ensureFonts(state.template);const text=LM.encodeTemplateDocument(state.template);const blob=new Blob([text],{type:'application/json'});U.download(blob,LM.templateFileName(state.template));toast('模板已导出，可在 Livemark 中打开。');}catch(error){toast(error.message);}};
  async function importFile(file){try{let bytes=new Uint8Array(await file.arrayBuffer());if(bytes[0]===31&&bytes[1]===139){bytes=new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());}
    const template=LM.decodeTemplateDocument(new TextDecoder().decode(bytes));await U.ensureFonts(template);
    LM.walkNodes(template.root,node=>{if(node.kind==='text'&&node.binding&&!state.customFields.some(field=>field.id===node.binding.definitionId))state.customFields.push({id:node.binding.definitionId,name:node.binding.name});});
    setTemplate(template);toast('模板已导入。词条会在 App 使用时关联真实内容。');
    }catch(error){toast(error.message||'文件未能导入。');}}
  $('btnImport').onclick=()=>$('fileImport').click();$('fileImport').onchange=event=>{const file=event.target.files[0];event.target.value='';if(file)void importFile(file);};
  document.addEventListener('dragover',event=>event.preventDefault());document.addEventListener('drop',event=>{event.preventDefault();if(event.dataTransfer.files[0])void importFile(event.dataTransfer.files[0]);});
  global.app={state,commit,undo,redo,selectIDs,refresh,context,importFile,enterGrid,leaveGrid,selectCell,gridCells};
  async function start(){try{state.library=await U.storage('library')||[];const draft=await U.storage('draft');if(draft?.template?.root?.layout==='canvas'){state.template=LM.sanitizeTemplate(draft.template);state.preview={...S.defaultPreview(),sample:Math.min(2,Math.max(0,draft.preview?.sample||0)),accent:draft.preview?.accent||'鸢尾紫'};state.customFields=draft.customFields||[];toast('已恢复上次草稿。');}}catch{toast('浏览器存储不可用，可以继续编辑并导出文件。');}refresh();}
  void start();
})(window);
