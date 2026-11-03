---
name: interview-me
description: Extrae lo que el usuario realmente desea en lugar de lo que cree que debería querer. Lo logra mediante una entrevista de una pregunta a la vez hasta alcanzar ~95% de confianza sobre la intención real. Úsalo cuando un requerimiento sea ambiguo o poco específico ("hazme X" sin "para quién" o "por qué"), cuando el usuario lo solicite explícitamente ("entrevístame", "¿estamos seguros?", "pon a prueba mi idea"), o cuando notes que estás asumiendo requisitos en silencio antes de planificar o programar.
---

# Entrevístame (Interview Me)

## Visión General

Lo que las personas piden y lo que realmente necesitan suelen ser cosas diferentes. A menudo piden "un dashboard" porque es la convención que conocen, no porque un dashboard resuelva su problema de raíz. Dicen "hazlo más rápido" sin definir un número objetivo o umbral de latencia.

El momento más económico para detectar esta brecha es **antes** de redactar planes, especificaciones o código. Una vez que comienzas a construir, cambiar de rumbo tiene costo real y el usuario tenderá a conformarse con una solución mediocre ("suficientemente buena").

Esta habilidad cierra la brecha antes de comprometer esfuerzo técnico. Mientras que `idea-refine` genera variaciones de una idea y `spec-driven-development` redacta requisitos, `interview-me` opera en la fase previa: formula una sola pregunta a la vez, acompañada de tu mejor hipótesis, hasta predecir lo que el usuario dirá antes de que lo exprese.

## Cuándo Usar

Aplica esta habilidad cuando:
- Al requerimiento le falte al menos uno de estos elementos: **quién** es el usuario final, **por qué** lo necesita ahora, qué define el **éxito**, o cuál es la **restricción vinculante**.
- La solicitud es genérica o convencional ("hazme un panel", "optimiza la velocidad") y no puedes desglosarla sin adivinar.
- Sientes la tentación de asumir decisiones de negocio o arquitectura en silencio.
- El usuario no ha indicado qué valor prioriza ante un dilema técnico (simplicidad vs. flexibilidad, costo vs. velocidad).
- El usuario lo solicita explícitamente ("entrevístame", "pon a prueba mi enfoque", "¿estamos seguros?").

**Cuándo NO usar:**
- El requerimiento es claro, directo y autocontenido ("renombra esta variable", "corrige este error tipográfico").
- El usuario ha pedido expresamente velocidad por encima de verificación.
- Consultas informativas puras ("¿cómo funciona X?", "¿qué hace este archivo?").
- Operaciones mecánicas (formateo, mover archivos).
- Ya cuentas con $\ge 95\%$ de certeza sobre lo que se necesita construir.

## El Proceso Paso a Paso

### Paso 1: Formular Hipótesis con Porcentaje de Certeza
Antes de preguntar, escribe en una sola frase tu mejor comprensión de lo que el usuario busca, junto a un nivel de certeza honesto (0 a 100%):

```
HIPÓTESIS: Necesitas una forma de responder "¿cómo vamos este mes?" en reuniones de equipo, y "dashboard" fue el término convencional que se te vino a la mente.
CERTEZA: ~30% — Faltan: quién lo consultará a diario, qué métricas mueven la aguja y qué define el éxito.
```

El número impone honestidad técnica. Si declaras alta certeza pero no puedes predecir las respuestas a las siguientes tres preguntas, el número es falso. Cuando la certeza esté por debajo de ~70%, agrega la razón exacta de qué información clave aún falta.

### Paso 2: Una Sola Pregunta a la Vez, con Hipótesis Incluida
Formato obligatorio:
```
P: <una pregunta enfocada>
HIPÓTESIS: <tu mejor estimación de la respuesta y el razonamiento detrás>
```
Espera la respuesta del usuario antes de formular la siguiente pregunta.

**¿Por qué una sola pregunta y no una lista?**
- El usuario no puede reaccionar con profundidad si lo saturas con un cuestionario largo.
- Las listas largas fomentan respuestas superficiales.
- La tercera pregunta casi siempre depende de la respuesta a la primera; preguntar todo de golpe fija un marco erróneo.

**¿Por qué adjuntar una hipótesis?**
- El ser humano corrige mucho más rápido una suposición equivocada que cuando tiene que redactar una respuesta desde cero.
- Te compromete con una postura técnica visible.
- Hace explícitas tus asunciones para que el usuario las valide o refute.

### Paso 3: Detectar "Lo que quiero vs. Lo que creo que debería querer"
Presta atención a respuestas que repiten clichés de la industria en lugar de necesidades reales:
- Frases hechas ("quiero que sea escalable", "arquitectura limpia") sin contexto numérico.
- Expresiones como "supongo que debería...", "las buenas prácticas dicen...", "lo que se suele usar...".

Cuando detectes esto, la pregunta clave es:
> *"Si no tuvieras que justificarle esta decisión a nadie más, ¿qué es exactamente lo que te gustaría que haga el sistema?"*

### Paso 4: Replantear la Intención en Palabras del Usuario
Cuando tu certeza supere el 90%, resume en 5 a 8 líneas la necesidad validada con su propio vocabulario:
```
Esto es lo que ahora entiendo que necesitas:
1. ...
2. ...
¿Es correcto? Si confirmas, procedemos a redactar la especificación.
```\n