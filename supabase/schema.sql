-- ==============================================================================
-- OhmDrive - PostgreSQL 15 Relational Schema (3NF)
-- Single Source of Truth: Docs nosotros/02_DATA_DICTIONARY.md
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean existing tables if needed (reverse dependency order)
DROP TABLE IF EXISTS user_unlocked_cards CASCADE;
DROP TABLE IF EXISTS practice_sessions CASCADE;
DROP TABLE IF EXISTS user_lesson_attempts CASCADE;
DROP TABLE IF EXISTS user_sector_progress CASCADE;
DROP TABLE IF EXISTS codex_cards CASCADE;
DROP TABLE IF EXISTS challenges CASCADE;
DROP TABLE IF EXISTS lessons CASCADE;
DROP TABLE IF EXISTS sectors CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- ------------------------------------------------------------------------------
-- 1. roles
-- ------------------------------------------------------------------------------
CREATE TABLE roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(30) NOT NULL UNIQUE
);

-- ------------------------------------------------------------------------------
-- 2. users
-- ------------------------------------------------------------------------------
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id INT NOT NULL DEFAULT 1 REFERENCES roles(role_id),
    username VARCHAR(40) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE,
    total_watts_xp INT NOT NULL DEFAULT 0 CHECK (total_watts_xp >= 0),
    current_fuses INT NOT NULL DEFAULT 5 CHECK (current_fuses >= 0 AND current_fuses <= 5),
    streak_days INT NOT NULL DEFAULT 1 CHECK (streak_days >= 0),
    league_tier VARCHAR(30) NOT NULL DEFAULT 'silicon' CHECK (league_tier IN ('silicon', 'copper', 'gold', 'superconductor')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. sectors
-- ------------------------------------------------------------------------------
CREATE TABLE sectors (
    sector_id SERIAL PRIMARY KEY,
    sector_order INT NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(100) NOT NULL,
    uaa_unit_ref VARCHAR(80) NOT NULL,
    lore_description TEXT NOT NULL,
    accent_color_hex VARCHAR(7) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 4. lessons
-- ------------------------------------------------------------------------------
CREATE TABLE lessons (
    lesson_id SERIAL PRIMARY KEY,
    sector_id INT NOT NULL REFERENCES sectors(sector_id) ON DELETE CASCADE,
    node_order INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    topic_tag VARCHAR(50) NOT NULL,
    theory_markdown TEXT NOT NULL,
    xp_reward INT NOT NULL DEFAULT 50 CHECK (xp_reward >= 0),
    is_boss_level BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_sector_node UNIQUE (sector_id, node_order)
);

-- ------------------------------------------------------------------------------
-- 5. challenges
-- ------------------------------------------------------------------------------
CREATE TABLE challenges (
    challenge_id VARCHAR(50) PRIMARY KEY,
    lesson_id INT NOT NULL REFERENCES lessons(lesson_id) ON DELETE CASCADE,
    step_order INT NOT NULL,
    interaction_type VARCHAR(40) NOT NULL CHECK (interaction_type IN ('multiple_choice', 'multimeter_probe', 'component_slot', 'slider_tuning', 'superposition_toggle')),
    difficulty VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (difficulty IN ('basic', 'normal', 'boss')),
    prompt_text TEXT NOT NULL,
    circuit_config_json JSONB NOT NULL,
    solution_json JSONB NOT NULL,
    explanation_markdown TEXT NOT NULL
);

-- ------------------------------------------------------------------------------
-- 6. codex_cards
-- ------------------------------------------------------------------------------
CREATE TABLE codex_cards (
    card_id SERIAL PRIMARY KEY,
    sector_id INT NOT NULL REFERENCES sectors(sector_id) ON DELETE CASCADE,
    code_slug VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(100) NOT NULL,
    formula_latex VARCHAR(255) NOT NULL,
    summary_text TEXT NOT NULL
);

-- ------------------------------------------------------------------------------
-- 7. user_sector_progress
-- ------------------------------------------------------------------------------
CREATE TABLE user_sector_progress (
    progress_id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    sector_id INT NOT NULL REFERENCES sectors(sector_id) ON DELETE CASCADE,
    is_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
    completed_nodes INT NOT NULL DEFAULT 0 CHECK (completed_nodes >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_sector UNIQUE (user_id, sector_id)
);

-- ------------------------------------------------------------------------------
-- 8. user_lesson_attempts
-- ------------------------------------------------------------------------------
CREATE TABLE user_lesson_attempts (
    attempt_id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    lesson_id INT NOT NULL REFERENCES lessons(lesson_id) ON DELETE CASCADE,
    score_percentage INT NOT NULL CHECK (score_percentage >= 0 AND score_percentage <= 100),
    watts_earned INT NOT NULL CHECK (watts_earned >= 0),
    fuses_lost INT NOT NULL DEFAULT 0 CHECK (fuses_lost >= 0),
    duration_seconds INT NOT NULL CHECK (duration_seconds >= 0),
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 9. practice_sessions
-- ------------------------------------------------------------------------------
CREATE TABLE practice_sessions (
    session_id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    sector_id INT REFERENCES sectors(sector_id) ON DELETE SET NULL,
    practice_mode VARCHAR(30) NOT NULL CHECK (practice_mode IN ('topic_drill', 'time_attack')),
    questions_solved INT NOT NULL DEFAULT 0 CHECK (questions_solved >= 0),
    correct_answers INT NOT NULL DEFAULT 0 CHECK (correct_answers >= 0),
    watts_earned INT NOT NULL DEFAULT 0 CHECK (watts_earned >= 0),
    played_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 10. user_unlocked_cards
-- ------------------------------------------------------------------------------
CREATE TABLE user_unlocked_cards (
    unlock_id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    card_id INT NOT NULL REFERENCES codex_cards(card_id) ON DELETE CASCADE,
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_card UNIQUE (user_id, card_id)
);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE & LEADERBOARD
-- ==============================================================================
CREATE INDEX idx_users_watts_xp ON users(total_watts_xp DESC);
CREATE INDEX idx_users_league ON users(league_tier);
CREATE INDEX idx_lessons_sector ON lessons(sector_id, node_order);
CREATE INDEX idx_challenges_lesson ON challenges(lesson_id, step_order);
CREATE INDEX idx_attempts_user ON user_lesson_attempts(user_id);
CREATE INDEX idx_practice_user ON practice_sessions(user_id);
CREATE INDEX idx_progress_user ON user_sector_progress(user_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE codex_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sector_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_lesson_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_unlocked_cards ENABLE ROW LEVEL SECURITY;

-- Read policies for public catalogs (anyone can read sectors, lessons, challenges, cards)
CREATE POLICY "Public read sectors" ON sectors FOR SELECT USING (true);
CREATE POLICY "Public read lessons" ON lessons FOR SELECT USING (true);
CREATE POLICY "Public read challenges" ON challenges FOR SELECT USING (true);
CREATE POLICY "Public read codex_cards" ON codex_cards FOR SELECT USING (true);
CREATE POLICY "Public read roles" ON roles FOR SELECT USING (true);

-- User table read for leaderboard (all users can view usernames and watts_xp)
CREATE POLICY "Public read leaderboard" ON users FOR SELECT USING (true);
CREATE POLICY "User can insert themselves" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "User can update own data" ON users FOR UPDATE USING (true);

-- Progress policies
CREATE POLICY "User progress access" ON user_sector_progress FOR ALL USING (true);
CREATE POLICY "User attempts access" ON user_lesson_attempts FOR ALL USING (true);
CREATE POLICY "Practice sessions access" ON practice_sessions FOR ALL USING (true);
CREATE POLICY "Unlocked cards access" ON user_unlocked_cards FOR ALL USING (true);

-- ==============================================================================
-- SEED DATA (INITIAL SYLLABUS, ROLES & CARDS)
-- ==============================================================================

-- 1. Roles
INSERT INTO roles (role_id, role_name) VALUES
    (1, 'student'),
    (2, 'professor'),
    (3, 'admin')
ON CONFLICT (role_id) DO NOTHING;

-- 2. Sectors (Official UAA Syllabus alignment)
INSERT INTO sectors (sector_id, sector_order, slug, title, uaa_unit_ref, lore_description, accent_color_hex) VALUES
(
    1,
    1,
    'distrito-ohm',
    'Sector 1: Distrito Ohm',
    'Unidad I: Leyes Experimentales y Circuitos Simples',
    'Los generadores del Distrito Ohm han caído tras la sobretensión. Restablece el voltaje nominal calculando resistencias y corrientes antes de que el sector colapse.',
    '#00F0FF'
),
(
    2,
    2,
    'nodos-kirchhoff',
    'Sector 2: Nodos de Kirchhoff',
    'Unidad I: Leyes Experimentales (Continuación)',
    'Las subestaciones del norte presentan desbalances en sus bifurcaciones. Equilibra las mallas y ramas aplicando LCK y LVK con precisión milimétrica.',
    '#FFB800'
),
(
    3,
    3,
    'nucleo-thevenin',
    'Sector 3: El Núcleo Thévenin',
    'Unidad II: Técnicas Usadas en el Análisis de Circuitos',
    'El mainframe de la ciudad es demasiado complejo para el análisis directo. Sintetiza las redes a sus circuitos equivalentes Thévenin y Norton.',
    '#FF2A85'
),
(
    4,
    4,
    'pulso-reactivo',
    'Sector 4: Pulso Reactivo & CA',
    'Unidades III, IV y V: RL/RC, Fasores y Potencia CA',
    'La red alterna de alta frecuencia oscila peligrosamente. Domina los transitorios, desfases fasoriales y corrige el factor de potencia del generador central.',
    '#00FF66'
)
ON CONFLICT (sector_id) DO NOTHING;

-- 3. Initial Codex Cards (Cheat-sheet formulas)
INSERT INTO codex_cards (card_id, sector_id, code_slug, title, formula_latex, summary_text) VALUES
(
    1,
    1,
    'card-ohm-law',
    'Ley de Ohm',
    'V = I \cdot R',
    'La corriente eléctrica es directamente proporcional al voltaje aplicado e inversamente proporcional a la resistencia del circuito.'
),
(
    2,
    1,
    'card-dc-power',
    'Potencia Eléctrica en CD',
    'P = V \cdot I = I^2 R = \frac{V^2}{R}',
    'La rapidez con la que se consume o disipa energía. No excedas la potencia nominal de las resistencias comerciales para evitar sobrecalentamiento.'
),
(
    3,
    2,
    'card-kcl',
    'Ley de Corrientes de Kirchhoff (LCK)',
    '\sum I_{\text{entran}} = \sum I_{\text{salen}}',
    'Principio de conservación de la carga: la suma algebraica de las corrientes en cualquier nodo del circuito debe ser igual a cero.'
),
(
    4,
    2,
    'card-kvl',
    'Ley de Voltajes de Kirchhoff (LVK)',
    '\sum_{k=1}^n V_k = 0',
    'Principio de conservación de la energía: la suma algebraica de las caídas y elevaciones de potencial a lo largo de cualquier lazo cerrado es cero.'
),
(
    5,
    2,
    'card-voltage-divider',
    'Divisor de Voltaje',
    'V_x = V_s \frac{R_x}{R_1 + R_2}',
    'En un circuito serie, el voltaje se reparte de forma directamente proporcional a la magnitud de cada resistencia.'
),
(
    6,
    2,
    'card-current-divider',
    'Divisor de Corriente',
    'I_1 = I_s \frac{R_2}{R_1 + R_2}',
    'En dos ramas en paralelo, la corriente se divide inversamente proporcional a la resistencia de cada rama.'
),
(
    7,
    3,
    'card-thevenin',
    'Teorema de Thévenin',
    'V_{th} = V_{oc}, \quad R_{th} = R_{eq}',
    'Cualquier red lineal activa de dos terminales puede reemplazarse por una sola fuente de voltaje Vth en serie con una resistencia Rth.'
),
(
    8,
    4,
    'card-rc-tau',
    'Constante de Tiempo RC',
    '\tau = R \cdot C',
    'Tiempo característico de carga o descarga. Al cabo de 1 tau el capacitor alcanza el 63.2% de su voltaje final; a 5 tau se considera en estado estable (99.3%).'
),
(
    9,
    4,
    'card-ac-power-triangle',
    'Triángulo de Potencias CA',
    'S = \sqrt{P^2 + Q^2}, \quad \text{FP} = \cos(\theta)',
    'P es la potencia activa útil (Watts), Q la potencia reactiva oscilante (VAR), y S la potencia aparente total (VA).'
)
ON CONFLICT (card_id) DO NOTHING;
