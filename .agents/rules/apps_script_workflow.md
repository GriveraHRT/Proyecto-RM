# Reglas de Desarrollo y Despliegue: Proyecto RM (Google Apps Script + GitHub Pages)

## 0. Pipeline Obligatorio de Cierre y Despliegue
- Toda modificación de código (frontend o backend) DEBE finalizar ejecutando las 3 etapas de despliegue antes de dar por completada la tarea:
  1. **Google Apps Script Push**: `cmd /c "clasp push -f"` (desde la carpeta `apps-script/`).
  2. **Google Apps Script Deploy**: `cmd /c "clasp deploy -i AKfycbxuqcui0-hjJ721uMWZk3w-4l2fVCaBWQgdMJqVMb5Pno339Jqetq4r62p3-1gGBUvFOg -d \"<descripcion>\""` (actualizar el ID de producción activo).
  3. **Cache-Busting & Git**: Incrementar la versión `?v=X.X.X` en `docs/index.html` para los scripts editados, y realizar `git add .`, `git commit -m "..."`, `git push origin main`.

## 1. Activación de Triggers en Google Apps Script
- Al crear o modificar activadores programados por tiempo (`ScriptApp.newTrigger(...)`), ejecutar `clasp push` y `clasp deploy` NO activa automáticamente las nuevas tareas programadas en el servidor.
- **Obligatorio**: Invocación inmediata de la función de configuración de triggers (`setupTriggers()`) mediante un endpoint de API o ejecución directa tras cualquier despliegue backend para registrar activamente los activadores de reloj.

## 2. Fallbacks de Conexión a Base de Datos (Spreadsheet ID)
- Toda función que utilice `PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID')` para abrir la planilla de Google Sheets MUST incluir un fallback con la constante del `SPREADSHEET_ID` principal (`1HzHcRriBtPGQxTfFrZSntVeM8ujQHWnGFuyWrJo6KUQ`).
- Evitar confiar exclusivamente en `PropertiesService` para no interrumpir el acceso a la base de datos si las propiedades de script son reseteadas o no están inicializadas.

## 3. Sincronización Dual de Frontend (`apps-script/js/` ↔ `docs/js/`)
- Cualquier cambio realizado en la lógica o formularios frontend dentro de `apps-script/js/` (archivos `.html` empaquetados en Apps Script) debe sincronizarse inmediatamente a los archivos correspondientes en `docs/js/` (`.js` consumidos por GitHub Pages).
- Incrementar siempre el número de versión en `docs/index.html` (`?v=X.X.X`) para evitar que navegadores y proxies sirvan versiones cacheadas obsoletas.
- Toda referencia a elementos DOM de módulos opcionales o con visibilidad dinámica MUST incluir verificaciones nulas (ej. `if (document.getElementById(...))`) para evitar excepciones incontroladas (`TypeError`) que bloqueen la carga del Dashboard y simulen errores de red/offline.

## 4. Ejecución de Clasp en Windows y Despliegue de Producción
- En entornos Windows con PowerShell, los scripts `.ps1` de npm pueden ser bloqueados por directivas de seguridad. Ejecutar siempre los comandos de clasp mediante `cmd /c "clasp ..."` o `npx clasp ...`.
- Nunca usar `clasp deploy` sin argumentos, ya que genera IDs huérfanas. Actualizar siempre la ID fija de producción: `AKfycbxuqcui0-hjJ721uMWZk3w-4l2fVCaBWQgdMJqVMb5Pno339Jqetq4r62p3-1gGBUvFOg`.
