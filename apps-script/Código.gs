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
const APP_URL        = 'https://script.google.com/macros/s/AKfycbxuqcui0-hjJ721uMWZk3w-4l2fVCaBWQgdMJqVMb5Pno339Jqetq4r62p3-1gGBUvFOg/exec';
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
  NOTIFICACIONES:       'Maestro Notificaciones',
  DXH900_REG:       'Reg. Reparaciones DxH 900 Urgencias',
  ELIM_MUESTRAS:    'Reg. Eliminación Muestras',
  DIAS_NO_HABILES_HRT: 'Maestro Días No Hábiles HRT',
  PERSONAL:         'Maestro Personal'
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

// Caching settings
const CACHE_TTL_MAESTROS = 1800; // 30 minutes
const CACHE_TTL_REGISTROS = 21600; // 6 hours

function getCacheKey(prefix, ...parts) {
  return prefix + '_' + parts.join('_');
}

function getCachedJson(key) {
  try {
    const val = CacheService.getScriptCache().get(key);
    if (val) {
      return JSON.parse(val);
    }
  } catch (e) {
    Logger.log('Error leyendo caché para ' + key + ': ' + e.toString());
  }
  return null;
}

function setCachedJson(key, data, ttl) {
  try {
    const str = JSON.stringify(data);
    if (str.length < 100000) { // Limit defined by CacheService (100KB)
      CacheService.getScriptCache().put(key, str, ttl);
    } else {
      Logger.log('Caché omitida para ' + key + ' por exceder límite de tamaño (' + str.length + ' bytes)');
    }
  } catch (e) {
    Logger.log('Error escribiendo caché para ' + key + ': ' + e.toString());
  }
}

function clearCacheKeys(keys) {
  try {
    CacheService.getScriptCache().removeAll(keys);
  } catch (e) {
    Logger.log('Error limpiando claves de caché: ' + e.toString());
  }
}

function clearSheetCache(keyPrefix, mes, anio) {
  const cacheKey = getCacheKey('regs', keyPrefix, mes, anio);
  clearCacheKeys([cacheKey]);
}

function clearAllCaches() {
  try {
    const keys = ['maestros_all', 'maestros_all_v3', 'sugerencias_historicas', 'dxh900_hist', 'config_modulos_activos'];
    const now = new Date();
    const curMes = now.getMonth() + 1;
    const curAnio = now.getFullYear();
    ['termo', 'centrifugas', 'mesones', 'refriTemp', 'limpiezaRefri', 'conductividad', 'cobas', 'elimMuestras'].forEach(k => {
      keys.push(getCacheKey('regs', k, curMes, curAnio));
      keys.push(getCacheKey('regs', k, curMes === 1 ? 12 : curMes - 1, curMes === 1 ? curAnio - 1 : curAnio));
    });
    CacheService.getScriptCache().removeAll(keys);
  } catch (e) {
    Logger.log('Error en clearAllCaches: ' + e.toString());
  }
}

const SPREADSHEET_ID_DEFAULT = '1HzHcRriBtPGQxTfFrZSntVeM8ujQHWnGFuyWrJo6KUQ';

function getSpreadsheet() {
  let id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) {
    id = SPREADSHEET_ID_DEFAULT;
  }
  try {
    return SpreadsheetApp.openById(id);
  } catch (e) {
    Logger.log('Error abriendo spreadsheet con ID (' + id + '), utilizando ID por defecto: ' + e.toString());
    return SpreadsheetApp.openById(SPREADSHEET_ID_DEFAULT);
  }
}

function getSheet(name) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    Logger.log('Hoja no encontrada: ' + name + '. Inicializando Spreadsheet...');
    initializeSpreadsheet();
    sheet = ss.getSheetByName(name);
  }
  return sheet;
}

function parseFecha(fechaStr) {
  const p = fechaStr.split('-');
  return { dia: parseInt(p[2]), mes: parseInt(p[1]), anio: parseInt(p[0]) };
}

function formatFechaDDMMYYYY(f) {
  return String(f.dia).padStart(2,'0') + '/' + String(f.mes).padStart(2,'0') + '/' + f.anio;
}

function formatFechaValue(val) {
  if (!val) return '';
  if (val instanceof Date) {
    const d = String(val.getDate()).padStart(2, '0');
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const y = val.getFullYear();
    return `${d}/${m}/${y}`;
  }
  const str = String(val).trim();
  const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    return `${isoMatch[3].padStart(2, '0')}/${isoMatch[2].padStart(2, '0')}/${isoMatch[1]}`;
  }
  return str;
}

function getFechaFromRow(r) {
  if (!r) return '';
  const dia = parseInt(r[1]);
  const mes = parseInt(r[2]);
  const anio = parseInt(r[3]);
  if (!isNaN(dia) && !isNaN(mes) && !isNaN(anio) && dia > 0 && mes > 0 && anio > 1900) {
    return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${anio}`;
  }
  return formatFechaValue(r[0]);
}

function getFechaRegistroFormatted(d) {
  const date = d || new Date();
  try {
    const tz = Session.getScriptTimeZone() || 'America/Santiago';
    return Utilities.formatDate(date, tz, 'dd/MM/yy HH:mm');
  } catch(e) {
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const anio = String(date.getFullYear()).substring(2);
    const hora = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${dia}/${mes}/${anio} ${hora}:${min}`;
  }
}

function getServerTime() {
  const tz = 'America/Santiago';
  const now = new Date();
  const dateStr = Utilities.formatDate(now, tz, 'yyyy-MM-dd');
  const hour = parseInt(Utilities.formatDate(now, tz, 'HH'), 10);
  const minute = parseInt(Utilities.formatDate(now, tz, 'mm'), 10);
  return {
    dateStr: dateStr,
    hour: hour,
    minute: minute,
    timestamp: now.getTime(),
    timezone: tz
  };
}

function validarFechaNoFutura(fechaInput, ampmInput) {
  if (!fechaInput) return null;
  const st = getServerTime();
  const parsed = parseFecha(fechaInput);
  if (!parsed || !parsed.anio || !parsed.mes || !parsed.dia) return null;
  const fechaISO = `${String(parsed.anio).padStart(4, '0')}-${String(parsed.mes).padStart(2, '0')}-${String(parsed.dia).padStart(2, '0')}`;
  
  if (fechaISO > st.dateStr) {
    return `❌ No es posible registrar datos con fecha futura (${formatFechaDDMMYYYY(parsed)} > fecha actual ${st.dateStr.split('-').reverse().join('/')}).`;
  }
  
  if (fechaISO === st.dateStr && ampmInput) {
    const ampmUpper = String(ampmInput).toUpperCase().trim();
    if ((ampmUpper === 'PM' || ampmUpper === 'TARDE') && st.hour < 12) {
      return `❌ No es posible registrar o actualizar el turno PM antes de las 12:00 hrs del día de hoy.`;
    }
  }
  return null;
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function insertRowAtTop(sheet, values) {
  ensureSheetHeadersAndVisibility(sheet);
  sheet.insertRowAfter(1);
  const range = sheet.getRange(2, 1, 1, values.length);
  range.setValues([values]);
  try {
    sheet.getRange(2, 1).setNumberFormat('@');
  } catch (e) {}
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
      .setTitle('Registros Mensuales — HRT LAB')
      .setFaviconUrl('https://griverahrt.github.io/Proyecto-RM/img/favicon.png')
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
      case 'getServerTime':     return jsonResponse(getServerTime());
      case 'getEtiquetadoras':  return jsonResponse(getEtiquetadoras());
      case 'getEtiquetadoraHistorial': return jsonResponse(getEtiquetadoraHistorial(e.parameter.etiquetadora));
      case 'getNotificaciones': return jsonResponse(getNotificaciones());
      case 'getDxH900Historial': return jsonResponse(getDxH900Historial());
      case 'getModulosActivos': return jsonResponse(getModulosActivos());
      case 'getRecentTermo':        return jsonResponse(getRecentTermo(e.parameter.limit));
      case 'getRecentCentrifugas':  return jsonResponse(getRecentCentrifugas(e.parameter.limit));
      case 'getRecentMesones':      return jsonResponse(getRecentMesones(e.parameter.limit));
      case 'getRecentRefriTemp':    return jsonResponse(getRecentRefriTemp(e.parameter.limit));
      case 'getRecentLimpRefri':    return jsonResponse(getRecentLimpRefri(e.parameter.limit));
      case 'getRecentConductividad': return jsonResponse(getRecentConductividad(e.parameter.limit));
      case 'getRecentCobas':        return jsonResponse(getRecentCobas(e.parameter.limit));
      case 'getDiasNoHabilesHRT': return jsonResponse(getDiasNoHabilesHRT());
      case 'getPersonal':         return jsonResponse(getPersonal());
      case 'savePersonal':        return jsonResponse(savePersonal(e.parameter));
      case 'deletePersonal':      return jsonResponse(deletePersonal(e.parameter));
      case 'migrarInicialesAHistoricos': return jsonResponse(migrarInicialesAHistoricos());
      case 'setupMaestroPersonal': return jsonResponse(setupMaestroPersonal());
      case 'runSetupTriggers':  return jsonResponse({ success: true, message: setupTriggers() });
      case 'testTriggerConsolidado': return jsonResponse({ success: true, result: triggerAlertaConsolidadaTermo() });
      case 'testTriggerDatosNoRellenados': return jsonResponse({ success: true, result: triggerDatosNoRellenados(e.parameter.hour ? parseInt(e.parameter.hour,10) : null) });
      case 'testTriggerMantencionSemanal': return jsonResponse({ success: true, result: triggerMantencionSemanal(e.parameter.to || null) });
      case 'applyConfig': return jsonResponse(applyNotificationConfig(e.parameter.hour, e.parameter.to));
      case 'getProjectTriggersInfo': return jsonResponse(getProjectTriggersInfo());
      case 'scheduleAutoTest': return jsonResponse(scheduleAutoTriggerInMinutes(e.parameter.minutes || 2));
      case 'getTriggerLogs': return jsonResponse(getTriggerLogs());
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
      case 'updateTermo':         return jsonResponse(updateTermo(data));
      case 'deleteTermo':         return jsonResponse(deleteTermo(data));
      case 'saveCentrifuga':      return jsonResponse(saveCentrifuga(data));
      case 'updateCentrifuga':    return jsonResponse(updateCentrifuga(data));
      case 'deleteCentrifuga':    return jsonResponse(deleteCentrifuga(data));
      case 'saveMesones':         return jsonResponse(saveMesones(data));
      case 'updateMeson':         return jsonResponse(updateMeson(data));
      case 'deleteMeson':         return jsonResponse(deleteMeson(data));
      case 'saveRefriTemp':       return jsonResponse(saveRefriTemp(data));
      case 'updateRefriTemp':     return jsonResponse(updateRefriTemp(data));
      case 'deleteRefriTemp':     return jsonResponse(deleteRefriTemp(data));
      case 'saveLimpiezaRefri':   return jsonResponse(saveLimpiezaRefri(data));
      case 'updateLimpRefri':     return jsonResponse(updateLimpRefri(data));
      case 'deleteLimpRefri':     return jsonResponse(deleteLimpRefri(data));
      case 'saveConductividad':   return jsonResponse(saveConductividad(data));
      case 'updateConductividad': return jsonResponse(updateConductividad(data));
      case 'deleteConductividad': return jsonResponse(deleteConductividad(data));
      case 'saveCobas':           return jsonResponse(saveCobas(data));
      case 'updateCobas':         return jsonResponse(updateCobas(data));
      case 'deleteCobas':         return jsonResponse(deleteCobas(data));
      case 'saveEtiquetadoraRegistro': return jsonResponse(saveEtiquetadoraRegistro(data));
      case 'updateEtiquetadoraMaestro': return jsonResponse(updateEtiquetadoraMaestro(data));
      case 'marcarRevisado':      return jsonResponse(marcarRevisado(data));
      case 'saveNotificaciones':  return jsonResponse(saveNotificaciones(data));
      case 'sendTestNotificacion': return jsonResponse(sendTestNotificacion(data));
      case 'runSetupTriggers':    return jsonResponse({ success: true, message: setupTriggers() });
      case 'testTriggerConsolidado': return jsonResponse({ success: true, result: triggerAlertaConsolidadaTermo() });
      case 'saveDxH900Registro':  return jsonResponse(saveDxH900Registro(data));
      case 'saveElimMuestras':    return jsonResponse(saveElimMuestras(data));
      case 'saveModulosActivos': return jsonResponse(saveModulosActivos(data));
      case 'getDiasNoHabilesHRT': return jsonResponse(getDiasNoHabilesHRT());
      case 'saveDiaNoHabilHRT':   return jsonResponse(saveDiaNoHabilHRT(data));
      case 'deleteDiaNoHabilHRT': return jsonResponse(deleteDiaNoHabilHRT(data));
      case 'getPersonal':         return jsonResponse(getPersonal());
      case 'savePersonal':        return jsonResponse(savePersonal(data));
      case 'deletePersonal':      return jsonResponse(deletePersonal(data));
      case 'migrarInicialesAHistoricos': return jsonResponse(migrarInicialesAHistoricos());
      case 'setupMaestroPersonal': return jsonResponse(setupMaestroPersonal());
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

function getAreasDetailed() {
  const data = getSheet(SHEETS.AREAS).getDataRange().getValues();
  return data.slice(1).filter(r => r[0]).map(r => ({
    nombre: String(r[0]).trim(),
    horarioTurno: r[1] ? String(r[1]).trim().toLowerCase() : 'si'
  }));
}

function getCentrifugas() {
  const data = getSheet(SHEETS.CENTRIFUGAS).getDataRange().getValues();
  return data.slice(1).filter(r => r[0]).map(r => String(r[0]));
}

function getCentrifugasDetailed() {
  const data = getSheet(SHEETS.CENTRIFUGAS).getDataRange().getValues();
  return data.slice(1).filter(r => r[0]).map(r => ({
    nombre: String(r[0]).trim(),
    horarioTurno: r[1] ? String(r[1]).trim().toLowerCase() : 'si'
  }));
}

function getSalas() {
  const data = getSheet(SHEETS.SALAS).getDataRange().getValues();
  return data.slice(1).filter(r => r[0]).map(r => String(r[0]));
}

function getSalasDetailed() {
  const data = getSheet(SHEETS.SALAS).getDataRange().getValues();
  return data.slice(1).filter(r => r[0]).map(r => ({
    nombre: String(r[0]).trim(),
    horarioTurno: r[1] ? String(r[1]).trim().toLowerCase() : 'si'
  }));
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

/** Determina si una fecha dada es día hábil en Chile y HRT */
function esDiaHabil(fecha) {
  if (!fecha) fecha = new Date();
  if (!(fecha instanceof Date)) fecha = new Date(fecha);

  // 1. Fin de semana (Sábado = 6, Domingo = 0)
  const day = fecha.getDay();
  if (day === 0 || day === 6) return false;

  // 2. Formatear dd/mm/yyyy para comparar con Maestro Días No Hábiles HRT
  const d = String(fecha.getDate()).padStart(2, '0');
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const y = fecha.getFullYear();
  const fechaStr = `${d}/${m}/${y}`;

  try {
    const sheetHRT = getSheet(SHEETS.DIAS_NO_HABILES_HRT);
    if (sheetHRT) {
      const rows = sheetHRT.getDataRange().getValues();
      for (let i = 1; i < rows.length; i++) {
        const rFecha = rows[i][0];
        let fStr = formatFechaValue(rFecha);
        if (fStr === fechaStr) return false;
      }
    }
  } catch (e) {
    Logger.log('Error al consultar Maestro Días No Hábiles HRT: ' + e.toString());
  }

  // 3. Feriados Oficiales de Chile via Google Calendar API
  try {
    const cal = CalendarApp.getCalendarById('es.cl#holiday@group.v.calendar.google.com');
    if (cal) {
      const events = cal.getEventsForDay(fecha);
      if (events && events.length > 0) return false;
    }
  } catch (e) {
    Logger.log('Error al consultar calendario feriados Google: ' + e.toString());
  }

  return true;
}

function getDiasNoHabilesHRT() {
  const sheet = getSheet(SHEETS.DIAS_NO_HABILES_HRT);
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];

  const items = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r[0]) continue;
    let fechaStr = formatFechaValue(r[0]);
    items.push({
      fecha: fechaStr,
      motivo: String(r[1] || '').trim(),
      registradoPor: String(r[2] || '').trim()
    });
  }
  return items;
}

function saveDiaNoHabilHRT(data) {
  if (data.pwd !== 'admin123') {
    return { success: false, error: 'Contraseña de administrador incorrecta.' };
  }
  if (!data.fecha) {
    return { success: false, error: 'Debe ingresar una fecha.' };
  }
  let fechaStr = data.fecha;
  if (fechaStr.includes('-')) {
    const parts = fechaStr.split('-');
    if (parts.length === 3) {
      fechaStr = `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }

  const sheet = getSheet(SHEETS.DIAS_NO_HABILES_HRT);
  sheet.appendRow([
    fechaStr,
    data.motivo || 'Feriado / Día no hábil HRT',
    data.registradoPor || 'Admin'
  ]);
  try {
    sheet.getRange(sheet.getLastRow(), 1).setNumberFormat('@');
  } catch (e) {}

  clearSheetCache('maestros_all', 0, 0);
  return { success: true, message: 'Día no hábil agregado correctamente.' };
}

function deleteDiaNoHabilHRT(data) {
  if (data.pwd !== 'admin123') {
    return { success: false, error: 'Contraseña de administrador incorrecta.' };
  }
  const sheet = getSheet(SHEETS.DIAS_NO_HABILES_HRT);
  const rows = sheet.getDataRange().getValues();

  let targetIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    let fStr = formatFechaValue(rows[i][0]);
    if (fStr === String(data.fecha).trim()) {
      targetIndex = i + 1;
      break;
    }
  }

  if (targetIndex !== -1) {
    sheet.deleteRow(targetIndex);
    clearSheetCache('maestros_all', 0, 0);
    return { success: true, message: 'Día no hábil eliminado correctamente.' };
  }
  return { success: false, error: 'No se encontró la fecha especificada.' };
}

function getPersonal() {
  try {
    const sheet = getSheet(SHEETS.PERSONAL);
    if (!sheet) return [];
    const rows = sheet.getDataRange().getValues();
    if (rows.length <= 1) return [];

    return rows.slice(1).filter(r => r[0]).map(r => ({
      iniciales: String(r[0]).trim().toUpperCase(),
      nombre: String(r[1] || '').trim(),
      estamento: String(r[2] || '').trim(),
      activo: String(r[3] || 'SI').trim().toUpperCase(),
      fecha: formatFechaValue(r[4])
    }));
  } catch (e) {
    Logger.log('Error en getPersonal: ' + e.toString());
    return [];
  }
}

function setupMaestroPersonal() {
  try {
    const ss = getSpreadsheet();
    let sheet = ss.getSheetByName(SHEETS.PERSONAL);
    let isNew = false;
    if (!sheet) {
      sheet = ss.insertSheet(SHEETS.PERSONAL);
      isNew = true;
    }
    ensureSheetHeadersAndVisibility(sheet);

    try {
      sheet.getRange(1, 1, Math.max(sheet.getMaxRows(), 100), 1).setNumberFormat('@');
      sheet.getRange(1, 5, Math.max(sheet.getMaxRows(), 100), 1).setNumberFormat('@');
    } catch (e) {}

    const lastRow = sheet.getLastRow();
    const initialsList = [
      'AHC', 'ATR', 'AVV', 'BAA', 'BCM', 'BGG', 'CCS', 'CGR', 'CRA', 'DMA',
      'DRV', 'EAV', 'ESM', 'EVC', 'FSV', 'GAG', 'GRC', 'LPS', 'MCM', 'MEA',
      'MGE', 'MMA', 'MMT', 'MRB', 'MRD', 'NRG', 'RAA', 'RBM', 'RCL', 'RJL',
      'SDA', 'SRR', 'TAL'
    ];

    if (lastRow <= 1) {
      const todayStr = formatFechaValue(new Date());
      const rowsToInsert = initialsList.map(init => [
        init,
        '',
        'Tecnólogo Médico',
        'SI',
        todayStr
      ]);
      sheet.getRange(2, 1, rowsToInsert.length, 5).setValues(rowsToInsert);
      clearSheetCache('maestros_all', 0, 0);
      return {
        success: true,
        message: 'Maestro Personal creado y precargado con 33 funcionarios.',
        count: rowsToInsert.length
      };
    }

    return {
      success: true,
      message: 'Maestro Personal ya contiene ' + (lastRow - 1) + ' registros.',
      count: lastRow - 1
    };
  } catch (err) {
    Logger.log('Error en setupMaestroPersonal: ' + err.toString());
    return { success: false, error: err.toString() };
  }
}

function resolveNombreResponsable(val) {
  if (!val) return '';
  const trimmed = String(val).trim();
  const upper = trimmed.toUpperCase();
  
  try {
    const personal = getPersonal();
    const match = personal.find(p => p.iniciales === upper && p.activo !== 'NO');
    if (match && match.nombre) {
      return match.nombre;
    }
  } catch (e) {
    Logger.log('Error resolviendo nombre responsable: ' + e.toString());
  }
  
  return trimmed;
}

function savePersonal(data) {
  if (!data.iniciales || !data.nombre) {
    return { success: false, error: 'Debe ingresar iniciales y nombre completo.' };
  }
  const iniciales = String(data.iniciales).trim().toUpperCase();
  const nombre = String(data.nombre).trim().toUpperCase();
  const estamento = String(data.estamento || 'Tecnólogo Médico').trim();
  const activo = data.activo ? String(data.activo).trim().toUpperCase() : 'SI';
  const fechaStr = formatFechaValue(new Date());

  const sheet = getSheet(SHEETS.PERSONAL);
  if (!sheet) return { success: false, error: 'Hoja Maestro Personal no encontrada.' };

  const rows = sheet.getDataRange().getValues();
  let foundIndex = -1;

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim().toUpperCase() === iniciales) {
      foundIndex = i + 1;
      break;
    }
  }

  if (foundIndex !== -1) {
    sheet.getRange(foundIndex, 2, 1, 3).setValues([[nombre, estamento, activo]]);
  } else {
    sheet.appendRow([iniciales, nombre, estamento, activo, fechaStr]);
    try {
      sheet.getRange(sheet.getLastRow(), 1).setNumberFormat('@');
      sheet.getRange(sheet.getLastRow(), 5).setNumberFormat('@');
    } catch (e) {}
  }

  clearSheetCache('maestros_all', 0, 0);
  return {
    success: true,
    message: `Funcionario ${nombre} (${iniciales}) registrado correctamente en Maestro Personal.`,
    personal: getPersonal()
  };
}

function deletePersonal(data) {
  if (!data || !data.iniciales) return { success: false, error: 'Iniciales no especificadas.' };
  const iniciales = String(data.iniciales).trim().toUpperCase();
  const sheet = getSheet(SHEETS.PERSONAL);
  if (!sheet) return { success: false, error: 'Hoja no encontrada.' };
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim().toUpperCase() === iniciales) {
      sheet.deleteRow(i + 1);
      clearSheetCache('maestros_all', 0, 0);
      return { success: true, message: `Funcionario (${iniciales}) eliminado de Maestro Personal.`, personal: getPersonal() };
    }
  }
  return { success: false, error: 'Funcionario no encontrado.' };
}

function migrarInicialesAHistoricos() {
  const ss = getSpreadsheet();
  const personal = getPersonal();
  const map = {};
  personal.forEach(p => {
    if (p.iniciales && p.nombre) {
      map[p.iniciales.toUpperCase().trim()] = p.nombre.toUpperCase().trim();
    }
  });

  const allSheets = ss.getSheets();
  const report = {};
  let totalReplaced = 0;

  allSheets.forEach(sheet => {
    const sheetName = sheet.getName();
    // No migrar dentro de hojas Maestro (excepto si son registros)
    if (sheetName.startsWith('Maestro')) return;

    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    if (lastRow <= 1 || lastCol === 0) return;

    const range = sheet.getRange(1, 1, lastRow, lastCol);
    const data = range.getValues();
    let replacedInSheet = 0;

    for (let r = 1; r < data.length; r++) {
      for (let c = 0; c < data[r].length; c++) {
        const val = String(data[r][c] || '').trim().toUpperCase();
        if (val && map[val]) {
          data[r][c] = map[val];
          replacedInSheet++;
          totalReplaced++;
        }
      }
    }

    if (replacedInSheet > 0) {
      range.setValues(data);
    }
    report[sheetName] = replacedInSheet;
  });

  clearAllCaches();
  return {
    success: true,
    message: `Migración completada. Se reemplazaron ${totalReplaced} registros históricos en Google Sheets.`,
    totalReplaced: totalReplaced,
    detalle: report
  };
}

/** Devuelve todos los maestros en una sola llamada para optimizar carga */
function getMaestros() {
  const cacheKey = 'maestros_all_v3';
  let cached = getCachedJson(cacheKey);
  if (cached && cached.centrifugasDetailed && cached.areasDetailed && cached.salasDetailed) {
    cached.modulosActivos = getModulosActivos();
    cached.isTodayHabit = esDiaHabil(new Date());
    cached.serverTime = getServerTime();
    cached.personal = getPersonal();
    return cached;
  }
  
  const data = {
    areas: getAreas(),
    centrifugas: getCentrifugas(),
    salas: getSalas(),
    areasDetailed: getAreasDetailed(),
    centrifugasDetailed: getCentrifugasDetailed(),
    salasDetailed: getSalasDetailed(),
    personal: getPersonal(),
    isTodayHabit: esDiaHabil(new Date()),
    acciones: getAcciones(),
    refrigeradores: getRefrigeradores(),
    refriLimpieza: getRefriLimpieza(),
    etiquetadoras: getEtiquetadoras(),
    sugerencias: getSugerenciasHistoricas(),
    modulosActivos: getModulosActivos(),
    serverTime: getServerTime()
  };
  
  setCachedJson(cacheKey, data, CACHE_TTL_MAESTROS);
  return data;
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
  const cacheKey = 'sugerencias_historicas';
  let cached = getCachedJson(cacheKey);
  if (cached) {
    return cached;
  }
  
  const data = {
    termoObs: getUniqueColumnValues(SHEETS.TERMO, 10),
    centObs: getUniqueColumnValues(SHEETS.CENT_REG, 7),
    mesonObs: getUniqueColumnValues(SHEETS.MESONES, 6),
    refriObs: getUniqueColumnValues(SHEETS.REFRI_REG, 10),
    limpRefriObs: getUniqueColumnValues(SHEETS.LIMP_REFRI, 7),
    conductObs: getUniqueColumnValues(SHEETS.CONDUCT_REG, 7),
    etComentario: getUniqueColumnValues(SHEETS.ETIQUETADORAS_MASTER, 8),
    etBitacoraDesc: getUniqueColumnValues(SHEETS.ETIQUETADORAS_REG, 7),
    cobasObs: getUniqueColumnValues(SHEETS.COBAS_REG, 8)
  };
  
  setCachedJson(cacheKey, data, 7200); // 2 hours
  return data;
}

// ── Guardar Registros ─────────────────────────────────────────
// Termo: Responsable | Temperatura (°C) | Humedad (%) | Fecha (dd/mm/aaaa) | Día | Mes | Año | Turno | Area | Acción Correctiva | Observaciones | Fecha de registro | Revisado_Por | Fecha_Revisión

function saveTermo(data) {
  if (!data.responsable || !data.temperatura || !data.humedad || !data.fecha || !data.area) {
    return { success: false, error: 'Faltan campos obligatorios.' };
  }
  const ampm = data.ampm || (new Date().getHours() < 12 ? 'AM' : 'PM');
  const errFuture = validarFechaNoFutura(data.fecha, ampm);
  if (errFuture) return { success: false, error: errFuture };
  const f = parseFecha(data.fecha);
  const ts = getFechaRegistroFormatted();
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
    resolveNombreResponsable(data.responsable),
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

  clearSheetCache('termo', f.mes, f.anio);

  // Las alertas de temperatura/humedad fuera de rango ahora se envían consolidadas a las 08:30 mediante triggerAlertaConsolidadaTermo.

  return { success: true, message: 'Registro de Temperatura/Humedad guardado.' };
}

function getRecentTermo(limit) {
  limit = parseInt(limit) || 20;
  const sheet = getSheet(SHEETS.TERMO);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { success: true, records: [] };

  const endRow = Math.min(lastRow, 1 + limit);
  const numRows = endRow - 1;
  const data = sheet.getRange(2, 1, numRows, 14).getValues();

  const records = data.map((r, idx) => {
    let fechaStr = getFechaFromRow(r);

    let tsStr = '';
    if (r[11] instanceof Date) {
      tsStr = getFechaRegistroFormatted(r[11]);
    } else {
      tsStr = String(r[11] || '');
    }

    return {
      rowIndex: 2 + idx,
      fecha: fechaStr,
      dia: r[1],
      mes: r[2],
      anio: r[3],
      responsable: r[4] ? String(r[4]) : '',
      temperatura: r[5],
      humedad: r[6],
      turno: r[7] ? String(r[7]) : '',
      area: r[8] ? String(r[8]) : '',
      accion_correctiva: r[9] ? String(r[9]) : '',
      observaciones: r[10] ? String(r[10]) : '',
      fecha_registro: tsStr,
      revisado_por: r[12] ? String(r[12]) : '',
      fecha_revision: r[13] ? String(r[13]) : ''
    };
  });

  return { success: true, records: records };
}

function getRecentCentrifugas(limit) {
  limit = parseInt(limit) || 20;
  const sheet = getSheet(SHEETS.CENT_REG);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { success: true, records: [] };
  const endRow = Math.min(lastRow, 1 + limit);
  const numRows = endRow - 1;
  const data = sheet.getRange(2, 1, numRows, 11).getValues();
  const records = data.map((r, idx) => {
    let fechaStr = getFechaFromRow(r);
    let tsStr = r[8] instanceof Date ? getFechaRegistroFormatted(r[8]) : String(r[8] || '');
    return {
      rowIndex: 2 + idx,
      fecha: fechaStr,
      dia: r[1], mes: r[2], anio: r[3],
      centrifuga: r[4] ? String(r[4]) : '',
      responsable: r[5] ? String(r[5]) : '',
      tipo_mantencion: r[6] ? String(r[6]) : '',
      observaciones: r[7] ? String(r[7]) : '',
      fecha_registro: tsStr
    };
  });
  return { success: true, records: records };
}

function getRecentMesones(limit) {
  limit = parseInt(limit) || 20;
  const sheet = getSheet(SHEETS.MESONES);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { success: true, records: [] };
  const endRow = Math.min(lastRow, 1 + limit);
  const numRows = endRow - 1;
  const data = sheet.getRange(2, 1, numRows, 10).getValues();
  const records = data.map((r, idx) => {
    let fechaStr = getFechaFromRow(r);
    let tsStr = r[7] instanceof Date ? getFechaRegistroFormatted(r[7]) : String(r[7] || '');
    return {
      rowIndex: 2 + idx,
      fecha: fechaStr,
      dia: r[1], mes: r[2], anio: r[3],
      sala: r[4] ? String(r[4]) : '',
      responsable: r[5] ? String(r[5]) : '',
      observaciones: r[6] ? String(r[6]) : '',
      fecha_registro: tsStr
    };
  });
  return { success: true, records: records };
}

function getRecentRefriTemp(limit) {
  limit = parseInt(limit) || 20;
  const sheet = getSheet(SHEETS.REFRI_REG);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { success: true, records: [] };
  const endRow = Math.min(lastRow, 1 + limit);
  const numRows = endRow - 1;
  const data = sheet.getRange(2, 1, numRows, 14).getValues();
  const records = data.map((r, idx) => {
    let fechaStr = getFechaFromRow(r);
    let tsStr = r[11] instanceof Date ? getFechaRegistroFormatted(r[11]) : String(r[11] || '');
    return {
      rowIndex: 2 + idx,
      fecha: fechaStr,
      dia: r[1], mes: r[2], anio: r[3],
      responsable: r[4] ? String(r[4]) : '',
      temperatura: r[5],
      turno: r[6] ? String(r[6]) : '',
      equipo: r[7] ? String(r[7]) : '',
      tipo: r[8] ? String(r[8]) : '',
      accion_correctiva: r[9] ? String(r[9]) : '',
      observaciones: r[10] ? String(r[10]) : '',
      fecha_registro: tsStr
    };
  });
  return { success: true, records: records };
}

function getRecentLimpRefri(limit) {
  limit = parseInt(limit) || 20;
  const sheet = getSheet(SHEETS.LIMP_REFRI);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { success: true, records: [] };
  const endRow = Math.min(lastRow, 1 + limit);
  const numRows = endRow - 1;
  const data = sheet.getRange(2, 1, numRows, 11).getValues();
  const records = data.map((r, idx) => {
    let fechaStr = getFechaFromRow(r);
    let tsStr = r[8] instanceof Date ? getFechaRegistroFormatted(r[8]) : String(r[8] || '');
    return {
      rowIndex: 2 + idx,
      fecha: fechaStr,
      dia: r[1], mes: r[2], anio: r[3],
      tipo_mantencion: r[4] ? String(r[4]) : '',
      equipo: r[5] ? String(r[5]) : '',
      responsable: r[6] ? String(r[6]) : '',
      observaciones: r[7] ? String(r[7]) : '',
      fecha_registro: tsStr
    };
  });
  return { success: true, records: records };
}

function getRecentConductividad(limit) {
  limit = parseInt(limit) || 20;
  const sheet = getSheet(SHEETS.CONDUCT_REG);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { success: true, records: [] };
  const endRow = Math.min(lastRow, 1 + limit);
  const numRows = endRow - 1;
  const data = sheet.getRange(2, 1, numRows, 11).getValues();
  const records = data.map((r, idx) => {
    let fechaStr = getFechaFromRow(r);
    let tsStr = r[8] instanceof Date ? getFechaRegistroFormatted(r[8]) : String(r[8] || '');
    return {
      rowIndex: 2 + idx,
      fecha: fechaStr,
      dia: r[1], mes: r[2], anio: r[3],
      responsable: r[4] ? String(r[4]) : '',
      conductividad: r[5],
      turno: r[6] ? String(r[6]) : '',
      observaciones: r[7] ? String(r[7]) : '',
      fecha_registro: tsStr
    };
  });
  return { success: true, records: records };
}

function getRecentCobas(limit) {
  limit = parseInt(limit) || 20;
  const sheet = getSheet(SHEETS.COBAS_REG);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { success: true, records: [] };
  const endRow = Math.min(lastRow, 1 + limit);
  const numRows = endRow - 1;
  const data = sheet.getRange(2, 1, numRows, 12).getValues();
  const records = data.map((r, idx) => {
    let fechaStr = getFechaFromRow(r);
    let tsStr = r[9] instanceof Date ? getFechaRegistroFormatted(r[9]) : String(r[9] || '');
    return {
      rowIndex: 2 + idx,
      fecha: fechaStr,
      dia: r[1], mes: r[2], anio: r[3],
      equipo: r[4] ? String(r[4]) : '',
      responsable: r[5] ? String(r[5]) : '',
      frecuencia: r[6] ? String(r[6]) : '',
      actividad: r[7] ? String(r[7]) : '',
      observaciones: r[8] ? String(r[8]) : '',
      fecha_registro: tsStr
    };
  });
  return { success: true, records: records };
}

function findRowIndexByTimestamp(sheetName, rowIndex, fechaRegistro, tsColIndex) {
  const sheet = getSheet(sheetName);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;

  rowIndex = parseInt(rowIndex);
  if (rowIndex >= 2 && rowIndex <= lastRow) {
    if (!fechaRegistro) return rowIndex;
    const val = sheet.getRange(rowIndex, tsColIndex).getValue();
    const tsStr = val instanceof Date ? getFechaRegistroFormatted(val) : String(val);
    if (tsStr === String(fechaRegistro)) return rowIndex;
  }

  if (fechaRegistro) {
    const colValues = sheet.getRange(2, tsColIndex, lastRow - 1, 1).getValues();
    for (let i = 0; i < colValues.length; i++) {
      const val = colValues[i][0];
      const tsStr = val instanceof Date ? getFechaRegistroFormatted(val) : String(val);
      if (tsStr === String(fechaRegistro)) {
        return 2 + i;
      }
    }
  }

  return (rowIndex >= 2 && rowIndex <= lastRow) ? rowIndex : -1;
}

// ── Update / Delete — Centrífugas ──────────────────────────────
function updateCentrifuga(data) {
  if (!data.rowIndex || !data.responsable || !data.fecha || !data.centrifuga) {
    return { success: false, error: 'Faltan campos obligatorios para actualizar.' };
  }
  const errFuture = validarFechaNoFutura(data.fecha);
  if (errFuture) return { success: false, error: errFuture };
  const targetRow = findRowIndexByTimestamp(SHEETS.CENT_REG, data.rowIndex, data.fecha_registro, 9);
  if (targetRow < 2) return { success: false, error: 'No se encontró el registro para actualizar.' };

  const sheet = getSheet(SHEETS.CENT_REG);
  const f = parseFecha(data.fecha);
  sheet.getRange(targetRow, 1, 1, 8).setValues([[
    formatFechaDDMMYYYY(f), f.dia, f.mes, f.anio,
    data.centrifuga,
    resolveNombreResponsable(data.responsable),
    data.tipo_mantencion || 'Diaria',
    data.observaciones || ''
  ]]);
  clearSheetCache('centrifugas', f.mes, f.anio);
  return { success: true, message: 'Registro de Centrífuga actualizado.' };
}

function deleteCentrifuga(data) {
  if (!data.rowIndex) return { success: false, error: 'ID de registro no especificado.' };
  const targetRow = findRowIndexByTimestamp(SHEETS.CENT_REG, data.rowIndex, data.fecha_registro, 9);
  if (targetRow < 2) return { success: false, error: 'No se encontró el registro a eliminar.' };

  const sheet = getSheet(SHEETS.CENT_REG);
  const mes = data.mes || sheet.getRange(targetRow, 3).getValue();
  const anio = data.anio || sheet.getRange(targetRow, 4).getValue();
  sheet.deleteRow(targetRow);
  if (mes && anio) clearSheetCache('centrifugas', mes, anio);
  return { success: true, message: 'Registro de Centrífuga eliminado.' };
}

// ── Update / Delete — Mesones ──────────────────────────────────
function updateMeson(data) {
  if (!data.rowIndex || !data.responsable || !data.fecha || !data.sala) {
    return { success: false, error: 'Faltan campos obligatorios para actualizar.' };
  }
  const errFuture = validarFechaNoFutura(data.fecha);
  if (errFuture) return { success: false, error: errFuture };
  const targetRow = findRowIndexByTimestamp(SHEETS.MESONES, data.rowIndex, data.fecha_registro, 8);
  if (targetRow < 2) return { success: false, error: 'No se encontró el registro para actualizar.' };

  const sheet = getSheet(SHEETS.MESONES);
  const f = parseFecha(data.fecha);
  sheet.getRange(targetRow, 1, 1, 7).setValues([[
    formatFechaDDMMYYYY(f), f.dia, f.mes, f.anio,
    data.sala,
    resolveNombreResponsable(data.responsable),
    data.observaciones || ''
  ]]);
  clearSheetCache('mesones', f.mes, f.anio);
  return { success: true, message: 'Registro de Mesón actualizado.' };
}

function deleteMeson(data) {
  if (!data.rowIndex) return { success: false, error: 'ID de registro no especificado.' };
  const targetRow = findRowIndexByTimestamp(SHEETS.MESONES, data.rowIndex, data.fecha_registro, 8);
  if (targetRow < 2) return { success: false, error: 'No se encontró el registro a eliminar.' };

  const sheet = getSheet(SHEETS.MESONES);
  const mes = data.mes || sheet.getRange(targetRow, 3).getValue();
  const anio = data.anio || sheet.getRange(targetRow, 4).getValue();
  sheet.deleteRow(targetRow);
  if (mes && anio) clearSheetCache('mesones', mes, anio);
  return { success: true, message: 'Registro de Mesón eliminado.' };
}

// ── Update / Delete — Temp. Refrigeradores ─────────────────────
function updateRefriTemp(data) {
  if (!data.rowIndex || !data.responsable || !data.fecha || !data.equipo || data.temperatura === undefined) {
    return { success: false, error: 'Faltan campos obligatorios para actualizar.' };
  }
  const ampm = data.ampm || (data.turno === 'Mañana' ? 'AM' : 'PM');
  const errFuture = validarFechaNoFutura(data.fecha, ampm);
  if (errFuture) return { success: false, error: errFuture };
  const targetRow = findRowIndexByTimestamp(SHEETS.REFRI_REG, data.rowIndex, data.fecha_registro, 12);
  if (targetRow < 2) return { success: false, error: 'No se encontró el registro para actualizar.' };

  const sheet = getSheet(SHEETS.REFRI_REG);
  const f = parseFecha(data.fecha);
  sheet.getRange(targetRow, 1, 1, 11).setValues([[
    formatFechaDDMMYYYY(f), f.dia, f.mes, f.anio,
    resolveNombreResponsable(data.responsable),
    parseFloat(data.temperatura),
    data.turno || 'Mañana',
    data.equipo,
    data.tipo || '',
    data.accion_correctiva || '',
    data.observaciones || ''
  ]]);
  clearSheetCache('refriTemp', f.mes, f.anio);
  return { success: true, message: 'Registro de Temp. Refrigerador actualizado.' };
}

function deleteRefriTemp(data) {
  if (!data.rowIndex) return { success: false, error: 'ID de registro no especificado.' };
  const targetRow = findRowIndexByTimestamp(SHEETS.REFRI_REG, data.rowIndex, data.fecha_registro, 12);
  if (targetRow < 2) return { success: false, error: 'No se encontró el registro a eliminar.' };

  const sheet = getSheet(SHEETS.REFRI_REG);
  const mes = data.mes || sheet.getRange(targetRow, 3).getValue();
  const anio = data.anio || sheet.getRange(targetRow, 4).getValue();
  sheet.deleteRow(targetRow);
  if (mes && anio) clearSheetCache('refriTemp', mes, anio);
  return { success: true, message: 'Registro de Temp. Refrigerador eliminado.' };
}

// ── Update / Delete — Limpieza Refrigeradores ──────────────────
function updateLimpRefri(data) {
  if (!data.rowIndex || !data.responsable || !data.fecha || !data.equipo) {
    return { success: false, error: 'Faltan campos obligatorios para actualizar.' };
  }
  const errFuture = validarFechaNoFutura(data.fecha);
  if (errFuture) return { success: false, error: errFuture };
  const targetRow = findRowIndexByTimestamp(SHEETS.LIMP_REFRI, data.rowIndex, data.fecha_registro, 9);
  if (targetRow < 2) return { success: false, error: 'No se encontró el registro para actualizar.' };

  const sheet = getSheet(SHEETS.LIMP_REFRI);
  const f = parseFecha(data.fecha);
  sheet.getRange(targetRow, 1, 1, 8).setValues([[
    formatFechaDDMMYYYY(f), f.dia, f.mes, f.anio,
    data.tipo_mantencion || 'Semanal (externa)',
    data.equipo,
    resolveNombreResponsable(data.responsable),
    data.observaciones || ''
  ]]);
  clearSheetCache('limpiezaRefri', f.mes, f.anio);
  return { success: true, message: 'Registro de Limpieza Refrigerador actualizado.' };
}

function deleteLimpRefri(data) {
  if (!data.rowIndex) return { success: false, error: 'ID de registro no especificado.' };
  const targetRow = findRowIndexByTimestamp(SHEETS.LIMP_REFRI, data.rowIndex, data.fecha_registro, 9);
  if (targetRow < 2) return { success: false, error: 'No se encontró el registro a eliminar.' };

  const sheet = getSheet(SHEETS.LIMP_REFRI);
  const mes = data.mes || sheet.getRange(targetRow, 3).getValue();
  const anio = data.anio || sheet.getRange(targetRow, 4).getValue();
  sheet.deleteRow(targetRow);
  if (mes && anio) clearSheetCache('limpiezaRefri', mes, anio);
  return { success: true, message: 'Registro de Limpieza Refrigerador eliminado.' };
}

// ── Update / Delete — Conductividad ────────────────────────────
function updateConductividad(data) {
  if (!data.rowIndex || !data.responsable || !data.fecha || data.conductividad === undefined) {
    return { success: false, error: 'Faltan campos obligatorios para actualizar.' };
  }
  const ampm = data.ampm || (data.turno === 'Mañana' ? 'AM' : 'PM');
  const errFuture = validarFechaNoFutura(data.fecha, ampm);
  if (errFuture) return { success: false, error: errFuture };
  const targetRow = findRowIndexByTimestamp(SHEETS.CONDUCT_REG, data.rowIndex, data.fecha_registro, 9);
  if (targetRow < 2) return { success: false, error: 'No se encontró el registro para actualizar.' };

  const sheet = getSheet(SHEETS.CONDUCT_REG);
  const f = parseFecha(data.fecha);
  sheet.getRange(targetRow, 1, 1, 8).setValues([[
    formatFechaDDMMYYYY(f), f.dia, f.mes, f.anio,
    resolveNombreResponsable(data.responsable),
    parseFloat(data.conductividad),
    data.turno || 'Mañana',
    data.observaciones || ''
  ]]);
  clearSheetCache('conductividad', f.mes, f.anio);
  return { success: true, message: 'Registro de Conductividad actualizado.' };
}

function deleteConductividad(data) {
  if (!data.rowIndex) return { success: false, error: 'ID de registro no especificado.' };
  const targetRow = findRowIndexByTimestamp(SHEETS.CONDUCT_REG, data.rowIndex, data.fecha_registro, 9);
  if (targetRow < 2) return { success: false, error: 'No se encontró el registro a eliminar.' };

  const sheet = getSheet(SHEETS.CONDUCT_REG);
  const mes = data.mes || sheet.getRange(targetRow, 3).getValue();
  const anio = data.anio || sheet.getRange(targetRow, 4).getValue();
  sheet.deleteRow(targetRow);
  if (mes && anio) clearSheetCache('conductividad', mes, anio);
  return { success: true, message: 'Registro de Conductividad eliminado.' };
}

// ── Update / Delete — Cobas ──────────────────────────────────
function updateCobas(data) {
  if (!data.rowIndex || !data.responsable || !data.fecha || !data.equipo) {
    return { success: false, error: 'Faltan campos obligatorios para actualizar.' };
  }
  const errFuture = validarFechaNoFutura(data.fecha);
  if (errFuture) return { success: false, error: errFuture };
  const targetRow = findRowIndexByTimestamp(SHEETS.COBAS_REG, data.rowIndex, data.fecha_registro, 10);
  if (targetRow < 2) return { success: false, error: 'No se encontró el registro para actualizar.' };

  const sheet = getSheet(SHEETS.COBAS_REG);
  const f = parseFecha(data.fecha);
  sheet.getRange(targetRow, 1, 1, 9).setValues([[
    formatFechaDDMMYYYY(f), f.dia, f.mes, f.anio,
    data.equipo,
    resolveNombreResponsable(data.responsable),
    data.frecuencia || '',
    data.actividad || '',
    data.observaciones || ''
  ]]);
  clearSheetCache('cobas', f.mes, f.anio);
  return { success: true, message: 'Registro de Cobas actualizado.' };
}

function deleteCobas(data) {
  if (!data.rowIndex) return { success: false, error: 'ID de registro no especificado.' };
  const targetRow = findRowIndexByTimestamp(SHEETS.COBAS_REG, data.rowIndex, data.fecha_registro, 10);
  if (targetRow < 2) return { success: false, error: 'No se encontró el registro a eliminar.' };

  const sheet = getSheet(SHEETS.COBAS_REG);
  const mes = data.mes || sheet.getRange(targetRow, 3).getValue();
  const anio = data.anio || sheet.getRange(targetRow, 4).getValue();
  sheet.deleteRow(targetRow);
  if (mes && anio) clearSheetCache('cobas', mes, anio);
  return { success: true, message: 'Registro de Cobas eliminado.' };
}

function findTermoRowIndex(rowIndex, fechaRegistro) {
  const sheet = getSheet(SHEETS.TERMO);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;

  rowIndex = parseInt(rowIndex);
  if (rowIndex >= 2 && rowIndex <= lastRow) {
    if (!fechaRegistro) return rowIndex;
    const val = sheet.getRange(rowIndex, 12).getValue();
    const tsStr = val instanceof Date ? getFechaRegistroFormatted(val) : String(val);
    if (tsStr === String(fechaRegistro)) return rowIndex;
  }

  if (fechaRegistro) {
    const colValues = sheet.getRange(2, 12, lastRow - 1, 1).getValues();
    for (let i = 0; i < colValues.length; i++) {
      const val = colValues[i][0];
      const tsStr = val instanceof Date ? getFechaRegistroFormatted(val) : String(val);
      if (tsStr === String(fechaRegistro)) {
        return 2 + i;
      }
    }
  }

  return (rowIndex >= 2 && rowIndex <= lastRow) ? rowIndex : -1;
}

function updateTermo(data) {
  if (!data.rowIndex || !data.responsable || data.temperatura === undefined || data.humedad === undefined || !data.fecha || !data.area) {
    return { success: false, error: 'Faltan campos obligatorios para actualizar.' };
  }

  const ampm = data.ampm || (data.turno === 'Mañana' ? 'AM' : 'PM');
  const errFuture = validarFechaNoFutura(data.fecha, ampm);
  if (errFuture) return { success: false, error: errFuture };

  const targetRow = findTermoRowIndex(data.rowIndex, data.fecha_registro);
  if (targetRow < 2) {
    return { success: false, error: 'No se encontró el registro para actualizar.' };
  }

  const sheet = getSheet(SHEETS.TERMO);
  const oldMes = sheet.getRange(targetRow, 3).getValue();
  const oldAnio = sheet.getRange(targetRow, 4).getValue();

  const f = parseFecha(data.fecha);
  const turno = ampm === 'AM' ? 'Mañana' : 'Tarde';
  const temp = parseFloat(data.temperatura);
  const hum = parseFloat(data.humedad);

  sheet.getRange(targetRow, 1, 1, 11).setValues([[
    formatFechaDDMMYYYY(f),
    f.dia, f.mes, f.anio,
    resolveNombreResponsable(data.responsable),
    temp,
    hum,
    turno,
    data.area,
    data.accion_correctiva || '',
    data.observaciones || ''
  ]]);

  clearSheetCache('termo', f.mes, f.anio);
  if (oldMes && oldAnio && (oldMes !== f.mes || oldAnio !== f.anio)) {
    clearSheetCache('termo', oldMes, oldAnio);
  }

  return { success: true, message: 'Registro de Temperatura/Humedad actualizado.' };
}

function deleteTermo(data) {
  if (!data.rowIndex) {
    return { success: false, error: 'ID de registro no especificado.' };
  }

  const targetRow = findTermoRowIndex(data.rowIndex, data.fecha_registro);
  if (targetRow < 2) {
    return { success: false, error: 'No se encontró el registro a eliminar.' };
  }

  const sheet = getSheet(SHEETS.TERMO);
  const mes = data.mes || sheet.getRange(targetRow, 3).getValue();
  const anio = data.anio || sheet.getRange(targetRow, 4).getValue();

  sheet.deleteRow(targetRow);

  if (mes && anio) {
    clearSheetCache('termo', mes, anio);
  }

  return { success: true, message: 'Registro de Temperatura/Humedad eliminado.' };
}

// Centrifugas: Fecha | Día | Mes | Año | Centrifuga | Responsable | Tipo_Mantencion | Observaciones | Fecha de registro | Revisado_Por | Fecha_Revisión
function saveCentrifuga(data) {
  if (!data.responsable || !data.fecha) {
    return { success: false, error: 'Faltan campos obligatorios.' };
  }
  const errFuture = validarFechaNoFutura(data.fecha);
  if (errFuture) return { success: false, error: errFuture };
  const centrifugas = data.centrifugas || (data.centrifuga ? [data.centrifuga] : []);
  if (centrifugas.length === 0) {
    return { success: false, error: 'Seleccione al menos una centrífuga.' };
  }
  const f = parseFecha(data.fecha);
  const ts = getFechaRegistroFormatted();
  const sheet = getSheet(SHEETS.CENT_REG);
  centrifugas.forEach(cent => {
    insertRowAtTop(sheet, [
      formatFechaDDMMYYYY(f), f.dia, f.mes, f.anio,
      cent,
      resolveNombreResponsable(data.responsable),
      data.tipo_mantencion || 'Diaria',
      data.observaciones || '',
      ts,
      '',  // Revisado_Por
      ''   // Fecha_Revisión
    ]);
  });
  clearSheetCache('centrifugas', f.mes, f.anio);
  return { success: true, message: centrifugas.length + ' registro(s) de Centrífuga guardado(s).' };
}

// Mesones: Fecha | Día | Mes | Año | Sala | Responsable | Observaciones | Fecha de registro | Revisado_Por | Fecha_Revisión
function saveMesones(data) {
  if (!data.responsable || !data.fecha) {
    return { success: false, error: 'Faltan campos obligatorios.' };
  }
  const errFuture = validarFechaNoFutura(data.fecha);
  if (errFuture) return { success: false, error: errFuture };
  const salas = data.salas || (data.sala ? [data.sala] : []);
  if (salas.length === 0) {
    return { success: false, error: 'Seleccione al menos una sala.' };
  }
  const f = parseFecha(data.fecha);
  const ts = getFechaRegistroFormatted();
  const sheet = getSheet(SHEETS.MESONES);
  salas.forEach(sala => {
    insertRowAtTop(sheet, [
      formatFechaDDMMYYYY(f), f.dia, f.mes, f.anio,
      sala,
      resolveNombreResponsable(data.responsable),
      data.observaciones || '',
      ts,
      '',  // Revisado_Por
      ''   // Fecha_Revisión
    ]);
  });
  clearSheetCache('mesones', f.mes, f.anio);
  return { success: true, message: salas.length + ' registro(s) de Mesones guardado(s).' };
}

// RefriTemp: Responsable | Temperatura (°C) | Fecha | Día | Mes | Año | Turno | Equipo | Tipo | Acción Correctiva | Observaciones | Fecha de registro | Revisado_Por | Fecha_Revisión
function saveRefriTemp(data) {
  if (!data.responsable || !data.temperatura || !data.fecha || !data.equipo) {
    return { success: false, error: 'Faltan campos obligatorios.' };
  }
  const ampm = data.ampm || (new Date().getHours() < 12 ? 'AM' : 'PM');
  const errFuture = validarFechaNoFutura(data.fecha, ampm);
  if (errFuture) return { success: false, error: errFuture };
  const f = parseFecha(data.fecha);
  const ts = getFechaRegistroFormatted();
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

  const nombreResp = resolveNombreResponsable(data.responsable);

  insertRowAtTop(getSheet(SHEETS.REFRI_REG), [
    formatFechaDDMMYYYY(f),
    f.dia, f.mes, f.anio,
    nombreResp,
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

  clearSheetCache('refriTemp', f.mes, f.anio);

  if (tempOOR) {
    try {
      sendAlertaRefriTemp({
        equipo: data.equipo, tipo: tipo, turno: turno,
        temperatura: temp, tempMin: tempMin, tempMax: tempMax,
        responsable: nombreResp,
        accion_correctiva: accion, fecha: formatFechaDDMMYYYY(f)
      });
    } catch (emailErr) {
      Logger.log('Error enviando alerta refri: ' + emailErr.toString());
    }
  }

  return { success: true, message: 'Registro de Temperatura de ' + (tipo || 'Equipo') + ' guardado.' };
}

// LimpiezaRefri: Fecha | Día | Mes | Año | Tipo Mantención | Equipos | Responsable | Observaciones | Fecha de registro | Revisado_Por | Fecha_Revisión
function saveLimpiezaRefri(data) {
  if (!data.responsable || !data.fecha || !data.tipo_mantencion) {
    return { success: false, error: 'Faltan campos obligatorios.' };
  }
  const errFuture = validarFechaNoFutura(data.fecha);
  if (errFuture) return { success: false, error: errFuture };
  const equipos = data.equipos || [];
  if (equipos.length === 0) {
    return { success: false, error: 'Seleccione al menos un equipo.' };
  }
  const f = parseFecha(data.fecha);
  const ts = getFechaRegistroFormatted();
  const sheet = getSheet(SHEETS.LIMP_REFRI);
  equipos.forEach(eq => {
    insertRowAtTop(sheet, [
      formatFechaDDMMYYYY(f), f.dia, f.mes, f.anio,
      data.tipo_mantencion,
      eq,
      resolveNombreResponsable(data.responsable),
      data.observaciones || '',
      ts,
      '',  // Revisado_Por
      ''   // Fecha_Revisión
    ]);
  });
  clearSheetCache('limpiezaRefri', f.mes, f.anio);
  return { success: true, message: equipos.length + ' registro(s) de Limpieza Refrigeradores guardado(s).' };
}

// Conductividad: Responsable | Conductividad (µS/cm) | Fecha | Día | Mes | Año | Turno | Observaciones | Fecha de registro | Revisado_Por | Fecha_Revisión
function saveConductividad(data) {
  if (!data.responsable || !data.fecha || data.conductividad === undefined || data.conductividad === '') {
    return { success: false, error: 'Faltan campos obligatorios.' };
  }
  const ampm = data.ampm || (new Date().getHours() < 12 ? 'AM' : 'PM');
  const errFuture = validarFechaNoFutura(data.fecha, ampm);
  if (errFuture) return { success: false, error: errFuture };
  const f = parseFecha(data.fecha);
  const ts = getFechaRegistroFormatted();
  const turno = ampm === 'AM' ? 'Mañana' : 'Tarde';
  const cond = parseFloat(data.conductividad);

  const nombreResp = resolveNombreResponsable(data.responsable);

  insertRowAtTop(getSheet(SHEETS.CONDUCT_REG), [
    formatFechaDDMMYYYY(f),
    f.dia, f.mes, f.anio,
    nombreResp,
    cond,
    turno,
    data.observaciones || '',
    ts,
    '',  // Revisado_Por
    ''   // Fecha_Revisión
  ]);

  clearSheetCache('conductividad', f.mes, f.anio);

  // Alert if > 0.5 (warning to encargado)
  if (cond > 0.5) {
    try {
      sendAlertaConductividad({
        conductividad: cond, turno: turno,
        responsable: nombreResp,
        fecha: formatFechaDDMMYYYY(f),
        critico: cond > 0.8
      });
    } catch (emailErr) {
      Logger.log('Error enviando alerta conductividad: ' + emailErr.toString());
    }
  }

  return { success: true, message: 'Registro de Conductividad guardado.' };
}

// Cobas: Fecha | Día | Mes | Año | Equipo | Responsable | Frecuencia | Actividad | Observaciones | Fecha de registro | Revisado_Por | Fecha_Revisión
function saveCobas(data) {
  if (!data.responsable || !data.fecha || !data.equipo || !data.actividades || !data.actividades.length) {
    return { success: false, error: 'Faltan campos obligatorios.' };
  }
  const errFuture = validarFechaNoFutura(data.fecha);
  if (errFuture) return { success: false, error: errFuture };
  const f = parseFecha(data.fecha);
  const ts = getFechaRegistroFormatted();
  const sheet = getSheet(SHEETS.COBAS_REG);
  
  data.actividades.forEach(act => {
    insertRowAtTop(sheet, [
      formatFechaDDMMYYYY(f), f.dia, f.mes, f.anio,
      data.equipo,
      resolveNombreResponsable(data.responsable),
      act.frecuencia,
      act.nombre,
      data.observaciones || '',
      ts,
      '',  // Revisado_Por
      ''   // Fecha_Revisión
    ]);
  });
  
  clearSheetCache('cobas', f.mes, f.anio);
  return { success: true, message: data.actividades.length + ' tarea(s) de Cobas guardada(s).' };
}

// ── Dashboard / Consultas ─────────────────────────────────────

function getRegistros(mes, anio) {
  mes  = parseInt(mes);
  anio = parseInt(anio);

  const sheetsToFetch = [
    { key: 'termo',         sheetName: SHEETS.TERMO,       colMes: 2, colAnio: 3, mapper: r => ({
      fecha: getFechaFromRow(r), dia: r[1], mes: r[2], anio: r[3],
      responsable: r[4], temperatura: r[5], humedad: r[6], turno: r[7],
      area: r[8], accion_correctiva: r[9] || '', observaciones: r[10],
      revisado_por: r[12] || '', fecha_revision: r[13] || ''
    }) },
    { key: 'centrifugas',   sheetName: SHEETS.CENT_REG,    colMes: 2, colAnio: 3, mapper: r => ({
      fecha: getFechaFromRow(r), dia: r[1], mes: r[2], anio: r[3], centrifuga: r[4],
      responsable: r[5], tipo_mantencion: r[6], observaciones: r[7],
      revisado_por: r[9] || '', fecha_revision: r[10] || ''
    }) },
    { key: 'mesones',       sheetName: SHEETS.MESONES,     colMes: 2, colAnio: 3, mapper: r => ({
      fecha: getFechaFromRow(r), dia: r[1], mes: r[2], anio: r[3], sala: r[4],
      responsable: r[5], observaciones: r[6],
      revisado_por: r[8] || '', fecha_revision: r[9] || ''
    }) },
    { key: 'refriTemp',     sheetName: SHEETS.REFRI_REG,    colMes: 2, colAnio: 3, mapper: r => ({
      fecha: getFechaFromRow(r), dia: r[1], mes: r[2], anio: r[3],
      responsable: r[4], temperatura: r[5], turno: r[6],
      equipo: r[7], tipo: r[8], accion_correctiva: r[9] || '', observaciones: r[10],
      revisado_por: r[12] || '', fecha_revision: r[13] || ''
    }) },
    { key: 'limpiezaRefri',  sheetName: SHEETS.LIMP_REFRI,   colMes: 2, colAnio: 3, mapper: r => ({
      fecha: getFechaFromRow(r), dia: r[1], mes: r[2], anio: r[3],
      tipo_mantencion: r[4], equipo: r[5], responsable: r[6], observaciones: r[7],
      revisado_por: r[9] || '', fecha_revision: r[10] || ''
    }) },
    { key: 'conductividad', sheetName: SHEETS.CONDUCT_REG,  colMes: 2, colAnio: 3, mapper: r => ({
      fecha: getFechaFromRow(r), dia: r[1], mes: r[2], anio: r[3],
      responsable: r[4], conductividad: r[5], turno: r[6], observaciones: r[7],
      revisado_por: r[9] || '', fecha_revision: r[10] || ''
    }) },
    { key: 'cobas',         sheetName: SHEETS.COBAS_REG,   colMes: 2, colAnio: 3, mapper: r => ({
      fecha: getFechaFromRow(r), dia: r[1], mes: r[2], anio: r[3],
      equipo: r[4], responsable: r[5], frecuencia: r[6], actividad: r[7],
      observaciones: r[8], revisado_por: r[10] || '', fecha_revision: r[11] || ''
    }) },
    { key: 'elimMuestras',  sheetName: SHEETS.ELIM_MUESTRAS, colMes: 2, colAnio: 3, mapper: r => ({
      fecha: getFechaFromRow(r), dia: r[1], mes: r[2], anio: r[3],
      responsable: r[4], muestras_eliminadas: r[5],
      revisado_por: r[7] || '', fecha_revision: r[8] || ''
    }) }
  ];

  const result = { mes, anio };

  // Calculate non-working days for the requested month
  const diasNoHabiles = [];
  const daysInMonth = new Date(anio, mes, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const fTest = new Date(anio, mes - 1, d);
    if (!esDiaHabil(fTest)) {
      diasNoHabiles.push(d);
    }
  }
  result.diasNoHabiles = diasNoHabiles;

  sheetsToFetch.forEach(cfg => {
    const cacheKey = getCacheKey('regs', cfg.key, mes, anio);
    let cached = getCachedJson(cacheKey);
    if (cached) {
      result[cfg.key] = cached;
    } else {
      const sheet = getSheet(cfg.sheetName);
      const rows = sheet.getDataRange().getValues();
      const filteredRaw = rows.slice(1).filter(r => parseInt(r[cfg.colMes]) === mes && parseInt(r[cfg.colAnio]) === anio);
      const mapped = filteredRaw.map(cfg.mapper);
      setCachedJson(cacheKey, mapped, CACHE_TTL_REGISTROS);
      result[cfg.key] = mapped;
    }
  });

  return result;
}

function getRevision(mes, anio) {
  const cacheKey = getCacheKey('revs', mes, anio);
  let cached = getCachedJson(cacheKey);
  if (cached) {
    return cached;
  }

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
  const result = { revisiones, revisados: Array.from(revisados) };
  
  setCachedJson(cacheKey, result, CACHE_TTL_REGISTROS);
  return result;
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
  const revisor = resolveNombreResponsable(data.revisor || 'REV');
  const mes  = parseInt(data.mes);
  const anio = parseInt(data.anio);
  const sheet = getSheet(SHEETS.REVISIONES);
  const ts    = getFechaRegistroFormatted();
  const fechaRev = formatFechaValue(new Date());

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
    cobas:        { sheet: SHEETS.COBAS_REG,     colMes: 2, colAnio: 3, colRev: 10, colFecha: 11 },
    elimMuestras: { sheet: SHEETS.ELIM_MUESTRAS, colMes: 2, colAnio: 3, colRev: 7,  colFecha: 8  }
  };

  const cacheKeyMap = {
    termo: 'termo',
    centrifugas: 'centrifugas',
    mesones: 'mesones',
    refriTemp: 'refriTemp',
    limpRefri: 'limpiezaRefri',
    conductividad: 'conductividad',
    cobas: 'cobas',
    elimMuestras: 'elimMuestras'
  };

  // Solo hacer stamp en los registros seleccionados
  registros.forEach(function(reg) {
    const cfg = STAMP_MAP[reg];
    if (cfg) {
      stampRevision(getSheet(cfg.sheet), cfg.colMes, cfg.colAnio, mes, anio, revisor, fechaRev, cfg.colRev, cfg.colFecha);
      if (cacheKeyMap[reg]) {
        clearSheetCache(cacheKeyMap[reg], mes, anio);
      }
    }
  });

  clearCacheKeys([getCacheKey('revs', mes, anio)]);

  const nombres = {
    termo: 'Temp. Ambiental', centrifugas: 'Centrífugas', mesones: 'Mesones',
    refriTemp: 'Temp. Refrigeradores', limpRefri: 'Limp. Refrigeradores', conductividad: 'Conductividad',
    cobas: 'Mantención Cobas', elimMuestras: 'Eliminación Muestras'
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
    'Enlace al aplicativo:\n' + APP_URL + '\n\n' +
    'Enlace a los registros:\n' + SHEET_URL + '\n\n' +
    '---\n' +
    'Este mensaje fue enviado automáticamente.\n' +
    'Registros Mensuales — Laboratorio Clínico — Hospital de Talca\n';

  const to = getEmailRecipients('termo');
  if (to) {
    MailApp.sendEmail({ to: to, subject: subject, body: body });
  }
}

// ── Email — Alerta Consolidada Temperatura/Humedad (Trigger Diario 08:30) ──

function triggerAlertaConsolidadaTermo() {
  const hoy = new Date();
  // Obtener la fecha del día anterior
  const ayer = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 1);
  const diaAyer = ayer.getDate();
  const mesAyer = ayer.getMonth() + 1;
  const anioAyer = ayer.getFullYear();

  const fechaAyerStr = String(diaAyer).padStart(2, '0') + '/' + String(mesAyer).padStart(2, '0') + '/' + anioAyer;

  // Obtener registros de temperatura y humedad del mes/año de ayer
  const reg = getRegistros(mesAyer, anioAyer);
  if (!reg || !reg.termo) {
    Logger.log('No se encontraron registros de temperatura/humedad para ' + mesAyer + '/' + anioAyer);
    return;
  }

  // Filtrar únicamente los registros del día de ayer
  const registrosAyer = reg.termo.filter(r => parseInt(r.dia, 10) === diaAyer);

  // Filtrar los registros que tengan al menos un valor fuera de rango
  // Temp fuera de rango: < 18 °C o > 24 °C
  // Humedad fuera de rango: < 20 % o > 70 %
  const alarmas = [];
  registrosAyer.forEach(r => {
    const temp = parseFloat(r.temperatura);
    const hum = parseFloat(r.humedad);
    const tempOOR = !isNaN(temp) && (temp < 18 || temp > 24);
    const humOOR = !isNaN(hum) && (hum < 20 || hum > 70);

    if (tempOOR || humOOR) {
      alarmas.push({
        fecha: r.fecha || fechaAyerStr,
        area: r.area || 'Sin especificar',
        responsable: r.responsable || 'Sin especificar',
        turno: r.turno || 'Sin especificar',
        temperatura: r.temperatura,
        humedad: r.humedad,
        tempOOR: tempOOR,
        humOOR: humOOR,
        accion_correctiva: r.accion_correctiva || '',
        observaciones: r.observaciones || ''
      });
    }
  });

  if (alarmas.length === 0) {
    Logger.log('No se registraron medidas fuera de rango en Temperatura/Humedad para el día ' + fechaAyerStr);
    return;
  }

  const recipients = getEmailRecipients('termo');
  if (!recipients) {
    Logger.log('Alertas de temperatura/humedad pausadas o sin destinatarios configurados.');
    return;
  }

  const subject = '⚠️ [Registros Lab] Consolidado de Alertas: Temperatura y Humedad fuera de rango (' + fechaAyerStr + ')';

  let detallesText = '';
  alarmas.forEach((item, index) => {
    const afecciones = [];
    if (item.tempOOR) afecciones.push('Temperatura: ' + item.temperatura + ' °C (Rango aceptable: 18–24 °C)');
    if (item.humOOR) afecciones.push('Humedad: ' + item.humedad + '% (Rango aceptable: 20–70%)');

    detallesText += '──────────────────────────────────────────────────\n';
    detallesText += 'Alarma #' + (index + 1) + '\n';
    detallesText += '📍 Área: ' + item.area + '\n';
    detallesText += '🕐 Jornada / Turno: ' + item.turno + '\n';
    detallesText += '👤 Usuario / Responsable: ' + item.responsable + '\n';
    detallesText += '📅 Fecha: ' + item.fecha + '\n';
    detallesText += '🌡️ Temperatura registrada: ' + item.temperatura + ' °C' + (item.tempOOR ? ' ⚠️ [FUERA DE RANGO]' : '') + '\n';
    detallesText += '💧 Humedad registrada: ' + item.humedad + '%' + (item.humOOR ? ' ⚠️ [FUERA DE RANGO]' : '') + '\n';
    detallesText += '⚠️ Detalle fuera de rango:\n  • ' + afecciones.join('\n  • ') + '\n';
    detallesText += '🔧 Acción Correctiva: ' + (item.accion_correctiva ? item.accion_correctiva : 'No especificada') + '\n';
    detallesText += '📝 Observaciones: ' + (item.observaciones ? item.observaciones : 'Sin observaciones') + '\n\n';
  });

  const body = 'Estimado/a,\n\n' +
    'Se adjunta el reporte consolidado de medidas fuera de rango registradas en el formulario de Temperatura y Humedad Ambiental correspondientes al día de ayer (' + fechaAyerStr + ').\n\n' +
    '📊 Total de alarmas del día anterior: ' + alarmas.length + '\n\n' +
    'DETALLE DE MEDIDAS FUERA DE RANGO:\n' +
    detallesText +
    'Por favor, revisar los registros y verificar que se hayan tomado las acciones necesarias.\n\n' +
    'Enlace al aplicativo:\n' + APP_URL + '\n\n' +
    'Enlace a los registros:\n' + SHEET_URL + '\n\n' +
    '---\n' +
    'Este mensaje consolidado fue enviado automáticamente a las 08:30.\n' +
    'Registros Mensuales — Laboratorio Clínico — Hospital de Talca\n';

  try {
    MailApp.sendEmail({ to: recipients, subject: subject, body: body });
    Logger.log('Correo consolidado de alertas de temperatura/humedad enviado a: ' + recipients + ' (' + alarmas.length + ' alarmas)');
  } catch (e) {
    Logger.log('Error enviando correo consolidado de temperatura/humedad: ' + e.toString());
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
    'Enlace al aplicativo:\n' + APP_URL + '\n\n' +
    'Enlace a los registros:\n' + SHEET_URL + '\n\n' +
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
    'Enlace al aplicativo:\n' + APP_URL + '\n\n' +
    'Enlace a los registros:\n' + SHEET_URL + '\n\n' +
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
      'Enlace al aplicativo:\n' + APP_URL + '\n\n' +
      'Enlace a los registros:\n' + SHEET_URL + '\n\n' +
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

function triggerDatosNoRellenados(e) {
  try {
    logTriggerExecution('triggerDatosNoRellenados_STARTED', e, 'Ejecución iniciada');
  } catch(errLog) {}

  const chileDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Santiago' }));
  const chileHour = chileDate.getHours();

  let targetHour = null;
  if (typeof e === 'number') {
    targetHour = e;
  } else if (e && typeof e.hour === 'number') {
    targetHour = e.hour;
  } else {
    targetHour = chileHour;
  }

  const notifs = getNotificaciones();
  
  // Filtrar notificaciones activas correspondientes al horario actual (o a todas si targetHour no está especificado)
  const activeForHour = {};
  notifs.forEach(n => {
    if (n.pausado) return;
    if (!n.destinatarios || !n.destinatarios.trim()) return;

    const parts = (n.hora || '20:00').split(':');
    const h = parseInt(parts[0], 10);
    
    const matchesHour = (targetHour === null) || isNaN(h) || (h === targetHour) || 
      (Math.abs(h - targetHour) <= 1) || 
      (h === 23 && targetHour === 0) || 
      (h === 0 && targetHour === 23) ||
      (h === chileHour);
      
    if (matchesHour) {
      activeForHour[n.clave] = n;
    }
  });

  if (Object.keys(activeForHour).length === 0) {
    Logger.log('No hay notificaciones pendientes programadas para la hora: ' + (targetHour !== null ? targetHour + ':00' : 'todas'));
    return ['No hay notificaciones pendientes programadas para la hora.'];
  }

  const hoy = new Date();
  const dia = hoy.getDate();
  const mes = hoy.getMonth() + 1;
  const anio = hoy.getFullYear();

  const esHab = esDiaHabil(hoy);

  const areasDetailed = getAreasDetailed();
  const centrifugasDetailed = getCentrifugasDetailed();
  const salasDetailed = getSalasDetailed();
  const refrigeradores = getRefrigeradores();

  const reg = getRegistros(mes, anio);

  // Recopilar elementos faltantes solo para los formularios activos en este horario
  const missingByRegister = {};

  // 1. Temperatura/Humedad faltantes ('termo')
  if (activeForHour['termo']) {
    const termoFaltantes = [];
    areasDetailed.forEach(item => {
      if (!esHab && item.horarioTurno === 'no') return;
      const area = item.nombre;
      ['Mañana', 'Tarde'].forEach(turno => {
        const existe = reg.termo.some(r => parseInt(r.dia) === dia && r.area === area && r.turno === turno);
        if (!existe) termoFaltantes.push(area + ' (' + turno + ')');
      });
    });
    if (termoFaltantes.length > 0) {
      missingByRegister['termo'] = { name: '🌡️ Temperatura/Humedad Ambiental', items: termoFaltantes, notif: activeForHour['termo'] };
    }
  }

  // 2. Centrífugas faltantes ('centrifugas')
  if (activeForHour['centrifugas']) {
    const centFaltantes = [];
    centrifugasDetailed.forEach(item => {
      if (!esHab && item.horarioTurno === 'no') return;
      const c = item.nombre;
      const existe = reg.centrifugas.some(r => parseInt(r.dia) === dia && r.centrifuga === c && r.tipo_mantencion === 'Diaria');
      if (!existe) centFaltantes.push(c);
    });
    if (centFaltantes.length > 0) {
      missingByRegister['centrifugas'] = { name: '⚙️ Centrífugas (Diaria)', items: centFaltantes, notif: activeForHour['centrifugas'] };
    }
  }

  // 3. Mesones faltantes ('mesones')
  if (activeForHour['mesones']) {
    const mesonFaltantes = [];
    salasDetailed.forEach(item => {
      if (!esHab && item.horarioTurno === 'no') return;
      const s = item.nombre;
      const existe = reg.mesones.some(r => parseInt(r.dia) === dia && r.sala === s);
      if (!existe) mesonFaltantes.push(s);
    });
    if (mesonFaltantes.length > 0) {
      missingByRegister['mesones'] = { name: '🧽 Limpieza de Mesones', items: mesonFaltantes, notif: activeForHour['mesones'] };
    }
  }

  // 4. Temp Refrigeradores faltantes ('refriTemp')
  if (activeForHour['refriTemp']) {
    const refriFaltantes = [];
    refrigeradores.forEach(r => {
      ['Mañana', 'Tarde'].forEach(turno => {
        const existe = reg.refriTemp.some(rt => parseInt(rt.dia) === dia && rt.equipo === r.equipo && rt.turno === turno);
        if (!existe) refriFaltantes.push(r.equipo + ' (' + turno + ')');
      });
    });
    if (refriFaltantes.length > 0) {
      missingByRegister['refriTemp'] = { name: '🧊 Temp. Refrigeradores', items: refriFaltantes, notif: activeForHour['refriTemp'] };
    }
  }

  // 5. Conductividad faltantes ('conductividad')
  if (activeForHour['conductividad']) {
    const condFaltantes = [];
    ['Mañana', 'Tarde'].forEach(turno => {
      const existe = reg.conductividad.some(c => parseInt(c.dia) === dia && c.turno === turno);
      if (!existe) condFaltantes.push('Conductividad (' + turno + ')');
    });
    if (condFaltantes.length > 0) {
      missingByRegister['conductividad'] = { name: '💧 Conductividad Agua', items: condFaltantes, notif: activeForHour['conductividad'] };
    }
  }

  // 6. Cobas diarias faltantes ('cobas')
  if (activeForHour['cobas']) {
    const cobasFaltantes = [];
    const cobasEquipos = ['Cobas 1', 'Cobas 2'];
    const cobasHoy = reg.cobas ? reg.cobas.filter(r => parseInt(r.dia) === dia) : [];
    cobasEquipos.forEach(eq => {
      const existe = cobasHoy.some(r => r.equipo === eq && r.frecuencia === 'Diaria');
      if (!existe) {
        cobasFaltantes.push(eq + ': Mantención Diaria');
      }
    });
    if (cobasFaltantes.length > 0) {
      missingByRegister['cobas'] = { name: '🔬 Mantención Cobas (Diaria)', items: cobasFaltantes, notif: activeForHour['cobas'] };
    }
  }

  // 7. Eliminación de Muestras faltante ('elimMuestras')
  if (activeForHour['elimMuestras']) {
    const elimHoy = reg.elimMuestras ? reg.elimMuestras.filter(r => parseInt(r.dia) === dia) : [];
    if (elimHoy.length === 0) {
      missingByRegister['elimMuestras'] = { name: '🗑️ Registro de Eliminación de Muestras', items: ['Eliminación de Muestras del día'], notif: activeForHour['elimMuestras'] };
    }
  }

  // Agrupar por destinatarios exactos (normalizados)
  const recipientGroups = {};

  Object.keys(missingByRegister).forEach(clave => {
    const regData = missingByRegister[clave];
    const rawRecipients = regData.notif.destinatarios;
    if (!rawRecipients) return;

    const emailList = rawRecipients.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
    if (emailList.length === 0) return;

    // Clave de grupo normalizada con correos ordenados
    const sortedKey = emailList.slice().sort().join(',');
    const cleanTo = emailList.join(', ');
    
    if (!recipientGroups[sortedKey]) {
      recipientGroups[sortedKey] = {
        recipientsOriginal: cleanTo,
        itemsList: []
      };
    }
    recipientGroups[sortedKey].itemsList.push(regData);
  });

  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                 'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  // Enviar correos consolidados por grupo de destinatarios
  const sentLogs = [];
  Object.keys(recipientGroups).forEach(groupKey => {
    const group = recipientGroups[groupKey];
    if (group.itemsList.length === 0) return;

    let detailText = '';
    group.itemsList.forEach(regInfo => {
      detailText += '\n' + regInfo.name + ':\n' + regInfo.items.map(f => '  • ' + f).join('\n') + '\n';
    });

    const subject = '📝 [Registros Lab] Datos pendientes del día ' + dia + ' de ' + meses[mes - 1];
    const body = 'Estimado/a,\n\n' +
      'Los siguientes registros correspondientes al día ' + dia + ' de ' + meses[mes - 1] + ' ' + anio +
      ' bajo su responsabilidad no han sido completados:\n' +
      detailText + '\n' +
      'Por favor, complete los registros pendientes a la brevedad.\n\n' +
      'Enlace al aplicativo:\n' + APP_URL + '\n\n' +
      'Enlace a los registros:\n' + SHEET_URL + '\n\n' +
      '---\n' +
      'Este mensaje fue enviado automáticamente.\n' +
      'Registros Mensuales — Laboratorio Clínico — Hospital de Talca\n';

    try {
      MailApp.sendEmail({ to: group.recipientsOriginal, subject: subject, body: body });
      const logMsg = 'Correo de registros pendientes enviado a (' + group.recipientsOriginal + ') a las ' + (targetHour !== null ? targetHour : 'varias') + ':00 hrs.';
      Logger.log(logMsg);
      sentLogs.push(logMsg);
    } catch (err) {
      const errMsg = 'Error enviando correo de registros pendientes a (' + group.recipientsOriginal + '): ' + err.toString();
      Logger.log(errMsg);
      sentLogs.push(errMsg);
    }
  });
  logTriggerExecution('triggerDatosNoRellenados', e, sentLogs);
  return sentLogs;
}

function isNotificationActive(clave) {
  try {
    const list = getNotificaciones();
    const found = list.find(n => n.clave === clave);
    if (found) {
      return !found.pausado && !!(found.destinatarios && found.destinatarios.trim());
    }
  } catch(e) {}
  return true;
}

function parseDateFromRow(row) {
  if (!row) return null;
  
  // 1. Prioridad: Columnas numéricas explícitas de Día (row[1]), Mes (row[2]), Año (row[3])
  const d = parseInt(row[1], 10);
  const m = parseInt(row[2], 10);
  const y = parseInt(row[3], 10);
  if (!isNaN(d) && !isNaN(m) && !isNaN(y) && d >= 1 && d <= 31 && m >= 1 && m <= 12 && y > 1900) {
    return new Date(y, m - 1, d);
  }
  
  // 2. String dd/mm/yyyy o yyyy-mm-dd en row[0]
  if (row[0] && !(row[0] instanceof Date)) {
    const str = String(row[0]).trim();
    const slashParts = str.split('/');
    if (slashParts.length === 3) {
      const parsed = new Date(parseInt(slashParts[2], 10), parseInt(slashParts[1], 10) - 1, parseInt(slashParts[0], 10));
      if (!isNaN(parsed.getTime())) return parsed;
    }
    const dashParts = str.split('-');
    if (dashParts.length === 3) {
      const parsed = new Date(parseInt(dashParts[0], 10), parseInt(dashParts[1], 10) - 1, parseInt(dashParts[2], 10));
      if (!isNaN(parsed.getTime())) return parsed;
    }
  }

  // 3. Fallback: Objeto Date en row[0]
  if (row[0] instanceof Date && !isNaN(row[0].getTime())) {
    return row[0];
  }

  return null;
}

// ── Email — Alerta Mantenciones Semanales Vencidas ────────────

function triggerMantencionSemanal(overrideRecipient) {
  const hoy = new Date();
  const missingByRegister = {};
  
  // 1. Verificar Centrífugas (Semanal) por cada centrífuga individual solo si está activo
  if (isNotificationActive('centrifugas')) {
    const centrifugasOverdue = [];
    try {
      const listCentrifugas = getCentrifugas(); // e.g. ['Centrífuga 1', 'Centrífuga 2', ...]
      const sheetCent = getSheet(SHEETS.CENT_REG);
      const rowsCent = sheetCent ? sheetCent.getDataRange().getValues() : [];
      
      listCentrifugas.forEach(cName => {
        let ultimaFecha = null;
        for (let i = 1; i < rowsCent.length; i++) {
          const row = rowsCent[i];
          const eqName = String(row[4] || '').trim();
          const tipoMant = String(row[6] || '').trim();
          
          if (eqName === cName && tipoMant === 'Semanal') {
            const f = parseDateFromRow(row);
            if (f && (!ultimaFecha || f > ultimaFecha)) {
              ultimaFecha = f;
            }
          }
        }

        let isOverdue = false;
        let statusText = '';
        if (!ultimaFecha) {
          isOverdue = true;
          statusText = 'Último registro: Nunca (sin registros desde 01/08/2026)';
        } else {
          const diffMs = hoy.getTime() - ultimaFecha.getTime();
          const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          if (diffDias > 7) {
            isOverdue = true;
            statusText = 'Último registro: ' + formatFechaValue(ultimaFecha) + ' (hace ' + diffDias + ' días)';
          }
        }

        if (isOverdue) {
          centrifugasOverdue.push('  • ' + cName + ': ' + statusText);
        }
      });

      if (centrifugasOverdue.length > 0) {
        missingByRegister['centrifugas'] = {
          title: '⚙️ Centrífugas — Mantención Semanal Pendiente (' + centrifugasOverdue.length + ' equipo(s)):',
          items: centrifugasOverdue
        };
      }
    } catch (e) {
      Logger.log('Error evaluando mantención semanal de centrífugas: ' + e.toString());
    }
  }

  // 2. Verificar Limpieza Refrigeradores (Semanal externa) por cada equipo individual solo si está activo
  if (isNotificationActive('limpRefri')) {
    const refriLimpOverdue = [];
    try {
      const listRefri = getRefriLimpieza(); // e.g. ['R1', 'R2', ...]
      const sheetLimp = getSheet(SHEETS.LIMP_REFRI);
      const rowsLimp = sheetLimp ? sheetLimp.getDataRange().getValues() : [];
      
      listRefri.forEach(rName => {
        let ultimaFecha = null;
        for (let i = 1; i < rowsLimp.length; i++) {
          const row = rowsLimp[i];
          const tipoMant = String(row[4] || '').trim();
          const eqName = String(row[5] || '').trim();
          
          if (eqName === rName && tipoMant === 'Semanal (externa)') {
            const f = parseDateFromRow(row);
            if (f && (!ultimaFecha || f > ultimaFecha)) {
              ultimaFecha = f;
            }
          }
        }

        let isOverdue = false;
        let statusText = '';
        if (!ultimaFecha) {
          isOverdue = true;
          statusText = 'Último registro: Nunca (sin registros desde 01/08/2026)';
        } else {
          const diffMs = hoy.getTime() - ultimaFecha.getTime();
          const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          if (diffDias > 7) {
            isOverdue = true;
            statusText = 'Último registro: ' + formatFechaValue(ultimaFecha) + ' (hace ' + diffDias + ' días)';
          }
        }

        if (isOverdue) {
          refriLimpOverdue.push('  • ' + rName + ': ' + statusText);
        }
      });

      if (refriLimpOverdue.length > 0) {
        missingByRegister['limpRefri'] = {
          title: '🧊 Limpieza Refrigeradores — Semanal Externa Pendiente (' + refriLimpOverdue.length + ' equipo(s)):',
          items: refriLimpOverdue
        };
      }
    } catch (e) {
      Logger.log('Error evaluando limpieza semanal de refrigeradores: ' + e.toString());
    }
  }

  if (Object.keys(missingByRegister).length === 0) {
    Logger.log('No hay mantenciones semanales vencidas.');
    return ['No hay mantenciones semanales vencidas.'];
  }

  // Enviar correos según los destinatarios de cada clave
  const sentLogs = [];
  const recipientGroups = {};

  Object.keys(missingByRegister).forEach(clave => {
    let recipientsStr = overrideRecipient || getEmailRecipients(clave);
    if (!recipientsStr) return;

    const emailList = recipientsStr.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
    if (emailList.length === 0) return;

    const sortedKey = emailList.slice().sort().join(',');
    const cleanTo = emailList.join(', ');

    if (!recipientGroups[sortedKey]) {
      recipientGroups[sortedKey] = {
        to: cleanTo,
        itemsList: []
      };
    }
    recipientGroups[sortedKey].itemsList.push(missingByRegister[clave]);
  });

  Object.keys(recipientGroups).forEach(groupKey => {
    const group = recipientGroups[groupKey];
    if (group.itemsList.length === 0) return;

    let totalCount = 0;
    let detailText = '';
    group.itemsList.forEach(info => {
      totalCount += info.items.length;
      detailText += '\n' + info.title + '\n' + info.items.join('\n') + '\n';
    });

    const subject = '🔔 [Registros Lab] Mantenciones semanales vencidas (' + totalCount + ' pendiente(s))';
    const body = 'Estimado/a,\n\n' +
      'Las siguientes mantenciones semanales específicas bajo su responsabilidad llevan más de 7 días sin registrarse:\n' +
      detailText + '\n' +
      'Por favor, realice las mantenciones pendientes y regístrelas en el aplicativo a la brevedad.\n\n' +
      'Enlace al aplicativo:\n' + APP_URL + '\n\n' +
      'Enlace a los registros:\n' + SHEET_URL + '\n\n' +
      '---\n' +
      'Este mensaje fue enviado automáticamente.\n' +
      'Registros Mensuales — Laboratorio Clínico — Hospital de Talca\n';

    try {
      MailApp.sendEmail({ to: group.to, subject: subject, body: body });
      const logMsg = 'Correo de mantención semanal enviado a (' + group.to + ') con ' + totalCount + ' ítem(s) vencido(s).';
      Logger.log(logMsg);
      sentLogs.push(logMsg);
    } catch (e) {
      const errorMsg = 'Error enviando correo de mantención semanal a (' + group.to + '): ' + e.toString();
      Logger.log(errorMsg);
      sentLogs.push(errorMsg);
    }
  });

  // Ejecutar alerta periódica de Cobas
  try {
    triggerAlertaMantencionesCobas();
  } catch(e) {
    Logger.log('Error en triggerAlertaMantencionesCobas: ' + e.toString());
  }

  return sentLogs;
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
  const groupedFreqs = ['Semanal', 'Quincenal', 'Mensual'];
  
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
      const isGrouped = groupedFreqs.includes(freq);
      const key = isGrouped ? (equipo + '|' + freq) : (equipo + '|' + actividad);
      
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
      const isGrouped = groupedFreqs.includes(freq);
      
      if (isGrouped) {
        const key = eq + '|' + freq;
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
            actividad: 'Mantención ' + freq,
            frecuencia: freq,
            ultimaFechaStr: ultimaFecha ? formatFechaValue(ultimaFecha) : 'Nunca',
            diasSinRegistro: ultimaFecha ? diffDias + ' días' : '∞ (sin registros)'
          });
        }
      } else {
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
              ultimaFechaStr: ultimaFecha ? formatFechaValue(ultimaFecha) : 'Nunca',
              diasSinRegistro: ultimaFecha ? diffDias + ' días' : '∞ (sin registros)'
            });
          }
        });
      }
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
    'Enlace al aplicativo:\n' + APP_URL + '\n\n' +
    'Enlace a los registros:\n' + SHEET_URL + '\n\n' +
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
    if (fn === 'triggerRecordatorioMesAnterior' || fn === 'triggerDatosNoRellenados' || fn === 'triggerMantencionSemanal' || fn === 'triggerAlertaConsolidadaTermo') {
      ScriptApp.deleteTrigger(t);
    }
  });

  const notifs = getNotificaciones();
  const notifMap = {};
  notifs.forEach(n => { notifMap[n.clave] = n; });

  const parseHour = (clave, defaultHour) => {
    const timeStr = notifMap[clave] ? notifMap[clave].hora : null;
    if (!timeStr) return defaultHour;
    const parts = timeStr.split(':');
    const h = parseInt(parts[0], 10);
    return isNaN(h) ? defaultHour : h;
  };

  const hourRecordatorio = 8;
  const hourMantencion = parseHour('centrifugas', 9);
  const hourAlertaTermo = 8;

  // Trigger diario para recordatorio de mes anterior (solo actúa el día 1)
  ScriptApp.newTrigger('triggerRecordatorioMesAnterior')
    .timeBased()
    .atHour(hourRecordatorio)
    .everyDays(1)
    .inTimezone('America/Santiago')
    .create();

  // Trigger diario para mantenciones semanales vencidas
  ScriptApp.newTrigger('triggerMantencionSemanal')
    .timeBased()
    .atHour(hourMantencion)
    .everyDays(1)
    .inTimezone('America/Santiago')
    .create();

  // Trigger diario para alerta consolidada de temperatura/humedad fuera de rango del día anterior (08:30)
  ScriptApp.newTrigger('triggerAlertaConsolidadaTermo')
    .timeBased()
    .atHour(hourAlertaTermo)
    .everyDays(1)
    .inTimezone('America/Santiago')
    .create();

  // Triggers diarios para datos no rellenados del día según las horas configuradas en Maestro Notificaciones
  const pendingHours = new Set();
  notifs.forEach(n => {
    if (!n.pausado && n.destinatarios && n.destinatarios.trim()) {
      const parts = (n.hora || '20:00').split(':');
      const h = parseInt(parts[0], 10);
      if (!isNaN(h) && h >= 0 && h <= 23) {
        pendingHours.add(h);
      }
    }
  });

  const configuredHours = Array.from(pendingHours);
  if (configuredHours.length === 0) {
    configuredHours.push(20);
  }

  configuredHours.forEach(h => {
    ScriptApp.newTrigger('triggerDatosNoRellenados')
      .timeBased()
      .atHour(h)
      .everyDays(1)
      .inTimezone('America/Santiago')
      .create();
  });

  Logger.log('Triggers configurados correctamente para las horas: ' + configuredHours.join(', '));
  return 'Triggers configurados: triggerRecordatorioMesAnterior (' + String(hourRecordatorio).padStart(2,'0') + ':00), triggerMantencionSemanal (' + String(hourMantencion).padStart(2,'0') + ':00), triggerDatosNoRellenados (horas: ' + configuredHours.map(h => String(h).padStart(2,'0') + ':00').join(', ') + '), triggerAlertaConsolidadaTermo (' + String(hourAlertaTermo).padStart(2,'0') + ':30)';
}

// ── Inicialización del Spreadsheet ───────────────────────────

function getSheetDefs() {
  return [
    // Registros primero
    { name: SHEETS.TERMO,       headers: ['Fecha (dd/mm/aaaa)','Día','Mes','Año','Responsable','Temperatura (°C)','Humedad (%)','Turno','Area','Acción Correctiva','Observaciones','Fecha de registro','Revisado Por','Fecha Revisión'],
      hideCols: [2,3,4,12] },
    { name: SHEETS.CENT_REG,    headers: ['Fecha (dd/mm/aaaa)','Día','Mes','Año','Centrifuga','Responsable','Tipo Mantención','Observaciones','Fecha de registro','Revisado Por','Fecha Revisión'],
      hideCols: [2,3,4,9] },
    { name: SHEETS.MESONES,     headers: ['Fecha (dd/mm/aaaa)','Día','Mes','Año','Sala','Responsable','Observaciones','Fecha de registro','Revisado Por','Fecha Revisión'],
      hideCols: [2,3,4,8] },
    { name: SHEETS.REFRI_REG,   headers: ['Fecha (dd/mm/aaaa)','Día','Mes','Año','Responsable','Temperatura (°C)','Turno','Equipo','Tipo','Acción Correctiva','Observaciones','Fecha de registro','Revisado Por','Fecha Revisión'],
      hideCols: [2,3,4,12] },
    { name: SHEETS.LIMP_REFRI,  headers: ['Fecha (dd/mm/aaaa)','Día','Mes','Año','Tipo Mantención','Equipo','Responsable','Observaciones','Fecha de registro','Revisado Por','Fecha Revisión'],
      hideCols: [2,3,4,9] },
    { name: SHEETS.CONDUCT_REG, headers: ['Fecha (dd/mm/aaaa)','Día','Mes','Año','Responsable','Conductividad (µS/cm)','Turno','Observaciones','Fecha de registro','Revisado Por','Fecha Revisión'],
      hideCols: [2,3,4,9] },
    { name: SHEETS.COBAS_REG,   headers: ['Fecha (dd/mm/aaaa)','Día','Mes','Año','Equipo','Responsable','Frecuencia','Actividad','Observaciones','Fecha de registro','Revisado Por','Fecha Revisión'],
      hideCols: [2,3,4,10] },
    { name: SHEETS.REVISIONES,  headers: ['Mes','Año','Registros','Revisor','Fecha de registro'],
      hideCols: [5] },
    { name: SHEETS.ETIQUETADORAS_REG, headers: ['Fecha (dd/mm/aaaa)','Día','Mes','Año','Etiquetadora','Nombre Práctico','Accion','Descripcion','Responsable','Fecha de registro'],
      hideCols: [2,3,4,10] },
    { name: SHEETS.DXH900_REG,  headers: ['Fecha (dd/mm/aaaa)','Día','Mes','Año','Usuario Responsable','Descripción Intervención','Nombre Especialista','Fecha de registro'],
      hideCols: [2,3,4,8] },
    { name: SHEETS.ELIM_MUESTRAS, headers: ['Fecha (dd/mm/aaaa)','Día','Mes','Año','Responsable','Muestras Eliminadas','Fecha de registro','Revisado Por','Fecha Revisión'],
      hideCols: [2,3,4,7] },
    // Maestros al final
    { name: SHEETS.AREAS,       headers: ['Area', 'Horario turno'] },
    { name: SHEETS.CENTRIFUGAS, headers: ['Centrifuga', 'Horario turno'] },
    { name: SHEETS.SALAS,       headers: ['Sala', 'Horario turno'] },
    { name: SHEETS.REFRI_MASTER, headers: ['Equipo','Tipo','Temp Min (°C)','Temp Max (°C)'] },
    { name: SHEETS.REFRI_LIMP_MASTER, headers: ['Equipo'] },
    { name: SHEETS.ACCIONES,    headers: ['Acción'] },
    { name: SHEETS.ETIQUETADORAS_MASTER, headers: ['Nombre Real','ID','Nombre Práctico','Modelo','Tipo de Conexión','Dirección IP','Piso','Ubicación','Comentario'] },
    { name: SHEETS.NOTIFICACIONES, headers: ['Registro','Clave','Destinatarios','Pausado','Hora'] },
    { name: SHEETS.DIAS_NO_HABILES_HRT, headers: ['Fecha (dd/mm/aaaa)','Motivo','Registrado Por'] },
    { name: SHEETS.PERSONAL, headers: ['Iniciales','Nombre Completo','Estamento','Activo','Fecha de registro'] }
  ];
}

function ensureSheetHeadersAndVisibility(sheet) {
  if (!sheet) return;
  try {
    const name = sheet.getName();
    const def = getSheetDefs().find(d => d.name === name);
    if (!def) return;
    
    const needed = def.headers.length;
    if (sheet.getMaxColumns() < needed) {
      sheet.insertColumnsAfter(sheet.getMaxColumns(), needed - sheet.getMaxColumns());
    }
    
    sheet.getRange(1, 1, 1, needed).setValues([def.headers]);
    sheet.getRange(1, 1, 1, needed)
      .setBackground('#0F172A').setFontColor('#FFFFFF').setFontWeight('bold');
    sheet.setFrozenRows(1);
    
    if (def.hideCols) {
      def.hideCols.forEach(col => {
        if (col <= sheet.getMaxColumns()) {
          try { sheet.hideColumns(col); } catch(e) {}
        }
      });
    }
  } catch(e) {
    Logger.log('Error en ensureSheetHeadersAndVisibility: ' + e.toString());
  }
}

function initializeSpreadsheet() {
  const ss = getSpreadsheet();
  const defs = getSheetDefs();

  const newlyCreated = {};

  defs.forEach(def => {
    let sheet = ss.getSheetByName(def.name);
    if (!sheet) {
      sheet = ss.insertSheet(def.name);
      newlyCreated[def.name] = true;
    }
    ensureSheetHeadersAndVisibility(sheet);
  });

  // Maestros iniciales (solo si se acaba de crear la hoja)
  if (newlyCreated[SHEETS.AREAS]) {
    const areasSheet = ss.getSheetByName(SHEETS.AREAS);
    ['Microbiología', 'Hematología', 'Química'].forEach(a => areasSheet.appendRow([a]));
  }

  if (newlyCreated[SHEETS.CENTRIFUGAS]) {
    const centSheet = ss.getSheetByName(SHEETS.CENTRIFUGAS);
    ['Centrífuga 1','Centrífuga 2','Centrífuga 3','Centrífuga 4','Centrífuga 5','Centrífuga 18','Centrífuga 19'].forEach(c => centSheet.appendRow([c]));
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

  if (newlyCreated[SHEETS.PERSONAL]) {
    setupMaestroPersonal();
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
      ['Mantención Cobas', 'cobas', 'grivera@hospitaldetalca.cl', 'FALSE'],
      ['Reparaciones DxH 900 Urgencias', 'dxh900', 'grivera@hospitaldetalca.cl', 'FALSE'],
      ['Registro de eliminación de muestras', 'elimMuestras', 'grivera@hospitaldetalca.cl', 'FALSE']
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
  const ss = SpreadsheetApp.create('Registros Mensuales Laboratorio HRT');
  const id = ss.getId();
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', id);
  initializeSpreadsheet();
  return { spreadsheetId: id, url: 'https://docs.google.com/spreadsheets/d/' + id };
}

function reinitialize() {
  try {
    const cache = CacheService.getScriptCache();
    cache.remove('maestros_all');
    cache.remove('sugerencias_historicas');
    cache.remove('dxh900_hist');
  } catch (e) {
    Logger.log('Error clearing all cache on reinitialize: ' + e.toString());
  }
  resetRegistros();
  initializeSpreadsheet();
  return { success: true, message: 'Estructura y registros re-inicializados y caché borrada.' };
}

function resetRegistros() {
  const registroSheets = [
    SHEETS.TERMO, SHEETS.CENT_REG, SHEETS.MESONES,
    SHEETS.REFRI_REG, SHEETS.LIMP_REFRI, SHEETS.CONDUCT_REG,
    SHEETS.COBAS_REG, SHEETS.REVISIONES, SHEETS.ETIQUETADORAS_REG,
    SHEETS.DXH900_REG
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
    revSheet.getRange(1, 1, 1, 5).setValues([['Mes','Año','Registros','Revisor','Fecha de registro']]);
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
  const cacheKey = getCacheKey('et_hist', etName);
  let cached = getCachedJson(cacheKey);
  if (cached) {
    return cached;
  }
  const data = getSheet(SHEETS.ETIQUETADORAS_REG).getDataRange().getValues();
  const result = data.slice(1)
    .filter(r => r[4] && String(r[4]) === etName)
    .map(r => {
      let fechaStr = getFechaFromRow(r);
      return {
        fecha: fechaStr,
        nombrePractico: String(r[5]),
        accion: String(r[6]),
        descripcion: String(r[7]),
        responsable: String(r[8])
      };
    });
  setCachedJson(cacheKey, result, 3600); // 1 hour cache
  return result;
}

function saveEtiquetadoraRegistro(data) {
  if (!data.etiquetadora || !data.accion || !data.descripcion || !data.responsable) {
    return { success: false, error: 'Faltan campos obligatorios.' };
  }
  const errFuture = validarFechaNoFutura(data.fecha);
  if (errFuture) return { success: false, error: errFuture };
  const f = parseFecha(data.fecha || new Date().toISOString().split('T')[0]);
  const ts = getFechaRegistroFormatted();
  
  let nombrePractico = data.nombrePractico || '';
  if (!nombrePractico) {
    const masterSheet = getSheet(SHEETS.ETIQUETADORAS_MASTER);
    if (masterSheet) {
      const masterRows = masterSheet.getDataRange().getValues();
      const match = masterRows.find(r => String(r[0]).trim() === String(data.etiquetadora).trim());
      if (match) {
        nombrePractico = match[2];
      }
    }
  }
  
  insertRowAtTop(getSheet(SHEETS.ETIQUETADORAS_REG), [
    formatFechaDDMMYYYY(f), f.dia, f.mes, f.anio,
    data.etiquetadora,
    nombrePractico,
    data.accion,
    data.descripcion,
    resolveNombreResponsable(data.responsable),
    ts
  ]);
  
  clearCacheKeys([getCacheKey('et_hist', data.etiquetadora)]);
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
  let oldPractico = '';
  
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === String(data.nombreReal).trim()) {
      rowIndex = i + 1;
      oldPractico = String(rows[i][2]).trim(); // Index 2 is 'Nombre Práctico'
      break;
    }
  }
  
  const newPractico = (data.nombrePractico || '').trim();
  
  // If the label printer exists and its practical name was changed:
  if (rowIndex !== -1 && oldPractico !== newPractico) {
    if (!data.responsable) {
      return { success: false, error: 'Se requiere usuario responsable para cambiar el nombre práctico.' };
    }
    
    // Log the change in Reg. Etiquetadoras
    const f = parseFecha(new Date().toISOString().split('T')[0]);
    const ts = getFechaRegistroFormatted();
    insertRowAtTop(getSheet(SHEETS.ETIQUETADORAS_REG), [
      formatFechaDDMMYYYY(f), f.dia, f.mes, f.anio,
      data.nombreReal,
      newPractico,
      'Cambio de ubicación',
      'Se cambia la ubicación y el nombre práctico de la etiquetadora',
      resolveNombreResponsable(data.responsable),
      ts
    ]);
    
    // Clear history cache for this label printer
    clearCacheKeys([getCacheKey('et_hist', data.nombreReal)]);
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
    clearCacheKeys(['maestros_all', 'sugerencias_historicas']);
    return { success: true, message: 'Ficha de etiquetadora actualizada.' };
  } else {
    sheet.appendRow(rowData);
    clearCacheKeys(['maestros_all', 'sugerencias_historicas']);
    return { success: true, message: 'Nueva etiquetadora agregada al maestro.' };
  }
}

function parseHoraNotificacion(val) {
  if (val === null || val === undefined || val === '') return '';
  
  if (val instanceof Date) {
    const hh = String(val.getHours()).padStart(2, '0');
    const mm = String(val.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }
  
  const str = String(val).trim();
  if (!str) return '';
  
  const match24 = str.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (match24) {
    const h = String(parseInt(match24[1], 10)).padStart(2, '0');
    const m = match24[2];
    return `${h}:${m}`;
  }
  
  const match12 = str.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM|a\.?\s*m\.?|p\.?\s*m\.?)$/i);
  if (match12) {
    let h12 = parseInt(match12[1], 10);
    const m12 = match12[2];
    const ampm = match12[3].toLowerCase().replace(/\s/g, '');
    if (ampm.startsWith('p') && h12 < 12) h12 += 12;
    if (ampm.startsWith('a') && h12 === 12) h12 = 0;
    return `${String(h12).padStart(2, '0')}:${m12}`;
  }
  
  const d = new Date(val);
  if (!isNaN(d.getTime())) {
    const hh2 = String(d.getHours()).padStart(2, '0');
    const mm2 = String(d.getMinutes()).padStart(2, '0');
    return `${hh2}:${mm2}`;
  }
  
  return '';
}

function getNotificaciones() {
  let sheet = getSheet(SHEETS.NOTIFICACIONES);
  if (!sheet) {
    try {
      const ss = getSpreadsheet();
      sheet = ss.insertSheet(SHEETS.NOTIFICACIONES);
      sheet.appendRow(['Registro', 'Clave', 'Destinatarios', 'Pausado', 'Hora']);
    } catch (e) {
      Logger.log('Error al crear hoja de notificaciones: ' + e.toString());
      return [];
    }
  }
  
  let data = sheet.getDataRange().getValues();
  let displayData = sheet.getDataRange().getDisplayValues();
  const existingClaves = data.slice(1).map(r => String(r[1]));
  
  const defaults = [
    ['Temperatura Ambiental', 'termo', 'grivera@hospitaldetalca.cl', 'FALSE', '23:00'],
    ['Mantenimiento Centrífugas', 'centrifugas', 'grivera@hospitaldetalca.cl', 'FALSE', '23:00'],
    ['Limpieza Mesones', 'mesones', 'grivera@hospitaldetalca.cl', 'FALSE', '23:00'],
    ['Temperatura Refrigeradores', 'refriTemp', 'grivera@hospitaldetalca.cl', 'FALSE', '20:00'],
    ['Limpieza Refrigeradores', 'limpRefri', 'grivera@hospitaldetalca.cl', 'FALSE', '09:00'],
    ['Conductividad del Agua', 'conductividad', 'grivera@hospitaldetalca.cl', 'FALSE', '20:00'],
    ['Mantención Cobas', 'cobas', 'grivera@hospitaldetalca.cl', 'FALSE', '09:00'],
    ['Reparaciones DxH 900 Urgencias', 'dxh900', 'grivera@hospitaldetalca.cl', 'FALSE', '08:00'],
    ['Registro de eliminación de muestras', 'elimMuestras', 'grivera@hospitaldetalca.cl', 'FALSE', '08:00']
  ];
  
  let changed = false;
  defaults.forEach(def => {
    if (existingClaves.indexOf(def[1]) === -1) {
      sheet.appendRow([def[0], def[1], def[2], def[3], "'" + def[4]]);
      changed = true;
    }
  });
  
  if (changed) {
    data = sheet.getDataRange().getValues();
    displayData = sheet.getDataRange().getDisplayValues();
  }

  return data.slice(1).map((r, idx) => {
    const rawVal = r[4];
    const dispVal = displayData && displayData[idx + 1] ? displayData[idx + 1][4] : '';
    let horaStr = parseHoraNotificacion(dispVal) || parseHoraNotificacion(rawVal);
    
    if (!horaStr || !/^\d{2}:\d{2}$/.test(horaStr)) {
      const defItem = defaults.find(d => d[1] === String(r[1]));
      horaStr = defItem ? defItem[4] : '08:00';
    }

    const cleanDestinatarios = String(r[2] || '')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean)
      .join(', ');

    return {
      registro: String(r[0]),
      clave: String(r[1]),
      destinatarios: cleanDestinatarios,
      pausado: String(r[3]).toUpperCase() === 'TRUE',
      hora: horaStr
    };
  });
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
  
  // Formatear columna 5 como texto plano
  sheet.getRange(1, 5, Math.max(data.notificaciones.length + 1, 100), 1).setNumberFormat('@');
  
  // Guardar nuevos datos
  data.notificaciones.forEach(n => {
    let horaVal = n.hora ? String(n.hora).trim() : '08:00';
    if (!/^\d{2}:\d{2}$/.test(horaVal)) {
      horaVal = parseHoraNotificacion(horaVal) || '08:00';
    }
    sheet.appendRow([
      n.registro,
      n.clave,
      n.destinatarios || '',
      n.pausado ? 'TRUE' : 'FALSE',
      "'" + horaVal
    ]);
  });

  try {
    setupTriggers();
  } catch (e) {
    Logger.log('Error reconfigurando triggers tras guardar notificaciones: ' + e.toString());
  }
  
  return { success: true, message: 'Configuración de notificaciones guardada con éxito.' };
}

function sendTestNotificacion(data) {
  if (data.password !== PASSWORD_REVISION) {
    return { success: false, error: 'Contraseña incorrecta.' };
  }
  
  let to = data.destinatarios ? String(data.destinatarios).trim() : '';
  if (!to && data.clave) {
    to = getEmailRecipients(data.clave) || '';
  }
  
  if (!to) {
    return { success: false, error: 'No hay destinatarios configurados para enviar el correo de prueba o las alertas están pausadas.' };
  }
  
  const nombreRegistro = data.registro || data.clave || 'General';
  const subject = '🧪 [Registros Lab] Correo de Prueba — ' + nombreRegistro;
  const body = 'Estimado/a,\n\n' +
    'Esta es una notificación de PRUEBA generada desde el panel de Administración del sistema de Registros Mensuales.\n\n' +
    '📍 Tipo de Registro: ' + nombreRegistro + '\n' +
    '🔑 Clave interna: ' + (data.clave || 'n/a') + '\n' +
    '📅 Fecha y Hora de Envío: ' + new Date().toLocaleString('es-CL') + '\n\n' +
    'Si ha recibido este correo, la configuración de destinatarios para este registro funciona correctamente.\n\n' +
    'Enlace al aplicativo:\n' + APP_URL + '\n\n' +
    'Enlace a los registros:\n' + SHEET_URL + '\n\n' +
    '---\n' +
    'Mensaje generado de forma automática para verificación del sistema.\n' +
    'Registros Mensuales — Laboratorio Clínico — Hospital de Talca\n';
    
  try {
    MailApp.sendEmail({ to: to, subject: subject, body: body });
    return { success: true, message: 'Correo de prueba enviado con éxito a: ' + to };
  } catch (e) {
    Logger.log('Error enviando correo de prueba: ' + e.toString());
    return { success: false, error: 'Error al enviar correo de prueba: ' + e.toString() };
  }
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

// ── Registro de reparaciones DxH 900 Urgencias ────────────────

function getDxH900Historial() {
  const cacheKey = 'dxh900_hist';
  let cached = getCachedJson(cacheKey);
  if (cached) {
    return cached;
  }
  const sheet = getSheet(SHEETS.DXH900_REG);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  const result = data.slice(1)
    .filter(r => r[0] !== '' && r[5] !== '') // Ignore empty/deleted rows
    .map(r => {
    let fechaStr = getFechaFromRow(r);
    return {
      fecha: fechaStr,
      usuario_responsable: String(r[4]),
      descripcion: String(r[5]),
      especialista: String(r[6])
    };
  });
  setCachedJson(cacheKey, result, 3600); // 1 hour cache
  return result;
}

// Guarda registro en la hoja Reg. Reparaciones DxH 900 Urgencias
function saveDxH900Registro(data) {
  if (!data.usuario_responsable || !data.descripcion || !data.especialista) {
    return { success: false, error: 'Faltan campos obligatorios.' };
  }
  const errFuture = validarFechaNoFutura(data.fecha);
  if (errFuture) return { success: false, error: errFuture };
  const f = parseFecha(data.fecha || new Date().toISOString().split('T')[0]);
  const ts = getFechaRegistroFormatted();
  
  insertRowAtTop(getSheet(SHEETS.DXH900_REG), [
    formatFechaDDMMYYYY(f), f.dia, f.mes, f.anio,
    resolveNombreResponsable(data.usuario_responsable),
    data.descripcion,
    data.especialista,
    ts
  ]);
  
  try {
    sendAlertaDxH900(data);
  } catch (e) {
    Logger.log('Error enviando correo DxH 900: ' + e.toString());
  }

  clearCacheKeys(['dxh900_hist']);
  return { success: true, message: 'Registro de reparación guardado.' };
}

// Alerta de correo electrónico
function sendAlertaDxH900(info) {
  const subject = '🛠️ [Registros Lab] Nuevo Registro de Reparación DxH 900 Urgencias';
  
  const f = parseFecha(info.fecha || new Date().toISOString().split('T')[0]);
  const fechaFormateada = `${String(f.dia).padStart(2, '0')}/${String(f.mes).padStart(2, '0')}/${f.anio}`;
  
  const body = 'Estimado/a,\n\n' +
    'Se ha ingresado una nueva intervención reparativa para el equipo DxH 900 Urgencias.\n\n' +
    '📅 Fecha: ' + fechaFormateada + '\n' +
    '👤 Usuario Responsable: ' + info.usuario_responsable + '\n' +
    '🔧 Especialista: ' + info.especialista + '\n\n' +
    '📝 Descripción de la intervención:\n' + info.descripcion + '\n\n' +
    'Enlace al aplicativo:\n' + APP_URL + '\n\n' +
    'Enlace a los registros:\n' + SHEET_URL + '\n\n' +
    '---\n' +
    'Este mensaje fue enviado automáticamente.\n' +
    'Registros Mensuales — Laboratorio Clínico — Hospital de Talca\n';

  const to = getEmailRecipients('dxh900');
  if (to) {
    MailApp.sendEmail({ to: to, subject: subject, body: body });
  }
}

// ── Registro de eliminación de muestras ───────────────────────

function saveElimMuestras(data) {
  if (!data.responsable || !data.fecha || !data.muestras_eliminadas) {
    return { success: false, error: 'Faltan campos obligatorios.' };
  }
  const resp = resolveNombreResponsable(data.responsable);
  const errFuture = validarFechaNoFutura(data.fecha);
  if (errFuture) return { success: false, error: errFuture };
  const f = parseFecha(data.fecha);
  const ts = getFechaRegistroFormatted();

  const sheet = getSheet(SHEETS.ELIM_MUESTRAS);
  insertRowAtTop(sheet, [
    formatFechaDDMMYYYY(f),
    f.dia, f.mes, f.anio,
    resp,
    data.muestras_eliminadas,
    ts,
    '',  // Revisado Por
    ''   // Fecha Revisión
  ]);

  try {
    sheet.hideColumns(7); // Ocultar columna Fecha de registro
  } catch (e) {}

  clearSheetCache('elimMuestras', f.mes, f.anio);
  return { success: true, message: 'Registro de eliminación de muestras guardado con éxito.' };
}

// ── Configuración de Módulos Activos ──────────────────────────────
const DEFAULT_MODULOS_ACTIVOS = {
  'termo': true,
  'centrifugas': true,
  'mesones': true,
  'refri-temp': true,
  'limp-refri': true,
  'conductividad': true,
  'etiquetadoras': true,
  'cobas': true,
  'dxh900': true,
  'elim-muestras': true
};

function getModulosActivos() {
  try {
    const raw = PropertiesService.getScriptProperties().getProperty('MODULOS_ACTIVOS');
    if (!raw) return DEFAULT_MODULOS_ACTIVOS;
    const parsed = JSON.parse(raw);
    return Object.assign({}, DEFAULT_MODULOS_ACTIVOS, parsed);
  } catch (e) {
    Logger.log('Error al obtener módulos activos: ' + e.toString());
    return DEFAULT_MODULOS_ACTIVOS;
  }
}

function saveModulosActivos(data) {
  if (data.password !== PASSWORD_REVISION) {
    return { success: false, error: 'Contraseña incorrecta.' };
  }
  if (!data.modulos || typeof data.modulos !== 'object') {
    return { success: false, error: 'Datos de módulos inválidos.' };
  }
  try {
    const jsonStr = JSON.stringify(data.modulos);
    PropertiesService.getScriptProperties().setProperty('MODULOS_ACTIVOS', jsonStr);
    try { CacheService.getScriptCache().remove('maestros_all'); } catch(e) {}
    return { success: true, message: 'Configuración de módulos guardada con éxito.', modulos: data.modulos };
  } catch (e) {
    return { success: false, error: 'Error al guardar módulos: ' + e.toString() };
  }
}

function applyNotificationConfig(targetHourStr, recipientsStr) {
  const targetHour = targetHourStr ? String(targetHourStr).trim() : '10:00';
  const recipients = recipientsStr ? String(recipientsStr).trim() : 'grivera@hospitaldetalca.cl';
  
  const notifs = getNotificaciones();
  const targetKeys = ['termo', 'centrifugas', 'mesones'];
  const updated = notifs.map(n => {
    if (targetKeys.indexOf(n.clave) !== -1) {
      return {
        registro: n.registro,
        clave: n.clave,
        destinatarios: recipients,
        pausado: false,
        hora: targetHour
      };
    }
    return n;
  });
  
  const sheet = getSheet(SHEETS.NOTIFICACIONES);
  if (sheet) {
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) sheet.deleteRows(2, lastRow - 1);
    sheet.getRange(1, 5, Math.max(updated.length + 1, 100), 1).setNumberFormat('@');
    updated.forEach(n => {
      sheet.appendRow([
        n.registro,
        n.clave,
        n.destinatarios,
        n.pausado ? 'TRUE' : 'FALSE',
        "'" + n.hora
      ]);
    });
  }
  
  const triggerMsg = setupTriggers();
  return { 
    success: true, 
    message: 'Configuración actualizada para ' + targetHour + ' y destinatarios: ' + recipients,
    triggers: triggerMsg
  };
}

function getProjectTriggersInfo() {
  const triggers = ScriptApp.getProjectTriggers();
  return triggers.map(t => ({
    handlerFunction: t.getHandlerFunction(),
    triggerSource: t.getTriggerSource().toString(),
    eventType: t.getEventType().toString(),
    uniqueId: t.getUniqueId()
  }));
}

function logTriggerExecution(fnName, eventObj, resultOrErr) {
  try {
    const timestamp = new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' });
    const logEntry = {
      timestamp: timestamp,
      fn: fnName,
      event: eventObj ? JSON.stringify(eventObj) : 'null',
      result: resultOrErr ? JSON.stringify(resultOrErr) : 'none'
    };
    const key = 'LAST_TRIGGER_LOGS';
    const raw = PropertiesService.getScriptProperties().getProperty(key);
    let logs = [];
    if (raw) {
      try { logs = JSON.parse(raw); } catch(e) {}
    }
    logs.unshift(logEntry);
    if (logs.length > 20) logs = logs.slice(0, 20);
    PropertiesService.getScriptProperties().setProperty(key, JSON.stringify(logs));
  } catch(e) {}
}

function getTriggerLogs() {
  const key = 'LAST_TRIGGER_LOGS';
  const raw = PropertiesService.getScriptProperties().getProperty(key);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch(e) { return [{ error: raw }]; }
}

function scheduleAutoTriggerInMinutes(minutes) {
  const m = parseInt(minutes, 10) || 2;
  const trigger = ScriptApp.newTrigger('triggerDatosNoRellenados')
    .timeBased()
    .after(m * 60 * 1000)
    .inTimezone('America/Santiago')
    .create();
  return { 
    success: true, 
    message: 'Activador automático programado para dispararse en ' + m + ' minuto(s) de forma 100% automática por Google.',
    triggerId: trigger.getUniqueId()
  };
}


