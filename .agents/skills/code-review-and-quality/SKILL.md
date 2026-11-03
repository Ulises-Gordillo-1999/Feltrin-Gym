---
name: code-review-and-quality
description: Realiza revisiones multifactoriales de código antes de integrar cualquier cambio. Audita corrección lógica, seguridad, mantenibilidad, estándares del proyecto y adherencia al Definition of Done.
---

# Revisión de Código y Calidad (Code Review & Quality)

## Visión General

La revisión de código es el principal filtro de calidad antes de que un cambio ingrese a la rama principal (`main`). No se limita a revisar estilo de formato: evalúa arquitectura, posibles fugas de memoria, seguridad, rendimiento en base de datos y mantenibilidad a largo plazo.

## Los 5 Ejes de Revisión

1. **Corrección Lógica**: ¿Cumple la solución con la especificación y los criterios de aceptación? ¿Maneja casos extremos (valores nulos, listas vacías, desconexiones)?
2. **Seguridad & Variables de Entorno**: ¿Existen secretos hardcodeados? ¿Se respetan los roles RBAC? ¿Se previenen inyecciones SQL y ataques XSS?
3. **Rendimiento**: ¿Hay consultas N+1 en Drizzle ORM? ¿Se cargan librerías pesadas en el cliente en lugar del servidor?
4. **Simplicidad**: ¿Se utilizó la solución más directa posible? ¿Se crearon abstracciones prematuras?
5. **Disciplina de Alcance**: ¿El diff contiene únicamente los cambios solicitados o incluye modificaciones accidentales en otros módulos?\n