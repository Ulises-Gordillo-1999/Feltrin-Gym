# 🏋️‍♂️ Centro de Entrenamiento Feltrin

[![Next.js](https://img.shields.io/badge/Next.js-16.4.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3.0-20232A?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.45.4-C5F74F?style=for-the-badge&logo=drizzle)](https://orm.drizzle.team/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker)](https://www.docker.com/)
[![Coolify](https://img.shields.io/badge/Coolify-v4-6B46C1?style=for-the-badge)](https://coolify.io/)
[![SemVer 2.0.0](https://img.shields.io/badge/SemVer-0.2.0-blue?style=for-the-badge)](https://semver.org/)

Sistema integral de gestión para gimnasios y centros de entrenamiento deportivo de alto rendimiento. Diseñado con una arquitectura moderna, segura y de alto desempeño basada en **Next.js 16 App Router**, **PostgreSQL 16**, **Drizzle ORM** y **Tailwind CSS v4** con estética *Enterprise Dark*.

---

## 🚀 Características y Módulos del Sistema

### 1. 👥 Gestión de Alumnos y Membresías
- **Ficha Integral de Alumno**: Registro de datos personales, DNI, contacto de emergencia, apto médico digitalizado, foto de perfil optimizada a WebP y profesor asignado.
- **Motor de Vencimientos Inteligente**: Detección en tiempo real de estados de cuota (`AL_DIA`, `POR_VENCER`, `EN_GRACIA`, `VENCIDA`) con cálculo de período de gracia configurable por sede.
- **Caja de Cobro de Cuotas**: Registro de pagos con cálculo de nuevo ciclo o renovación continua, soporte para múltiples medios de pago (Efectivo, Transferencia, Débito, Crédito) y aplicación de descuentos.
- **Recibos Oficiales en PDF**: Emisión instantánea de comprobantes de pago en formato A5 mediante `jspdf` y `jspdf-autotable`.

### 2. 📲 Recordatorios Inteligentes por WhatsApp
- **Integración Nativa `wa.me`**: Envío directo de mensajes personalizados sin intermediarios, sin costos de API oficial de Meta y sin riesgo de baneo de línea telefónica.
- **Normalización Telefónica Internacional**: Algoritmo para números de Argentina (`+54 9`) que limpia prefijos locales (15, 0) y espacios de forma transparente.
- **Plantillas Dinámicas y Personalizables**: Variables automáticas (`{nombre}`, `{dias}`, `{fecha}`, `{plan}`, `{gimnasio}`) configurables desde el panel de ajustes.
- **Trazabilidad de Envíos**: Historial persistente en `membership_reminders` para registrar cuándo y a quién se le envió cada aviso, evitando envíos duplicados.

### 3. 🏋️ Entrenamiento, Ejercicios y Rutinas Semanales
- **Biblioteca de Ejercicios**: Catálogo categorizado por grupo muscular (Pecho, Espalda, Cuádriceps, Isquiotibiales, Hombros, Brazos, etc.) y equipamiento necesario.
- **Planificador de Rutinas Semanales**: Constructor de planes de Lunes a Domingo con definición precisa de series, repeticiones, cargas (kg o RPE), tiempos de descanso y notas técnicas.
- **Portal del Alumno (`/mi-rutina`)**: Vista optimizada para teléfonos móviles donde el socio visualiza dinámicamente el entrenamiento del día o navega la semana, con opción de descarga de su rutina completa en PDF.

### 4. 💰 Finanzas y Caja Diaria
- **Arqueo y Flujo de Fondos en Tiempo Real**: Métricas de balance neto, ingresos brutos y egresos operativos clasificados por categorías y métodos de pago.
- **Ingresos Automáticos**: Sincronización transparente de cuotas de membresía y ventas de mostrador del POS.
- **Registro de Egresos Operativos**: Control de gastos (alquiler, sueldos, servicios, mantenimiento) con adjuntos de facturas/comprobantes convertidos automáticamente a WebP mediante `sharp`.

### 5. 🛒 Inventario y Punto de Venta (POS)
- **Control de Stock y Catálogo**: Gestión de suplementos, bebidas, indumentaria y accesorios deportivos con control de SKU, código de barras y stock de seguridad mínimo.
- **Terminal de Cobro Rápido**: Selector ágil de productos, cálculo automático de totales con descuento y deducción atómica de stock ligada a la caja diaria.

### 6. 🔐 Seguridad y Control de Acceso por Roles (RBAC)
- **ADMIN**: Control total e irrestricto de todos los módulos, reportes de caja, usuarios y configuración del gimnasio.
- **PROFESOR**: Gestión de alumnos, confección de rutinas y banco de ejercicios.
- **ALUMNO**: Acceso de autoservicio a su estado de cuota, descarga de comprobantes y consulta de su rutina diaria.
- **Arquitectura de Autenticación**: Tokens JWT firmados con `jose`, almacenamiento en cookies `HttpOnly` y protección de rutas en el Proxy de Next.js 16 (`src/proxy.ts`).

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
| :--- | :--- |
| **Framework Fullstack** | Next.js 16.4.2 (App Router, Server Actions, Server Components) |
| **Motor de UI** | React 19.3.0 + Lucide React Icons |
| **Lenguaje** | TypeScript 5.0 (Tipado estricto end-to-end, sin `any`) |
| **Estilos & Diseño** | Tailwind CSS v4 (Estética Enterprise Dark: `bg-zinc-950`, `border-zinc-800`) |
| **Base de Datos** | PostgreSQL 16 Nativo |
| **ORM & Migraciones** | Drizzle ORM 0.45.4 + Drizzle Kit |
| **Seguridad & Auth** | JWT (`jose`) + `bcryptjs` + Cookies HttpOnly Seguras |
| **PDF Engine** | `jspdf` + `jspdf-autotable` |
| **Procesamiento de Imágenes** | `sharp` (Conversión y compresión a WebP) |
| **Contenedores & Despliegue** | Docker Multi-stage (`node:20-alpine`) + Coolify v4 |

---

## ⚙️ Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto para entornos locales o configurarlas en el panel de **Coolify** para producción:

```env
# Conexión a Base de Datos PostgreSQL
DATABASE_URL=postgres://usuario:contraseña@host:5432/feltrin_gym

# Clave secreta para tokens JWT (mínimo 32 caracteres seguros)
JWT_SECRET=super_secret_jwt_key_at_least_32_chars_long

# Tiempo de expiración de sesión (en horas)
SESSION_TTL_HOURS=12

# Directorio de almacenamiento para fotos y comprobantes
UPLOADS_DIR=/app/uploads

# Zona horaria del servidor
TZ=America/Argentina/Buenos_Aires

# Entorno de ejecución
NODE_ENV=production
PORT=3000

# (Opcional) Credenciales para seed inicial
SEED_ADMIN_EMAIL=admin@ejemplo.com
SEED_ADMIN_PASSWORD=TuPasswordSeguro123!
SEED_ADMIN_NAME="Administrador"
```

---

## 💻 Desarrollo Local

### 1. Clonar el Repositorio e Instalar Dependencias
```bash
git clone https://github.com/Ulises-Gordillo-1999/Feltrin-Gym.git
cd Feltrin-Gym
npm install
```

### 2. Iniciar PostgreSQL Local con Docker
```bash
npm run db:up
```

### 3. Aplicar Esquemas a la Base de Datos
```bash
npm run db:push
```

### 4. Cargar Datos Semilla Iniciales
```bash
npm run db:seed
```

### 5. Iniciar Servidor de Desarrollo
```bash
npm run dev
```
Acceder al sistema en [http://localhost:3001](http://localhost:3001).

---

## 🚢 Despliegue en Producción con Coolify v4

El proyecto cuenta con un `Dockerfile` optimizado en múltiples etapas (`node:20-alpine`) con soporte para Next.js en modo `standalone`, lo que reduce drásticamente el consumo de memoria RAM y el tamaño de la imagen final.

### Pasos en Coolify:
1. **Crear Proyecto / Recurso**:
   - Tipo: **Public Git repository**
   - URL: `https://github.com/Ulises-Gordillo-1999/Feltrin-Gym`
   - Rama: `main`
2. **Configuración de Compilación (Build Configuration)**:
   - **Build pack**: Seleccionar `Dockerfile`
   - **Port**: `3000`
   - **Base directory**: `/`
3. **Almacenamiento Persistente (Persistent Storage)**:
   - Montar un volumen para conservar las fotos de perfil y comprobantes:
     - **Name**: `feltrin-uploads`
     - **Destination**: `/app/uploads`
4. **Variables de Entorno**:
   - Cargar las variables detalladas en la sección anterior apuntando a la base de datos `feltrin_gym`.
5. **Dominio & SSL**:
   - Configurar el dominio personalizado (Coolify y Traefik generarán el certificado SSL Let's Encrypt automáticamente).
6. **Deploy**:
   - Presionar **Deploy**. Al finalizar la primera compilación, aplicar migraciones y seed mediante la terminal integrada del contenedor en Coolify:
     ```bash
     npm run db:push
     npm run db:seed
     ```

---

## 🏷️ Versionado SemVer

Este proyecto sigue estrictamente el estándar **Semantic Versioning 2.0.0** (`MAJOR.MINOR.PATCH`):
- `MAJOR`: Cambios incompatibles de API o arquitectura de datos.
- `MINOR`: Nuevas funcionalidades y módulos compatibles hacia atrás (ej. Bot de WhatsApp, filtros).
- `PATCH`: Corrección de errores, ajustes de estilos o mantenimiento.

Para incrementar la versión:
```bash
node .agents/skills/semver-version-control/scripts/bump-version.js <major|minor|patch>
```

---

## 📄 Licencia y Derechos

Desarrollado para **Centro de Entrenamiento Feltrin**. Todos los derechos reservados © 2026.
