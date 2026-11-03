---
name: test-driven-development
description: Impulsa el desarrollo mediante el ciclo Red-Green-Refactor. Define casos de prueba antes de programar la solución, garantizando que el código sea testeable, modular y cumpla estrictamente los criterios de aceptación sin regresiones.
---

# Desarrollo Guiado por Pruebas (Test-Driven Development)

## Visión General

El ciclo Red-Green-Refactor no es solo una técnica de control de calidad; es una disciplina de diseño. Escribir una prueba antes de la implementación obliga a pensar en la interfaz de consumo, desacoplar dependencias y establecer con exactitud cuándo un requerimiento está completado.

## El Ciclo de Tres Pasos

1. **Rojo (Red)**:
   - Escribe una prueba pequeña y enfocada para el comportamiento deseado.
   - Ejecuta la prueba y verifica que falle por la razón correcta (el código aún no existe).
2. **Verde (Green)**:
   - Escribe la mínima cantidad de código necesaria para que la prueba pase.
   - No agregues funcionalidades extra en este paso.
3. **Refactorizar (Refactor)**:
   - Limpia el código, elimina duplicaciones, mejora nombres de variables y aplica principios de simplicidad.
   - Asegúrate de que todas las pruebas sigan pasando en verde.\n