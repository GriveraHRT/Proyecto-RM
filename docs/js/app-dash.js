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
  }catch(err){showToast('❌ Error cargando dashboard','error')}
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
const QR_TABS=['areas','salas','centrifugas','refrigeradores','refri-limpieza','conductividad'];
function switchQrTab(tab){
  state.qrTab=tab;
  document.querySelectorAll('.qr-tab').forEach((t,i)=>t.classList.toggle('active',QR_TABS[i]===tab));
  const lbl=document.getElementById('qr-select-label');
  const selGroup=document.getElementById('qr-select-group');
  // Reset QR display
  document.getElementById('qr-canvas-wrap').classList.remove('visible');
  document.getElementById('qr-label-text').style.display='none';
  document.getElementById('qr-url-text').style.display='none';
  document.getElementById('btn-print-qr').style.display='none';
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
}

function printQR(){const val=document.getElementById('qr-label-text').textContent;const img=document.querySelector('#qr-canvas img');if(!img)return;const w=window.open('','_blank');w.document.write(`<!DOCTYPE html><html><head><title>QR - ${val}</title><style>body{font-family:sans-serif;text-align:center;padding:40px;}h2{margin-bottom:16px;}p{color:#555;font-size:13px;margin-top:12px;}</style></head><body><h2>Registros Mensuales</h2><h3>${val}</h3><img src="${img.src}" style="width:200px;height:200px;"/><p>Escanear para registrar</p><script>window.onload=()=>{window.print();}<\/script></body></html>`);w.document.close()}

// Init
async function init(){
  document.getElementById('termo-fecha').value=today();
  document.getElementById('cent-fecha').value=today();
  document.getElementById('meson-fecha').value=today();
  document.getElementById('refri-fecha').value=today();
  document.getElementById('limp-refri-fecha').value=today();
  document.getElementById('conduct-fecha').value=today();
  autoSetAmPm();
  updateInfoCentrifuga();
  updateInfoLimpRefri();
  initDashSelectors();
  await loadMaestros();
  checkUrlParams();
  loadDashboard();
}
init();
