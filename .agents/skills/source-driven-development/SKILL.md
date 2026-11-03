---
name: source-driven-development
description: Fundamenta cada decisión técnica e implementación en la documentación oficial y fuentes primarias. Úsalo para validar sintaxis, convenciones de App Router, Drizzle ORM, React 19 y Tailwind v4, erradicando patrones obsoletos o alucinaciones de código.
---

# Desarrollo Basado en Fuentes Oficiales (Source-Driven Development)

## Visión General

Los frameworks modernos evolucionan a gran velocidad. Next.js 15+, React 19 y Tailwind CSS v4 introducen cambios fundamentales (APIs asíncronas para `cookies()` y `params`, directiva `@custom-variant`, hooks como `useActionState`).

Esta habilidad prohíbe adivinar sintaxis basándose en hábitos de versiones antiguas y exige consultar la documentación oficial vigente antes de escribir código.

## Reglas Obligatorias de Documentación

1. **Next.js 15+ App Router**:
   - En Server Components y Server Actions, `cookies()` y `headers()` son funciones asíncronas (`await cookies()`).
   - Los parámetros de ruta dinámica en páginas son promesas: `params: Promise<{ id: string }>`.
2. **React 19**:
   - No utilizar `useFormState` obsoleto; utilizar `useActionState` nativo de React 19.
   - Formularios desacoplados mediante React Portals (`createPortal(..., document.body)`).
3. **Tailwind CSS v4**:
   - Configuración basada en CSS (`@theme inline`, `@custom-variant dark (&:where(.dark, .dark *))`).
   - Cero dependencias de `tailwind.config.js` legacy.
4. **Drizzle ORM**:
   - Utilizar queries relacionales (`db.query.tabla.findFirst`) para lecturas limpias y el query builder clásico para escrituras atómicas.\n