// Forms — Termo
document.getElementById('form-termo').addEventListener('submit',async e=>{
  e.preventDefault();
  const issues=isOutOfRange();
  if(issues){const ac=document.getElementById('termo-accion').value;if(!ac){showOutOfRangePopup(issues);return}}
  setLoading('btn-termo-submit','spinner-termo','btn-termo-text',true);
  try{
    const r=await apiPost({action:'saveTermo',fecha:document.getElementById('termo-fecha').value,ampm:state.ampm,area:document.getElementById('termo-area').value,temperatura:document.getElementById('termo-temp').value,humedad:document.getElementById('termo-hum').value,responsable:document.getElementById('termo-resp').value,observaciones:document.getElementById('termo-obs').value,accion_correctiva:document.getElementById('termo-accion').value||''});
    if(r.success){showToast('✅ '+r.message);e.target.reset();document.getElementById('termo-fecha').value=today();resetRangos();autoSetAmPm();checkUrlParams();prefetchDashboard()}
    else showToast('❌ '+r.error,'error');
  }catch(err){showToast('❌ Error de conexión','error')}
  setLoading('btn-termo-submit','spinner-termo','btn-termo-text',false);
});

// Forms — Centrífugas
document.getElementById('form-centrifugas').addEventListener('submit',async e=>{e.preventDefault();const sel=getSelectedChips('cent-chips');if(!sel.length){showToast('Seleccione al menos una centrífuga','error');return}setLoading('btn-cent-submit','spinner-cent','btn-cent-text',true);try{const r=await apiPost({action:'saveCentrifuga',fecha:document.getElementById('cent-fecha').value,centrifugas:sel,responsable:document.getElementById('cent-resp').value,tipo_mantencion:document.getElementById('cent-tipo').value,observaciones:document.getElementById('cent-obs').value});if(r.success){showToast('✅ '+r.message);e.target.reset();document.getElementById('cent-fecha').value=today();document.getElementById('cent-tipo').value='Diaria';updateInfoCentrifuga();document.querySelectorAll('#cent-chips .chip-item').forEach(c=>c.classList.remove('selected'));document.getElementById('btn-grupo-preanalisis').classList.remove('active');prefetchDashboard()}else showToast('❌ '+r.error,'error')}catch(err){showToast('❌ Error de conexión','error')}setLoading('btn-cent-submit','spinner-cent','btn-cent-text',false)});

// Forms — Mesones
document.getElementById('form-mesones').addEventListener('submit',async e=>{e.preventDefault();const sel=getSelectedChips('meson-chips');if(!sel.length){showToast('Seleccione al menos una sala','error');return}setLoading('btn-meson-submit','spinner-meson','btn-meson-text',true);try{const r=await apiPost({action:'saveMesones',fecha:document.getElementById('meson-fecha').value,salas:sel,responsable:document.getElementById('meson-resp').value,observaciones:document.getElementById('meson-obs').value});if(r.success){showToast('✅ '+r.message);e.target.reset();document.getElementById('meson-fecha').value=today();document.querySelectorAll('#meson-chips .chip-item').forEach(c=>c.classList.remove('selected'));prefetchDashboard()}else showToast('❌ '+r.error,'error')}catch(err){showToast('❌ Error de conexión','error')}setLoading('btn-meson-submit','spinner-meson','btn-meson-text',false)});

// Forms — Temp Refrigeradores
document.getElementById('form-refri-temp').addEventListener('submit',async e=>{
  e.preventDefault();
  const issues=isOutOfRangeRefri();
  if(issues){const ac=document.getElementById('refri-accion').value;if(!ac){showOutOfRangePopup(issues);return}}
  setLoading('btn-refri-submit','spinner-refri','btn-refri-text',true);
  try{
    const r=await apiPost({action:'saveRefriTemp',fecha:document.getElementById('refri-fecha').value,ampm:state.ampmRefri,equipo:document.getElementById('refri-equipo').value,temperatura:document.getElementById('refri-temp-input').value,responsable:document.getElementById('refri-resp').value,observaciones:document.getElementById('refri-obs').value,accion_correctiva:document.getElementById('refri-accion').value||''});
    if(r.success){showToast('✅ '+r.message);e.target.reset();document.getElementById('refri-fecha').value=today();resetRangoRefri();autoSetAmPm();prefetchDashboard()}
    else showToast('❌ '+r.error,'error');
  }catch(err){showToast('❌ Error de conexión','error')}
  setLoading('btn-refri-submit','spinner-refri','btn-refri-text',false);
});

// Forms — Limpieza Refrigeradores
document.getElementById('form-limp-refri').addEventListener('submit',async e=>{e.preventDefault();const sel=getSelectedChips('limp-refri-chips');if(!sel.length){showToast('Seleccione al menos un equipo','error');return}setLoading('btn-limp-refri-submit','spinner-limp-refri','btn-limp-refri-text',true);try{const r=await apiPost({action:'saveLimpiezaRefri',fecha:document.getElementById('limp-refri-fecha').value,equipos:sel,responsable:document.getElementById('limp-refri-resp').value,tipo_mantencion:document.getElementById('limp-refri-tipo').value,observaciones:document.getElementById('limp-refri-obs').value});if(r.success){showToast('✅ '+r.message);e.target.reset();document.getElementById('limp-refri-fecha').value=today();document.getElementById('limp-refri-tipo').value='Semanal (externa)';updateInfoLimpRefri();document.querySelectorAll('#limp-refri-chips .chip-item').forEach(c=>c.classList.remove('selected'));prefetchDashboard()}else showToast('❌ '+r.error,'error')}catch(err){showToast('❌ Error de conexión','error')}setLoading('btn-limp-refri-submit','spinner-limp-refri','btn-limp-refri-text',false)});

// Forms — Conductividad
document.getElementById('form-conductividad').addEventListener('submit',async e=>{
  e.preventDefault();
  setLoading('btn-conduct-submit','spinner-conduct','btn-conduct-text',true);
  try{
    const r=await apiPost({action:'saveConductividad',fecha:document.getElementById('conduct-fecha').value,ampm:state.ampmConduct,conductividad:document.getElementById('conduct-valor').value,responsable:document.getElementById('conduct-resp').value,observaciones:document.getElementById('conduct-obs').value});
    if(r.success){showToast('✅ '+r.message);e.target.reset();document.getElementById('conduct-fecha').value=today();resetRangoConductividad();autoSetAmPm();prefetchDashboard()}
    else showToast('❌ '+r.error,'error');
  }catch(err){showToast('❌ Error de conexión','error')}
  setLoading('btn-conduct-submit','spinner-conduct','btn-conduct-text',false);
});

// Dashboard
function initDashSelectors(){const ms=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];const opts=ms.map((m,i)=>`<option value="${i+1}"${i+1===state.dashMes?' selected':''}>${m}</option>`).join('');document.getElementById('dash-mes').innerHTML=opts;const y=new Date().getFullYear();const yOpts=[y-1,y,y+1].map(a=>`<option value="${a}"${a===state.dashAnio?' selected':''}>${a}</option>`).join('');document.getElementById('dash-anio').innerHTML=yOpts}
function cambiarMes(d){state.dashMes+=d;if(state.dashMes>12){state.dashMes=1;state.dashAnio++}if(state.dashMes<1){state.dashMes=12;state.dashAnio--}initDashSelectors();loadDashboard(true)}
function switchDashTab(t){state.dashTab=t;document.getElementById('tab-diario').classList.toggle('active',t==='diario');document.getElementById('tab-mensual').classList.toggle('active',t==='mensual');document.getElementById('dash-daily-view').style.display=t==='diario'?'':'none';document.getElementById('dash-monthly-view').style.display=t==='mensual'?'':'none';if(state.dashData)renderDashContent(state.dashData)}
function getDiasHasta(m,a){const h=new Date();const d=new Date(a,m,0).getDate();return(a===h.getFullYear()&&m===(h.getMonth()+1))?h.getDate():d}

async function loadDashboard(forceReload){
  state.dashMes=parseInt(document.getElementById('dash-mes').value);
  state.dashAnio=parseInt(document.getElementById('dash-anio').value);
  const cacheKey=state.dashMes+'-'+state.dashAnio;
  // Use cache if valid (<5min) and same month, unless forced
  if(!forceReload&&state.dashCache&&state.dashCache.key===cacheKey&&getCacheAge()<5){
    const reg=state.dashCache.data;state.dashData=reg;
    if(!state.dashMaestros)state.dashMaestros={areas:state.areas,centrifugas:state.centrifugas,salas:state.salas,refrigeradores:state.refrigeradores,refriLimpieza:state.refriLimpieza};
    applyDashData(reg);updateCacheIndicator();return;
  }
  document.getElementById('dash-loading').style.display='block';
  document.getElementById('dash-tables').innerHTML='';document.getElementById('dash-alerts-container').innerHTML='';
  document.getElementById('dash-daily-view').innerHTML='';document.getElementById('dash-monthly-view').innerHTML='';
  try{
    const[reg,rev]=await Promise.all([apiGet({action:'getRegistros',mes:state.dashMes,anio:state.dashAnio}),apiGet({action:'getRevisiones',mes:state.dashMes,anio:state.dashAnio})]);
    if(!state.dashMaestros){try{state.dashMaestros=await apiGet({action:'getMaestros'})}catch(e){state.dashMaestros={areas:state.areas,centrifugas:state.centrifugas,salas:state.salas,refrigeradores:state.refrigeradores,refriLimpieza:state.refriLimpieza}}}
    state.dashData=reg;
    state.dashCache={key:cacheKey,data:reg,rev:rev,timestamp:Date.now()};
    applyDashData(reg);
  }catch(err){
    console.warn('Error cargando dashboard, cargando mock local...', err);
    const mockReg={termo:[],centrifugas:[],mesones:[],refriTemp:[],limpiezaRefri:[],conductividad:[]};
    state.dashData=mockReg;
    applyDashData(mockReg);
  }
  document.getElementById('dash-loading').style.display='none';updateCacheIndicator();
}
function applyDashData(reg){
  document.getElementById('stat-termo').textContent=reg.termo.length;
  document.getElementById('stat-cent').textContent=reg.centrifugas.length;
  document.getElementById('stat-limp').textContent=reg.mesones.length;
  document.getElementById('stat-refri').textContent=(reg.refriTemp||[]).length;
  document.getElementById('stat-limp-refri').textContent=(reg.limpiezaRefri||[]).length;
  document.getElementById('stat-conduct').textContent=(reg.conductividad||[]).length;
  renderDashContent(reg);renderTables(reg);
}

function renderDashContent(reg){if(state.dashTab==='diario')renderDailyView(reg);else renderMonthlyView(reg)}

function renderDailyView(reg){const hoy=new Date().getDate();const m=state.dashMaestros||{areas:[],centrifugas:[],salas:[],refrigeradores:[],refriLimpieza:[]};let html='<div class="card card-sm" style="margin-bottom:12px;"><strong style="font-size:14px;">📅 Estado del Día '+hoy+'</strong></div>';
// Temp/Hum by area
const termoHoy=reg.termo.filter(r=>parseInt(r.dia)===hoy);html+='<div class="card card-sm" style="margin-bottom:12px;"><div class="status-section-title">🌡️ Temp. Ambiental</div>';
['Mañana','Tarde'].forEach(turno=>{html+=`<div style="font-size:11px;font-weight:600;color:var(--text-dim);margin:6px 0 4px;text-transform:uppercase;">${turno}</div><div class="status-grid">`;m.areas.forEach(a=>{const done=termoHoy.some(r=>r.area===a&&r.turno===turno);html+=`<div class="status-item ${done?'done':'miss'}"><span class="status-dot ${done?'green':'red'}"></span>${a}</div>`});html+='</div>'});html+='</div>';
// Centrífugas
const centHoy=reg.centrifugas.filter(r=>parseInt(r.dia)===hoy&&r.tipo_mantencion==='Diaria');html+='<div class="card card-sm" style="margin-bottom:12px;"><div class="status-section-title">⚙️ Centrífugas (Diaria)</div><div class="status-grid">';
m.centrifugas.forEach(c=>{const done=centHoy.some(r=>r.centrifuga===c);html+=`<div class="status-item ${done?'done':'miss'}"><span class="status-dot ${done?'green':'red'}"></span>${c.replace('Centrífuga ','C')}</div>`});html+='</div></div>';
// Mesones
const mesoHoy=reg.mesones.filter(r=>parseInt(r.dia)===hoy);html+='<div class="card card-sm" style="margin-bottom:12px;"><div class="status-section-title">🧽 Mesones</div><div class="status-grid">';
m.salas.forEach(s=>{const done=mesoHoy.some(r=>r.sala===s);html+=`<div class="status-item ${done?'done':'miss'}"><span class="status-dot ${done?'green':'red'}"></span>${s}</div>`});html+='</div></div>';
// Refri Temp
const refriHoy=(reg.refriTemp||[]).filter(r=>parseInt(r.dia)===hoy);const refris=m.refrigeradores||[];
if(refris.length){html+='<div class="card card-sm" style="margin-bottom:12px;"><div class="status-section-title">🧊 Temp. Refrigeradores</div>';
['Mañana','Tarde'].forEach(turno=>{html+=`<div style="font-size:11px;font-weight:600;color:var(--text-dim);margin:6px 0 4px;text-transform:uppercase;">${turno}</div><div class="status-grid">`;refris.forEach(r=>{const done=refriHoy.some(rt=>rt.equipo===(r.equipo||r)&&rt.turno===turno);const name=r.equipo||r;html+=`<div class="status-item ${done?'done':'miss'}"><span class="status-dot ${done?'green':'red'}"></span>${name}</div>`});html+='</div>'});html+='</div>'}
// Conductividad
const condHoy=(reg.conductividad||[]).filter(r=>parseInt(r.dia)===hoy);
html+='<div class="card card-sm" style="margin-bottom:12px;"><div class="status-section-title">💧 Conductividad</div><div class="status-grid">';
['Mañana','Tarde'].forEach(turno=>{const done=condHoy.some(r=>r.turno===turno);html+=`<div class="status-item ${done?'done':'miss'}"><span class="status-dot ${done?'green':'red'}"></span>${turno}</div>`});html+='</div></div>';
document.getElementById('dash-daily-view').innerHTML=html}

function renderMonthlyView(reg){const dh=getDiasHasta(state.dashMes,state.dashAnio);const m=state.dashMaestros||{areas:[],centrifugas:[],salas:[],refrigeradores:[]};let html='';
// Temp/Hum monthly
html+='<div class="card card-sm" style="margin-bottom:12px;"><div class="status-section-title">🌡️ Temp. Ambiental</div>';
m.areas.forEach(a=>{html+=`<div style="font-size:12px;font-weight:600;margin:8px 0 4px;">${a}</div>`;['Mañana','Tarde'].forEach(turno=>{const dias=new Set(reg.termo.filter(r=>r.area===a&&r.turno===turno).map(r=>parseInt(r.dia)));let miss=0;let chips='';for(let d=1;d<=dh;d++){const ok=dias.has(d);if(!ok)miss++;chips+=`<span class="day-chip ${ok?'chip-ok':'chip-missing'}">${d}</span>`}html+=`<div style="font-size:11px;color:var(--text-dim);margin:4px 0 2px;">${turno} ${miss?'('+miss+' faltantes)':'✓'}</div><div class="missing-grid">${chips}</div>`})});html+='</div>';
// Centrífugas monthly
html+='<div class="card card-sm" style="margin-bottom:12px;"><div class="status-section-title">⚙️ Centrífugas</div>';
m.centrifugas.forEach(c=>{const diasD=new Set(reg.centrifugas.filter(r=>r.centrifuga===c&&r.tipo_mantencion==='Diaria').map(r=>parseInt(r.dia)));let miss=0;let chips='';for(let d=1;d<=dh;d++){const ok=diasD.has(d);if(!ok)miss++;chips+=`<span class="day-chip ${ok?'chip-ok':'chip-missing'}">${d}</span>`}html+=`<div style="font-size:12px;font-weight:600;margin:8px 0 4px;">${c} ${miss?'('+miss+' faltantes)':'✓'}</div><div class="missing-grid">${chips}</div>`});html+='</div>';
// Mesones monthly
html+='<div class="card card-sm" style="margin-bottom:12px;"><div class="status-section-title">🧽 Mesones</div>';
m.salas.forEach(s=>{const dias=new Set(reg.mesones.filter(r=>r.sala===s).map(r=>parseInt(r.dia)));let miss=0;let chips='';for(let d=1;d<=dh;d++){const ok=dias.has(d);if(!ok)miss++;chips+=`<span class="day-chip ${ok?'chip-ok':'chip-missing'}">${d}</span>`}html+=`<div style="font-size:12px;font-weight:600;margin:8px 0 4px;">${s} ${miss?'('+miss+' faltantes)':'✓'}</div><div class="missing-grid">${chips}</div>`});html+='</div>';
// Refri Temp monthly
const refris=m.refrigeradores||[];
if(refris.length){html+='<div class="card card-sm" style="margin-bottom:12px;"><div class="status-section-title">🧊 Temp. Refrigeradores</div>';
refris.forEach(r=>{const name=r.equipo||r;html+=`<div style="font-size:12px;font-weight:600;margin:8px 0 4px;">${name}</div>`;['Mañana','Tarde'].forEach(turno=>{const dias=new Set((reg.refriTemp||[]).filter(rt=>rt.equipo===name&&rt.turno===turno).map(rt=>parseInt(rt.dia)));let miss=0;let chips='';for(let d=1;d<=dh;d++){const ok=dias.has(d);if(!ok)miss++;chips+=`<span class="day-chip ${ok?'chip-ok':'chip-missing'}">${d}</span>`}html+=`<div style="font-size:11px;color:var(--text-dim);margin:4px 0 2px;">${turno} ${miss?'('+miss+' faltantes)':'✓'}</div><div class="missing-grid">${chips}</div>`})});html+='</div>'}
// Conductividad monthly
html+='<div class="card card-sm" style="margin-bottom:12px;"><div class="status-section-title">💧 Conductividad</div>';
['Mañana','Tarde'].forEach(turno=>{const dias=new Set((reg.conductividad||[]).filter(r=>r.turno===turno).map(r=>parseInt(r.dia)));let miss=0;let chips='';for(let d=1;d<=dh;d++){const ok=dias.has(d);if(!ok)miss++;chips+=`<span class="day-chip ${ok?'chip-ok':'chip-missing'}">${d}</span>`}html+=`<div style="font-size:11px;color:var(--text-dim);margin:4px 0 2px;">${turno} ${miss?'('+miss+' faltantes)':'✓'}</div><div class="missing-grid">${chips}</div>`});html+='</div>';
document.getElementById('dash-monthly-view').innerHTML=html}

function renderTables(reg){const c=document.getElementById('dash-tables');c.innerHTML=renderTableCard('🌡️ Temp. Ambiental',reg.termo,['Día','Turno','Área','Temp°','Hum%','Resp','Acción','Obs'],r=>[r.dia,r.turno,r.area,r.temperatura,r.humedad,r.responsable,r.accion_correctiva||'',r.observaciones])+renderTableCard('⚙️ Centrífugas',reg.centrifugas,['Día','Centrífuga','Resp','Tipo','Obs'],r=>[r.dia,r.centrifuga,r.responsable,r.tipo_mantencion,r.observaciones])+renderTableCard('🧽 Mesones',reg.mesones,['Día','Sala','Resp','Obs'],r=>[r.dia,r.sala,r.responsable,r.observaciones])+renderTableCard('🧊 Temp. Refrigeradores',reg.refriTemp||[],['Día','Turno','Equipo','Temp°','Resp','Obs'],r=>[r.dia,r.turno,r.equipo,r.temperatura,r.responsable,r.observaciones])+renderTableCard('🧹 Limpieza Refrigeradores',reg.limpiezaRefri||[],['Día','Tipo','Equipo','Resp','Obs'],r=>[r.dia,r.tipo_mantencion,r.equipo,r.responsable,r.observaciones])+renderTableCard('💧 Conductividad',reg.conductividad||[],['Día','Turno','µS/cm','Resp','Obs'],r=>[r.dia,r.turno,r.conductividad,r.responsable,r.observaciones])}
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
    const ALL_TYPES=[{key:'termo',name:'🌡️ Temp. Ambiental'},{key:'centrifugas',name:'⚙️ Centrífugas'},{key:'mesones',name:'🧽 Mesones'},{key:'refriTemp',name:'🧊 Temp. Refri.'},{key:'limpRefri',name:'🧹 Limp. Refri.'},{key:'conductividad',name:'💧 Conductividad'}];
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

// QR
const QR_TABS=['areas','salas','centrifugas','refrigeradores','refri-limpieza','conductividad','etiquetadoras'];
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
  } else {
    selGroup.style.display='';
    if(tab==='areas'){lbl.textContent='Selecciona Área';populateSelect('admin-select',state.areas,'— Seleccionar —')}
    else if(tab==='salas'){lbl.textContent='Selecciona Sala';populateSelect('admin-select',state.salas,'— Seleccionar —')}
    else if(tab==='centrifugas'){lbl.textContent='Selecciona Centrífuga';const items=[...state.centrifugas,'🏷️ Grupo Preanálisis'];populateSelect('admin-select',items,'— Seleccionar —')}
    else if(tab==='refrigeradores'){lbl.textContent='Selecciona Refrigerador/Congelador';const items=state.refrigeradores.map(r=>r.equipo);populateSelect('admin-select',items,'— Seleccionar —')}
    else if(tab==='refri-limpieza'){lbl.textContent='Selecciona Equipo (Limpieza)';populateSelect('admin-select',state.refriLimpieza,'— Seleccionar —')}
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
  const base=window.location.origin+window.location.pathname;
  let url,val;
  if(state.qrTab==='conductividad'){
    url=`${base}?modulo=conductividad`;
    val='Conductividad del Agua';
  } else {
    const rawVal=document.getElementById('admin-select').value;
    if(!rawVal)return;
    if(state.qrTab==='areas'){url=`${base}?area=${encodeURIComponent(rawVal)}`; val=`Temperatura Ambiental - ${rawVal}`;}
    else if(state.qrTab==='salas'){url=`${base}?sala=${encodeURIComponent(rawVal)}`; val=`Limpieza Mesones - ${rawVal}`;}
    else if(state.qrTab==='centrifugas'){if(rawVal.includes('Preanálisis'))url=`${base}?grupo=preanalisis`;else url=`${base}?centrifuga=${encodeURIComponent(rawVal)}`; val=`Mantención Centrífugas - ${rawVal}`;}
    else if(state.qrTab==='refrigeradores'){url=`${base}?refri=${encodeURIComponent(rawVal)}`; val=`Temperatura Refrigeradores - ${rawVal}`;}
    else if(state.qrTab==='refri-limpieza'){url=`${base}?limprefri=${encodeURIComponent(rawVal)}`; val=`Limpieza Refrigeradores - ${rawVal}`;}
    else if(state.qrTab==='etiquetadoras'){url=`${base}?etiquetadora=${encodeURIComponent(rawVal)}`; val=`Etiquetadora - ${rawVal}`;}
  }
  const wrap=document.getElementById('qr-canvas-wrap');
  const canvas=document.getElementById('qr-canvas');
  canvas.innerHTML='';
  if(state.qrInstance)try{state.qrInstance.clear()}catch(e){}
  state.qrInstance=new QRCode(canvas,{text:url,width:220,height:220,colorDark:'#000000',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.H});
  wrap.classList.add('visible');
  document.getElementById('qr-label-text').textContent=val;
  document.getElementById('qr-label-text').style.display='block';
  document.getElementById('qr-url-text').textContent=url;
  document.getElementById('qr-url-text').style.display='block';
  document.getElementById('btn-print-qr').style.display='inline-flex';
  document.getElementById('btn-print-label').style.display='inline-flex';
}

function printQR(){const val=document.getElementById('qr-label-text').textContent;const img=document.querySelector('#qr-canvas img');if(!img)return;const w=window.open('','_blank');w.document.write(`<!DOCTYPE html><html><head><title>QR - ${val}</title><style>body{font-family:sans-serif;text-align:center;padding:40px;}h2{margin-bottom:16px;}p{color:#555;font-size:13px;margin-top:12px;}</style></head><body><h2>Registros Mensuales</h2><h3>${val}</h3><img src="${img.src}" style="width:200px;height:200px;"/><p>Escanear para registrar</p><script>window.onload=()=>{window.print();}<\/script></body></html>`);w.document.close()}

function printLabel50x30() {
  const val = document.getElementById('qr-label-text').textContent;
  const url = document.getElementById('qr-url-text').textContent;
  const img = document.querySelector('#qr-canvas img');
  if (!img) return;

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
  slbl += `b35,30,Q,,s4,"${url}"#10#13`;
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
    .qr-container img {
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
    <img src="${img.src}" />
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
  </script>
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
      list.innerHTML = data.map(r => `
        <div style="padding:10px; border-bottom:1px solid rgba(255,255,255,0.04); font-size:13px; line-height:1.4;">
          <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-weight:700;">
            <span style="color:var(--primary-color);">${r.accion}</span>
            <span style="color:var(--text-dim); font-size:11px;">📅 ${r.fecha} — 👤 ${r.responsable}</span>
          </div>
          <div style="color:var(--text-color); font-weight:400; font-size:12.5px;">${r.descripcion}</div>
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
    password: password
  };
  
  try {
    const res = await apiPost(payload);
    spinner.classList.remove('visible');
    btnText.style.display = '';
    
    if (res.success) {
      showToast('Ficha técnica actualizada correctamente ✓', 'success');
      
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
  
  if (val === 'Cambio de Papel') {
    descGroup.style.display = 'none';
    descInput.required = false;
    descInput.value = 'Cambio de papel estándar realizado';
  } else if (val) {
    descGroup.style.display = '';
    descInput.required = true;
    if (descInput.value === 'Cambio de papel estándar realizado') {
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
  autoSetAmPm();
  updateInfoCentrifuga();
  updateInfoLimpRefri();
  initDashSelectors();
  await loadMaestros();
  checkUrlParams();
  loadDashboard();
}
init();
