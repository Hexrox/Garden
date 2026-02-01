-- Naprawa polskich nazw roślin w bazie danych
-- Sekcja A: Błędne/obce nazwy

UPDATE plants SET display_name = 'Karczoch ''Green Globe''', name = 'karczoch_green_globe' WHERE id = 729;
UPDATE plants SET display_name = 'Berberys ''Atropurpurea''', name = 'berberys_atropurpurea' WHERE id = 913;
UPDATE plants SET display_name = 'Dereniowiec jadalny' WHERE id = 400;
UPDATE plants SET display_name = 'Mięta pieprzowa + Melisa (mieszanka)', name = 'mieta_pieprzowa_melisa_mieszanka' WHERE id = 954;
UPDATE plants SET display_name = 'Aster nowobelgijski ''Purple Dome''' WHERE id = 504;
UPDATE plants SET display_name = 'Torenia ''Clown Mix''', name = 'torenia_clown_mix' WHERE id = 667;
UPDATE plants SET display_name = 'Chaber bławatek ''Blue Boy''', name = 'chaber_blawtek_blue_boy' WHERE id = 663;
UPDATE plants SET display_name = 'Kapar (Capparis)', name = 'kapar_capparis' WHERE id = 662;
UPDATE plants SET display_name = 'Dziewanna patagońska' WHERE id = 539;
UPDATE plants SET display_name = 'Kolendra boliwijska', name = 'kolendra_boliwijska' WHERE id = 823;
UPDATE plants SET display_name = 'Groch cukrowy tajwański', name = 'groch_cukrowy_tajwanski' WHERE id = 855;

-- Sekcja B: Nazwy łacińskie zamiast polskich

UPDATE plants SET display_name = 'Krwawnik ''Moonshine''' WHERE id = 519;
UPDATE plants SET display_name = 'Kłosowiec ''Blue Fortune''' WHERE id = 526;
UPDATE plants SET display_name = 'Dąbrówka rozłogowa ''Catlin''''s Giant''' WHERE id = 510;
UPDATE plants SET display_name = 'Zawilec japoński ''Honorine Jobert''' WHERE id = 517;
UPDATE plants SET display_name = 'Tawułka ''Fanal''' WHERE id = 516;
UPDATE plants SET display_name = 'Brunnera wielkolistna ''Jack Frost''' WHERE id = 513;
UPDATE plants SET display_name = 'Dzwonek skupiony ''Superba''' WHERE id = 520;
UPDATE plants SET display_name = 'Kleome kolczasta ''Violet Queen''' WHERE id = 657;
UPDATE plants SET display_name = 'Nachyłek ''Moonbeam''' WHERE id = 507;
UPDATE plants SET display_name = 'Goździk ''Firewitch''' WHERE id = 521;
UPDATE plants SET display_name = 'Jeżówka ''Magnus''' WHERE id = 501;
UPDATE plants SET display_name = 'Kokarda ''Arizona Sun''' WHERE id = 506;
UPDATE plants SET display_name = 'Trytoma ''Papaya Popsicle''' WHERE id = 525;
UPDATE plants SET display_name = 'Ślazówka ''Silver Cup''' WHERE id = 648;
UPDATE plants SET display_name = 'Złocień wielki ''Becky''' WHERE id = 522;
UPDATE plants SET display_name = 'Liatra kłosowa ''Kobold''' WHERE id = 524;
UPDATE plants SET display_name = 'Pysznogłówka ''Cambridge Scarlet''' WHERE id = 518;
UPDATE plants SET display_name = 'Miodunka ''Trevi Fountain''' WHERE id = 512;
UPDATE plants SET display_name = 'Żuraweczka ''Spring Symphony''' WHERE id = 514;
UPDATE plants SET display_name = 'Werbena ''Obsession Cascade Mix''' WHERE id = 644;
UPDATE plants SET display_name = 'Przetacznik ''Royal Candles''' WHERE id = 523;
UPDATE plants SET display_name = 'Słonecznik ''Italian White''' WHERE id = 672;

-- Sekcja C: Duplikaty do usunięcia

DELETE FROM plants WHERE id IN (508, 502, 511, 515, 500, 505, 503, 881, 848);

-- Sekcja D: Niespójności nazw (Botwina -> Boćwina)

UPDATE plants SET name = 'bocwina_fordhook_giant', display_name = 'Boćwina ''Fordhook Giant''' WHERE id = 751;
UPDATE plants SET name = 'bocwina_mlode_buraki', display_name = 'Boćwina (młode buraki)' WHERE id = 810;
UPDATE plants SET name = REPLACE(name, 'botwina', 'bocwina'), display_name = REPLACE(display_name, 'Botwina', 'Boćwina') WHERE id = 856;

-- Sekcja E: Inne poprawki

UPDATE plants SET display_name = 'Koper włoski ''Florence''', name = 'koper_wloski_florence' WHERE id = 726;
UPDATE plants SET display_name = 'Koper włoski ''Florence''', name = 'koper_wloski_florence_2' WHERE id = 852;
UPDATE plants SET display_name = 'Pak choi ''Joi Choi''', name = 'pak_choi_joi_choi' WHERE id = 716;
UPDATE plants SET display_name = 'Cykoria radicchio ''Palla Rossa''' WHERE id = 787;
UPDATE plants SET display_name = 'Ogórecznik lekarski', name = 'ogorecznik_lekarski' WHERE id = 975;
