-- ============================================================================
-- PULSEFIT PRO - ESQUEMA DE BASE DE DATOS Y DATOS INICIALES PARA SUPABASE
-- Ejecuta este script en el SQL Editor de tu proyecto en Supabase
-- ============================================================================

-- 1. EXTENSIÓN PARA GENERAR UUIDS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA DE PERFILES / USUARIOS
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL, -- Para compatibilidad directa con admin1 / admin1
    full_name TEXT NOT NULL DEFAULT 'Atleta PulseFit',
    role TEXT NOT NULL DEFAULT 'atleta',
    streak INTEGER NOT NULL DEFAULT 5,
    active_seconds INTEGER NOT NULL DEFAULT 0,
    completed_sessions INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLA DE RUTINAS
CREATE TABLE IF NOT EXISTS public.routines (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    category_label TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    duration TEXT NOT NULL,
    est_calories INTEGER NOT NULL DEFAULT 300,
    description TEXT,
    is_expanded BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABLA DE EJERCICIOS
CREATE TABLE IF NOT EXISTS public.exercises (
    id TEXT PRIMARY KEY,
    routine_id TEXT REFERENCES public.routines(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sets INTEGER NOT NULL DEFAULT 3,
    reps TEXT NOT NULL DEFAULT '10-12',
    rest_seconds INTEGER NOT NULL DEFAULT 60,
    completed BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABLA DE HISTORIAL DE ACTIVIDADES (LOGS)
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL DEFAULT 'admin1',
    exercise_name TEXT NOT NULL,
    routine_title TEXT NOT NULL,
    sets INTEGER DEFAULT 3,
    calories INTEGER DEFAULT 30,
    time_string TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. POLÍTICAS DE SEGURIDAD (ROW LEVEL SECURITY - RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Permitir lectura y escritura pública/anónima para la aplicación cliente (API anon key)
CREATE POLICY "Permitir todo en profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en routines" ON public.routines FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en exercises" ON public.exercises FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en activity_logs" ON public.activity_logs FOR ALL USING (true) WITH CHECK (true);

-- 7. DATOS INICIALES (SEED DATA)
-- A. Usuario Administrador (admin1 / admin1)
INSERT INTO public.profiles (username, password, full_name, role, streak, active_seconds, completed_sessions)
VALUES ('admin1', 'admin1', 'Alex Rivera', 'Atleta Master / Admin', 5, 1240, 3)
ON CONFLICT (username) DO NOTHING;

-- B. Rutinas Predefinidas
INSERT INTO public.routines (id, title, category, category_label, difficulty, duration, est_calories, description, is_expanded, order_index)
VALUES 
('fuerza-superior', 'Fuerza Máxima: Torso Titán', 'fuerza', 'Fuerza', 'Intermedio • Avanzado', '45 min', 380, 'Enfoque en desarrollo de fuerza pura, press pesado y tensión mecánica controlada.', true, 1),
('pierna-hipertrofia', 'Hipertrofia Explosiva: Tren Inferior', 'hipertrofia', 'Hipertrofia', 'Avanzado', '50 min', 450, 'Volumen alto, bombeo metabólico y estímulo para cuádriceps, glúteos e isquios.', false, 2),
('cardio-hiit-burn', 'Cardio HIIT: Quema Grasa Extrema', 'cardio', 'Cardio & HIIT', 'Todos los niveles', '25 min', 320, 'Intervalos de alta intensidad para máxima capacidad aeróbica y quema calórica.', false, 3),
('movilidad-core', 'Movilidad Articular & Core Shield', 'movilidad', 'Movilidad', 'Salud & Recuperación', '20 min', 150, 'Prevención de lesiones, descompresión espinal y estabilidad del core profundo.', false, 4)
ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title,
    category = EXCLUDED.category,
    category_label = EXCLUDED.category_label,
    difficulty = EXCLUDED.difficulty,
    duration = EXCLUDED.duration,
    est_calories = EXCLUDED.est_calories,
    description = EXCLUDED.description;

-- C. Ejercicios de las Rutinas
INSERT INTO public.exercises (id, routine_id, name, sets, reps, rest_seconds, completed, order_index)
VALUES
-- Fuerza
('f1', 'fuerza-superior', 'Press de Banca con Barra', 4, '6 reps', 90, false, 1),
('f2', 'fuerza-superior', 'Remo con Barra Pendlay', 4, '6-8 reps', 90, false, 2),
('f3', 'fuerza-superior', 'Press Militar Over-Head', 3, '8 reps', 75, false, 3),
('f4', 'fuerza-superior', 'Dominadas Lastradas / Estrictas', 3, 'Al fallo (6-10)', 90, false, 4),
-- Hipertrofia
('h1', 'pierna-hipertrofia', 'Sentadilla Trasera Profunda', 4, '10-12 reps', 90, false, 1),
('h2', 'pierna-hipertrofia', 'Prensa Inclinada 45°', 4, '12-15 reps', 60, false, 2),
('h3', 'pierna-hipertrofia', 'Peso Muerto Rumano con Mancuernas', 3, '12 reps', 75, false, 3),
('h4', 'pierna-hipertrofia', 'Elevación de Talones en Máquina', 4, '20 reps', 45, false, 4),
-- Cardio
('c1', 'cardio-hiit-burn', 'Burpees Explosivos con Salto', 5, '45 seg activo', 30, false, 1),
('c2', 'cardio-hiit-burn', 'Mountain Climbers Rápidos', 4, '40 seg activo', 30, false, 2),
('c3', 'cardio-hiit-burn', 'Saltos Dobles a la Cuerda', 4, '50 seg activo', 30, false, 3),
('c4', 'cardio-hiit-burn', 'Sprints en el Sitio / High Knees', 4, '30 seg sprint', 30, false, 4),
-- Movilidad
('m1', 'movilidad-core', 'Plancha Isométrica con Toque de Hombros', 3, '45 seg', 45, false, 1),
('m2', 'movilidad-core', 'Deadbug Controlado con Respiración', 3, '12 por lado', 45, false, 2),
('m3', 'movilidad-core', 'Gato-Camello & Rotaciones Torácicas', 2, '10 ciclos', 30, false, 3),
('m4', 'movilidad-core', 'Estiramiento del Psoas y Flexores de Cadera', 2, '45s x pierna', 30, false, 4)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    sets = EXCLUDED.sets,
    reps = EXCLUDED.reps,
    rest_seconds = EXCLUDED.rest_seconds;

-- D. Logs de Demostración
INSERT INTO public.activity_logs (id, username, exercise_name, routine_title, sets, calories, time_string)
VALUES
('hist-demo-1', 'admin1', 'Press Militar Over-Head', 'Fuerza Máxima: Torso Titán', 3, 30, 'Ayer, 18:30'),
('hist-demo-2', 'admin1', 'Sentadilla Trasera Profunda', 'Hipertrofia Explosiva: Tren Inferior', 4, 35, 'Ayer, 18:15')
ON CONFLICT (id) DO NOTHING;
