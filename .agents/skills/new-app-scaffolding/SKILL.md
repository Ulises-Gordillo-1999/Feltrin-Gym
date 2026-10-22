---
name: new-app-scaffolding
description: >-
  Architectural blueprint, setup protocol, and scaffolding rules for creating new full-stack applications
  destined for deployment on Hetzner VPS with Coolify. Enforces the core stack (Next.js 16 App Router,
  PostgreSQL 16, Drizzle ORM, Tailwind CSS v4, custom JWT RBAC auth) and guides selective inclusion of
  optional modules (PDF Engine, AES-256 Cryptography, Sharp WebP processing).
---

# Blueprint de Arquitectura: Nuevas Aplicaciones en Hetzner + Coolify

Este documento define el estándar oficial de ingeniería para iniciar y desarrollar cualquier nueva aplicación web que se despliegue en el **VPS Hetzner Cloud administrado mediante Coolify v4**.

---

## 🏛️ 1. Núcleo Tecnológico Obligatorio (Core Stack)

Todas las aplicaciones deben utilizar estrictamente este núcleo base:

| Capa | Tecnología | Justificación y Reglas |
| :--- | :--- | :--- |
| **Framework Full Stack** | **Next.js 16+ (App Router)** | Uso de Server Components para queries directas a BD, Server Actions para mutaciones tipadas y Turbopack para compilación rápida. `output: 'standalone'` en `next.config.ts`. |
| **Librería UI** | **React 19** | Tipado nativo y hooks modernos (`useActionState`, `useOptimistic`). |
| **Lenguaje** | **TypeScript 5 (Strict)** | Tipado de punta a punta (`end-to-end`) entre base de datos, backend y frontend. Sin uso de `any`. |
| **Base de Datos** | **PostgreSQL 16** | Nativo en contenedor Docker en desarrollo (`docker-compose.yml`), y recurso PostgreSQL administrado en Coolify en producción. |
| **ORM & Migraciones** | **Drizzle ORM & Drizzle Kit** | Máximo rendimiento, cero overhead de binarios pesados (a diferencia de Prisma), esquemas SQL declarativos en `src/db/schema.ts` y migraciones con `drizzle-kit push`. |
| **Estilos & UI** | **Tailwind CSS v4 + Lucide React** | Estética *Enterprise Dark*, paletas HSL/Zinc, glassmorphism (`backdrop-blur`), y **React Portals** (`createPortal(..., document.body)`) para todos los modales. |
| **Autenticación & RBAC** | **JWT con `jose` + `bcryptjs`** | Autenticación propia sin proveedores externos costosos. Tokens firmados en cookies `HttpOnly`, `SameSite=Lax`, `Secure`. Middleware centralizado para control de acceso por roles. |
| **Contenerización** | **Dockerfile Multi-Stage** | Construcción ligera en 3 etapas (`deps` -> `builder` -> `runner`) basada en `node:20-alpine`, exponiendo el puerto `3000`. |
| **Despliegue** | **Coolify v4 + Traefik** | Despliegue automatizado por Git Webhook, SSL automático vía Let's Encrypt / Traefik y proxies inversos con Cloudflare DNS. |

---

## 🧩 2. Módulos Condicionales (Se incluyen solo si el rubro lo exige)

No todas las aplicaciones necesitan el stack extendido de UPGRADE ERP. Evaluar según el dominio del negocio:

| Módulo | Paquetes / Dependencias | ¿Cuándo incluirlo? | ¿Cuándo OMITIRLO? |
| :--- | :--- | :--- | :--- |
| **PDF Engine** | `jspdf`, `jspdf-autotable` | Facturación, cotizaciones formales, reportes impresos, órdenes de trabajo, certificados médicos o diplomas. | Dashboards puramente interactivos, apps de mensajería, inventarios sin impresión, portales de clientes. |
| **Criptografía de Bóveda** | Node.js `crypto` nativo (AES-256-CBC) | Apps que custodian contraseñas de terceros, tokens API, claves bancarias o secretos IT. | Aplicaciones estándar donde la seguridad se resuelve con hash de contraseñas (`bcryptjs`) y HTTPS. |
| **Procesamiento de Imágenes** | `sharp` | Subida de fotos de productos, comprobantes de pago, avatares o recibos comprimidos a WebP. | Apps basadas únicamente en datos de texto, catálogos sin fotos o apps con almacenamiento en CDN externo (Cloudinary / S3). |
| **Control Métrico / Cable** | Esquema dinámico estimado vs real | Obras físicas donde el consumo real difiere del presupuesto inicial (redes, construcción, talleres). | Ventas tradicionales, eCommerce de stock unitario, turnos o SaaS. |

---

## 📁 3. Estructura de Directorios Estándar

```text
├── .agents/
│   ├── rules/
│   │   └── project-context.md       # Regla de contexto propia del proyecto
│   └── skills/
│       └── semver-version-control/  # Skill de versionado SemVer
├── docker-compose.yml               # PostgreSQL 16 para desarrollo local
├── Dockerfile                       # Multi-stage standalone para Coolify
├── next.config.ts                   # { output: 'standalone' }
├── package.json
├── src/
│   ├── app/                         # App Router (páginas y Server Actions)
│   │   ├── actions/                 # Server Actions por entidad (usuarios, clientes, etc.)
│   │   ├── (auth)/login/            # Pantalla de login
│   │   ├── dashboard/               # Panel principal protegido
│   │   ├── layout.tsx               # Layout raíz con tema Enterprise Dark
│   │   └── page.tsx
│   ├── components/                  # Componentes cliente y servidor
│   │   ├── ui/                      # Modales, botones, inputs
│   │   └── [modulo]/                # Tablas con buscadores y filtros reactivos
│   ├── db/
│   │   ├── index.ts                 # Conexión Postgres con Drizzle
│   │   └── schema.ts                # Esquema de tablas y enums
│   ├── middleware.ts                # Validación JWT y RBAC
│   ├── types/                       # Tipos de TypeScript
│   └── utils/                       # auth.ts, formateadores
```

---

## 🚀 4. Protocolo de Inicio para una Nueva Aplicación

1. **Inicialización**:
   ```bash
   npx -y create-next-app@latest ./ --typescript --tailwind --eslint --app --src-dir --no-import-alias --turbopack
   ```
2. **Dependencias Core**:
   ```bash
   npm i drizzle-orm postgres jose bcryptjs lucide-react
   npm i -D drizzle-kit @types/bcryptjs
   ```
3. **Dependencias Condicionales** (si aplica):
   - PDF: `npm i jspdf jspdf-autotable`
   - Imágenes: `npm i sharp @types/sharp`
4. **Configurar Dockerfile Standalone** para Coolify:
   - Configurar `output: 'standalone'` en `next.config.ts`.
5. **Configurar regla local**: Copiar la plantilla de contexto en `.agents/rules/`.
