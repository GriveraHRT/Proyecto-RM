// ============================================================
// PROYECTO TA — app.js
// ============================================================

const API_URL = 'https://script.google.com/macros/s/AKfycbw6t4mAFalwFxt32CX89EE7SQi1Aa9Yo64x6_QID9OaxzaleMTaUZAVjMAZoEFVFFDwDA/exec';

// ── Estado Global ────────────────────────────────────────────
const state = {
  areas: [], centrifugas: [],
  ampm: 'AM', qrInstance: null,
  dashMes: new Date().getMonth() + 1,
  dashAnio: new Date().getFullYear()
};

// ── Utilidades ───────────────────────────────────────────────
function today() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `show toast-${type}`;
  setTimeout(() => { t.className = ''; }, 3200);
}

function setLoading(btnId, spinnerId, textId, loading, text) {
  document.getElementById(btnId).disabled = loading;
  document.getElementById(spinnerId).classList.toggle('visible', loading);
  document.getElementById(textId).style.display = loading ? 'none' : '';
}

async function apiGet(params) {
  const url = new URL(API_URL);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const r = await fetch(url.toString());
  return r.json();
}

async function apiPost(body) {
  const r = await fetch(API_URL, { method: 'POST', body: JSON.stringify(body) });
  return r.json();
}

// ── Reloj ────────────────────────────────────────────────────
function updateClock() {
  const now = new Date();
  const h = now.getHours(), m = now.getMinutes();
  const ampm = h < 12 ? 'AM' : 'PM';
  document.getElementById('clock-time').textContent =
    String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0');
  const badge = document.getElementById('header-ampm-badge');
  badge.textContent = ampm;
  badge.className = `ampm-${ampm}`;
  const dias = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  document.getElementById('clock-date').textContent =
    `${dias[now.getDay()]} ${now.getDate()} ${meses[now.getMonth()]} ${now.getFullYear()}`;
}
setInterval(updateClock, 1000);
updateClock();

// ── Navegación ───────────────────────────────────────────────
function navigateTo(sectionId) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('section-' + sectionId).classList.add('active');
  document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');
  if (sectionId === 'dashboard') loadDashboard();
}

// ── Cargar Maestros ──────────────────────────────────────────
async function loadMaestros() {
  try {
    const [areas, cents] = await Promise.all([
      apiGet({ action: 'getAreas' }),
      apiGet({ action: 'getCentrifugas' })
    ]);
    state.areas = areas;
    state.centrifugas = cents;
    populateSelect('termo-area', areas, 'Seleccionar área…');
    populateSelect('limp-sala', areas, 'Seleccionar sala…');
    populateSelect('admin-area', areas, '— Seleccionar —');
    populateSelect('cent-nombre', cents, 'Seleccionar centrífuga…');
  } catch (e) {
    showToast('Error cargando maestros. Verifica la URL del API.', 'error');
  }
}

function populateSelect(id, items, placeholder) {
  const sel = document.getElementById(id);
  sel.innerHTML = `<option value="">${placeholder}</option>` +
    items.map(i => `<option value="${i}">${i}</option>`).join('');
}

// ── URL Params (QR pre-fill) ──────────────────────────────────
function checkUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const area = params.get('area');
  if (area) {
    document.getElementById('area-prefill-name').textContent = area;
    document.getElementById('area-prefill-indicator').style.display = 'block';
    const waitSelect = setInterval(() => {
      const sel = document.getElementById('termo-area');
      const opt = Array.from(sel.options).find(o => o.value === area);
      if (opt) { sel.value = area; clearInterval(waitSelect); }
    }, 300);
  }
}

// ── AM/PM ─────────────────────────────────────────────────────
function setAmPm(val) {
  state.ampm = val;
  document.getElementById('btn-am').className =
    'ampm-btn' + (val === 'AM' ? ' selected-AM' : '');
  document.getElementById('btn-pm').className =
    'ampm-btn' + (val === 'PM' ? ' selected-PM' : '');
}

function autoSetAmPm() {
  const ampm = new Date().getHours() < 12 ? 'AM' : 'PM';
  setAmPm(ampm);
}

// ── Validación de Rangos (Termo) ──────────────────────────────
function checkRangos() {
  const temp = parseFloat(document.getElementById('termo-temp').value);
  const hum  = parseFloat(document.getElementById('termo-hum').value);
  const alertEl = document.getElementById('alert-rangos');
  const tempInfo = document.getElementById('temp-range-info');
  const humInfo  = document.getElementById('hum-range-info');
  let outOfRange = false;

  if (!isNaN(temp)) {
    const ok = temp >= 18 && temp <= 24;
    tempInfo.className = 'range-info ' + (ok ? 'range-ok' : 'range-err');
    tempInfo.textContent = ok ? `✓ ${temp} °C — dentro de rango` : `✗ ${temp} °C — fuera de rango (18–24 °C)`;
    if (!ok) outOfRange = true;
  }
  if (!isNaN(hum)) {
    const ok = hum >= 20 && hum <= 70;
    humInfo.className = 'range-info ' + (ok ? 'range-ok' : 'range-err');
    humInfo.textContent = ok ? `✓ ${hum}% — dentro de rango` : `✗ ${hum}% — fuera de rango (20–70%)`;
    if (!ok) outOfRange = true;
  }
  alertEl.classList.toggle('visible', outOfRange);
}

// ── Info Centrífuga dinámica ──────────────────────────────────
const CENT_INFO = {
  'Diaria': {
    title: '🔁 Mantención Diaria',
    body: 'Realizar <strong>limpieza de superficie interior y exterior</strong> de la centrífuga con paño húmedo.'
  },
  'Semanal': {
    title: '📅 Mantención Semanal',
    body: '<strong>Lavar capachos</strong> con solución jabonosa. <strong>Desinfectar rotor, capachos y superficies</strong> con alcohol 70% o Cloro 0.5%.'
  },
  'Anual': {
    title: '🔧 Mantención Anual / Según Necesidad',
    body: '<strong>Desenchufar la centrífuga</strong> antes de intervenir. <strong>Engrasar capachos</strong>. Realizar mantención <strong>preventiva y/o reparativa</strong> completa.'
  }
};

function updateInfoCentrifuga() {
  const tipo = document.getElementById('cent-tipo').value;
  const key  = tipo === 'Anual' ? 'Anual' : tipo;
  const info = CENT_INFO[key] || CENT_INFO['Diaria'];
  document.getElementById('info-cent-title').textContent = info.title;
  document.getElementById('info-cent-body').innerHTML  = info.body;
  document.getElementById('info-centrifuga').classList.add('visible');
}

// ── Formularios ──────────────────────────────────────────────
document.getElementById('form-termo').addEventListener('submit', async e => {
  e.preventDefault();
  setLoading('btn-termo-submit','spinner-termo','btn-termo-text', true);
  try {
    const res = await apiPost({
      action: 'saveTermo',
      fecha: document.getElementById('termo-fecha').value,
      ampm: state.ampm,
      area: document.getElementById('termo-area').value,
      temperatura: document.getElementById('termo-temp').value,
      humedad: document.getElementById('termo-hum').value,
      responsable: document.getElementById('termo-resp').value,
      observaciones: document.getElementById('termo-obs').value
    });
    if (res.success) {
      showToast('✅ ' + res.message);
      e.target.reset();
      document.getElementById('termo-fecha').value = today();
      document.getElementById('alert-rangos').classList.remove('visible');
      document.getElementById('temp-range-info').className = 'range-info';
      document.getElementById('hum-range-info').className = 'range-info';
      autoSetAmPm();
      checkUrlParams();
    } else {
      showToast('❌ ' + res.error, 'error');
    }
  } catch (err) {
    showToast('❌ Error de conexión', 'error');
  }
  setLoading('btn-termo-submit','spinner-termo','btn-termo-text', false);
});

document.getElementById('form-centrifugas').addEventListener('submit', async e => {
  e.preventDefault();
  setLoading('btn-cent-submit','spinner-cent','btn-cent-text', true);
  try {
    const res = await apiPost({
      action: 'saveCentrifuga',
      fecha: document.getElementById('cent-fecha').value,
      centrifuga: document.getElementById('cent-nombre').value,
      responsable: document.getElementById('cent-resp').value,
      tipo_mantencion: document.getElementById('cent-tipo').value,
      observaciones: document.getElementById('cent-obs').value
    });
    if (res.success) {
      showToast('✅ ' + res.message);
      e.target.reset();
      document.getElementById('cent-fecha').value = today();
      document.getElementById('cent-tipo').value = 'Diaria';
      updateInfoCentrifuga();
    } else {
      showToast('❌ ' + res.error, 'error');
    }
  } catch (err) {
    showToast('❌ Error de conexión', 'error');
  }
  setLoading('btn-cent-submit','spinner-cent','btn-cent-text', false);
});

document.getElementById('form-limpieza').addEventListener('submit', async e => {
  e.preventDefault();
  setLoading('btn-limp-submit','spinner-limp','btn-limp-text', true);
  try {
    const res = await apiPost({
      action: 'saveLimpieza',
      fecha: document.getElementById('limp-fecha').value,
      sala: document.getElementById('limp-sala').value,
      responsable: document.getElementById('limp-resp').value,
      observaciones: document.getElementById('limp-obs').value
    });
    if (res.success) {
      showToast('✅ ' + res.message);
      e.target.reset();
      document.getElementById('limp-fecha').value = today();
    } else {
      showToast('❌ ' + res.error, 'error');
    }
  } catch (err) {
    showToast('❌ Error de conexión', 'error');
  }
  setLoading('btn-limp-submit','spinner-limp','btn-limp-text', false);
});

// ── Dashboard ─────────────────────────────────────────────────
function initDashSelectors() {
  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                 'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const selMes = document.getElementById('dash-mes');
  selMes.innerHTML = meses.map((m,i) =>
    `<option value="${i+1}"${i+1===state.dashMes?' selected':''}>${m}</option>`).join('');
  const selAnio = document.getElementById('dash-anio');
  const anioActual = new Date().getFullYear();
  selAnio.innerHTML = [anioActual-1, anioActual, anioActual+1].map(a =>
    `<option value="${a}"${a===state.dashAnio?' selected':''}>${a}</option>`).join('');
}

function cambiarMes(delta) {
  state.dashMes += delta;
  if (state.dashMes > 12) { state.dashMes = 1;  state.dashAnio++; }
  if (state.dashMes < 1)  { state.dashMes = 12; state.dashAnio--; }
  initDashSelectors();
  loadDashboard();
}

async function loadDashboard() {
  state.dashMes  = parseInt(document.getElementById('dash-mes').value);
  state.dashAnio = parseInt(document.getElementById('dash-anio').value);
  document.getElementById('dash-loading').style.display = 'block';
  document.getElementById('dash-tables').innerHTML = '';
  document.getElementById('dash-alerts-container').innerHTML = '';

  try {
    const [reg, rev] = await Promise.all([
      apiGet({ action: 'getRegistros', mes: state.dashMes, anio: state.dashAnio }),
      apiGet({ action: 'getRevisiones', mes: state.dashMes, anio: state.dashAnio })
    ]);
    document.getElementById('stat-termo').textContent = reg.termo.length;
    document.getElementById('stat-cent').textContent  = reg.centrifugas.length;
    document.getElementById('stat-limp').textContent  = reg.limpieza.length;
    renderAlerts(reg);
    renderRevisionBadge(rev);
    renderTables(reg);
  } catch (err) {
    showToast('❌ Error cargando dashboard', 'error');
  }
  document.getElementById('dash-loading').style.display = 'none';
}

function getDiasHasta(mes, anio) {
  const hoy = new Date();
  const diasEnMes = new Date(anio, mes, 0).getDate();
  if (anio === hoy.getFullYear() && mes === (hoy.getMonth() + 1)) return hoy.getDate();
  return diasEnMes;
}

function renderAlerts(reg) {
  const diasHasta = getDiasHasta(state.dashMes, state.dashAnio);
  const termoAM = new Set(), termoPM = new Set();
  reg.termo.forEach(r => { (r.ampm==='AM' ? termoAM : termoPM).add(parseInt(r.dia)); });
  const diasCent = new Set(reg.centrifugas.map(r => parseInt(r.dia)));
  const diasLimp = new Set(reg.limpieza.map(r => parseInt(r.dia)));

  const faltanTermo=[], faltanCent=[], faltanLimp=[];
  for (let d=1; d<=diasHasta; d++) {
    if (!termoAM.has(d) || !termoPM.has(d)) faltanTermo.push(d);
    if (!diasCent.has(d)) faltanCent.push(d);
    if (!diasLimp.has(d)) faltanLimp.push(d);
  }

  const cont = document.getElementById('dash-alerts-container');
  if (!faltanTermo.length && !faltanCent.length && !faltanLimp.length) {
    cont.innerHTML = `<div class="alert-banner alert-success visible" style="margin-bottom:16px;">
      ✅ <strong>Sin alertas.</strong> Todos los registros del período están completos.</div>`;
    return;
  }

  let html = `<div class="card card-sm" style="margin-bottom:16px;">
    <div class="missing-title">⚠️ Registros Faltantes (días 1–${diasHasta})</div>`;

  if (faltanTermo.length) html += alertChips('🌡️ Temp/Hum (AM o PM)', faltanTermo, diasHasta);
  if (faltanCent.length)  html += alertChips('⚙️ Centrífugas', faltanCent, diasHasta);
  if (faltanLimp.length)  html += alertChips('🧹 Limpieza', faltanLimp, diasHasta);
  html += '</div>';
  cont.innerHTML = html;
}

function alertChips(label, diasFaltan, total) {
  const chips = [];
  for (let d=1; d<=total; d++) {
    const miss = diasFaltan.includes(d);
    chips.push(`<span class="day-chip ${miss?'chip-missing':'chip-ok'}">${d}</span>`);
  }
  return `<div class="missing-section">
    <div class="missing-title">${label}</div>
    <div class="missing-grid">${chips.join('')}</div>
  </div>`;
}

function renderRevisionBadge(rev) {
  const badge = document.getElementById('revision-badge');
  if (rev.estado === 'revisado') {
    badge.className = 'revision-badge badge-revisado';
    badge.textContent = '✅ Revisado';
  } else if (rev.estado === 'listo_revision') {
    badge.className = 'revision-badge badge-listo';
    badge.textContent = `⏳ Listo para Revisión (${rev.iniciales_n1||''})`;
  } else {
    badge.className = 'revision-badge badge-pendiente';
    badge.textContent = '⏳ Pendiente';
  }
}

function renderTables(reg) {
  const cont = document.getElementById('dash-tables');
  cont.innerHTML =
    renderTableCard('🌡️ Temperatura & Humedad', reg.termo,
      ['Día','AM/PM','Área','Temp°','Hum%','Resp','Obs'],
      r => [r.dia,r.ampm,r.area,r.temperatura,r.humedad,r.responsable,r.observaciones]) +
    renderTableCard('⚙️ Centrífugas', reg.centrifugas,
      ['Día','Centrífuga','Resp','Tipo','Obs'],
      r => [r.dia,r.centrifuga,r.responsable,r.tipo_mantencion,r.observaciones]) +
    renderTableCard('🧹 Limpieza Mesones', reg.limpieza,
      ['Día','Sala','Resp','Obs'],
      r => [r.dia,r.sala,r.responsable,r.observaciones]);
}

function renderTableCard(title, rows, headers, mapper) {
  if (!rows.length) return `<div class="card card-sm" style="margin-bottom:16px;">
    <strong>${title}</strong>
    <div style="color:var(--text-dim);font-size:13px;margin-top:8px;">Sin registros en este período.</div></div>`;
  const thead = `<tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr>`;
  const tbody = rows.map(r => `<tr>${mapper(r).map(v=>`<td>${v??''}</td>`).join('')}</tr>`).join('');
  return `<div class="card" style="margin-bottom:16px;padding:16px 12px;">
    <strong style="font-family:'Outfit';font-size:15px;">${title}</strong>
    <span style="color:var(--text-dim);font-size:12px;margin-left:8px;">${rows.length} registros</span>
    <div class="records-table-wrap" style="margin-top:12px;">
      <table class="records-table"><thead>${thead}</thead><tbody>${tbody}</tbody></table>
    </div></div>`;
}

// ── Modales de Revisión ───────────────────────────────────────
function openModalRevision() {
  document.getElementById('modal-revision').style.display = 'block';
  document.getElementById('modal-revisado').style.display = 'none';
  document.getElementById('modal-overlay').classList.add('active');
  document.getElementById('modal-error1').classList.remove('visible');
}
function openModalRevisado() {
  document.getElementById('modal-revisado').style.display = 'block';
  document.getElementById('modal-revision').style.display = 'none';
  document.getElementById('modal-overlay').classList.add('active');
  document.getElementById('modal-error2').classList.remove('visible');
}
function closeModal(e) {
  if (e && e.target !== document.getElementById('modal-overlay')) return;
  document.getElementById('modal-overlay').classList.remove('active');
}

async function submitRevision() {
  const pwd = document.getElementById('modal-pwd1').value;
  const ini = document.getElementById('modal-ini').value.trim().toUpperCase();
  const errEl = document.getElementById('modal-error1');
  errEl.classList.remove('visible');

  document.getElementById('spinner-rev1').classList.add('visible');
  document.getElementById('btn-rev1-text').style.display = 'none';
  try {
    const res = await apiPost({
      action: 'marcarListoRevision',
      password: pwd, iniciales: ini,
      mes: state.dashMes, anio: state.dashAnio
    });
    if (res.success) {
      showToast('✅ ' + res.message);
      closeModal({ target: document.getElementById('modal-overlay') });
      loadDashboard();
    } else {
      errEl.textContent = res.error;
      errEl.classList.add('visible');
    }
  } catch(err) {
    errEl.textContent = 'Error de conexión.';
    errEl.classList.add('visible');
  }
  document.getElementById('spinner-rev1').classList.remove('visible');
  document.getElementById('btn-rev1-text').style.display = '';
}

async function submitRevisado() {
  const usr = document.getElementById('modal-usr2').value;
  const pwd = document.getElementById('modal-pwd2').value;
  const errEl = document.getElementById('modal-error2');
  errEl.classList.remove('visible');

  document.getElementById('spinner-rev2').classList.add('visible');
  document.getElementById('btn-rev2-text').style.display = 'none';
  try {
    const res = await apiPost({
      action: 'marcarRevisado',
      usuario: usr, password: pwd,
      mes: state.dashMes, anio: state.dashAnio
    });
    if (res.success) {
      showToast('✅ ' + res.message);
      closeModal({ target: document.getElementById('modal-overlay') });
      loadDashboard();
    } else {
      errEl.textContent = res.error;
      errEl.classList.add('visible');
    }
  } catch(err) {
    errEl.textContent = 'Error de conexión.';
    errEl.classList.add('visible');
  }
  document.getElementById('spinner-rev2').classList.remove('visible');
  document.getElementById('btn-rev2-text').style.display = '';
}

// ── Generador QR ─────────────────────────────────────────────
function generateQR() {
  const area = document.getElementById('admin-area').value;
  if (!area) return;
  const wrap = document.getElementById('qr-canvas-wrap');
  const canvas = document.getElementById('qr-canvas');
  canvas.innerHTML = '';
  const baseUrl = window.location.origin + window.location.pathname;
  const url = `${baseUrl}?area=${encodeURIComponent(area)}`;
  if (state.qrInstance) { try { state.qrInstance.clear(); } catch(e){} }
  state.qrInstance = new QRCode(canvas, {
    text: url, width: 220, height: 220,
    colorDark: '#000000', colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.H
  });
  wrap.classList.add('visible');
  document.getElementById('qr-url-text').textContent = url;
  document.getElementById('qr-url-text').style.display = 'block';
  document.getElementById('btn-print-qr').style.display = 'inline-flex';
}

function printQR() {
  const area = document.getElementById('admin-area').value;
  const img = document.querySelector('#qr-canvas img');
  if (!img) return;
  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html><html><head><title>QR - ${area}</title>
    <style>body{font-family:sans-serif;text-align:center;padding:40px;}
    h2{margin-bottom:16px;}p{color:#555;font-size:13px;margin-top:12px;}</style></head>
    <body><h2>🔬 Proyecto TA</h2><h3>${area}</h3>
    <img src="${img.src}" style="width:200px;height:200px;" />
    <p>Escanear para registrar Temperatura/Humedad</p>
    <script>window.onload=()=>{window.print();}<\/script></body></html>`);
  w.document.close();
}

// ── Init ──────────────────────────────────────────────────────
async function init() {
  // Fechas por defecto
  document.getElementById('termo-fecha').value = today();
  document.getElementById('cent-fecha').value  = today();
  document.getElementById('limp-fecha').value  = today();
  autoSetAmPm();
  updateInfoCentrifuga();
  initDashSelectors();
  await loadMaestros();
  checkUrlParams();
}

init();
