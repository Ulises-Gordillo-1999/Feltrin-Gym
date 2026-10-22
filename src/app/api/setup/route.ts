import { NextResponse } from 'next/server';
import { client, db } from '@/db';
import { users, gymSettings, financeCategories, productCategories, membershipPlans, exercises } from '@/db/schema';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

const DDL_STATEMENTS = [
  // Types
  `DO $$ BEGIN CREATE TYPE "public"."day_of_week" AS ENUM('LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN CREATE TYPE "public"."duration_unit" AS ENUM('DIA', 'MES'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN CREATE TYPE "public"."muscle_group" AS ENUM('PECHO', 'ESPALDA', 'HOMBROS', 'BICEPS', 'TRICEPS', 'ANTEBRAZOS', 'CUADRICEPS', 'ISQUIOTIBIALES', 'GLUTEOS', 'PANTORRILLAS', 'ABDOMEN', 'CARDIO', 'CUERPO_COMPLETO', 'MOVILIDAD'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN CREATE TYPE "public"."payment_method" AS ENUM('EFECTIVO', 'TRANSFERENCIA', 'DEBITO', 'CREDITO', 'MERCADO_PAGO'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN CREATE TYPE "public"."record_status" AS ENUM('COMPLETADO', 'ANULADO'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN CREATE TYPE "public"."reminder_channel" AS ENUM('WHATSAPP', 'EMAIL'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN CREATE TYPE "public"."reminder_type" AS ENUM('POR_VENCER', 'VENCIDA', 'RECIBO_PAGO'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN CREATE TYPE "public"."routine_goal" AS ENUM('HIPERTROFIA', 'FUERZA', 'RESISTENCIA', 'PERDIDA_GRASA', 'MOVILIDAD', 'GENERAL'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN CREATE TYPE "public"."routine_level" AS ENUM('PRINCIPIANTE', 'INTERMEDIO', 'AVANZADO'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN CREATE TYPE "public"."stock_movement_type" AS ENUM('COMPRA', 'VENTA', 'AJUSTE', 'DEVOLUCION', 'ANULACION_VENTA'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN CREATE TYPE "public"."student_status" AS ENUM('ACTIVO', 'INACTIVO', 'SUSPENDIDO'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN CREATE TYPE "public"."transaction_type" AS ENUM('INGRESO', 'EGRESO'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN CREATE TYPE "public"."user_role" AS ENUM('ADMIN', 'PROFESOR', 'ALUMNO'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,

  // Tables
  `CREATE TABLE IF NOT EXISTS "users" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "email" varchar(255) NOT NULL,
    "password_hash" varchar(255) NOT NULL,
    "full_name" varchar(150) NOT NULL,
    "role" "user_role" DEFAULT 'ALUMNO' NOT NULL,
    "avatar_url" varchar(500),
    "is_active" boolean DEFAULT true NOT NULL,
    "token_version" integer DEFAULT 0 NOT NULL,
    "last_login_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS "gym_settings" (
    "id" smallint PRIMARY KEY DEFAULT 1 NOT NULL,
    "gym_name" varchar(150) DEFAULT 'Centro de Entrenamiento Feltrin' NOT NULL,
    "legal_name" varchar(150),
    "tax_id" varchar(20),
    "address" varchar(255),
    "phone" varchar(30),
    "email" varchar(255),
    "logo_url" varchar(500),
    "timezone" varchar(64) DEFAULT 'America/Argentina/Buenos_Aires' NOT NULL,
    "grace_period_days" smallint DEFAULT 3 NOT NULL,
    "expiry_warning_days" smallint DEFAULT 5 NOT NULL,
    "receipt_footer" text,
    "wa_template_expiring" text DEFAULT '¡Hola {nombre}! Te recordamos desde {gimnasio} que tu cuota de {plan} vence el {fecha_vencimiento}. ¡Te esperamos para renovar!' NOT NULL,
    "wa_template_expired" text DEFAULT 'Hola {nombre}, te recordamos desde {gimnasio} que tu cuota de {plan} venció el {fecha_vencimiento}. Podés acercarte a recepción o transferir para regularizarla.' NOT NULL,
    "wa_template_receipt" text DEFAULT '¡Hola {nombre}! Registramos con éxito tu pago de \${monto} por el plan {plan} en {gimnasio}. Tu membresía está activa hasta el {fecha_vencimiento}. ¡Gracias por entrenar con nosotros!' NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "gym_settings_singleton" CHECK ("gym_settings"."id" = 1),
    CONSTRAINT "gym_settings_days_chk" CHECK ("gym_settings"."grace_period_days" >= 0 AND "gym_settings"."expiry_warning_days" >= 0)
  );`,

  `CREATE TABLE IF NOT EXISTS "finance_categories" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "name" varchar(100) NOT NULL,
    "type" "transaction_type" NOT NULL,
    "system_key" varchar(40),
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS "product_categories" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "name" varchar(80) NOT NULL,
    "description" text,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS "membership_plans" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "name" varchar(100) NOT NULL,
    "description" text,
    "price" numeric(12, 2) NOT NULL,
    "duration_value" smallint DEFAULT 1 NOT NULL,
    "duration_unit" "duration_unit" DEFAULT 'MES' NOT NULL,
    "sessions_per_week" smallint,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "membership_plans_price_chk" CHECK ("membership_plans"."price" >= 0),
    CONSTRAINT "membership_plans_duration_chk" CHECK ("membership_plans"."duration_value" > 0),
    CONSTRAINT "membership_plans_sessions_chk" CHECK ("membership_plans"."sessions_per_week" IS NULL OR "membership_plans"."sessions_per_week" BETWEEN 1 AND 7)
  );`,

  `CREATE TABLE IF NOT EXISTS "exercises" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "name" varchar(120) NOT NULL,
    "muscle_group" "muscle_group" NOT NULL,
    "equipment" varchar(80),
    "description" text,
    "video_url" varchar(500),
    "image_url" varchar(500),
    "is_active" boolean DEFAULT true NOT NULL,
    "created_by_id" uuid REFERENCES "public"."users"("id") ON DELETE set null,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS "products" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "sku" varchar(50) NOT NULL,
    "name" varchar(150) NOT NULL,
    "description" text,
    "category_id" uuid REFERENCES "public"."product_categories"("id") ON DELETE set null,
    "image_url" varchar(500),
    "cost_price" numeric(12, 2) DEFAULT '0' NOT NULL,
    "sale_price" numeric(12, 2) NOT NULL,
    "stock" integer DEFAULT 0 NOT NULL,
    "min_stock" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "products_stock_chk" CHECK ("products"."stock" >= 0),
    CONSTRAINT "products_min_stock_chk" CHECK ("products"."min_stock" >= 0),
    CONSTRAINT "products_prices_chk" CHECK ("products"."cost_price" >= 0 AND "products"."sale_price" >= 0)
  );`,

  `CREATE TABLE IF NOT EXISTS "students" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid REFERENCES "public"."users"("id") ON DELETE set null,
    "first_name" varchar(80) NOT NULL,
    "last_name" varchar(80) NOT NULL,
    "dni" varchar(20) NOT NULL,
    "email" varchar(255),
    "phone" varchar(30),
    "birth_date" date,
    "address" varchar(255),
    "emergency_contact_name" varchar(150),
    "emergency_contact_phone" varchar(30),
    "medical_notes" text,
    "photo_url" varchar(500),
    "status" "student_status" DEFAULT 'ACTIVO' NOT NULL,
    "current_plan_id" uuid REFERENCES "public"."membership_plans"("id") ON DELETE restrict,
    "assigned_trainer_id" uuid REFERENCES "public"."users"("id") ON DELETE set null,
    "joined_at" date DEFAULT CURRENT_DATE NOT NULL,
    "membership_expires_at" date,
    "last_payment_at" timestamp with time zone,
    "notes" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS "membership_payments" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "receipt_number" serial NOT NULL,
    "student_id" uuid NOT NULL REFERENCES "public"."students"("id") ON DELETE restrict,
    "plan_id" uuid NOT NULL REFERENCES "public"."membership_plans"("id") ON DELETE restrict,
    "plan_name_snapshot" varchar(100) NOT NULL,
    "list_price" numeric(12, 2) NOT NULL,
    "discount" numeric(12, 2) DEFAULT '0' NOT NULL,
    "amount" numeric(12, 2) NOT NULL,
    "period_start" date NOT NULL,
    "period_end" date NOT NULL,
    "payment_method" "payment_method" NOT NULL,
    "status" "record_status" DEFAULT 'COMPLETADO' NOT NULL,
    "paid_at" timestamp with time zone DEFAULT now() NOT NULL,
    "notes" text,
    "registered_by_id" uuid NOT NULL REFERENCES "public"."users"("id") ON DELETE restrict,
    "voided_at" timestamp with time zone,
    "voided_by_id" uuid REFERENCES "public"."users"("id") ON DELETE restrict,
    "void_reason" varchar(255),
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "membership_payments_amount_chk" CHECK ("membership_payments"."amount" = "membership_payments"."list_price" - "membership_payments"."discount"),
    CONSTRAINT "membership_payments_discount_chk" CHECK ("membership_payments"."discount" >= 0 AND "membership_payments"."discount" <= "membership_payments"."list_price"),
    CONSTRAINT "membership_payments_period_chk" CHECK ("membership_payments"."period_end" > "membership_payments"."period_start")
  );`,

  `CREATE TABLE IF NOT EXISTS "membership_reminders" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "student_id" uuid NOT NULL REFERENCES "public"."students"("id") ON DELETE cascade,
    "type" "reminder_type" NOT NULL,
    "channel" "reminder_channel" DEFAULT 'WHATSAPP' NOT NULL,
    "recipient_phone" varchar(30) NOT NULL,
    "message" text NOT NULL,
    "membership_expires_at_snapshot" date,
    "sent_by_id" uuid NOT NULL REFERENCES "public"."users"("id") ON DELETE restrict,
    "sent_at" timestamp with time zone DEFAULT now() NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS "sales" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "sale_number" serial NOT NULL,
    "student_id" uuid REFERENCES "public"."students"("id") ON DELETE set null,
    "customer_name" varchar(150),
    "total" numeric(12, 2) NOT NULL,
    "payment_method" "payment_method" NOT NULL,
    "status" "record_status" DEFAULT 'COMPLETADO' NOT NULL,
    "sold_at" timestamp with time zone DEFAULT now() NOT NULL,
    "sold_by_id" uuid NOT NULL REFERENCES "public"."users"("id") ON DELETE restrict,
    "notes" text,
    "voided_at" timestamp with time zone,
    "void_reason" varchar(255),
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "sales_total_chk" CHECK ("sales"."total" >= 0)
  );`,

  `CREATE TABLE IF NOT EXISTS "sale_items" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "sale_id" uuid NOT NULL REFERENCES "public"."sales"("id") ON DELETE cascade,
    "product_id" uuid NOT NULL REFERENCES "public"."products"("id") ON DELETE restrict,
    "product_name_snapshot" varchar(150) NOT NULL,
    "quantity" integer NOT NULL,
    "unit_price" numeric(12, 2) NOT NULL,
    "subtotal" numeric(12, 2) NOT NULL,
    CONSTRAINT "sale_items_quantity_chk" CHECK ("sale_items"."quantity" > 0),
    CONSTRAINT "sale_items_subtotal_chk" CHECK ("sale_items"."subtotal" = "sale_items"."quantity" * "sale_items"."unit_price")
  );`,

  `CREATE TABLE IF NOT EXISTS "stock_movements" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "product_id" uuid NOT NULL REFERENCES "public"."products"("id") ON DELETE restrict,
    "type" "stock_movement_type" NOT NULL,
    "quantity" integer NOT NULL,
    "stock_after" integer NOT NULL,
    "unit_cost" numeric(12, 2),
    "sale_id" uuid REFERENCES "public"."sales"("id") ON DELETE set null,
    "reason" varchar(255),
    "created_by_id" uuid NOT NULL REFERENCES "public"."users"("id") ON DELETE restrict,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "stock_movements_quantity_chk" CHECK ("stock_movements"."quantity" <> 0)
  );`,

  `CREATE TABLE IF NOT EXISTS "financial_transactions" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "type" "transaction_type" NOT NULL,
    "category_id" uuid NOT NULL REFERENCES "public"."finance_categories"("id") ON DELETE restrict,
    "amount" numeric(12, 2) NOT NULL,
    "payment_method" "payment_method" NOT NULL,
    "description" varchar(255) NOT NULL,
    "occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
    "membership_payment_id" uuid REFERENCES "public"."membership_payments"("id") ON DELETE restrict,
    "sale_id" uuid REFERENCES "public"."sales"("id") ON DELETE restrict,
    "receipt_image_url" varchar(500),
    "status" "record_status" DEFAULT 'COMPLETADO' NOT NULL,
    "registered_by_id" uuid NOT NULL REFERENCES "public"."users"("id") ON DELETE restrict,
    "voided_at" timestamp with time zone,
    "void_reason" varchar(255),
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "fin_tx_amount_chk" CHECK ("financial_transactions"."amount" > 0),
    CONSTRAINT "fin_tx_single_source_chk" CHECK ("financial_transactions"."membership_payment_id" IS NULL OR "financial_transactions"."sale_id" IS NULL)
  );`,

  `CREATE TABLE IF NOT EXISTS "routines" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "name" varchar(120) NOT NULL,
    "description" text,
    "goal" "routine_goal" DEFAULT 'GENERAL' NOT NULL,
    "level" "routine_level" DEFAULT 'PRINCIPIANTE' NOT NULL,
    "is_template" boolean DEFAULT true NOT NULL,
    "source_routine_id" uuid,
    "created_by_id" uuid NOT NULL REFERENCES "public"."users"("id") ON DELETE restrict,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS "routine_days" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "routine_id" uuid NOT NULL REFERENCES "public"."routines"("id") ON DELETE cascade,
    "day_of_week" "day_of_week" NOT NULL,
    "title" varchar(120) NOT NULL,
    "notes" text
  );`,

  `CREATE TABLE IF NOT EXISTS "routine_exercises" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "routine_day_id" uuid NOT NULL REFERENCES "public"."routine_days"("id") ON DELETE cascade,
    "exercise_id" uuid NOT NULL REFERENCES "public"."exercises"("id") ON DELETE restrict,
    "position" smallint NOT NULL,
    "sets" smallint NOT NULL,
    "reps" varchar(30) NOT NULL,
    "load" varchar(40),
    "rest_seconds" smallint,
    "tempo" varchar(20),
    "superset_group" smallint,
    "notes" text,
    CONSTRAINT "routine_exercises_sets_chk" CHECK ("routine_exercises"."sets" > 0)
  );`,

  `CREATE TABLE IF NOT EXISTS "student_routines" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "student_id" uuid NOT NULL REFERENCES "public"."students"("id") ON DELETE cascade,
    "routine_id" uuid NOT NULL REFERENCES "public"."routines"("id") ON DELETE restrict,
    "assigned_by_id" uuid NOT NULL REFERENCES "public"."users"("id") ON DELETE restrict,
    "start_date" date DEFAULT CURRENT_DATE NOT NULL,
    "end_date" date,
    "is_active" boolean DEFAULT true NOT NULL,
    "notes" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
  );`,

  // Unique indexes
  `CREATE UNIQUE INDEX IF NOT EXISTS "users_email_lower_unique" ON "users" (lower("email"));`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "students_dni_unique" ON "students" ("dni");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "finance_categories_system_key_unique" ON "finance_categories" ("system_key");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "product_categories_name_unique" ON "product_categories" ("name");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "membership_plans_name_unique" ON "membership_plans" ("name");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "products_sku_unique" ON "products" ("sku");`
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('key');

  if (secret !== 'feltrin_setup_2026' && secret !== process.env.JWT_SECRET) {
    return NextResponse.json({ error: 'No autorizado. Proporcioná ?key=...' }, { status: 401 });
  }

  try {
    // 1. Ejecutar DDL de tablas y tipos
    for (const sqlStatement of DDL_STATEMENTS) {
      await client.unsafe(sqlStatement);
    }

    // 2. Configuración institucional del gimnasio
    await db
      .insert(gymSettings)
      .values({
        id: 1,
        gymName: 'Centro de Entrenamiento Feltrin',
        legalName: 'Centro de Entrenamiento Feltrin S.R.L.',
        taxId: '30-71234567-8',
        address: 'Av. San Martín 1420, Buenos Aires',
        phone: '+54 11 4567-8900',
        email: 'contacto@feltrin-gym.com',
        timezone: 'America/Argentina/Buenos_Aires',
        gracePeriodDays: 3,
        expiryWarningDays: 5,
        receiptFooter: '¡Gracias por entrenar en Feltrin! Recordá presentar tu carnet o DNI al ingresar.',
      })
      .onConflictDoNothing();

    // 3. Categorías financieras
    await db
      .insert(financeCategories)
      .values([
        { name: 'Cuotas de Alumnos', type: 'INGRESO', systemKey: 'CUOTAS' },
        { name: 'Ventas de Mostrador', type: 'INGRESO', systemKey: 'VENTAS' },
        { name: 'Otros Ingresos', type: 'INGRESO', systemKey: null },
        { name: 'Alquiler del Local', type: 'EGRESO', systemKey: null },
        { name: 'Servicios (Luz, Agua, Gas, Internet)', type: 'EGRESO', systemKey: null },
        { name: 'Mantenimiento de Máquinas y Equipos', type: 'EGRESO', systemKey: null },
        { name: 'Sueldos y Honorarios', type: 'EGRESO', systemKey: null },
        { name: 'Compra de Insumos y Limpieza', type: 'EGRESO', systemKey: null },
        { name: 'Impuestos y Tasas', type: 'EGRESO', systemKey: null },
      ])
      .onConflictDoNothing();

    // 4. Categorías de productos
    await db
      .insert(productCategories)
      .values([
        { name: 'Suplementos', description: 'Proteínas, creatinas, aminoácidos y quemadores' },
        { name: 'Indumentaria', description: 'Remeras, calzas, shorts y buzos oficiales' },
        { name: 'Bebidas e Hidratación', description: 'Aguas, isotónicas y energizantes' },
        { name: 'Accesorios', description: 'Straps, muñequeras, cinturones y shakers' },
      ])
      .onConflictDoNothing();

    // 5. Planes de membresía
    await db
      .insert(membershipPlans)
      .values([
        {
          name: 'Pase Libre Musculación',
          description: 'Acceso ilimitado de lunes a sábados en todas las áreas de fuerza y cardio.',
          price: 35000,
          durationValue: 1,
          durationUnit: 'MES',
          sessionsPerWeek: null,
        },
        {
          name: '3 Días por Semana',
          description: 'Entrenamiento 3 días a elección por semana.',
          price: 28000,
          durationValue: 1,
          durationUnit: 'MES',
          sessionsPerWeek: 3,
        },
        {
          name: '2 Días por Semana',
          description: 'Ideal para complementación deportiva 2 veces por semana.',
          price: 22000,
          durationValue: 1,
          durationUnit: 'MES',
          sessionsPerWeek: 2,
        },
        {
          name: 'Pase Diario',
          description: 'Acceso por un día completo.',
          price: 4500,
          durationValue: 1,
          durationUnit: 'DIA',
          sessionsPerWeek: null,
        },
      ])
      .onConflictDoNothing();

    // 6. Biblioteca de ejercicios
    await db
      .insert(exercises)
      .values([
        { name: 'Press de Banca Plano con Barra', muscleGroup: 'PECHO', equipment: 'Barra Olímpica y Banco' },
        { name: 'Press Inclinado con Mancuernas', muscleGroup: 'PECHO', equipment: 'Mancuernas y Banco Regulable' },
        { name: 'Aperturas en Polea (Cruces)', muscleGroup: 'PECHO', equipment: 'Polea Doble Crossover' },
        { name: 'Dominadas Pronas', muscleGroup: 'ESPALDA', equipment: 'Barra de Dominadas' },
        { name: 'Remo con Barra Pendlay', muscleGroup: 'ESPALDA', equipment: 'Barra Olímpica' },
        { name: 'Jalón al Pecho en Polea Alta', muscleGroup: 'ESPALDA', equipment: 'Polea Alta' },
        { name: 'Sentadilla Trasera con Barra', muscleGroup: 'CUADRICEPS', equipment: 'Rack y Barra Olímpica' },
        { name: 'Prensa Inclinada 45°', muscleGroup: 'CUADRICEPS', equipment: 'Máquina Prensa 45°' },
        { name: 'Sillón de Cuádriceps (Extensiones)', muscleGroup: 'CUADRICEPS', equipment: 'Máquina Extensiones' },
        { name: 'Peso Muerto Rumano con Barra', muscleGroup: 'ISQUIOTIBIALES', equipment: 'Barra Olímpica' },
        { name: 'Camilla Femoral Tumbado', muscleGroup: 'ISQUIOTIBIALES', equipment: 'Máquina Camilla Femoral' },
        { name: 'Hip Thrust con Barra', muscleGroup: 'GLUTEOS', equipment: 'Banco y Barra' },
        { name: 'Press Militar de Pie con Barra', muscleGroup: 'HOMBROS', equipment: 'Barra Olímpica' },
        { name: 'Vuelos Laterales con Mancuernas', muscleGroup: 'HOMBROS', equipment: 'Mancuernas' },
        { name: 'Pájaros Posteriores en Máquina', muscleGroup: 'HOMBROS', equipment: 'Máquina Pec Deck Reversa' },
        { name: 'Curl de Bíceps con Barra Z', muscleGroup: 'BICEPS', equipment: 'Barra Z y Discos' },
        { name: 'Curl Martillo con Mancuernas', muscleGroup: 'BICEPS', equipment: 'Mancuernas' },
        { name: 'Press Francés con Mancuernas', muscleGroup: 'TRICEPS', equipment: 'Mancuernas y Banco' },
        { name: 'Extensiones de Tríceps en Polea Alta', muscleGroup: 'TRICEPS', equipment: 'Polea con Cuerda' },
        { name: 'Elevación de Talones de Pie', muscleGroup: 'PANTORRILLAS', equipment: 'Máquina Gemelos' },
        { name: 'Crunch Abdominal en Polea Alta', muscleGroup: 'ABDOMEN', equipment: 'Polea Alta con Cuerda' },
        { name: 'Plancha Abdominal Isométrica', muscleGroup: 'ABDOMEN', equipment: 'Colchoneta' },
      ])
      .onConflictDoNothing();

    // 7. Administrador Oficial
    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@feltrin.com';
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin1234!';
    const adminName = process.env.SEED_ADMIN_NAME || 'Administrador Feltrin';

    const existingAdmin = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.email, adminEmail),
    });

    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      await db.insert(users).values({
        email: adminEmail,
        fullName: adminName,
        passwordHash,
        role: 'ADMIN',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Base de datos inicializada con éxito y Administrador verificado.',
      admin: adminEmail,
    });
  } catch (error: unknown) {
    console.error('Error inicializando base de datos:', error);
    const errMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errMessage }, { status: 500 });
  }
}
