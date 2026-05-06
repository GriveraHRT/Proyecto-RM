// ============================================================
// PROYECTO TA — Laboratorio Clínico Hospital de Talca
// Backend: Google Apps Script
// ============================================================

const EMAIL_ADDRESS = 'grivera@hospitaldetalca.cl';
const PASSWORD_N1   = 'HRT123';
const PASSWORD_N2   = 'HRT321';
const USUARIO_N2    = 'admin';

const SHEETS = {
  AREAS:       'Areas_Maestro',
  CENTRIFUGAS: 'Centrifugas_Maestro',
  TERMO:       'Registro_Termo',
  CENT_REG:    'Registro_Centrifugas',
  LIMPIEZA:    'Registro_Limpieza',
  REVISIONES:  'Revisiones'
};

// ── Helpers ──────────────────────────────────────────────────

function getSpreadsheet() {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  return SpreadsheetApp.openById(id);
}

function getSheet(name) {
  return getSpreadsheet().getSheetByName(name);
}

function parseFecha(fechaStr) {
  // Accepts "YYYY-MM-DD"
  const p = fechaStr.split('-');
  return { dia: parseInt(p[2]), mes: parseInt(p[1]), anio: parseInt(p[0]) };
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Router ───────────────────────────────────────────────────

function doGet(e) {
  const action = e.parameter.action;
  try {
    switch (action) {
      case 'getAreas':       return jsonResponse(getAreas());
      case 'getCentrifugas': return jsonResponse(getCentrifugas());
      case 'getRegistros':   return jsonResponse(getRegistros(e.parameter.mes, e.parameter.anio));
      case 'getRevisiones':  return jsonResponse(getRevision(e.parameter.mes, e.parameter.anio));
      case 'SETUP_INIT_TA':  return jsonResponse(setup());
      default:               return jsonResponse({ error: 'Acción no reconocida: ' + action });
    }
  } catch (err) {
    return jsonResponse({ error: err.toString() });
  }
}

function doPost(e) {
  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonResponse({ error: 'JSON inválido: ' + err.toString() });
  }
  try {
    switch (data.action) {
      case 'saveTermo':           return jsonResponse(saveTermo(data));
      case 'saveCentrifuga':      return jsonResponse(saveCentrifuga(data));
      case 'saveLimpieza':        return jsonResponse(saveLimpieza(data));
      case 'marcarListoRevision': return jsonResponse(marcarListoRevision(data));
      case 'marcarRevisado':      return jsonResponse(marcarRevisado(data));
      default:                    return jsonResponse({ error: 'Acción no reconocida: ' + data.action });
    }
  } catch (err) {
    return jsonResponse({ error: err.toString() });
  }
}

// ── Maestros ─────────────────────────────────────────────────

function getAreas() {
  const data = getSheet(SHEETS.AREAS).getDataRange().getValues();
  return data.slice(1).filter(r => r[0]).map(r => String(r[0]));
}

function getCentrifugas() {
  const data = getSheet(SHEETS.CENTRIFUGAS).getDataRange().getValues();
  return data.slice(1).filter(r => r[0]).map(r => String(r[0]));
}

// ── Guardar Registros ─────────────────────────────────────────

function saveTermo(data) {
  if (!data.responsable || !data.temperatura || !data.humedad || !data.fecha || !data.area) {
    return { success: false, error: 'Faltan campos obligatorios.' };
  }
  const f = parseFecha(data.fecha);
  const ts = new Date().toISOString();
  const ampm = data.ampm || (new Date().getHours() < 12 ? 'AM' : 'PM');
  getSheet(SHEETS.TERMO).appendRow([
    data.responsable.toUpperCase().substring(0, 3),
    parseFloat(data.temperatura),
    parseFloat(data.humedad),
    f.dia, f.mes, f.anio,
    ampm,
    data.area,
    data.observaciones || '',
    ts
  ]);
  return { success: true, message: 'Registro de Temperatura/Humedad guardado.' };
}

function saveCentrifuga(data) {
  if (!data.centrifuga || !data.responsable || !data.fecha) {
    return { success: false, error: 'Faltan campos obligatorios.' };
  }
  const f = parseFecha(data.fecha);
  const ts = new Date().toISOString();
  getSheet(SHEETS.CENT_REG).appendRow([
    f.dia, f.mes, f.anio,
    data.centrifuga,
    data.responsable.toUpperCase().substring(0, 3),
    data.tipo_mantencion || 'Diaria',
    data.observaciones || '',
    ts
  ]);
  return { success: true, message: 'Registro de Centrífuga guardado.' };
}

function saveLimpieza(data) {
  if (!data.sala || !data.responsable || !data.fecha) {
    return { success: false, error: 'Faltan campos obligatorios.' };
  }
  const f = parseFecha(data.fecha);
  const ts = new Date().toISOString();
  getSheet(SHEETS.LIMPIEZA).appendRow([
    f.dia, f.mes, f.anio,
    data.sala,
    data.responsable.toUpperCase().substring(0, 3),
    data.observaciones || '',
    ts
  ]);
  return { success: true, message: 'Registro de Limpieza guardado.' };
}

// ── Dashboard / Consultas ─────────────────────────────────────

function getRegistros(mes, anio) {
  mes  = parseInt(mes);
  anio = parseInt(anio);

  function filtrar(sheet, colMes, colAnio) {
    const rows = sheet.getDataRange().getValues();
    return rows.slice(1).filter(r => parseInt(r[colMes]) === mes && parseInt(r[colAnio]) === anio);
  }

  const termoRaw  = filtrar(getSheet(SHEETS.TERMO),    4, 5);
  const centRaw   = filtrar(getSheet(SHEETS.CENT_REG), 1, 2);
  const limpRaw   = filtrar(getSheet(SHEETS.LIMPIEZA), 1, 2);

  const termo = termoRaw.map(r => ({
    responsable: r[0], temperatura: r[1], humedad: r[2],
    dia: r[3], mes: r[4], anio: r[5], ampm: r[6],
    area: r[7], observaciones: r[8], timestamp: r[9]
  }));

  const centrifugas = centRaw.map(r => ({
    dia: r[0], mes: r[1], anio: r[2], centrifuga: r[3],
    responsable: r[4], tipo_mantencion: r[5], observaciones: r[6], timestamp: r[7]
  }));

  const limpieza = limpRaw.map(r => ({
    dia: r[0], mes: r[1], anio: r[2], sala: r[3],
    responsable: r[4], observaciones: r[5], timestamp: r[6]
  }));

  return { mes, anio, termo, centrifugas, limpieza };
}

function getRevision(mes, anio) {
  const rows = getSheet(SHEETS.REVISIONES).getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (parseInt(rows[i][0]) === parseInt(mes) && parseInt(rows[i][1]) === parseInt(anio)) {
      return {
        mes: rows[i][0], anio: rows[i][1], estado: rows[i][2],
        iniciales_n1: rows[i][3], timestamp_n1: rows[i][4],
        usuario_n2: rows[i][5],  timestamp_n2: rows[i][6]
      };
    }
  }
  return { estado: 'pendiente' };
}

// ── Revisiones ────────────────────────────────────────────────

function marcarListoRevision(data) {
  if (data.password !== PASSWORD_N1) {
    return { success: false, error: 'Contraseña incorrecta.' };
  }
  const ini = (data.iniciales || '').trim().toUpperCase();
  if (ini.length < 2 || ini.length > 3) {
    return { success: false, error: 'Las iniciales deben tener 2 o 3 letras.' };
  }
  const mes  = parseInt(data.mes);
  const anio = parseInt(data.anio);
  const sheet = getSheet(SHEETS.REVISIONES);
  const rows  = sheet.getDataRange().getValues();
  const ts    = new Date().toISOString();
  let found   = false;

  for (let i = 1; i < rows.length; i++) {
    if (parseInt(rows[i][0]) === mes && parseInt(rows[i][1]) === anio) {
      sheet.getRange(i + 1, 3, 1, 3).setValues([['listo_revision', ini, ts]]);
      found = true;
      break;
    }
  }
  if (!found) {
    sheet.appendRow([mes, anio, 'listo_revision', ini, ts, '', '']);
  }

  sendResumenEmail(mes, anio, ini);
  return { success: true, message: 'Mes marcado como listo. Correo enviado.' };
}

function marcarRevisado(data) {
  if (data.usuario !== USUARIO_N2 || data.password !== PASSWORD_N2) {
    return { success: false, error: 'Credenciales incorrectas.' };
  }
  const mes  = parseInt(data.mes);
  const anio = parseInt(data.anio);
  const sheet = getSheet(SHEETS.REVISIONES);
  const rows  = sheet.getDataRange().getValues();
  const ts    = new Date().toISOString();

  for (let i = 1; i < rows.length; i++) {
    if (parseInt(rows[i][0]) === mes && parseInt(rows[i][1]) === anio) {
      sheet.getRange(i + 1, 3).setValue('revisado');
      sheet.getRange(i + 1, 6, 1, 2).setValues([[data.usuario, ts]]);
      return { success: true, message: 'Mes marcado como Revisado.' };
    }
  }
  return { success: false, error: 'No se encontró registro del mes.' };
}

// ── Email ─────────────────────────────────────────────────────

function sendResumenEmail(mes, anio, iniciales) {
  const registros = getRegistros(mes.toString(), anio.toString());
  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                 'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const nombreMes = meses[mes - 1];

  const diasEnMes = new Date(anio, mes, 0).getDate();
  const hoy = new Date();
  const diasHasta = (anio === hoy.getFullYear() && mes === (hoy.getMonth() + 1))
    ? hoy.getDate() : diasEnMes;

  // Calcular faltantes
  const termoAM = new Set(), termoPM = new Set();
  registros.termo.forEach(r => {
    if (r.ampm === 'AM') termoAM.add(r.dia);
    else termoPM.add(r.dia);
  });
  const diasCent  = new Set(registros.centrifugas.map(r => r.dia));
  const diasLimp  = new Set(registros.limpieza.map(r => r.dia));

  let faltantesStr = '';
  const faltanTermo = [], faltanCent = [], faltanLimp = [];
  for (let d = 1; d <= diasHasta; d++) {
    if (!termoAM.has(d) || !termoPM.has(d)) faltanTermo.push(d);
    if (!diasCent.has(d))  faltanCent.push(d);
    if (!diasLimp.has(d))  faltanLimp.push(d);
  }
  if (faltanTermo.length) faltantesStr += `  - Temperatura/Humedad: días ${faltanTermo.join(', ')}\n`;
  if (faltanCent.length)  faltantesStr += `  - Centrífugas: días ${faltanCent.join(', ')}\n`;
  if (faltanLimp.length)  faltantesStr += `  - Limpieza: días ${faltanLimp.join(', ')}\n`;

  const subject = `[Proyecto TA] Registros ${nombreMes} ${anio} — Listos para Revisión`;
  const body = `Estimado/a,

Los registros del mes de ${nombreMes} ${anio} han sido marcados como LISTOS PARA REVISIÓN por: ${iniciales}.

RESUMEN:
  • Temperatura/Humedad : ${registros.termo.length} registros
  • Centrífugas         : ${registros.centrifugas.length} registros
  • Limpieza de Mesones : ${registros.limpieza.length} registros

${faltantesStr ? 'REGISTROS FALTANTES DETECTADOS:\n' + faltantesStr : 'Sin registros faltantes detectados.'}

Por favor, acceda al Dashboard del Proyecto TA para realizar la revisión formal.

--
Sistema Proyecto TA
Laboratorio Clínico — Hospital de Talca
`;

  MailApp.sendEmail({ to: EMAIL_ADDRESS, subject: subject, body: body });
}

// ── Inicialización del Spreadsheet ───────────────────────────

function initializeSpreadsheet() {
  const ss = getSpreadsheet();
  const defs = [
    { name: SHEETS.AREAS,      headers: ['Area'] },
    { name: SHEETS.CENTRIFUGAS,headers: ['Centrifuga'] },
    { name: SHEETS.TERMO,      headers: ['Responsable','Temperatura','Humedad','Día','Mes','Año','AM_PM','Area','Observaciones','Timestamp'] },
    { name: SHEETS.CENT_REG,   headers: ['Día','Mes','Año','Centrifuga','Responsable','Tipo_Mantencion','Observaciones','Timestamp'] },
    { name: SHEETS.LIMPIEZA,   headers: ['Día','Mes','Año','Sala','Responsable','Observaciones','Timestamp'] },
    { name: SHEETS.REVISIONES, headers: ['Mes','Año','Estado','Iniciales_N1','Timestamp_N1','Usuario_N2','Timestamp_N2'] }
  ];

  defs.forEach(def => {
    let sheet = ss.getSheetByName(def.name);
    if (!sheet) sheet = ss.insertSheet(def.name);
    else sheet.clearContents();
    sheet.appendRow(def.headers);
    sheet.getRange(1, 1, 1, def.headers.length)
      .setBackground('#0A1628').setFontColor('#FFFFFF').setFontWeight('bold');
    sheet.setFrozenRows(1);
  });

  // Maestros iniciales
  const areasSheet = ss.getSheetByName(SHEETS.AREAS);
  ['Microbiología', 'Hematología', 'Química'].forEach(a => areasSheet.appendRow([a]));

  const centSheet = ss.getSheetByName(SHEETS.CENTRIFUGAS);
  ['Centrífuga 1','Centrífuga 2','Centrífuga 3','Centrífuga 4','Centrífuga 5']
    .forEach(c => centSheet.appendRow([c]));

  // Eliminar hoja por defecto si existe
  ['Hoja 1','Sheet1','Hoja1'].forEach(n => {
    const s = ss.getSheetByName(n);
    if (s && ss.getSheets().length > 1) ss.deleteSheet(s);
  });

  return 'Spreadsheet inicializado correctamente ✓';
}

// ── Setup: crea el Spreadsheet y guarda el ID ─────────────────
// Ejecutar UNA VEZ desde el editor o via clasp run

function setup() {
  const ss = SpreadsheetApp.create('Proyecto RM');
  const id = ss.getId();
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', id);
  Logger.log('Spreadsheet creado: https://docs.google.com/spreadsheets/d/' + id);
  initializeSpreadsheet();
  Logger.log('Setup completo ✓  ID=' + id);
  return { spreadsheetId: id, url: 'https://docs.google.com/spreadsheets/d/' + id };
}
