---
name: planning-and-task-breakdown
description: Descompone especificaciones y requisitos complejos en rebanadas de tareas pequeñas, secuenciadas, atómicas y verificables. Define el orden de ejecución óptimo, dependencias técnicas y criterios de completitud para cada paso antes de iniciar la programación.
---

# Planificación y Desglose de Tareas (Planning & Task Breakdown)

## Visión General

Una tarea demasiado grande es una receta para el fracaso: fomenta commits gigantescos difíciles de revisar, introduce bugs difíciles de aislar y bloquea el feedback temprano. Esta habilidad toma una especificación aprobada y la descompone en un plan de tareas ejecutables con un orden lógico estricto.

## Reglas del Desglose Efectivo

1. **Rebanadas Verticales Delgadas**:
   - Cada tarea debe conectar datos, lógica y presentación en una porción pequeña y comprobable (evitar la trampa de "hacer toda la base de datos durante una semana y luego todo el frontend").
2. **Secuencia de Dependencias Estricta**:
   - Paso 1: Migración / Esquema de datos.
   - Paso 2: Server Action / Mutación de backend con validación.
   - Paso 3: Componente UI / Integración interactiva.
   - Paso 4: Pruebas y verificación de runtime.
3. **Criterio de Verificación por Tarea**:
   - Cada tarea debe concluir con una acción de comprobación concreta (ej: "Ejecutar `tsc --noEmit` y verificar respuesta exitosa en endpoint").
4. **Tamaño Máximo**:
   - Ninguna tarea individual debe requerir modificar más de 3 a 4 archivos simultáneos. Si toca más, divídela.\n