-- System problemów ogrodniczych i rekomendacji rozwiązań
-- Problem-First Workflow: od problemu → do rozwiązania
-- Data: 2025-12-15

-- ================================================================================================
-- TABELA: PROBLEMY ROŚLIN
-- ================================================================================================

CREATE TABLE IF NOT EXISTS plant_problems (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,                    -- Nazwa problemu (np. "Mszyca brzoskwiniowa")
    common_name TEXT,                      -- Potoczna nazwa (np. "czarne mszyce")
    category TEXT NOT NULL,                -- szkodnik, choroba_grzybowa, choroba_bakteryjna, niedobor
    severity TEXT,                         -- niska, srednia, wysoka, krytyczna

    -- Opis
    description TEXT,                      -- Krótki opis problemu
    symptoms TEXT,                         -- Objawy (jak rozpoznać)

    -- Rośliny podatne
    affects_plants TEXT,                   -- Które rośliny atakuje (CSV: "pomidor,ogórek,papryka")
    plant_category TEXT,                   -- warzywa, owoce, kwiaty, drzewa, trawnik

    -- Sezonowość
    peak_season TEXT,                      -- Kiedy najczęściej (wiosna, lato, jesień, cały_sezon)

    -- Metadane
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_problems_category ON plant_problems(category);
CREATE INDEX IF NOT EXISTS idx_problems_plants ON plant_problems(affects_plants);
CREATE INDEX IF NOT EXISTS idx_problems_season ON plant_problems(peak_season);

-- ================================================================================================
-- TABELA: ROZWIĄZANIA (połączenie problemów ze środkami)
-- ================================================================================================

CREATE TABLE IF NOT EXISTS problem_solutions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    problem_id INTEGER NOT NULL,           -- FK do plant_problems
    product_id INTEGER,                    -- FK do spray_products (NULL dla metod niechemicznych)

    -- Skuteczność
    effectiveness TEXT DEFAULT 'średnia', -- wysoka, średnia, niska
    speed TEXT DEFAULT 'średnia',          -- szybka (1-3 dni), średnia (4-7 dni), wolna (>7 dni)

    -- Metoda niechemiczna (opcjonalnie)
    non_chemical_method TEXT,              -- Np. "zbieranie ręczne", "strumień wody"

    -- Uwagi
    notes TEXT,                            -- Uwagi specyficzne dla tego problemu
    best_stage TEXT,                       -- Moment stosowania (wczesne_stadium, zapobiegawczo, itp.)

    -- Priorytet
    priority INTEGER DEFAULT 0,            -- Im wyższy, tym wyżej w wynikach (0-10)
    is_recommended BOOLEAN DEFAULT 1,      -- Czy to zalecane rozwiązanie (vs alternatywne)

    FOREIGN KEY(problem_id) REFERENCES plant_problems(id) ON DELETE CASCADE,
    FOREIGN KEY(product_id) REFERENCES spray_products(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_solutions_problem ON problem_solutions(problem_id);
CREATE INDEX IF NOT EXISTS idx_solutions_product ON problem_solutions(product_id);
CREATE INDEX IF NOT EXISTS idx_solutions_priority ON problem_solutions(priority DESC);
