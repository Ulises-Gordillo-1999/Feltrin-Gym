import { relations, sql } from 'drizzle-orm';
import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  integer,
  smallint,
  numeric,
  boolean,
  date,
  timestamp,
  serial,
  index,
  uniqueIndex,
  check,
  foreignKey,
} from 'drizzle-orm/pg-core';

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/** Montos monetarios ARS: numeric(12,2) mapeado a number en TS. */
const money = (name: string) => numeric(name, { precision: 12, scale: 2, mode: 'number' });

/** Fecha de negocio sin hora (YYYY-MM-DD) â€” inmune a corrimientos de TZ. */
const businessDate = (name: string) => date(name, { mode: 'string' });

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Enums â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export const userRoleEnum = pgEnum('user_role', ['ADMIN', 'PROFESOR', 'ALUMNO']);
export const studentStatusEnum = pgEnum('student_status', ['ACTIVO', 'INACTIVO', 'SUSPENDIDO']);
export const durationUnitEnum = pgEnum('duration_unit', ['DIA', 'MES']);
export const paymentMethodEnum = pgEnum('payment_method', [
  'EFECTIVO',
  'TRANSFERENCIA',
  'DEBITO',
  'CREDITO',
  'MERCADO_PAGO',
]);
export const recordStatusEnum = pgEnum('record_status', ['COMPLETADO', 'ANULADO']);
export const transactionTypeEnum = pgEnum('transaction_type', ['INGRESO', 'EGRESO']);
export const dayOfWeekEnum = pgEnum('day_of_week', [
  'LUNES',
  'MARTES',
  'MIERCOLES',
  'JUEVES',
  'VIERNES',
  'SABADO',
  'DOMINGO',
]);
export const reminderTypeEnum = pgEnum('reminder_type', [
  'POR_VENCER',
  'VENCIDA',
  'RECIBO_PAGO',
]);
export const reminderChannelEnum = pgEnum('reminder_channel', ['WHATSAPP', 'EMAIL']);
export const muscleGroupEnum = pgEnum('muscle_group', [
  'PECHO',
  'ESPALDA',
  'HOMBROS',
  'BICEPS',
  'TRICEPS',
  'ANTEBRAZOS',
  'CUADRICEPS',
  'ISQUIOTIBIALES',
  'GLUTEOS',
  'PANTORRILLAS',
  'ABDOMEN',
  'CARDIO',
  'CUERPO_COMPLETO',
  'MOVILIDAD',
]);
export const routineGoalEnum = pgEnum('routine_goal', [
  'HIPERTROFIA',
  'FUERZA',
  'RESISTENCIA',
  'PERDIDA_GRASA',
  'MOVILIDAD',
  'GENERAL',
]);
export const routineLevelEnum = pgEnum('routine_level', ['PRINCIPIANTE', 'INTERMEDIO', 'AVANZADO']);
export const stockMovementTypeEnum = pgEnum('stock_movement_type', [
  'COMPRA',
  'VENTA',
  'AJUSTE',
  'DEVOLUCION',
  'ANULACION_VENTA',
]);

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• MÃ“DULO 6 Â· Usuarios y ConfiguraciÃ³n â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    fullName: varchar('full_name', { length: 150 }).notNull(),
    role: userRoleEnum('role').notNull().default('ALUMNO'),
    avatarUrl: varchar('avatar_url', { length: 500 }),
    isActive: boolean('is_active').notNull().default(true),
    /** Se incrementa para invalidar todos los JWT emitidos (logout global / cambio de rol). */
    tokenVersion: integer('token_version').notNull().default(0),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('users_email_lower_unique').on(sql`lower(${t.email})`),
    index('users_role_idx').on(t.role),
  ],
);

/** Fila Ãºnica (id = 1) con datos del gimnasio para comprobantes PDF y reglas de negocio. */
export const gymSettings = pgTable(
  'gym_settings',
  {
    id: smallint('id').primaryKey().default(1),
    gymName: varchar('gym_name', { length: 150 })
      .notNull()
      .default('Centro de Entrenamiento Feltrin'),
    legalName: varchar('legal_name', { length: 150 }),
    taxId: varchar('tax_id', { length: 20 }), // CUIT
    address: varchar('address', { length: 255 }),
    phone: varchar('phone', { length: 30 }),
    email: varchar('email', { length: 255 }),
    logoUrl: varchar('logo_url', { length: 500 }),
    timezone: varchar('timezone', { length: 64 })
      .notNull()
      .default('America/Argentina/Buenos_Aires'),
    /** DÃ­as de tolerancia tras el vencimiento en los que la renovaciÃ³n mantiene la continuidad. */
    gracePeriodDays: smallint('grace_period_days').notNull().default(3),
    /** Desde cuÃ¡ntos dÃ­as antes se muestra la alerta "Vence en X dÃ­as". */
    expiryWarningDays: smallint('expiry_warning_days').notNull().default(5),
    receiptFooter: text('receipt_footer'),
    waTemplateExpiring: text('wa_template_expiring')
      .notNull()
      .default(
        '¡Hola {nombre}! Te recordamos desde {gimnasio} que tu cuota de {plan} vence el {fecha_vencimiento}. ¡Te esperamos para renovar!',
      ),
    waTemplateExpired: text('wa_template_expired')
      .notNull()
      .default(
        'Hola {nombre}, te recordamos desde {gimnasio} que tu cuota de {plan} venció el {fecha_vencimiento}. Podés acercarte a recepción o transferir para regularizarla.',
      ),
    waTemplateReceipt: text('wa_template_receipt')
      .notNull()
      .default(
        '¡Hola {nombre}! Registramos con éxito tu pago de ${monto} por el plan {plan} en {gimnasio}. Tu membresía está activa hasta el {fecha_vencimiento}. ¡Gracias por entrenar con nosotros!',
      ),
    updatedAt: timestamps.updatedAt,
  },
  (t) => [
    check('gym_settings_singleton', sql`${t.id} = 1`),
    check('gym_settings_days_chk', sql`${t.gracePeriodDays} >= 0 AND ${t.expiryWarningDays} >= 0`),
  ],
);

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• MÃ“DULO 2 Â· Alumnos y Mensualidades â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

export const membershipPlans = pgTable(
  'membership_plans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    price: money('price').notNull(),
    durationValue: smallint('duration_value').notNull().default(1),
    durationUnit: durationUnitEnum('duration_unit').notNull().default('MES'),
    /** null = pase libre. */
    sessionsPerWeek: smallint('sessions_per_week'),
    isActive: boolean('is_active').notNull().default(true),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('membership_plans_name_unique').on(t.name),
    check('membership_plans_price_chk', sql`${t.price} >= 0`),
    check('membership_plans_duration_chk', sql`${t.durationValue} > 0`),
    check(
      'membership_plans_sessions_chk',
      sql`${t.sessionsPerWeek} IS NULL OR ${t.sessionsPerWeek} BETWEEN 1 AND 7`,
    ),
  ],
);

export const students = pgTable(
  'students',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    firstName: varchar('first_name', { length: 80 }).notNull(),
    lastName: varchar('last_name', { length: 80 }).notNull(),
    dni: varchar('dni', { length: 20 }).notNull(),
    email: varchar('email', { length: 255 }),
    phone: varchar('phone', { length: 30 }),
    birthDate: businessDate('birth_date'),
    address: varchar('address', { length: 255 }),
    emergencyContactName: varchar('emergency_contact_name', { length: 150 }),
    emergencyContactPhone: varchar('emergency_contact_phone', { length: 30 }),
    medicalNotes: text('medical_notes'),
    photoUrl: varchar('photo_url', { length: 500 }), // WebP procesado con sharp
    status: studentStatusEnum('status').notNull().default('ACTIVO'),
    currentPlanId: uuid('current_plan_id').references(() => membershipPlans.id, {
      onDelete: 'restrict',
    }),
    assignedTrainerId: uuid('assigned_trainer_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    joinedAt: businessDate('joined_at').notNull().default(sql`CURRENT_DATE`),
    /** CachÃ© desnormalizado: fecha de vencimiento vigente (fuente de verdad: membership_payments). */
    membershipExpiresAt: businessDate('membership_expires_at'),
    lastPaymentAt: timestamp('last_payment_at', { withTimezone: true }),
    notes: text('notes'),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('students_dni_unique').on(t.dni),
    uniqueIndex('students_user_id_unique').on(t.userId),
    index('students_expires_idx').on(t.membershipExpiresAt),
    index('students_status_idx').on(t.status),
    index('students_name_idx').on(t.lastName, t.firstName),
    index('students_trainer_idx').on(t.assignedTrainerId),
  ],
);

export const membershipPayments = pgTable(
  'membership_payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    receiptNumber: serial('receipt_number').notNull(),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'restrict' }),
    planId: uuid('plan_id')
      .notNull()
      .references(() => membershipPlans.id, { onDelete: 'restrict' }),
    /** Snapshots: el comprobante no cambia si luego se edita el plan. */
    planNameSnapshot: varchar('plan_name_snapshot', { length: 100 }).notNull(),
    listPrice: money('list_price').notNull(),
    discount: money('discount').notNull().default(sql`'0'`),
    amount: money('amount').notNull(),
    periodStart: businessDate('period_start').notNull(),
    periodEnd: businessDate('period_end').notNull(),
    paymentMethod: paymentMethodEnum('payment_method').notNull(),
    status: recordStatusEnum('status').notNull().default('COMPLETADO'),
    paidAt: timestamp('paid_at', { withTimezone: true }).notNull().defaultNow(),
    notes: text('notes'),
    registeredById: uuid('registered_by_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    voidedAt: timestamp('voided_at', { withTimezone: true }),
    voidedById: uuid('voided_by_id').references(() => users.id, { onDelete: 'restrict' }),
    voidReason: varchar('void_reason', { length: 255 }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('membership_payments_receipt_unique').on(t.receiptNumber),
    index('membership_payments_student_idx').on(t.studentId, t.periodEnd),
    index('membership_payments_paid_at_idx').on(t.paidAt),
    check('membership_payments_amount_chk', sql`${t.amount} = ${t.listPrice} - ${t.discount}`),
    check(
      'membership_payments_discount_chk',
      sql`${t.discount} >= 0 AND ${t.discount} <= ${t.listPrice}`,
    ),
    check('membership_payments_period_chk', sql`${t.periodEnd} > ${t.periodStart}`),
  ],
);

export const membershipReminders = pgTable(
  'membership_reminders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    type: reminderTypeEnum('type').notNull(),
    channel: reminderChannelEnum('channel').notNull().default('WHATSAPP'),
    recipientPhone: varchar('recipient_phone', { length: 30 }).notNull(),
    message: text('message').notNull(),
    membershipExpiresAtSnapshot: businessDate('membership_expires_at_snapshot'),
    sentById: uuid('sent_by_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    sentAt: timestamp('sent_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('membership_reminders_student_idx').on(t.studentId),
    index('membership_reminders_sent_at_idx').on(t.sentAt),
    index('membership_reminders_type_idx').on(t.type, t.sentAt),
  ],
);

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• MÃ“DULO 5 Â· Inventario y Ventas â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

export const productCategories = pgTable(
  'product_categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 80 }).notNull(),
    description: text('description'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamps.createdAt,
  },
  (t) => [uniqueIndex('product_categories_name_unique').on(t.name)],
);

export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sku: varchar('sku', { length: 50 }).notNull(),
    name: varchar('name', { length: 150 }).notNull(),
    description: text('description'),
    categoryId: uuid('category_id').references(() => productCategories.id, {
      onDelete: 'set null',
    }),
    imageUrl: varchar('image_url', { length: 500 }), // WebP procesado con sharp
    costPrice: money('cost_price').notNull().default(sql`'0'`),
    salePrice: money('sale_price').notNull(),
    /** CachÃ© del stock actual (fuente de verdad: stock_movements). */
    stock: integer('stock').notNull().default(0),
    minStock: integer('min_stock').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('products_sku_unique').on(t.sku),
    index('products_category_idx').on(t.categoryId),
    check('products_stock_chk', sql`${t.stock} >= 0`),
    check('products_min_stock_chk', sql`${t.minStock} >= 0`),
    check('products_prices_chk', sql`${t.costPrice} >= 0 AND ${t.salePrice} >= 0`),
  ],
);

export const sales = pgTable(
  'sales',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    saleNumber: serial('sale_number').notNull(),
    /** Opcional: venta a un alumno registrado o a consumidor final. */
    studentId: uuid('student_id').references(() => students.id, { onDelete: 'set null' }),
    customerName: varchar('customer_name', { length: 150 }),
    total: money('total').notNull(),
    paymentMethod: paymentMethodEnum('payment_method').notNull(),
    status: recordStatusEnum('status').notNull().default('COMPLETADO'),
    soldAt: timestamp('sold_at', { withTimezone: true }).notNull().defaultNow(),
    soldById: uuid('sold_by_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    notes: text('notes'),
    voidedAt: timestamp('voided_at', { withTimezone: true }),
    voidReason: varchar('void_reason', { length: 255 }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('sales_number_unique').on(t.saleNumber),
    index('sales_sold_at_idx').on(t.soldAt),
    check('sales_total_chk', sql`${t.total} >= 0`),
  ],
);

export const saleItems = pgTable(
  'sale_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    saleId: uuid('sale_id')
      .notNull()
      .references(() => sales.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),
    productNameSnapshot: varchar('product_name_snapshot', { length: 150 }).notNull(),
    quantity: integer('quantity').notNull(),
    unitPrice: money('unit_price').notNull(),
    subtotal: money('subtotal').notNull(),
  },
  (t) => [
    index('sale_items_sale_idx').on(t.saleId),
    check('sale_items_quantity_chk', sql`${t.quantity} > 0`),
    check('sale_items_subtotal_chk', sql`${t.subtotal} = ${t.quantity} * ${t.unitPrice}`),
  ],
);

export const stockMovements = pgTable(
  'stock_movements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),
    type: stockMovementTypeEnum('type').notNull(),
    /** Con signo: positivo = entra stock, negativo = sale stock. */
    quantity: integer('quantity').notNull(),
    stockAfter: integer('stock_after').notNull(),
    unitCost: money('unit_cost'),
    saleId: uuid('sale_id').references(() => sales.id, { onDelete: 'set null' }),
    reason: varchar('reason', { length: 255 }),
    createdById: uuid('created_by_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    createdAt: timestamps.createdAt,
  },
  (t) => [
    index('stock_movements_product_idx').on(t.productId, t.createdAt),
    check('stock_movements_quantity_chk', sql`${t.quantity} <> 0`),
  ],
);

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• MÃ“DULO 4 Â· Finanzas (Caja) â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

export const financeCategories = pgTable(
  'finance_categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull(),
    type: transactionTypeEnum('type').notNull(),
    /** CategorÃ­as de sistema protegidas (no editables): 'CUOTAS', 'VENTAS'. */
    systemKey: varchar('system_key', { length: 40 }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamps.createdAt,
  },
  (t) => [
    uniqueIndex('finance_categories_name_type_unique').on(t.name, t.type),
    uniqueIndex('finance_categories_system_key_unique').on(t.systemKey),
  ],
);

export const financialTransactions = pgTable(
  'financial_transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    type: transactionTypeEnum('type').notNull(),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => financeCategories.id, { onDelete: 'restrict' }),
    amount: money('amount').notNull(),
    paymentMethod: paymentMethodEnum('payment_method').notNull(),
    description: varchar('description', { length: 255 }).notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
    /** Origen automÃ¡tico (mÃ¡ximo uno). Null en ambos = movimiento manual (gasto, ingreso varios). */
    membershipPaymentId: uuid('membership_payment_id'),
    saleId: uuid('sale_id').references(() => sales.id, { onDelete: 'restrict' }),
    /** Foto del comprobante del gasto (WebP). */
    receiptImageUrl: varchar('receipt_image_url', { length: 500 }),
    status: recordStatusEnum('status').notNull().default('COMPLETADO'),
    registeredById: uuid('registered_by_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    voidedAt: timestamp('voided_at', { withTimezone: true }),
    voidReason: varchar('void_reason', { length: 255 }),
    ...timestamps,
  },
  (t) => [
    /** Nombre explÃ­cito: el autogenerado supera los 63 caracteres de Postgres. */
    foreignKey({
      name: 'fin_tx_membership_payment_fk',
      columns: [t.membershipPaymentId],
      foreignColumns: [membershipPayments.id],
    }).onDelete('restrict'),
    index('fin_tx_occurred_idx').on(t.occurredAt),
    index('fin_tx_type_status_idx').on(t.type, t.status, t.occurredAt),
    index('fin_tx_category_idx').on(t.categoryId),
    uniqueIndex('fin_tx_membership_payment_unique').on(t.membershipPaymentId),
    uniqueIndex('fin_tx_sale_unique').on(t.saleId),
    check('fin_tx_amount_chk', sql`${t.amount} > 0`),
    check('fin_tx_single_source_chk', sql`${t.membershipPaymentId} IS NULL OR ${t.saleId} IS NULL`),
  ],
);

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• MÃ“DULO 3 Â· Planes de Entrenamiento â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

export const exercises = pgTable(
  'exercises',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 120 }).notNull(),
    muscleGroup: muscleGroupEnum('muscle_group').notNull(),
    equipment: varchar('equipment', { length: 80 }),
    description: text('description'),
    videoUrl: varchar('video_url', { length: 500 }),
    imageUrl: varchar('image_url', { length: 500 }),
    isActive: boolean('is_active').notNull().default(true),
    createdById: uuid('created_by_id').references(() => users.id, { onDelete: 'set null' }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('exercises_name_lower_unique').on(sql`lower(${t.name})`),
    index('exercises_muscle_group_idx').on(t.muscleGroup),
  ],
);

export const routines = pgTable(
  'routines',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 120 }).notNull(),
    description: text('description'),
    goal: routineGoalEnum('goal').notNull().default('GENERAL'),
    level: routineLevelEnum('level').notNull().default('PRINCIPIANTE'),
    /** true = plantilla reutilizable Â· false = copia personalizada de un alumno. */
    isTemplate: boolean('is_template').notNull().default(true),
    /** Plantilla de la que se clonÃ³ (trazabilidad). */
    sourceRoutineId: uuid('source_routine_id'),
    createdById: uuid('created_by_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    isActive: boolean('is_active').notNull().default(true),
    ...timestamps,
  },
  (t) => [
    index('routines_template_idx').on(t.isTemplate, t.isActive),
    index('routines_created_by_idx').on(t.createdById),
  ],
);

export const routineDays = pgTable(
  'routine_days',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    routineId: uuid('routine_id')
      .notNull()
      .references(() => routines.id, { onDelete: 'cascade' }),
    dayOfWeek: dayOfWeekEnum('day_of_week').notNull(),
    title: varchar('title', { length: 120 }).notNull(), // ej. "Pecho y TrÃ­ceps"
    notes: text('notes'),
  },
  (t) => [uniqueIndex('routine_days_routine_day_unique').on(t.routineId, t.dayOfWeek)],
);

export const routineExercises = pgTable(
  'routine_exercises',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    routineDayId: uuid('routine_day_id')
      .notNull()
      .references(() => routineDays.id, { onDelete: 'cascade' }),
    exerciseId: uuid('exercise_id')
      .notNull()
      .references(() => exercises.id, { onDelete: 'restrict' }),
    position: smallint('position').notNull(),
    sets: smallint('sets').notNull(),
    reps: varchar('reps', { length: 30 }).notNull(), // "10", "8-12", "AMRAP", "45s"
    load: varchar('load', { length: 40 }), // "20 kg", "RPE 8", "70% 1RM"
    restSeconds: smallint('rest_seconds'),
    tempo: varchar('tempo', { length: 20 }), // "3-1-1-0"
    /** Ejercicios con el mismo nÃºmero dentro del dÃ­a forman una superserie. */
    supersetGroup: smallint('superset_group'),
    notes: text('notes'),
  },
  (t) => [
    index('routine_exercises_day_idx').on(t.routineDayId, t.position),
    check('routine_exercises_sets_chk', sql`${t.sets} > 0`),
  ],
);

export const studentRoutines = pgTable(
  'student_routines',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    routineId: uuid('routine_id')
      .notNull()
      .references(() => routines.id, { onDelete: 'restrict' }),
    assignedById: uuid('assigned_by_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    startDate: businessDate('start_date').notNull().default(sql`CURRENT_DATE`),
    endDate: businessDate('end_date'),
    isActive: boolean('is_active').notNull().default(true),
    notes: text('notes'),
    createdAt: timestamps.createdAt,
  },
  (t) => [
    /** Un alumno tiene como mÃ¡ximo UNA rutina activa. */
    uniqueIndex('student_routines_one_active_unique')
      .on(t.studentId)
      .where(sql`${t.isActive} = true`),
    index('student_routines_routine_idx').on(t.routineId),
  ],
);

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Relations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export const usersRelations = relations(users, ({ one, many }) => ({
  studentProfile: one(students, {
    fields: [users.id],
    references: [students.userId],
    relationName: 'studentUser',
  }),
  trainees: many(students, { relationName: 'trainer' }),
}));

export const gymSettingsRelations = relations(gymSettings, () => ({}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  user: one(users, {
    fields: [students.userId],
    references: [users.id],
    relationName: 'studentUser',
  }),
  trainer: one(users, {
    fields: [students.assignedTrainerId],
    references: [users.id],
    relationName: 'trainer',
  }),
  currentPlan: one(membershipPlans, {
    fields: [students.currentPlanId],
    references: [membershipPlans.id],
  }),
  payments: many(membershipPayments),
  routines: many(studentRoutines),
  purchases: many(sales),
  reminders: many(membershipReminders),
}));

export const membershipPlansRelations = relations(membershipPlans, ({ many }) => ({
  students: many(students),
  payments: many(membershipPayments),
}));

export const membershipPaymentsRelations = relations(membershipPayments, ({ one }) => ({
  student: one(students, {
    fields: [membershipPayments.studentId],
    references: [students.id],
  }),
  plan: one(membershipPlans, {
    fields: [membershipPayments.planId],
    references: [membershipPlans.id],
  }),
  registeredBy: one(users, {
    fields: [membershipPayments.registeredById],
    references: [users.id],
  }),
}));

export const membershipRemindersRelations = relations(membershipReminders, ({ one }) => ({
  student: one(students, {
    fields: [membershipReminders.studentId],
    references: [students.id],
  }),
  sentBy: one(users, {
    fields: [membershipReminders.sentById],
    references: [users.id],
  }),
}));

export const productCategoriesRelations = relations(productCategories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(productCategories, {
    fields: [products.categoryId],
    references: [productCategories.id],
  }),
  movements: many(stockMovements),
  saleItems: many(saleItems),
}));

export const salesRelations = relations(sales, ({ one, many }) => ({
  student: one(students, { fields: [sales.studentId], references: [students.id] }),
  soldBy: one(users, { fields: [sales.soldById], references: [users.id] }),
  items: many(saleItems),
}));

export const saleItemsRelations = relations(saleItems, ({ one }) => ({
  sale: one(sales, { fields: [saleItems.saleId], references: [sales.id] }),
  product: one(products, { fields: [saleItems.productId], references: [products.id] }),
}));

export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
  product: one(products, { fields: [stockMovements.productId], references: [products.id] }),
  createdBy: one(users, { fields: [stockMovements.createdById], references: [users.id] }),
}));

export const financeCategoriesRelations = relations(financeCategories, ({ many }) => ({
  transactions: many(financialTransactions),
}));

export const financialTransactionsRelations = relations(financialTransactions, ({ one }) => ({
  category: one(financeCategories, {
    fields: [financialTransactions.categoryId],
    references: [financeCategories.id],
  }),
  membershipPayment: one(membershipPayments, {
    fields: [financialTransactions.membershipPaymentId],
    references: [membershipPayments.id],
  }),
  sale: one(sales, { fields: [financialTransactions.saleId], references: [sales.id] }),
  registeredBy: one(users, {
    fields: [financialTransactions.registeredById],
    references: [users.id],
  }),
}));

export const exercisesRelations = relations(exercises, ({ many }) => ({
  usages: many(routineExercises),
}));

export const routinesRelations = relations(routines, ({ one, many }) => ({
  createdBy: one(users, { fields: [routines.createdById], references: [users.id] }),
  days: many(routineDays),
  assignments: many(studentRoutines),
}));

export const routineDaysRelations = relations(routineDays, ({ one, many }) => ({
  routine: one(routines, { fields: [routineDays.routineId], references: [routines.id] }),
  exercises: many(routineExercises),
}));

export const routineExercisesRelations = relations(routineExercises, ({ one }) => ({
  day: one(routineDays, {
    fields: [routineExercises.routineDayId],
    references: [routineDays.id],
  }),
  exercise: one(exercises, {
    fields: [routineExercises.exerciseId],
    references: [exercises.id],
  }),
}));

export const studentRoutinesRelations = relations(studentRoutines, ({ one }) => ({
  student: one(students, { fields: [studentRoutines.studentId], references: [students.id] }),
  routine: one(routines, { fields: [studentRoutines.routineId], references: [routines.id] }),
  assignedBy: one(users, { fields: [studentRoutines.assignedById], references: [users.id] }),
}));

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Tipos inferidos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type StudentStatus = (typeof studentStatusEnum.enumValues)[number];
export type DurationUnit = (typeof durationUnitEnum.enumValues)[number];
export type PaymentMethod = (typeof paymentMethodEnum.enumValues)[number];
export type TransactionType = (typeof transactionTypeEnum.enumValues)[number];
export type DayOfWeek = (typeof dayOfWeekEnum.enumValues)[number];
export type MuscleGroup = (typeof muscleGroupEnum.enumValues)[number];
export type RoutineGoal = (typeof routineGoalEnum.enumValues)[number];
export type RoutineLevel = (typeof routineLevelEnum.enumValues)[number];
export type StockMovementType = (typeof stockMovementTypeEnum.enumValues)[number];

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type GymSettings = typeof gymSettings.$inferSelect;
export type Student = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;
export type MembershipPlan = typeof membershipPlans.$inferSelect;
export type NewMembershipPlan = typeof membershipPlans.$inferInsert;
export type MembershipPayment = typeof membershipPayments.$inferSelect;
export type ProductCategory = typeof productCategories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Sale = typeof sales.$inferSelect;
export type SaleItem = typeof saleItems.$inferSelect;
export type StockMovement = typeof stockMovements.$inferSelect;
export type FinanceCategory = typeof financeCategories.$inferSelect;
export type FinancialTransaction = typeof financialTransactions.$inferSelect;
export type Exercise = typeof exercises.$inferSelect;
export type Routine = typeof routines.$inferSelect;
export type RoutineDay = typeof routineDays.$inferSelect;
export type RoutineExercise = typeof routineExercises.$inferSelect;
export type StudentRoutine = typeof studentRoutines.$inferSelect;
export type MembershipReminder = typeof membershipReminders.$inferSelect;
export type NewMembershipReminder = typeof membershipReminders.$inferInsert;
export type ReminderType = (typeof reminderTypeEnum.enumValues)[number];
export type ReminderChannel = (typeof reminderChannelEnum.enumValues)[number];

