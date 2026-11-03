---
name: browser-testing-with-devtools
description: Pruebas y diagnósticos en navegadores reales mediante el servidor Chrome DevTools MCP. Permite inspeccionar el DOM, capturar errores en consola, analizar peticiones de red, diagnosticar fallas visuales y perfilar el rendimiento con datos reales de ejecución.
---

# Pruebas en el Navegador con DevTools (Browser Testing with DevTools)

## Visión General

Las pruebas estáticas y unitarias no pueden anticipar todas las fallas que ocurren en el entorno real del navegador: desbordamientos visuales por CSS, errores de renderizado en React Portals, problemas de hidratación en SSR, bloqueos de red o fallas en el registro de Service Workers y sensores biométricos WebAuthn.

Esta habilidad conecta herramientas de automatización de navegador para inspeccionar directamente el DOM, capturar errores de JavaScript en consola y verificar que la experiencia del usuario coincida al 100% con la expectativa técnica.

## Capacidades de Diagnóstico

1. **Inspección de Consola**: Detección inmediata de advertencias de hidratación de React, errores de CORS o fallas de recursos 404/500.
2. **Inspección del DOM y Layout**: Medición precisa de anchos de elementos, detección de desbordamientos (`scrollWidth > clientWidth`) y verificación de modales montados en `document.body`.
3. **Monitoreo de Red**: Verificación de respuestas HTTP en Server Actions, cabeceras de caché y tamaño de payloads JSON.
4. **Capturas de Pantalla & Diagnóstico Visual**: Verificación visual de componentes en modo Claro y Oscuro.\n