# Proyecto RM — Guía de Despliegue

Este documento describe el procedimiento obligatorio para publicar y desplegar actualizaciones del sistema de **Registros Unidad de Laboratorio (Laboratorio Clínico — Hospital de Talca)**.

---

## 🚀 Proceso de Despliegue Obligatorio

Al realizar cambios en el proyecto, se deben ejecutar siempre los 3 pasos siguientes en orden:

### 1. Subir archivos a Google Apps Script
En la carpeta `apps-script/`:
```bash
clasp push -f
```

### 2. Actualizar la Versión del Despliegue Web (Web App)
> ⚠️ **CRÍTICO**: `clasp push` actualiza el código en el editor (`@HEAD`), pero la aplicación web en producción sigue ejecutando la versión fijada anteriormente. **Si no se ejecuta este paso, los usuarios no verán las actualizaciones**.

Ejecutar desde `apps-script/`:
```bash
clasp deploy -i AKfycbxuqcui0-hjJ721uMWZk3w-4l2fVCaBWQgdMJqVMb5Pno339Jqetq4r62p3-1gGBUvFOg -d "Descripción de la actualización"
```

* **ID del Despliegue Web (API_URL)**: `AKfycbxuqcui0-hjJ721uMWZk3w-4l2fVCaBWQgdMJqVMb5Pno339Jqetq4r62p3-1gGBUvFOg`

### 3. Guardar cambios en el repositorio Git
Desde la raíz del proyecto:
```bash
git add .
git commit -m "descripción de los cambios"
git push origin main
```

---

## 📝 Resumen del Flujo de Trabajo
1. Editar código (`apps-script/` y `docs/`).
2. `clasp push -f`
3. `clasp deploy -i AKfycbxuqcui0-hjJ721uMWZk3w-4l2fVCaBWQgdMJqVMb5Pno339Jqetq4r62p3-1gGBUvFOg -d "..."`
4. `git add .` && `git commit` && `git push`
