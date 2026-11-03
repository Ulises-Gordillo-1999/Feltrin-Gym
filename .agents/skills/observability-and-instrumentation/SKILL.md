---
name: observability-and-instrumentation
description: Instrumenta el código para que el comportamiento en producción sea visible y diagnosticable. Usar al agregar logging estructurado, métricas, trazabilidad distribuida o alertas. Usar al desplegar cualquier funcionalidad que corra en producción y requiera evidencia de correcto funcionamiento.
---

# Observabilidad e Instrumentación

## Descripción General

El código que no puedes observar es código que no puedes operar. La observabilidad es la capacidad de responder "¿qué está haciendo el sistema y por qué?" desde el exterior, utilizando la telemetría que el software emite. La instrumentación no es un añadido posterior al lanzamiento: se escribe junto con la funcionalidad, al igual que los tests. Si una característica se despliega sin telemetría, el primer error reportado por un usuario se convierte en arqueología en lugar de una simple consulta.

## Cuándo Utilizarla

- Al construir cualquier funcionalidad que se ejecute en producción.
- Al agregar un nuevo servicio, endpoint, tarea en segundo plano o integración externa.
- Cuando un incidente en producción tardó demasiado en diagnosticarse ("no pudimos saber qué pasó").
- Al configurar o auditar reglas de alerta.
- Al revisar un PR que añade I/O, reintentos, colas o llamadas entre servicios.

**NO es para:**
- Diagnosticar un fallo que está ocurriendo en este momento (utiliza la skill `debugging-and-error-recovery`; la observabilidad es lo que hace que esa skill sea rápida la próxima vez).
- Perfilar y optimizar lentitud ya medida (utiliza `performance-optimization`).
- Checklists de monitoreo el día de lanzamiento y disparadores de rollback (consulta `shipping-and-launch`; esta skill cubre la instrumentación que los alimenta).

## Proceso

### 1. Definir qué significa "funcionar bien" antes de instrumentar

La telemetría sin una pregunta concreta es solo ruido. Antes de añadir instrumentación, escribe 2 a 4 preguntas que un ingeniero de guardia se haría sobre esta funcionalidad:

```
FUNCIONALIDAD: reintento de cobro de presupuesto
PREGUNTAS DEL EQUIPO DE GUARDIA:
1. ¿Qué porcentaje de pagos tiene éxito en el primer intento versus después de un reintento?
2. Cuando un cobro falla definitivamente, ¿cuál es la causa? (¿error del proveedor, timeout, validación?)
3. ¿Está el proveedor de pagos respondiendo más lento de lo habitual?
→ Cada señal instrumentada a continuación debe responder una de estas preguntas.
```

Si no puedes formular las preguntas, no estás listo para instrumentar: registrarás todo en logs y no aprenderás nada.

### 2. Elegir la señal adecuada para cada pregunta

| Señal | Responde | Perfil de Costo | Ejemplo |
|---|---|---|---|
| **Log estructurado** | "¿Qué ocurrió en este caso específico?" | Por evento; crece con el tráfico | `payment_failed` con código de error del proveedor |
| **Métrica** | "¿Con qué frecuencia o rapidez, de forma agregada?" | Fijo por serie; barato de consultar | Latencia p99 de llamadas externas |
| **Traza (Trace)** | "¿A dónde se fue el tiempo entre servicios/módulos?" | Por petición; habitualmente con muestreo | Un checkout lento desglosado por salto |

Regla de oro: las **métricas** te dicen *que* algo anda mal, las **trazas** te dicen *dónde*, y los **logs** te dicen *por qué*.

### 3. Logging Estructurado

Registra eventos, no prosa. Cada línea de log debe ser un objeto JSON con un nombre de evento estable y campos interpretables por máquinas:

```typescript
// INCORRECTO: interpolación de strings — no consultable, inconsistente
logger.info(`Pago ${id} falló para cliente ${userId} tras ${n} reintentos`);

// CORRECTO: nombre de evento estable + campos estructurados
logger.warn({
  event: 'payment_failed',
  paymentId: id,
  provider: 'mercadopago',
  errorCode: err.code,
  attempt: n,
}, 'payment failed');
```

**Niveles de Log — Úsalos con consistencia:**

| Nivel | Significado | Acción de Guardia |
|---|---|---|
| `error` | Invariante rota; alguien debe actuar | Investigar de inmediato |
| `warn` | Degradado pero gestionado (reintento exitoso, fallback usado) | Monitorear tendencias |
| `info` | Evento de negocio significativo (presupuesto aprobado, stock liquidado) | Ninguna inmediata |
| `debug` | Detalle diagnóstico de desarrollo | Apagado en producción por defecto |

**Los Correlation IDs (Request IDs) son obligatorios.** Genera o propaga un ID de solicitud en la frontera del sistema y adjúntalo a cada línea de log, span y llamada saliente. Sin él, es imposible reconstruir una transacción en logs concurrentes.

**Identifica el punto de entrada.** Si varias vías disparan una misma lógica (cron, webhook, CLI manual), registra siempre el `entryPoint` junto al correlation ID.

**Cero credenciales en logs.** Respeta estrictamente `env-security-protocol` y `security-and-hardening`: nunca registres contraseñas, tokens JWT, claves AES-256 ni datos personales sensibles en texto plano.

### 4. Métricas

Para servicios dirigidos por peticiones, instrumenta **RED** en cada endpoint y dependencia externa:
- **R**ate (tasa de peticiones por segundo).
- **E**rrors (tasa de errores y respuestas 5xx).
- **D**uration (histograma de latencia, nunca promedios simples).

Para recursos (colas, pools de conexiones Postgres, memoria), utiliza **USE**:
- **U**tilization (utilización).
- **S**aturation (saturación o cola en espera).
- **E**rrors (errores del recurso).

**Evita la explosión de cardinalidad:** Las etiquetas (labels) deben pertenecer a conjuntos finitos y pequeños (ej. ruta normalizada `/api/proyectos/:id`, clase de estado `2xx`/`5xx`). Nunca uses IDs de usuario, URLs completas ni mensajes de error arbitrarios como etiquetas de métricas.

### 5. Trazabilidad Distribuida (Tracing)

Utiliza OpenTelemetry como estándar agnóstico. Instrumenta spans manuales alrededor de operaciones de negocio críticas (ej. `liquidarStockProyecto`, `encriptarCredencialBoveda`) y propaga el contexto a través de cualquier frontera asíncrona.

### 6. Alertas

Alerta sobre **síntomas percibidos por los usuarios**, no sobre causas internas volátiles:
- **Síntoma (digno de guardia):** Tasa de error > 1% durante 5 minutos, latencia p99 > 2s, transacciones bloqueadas.
- **Causa (métrica en dashboard, no alerta urgente):** CPU al 85%, un contenedor reiniciado.

**Requisitos para cada alerta:**
1. Debe ser accionable (si la respuesta es "ignóralo, se autorepara", elimina la alerta).
2. Debe enlazar a un **Runbook** operativo con los pasos concretos de verificación y mitigación.
3. Debe tener umbrales y duración justificados por el SLO o datos históricos.

### 7. Verificación de la Telemetría

La instrumentación es código y puede fallar. Antes de dar por finalizada la tarea:
- Fuerza un error en entorno de pruebas y búscalo en los logs por su ID de correlación; verifica que los campos sean JSON estructurado.
- Genera tráfico sintético y confirma que las métricas reflejan las etiquetas esperadas.
- Verifica que ningún secreto o contraseña se haya filtrado en los registros.\n