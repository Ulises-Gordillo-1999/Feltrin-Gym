---
name: context-engineering
description: Optimiza la selección y carga del contexto de trabajo para agentes de IA y desarrolladores. Garantiza que solo la información crítica y de alto valor ingrese a la ventana de contexto, eliminando ruido, previniendo alucinaciones y acelerando el tiempo de respuesta.
---

# Ingeniería de Contexto (Context Engineering)

## Visión General

Los modelos de lenguaje poseen ventanas de contexto finitas, y la sobrecarga de tokens irrelevantes degrada directamente la precisión del razonamiento lógico (el fenómeno de "perderse en el medio").

La ingeniería de contexto es el arte de curar el conjunto mínimo suficiente de archivos, esquemas, reglas y fragmentos de código requeridos para resolver una tarea sin desperdiciar tokens ni saturar la memoria.

## Protocolo de Curación de Contexto

1. **Identificar el Foco Central**:
   - Si la tarea es en Bóveda, carga `schema.ts`, `encryption.ts` y el componente modal de bóveda. No cargues finanzas ni inventario.
2. **Consultar Archivos de Reglas Específicos**:
   - Carga el archivo de reglas del proyecto (`AGENTS.md` o `agent-skills-framework.md`) al inicio para alinear las convenciones de diseño y arquitectura.
3. **Poda Activa de Ruido**:
   - No leas archivos completos de miles de líneas si solo necesitas una función; utiliza rangos de líneas (`StartLine` / `EndLine`).
   - Evita volcar logs completos o volcados JSON gigantescos en el contexto; extrae resúmenes estructurados.\n