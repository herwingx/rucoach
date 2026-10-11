-- ═══════════════════════════════════════════════════════════════════════════
-- RU Coach (GymCoach) — Datos Semilla Oficiales (Idempotentes)
-- Extraídos de la instancia de producción
-- Ejecutar después de supabase/supabase_schema_dump.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. LOGROS DE GAMIFICACIÓN (public.achievements - 18 logros oficiales)
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
  (
    'Primera sesión',
    'Registra tu primer entreno completo en la app.',
    'common',
    'trophy',
    'sessions_1',
    100,
    'milestone',
    'sessions',
    1
  ),
  (
    'Cien sesiones',
    'Completa cien entrenos registrados. Constancia a largo plazo.',
    'epic',
    'award',
    'sessions_100',
    3000,
    'milestone',
    'sessions',
    100
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
    'Mes en racha',
    'Treinta días consecutivos entrenando y registrando.',
    'rare',
    'medal',
    'streak_30',
    2000,
    'consistency',
    'streak',
    30
  ),
  (
    'Imparable',
    'Mantén una racha de 100 días',
    'legendary',
    '🔥',
    'streak_100',
    5000,
    'consistency',
    'streak',
    100
  ),
  (
    'Cazador de marcas',
    'Alcanza diez marcas personales distintas en tu historial.',
    'common',
    'target',
    'pr_10',
    1000,
    'strength',
    'pr',
    10
  ),
  (
    'Maestro del Press',
    'Levanta 1x tu peso corporal en Bench Press',
    'rare',
    '💪',
    'bench_1x',
    1000,
    'strength',
    'lift_bench_bw',
    100
  ),
  (
    'Titán de la Sentadilla',
    'Levanta 1.5x tu peso corporal en Squat',
    'rare',
    '🏋️',
    'squat_1.5x',
    1200,
    'strength',
    'lift_squat_bw15',
    150
  ),
  (
    'Bestia del Peso Muerto',
    'Levanta 2x tu peso corporal en Deadlift',
    'rare',
    '💀',
    'deadlift_2x',
    1500,
    'strength',
    'lift_deadlift_bw2',
    200
  ),
  (
    'Sesión de alto volumen',
    'Supera 10.000 kg de volumen total en una sola sesión (sumando series).',
    'rare',
    'dumbbell',
    'volume_10000',
    750,
    'volume',
    'volume',
    10000
  ),
  (
    'Coleccionista de Hierro',
    'Mueve un total de 100,000 kg en tu carrera',
    'epic',
    '🏗️',
    'lifetime_volume_100000',
    2500,
    'volume',
    'lifetime_volume',
    100000
  ),
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
    'Alcanza el nivel 10 de experiencia.',
    'common',
    'star',
    'level_10',
    500,
    'milestone',
    'level',
    10
  ),
  (
    'Nivel 20',
    'Alcanza el nivel 20 de experiencia.',
    'rare',
    'star',
    'level_20',
    1000,
    'milestone',
    'level',
    20
  ),
  (
    'Nivel 50',
    'Alcanza el nivel 50 de experiencia — trayectoria muy sólida.',
    'legendary',
    'crown',
    'level_50',
    5000,
    'milestone',
    'level',
    50
  ),
  (
    'Guerrero Madrugador',
    'Entrena antes de las 8:00 AM 5 veces',
    'common',
    '☀️',
    'early_sessions_5',
    300,
    'special',
    'early_workouts',
    5
  ),
  (
    'Arquitecto del Cuerpo',
    'Registra tus medidas 12 meses seguidos',
    'rare',
    '📐',
    'measurements_streak_12',
    1000,
    'consistency',
    'measurement_months',
    12
  ),
  (
    'Social Butterfly',
    'Envía 50 mensajes a tu coach',
    'common',
    '💬',
    'messages_50',
    200,
    'special',
    'messages',
    50
  )
ON CONFLICT (name) DO NOTHING;

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
