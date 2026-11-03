---
name: security-and-hardening
description: Blinda la aplicación contra vulnerabilidades según el estándar OWASP Top 10. Implementa validación estricta de inputs, control de acceso basado en roles (RBAC), protección contra inyecciones, cabeceras HTTP seguras y gestión de sesiones inviolables.
---

# Seguridad y Fortalecimiento (Security & Hardening)

## Visión General

La seguridad no es un parche que se agrega al final; es una propiedad fundamental de la arquitectura. En aplicaciones que gestionan finanzas, contraseñas de clientes o infraestructura IT, un solo fallo de autorización puede tener consecuencias catastróficas.

## Pilares de Blindaje

1. **Control de Acceso Basado en Roles (RBAC)**:
   - Toda Server Action o endpoint protegido debe verificar el rol del usuario (`SuperAdmin`, `Admin`, `Tecnico`) a nivel de servidor.
   - Las cookies de sesión deben ser `HttpOnly`, `Secure` y `SameSite=Lax`, firmadas con algoritmos criptográficos modernos (`jose` / `HS256`).
2. **Validación Exhaustiva de Entradas**:
   - Nunca confiar en datos enviados por el cliente. Validar tipos, longitud y formato en el servidor.
   - Sanitización para prevenir Cross-Site Scripting (XSS) y Parameter Pollution.
3. **Cabeceras HTTP Seguras**:
   - Configurar `X-Frame-Options: SAMEORIGIN` (anti-clickjacking).
   - `X-Content-Type-Options: nosniff`.
   - Deshabilitar cabeceras que revelen tecnologías (`poweredByHeader: false`).
4. **Cifrado de Datos Sensibles**:
   - Credenciales y tokens confidenciales deben cifrarse con algoritmos simétricos robustos (AES-256) antes de tocar la base de datos.\n