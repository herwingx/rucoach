-- ═══════════════════════════════════════════════════════════════════════════
-- RU Coach (GymCoach) — Datos Semilla Oficiales (Idempotentes)
-- Extraídos de la instancia de producción
-- Ejecutar después de supabase/supabase_schema_dump.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. LOGROS DE GAMIFICACIÓN Y ESTÁNDARES SYMMETRY (public.achievements - 43 hitos progresivos en 4 niveles)
INSERT INTO public.achievements (
  name,
  description,
  rarity,
  icon,
  requirement,
  xp_reward,
  category,
  requirement_type,
  requirement_value
)
VALUES
  -- ── TRAYECTORIA: SESIONES COMPLETADAS (Bronce -> Plata -> Oro -> Élite) ──
  (
    'Primera sesión',
    'Registra tu primer entrenamiento completo en la app.',
    'common',
    'trophy',
    'sessions_1',
    100,
    'milestone',
    'sessions',
    1
  ),
  (
    'Diez sesiones',
    'Completa 10 entrenamientos registrados. La disciplina empieza a tomar forma.',
    'common',
    'trophy',
    'sessions_10',
    300,
    'milestone',
    'sessions',
    10
  ),
  (
    'Veinticinco sesiones',
    'Completa 25 sesiones de entrenamiento. Hábito sólido y medible.',
    'rare',
    'medal',
    'sessions_25',
    750,
    'milestone',
    'sessions',
    25
  ),
  (
    'Cincuenta sesiones',
    'Medio centenar de entrenamientos completados con control de cargas.',
    'rare',
    'medal',
    'sessions_50',
    1500,
    'milestone',
    'sessions',
    50
  ),
  (
    'Cien sesiones',
    'Completa 100 entrenos registrados. Constancia de alto nivel.',
    'epic',
    'award',
    'sessions_100',
    3000,
    'milestone',
    'sessions',
    100
  ),
  (
    'Doscientas sesiones',
    'Alcanza 200 entrenamientos completados. Trayectoria de atleta veterano.',
    'legendary',
    'crown',
    'sessions_200',
    6000,
    'milestone',
    'sessions',
    200
  ),

  -- ── TRAYECTORIA: NIVELES DE EXPERIENCIA ──
  (
    'Nivel 5',
    'Alcanza el nivel 5 de experiencia por acumulación de entrenos y logros.',
    'common',
    'star',
    'level_5',
    250,
    'milestone',
    'level',
    5
  ),
  (
    'Nivel 10',
    'Alcanza el nivel 10 de experiencia como atleta constante.',
    'rare',
    'star',
    'level_10',
    500,
    'milestone',
    'level',
    10
  ),
  (
    'Nivel 20',
    'Alcanza el nivel 20 de experiencia demostrada en el gimnasio.',
    'epic',
    'star',
    'level_20',
    1000,
    'milestone',
    'level',
    20
  ),
  (
    'Nivel 50',
    'Alcanza el nivel 50 de experiencia — trayectoria de élite.',
    'legendary',
    'crown',
    'level_50',
    5000,
    'milestone',
    'level',
    50
  ),

  -- ── CONSTANCIA: RACHAS DE ENTRENAMIENTO ──
  (
    'Chispa de disciplina',
    'Tres días seguidos cumpliendo con tus sesiones registradas.',
    'common',
    'flame',
    'streak_3',
    200,
    'consistency',
    'streak',
    3
  ),
  (
    'Semana seguida',
    'Siete días seguidos con al menos una sesión registrada.',
    'common',
    'flame',
    'streak_7',
    500,
    'consistency',
    'streak',
    7
  ),
  (
    'Quincena de hierro',
    'Catorce días consecutivos entrenando y registrando tu progreso.',
    'rare',
    'flame',
    'streak_14',
    1000,
    'consistency',
    'streak',
    14
  ),
  (
    'Mes en racha',
    'Treinta días consecutivos entrenando y registrando.',
    'epic',
    'medal',
    'streak_30',
    2000,
    'consistency',
    'streak',
    30
  ),
  (
    'Imparable',
    'Mantén una racha legendaria de 100 días entrenando.',
    'legendary',
    'flame',
    'streak_100',
    5000,
    'consistency',
    'streak',
    100
  ),

  -- ── CONSTANCIA: SEGUIMIENTO ANTROPOMÉTRICO (MEDIDAS) ──
  (
    'Punto de partida físico',
    'Registra tu primer mes de medidas corporales y peso de referencia.',
    'common',
    'ruler',
    'measurements_streak_1',
    150,
    'consistency',
    'measurement_months',
    1
  ),
  (
    'Trimestre medido',
    'Registra tus medidas corporales durante 3 meses seguidos.',
    'rare',
    'ruler',
    'measurements_streak_3',
    400,
    'consistency',
    'measurement_months',
    3
  ),
  (
    'Semestre de precisión',
    'Seis meses consecutivos evaluando tu composición corporal.',
    'epic',
    'ruler',
    'measurements_streak_6',
    750,
    'consistency',
    'measurement_months',
    6
  ),
  (
    'Arquitecto del Cuerpo',
    'Registra tus medidas corporales durante 12 meses seguidos.',
    'legendary',
    'ruler',
    'measurements_streak_12',
    1500,
    'consistency',
    'measurement_months',
    12
  ),

  -- ── FUERZA Y MARCAS: RÉCORDS PERSONALES (PRs) ──
  (
    'Primera marca personal',
    'Establece tu primer Récord Personal (PR) de fuerza en un ejercicio.',
    'common',
    'target',
    'pr_1',
    150,
    'strength',
    'pr',
    1
  ),
  (
    'Rompiendo límites',
    'Alcanza 5 marcas personales distintas en tu historial de cargas.',
    'common',
    'target',
    'pr_5',
    450,
    'strength',
    'pr',
    5
  ),
  (
    'Cazador de marcas',
    'Alcanza diez marcas personales distintas en tu historial.',
    'rare',
    'target',
    'pr_10',
    1000,
    'strength',
    'pr',
    10
  ),
  (
    'Coleccionista de Récords',
    'Domina el gimnasio con 25 marcas personales en distintos ejercicios.',
    'epic',
    'trophy',
    'pr_25',
    2200,
    'strength',
    'pr',
    25
  ),

  -- ── FUERZA RELATIVA ESTILO SYMMETRY: PRESS DE BANCA ──
  (
    'Press Banca · Estándar Bronce',
    'Alcanza un 1RM estimado de 0.75x tu peso corporal en Press de Banca.',
    'common',
    'dumbbell',
    'bench_0.75x',
    500,
    'strength',
    'lift_bench_bw',
    75
  ),
  (
    'Maestro del Press',
    'Levanta 1.0x tu peso corporal (1RM estimado) en Press de Banca.',
    'rare',
    'dumbbell',
    'bench_1x',
    1000,
    'strength',
    'lift_bench_bw',
    100
  ),
  (
    'Press Banca · Estándar Oro',
    'Supera 1.25x tu peso corporal (1RM estimado) en Press de Banca.',
    'epic',
    'dumbbell',
    'bench_1.25x',
    1800,
    'strength',
    'lift_bench_bw',
    125
  ),
  (
    'Press Banca · Estándar Élite',
    'Alcanza el estándar élite de 1.5x tu peso corporal en Press de Banca.',
    'legendary',
    'crown',
    'bench_1.5x',
    3200,
    'strength',
    'lift_bench_bw',
    150
  ),

  -- ── FUERZA RELATIVA ESTILO SYMMETRY: SENTADILLA LIBRE ──
  (
    'Sentadilla · Estándar Bronce',
    'Alcanza un 1RM estimado de 1.0x tu peso corporal en Sentadilla.',
    'common',
    'dumbbell',
    'squat_1x',
    600,
    'strength',
    'lift_squat_bw15',
    100
  ),
  (
    'Titán de la Sentadilla',
    'Levanta 1.5x tu peso corporal (1RM estimado) en Sentadilla.',
    'epic',
    'dumbbell',
    'squat_1.5x',
    1500,
    'strength',
    'lift_squat_bw15',
    150
  ),
  (
    'Sentadilla · Estándar Élite',
    'Alcanza el estándar élite de 2.0x tu peso corporal en Sentadilla.',
    'legendary',
    'crown',
    'squat_2x',
    3500,
    'strength',
    'lift_squat_bw15',
    200
  ),

  -- ── FUERZA RELATIVA ESTILO SYMMETRY: PESO MUERTO ──
  (
    'Peso Muerto · Estándar Plata',
    'Alcanza un 1RM estimado de 1.5x tu peso corporal en Peso Muerto.',
    'rare',
    'dumbbell',
    'deadlift_1.5x',
    900,
    'strength',
    'lift_deadlift_bw2',
    150
  ),
  (
    'Bestia del Peso Muerto',
    'Levanta 2.0x tu peso corporal (1RM estimado) en Peso Muerto.',
    'epic',
    'dumbbell',
    'deadlift_2x',
    1800,
    'strength',
    'lift_deadlift_bw2',
    200
  ),
  (
    'Peso Muerto · Estándar Élite',
    'Alcanza el estándar élite de 2.5x tu peso corporal en Peso Muerto.',
    'legendary',
    'crown',
    'deadlift_2.5x',
    4000,
    'strength',
    'lift_deadlift_bw2',
    250
  ),

  -- ── VOLUMEN POR SESIÓN Y TONELAJE DE CARRERA ──
  (
    'Sesión de acero',
    'Mueve al menos 5,000 kg de volumen efectivo en una sola sesión.',
    'common',
    'dumbbell',
    'volume_5000',
    350,
    'volume',
    'volume',
    5000
  ),
  (
    'Sesión de alto volumen',
    'Supera 10,000 kg de volumen total en una sola sesión (sumando series).',
    'rare',
    'dumbbell',
    'volume_10000',
    750,
    'volume',
    'volume',
    10000
  ),
  (
    'Sesión colosal',
    'Supera 15,000 kg de volumen efectivo en una sola sesión.',
    'epic',
    'zap',
    'volume_15000',
    1400,
    'volume',
    'volume',
    15000
  ),
  (
    '25 Toneladas de Carrera',
    'Acumula 25,000 kg (25 t) de volumen total a lo largo de tus entrenamientos.',
    'rare',
    'scale',
    'lifetime_volume_25000',
    800,
    'volume',
    'lifetime_volume',
    25000
  ),
  (
    'Coleccionista de Hierro',
    'Mueve un total acumulado de 100,000 kg (100 t) en tu carrera.',
    'epic',
    'scale',
    'lifetime_volume_100000',
    2500,
    'volume',
    'lifetime_volume',
    100000
  ),
  (
    'Leyenda del Tonelaje',
    'Alcanza 250,000 kg (250 toneladas) movidas en tu historial total.',
    'legendary',
    'crown',
    'lifetime_volume_250000',
    5000,
    'volume',
    'lifetime_volume',
    250000
  ),

  -- ── HÁBITOS Y COMPROMISO ──
  (
    'Guerrero Madrugador',
    'Completa 5 entrenamientos antes de las 8:00 AM.',
    'common',
    'sunrise',
    'early_sessions_5',
    300,
    'special',
    'early_workouts',
    5
  ),
  (
    'Club de las 6 AM',
    'Completa 15 entrenamientos matutinos antes de las 8:00 AM.',
    'rare',
    'sunrise',
    'early_sessions_15',
    800,
    'special',
    'early_workouts',
    15
  ),
  (
    'Feedback Activo',
    'Envía tus primeros 10 mensajes de seguimiento a tu coach.',
    'common',
    'chat',
    'messages_10',
    150,
    'special',
    'messages',
    10
  ),
  (
    'Social Butterfly',
    'Mantén comunicación constante enviando 50 mensajes a tu coach.',
    'rare',
    'chat',
    'messages_50',
    400,
    'special',
    'messages',
    50
  )
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  rarity = EXCLUDED.rarity,
  icon = EXCLUDED.icon,
  requirement = EXCLUDED.requirement,
  xp_reward = EXCLUDED.xp_reward,
  category = EXCLUDED.category,
  requirement_type = EXCLUDED.requirement_type,
  requirement_value = EXCLUDED.requirement_value;

-- 2. PLANES DE MEMBRESÍA BASE (public.membership_plans)
INSERT INTO public.membership_plans (
  id,
  name,
  duration_days,
  price,
  description,
  is_active
)
VALUES
  (
    '46651120-c2aa-478b-9f7e-e6814623cf3e',
    'Mensual',
    30,
    500,
    NULL,
    true
  ),
  (
    '2b4db298-097c-4b32-9285-eb19ac31f139',
    'Trimestral',
    90,
    1350,
    NULL,
    true
  ),
  (
    '70b38264-7b37-45dd-ae7a-8e3e4e04dabe',
    'Anual',
    365,
    5000,
    NULL,
    true
  )
ON CONFLICT (id) DO NOTHING;
