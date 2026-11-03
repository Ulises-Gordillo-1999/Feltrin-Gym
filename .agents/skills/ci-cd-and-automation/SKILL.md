---
name: ci-cd-and-automation
description: Automatiza la configuración y ejecución de pipelines de integración y entrega continua (CI/CD). Usar al configurar compuertas de calidad, pruebas automáticas, auditorías de seguridad, y estrategias de despliegue continuo hacia entornos de staging y producción.
---

# CI/CD y Automatización

## Descripción General

Automatiza las compuertas de calidad (Quality Gates) para garantizar que ningún cambio llegue a producción sin haber superado satisfactoriamente el linter, la verificación estricta de tipos, la suite de pruebas unitarias/integración y la compilación limpia del proyecto. CI/CD es el mecanismo ejecutor de todas las demás habilidades de ingeniería: detecta de forma implacable lo que los humanos o los agentes puedan pasar por alto.

**Shift Left (Mover a la izquierda):** Detecta las inconsistencias lo más temprano posible en la cadena de desarrollo. Un error detectado por el compilador o el linter toma segundos en subsanarse; el mismo fallo descubierto en producción ocasiona horas de soporte e impacto al cliente.

**Lotes pequeños y entregas frecuentes:** Entregas frecuentes con pocas modificaciones reducen drásticamente el riesgo operativo. Desplegar 3 cambios atómicos es exponencialmente más sencillo de auditar y revertir que desplegar 40 cambios acumulados durante semanas.

## Cuándo Utilizarla

- Al configurar o afinar el pipeline de CI/CD de un nuevo proyecto o plantilla.
- Al añadir o ajustar verificaciones automatizadas previas al despliegue.
- Al depurar fallos en los flujos de integración o en la construcción de imágenes Docker.
- Al automatizar compuertas de seguridad previas a la publicación.

## El Pipeline de Compuertas de Calidad (Quality Gate Pipeline)

Todo cambio de código debe superar estas etapas consecutivas antes de considerarse listo para producción:

```
Pull Request / Push
    │
    ▼
┌──────────────────────────┐
│   VERIFICACIÓN LINT      │  eslint / biome
│   ↓ superado             │
│   VERIFICACIÓN DE TIPOS  │  tsc --noEmit
│   ↓ superado             │
│   PRUEBAS UNITARIAS      │  vitest / jest
│   ↓ superado             │
│   BUILD DEL SISTEMA      │  npm run build
│   ↓ superado             │
│   PRUEBAS DE INTEGRACIÓN │  db & api tests
│   ↓ superado             │
│   AUDITORÍA SEGURIDAD    │  npm audit / scan
└──────────────────────────┘
    │
    ▼
Listo para Despliegue (Coolify / VPS / Registry)
```

**Ninguna compuerta puede ignorarse o puentearse:** Si falla el tipado de TypeScript, corrige los tipos; jamás agregues `@ts-ignore` para salir del paso. Si una prueba falla, repara el código; no desactives la aserción.

## Configuración de GitHub Actions para Next.js & Coolify

```yaml
# .github/workflows/ci.yml
name: CI Quality Gate

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout del repositorio
        uses: actions/checkout@v4

      - name: Configurar Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Instalar dependencias limpias
        run: npm ci

      - name: Verificación estricta de tipos
        run: npx tsc --noEmit

      - name: Compilación del proyecto
        run: npm run build
        env:
          NEXT_TELEMETRY_DISABLED: 1
```

## Principios para Despliegues Seguros con Docker y Coolify

1. **Compilación Multi-Stage:** Utiliza Dockerfiles de etapas múltiples (deps, builder, runner) para mantener la imagen final mínima y libre de herramientas de desarrollo.
2. **Usuario sin privilegios:** Ejecuta la aplicación Node.js bajo un usuario no-root (`nextjs` / `node`).
3. **Gestión de Secretos:** Respeta `env-security-protocol`. Jamás hornees variables de entorno secretas (como `DATABASE_URL` o `VAULT_ENCRYPTION_KEY`) dentro de la imagen de Docker ni en archivos del repositorio; inyéctalas en runtime desde el panel de control de Coolify.\n