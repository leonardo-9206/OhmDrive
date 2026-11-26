-- ==============================================================================
-- OhmDrive - PostgreSQL 15 Relational Schema (3NF)
-- Single Source of Truth: Docs nosotros/02_DATA_DICTIONARY.md
-- Updated to Official Rubric (3 Units · 6 Levels · 24 Exercises in DC)
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
-- 3. sectors (Rubric Criterion 2: 3 Units in DC)
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
-- 4. lessons (Rubric Criterion 3: Theory, KaTeX Formulas & Solved Example JSON)
-- ------------------------------------------------------------------------------
CREATE TABLE lessons (
    lesson_id SERIAL PRIMARY KEY,
    sector_id INT NOT NULL REFERENCES sectors(sector_id) ON DELETE CASCADE,
    node_order INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    topic_tag VARCHAR(50) NOT NULL,
    theory_markdown TEXT NOT NULL,
    formulas_markdown TEXT,
    solved_example_json JSONB,
    xp_reward INT NOT NULL DEFAULT 100 CHECK (xp_reward >= 0),
    is_boss_level BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_sector_node UNIQUE (sector_id, node_order)
);

-- ------------------------------------------------------------------------------
-- 5. challenges (Rubric Criteria 4, 5, 6 & 7: Multiple Choice + Numeric Input with Units and Hints)
-- ------------------------------------------------------------------------------
CREATE TABLE challenges (
    challenge_id VARCHAR(50) PRIMARY KEY,
    lesson_id INT NOT NULL REFERENCES lessons(lesson_id) ON DELETE CASCADE,
    step_order INT NOT NULL,
    interaction_type VARCHAR(40) NOT NULL CHECK (interaction_type IN ('multiple_choice', 'numeric_input', 'component_slot', 'multimeter_probe', 'slider_tuning', 'superposition_toggle')),
    difficulty VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (difficulty IN ('basic', 'normal', 'boss')),
    prompt_text TEXT NOT NULL,
    hint_markdown TEXT,
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
-- 7. user_sector_progress (Rubric Criteria 9 & 10: All 3 units unlocked)
-- ------------------------------------------------------------------------------
CREATE TABLE user_sector_progress (
    progress_id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    sector_id INT NOT NULL REFERENCES sectors(sector_id) ON DELETE CASCADE,
    is_unlocked BOOLEAN NOT NULL DEFAULT TRUE,
    completed_nodes INT NOT NULL DEFAULT 0 CHECK (completed_nodes >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_sector UNIQUE (user_id, sector_id)
);

-- ------------------------------------------------------------------------------
-- 8. user_lesson_attempts (Rubric Criterion 8: Correct count, Error count, Score points)
-- ------------------------------------------------------------------------------
CREATE TABLE user_lesson_attempts (
    attempt_id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    lesson_id INT NOT NULL REFERENCES lessons(lesson_id) ON DELETE CASCADE,
    correct_count INT NOT NULL DEFAULT 0 CHECK (correct_count >= 0),
    error_count INT NOT NULL DEFAULT 0 CHECK (error_count >= 0),
    score_points INT NOT NULL DEFAULT 0 CHECK (score_points >= 0),
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
CREATE INDEX idx_practice_time_attack ON practice_sessions(practice_mode, watts_earned DESC, correct_answers DESC);
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

-- Read policies for public catalogs
CREATE POLICY "Public read sectors" ON sectors FOR SELECT USING (true);
CREATE POLICY "Public read lessons" ON lessons FOR SELECT USING (true);
CREATE POLICY "Public read challenges" ON challenges FOR SELECT USING (true);
CREATE POLICY "Public read codex_cards" ON codex_cards FOR SELECT USING (true);
CREATE POLICY "Public read roles" ON roles FOR SELECT USING (true);

-- User table read for leaderboard
CREATE POLICY "Public read leaderboard" ON users FOR SELECT USING (true);
CREATE POLICY "User can insert themselves" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "User can update own data" ON users FOR UPDATE USING (true);

-- Progress policies
CREATE POLICY "User progress access" ON user_sector_progress FOR ALL USING (true);
CREATE POLICY "User attempts access" ON user_lesson_attempts FOR ALL USING (true);
CREATE POLICY "Practice sessions access" ON practice_sessions FOR ALL USING (true);
CREATE POLICY "Unlocked cards access" ON user_unlocked_cards FOR ALL USING (true);

-- ==============================================================================
-- SEED DATA (OFFICIAL 3 UNITS & 6 LEVELS OF THE RUBRIC)
-- ==============================================================================

-- 1. Roles
INSERT INTO roles (role_id, role_name) VALUES
    (1, 'student'),
    (2, 'professor'),
    (3, 'admin')
ON CONFLICT (role_id) DO NOTHING;

-- 2. Sectors (Rubric Criterion 2: Exactly 3 Units in DC)
INSERT INTO sectors (sector_id, sector_order, slug, title, uaa_unit_ref, lore_description, accent_color_hex) VALUES
(
    1,
    1,
    'distrito-ohm',
    'Unidad 1: Distrito Ohm',
    'Unidad I: Fundamentos y Potencia en CD',
    'Los generadores del Distrito Ohm han caído tras la sobretensión. Restablece el voltaje nominal calculando resistencias, corrientes y disipación de potencia en corriente directa.',
    '#00F0FF'
),
(
    2,
    2,
    'red-distribucion',
    'Unidad 2: Red de Distribución',
    'Unidad II: Redes Resistivas y Circuitos Divisores',
    'Las subestaciones de distribución presentan desbalances. Domina las combinaciones serie, paralelo, mixtas y divisores de voltaje y corriente con exactitud milimétrica.',
    '#FFB800'
),
(
    3,
    3,
    'nucleo-kirchhoff',
    'Unidad 3: Núcleo Kirchhoff',
    'Unidad III: Leyes de Kirchhoff y Análisis Sistemático',
    'El núcleo de control requiere análisis nodal y de mallas. Aplica LCK, LVK y sistemas de ecuaciones lineales para equilibrar la red completa.',
    '#FF2A85'
)
ON CONFLICT (sector_id) DO UPDATE SET
    title = EXCLUDED.title,
    uaa_unit_ref = EXCLUDED.uaa_unit_ref,
    lore_description = EXCLUDED.lore_description,
    accent_color_hex = EXCLUDED.accent_color_hex;

-- 3. Lessons (Rubric Criterion 2: Exactly 6 Levels in DC)
INSERT INTO lessons (lesson_id, sector_id, node_order, title, topic_tag, theory_markdown, formulas_markdown, xp_reward, is_boss_level) VALUES
(
    1,
    1,
    1,
    'Nivel 1: Voltaje, corriente y resistencia',
    'v_i_r',
    '# ⚡ Fundamentos Eléctricos en CD\nLa corriente eléctrica ($I$) es el flujo ordenado de carga por unidad de tiempo. La diferencia de potencial o voltaje ($V$) proporciona la energía necesaria para mover dicha carga, mientras que la resistencia ($R$) cuantifica la oposición natural del material a este movimiento.',
    '### 📐 Fórmulas de Fundamentos\n* $$I = \frac{\Delta q}{\Delta t} \quad [\text{A} = \text{C/s}]$$\n* $$V = \frac{W}{q} \quad [\text{V} = \text{J/C}]$$\n* $$R = \rho \frac{L}{A} \quad [\Omega]$$',
    100,
    false
),
(
    2,
    1,
    2,
    'Nivel 2: Ley de Ohm y potencia',
    'ohm_power',
    '# ⚡ Ley de Ohm y Disipación de Potencia\nEn conductores óhmicos, la corriente es directamente proporcional al voltaje aplicado. La potencia disipada por Efecto Joule mide la tasa de energía convertida en calor.',
    '### 📐 Fórmulas de Ley de Ohm y Potencia\n* $$V = I \cdot R \iff I = \frac{V}{R} \iff R = \frac{V}{I}$$\n* $$P = V \cdot I = I^2 R = \frac{V^2}{R} \quad [\text{Watts, W}]$$',
    100,
    false
),
(
    3,
    2,
    1,
    'Nivel 3: Serie y paralelo',
    'series_parallel',
    '# ⚡ Conexiones Serie y Paralelo\nEn serie, todos los elementos comparten la misma corriente ($I$). En paralelo, todos comparten la misma diferencia de potencial ($V$) entre sus nodos comunes.',
    '### 📐 Fórmulas de Reducción\n* **Serie:** $$R_{eq} = R_1 + R_2 + \dots + R_n$$\n* **Paralelo:** $$\frac{1}{R_{eq}} = \sum \frac{1}{R_i} \iff R_{eq} = \frac{R_1 \cdot R_2}{R_1 + R_2}$$',
    100,
    false
),
(
    4,
    2,
    2,
    'Nivel 4: Divisores de voltaje y corriente',
    'dividers',
    '# ⚡ Principio de División de Voltaje y Corriente\nEn circuitos serie el voltaje se divide proporcionalmente a cada resistencia. En ramas paralelas la corriente se reparte inversamente a la resistencia de cada camino.',
    '### 📐 Fórmulas de Divisores\n* **Divisor de Voltaje:** $$V_x = V_s \frac{R_x}{R_{eq}}$$\n* **Divisor de Corriente:** $$I_1 = I_s \frac{R_2}{R_1 + R_2}$$',
    100,
    false
),
(
    5,
    3,
    1,
    'Nivel 5: Leyes de Kirchhoff',
    'kirchhoff',
    '# ⚡ Leyes Fundamentales de Kirchhoff\nLa LCK establece la conservación de la carga en cada nodo ($\sum I = 0$). La LVK establece la conservación de la energía en cada trayectoria cerrada ($\sum V = 0$).',
    '### 📐 Ecuaciones de Kirchhoff\n* **LCK:** $$\sum I_{\text{entran}} = \sum I_{\text{salen}}$$\n* **LVK:** $$\sum V_{\text{elevaciones}} = \sum V_{\text{caídas}}$$',
    100,
    false
),
(
    6,
    3,
    2,
    'Nivel 6: Introducción a nodos y mallas',
    'nodes_meshes',
    '# ⚡ Métodos Sistemáticos: Nodos y Mallas\nEl análisis de nodos aplica LCK expresando corrientes en función de voltajes de nodo respecto a una referencia (GND). El análisis de mallas aplica LVK utilizando corrientes de lazo independientes.',
    '### 📐 Planteamiento Sistemático\n* **Nodos:** $$\sum \frac{V_k - V_j}{R_{kj}} = \sum I_{\text{fuentes}}$$\n* **Mallas:** $$[R] [I] = [V]$$',
    100,
    true
)
ON CONFLICT (lesson_id) DO UPDATE SET
    title = EXCLUDED.title,
    topic_tag = EXCLUDED.topic_tag,
    theory_markdown = EXCLUDED.theory_markdown,
    formulas_markdown = EXCLUDED.formulas_markdown;

-- 4. Initial Codex Cards (The 6 Essential Formulas in DC)
INSERT INTO codex_cards (card_id, sector_id, code_slug, title, formula_latex, summary_text) VALUES
(
    1,
    1,
    'card-v-i-r',
    'Carga y Corriente en CD',
    'I = \frac{\Delta q}{\Delta t}, \quad V = \frac{W}{q}',
    'La corriente eléctrica representa la tasa de flujo de electrones en Amperes (Coulombs por segundo).'
),
(
    2,
    1,
    'card-ohm-power',
    'Ley de Ohm y Potencia',
    'V = I \cdot R, \quad P = V \cdot I = I^2 R = \frac{V^2}{R}',
    'Relación fundamental entre potencial, corriente y resistencia; y la rapidez con la que se disipa energía en forma de calor.'
),
(
    3,
    2,
    'card-series-parallel',
    'Resistencia Equivalente Serie y Paralelo',
    'R_{\text{serie}} = \sum R_i, \quad R_{\text{paralelo}} = \frac{R_1 R_2}{R_1 + R_2}',
    'Reglas de simplificación para agrupaciones resistivas en serie (suma directa) y en paralelo (conductancias inversas).'
),
(
    4,
    2,
    'card-dividers',
    'Divisores de Voltaje y Corriente',
    'V_x = V_s \frac{R_x}{R_{eq}}, \quad I_1 = I_s \frac{R_2}{R_1 + R_2}',
    'Reparto proporcional de voltaje en ramas serie y reparto inversamente proporcional de corriente en ramas paralelas.'
),
(
    5,
    3,
    'card-kcl-kvl',
    'Leyes de Kirchhoff (LCK y LVK)',
    '\sum I_{\text{nodo}} = 0, \quad \sum V_{\text{lazo}} = 0',
    'Conservación de la carga en los nodos de unión y conservación de la energía a lo largo de cualquier lazo cerrado.'
),
(
    6,
    3,
    'card-nodes-meshes',
    'Análisis de Nodos y Mallas',
    '\frac{V_A - V_B}{R} = I, \quad R_{11} I_1 - R_{12} I_2 = V_{s1}',
    'Técnicas matriciales sistemáticas para resolver redes de múltiples lazos y nodos con varias fuentes de alimentación.'
)
ON CONFLICT (card_id) DO UPDATE SET
    title = EXCLUDED.title,
    formula_latex = EXCLUDED.formula_latex,
    summary_text = EXCLUDED.summary_text;

-- ==============================================================================
-- REALTIME PUBLICATION (LEADERBOARD LIVE UPDATES)
-- ==============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables
            WHERE pubname = 'supabase_realtime' AND tablename = 'users'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE users;
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables
            WHERE pubname = 'supabase_realtime' AND tablename = 'practice_sessions'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE practice_sessions;
        END IF;
    END IF;
END $$;
