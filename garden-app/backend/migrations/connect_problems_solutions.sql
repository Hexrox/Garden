-- Połączenie problemów ze środkami ochrony (rekomendacje)
-- Problem → Rozwiązanie (środki + metody niechemiczne)
-- Data: 2025-12-15

-- ================================================================================================
-- MSZYCA BRZOSKWINIOWA (id:1) - czarne mszyce na pomidorach/paprycereferencja
-- ================================================================================================

INSERT INTO problem_solutions (problem_id, product_id, effectiveness, speed, notes, best_stage, priority, is_recommended) VALUES
-- Środki chemiczne
(1, 38, 'wysoka', 'szybka', 'Pirimor - selektywny na mszyce, oszczędza pożyteczne. Działa najlepiej >15°C.', 'pierwsze_kolonie', 10, 1),
(1, 5, 'wysoka', 'średnia', 'Mospilan - systemiczny, długie działanie. Karencja 14 dni.', 'pierwsze_kolonie', 9, 1),
(1, 37, 'wysoka', 'szybka', 'Calypso - systemiczny, bezpieczny dla pszczół po wyschnięciu. Długie działanie 21 dni.', 'pierwsze_kolonie', 8, 1),
-- Metody ekologiczne
(1, 12, 'średnia', 'szybka', 'Napar z czosnku - naturalny, bezpieczny. Stosować wieczorem, powtarzać co 7 dni.', 'zapobiegawczo', 7, 1),
(1, 13, 'średnia', 'szybka', 'Roztwór mydła - skuteczny, bezpieczny. Spłukać przed zbiorem.', 'wczesne_stadium', 6, 1),
(1, NULL, 'niska', 'szybka', 'Strumień wody - zmycie mszyc strumieniem wody z młodych pędów. Powtarzać codziennie.', 'wczesne_stadium', 5, 1);

-- ================================================================================================
-- STONKA ZIEMNIACZANA (id:3)
-- ================================================================================================

INSERT INTO problem_solutions (problem_id, product_id, effectiveness, speed, notes, best_stage, priority, is_recommended) VALUES
(3, 37, 'wysoka', 'szybka', 'Calypso - bardzo skuteczny na stonkę. Systemiczny.', 'pierwsze_osobniki', 10, 1),
(3, 6, 'wysoka', 'szybka', 'Karate Zeon - pyretroid, silne działanie. Stosować wieczorem.', 'pierwsze_osobniki', 9, 1),
(3, NULL, 'średnia', 'średnia', 'Zbieranie ręczne - larw i osobników dorosłych do wiadra z wodą. Skuteczne na małych powierzchniach.', 'codziennie', 6, 1);

-- ================================================================================================
-- ŚLIMAKI NAGIE (id:4)
-- ================================================================================================

INSERT INTO problem_solutions (problem_id, product_id, effectiveness, speed, notes, best_stage, priority, is_recommended) VALUES
(4, 10, 'wysoka', 'średnia', 'Snacol 5 GB - granulat moluskocyd. Rozsypać wokół roślin wieczorem.', 'zapobiegawczo', 10, 1),
(4, 11, 'wysoka', 'średnia', 'Snacol 3 GB - niższe stężenie, bezpieczniejszy dla zwierząt.', 'zapobiegawczo', 9, 1),
(4, 28, 'średnia', 'szybka', 'Pułapki na piwo - wkopać kubeczki z piwem. Sprawdzać codziennie rano.', 'całą_noc', 7, 1),
(4, NULL, 'średnia', 'szybka', 'Zbieranie ręczne - wieczorem i rano. Najbezpieczniejsza metoda.', 'wieczorem_i_rano', 6, 1);

-- ================================================================================================
-- ZARAZA ZIEMNIAKA (id:11) - Phytophthora
-- ================================================================================================

INSERT INTO problem_solutions (problem_id, product_id, effectiveness, speed, notes, best_stage, priority, is_recommended) VALUES
(11, 35, 'wysoka', 'średnia', 'Ridomil Gold - systemiczny + kontaktowy. Najskuteczniejszy przeciw zarazie.', 'zapobiegawczo', 10, 1),
(11, 36, 'wysoka', 'średnia', 'Amistar - systemiczny fungicyd. Stosować zapobiegawczo przed deszczem.', 'zapobiegawczo', 9, 1),
(11, 23, 'średnia', 'średnia', 'Napar ze skrzypu - wzmacnia ściany komórkowe. Zapobiegawczy.', 'zapobiegawczo', 6, 1),
(11, NULL, NULL, NULL, 'Usuwanie porażonych liści - wycinać i spalić! Nie kompostować.', 'natychmiast', 8, 1);

-- ================================================================================================
-- MĄCZNIAK PRAWDZIWY OGÓRKA (id:12)
-- ================================================================================================

INSERT INTO problem_solutions (problem_id, product_id, effectiveness, speed, notes, best_stage, priority, is_recommended) VALUES
(12, 33, 'wysoka', 'średnia', 'Switch - zapobiega i leczy. Stosować przy pierwszych objawach.', 'pierwsze_objawy', 10, 1),
(12, 1, 'wysoka', 'średnia', 'Topsin M - systemiczny, skuteczny. Karencja 3 dni.', 'pierwsze_objawy', 9, 1),
(12, 15, 'średnia', 'średnia', 'Mleko z wodą (1:9) - naturalne białka hamują grzyb. Bezpieczne.', 'zapobiegawczo', 8, 1),
(12, 16, 'średnia', 'średnia', 'Soda oczyszczona + olej - zmienia pH powierzchni liści.', 'pierwsze_objawy', 7, 1);

-- ================================================================================================
-- PARCH JABŁONI (id:13)
-- ================================================================================================

INSERT INTO problem_solutions (problem_id, product_id, effectiveness, speed, notes, best_stage, priority, is_recommended) VALUES
(13, 38, 'wysoka', 'średnia', 'Delan 700 WG - zapobiegawczy, stosować przed deszczem.', 'zapobiegawczo', 10, 1),
(13, 32, 'wysoka', 'średnia', 'Score - systemiczny, skuteczny zapobiegawczo i interwencyjnie.', 'zapobiegawczo', 9, 1),
(13, 2, 'średnia', 'średnia', 'Miedzian - preparat miedziowy, ekologiczny. Stosować wczesną wiosną.', 'zaraz_po_kwitnieniu', 7, 1);

-- ================================================================================================
-- SZARA PLEŚŃ TRUSKAWEK (id:14) - Botrytis
-- ================================================================================================

INSERT INTO problem_solutions (problem_id, product_id, effectiveness, speed, notes, best_stage, priority, is_recommended) VALUES
(14, 33, 'wysoka', 'szybka', 'Switch - bardzo skuteczny na botrytis. Stosować od początku kwitnienia.', 'kwitnienie', 10, 1),
(14, NULL, NULL, NULL, 'Mulczowanie słomą - uniemożliwia kontakt owoców z wilgotną glebą.', 'przed_owocowaniem', 8, 1),
(14, NULL, NULL, NULL, 'Usuwanie porażonych owoców - natychmiast wyrzucać, nie kompostować!', 'natychmiast', 9, 1);

-- ================================================================================================
-- PRZĘDZIOREK (id:5)
-- ================================================================================================

INSERT INTO problem_solutions (problem_id, product_id, effectiveness, speed, notes, best_stage, priority, is_recommended) VALUES
(5, 13, 'średnia', 'szybka', 'Roztwór mydła - dusi roztoczy. Dokładnie zwilżyć spód liści.', 'pierwsze_objawy', 8, 1),
(5, 26, 'wysoka', 'średnia', 'Olej rzepakowy + mydło - tworzy film duszący roztoczy.', 'pierwsze_objawy', 9, 1),
(5, 12, 'średnia', 'średnia', 'Napar z czosnku - naturalny akarybójczy. Powtarzać co 5 dni.', 'zapobiegawczo', 7, 1),
(5, NULL, NULL, NULL, 'Zwiększenie wilgotności - przędziorek nie lubi wilgoci. Częstsze opryski wodą.', 'zapobiegawczo', 6, 1);

-- ================================================================================================
-- PCHEŁKI ZIEMNE (id:6)
-- ================================================================================================

INSERT INTO problem_solutions (problem_id, product_id, effectiveness, speed, notes, best_stage, priority, is_recommended) VALUES
(6, 6, 'wysoka', 'szybka', 'Karate Zeon - skuteczny pyretroid. Stosować wieczorem.', 'pierwsze_szkody', 9, 1),
(6, 30, 'wysoka', 'zapobiegawczo', 'Netka ochronna - mechaniczna bariera. Najskuteczniejsza metoda.', 'od_siewu', 10, 1),
(6, NULL, NULL, NULL, 'Regularne podlewanie - wilgotna gleba ogranicza aktywność pchełek.', 'codziennie', 7, 1);

-- ================================================================================================
-- ŚMIETKA KAPUŚCIANA (id:7)
-- ================================================================================================

INSERT INTO problem_solutions (problem_id, product_id, effectiveness, speed, notes, best_stage, priority, is_recommended) VALUES
(7, 30, 'wysoka', 'zapobiegawczo', 'Netka ochronna - bariera fizyczna uniemożliwiająca złożenie jaj. Najlepsza metoda!', 'od_sadzenia', 10, 1),
(7, NULL, NULL, NULL, 'Kołnierzyki kartonowe - wokół szyjki korzeniowej. Uniemożliwia złożenie jaj.', 'przy_sadzeniu', 9, 1);

-- ================================================================================================
-- GĄSIENICE BIELINKA (id:10)
-- ================================================================================================

INSERT INTO problem_solutions (problem_id, product_id, effectiveness, speed, notes, best_stage, priority, is_recommended) VALUES
(10, 39, 'wysoka', 'szybka', 'Decis Mega - pyretroid, skuteczny na gąsienice. Wieczorem.', 'młode_gąsienice', 9, 1),
(10, NULL, NULL, NULL, 'Zbieranie ręczne - gąsienic i żółtych jaj z spodu liści. Najbezpieczniejsze.', 'codziennie', 10, 1),
(10, 30, 'wysoka', 'zapobiegawczo', 'Siatka ochronna - uniemożliwia motylom składanie jaj.', 'przed_lotem', 8, 1);

-- ================================================================================================
-- MSZYCA KAPUŚCIANA (id:2) - szare mszyce
-- ================================================================================================

INSERT INTO problem_solutions (problem_id, product_id, effectiveness, speed, notes, best_stage, priority, is_recommended) VALUES
(2, 38, 'wysoka', 'szybka', 'Pirimor - selektywny na mszyce. Oszczędza pożyteczne owady.', 'pierwsze_kolonie', 10, 1),
(2, 37, 'wysoka', 'szybka', 'Calypso - systemiczny, długie działanie.', 'pierwsze_kolonie', 9, 1),
(2, 12, 'średnia', 'szybka', 'Napar z czosnku - naturalny odstraszający. Stosować co 7 dni.', 'zapobiegawczo', 7, 1),
(2, 13, 'średnia', 'szybka', 'Roztwór mydła - skuteczny przy niewielkim nasileniu.', 'wczesne_stadium', 6, 1),
(2, NULL, NULL, NULL, 'Strumień wody - spłukiwanie mszyc z liści. Powtarzać regularnie.', 'codziennie', 5, 1);

-- ================================================================================================
-- MĄCZLIK SZKLARNIOWY (id:8) - białe muchy
-- ================================================================================================

INSERT INTO problem_solutions (problem_id, product_id, effectiveness, speed, notes, best_stage, priority, is_recommended) VALUES
(8, 40, 'wysoka', 'średnia', 'Polysect Ultra - systemiczny. Skuteczny na mączlika szklarniowego.', 'pierwsze_osobniki', 10, 1),
(8, 13, 'średnia', 'szybka', 'Roztwór mydła - spłukuje larwy i dorosłe. Stosować rano.', 'regularnie', 7, 1),
(8, 25, 'średnia', 'szybka', 'Woda z mydłem i alkoholem - skuteczny na dorosłe osobniki.', 'pierwsze_objawy', 6, 1),
(8, NULL, NULL, NULL, 'Żółte lepkie tablice - pułapki na dorosłe osobniki. Zawiesić przy roślinach.', 'zapobiegawczo', 8, 1);

-- ================================================================================================
-- OPRZĘDZIKI POMIDOROWE (id:9) - wciornastki
-- ================================================================================================

INSERT INTO problem_solutions (problem_id, product_id, effectiveness, speed, notes, best_stage, priority, is_recommended) VALUES
(9, 40, 'wysoka', 'średnia', 'Polysect Ultra - systemiczny na oprzędziki.', 'pierwsze_osobniki', 10, 1),
(9, 37, 'wysoka', 'szybka', 'Calypso - skuteczny na wciornastki.', 'pierwsze_szkody', 9, 1),
(9, NULL, NULL, NULL, 'Niebieskie pułapki lepowe - przywabiają oprzędziki. Zawiesić w szklarni.', 'zapobiegawczo', 8, 1),
(9, NULL, NULL, NULL, 'Usuwanie porażonych kwiatów - ogranicza rozprzestrzenianie wirusów.', 'natychmiast', 7, 1);

-- ================================================================================================
-- MĄCZNIAK RZEKOMNY CEBULI (id:15) - peronospora
-- ================================================================================================

INSERT INTO problem_solutions (problem_id, product_id, effectiveness, speed, notes, best_stage, priority, is_recommended) VALUES
(15, 35, 'wysoka', 'średnia', 'Ridomil Gold - systemiczny + kontaktowy. Najskuteczniejszy.', 'zapobiegawczo', 10, 1),
(15, 36, 'wysoka', 'średnia', 'Amistar - stosować przed deszczem.', 'zapobiegawczo', 9, 1),
(15, 2, 'średnia', 'średnia', 'Miedzian - ekologiczny preparat miedziowy.', 'zapobiegawczo', 7, 1),
(15, NULL, NULL, NULL, 'Usuwanie porażonych liści - natychmiast wycinać i spalić.', 'natychmiast', 8, 1);

-- ================================================================================================
-- ALTERNARIOZA POMIDORA (id:16)
-- ================================================================================================

INSERT INTO problem_solutions (problem_id, product_id, effectiveness, speed, notes, best_stage, priority, is_recommended) VALUES
(16, 36, 'wysoka', 'średnia', 'Amistar - skuteczny na alternariozę.', 'pierwsze_objawy', 10, 1),
(16, 1, 'wysoka', 'średnia', 'Topsin M - systemiczny fungicyd.', 'pierwsze_objawy', 9, 1),
(16, 2, 'średnia', 'średnia', 'Miedzian - zapobiegawczo w okresie wilgotnym.', 'zapobiegawczo', 7, 1),
(16, NULL, NULL, NULL, 'Usuwanie dolnych liści - poprawia przewiewność, ogranicza chorobę.', 'regularnie', 6, 1);

-- ================================================================================================
-- RDZA MALINY (id:17)
-- ================================================================================================

INSERT INTO problem_solutions (problem_id, product_id, effectiveness, speed, notes, best_stage, priority, is_recommended) VALUES
(17, 32, 'wysoka', 'średnia', 'Score - skuteczny na rdzę.', 'pierwsze_objawy', 10, 1),
(17, 2, 'średnia', 'średnia', 'Miedzian - preparat miedziowy, ekologiczny.', 'zapobiegawczo', 8, 1),
(17, 23, 'średnia', 'średnia', 'Napar ze skrzypu - wzmacnia rośliny zapobiegawczo.', 'zapobiegawczo', 6, 1),
(17, NULL, NULL, NULL, 'Usuwanie porażonych liści - wycinać i spalić.', 'natychmiast', 7, 1);

-- ================================================================================================
-- MONILIOZA DRZEW PESTKOWYCH (id:18) - zgnilizna owoców
-- ================================================================================================

INSERT INTO problem_solutions (problem_id, product_id, effectiveness, speed, notes, best_stage, priority, is_recommended) VALUES
(18, 33, 'wysoka', 'średnia', 'Switch - skuteczny na moniliozę.', 'kwitnienie', 10, 1),
(18, 32, 'wysoka', 'średnia', 'Score - stosować zapobiegawczo.', 'przed_kwitnieniem', 9, 1),
(18, NULL, NULL, NULL, 'Usuwanie mumifikowanych owoców - zimą i latem. Spalić!', 'regularnie', 10, 1),
(18, NULL, NULL, NULL, 'Wycinanie porażonych pędów - 10cm poniżej objawów.', 'natychmiast', 9, 1);

-- ================================================================================================
-- SEPTORIOZA POMIDORA (id:19) - plamistość liści
-- ================================================================================================

INSERT INTO problem_solutions (problem_id, product_id, effectiveness, speed, notes, best_stage, priority, is_recommended) VALUES
(19, 1, 'wysoka', 'średnia', 'Topsin M - skuteczny na septoriozę.', 'pierwsze_objawy', 10, 1),
(19, 36, 'wysoka', 'średnia', 'Amistar - systemiczny fungicyd.', 'pierwsze_objawy', 9, 1),
(19, 2, 'średnia', 'średnia', 'Miedzian - zapobiegawczo.', 'zapobiegawczo', 7, 1),
(19, NULL, NULL, NULL, 'Usuwanie dolnych porażonych liści - poprawia przewiewność.', 'regularnie', 8, 1);

-- ================================================================================================
-- ANTRAKNOZA DYNIOWATYCH (id:20)
-- ================================================================================================

INSERT INTO problem_solutions (problem_id, product_id, effectiveness, speed, notes, best_stage, priority, is_recommended) VALUES
(20, 33, 'wysoka', 'średnia', 'Switch - skuteczny na antraknozę.', 'pierwsze_objawy', 10, 1),
(20, 1, 'wysoka', 'średnia', 'Topsin M - systemiczny.', 'pierwsze_objawy', 9, 1),
(20, 2, 'średnia', 'średnia', 'Miedzian - zapobiegawczo przed deszczem.', 'zapobiegawczo', 7, 1),
(20, NULL, NULL, NULL, 'Usuwanie porażonych owoców i liści - spalić, nie kompostować.', 'natychmiast', 8, 1);

-- ================================================================================================
-- ZARAZA OGNIOWA (id:21) - fire blight - CHOROBA KWARANTANNOWA!
-- ================================================================================================

INSERT INTO problem_solutions (problem_id, product_id, effectiveness, speed, notes, best_stage, priority, is_recommended) VALUES
(21, 2, 'niska', 'wolna', 'Miedzian - jedynie zapobiegawczo, NIE leczy!', 'przed_kwitnieniem', 6, 1),
(21, NULL, NULL, NULL, 'Wycinanie porażonych pędów - 30-40cm poniżej objawów. SPALIĆ!', 'natychmiast', 10, 1),
(21, NULL, NULL, NULL, 'Dezynfekcja narzędzi - 10% roztwór chloru między cięciami.', 'przy_wycinaniu', 10, 1),
(21, NULL, NULL, NULL, 'ZGŁOSZENIE DO INSPEKCJI - choroba kwarantannowa! Obowiązek prawny.', 'natychmiast', 10, 1);

-- ================================================================================================
-- RAK BAKTERYJNY DRZEW PESTKOWYCH (id:22)
-- ================================================================================================

INSERT INTO problem_solutions (problem_id, product_id, effectiveness, speed, notes, best_stage, priority, is_recommended) VALUES
(22, 2, 'średnia', 'wolna', 'Miedzian - zapobiegawczo przed opadaniem liści.', 'jesień', 8, 1),
(22, NULL, NULL, NULL, 'Wycinanie porażonych pędów - spalić. Dezynfekcja narzędzi.', 'natychmiast', 10, 1),
(22, NULL, NULL, NULL, 'Unikanie cięcia w wilgotne dni - bakteria rozprzestrzenia się przez rany.', 'zawsze', 9, 1);

-- ================================================================================================
-- MOKRA ZGNILIZNA KAPUSTY (id:23) - bakterioza
-- ================================================================================================

INSERT INTO problem_solutions (problem_id, product_id, effectiveness, speed, notes, best_stage, priority, is_recommended) VALUES
(23, 2, 'niska', 'wolna', 'Miedzian - jedynie zapobiegawczo, NIE leczy bakteriozy.', 'zapobiegawczo', 5, 0),
(23, NULL, NULL, NULL, 'Usuwanie porażonych roślin - spalić, nie kompostować!', 'natychmiast', 10, 1),
(23, NULL, NULL, NULL, 'Suchość podczas przechowywania - wietrzyć magazyn, utrzymywać niską wilgotność.', 'magazynowanie', 9, 1),
(23, NULL, NULL, NULL, 'Płodozmian - nie sadzić kapustnych przez 3 lata.', 'planowanie', 8, 1);

-- ================================================================================================
-- ZGNILIZNA WIERZCHOŁKOWA POMIDORA (id:24) - niedobór wapnia
-- ================================================================================================

INSERT INTO problem_solutions (problem_id, product_id, effectiveness, speed, notes, best_stage, priority, is_recommended) VALUES
(24, NULL, NULL, NULL, 'Regularne podlewanie - równomierne uwilgotnienie gleby, bez wysychania.', 'cały_sezon', 10, 1),
(24, NULL, NULL, NULL, 'Nawóz wapniowy - oprysk dolistny roztworem wapnia.', 'przy_zawiązywaniu', 9, 1),
(24, NULL, NULL, NULL, 'Mulczowanie - utrzymuje równomierną wilgotność gleby.', 'cały_sezon', 8, 1),
(24, NULL, NULL, NULL, 'Unikanie nadmiaru azotu - ogranicza pobieranie wapnia.', 'nawożenie', 7, 1);

-- ================================================================================================
-- NIEDOBÓR AZOTU (id:25)
-- ================================================================================================

INSERT INTO problem_solutions (problem_id, product_id, effectiveness, speed, notes, best_stage, priority, is_recommended) VALUES
(25, NULL, NULL, NULL, 'Nawóz azotowy - mocznik, saletra amonowa (20-30g/m²).', 'przy_objawach', 10, 1),
(25, NULL, NULL, NULL, 'Kompost - nawożenie organiczne, długotrwałe działanie.', 'zapobiegawczo', 9, 1),
(25, 14, 'średnia', 'średnia', 'Napar z pokrzywy - naturalny nawóz azotowy. Rozcieńczyć 1:10.', 'co_7_dni', 7, 1),
(25, NULL, NULL, NULL, 'Nawożenie dolistne - szybkie działanie, oprysk mocznikiem 0.5%.', 'natychmiast', 8, 1);

-- ================================================================================================
-- NIEDOBÓR ŻELAZA - CHLOROZA (id:26)
-- ================================================================================================

INSERT INTO problem_solutions (problem_id, product_id, effectiveness, speed, notes, best_stage, priority, is_recommended) VALUES
(26, NULL, NULL, NULL, 'Chelat żelaza - oprysk dolistny lub podlanie. Najszybsze działanie.', 'przy_objawach', 10, 1),
(26, NULL, NULL, NULL, 'Obniżenie pH gleby - dodanie torfu lub siarki ogrodniczej.', 'zapobiegawczo', 9, 1),
(26, NULL, NULL, NULL, 'Siarczan żelaza - podlanie roztworem 2g/L. Dla roślin kwasolubnych.', 'przy_objawach', 8, 1),
(26, NULL, NULL, NULL, 'Kompost - nawożenie organiczne poprawia dostępność żelaza.', 'zapobiegawczo', 6, 1);

-- ================================================================================================
-- NIEDOBÓR MAGNEZU (id:27)
-- ================================================================================================

INSERT INTO problem_solutions (problem_id, product_id, effectiveness, speed, notes, best_stage, priority, is_recommended) VALUES
(27, NULL, NULL, NULL, 'Siarczan magnezu - oprysk dolistny 2% roztworem. Szybkie działanie.', 'przy_objawach', 10, 1),
(27, NULL, NULL, NULL, 'Dolomit - wapno magnezowe do gleby (100-200g/m²). Długotrwałe.', 'jesień_wiosna', 9, 1),
(27, NULL, NULL, NULL, 'Kieseryt - siarczan magnezu do gleby. Szybciej niż dolomit.', 'przy_objawach', 8, 1),
(27, NULL, NULL, NULL, 'Ograniczenie nadmiaru potasu - utrudnia pobieranie magnezu.', 'nawożenie', 6, 1);
