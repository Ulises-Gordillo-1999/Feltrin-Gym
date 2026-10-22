const postgres = require('postgres');
const { drizzle } = require('drizzle-orm/postgres-js');
const { migrate } = require('drizzle-orm/postgres-js/migrator');
const bcrypt = require('bcryptjs');
const path = require('path');

async function bootstrap() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log('⚠️ [BOOTSTRAP] DATABASE_URL no está definida. Omitiendo bootstrap de base de datos.');
    return;
  }

  console.log('🔄 [BOOTSTRAP] Conectando a PostgreSQL para verificar migraciones...');
  const sql = postgres(databaseUrl, { max: 1 });
  const db = drizzle(sql);

  try {
    // 1. Ejecutar migraciones de Drizzle si existen
    const migrationsFolder = path.join(__dirname, '../drizzle');
    console.log(`📦 [BOOTSTRAP] Aplicando migraciones desde: ${migrationsFolder}`);
    await migrate(db, { migrationsFolder });
    console.log('✅ [BOOTSTRAP] Migraciones aplicadas o ya al día.');

    // 2. Verificar y sembrar configuración del gimnasio
    const [existingSettings] = await sql`SELECT id FROM gym_settings WHERE id = 1 LIMIT 1`;
    if (!existingSettings) {
      await sql`
        INSERT INTO gym_settings (id, gym_name, legal_name, tax_id, address, phone, email, timezone, grace_period_days, expiry_warning_days, receipt_footer)
        VALUES (
          1,
          'Centro de Entrenamiento Feltrin',
          'Centro de Entrenamiento Feltrin S.R.L.',
          '30-71234567-8',
          'Av. San Martín 1420, Buenos Aires',
          '+54 11 4567-8900',
          'contacto@feltrin-gym.com',
          'America/Argentina/Buenos_Aires',
          3,
          5,
          '¡Gracias por entrenar en Feltrin! Recordá presentar tu carnet o DNI al ingresar.'
        ) ON CONFLICT DO NOTHING
      `;
      console.log('✅ [BOOTSTRAP] Configuración inicial del gimnasio creada.');
    }

    // 3. Categorías financieras básicas
    await sql`
      INSERT INTO finance_categories (name, type, system_key)
      VALUES 
        ('Cuotas de Alumnos', 'INGRESO', 'CUOTAS'),
        ('Ventas de Mostrador', 'INGRESO', 'VENTAS'),
        ('Otros Ingresos', 'INGRESO', NULL),
        ('Alquiler del Local', 'EGRESO', NULL),
        ('Servicios (Luz, Agua, Gas, Internet)', 'EGRESO', NULL),
        ('Mantenimiento de Máquinas y Equipos', 'EGRESO', NULL),
        ('Sueldos y Honorarios', 'EGRESO', NULL),
        ('Compra de Insumos y Limpieza', 'EGRESO', NULL),
        ('Impuestos y Tasas', 'EGRESO', NULL)
      ON CONFLICT DO NOTHING
    `;
    console.log('✅ [BOOTSTRAP] Categorías financieras iniciales verificadas.');

    // 4. Categorías de productos
    await sql`
      INSERT INTO product_categories (name, description)
      VALUES 
        ('Suplementos', 'Proteínas, creatinas, aminoácidos y quemadores'),
        ('Indumentaria', 'Remeras, calzas, shorts y buzos oficiales'),
        ('Bebidas e Hidratación', 'Aguas, isotónicas y energizantes'),
        ('Accesorios', 'Straps, muñequeras, cinturones y shakers')
      ON CONFLICT DO NOTHING
    `;
    console.log('✅ [BOOTSTRAP] Categorías de productos verificadas.');

    // 5. Planes de membresía base
    await sql`
      INSERT INTO membership_plans (name, description, price, duration_value, duration_unit, sessions_per_week)
      VALUES 
        ('Pase Libre Musculación', 'Acceso ilimitado de lunes a sábados en todas las áreas de fuerza y cardio.', 35000, 1, 'MES', NULL),
        ('3 Días por Semana', 'Entrenamiento 3 días a elección por semana.', 28000, 1, 'MES', 3),
        ('2 Días por Semana', 'Ideal para complementación deportiva 2 veces por semana.', 22000, 1, 'MES', 2),
        ('Pase Diario', 'Acceso por un día completo.', 4500, 1, 'DIA', NULL)
      ON CONFLICT DO NOTHING
    `;
    console.log('✅ [BOOTSTRAP] Planes de membresía verificados.');

    // 6. Banco de Ejercicios esenciales
    await sql`
      INSERT INTO exercises (name, muscle_group, equipment)
      VALUES 
        ('Press de Banca Plano con Barra', 'PECHO', 'Barra Olímpica y Banco'),
        ('Press Inclinado con Mancuernas', 'PECHO', 'Mancuernas y Banco Regulable'),
        ('Aperturas en Polea (Cruces)', 'PECHO', 'Polea Doble Crossover'),
        ('Dominadas Pronas', 'ESPALDA', 'Barra de Dominadas'),
        ('Remo con Barra Pendlay', 'ESPALDA', 'Barra Olímpica'),
        ('Jalón al Pecho en Polea Alta', 'ESPALDA', 'Polea Alta'),
        ('Sentadilla Trasera con Barra', 'CUADRICEPS', 'Rack y Barra Olímpica'),
        ('Prensa Inclinada 45°', 'CUADRICEPS', 'Máquina Prensa 45°'),
        ('Sillón de Cuádriceps (Extensiones)', 'CUADRICEPS', 'Máquina Extensiones'),
        ('Peso Muerto Rumano con Barra', 'ISQUIOTIBIALES', 'Barra Olímpica'),
        ('Camilla Femoral Tumbado', 'ISQUIOTIBIALES', 'Máquina Camilla Femoral'),
        ('Hip Thrust con Barra', 'GLUTEOS', 'Banco y Barra'),
        ('Press Militar de Pie con Barra', 'HOMBROS', 'Barra Olímpica'),
        ('Vuelos Laterales con Mancuernas', 'HOMBROS', 'Mancuernas'),
        ('Pájaros Posteriores en Máquina', 'HOMBROS', 'Máquina Pec Deck Reversa'),
        ('Curl de Bíceps con Barra Z', 'BICEPS', 'Barra Z y Discos'),
        ('Curl Martillo con Mancuernas', 'BICEPS', 'Mancuernas'),
        ('Press Francés con Mancuernas', 'TRICEPS', 'Mancuernas y Banco'),
        ('Extensiones de Tríceps en Polea Alta', 'TRICEPS', 'Polea con Cuerda'),
        ('Elevación de Talones de Pie', 'PANTORRILLAS', 'Máquina Gemelos'),
        ('Crunch Abdominal en Polea Alta', 'ABDOMEN', 'Polea Alta con Cuerda'),
        ('Plancha Abdominal Isométrica', 'ABDOMEN', 'Colchoneta')
      ON CONFLICT DO NOTHING
    `;
    console.log('✅ [BOOTSTRAP] Banco de ejercicios esenciales verificado.');

    // 7. Administrador Oficial de Producción
    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@feltrin.com';
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin1234!';
    const adminName = process.env.SEED_ADMIN_NAME || 'Administrador Feltrin';

    const [existingAdmin] = await sql`SELECT id FROM users WHERE email = ${adminEmail} LIMIT 1`;
    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      await sql`
        INSERT INTO users (email, full_name, password_hash, role)
        VALUES (${adminEmail}, ${adminName}, ${passwordHash}, 'ADMIN')
        ON CONFLICT DO NOTHING
      `;
      console.log(`👑 [BOOTSTRAP] Usuario Administrador creado exitosamente: ${adminEmail}`);
    } else {
      console.log(`👑 [BOOTSTRAP] Usuario Administrador verificado (${adminEmail}).`);
    }

    console.log('🚀 [BOOTSTRAP] Base de datos lista y operacional.\n');
  } catch (error) {
    console.error('❌ [BOOTSTRAP] Error durante la inicialización de la base de datos:', error);
    // No romper el inicio del servidor en caso de reintentos
  } finally {
    await sql.end();
  }
}

bootstrap();
