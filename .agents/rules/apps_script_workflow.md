# Reglas de Desarrollo y Despliegue: Proyecto RM (Google Apps Script + GitHub Pages)

## 1. Activación de Triggers en Google Apps Script
- Al crear o modificar activadores programados por tiempo (`ScriptApp.newTrigger(...)`), ejecutar `clasp push` y `clasp deploy` NO activa automáticamente las nuevas tareas programadas en el servidor.
- **Obligatorio**: Invocación inmediata de la función de configuración de triggers (`setupTriggers()`) mediante un endpoint de API o ejecución directa tras cualquier despliegue backend para registrar activamente los activadores de reloj.

## 2. Fallbacks de Conexión a Base de Datos (Spreadsheet ID)
- Toda función que utilice `PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID')` para abrir la planilla de Google Sheets MUST incluir un fallback con la constante del `SPREADSHEET_ID` principal (`1HzHcRriBtPGQxTfFrZSntVeM8ujQHWnGFuyWrJo6KUQ`).
- Evitar confiar exclusivamente en `PropertiesService` para no interrumpir el acceso a la base de datos si las propiedades de script son reseteadas o no están inicializadas.

## 3. Sincronización Dual de Frontend (`apps-script/js/` ↔ `docs/js/`)
- Cualquier cambio realizado en la lógica o formularios frontend dentro de `apps-script/js/` (archivos `.html` empaquetados en Apps Script) debe sincronizarse inmediatamente a los archivos correspondientes en `docs/js/` (`.js` consumidos por GitHub Pages).
- Toda referencia a elementos DOM de módulos opcionales o con visibilidad dinámica MUST incluir verificaciones nulas (ej. `if (document.getElementById(...))`) para evitar excepciones incontroladas (`TypeError`) que bloqueen la carga del Dashboard y simulen errores de red/offline.

## 4. Despliegue de Apps Script mediante Clasp (`clasp deploy -i`)
- Al publicar actualizaciones en Google Apps Script, ejecutar un `clasp deploy` simple sin argumentos crea una ID de despliegue nueva e independiente, dejando la URL pública del Web App apuntando a la versión anterior.
- **Obligatorio**: Consultar los despliegues activos con `clasp deployments` y actualizar la ID de producción existente de forma explícita mediante:
  `npx clasp deploy -i <deploymentId> -d "<descripción>"`

