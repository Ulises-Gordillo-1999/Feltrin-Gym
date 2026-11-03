---
name: performance-optimization
description: Optimiza el rendimiento integral de la aplicación en frontend, backend, consultas SQL y bases de datos. Aplica diagnósticos para Core Web Vitals (LCP, INP, CLS), resolución de consultas N+1 en Drizzle ORM, compresión de imágenes WebP y minimización de transferencias de red.
---

# Optimización de Rendimiento (Performance Optimization)

## Visión General

La optimización prematura es la raíz de muchos males, pero la lentitud no diagnosticada destruye la adopción del usuario. Este estándar establece que **toda optimización debe medirse antes y después** de aplicarse, atacando los cuellos de botella reales.

## Estrategias Principales

1. **Base de Datos & Consultas SQL**:
   - Evitar patrones N+1 utilizando queries relacionales (`with`) en Drizzle ORM.
   - Indexar claves foráneas frecuentes y columnas de filtrado (`estado`, `fecha_transaccion`).
   - Paginar resultados y evitar traer miles de registros al navegador.
2. **Frontend & Next.js Bundle**:
   - Usar Server Components por defecto; solo marcar `"use client"` cuando se requiera estado o eventos táctiles.
   - Importar librerías pesadas dinámicamente (`next/dynamic` para generadores de PDF o gráficos).
   - Comprimir imágenes a WebP mediante `sharp` antes de almacenarlas o servirlas.
3. **Core Web Vitals**:
   - Priorizar carga del LCP mediante `priority` en imágenes hero.
   - Evitar saltos de layout (CLS) asignando siempre `width` y `height` explícitos.\n