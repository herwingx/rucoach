-- Migration: Agregar soporte nativo para series de aproximación (warmup_sets) en routine_exercises
-- Ejecutar en Supabase SQL Editor: https://supabase.com/dashboard/project/dldttdqpcpdtribtgzsa/sql

ALTER TABLE public.routine_exercises 
ADD COLUMN IF NOT EXISTS warmup_sets text;

-- Comentario explicativo en la columna
COMMENT ON COLUMN public.routine_exercises.warmup_sets IS 'Series de aproximación / feeder sets opcionales (ej. "1x12 al 50%, 1x8 al 70%")';
