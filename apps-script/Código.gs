// ============================================================
// PROYECTO RM — Registros Laboratorio — Hospital de Talca
// Backend: Google Apps Script  v4.0
// ============================================================

const PASSWORD_REVISION = 'HRT123';
const SHEET_URL      = 'https://docs.google.com/spreadsheets/d/1HzHcRriBtPGQxTfFrZSntVeM8ujQHWnGFuyWrJo6KUQ';

// Sistema de alertas multi-destinatario
const EMAIL_ALERTS = {
  default:        'grivera@hospitaldetalca.cl',
  conductividad:  'grivera@hospitaldetalca.cl'  // Cambiar cuando se defina el destinatario
};

const SHEETS = {
  TERMO:            'Reg. Temp./Humedad',
  CENT_REG:         'Reg. Centrífugas',
  MESONES:          'Reg. Mesones',
  REFRI_REG:        'Reg. Temp. Refrigeradores',
  LIMP_REFRI:       'Reg. Limpieza Refrigeradores',
  CONDUCT_REG:      'Reg. Conductividad Agua',
  REVISIONES:       'Revisiones',
  AREAS:            'Maestro Areas',
  CENTRIFUGAS:      'Maestro Centrifugas',
  SALAS:            'Maestro Salas',
  REFRI_MASTER:     'Maestro Refrigeradores',
  REFRI_LIMP_MASTER:'Maestro Refri. Limpieza',
  ACCIONES:         'Maestro Acciones'
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
  const range = sheet.getRange(2, 1, 1, values.length);
  range.setValues([values]);
  range.setBackground(null).setFontColor(null).setFontWeight("normal");
}

// ── Router ───────────────────────────────────────────────────

function doGet(e) {
  const action = e.parameter.action;
  try {
    switch (action) {
      case 'getAreas':          return jsonResponse(getAreas());
      case 'getCentrifugas':    return jsonResponse(getCentrifugas());
      case 'getSalas':          return jsonResponse(getSalas());
      case 'getAcciones':       return jsonResponse(getAcciones());
      case 'getRefrigeradores': return jsonResponse(getRefrigeradores());
      case 'getRefriLimpieza':  return jsonResponse(getRefriLimpieza());
      case 'getRegistros':      return jsonResponse(getRegistros(e.parameter.mes, e.parameter.anio));
      case 'getRevisiones':     return jsonResponse(getRevision(e.parameter.mes, e.parameter.anio));
      case 'getMaestros':       return jsonResponse(getMaestros());
      case 'SETUP_INIT_TA':     return jsonResponse(setup());
      case 'REINIT':            return jsonResponse(reinitialize());
      default:                  return jsonResponse({ error: 'Acción no reconocida: ' + action });
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
      case 'saveRefriTemp':       return jsonResponse(saveRefriTemp(data));
      case 'saveLimpiezaRefri':   return jsonResponse(saveLimpiezaRefri(data));
      case 'saveConductividad':   return jsonResponse(saveConductividad(data));
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

function getAcciones() {
  const data = getSheet(SHEETS.ACCIONES).getDataRange().getValues();
  return data.slice(1).filter(r => r[0]).map(r => String(r[0]));
}

function getRefrigeradores() {
  const data = getSheet(SHEETS.REFRI_MASTER).getDataRange().getValues();
  return data.slice(1).filter(r => r[0]).map(r => ({
    equipo: String(r[0]),
    tipo: String(r[1]),
    tempMin: parseFloat(r[2]),
    tempMax: parseFloat(r[3])
  }));
}

function getRefriLimpieza() {
  const data = getSheet(SHEETS.REFRI_LIMP_MASTER).getDataRange().getValues();
  return data.slice(1).filter(r => r[0]).map(r => String(r[0]));
}

/** Devuelve todos los maestros en una sola llamada para optimizar carga */
function getMaestros() {
  return {
    areas: getAreas(),
    centrifugas: getCentrifugas(),
    salas: getSalas(),
    acciones: getAcciones(),
    refrigeradores: getRefrigeradores(),
    refriLimpieza: getRefriLimpieza()
  };
}

// ── Guardar Registros ─────────────────────────────────────────
// Termo: Responsable | Temperatura (°C) | Humedad (%) | Fecha (dd/mm/aaaa) | Día | Mes | Año | Turno | Area | Acción Correctiva | Observaciones | Timestamp | Revisado_Por | Fecha_Revisión

function saveTermo(data) {
  if (!data.responsable || !data.temperatura || !data.humedad || !data.fecha || !data.area) {
    return { success: false, error: 'Faltan campos obligatorios.' };
  }
  const f = parseFecha(data.fecha);
  const ts = new Date().toISOString();
  const ampm = data.ampm || (new Date().getHours() < 12 ? 'AM' : 'PM');
  const turno = ampm === 'AM' ? 'Mañana' : 'Tarde';
  const accion = data.accion_correctiva || '';

  // Check if out of range
  const temp = parseFloat(data.temperatura);
  const hum = parseFloat(data.humedad);
  const tempOOR = temp < 18 || temp > 24;
  const humOOR = hum < 20 || hum > 70;

  insertRowAtTop(getSheet(SHEETS.TERMO), [
    data.responsable.toUpperCase().substring(0, 3),
    temp,
    hum,
    formatFechaDDMMYYYY(f),
    f.dia, f.mes, f.anio,
    turno,
    data.area,
    accion,
    data.observaciones || '',
    ts,
    '',  // Revisado_Por
    ''   // Fecha_Revisión
  ]);

  // Send alert email if out of range
  if (tempOOR || humOOR) {
    try {
      sendAlertaFueraDeRango({
        area: data.area,
        turno: turno,
        temperatura: temp,
        humedad: hum,
        tempOOR: tempOOR,
        humOOR: humOOR,
        responsable: data.responsable.toUpperCase().substring(0, 3),
        accion_correctiva: accion,
        fecha: formatFechaDDMMYYYY(f)
      });
    } catch (emailErr) {
      // Don't fail the save if email fails
      Logger.log('Error enviando alerta: ' + emailErr.toString());
    }
  }

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

// RefriTemp: Responsable | Temperatura (°C) | Fecha | Día | Mes | Año | Turno | Equipo | Tipo | Acción Correctiva | Observaciones | Timestamp | Revisado_Por | Fecha_Revisión
function saveRefriTemp(data) {
  if (!data.responsable || !data.temperatura || !data.fecha || !data.equipo) {
    return { success: false, error: 'Faltan campos obligatorios.' };
  }
  const f = parseFecha(data.fecha);
  const ts = new Date().toISOString();
  const ampm = data.ampm || (new Date().getHours() < 12 ? 'AM' : 'PM');
  const turno = ampm === 'AM' ? 'Mañana' : 'Tarde';
  const accion = data.accion_correctiva || '';
  const temp = parseFloat(data.temperatura);

  // Get range for equipment
  const refris = getRefrigeradores();
  const equipo = refris.find(r => r.equipo === data.equipo);
  const tempMin = equipo ? equipo.tempMin : 2;
  const tempMax = equipo ? equipo.tempMax : 8;
  const tipo = equipo ? equipo.tipo : 'Refrigerador';
  const tempOOR = temp < tempMin || temp > tempMax;

  insertRowAtTop(getSheet(SHEETS.REFRI_REG), [
    data.responsable.toUpperCase().substring(0, 3),
    temp,
    formatFechaDDMMYYYY(f),
    f.dia, f.mes, f.anio,
    turno,
    data.equipo,
    tipo,
    accion,
    data.observaciones || '',
    ts,
    '',  // Revisado_Por
    ''   // Fecha_Revisión
  ]);

  if (tempOOR) {
    try {
      sendAlertaRefriTemp({
        equipo: data.equipo, tipo: tipo, turno: turno,
        temperatura: temp, tempMin: tempMin, tempMax: tempMax,
        responsable: data.responsable.toUpperCase().substring(0, 3),
        accion_correctiva: accion, fecha: formatFechaDDMMYYYY(f)
      });
    } catch (emailErr) {
      Logger.log('Error enviando alerta refri: ' + emailErr.toString());
    }
  }

  return { success: true, message: 'Registro de Temperatura de ' + (tipo || 'Equipo') + ' guardado.' };
}

// LimpiezaRefri: Fecha | Día | Mes | Año | Tipo Mantención | Equipos | Responsable | Observaciones | Timestamp | Revisado_Por | Fecha_Revisión
function saveLimpiezaRefri(data) {
  if (!data.responsable || !data.fecha || !data.tipo_mantencion) {
    return { success: false, error: 'Faltan campos obligatorios.' };
  }
  const equipos = data.equipos || [];
  if (equipos.length === 0) {
    return { success: false, error: 'Seleccione al menos un equipo.' };
  }
  const f = parseFecha(data.fecha);
  const ts = new Date().toISOString();
  const sheet = getSheet(SHEETS.LIMP_REFRI);
  equipos.forEach(eq => {
    insertRowAtTop(sheet, [
      formatFechaDDMMYYYY(f), f.dia, f.mes, f.anio,
      data.tipo_mantencion,
      eq,
      data.responsable.toUpperCase().substring(0, 3),
      data.observaciones || '',
      ts,
      '',  // Revisado_Por
      ''   // Fecha_Revisión
    ]);
  });
  return { success: true, message: equipos.length + ' registro(s) de Limpieza Refrigeradores guardado(s).' };
}

// Conductividad: Responsable | Conductividad (µS/cm) | Fecha | Día | Mes | Año | Turno | Observaciones | Timestamp | Revisado_Por | Fecha_Revisión
function saveConductividad(data) {
  if (!data.responsable || !data.fecha || data.conductividad === undefined || data.conductividad === '') {
    return { success: false, error: 'Faltan campos obligatorios.' };
  }
  const f = parseFecha(data.fecha);
  const ts = new Date().toISOString();
  const ampm = data.ampm || (new Date().getHours() < 12 ? 'AM' : 'PM');
  const turno = ampm === 'AM' ? 'Mañana' : 'Tarde';
  const cond = parseFloat(data.conductividad);

  insertRowAtTop(getSheet(SHEETS.CONDUCT_REG), [
    data.responsable.toUpperCase().substring(0, 3),
    cond,
    formatFechaDDMMYYYY(f),
    f.dia, f.mes, f.anio,
    turno,
    data.observaciones || '',
    ts,
    '',  // Revisado_Por
    ''   // Fecha_Revisión
  ]);

  // Alert if > 0.5 (warning to encargado)
  if (cond > 0.5) {
    try {
      sendAlertaConductividad({
        conductividad: cond, turno: turno,
        responsable: data.responsable.toUpperCase().substring(0, 3),
        fecha: formatFechaDDMMYYYY(f),
        critico: cond > 0.8
      });
    } catch (emailErr) {
      Logger.log('Error enviando alerta conductividad: ' + emailErr.toString());
    }
  }

  return { success: true, message: 'Registro de Conductividad guardado.' };
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
  const refriRaw  = filtrar(getSheet(SHEETS.REFRI_REG), 4, 5);
  const limpRaw   = filtrar(getSheet(SHEETS.LIMP_REFRI), 2, 3);
  const condRaw   = filtrar(getSheet(SHEETS.CONDUCT_REG), 4, 5);

  const termo = termoRaw.map(r => ({
    responsable: r[0], temperatura: r[1], humedad: r[2],
    fecha: r[3], dia: r[4], mes: r[5], anio: r[6], turno: r[7],
    area: r[8], accion_correctiva: r[9] || '', observaciones: r[10],
    revisado_por: r[12] || '', fecha_revision: r[13] || ''
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

  // RefriTemp: Resp | Temp | Fecha | Día | Mes | Año | Turno | Equipo | Tipo | Acción | Obs | TS | Rev | FechaRev
  const refriTemp = refriRaw.map(r => ({
    responsable: r[0], temperatura: r[1], fecha: r[2],
    dia: r[3], mes: r[4], anio: r[5], turno: r[6],
    equipo: r[7], tipo: r[8], accion_correctiva: r[9] || '', observaciones: r[10],
    revisado_por: r[12] || '', fecha_revision: r[13] || ''
  }));

  // LimpRefri: Fecha | Día | Mes | Año | TipoMant | Equipo | Resp | Obs | TS | Rev | FechaRev
  const limpiezaRefri = limpRaw.map(r => ({
    fecha: r[0], dia: r[1], mes: r[2], anio: r[3],
    tipo_mantencion: r[4], equipo: r[5], responsable: r[6], observaciones: r[7],
    revisado_por: r[9] || '', fecha_revision: r[10] || ''
  }));

  // Conductividad: Resp | Cond | Fecha | Día | Mes | Año | Turno | Obs | TS | Rev | FechaRev
  const conductividad = condRaw.map(r => ({
    responsable: r[0], conductividad: r[1], fecha: r[2],
    dia: r[3], mes: r[4], anio: r[5], turno: r[6], observaciones: r[7],
    revisado_por: r[9] || '', fecha_revision: r[10] || ''
  }));

  return { mes, anio, termo, centrifugas, mesones, refriTemp, limpiezaRefri, conductividad };
}

function getRevision(mes, anio) {
  const rows = getSheet(SHEETS.REVISIONES).getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (parseInt(rows[i][0]) === parseInt(mes) && parseInt(rows[i][1]) === parseInt(anio)) {
      return {
        mes: rows[i][0], anio: rows[i][1], estado: rows[i][2],
        timestamp: rows[i][3]
      };
    }
  }
  return { estado: 'pendiente' };
}

// ── Revisiones ────────────────────────────────────────────────

function marcarRevisado(data) {
  if (data.password !== PASSWORD_REVISION) {
    return { success: false, error: 'Contraseña incorrecta.' };
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
      sheet.getRange(i + 1, 3, 1, 2).setValues([['revisado', ts]]);
      found = true;
      break;
    }
  }
  if (!found) {
    sheet.appendRow([mes, anio, 'revisado', ts]);
  }

  // Escribir "Revisado_Por" y "Fecha_Revisión" en todos los registros del mes
  // Termo: col 12 = Revisado_Por, col 13 = Fecha_Revisión (0-indexed)
  stampRevision(getSheet(SHEETS.TERMO), 5, 6, mes, anio, 'REV', fechaRev, 12, 13);
  stampRevision(getSheet(SHEETS.CENT_REG), 2, 3, mes, anio, 'REV', fechaRev, 9, 10);
  stampRevision(getSheet(SHEETS.MESONES), 2, 3, mes, anio, 'REV', fechaRev, 8, 9);
  stampRevision(getSheet(SHEETS.REFRI_REG), 4, 5, mes, anio, 'REV', fechaRev, 12, 13);
  stampRevision(getSheet(SHEETS.LIMP_REFRI), 2, 3, mes, anio, 'REV', fechaRev, 9, 10);
  stampRevision(getSheet(SHEETS.CONDUCT_REG), 4, 5, mes, anio, 'REV', fechaRev, 9, 10);

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

// ── Email — Alerta Fuera de Rango ─────────────────────────────

function sendAlertaFueraDeRango(info) {
  const detalles = [];
  if (info.tempOOR) {
    detalles.push('• Temperatura: ' + info.temperatura + ' °C (rango aceptable: 18–24 °C)');
  }
  if (info.humOOR) {
    detalles.push('• Humedad: ' + info.humedad + '% (rango aceptable: 20–70%)');
  }

  const subject = '⚠️ [Registros Lab] Alerta: Valor fuera de rango — ' + info.area;
  const body = 'Estimado/a,\n\n' +
    'Se ha registrado un valor fuera de rango en el sistema de Registros Mensuales.\n\n' +
    '📍 Área: ' + info.area + '\n' +
    '📅 Fecha: ' + info.fecha + '\n' +
    '🕐 Turno: ' + info.turno + '\n' +
    '👤 Responsable: ' + info.responsable + '\n\n' +
    'Detalles del valor fuera de rango:\n' +
    detalles.join('\n') + '\n\n' +
    '🔧 Acción correctiva: ' + (info.accion_correctiva || 'No especificada') + '\n\n' +
    'Por favor, revisar y tomar las medidas necesarias.\n\n' +
    'Puede revisar los registros en:\n' + SHEET_URL + '\n\n' +
    '---\n' +
    'Este mensaje fue enviado automáticamente.\n' +
    'Registros Mensuales — Laboratorio Clínico — Hospital de Talca\n';

  MailApp.sendEmail({ to: EMAIL_ALERTS.default, subject: subject, body: body });
}

// ── Email — Alerta Temp Refrigeradores Fuera de Rango ─────────

function sendAlertaRefriTemp(info) {
  const subject = '⚠️ [Registros Lab] Alerta: Temperatura fuera de rango — ' + info.equipo;
  const body = 'Estimado/a,\n\n' +
    'Se ha registrado una temperatura fuera de rango en un ' + info.tipo + '.\n\n' +
    '🧊 Equipo: ' + info.equipo + ' (' + info.tipo + ')\n' +
    '📅 Fecha: ' + info.fecha + '\n' +
    '🕐 Turno: ' + info.turno + '\n' +
    '👤 Responsable: ' + info.responsable + '\n\n' +
    'Detalle:\n' +
    '• Temperatura registrada: ' + info.temperatura + ' °C\n' +
    '• Rango aceptable: ' + info.tempMin + ' a ' + info.tempMax + ' °C\n\n' +
    '🔧 Acción correctiva: ' + (info.accion_correctiva || 'No especificada') + '\n\n' +
    'Nota: Avisar al Encargado de Turno o Encargado de Refrigeradores que las temperaturas se encuentran fuera de rango.\n\n' +
    'Puede revisar los registros en:\n' + SHEET_URL + '\n\n' +
    '---\n' +
    'Este mensaje fue enviado automáticamente.\n' +
    'Registros Mensuales — Laboratorio Clínico — Hospital de Talca\n';

  MailApp.sendEmail({ to: EMAIL_ALERTS.default, subject: subject, body: body });
}

// ── Email — Alerta Conductividad ──────────────────────────────

function sendAlertaConductividad(info) {
  const nivel = info.critico ? 'CRÍTICO' : 'ADVERTENCIA';
  const subject = '⚠️ [Registros Lab] ' + nivel + ': Conductividad fuera de rango — ' + info.conductividad + ' µS/cm';
  const body = 'Estimado/a,\n\n' +
    'Se ha registrado un valor de conductividad ' + (info.critico ? 'CRÍTICO' : 'elevado') + ' en el agua.\n\n' +
    '💧 Conductividad: ' + info.conductividad + ' µS/cm\n' +
    '📅 Fecha: ' + info.fecha + '\n' +
    '🕐 Turno: ' + info.turno + '\n' +
    '👤 Responsable: ' + info.responsable + '\n\n' +
    (info.critico
      ? 'Valores de conductividad que sobrepasen los 0.8 µS/cm deben reportarse a Asistencia técnica Vigaflow 977070600.\n\n'
      : 'El valor supera los 0.5 µS/cm (advertencia). Rango permitido: 0–0.8 µS/cm.\n\n') +
    'Puede revisar los registros en:\n' + SHEET_URL + '\n\n' +
    '---\n' +
    'Este mensaje fue enviado automáticamente.\n' +
    'Registros Mensuales — Laboratorio Clínico — Hospital de Talca\n';

  MailApp.sendEmail({ to: EMAIL_ALERTS.conductividad, subject: subject, body: body });
}

// ── Email — Recordatorio Mes Anterior (Trigger Mensual) ──────

function triggerRecordatorioMesAnterior() {
  const hoy = new Date();
  // Solo ejecutar el día 1 del mes
  if (hoy.getDate() !== 1) return;

  let mesAnterior = hoy.getMonth(); // getMonth() es 0-indexed, así que Month actual - 1
  let anioAnterior = hoy.getFullYear();
  if (mesAnterior === 0) {
    mesAnterior = 12;
    anioAnterior--;
  }

  const rev = getRevision(mesAnterior, anioAnterior);
  if (rev.estado === 'revisado') return; // Ya fue revisado

  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                 'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const nombreMes = meses[mesAnterior - 1];

  const subject = '📋 [Registros Lab] Recordatorio: Revisar registros de ' + nombreMes + ' ' + anioAnterior;
  const body = 'Estimado/a,\n\n' +
    'Le recordamos que los registros de ' + nombreMes + ' ' + anioAnterior +
    ' aún no han sido marcados como revisados.\n\n' +
    'Por favor, ingrese al aplicativo y confirme la revisión del mes anterior.\n\n' +
    'Enlace a los datos:\n' + SHEET_URL + '\n\n' +
    '---\n' +
    'Este mensaje fue enviado automáticamente.\n' +
    'Registros Mensuales — Laboratorio Clínico — Hospital de Talca\n';

  MailApp.sendEmail({ to: EMAIL_ALERTS.default, subject: subject, body: body });
}

// ── Email — Datos No Rellenados (Trigger Diario) ──────────────

function triggerDatosNoRellenados() {
  const hoy = new Date();
  const dia = hoy.getDate();
  const mes = hoy.getMonth() + 1;
  const anio = hoy.getFullYear();

  const areas = getAreas();
  const centrifugas = getCentrifugas();
  const salas = getSalas();
  const refrigeradores = getRefrigeradores();

  const reg = getRegistros(mes, anio);

  // Temperatura/Humedad faltantes
  const termoFaltantes = [];
  areas.forEach(area => {
    ['Mañana', 'Tarde'].forEach(turno => {
      const existe = reg.termo.some(r => parseInt(r.dia) === dia && r.area === area && r.turno === turno);
      if (!existe) termoFaltantes.push(area + ' (' + turno + ')');
    });
  });

  // Centrífugas faltantes (solo mantenimiento Diario)
  const centFaltantes = [];
  centrifugas.forEach(c => {
    const existe = reg.centrifugas.some(r => parseInt(r.dia) === dia && r.centrifuga === c && r.tipo_mantencion === 'Diaria');
    if (!existe) centFaltantes.push(c);
  });

  // Mesones faltantes
  const mesonFaltantes = [];
  salas.forEach(s => {
    const existe = reg.mesones.some(r => parseInt(r.dia) === dia && r.sala === s);
    if (!existe) mesonFaltantes.push(s);
  });

  // Temp Refrigeradores faltantes (AM y PM)
  const refriFaltantes = [];
  refrigeradores.forEach(r => {
    ['Mañana', 'Tarde'].forEach(turno => {
      const existe = reg.refriTemp.some(rt => parseInt(rt.dia) === dia && rt.equipo === r.equipo && rt.turno === turno);
      if (!existe) refriFaltantes.push(r.equipo + ' (' + turno + ')');
    });
  });

  // Conductividad faltantes (AM y PM)
  const condFaltantes = [];
  ['Mañana', 'Tarde'].forEach(turno => {
    const existe = reg.conductividad.some(c => parseInt(c.dia) === dia && c.turno === turno);
    if (!existe) condFaltantes.push('Conductividad (' + turno + ')');
  });

  // Si todo está completo, no enviar correo
  if (termoFaltantes.length === 0 && centFaltantes.length === 0 && mesonFaltantes.length === 0 && refriFaltantes.length === 0 && condFaltantes.length === 0) return;

  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                 'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  let detalle = '';
  if (termoFaltantes.length > 0) {
    detalle += '\n🌡️ Temperatura/Humedad Ambiental:\n' + termoFaltantes.map(f => '  • ' + f).join('\n');
  }
  if (centFaltantes.length > 0) {
    detalle += '\n⚙️ Centrífugas (Diaria):\n' + centFaltantes.map(f => '  • ' + f).join('\n');
  }
  if (mesonFaltantes.length > 0) {
    detalle += '\n🧽 Mesones:\n' + mesonFaltantes.map(f => '  • ' + f).join('\n');
  }
  if (refriFaltantes.length > 0) {
    detalle += '\n🧊 Temp. Refrigeradores:\n' + refriFaltantes.map(f => '  • ' + f).join('\n');
  }
  if (condFaltantes.length > 0) {
    detalle += '\n💧 Conductividad Agua:\n' + condFaltantes.map(f => '  • ' + f).join('\n');
  }

  const subject = '📝 [Registros Lab] Datos pendientes del día ' + dia + ' de ' + meses[mes - 1];
  const body = 'Estimado/a,\n\n' +
    'Los siguientes registros del día ' + dia + ' de ' + meses[mes - 1] + ' ' + anio +
    ' no han sido completados:\n' +
    detalle + '\n\n' +
    'Por favor, complete los registros pendientes a la brevedad.\n\n' +
    'Enlace al aplicativo:\n' + SHEET_URL + '\n\n' +
    '---\n' +
    'Este mensaje fue enviado automáticamente.\n' +
    'Registros Mensuales — Laboratorio Clínico — Hospital de Talca\n';

  MailApp.sendEmail({ to: EMAIL_ALERTS.default, subject: subject, body: body });
}

// ── Setup de Triggers (ejecutar una vez) ──────────────────────

function setupTriggers() {
  // Eliminar triggers anteriores de estas funciones
  const existingTriggers = ScriptApp.getProjectTriggers();
  existingTriggers.forEach(t => {
    const fn = t.getHandlerFunction();
    if (fn === 'triggerRecordatorioMesAnterior' || fn === 'triggerDatosNoRellenados') {
      ScriptApp.deleteTrigger(t);
    }
  });

  // Trigger diario a las 08:00 para recordatorio de mes anterior (solo actúa el día 1)
  ScriptApp.newTrigger('triggerRecordatorioMesAnterior')
    .timeBased()
    .atHour(8)
    .everyDays(1)
    .create();

  // Trigger diario a las 20:00 para datos no rellenados del día
  ScriptApp.newTrigger('triggerDatosNoRellenados')
    .timeBased()
    .atHour(20)
    .everyDays(1)
    .create();

  Logger.log('Triggers configurados correctamente.');
  return 'Triggers configurados: triggerRecordatorioMesAnterior (08:00), triggerDatosNoRellenados (20:00)';
}

// ── Inicialización del Spreadsheet ───────────────────────────

function initializeSpreadsheet() {
  const ss = getSpreadsheet();
  const defs = [
    // Registros primero
    { name: SHEETS.TERMO,       headers: ['Responsable','Temperatura (°C)','Humedad (%)','Fecha (dd/mm/aaaa)','Día','Mes','Año','Turno','Area','Acción Correctiva','Observaciones','Timestamp','Revisado Por','Fecha Revisión'],
      hideCols: [5,6,7,12] },
    { name: SHEETS.CENT_REG,    headers: ['Fecha (dd/mm/aaaa)','Día','Mes','Año','Centrifuga','Responsable','Tipo Mantención','Observaciones','Timestamp','Revisado Por','Fecha Revisión'],
      hideCols: [2,3,4,9] },
    { name: SHEETS.MESONES,     headers: ['Fecha (dd/mm/aaaa)','Día','Mes','Año','Sala','Responsable','Observaciones','Timestamp','Revisado Por','Fecha Revisión'],
      hideCols: [2,3,4,8] },
    { name: SHEETS.REFRI_REG,   headers: ['Responsable','Temperatura (°C)','Fecha (dd/mm/aaaa)','Día','Mes','Año','Turno','Equipo','Tipo','Acción Correctiva','Observaciones','Timestamp','Revisado Por','Fecha Revisión'],
      hideCols: [4,5,6,12] },
    { name: SHEETS.LIMP_REFRI,  headers: ['Fecha (dd/mm/aaaa)','Día','Mes','Año','Tipo Mantención','Equipo','Responsable','Observaciones','Timestamp','Revisado Por','Fecha Revisión'],
      hideCols: [2,3,4,9] },
    { name: SHEETS.CONDUCT_REG, headers: ['Responsable','Conductividad (µS/cm)','Fecha (dd/mm/aaaa)','Día','Mes','Año','Turno','Observaciones','Timestamp','Revisado Por','Fecha Revisión'],
      hideCols: [4,5,6,9] },
    { name: SHEETS.REVISIONES,  headers: ['Mes','Año','Estado','Timestamp'] },
    // Maestros al final
    { name: SHEETS.AREAS,       headers: ['Area'] },
    { name: SHEETS.CENTRIFUGAS, headers: ['Centrifuga'] },
    { name: SHEETS.SALAS,       headers: ['Sala'] },
    { name: SHEETS.REFRI_MASTER, headers: ['Equipo','Tipo','Temp Min (°C)','Temp Max (°C)'] },
    { name: SHEETS.REFRI_LIMP_MASTER, headers: ['Equipo'] },
    { name: SHEETS.ACCIONES,    headers: ['Acción'] }
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

  // Maestro Refrigeradores (Equipo, Tipo, TempMin, TempMax)
  const refriSheet = ss.getSheetByName(SHEETS.REFRI_MASTER);
  [['R1','Refrigerador',2,8],['R2','Refrigerador',2,8],['R3','Refrigerador',2,8],
   ['C1','Congelador',-30,-15],['C2','Congelador',-30,-15],['C3','Congelador',-80,-50]]
    .forEach(r => refriSheet.appendRow(r));

  // Maestro Limpieza Refrigeradores
  const refriLimpSheet = ss.getSheetByName(SHEETS.REFRI_LIMP_MASTER);
  ['R1','R2','R3','C1','C2','C3'].forEach(e => refriLimpSheet.appendRow([e]));

  const accionesSheet = ss.getSheetByName(SHEETS.ACCIONES);
  ['En observación'].forEach(a => accionesSheet.appendRow([a]));

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
