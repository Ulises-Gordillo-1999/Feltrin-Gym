CREATE TYPE "public"."day_of_week" AS ENUM('LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO');--> statement-breakpoint
CREATE TYPE "public"."duration_unit" AS ENUM('DIA', 'MES');--> statement-breakpoint
CREATE TYPE "public"."muscle_group" AS ENUM('PECHO', 'ESPALDA', 'HOMBROS', 'BICEPS', 'TRICEPS', 'ANTEBRAZOS', 'CUADRICEPS', 'ISQUIOTIBIALES', 'GLUTEOS', 'PANTORRILLAS', 'ABDOMEN', 'CARDIO', 'CUERPO_COMPLETO', 'MOVILIDAD');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('EFECTIVO', 'TRANSFERENCIA', 'DEBITO', 'CREDITO', 'MERCADO_PAGO');--> statement-breakpoint
CREATE TYPE "public"."record_status" AS ENUM('COMPLETADO', 'ANULADO');--> statement-breakpoint
CREATE TYPE "public"."reminder_channel" AS ENUM('WHATSAPP', 'EMAIL');--> statement-breakpoint
CREATE TYPE "public"."reminder_type" AS ENUM('POR_VENCER', 'VENCIDA', 'RECIBO_PAGO');--> statement-breakpoint
CREATE TYPE "public"."routine_goal" AS ENUM('HIPERTROFIA', 'FUERZA', 'RESISTENCIA', 'PERDIDA_GRASA', 'MOVILIDAD', 'GENERAL');--> statement-breakpoint
CREATE TYPE "public"."routine_level" AS ENUM('PRINCIPIANTE', 'INTERMEDIO', 'AVANZADO');--> statement-breakpoint
CREATE TYPE "public"."stock_movement_type" AS ENUM('COMPRA', 'VENTA', 'AJUSTE', 'DEVOLUCION', 'ANULACION_VENTA');--> statement-breakpoint
CREATE TYPE "public"."student_status" AS ENUM('ACTIVO', 'INACTIVO', 'SUSPENDIDO');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('INGRESO', 'EGRESO');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('ADMIN', 'PROFESOR', 'ALUMNO');--> statement-breakpoint
CREATE TABLE "exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"muscle_group" "muscle_group" NOT NULL,
	"equipment" varchar(80),
	"description" text,
	"video_url" varchar(500),
	"image_url" varchar(500),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finance_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" "transaction_type" NOT NULL,
	"system_key" varchar(40),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financial_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "transaction_type" NOT NULL,
	"category_id" uuid NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"payment_method" "payment_method" NOT NULL,
	"description" varchar(255) NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"membership_payment_id" uuid,
	"sale_id" uuid,
	"receipt_image_url" varchar(500),
	"status" "record_status" DEFAULT 'COMPLETADO' NOT NULL,
	"registered_by_id" uuid NOT NULL,
	"voided_at" timestamp with time zone,
	"void_reason" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fin_tx_amount_chk" CHECK ("financial_transactions"."amount" > 0),
	CONSTRAINT "fin_tx_single_source_chk" CHECK ("financial_transactions"."membership_payment_id" IS NULL OR "financial_transactions"."sale_id" IS NULL)
);
--> statement-breakpoint
CREATE TABLE "gym_settings" (
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
	"wa_template_receipt" text DEFAULT '¡Hola {nombre}! Registramos con éxito tu pago de ${monto} por el plan {plan} en {gimnasio}. Tu membresía está activa hasta el {fecha_vencimiento}. ¡Gracias por entrenar con nosotros!' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gym_settings_singleton" CHECK ("gym_settings"."id" = 1),
	CONSTRAINT "gym_settings_days_chk" CHECK ("gym_settings"."grace_period_days" >= 0 AND "gym_settings"."expiry_warning_days" >= 0)
);
--> statement-breakpoint
CREATE TABLE "membership_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"receipt_number" serial NOT NULL,
	"student_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
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
	"registered_by_id" uuid NOT NULL,
	"voided_at" timestamp with time zone,
	"voided_by_id" uuid,
	"void_reason" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "membership_payments_amount_chk" CHECK ("membership_payments"."amount" = "membership_payments"."list_price" - "membership_payments"."discount"),
	CONSTRAINT "membership_payments_discount_chk" CHECK ("membership_payments"."discount" >= 0 AND "membership_payments"."discount" <= "membership_payments"."list_price"),
	CONSTRAINT "membership_payments_period_chk" CHECK ("membership_payments"."period_end" > "membership_payments"."period_start")
);
--> statement-breakpoint
CREATE TABLE "membership_plans" (
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
);
--> statement-breakpoint
CREATE TABLE "membership_reminders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"type" "reminder_type" NOT NULL,
	"channel" "reminder_channel" DEFAULT 'WHATSAPP' NOT NULL,
	"recipient_phone" varchar(30) NOT NULL,
	"message" text NOT NULL,
	"membership_expires_at_snapshot" date,
	"sent_by_id" uuid NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(80) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sku" varchar(50) NOT NULL,
	"name" varchar(150) NOT NULL,
	"description" text,
	"category_id" uuid,
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
);
--> statement-breakpoint
CREATE TABLE "routine_days" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"routine_id" uuid NOT NULL,
	"day_of_week" "day_of_week" NOT NULL,
	"title" varchar(120) NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "routine_exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"routine_day_id" uuid NOT NULL,
	"exercise_id" uuid NOT NULL,
	"position" smallint NOT NULL,
	"sets" smallint NOT NULL,
	"reps" varchar(30) NOT NULL,
	"load" varchar(40),
	"rest_seconds" smallint,
	"tempo" varchar(20),
	"superset_group" smallint,
	"notes" text,
	CONSTRAINT "routine_exercises_sets_chk" CHECK ("routine_exercises"."sets" > 0)
);
--> statement-breakpoint
CREATE TABLE "routines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"description" text,
	"goal" "routine_goal" DEFAULT 'GENERAL' NOT NULL,
	"level" "routine_level" DEFAULT 'PRINCIPIANTE' NOT NULL,
	"is_template" boolean DEFAULT true NOT NULL,
	"source_routine_id" uuid,
	"created_by_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sale_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sale_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"product_name_snapshot" varchar(150) NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"subtotal" numeric(12, 2) NOT NULL,
	CONSTRAINT "sale_items_quantity_chk" CHECK ("sale_items"."quantity" > 0),
	CONSTRAINT "sale_items_subtotal_chk" CHECK ("sale_items"."subtotal" = "sale_items"."quantity" * "sale_items"."unit_price")
);
--> statement-breakpoint
CREATE TABLE "sales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sale_number" serial NOT NULL,
	"student_id" uuid,
	"customer_name" varchar(150),
	"total" numeric(12, 2) NOT NULL,
	"payment_method" "payment_method" NOT NULL,
	"status" "record_status" DEFAULT 'COMPLETADO' NOT NULL,
	"sold_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sold_by_id" uuid NOT NULL,
	"notes" text,
	"voided_at" timestamp with time zone,
	"void_reason" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sales_total_chk" CHECK ("sales"."total" >= 0)
);
--> statement-breakpoint
CREATE TABLE "stock_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"type" "stock_movement_type" NOT NULL,
	"quantity" integer NOT NULL,
	"stock_after" integer NOT NULL,
	"unit_cost" numeric(12, 2),
	"sale_id" uuid,
	"reason" varchar(255),
	"created_by_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stock_movements_quantity_chk" CHECK ("stock_movements"."quantity" <> 0)
);
--> statement-breakpoint
CREATE TABLE "student_routines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"routine_id" uuid NOT NULL,
	"assigned_by_id" uuid NOT NULL,
	"start_date" date DEFAULT CURRENT_DATE NOT NULL,
	"end_date" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
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
	"current_plan_id" uuid,
	"assigned_trainer_id" uuid,
	"joined_at" date DEFAULT CURRENT_DATE NOT NULL,
	"membership_expires_at" date,
	"last_payment_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
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
);
--> statement-breakpoint
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_category_id_finance_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."finance_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_registered_by_id_users_id_fk" FOREIGN KEY ("registered_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_transactions" ADD CONSTRAINT "fin_tx_membership_payment_fk" FOREIGN KEY ("membership_payment_id") REFERENCES "public"."membership_payments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_payments" ADD CONSTRAINT "membership_payments_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_payments" ADD CONSTRAINT "membership_payments_plan_id_membership_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."membership_plans"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_payments" ADD CONSTRAINT "membership_payments_registered_by_id_users_id_fk" FOREIGN KEY ("registered_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_payments" ADD CONSTRAINT "membership_payments_voided_by_id_users_id_fk" FOREIGN KEY ("voided_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_reminders" ADD CONSTRAINT "membership_reminders_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_reminders" ADD CONSTRAINT "membership_reminders_sent_by_id_users_id_fk" FOREIGN KEY ("sent_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_product_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."product_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_days" ADD CONSTRAINT "routine_days_routine_id_routines_id_fk" FOREIGN KEY ("routine_id") REFERENCES "public"."routines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_exercises" ADD CONSTRAINT "routine_exercises_routine_day_id_routine_days_id_fk" FOREIGN KEY ("routine_day_id") REFERENCES "public"."routine_days"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_exercises" ADD CONSTRAINT "routine_exercises_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routines" ADD CONSTRAINT "routines_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_sold_by_id_users_id_fk" FOREIGN KEY ("sold_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_routines" ADD CONSTRAINT "student_routines_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_routines" ADD CONSTRAINT "student_routines_routine_id_routines_id_fk" FOREIGN KEY ("routine_id") REFERENCES "public"."routines"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_routines" ADD CONSTRAINT "student_routines_assigned_by_id_users_id_fk" FOREIGN KEY ("assigned_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_current_plan_id_membership_plans_id_fk" FOREIGN KEY ("current_plan_id") REFERENCES "public"."membership_plans"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_assigned_trainer_id_users_id_fk" FOREIGN KEY ("assigned_trainer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "exercises_name_lower_unique" ON "exercises" USING btree (lower("name"));--> statement-breakpoint
CREATE INDEX "exercises_muscle_group_idx" ON "exercises" USING btree ("muscle_group");--> statement-breakpoint
CREATE UNIQUE INDEX "finance_categories_name_type_unique" ON "finance_categories" USING btree ("name","type");--> statement-breakpoint
CREATE UNIQUE INDEX "finance_categories_system_key_unique" ON "finance_categories" USING btree ("system_key");--> statement-breakpoint
CREATE INDEX "fin_tx_occurred_idx" ON "financial_transactions" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "fin_tx_type_status_idx" ON "financial_transactions" USING btree ("type","status","occurred_at");--> statement-breakpoint
CREATE INDEX "fin_tx_category_idx" ON "financial_transactions" USING btree ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "fin_tx_membership_payment_unique" ON "financial_transactions" USING btree ("membership_payment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "fin_tx_sale_unique" ON "financial_transactions" USING btree ("sale_id");--> statement-breakpoint
CREATE UNIQUE INDEX "membership_payments_receipt_unique" ON "membership_payments" USING btree ("receipt_number");--> statement-breakpoint
CREATE INDEX "membership_payments_student_idx" ON "membership_payments" USING btree ("student_id","period_end");--> statement-breakpoint
CREATE INDEX "membership_payments_paid_at_idx" ON "membership_payments" USING btree ("paid_at");--> statement-breakpoint
CREATE UNIQUE INDEX "membership_plans_name_unique" ON "membership_plans" USING btree ("name");--> statement-breakpoint
CREATE INDEX "membership_reminders_student_idx" ON "membership_reminders" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "membership_reminders_sent_at_idx" ON "membership_reminders" USING btree ("sent_at");--> statement-breakpoint
CREATE INDEX "membership_reminders_type_idx" ON "membership_reminders" USING btree ("type","sent_at");--> statement-breakpoint
CREATE UNIQUE INDEX "product_categories_name_unique" ON "product_categories" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "products_sku_unique" ON "products" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "products" USING btree ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "routine_days_routine_day_unique" ON "routine_days" USING btree ("routine_id","day_of_week");--> statement-breakpoint
CREATE INDEX "routine_exercises_day_idx" ON "routine_exercises" USING btree ("routine_day_id","position");--> statement-breakpoint
CREATE INDEX "routines_template_idx" ON "routines" USING btree ("is_template","is_active");--> statement-breakpoint
CREATE INDEX "routines_created_by_idx" ON "routines" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX "sale_items_sale_idx" ON "sale_items" USING btree ("sale_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sales_number_unique" ON "sales" USING btree ("sale_number");--> statement-breakpoint
CREATE INDEX "sales_sold_at_idx" ON "sales" USING btree ("sold_at");--> statement-breakpoint
CREATE INDEX "stock_movements_product_idx" ON "stock_movements" USING btree ("product_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "student_routines_one_active_unique" ON "student_routines" USING btree ("student_id") WHERE "student_routines"."is_active" = true;--> statement-breakpoint
CREATE INDEX "student_routines_routine_idx" ON "student_routines" USING btree ("routine_id");--> statement-breakpoint
CREATE UNIQUE INDEX "students_dni_unique" ON "students" USING btree ("dni");--> statement-breakpoint
CREATE UNIQUE INDEX "students_user_id_unique" ON "students" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "students_expires_idx" ON "students" USING btree ("membership_expires_at");--> statement-breakpoint
CREATE INDEX "students_status_idx" ON "students" USING btree ("status");--> statement-breakpoint
CREATE INDEX "students_name_idx" ON "students" USING btree ("last_name","first_name");--> statement-breakpoint
CREATE INDEX "students_trainer_idx" ON "students" USING btree ("assigned_trainer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_lower_unique" ON "users" USING btree (lower("email"));--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");