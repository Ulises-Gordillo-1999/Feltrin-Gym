---
name: incremental-implementation
description: Entrega cambios y funcionalidades complejas de forma incremental en rebanadas verticales delgadas y comprobables. Úsalo al implementar cualquier característica que toque más de un archivo o cuando un requerimiento sea demasiado grande para abordarse en un solo paso.
---

# Implementación Incremental (Incremental Implementation)

## Visión General

La causa número uno de bugs catastróficos y sesiones de depuración frustrantes es intentar programar todo un sistema antes de probar nada. La implementación incremental divide el trabajo en **rebanadas verticales delgadas** donde cada capa (base de datos, backend y UI) se valida y funciona antes de pasar a la siguiente.

## El Protocolo de Rebanadas Delgadas

1. **Rebanada Base (Infraestructura & Contrato)**:
   - Crear o modificar el esquema SQL en `schema.ts`.
   - Ejecutar la migración o verificación de compilación.
2. **Rebanada Operativa (Acción de Backend)**:
   - Crear la Server Action con validación de permisos e inserción/actualización de datos.
   - Probar la Server Action aisladamente o con un script de verificación.
3. **Rebanada de Presentación (UI & Estado)**:
   - Crear el formulario o modal interactivo.
   - Conectar el estado de carga (`isPending` / `useTransition`) y el manejo de éxito/error con notificaciones visuales.
4. **Rebanada de Pulido & Verificación**:
   - Probar en responsive (móvil y escritorio).
   - Validar con `tsc --noEmit` y pruebas de runtime.\n