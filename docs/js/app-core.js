const API_URL='https://script.google.com/macros/s/AKfycbxuqcui0-hjJ721uMWZk3w-4l2fVCaBWQgdMJqVMb5Pno339Jqetq4r62p3-1gGBUvFOg/exec';
const PREANALISIS=[1,2,3,4,5,18];
const state={areas:[],centrifugas:[],salas:[],ampm:'AM',qrInstance:null,qrTab:'areas',dashMes:new Date().getMonth()+1,dashAnio:new Date().getFullYear(),dashTab:'diario',dashData:null,dashMaestros:null};

function today(){return new Date().toISOString().split('T')[0]}
function showToast(m,t='success'){const el=document.getElementById('toast');el.textContent=m;el.className=`show toast-${t}`;setTimeout(()=>{el.className=''},3200)}
function setLoading(b,s,t,l){document.getElementById(b).disabled=l;document.getElementById(s).classList.toggle('visible',l);document.getElementById(t).style.display=l?'none':''}
async function apiGet(p){const u=new URL(API_URL);Object.entries(p).forEach(([k,v])=>u.searchParams.set(k,v));const r=await fetch(u.toString(),{redirect:'follow'});if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json()}
async function apiPost(b){const r=await fetch(API_URL,{method:'POST',redirect:'follow',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(b)});if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json()}

// Clock
function updateClock(){const n=new Date(),h=n.getHours(),m=n.getMinutes(),ap=h<12?'AM':'PM';document.getElementById('clock-time').textContent=String(h).padStart(2,'0')+':'+String(m).padStart(2,'0');const b=document.getElementById('header-ampm-badge');b.textContent=ap;b.className=`ampm-${ap}`;const d=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'],ms=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];document.getElementById('clock-date').textContent=`${d[n.getDay()]} ${n.getDate()} ${ms[n.getMonth()]} ${n.getFullYear()}`}
setInterval(updateClock,1000);updateClock();

// Theme
function toggleTheme(){const d=document.documentElement,dark=d.getAttribute('data-theme')==='dark';d.setAttribute('data-theme',dark?'':'dark');document.getElementById('theme-toggle').textContent=dark?'☀️':'🌙';localStorage.setItem('theme',dark?'light':'dark');document.querySelector('meta[name="theme-color"]').content=dark?'#F0F4F8':'#0B1426'}
(function(){const t=localStorage.getItem('theme');if(t==='dark'){document.documentElement.setAttribute('data-theme','dark');document.getElementById('theme-toggle').textContent='🌙';document.querySelector('meta[name="theme-color"]').content='#0B1426'}})();

// Navigation
function navigateTo(s){document.querySelectorAll('.section').forEach(el=>el.classList.remove('active'));document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));document.getElementById('section-'+s).classList.add('active');document.querySelector(`[data-section="${s}"]`).classList.add('active');if(s==='dashboard')loadDashboard()}

// AM/PM
function setAmPm(v){state.ampm=v;document.getElementById('btn-am').className='ampm-btn'+(v==='AM'?' selected-AM':'');document.getElementById('btn-pm').className='ampm-btn'+(v==='PM'?' selected-PM':'')}
function autoSetAmPm(){setAmPm(new Date().getHours()<12?'AM':'PM')}

// Range check
function checkRangos(){const t=parseFloat(document.getElementById('termo-temp').value),h=parseFloat(document.getElementById('termo-hum').value),a=document.getElementById('alert-rangos'),ti=document.getElementById('temp-range-info'),hi=document.getElementById('hum-range-info');let out=false;if(!isNaN(t)){const ok=t>=18&&t<=24;ti.className='range-info '+(ok?'range-ok':'range-err');ti.textContent=ok?`✓ ${t} °C — dentro de rango`:`✗ ${t} °C — fuera de rango (18–24 °C)`;if(!ok)out=true}if(!isNaN(h)){const ok=h>=20&&h<=70;hi.className='range-info '+(ok?'range-ok':'range-err');hi.textContent=ok?`✓ ${h}% — dentro de rango`:`✗ ${h}% — fuera de rango (20–70%)`;if(!ok)out=true}a.classList.toggle('visible',out)}
function resetRangos(){document.getElementById('temp-range-info').className='range-info';document.getElementById('temp-range-info').textContent='Rango aceptable: 18–24 °C';document.getElementById('hum-range-info').className='range-info';document.getElementById('hum-range-info').textContent='Rango aceptable: 20–70 %';document.getElementById('alert-rangos').classList.remove('visible')}

// Centrifuga info
const CENT_INFO={Diaria:{title:'🔁 Mantención Diaria',body:'Realizar <strong>limpieza de superficie interior y exterior</strong> de la centrífuga con paño húmedo.'},Semanal:{title:'📅 Mantención Semanal',body:'<strong>Lavar capachos</strong> con solución jabonosa. <strong>Desinfectar rotor, capachos y superficies</strong> con alcohol 70% o Cloro 0.5%.'},Anual:{title:'🔧 Mantención Anual / Según Necesidad',body:'<strong>Desenchufar la centrífuga</strong> antes de intervenir. <strong>Engrasar capachos</strong>. Realizar mantención <strong>preventiva y/o reparativa</strong> completa.'}};
function updateInfoCentrifuga(){const t=document.getElementById('cent-tipo').value,i=CENT_INFO[t]||CENT_INFO.Diaria;document.getElementById('info-cent-title').textContent=i.title;document.getElementById('info-cent-body').innerHTML=i.body;document.getElementById('info-centrifuga').classList.add('visible')}

// Load masters
async function loadMaestros(){try{const[areas,cents,salas]=await Promise.all([apiGet({action:'getAreas'}),apiGet({action:'getCentrifugas'}),apiGet({action:'getSalas'})]);state.areas=areas;state.centrifugas=cents;state.salas=salas;populateSelect('termo-area',areas,'Seleccionar área…');populateSelect('admin-select',areas,'— Seleccionar —');populateChips('cent-chips',cents);populateChips('meson-chips',salas);state.dashMaestros={areas,centrifugas:cents,salas}}catch(e){showToast('Error cargando maestros.','error')}}
function populateSelect(id,items,ph){const s=document.getElementById(id);s.innerHTML=`<option value="">${ph}</option>`+items.map(i=>`<option value="${i}">${i}</option>`).join('')}
function populateChips(id,items){const c=document.getElementById(id);c.innerHTML=items.map(i=>`<div class="chip-item" data-value="${i}" onclick="toggleChip(this)">${i}</div>`).join('')}
function toggleChip(el){el.classList.toggle('selected')}
function centNum(name){const m=name.match(/(\d+)/);return m?parseInt(m[1]):0}
function getSelectedChips(id){return Array.from(document.querySelectorAll(`#${id} .chip-item.selected`)).map(i=>i.dataset.value)}
function toggleGrupoPreanalisis(){const btn=document.getElementById('btn-grupo-preanalisis');const active=btn.classList.toggle('active');const chips=document.querySelectorAll('#cent-chips .chip-item');chips.forEach(c=>{const v=c.dataset.value;const num=centNum(v);const isP=PREANALISIS.includes(num);if(isP){if(active){c.classList.add('selected')}else{c.classList.remove('selected')}}})}

// URL params
function checkUrlParams(){const p=new URLSearchParams(window.location.search);const area=p.get('area'),sala=p.get('sala'),cent=p.get('centrifuga'),grupo=p.get('grupo');if(area){document.getElementById('area-prefill-name').textContent=area;document.getElementById('area-prefill-indicator').style.display='block';const w=setInterval(()=>{const s=document.getElementById('termo-area');if(Array.from(s.options).find(o=>o.value===area)){s.value=area;clearInterval(w)}},300);navigateTo('termo')}if(sala){const w=setInterval(()=>{const chips=document.querySelectorAll('#meson-chips .chip-item');if(chips.length){chips.forEach(c=>{if(c.dataset.value===sala)c.classList.add('selected')});clearInterval(w)}},300);navigateTo('mesones')}if(cent){const w=setInterval(()=>{const chips=document.querySelectorAll('#cent-chips .chip-item');if(chips.length){chips.forEach(c=>{if(c.dataset.value===cent)c.classList.add('selected')});clearInterval(w)}},300);navigateTo('centrifugas')}if(grupo==='preanalisis'){const w=setInterval(()=>{const chips=document.querySelectorAll('#cent-chips .chip-item');if(chips.length){document.getElementById('btn-grupo-preanalisis').classList.add('active');chips.forEach(c=>{if(PREANALISIS.includes(centNum(c.dataset.value)))c.classList.add('selected')});clearInterval(w)}},300);navigateTo('centrifugas')}}
