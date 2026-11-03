---
name: frontend-ui-engineering
description: Construye interfaces de usuario de calidad de producción, altamente accesibles, responsivas y visualmente pulidas. Define la estética Enterprise Dark, microinteracciones, retroalimentación táctil, modales desacoplados vía React Portals y prevención de estilos genéricos de IA.
---

# Ingeniería de Interfaces de Usuario (Frontend UI Engineering)

## Visión General

Construye interfaces web que luzcan y se sientan como software empresarial de primer nivel, no como plantillas genéricas generadas por IA. Cada componente debe ser visualmente sofisticado, accesible mediante teclado y lectores de pantalla, y responsivo desde pantallas móviles de 360px hasta monitores de alta resolución.

## Estándares de Diseño y Ergonomía

1. **Estética Enterprise Dark (UPGRADE Style)**:
   - Fondos profundos: `#07090e` (zinc-950 con tinte azulado) con glassmorphism sutil (`backdrop-blur-xl`).
   - Acentos de telemetría: Cyan (`#06b6d4`), Esmeralda (`#10b981`) y Azul (`#2563eb`).
   - Ambientación Cyber-Grid: cuadrícula técnica sutil para resaltar información operativa y de infraestructura.

2. **Modales Desacoplados (React Portals Obligatorio)**:
   - Todo diálogo o modal debe renderizarse directamente en `document.body` mediante `createPortal(modal, document.body)`.
   - Esto evita recortes por `overflow: hidden` o fallas de renderizado por `backdrop-filter` de elementos padres.
   - Cierre con tecla Escape, bloqueo de scroll en el fondo y trampa de foco accesible.

3. **Retroalimentación de Estado**:
   - Todo botón de mutación debe reflejar su estado con spinner (`Loader2`) y deshabilitarse para evitar dobles envíos.
   - Alertas visuales con iconografía semántica de Lucide (`CheckCircle2`, `AlertCircle`, `ShieldAlert`).\n