---
name: shipping-and-launch
description: Prepara lanzamientos a producción seguros y verificables. Usar al preparar un despliegue crítico, verificar checklists previas al lanzamiento, configurar monitoreo post-deploy, o definir planes de contingencia y rollback inmediato.
---

# Lanzamiento y Despliegue a Producción (Shipping and Launch)

## Descripción General

Despliega a producción con total confianza y serenidad técnica. El objetivo de la ingeniería no es simplemente "empujar código", sino desplegar de forma segura, con observabilidad en tiempo real, un plan de reversión (rollback) probado de antemano y una comprensión nítida de los indicadores de éxito. Cada lanzamiento debe ser reversible, observable e incremental.

## Cuándo Utilizarla

- Al desplegar una funcionalidad mayor o módulo nuevo en el entorno de producción.
- Al aplicar migraciones de esquema en la base de datos de producción.
- Al migrar infraestructura, servicios en Docker o paneles de hosting (Coolify/Hetzner).
- Al realizar cualquier despliegue que represente riesgo operativo sobre datos reales.

## Lista de Verificación Previa al Lanzamiento (Pre-Launch Checklist)

### 1. Calidad del Código y Compilación
- [ ] La verificación estricta de tipos pasa limpiamente (`npx tsc --noEmit`).
- [ ] El build de producción se genera sin errores (`npm run build`).
- [ ] No existen `console.log` diagnósticos ni comentarios `TODO` críticos en código productivo.
- [ ] El manejo de errores y estados degradados está contemplado.

### 2. Seguridad y Protocolo de Entorno (`env-security-protocol`)
- [ ] Cero secretos, contraseñas de Postgres o claves AES-256 en el repositorio Git.
- [ ] Las variables de entorno de producción están correctamente cargadas en el panel del servidor.
- [ ] Las rutas de Server Actions y endpoints validan roles y permisos (RBAC).
- [ ] La entrada del usuario se valida exhaustivamente en el servidor.
- [ ] Cabeceras de seguridad activas (CSP, anti-clickjacking, HttpOnly en cookies de sesión).

### 3. Rendimiento y Experiencia de Usuario
- [ ] Los modales están desacoplados mediante React Portals para evitar clipping visual.
- [ ] El diseño responde fluidamente en dispositivos móviles, tablets y monitores de escritorio.
- [ ] Las imágenes y comprobantes están optimizados (ej. WebP con Sharp).
- [ ] No existen consultas N+1 en pantallas principales o dashboards.

### 4. Base de Datos e Integridad
- [ ] Las migraciones Drizzle/SQL se han ejecutado y verificado en staging.
- [ ] Las transacciones atómicas protegen operaciones de stock y finanzas críticas.
- [ ] Se cuenta con un respaldo (backup) reciente de la base de datos antes de iniciar el despliegue.

### 5. Plan de Contingencia y Rollback
- [ ] Se conoce el hash del commit anterior estable para revertir de inmediato si es necesario.
- [ ] El procedimiento para restaurar el contenedor o imagen previa está documentado y claro.

## Estrategia de Lanzamiento Progresivo (Feature Flags & Canaries)

Para funcionalidades de alto impacto sobre el inventario o la facturación, separa el despliegue del código de su habilitación:

```
1. Desplegar con la bandera en FALSO     → El código corre en producción pero permanece inactivo.
2. Habilitar para administradores        → Pruebas con cuentas internas y datos reales controlados.
3. Monitoreo de telemetría y logs       → Verificar ausencia de excepciones 500 o inconsistencias.
4. Habilitación general para el equipo   → Apertura total tras confirmar estabilidad.
```

## Protocolo Post-Lanzamiento (Primeros 15 Minutos)

Inmediatamente después de que el despliegue finalice en Coolify o el servidor:
1. **Smoke Test Manual:** Inicia sesión con una cuenta real, abre el Dashboard, verifica que las métricas carguen y realiza una acción representativa del cambio.
2. **Inspección de Logs:** Observa los registros en vivo del contenedor para detectar posibles excepciones no capturadas.
3. **Confirmación:** Si todas las señales son óptimas, marca el lanzamiento como exitoso y actualiza el versionado SemVer correspondiente.\n