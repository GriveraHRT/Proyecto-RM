
if (typeof API_URL === 'undefined') {
  var API_URL = 'https://script.google.com/macros/s/AKfycbxuqcui0-hjJ721uMWZk3w-4l2fVCaBWQgdMJqVMb5Pno339Jqetq4r62p3-1gGBUvFOg/exec';
}
const PREANALISIS=[1,2,3,4,5,18,19];
const state={areas:[],centrifugas:[],salas:[],acciones:[],refrigeradores:[],refriLimpieza:[],cobasObs:[],ampm:'AM',ampmRefri:'AM',ampmConduct:'AM',qrInstance:null,qrTab:'areas',dashMes:new Date().getMonth()+1,dashAnio:new Date().getFullYear(),dashTab:'diario',dashData:null,dashMaestros:null,dashCache:null,maestrosPromise:null,modulosActivos:null};

function today(){return new Date().toISOString().split('T')[0]}
function showToast(m,t='success'){const el=document.getElementById('toast');el.textContent=m;el.className=`show toast-${t}`;setTimeout(()=>{el.className=''},3200)}
function setLoading(b,s,t,l){document.getElementById(b).disabled=l;document.getElementById(s).classList.toggle('visible',l);document.getElementById(t).style.display=l?'none':''}
async function fetchWithTimeout(url, options = {}, timeout = 25000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}
async function apiGet(p){const u=new URL(API_URL);Object.entries(p).forEach(([k,v])=>u.searchParams.set(k,v));const r=await fetchWithTimeout(u.toString(),{redirect:'follow'});if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json()}
async function apiPost(b){const r=await fetchWithTimeout(API_URL,{method:'POST',redirect:'follow',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(b)});if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json()}

// Clock
function updateClock(){const n=new Date(),h=n.getHours(),m=n.getMinutes(),ap=h<12?'AM':'PM';document.getElementById('clock-time').textContent=String(h).padStart(2,'0')+':'+String(m).padStart(2,'0');const b=document.getElementById('header-ampm-badge');b.textContent=ap;b.className=`ampm-${ap}`;const d=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'],ms=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];document.getElementById('clock-date').textContent=`${d[n.getDay()]} ${n.getDate()} ${ms[n.getMonth()]} ${n.getFullYear()}`}
setInterval(updateClock,1000);updateClock();

// Theme
function toggleTheme(){const d=document.documentElement,dark=d.getAttribute('data-theme')==='dark';d.setAttribute('data-theme',dark?'':'dark');document.getElementById('theme-toggle').textContent=dark?'☀️':'🌙';localStorage.setItem('theme',dark?'light':'dark');document.querySelector('meta[name="theme-color"]').content=dark?'#F0F4F8':'#0B1426'}
(function(){const t=localStorage.getItem('theme');if(t==='dark'){document.documentElement.setAttribute('data-theme','dark');document.getElementById('theme-toggle').textContent='🌙';document.querySelector('meta[name="theme-color"]').content='#0B1426'};try{const savedM=localStorage.getItem('modulosActivos');if(savedM){state.modulosActivos=JSON.parse(savedM);setTimeout(applyModulosVisibilidad,0)}}catch(e){}})();

// Modulos Activos Control
function isModuloActivo(k){if(!state.modulosActivos)return true;return state.modulosActivos[k]!==false}
function applyModulosVisibilidad(){if(!state.modulosActivos)return;try{localStorage.setItem('modulosActivos',JSON.stringify(state.modulosActivos))}catch(e){};document.querySelectorAll('#bottom-nav .nav-item[data-section]').forEach(el=>{const s=el.getAttribute('data-section');if(s==='dashboard'||s==='admin'){el.style.display=''}else{el.style.display=isModuloActivo(s)?'':'none'}});const statMap={'termo':'stat-termo','centrifugas':'stat-cent','mesones':'stat-limp','refri-temp':'stat-refri','limp-refri':'stat-limp-refri','conductividad':'stat-conduct','cobas':'stat-cobas'};Object.entries(statMap).forEach(([k,id])=>{const el=document.getElementById(id);if(el){const c=el.closest('.stat-card');if(c)c.style.display=isModuloActivo(k)?'':'none'}});document.querySelectorAll('.stats-row').forEach(row=>{const vis=Array.from(row.querySelectorAll('.stat-card')).filter(c=>c.style.display!=='none');row.style.display=vis.length>0?'':'none'});if(state.dashData&&typeof renderDashContent==='function'){renderDashContent(state.dashData)}if(state.dashData&&typeof renderTables==='function'){renderTables(state.dashData)}}

// Navigation
function navigateTo(s){document.querySelectorAll('.section').forEach(el=>el.classList.remove('active'));document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));const sec=document.getElementById('section-'+s);if(sec)sec.classList.add('active');const navBtn=document.querySelector(`[data-section="${s}"]`);if(navBtn)navBtn.classList.add('active');if(s==='dashboard')loadDashboard();if(s==='admin'){initRevAdminSelectors();loadNotificacionesAdmin();if(typeof loadModulosAdmin==='function')loadModulosAdmin()}if(s==='dxh900'){loadDxH900HistorialForm()}if(s==='elim-muestras'){loadElimMuestrasHistorialForm()}if(s==='termo'&&typeof checkDuplicateTermo==='function')checkDuplicateTermo();if(s==='centrifugas'&&typeof checkDuplicateCentrifugas==='function')checkDuplicateCentrifugas();if(s==='mesones'&&typeof checkDuplicateMesones==='function')checkDuplicateMesones();if(s==='elim-muestras'&&typeof checkDuplicateElimMuestras==='function')checkDuplicateElimMuestras();}

// AM/PM — Termo (ambiental)
function setAmPm(v){state.ampm=v;document.getElementById('btn-am').className='ampm-btn'+(v==='AM'?' selected-AM':'');document.getElementById('btn-pm').className='ampm-btn'+(v==='PM'?' selected-PM':'');if(typeof checkDuplicateTermo==='function')checkDuplicateTermo();}
function autoSetAmPm(){const ap=new Date().getHours()<12?'AM':'PM';setAmPm(ap);setAmPmRefri(ap);setAmPmConduct(ap)}

// AM/PM — Refrigeradores
function setAmPmRefri(v){state.ampmRefri=v;document.getElementById('btn-refri-am').className='ampm-btn'+(v==='AM'?' selected-AM':'');document.getElementById('btn-refri-pm').className='ampm-btn'+(v==='PM'?' selected-PM':'')}

// AM/PM — Conductividad
function setAmPmConduct(v){state.ampmConduct=v;document.getElementById('btn-conduct-am').className='ampm-btn'+(v==='AM'?' selected-AM':'');document.getElementById('btn-conduct-pm').className='ampm-btn'+(v==='PM'?' selected-PM':'')}

// ── Range check — Termo (ambiental) ──────────────────────────
function checkRangos(){
  const t=parseFloat(document.getElementById('termo-temp').value);
  const h=parseFloat(document.getElementById('termo-hum').value);
  const a=document.getElementById('alert-rangos');
  const ti=document.getElementById('temp-range-info');
  const hi=document.getElementById('hum-range-info');
  const acGroup=document.getElementById('accion-correctiva-group');
  const acSelect=document.getElementById('termo-accion');
  let out=false;
  if(!isNaN(t)){const ok=t>=18&&t<=24;ti.className='range-info '+(ok?'range-ok':'range-err');ti.textContent=ok?`✓ ${t} °C — dentro de rango`:`✗ ${t} °C — fuera de rango (18–24 °C)`;if(!ok)out=true}
  if(!isNaN(h)){const ok=h>=20&&h<=70;hi.className='range-info '+(ok?'range-ok':'range-err');hi.textContent=ok?`✓ ${h}% — dentro de rango`:`✗ ${h}% — fuera de rango (20–70%)`;if(!ok)out=true}
  a.classList.toggle('visible',out);
  if(out){acGroup.style.display='';acSelect.required=true}
  else{acGroup.style.display='none';acSelect.required=false;acSelect.value=''}
}
function resetRangos(){
  document.getElementById('temp-range-info').className='range-info';
  document.getElementById('temp-range-info').textContent='Rango aceptable: 18–24 °C';
  document.getElementById('hum-range-info').className='range-info';
  document.getElementById('hum-range-info').textContent='Rango aceptable: 20–70 %';
  document.getElementById('alert-rangos').classList.remove('visible');
  document.getElementById('accion-correctiva-group').style.display='none';
  document.getElementById('termo-accion').required=false;
  document.getElementById('termo-accion').value='';
}
function isOutOfRange(){
  const t=parseFloat(document.getElementById('termo-temp').value);
  const h=parseFloat(document.getElementById('termo-hum').value);
  const issues=[];
  if(!isNaN(t)&&(t<18||t>24))issues.push(`Temperatura: ${t} °C (rango: 18–24 °C)`);
  if(!isNaN(h)&&(h<20||h>70))issues.push(`Humedad: ${h}% (rango: 20–70%)`);
  return issues.length?issues:false;
}
function showOutOfRangePopup(issues){
  const list=document.getElementById('oor-detail');
  list.innerHTML=issues.map(i=>`<li>${i}</li>`).join('');
  document.querySelectorAll('.modal-card').forEach(m=>m.style.display='none');
  document.getElementById('modal-out-of-range').style.display='block';
  document.getElementById('modal-overlay').classList.add('active');
}

// ── Range check — Refrigeradores (dynamic) ───────────────────
function getRefriRange(){
  const sel=document.getElementById('refri-equipo').value;
  if(!sel)return null;
  return state.refrigeradores.find(r=>r.equipo===sel)||null;
}
function checkRangoRefri(){
  const equipo=getRefriRange();
  const ri=document.getElementById('refri-range-info');
  const alert=document.getElementById('alert-refri-rangos');
  const acGroup=document.getElementById('refri-accion-group');
  const acSelect=document.getElementById('refri-accion');
  if(!equipo){ri.className='range-info';ri.textContent='Seleccione un equipo para ver el rango';alert.classList.remove('visible');acGroup.style.display='none';return}
  ri.textContent=`Rango aceptable: ${equipo.tempMin} a ${equipo.tempMax} °C (${equipo.tipo})`;
  const t=parseFloat(document.getElementById('refri-temp-input').value);
  if(isNaN(t)){ri.className='range-info';alert.classList.remove('visible');acGroup.style.display='none';return}
  const ok=t>=equipo.tempMin&&t<=equipo.tempMax;
  ri.className='range-info '+(ok?'range-ok':'range-err');
  ri.textContent=ok?`✓ ${t} °C — dentro de rango (${equipo.tempMin} a ${equipo.tempMax} °C)`:`✗ ${t} °C — fuera de rango (${equipo.tempMin} a ${equipo.tempMax} °C)`;
  alert.classList.toggle('visible',!ok);
  if(!ok){acGroup.style.display='';acSelect.required=true}
  else{acGroup.style.display='none';acSelect.required=false;acSelect.value=''}
}
function isOutOfRangeRefri(){
  const equipo=getRefriRange();
  if(!equipo)return false;
  const t=parseFloat(document.getElementById('refri-temp-input').value);
  if(isNaN(t))return false;
  if(t<equipo.tempMin||t>equipo.tempMax)return[`Temperatura: ${t} °C (rango: ${equipo.tempMin} a ${equipo.tempMax} °C para ${equipo.equipo})`];
  return false;
}
function resetRangoRefri(){
  document.getElementById('refri-range-info').className='range-info';
  document.getElementById('refri-range-info').textContent='Seleccione un equipo para ver el rango';
  document.getElementById('alert-refri-rangos').classList.remove('visible');
  document.getElementById('refri-accion-group').style.display='none';
  document.getElementById('refri-accion').required=false;
  document.getElementById('refri-accion').value='';
}

// ── Range check — Conductividad ──────────────────────────────
function checkRangoConductividad(){
  const v=parseFloat(document.getElementById('conduct-valor').value);
  const ri=document.getElementById('conduct-range-info');
  const alertD=document.getElementById('alert-conduct-rangos');
  const alertW=document.getElementById('alert-conduct-warning');
  if(isNaN(v)){ri.className='range-info';ri.textContent='Rango permitido: 0–0.8 µS/cm';alertD.classList.remove('visible');alertW.classList.remove('visible');return}
  if(v>0.8){ri.className='range-info range-err';ri.textContent=`✗ ${v} µS/cm — fuera de rango (máx 0.8)`;alertD.classList.add('visible');alertW.classList.remove('visible')}
  else if(v>0.5){ri.className='range-info range-warn';ri.textContent=`⚡ ${v} µS/cm — advertencia (>0.5)`;alertD.classList.remove('visible');alertW.classList.add('visible')}
  else{ri.className='range-info range-ok';ri.textContent=`✓ ${v} µS/cm — dentro de rango`;alertD.classList.remove('visible');alertW.classList.remove('visible')}
}
function resetRangoConductividad(){
  document.getElementById('conduct-range-info').className='range-info';
  document.getElementById('conduct-range-info').textContent='Rango permitido: 0–0.8 µS/cm';
  document.getElementById('alert-conduct-rangos').classList.remove('visible');
  document.getElementById('alert-conduct-warning').classList.remove('visible');
}

// ── Limpieza Refri Info ──────────────────────────────────────
const LIMP_REFRI_INFO={
  'Semanal (externa)':{title:'📅 Limpieza Semanal (Externa)',body:'Realizar <strong>limpieza externa</strong> del refrigerador/congelador. Limpiar superficies exteriores, manillas y sellos con paño húmedo.'},
  'Semestral (interna)':{title:'🔧 Limpieza Semestral (Interna)',body:'Realizar <strong>limpieza interna completa</strong>. Retirar contenido, descongelar si aplica, limpiar bandejas, paredes internas y sellos. Verificar temperatura post-limpieza.'},
  'Descongelación manual':{title:'❄️ Descongelación Manual',body:'Realizar <strong>descongelación manual según necesidad</strong>. Retirar contenido, apagar equipo, retirar hielo acumulado. Limpiar y secar antes de reconectar.'}
};
function updateInfoLimpRefri(){const t=document.getElementById('limp-refri-tipo').value;const i=LIMP_REFRI_INFO[t]||LIMP_REFRI_INFO['Semanal (externa)'];document.getElementById('info-limp-refri-title').textContent=i.title;document.getElementById('info-limp-refri-body').innerHTML=i.body;document.getElementById('info-limp-refri').classList.add('visible')}

// Centrifuga info
const CENT_INFO={Diaria:{title:'🔁 Mantención Diaria',body:'Realizar <strong>limpieza de superficie interior y exterior</strong> de la centrífuga con paño húmedo.'},Semanal:{title:'📅 Mantención Semanal',body:'<strong>Lavar capachos</strong> con solución jabonosa. <strong>Desinfectar rotor, capachos y superficies</strong> con alcohol 70% o Cloro 0.5%.'},Anual:{title:'🔧 Mantención Anual / Según Necesidad',body:'<strong>Desenchufar la centrífuga</strong> antes de intervenir. <strong>Engrasar capachos</strong>. Realizar mantención <strong>preventiva y/o reparativa</strong> completa.'}};
function updateInfoCentrifuga(){const t=document.getElementById('cent-tipo').value,i=CENT_INFO[t]||CENT_INFO.Diaria;document.getElementById('info-cent-title').textContent=i.title;document.getElementById('info-cent-body').innerHTML=i.body;document.getElementById('info-centrifuga').classList.add('visible')}

// Load masters
async function loadMaestros(){
  if (state.maestrosPromise && !state.dashMaestros) {
    return state.maestrosPromise;
  }
  state.maestrosPromise = (async () => {
    try{
      const data=await apiGet({action:'getMaestros'});
      state.areas=data.areas||[];
    state.centrifugas=data.centrifugas||[];
    state.salas=data.salas||[];
    state.acciones=data.acciones||[];
    state.refrigeradores=data.refrigeradores||[];
    state.refriLimpieza=data.refriLimpieza||[];
    state.etiquetadoras=data.etiquetadoras||[];
    if(data.modulosActivos){state.modulosActivos=data.modulosActivos}
    applyModulosVisibilidad();
    state.dashMaestros={areas:state.areas,centrifugas:state.centrifugas,salas:state.salas,refrigeradores:state.refrigeradores,refriLimpieza:state.refriLimpieza};
    populateSelect('termo-area',state.areas,'Seleccionar área…');
    populateSelect('admin-select',state.areas,'— Seleccionar —');
    populateChips('cent-chips',state.centrifugas);
    populateChips('meson-chips',state.salas);
    // Refrigeradores
    const refriNames=state.refrigeradores.map(r=>r.equipo);
    populateSelect('refri-equipo',refriNames,'Seleccionar equipo…');
    // Limpieza refri
    populateChips('limp-refri-chips',state.refriLimpieza);
    // Acciones en ambos formularios
    const acOpts='<option value="">Seleccionar acción…</option>'+state.acciones.map(a=>`<option value="${a}">${a}</option>`).join('');
    document.getElementById('termo-accion').innerHTML=acOpts;
    document.getElementById('refri-accion').innerHTML=acOpts;
    // Etiquetadoras
    if (typeof renderEtiquetadoraDropdown === 'function') {
      renderEtiquetadoraDropdown();
    }
    if (typeof populateEtiquetadoraModelDropdown === 'function') {
      populateEtiquetadoraModelDropdown();
    }
    // Cargar Sugerencias
    if (data.sugerencias) {
      populateDatalist('list-termo-obs', data.sugerencias.termoObs || []);
      populateDatalist('list-cent-obs', data.sugerencias.centObs || []);
      populateDatalist('list-meson-obs', data.sugerencias.mesonObs || []);
      populateDatalist('list-refri-obs', data.sugerencias.refriObs || []);
      populateDatalist('list-limp-refri-obs', data.sugerencias.limpRefriObs || []);
      populateDatalist('list-conduct-obs', data.sugerencias.conductObs || []);
      populateDatalist('list-et-comentario', data.sugerencias.etComentario || []);
      populateDatalist('list-et-bitacora-desc', data.sugerencias.etBitacoraDesc || []);
      populateDatalist('list-cobas-obs', data.sugerencias.cobasObs || []);
    }
  }catch(e){
    console.warn('Error cargando maestros de la API, cargando datos locales de prueba...', e);
    showToast('⚠️ Usando datos de prueba locales (Modo Offline/Pruebas)','info');
    state.areas = ["Área Química", "Área Hematología", "Área Preanálisis", "Área Microbiología"];
    state.centrifugas = ["Centrífuga 1", "Centrífuga 2", "Centrífuga 3", "Centrífuga 4", "Centrífuga 5", "Centrífuga 18", "Centrífuga 19"];
    state.salas = ["Sala Procesos", "Sala Recepción", "Sala Toma Muestras"];
    state.acciones = ["Avisar a Coordinador", "Llamar a Soporte", "Reiniciar Equipo"];
    state.refrigeradores = [
      {equipo: "Refri 1 (2-8°C)", tempMin: 2, tempMax: 8, tipo: "Refrigerador"},
      {equipo: "Refri 2 (2-8°C)", tempMin: 2, tempMax: 8, tipo: "Refrigerador"},
      {equipo: "Congelador 1 (-20°C)", tempMin: -25, tempMax: -15, tipo: "Congelador"}
    ];
    state.refriLimpieza = ["Refri 1 (2-8°C)", "Refri 2 (2-8°C)", "Congelador 1 (-20°C)"];
    state.etiquetadoras = [
      {id: "ZD420-111", nombreReal: "ZD420-1", nombrePractico: "Rotuladora Preanálisis", modelo: "ZD420", tipoConexion: "USB", direccionIp: "No aplica", piso: "Piso 1", ubicacion: "Preanálisis", comentario: "Zebra ZD420 USB"},
      {id: "ZD421-222", nombreReal: "ZD421-1", nombrePractico: "Rotuladora Hematología", modelo: "ZD421", tipoConexion: "Ethernet", direccionIp: "10.10.1.50", piso: "Piso 1", ubicacion: "Hematología", comentario: "Zebra ZD421 Red"},
      {id: "ZD220-333", nombreReal: "ZD220-1", nombrePractico: "Rotuladora Microbiología", modelo: "ZD220", tipoConexion: "USB", direccionIp: "No aplica", piso: "Piso 2", ubicacion: "Microbiología", comentario: "Zebra ZD220 USB"}
    ];
    state.dashMaestros={areas:state.areas,centrifugas:state.centrifugas,salas:state.salas,refrigeradores:state.refrigeradores,refriLimpieza:state.refriLimpieza};
    
    populateSelect('termo-area',state.areas,'Seleccionar área…');
    populateSelect('admin-select',state.areas,'— Seleccionar —');
    populateChips('cent-chips',state.centrifugas);
    populateChips('meson-chips',state.salas);
    const refriNames=state.refrigeradores.map(r=>r.equipo);
    populateSelect('refri-equipo',refriNames,'Seleccionar equipo…');
    populateChips('limp-refri-chips',state.refriLimpieza);
    const acOpts='<option value="">Seleccionar acción…</option>'+state.acciones.map(a=>`<option value="${a}">${a}</option>`).join('');
    document.getElementById('termo-accion').innerHTML=acOpts;
    document.getElementById('refri-accion').innerHTML=acOpts;
    
    if (typeof renderEtiquetadoraDropdown === 'function') {
      renderEtiquetadoraDropdown();
    }
    if (typeof populateEtiquetadoraModelDropdown === 'function') {
      populateEtiquetadoraModelDropdown();
    }

    const fallbackSugerencias = {
      termoObs: ["Temperatura estable", "Se activa aire acondicionado", "Puerta abierta temporalmente"],
      centObs: ["Limpieza diaria conforme", "Rotor lubricado", "Capachos lavados"],
      mesonObs: ["Desinfección con alcohol 70%", "Mesón limpio"],
      refriObs: ["Temperatura dentro de rangos", "Control diario realizado"],
      limpRefriObs: ["Limpieza externa semanal realizada", "Bandejas organizadas"],
      conductObs: ["Medición conforme", "Filtro purgado"],
      etComentario: ["Zebra USB OK", "Zebra Ethernet configurada"],
      etBitacoraDesc: ["Limpieza de cabezal térmico", "Calibración de sensor", "Cambio de rollo de etiquetas Zebra"],
      cobasObs: ["Mantenimiento diario realizado", "Limpieza conforme", "Servicio técnico preventivo realizado"]
    };
    populateDatalist('list-termo-obs', fallbackSugerencias.termoObs);
    populateDatalist('list-cent-obs', fallbackSugerencias.centObs);
    populateDatalist('list-meson-obs', fallbackSugerencias.mesonObs);
    populateDatalist('list-refri-obs', fallbackSugerencias.refriObs);
    populateDatalist('list-limp-refri-obs', fallbackSugerencias.limpRefriObs);
    populateDatalist('list-conduct-obs', fallbackSugerencias.conductObs);
    populateDatalist('list-et-comentario', fallbackSugerencias.etComentario);
    populateDatalist('list-et-bitacora-desc', fallbackSugerencias.etBitacoraDesc);
    populateDatalist('list-cobas-obs', fallbackSugerencias.cobasObs);
    }
  })();
  return state.maestrosPromise;
}

function populateSelect(id,items,ph){const s=document.getElementById(id);s.innerHTML=`<option value="">${ph}</option>`+items.map(i=>`<option value="${i}">${i}</option>`).join('')}
function populateDatalist(id,items){const el=document.getElementById(id);if(el){el.innerHTML=items.map(i=>`<option value="${i}">`).join('')}}
function populateChips(id,items){const c=document.getElementById(id);c.innerHTML=items.map(i=>`<div class="chip-item" data-value="${i}" onclick="toggleChip(this)">${i}</div>`).join('')}
function toggleChip(el){el.classList.toggle('selected');const parentId=el.parentElement?el.parentElement.id:'';if(parentId==='cent-chips'&&typeof checkDuplicateCentrifugas==='function')checkDuplicateCentrifugas();else if(parentId==='meson-chips'&&typeof checkDuplicateMesones==='function')checkDuplicateMesones();}
function centNum(name){const m=name.match(/(\d+)/);return m?parseInt(m[1]):0}
function getSelectedChips(id){return Array.from(document.querySelectorAll(`#${id} .chip-item.selected`)).map(i=>i.dataset.value)}
function toggleGrupoPreanalisis(){const btn=document.getElementById('btn-grupo-preanalisis');const active=btn.classList.toggle('active');const chips=document.querySelectorAll('#cent-chips .chip-item');chips.forEach(c=>{const v=c.dataset.value;const num=centNum(v);const isP=PREANALISIS.includes(num);if(isP){if(active){c.classList.add('selected')}else{c.classList.remove('selected')}}});if(typeof checkDuplicateCentrifugas==='function')checkDuplicateCentrifugas();}

// URL params
function checkUrlParams(){
  const p=new URLSearchParams(window.location.search);
  let area=p.get('area'),
      sala=p.get('sala'),
      cent=p.get('centrifuga'),
      grupo=p.get('grupo'),
      refri=p.get('refri'),
      limprefri=p.get('limprefri'),
      modulo=p.get('modulo'),
      etName=p.get('etiquetadora'),
      cobasEq=p.get('cobas');
      
  if (window.QR_PARAMS) {
    if (!area) area = window.QR_PARAMS.area;
    if (!sala) sala = window.QR_PARAMS.sala;
    if (!cent) cent = window.QR_PARAMS.centrifuga;
    if (!grupo) grupo = window.QR_PARAMS.grupo;
    if (!refri) refri = window.QR_PARAMS.refri;
    if (!limprefri) limprefri = window.QR_PARAMS.limprefri;
    if (!modulo) modulo = window.QR_PARAMS.modulo;
    if (!etName) etName = window.QR_PARAMS.etiquetadora;
    if (!cobasEq) cobasEq = window.QR_PARAMS.cobas;
  }

  if(area){
    document.getElementById('area-prefill-name').textContent=area;
    document.getElementById('area-prefill-indicator').style.display='block';
    const w=setInterval(()=>{
      const s=document.getElementById('termo-area');
      if(Array.from(s.options).find(o=>o.value===area)){
        s.value=area;
        clearInterval(w);
      }
    },300);
    navigateTo('termo');
  }
  if(sala){
    const w=setInterval(()=>{
      const chips=document.querySelectorAll('#meson-chips .chip-item');
      if(chips.length){
        chips.forEach(c=>{
          if(c.dataset.value===sala) c.classList.add('selected');
        });
        clearInterval(w);
      }
    },300);
    navigateTo('mesones');
  }
  if(cent){
    const w=setInterval(()=>{
      const chips=document.querySelectorAll('#cent-chips .chip-item');
      if(chips.length){
        chips.forEach(c=>{
          if(c.dataset.value===cent) c.classList.add('selected');
        });
        clearInterval(w);
      }
    },300);
    navigateTo('centrifugas');
  }
  if(grupo==='preanalisis'){
    const w=setInterval(()=>{
      const chips=document.querySelectorAll('#cent-chips .chip-item');
      if(chips.length){
        document.getElementById('btn-grupo-preanalisis').classList.add('active');
        chips.forEach(c=>{
          if(PREANALISIS.includes(centNum(c.dataset.value))) c.classList.add('selected');
        });
        clearInterval(w);
      }
    },300);
    navigateTo('centrifugas');
  }
  if(refri){
    const w=setInterval(()=>{
      const s=document.getElementById('refri-equipo');
      if(Array.from(s.options).find(o=>o.value===refri)){
        s.value=refri;
        checkRangoRefri();
        clearInterval(w);
      }
    },300);
    navigateTo('refri-temp');
  }
  if(limprefri){
    const w=setInterval(()=>{
      const chips=document.querySelectorAll('#limp-refri-chips .chip-item');
      if(chips.length){
        chips.forEach(c=>{
          if(c.dataset.value===limprefri) c.classList.add('selected');
        });
        clearInterval(w);
      }
    },300);
    navigateTo('limp-refri');
  }
  if(modulo==='conductividad'){
    navigateTo('conductividad');
  }
  if(modulo==='dxh900'){
    navigateTo('dxh900');
  }
  if(etName){
    document.getElementById('etiquetadora-prefill-name').textContent=etName;
    document.getElementById('etiquetadora-prefill-indicator').style.display='block';
    const w=setInterval(()=>{
      if(state.etiquetadoras&&state.etiquetadoras.length){
        const found=state.etiquetadoras.find(o=>o.nombreReal===etName);
        if(found){
          const displayText=`${found.nombreReal} - ${found.piso} - ${found.ubicacion}`;
          document.getElementById('etiquetadora-search-input').value=displayText;
          document.getElementById('btn-clear-et-search').style.display='block';
          const s=document.getElementById('etiquetadora-select');
          s.value=etName;
          onEtiquetadoraChange();
          clearInterval(w);
        }else{
          clearInterval(w);
        }
      }
    },300);
    navigateTo('etiquetadoras');
  }
  if(cobasEq){
    const w=setInterval(()=>{
      const s=document.getElementById('cobas-equipo');
      if(Array.from(s.options).find(o=>o.value===cobasEq)){
        s.value=cobasEq;
        clearInterval(w);
      }
    },300);
    navigateTo('cobas');
  }
  if(modulo==='cobas'){
    navigateTo('cobas');
  }
  if(modulo==='elim-muestras'){
    navigateTo('elim-muestras');
  }
}

// Dashboard cache & prefetch
function prefetchDashboard(){
  const mes=state.dashMes,anio=state.dashAnio;
  const key=mes+'-'+anio;
  Promise.all([apiGet({action:'getRegistros',mes:mes,anio:anio}),apiGet({action:'getRevisiones',mes:mes,anio:anio})]).then(function(results){
    const reg=results[0],rev=results[1];
    state.dashCache={key:key,data:reg,rev:rev,timestamp:Date.now()};
  }).catch(function(){/* silent fail */});
}
function getCacheAge(){
  if(!state.dashCache)return Infinity;
  return(Date.now()-state.dashCache.timestamp)/1000/60; // minutes
}
function updateCacheIndicator(){
  const el=document.getElementById('dash-cache-indicator');
  if(!el)return;
  if(!state.dashCache){el.style.display='none';return;}
  const mins=Math.round(getCacheAge());
  if(mins<1){el.textContent='✓ Actualizado';el.className='cache-indicator cache-fresh'}
  else if(mins<5){el.textContent='hace '+mins+' min';el.className='cache-indicator cache-fresh'}
  else{el.textContent='hace '+mins+' min';el.className='cache-indicator cache-stale'}
  el.style.display='inline-block';
}
