// ============================================================
// PROYECTO RM — Registros Laboratorio — Hospital de Talca
// Backend: Google Apps Script  v3.0
// ============================================================

const EMAIL_ADDRESS = 'grivera@hospitaldetalca.cl';
const PASSWORD_N1   = 'HRT123';
const PASSWORD_N2   = 'HRT321';
const SHEET_URL     = 'https://docs.google.com/spreadsheets/d/1HzHcRriBtPGQxTfFrZSntVeM8ujQHWnGFuyWrJo6KUQ';

const SHEETS = {
  AREAS:       'Areas_Maestro',
  CENTRIFUGAS: 'Centrifugas_Maestro',
  SALAS:       'Salas_Maestro',
  TERMO:       'Registro_Termo',
  CENT_REG:    'Registro_Centrifugas',
  MESONES:     'Registro_Mesones',
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
  const p = fechaStr.split('-');
  return { dia: parseInt(p[2]), mes: parseInt(p[1]), anio: parseInt(p[0]) };
}

function formatFechaDDMMYYYY(f) {
  return String(f.dia).padStart(2,'0') + '/' + String(f.mes).padStart(2,'0') + '/' + f.anio;
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function insertRowAtTop(sheet, values) {
  sheet.insertRowAfter(1);
  sheet.getRange(2, 1, 1, values.length).setValues([values]);
}

// ── Router ───────────────────────────────────────────────────

function doGet(e) {
  const action = e.parameter.action;
  try {
    switch (action) {
      case 'getAreas':       return jsonResponse(getAreas());
      case 'getCentrifugas': return jsonResponse(getCentrifugas());
      case 'getSalas':       return jsonResponse(getSalas());
      case 'getRegistros':   return jsonResponse(getRegistros(e.parameter.mes, e.parameter.anio));
      case 'getRevisiones':  return jsonResponse(getRevision(e.parameter.mes, e.parameter.anio));
      case 'getMaestros':    return jsonResponse(getMaestros());
      case 'SETUP_INIT_TA':  return jsonResponse(setup());
      case 'REINIT':         return jsonResponse(reinitialize());
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
      case 'saveMesones':         return jsonResponse(saveMesones(data));
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

function getSalas() {
  const data = getSheet(SHEETS.SALAS).getDataRange().getValues();
  return data.slice(1).filter(r => r[0]).map(r => String(r[0]));
}

/** Devuelve todos los maestros en una sola llamada para optimizar carga */
function getMaestros() {
  return {
    areas: getAreas(),
    centrifugas: getCentrifugas(),
    salas: getSalas()
  };
}

// ── Guardar Registros ─────────────────────────────────────────
// Termo: Responsable | Temperatura (°C) | Humedad (%) | Fecha (dd/mm/aaaa) | Día | Mes | Año | Turno | Area | Observaciones | Timestamp | Revisado_Por | Fecha_Revisión

function saveTermo(data) {
  if (!data.responsable || !data.temperatura || !data.humedad || !data.fecha || !data.area) {
    return { success: false, error: 'Faltan campos obligatorios.' };
  }
  const f = parseFecha(data.fecha);
  const ts = new Date().toISOString();
  const ampm = data.ampm || (new Date().getHours() < 12 ? 'AM' : 'PM');
  const turno = ampm === 'AM' ? 'Mañana' : 'Tarde';
  insertRowAtTop(getSheet(SHEETS.TERMO), [
    data.responsable.toUpperCase().substring(0, 3),
    parseFloat(data.temperatura),
    parseFloat(data.humedad),
    formatFechaDDMMYYYY(f),
    f.dia, f.mes, f.anio,
    turno,
    data.area,
    data.observaciones || '',
    ts,
    '',  // Revisado_Por
    ''   // Fecha_Revisión
  ]);
  return { success: true, message: 'Registro de Temperatura/Humedad guardado.' };
}

// Centrifugas: Fecha | Día | Mes | Año | Centrifuga | Responsable | Tipo_Mantencion | Observaciones | Timestamp | Revisado_Por | Fecha_Revisión
function saveCentrifuga(data) {
  if (!data.responsable || !data.fecha) {
    return { success: false, error: 'Faltan campos obligatorios.' };
  }
  const centrifugas = data.centrifugas || (data.centrifuga ? [data.centrifuga] : []);
  if (centrifugas.length === 0) {
    return { success: false, error: 'Seleccione al menos una centrífuga.' };
  }
  const f = parseFecha(data.fecha);
  const ts = new Date().toISOString();
  const sheet = getSheet(SHEETS.CENT_REG);
  centrifugas.forEach(cent => {
    insertRowAtTop(sheet, [
      formatFechaDDMMYYYY(f), f.dia, f.mes, f.anio,
      cent,
      data.responsable.toUpperCase().substring(0, 3),
      data.tipo_mantencion || 'Diaria',
      data.observaciones || '',
      ts,
      '',  // Revisado_Por
      ''   // Fecha_Revisión
    ]);
  });
  return { success: true, message: centrifugas.length + ' registro(s) de Centrífuga guardado(s).' };
}

// Mesones: Fecha | Día | Mes | Año | Sala | Responsable | Observaciones | Timestamp | Revisado_Por | Fecha_Revisión
function saveMesones(data) {
  if (!data.responsable || !data.fecha) {
    return { success: false, error: 'Faltan campos obligatorios.' };
  }
  const salas = data.salas || (data.sala ? [data.sala] : []);
  if (salas.length === 0) {
    return { success: false, error: 'Seleccione al menos una sala.' };
  }
  const f = parseFecha(data.fecha);
  const ts = new Date().toISOString();
  const sheet = getSheet(SHEETS.MESONES);
  salas.forEach(sala => {
    insertRowAtTop(sheet, [
      formatFechaDDMMYYYY(f), f.dia, f.mes, f.anio,
      sala,
      data.responsable.toUpperCase().substring(0, 3),
      data.observaciones || '',
      ts,
      '',  // Revisado_Por
      ''   // Fecha_Revisión
    ]);
  });
  return { success: true, message: salas.length + ' registro(s) de Mesones guardado(s).' };
}

// ── Dashboard / Consultas ─────────────────────────────────────

function getRegistros(mes, anio) {
  mes  = parseInt(mes);
  anio = parseInt(anio);

  function filtrar(sheet, colMes, colAnio) {
    const rows = sheet.getDataRange().getValues();
    return rows.slice(1).filter(r => parseInt(r[colMes]) === mes && parseInt(r[colAnio]) === anio);
  }

  const termoRaw  = filtrar(getSheet(SHEETS.TERMO),    5, 6);
  const centRaw   = filtrar(getSheet(SHEETS.CENT_REG), 2, 3);
  const mesoRaw   = filtrar(getSheet(SHEETS.MESONES),  2, 3);

  const termo = termoRaw.map(r => ({
    responsable: r[0], temperatura: r[1], humedad: r[2],
    fecha: r[3], dia: r[4], mes: r[5], anio: r[6], turno: r[7],
    area: r[8], observaciones: r[9],
    revisado_por: r[11] || '', fecha_revision: r[12] || ''
  }));

  const centrifugas = centRaw.map(r => ({
    fecha: r[0], dia: r[1], mes: r[2], anio: r[3], centrifuga: r[4],
    responsable: r[5], tipo_mantencion: r[6], observaciones: r[7],
    revisado_por: r[9] || '', fecha_revision: r[10] || ''
  }));

  const mesones = mesoRaw.map(r => ({
    fecha: r[0], dia: r[1], mes: r[2], anio: r[3], sala: r[4],
    responsable: r[5], observaciones: r[6],
    revisado_por: r[8] || '', fecha_revision: r[9] || ''
  }));

  return { mes, anio, termo, centrifugas, mesones };
}

function getRevision(mes, anio) {
  const rows = getSheet(SHEETS.REVISIONES).getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (parseInt(rows[i][0]) === parseInt(mes) && parseInt(rows[i][1]) === parseInt(anio)) {
      return {
        mes: rows[i][0], anio: rows[i][1], estado: rows[i][2],
        iniciales_n1: rows[i][3], timestamp_n1: rows[i][4],
        iniciales_n2: rows[i][5], timestamp_n2: rows[i][6]
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
  if (data.password !== PASSWORD_N2) {
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
  const fechaRev = new Date().toLocaleDateString('es-CL');

  // Actualizar hoja Revisiones
  let found = false;
  for (let i = 1; i < rows.length; i++) {
    if (parseInt(rows[i][0]) === mes && parseInt(rows[i][1]) === anio) {
      sheet.getRange(i + 1, 3).setValue('revisado');
      sheet.getRange(i + 1, 6, 1, 2).setValues([[ini, ts]]);
      found = true;
      break;
    }
  }
  if (!found) {
    sheet.appendRow([mes, anio, 'revisado', '', '', ini, ts]);
  }

  // Escribir "Revisado_Por" y "Fecha_Revisión" en todos los registros del mes
  stampRevision(getSheet(SHEETS.TERMO), 5, 6, mes, anio, ini, fechaRev, 11, 12);
  stampRevision(getSheet(SHEETS.CENT_REG), 2, 3, mes, anio, ini, fechaRev, 9, 10);
  stampRevision(getSheet(SHEETS.MESONES), 2, 3, mes, anio, ini, fechaRev, 8, 9);

  return { success: true, message: 'Mes marcado como Revisado. Registros actualizados.' };
}

/** Escribe las iniciales del revisor y fecha en todos los registros de un mes */
function stampRevision(sheet, colMes, colAnio, mes, anio, iniciales, fechaRev, colRevPor, colRevFecha) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (parseInt(data[i][colMes]) === mes && parseInt(data[i][colAnio]) === anio) {
      // colRevPor y colRevFecha son 0-indexed en el array, pero 1-indexed en getRange
      sheet.getRange(i + 1, colRevPor + 1).setValue(iniciales);
      sheet.getRange(i + 1, colRevFecha + 1).setValue(fechaRev);
    }
  }
}

// ── Email ─────────────────────────────────────────────────────

function sendResumenEmail(mes, anio, iniciales) {
  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                 'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const nombreMes = meses[mes - 1];

  const subject = '[Registros Lab] ' + nombreMes + ' ' + anio + ' — Listos para Revisión';
  const body = 'Estimado/a,\n\n' +
    'El usuario ' + iniciales + ' ha marcado los datos de ' + nombreMes + ' ' + anio +
    ' como listos para revisar.\n\n' +
    'Puede revisar los datos en el siguiente enlace:\n' +
    SHEET_URL + '\n\n' +
    'Una vez revisados, puede confirmar la revisión del mes desde el aplicativo.\n\n' +
    '---\n' +
    'Este mensaje fue enviado automáticamente a través del aplicativo Registros Mensuales.\n' +
    'Laboratorio Clínico — Hospital de Talca\n';

  MailApp.sendEmail({ to: EMAIL_ADDRESS, subject: subject, body: body });
}

// ── Inicialización del Spreadsheet ───────────────────────────

function initializeSpreadsheet() {
  const ss = getSpreadsheet();
  const defs = [
    { name: SHEETS.AREAS,       headers: ['Area'] },
    { name: SHEETS.CENTRIFUGAS, headers: ['Centrifuga'] },
    { name: SHEETS.SALAS,       headers: ['Sala'] },
    { name: SHEETS.TERMO,       headers: ['Responsable','Temperatura (°C)','Humedad (%)','Fecha (dd/mm/aaaa)','Día','Mes','Año','Turno','Area','Observaciones','Timestamp','Revisado Por','Fecha Revisión'],
      hideCols: [5,6,7,11] },
    { name: SHEETS.CENT_REG,    headers: ['Fecha (dd/mm/aaaa)','Día','Mes','Año','Centrifuga','Responsable','Tipo Mantención','Observaciones','Timestamp','Revisado Por','Fecha Revisión'],
      hideCols: [2,3,4,9] },
    { name: SHEETS.MESONES,     headers: ['Fecha (dd/mm/aaaa)','Día','Mes','Año','Sala','Responsable','Observaciones','Timestamp','Revisado Por','Fecha Revisión'],
      hideCols: [2,3,4,8] },
    { name: SHEETS.REVISIONES,  headers: ['Mes','Año','Estado','Iniciales_N1','Timestamp_N1','Iniciales_N2','Timestamp_N2'] }
  ];

  defs.forEach(def => {
    let sheet = ss.getSheetByName(def.name);
    if (!sheet) sheet = ss.insertSheet(def.name);
    else sheet.clearContents();
    if (sheet.getMaxColumns() > 1) sheet.showColumns(1, sheet.getMaxColumns());
    // Ensure enough columns
    const needed = def.headers.length;
    const current = sheet.getMaxColumns();
    if (current < needed) sheet.insertColumnsAfter(current, needed - current);
    sheet.appendRow(def.headers);
    sheet.getRange(1, 1, 1, def.headers.length)
      .setBackground('#0F172A').setFontColor('#FFFFFF').setFontWeight('bold');
    sheet.setFrozenRows(1);
    if (def.hideCols) def.hideCols.forEach(col => sheet.hideColumns(col));
  });

  // Maestros iniciales
  const areasSheet = ss.getSheetByName(SHEETS.AREAS);
  ['Microbiología', 'Hematología', 'Química'].forEach(a => areasSheet.appendRow([a]));

  const centSheet = ss.getSheetByName(SHEETS.CENTRIFUGAS);
  ['Centrífuga 1','Centrífuga 2','Centrífuga 3','Centrífuga 4','Centrífuga 5','Centrífuga 18']
    .forEach(c => centSheet.appendRow([c]));

  const salasSheet = ss.getSheetByName(SHEETS.SALAS);
  ['Microbiología', 'Hematología', 'Química'].forEach(s => salasSheet.appendRow([s]));

  // Eliminar hojas por defecto
  ['Hoja 1','Sheet1','Hoja1'].forEach(n => {
    const s = ss.getSheetByName(n);
    if (s && ss.getSheets().length > 1) ss.deleteSheet(s);
  });

  // Eliminar hoja antigua si existe
  const oldLimp = ss.getSheetByName('Registro_Limpieza');
  if (oldLimp && ss.getSheets().length > 1) ss.deleteSheet(oldLimp);

  return 'Spreadsheet inicializado correctamente ✓';
}

function setup() {
  const ss = SpreadsheetApp.create('Proyecto RM');
  const id = ss.getId();
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', id);
  initializeSpreadsheet();
  return { spreadsheetId: id, url: 'https://docs.google.com/spreadsheets/d/' + id };
}

function reinitialize() {
  initializeSpreadsheet();
  return { success: true, message: 'Estructura re-inicializada.' };
}
