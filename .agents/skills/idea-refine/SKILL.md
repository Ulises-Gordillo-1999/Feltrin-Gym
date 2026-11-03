---
name: idea-refine
description: Refina ideas brutas en conceptos nítidos y accionables mediante pensamiento divergente y convergente estructurado. Úsalo cuando una idea aún sea vaga, cuando necesites poner a prueba supuestos antes de comprometerte con un plan, o cuando quieras expandir opciones antes de converger en una solución definitiva.
---

# Refinamiento de Ideas (Idea Refine)

## Visión General

Las ideas iniciales casi nunca llegan listas para programarse. Suelen ser demasiado amplias ("agreguemos IA al sistema"), demasiado estrechas ("pongamos un botón aquí"), o están cargadas de supuestos técnicos invisibles.

`idea-refine` toma una chispa conceptual y la somete a dos movimientos cognitivos deliberados:
1. **Divergencia**: Expandir el espacio de posibilidades (variaciones, casos extremos, caminos alternativos).
2. **Convergencia**: Filtrar, descartar lo inviable y sintetizar la mejor versión factible.

## Cuándo Usar

- El usuario tiene una idea innovadora pero no sabe cómo aterrizarla técnicamente.
- Hay múltiples caminos para resolver un problema de negocio y conviene compararlos antes de comprometer código.
- Quieres explorar soluciones no obvias ("¿qué pasaría si no creamos una tabla nueva sino que usamos eventos?").
- Triggers típicos: "idea", "cómo podríamos encarar X", "dame opciones para resolver Y".

## Flujo de Trabajo

### Fase 1: Desempaque de la Idea Base
Identifica:
- **El Dolor**: ¿Qué fricción real existe hoy?
- **El Disparador**: ¿Por qué surge esta idea en este momento?
- **La Solución Aparente**: ¿Qué fue lo primero que se propuso?

### Fase 2: Divergencia Estructurada (3 a 5 Variantes)
Plantea enfoques contrastantes:
- **Opción A (La Mínima / Quirúrgica)**: La solución más simple que resuelve el 80% del dolor con mínimo código.
- **Opción B (La Robusta / Enterprise)**: Solución completa, altamente desacoplada y escalable.
- **Opción C (El Cambio de Paradigma)**: Resolver el problema eliminando la necesidad de la funcionalidad (automatización, diseño o simplificación de procesos).

Para cada opción, evalúa:
- Pros y Contras.
- Esfuerzo de implementación estimado.
- Riesgo de mantenimiento futuro.

### Fase 3: Convergencia y Recomendación
- Aplica el principio de parsimonia: descarta opciones cuya complejidad no pague su costo.
- Selecciona la variante ganadora fundamentando el porqué técnico y de negocio.
- Redacta el concepto sintetizado listo para pasar a `spec-driven-development`.\n