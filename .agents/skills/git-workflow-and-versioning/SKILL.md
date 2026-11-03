---
name: git-workflow-and-versioning
description: Estructura las prácticas del flujo de trabajo con Git. Usar al realizar cualquier cambio de código, commits atómicos, ramas de trabajo, resolución de conflictos, apertura y revisión de PRs, o al cortar versiones y registrar changelogs.
---

# Flujo de Trabajo y Versionado con Git

## Descripción General

Git es tu red de seguridad. Trata los commits como puntos de guardado, las ramas como entornos de pruebas aislados y el historial como documentación viva del proyecto. Con agentes de IA generando código a gran velocidad, el control de versiones disciplinado es el mecanismo que mantiene los cambios manejables, auditables y reversibles.

## Cuándo Utilizarlo

Siempre. Todo cambio de código o configuración debe fluir a través de Git bajo estándares rigurosos.

## Principios Fundamentales

### Trunk-Based Development (Recomendado)

Mantén la rama `main` siempre desplegable en producción. Trabaja en ramas cortas (feature branches) que se integren de nuevo en 1 a 3 días. Las ramas de larga duración representan un costo oculto: divergen rápidamente, generan conflictos de merge complejos y retrasan la integración continua.

```
main ──●──●──●──●──●──●──●──●──●──  (siempre desplegable a producción)
        ╲      ╱  ╲    ╱
         ●──●─╱    ●──╱    ← ramas de corta duración (1-3 días)
```

- **Las ramas largas son un pasivo:** Cuanto más tiempo vive una rama sin integrarse, mayor es el riesgo de colisión.
- **Feature Flags > Ramas eternas:** Es preferible desplegar código incompleto protegido detrás de una bandera (feature flag) que mantener ramas aisladas durante semanas.

### 1. Commits Frecuentes y Tempranos (Commit Early, Commit Often)

Cada rebanada vertical que complete un paso funcional y pase sus pruebas merece su propio commit. No acumules horas de trabajo sin commitear.

```
Patrón de trabajo:
  Implementar rebanada → Probar → Verificar → Commit → Siguiente rebanada

No hagas esto:
  Implementar todo junto → Cruzar los dedos → Commit gigante de 50 archivos
```

Los commits son puntos de restauración. Si el siguiente paso falla o introduce una regresión, puedes volver al último estado funcional en un segundo.

### 2. Commits Atómicos

Cada commit debe abordar una única responsabilidad lógica:

```
# Correcto: Cada commit es autocontenido y claro
git log --oneline
a1b2c3d feat(proyectos): agregar validacion de stock real al liquidar obra
d4e5f6g feat(ui): componente modal de firma de conformidad
h7i8j9k test(proyectos): tests unitarios para calculo de totales congelados

# Incorrecto: Múltiples cambios mezclados sin relación
git log --oneline
x1y2z3a cambios varios, fix sidebar, actualizar deps, ajuste en boveda
```

### 3. Mensajes Descriptivos (Conventional Commits)

El mensaje de commit debe explicar el *por qué* y no solo el *qué*:

```
# Correcto:
feat(auth): implementar inicio de sesion biometrico con webauthn

Permite a los tecnicos acceder desde el navegador movil mediante huella
o FaceID sin requerir contraseña en obra. Utiliza SimpleWebAuthn y almacena
las credenciales asociadas al usuario con RBAC validado.
```

**Estructura estándar:**
```
<tipo>(<alcance opcional>): <descripción corta en imperativo>

<cuerpo opcional explicando la motivación y decisiones técnicas>
```

**Tipos comunes:**
- `feat`: Nueva característica o funcionalidad.
- `fix`: Corrección de un defecto o bug.
- `refactor`: Refactorización interna sin alterar el comportamiento observable.
- `test`: Agregado o actualización de pruebas.
- `docs`: Cambios exclusivos en documentación o ADRs.
- `chore`: Mantenimiento de herramientas, dependencias o configuración.

### 4. Separación de Responsabilidades

No combines cambios de formato o linter con cambios de comportamiento de negocio. No mezcles grandes refactorizaciones con nuevas funcionalidades. Sepáralos en commits distintos para facilitar la revisión y posibles rollbacks.

### 5. Tamaño de los Cambios

Apunta a cambios digeribles (~100 a 300 líneas por commit/PR). Cambios que superan las 1000 líneas aumentan exponencialmente la probabilidad de que se filtren errores inadvertidos durante la revisión.

## Estrategia de Ramas

```
main (producción / siempre verde)
  │
  ├── feat/liquidacion-obra-stock
  ├── fix/cifrado-boveda-padding
  └── chore/actualizar-dependencias
```

- Crea la rama a partir del commit más reciente de `main`.
- Al terminar, realiza rebase o squash según las políticas del equipo y elimina la rama remota tras el merge.\n