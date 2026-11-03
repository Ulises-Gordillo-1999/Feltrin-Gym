---
name: documentation-and-adrs
description: Registra decisiones de arquitectura (ADRs) y documentación técnica de alto impacto. Usar al tomar decisiones arquitectónicas significativas, al diseñar interfaces públicas, o al documentar el contexto y las compensaciones para futuros ingenieros y agentes.
---

# Documentación y ADRs (Architecture Decision Records)

## Descripción General

Documenta las decisiones, no solo el código. La documentación de mayor valor captura el *por qué*: el contexto, las restricciones del negocio y los trade-offs (compensaciones) que llevaron a una solución específica. El código muestra *qué* se construyó; la documentación explica *por qué se construyó de esa manera* y *qué alternativas fueron descartadas*. Este contexto es fundamental para humanos y agentes que colaboren en el proyecto a futuro.

## Cuándo Utilizarla

- Al tomar una decisión de arquitectura significativa (ej. base de datos, estrategia de auth, esquema de cifrado).
- Al elegir entre dos o más alternativas viables con ventajas y desventajas contrapuestas.
- Al agregar o modificar una API pública o Server Actions críticos.
- Al implementar una funcionalidad que altera la experiencia del usuario o la lógica de negocio nuclear.
- Al identificar reglas o peculiaridades que se deben explicar repetidamente.

**Cuándo NO utilizarla:**
- No documentes código trivial o autoexplicativo.
- No añadas comentarios que solo repitan lo que la sintaxis ya dice.
- No escribas extensos documentos para prototipos descartables.

## Registros de Decisiones de Arquitectura (ADRs)

Los ADRs registran los fundamentos de decisiones técnicas estructurales. Son el artefacto documental con mayor retorno de inversión en el ciclo de vida del software.

### Cuándo redactar un ADR

- Selección de framework, ORM, base de datos o dependencias mayores.
- Diseño estructural del modelo de datos o migraciones críticas.
- Estrategia de autenticación y autorización (ej. JWT vs sesiones en DB, WebAuthn).
- Protocolos de seguridad y cifrado (ej. cifrado simétrico AES-256 en aplicación).
- Cualquier decisión que resulte costosa o riesgosa de revertir una vez en producción.

### Plantilla Estándar de ADR

Almacena los ADRs en `docs/decisions/` o `.agents/references/` con numeración secuencial:

```markdown
# ADR-00X: Título de la Decisión Técnica

## Estado
Propuesto | Aceptado | Reemplazado por ADR-YYY | Obsoleto

## Fecha
AAAA-MM-DD

## Contexto
¿Cuál es el problema que estamos resolviendo? ¿Cuáles son las restricciones de negocio,
requisitos de rendimiento, seguridad o plazos?

## Decisión
¿Cuál es la solución elegida? Describe la arquitectura adoptada de forma clara y concisa.

## Alternativas Consideradas
### Alternativa A
- Pros: ...
- Contras: ...
- Motivo de descarte: ...

### Alternativa B
- Pros: ...
- Contras: ...
- Motivo de descarte: ...

## Consecuencias y Compensaciones
- Beneficios obtenidos.
- Compromisos y deuda técnica asumida conscientemente.
- Impacto en seguridad, rendimiento o mantenimiento futuro.
```

### Ciclo de Vida de un ADR

```
PROPUESTO → ACEPTADO → (REEMPLAZADO o DEPRECADO)
```

- **Nunca elimines un ADR antiguo:** Capturan la historia viva y el contexto de por qué el sistema es como es.
- Cuando una decisión cambie o evolucione, redacta un nuevo ADR que enlace y reemplace explícitamente al anterior.

## Documentación Inline en Código

Comenta siempre el *por qué*, no el *qué*:

```typescript
// INCORRECTO: repite lo evidente
// Incrementar el contador
count += 1;

// CORRECTO: explica la razón técnica o de negocio no evidente
// La liquidación de stock se ejecuta exactamente una sola vez por obra.
// Se valida la bandera stock_descontado dentro de una transacción serializable
// para evitar condiciones de carrera si dos administradores cierran el proyecto a la vez.
if (proyecto.stock_descontado) {
  throw new Error('El stock de este proyecto ya ha sido liquidado previamente.');
}
```\n