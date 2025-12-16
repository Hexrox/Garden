-- Tabela z bazą środków ochrony roślin dla ogrodników hobbystów
-- Data: 2025-12-15

CREATE TABLE IF NOT EXISTS spray_products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,                          -- Nazwa handlowa (np. "Topsin M 500 SC")
    active_substance TEXT,                       -- Substancja czynna (np. "tiofanat metylowy")
    type TEXT NOT NULL,                          -- Typ: fungicyd, insektycyd, herbicyd, akarycyd, moluskocyd, nawóz_dolistny, biostymulanty
    is_ecological BOOLEAN DEFAULT 0,             -- Czy dopuszczony do rolnictwa ekologicznego

    -- Dawkowanie podstawowe (profesjonalne)
    dosage_professional TEXT,                    -- Dawka profesjonalna (np. "1.5ml/1L", "30g/5L")

    -- Dawkowanie dla hobbystów (przeliczone na małe objętości)
    dosage_2l TEXT,                              -- Dawka na 2L opryskiwacz
    dosage_5l TEXT,                              -- Dawka na 5L opryskiwacz
    dosage_notes TEXT,                           -- Dodatkowe uwagi o dawkowaniu

    -- Okres karencji i bezpieczeństwo
    withdrawal_period INTEGER,                   -- Okres karencji w dniach (NULL = brak karencji)

    -- Zastosowanie
    target_plants TEXT,                          -- Dla jakich roślin (np. "pomidory, ogórki, papryka")
    target_pests TEXT,                           -- Przeciwko czemu (np. "mszyce, zaraza, chwasty")

    -- Informacje dodatkowe
    application_method TEXT,                     -- Sposób aplikacji (oprysk, podlanie, granulat)
    max_applications INTEGER,                    -- Maksymalna liczba zabiegów w sezonie
    interval_days INTEGER,                       -- Odstęp między zabiegami w dniach
    temperature_range TEXT,                      -- Zakres temperatur (np. "12-25°C")
    warnings TEXT,                               -- Ostrzeżenia i środki ostrożności

    -- Status rejestracji
    registered_poland BOOLEAN DEFAULT 1,         -- Czy zarejestrowany w Polsce
    registration_number TEXT,                    -- Numer rejestracji MRiRW

    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_spray_products_type ON spray_products(type);
CREATE INDEX idx_spray_products_name ON spray_products(name);
CREATE INDEX idx_spray_products_ecological ON spray_products(is_ecological);
CREATE INDEX idx_spray_products_target_plants ON spray_products(target_plants);

-- ================================================================================================
-- DANE: Popularne środki ochrony roślin dla ogrodników hobbystów (Polska 2025)
-- ================================================================================================

-- FUNGICYDY (środki grzybobójcze)

INSERT INTO spray_products (
    name, active_substance, type, is_ecological,
    dosage_professional, dosage_2l, dosage_5l, dosage_notes,
    withdrawal_period,
    target_plants, target_pests,
    application_method, max_applications, interval_days, temperature_range,
    warnings, registered_poland
) VALUES
(
    'Topsin M 500 SC',
    'tiofanat metylowy 500g/L',
    'fungicyd',
    0,
    '1.5ml/1L (0.15%)',
    '3ml',
    '7.5ml',
    'Oprysk drobnokapiący, dokładnie zwilżyć rośliny',
    3,
    'pomidory, ogórki, papryka (pod osłonami)',
    'antraknoza dyniowatych, choroby grzybowe',
    'oprysk',
    3,
    7,
    NULL,
    'Nie stosować w mieszaninie z innymi środkami. Może wywoływać reakcje alergiczne.',
    1
),
(
    'Miedzian 50 WP',
    'tlenochlorek miedzi 500g Cu/kg',
    'fungicyd',
    1,
    '30g/5-7.5L/100m²',
    '8-12g',
    '20-30g',
    'Proszek do sporządzenia zawiesiny wodnej. Dokładnie wymieszać przed użyciem.',
    7,
    'jabłoń, grusza, wiśnia, czereśnia, pomidor, ogórek, fasola',
    'parch, zaraza ogniowa, rak bakteryjny, mączniak',
    'oprysk',
    3,
    7,
    NULL,
    'Środek miedziowy - nie przekraczać dawek. Dopuszczony w rolnictwie ekologicznym.',
    1
),
(
    'Biosept Active 33 SL',
    'ekstrakt z grejpfruta 33%',
    'biofungicyd',
    1,
    '0.5-1ml/1L (0.05-0.1%)',
    '1-2ml',
    '2.5-5ml',
    '100% naturalny preparat. Można stosować do zbioru.',
    NULL,
    'wszystkie warzywa i owoce, rośliny ozdobne',
    'choroby grzybowe, bakterie, wirusy',
    'oprysk lub podlanie',
    NULL,
    7,
    NULL,
    'Całkowicie bezpieczny dla ludzi i zwierząt. Brak okresu karencji.',
    1
),
(
    'Polyversum WP',
    'Pythium oligandrum (grzyb antagonistyczny)',
    'biofungicyd',
    1,
    '0.5g/1L (5g/10L)',
    '1g',
    '2.5g',
    'Preparat biologiczny. Przed użyciem namoczyć w wodzie min. 1h. Działa najlepiej 12-25°C.',
    NULL,
    'truskawki, pomidory, ogórki, sałata, trawniki',
    'zgnilizna korzeni, fytoftoroza, zaraza ziemniaka, szara pleśń',
    'oprysk lub podlanie',
    NULL,
    14,
    '12-25°C',
    'Ekologiczny, bezpieczny dla pszczół. Brak okresu karencji.',
    1
);

-- INSEKTYCYDY (środki owadobójcze)

INSERT INTO spray_products (
    name, active_substance, type, is_ecological,
    dosage_professional, dosage_2l, dosage_5l, dosage_notes,
    withdrawal_period,
    target_plants, target_pests,
    application_method, max_applications, interval_days,
    warnings, registered_poland
) VALUES
(
    'Mospilan 20 SP',
    'acetamipryd 200g/kg',
    'insektycyd',
    0,
    '2g/2-9L lub 4g/10L',
    '0.8-1.8g',
    '2g',
    'Proszek do sporządzania zawiesiny wodnej. Opryskiwać przy pierwszych objawach szkodników.',
    14,
    'pomidory, ogórki, ziemniaki, kapusta, rośliny ozdobne',
    'mszyce, wciornastki, pchełki, mszyce brzoskwiniowa',
    'oprysk',
    2,
    7,
    'Toksyczny dla pszczół - nie stosować w czasie kwitnienia. Okres karencji: 14 dni (ziemniaki: 3 dni).',
    1
),
(
    'Karate Zeon 050 CS',
    'lambda-cyhalotryna 50g/L',
    'insektycyd',
    0,
    '1.2ml/100m² (2-6L wody)',
    '0.4-1.2ml',
    '1-3ml',
    'Mikrokapsuły. Opryskiwać przy pierwszych szkodnikach. Bardzo skuteczny kontaktowo i żołądkowo.',
    7,
    'kapusta, chrzan, pomidor, rzodkiewka, warzywa strączkowe, cebula, por',
    'mszyce, wciornastki, pchełki, śmietki, gąsienice',
    'oprysk',
    2,
    7,
    'Bardzo toksyczny dla pszczół i organizmów wodnych. Nie stosować w czasie kwitnienia.',
    1
);

-- HERBICYDY (środki chwastobójcze)

INSERT INTO spray_products (
    name, active_substance, type, is_ecological,
    dosage_professional, dosage_2l, dosage_5l, dosage_notes,
    withdrawal_period,
    target_plants, target_pests,
    application_method, max_applications, interval_days,
    warnings, registered_poland
) VALUES
(
    'Roundup 360 Plus',
    'glifosat 360g/L',
    'herbicyd',
    0,
    '10-20ml/1L',
    '20-40ml',
    '50-100ml',
    'Herbicyd totalny - niszczy wszystkie rośliny! Stosować punktowo lub przed sadzeniem.',
    NULL,
    'chwasty jednoroczne i wieloletnie przed uprawą',
    'wszystkie chwasty (perz, pokrzywa, chwasty jednoroczne)',
    'oprysk (przed siewem/sadzeniem)',
    1,
    NULL,
    'UWAGA: Glifosat sklasyfikowany jako "prawdopodobnie rakotwórczy". Nie stosować na uprawach! Tylko przed siewem.',
    1
),
(
    'Roundup 60 Hobby',
    'glifosat (wersja dla ogrodników)',
    'herbicyd',
    0,
    '60-90ml/1L/30m²',
    '120-180ml',
    '300-450ml',
    'Wersja hobby o wyższym stężeniu. Stosować bardzo ostrożnie!',
    NULL,
    'chwasty przed założeniem ogrodu/trawnika',
    'wszystkie chwasty przed uprawą',
    'oprysk',
    1,
    NULL,
    'Substancja kontrowersyjna. Nie stosować na roślinach uprawnych. Chronić skórę i drogi oddechowe.',
    1
),
(
    'Lontrel 300 SL',
    'chlopyralid 300g/L',
    'herbicyd',
    0,
    '4-8ml/2-3L/100m²',
    '0.3-0.5ml',
    '0.7-1.3ml',
    'Herbicyd selektywny - bezpieczny dla traw, niszczy chwasty dwuliścienne.',
    NULL,
    'trawniki ozdobne, boiska trawiaste',
    'chwasty dwuliścienne, stokrotki, mniszek, koniczyna',
    'oprysk',
    1,
    NULL,
    'Selektywny - nie uszkadza traw. Stosować na młode, rosnące chwasty (2-3 liście).',
    1
);

-- MOLUSKOCYDY (środki ślimakobójcze)

INSERT INTO spray_products (
    name, active_substance, type, is_ecological,
    dosage_professional, dosage_2l, dosage_5l, dosage_notes,
    withdrawal_period,
    target_plants, target_pests,
    application_method, max_applications, interval_days,
    warnings, registered_poland
) VALUES
(
    'Snacol 5 GB',
    'metaldehyd 50g/kg',
    'moluskocyd',
    0,
    '4-7g/10m²',
    NULL,
    NULL,
    'Granulat rozrzucany na powierzchni gleby wokół roślin. Nie rozpuszczać w wodzie!',
    NULL,
    'warzywa liściowe (sałata, szpinak, kapusta), rośliny ozdobne',
    'ślimaki nagi, ślimaki winniczki',
    'granulat (rozsypywanie)',
    3,
    14,
    'Granulat - nie stosować oprysku! Może być szkodliwy dla zwierząt domowych. Brak okresu karencji.',
    1
),
(
    'Snacol 3 GB',
    'metaldehyd 26.5g/kg',
    'moluskocyd',
    0,
    '7g/10m²',
    NULL,
    NULL,
    'Granulat o niższym stężeniu. Rozrzucać wokół roślin. Na 1m² = 0.7g granulatu.',
    NULL,
    'warzywa liściowe, kapusta, rośliny ozdobne',
    'ślimaki',
    'granulat (rozsypywanie)',
    3,
    14,
    'Chronić przed dostępem zwierząt domowych. Stosować wieczorem, gdy ślimaki są aktywne.',
    1
);

-- METODY DOMOWE I BIOPREPARATY WŁASNE

INSERT INTO spray_products (
    name, active_substance, type, is_ecological,
    dosage_professional, dosage_2l, dosage_5l, dosage_notes,
    withdrawal_period,
    target_plants, target_pests,
    application_method, max_applications, interval_days,
    warnings, registered_poland
) VALUES
(
    'Napar z czosnku',
    'siarka, allicyna (naturalne)',
    'metoda_domowa',
    1,
    '3-5 ząbków/1L wody',
    '6-10 ząbków',
    '15-25 ząbków',
    'Napar: rozgnieść czosnek, zalej wodą, odstaw 24h. Rozcieńczyć 1:5 przed użyciem. Stosować świeżo przygotowany.',
    0,
    'wszystkie warzywa, kwiaty, drzewa owocowe',
    'mszyca, przędziorek, mączniak',
    'oprysk',
    NULL,
    7,
    'Preparat naturalny, bezpieczny dla ludzi i pszczół. Może odstraszać zapachem. Stosować wieczorem.',
    1
),
(
    'Roztwór mydła szarego',
    'kwasy tłuszczowe (naturalne)',
    'metoda_domowa',
    1,
    '20g mydła/1L ciepłej wody',
    '40g mydła',
    '100g mydła',
    'Rozpuścić mydło w ciepłej wodzie, ostudzić. Można dodać 1 łyżkę oleju roślinnego dla lepszej przyczepności.',
    0,
    'wszystkie warzywa, kwiaty, rośliny ozdobne',
    'mszyca, mączlik szklarniowy, wciornastki',
    'oprysk',
    NULL,
    5,
    'Naturalny i bezpieczny. Spłukać przed spożyciem warzyw. Nie stosować w pełnym słońcu.',
    1
),
(
    'Napar z pokrzywy',
    'azot, mikroelementy (naturalne)',
    'metoda_domowa',
    1,
    '1kg pokrzywy/10L wody',
    '200g pokrzywy/2L',
    '500g pokrzywy/5L',
    'Fermentacja 10-14 dni (przykryć, mieszać codziennie). Rozcieńczyć 1:10 przed użyciem. Cuchnący ale skuteczny!',
    0,
    'wszystkie warzywa, kwiaty (wzmocnienie ogólne)',
    'mszyca, wzmocnienie odporności roślin, nawożenie dolistne',
    'oprysk lub podlanie',
    NULL,
    7,
    'Intensywny zapach podczas fermentacji. Może przyciągać muchy. Stosować w dni pochmurne.',
    1
),
(
    'Mleko z wodą (1:9)',
    'białka mleka (naturalne)',
    'metoda_domowa',
    1,
    'Mleko:woda 1:9',
    '200ml mleka + 1.8L wody',
    '500ml mleka + 4.5L wody',
    'Zwykłe mleko krowie rozcieńczone wodą. Stosować zapobiegawczo lub przy pierwszych objawach.',
    0,
    'ogórek, cukinia, dynia, kabaczek',
    'mączniak prawdziwy',
    'oprysk',
    NULL,
    7,
    'Całkowicie bezpieczne. Może zostawiać białe naloty - spłukać przed zbiorem. Nie stosować w upale.',
    1
),
(
    'Soda oczyszczona + olej',
    'wodorowęglan sodu (naturalne)',
    'metoda_domowa',
    1,
    '5g sody + 5ml oleju/1L wody',
    '10g sody + 10ml oleju',
    '25g sody + 25ml oleju',
    'Dokładnie wymieszać sodę z olejem roślinnym, dodać wodę. Używać świeżo przygotowanego roztworu.',
    0,
    'ogórek, cukinia, pomidor, róże',
    'mączniak prawdziwy, szara pleśń, choroby grzybowe',
    'oprysk',
    NULL,
    7,
    'Bezpieczny preparat. Zmienia pH powierzchni liści. Nie przesadzać z dawką.',
    1
);

-- ================================================================================================
-- Aktualizacja timestamp
-- ================================================================================================

CREATE TRIGGER update_spray_products_timestamp
AFTER UPDATE ON spray_products
BEGIN
    UPDATE spray_products SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
