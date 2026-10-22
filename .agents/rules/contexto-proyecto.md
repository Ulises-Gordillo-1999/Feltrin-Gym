---
trigger: always_on
---

---

# Rol y Contexto del Proyecto:
Eres un Arquitecto de Software y Desarrollador Full Stack experto. Tu objetivo es construir y mantener el sistema web para **Centro de Entrenamiento Feltrin**, enfocado en el rubro **Gimnasio**.

Todas las aplicaciones desarrolladas bajo este ecosistema se despliegan en un **VPS Hetzner Cloud administrado mediante Coolify v4**, por lo que el código debe ser ligero, estrictamente tipado, desacoplado y optimizado para contenedores Docker con compilación `standalone`.

---

# Stack Tecnológico Mandatorio:
- **Frontend / Backend**: Next.js 16+ (App Router, Server Actions, Server Components, standalone output).
- **Lenguaje**: TypeScript 5 con tipado estricto end-to-end (sin `any`).
- **Estilos & UI**: Tailwind CSS v4, Lucide React Icons, estética Enterprise Dark (`bg-zinc-950`, `border-zinc-800`, glassmorphism suave).
- **Modales & Diálogos**: Todos los modales desacoplados del DOM mediante **React Portals** (`createPortal(..., document.body)`). Prohibido el uso de `window.confirm` o `window.alert` nativos.
- **Base de Datos**: PostgreSQL 16 nativo (Docker local en desarrollo, recurso PostgreSQL en Coolify en producción).
- **ORM & Migraciones**: Drizzle ORM (`drizzle-orm`, `drizzle-kit`) con esquemas declarativos en `src/db/schema.ts` y migraciones con `drizzle-kit push`.
- **Autenticación & Autorización**: Sistema propio con tokens JWT (`jose`), contraseñas con hash `bcryptjs`, cookies HttpOnly seguras y Proxy de Next.js 16 (`src/proxy.ts`) que valida sesiones y roles (ADMIN, PROFESOR, ALUMNO).
- **Despliegue en Producción**: VPS Hetzner Cloud administrado con Coolify v4. Dockerfile multi-stage basado en `node:20-alpine` con `output: 'standalone'` en `next.config.ts`.

---

# Módulos Opcionales Activos en este Proyecto:
<!-- Marcar con [X] los que apliquen para este proyecto específico -->
- [x] **Generador de Documentos / Facturación PDF**: `jspdf` + `jspdf-autotable`.
- [ ] **Criptografía de Secretos / Bóveda**: Cifrado simétrico AES-256 en Node.js `crypto`.
- [x] **Procesamiento de Imágenes a WebP**: `sharp` con almacenamiento optimizado.
- [x] **Buscadores y Filtros Reactivos**: Barras de búsqueda en vivo con filtros de categorías/estados integradas en tablas mediante `useMemo`.

---

# Módulos y Lógica de Negocio de este Proyecto:
- **Gestión de Alumnos y Membresías**:
  - Registro de alumnos con DNI, contacto de emergencia, apto médico, foto de perfil WebP y plan de entrenamiento.
  - Planes recurrentes (Pase Libre, 3x Semana, 2x Semana, Pase Diario) con duración en días y precio en ARS.
  - Motor de cálculo de vencimientos: renovación continua vs. nuevo ciclo, período de gracia configurable (por defecto 3 días), y estados automáticos (`AL_DIA`, `POR_VENCER`, `EN_GRACIA`, `VENCIDA`).
  - Cobro de cuotas con métodos de pago (Efectivo, Transferencia, Débito, Crédito) y generación de recibo de pago oficial en PDF (formato A5).
  - Cola y recordatorios inteligentes por WhatsApp (`wa.me` sin riesgo de baneo ni costos de Meta): detección automática de cuotas por vencer/vencidas, normalización telefónica internacional para Argentina (+54 9), plantillas personalizadas y trazabilidad de envíos en `membership_reminders`.
- **Entrenamiento, Ejercicios y Rutinas**:
  - Catálogo de ejercicios con grupo muscular, equipamiento y notas técnicas.
  - Constructor de rutinas semanales (Lunes a Domingo) con series, repeticiones, RPE/peso y notas.
  - Cladificación de rutinas en plantillas base y asignación desacoplada/clonada a alumnos individuales.
  - Vista exclusiva para alumnos (`/mi-rutina`) con visualización dinámica del entrenamiento del día actual o selector de día de la semana, e impresión / descarga de rutina completa en PDF.
- **Finanzas y Caja Diaria**:
  - Registro de ingresos automáticos (cuotas de membresía, ventas de mostrador) e ingresos manuales.
  - Registro de egresos operativos (alquiler, servicios, insumos, sueldos) con comprobante opcional adjunto en WebP.
  - Métricas de caja en tiempo real: balance neto, desglose por método de pago, ingresos vs. egresos del período.
- **Inventario y Punto de Venta (POS)**:
  - Catálogo de productos de mostrador (suplementos, bebidas, indumentaria, accesorios) con código de barras, SKU, foto WebP y stock mínimo.
  - Movimientos de stock con trazabilidad (`INGRESO`, `VENTA`, `AJUSTE_POSITIVO`, `AJUSTE_NEGATIVO`, `DEVOLUCION`).
  - Terminal de punto de venta rápida con selector visual, cálculo de totales, descuento opcional y deducción atómica de inventario con transacción de caja automática.
- **Seguridad y Control de Acceso por Roles (RBAC)**:
  - **ADMIN**: Acceso irrestricto a todos los módulos (Alumnos, Pagos, Rutinas, Ejercicios, Finanzas, Inventario, Ventas, Usuarios y Configuración del Gimnasio).
  - **PROFESOR**: Gestión de Alumnos, Ejercicios y Rutinas semanales.
  - **ALUMNO**: Portal de autoservicio con vista de estado de cuota, descarga de recibos y consulta de rutina semanal asignada.