import bcrypt from 'bcryptjs';
import { db } from './index';
import {
  gymSettings,
  financeCategories,
  productCategories,
  users,
  membershipPlans,
  exercises,
  students,
  membershipPayments,
  financialTransactions,
  routines,
  routineDays,
  routineExercises,
  studentRoutines,
  products,
} from './schema';
import { sql } from 'drizzle-orm';
import { addDuration, getTodayBusinessDate } from '../utils/dates';

async function seed() {
  console.log('🌱 Iniciando seed para Centro de Entrenamiento Feltrin...');

  // 1. Configuración del Gimnasio
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

  console.log('✓ Configuración del gimnasio verificada.');

  // 2. Categorías Financieras del Sistema
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

  console.log('✓ Categorías financieras creadas.');

  // 3. Categorías de Productos para Inventario
  const [catSuple, catIndum, catBebidas, catAccesorios] = await db
    .insert(productCategories)
    .values([
      { name: 'Suplementos', description: 'Proteínas, creatinas, aminoácidos y quemadores' },
      { name: 'Indumentaria', description: 'Remeras, calzas, shorts y buzos oficiales' },
      { name: 'Bebidas e Hidratación', description: 'Aguas, isotónicas y energizantes' },
      { name: 'Accesorios', description: 'Straps, muñequeras, cinturones y shakers' },
    ])
    .onConflictDoNothing()
    .returning();

  console.log('✓ Categorías de productos creadas.');

  // 4. Usuarios Iniciales (Admin, Profesor, Alumno)
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin1234!';
  const profePassword = 'Profe1234!';
  const alumnoPassword = 'Alumno1234!';

  const adminHash = await bcrypt.hash(adminPassword, 10);
  const profeHash = await bcrypt.hash(profePassword, 10);
  const alumnoHash = await bcrypt.hash(alumnoPassword, 10);

  const [adminUser] = await db
    .insert(users)
    .values([
      {
        email: process.env.SEED_ADMIN_EMAIL || 'admin@feltrin.com',
        fullName: process.env.SEED_ADMIN_NAME || 'Administrador Feltrin',
        passwordHash: adminHash,
        role: 'ADMIN',
      },
    ])
    .onConflictDoNothing()
    .returning();

  const [profeUser] = await db
    .insert(users)
    .values([
      {
        email: 'profe@feltrin.com',
        fullName: 'Prof. Lucas Giménez',
        passwordHash: profeHash,
        role: 'PROFESOR',
      },
    ])
    .onConflictDoNothing()
    .returning();

  const [alumnoUser] = await db
    .insert(users)
    .values([
      {
        email: 'alumno@feltrin.com',
        fullName: 'Martín Rodríguez',
        passwordHash: alumnoHash,
        role: 'ALUMNO',
      },
    ])
    .onConflictDoNothing()
    .returning();

  console.log('✓ Usuarios creados (admin@feltrin.com, profe@feltrin.com, alumno@feltrin.com).');

  // Buscar admin si ya existía
  const effectiveAdmin =
    adminUser || (await db.query.users.findFirst({ where: (u, { eq }) => eq(u.role, 'ADMIN') }));
  const effectiveProfe =
    profeUser || (await db.query.users.findFirst({ where: (u, { eq }) => eq(u.role, 'PROFESOR') }));
  const effectiveAlumnoUser =
    alumnoUser || (await db.query.users.findFirst({ where: (u, { eq }) => eq(u.role, 'ALUMNO') }));

  if (!effectiveAdmin || !effectiveProfe) {
    throw new Error('No se pudo resolver el admin o profesor para el seed.');
  }

  // 5. Planes de Membresía
  const [planPaseLibre, plan3Dias, plan2Dias] = await db
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
    .onConflictDoNothing()
    .returning();

  console.log('✓ Planes de membresía creados.');

  // 6. Banco de Ejercicios
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

  console.log('✓ Biblioteca de 22 ejercicios cargada.');

  // 7. Productos de Inventario
  if (catSuple && catIndum && catBebidas && catAccesorios) {
    await db
      .insert(products)
      .values([
        {
          sku: 'PROT-WHEY-1KG',
          name: 'Proteína Whey Protein 100% 1kg (Vainilla)',
          categoryId: catSuple.id,
          costPrice: 28000,
          salePrice: 42000,
          stock: 12,
          minStock: 4,
        },
        {
          sku: 'CREAT-MICRON-300G',
          name: 'Creatina Monohidrato Micronizada 300g',
          categoryId: catSuple.id,
          costPrice: 22000,
          salePrice: 34000,
          stock: 18,
          minStock: 5,
        },
        {
          sku: 'REM-FELTRIN-OVERS',
          name: 'Remera Feltrin Gym Dry-Fit Oversized (Talle L)',
          categoryId: catIndum.id,
          costPrice: 9000,
          salePrice: 18000,
          stock: 15,
          minStock: 3,
        },
        {
          sku: 'BEB-GATORADE-MANZ',
          name: 'Bebida Isotónica 500ml Manzana',
          categoryId: catBebidas.id,
          costPrice: 1200,
          salePrice: 2200,
          stock: 36,
          minStock: 12,
        },
        {
          sku: 'ACC-STRAPS-CUERO',
          name: 'Straps de Agarre Reforzados para Levantamiento',
          categoryId: catAccesorios.id,
          costPrice: 5000,
          salePrice: 9500,
          stock: 8,
          minStock: 3,
        },
      ])
      .onConflictDoNothing();
    console.log('✓ Productos iniciales de inventario cargados.');
  }

  // 8. Alumno demo con membresía activa y rutina armada
  if (effectiveAlumnoUser) {
    const today = getTodayBusinessDate();
    const expiry = addDuration(today, 25, 'DIA'); // Vence en 25 días (Al día)

    const [demoStudent] = await db
      .insert(students)
      .values({
        userId: effectiveAlumnoUser.id,
        firstName: 'Martín',
        lastName: 'Rodríguez',
        dni: '41852963',
        email: effectiveAlumnoUser.email,
        phone: '+54 11 5555-1234',
        status: 'ACTIVO',
        currentPlanId: planPaseLibre?.id,
        assignedTrainerId: effectiveProfe.id,
        joinedAt: today,
        membershipExpiresAt: expiry,
        lastPaymentAt: new Date(),
        medicalNotes: 'Apto médico vigente entregado en marzo.',
      })
      .onConflictDoNothing()
      .returning();

    const studentRecord =
      demoStudent ||
      (await db.query.students.findFirst({
        where: (s, { eq }) => eq(s.dni, '41852963'),
      }));

    if (studentRecord && planPaseLibre) {
      // Registrar pago
      const [payment] = await db
        .insert(membershipPayments)
        .values({
          studentId: studentRecord.id,
          planId: planPaseLibre.id,
          planNameSnapshot: planPaseLibre.name,
          listPrice: planPaseLibre.price,
          discount: 0,
          amount: planPaseLibre.price,
          periodStart: today,
          periodEnd: expiry,
          paymentMethod: 'TRANSFERENCIA',
          registeredById: effectiveAdmin.id,
        })
        .onConflictDoNothing()
        .returning();

      // Movimiento de caja por la cuota
      const cuotasCat = await db.query.financeCategories.findFirst({
        where: (c, { eq }) => eq(c.systemKey, 'CUOTAS'),
      });

      if (cuotasCat && payment) {
        await db
          .insert(financialTransactions)
          .values({
            type: 'INGRESO',
            categoryId: cuotasCat.id,
            amount: planPaseLibre.price,
            paymentMethod: 'TRANSFERENCIA',
            description: `Cobro cuota de Martín Rodríguez - ${planPaseLibre.name}`,
            membershipPaymentId: payment.id,
            registeredById: effectiveAdmin.id,
          })
          .onConflictDoNothing();
      }

      // 9. Crear Rutina Demo (Hipertrofia Torso-Pierna) y asignarla
      const [demoRoutine] = await db
        .insert(routines)
        .values({
          name: 'Hipertrofia Torso-Pierna 4 Días',
          description: 'Rutina orientada a ganancia de masa muscular con sobrecarga progresiva.',
          goal: 'HIPERTROFIA',
          level: 'INTERMEDIO',
          isTemplate: false,
          createdById: effectiveProfe.id,
        })
        .onConflictDoNothing()
        .returning();

      if (demoRoutine) {
        // Asignar rutina activa al alumno
        await db
          .insert(studentRoutines)
          .values({
            studentId: studentRecord.id,
            routineId: demoRoutine.id,
            assignedById: effectiveProfe.id,
            startDate: today,
            isActive: true,
            notes: 'Foco en técnica y control de fase excéntrica (3 segundos).',
          })
          .onConflictDoNothing();

        // Cargar días de la semana
        const benchPress = await db.query.exercises.findFirst({
          where: (e, { eq }) => eq(e.name, 'Press de Banca Plano con Barra'),
        });
        const pullUps = await db.query.exercises.findFirst({
          where: (e, { eq }) => eq(e.name, 'Dominadas Pronas'),
        });
        const squat = await db.query.exercises.findFirst({
          where: (e, { eq }) => eq(e.name, 'Sentadilla Trasera con Barra'),
        });
        const rdl = await db.query.exercises.findFirst({
          where: (e, { eq }) => eq(e.name, 'Peso Muerto Rumano con Barra'),
        });

        // Lunes: Torso
        const [dayLunes] = await db
          .insert(routineDays)
          .values({
            routineId: demoRoutine.id,
            dayOfWeek: 'LUNES',
            title: 'Torso Fuerza / Hipertrofia',
          })
          .returning();

        if (dayLunes && benchPress && pullUps) {
          await db.insert(routineExercises).values([
            {
              routineDayId: dayLunes.id,
              exerciseId: benchPress.id,
              position: 1,
              sets: 4,
              reps: '8-10',
              load: '60 kg',
              restSeconds: 90,
              tempo: '3-0-1-0',
              notes: 'Calentar con barra sola antes de las series efectivas.',
            },
            {
              routineDayId: dayLunes.id,
              exerciseId: pullUps.id,
              position: 2,
              sets: 4,
              reps: '6-8',
              load: 'Peso corporal',
              restSeconds: 90,
              notes: 'Rango de movimiento completo.',
            },
          ]);
        }

        // Martes: Pierna
        const [dayMartes] = await db
          .insert(routineDays)
          .values({
            routineId: demoRoutine.id,
            dayOfWeek: 'MARTES',
            title: 'Pierna Cuádriceps y Glúteo',
          })
          .returning();

        if (dayMartes && squat && rdl) {
          await db.insert(routineExercises).values([
            {
              routineDayId: dayMartes.id,
              exerciseId: squat.id,
              position: 1,
              sets: 4,
              reps: '6-8',
              load: '80 kg',
              restSeconds: 120,
              notes: 'Paralelo profundo con talones bien apoyados.',
            },
            {
              routineDayId: dayMartes.id,
              exerciseId: rdl.id,
              position: 2,
              sets: 3,
              reps: '10-12',
              load: '50 kg',
              restSeconds: 90,
            },
          ]);
        }

        // Miércoles: Descanso o Cardio
        await db.insert(routineDays).values({
          routineId: demoRoutine.id,
          dayOfWeek: 'MIERCOLES',
          title: 'Descanso Activo / Movilidad',
          notes: 'Día de recuperación o 30 min de cardio suave en cinta.',
        });

        // Jueves: Torso Secundario
        await db.insert(routineDays).values({
          routineId: demoRoutine.id,
          dayOfWeek: 'JUEVES',
          title: 'Torso Hipertrofia y Brazos',
        });

        // Viernes: Pierna Posterior
        await db.insert(routineDays).values({
          routineId: demoRoutine.id,
          dayOfWeek: 'VIERNES',
          title: 'Isquios, Glúteos y Gemelos',
        });
      }
    }
    console.log('✓ Alumno demo creado con membresía al día y rutina semanal.');
  }

  console.log('\n🚀 ¡Seed completado con éxito!');
  console.log('───────────────────────────────────────────────────────');
  console.log('Credenciales de acceso para pruebas:');
  console.log('• Administrador:  admin@feltrin.com  / Admin1234!');
  console.log('• Profesor:       profe@feltrin.com  / Profe1234!');
  console.log('• Alumno:         alumno@feltrin.com / Alumno1234!');
  console.log('───────────────────────────────────────────────────────');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Error ejecutando seed:', err);
  process.exit(1);
});
