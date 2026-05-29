// ============================================================
// PROYECTO RM — Registros Laboratorio — Hospital de Talca
// Backend: Google Apps Script  v4.0
//
// ⚠️ REGLA CRÍTICA Y MANDATORIA:
// NO SE DEBEN MODIFICAR las rutas de enrutamiento (parámetros de consulta
// como ?area=..., ?sala=..., ?centrifuga=..., ?grupo=..., ?refri=..., ?limprefri=..., ?modulo=conductividad, ?etiquetadora=...)
// ni alterar la URL base de la aplicación.
// Los códigos QR correspondientes ya han sido impresos y pegados físicamente en sus respectivas áreas.
// Cualquier modificación a los nombres de estos parámetros romperá el prellenado y redireccionamiento de los códigos QR activos.
// ============================================================

const PASSWORD_REVISION = 'HRT123';
const SHEET_URL      = 'https://docs.google.com/spreadsheets/d/1HzHcRriBtPGQxTfFrZSntVeM8ujQHWnGFuyWrJo6KUQ';

// Sistema de alertas multi-destinatario
const EMAIL_ALERTS = {
  default:        'grivera@hospitaldetalca.cl',
  conductividad:  'grivera@hospitaldetalca.cl'  // Cambiar cuando se defina el destinatario
};

// Configuración de mantenciones semanales (escalable: agregar nuevas aquí)
const MANTENCIONES_SEMANALES = [
  {
    nombre: 'Centrífugas (Semanal)',
    hoja: 'Reg. Centrífugas',
    colFecha: 0,        // columna de Fecha (0-indexed)
    filtro: function(row) { return String(row[6]).trim() === 'Semanal'; } // col 6 = Tipo Mantención
  },
  {
    nombre: 'Limpieza Refrigeradores (Semanal externa)',
    hoja: 'Reg. Limpieza Refrigeradores',
    colFecha: 0,
    filtro: function(row) { return String(row[4]).trim() === 'Semanal (externa)'; } // col 4 = Tipo Mantención
  }
];

const SHEETS = {
  TERMO:            'Reg. Temp./Humedad',
  CENT_REG:         'Reg. Centrífugas',
  MESONES:          'Reg. Mesones',
  REFRI_REG:        'Reg. Temp. Refrigeradores',
  LIMP_REFRI:       'Reg. Limpieza Refrigeradores',
  CONDUCT_REG:      'Reg. Conductividad Agua',
  COBAS_REG:        'Reg. Cobas',
  REVISIONES:       'Revisiones',
  AREAS:            'Maestro Areas',
  CENTRIFUGAS:      'Maestro Centrifugas',
  SALAS:            'Maestro Salas',
  REFRI_MASTER:     'Maestro Refrigeradores',
  REFRI_LIMP_MASTER:'Maestro Refri. Limpieza',
  ACCIONES:         'Maestro Acciones',
  ETIQUETADORAS_MASTER: 'Maestro Etiquetadoras',
  ETIQUETADORAS_REG:    'Reg. Etiquetadoras',
  NOTIFICACIONES:       'Maestro Notificaciones'
};

const COBAS_PERIODIC_TASKS = {
  'Semanal': {
    interval: 7,
    items: [
      'Limpieza cubiertas de cubetas (c702)',
      'Limpieza estaciones de lavado (ISE, c702)',
      'Limpieza boca de descarga de tapones (c702)',
      'Chequeo gripper (c702)',
      'Pipe semanal'
    ]
  },
  'Quincenal': {
    interval: 15,
    items: [
      'Limpieza conductos aspiración PC y CC (e801)',
      'Limpieza agujas y sustitución copas PC y CC (e801)',
      'Limpieza agitadores vortex y estaciones de separación (e801)',
      'Limpieza disco incubación y agitador micropartículas (e801)',
      'Limpieza estaciones de lavado (e801)',
      'Pipe quincenal'
    ]
  },
  'Mensual': {
    interval: 30,
    items: [
      'Limpieza bidones de agua',
      'Chequeo recipiente de dilución y limpieza filtros de aspiración (ISE)',
      'Limpieza baño de incubación y cambio de cubetas (c702)',
      'Limpieza filtros de aspiración de detergentes (c702)',
      'Limpieza filtros de aire (c702/e801)',
      'Limpieza pasos de flujo ECL y prelavado (e801)'
    ]
  },
  'Cada 2 meses': {
    interval: 60,
    items: [
      'Sustitución de electrodos (Na/K/Cl/Ref/ISE)'
    ]
  },
  'Trimestral': {
    interval: 90,
    items: [
      'Lavado paso de flujo ISE'
    ]
  },
  'Semestral': {
    interval: 180,
    items: [
      'Limpieza agitadores ultrasónicos y filtro de válvula solenoide',
      'Sustitución de electrodo de referencia y lámpara fotométrica'
    ]
  }
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
  
  // Si no hay acción específica en la URL, servimos la interfaz de usuario (frontend)
  if (!action) {
    const tmp = HtmlService.createTemplateFromFile('index');
    tmp.parameter = e.parameter || {};
    return tmp.evaluate()
      .setTitle('Registros Mensuales — Lab Clínico HRT')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }

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
      case 'getEtiquetadoras':  return jsonResponse(getEtiquetadoras());
      case 'getEtiquetadoraHistorial': return jsonResponse(getEtiquetadoraHistorial(e.parameter.etiquetadora));
      case 'getNotificaciones': return jsonResponse(getNotificaciones());
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
      case 'saveCobas':           return jsonResponse(saveCobas(data));
      case 'saveEtiquetadoraRegistro': return jsonResponse(saveEtiquetadoraRegistro(data));
      case 'updateEtiquetadoraMaestro': return jsonResponse(updateEtiquetadoraMaestro(data));
      case 'marcarRevisado':      return jsonResponse(marcarRevisado(data));
      case 'saveNotificaciones':  return jsonResponse(saveNotificaciones(data));
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
    refriLimpieza: getRefriLimpieza(),
    etiquetadoras: getEtiquetadoras(),
    sugerencias: getSugerenciasHistoricas()
  };
}

/** Obtiene valores únicos de una columna específica de una hoja, escaneando desde el final hacia el principio */
function getUniqueColumnValues(sheetName, colIndex) {
  try {
    const sheet = getSheet(sheetName);
    if (!sheet) return [];
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return [];
    
    const values = sheet.getRange(2, colIndex + 1, lastRow - 1, 1).getValues();
    const set = new Set();
    for (let i = values.length - 1; i >= 0; i--) {
      const val = String(values[i][0]).trim();
      if (val && val !== '-' && val !== '—' && val.toLowerCase() !== 'opcional...' && val.toLowerCase() !== 'opcional') {
        set.add(val);
        if (set.size >= 30) break; // Límite de 30 sugerencias por campo
      }
    }
    return Array.from(set);
  } catch (e) {
    Logger.log('Error obteniendo sugerencias para ' + sheetName + ': ' + e.toString());
    return [];
  }
}

/** Compila las sugerencias históricas de observaciones y comentarios de todas las planillas */
function getSugerenciasHistoricas() {
  return {
    termoObs: getUniqueColumnValues(SHEETS.TERMO, 10),
    centObs: getUniqueColumnValues(SHEETS.CENT_REG, 7),
    mesonObs: getUniqueColumnValues(SHEETS.MESONES, 6),
    refriObs: getUniqueColumnValues(SHEETS.REFRI_REG, 10),
    limpRefriObs: getUniqueColumnValues(SHEETS.LIMP_REFRI, 7),
    conductObs: getUniqueColumnValues(SHEETS.CONDUCT_REG, 7),
    etComentario: getUniqueColumnValues(SHEETS.ETIQUETADORAS_MASTER, 8),
    etBitacoraDesc: getUniqueColumnValues(SHEETS.ETIQUETADORAS_REG, 6),
    cobasObs: getUniqueColumnValues(SHEETS.COBAS_REG, 8)
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
    formatFechaDDMMYYYY(f),
    f.dia, f.mes, f.anio,
    data.responsable.toUpperCase().substring(0, 3),
    temp,
    hum,
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
    formatFechaDDMMYYYY(f),
    f.dia, f.mes, f.anio,
    data.responsable.toUpperCase().substring(0, 3),
    temp,
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
    formatFechaDDMMYYYY(f),
    f.dia, f.mes, f.anio,
    data.responsable.toUpperCase().substring(0, 3),
    cond,
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

// Cobas: Fecha | Día | Mes | Año | Equipo | Responsable | Frecuencia | Actividad | Observaciones | Timestamp | Revisado_Por | Fecha_Revisión
function saveCobas(data) {
  if (!data.responsable || !data.fecha || !data.equipo || !data.actividades || !data.actividades.length) {
    return { success: false, error: 'Faltan campos obligatorios.' };
  }
  const f = parseFecha(data.fecha);
  const ts = new Date().toISOString();
  const sheet = getSheet(SHEETS.COBAS_REG);
  
  data.actividades.forEach(act => {
    insertRowAtTop(sheet, [
      formatFechaDDMMYYYY(f), f.dia, f.mes, f.anio,
      data.equipo,
      data.responsable.toUpperCase().substring(0, 3),
      act.frecuencia,
      act.nombre,
      data.observaciones || '',
      ts,
      '',  // Revisado_Por
      ''   // Fecha_Revisión
    ]);
  });
  
  return { success: true, message: data.actividades.length + ' tarea(s) de Cobas guardada(s).' };
}

// ── Dashboard / Consultas ─────────────────────────────────────

function getRegistros(mes, anio) {
  mes  = parseInt(mes);
  anio = parseInt(anio);

  function filtrar(sheet, colMes, colAnio) {
    const rows = sheet.getDataRange().getValues();
    return rows.slice(1).filter(r => parseInt(r[colMes]) === mes && parseInt(r[colAnio]) === anio);
  }

  const termoRaw  = filtrar(getSheet(SHEETS.TERMO),    2, 3);
  const centRaw   = filtrar(getSheet(SHEETS.CENT_REG), 2, 3);
  const mesoRaw   = filtrar(getSheet(SHEETS.MESONES),  2, 3);
  const refriRaw  = filtrar(getSheet(SHEETS.REFRI_REG), 2, 3);
  const limpRaw   = filtrar(getSheet(SHEETS.LIMP_REFRI), 2, 3);
  const condRaw   = filtrar(getSheet(SHEETS.CONDUCT_REG), 2, 3);
  const cobasRaw  = filtrar(getSheet(SHEETS.COBAS_REG), 2, 3);

  const termo = termoRaw.map(r => ({
    fecha: r[0], dia: r[1], mes: r[2], anio: r[3],
    responsable: r[4], temperatura: r[5], humedad: r[6], turno: r[7],
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

  const refriTemp = refriRaw.map(r => ({
    fecha: r[0], dia: r[1], mes: r[2], anio: r[3],
    responsable: r[4], temperatura: r[5], turno: r[6],
    equipo: r[7], tipo: r[8], accion_correctiva: r[9] || '', observaciones: r[10],
    revisado_por: r[12] || '', fecha_revision: r[13] || ''
  }));

  const limpiezaRefri = limpRaw.map(r => ({
    fecha: r[0], dia: r[1], mes: r[2], anio: r[3],
    tipo_mantencion: r[4], equipo: r[5], responsable: r[6], observaciones: r[7],
    revisado_por: r[9] || '', fecha_revision: r[10] || ''
  }));

  const conductividad = condRaw.map(r => ({
    fecha: r[0], dia: r[1], mes: r[2], anio: r[3],
    responsable: r[4], conductividad: r[5], turno: r[6], observaciones: r[7],
    revisado_por: r[9] || '', fecha_revision: r[10] || ''
  }));

  const cobas = cobasRaw.map(r => ({
    fecha: r[0], dia: r[1], mes: r[2], anio: r[3],
    equipo: r[4], responsable: r[5], frecuencia: r[6], actividad: r[7],
    observaciones: r[8], revisado_por: r[10] || '', fecha_revision: r[11] || ''
  }));

  return { mes, anio, termo, centrifugas, mesones, refriTemp, limpiezaRefri, conductividad, cobas };
}

function getRevision(mes, anio) {
  const rows = getSheet(SHEETS.REVISIONES).getDataRange().getValues();
  // Collect all revision entries for this month/year
  const revisiones = [];
  for (let i = 1; i < rows.length; i++) {
    if (parseInt(rows[i][0]) === parseInt(mes) && parseInt(rows[i][1]) === parseInt(anio)) {
      revisiones.push({
        mes: rows[i][0], anio: rows[i][1],
        registros: String(rows[i][2] || '').split(',').map(s => s.trim()).filter(Boolean),
        revisor: rows[i][3] || '',
        timestamp: rows[i][4] || ''
      });
    }
  }
  // Build a set of all reviewed register types
  const revisados = new Set();
  revisiones.forEach(rev => rev.registros.forEach(r => revisados.add(r)));
  return { revisiones, revisados: Array.from(revisados) };
}

// ── Revisiones ────────────────────────────────────────────────

function marcarRevisado(data) {
  if (data.password !== PASSWORD_REVISION) {
    return { success: false, error: 'Contraseña incorrecta.' };
  }
  const registros = data.registros || [];
  if (registros.length === 0) {
    return { success: false, error: 'Seleccione al menos un registro para revisar.' };
  }
  const revisor = (data.revisor || 'REV').toUpperCase().substring(0, 3);
  const mes  = parseInt(data.mes);
  const anio = parseInt(data.anio);
  const sheet = getSheet(SHEETS.REVISIONES);
  const ts    = new Date().toISOString();
  const fechaRev = new Date().toLocaleDateString('es-CL');

  // Agregar nueva fila de revisión (permite múltiples revisiones parciales)
  sheet.appendRow([mes, anio, registros.join(','), revisor, ts]);

  // Mapa de qué hojas corresponden a cada registro seleccionable
  const STAMP_MAP = {
    termo:        { sheet: SHEETS.TERMO,        colMes: 2, colAnio: 3, colRev: 12, colFecha: 13 },
    centrifugas:  { sheet: SHEETS.CENT_REG,     colMes: 2, colAnio: 3, colRev: 9,  colFecha: 10 },
    mesones:      { sheet: SHEETS.MESONES,       colMes: 2, colAnio: 3, colRev: 8,  colFecha: 9  },
    refriTemp:    { sheet: SHEETS.REFRI_REG,     colMes: 2, colAnio: 3, colRev: 12, colFecha: 13 },
    limpRefri:    { sheet: SHEETS.LIMP_REFRI,    colMes: 2, colAnio: 3, colRev: 9,  colFecha: 10 },
    conductividad:{ sheet: SHEETS.CONDUCT_REG,   colMes: 2, colAnio: 3, colRev: 9,  colFecha: 10 },
    cobas:        { sheet: SHEETS.COBAS_REG,     colMes: 2, colAnio: 3, colRev: 10, colFecha: 11 }
  };

  // Solo hacer stamp en los registros seleccionados
  registros.forEach(function(reg) {
    const cfg = STAMP_MAP[reg];
    if (cfg) {
      stampRevision(getSheet(cfg.sheet), cfg.colMes, cfg.colAnio, mes, anio, revisor, fechaRev, cfg.colRev, cfg.colFecha);
    }
  });

  const nombres = {
    termo: 'Temp. Ambiental', centrifugas: 'Centrífugas', mesones: 'Mesones',
    refriTemp: 'Temp. Refrigeradores', limpRefri: 'Limp. Refrigeradores', conductividad: 'Conductividad',
    cobas: 'Mantención Cobas'
  };
  const nombresRev = registros.map(function(r) { return nombres[r] || r; }).join(', ');
  return { success: true, message: 'Revisión confirmada por ' + revisor + ': ' + nombresRev };
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

  const to = getEmailRecipients('termo');
  if (to) {
    MailApp.sendEmail({ to: to, subject: subject, body: body });
  }
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

  const to = getEmailRecipients('refriTemp');
  if (to) {
    MailApp.sendEmail({ to: to, subject: subject, body: body });
  }
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

  const to = getEmailRecipients('conductividad');
  if (to) {
    MailApp.sendEmail({ to: to, subject: subject, body: body });
  }
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
  // Considerar revisado si todos los tipos principales están revisados
  const allTypes = ['termo','centrifugas','mesones','refriTemp','limpRefri','conductividad'];
  const allRevisados = allTypes.every(function(t) { return rev.revisados.indexOf(t) !== -1; });
  if (allRevisados) return;

  const faltantes = allTypes.filter(function(t) { return rev.revisados.indexOf(t) === -1; });
  const nombres = {
    termo: 'Temp. Ambiental', centrifugas: 'Centrífugas', mesones: 'Mesones',
    refriTemp: 'Temp. Refrigeradores', limpRefri: 'Limp. Refrigeradores', conductividad: 'Conductividad'
  };

  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                 'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const nombreMes = meses[mesAnterior - 1];

  // Group by recipient email
  const emailBuckets = {};

  faltantes.forEach(function(clave) {
    const recipientsStr = getEmailRecipients(clave);
    if (!recipientsStr) return; // Paused or no recipients
    
    const emails = recipientsStr.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
    emails.forEach(email => {
      if (!emailBuckets[email]) emailBuckets[email] = [];
      emailBuckets[email].push('  • ' + (nombres[clave] || clave));
    });
  });

  // Send combined emails
  Object.keys(emailBuckets).forEach(email => {
    const list = emailBuckets[email];
    if (list.length === 0) return;

    const detalleFaltantes = list.join('\n');
    const subject = '📋 [Registros Lab] Recordatorio: Revisar registros de ' + nombreMes + ' ' + anioAnterior;
    const body = 'Estimado/a,\n\n' +
      'Le recordamos que los siguientes registros de ' + nombreMes + ' ' + anioAnterior +
      ' bajo su responsabilidad aún no han sido marcados como revisados:\n\n' +
      detalleFaltantes + '\n\n' +
      'Por favor, ingrese al aplicativo y confirme la revisión del mes anterior.\n\n' +
      'Enlace a los datos:\n' + SHEET_URL + '\n\n' +
      '---\n' +
      'Este mensaje fue enviado automáticamente.\n' +
      'Registros Mensuales — Laboratorio Clínico — Hospital de Talca\n';

    try {
      MailApp.sendEmail({ to: email, subject: subject, body: body });
    } catch (e) {
      Logger.log('Error enviando correo mensual a ' + email + ': ' + e.toString());
    }
  });
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

  // Gather missing items per key
  const missingByRegister = {};

  // Temperatura/Humedad faltantes
  const termoFaltantes = [];
  areas.forEach(area => {
    ['Mañana', 'Tarde'].forEach(turno => {
      const existe = reg.termo.some(r => parseInt(r.dia) === dia && r.area === area && r.turno === turno);
      if (!existe) termoFaltantes.push(area + ' (' + turno + ')');
    });
  });
  if (termoFaltantes.length > 0) {
    missingByRegister['termo'] = { name: '🌡️ Temperatura/Humedad Ambiental', items: termoFaltantes };
  }

  // Centrífugas faltantes (solo mantenimiento Diario)
  const centFaltantes = [];
  centrifugas.forEach(c => {
    const existe = reg.centrifugas.some(r => parseInt(r.dia) === dia && r.centrifuga === c && r.tipo_mantencion === 'Diaria');
    if (!existe) centFaltantes.push(c);
  });
  if (centFaltantes.length > 0) {
    missingByRegister['centrifugas'] = { name: '⚙️ Centrífugas (Diaria)', items: centFaltantes };
  }

  // Mesones faltantes
  const mesonFaltantes = [];
  salas.forEach(s => {
    const existe = reg.mesones.some(r => parseInt(r.dia) === dia && r.sala === s);
    if (!existe) mesonFaltantes.push(s);
  });
  if (mesonFaltantes.length > 0) {
    missingByRegister['mesones'] = { name: '🧽 Limpieza de Mesones', items: mesonFaltantes };
  }

  // Temp Refrigeradores faltantes (AM y PM)
  const refriFaltantes = [];
  refrigeradores.forEach(r => {
    ['Mañana', 'Tarde'].forEach(turno => {
      const existe = reg.refriTemp.some(rt => parseInt(rt.dia) === dia && rt.equipo === r.equipo && rt.turno === turno);
      if (!existe) refriFaltantes.push(r.equipo + ' (' + turno + ')');
    });
  });
  if (refriFaltantes.length > 0) {
    missingByRegister['refriTemp'] = { name: '🧊 Temp. Refrigeradores', items: refriFaltantes };
  }

  // Conductividad faltantes (AM y PM)
  const condFaltantes = [];
  ['Mañana', 'Tarde'].forEach(turno => {
    const existe = reg.conductividad.some(c => parseInt(c.dia) === dia && c.turno === turno);
    if (!existe) condFaltantes.push('Conductividad (' + turno + ')');
  });
  if (condFaltantes.length > 0) {
    missingByRegister['conductividad'] = { name: '💧 Conductividad Agua', items: condFaltantes };
  }

  // Cobas diarias faltantes
  const cobasFaltantes = [];
  const cobasEquipos = ['Cobas 1', 'Cobas 2'];
  const cobasDiarias = [
    'Limpieza pipeta y puertos de vaciado (ISE)',
    'Limpieza pipetas y agujas de lavado (c702)',
    'Limpieza pipetas, agujas prelavado y sipper (e801)',
    'Pipe diario y rack verde'
  ];
  const cobasHoy = reg.cobas ? reg.cobas.filter(r => parseInt(r.dia) === dia) : [];
  cobasEquipos.forEach(eq => {
    cobasDiarias.forEach(act => {
      const existe = cobasHoy.some(r => r.equipo === eq && r.actividad === act);
      if (!existe) cobasFaltantes.push(eq + ': ' + act);
    });
  });
  if (cobasFaltantes.length > 0) {
    missingByRegister['cobas'] = { name: '🔬 Mantención Cobas (Diaria)', items: cobasFaltantes };
  }

  // Map to recipient emails
  const emailBuckets = {};

  Object.keys(missingByRegister).forEach(clave => {
    const recipientsStr = getEmailRecipients(clave);
    if (!recipientsStr) return; // Paused or no recipients
    
    const emails = recipientsStr.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
    emails.forEach(email => {
      if (!emailBuckets[email]) emailBuckets[email] = [];
      emailBuckets[email].push(missingByRegister[clave]);
    });
  });

  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                 'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  // Send consolidated emails
  Object.keys(emailBuckets).forEach(email => {
    const list = emailBuckets[email];
    if (list.length === 0) return;

    let detailText = '';
    list.forEach(regInfo => {
      detailText += '\n' + regInfo.name + ':\n' + regInfo.items.map(f => '  • ' + f).join('\n') + '\n';
    });

    const subject = '📝 [Registros Lab] Datos pendientes del día ' + dia + ' de ' + meses[mes - 1];
    const body = 'Estimado/a,\n\n' +
      'Los siguientes registros correspondientes al día ' + dia + ' de ' + meses[mes - 1] + ' ' + anio +
      ' bajo su responsabilidad no han sido completados:\n' +
      detailText + '\n' +
      'Por favor, complete los registros pendientes a la brevedad.\n\n' +
      'Enlace al aplicativo:\n' + SHEET_URL + '\n\n' +
      '---\n' +
      'Este mensaje fue enviado automáticamente.\n' +
      'Registros Mensuales — Laboratorio Clínico — Hospital de Talca\n';

    try {
      MailApp.sendEmail({ to: email, subject: subject, body: body });
    } catch (e) {
      Logger.log('Error enviando correo diario a ' + email + ': ' + e.toString());
    }
  });
}

// ── Email — Alerta Mantenciones Semanales Vencidas ────────────

function triggerMantencionSemanal() {
  const hoy = new Date();
  const missingByRegister = {};

  MANTENCIONES_SEMANALES.forEach(function(mant) {
    try {
      const sheet = getSpreadsheet().getSheetByName(mant.hoja);
      if (!sheet) return;
      const rows = sheet.getDataRange().getValues();
      let ultimaFecha = null;

      for (var i = 1; i < rows.length; i++) {
        // Aplicar filtro específico del tipo de mantención
        if (mant.filtro && !mant.filtro(rows[i])) continue;

        // Parsear fecha dd/mm/yyyy
        var fechaStr = String(rows[i][mant.colFecha]);
        var partes = fechaStr.split('/');
        if (partes.length === 3) {
          var fecha = new Date(parseInt(partes[2]), parseInt(partes[1]) - 1, parseInt(partes[0]));
          if (!ultimaFecha || fecha > ultimaFecha) {
            ultimaFecha = fecha;
          }
        }
      }

      let isOverdue = false;
      let diasSinRegistro = '';
      let ultimaFechaStr = 'Nunca';

      if (!ultimaFecha) {
        isOverdue = true;
        diasSinRegistro = '∞ (sin registros)';
      } else {
        var diffMs = hoy.getTime() - ultimaFecha.getTime();
        var diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (diffDias > 7) {
          isOverdue = true;
          diasSinRegistro = diffDias + ' días';
          ultimaFechaStr = ultimaFecha.toLocaleDateString('es-CL');
        }
      }

      if (isOverdue) {
        let clave = '';
        if (mant.nombre.indexOf('Centrífugas') !== -1) clave = 'centrifugas';
        else if (mant.nombre.indexOf('Limpieza Refrigeradores') !== -1) clave = 'limpRefri';
        
        if (clave) {
          missingByRegister[clave] = {
            nombre: mant.nombre,
            ultimaFecha: ultimaFechaStr,
            diasSinRegistro: diasSinRegistro
          };
        }
      }
    } catch (e) {
      Logger.log('Error verificado mantención ' + mant.nombre + ': ' + e.toString());
    }
  });

  // Group by email
  const emailBuckets = {};

  Object.keys(missingByRegister).forEach(clave => {
    const recipientsStr = getEmailRecipients(clave);
    if (!recipientsStr) return; // Paused or empty
    
    const emails = recipientsStr.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
    emails.forEach(email => {
      if (!emailBuckets[email]) emailBuckets[email] = [];
      emailBuckets[email].push(missingByRegister[clave]);
    });
  });

  // Send emails
  Object.keys(emailBuckets).forEach(email => {
    const vencidas = emailBuckets[email];
    if (vencidas.length === 0) return;

    var detail = vencidas.map(function(v) {
      return '  • ' + v.nombre + '\n    Último registro: ' + v.ultimaFecha + '\n    Días sin registro: ' + v.diasSinRegistro;
    }).join('\n\n');

    var subject = '🔔 [Registros Lab] Mantenciones semanales vencidas (' + vencidas.length + ')';
    var body = 'Estimado/a,\n\n' +
      'Las siguientes mantenciones semanales bajo su responsabilidad llevan más de 7 días sin registrarse:\n\n' +
      detail + '\n\n' +
      'Por favor, realice las mantenciones pendientes a la brevedad.\n\n' +
      'Enlace al aplicativo:\n' + SHEET_URL + '\n\n' +
      '---\n' +
      'Este mensaje fue enviado automáticamente.\n' +
      'Registros Mensuales — Laboratorio Clínico — Hospital de Talca\n';

    try {
      MailApp.sendEmail({ to: email, subject: subject, body: body });
    } catch (e) {
      Logger.log('Error enviando correo semanal a ' + email + ': ' + e.toString());
    }
  });

  // Ejecutar alerta periódica de Cobas
  try {
    triggerAlertaMantencionesCobas();
  } catch(e) {
    Logger.log('Error en triggerAlertaMantencionesCobas: ' + e.toString());
  }
}

function sendAlertaMantencionSemanal(vencidas) {
  // Función mantenida por compatibilidad pero vacía ya que el envío ahora se realiza agrupado en triggerMantencionSemanal
}

function checkCobasPeriodicasVencidas() {
  const hoy = new Date();
  const sheet = getSheet(SHEETS.COBAS_REG);
  if (!sheet) return [];
  
  const rows = sheet.getDataRange().getValues();
  const ultimasFechas = {};
  
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const fechaStr = String(r[0]);
    const equipo = String(r[4]);
    const freq = String(r[6]);
    const actividad = String(r[7]);
    
    if (freq === 'Diaria' || freq === 'Según sea necesario') continue;
    
    const partes = fechaStr.split('/');
    if (partes.length === 3) {
      const fecha = new Date(parseInt(partes[2]), parseInt(partes[1]) - 1, parseInt(partes[0]));
      const key = equipo + '|' + actividad;
      if (!ultimasFechas[key] || fecha > ultimasFechas[key]) {
        ultimasFechas[key] = fecha;
      }
    }
  }
  
  const vencidas = [];
  const equipos = ['Cobas 1', 'Cobas 2'];
  
  equipos.forEach(eq => {
    Object.keys(COBAS_PERIODIC_TASKS).forEach(freq => {
      const config = COBAS_PERIODIC_TASKS[freq];
      config.items.forEach(act => {
        const key = eq + '|' + act;
        const ultimaFecha = ultimasFechas[key];
        
        let isOverdue = false;
        let diffDias = 0;
        
        if (!ultimaFecha) {
          isOverdue = true;
        } else {
          const diffMs = hoy.getTime() - ultimaFecha.getTime();
          diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          if (diffDias > config.interval) {
            isOverdue = true;
          }
        }
        
        if (isOverdue) {
          vencidas.push({
            equipo: eq,
            actividad: act,
            frecuencia: freq,
            ultimaFechaStr: ultimaFecha ? ultimaFecha.toLocaleDateString('es-CL') : 'Nunca',
            diasSinRegistro: ultimaFecha ? diffDias + ' días' : '∞ (sin registros)'
          });
        }
      });
    });
  });
  
  return vencidas;
}

function triggerAlertaMantencionesCobas() {
  const vencidas = checkCobasPeriodicasVencidas();
  if (!vencidas || vencidas.length === 0) return;
  
  const recipients = getEmailRecipients('cobas');
  if (!recipients) return;
  
  const subject = '⚠️ [Registros Lab] Alerta: Mantenciones periódicas de Cobas vencidas (' + vencidas.length + ')';
  
  const eqGroup = { 'Cobas 1': [], 'Cobas 2': [] };
  vencidas.forEach(v => {
    if (eqGroup[v.equipo]) {
      eqGroup[v.equipo].push('  • [' + v.frecuencia + '] ' + v.actividad + '\n    Último registro: ' + v.ultimaFechaStr + ' (hace ' + v.diasSinRegistro + ')');
    }
  });
  
  const detailsList = [];
  if (eqGroup['Cobas 1'].length > 0) {
    detailsList.push('🤖 COBAS 1:\n' + eqGroup['Cobas 1'].join('\n\n'));
  }
  if (eqGroup['Cobas 2'].length > 0) {
    detailsList.push('🤖 COBAS 2:\n' + eqGroup['Cobas 2'].join('\n\n'));
  }
  
  const body = 'Estimado/a,\n\n' +
    'Se ha detectado que las siguientes mantenciones periódicas de los equipos Cobas 1 y 2 están vencidas en el sistema:\n\n' +
    detailsList.join('\n\n') + '\n\n' +
    'Por favor, realice las mantenciones pendientes y regístrelas en el aplicativo a la brevedad.\n\n' +
    'Enlace al aplicativo:\n' + SHEET_URL + '\n\n' +
    '---\n' +
    'Este mensaje fue enviado automáticamente.\n' +
    'Registros Mensuales — Laboratorio Clínico — Hospital de Talca\n';
    
  try {
    MailApp.sendEmail({ to: recipients, subject: subject, body: body });
    Logger.log('Correo de alerta de Cobas enviado a: ' + recipients);
  } catch (e) {
    Logger.log('Error enviando correo de Cobas: ' + e.toString());
  }
}

// ── Setup de Triggers (ejecutar una vez) ──────────────────────

function setupTriggers() {
  // Eliminar triggers anteriores de estas funciones
  const existingTriggers = ScriptApp.getProjectTriggers();
  existingTriggers.forEach(t => {
    const fn = t.getHandlerFunction();
    if (fn === 'triggerRecordatorioMesAnterior' || fn === 'triggerDatosNoRellenados' || fn === 'triggerMantencionSemanal') {
      ScriptApp.deleteTrigger(t);
    }
  });

  // Trigger diario a las 08:00 para recordatorio de mes anterior (solo actúa el día 1)
  ScriptApp.newTrigger('triggerRecordatorioMesAnterior')
    .timeBased()
    .atHour(8)
    .everyDays(1)
    .create();

  // Trigger diario a las 09:00 para mantenciones semanales vencidas
  ScriptApp.newTrigger('triggerMantencionSemanal')
    .timeBased()
    .atHour(9)
    .everyDays(1)
    .create();

  // Trigger diario a las 20:00 para datos no rellenados del día
  ScriptApp.newTrigger('triggerDatosNoRellenados')
    .timeBased()
    .atHour(20)
    .everyDays(1)
    .create();

  Logger.log('Triggers configurados correctamente.');
  return 'Triggers configurados: triggerRecordatorioMesAnterior (08:00), triggerMantencionSemanal (09:00), triggerDatosNoRellenados (20:00)';
}

// ── Inicialización del Spreadsheet ───────────────────────────

function initializeSpreadsheet() {
  const ss = getSpreadsheet();
  const defs = [
    // Registros primero
    { name: SHEETS.TERMO,       headers: ['Fecha (dd/mm/aaaa)','Día','Mes','Año','Responsable','Temperatura (°C)','Humedad (%)','Turno','Area','Acción Correctiva','Observaciones','Timestamp','Revisado Por','Fecha Revisión'],
      hideCols: [2,3,4,12] },
    { name: SHEETS.CENT_REG,    headers: ['Fecha (dd/mm/aaaa)','Día','Mes','Año','Centrifuga','Responsable','Tipo Mantención','Observaciones','Timestamp','Revisado Por','Fecha Revisión'],
      hideCols: [2,3,4,9] },
    { name: SHEETS.MESONES,     headers: ['Fecha (dd/mm/aaaa)','Día','Mes','Año','Sala','Responsable','Observaciones','Timestamp','Revisado Por','Fecha Revisión'],
      hideCols: [2,3,4,8] },
    { name: SHEETS.REFRI_REG,   headers: ['Fecha (dd/mm/aaaa)','Día','Mes','Año','Responsable','Temperatura (°C)','Turno','Equipo','Tipo','Acción Correctiva','Observaciones','Timestamp','Revisado Por','Fecha Revisión'],
      hideCols: [2,3,4,12] },
    { name: SHEETS.LIMP_REFRI,  headers: ['Fecha (dd/mm/aaaa)','Día','Mes','Año','Tipo Mantención','Equipo','Responsable','Observaciones','Timestamp','Revisado Por','Fecha Revisión'],
      hideCols: [2,3,4,9] },
    { name: SHEETS.CONDUCT_REG, headers: ['Fecha (dd/mm/aaaa)','Día','Mes','Año','Responsable','Conductividad (µS/cm)','Turno','Observaciones','Timestamp','Revisado Por','Fecha Revisión'],
      hideCols: [2,3,4,9] },
    { name: SHEETS.COBAS_REG,   headers: ['Fecha (dd/mm/aaaa)','Día','Mes','Año','Equipo','Responsable','Frecuencia','Actividad','Observaciones','Timestamp','Revisado Por','Fecha Revisión'],
      hideCols: [2,3,4,10] },
    { name: SHEETS.REVISIONES,  headers: ['Mes','Año','Registros','Revisor','Timestamp'] },
    { name: SHEETS.ETIQUETADORAS_REG, headers: ['Fecha (dd/mm/aaaa)','Día','Mes','Año','Etiquetadora','Accion','Descripcion','Responsable'],
      hideCols: [2,3,4] },
    // Maestros al final
    { name: SHEETS.AREAS,       headers: ['Area'] },
    { name: SHEETS.CENTRIFUGAS, headers: ['Centrifuga'] },
    { name: SHEETS.SALAS,       headers: ['Sala'] },
    { name: SHEETS.REFRI_MASTER, headers: ['Equipo','Tipo','Temp Min (°C)','Temp Max (°C)'] },
    { name: SHEETS.REFRI_LIMP_MASTER, headers: ['Equipo'] },
    { name: SHEETS.ACCIONES,    headers: ['Acción'] },
    { name: SHEETS.ETIQUETADORAS_MASTER, headers: ['Nombre Real','ID','Nombre Práctico','Modelo','Tipo de Conexión','Dirección IP','Piso','Ubicación','Comentario'] },
    { name: SHEETS.NOTIFICACIONES, headers: ['Registro','Clave','Destinatarios','Pausado'] }
  ];

  const newlyCreated = {};

  defs.forEach(def => {
    let sheet = ss.getSheetByName(def.name);
    if (!sheet) {
      sheet = ss.insertSheet(def.name);
      newlyCreated[def.name] = true;
    }
    
    // Ensure column count is sufficient
    const needed = def.headers.length;
    const current = sheet.getMaxColumns();
    if (current < needed) {
      sheet.insertColumnsAfter(current, needed - current);
    }
    
    // Enforce headers on the first row
    sheet.getRange(1, 1, 1, needed).setValues([def.headers]);
    sheet.getRange(1, 1, 1, needed)
      .setBackground('#0F172A').setFontColor('#FFFFFF').setFontWeight('bold');
    sheet.setFrozenRows(1);
    
    // Enforce column visibility
    if (sheet.getMaxColumns() > 0) {
      sheet.showColumns(1, sheet.getMaxColumns());
    }
    if (def.hideCols) {
      def.hideCols.forEach(col => {
        if (col <= sheet.getMaxColumns()) {
          sheet.hideColumns(col);
        }
      });
    }
  });

  // Maestros iniciales (solo si se acaba de crear la hoja)
  if (newlyCreated[SHEETS.AREAS]) {
    const areasSheet = ss.getSheetByName(SHEETS.AREAS);
    ['Microbiología', 'Hematología', 'Química'].forEach(a => areasSheet.appendRow([a]));
  }

  if (newlyCreated[SHEETS.CENTRIFUGAS]) {
    const centSheet = ss.getSheetByName(SHEETS.CENTRIFUGAS);
    ['Centrífuga 1','Centrífuga 2','Centrífuga 3','Centrífuga 4','Centrífuga 5','Centrífuga 18'].forEach(c => centSheet.appendRow([c]));
  }

  if (newlyCreated[SHEETS.SALAS]) {
    const salasSheet = ss.getSheetByName(SHEETS.SALAS);
    ['Microbiología', 'Hematología', 'Química'].forEach(s => salasSheet.appendRow([s]));
  }

  if (newlyCreated[SHEETS.REFRI_MASTER]) {
    const refriSheet = ss.getSheetByName(SHEETS.REFRI_MASTER);
    [['R1','Refrigerador',2,8],['R2','Refrigerador',2,8],['R3','Refrigerador',2,8],
     ['C1','Congelador',-30,-15],['C2','Congelador',-30,-15],['C3','Congelador',-80,-50]].forEach(r => refriSheet.appendRow(r));
  }

  if (newlyCreated[SHEETS.REFRI_LIMP_MASTER]) {
    const refriLimpSheet = ss.getSheetByName(SHEETS.REFRI_LIMP_MASTER);
    ['R1','R2','R3','C1','C2','C3'].forEach(e => refriLimpSheet.appendRow([e]));
  }

  if (newlyCreated[SHEETS.ACCIONES]) {
    const accionesSheet = ss.getSheetByName(SHEETS.ACCIONES);
    ['En observación'].forEach(a => accionesSheet.appendRow([a]));
  }

  if (newlyCreated[SHEETS.ETIQUETADORAS_MASTER]) {
    const etMasterSheet = ss.getSheetByName(SHEETS.ETIQUETADORAS_MASTER);
    for (let i = 1; i <= 61; i++) {
      const num2 = String(i).padStart(2, '0');
      etMasterSheet.appendRow([
        'Etiquetadora ' + i,             // Nombre Real
        'EQ-' + num2,                     // ID
        'Etiquetadora ' + num2,          // Nombre Práctico
        'ZD220',                         // Modelo
        'USB',                           // Tipo de Conexión
        'No aplica',                     // Dirección IP
        '1er Piso',                      // Piso
        'Medicina',                      // Ubicación
        '--'                             // Comentario
      ]);
    }
  }

  if (newlyCreated[SHEETS.NOTIFICACIONES] || getSheet(SHEETS.NOTIFICACIONES).getLastRow() <= 1) {
    const notifSheet = ss.getSheetByName(SHEETS.NOTIFICACIONES);
    const defaults = [
      ['Temperatura Ambiental', 'termo', 'grivera@hospitaldetalca.cl', 'FALSE'],
      ['Mantenimiento Centrífugas', 'centrifugas', 'grivera@hospitaldetalca.cl', 'FALSE'],
      ['Limpieza Mesones', 'mesones', 'grivera@hospitaldetalca.cl', 'FALSE'],
      ['Temperatura Refrigeradores', 'refriTemp', 'grivera@hospitaldetalca.cl', 'FALSE'],
      ['Limpieza Refrigeradores', 'limpRefri', 'grivera@hospitaldetalca.cl', 'FALSE'],
      ['Conductividad del Agua', 'conductividad', 'grivera@hospitaldetalca.cl', 'FALSE'],
      ['Mantención Cobas', 'cobas', 'grivera@hospitaldetalca.cl', 'FALSE']
    ];
    if (notifSheet.getLastRow() > 1) {
      notifSheet.deleteRows(2, notifSheet.getLastRow() - 1);
    }
    defaults.forEach(row => notifSheet.appendRow(row));
  }

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
  resetRegistros();
  initializeSpreadsheet();
  return { success: true, message: 'Estructura y registros re-inicializados.' };
}

function resetRegistros() {
  const registroSheets = [
    SHEETS.TERMO, SHEETS.CENT_REG, SHEETS.MESONES,
    SHEETS.REFRI_REG, SHEETS.LIMP_REFRI, SHEETS.CONDUCT_REG,
    SHEETS.COBAS_REG, SHEETS.REVISIONES, SHEETS.ETIQUETADORAS_REG
  ];
  const results = [];
  registroSheets.forEach(function(name) {
    const sheet = getSheet(name);
    if (!sheet) { results.push(name + ': no encontrada'); return; }
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.deleteRows(2, lastRow - 1);
    }
    results.push(name + ': limpiada (' + (lastRow - 1) + ' filas eliminadas)');
  });
  // Update Revisiones headers to new format
  const revSheet = getSheet(SHEETS.REVISIONES);
  if (revSheet) {
    revSheet.getRange(1, 1, 1, 5).setValues([['Mes','Año','Registros','Revisor','Timestamp']]);
    revSheet.getRange(1, 1, 1, 5).setBackground('#0F172A').setFontColor('#FFFFFF').setFontWeight('bold');
  }
  return { success: true, message: 'Registros limpiados', details: results };
}

// ── Etiquetadoras ────────────────────────────────────────────

function getEtiquetadoras() {
  const data = getSheet(SHEETS.ETIQUETADORAS_MASTER).getDataRange().getValues();
  return data.slice(1).filter(r => r[0]).map(r => ({
    nombreReal: String(r[0]),
    id: String(r[1]),
    nombrePractico: String(r[2]),
    modelo: String(r[3]),
    tipoConexion: String(r[4]),
    direccionIp: String(r[5]),
    piso: String(r[6]),
    ubicacion: String(r[7]),
    comentario: String(r[8])
  }));
}

function getEtiquetadoraHistorial(etName) {
  if (!etName) return [];
  const data = getSheet(SHEETS.ETIQUETADORAS_REG).getDataRange().getValues();
  return data.slice(1)
    .filter(r => String(r[4]) === etName)
    .map(r => ({
      fecha: String(r[0]),
      accion: String(r[5]),
      descripcion: String(r[6]),
      responsable: String(r[7])
    }));
}

function saveEtiquetadoraRegistro(data) {
  if (!data.etiquetadora || !data.accion || !data.descripcion || !data.responsable) {
    return { success: false, error: 'Faltan campos obligatorios.' };
  }
  const f = parseFecha(data.fecha || new Date().toISOString().split('T')[0]);
  const ts = new Date().toISOString();
  
  insertRowAtTop(getSheet(SHEETS.ETIQUETADORAS_REG), [
    formatFechaDDMMYYYY(f), f.dia, f.mes, f.anio,
    data.etiquetadora,
    data.accion,
    data.descripcion,
    data.responsable.toUpperCase().substring(0, 3)
  ]);
  
  return { success: true, message: 'Registro de bitácora guardado.' };
}

function updateEtiquetadoraMaestro(data) {
  if (data.password !== PASSWORD_REVISION) {
    return { success: false, error: 'Contraseña incorrecta.' };
  }
  if (!data.nombreReal) {
    return { success: false, error: 'Nombre real es obligatorio.' };
  }
  
  const sheet = getSheet(SHEETS.ETIQUETADORAS_MASTER);
  const rows = sheet.getDataRange().getValues();
  let rowIndex = -1;
  
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === String(data.nombreReal).trim()) {
      rowIndex = i + 1;
      break;
    }
  }
  
  const rowData = [
    data.nombreReal,
    data.id || '',
    data.nombrePractico || '',
    data.modelo || 'ZD220',
    data.tipoConexion || 'USB',
    data.direccionIp || 'No aplica',
    data.piso || '1er Piso',
    data.ubicacion || 'Medicina',
    data.comentario || '--'
  ];
  
  if (rowIndex !== -1) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
    return { success: true, message: 'Ficha de etiquetadora actualizada.' };
  } else {
    sheet.appendRow(rowData);
    return { success: true, message: 'Nueva etiquetadora agregada al maestro.' };
  }
}

// ── Configuración de Notificaciones por Correo ──────────────────

function getNotificaciones() {
  let sheet = getSheet(SHEETS.NOTIFICACIONES);
  if (!sheet) {
    try {
      const ss = getSpreadsheet();
      sheet = ss.insertSheet(SHEETS.NOTIFICACIONES);
      sheet.appendRow(['Registro', 'Clave', 'Destinatarios', 'Pausado']);
    } catch (e) {
      Logger.log('Error al crear hoja de notificaciones: ' + e.toString());
      return [];
    }
  }
  
  let data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    const defaults = [
      ['Temperatura Ambiental', 'termo', 'grivera@hospitaldetalca.cl', 'FALSE'],
      ['Mantenimiento Centrífugas', 'centrifugas', 'grivera@hospitaldetalca.cl', 'FALSE'],
      ['Limpieza Mesones', 'mesones', 'grivera@hospitaldetalca.cl', 'FALSE'],
      ['Temperatura Refrigeradores', 'refriTemp', 'grivera@hospitaldetalca.cl', 'FALSE'],
      ['Limpieza Refrigeradores', 'limpRefri', 'grivera@hospitaldetalca.cl', 'FALSE'],
      ['Conductividad del Agua', 'conductividad', 'grivera@hospitaldetalca.cl', 'FALSE']
    ];
    defaults.forEach(row => sheet.appendRow(row));
    data = sheet.getDataRange().getValues();
  }
  
  return data.slice(1).map(r => ({
    registro: String(r[0]),
    clave: String(r[1]),
    destinatarios: String(r[2]),
    pausado: String(r[3]).toUpperCase() === 'TRUE'
  }));
}

function saveNotificaciones(data) {
  if (data.password !== PASSWORD_REVISION) {
    return { success: false, error: 'Contraseña incorrecta.' };
  }
  if (!data.notificaciones || !data.notificaciones.length) {
    return { success: false, error: 'Datos de notificaciones inválidos.' };
  }
  
  const sheet = getSheet(SHEETS.NOTIFICACIONES);
  if (!sheet) return { success: false, error: 'Hoja de notificaciones no encontrada.' };
  
  // Limpiar datos anteriores
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }
  
  // Guardar nuevos datos
  data.notificaciones.forEach(n => {
    sheet.appendRow([
      n.registro,
      n.clave,
      n.destinatarios || '',
      n.pausado ? 'TRUE' : 'FALSE'
    ]);
  });
  
  return { success: true, message: 'Configuración de notificaciones guardada con éxito.' };
}

function getEmailRecipients(clave) {
  try {
    const list = getNotificaciones();
    const found = list.find(n => n.clave === clave);
    if (found) {
      if (found.pausado) return null;
      if (found.destinatarios) return found.destinatarios;
    }
  } catch (e) {
    Logger.log('Error obteniendo destinatarios para ' + clave + ': ' + e.toString());
  }
  // Fallback
  return (clave === 'conductividad') ? EMAIL_ALERTS.conductividad : EMAIL_ALERTS.default;
}

