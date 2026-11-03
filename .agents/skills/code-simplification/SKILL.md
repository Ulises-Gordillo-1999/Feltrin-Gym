---
name: code-simplification
description: Refactoriza y simplifica el código para maximizar su claridad sin alterar su comportamiento funcional. Reduce la anidación excesiva, elimina duplicaciones, mejora nombres de identificadores y hace que el código sea evidente y fácil de mantener.
---

# Simplificación de Código (Code Simplification)

## Visión General

El código funciona, pero ¿es legible? Con el paso del tiempo, las bases de código acumulan complejidad accidental: condicionales anidados profundamente, nombres crípticos, variables temporales redundantes y capas de abstracción innecesarias.

La simplificación de código refactoriza la estructura interna preservando estrictamente el comportamiento observable exterior.

## Técnicas Clave de Simplificación

1. **Cláusulas de Guarda (Early Return)**:
   - Elimina la anidación `if-else` devolviendo de inmediato si no se cumplen las condiciones básicas.
2. **Eliminación de Código Muerto**:
   - Borrar variables no utilizadas, imports huérfanos y ramas condicionales inalcanzables.
3. **Claridad sobre Ingenio**:
   - Prefiere un bucle `for...of` legible sobre un encadenamiento críptico de `reduce`.
4. **Descomposición de Funciones Monolíticas**:
   - Si una función hace más de una cosa (ej: valida, parsea, formatea y guarda), extrae sub-funciones puras y comprobables.\n