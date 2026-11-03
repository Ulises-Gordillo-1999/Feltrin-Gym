---
name: deprecation-and-migration
description: Gestiona la depreciación ordenada y la migración segura de código, esquemas de bases de datos y APIs. Usar al retirar sistemas obsoletos, migrar usuarios o cambiar columnas de base de datos sin tiempo de inactividad (patrón expand/contract).
---

# Depreciación y Migración

## Descripción General

El código es una responsabilidad y un costo de mantenimiento, no un activo acumulativo. Cada línea de código en un repositorio requiere soporte continuo: dependencias que actualizar, parches de seguridad, pruebas que mantener y carga cognitiva para nuevos ingenieros. La depreciación es la disciplina técnica de retirar ordenadamente el código que ya no aporta valor, y la migración es el proceso metódico de trasladar usuarios y datos desde lo antiguo hacia lo nuevo sin disrupciones.

## Cuándo Utilizarla

- Al reemplazar una biblioteca, servicio o arquitectura legada por una solución moderna.
- Al retirar funcionalidades o endpoints que han quedado en desuso.
- Al modificar esquemas de bases de datos en producción sin causar caídas (zero-downtime).
- Al unificar implementaciones duplicadas que surgieron con el tiempo.
- Al diseñar una nueva funcionalidad (la estrategia de depreciación futura se planifica desde el diseño inicial).

## Principios Fundamentales

### 1. La Ley de Hyrum en Sistemas en Producción

Con suficientes usuarios o integraciones, cualquier comportamiento observable de un sistema terminará siendo aprovechado por alguien (incluso bugs y particularidades no documentadas). Por ello, depreciar requiere guías de migración activas y herramientas de compatibilidad, no únicamente avisos informativos.

### 2. Patrón Expansión y Contracción (Expand / Contract) para Bases de Datos

Cuando se modifica una columna o tabla crítica en producción (ej. renombrar o transformar datos), nunca se aplica un cambio destructivo directo. Se procede en fases:

```
Fase 1 (Expand): Agregar la nueva columna manteniendo la antigua.
                 El código escribe en ambas columnas pero lee de la antigua.

Fase 2 (Backfill): Migrar los datos históricos de la columna antigua a la nueva.

Fase 3 (Switch): Actualizar el código para que lea y escriba en la nueva columna.

Fase 4 (Contract): Una vez verificado el funcionamiento sin incidentes,
                  retirar la columna antigua de forma segura.
```

### 3. Fases de una Migración de Servicios

1. **Construir el reemplazo:** La nueva solución debe estar completamente probada, documentada y validada en producción antes de anunciar la retirada de la anterior.
2. **Publicar aviso y guía de migración:** Indicar claramente la versión deprecada, la alternativa recomendada, el motivo técnico del cambio y los pasos exactos para actualizar.
3. **Migración incremental:** Migrar consumidores módulo por módulo (o mediante el patrón Strangler / Estrangulador), verificando la ausencia de regresiones tras cada lote.
4. **Retiro definitivo:** Solo cuando la telemetría confirme cero tráfico o llamadas hacia el código deprecado, eliminar los archivos, tests asociados y referencias del repositorio.\n