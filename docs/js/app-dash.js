
// Forms — Termo
document.getElementById('form-termo').addEventListener('submit',async e=>{
  e.preventDefault();
  const dup = await checkDuplicateTermo();
  if (dup) {
    const confirmed = await showDuplicateConfirmModal(dup);
    if (!confirmed) return;
  }
  const obsVal = document.getElementById('termo-obs').value;
  const issues=isOutOfRange();
  if(issues){const ac=document.getElementById('termo-accion').value;if(!ac){showOutOfRangePopup(issues);return}}
  setLoading('btn-termo-submit','spinner-termo','btn-termo-text',true);
  try{
    const r=await apiPost({action:'saveTermo',fecha:document.getElementById('termo-fecha').value,ampm:state.ampm,area:document.getElementById('termo-area').value,temperatura:document.getElementById('termo-temp').value,humedad:document.getElementById('termo-hum').value,responsable:document.getElementById('termo-resp').value,observaciones:obsVal,accion_correctiva:document.getElementById('termo-accion').value||''});
    if(r.success){
      addDatalistOption('list-termo-obs', obsVal);showToast('✅ '+r.message);e.target.reset();document.getElementById('termo-fecha').value=today();resetRangos();autoSetAmPm();checkUrlParams();
      clearRecordsMonthCache();
      prefetchDashboard();
      checkDuplicateTermo();
      if(typeof loadRecentTermo==='function')loadRecentTermo();
    }
    else showToast('❌ '+r.error,'error');
  }catch(err){showToast('❌ Error de conexión','error')}
  setLoading('btn-termo-submit','spinner-termo','btn-termo-text',false);
});

// Forms — Centrífugas
document.getElementById('form-centrifugas').addEventListener('submit',async e=>{
  e.preventDefault();
  const obsVal=document.getElementById('cent-obs').value;
  const sel=getSelectedChips('cent-chips');
  if(!sel.length){showToast('Seleccione al menos una centrífuga','error');return}
  const dup = await checkDuplicateCentrifugas();
  if (dup) {
    const confirmed = await showDuplicateConfirmModal(dup);
    if (!confirmed) return;
  }
  setLoading('btn-cent-submit','spinner-cent','btn-cent-text',true);
  try{
    const r=await apiPost({action:'saveCentrifuga',fecha:document.getElementById('cent-fecha').value,centrifugas:sel,responsable:document.getElementById('cent-resp').value,tipo_mantencion:document.getElementById('cent-tipo').value,observaciones:obsVal});
    if(r.success){
      addDatalistOption('list-cent-obs',obsVal);showToast('✅ '+r.message);e.target.reset();document.getElementById('cent-fecha').value=today();document.getElementById('cent-tipo').value='Diaria';updateInfoCentrifuga();document.querySelectorAll('#cent-chips .chip-item').forEach(c=>c.classList.remove('selected'));document.getElementById('btn-grupo-preanalisis').classList.remove('active');
      clearRecordsMonthCache();
      prefetchDashboard();
      checkDuplicateCentrifugas();
    }
    else showToast('❌ '+r.error,'error')
  }catch(err){showToast('❌ Error de conexión','error')}
  setLoading('btn-cent-submit','spinner-cent','btn-cent-text',false)
});

// Forms — Mesones
document.getElementById('form-mesones').addEventListener('submit',async e=>{
  e.preventDefault();
  const obsVal=document.getElementById('meson-obs').value;
  const sel=getSelectedChips('meson-chips');
  if(!sel.length){showToast('Seleccione al menos una sala','error');return}
  const dup = await checkDuplicateMesones();
  if (dup) {
    const confirmed = await showDuplicateConfirmModal(dup);
    if (!confirmed) return;
  }
  setLoading('btn-meson-submit','spinner-meson','btn-meson-text',true);
  try{
    const r=await apiPost({action:'saveMesones',fecha:document.getElementById('meson-fecha').value,salas:sel,responsable:document.getElementById('meson-resp').value,observaciones:obsVal});
    if(r.success){
      addDatalistOption('list-meson-obs',obsVal);showToast('✅ '+r.message);e.target.reset();document.getElementById('meson-fecha').value=today();document.querySelectorAll('#meson-chips .chip-item').forEach(c=>c.classList.remove('selected'));
      clearRecordsMonthCache();
      prefetchDashboard();
      checkDuplicateMesones();
    }
    else showToast('❌ '+r.error,'error')
  }catch(err){showToast('❌ Error de conexión','error')}
  setLoading('btn-meson-submit','spinner-meson','btn-meson-text',false)
});

// Forms — Temp Refrigeradores
document.getElementById('form-refri-temp').addEventListener('submit',async e=>{
  e.preventDefault();
  const obsVal = document.getElementById('refri-obs').value;
  const issues=isOutOfRangeRefri();
  if(issues){const ac=document.getElementById('refri-accion').value;if(!ac){showOutOfRangePopup(issues);return}}
  setLoading('btn-refri-submit','spinner-refri','btn-refri-text',true);
  try{
    const r=await apiPost({action:'saveRefriTemp',fecha:document.getElementById('refri-fecha').value,ampm:state.ampmRefri,equipo:document.getElementById('refri-equipo').value,temperatura:document.getElementById('refri-temp-input').value,responsable:document.getElementById('refri-resp').value,observaciones:obsVal,accion_correctiva:document.getElementById('refri-accion').value||''});
    if(r.success){addDatalistOption('list-refri-obs', obsVal);showToast('✅ '+r.message);e.target.reset();document.getElementById('refri-fecha').value=today();resetRangoRefri();autoSetAmPm();prefetchDashboard()}
    else showToast('❌ '+r.error,'error');
  }catch(err){showToast('❌ Error de conexión','error')}
  setLoading('btn-refri-submit','spinner-refri','btn-refri-text',false);
});

// Forms — Limpieza Refrigeradores
document.getElementById('form-limp-refri').addEventListener('submit',async e=>{e.preventDefault();const obsVal=document.getElementById('limp-refri-obs').value;const sel=getSelectedChips('limp-refri-chips');if(!sel.length){showToast('Seleccione al menos un equipo','error');return}setLoading('btn-limp-refri-submit','spinner-limp-refri','btn-limp-refri-text',true);try{const r=await apiPost({action:'saveLimpiezaRefri',fecha:document.getElementById('limp-refri-fecha').value,equipos:sel,responsable:document.getElementById('limp-refri-resp').value,tipo_mantencion:document.getElementById('limp-refri-tipo').value,observaciones:obsVal});if(r.success){addDatalistOption('list-limp-refri-obs',obsVal);showToast('✅ '+r.message);e.target.reset();document.getElementById('limp-refri-fecha').value=today();document.getElementById('limp-refri-tipo').value='Semanal (externa)';updateInfoLimpRefri();document.querySelectorAll('#limp-refri-chips .chip-item').forEach(c=>c.classList.remove('selected'));prefetchDashboard()}else showToast('❌ '+r.error,'error')}catch(err){showToast('❌ Error de conexión','error')}setLoading('btn-limp-refri-submit','spinner-limp-refri','btn-limp-refri-text',false)});

// Forms — Conductividad
document.getElementById('form-conductividad').addEventListener('submit',async e=>{
  e.preventDefault();
  const obsVal = document.getElementById('conduct-obs').value;
  setLoading('btn-conduct-submit','spinner-conduct','btn-conduct-text',true);
  try{
    const r=await apiPost({action:'saveConductividad',fecha:document.getElementById('conduct-fecha').value,ampm:state.ampmConduct,conductividad:document.getElementById('conduct-valor').value,responsable:document.getElementById('conduct-resp').value,observaciones:obsVal});
    if(r.success){addDatalistOption('list-conduct-obs', obsVal);showToast('✅ '+r.message);e.target.reset();document.getElementById('conduct-fecha').value=today();resetRangoConductividad();autoSetAmPm();prefetchDashboard()}
    else showToast('❌ '+r.error,'error');
  }catch(err){showToast('❌ Error de conexión','error')}
  setLoading('btn-conduct-submit','spinner-conduct','btn-conduct-text',false);
});

// ── Cobas Tasks & Setup ─────────────────────────────────────
const COBAS_TASKS = [
  { id: 'd1', name: 'Limpieza pipeta y puertos de vaciado (ISE)', freq: 'Diaria', displayFreq: 'Diaria' },
  { id: 'd2', name: 'Limpieza pipetas y agujas de lavado (c702)', freq: 'Diaria', displayFreq: 'Diaria' },
  { id: 'd3', name: 'Limpieza pipetas, agujas prelavado y sipper (e801)', freq: 'Diaria', displayFreq: 'Diaria' },
  { id: 'd4', name: 'Pipe diario y rack verde', freq: 'Diaria', displayFreq: 'Diaria' },
  
  { id: 'w1', name: 'Limpieza cubiertas de cubetas (c702)', freq: 'Semanal', displayFreq: 'Semanal' },
  { id: 'w2', name: 'Limpieza estaciones de lavado (ISE, c702)', freq: 'Semanal', displayFreq: 'Semanal' },
  { id: 'w3', name: 'Limpieza boca de descarga de tapones (c702)', freq: 'Semanal', displayFreq: 'Semanal' },
  { id: 'w4', name: 'Chequeo gripper (c702)', freq: 'Semanal', displayFreq: 'Semanal' },
  { id: 'w5', name: 'Pipe semanal', freq: 'Semanal', displayFreq: 'Semanal' },
  
  { id: 'f1', name: 'Limpieza conductos aspiración PC y CC (e801)', freq: 'Quincenal', displayFreq: 'Quincenal' },
  { id: 'f2', name: 'Limpieza agujas y sustitución copas PC y CC (e801)', freq: 'Quincenal', displayFreq: 'Quincenal' },
  { id: 'f3', name: 'Limpieza agitadores vortex y estaciones de separación (e801)', freq: 'Quincenal', displayFreq: 'Quincenal' },
  { id: 'f4', name: 'Limpieza disco incubación y agitador micropartículas (e801)', freq: 'Quincenal', displayFreq: 'Quincenal' },
  { id: 'f5', name: 'Limpieza estaciones de lavado (e801)', freq: 'Quincenal', displayFreq: 'Quincenal' },
  { id: 'f6', name: 'Pipe quincenal', freq: 'Quincenal', displayFreq: 'Quincenal' },
  
  { id: 'm1', name: 'Limpieza bidones de agua', freq: 'Mensual', displayFreq: 'Mensual' },
  { id: 'm2', name: 'Chequeo recipiente de dilución and limpieza filtros de aspiración (ISE)', freq: 'Mensual', displayFreq: 'Mensual' },
  { id: 'm3', name: 'Limpieza baño de incubación y cambio de cubetas (c702)', freq: 'Mensual', displayFreq: 'Mensual' },
  { id: 'm4', name: 'Limpieza filtros de aspiración de detergentes (c702)', freq: 'Mensual', displayFreq: 'Mensual' },
  { id: 'm5', name: 'Limpieza filtros de aire (c702/e801)', freq: 'Mensual', displayFreq: 'Mensual' },
  { id: 'm6', name: 'Limpieza pasos de flujo ECL y prelavado (e801)', freq: 'Mensual', displayFreq: 'Mensual' },
  
  { id: 'p1', name: 'Sustitución de electrodos (Na/K/Cl/Ref/ISE)', freq: 'Cada 2 meses', displayFreq: 'Periódica' },
  { id: 'p2', name: 'Lavado paso de flujo ISE', freq: 'Trimestral', displayFreq: 'Periódica' },
  { id: 'p3', name: 'Limpieza agitadores ultrasónicos y filtro de válvula solenoide', freq: 'Semestral', displayFreq: 'Periódica' },
  { id: 'p4', name: 'Sustitución de electrodo de referencia y lámpara fotométrica', freq: 'Semestral', displayFreq: 'Periódica' },
  
  { id: 'n1', name: 'Limpieza de superficies', freq: 'Según sea necesario', displayFreq: 'Según sea necesario' },
  { id: 'n2', name: 'Visita técnica', freq: 'Según sea necesario', displayFreq: 'Según sea necesario' },
  { id: 'n3', name: 'Mantención programada', freq: 'Según sea necesario', displayFreq: 'Según sea necesario' },
  { id: 'n4', name: 'Reparación', freq: 'Según sea necesario', displayFreq: 'Según sea necesario' }
];

window.toggleAccordion = function(header) {
  const item = header.parentElement;
  item.classList.toggle('expanded');
  const chevron = header.querySelector('.accordion-chevron');
  if (chevron) {
    chevron.textContent = item.classList.contains('expanded') ? '▲' : '▼';
  }
};

window.toggleSelectAllAccordion = function(btn) {
  const content = btn.closest('.accordion-content');
  const items = content.querySelectorAll('.checklist-item');
  const allSelected = Array.from(items).every(item => item.classList.contains('selected'));
  
  items.forEach(item => {
    item.classList.toggle('selected', !allSelected);
  });
  
  btn.textContent = allSelected ? '☑️ Marcar todas' : '⬜ Desmarcar todas';
};

function initCobasChecklist() {
  const grids = document.querySelectorAll('#form-cobas .checklist-grid');
  const groupedFreqs = ['Diaria', 'Semanal', 'Quincenal', 'Mensual'];
  grids.forEach(grid => {
    const freq = grid.dataset.frecuencia;
    const tasks = COBAS_TASKS.filter(t => t.displayFreq === freq);
    
    if (groupedFreqs.includes(freq)) {
      const listItemsHtml = tasks.map(t => `<li style="margin-bottom: 4px;">${t.name}</li>`).join('');
      grid.innerHTML = `
        <div class="checklist-item group-item" data-group-freq="${freq}" onclick="this.classList.toggle('selected')">
          <div class="checkbox-box"></div>
          <div class="checklist-label" style="font-weight: 600;">Realizar todas las actividades ${freq.toLowerCase()}s</div>
        </div>
        <div style="margin-top: 8px; padding-left: 12px; font-size: 13px; color: var(--text-dim);">
          <ul style="margin: 0; padding-left: 16px; list-style-type: disc;">
            ${listItemsHtml}
          </ul>
        </div>
      `;
    } else {
      grid.innerHTML = tasks.map(t => `
        <div class="checklist-item" data-id="${t.id}" onclick="this.classList.toggle('selected')">
          <div class="checkbox-box"></div>
          <div class="checklist-label">${t.name}</div>
        </div>
      `).join('');
    }
  });
}

function getSelectedCobasTasks() {
  const selected = [];
  
  // 1. Grouped frequencies
  document.querySelectorAll('#form-cobas .checklist-item.group-item.selected').forEach(el => {
    const freq = el.dataset.groupFreq;
    const tasks = COBAS_TASKS.filter(t => t.displayFreq === freq);
    const concatenatedNames = tasks.map(t => t.name).join(', ');
    selected.push({ nombre: concatenatedNames, frecuencia: freq });
  });
  
  // 2. Individual frequencies
  document.querySelectorAll('#form-cobas .checklist-item.selected:not(.group-item)').forEach(el => {
    const id = el.dataset.id;
    const task = COBAS_TASKS.find(t => t.id === id);
    if (task) {
      selected.push({ nombre: task.name, frecuencia: task.freq });
    }
  });
  
  return selected;
}

// Forms — Cobas
const formCobas = document.getElementById('form-cobas');
if (formCobas) {
  formCobas.addEventListener('submit', async e => {
    e.preventDefault();
    const obsVal = document.getElementById('cobas-obs').value;
    const respVal = document.getElementById('cobas-resp').value.trim().toUpperCase();
    
    if (respVal.length !== 3) {
      showToast('Responsable debe tener exactamente 3 letras.', 'error');
      return;
    }
    
    const sel = getSelectedCobasTasks();
    if (!sel.length) {
      showToast('Seleccione al menos una actividad', 'error');
      return;
    }
    
    setLoading('btn-cobas-submit', 'spinner-cobas', 'btn-cobas-text', true);
    try {
      const r = await apiPost({
        action: 'saveCobas',
        fecha: document.getElementById('cobas-fecha').value,
        equipo: document.getElementById('cobas-equipo').value,
        responsable: respVal,
        observaciones: obsVal,
        actividades: sel
      });
      if (r.success) {
        addDatalistOption('list-cobas-obs', obsVal);
        showToast('✅ ' + r.message);
        e.target.reset();
        document.getElementById('cobas-fecha').value = today();
        
        // Reset checklist selections
        document.querySelectorAll('#form-cobas .checklist-item.selected').forEach(c => c.classList.remove('selected'));
        
        // Reset select-all buttons text
        document.querySelectorAll('#form-cobas .btn-select-all').forEach(btn => {
          btn.textContent = '☑️ Marcar todas';
        });
        
        // Collapse all accordions except the first one
        const accordions = document.querySelectorAll('#form-cobas .accordion-item');
        accordions.forEach((item, idx) => {
          if (idx === 0) {
            item.classList.add('expanded');
            const chevron = item.querySelector('.accordion-chevron');
            if (chevron) chevron.textContent = '▲';
          } else {
            item.classList.remove('expanded');
            const chevron = item.querySelector('.accordion-chevron');
            if (chevron) chevron.textContent = '▼';
          }
        });
        
        prefetchDashboard();
      } else {
        showToast('❌ ' + r.error, 'error');
      }
    } catch (err) {
      showToast('❌ Error de conexión', 'error');
    }
    setLoading('btn-cobas-submit', 'spinner-cobas', 'btn-cobas-text', false);
  });
}

// Dashboard
function initDashSelectors(){const ms=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];const opts=ms.map((m,i)=>`<option value="${i+1}"${i+1===state.dashMes?' selected':''}>${m}</option>`).join('');document.getElementById('dash-mes').innerHTML=opts;const y=new Date().getFullYear();const yOpts=[y-1,y,y+1].map(a=>`<option value="${a}"${a===state.dashAnio?' selected':''}>${a}</option>`).join('');document.getElementById('dash-anio').innerHTML=yOpts}
function cambiarMes(d){state.dashMes+=d;if(state.dashMes>12){state.dashMes=1;state.dashAnio++}if(state.dashMes<1){state.dashMes=12;state.dashAnio--}initDashSelectors();loadDashboard(true)}
function switchDashTab(t){state.dashTab=t;document.getElementById('tab-diario').classList.toggle('active',t==='diario');document.getElementById('tab-mensual').classList.toggle('active',t==='mensual');document.getElementById('dash-daily-view').style.display=t==='diario'?'':'none';document.getElementById('dash-monthly-view').style.display=t==='mensual'?'':'none';if(state.dashData)renderDashContent(state.dashData)}
function getDiasHasta(m,a){const h=new Date();const d=new Date(a,m,0).getDate();return(a===h.getFullYear()&&m===(h.getMonth()+1))?h.getDate():d}

async function loadDashboard(forceReload){
  if(forceReload){ state.dashMaestros = null; state.maestrosPromise = null; }
  state.dashMes=parseInt(document.getElementById('dash-mes').value);
  state.dashAnio=parseInt(document.getElementById('dash-anio').value);
  const cacheKey=state.dashMes+'-'+state.dashAnio;
  // Use cache if valid (<5min) and same month, unless forced
  if(!forceReload&&state.dashCache&&state.dashCache.key===cacheKey&&getCacheAge()<5){
    const reg=state.dashCache.data;state.dashData=reg;
    if(!state.dashMaestros)state.dashMaestros={areas:state.areas,centrifugas:state.centrifugas,salas:state.salas,refrigeradores:state.refrigeradores,refriLimpieza:state.refriLimpieza};
    applyDashData(reg);updateCacheIndicator();return;
  }
  const dl=document.getElementById('dash-loading');if(dl)dl.style.display='block';
  const dt=document.getElementById('dash-tables');if(dt)dt.innerHTML='';
  const dac=document.getElementById('dash-alerts-container');if(dac)dac.innerHTML='';
  const ddv=document.getElementById('dash-daily-view');if(ddv)ddv.innerHTML='';
  const dmv=document.getElementById('dash-monthly-view');if(dmv)dmv.innerHTML='';
  try{
    const[reg,rev]=await Promise.all([apiGet({action:'getRegistros',mes:state.dashMes,anio:state.dashAnio}),apiGet({action:'getRevisiones',mes:state.dashMes,anio:state.dashAnio})]);
    if(!state.dashMaestros || !state.dashMaestros.centrifugasDetailed){
      if(state.maestrosPromise){
        await state.maestrosPromise;
      }
      if(!state.dashMaestros || !state.dashMaestros.centrifugasDetailed){
        try{state.dashMaestros=await apiGet({action:'getMaestros'})}catch(e){}
      }
    }
    state.dashData=reg;
    state.dashCache={key:cacheKey,data:reg,rev:rev,timestamp:Date.now()};
    applyDashData(reg);
  }catch(err){
    console.warn('Error cargando dashboard, cargando mock local...', err);
    const mockReg={termo:[],centrifugas:[],mesones:[],refriTemp:[],limpiezaRefri:[],conductividad:[],cobas:[]};
    state.dashData=mockReg;
    applyDashData(mockReg);
  }
  if(dl)dl.style.display='none';updateCacheIndicator();
}
function applyDashData(reg){
  if(!reg) return;
  if(document.getElementById('stat-termo')) document.getElementById('stat-termo').textContent=(reg.termo||[]).length;
  if(document.getElementById('stat-cent')) document.getElementById('stat-cent').textContent=(reg.centrifugas||[]).length;
  if(document.getElementById('stat-limp')) document.getElementById('stat-limp').textContent=(reg.mesones||[]).length;
  if(document.getElementById('stat-refri')) document.getElementById('stat-refri').textContent=(reg.refriTemp||[]).length;
  if(document.getElementById('stat-limp-refri')) document.getElementById('stat-limp-refri').textContent=(reg.limpiezaRefri||[]).length;
  if(document.getElementById('stat-conduct')) document.getElementById('stat-conduct').textContent=(reg.conductividad||[]).length;
  if(document.getElementById('stat-cobas')) document.getElementById('stat-cobas').textContent=(reg.cobas||[]).length;
  renderDashContent(reg);renderTables(reg);
}

function renderDashContent(reg){if(state.dashTab==='diario')renderDailyView(reg);else renderMonthlyView(reg)}

function renderDailyView(reg){
  if(!reg) return;
  const hoy=new Date().getDate();
  const m=state.dashMaestros||{areas:[],centrifugas:[],salas:[],refrigeradores:[],refriLimpieza:[],isTodayHabit:true};
  const isHabit = m.isTodayHabit !== false;
  let html=`<div class="card card-sm" style="margin-bottom:12px;"><strong style="font-size:14px;">📅 Estado del Día ${hoy} ${!isHabit ? '<span style="font-size:12px; font-weight:normal; color:#fbbf24; margin-left:8px;">(Día no hábil / Feriado)</span>' : ''}</strong></div>`;

  if(isModuloActivo('termo')){
    const termoHoy=(reg.termo||[]).filter(r=>parseInt(r.dia)===hoy);
    html+='<div class="card card-sm" style="margin-bottom:12px;"><div class="status-section-title">🌡️ Temp. Ambiental</div>';
    const list = m.areasDetailed || (m.areas||[]).map(a=>({nombre:a, horarioTurno:'si'}));
    ['Mañana','Tarde'].forEach(turno=>{
      html+=`<div style="font-size:11px;font-weight:600;color:var(--text-dim);margin:6px 0 4px;text-transform:uppercase;">${turno}</div><div class="status-grid">`;
      list.forEach(item=>{
        const a = item.nombre;
        const isNoHabit = !isHabit && item.horarioTurno === 'no';
        const done = termoHoy.some(r=>r.area===a&&r.turno===turno);
        if (isNoHabit && !done) {
          html+=`<div class="status-item opt" style="opacity:0.55;" title="No exigido en días no hábiles"><span class="status-dot gray" style="background:#64748b;"></span>${a} (N/A)</div>`;
        } else {
          html+=`<div class="status-item ${done?'done':'miss'}"><span class="status-dot ${done?'green':'red'}"></span>${a}</div>`;
        }
      });
      html+='</div>';
    });
    html+='</div>';
  }

  if(isModuloActivo('centrifugas')){
    const centHoy=(reg.centrifugas||[]).filter(r=>parseInt(r.dia)===hoy&&r.tipo_mantencion==='Diaria');
    html+='<div class="card card-sm" style="margin-bottom:12px;"><div class="status-section-title">⚙️ Centrífugas (Diaria)</div><div class="status-grid">';
    const list = m.centrifugasDetailed || (m.centrifugas||[]).map(c=>({nombre:c, horarioTurno:'si'}));
    list.forEach(item=>{
      const c = item.nombre;
      const isNoHabit = !isHabit && item.horarioTurno === 'no';
      const done = centHoy.some(r=>r.centrifuga===c);
      if (isNoHabit && !done) {
        html+=`<div class="status-item opt" style="opacity:0.55;" title="No exigido en días no hábiles"><span class="status-dot gray" style="background:#64748b;"></span>${c.replace('Centrífuga ','C')} (N/A)</div>`;
      } else {
        html+=`<div class="status-item ${done?'done':'miss'}"><span class="status-dot ${done?'green':'red'}"></span>${c.replace('Centrífuga ','C')}</div>`;
      }
    });
    html+='</div></div>';
  }

  if(isModuloActivo('mesones')){
    const mesoHoy=(reg.mesones||[]).filter(r=>parseInt(r.dia)===hoy);
    html+='<div class="card card-sm" style="margin-bottom:12px;"><div class="status-section-title">🧽 Mesones</div><div class="status-grid">';
    const list = m.salasDetailed || (m.salas||[]).map(s=>({nombre:s, horarioTurno:'si'}));
    list.forEach(item=>{
      const s = item.nombre;
      const isNoHabit = !isHabit && item.horarioTurno === 'no';
      const done = mesoHoy.some(r=>r.sala===s);
      if (isNoHabit && !done) {
        html+=`<div class="status-item opt" style="opacity:0.55;" title="No exigido en días no hábiles"><span class="status-dot gray" style="background:#64748b;"></span>${s} (N/A)</div>`;
      } else {
        html+=`<div class="status-item ${done?'done':'miss'}"><span class="status-dot ${done?'green':'red'}"></span>${s}</div>`;
      }
    });
    html+='</div></div>';
  }

  if(isModuloActivo('refri-temp')){
    const refriHoy=(reg.refriTemp||[]).filter(r=>parseInt(r.dia)===hoy);
    const refris=m.refrigeradores||[];
    if(refris.length){
      html+='<div class="card card-sm" style="margin-bottom:12px;"><div class="status-section-title">🧊 Temp. Refrigeradores</div>';
      ['Mañana','Tarde'].forEach(turno=>{
        html+=`<div style="font-size:11px;font-weight:600;color:var(--text-dim);margin:6px 0 4px;text-transform:uppercase;">${turno}</div><div class="status-grid">`;
        refris.forEach(r=>{const done=refriHoy.some(rt=>rt.equipo===(r.equipo||r)&&rt.turno===turno);const name=r.equipo||r;html+=`<div class="status-item ${done?'done':'miss'}"><span class="status-dot ${done?'green':'red'}"></span>${name}</div>`});
        html+='</div>';
      });
      html+='</div>';
    }
  }

  if(isModuloActivo('conductividad')){
    const condHoy=(reg.conductividad||[]).filter(r=>parseInt(r.dia)===hoy);
    html+='<div class="card card-sm" style="margin-bottom:12px;"><div class="status-section-title">💧 Conductividad</div><div class="status-grid">';
    ['Mañana','Tarde'].forEach(turno=>{const done=condHoy.some(r=>r.turno===turno);html+=`<div class="status-item ${done?'done':'miss'}"><span class="status-dot ${done?'green':'red'}"></span>${turno}</div>`});
    html+='</div></div>';
  }

  if(isModuloActivo('cobas')){
    const cobasHoy=(reg.cobas||[]).filter(r=>parseInt(r.dia)===hoy&&r.frecuencia==='Diaria');
    html+='<div class="card card-sm" style="margin-bottom:12px;"><div class="status-section-title">🔬 Mantención Cobas (Diaria)</div><div class="status-grid">';
    ['Cobas 1','Cobas 2'].forEach(eq=>{const done=cobasHoy.some(r=>r.equipo===eq);html+=`<div class="status-item ${done?'done':'miss'}"><span class="status-dot ${done?'green':'red'}"></span>${eq}</div>`});
    html+='</div></div>';
  }

  if(isModuloActivo('elim-muestras')){
    const elimHoy=(reg.elimMuestras||[]).filter(r=>parseInt(r.dia)===hoy);
    html+='<div class="card card-sm" style="margin-bottom:12px;"><div class="status-section-title">🗑️ Eliminación de Muestras</div><div class="status-grid">';
    const doneElim=elimHoy.length>0;
    html+=`<div class="status-item ${doneElim?'done':'miss'}"><span class="status-dot ${doneElim?'green':'red'}"></span>${doneElim?'Registrado ('+elimHoy[0].responsable+')':'Pendiente del día'}</div>`;
    html+='</div></div>';
  }

  document.getElementById('dash-daily-view').innerHTML=html;
}

function isNonWorkingDay(d, mes, anio, diasNoHabilesSet) {
  if (diasNoHabilesSet && diasNoHabilesSet.has(d)) return true;
  const dt = new Date(anio, mes - 1, d);
  const day = dt.getDay();
  return day === 0 || day === 6;
}

function renderMonthlyView(reg){
  if(!reg) return;
  const dh=getDiasHasta(state.dashMes,state.dashAnio);
  const m=state.dashMaestros||{areas:[],centrifugas:[],salas:[],refrigeradores:[]};
  const diasNoHabilesSet = new Set(reg.diasNoHabiles || []);
  let html='';

  if(isModuloActivo('termo')){
    html+='<div class="card card-sm" style="margin-bottom:12px;"><div class="status-section-title">🌡️ Temp. Ambiental</div>';
    const list = m.areasDetailed || (m.areas||[]).map(a=>({nombre:a, horarioTurno:'si'}));
    list.forEach(item => {
      const a = item.nombre;
      const esSoloHabil = (item.horarioTurno || '').toString().trim().toLowerCase() === 'no';
      html+=`<div style="font-size:12px;font-weight:600;margin:8px 0 4px;">${a} ${esSoloHabil ? '<span style="font-weight:normal; font-size:11px; color:var(--text-dim);">(Solo días hábiles)</span>' : ''}</div>`;
      ['Mañana','Tarde'].forEach(turno=>{
        const diasDone = new Set((reg.termo||[]).filter(r=>r.area===a&&r.turno===turno).map(r=>parseInt(r.dia)));
        let miss=0;
        let chips='';
        for(let d=1; d<=dh; d++){
          const ok = diasDone.has(d);
          const isNonWorking = esSoloHabil && isNonWorkingDay(d, state.dashMes, state.dashAnio, diasNoHabilesSet);
          if (ok) {
            chips += `<span class="day-chip chip-ok">${d}</span>`;
          } else if (isNonWorking) {
            chips += `<span class="day-chip chip-na" title="Día no hábil / No exigido">${d}</span>`;
          } else {
            miss++;
            chips += `<span class="day-chip chip-missing">${d}</span>`;
          }
        }
        html+=`<div style="font-size:11px;color:var(--text-dim);margin:4px 0 2px;">${turno} ${miss?'('+miss+' faltantes)':'✓'}</div><div class="missing-grid">${chips}</div>`;
      });
    });
    html+='</div>';
  }

  if(isModuloActivo('centrifugas')){
    html+='<div class="card card-sm" style="margin-bottom:12px;"><div class="status-section-title">⚙️ Centrífugas</div>';
    const list = m.centrifugasDetailed || (m.centrifugas||[]).map(c=>({nombre:c, horarioTurno:'si'}));
    list.forEach(item => {
      const c = item.nombre;
      const esSoloHabil = (item.horarioTurno || '').toString().trim().toLowerCase() === 'no';
      const diasDone = new Set((reg.centrifugas||[]).filter(r=>r.centrifuga===c&&r.tipo_mantencion==='Diaria').map(r=>parseInt(r.dia)));
      let miss=0;
      let chips='';
      for(let d=1; d<=dh; d++){
        const ok = diasDone.has(d);
        const isNonWorking = esSoloHabil && isNonWorkingDay(d, state.dashMes, state.dashAnio, diasNoHabilesSet);
        if (ok) {
          chips += `<span class="day-chip chip-ok">${d}</span>`;
        } else if (isNonWorking) {
          chips += `<span class="day-chip chip-na" title="Día no hábil / No exigido">${d}</span>`;
        } else {
          miss++;
          chips += `<span class="day-chip chip-missing">${d}</span>`;
        }
      }
      html+=`<div style="font-size:12px;font-weight:600;margin:8px 0 4px;">${c} ${esSoloHabil ? '<span style="font-weight:normal; font-size:11px; color:var(--text-dim);">(Solo días hábiles)</span>' : ''} ${miss?'('+miss+' faltantes)':'✓'}</div><div class="missing-grid">${chips}</div>`;
    });
    html+='</div>';
  }

  if(isModuloActivo('mesones')){
    html+='<div class="card card-sm" style="margin-bottom:12px;"><div class="status-section-title">🧽 Mesones</div>';
    const list = m.salasDetailed || (m.salas||[]).map(s=>({nombre:s, horarioTurno:'si'}));
    list.forEach(item => {
      const s = item.nombre;
      const esSoloHabil = (item.horarioTurno || '').toString().trim().toLowerCase() === 'no';
      const diasDone = new Set((reg.mesones||[]).filter(r=>r.sala===s).map(r=>parseInt(r.dia)));
      let miss=0;
      let chips='';
      for(let d=1; d<=dh; d++){
        const ok = diasDone.has(d);
        const isNonWorking = esSoloHabil && isNonWorkingDay(d, state.dashMes, state.dashAnio, diasNoHabilesSet);
        if (ok) {
          chips += `<span class="day-chip chip-ok">${d}</span>`;
        } else if (isNonWorking) {
          chips += `<span class="day-chip chip-na" title="Día no hábil / No exigido">${d}</span>`;
        } else {
          miss++;
          chips += `<span class="day-chip chip-missing">${d}</span>`;
        }
      }
      html+=`<div style="font-size:12px;font-weight:600;margin:8px 0 4px;">${s} ${esSoloHabil ? '<span style="font-weight:normal; font-size:11px; color:var(--text-dim);">(Solo días hábiles)</span>' : ''} ${miss?'('+miss+' faltantes)':'✓'}</div><div class="missing-grid">${chips}</div>`;
    });
    html+='</div>';
  }

  if(isModuloActivo('refri-temp')){
    const refris=m.refrigeradores||[];
    if(refris.length){
      html+='<div class="card card-sm" style="margin-bottom:12px;"><div class="status-section-title">🧊 Temp. Refrigeradores</div>';
      refris.forEach(r=>{const name=r.equipo||r;html+=`<div style="font-size:12px;font-weight:600;margin:8px 0 4px;">${name}</div>`;['Mañana','Tarde'].forEach(turno=>{const dias=new Set((reg.refriTemp||[]).filter(rt=>rt.equipo===name&&rt.turno===turno).map(rt=>parseInt(rt.dia)));let miss=0;let chips='';for(let d=1;d<=dh;d++){const ok=dias.has(d);if(!ok)miss++;chips+=`<span class="day-chip ${ok?'chip-ok':'chip-missing'}">${d}</span>`}html+=`<div style="font-size:11px;color:var(--text-dim);margin:4px 0 2px;">${turno} ${miss?'('+miss+' faltantes)':'✓'}</div><div class="missing-grid">${chips}</div>`})});
      html+='</div>';
    }
  }

  if(isModuloActivo('conductividad')){
    html+='<div class="card card-sm" style="margin-bottom:12px;"><div class="status-section-title">💧 Conductividad</div>';
    ['Mañana','Tarde'].forEach(turno=>{const dias=new Set((reg.conductividad||[]).filter(r=>r.turno===turno).map(r=>parseInt(r.dia)));let miss=0;let chips='';for(let d=1;d<=dh;d++){const ok=dias.has(d);if(!ok)miss++;chips+=`<span class="day-chip ${ok?'chip-ok':'chip-missing'}">${d}</span>`}html+=`<div style="font-size:11px;color:var(--text-dim);margin:4px 0 2px;">${turno} ${miss?'('+miss+' faltantes)':'✓'}</div><div class="missing-grid">${chips}</div>`});
    html+='</div>';
  }

  if(isModuloActivo('cobas')){
    html+='<div class="card card-sm" style="margin-bottom:12px;"><div class="status-section-title">🔬 Cobas (Días Completos)</div>';
    ['Cobas 1','Cobas 2'].forEach(eq=>{let miss=0;let chips='';for(let d=1;d<=dh;d++){const completedToday=(reg.cobas||[]).filter(r=>r.equipo===eq&&parseInt(r.dia)===d&&r.frecuencia==='Diaria');const ok=completedToday.length>=1;if(!ok)miss++;chips+=`<span class="day-chip ${ok?'chip-ok':'chip-missing'}">${d}</span>`}html+=`<div style="font-size:12px;font-weight:600;margin:8px 0 4px;">${eq} ${miss?'('+miss+' días con faltantes)':'✓'}</div><div class="missing-grid">${chips}</div>`});
    html+='</div>';
  }

  document.getElementById('dash-monthly-view').innerHTML=html;
}

function renderTables(reg){
  if(!reg) return;
  const c=document.getElementById('dash-tables');let html='';
  if(isModuloActivo('termo'))html+=renderTableCard('🌡️ Temp. Ambiental',reg.termo||[],['Día','Turno','Área','Temp°','Hum%','Resp','Acción','Obs'],r=>[r.dia,r.turno,r.area,r.temperatura,r.humedad,r.responsable,r.accion_correctiva||'',r.observaciones]);
  if(isModuloActivo('centrifugas'))html+=renderTableCard('⚙️ Centrífugas',reg.centrifugas||[],['Día','Centrífuga','Resp','Tipo','Obs'],r=>[r.dia,r.centrifuga,r.responsable,r.tipo_mantencion,r.observaciones]);
  if(isModuloActivo('mesones'))html+=renderTableCard('🧽 Mesones',reg.mesones||[],['Día','Sala','Resp','Obs'],r=>[r.dia,r.sala,r.responsable,r.observaciones]);
  if(isModuloActivo('refri-temp'))html+=renderTableCard('🧊 Temp. Refrigeradores',reg.refriTemp||[],['Día','Turno','Equipo','Temp°','Resp','Obs'],r=>[r.dia,r.turno,r.equipo,r.temperatura,r.responsable,r.observaciones]);
  if(isModuloActivo('limp-refri'))html+=renderTableCard('🧹 Limpieza Refrigeradores',reg.limpiezaRefri||[],['Día','Tipo','Equipo','Resp','Obs'],r=>[r.dia,r.tipo_mantencion,r.equipo,r.responsable,r.observaciones]);
  if(isModuloActivo('conductividad'))html+=renderTableCard('💧 Conductividad',reg.conductividad||[],['Día','Turno','µS/cm','Resp','Obs'],r=>[r.dia,r.turno,r.conductividad,r.responsable,r.observaciones]);
  if(isModuloActivo('cobas'))html+=renderTableCard('🔬 Mantención Cobas',reg.cobas||[],['Día','Equipo','Resp','Frecuencia','Actividad','Obs'],r=>[r.dia,r.equipo,r.responsable,r.frecuencia,r.actividad,r.observaciones||'']);
  c.innerHTML=html;
}
function renderTableCard(title,rows,headers,mapper){if(!rows.length)return`<div class="card card-sm" style="margin-bottom:16px;"><strong>${title}</strong><div style="color:var(--text-dim);font-size:13px;margin-top:8px;">Sin registros en este período.</div></div>`;const thead=`<tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr>`;const tbody=rows.map(r=>`<tr>${mapper(r).map(v=>`<td>${v??''}</td>`).join('')}</tr>`).join('');return`<div class="card" style="margin-bottom:16px;padding:16px 12px;"><strong style="font-family:'Outfit';font-size:15px;">${title}</strong><span style="color:var(--text-dim);font-size:12px;margin-left:8px;">${rows.length} registros</span><div class="records-table-wrap" style="margin-top:12px;"><table class="records-table"><thead>${thead}</thead><tbody>${tbody}</tbody></table></div></div>`}

// Modals
function closeModal(e){if(e&&e.target!==document.getElementById('modal-overlay'))return;document.getElementById('modal-overlay').classList.remove('active')}

// Admin — Revisión granular
function initRevAdminSelectors(){
  const ms=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const mesEl=document.getElementById('rev-admin-mes');
  const anioEl=document.getElementById('rev-admin-anio');
  if(!mesEl||!anioEl)return;
  mesEl.innerHTML=ms.map((m,i)=>`<option value="${i+1}"${i+1===state.dashMes?' selected':''}>${m}</option>`).join('');
  const y=new Date().getFullYear();
  anioEl.innerHTML=[y-1,y,y+1].map(a=>`<option value="${a}"${a===state.dashAnio?' selected':''}>${a}</option>`).join('');
  loadRevStatus();
}
function toggleAllRevChips(){
  const chips=document.querySelectorAll('#rev-chips .chip-item');
  const allSelected=Array.from(chips).every(c=>c.classList.contains('selected'));
  chips.forEach(c=>{if(allSelected)c.classList.remove('selected');else c.classList.add('selected')});
  const btn=document.getElementById('btn-rev-select-all');
  btn.classList.toggle('active',!allSelected);
}
async function loadRevStatus(){
  const mes=document.getElementById('rev-admin-mes').value;
  const anio=document.getElementById('rev-admin-anio').value;
  const panel=document.getElementById('rev-status-panel');
  try{
    const rev=await apiGet({action:'getRevisiones',mes:mes,anio:anio});
    const revisados=rev.revisados||[];
    const ALL_TYPES=[{key:'termo',name:'🌡️ Temp. Ambiental'},{key:'centrifugas',name:'⚙️ Centrífugas'},{key:'mesones',name:'🧽 Mesones'},{key:'refriTemp',name:'🧊 Temp. Refri.'},{key:'limpRefri',name:'🧹 Limp. Refri.'},{key:'conductividad',name:'💧 Conductividad'},{key:'cobas',name:'🔬 Mantención Cobas'}];
    let html='<div class="rev-status-title">Estado de revisión del mes</div><div class="status-grid">';
    ALL_TYPES.forEach(t=>{
      const done=revisados.indexOf(t.key)!==-1;
      html+=`<div class="status-item ${done?'done':'miss'}"><span class="status-dot ${done?'green':'red'}"></span>${t.name}</div>`;
    });
    html+='</div>';panel.innerHTML=html;panel.style.display='block';
  }catch(e){panel.style.display='none';}
}
async function submitRevisadoAdmin(){
  const registros=getSelectedChips('rev-chips');
  const revisor=document.getElementById('rev-admin-revisor').value;
  const pwd=document.getElementById('rev-admin-pwd').value;
  const mes=document.getElementById('rev-admin-mes').value;
  const anio=document.getElementById('rev-admin-anio').value;
  const err=document.getElementById('rev-admin-error');
  err.classList.remove('visible');
  if(!registros.length){err.textContent='Seleccione al menos un registro.';err.classList.add('visible');return;}
  if(!revisor||revisor.length<2){err.textContent='Ingrese las iniciales del revisor (mín. 2 caracteres).';err.classList.add('visible');return;}
  if(!pwd){err.textContent='Ingrese la contraseña.';err.classList.add('visible');return;}
  document.getElementById('spinner-rev-admin').classList.add('visible');
  document.getElementById('btn-rev-admin-text').style.display='none';
  try{
    const r=await apiPost({action:'marcarRevisado',password:pwd,mes:mes,anio:anio,registros:registros,revisor:revisor});
    if(r.success){
      showToast('✅ '+r.message);
      document.getElementById('rev-admin-pwd').value='';
      document.querySelectorAll('#rev-chips .chip-item').forEach(c=>c.classList.remove('selected'));
      document.getElementById('btn-rev-select-all').classList.remove('active');
      state.dashCache=null; // invalidate cache
      loadRevStatus();
    } else{err.textContent=r.error;err.classList.add('visible');}
  }catch(e){err.textContent='Error de conexión.';err.classList.add('visible');}
  document.getElementById('spinner-rev-admin').classList.remove('visible');
  document.getElementById('btn-rev-admin-text').style.display='';
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderEmailChips(clave) {
  const input = document.getElementById(`notif-recipients-${clave}`);
  const container = document.getElementById(`notif-chips-${clave}`);
  if (!input || !container) return;
  
  const val = input.value || '';
  const rawList = val.split(/[,;\n]/).map(s => s.trim()).filter(s => s.length > 0);
  
  if (rawList.length === 0) {
    container.innerHTML = '';
    return;
  }
  
  container.innerHTML = rawList.map(email => `
    <span class="notif-email-chip">
      <span>✉️</span>
      <span>${escapeHtml(email)}</span>
    </span>
  `).join('');
}

function updatePauseText(clave) {
  const cb = document.getElementById(`notif-paused-${clave}`);
  const txt = document.getElementById(`notif-pause-txt-${clave}`);
  if (cb && txt) {
    txt.textContent = cb.checked ? '⏸️ Pausado' : '▶️ Activo';
  }
}

async function loadNotificacionesAdmin(){
  const container = document.getElementById('notif-config-container');
  if(!container) return;
  
  // Show spinner
  container.innerHTML = `
    <div style="text-align: center; padding: 20px; color: var(--text-dim);">
      <div class="spinner visible" style="display:inline-block; margin-bottom: 8px;"></div>
      <div>Cargando configuración de notificaciones...</div>
    </div>
  `;
  
  try {
    const list = await apiGet({ action: 'getNotificaciones' });
    if (!list || !list.length) {
      container.innerHTML = `<div class="alert-banner alert-danger visible">No se pudo cargar la configuración de notificaciones o la lista está vacía.</div>`;
      return;
    }
    
    let html = `<div class="notif-cards-wrapper">`;
    
    list.forEach((n) => {
      const isPaused = !!n.pausado;
      html += `
        <div class="notif-card-item" data-clave="${n.clave}" data-registro="${escapeHtml(n.registro)}">
          <div class="notif-card-header">
            <div class="notif-card-title">
              <span>🔔</span>
              <span>${escapeHtml(n.registro)}</span>
            </div>
            <label class="notif-pause-label" title="Pausar o activar el envío de alertas automáticamente">
              <input type="checkbox" 
                     id="notif-paused-${n.clave}" 
                     class="notif-pause-checkbox" 
                     ${isPaused ? 'checked' : ''} 
                     onchange="updatePauseText('${n.clave}')" />
              <span id="notif-pause-txt-${n.clave}">${isPaused ? '⏸️ Pausado' : '▶️ Activo'}</span>
            </label>
          </div>
          
          <div class="notif-card-body">
            <label class="notif-field-label" for="notif-recipients-${n.clave}">
              <span>✉️ Destinatarios</span>
              <span class="notif-field-hint">(correos separados por coma o salto de línea)</span>
            </label>
            <textarea id="notif-recipients-${n.clave}" 
                      class="notif-email-textarea" 
                      rows="2" 
                      placeholder="ej: grivera@hospitaldetalca.cl, laboratorio@hospitaldetalca.cl"
                      oninput="renderEmailChips('${n.clave}')">${escapeHtml(n.destinatarios || '')}</textarea>
            <div id="notif-chips-${n.clave}" class="notif-chips-container"></div>
          </div>
          
          <div class="notif-card-footer">
            <div class="notif-time-group">
              <label class="notif-time-label" for="notif-hour-${n.clave}">⏰ Hora de Envío:</label>
              <input type="time" 
                     id="notif-hour-${n.clave}" 
                     class="notif-time-input" 
                     value="${n.hora || '08:00'}" />
            </div>
            <button class="btn btn-outline notif-test-btn" 
                    id="btn-test-notif-${n.clave}" 
                    onclick="sendTestNotificacionAdmin('${n.clave}', '${escapeHtml(n.registro)}')">
              🧪 Enviar Correo de Prueba
            </button>
          </div>
        </div>
      `;
    });
    
    html += `</div>`;
    
    container.innerHTML = html;
    
    // Render chips for initial load
    list.forEach(n => renderEmailChips(n.clave));
  } catch (e) {
    console.error(e);
    container.innerHTML = `<div class="alert-banner alert-danger visible">Error de conexión al cargar las notificaciones.</div>`;
  }
}

async function sendTestNotificacionAdmin(clave, registro) {
  const pwd = document.getElementById('notif-admin-pwd').value;
  const err = document.getElementById('notif-admin-error');
  const succ = document.getElementById('notif-admin-success');
  
  if (err) err.style.display = 'none';
  if (succ) succ.style.display = 'none';
  
  if (!pwd) {
    if (err) {
      err.textContent = 'Ingrese la contraseña de administrador para enviar prueba.';
      err.style.display = 'block';
    }
    return;
  }
  
  const recipientsInput = document.getElementById(`notif-recipients-${clave}`);
  const destinatarios = recipientsInput ? recipientsInput.value.trim() : '';
  
  if (!destinatarios) {
    if (err) {
      err.textContent = 'Ingrese al menos un correo destinatario para enviar la prueba.';
      err.style.display = 'block';
    }
    return;
  }
  
  const btn = document.getElementById(`btn-test-notif-${clave}`);
  const origText = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner visible" style="display:inline-block; width:12px; height:12px;"></div> Enviando...';
  }
  
  try {
    const response = await apiPost({
      action: 'sendTestNotificacion',
      password: pwd,
      clave: clave,
      registro: registro,
      destinatarios: destinatarios
    });
    
    if (response.success) {
      if (succ) {
        succ.textContent = response.message;
        succ.style.display = 'block';
      }
    } else {
      if (err) {
        err.textContent = response.error;
        err.style.display = 'block';
      }
    }
  } catch (e) {
    if (err) {
      err.textContent = 'Error de conexión al enviar el correo de prueba.';
      err.style.display = 'block';
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = origText;
    }
  }
}

async function submitNotificacionesAdmin() {
  const pwd = document.getElementById('notif-admin-pwd').value;
  const err = document.getElementById('notif-admin-error');
  const succ = document.getElementById('notif-admin-success');
  
  if (err) err.style.display = 'none';
  if (succ) succ.style.display = 'none';
  
  if (!pwd) {
    if (err) {
      err.textContent = 'Ingrese la contraseña de administrador.';
      err.style.display = 'block';
    }
    return;
  }
  
  const container = document.getElementById('notif-config-container');
  if (!container) return;
  
  const rows = container.querySelectorAll('.notif-card-item');
  const notificaciones = [];
  
  rows.forEach(row => {
    const clave = row.dataset.clave;
    const registro = row.dataset.registro;
    const recipientsInput = document.getElementById(`notif-recipients-${clave}`);
    const hourInput = document.getElementById(`notif-hour-${clave}`);
    const pausedCheckbox = document.getElementById(`notif-paused-${clave}`);
    
    if (recipientsInput && pausedCheckbox) {
      notificaciones.push({
        registro: registro,
        clave: clave,
        destinatarios: recipientsInput.value.trim(),
        pausado: pausedCheckbox.checked,
        hora: hourInput ? hourInput.value : '08:00'
      });
    }
  });
  
  setLoading('btn-save-notif', 'spinner-notif-admin', 'btn-notif-admin-text', true);
  
  try {
    const response = await apiPost({
      action: 'saveNotificaciones',
      password: pwd,
      notificaciones: notificaciones
    });
    
    if (response.success) {
      if (succ) {
        succ.textContent = response.message;
        succ.style.display = 'block';
      }
      document.getElementById('notif-admin-pwd').value = '';
      loadNotificacionesAdmin();
    } else {
      if (err) {
        err.textContent = response.error;
        err.style.display = 'block';
      }
    }
  } catch (e) {
    if (err) {
      err.textContent = 'Error de conexión al guardar.';
      err.style.display = 'block';
    }
  } finally {
    setLoading('btn-save-notif', 'spinner-notif-admin', 'btn-notif-admin-text', false);
  }
}

// Admin — Configuración de Módulos Activos
const MODULOS_LIST = [
  { key: 'termo', label: 'Ambiental (Temperatura / Humedad)', icon: '🌡️' },
  { key: 'centrifugas', label: 'Centrífugas', icon: '⚙️' },
  { key: 'mesones', label: 'Limpieza de Mesones', icon: '🧽' },
  { key: 'refri-temp', label: 'Temp. Refrigeradores', icon: '🧊' },
  { key: 'limp-refri', label: 'Limpieza Refrigeradores', icon: '🧹' },
  { key: 'conductividad', label: 'Conductividad del Agua', icon: '💧' },
  { key: 'etiquetadoras', label: 'Etiquetadoras (Bitácora)', icon: '🏷️' },
  { key: 'cobas', label: 'Mantención Cobas', icon: '🔬' },
  { key: 'dxh900', label: 'Reparaciones DxH 900', icon: '🛠️' },
  { key: 'elim-muestras', label: 'Eliminación de Muestras', icon: '🗑️' }
];

async function loadModulosAdmin() {
  const container = document.getElementById('modulos-config-container');
  if (!container) return;

  container.innerHTML = `
    <div style="text-align: center; padding: 20px; color: var(--text-dim);">
      <div class="spinner visible" style="display:inline-block; margin-bottom: 8px;"></div>
      <div>Cargando configuración de módulos...</div>
    </div>
  `;

  try {
    const modulos = await apiGet({ action: 'getModulosActivos' });
    state.modulosActivos = modulos || {};
    applyModulosVisibilidad();

    let html = '<div style="border:1px solid var(--border); border-radius:var(--radius-sm); overflow:hidden;">';
    MODULOS_LIST.forEach(m => {
      const active = isModuloActivo(m.key);
      html += `
        <div class="toggle-item">
          <div class="toggle-label-group">
            <span style="font-size:18px;">${m.icon}</span>
            <span style="color:var(--text); font-size:14px;">${m.label}</span>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="modulo-toggle-${m.key}" ${active ? 'checked' : ''} />
            <span class="toggle-slider"></span>
          </label>
        </div>
      `;
    });
    html += '</div>';
    container.innerHTML = html;
  } catch (e) {
    console.error(e);
    container.innerHTML = `<div class="alert-banner alert-danger visible">Error de conexión al cargar módulos.</div>`;
  }
}

async function submitModulosAdmin() {
  const pwd = document.getElementById('modulos-admin-pwd').value;
  const err = document.getElementById('modulos-admin-error');
  const succ = document.getElementById('modulos-admin-success');

  if (err) err.style.display = 'none';
  if (succ) succ.style.display = 'none';

  if (!pwd) {
    if (err) {
      err.textContent = 'Ingrese la contraseña de administrador.';
      err.style.display = 'block';
    }
    return;
  }

  const modulosObj = {};
  MODULOS_LIST.forEach(m => {
    const toggle = document.getElementById(`modulo-toggle-${m.key}`);
    modulosObj[m.key] = toggle ? toggle.checked : true;
  });

  setLoading('btn-save-modulos', 'spinner-modulos-admin', 'btn-modulos-admin-text', true);

  try {
    const response = await apiPost({
      action: 'saveModulosActivos',
      password: pwd,
      modulos: modulosObj
    });

    if (response.success) {
      state.modulosActivos = response.modulos || modulosObj;
      applyModulosVisibilidad();
      if (succ) {
        succ.textContent = '✅ ' + response.message;
        succ.style.display = 'block';
      }
      document.getElementById('modulos-admin-pwd').value = '';
    } else {
      if (err) {
        err.textContent = '❌ ' + (response.error || 'Error al guardar.');
        err.style.display = 'block';
      }
    }
  } catch (e) {
    if (err) {
      err.textContent = '❌ Error de conexión al guardar.';
      err.style.display = 'block';
    }
  } finally {
    setLoading('btn-save-modulos', 'spinner-modulos-admin', 'btn-modulos-admin-text', false);
  }
}

function addDatalistOption(id, val) {
  const el = document.getElementById(id);
  if (el && val && val.trim()) {
    const trimmed = val.trim();
    const options = Array.from(el.querySelectorAll('option')).map(o => o.value);
    if (!options.includes(trimmed)) {
      const newOpt = document.createElement('option');
      newOpt.value = trimmed;
      el.insertBefore(newOpt, el.firstChild);
    }
  }
}

// QR
const QR_TABS=['areas','salas','centrifugas','refrigeradores','refri-limpieza','conductividad','etiquetadoras','cobas','dxh900'];
function switchQrTab(tab){
  state.qrTab=tab;
  const qrTabsElements = document.querySelectorAll('.qr-tab');
  qrTabsElements.forEach((t,i)=>t.classList.toggle('active',QR_TABS[i]===tab));
  const lbl=document.getElementById('qr-select-label');
  const selGroup=document.getElementById('qr-select-group');
  // Reset QR display
  document.getElementById('qr-canvas-wrap').classList.remove('visible');
  document.getElementById('qr-label-text').style.display='none';
  document.getElementById('qr-url-text').style.display='none';
  document.getElementById('btn-print-qr').style.display='none';
  document.getElementById('btn-print-label').style.display='none';
  if(tab==='conductividad'){
    // Conductividad: unique QR, no selector needed
    selGroup.style.display='none';
    generateQR(); // auto-generate
  } else if(tab==='dxh900'){
    // DxH 900: unique QR, no selector needed
    selGroup.style.display='none';
    generateQR(); // auto-generate
  } else if(tab==='elim-muestras'){
    // Eliminación de muestras: unique QR, no selector needed
    selGroup.style.display='none';
    generateQR(); // auto-generate
  } else {
    selGroup.style.display='';
    if(tab==='areas'){lbl.textContent='Selecciona Área';populateSelect('admin-select',state.areas,'— Seleccionar —')}
    else if(tab==='salas'){lbl.textContent='Selecciona Sala';populateSelect('admin-select',state.salas,'— Seleccionar —')}
    else if(tab==='centrifugas'){lbl.textContent='Selecciona Centrífuga';const items=[...state.centrifugas,'🏷️ Grupo Preanálisis'];populateSelect('admin-select',items,'— Seleccionar —')}
    else if(tab==='refrigeradores'){lbl.textContent='Selecciona Refrigerador/Congelador';const items=state.refrigeradores.map(r=>r.equipo);populateSelect('admin-select',items,'— Seleccionar —')}
    else if(tab==='refri-limpieza'){lbl.textContent='Selecciona Equipo (Limpieza)';populateSelect('admin-select',state.refriLimpieza,'— Seleccionar —')}
    else if(tab==='cobas'){lbl.textContent='Selecciona Equipo';populateSelect('admin-select',['Cobas 1','Cobas 2'],'— Seleccionar —')}
    else if(tab==='etiquetadoras'){
      lbl.textContent='Selecciona Etiquetadora';
      const sel=document.getElementById('admin-select');
      sel.innerHTML='<option value="">— Seleccionar —</option>'+state.etiquetadoras.map(e=>{
        const text=`${e.nombreReal} (${e.nombrePractico || '--'} - ${e.ubicacion || '--'})`;
        return `<option value="${e.nombreReal}">${text}</option>`;
      }).join('');
    }
  }
}

function generateQR(){
  let base = API_URL;
  if (!base || base.includes('googleusercontent.com') || base.includes('userCodeAppPanel')) {
    base = 'https://script.google.com/macros/s/AKfycbxuqcui0-hjJ721uMWZk3w-4l2fVCaBWQgdMJqVMb5Pno339Jqetq4r62p3-1gGBUvFOg/exec';
  }
  let url,val;
  if(state.qrTab==='conductividad'){
    url=`${base}?modulo=conductividad`;
    val='Conductividad del Agua';
  } else if(state.qrTab==='dxh900'){
    url=`${base}?modulo=dxh900`;
    val='Registro de reparaciones DxH 900 Urgencias';
  } else if(state.qrTab==='elim-muestras'){
    url=`${base}?modulo=elim-muestras`;
    val='Registro de eliminación de muestras';
  } else {
    const rawVal=document.getElementById('admin-select').value;
    if(!rawVal)return;
    if(state.qrTab==='areas'){url=`${base}?area=${encodeURIComponent(rawVal)}`; val=`Temperatura Ambiental - ${rawVal}`;}
    else if(state.qrTab==='salas'){url=`${base}?sala=${encodeURIComponent(rawVal)}`; val=`Limpieza Mesones - ${rawVal}`;}
    else if(state.qrTab==='centrifugas'){if(rawVal.includes('Preanálisis'))url=`${base}?grupo=preanalisis`;else url=`${base}?centrifuga=${encodeURIComponent(rawVal)}`; val=`Mantención Centrífugas - ${rawVal}`;}
    else if(state.qrTab==='refrigeradores'){url=`${base}?refri=${encodeURIComponent(rawVal)}`; val=`Temperatura Refrigeradores - ${rawVal}`;}
    else if(state.qrTab==='refri-limpieza'){url=`${base}?limprefri=${encodeURIComponent(rawVal)}`; val=`Limpieza Refrigeradores - ${rawVal}`;}
    else if(state.qrTab==='cobas'){url=`${base}?cobas=${encodeURIComponent(rawVal)}`; val=`Mantenimiento Cobas - ${rawVal}`;}
    else if(state.qrTab==='etiquetadoras'){url=`${base}?etiquetadora=${encodeURIComponent(rawVal)}`; val=`Etiquetadora - ${rawVal}`;}
  }
  const wrap=document.getElementById('qr-canvas-wrap');
  const canvas=document.getElementById('qr-canvas');
  canvas.innerHTML='';
  if(state.qrInstance)try{state.qrInstance.clear()}catch(e){}
  
  try {
    state.qrInstance=new QRCode(canvas,{text:url,width:220,height:220,colorDark:'#000000',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.H});
  } catch(e) {
    console.warn('Error con la librería local QRCode, usando API qrserver.com como respaldo:', e);
    canvas.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(url)}" style="width:220px;height:220px;display:block;" />`;
  }
  
  wrap.classList.add('visible');
  document.getElementById('qr-label-text').textContent=val;
  document.getElementById('qr-label-text').style.display='block';
  document.getElementById('qr-url-text').textContent=url;
  document.getElementById('qr-url-text').style.display='block';
  document.getElementById('btn-print-qr').style.display='inline-flex';
  document.getElementById('btn-print-label').style.display='inline-flex';
}

function printQR(){
  const val=document.getElementById('qr-label-text').textContent;
  const canvas=document.getElementById('qr-canvas');
  const svg=canvas.querySelector('svg');
  const img=canvas.querySelector('img');
  
  let qrContent = '';
  if (svg) {
    qrContent = svg.outerHTML;
  } else if (img && img.src) {
    qrContent = `<img src="${img.src}" style="width:200px;height:200px;display:block;margin:0 auto;"/>`;
  } else {
    showToast('⚠️ No se ha generado la imagen del QR','error');
    return;
  }

  const w=window.open('','_blank');
  if(!w){
    showToast('⚠️ Permita ventanas emergentes para poder imprimir','error');
    return;
  }
  w.document.write(`<!DOCTYPE html><html><head><title>QR - ${val}</title><style>body{font-family:sans-serif;text-align:center;padding:40px;}h2{margin-bottom:16px;}p{color:#555;font-size:13px;margin-top:12px;}.qr-container svg{width:200px;height:200px;display:block;margin:0 auto;}</style></head><body><h2>Registros Mensuales</h2><h3>${val}</h3><div class="qr-container" style="display:flex;justify-content:center;align-items:center;margin:20px auto;width:200px;height:200px;">${qrContent}</div><p>Escanear para registrar</p><script>window.onload=()=>{window.print();}<\/script></body></html>`);
  w.document.close();
}

function printLabel50x30() {
  const val = document.getElementById('qr-label-text').textContent;
  const url = document.getElementById('qr-url-text').textContent;
  const canvas = document.getElementById('qr-canvas');
  const svg = canvas.querySelector('svg');
  const img = canvas.querySelector('img');
  
  let qrContent = '';
  if (svg) {
    qrContent = svg.outerHTML;
  } else if (img && img.src) {
    qrContent = `<img src="${img.src}" />`;
  } else {
    showToast('⚠️ No se ha generado la imagen del QR','error');
    return;
  }

  let category = '';
  let details = '';
  let details2 = '';

  if (state.qrTab === 'etiquetadoras') {
    category = 'Etiquetadora';
    const rawVal = document.getElementById('admin-select').value;
    const et = state.etiquetadoras.find(e => e.nombreReal === rawVal);
    if (et) {
      details = et.nombreReal || '';
      details2 = et.nombrePractico || '';
    } else {
      details = rawVal;
    }
  } else {
    const parts = val.split('-');
    category = parts[0] ? parts[0].trim() : '';
    details = parts[1] ? parts[1].trim() : '';
  }

  const removeAccents = (str) => {
    if (!str) return '';
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  const cleanText = (str) => {
    if (!str) return '';
    let res = str.replace(/(etiquetadora|rotuladora)/gi, '').replace(/^[\s\-_,.:#|]+|[\s\-_,.:#|]+$/g, '').trim();
    if (res) {
      res = res.charAt(0).toUpperCase() + res.slice(1);
    }
    return res;
  };

  const wrapText = (str, maxChars = 17) => {
    if (!str) return [];
    if (str.length <= maxChars) return [str];
    let splitIdx = str.lastIndexOf(' ', maxChars);
    if (splitIdx === -1 || splitIdx < 5) {
      splitIdx = maxChars;
    }
    const first = str.substring(0, splitIdx).trim();
    const second = str.substring(splitIdx).trim();
    return [first, second];
  };

  const cleanCategory = removeAccents(category);
  const cleanDetails = removeAccents(details);
  
  const slblCategory = cleanCategory;
  const slblDetails = cleanDetails;
  const slblDetails2 = cleanText(removeAccents(details2));

  const htmlCategory = category;
  const htmlDetails = details;
  const htmlDetails2 = cleanText(details2);

  const slblDetails2Lines = wrapText(slblDetails2, 18);

  // 1. Generate SLBL file content (using literal #10 and #13)
  let slbl = '#10N#10';
  slbl += `b35,30,Q,,s3,"${url}"#10#13`;
  slbl += 'A190,30,0,3,1,1,N,"Lab. Clinico HRT"#10#13';
  slbl += 'LO190,55,195,2#10#13';
  slbl += `A190,70,0,1,1,1,N,"${slblCategory.substring(0, 24)}"#10#13`;
  slbl += `A190,95,0,2,1,1,N,"${slblDetails.substring(0, 20)}"#10#13`;
  if (slblDetails2Lines[0]) {
    slbl += `A190,122,0,2,1,1,N,"${slblDetails2Lines[0]}"#10#13`;
  }
  if (slblDetails2Lines[1]) {
    slbl += `A190,148,0,2,1,1,N,"${slblDetails2Lines[1].substring(0, 20)}"#10#13`;
  }
  slbl += 'A190,195,0,1,1,1,N,"Escanear para registrar"#10#13';
  slbl += 'P1#10#13';

  // Trigger download of the SLBL file
  const blob = new Blob([slbl], { type: 'text/plain;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  const cleanName = val.replace(/[^a-zA-Z0-9]/g, '_');
  link.download = `etiqueta_${cleanName}.slbl`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // 2. Open Fallback HTML Print window
  const w = window.open('', '_blank');
  if(!w){
    showToast('⚠️ Permita ventanas emergentes para poder imprimir en papel','error');
    return;
  }
  w.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Etiqueta 50x30 - ${val}</title>
  <style>
    @page {
      size: 50mm 30mm;
      margin: 0;
    }
    * {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 1.5mm 1mm 1.5mm 4.2mm;
      width: 50mm;
      height: 30mm;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: flex-start;
      gap: 1.2mm;
      overflow: hidden;
      background: white;
      color: black;
    }
    .qr-container {
      width: 24mm;
      height: 24mm;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .qr-container img, .qr-container svg {
      width: 23mm;
      height: 23mm;
      display: block;
    }
    .text-container {
      width: 19.8mm;
      height: 26mm;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;
      padding-left: 0.5mm;
    }
    .title {
      font-size: 5pt;
      font-weight: 800;
      text-transform: uppercase;
      margin: 0 0 1mm 0;
      border-bottom: 0.5px solid #000;
      width: 100%;
      padding-bottom: 0.5mm;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .category {
      font-size: 5pt;
      font-weight: 600;
      color: #333;
      margin: 0 0 0.5mm 0;
      text-transform: uppercase;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      width: 100%;
    }
    .details {
      font-size: 7.5pt;
      font-weight: 700;
      line-height: 1.1;
      margin: 0 0 0.5mm 0;
      color: #000;
      word-break: break-word;
      display: -webkit-box;
      -webkit-line-clamp: ${details2 ? '1' : '2'};
      -webkit-box-orient: vertical;
      overflow: hidden;
      width: 100%;
    }
    .details-secondary {
      font-size: 6.5pt;
      font-weight: 600;
      line-height: 1.1;
      margin: 0 0 1mm 0;
      color: #444;
      word-break: break-word;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      width: 100%;
    }
    .footer {
      font-size: 4.5pt;
      color: #555;
      margin-top: auto;
      white-space: nowrap;
    }
  </style>
</head>
<body>
  <div class="qr-container">
    ${qrContent}
  </div>
  <div class="text-container">
    <div class="title">Lab. Clínico HRT</div>
    <div class="category">${htmlCategory}</div>
    <div class="details">${htmlDetails}</div>
    ${htmlDetails2 ? '<div class="details-secondary">' + htmlDetails2 + '</div>' : ''}
    <div class="footer">Escanear para registrar</div>
  </div>
  <script>
    window.onload = () => {
      window.print();
      setTimeout(() => { window.close(); }, 500);
    };
  <\/script>
</body>
</html>`);
  w.document.close();
}

// ── Etiquetadoras ────────────────────────────────────────────

// ── Población de Modelos de Etiquetadoras ────────────────────
function populateEtiquetadoraModelDropdown() {
  const modelSelect = document.getElementById('edit-et-modelo');
  if (modelSelect && state.etiquetadoras) {
    const modelosUnicos = [...new Set(state.etiquetadoras.map(e => e.modelo).filter(Boolean))];
    modelSelect.innerHTML = modelosUnicos.map(m => `<option value="${m}">${m}</option>`).join('');
  }
}

// ── Buscador Interactivo de Etiquetadoras ────────────────────

function renderEtiquetadoraDropdown(items) {
  const dropdown = document.getElementById('etiquetadora-search-dropdown');
  const list = items || state.etiquetadoras || [];
  
  if (list.length === 0) {
    dropdown.innerHTML = '<div style="padding:12px; color:var(--text-dim); font-size:13px; text-align:center;">No se encontraron etiquetadoras</div>';
    return;
  }
  
  dropdown.innerHTML = list.map(e => `
    <div class="custom-dropdown-item" onclick="selectEtiquetadora('${e.nombreReal.replace(/'/g, "\\'")}')">
      <span style="font-weight: 700; font-size: 13.5px; color: var(--text-color);">${e.nombreReal}</span>
      <span style="font-size: 11px; color: var(--text-dim);">📍 ${e.piso} — ${e.ubicacion}</span>
    </div>
  `).join('');
}

function showEtiquetadoraDropdown() {
  const dropdown = document.getElementById('etiquetadora-search-dropdown');
  dropdown.style.display = 'block';
  renderEtiquetadoraDropdown();
  
  // Registrar evento para cerrar al hacer click fuera
  setTimeout(() => {
    const onClickOutside = (event) => {
      const input = document.getElementById('etiquetadora-search-input');
      if (!dropdown.contains(event.target) && event.target !== input) {
        dropdown.style.display = 'none';
        document.removeEventListener('click', onClickOutside);
      }
    };
    document.addEventListener('click', onClickOutside);
  }, 10);
}

function filterEtiquetadoras() {
  const input = document.getElementById('etiquetadora-search-input');
  const clearBtn = document.getElementById('btn-clear-et-search');
  const query = input.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  
  if (query) {
    clearBtn.style.display = 'block';
  } else {
    clearBtn.style.display = 'none';
  }
  
  const filtered = state.etiquetadoras.filter(e => {
    const name = (e.nombreReal || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const practico = (e.nombrePractico || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const piso = (e.piso || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const ubi = (e.ubicacion || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    return name.includes(query) || practico.includes(query) || piso.includes(query) || ubi.includes(query);
  });
  
  renderEtiquetadoraDropdown(filtered);
}

function selectEtiquetadora(nombreReal) {
  const et = state.etiquetadoras.find(e => e.nombreReal === nombreReal);
  if (!et) return;
  
  const displayText = `${et.nombreReal} - ${et.piso} - ${et.ubicacion}`;
  document.getElementById('etiquetadora-search-input').value = displayText;
  document.getElementById('btn-clear-et-search').style.display = 'block';
  
  const selectHidden = document.getElementById('etiquetadora-select');
  selectHidden.value = nombreReal;
  
  // Ocultar dropdown
  document.getElementById('etiquetadora-search-dropdown').style.display = 'none';
  
  // Disparar evento onchange
  onEtiquetadoraChange();
}

function clearEtiquetadoraSearch() {
  document.getElementById('etiquetadora-search-input').value = '';
  document.getElementById('btn-clear-et-search').style.display = 'none';
  
  const selectHidden = document.getElementById('etiquetadora-select');
  selectHidden.value = '';
  
  // Ocultar dropdown
  document.getElementById('etiquetadora-search-dropdown').style.display = 'none';
  
  // Disparar evento onchange (ocultará detalles)
  onEtiquetadoraChange();
}

function onEtiquetadoraChange() {
  const name = document.getElementById('etiquetadora-select').value;
  const container = document.getElementById('etiquetadora-details-container');
  if (!name) {
    container.style.display = 'none';
    return;
  }
  
  const et = state.etiquetadoras.find(e => e.nombreReal === name);
  if (!et) return;
  
  // Actualizar campo de búsqueda y botón de borrar
  document.getElementById('etiquetadora-search-input').value = `${et.nombreReal} - ${et.piso} - ${et.ubicacion}`;
  document.getElementById('btn-clear-et-search').style.display = 'block';
  
  // Rellenar Ficha Lectura
  document.getElementById('lbl-et-id').textContent = et.id || '--';
  document.getElementById('lbl-et-practico').textContent = et.nombrePractico || '--';
  document.getElementById('lbl-et-modelo').textContent = et.modelo || '--';
  document.getElementById('lbl-et-conexion').textContent = et.tipoConexion || '--';
  document.getElementById('lbl-et-ip').textContent = et.direccionIp || '--';
  document.getElementById('lbl-et-piso').textContent = et.piso || '--';
  document.getElementById('lbl-et-ubicacion').textContent = et.ubicacion || '--';
  document.getElementById('lbl-et-comentario').textContent = et.comentario || '--';
  
  // Rellenar Formulario Edición
  document.getElementById('edit-et-id').value = et.id || '';
  document.getElementById('edit-et-practico').value = et.nombrePractico || '';
  document.getElementById('edit-et-modelo').value = et.modelo || '';
  document.getElementById('edit-et-conexion').value = et.tipoConexion || 'USB';
  document.getElementById('edit-et-ip').value = et.direccionIp || 'No aplica';
  document.getElementById('edit-et-piso').value = et.piso || '';
  document.getElementById('edit-et-ubicacion').value = et.ubicacion || '';
  document.getElementById('edit-et-comentario').value = et.comentario || '';
  document.getElementById('edit-et-password').value = '';
  
  onEditConexionChange(); // Asegurar estado del input IP
  
  // Mostrar contenedor y cargar bitácora
  container.style.display = '';
  document.getElementById('et-bitacora-fecha').value = today();
  document.getElementById('et-bitacora-accion').value = '';
  onBitacoraAccionChange();
  
  loadEtiquetadoraBitacora(name);
}

async function loadEtiquetadoraBitacora(name) {
  const loading = document.getElementById('et-bitacora-loading');
  const empty = document.getElementById('et-bitacora-history-empty');
  const list = document.getElementById('et-bitacora-history-list');
  
  loading.style.display = 'block';
  empty.style.display = 'none';
  list.style.display = 'none';
  
  try {
    const data = await apiGet({ action: 'getEtiquetadoraHistorial', etiquetadora: name });
    loading.style.display = 'none';
    if (!data || data.length === 0) {
      empty.style.display = 'block';
    } else {
      list.innerHTML = data.map(r => {
        let fechaFormateada = r.fecha;
        if (fechaFormateada) {
          const strVal = String(fechaFormateada).trim();
          if (!/^\d{2}\/\d{2}\/\d{4}$/.test(strVal)) {
            const cleaned = strVal.replace(/\s*\(.*\)\s*/g, '').trim();
            const d = new Date(cleaned);
            if (!isNaN(d.getTime())) {
              const dia = String(d.getDate()).padStart(2, '0');
              const mes = String(d.getMonth() + 1).padStart(2, '0');
              const anio = d.getFullYear();
              fechaFormateada = `${dia}/${mes}/${anio}`;
            }
          }
        }
        return `
        <div style="padding:10px; border-bottom:1px solid rgba(255,255,255,0.04); font-size:13px; line-height:1.4;">
          <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-weight:700;">
            <span style="color:var(--primary-color);">${r.accion}</span>
            <span style="color:var(--text-dim); font-size:11px;">📅 ${fechaFormateada} — 👤 ${r.responsable}</span>
          </div>
          <div style="color:var(--text-color); font-weight:400; font-size:12.5px;">${r.descripcion}</div>
        </div>
      `;
      }).join('');
      list.style.display = 'block';
    }
  } catch (e) {
    loading.style.display = 'none';
    empty.textContent = 'Error cargando historial.';
    empty.style.display = 'block';
  }
}

function toggleEditEtiquetadora() {
  const view = document.getElementById('etiquetadora-view-panel');
  const form = document.getElementById('form-etiquetadora-master');
  const isEditing = form.style.display === '';
  
  if (isEditing) {
    form.style.display = 'none';
    view.style.display = '';
    document.getElementById('btn-edit-etiquetadora').textContent = '✏️ Modificar Parámetros';
  } else {
    view.style.display = 'none';
    form.style.display = '';
    document.getElementById('edit-et-password').value = '';
    document.getElementById('btn-edit-etiquetadora').textContent = '👁️ Ver Parámetros';
  }
}

function onEditConexionChange() {
  const type = document.getElementById('edit-et-conexion').value;
  const ipInput = document.getElementById('edit-et-ip');
  if (type === 'USB') {
    ipInput.value = 'No aplica';
    ipInput.disabled = true;
    ipInput.style.opacity = '0.5';
  } else {
    ipInput.disabled = false;
    ipInput.style.opacity = '1';
    if (ipInput.value === 'No aplica') {
      ipInput.value = '';
    }
  }
}

async function saveEtiquetadoraMaster(e) {
  e.preventDefault();
  const name = document.getElementById('etiquetadora-select').value;
  const password = document.getElementById('edit-et-password').value;
  
  const et = state.etiquetadoras.find(x => x.nombreReal === name);
  const oldPractico = et ? (et.nombrePractico || '') : '';
  const newPractico = document.getElementById('edit-et-practico').value.trim();
  
  let responsable = '';
  if (oldPractico !== newPractico) {
    responsable = prompt('Se detectó un cambio en el Nombre Práctico.\nPor favor, ingrese sus iniciales o usuario responsable:');
    if (!responsable) {
      showToast('Modificación cancelada. Se requiere usuario responsable.', 'error');
      return;
    }
  }
  
  const spinner = document.getElementById('spinner-save-et-master');
  const btnText = document.getElementById('btn-save-et-master-text');
  
  spinner.classList.add('visible');
  btnText.style.display = 'none';
  
  const payload = {
    action: 'updateEtiquetadoraMaestro',
    nombreReal: name,
    id: document.getElementById('edit-et-id').value,
    nombrePractico: document.getElementById('edit-et-practico').value,
    modelo: document.getElementById('edit-et-modelo').value,
    tipoConexion: document.getElementById('edit-et-conexion').value,
    direccionIp: document.getElementById('edit-et-ip').value,
    piso: document.getElementById('edit-et-piso').value,
    ubicacion: document.getElementById('edit-et-ubicacion').value,
    comentario: document.getElementById('edit-et-comentario').value,
    password: password,
    responsable: responsable
  };
  
  try {
    const res = await apiPost(payload);
    spinner.classList.remove('visible');
    btnText.style.display = '';
    
    if (res.success) {
      showToast('Ficha técnica actualizada correctamente ✓', 'success');
      addDatalistOption('list-et-comentario', payload.comentario);
      
      // Actualizar localmente el estado
      const index = state.etiquetadoras.findIndex(x => x.nombreReal === name);
      if (index !== -1) {
        state.etiquetadoras[index] = {
          nombreReal: payload.nombreReal,
          id: payload.id,
          nombrePractico: payload.nombrePractico,
          modelo: payload.modelo,
          tipoConexion: payload.tipoConexion,
          direccionIp: payload.direccionIp,
          piso: payload.piso,
          ubicacion: payload.ubicacion,
          comentario: payload.comentario
        };
      }
      
      populateEtiquetadoraModelDropdown();
      onEtiquetadoraChange();
      toggleEditEtiquetadora();
    } else {
      showToast(res.error || 'Error al actualizar ficha técnica.', 'error');
    }
  } catch (err) {
    spinner.classList.remove('visible');
    btnText.style.display = '';
    showToast('Error de conexión con el servidor.', 'error');
  }
}

function onBitacoraAccionChange() {
  const val = document.getElementById('et-bitacora-accion').value;
  const descGroup = document.getElementById('et-bitacora-desc-group');
  const descInput = document.getElementById('et-bitacora-desc');
  
  if (val === 'Cambio de papel') {
    descGroup.style.display = 'none';
    descInput.required = false;
    descInput.value = 'Recambio de papel realizado';
  } else if (val) {
    descGroup.style.display = '';
    descInput.required = true;
    if (descInput.value === 'Recambio de papel realizado') {
      descInput.value = '';
    }
  } else {
    descGroup.style.display = 'none';
    descInput.required = false;
    descInput.value = '';
  }
}

async function saveEtiquetadoraBitacora(e) {
  e.preventDefault();
  const name = document.getElementById('etiquetadora-select').value;
  const respInput = document.getElementById('et-bitacora-responsable');
  const resp = respInput.value.trim().toUpperCase();
  
  if (resp.length !== 3) {
    showToast('Responsable debe tener exactamente 3 letras.', 'error');
    return;
  }
  
  const spinner = document.getElementById('spinner-save-et-bitacora');
  const btnText = document.getElementById('btn-save-et-bitacora-text');
  
  spinner.classList.add('visible');
  btnText.style.display = 'none';
  
  const payload = {
    action: 'saveEtiquetadoraRegistro',
    etiquetadora: name,
    fecha: document.getElementById('et-bitacora-fecha').value,
    accion: document.getElementById('et-bitacora-accion').value,
    descripcion: document.getElementById('et-bitacora-desc').value,
    responsable: resp
  };
  
  try {
    const res = await apiPost(payload);
    spinner.classList.remove('visible');
    btnText.style.display = '';
    
    if (res.success) {
      showToast('Registro guardado en bitácora correctamente ✓', 'success');
      addDatalistOption('list-et-bitacora-desc', payload.descripcion);
      
      // Limpiar campos de bitacora (excepto fecha)
      document.getElementById('et-bitacora-accion').value = '';
      document.getElementById('et-bitacora-desc').value = '';
      respInput.value = '';
      onBitacoraAccionChange();
      
      // Recargar historial
      loadEtiquetadoraBitacora(name);
    } else {
      showToast(res.error || 'Error al guardar en bitácora.', 'error');
    }
  } catch (err) {
    spinner.classList.remove('visible');
    btnText.style.display = '';
    showToast('Error de conexión con el servidor.', 'error');
  }
}

// Init
async function init(){
  document.getElementById('termo-fecha').value=today();
  document.getElementById('cent-fecha').value=today();
  document.getElementById('meson-fecha').value=today();
  document.getElementById('refri-fecha').value=today();
  document.getElementById('limp-refri-fecha').value=today();
  document.getElementById('conduct-fecha').value=today();
  if(document.getElementById('et-bitacora-fecha')) {
    document.getElementById('et-bitacora-fecha').value=today();
  }
  if(document.getElementById('cobas-fecha')) {
    document.getElementById('cobas-fecha').value=today();
  }
  if(document.getElementById('dxh-fecha')) {
    document.getElementById('dxh-fecha').value=today();
  }
  autoSetAmPm();
  updateInfoCentrifuga();
  updateInfoLimpRefri();
  initCobasChecklist();
  initDashSelectors();
  // Load maestros and dashboard in parallel to improve load times
  const maestrosPromise = loadMaestros();
  const dashboardPromise = loadDashboard();
  
  await Promise.all([maestrosPromise, dashboardPromise]);
  checkUrlParams();
}
init();

// ── DxH 900 Urgencias ─────────────────────────────────────────

async function loadDxH900HistorialForm() {
  document.getElementById('dxh-fecha').value = today();
  const loading = document.getElementById('dxh-loading');
  const empty = document.getElementById('dxh-history-empty');
  const list = document.getElementById('dxh-history-list');
  
  loading.style.display = 'block';
  empty.style.display = 'none';
  list.style.display = 'none';
  
  try {
    const data = await apiGet({ action: 'getDxH900Historial' });
    loading.style.display = 'none';
    if (!data || data.length === 0) {
      empty.style.display = 'block';
    } else {
      list.innerHTML = data.map(r => {
        let fechaFormateada = r.fecha;
        if (fechaFormateada) {
          const strVal = String(fechaFormateada).trim();
          if (!/^\d{2}\/\d{2}\/\d{4}$/.test(strVal)) {
            const cleaned = strVal.replace(/\s*\(.*\)\s*/g, '').trim();
            const d = new Date(cleaned);
            if (!isNaN(d.getTime())) {
              const dia = String(d.getDate()).padStart(2, '0');
              const mes = String(d.getMonth() + 1).padStart(2, '0');
              const anio = d.getFullYear();
              fechaFormateada = `${dia}/${mes}/${anio}`;
            }
          }
        }
        return `
        <div style="padding:10px; border-bottom:1px solid rgba(255,255,255,0.04); font-size:13px; line-height:1.4;">
          <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-weight:700;">
            <span style="color:var(--primary-color);">🔧 Especialista: ${r.especialista}</span>
            <span style="color:var(--text-dim); font-size:11px;">📅 ${fechaFormateada} — 👤 ${r.usuario_responsable}</span>
          </div>
          <div style="color:var(--text-color); font-weight:400; font-size:12.5px;">${r.descripcion}</div>
        </div>
      `;
      }).join('');
      list.style.display = 'block';
    }
  } catch (e) {
    loading.style.display = 'none';
    empty.textContent = 'Error cargando historial.';
    empty.style.display = 'block';
  }
}

async function saveDxH900RegistroForm(e) {
  e.preventDefault();
  const respInput = document.getElementById('dxh-usuario');
  const espInput = document.getElementById('dxh-especialista');
  const descInput = document.getElementById('dxh-descripcion');
  
  const spinner = document.getElementById('spinner-dxh');
  const btnText = document.getElementById('btn-dxh-text');
  
  spinner.classList.add('visible');
  btnText.style.display = 'none';
  
  const payload = {
    action: 'saveDxH900Registro',
    fecha: document.getElementById('dxh-fecha').value,
    usuario_responsable: respInput.value.trim(),
    especialista: espInput.value.trim(),
    descripcion: descInput.value.trim()
  };
  
  try {
    const res = await apiPost(payload);
    spinner.classList.remove('visible');
    btnText.style.display = '';
    
    if (res.success) {
      showToast('Registro guardado y correo enviado ✓', 'success');
      
      // Limpiar campos (excepto fecha)
      respInput.value = '';
      espInput.value = '';
      descInput.value = '';
      
      // Recargar historial
      loadDxH900HistorialForm();
    } else {
      showToast(res.error || 'Error al guardar registro.', 'error');
    }
  } catch (err) {
    spinner.classList.remove('visible');
    btnText.style.display = '';
    showToast('Error de conexión con el servidor.', 'error');
  }
}

// ── Eliminación de Muestras ──────────────────────────────────

function updateMuestrasEliminadasText() {
  const cutoffInput = document.getElementById('elim-fecha-corte');
  const textInput = document.getElementById('elim-muestras-texto');
  if (!cutoffInput || !textInput) return;
  const cutoff = cutoffInput.value;
  if (!cutoff) {
    textInput.value = '';
    return;
  }
  const parts = cutoff.split('-');
  if (parts.length === 3) {
    const yearShort = parts[0].substring(2);
    const formatted = `${parts[2]}/${parts[1]}/${yearShort}`;
    textInput.value = `Se eliminan muestras anteriores al ${formatted}`;
  }
}

async function loadElimMuestrasHistorialForm() {
  if (document.getElementById('elim-fecha')) {
    document.getElementById('elim-fecha').value = today();
  }
  if (document.getElementById('elim-fecha-corte')) {
    if (!document.getElementById('elim-fecha-corte').value) {
      document.getElementById('elim-fecha-corte').value = today();
    }
    updateMuestrasEliminadasText();
  }
  
  const loading = document.getElementById('elim-loading');
  const empty = document.getElementById('elim-history-empty');
  const list = document.getElementById('elim-history-list');
  if (!loading || !empty || !list) return;
  
  loading.style.display = 'block';
  empty.style.display = 'none';
  list.style.display = 'none';
  
  try {
    const mes = state.dashMes || (new Date().getMonth() + 1);
    const anio = state.dashAnio || new Date().getFullYear();
    const regs = await apiGet({ action: 'getRegistros', mes: mes, anio: anio });
    loading.style.display = 'none';
    const data = regs.elimMuestras || [];
    if (!data || data.length === 0) {
      empty.style.display = 'block';
    } else {
      list.innerHTML = data.map(r => `
        <div style="padding:10px; border-bottom:1px solid rgba(255,255,255,0.04); font-size:13px; line-height:1.4;">
          <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-weight:700;">
            <span style="color:var(--primary-color);">🗑️ ${r.muestras_eliminadas}</span>
            <span style="color:var(--text-dim); font-size:11px;">📅 ${r.fecha} — 👤 ${r.responsable}</span>
          </div>
          ${r.revisado_por ? `<div style="font-size:11px; color:#10B981; margin-top:2px;">✓ Revisado por ${r.revisado_por} (${r.fecha_revision})</div>` : ''}
        </div>
      `).join('');
      list.style.display = 'block';
    }
  } catch (e) {
    loading.style.display = 'none';
    empty.textContent = 'Error cargando historial.';
    empty.style.display = 'block';
  }
}

async function saveElimMuestrasForm(e) {
  e.preventDefault();
  updateMuestrasEliminadasText();
  const respInput = document.getElementById('elim-responsable');
  const textInput = document.getElementById('elim-muestras-texto');
  const fechaInput = document.getElementById('elim-fecha');
  
  const respVal = respInput.value.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(respVal)) {
    showToast('El responsable debe constar de 3 siglas alfabéticas.', 'error');
    return;
  }

  if (!textInput.value.trim()) {
    showToast('Debe seleccionar una fecha corte de muestras.', 'error');
    return;
  }

  const dup = await checkDuplicateElimMuestras();
  if (dup) {
    const confirmed = await showDuplicateConfirmModal(dup);
    if (!confirmed) return;
  }

  const spinner = document.getElementById('spinner-elim');
  const btnText = document.getElementById('btn-elim-text');
  
  if (spinner) spinner.classList.add('visible');
  if (btnText) btnText.style.display = 'none';
  
  const payload = {
    action: 'saveElimMuestras',
    fecha: fechaInput.value,
    responsable: respVal,
    muestras_eliminadas: textInput.value.trim()
  };
  
  try {
    const res = await apiPost(payload);
    if (spinner) spinner.classList.remove('visible');
    if (btnText) btnText.style.display = '';
    
    if (res.success) {
      showToast('Registro de eliminación guardado con éxito ✓', 'success');
      respInput.value = '';
      if (document.getElementById('elim-fecha-corte')) {
        document.getElementById('elim-fecha-corte').value = today();
        updateMuestrasEliminadasText();
      }
      clearRecordsMonthCache();
      loadElimMuestrasHistorialForm();
      checkDuplicateElimMuestras();
    } else {
      showToast(res.error || 'Error al guardar el registro.', 'error');
    }
  } catch (err) {
    if (spinner) spinner.classList.remove('visible');
    if (btnText) btnText.style.display = '';
    showToast('Error de conexión con el servidor.', 'error');
  }
}

// ══ COMPROBACIÓN DE REGISTROS DUPLICADOS ═════════════════════════════════════

function showDuplicateConfirmModal(dupInfo) {
  return new Promise((resolve) => {
    const modal = document.getElementById('modal-duplicate-confirm');
    const overlay = document.getElementById('modal-overlay');
    const bodyEl = document.getElementById('dup-confirm-body');
    const btnConfirm = document.getElementById('btn-dup-confirm-yes');
    const btnCancel = document.getElementById('btn-dup-confirm-no');

    if (!modal || !overlay || !bodyEl) {
      resolve(confirm(dupInfo.message || '¿Está seguro que desea continuar?'));
      return;
    }

    let detailsHtml = '';
    if (dupInfo.existing) {
      detailsHtml = `
        <div class="dup-detail-card">
          <div class="dup-detail-row">
            <span class="dup-detail-label">👤 Responsable previo:</span>
            <span class="dup-detail-val">"${dupInfo.existing.responsable || 'Desconocido'}"</span>
          </div>
          ${dupInfo.existing.area ? `
          <div class="dup-detail-row">
            <span class="dup-detail-label">📍 Área:</span>
            <span class="dup-detail-val">${dupInfo.existing.area}</span>
          </div>` : ''}
          ${dupInfo.existing.turno ? `
          <div class="dup-detail-row">
            <span class="dup-detail-label">🕒 Turno:</span>
            <span class="dup-detail-val">${dupInfo.existing.turno}</span>
          </div>` : ''}
        </div>
      `;
    } else if (dupInfo.duplicates && dupInfo.duplicates.length > 0) {
      const listItems = dupInfo.duplicates.map(d => `
        <div class="dup-item-badge">
          <span class="dup-item-name">📌 ${d.name}</span>
          <span class="dup-item-resp">Ingresado por <strong>"${d.resp}"</strong></span>
        </div>
      `).join('');
      detailsHtml = `<div class="dup-items-list">${listItems}</div>`;
    }

    const mainText = dupInfo.cleanMessage || dupInfo.message || 'Ya existe un registro realizado para esta fecha.';

    bodyEl.innerHTML = `
      <div class="dup-modal-msg">
        ${mainText}
      </div>
      ${detailsHtml}
      <div style="font-size: 0.9rem; font-weight: 600; color: var(--primary-color, #00D4FF); margin-top: 10px; text-align: center;">
        ¿Desea ingresar el registro de todas formas?
      </div>
    `;

    document.querySelectorAll('.modal-card').forEach(m => m.style.display = 'none');
    modal.style.display = 'block';
    overlay.classList.add('active');

    const cleanup = () => {
      overlay.classList.remove('active');
      modal.style.display = 'none';
      btnConfirm.removeEventListener('click', onYes);
      btnCancel.removeEventListener('click', onNo);
    };

    const onYes = () => {
      cleanup();
      resolve(true);
    };

    const onNo = () => {
      cleanup();
      resolve(false);
    };

    btnConfirm.addEventListener('click', onYes);
    btnCancel.addEventListener('click', onNo);
  });
}

async function getRegistrosForMonth(mes, anio) {
  mes = parseInt(mes);
  anio = parseInt(anio);
  const cacheKey = `${mes}-${anio}`;

  if (state.dashData && state.dashMes === mes && state.dashAnio === anio) {
    return state.dashData;
  }
  if (state.dashCache && state.dashCache.key === cacheKey && state.dashCache.data) {
    return state.dashCache.data;
  }
  if (!state.recordsMonthCache) state.recordsMonthCache = {};
  if (state.recordsMonthCache[cacheKey]) {
    return state.recordsMonthCache[cacheKey];
  }

  try {
    const reg = await apiGet({ action: 'getRegistros', mes: mes, anio: anio });
    state.recordsMonthCache[cacheKey] = reg;
    if (mes === state.dashMes && anio === state.dashAnio) {
      state.dashData = reg;
    }
    return reg;
  } catch (e) {
    console.error('Error fetching registros:', e);
    return null;
  }
}

function clearRecordsMonthCache(mes, anio) {
  if (state.recordsMonthCache) {
    if (mes && anio) {
      delete state.recordsMonthCache[`${parseInt(mes)}-${parseInt(anio)}`];
    } else {
      state.recordsMonthCache = {};
    }
  }
}

// 1. Check Ambient (Termo)
async function checkDuplicateTermo() {
  const alertEl = document.getElementById('alert-duplicate-termo');
  if (!alertEl) return null;

  const fechaVal = document.getElementById('termo-fecha') ? document.getElementById('termo-fecha').value : today();
  const areaVal = document.getElementById('termo-area') ? document.getElementById('termo-area').value : '';
  const ampmVal = state.ampm || (new Date().getHours() < 12 ? 'AM' : 'PM');

  if (!areaVal || !fechaVal) {
    alertEl.classList.remove('visible');
    alertEl.style.display = 'none';
    alertEl.innerHTML = '';
    return null;
  }

  const parts = fechaVal.split('-');
  const dia = parseInt(parts[2]);
  const mes = parseInt(parts[1]);
  const anio = parseInt(parts[0]);

  const regs = await getRegistrosForMonth(mes, anio);
  if (!regs || !regs.termo) {
    alertEl.classList.remove('visible');
    alertEl.style.display = 'none';
    return null;
  }

  const targetTurnos = ampmVal === 'AM' ? ['AM', 'Mañana'] : ['PM', 'Tarde'];

  const existing = regs.termo.find(r => 
    parseInt(r.dia) === dia &&
    parseInt(r.mes) === mes &&
    parseInt(r.anio) === anio &&
    String(r.area || '').trim().toLowerCase() === String(areaVal || '').trim().toLowerCase() &&
    targetTurnos.some(t => String(r.turno || '').trim().toUpperCase() === t.toUpperCase())
  );

  if (existing) {
    const respUser = existing.responsable || 'Desconocido';
    const fechaFmt = `${String(dia).padStart(2,'0')}/${String(mes).padStart(2,'0')}/${anio}`;
    const htmlMsg = `⚠️ <strong>Aviso de Duplicidad:</strong> Este registro para el área <strong>${areaVal}</strong> en el turno <strong>${ampmVal}</strong> del día <strong>${fechaFmt}</strong> ya fue realizado por el usuario <strong>"${respUser}"</strong>.<br>¿Está seguro que desea continuar?`;
    alertEl.innerHTML = htmlMsg;
    alertEl.classList.add('visible');
    alertEl.style.display = 'block';
    return {
      existing,
      message: `El registro de Temperatura Ambiental para el área "${areaVal}" en el turno ${ampmVal} del día ${fechaFmt} ya fue ingresado por el usuario "${respUser}".\n\n¿Está seguro que desea continuar?`
    };
  } else {
    alertEl.classList.remove('visible');
    alertEl.style.display = 'none';
    alertEl.innerHTML = '';
    return null;
  }
}

// 2. Check Centrífugas
async function checkDuplicateCentrifugas() {
  const alertEl = document.getElementById('alert-duplicate-cent');
  if (!alertEl) return null;

  const fechaVal = document.getElementById('cent-fecha') ? document.getElementById('cent-fecha').value : today();
  const tipoVal = document.getElementById('cent-tipo') ? document.getElementById('cent-tipo').value : 'Diaria';
  const selChips = getSelectedChips('cent-chips');

  if (tipoVal !== 'Diaria' || !selChips.length || !fechaVal) {
    alertEl.classList.remove('visible');
    alertEl.style.display = 'none';
    alertEl.innerHTML = '';
    return null;
  }

  const parts = fechaVal.split('-');
  const dia = parseInt(parts[2]);
  const mes = parseInt(parts[1]);
  const anio = parseInt(parts[0]);

  const regs = await getRegistrosForMonth(mes, anio);
  if (!regs || !regs.centrifugas) {
    alertEl.classList.remove('visible');
    alertEl.style.display = 'none';
    return null;
  }

  const duplicates = [];
  selChips.forEach(chipName => {
    const found = regs.centrifugas.find(r => 
      parseInt(r.dia) === dia &&
      parseInt(r.mes) === mes &&
      parseInt(r.anio) === anio &&
      String(r.tipo_mantencion || '').trim().toLowerCase() === 'diaria' &&
      String(r.centrifuga || '').trim().toLowerCase() === String(chipName || '').trim().toLowerCase()
    );
    if (found) {
      duplicates.push({ name: chipName, resp: found.responsable || 'Desconocido' });
    }
  });

  if (duplicates.length > 0) {
    const fechaFmt = `${String(dia).padStart(2,'0')}/${String(mes).padStart(2,'0')}/${anio}`;
    const dupListStr = duplicates.map(d => `<strong>${d.name}</strong> (por <strong>"${d.resp}"</strong>)`).join(', ');
    const dupListPlain = duplicates.map(d => `"${d.name}" (por "${d.resp}")`).join(', ');

    const htmlMsg = `⚠️ <strong>Aviso de Duplicidad:</strong> Registro(s) de mantención diaria para el día <strong>${fechaFmt}</strong> ya realizado(s): ${dupListStr}.<br>¿Está seguro que desea continuar?`;
    alertEl.innerHTML = htmlMsg;
    alertEl.classList.add('visible');
    alertEl.style.display = 'block';

    return {
      duplicates,
      message: `El/los registro(s) de mantención diaria de centrífuga para el día ${fechaFmt} ya fue(ron) ingresado(s):\n${dupListPlain}\n\n¿Está seguro que desea continuar?`
    };
  } else {
    alertEl.classList.remove('visible');
    alertEl.style.display = 'none';
    alertEl.innerHTML = '';
    return null;
  }
}

// 3. Check Mesones
async function checkDuplicateMesones() {
  const alertEl = document.getElementById('alert-duplicate-meson');
  if (!alertEl) return null;

  const fechaVal = document.getElementById('meson-fecha') ? document.getElementById('meson-fecha').value : today();
  const selChips = getSelectedChips('meson-chips');

  if (!selChips.length || !fechaVal) {
    alertEl.classList.remove('visible');
    alertEl.style.display = 'none';
    alertEl.innerHTML = '';
    return null;
  }

  const parts = fechaVal.split('-');
  const dia = parseInt(parts[2]);
  const mes = parseInt(parts[1]);
  const anio = parseInt(parts[0]);

  const regs = await getRegistrosForMonth(mes, anio);
  if (!regs || !regs.mesones) {
    alertEl.classList.remove('visible');
    alertEl.style.display = 'none';
    return null;
  }

  const duplicates = [];
  selChips.forEach(chipName => {
    const found = regs.mesones.find(r => 
      parseInt(r.dia) === dia &&
      parseInt(r.mes) === mes &&
      parseInt(r.anio) === anio &&
      String(r.sala || '').trim().toLowerCase() === String(chipName || '').trim().toLowerCase()
    );
    if (found) {
      duplicates.push({ name: chipName, resp: found.responsable || 'Desconocido' });
    }
  });

  if (duplicates.length > 0) {
    const fechaFmt = `${String(dia).padStart(2,'0')}/${String(mes).padStart(2,'0')}/${anio}`;
    const dupListStr = duplicates.map(d => `<strong>${d.name}</strong> (por <strong>"${d.resp}"</strong>)`).join(', ');
    const dupListPlain = duplicates.map(d => `"${d.name}" (por "${d.resp}")`).join(', ');

    const htmlMsg = `⚠️ <strong>Aviso de Duplicidad:</strong> Registro(s) de limpieza de mesones para el día <strong>${fechaFmt}</strong> ya realizado(s): ${dupListStr}.<br>¿Está seguro que desea continuar?`;
    alertEl.innerHTML = htmlMsg;
    alertEl.classList.add('visible');
    alertEl.style.display = 'block';

    return {
      duplicates,
      message: `El/los registro(s) de limpieza de mesones para el día ${fechaFmt} ya fue(ron) ingresado(s):\n${dupListPlain}\n\n¿Está seguro que desea continuar?`
    };
  } else {
    alertEl.classList.remove('visible');
    alertEl.style.display = 'none';
    alertEl.innerHTML = '';
    return null;
  }
}

// 4. Check Eliminación de Muestras
async function checkDuplicateElimMuestras() {
  const alertEl = document.getElementById('alert-duplicate-elim');
  if (!alertEl) return null;

  const fechaVal = document.getElementById('elim-fecha') ? document.getElementById('elim-fecha').value : today();
  if (!fechaVal) {
    alertEl.classList.remove('visible');
    alertEl.style.display = 'none';
    alertEl.innerHTML = '';
    return null;
  }

  const parts = fechaVal.split('-');
  const dia = parseInt(parts[2]);
  const mes = parseInt(parts[1]);
  const anio = parseInt(parts[0]);

  const regs = await getRegistrosForMonth(mes, anio);
  if (!regs || !regs.elimMuestras) {
    alertEl.classList.remove('visible');
    alertEl.style.display = 'none';
    return null;
  }

  const existing = regs.elimMuestras.find(r => 
    parseInt(r.dia) === dia &&
    parseInt(r.mes) === mes &&
    parseInt(r.anio) === anio
  );

  if (existing) {
    const respUser = existing.responsable || 'Desconocido';
    const fechaFmt = `${String(dia).padStart(2,'0')}/${String(mes).padStart(2,'0')}/${anio}`;
    const htmlMsg = `⚠️ <strong>Aviso de Duplicidad:</strong> El registro de eliminación de muestras para el día <strong>${fechaFmt}</strong> ya fue realizado por el usuario <strong>"${respUser}"</strong>.<br>¿Está seguro que desea continuar?`;
    alertEl.innerHTML = htmlMsg;
    alertEl.classList.add('visible');
    alertEl.style.display = 'block';

    return {
      existing,
      message: `El registro de eliminación de muestras para el día ${fechaFmt} ya fue realizado por el usuario "${respUser}".\n\n¿Está seguro que desea continuar?`
    };
  } else {
    alertEl.classList.remove('visible');
    alertEl.style.display = 'none';
    alertEl.innerHTML = '';
    return null;
  }
}

function initDuplicateCheckListeners() {
  const termoFecha = document.getElementById('termo-fecha');
  const termoArea = document.getElementById('termo-area');
  if (termoFecha) { termoFecha.addEventListener('change', checkDuplicateTermo); termoFecha.addEventListener('input', checkDuplicateTermo); }
  if (termoArea) termoArea.addEventListener('change', checkDuplicateTermo);

  const centFecha = document.getElementById('cent-fecha');
  const centTipo = document.getElementById('cent-tipo');
  if (centFecha) { centFecha.addEventListener('change', checkDuplicateCentrifugas); centFecha.addEventListener('input', checkDuplicateCentrifugas); }
  if (centTipo) centTipo.addEventListener('change', checkDuplicateCentrifugas);

  const mesonFecha = document.getElementById('meson-fecha');
  if (mesonFecha) { mesonFecha.addEventListener('change', checkDuplicateMesones); mesonFecha.addEventListener('input', checkDuplicateMesones); }

  const elimFecha = document.getElementById('elim-fecha');
  if (elimFecha) { elimFecha.addEventListener('change', checkDuplicateElimMuestras); elimFecha.addEventListener('input', checkDuplicateElimMuestras); }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDuplicateCheckListeners);
} else {
  initDuplicateCheckListeners();
}

// ── Recent Termo Records (Últimos 20 Registros) ───────────────
let recentTermoCache = [];

async function loadRecentTermo() {
  const tbody = document.getElementById('tbody-recent-termo');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 16px; color: #94a3b8;">🔄 Cargando registros recientes...</td></tr>';
  try {
    const res = await apiGet({ action: 'getRecentTermo', limit: 20 });
    if (res && res.success && Array.isArray(res.records)) {
      recentTermoCache = res.records;
      renderRecentTermoTable(recentTermoCache);
    } else {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 16px; color: #ef4444;">❌ ${res.error || 'Error al cargar registros.'}</td></tr>`;
    }
  } catch (err) {
    console.error('Error cargando últimos 20 termo:', err);
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 16px; color: #ef4444;">❌ Error de conexión al cargar registros.</td></tr>';
  }
}

function renderRecentTermoTable(records) {
  const tbody = document.getElementById('tbody-recent-termo');
  if (!tbody) return;
  if (!records || records.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 16px; color: #94a3b8;">No hay registros recientes.</td></tr>';
    return;
  }

  tbody.innerHTML = records.map((r, idx) => {
    const temp = parseFloat(r.temperatura);
    const hum = parseFloat(r.humedad);
    const tempOOR = !isNaN(temp) && (temp < 18 || temp > 24);
    const humOOR = !isNaN(hum) && (hum < 20 || hum > 70);

    const tempBadge = tempOOR
      ? `<span style="color:#dc2626; font-weight:700; background:#fee2e2; padding:2px 5px; border-radius:4px; white-space:nowrap; display:inline-block;">⚠️ ${r.temperatura} °C</span>`
      : `<span style="font-weight:600; color:#16a34a; white-space:nowrap; display:inline-block;">${r.temperatura} °C</span>`;

    const humBadge = humOOR
      ? `<span style="color:#dc2626; font-weight:700; background:#fee2e2; padding:2px 5px; border-radius:4px; white-space:nowrap; display:inline-block;">⚠️ ${r.humedad} %</span>`
      : `<span style="font-weight:600; color:#0284c7; white-space:nowrap; display:inline-block;">${r.humedad} %</span>`;

    const turnoBadge = r.turno === 'Mañana' ? '☀️ AM' : '🌙 PM';

    return `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 8px 4px; white-space: nowrap;"><strong>${r.fecha}</strong> <span style="font-size:0.75rem; color:#64748b; margin-left:2px;">(${turnoBadge})</span></td>
        <td style="padding: 8px 4px; font-size: 0.82rem;">${r.area || '-'}</td>
        <td style="padding: 8px 4px; text-align: center; white-space: nowrap;">${tempBadge}</td>
        <td style="padding: 8px 4px; text-align: center; white-space: nowrap;">${humBadge}</td>
        <td style="padding: 8px 4px; text-align: center; font-weight:700; letter-spacing:1px; white-space: nowrap;">${r.responsable}</td>
        <td style="padding: 8px 4px; text-align: center; white-space: nowrap;">
          <button type="button" class="btn btn-secondary" style="padding: 4px 6px; font-size: 0.75rem;" onclick="openEditTermoModal(${idx})" title="Editar registro">✏️ Edit</button>
          <button type="button" class="btn btn-danger" style="padding: 4px 6px; font-size: 0.75rem; margin-left: 2px;" onclick="confirmDeleteTermo(${idx})" title="Eliminar registro">🗑️ Elim</button>
        </td>
      </tr>
    `;
  }).join('');
}

function parseFechaToInput(fechaStr) {
  if (!fechaStr) return '';
  if (fechaStr.includes('-')) return fechaStr;
  const parts = fechaStr.split('/');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2].length === 2 ? '20' + parts[2] : parts[2];
    return `${year}-${month}-${day}`;
  }
  return fechaStr;
}

function openEditTermoModal(index) {
  const rec = recentTermoCache[index];
  if (!rec) return;

  document.getElementById('edit-termo-rowindex').value = rec.rowIndex;
  document.getElementById('edit-termo-fecha-reg').value = rec.fecha_registro || '';
  document.getElementById('edit-termo-old-mes').value = rec.mes || '';
  document.getElementById('edit-termo-old-anio').value = rec.anio || '';

  document.getElementById('edit-termo-fecha').value = parseFechaToInput(rec.fecha);
  document.getElementById('edit-termo-turno').value = rec.turno === 'Tarde' ? 'Tarde' : 'Mañana';
  
  // Populate area dropdown
  const areaSelect = document.getElementById('edit-termo-area');
  if (areaSelect && Array.isArray(state.areas)) {
    areaSelect.innerHTML = state.areas.map(a => `<option value="${a}" ${a === rec.area ? 'selected' : ''}>${a}</option>`).join('');
  }

  // Populate accion dropdown
  const accSelect = document.getElementById('edit-termo-accion');
  if (accSelect && Array.isArray(state.acciones)) {
    accSelect.innerHTML = '<option value="">Seleccionar acción…</option>' +
      state.acciones.map(a => `<option value="${a}" ${a === rec.accion_correctiva ? 'selected' : ''}>${a}</option>`).join('');
  }

  document.getElementById('edit-termo-temp').value = rec.temperatura;
  document.getElementById('edit-termo-hum').value = rec.humedad;
  document.getElementById('edit-termo-resp').value = rec.responsable;
  document.getElementById('edit-termo-obs').value = rec.observaciones || '';

  checkEditTermoRangos();

  // Show modal
  document.querySelectorAll('.modal-card').forEach(m => m.style.display = 'none');
  const modalCard = document.getElementById('modal-edit-termo');
  if (modalCard) modalCard.style.display = 'block';
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.classList.add('active');
}

function checkEditTermoRangos() {
  const t = parseFloat(document.getElementById('edit-termo-temp').value);
  const h = parseFloat(document.getElementById('edit-termo-hum').value);
  const alertBanner = document.getElementById('edit-alert-rangos');
  const accGroup = document.getElementById('edit-accion-correctiva-group');
  const accSelect = document.getElementById('edit-termo-accion');

  let out = false;
  if (!isNaN(t) && (t < 18 || t > 24)) out = true;
  if (!isNaN(h) && (h < 20 || h > 70)) out = true;

  if (alertBanner) alertBanner.style.display = out ? 'block' : 'none';
  if (accGroup) accGroup.style.display = out ? 'block' : 'none';
  if (accSelect) accSelect.required = out;
}

async function submitEditTermo(e) {
  e.preventDefault();
  const rowIndex = parseInt(document.getElementById('edit-termo-rowindex').value);
  const fechaReg = document.getElementById('edit-termo-fecha-reg').value;
  const fechaVal = document.getElementById('edit-termo-fecha').value;
  const turnoVal = document.getElementById('edit-termo-turno').value;
  const areaVal = document.getElementById('edit-termo-area').value;
  const tempVal = document.getElementById('edit-termo-temp').value;
  const humVal = document.getElementById('edit-termo-hum').value;
  const respVal = document.getElementById('edit-termo-resp').value;
  const accVal = document.getElementById('edit-termo-accion').value;
  const obsVal = document.getElementById('edit-termo-obs').value;

  const t = parseFloat(tempVal);
  const h = parseFloat(humVal);
  const out = (!isNaN(t) && (t < 18 || t > 24)) || (!isNaN(h) && (h < 20 || h > 70));
  if (out && !accVal) {
    showToast('Debe seleccionar una Acción Correctiva para valores fuera de rango', 'error');
    return;
  }

  setLoading('btn-edit-termo-submit', 'spinner-edit-termo', 'btn-edit-termo-text', true);
  try {
    const res = await apiPost({
      action: 'updateTermo',
      rowIndex: rowIndex,
      fecha_registro: fechaReg,
      fecha: fechaVal,
      turno: turnoVal,
      area: areaVal,
      temperatura: tempVal,
      humedad: humVal,
      responsable: respVal,
      accion_correctiva: accVal,
      observaciones: obsVal
    });

    if (res && res.success) {
      showToast('✅ ' + res.message);
      closeModal({ target: document.getElementById('modal-overlay') });
      if (typeof clearRecordsMonthCache === 'function') clearRecordsMonthCache();
      if (typeof prefetchDashboard === 'function') prefetchDashboard();
      loadRecentTermo();
    } else {
      showToast('❌ ' + (res.error || 'Error al actualizar registro'), 'error');
    }
  } catch (err) {
    console.error('Error submitEditTermo:', err);
    showToast('❌ Error de conexión al actualizar', 'error');
  }
  setLoading('btn-edit-termo-submit', 'spinner-edit-termo', 'btn-edit-termo-text', false);
}

async function confirmDeleteTermo(index) {
  const rec = recentTermoCache[index];
  if (!rec) return;

  if (!confirm(`¿Está seguro de eliminar el registro de Temperatura/Humedad de "${rec.area}" del día ${rec.fecha} (${rec.turno})?`)) {
    return;
  }

  try {
    const res = await apiPost({
      action: 'deleteTermo',
      rowIndex: rec.rowIndex,
      fecha_registro: rec.fecha_registro,
      mes: rec.mes,
      anio: rec.anio
    });

    if (res && res.success) {
      showToast('✅ ' + res.message);
      if (typeof clearRecordsMonthCache === 'function') clearRecordsMonthCache();
      if (typeof prefetchDashboard === 'function') prefetchDashboard();
      loadRecentTermo();
    } else {
      showToast('❌ ' + (res.error || 'Error al eliminar registro'), 'error');
    }
  } catch (err) {
    console.error('Error confirmDeleteTermo:', err);
    showToast('❌ Error de conexión al eliminar', 'error');
  }
}

// ── Admin: Días No Hábiles Excepcionales (HRT) ──────────────

async function loadDiasNoHabilesAdmin() {
  const container = document.getElementById('hrt-list-container');
  if (!container) return;
  
  container.innerHTML = `
    <div style="text-align: center; padding: 12px; color: var(--text-dim);">
      <div class="spinner visible" style="display:inline-block; margin-bottom: 8px;"></div>
      <div>Cargando días no hábiles...</div>
    </div>
  `;

  try {
    const list = await apiGet({ action: 'getDiasNoHabilesHRT' });
    if (!list || !list.length) {
      container.innerHTML = `<div style="font-size:13px; color:var(--text-dim); text-align:center; padding:12px;">No hay fechas excepcionales registradas.</div>`;
      return;
    }

    let html = `
      <div style="overflow-x:auto;">
        <table class="records-table" style="width:100%; font-size:13px;">
          <thead>
            <tr>
              <th>Fecha No Hábil</th>
              <th style="text-align:right;">Acción</th>
            </tr>
          </thead>
          <tbody>
    `;

    list.forEach(item => {
      html += `
        <tr>
          <td><strong>📅 ${escapeHtml(item.fecha)}</strong></td>
          <td style="text-align:right;">
            <button class="btn btn-sm btn-danger" style="padding:4px 10px; font-size:12px;" onclick="deleteDiaNoHabilHRTAdmin('${escapeHtml(item.fecha)}')">
              🗑️ Quitar
            </button>
          </td>
        </tr>
      `;
    });

    html += `</tbody></table></div>`;
    container.innerHTML = html;
  } catch (err) {
    console.error('Error loadDiasNoHabilesAdmin:', err);
    container.innerHTML = `<div class="alert-banner alert-danger visible">Error al cargar fechas no hábiles.</div>`;
  }
}

async function addDiaNoHabilHRTAdmin() {
  const fechaInput = document.getElementById('hrt-fecha');
  const pwdInput = document.getElementById('hrt-admin-pwd');
  const errDiv = document.getElementById('hrt-admin-error');
  const succDiv = document.getElementById('hrt-admin-success');

  errDiv.style.display = 'none';
  succDiv.style.display = 'none';

  const fecha = fechaInput.value;
  const pwd = pwdInput.value;

  if (!fecha) {
    errDiv.textContent = 'Debe seleccionar una fecha.';
    errDiv.style.display = 'block';
    return;
  }
  if (!pwd) {
    errDiv.textContent = 'Debe ingresar la contraseña de administrador.';
    errDiv.style.display = 'block';
    return;
  }

  setLoading('btn-add-hrt', 'spinner-hrt-admin', null, true);

  try {
    const res = await apiPost({
      action: 'saveDiaNoHabilHRT',
      fecha: fecha,
      pwd: pwd
    });

    if (res && res.success) {
      succDiv.textContent = '✅ ' + res.message;
      succDiv.style.display = 'block';
      fechaInput.value = '';
      pwdInput.value = '';
      loadDiasNoHabilesAdmin();
      if (typeof prefetchDashboard === 'function') prefetchDashboard();
    } else {
      errDiv.textContent = '❌ ' + (res.error || 'Error al guardar día no hábil');
      errDiv.style.display = 'block';
    }
  } catch (err) {
    console.error('Error addDiaNoHabilHRTAdmin:', err);
    errDiv.textContent = '❌ Error de conexión al guardar';
    errDiv.style.display = 'block';
  }

  setLoading('btn-add-hrt', 'spinner-hrt-admin', null, false);
}

async function deleteDiaNoHabilHRTAdmin(fechaStr) {
  const pwd = prompt(`Para quitar la fecha ${fechaStr}, ingrese la contraseña de administrador:`);
  if (!pwd) return;

  try {
    const res = await apiPost({
      action: 'deleteDiaNoHabilHRT',
      fecha: fechaStr,
      pwd: pwd
    });

    if (res && res.success) {
      showToast('✅ ' + res.message);
      loadDiasNoHabilesAdmin();
      if (typeof prefetchDashboard === 'function') prefetchDashboard();
    } else {
      showToast('❌ ' + (res.error || 'Error al quitar fecha'), 'error');
    }
  } catch (err) {
    console.error('Error deleteDiaNoHabilHRTAdmin:', err);
    showToast('❌ Error de conexión al quitar fecha', 'error');
  }
}
