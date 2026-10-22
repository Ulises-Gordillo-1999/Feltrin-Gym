---
name: env-security-protocol
description: >-
  Protocolo estricto de seguridad para la gestión de variables de entorno, secretos y credenciales de producción.
  Garantiza que contraseñas, URLs de bases de datos de producción, tokens JWT, API keys y correos reales jamás queden
  expuestos en código fuente, README, documentación, scripts de seed ni en el historial de Git. Define el uso obligatorio
  de placeholders genéricos en el repositorio, sanitización antes de commits, auditoría preventiva con ripgrep/git status,
  configuración segura en paneles de despliegue (Coolify/Docker/VCS), y procedimientos de remediación si un secreto es introducido.
---

# Protocolo de Seguridad para Variables de Entorno y Secretos

Este protocolo establece las reglas mandatorias e inquebrantables para la gestión de variables de entorno, credenciales y secretos de producción en el proyecto **Centro de Entrenamiento Feltrin** y aplicaciones del ecosistema.

---

## 🛡️ Principio Fundamental: Zero Secrets in Git

> [!CAUTION]
> **LOS DATOS REALES DE PRODUCCIÓN JAMÁS DEBEN QUEDAR EXPUESTOS EN REPOSITORIOS DE CÓDIGO NI EN EL HISTORIAL DE GIT.**
> Ninguna contraseña, hash real, URL de base de datos con contraseñas de producción, clave JWT, correo privado de clientes/administradores ni credencial de API externa puede commitearse bajo ninguna circunstancia.

---

## 🗂️ Matriz de Archivos de Entorno

| Archivo | Estado en Git | Propósito | Contenido Permitido |
| :--- | :--- | :--- | :--- |
| `.env` | **IGNORADO** (`.gitignore`) | Entorno local del desarrollador en su máquina | Valores locales de desarrollo o pruebas de staging |
| `.env.example` | **PÚBLICO** (rastreado) | Plantilla modelo para onboarding de desarrolladores | Claves vacías o **placeholders genéricos ficticios** |
| `.env.production` | **IGNORADO** (`.gitignore`) | Variables de compilación local de prod | No debe existir en el repositorio |
| `README.md` | **PÚBLICO** (rastreado) | Documentación técnica del proyecto | **Exclusivamente ejemplos falsos y genéricos** |

---

## 🚫 Prohibiciones Estrictas (Código y Documentación)

1. **Prohibido colocar contraseñas reales en `README.md` o documentación Markdown:**
   - ❌ **INCORRECTO**: Escribir la contraseña real del cliente o servidor en el documento.
   - ✅ **CORRECTO**: `SEED_ADMIN_PASSWORD=TuPasswordSeguro123!` o `SEED_ADMIN_PASSWORD="<tu-clave-aqui>"`

2. **Prohibido colocar correos reales de producción en ejemplos públicos:**
   - ❌ **INCORRECTO**: `SEED_ADMIN_EMAIL=correoreal@gmail.com`
   - ✅ **CORRECTO**: `SEED_ADMIN_EMAIL=admin@ejemplo.com`

3. **Prohibido hardcodear secretos como valores por defecto (fallbacks) en código:**
   - ❌ **INCORRECTO**:
     ```typescript
     const pass = process.env.SEED_ADMIN_PASSWORD || 'Motabotello1248.';
     ```
   - ✅ **CORRECTO**:
     ```typescript
     const pass = process.env.SEED_ADMIN_PASSWORD || (isProduction ? undefined : 'AdminDev123!');
     if (isProduction && !pass) throw new Error('SEED_ADMIN_PASSWORD es requerida en producción.');
     ```

4. **Prohibido exponer variables con secretos en el cliente (`'use client'`):**
   - Jamás prefijar credenciales o secretos con `NEXT_PUBLIC_`.
   - Toda variable que comience con `NEXT_PUBLIC_` se incrusta en el bundle JavaScript descargable por cualquier usuario en su navegador.

---

## 🔐 Dónde y Cómo se Configuran los Datos Reales de Producción

Los datos reales de producción solo existen en **entornos de ejecución protegidos y aislados**:

1. **Panel de Coolify v4 (Recomendado):**
   - Ruta: `Aplicación` $\rightarrow$ `Environment Variables`.
   - Se cargan de forma privada y encriptada en la base de datos interna de Coolify.
   - Se inyectan directamente como variables de entorno al contenedor Docker al momento de levantar el servicio.
2. **Volúmenes Persistentes / Docker Secrets:**
   - Archivos de certificados o claves privadas montados como volúmenes de solo lectura.
3. **Servicios de Gestión de Secretos (Vault, Doppler, AWS Secrets Manager):**
   - Cuando aplique, mediante inyección dinámica en tiempo de inicio.

---

## 📋 Checklist Preventivo antes de cada `git commit` y `git push`

Antes de ejecutar `git commit` o `git push`, verifica rigurosamente:

- [ ] ¿Ejecutaste `git status` para confirmar que ningún archivo `.env`, `.env.local` o `.env.production` esté staged?
- [ ] ¿Revisaste `git diff` buscando si accidentalmente copiaste una clave real o correo en un archivo `.ts`, `.tsx` o `.md`?
- [ ] ¿El archivo `.gitignore` contiene las siguientes reglas mínimas?
  ```gitignore
  .env*
  !.env.example
  uploads/
  *.pem
  *.key
  ```
- [ ] ¿El archivo `.dockerignore` excluye `.env*` (salvo `.env.example`) para evitar que se empaquete en la imagen Docker pública?

---

## 🚨 Protocolo de Remediación ante Fuga Accidental de Secretos

Si por error se commiteó un dato sensible:

### Escenario A: El commit es local (NO se ha hecho `git push`):
1. Sanitizar el archivo reemplazando el secreto por un placeholder genérico.
2. Enmendar el commit:
   ```bash
   git add .
   git commit --amend --no-edit
   ```

### Escenario B: El commit ya fue subido a GitHub (`git push` reciente):
1. Sanitizar inmediatamente los archivos afectados.
2. Enmendar el commit en el historial local:
   ```bash
   git add .
   git commit --amend -m "chore: sanitizar credenciales y variables de entorno"
   ```
3. Forzar la actualización en GitHub para sobreescribir el commit comprometido:
   ```bash
   git push --force origin <rama>
   ```
4. **Rotación Obligatoria de Credenciales**:
   - Cambiar inmediatamente la contraseña en la base de datos, Coolify o proveedor de servicios.
   - Generar un nuevo `JWT_SECRET`.
   - *Regla de oro*: Una vez que un secreto tocó un servidor remoto, debe considerarse comprometido.
