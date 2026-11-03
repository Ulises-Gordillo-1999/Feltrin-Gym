---
name: doubt-driven-development
description: Somete decisiones técnicas críticas o de alto riesgo a una revisión adversarial en un contexto limpio antes de comprometerlas. Úsalo en lógica de autenticación, cifrado de bóveda, liquidación de stock, transacciones financieras o migraciones irreversibles.
---

# Desarrollo Guiado por la Duda (Doubt-Driven Development)

## Visión General

En el desarrollo de software crítico, el optimismo ciego es peligroso. Cuando se tocan áreas sensibles como autenticación JWT, cifrado simétrico AES-256 en bóveda, liquidación irreversible de inventario o dinero real, la confianza prematura produce desastres.

`doubt-driven-development` exige someter la solución propuesta al escrutinio adversarial: actuar activamente como un auditor escéptico que busca fallas lógicas, carreras de condición (`race conditions`), vectores de inyección o brechas de seguridad.

## Preguntas Adversariales Obligatorias

1. **¿Qué pasa si falla a la mitad?**: Si una Server Action liquida stock pero se cae la conexión antes de actualizar el estado del proyecto, ¿queda la base de datos corrupta? (Uso de transacciones de base de datos `db.transaction`).
2. **¿Puede falsificarse la identidad?**: ¿Estamos validando el ID de usuario desde el token JWT HttpOnly firmado en el servidor, o confiando en un parámetro enviado desde el cliente?
3. **¿Es idempotente?**: Si el usuario presiona dos veces seguidas el botón "Cobrar" o "Finalizar Obra", ¿se cobra dos veces o se descuenta el doble de stock? (Protección con banderas booleanas como `stock_descontado` o tokens de idempotencia).\n