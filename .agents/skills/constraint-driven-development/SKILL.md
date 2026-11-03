---
name: constraint-driven-development
description: Establece y blinda la barra de calidad del proyecto como un contrato formal y evita que los agentes la degraden silenciosamente. Define umbrales de accesibilidad, cobertura, rendimiento web, límites de complejidad y monitorea el diff contra suppressions (@ts-ignore, eslint-disable) o tests salteados.
---

# Desarrollo Guiado por Restricciones (Constraint-Driven Development)

## Visión General

En proyectos con múltiples desarrolladores o agentes de IA, la barra de calidad suele erosionarse silenciosamente: se agregan comentarios `// @ts-ignore` para salir del paso, se saltean pruebas unitarias para que el build pase a verde, o se introducen componentes pesados que disparan el tiempo de carga.

`constraint-driven-development` establece un archivo **`CONSTRAINTS.md`** inviolable en la raíz del repositorio y vigila activamente cada diff para evitar que se debilite la calidad del software.

## Dimensiones de Calidad Clave

1. **Tipado Estricto (TypeScript Strict)**:
   - Prohibido el uso de `any` o aserciones de tipo forzadas (`as unknown as T`).
   - Cero tolerancia a directivas `@ts-ignore` o `@ts-expect-error` no justificadas formalmente en un ADR.

2. **Rendimiento Web & Bundle Size**:
   - Compresión obligatoria de imágenes a WebP mediante `sharp`.
   - Carga diferida (`dynamic imports`) para librerías pesadas de visualización o PDFs (`jspdf`).
   - Límites de tiempo de respuesta en Server Actions (< 200ms para queries habituales).

3. **Accesibilidad (a11y) & WCAG 2.1 AA**:
   - Contraste de texto mínimo 4.5:1 en temas Claro y Oscuro.
   - Objetivos táctiles mínimos de 44x44px en pantallas móviles.
   - Navegación por teclado completa en diálogos y modales con trampa de foco.

4. **Higiene de Dependencias**:
   - Justificar cada nuevo paquete npm en `package.json`.
   - Preferir módulos nativos de Node.js (`crypto`, `fs`) sobre paquetes de terceros cuando sea viable.\n