(function (global) {
  'use strict';
  const LM = global.LMCore, R = global.LMRender, S = global.LMSample, U = global.LMUI;
  const { h, button, field, select, check, toast, dialog, closeDialog } = U;
  const $ = id => document.getElementById(id), clone = value => JSON.parse(JSON.stringify(value));
  const state = { template: LM.builtInTemplate(LM.SHARE_STYLES[0]), selection: [], past: [], future: [], preview: S.defaultPreview(),
    customFields: [], sampleOverrides: {}, library: [], tab: 'templates', zoom: 1, scene: null, frames: {}, crop: false, drag: null, fontError: null,
    editingLayerId: null, cellSelection: [], cellAnchor: null, cellHover: null };
  let renderGeneration = 0, saveQueue = Promise.resolve(), toastTimer, libraryGeneration = 0;
  const nodes = () => state.template.root.children;
  const nodeByID = id => nodes().find(node => node.id === id);
  const selected = () => nodeByID(state.selection[0]);
  const label = node => node.name || (node.kind === 'text' ? node.binding?.name || (node.field === '自定义文字' ? node.text.slice(0, 16) || '文字' : node.field) : { image: '图片', shape: node.shape, stack: node.layout === 'grid' ? '网格图层' : '内容图层', spacer: '间隔' }[node.kind]);
  const editingLayer = () => nodeByID(state.editingLayerId);
  const sceneOptions = () => ({ placeholders: state.preview.showEmptyFields === true, editingGridId: state.editingLayerId || undefined });
  const actions = children => h('div', { class: 'actions' }, children);
  function context() {
    const value = S.context(state.preview);
    value.customFields = Object.fromEntries(state.customFields.map(item => [item.id, item.isPrivate && !state.preview.showCustomPrivate ? null : item.value || null]));
    if (Object.keys(state.sampleOverrides).length) {
      const sample = S.RECORDS[state.preview.sample].record;
      value.bits = LM.makeCardBits({ ...sample, ...state.sampleOverrides }, { ...state.preview.options, locale: 'zh-Hans' }, state.preview.author);
    }
    return value;
  }
  function saveDraft() {
    const draft = { template: state.template, preview: state.preview, customFields: state.customFields, sampleOverrides: state.sampleOverrides };
    $('saveState').textContent = '正在保存草稿…';
    saveQueue = saveQueue.catch(() => {}).then(() => U.storage('draft', draft)).then(() => { $('saveState').textContent = '草稿已保存'; }).catch(() => { $('saveState').textContent = '草稿未保存'; toast('浏览器存储不可用，请先导出模版。'); });
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
      text: fieldName === '自定义文字' && !binding ? '写下这一刻' : '', binding, autoHeight: true }));
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
      state.scene = LM.buildScene(state.template, context(), sceneOptions());
      await U.loadImages(state.scene);
      if (generation !== renderGeneration) return;
      paint();
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
      const node = nodeByID(id), f = node && frameFor(node); if (!f) continue;
      ctx.save(); ctx.translate(f.x + f.width / 2, f.y + f.height / 2); ctx.rotate(angleFor(node) * Math.PI / 180);
      ctx.setLineDash(node.locked ? [4 / state.zoom, 4 / state.zoom] : []); ctx.strokeRect(-f.width / 2, -f.height / 2, f.width, f.height); ctx.restore();
    }
    const node = selected();
    if (state.selection.length === 1 && node && !node.locked && !state.editingLayerId) handlePoints(node).forEach(point => {
      ctx.beginPath(); ctx.arc(point.x, point.y, (point.name === 'rotate' ? 5 : 4) / state.zoom, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
    });
    if (state.editingLayerId && state.scene) {
      for (const cell of gridCells()) {
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
    $('selectionHint').textContent = state.editingLayerId ? '层内编辑 · 点选格子 · Shift多选 · 拖列边界调宽' : state.crop ? '裁剪中 · 拖动调整画面，完成后恢复移动' : state.selection.length ? '拖动移动整层 · 角点缩放 · 圆点旋转' : '点选图层，再点“编辑内容”调整内部行列';
  }
  async function sidebar() {
    const panel = $('sidebar'), generation = ++libraryGeneration; panel.replaceChildren();
    $('tabTemplates').setAttribute('aria-pressed', state.tab === 'templates'); $('tabLayers').setAttribute('aria-pressed', state.tab === 'layers');
    if (state.tab === 'layers') {
      panel.append(h('p', { class: 'hint', text: '每层可以有多行多列。这里选择的是整个图层。' }));
      [...nodes()].filter(node => !node.regionId).reverse().forEach(node => panel.append(h('div', { class: 'layer' + (state.selection.includes(node.id) ? ' selected' : '') }, [
        button(label(node), event => { state.editingLayerId = null; state.cellSelection = []; selectIDs(event.shiftKey ? state.selection.includes(node.id) ? state.selection.filter(id => id !== node.id) : [...state.selection, node.id] : [node.id]); void render(); }),
        button(node.locked ? '解锁' : '锁定', () => commit({ ...state.template, root: { ...state.template.root, children: nodes().map(n => n.id === node.id ? { ...n, locked: !n.locked } : n) } }), { 'aria-label': (node.locked ? '解锁' : '锁定') + label(node) })
      ])));
      return;
    }
    panel.append(button('＋ 空白画布', () => setTemplate(LM.starterTemplate('空白画布')), { class: 'stretch' }));
    const groups = [['内置风格', LM.SHARE_STYLES.map(style => LM.builtInTemplate(style))], ['我的模版', state.library]];
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
            const scene = LM.buildScene(template, context(), { placeholders: state.preview.showEmptyFields === true }); await U.loadImages(scene);
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
    panel.append(h('h2',{text:'正在编辑 · '+label(layer)}),button('完成层内编辑',leaveGrid,{class:'primary stretch'}));
    panel.append(h('p',{class:'hint',text:'点选单元格添加内容；拖动内容可以换格。Shift点选多个格子进行合并。拖动画布上的列边界调整宽度。'}));
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
      if(selectedCells.length===1&&!cellContent(cell))panel.append(actions([button('文字',()=>addText('自定义文字')),button('记录词条',()=>fieldPicker()),button('图片',()=>pickImage())]));
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
      if (node.binding && !state.customFields.some(item => item.id === node.binding.definitionId)) panel.append(h('p', { class: 'hint', text: '这份模版的词条尚未绑定。点击上方来源，选择本地词条。' }));
      if (node.field === '自定义文字' && !node.binding) panel.append(field('文字内容', node.text, text => patch(node.id, { text }), { multiline: true }));
      panel.append(button('字体 · ' + (LM.posterFont(node.fontId)?.name || state.template.fontAssets?.find(font => font.id === node.fontId)?.name || '系统字体'), () => fontPicker(node), { class: 'stretch' }));
      panel.append(h('div', { class: 'row' }, [field('字号', node.fontSize, v => patch(node.id,{fontSize:Number(v)}), {type:'number',min:6,max:120}), select('字重',node.weight,LM.TEMPLATE_WEIGHTS.map(value=>[value,value]),value=>patch(node.id,{weight:value}))]));
      panel.append(select('对齐', node.alignment, LM.TEMPLATE_ALIGNMENTS.map(value=>[value,value]), alignment=>patch(node.id,{alignment})));
      panel.append(field('颜色',LM.colorHexString(node.color),value=>patch(node.id,{color:LM.colorFromHexString(value),accent:undefined}),{type:'color'}));
      panel.append(check('内容增多时自动增高',node.autoHeight!==false,value=>patch(node.id,{autoHeight:value})),check('没有内容时收起',node.hideWhenEmpty!==false,value=>patch(node.id,{hideWhenEmpty:value})));
      panel.append(field('小标题',node.label,value=>patch(node.id,{label:value})),field('字距',node.tracking,value=>patch(node.id,{tracking:Number(value)}),{type:'number',step:.2}));
    } else if (node.kind === 'image') {
      if (node.handwriting) panel.append(button('继续编辑笔迹',()=>inkDialog(node),{class:'stretch'}));
      panel.append(button(state.crop ? '完成裁剪' : '裁剪图片',()=>{state.crop=!state.crop;refreshPanels();overlay();},{class:state.crop?'primary stretch':'stretch'}));
      panel.append(select('图片填充',node.fit,[['cover','填满'],['contain','完整显示']],fit=>patch(node.id,{fit})));
      if (state.crop) panel.append(field('画面缩放',node.zoom,v=>patch(node.id,{zoom:Number(v)}),{type:'range',min:1,max:3,step:.02}),field('画面倾斜',node.tilt,v=>patch(node.id,{tilt:Number(v)}),{type:'range',min:-45,max:45,step:1}));
      panel.append(button('替换图片',()=>pickImage(node.id)),field('圆角',node.cornerRadius||0,v=>patch(node.id,{cornerRadius:Number(v)}),{type:'number',min:0}),field('相纸白边',node.border||0,v=>patch(node.id,{border:Number(v)}),{type:'number',min:0}));
    } else if (node.kind === 'shape') {
      panel.append(select('形状',node.shape,LM.TEMPLATE_SHAPES.map(value=>[value,value]),shape=>patch(node.id,{shape})),field('颜色',LM.colorHexString(node.color),v=>patch(node.id,{color:LM.colorFromHexString(v),accent:undefined}),{type:'color'}));
    } else if (node.kind === 'stack') {
      panel.append(field('图层名称',node.name||'网格图层',value=>patch(node.id,{name:value.trim()||'网格图层'})));
      if(node.layout==='grid') panel.append(h('p',{class:'hint',text:'整个图层一起移动、旋转和缩放。进入层内后编辑多行多列与合并格。'}),button('编辑内容',()=>enterGrid(node),{class:'primary stretch'}));
      else panel.append(h('p',{class:'hint',text:'这是一组内容，整体移动。'}));
      panel.append(field('区域底色',LM.colorHexString(node.fill||LM.Palette.white),value=>patch(node.id,{fill:LM.colorFromHexString(value)}),{type:'color'}));
    }
    if (layer) {
      panel.append(button('移出为独立图层',()=>{const next=LM.setElementsRegion(state.template,[node.id],null,state.scene.layout);leaveGrid();commit(next);selectIDs([node.id]);}));
      return;
    }
    panel.append(h('h3',{text:'内容适配'}));
    if (node.kind!=='stack') panel.append(button('放入网格图层',()=>dialog('选择网格和空格',nodes().filter(n=>n.layout==='grid').map(grid=>button(label(grid),()=>{
      const frames=LM.gridCellFrames(state.template,grid.id,state.scene.layout),empty=frames.find(cell=>!nodes().some(n=>n.regionId===grid.id&&n.cell?.row===cell.row&&n.cell?.column===cell.column));
      if(!empty){toast('这个网格没有空格。');return;}commit(LM.setGridCell(state.template,node.id,grid.id,empty));closeDialog();enterGrid(grid);
    })))));
    panel.append(select('跟随前一项',node.follow?.targetId||'',[['','独立位置'],...nodes().filter(n=>n.id!==node.id&&n.regionId===node.regionId&&!n.decoration).map(n=>[n.id,label(n)])],id=>{
      const next=LM.setElementFollow(state.template,node.id,id||null,node.follow?.gap??12,state.scene.layout); if(next===state.template&&id)toast('不能形成循环跟随关系。');else commit(next);
    }));
    if(node.follow)panel.append(field('跟随间距',node.follow.gap,v=>patch(node.id,{follow:{...node.follow,gap:Math.max(0,Number(v))}}),{type:'number',min:0}));
    if(node.regionId)panel.append(check('装饰元素，不撑开空区域',!!node.decoration,value=>patch(node.id,{decoration:value})));
    geometryPanel(node,panel);
    panel.append(h('h3',{text:'层级'}),actions([button('上移一层',()=>reorder(node.id,1)),button('下移一层',()=>reorder(node.id,-1)),button('返回画布',()=>selectIDs([]))]));
  }
  function reorder(id,delta){const list=[...nodes()],i=list.findIndex(n=>n.id===id),next=Math.max(0,Math.min(list.length-1,i+delta));[list[i],list[next]]=[list[next],list[i]];commit({...state.template,root:{...state.template.root,children:list}});}
  function canvasPanel(panel){
    panel.append(h('h2',{text:'画布'}),select('尺寸',state.template.canvas.height==='hug'?'hug':String(state.template.canvas.height.aspect),[['hug','长图 · 随内容增长'],['1','方形 1:1'],['1.3333333333333333','竖版 3:4'],['1.7777777777777777','故事 9:16']],value=>patchCanvas({height:value==='hug'?'hug':{aspect:Number(value)}})));
    panel.append(field('背景色',LM.colorHexString(state.template.canvas.background),value=>patchCanvas({background:LM.colorFromHexString(value),backgroundAccent:undefined}),{type:'color'}));
    panel.append(field('导出宽度',state.template.canvas.exportWidth||1080,value=>patchCanvas({exportWidth:Math.max(LM.EXPORT_WIDTH_RANGE[0],Math.min(LM.EXPORT_WIDTH_RANGE[1],Number(value)))}),{type:'number',min:LM.EXPORT_WIDTH_RANGE[0],max:LM.EXPORT_WIDTH_RANGE[1],step:360}));
    panel.append(h('h3',{text:'预览记录'}),select('示例',String(state.preview.sample),S.RECORDS.map((item,index)=>[String(index),item.record.title]),value=>{state.preview.sample=Number(value);state.sampleOverrides={};saveDraft();refresh();}));
    panel.append(field('名称',state.sampleOverrides.title??S.RECORDS[state.preview.sample].record.title,value=>{state.sampleOverrides.title=value;saveDraft();void render();}));
    panel.append(field('感想',state.sampleOverrides.note??S.RECORDS[state.preview.sample].record.note,value=>{state.sampleOverrides.note=value;saveDraft();void render();},{multiline:true}));
    panel.append(h('p',{class:'hint',text:'预览内容只留在浏览器草稿中。导出的模版保存排版和词条绑定，不带这条示例记录。'}));
    panel.append(button('管理自定义词条',()=>customFieldDialog()),h('h3',{text:'分享内容'}));
    S.TOGGLES.forEach(item=>panel.append(check(item.label+(item.private?' · 私人':''),state.preview.options[item.key],value=>{state.preview.options[item.key]=value;saveDraft();void render();})));
    panel.append(check('编辑时显示空词条占位',!!state.preview.showEmptyFields,value=>{state.preview.showEmptyFields=value;saveDraft();void render();}));
    panel.append(check('分享私人自定义词条',!!state.preview.showCustomPrivate,value=>{state.preview.showCustomPrivate=value;saveDraft();void render();}));
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
    let name='',value='',privateValue=false;
    dialog('自定义词条',[
      ...state.customFields.map(item=>field(item.name,item.value,next=>{item.value=next;saveDraft();void render();})),
      h('h3',{text:'新条目'}),field('名称',name,next=>name=next),field('预览内容',value,next=>value=next,{multiline:true}),check('私人条目',privateValue,next=>privateValue=next),
      button('保存并添加',()=>{if(!name.trim()){toast('请填写条目名称。');return;}if(state.customFields.some(item=>item.name===name.trim())){toast('同名条目已存在，请选择已有条目。');return;}
        const item={id:LM.randomUUID(),name:name.trim(),value,isPrivate:privateValue};state.customFields.push(item);saveDraft();
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
  function pickImage(target){$('fileImage').dataset.target=target||'';$('fileImage').click();}
  $('fileImage').onchange=async event=>{const file=event.target.files[0],target=event.target.dataset.target;event.target.value='';if(!file)return;
    try{const url=await U.readURL(file),image=new Image();image.src=url;await image.decode();const data=url.split(',')[1],imageAspect=image.naturalHeight/image.naturalWidth;
      if(target)patch(target,{source:{data},imageAspect,handwriting:undefined});else add(LM.makeImageNode({data},{imageAspect,frame:{x:36,y:80,width:240,height:Math.min(340,240*imageAspect)}}));
    }catch{toast('这张图片未能打开，请使用PNG、JPEG或WebP。');}};
  function inkDialog(target){
    let ink={version:1,width:1000,height:500,strokes:[]};
    if(target?.handwriting){
      try{
        const source=target.handwriting.format==='strokes-v1'?target.handwriting.data:target.handwriting.portableStrokes;
        if(!source||source.length>8*1024*1024)throw new Error();
        const value=JSON.parse(source);let count=0;
        if(value.version!==1||!Number.isFinite(value.width)||!Number.isFinite(value.height)||value.width<1||value.height<1||value.width>10000||value.height>10000||!Array.isArray(value.strokes)||value.strokes.length>2000)throw new Error();
        for(const stroke of value.strokes){
          if(!Array.isArray(stroke.points)||!/^#[\da-f]{6}$/i.test(stroke.color)||!Number.isFinite(stroke.width)||stroke.width<=0||stroke.width>100)throw new Error();
          count+=stroke.points.length;
          if(count>100000||stroke.points.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)||Math.abs(p.x)>100000||Math.abs(p.y)>100000))throw new Error();
        }
        ink=value;
      }catch{toast('这份笔迹无法在网页中继续编辑，请使用原设备打开。');return;}
    }
    const canvas=h('canvas',{class:'inkpad',width:ink.width,height:ink.height}),ctx=canvas.getContext('2d');let activeStroke=null;
    const paint=(context,strokes)=>{context.lineCap='round';context.lineJoin='round';for(const stroke of strokes){const first=stroke.points[0];if(!first)continue;context.strokeStyle=stroke.color;context.lineWidth=stroke.width;context.beginPath();context.moveTo(first.x,first.y);for(const p of stroke.points.slice(1))context.lineTo(p.x,p.y);if(stroke.points.length===1)context.lineTo(first.x+.01,first.y+.01);context.stroke();}};
    const repaint=()=>{ctx.clearRect(0,0,canvas.width,canvas.height);paint(ctx,ink.strokes);};
    const point=e=>{const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*canvas.width/r.width,y:(e.clientY-r.top)*canvas.height/r.height};};
    canvas.onpointerdown=e=>{canvas.setPointerCapture(e.pointerId);activeStroke={color:'#273029',width:5,points:[point(e)]};ink.strokes.push(activeStroke);repaint();};
    canvas.onpointermove=e=>{if(!activeStroke)return;activeStroke.points.push(point(e));repaint();};canvas.onpointerup=canvas.onpointercancel=()=>activeStroke=null;
    repaint();
    dialog('写下自己的笔迹',[h('p',{class:'hint',text:'用触控笔、手指或鼠标书写。保存后仍可继续编辑笔迹。'}),canvas,actions([button('撤销一笔',()=>{ink.strokes.pop();activeStroke=null;repaint();}),button('清空',()=>{ink.strokes=[];activeStroke=null;repaint();}),button(target?'保存笔迹':'加入海报',()=>{
      if(!ink.strokes.some(stroke=>stroke.points.length))return;
      let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
      for(const stroke of ink.strokes)for(const p of stroke.points){minX=Math.min(minX,p.x-stroke.width/2);minY=Math.min(minY,p.y-stroke.width/2);maxX=Math.max(maxX,p.x+stroke.width/2);maxY=Math.max(maxY,p.y+stroke.width/2);}
      minX-=8;minY-=8;maxX+=8;maxY+=8;const scale=Math.min(3,4096/Math.max(maxX-minX,maxY-minY));
      const output=h('canvas',{width:Math.max(1,Math.ceil((maxX-minX)*scale)),height:Math.max(1,Math.ceil((maxY-minY)*scale))}),out=output.getContext('2d');out.scale(scale,scale);out.translate(-minX,-minY);paint(out,ink.strokes);
      const data=output.toDataURL('image/png').split(',')[1],imageAspect=output.height/output.width,handwriting={format:'strokes-v1',data:JSON.stringify(ink),width:ink.width,height:ink.height};
      if(target){patch(target.id,{source:{data},imageAspect,handwriting,fit:'contain'});closeDialog();}else add(LM.makeImageNode({data},{imageAspect,handwriting,fit:'contain',frame:{x:30,y:80,width:300,height:300*imageAspect}}));
    },{class:'primary'})])]);
  }
  function pointerPoint(event){const rect=$('overlay').getBoundingClientRect();return{x:(event.clientX-rect.left)/state.zoom,y:(event.clientY-rect.top)/state.zoom};}
  function pointInRect(frame,rotation,point){const rad=-rotation*Math.PI/180,dx=point.x-frame.x-frame.width/2,dy=point.y-frame.y-frame.height/2;return{x:dx*Math.cos(rad)-dy*Math.sin(rad)+frame.width/2,y:dx*Math.sin(rad)+dy*Math.cos(rad)+frame.height/2};}
  function cellAt(point){return gridCells().find(cell=>{const local=pointInRect(cell.frame,cell.rotation,point);return local.x>=0&&local.x<=cell.frame.width&&local.y>=0&&local.y<=cell.frame.height;});}
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
    state.scene=LM.buildScene(state.template,context(),sceneOptions());paint();
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
  $('documentName').onchange=event=>commit({...state.template,name:event.target.value.trim()||'我的模版'});
  $('addText').onclick=()=>addText('自定义文字');$('addField').onclick=()=>fieldPicker();$('addImage').onclick=()=>dialog('添加图片',[button('记录封面',()=>add(LM.makeImageNode('cover',{frame:{x:40,y:70,width:240,height:240}}))),button('从文件选择',()=>pickImage())]);
  $('addShape').onclick=()=>dialog('形状',LM.TEMPLATE_SHAPES.map(shape=>button(shape,()=>add(LM.makeShapeNode(shape,{frame:{x:40,y:80,width:220,height:shape==='直线'?4:80}})))));
  $('addInk').onclick=()=>inkDialog();$('addRegion').onclick=()=>{state.editingLayerId=null;state.cellSelection=[];const layer=LM.createGridLayer({x:20,y:60,width:280,height:160},2,3);add(layer);enterGrid(layer);};$('finishGrid').onclick=leaveGrid;
  $('btnSave').onclick=async()=>{try{const now=LM.isoString();const builtin=LM.SHARE_STYLES.some(style=>LM.builtInTemplate(style).id===state.template.id);const template={...state.template,id:builtin?LM.randomUUID():state.template.id,createdAt:builtin?now:state.template.createdAt,updatedAt:now};
    state.library=[...state.library.filter(item=>item.id!==template.id),template];await U.storage('library',state.library);state.template=template;saveDraft();refresh();toast('模版已保存。');}catch{toast('未能保存，请导出模版文件。');}};
  $('btnExportFile').onclick=async()=>{try{await U.ensureFonts(state.template);const text=LM.encodeTemplateDocument(state.template);const blob=new Blob([text],{type:'application/json'});U.download(blob,LM.templateFileName(state.template));toast('模版已导出，可在 Livemark 中打开。');}catch(error){toast(error.message);}};
  $('btnExportPNG').onclick=async()=>{const button=$('btnExportPNG');button.disabled=true;button.textContent='正在导出…';try{
    await U.ensureFonts(state.template);const result=await global.LMOfflineExport.render(state.template,context(),LM.exportPixelWidth(state.template));
    U.download(result.blob,state.template.name+'.png');toast('图片已导出。');
    }catch(error){toast(error.message);}finally{button.disabled=false;button.textContent='导出图片';}};
  async function importFile(file){try{let bytes=new Uint8Array(await file.arrayBuffer());if(bytes[0]===31&&bytes[1]===139){bytes=new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());}
    const template=LM.decodeTemplateDocument(new TextDecoder().decode(bytes));await U.ensureFonts(template);
    const missing=new Map();LM.walkNodes(template.root,node=>{if(node.kind==='text'&&node.binding&&!state.customFields.some(field=>field.id===node.binding.definitionId))missing.set(node.binding.definitionId,node.binding.name);});
    if(!missing.size){setTemplate(template);toast('模版已导入。');return;}
    const mapping=new Map(),controls=[h('p',{class:'hint',text:'请选择这些词条对应的本地内容。名称相同也不会自动关联；保持为空的词条可在以后重新绑定。'})];
    const confirm=button('完成映射并导入',()=>{
      const remap=node=>{let next=node;if(node.kind==='text'&&node.binding){const choice=state.customFields.find(field=>field.id===mapping.get(node.binding.definitionId));if(choice)next={...node,binding:{kind:'custom',definitionId:choice.id,name:choice.name}};}return next.kind==='stack'?{...next,children:next.children.map(remap)}:next;};
      setTemplate({...template,root:remap(template.root)});closeDialog();toast('模版已导入。');
    },{class:'primary',disabled:true});
    for(const [id,name]of missing)controls.push(select(name,'',[['','请选择本地词条'],['__empty','保持为空'],...state.customFields.map(field=>[field.id,field.name+(field.isPrivate?' · 私人':'')])],value=>{mapping.set(id,value);confirm.disabled=[...missing.keys()].some(key=>!mapping.get(key));}));
    controls.push(confirm);dialog('关联模版词条',controls);
    }catch(error){toast(error.message||'文件未能导入。');}}
  $('btnImport').onclick=()=>$('fileImport').click();$('fileImport').onchange=event=>{const file=event.target.files[0];event.target.value='';if(file)void importFile(file);};
  document.addEventListener('dragover',event=>event.preventDefault());document.addEventListener('drop',event=>{event.preventDefault();if(event.dataTransfer.files[0])void importFile(event.dataTransfer.files[0]);});
  global.app={state,commit,undo,redo,selectIDs,refresh,context,importFile,enterGrid,leaveGrid,selectCell,gridCells};
  async function start(){try{state.library=await U.storage('library')||[];const draft=await U.storage('draft');if(draft?.template?.root?.layout==='canvas'){state.template=LM.sanitizeTemplate(draft.template);state.preview=draft.preview||state.preview;state.customFields=draft.customFields||[];state.sampleOverrides=draft.sampleOverrides||{};toast('已恢复上次草稿。');}}catch{toast('浏览器存储不可用，可以继续编辑并导出文件。');}refresh();}
  void start();
})(window);
