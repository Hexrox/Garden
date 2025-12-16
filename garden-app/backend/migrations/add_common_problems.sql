-- Najpopularniejsze problemy ogrodnicze dla hobbystów
-- Data: 2025-12-15

-- ================================================================================================
-- SZKODNIKI (najpopularniejsze w ogrodach hobbystów)
-- ================================================================================================

INSERT INTO plant_problems (name, common_name, category, severity, description, symptoms, affects_plants, plant_category, peak_season) VALUES

('Mszyca brzoskwiniowa', 'czarne mszyce', 'szkodnik', 'wysoka',
'Drobne czarne owady wysysające sok z roślin. Bardzo szybko się rozmnażają, tworzą liczne kolonie.',
'Czarne owady na młodych pędach, zdeformowane liście, lepki nalot (spadź), mrówki wokół roślin',
'pomidor,papryka,bakłażan,brzoskwinia', 'warzywa,owoce', 'wiosna,lato'),

('Mszyca kapuściana', 'szare mszyce', 'szkodnik', 'średnia',
'Szare lub szarozielone mszyce atakujące rośliny kapustowate. Osłabiają rośliny i przenoszą wirusy.',
'Szare owady pod liśćmi, zdeformowane liście, słaby wzrost roślin',
'kapusta,brokuł,kalafior,brukselka,jarmuż', 'warzywa', 'wiosna,lato'),

('Stonka ziemniaczana', 'stonka', 'szkodnik', 'krytyczna',
'Charakterystyczny żółty chrząszcz w czarne paski. Larwy i osobniki dorosłe zjadają liście.',
'Obgryzione liście, widoczne żółte chrząszcze lub pomarańczowe larwy, rośliny całkowicie ogołocone',
'ziemniak,pomidor,bakłażan,papryka', 'warzywa', 'wiosna,lato'),

('Ślimaki nagie', 'ślimaki', 'szkodnik', 'wysoka',
'Ślimaki bez muszli aktywne nocą i w dni pochmurne. Zjadają młode rośliny i liście.',
'Dziury w liściach, śluzowe ślady na ziemi, całkowicie zjedzone młode siewki',
'sałata,kapusta,truskawka,hosta,funkia', 'warzywa,kwiaty', 'wiosna,jesień'),

('Przędziorek chmielowiec', 'przędziorek', 'szkodnik', 'wysoka',
'Mikroskopijny roztocz tworzący delikatne pajęczyny. Atakuje w upalne, suche dni.',
'Drobne żółte kropki na liściach, pajęczyny na spodzie liści, liście brązowieją i opadają',
'ogórek,fasola,pomidor,truskawka', 'warzywa,owoce', 'lato'),

('Pchełki ziemne', 'pchełki', 'szkodnik', 'średnia',
'Małe skaczące chrząszcze wygryzające dziurki w liściach. Szczególnie groźne dla siewek.',
'Drobne okrągłe dziurki w liściach (jak od śrutu), spowolniony wzrost młodych roślin',
'rzodkiewka,rzodkiew,rukola,kapusta,rzepa', 'warzywa', 'wiosna'),

('Śmietka kapuściana', 'mucha kapuściana', 'szkodnik', 'wysoka',
'Larwy much żerują w korzeniach kapustowatych. Powodują więdnięcie i zamieranie roślin.',
'Niebieskawy zabarwienie liści, więdnięcie pomimo podlewania, larwy w korzeniach',
'kapusta,kalafior,brokuł,rzodkiewka', 'warzywa', 'wiosna,lato'),

('Mączlik szklarniowy', 'mączlik biały', 'szkodnik', 'średnia',
'Małe białe muchy unoszące się przy poruszeniu rośliną. Wysysają sok i przenoszą wirusy.',
'Białe muchy pod liśćmi, żółte plamy na liściach, lepki nalot, liście opadają',
'pomidor,ogórek,papryka,begonia,fuksja', 'warzywa,kwiaty', 'cały_sezon'),

('Oprzędziki pomidorowe', 'oprzędziki', 'szkodnik', 'średnia',
'Małe latające owady o frędzlowanych skrzydłach. Przenoszą wirusy i uszkadzają kwiaty.',
'Srebrzyste przebarwienia na liściach, deformacja kwiatów, czarne kropki odchodów',
'pomidor,papryka,ogórek,cebula', 'warzywa', 'lato'),

('Gąsienice bielinka', 'gąsienice kapustnika', 'szkodnik', 'wysoka',
'Zielone gąsienice motyla bielinka zjadające liście kapustowatych.',
'Obgryzione liście z widocznymi gąsienicami, odchody na liściach, dziury w główkach kapusty',
'kapusta,brokuł,kalafior', 'warzywa', 'lato,jesień');

-- ================================================================================================
-- CHOROBY GRZYBOWE (najczęstsze w ogrodach)
-- ================================================================================================

INSERT INTO plant_problems (name, common_name, category, severity, description, symptoms, affects_plants, plant_category, peak_season) VALUES

('Zaraza ziemniaka', 'fytoftoroza', 'choroba_grzybowa', 'krytyczna',
'Groźna choroba grzybowa wywołana przez Phytophthora infestans. Może zniszczyć całe zbiory.',
'Brązowe plamy na liściach otoczone żółtą obwódką, biały nalot na spodzie liści, gnijące bulwy',
'ziemniak,pomidor', 'warzywa', 'lato'),

('Mączniak prawdziwy ogórka', 'biały nalot', 'choroba_grzybowa', 'wysoka',
'Białawy mączysty nalot na liściach. Rozwija się w ciepłe, suche dni.',
'Biały mączysty nalot na górnej stronie liści, liście żółkną i zasychają',
'ogórek,cukinia,dynia,kabaczek', 'warzywa', 'lato'),

('Parch jabłoni', 'parch', 'choroba_grzybowa', 'wysoka',
'Choroba powodująca ciemne plamy na liściach i owocach. Rozwija się w wilgotne okresy.',
'Ciemne plamy na liściach i owocach, spękane i zdeformowane owoce, przedwczesne opadanie liści',
'jabłoń,grusza', 'owoce', 'wiosna,lato'),

('Szara pleśń truskawek', 'botrytis', 'choroba_grzybowa', 'wysoka',
'Grzyb powodujący szary puszysty nalot na owocach. Rozwija się w wilgoci.',
'Szary puszysty nalot na owocach, gnijące jagody, brązowe plamy na kwiatach',
'truskawka,malina,winorośl,pomidor', 'owoce,warzywa', 'wiosna,lato'),

('Mączniak rzekomny cebuli', 'peronospora', 'choroba_grzybowa', 'wysoka',
'Choroba powodująca szarawy nalot i żółknięcie liści. Atakuje w wilgotne, chłodne okresy.',
'Żółknięcie liści od wierzchołka, szarawy nalot, liście zasychają i załamują się',
'cebula,por,czosnek', 'warzywa', 'wiosna,jesień'),

('Alternarioza pomidora', 'alternaria', 'choroba_grzybowa', 'średnia',
'Ciemne koncentryczne plamy na starszych liściach. Rozwija się w ciepłe, wilgotne dni.',
'Ciemne okrągłe plamy z koncentrycznymi kręgami, żółknięcie wokół plam, przedwczesne opadanie liści',
'pomidor,ziemniak,papryka', 'warzywa', 'lato'),

('Rdza maliny', 'pomarańczowe plamy', 'choroba_grzybowa', 'średnia',
'Grzyb powodujący pomarańczowe zarodniki na spodzie liści.',
'Żółte plamy na górze liści, pomarańczowe skupienia zarodników na spodzie, przedwczesne opadanie',
'malina,jeżyna', 'owoce', 'lato'),

('Monilioza drzew pestkowych', 'zgnilizna owoców', 'choroba_grzybowa', 'wysoka',
'Grzyb powodujący mumifikację owoców. Zaraża przez kwiaty i owoce.',
'Brązowe gnijące owoce z białymi kręgami grzybni, mumifikacja owoców, zasychające kwiaty',
'wiśnia,czereśnia,śliwa,brzoskwinia', 'owoce', 'wiosna,lato'),

('Septorioza pomidora', 'plamistość liści', 'choroba_grzybowa', 'średnia',
'Ciemne plamy z jasnym środkiem na dolnych liściach.',
'Małe ciemne plamy z jasnym środkiem, żółknięcie liści, przedwczesne opadanie dolnych liści',
'pomidor', 'warzywa', 'lato'),

('Antraknoza dyniowatych', 'zgnilizna owoców', 'choroba_grzybowa', 'średnia',
'Choroba powodująca zapadnięte plamy na owocach i liściach.',
'Zapadnięte ciemne plamy na owocach, plamy na liściach i łodygach, gnijące owoce',
'ogórek,dynia,arbuz,melon', 'warzywa', 'lato');

-- ================================================================================================
-- CHOROBY BAKTERYJNE (wybrane najważniejsze)
-- ================================================================================================

INSERT INTO plant_problems (name, common_name, category, severity, description, symptoms, affects_plants, plant_category, peak_season) VALUES

('Zaraza ogniowa', 'fire blight', 'choroba_bakteryjna', 'krytyczna',
'Groźna bakterioza drzew ziarnkowych. Choroba kwarantannowa!',
'Brązowiejące kwiaty i pędy wyglądające jak opalone, wygięte końce pędów, sączący się wysięk',
'jabłoń,grusza,pigwa,głóg', 'owoce', 'wiosna'),

('Rak bakteryjny drzew pestkowych', 'bakteryjny rak', 'choroba_bakteryjna', 'wysoka',
'Bakteria powodująca rany i kamienne wycieki.',
'Wyciekająca żywica, brązowe plamy na owocach, przedwczesne opadanie liści, zamieranie pędów',
'wiśnia,czereśnia,śliwa', 'owoce', 'wiosna,jesień'),

('Mokra zgnilizna kapusty', 'bakterioza kapusty', 'choroba_bakteryjna', 'wysoka',
'Bakteria powodująca gnicie główek podczas przechowywania.',
'Galaretowate gnijące tkanki, nieprzyjemny zapach, zmiękczanie główek',
'kapusta,kalafior,brokuł', 'warzywa', 'jesień'),

('Zgnilizna wierzchołkowa pomidora', 'niedobór wapnia', 'niedobor', 'średnia',
'Fizjologiczna choroba związana z niedoborem wapnia i nieregularnym podlewaniem.',
'Ciemne, zapadnięte plamy na dnie owoców, zamarły suchy obszar',
'pomidor,papryka,cukinia', 'warzywa', 'lato');

-- ================================================================================================
-- NIEDOBORY SKŁADNIKÓW
-- ================================================================================================

INSERT INTO plant_problems (name, common_name, category, severity, description, symptoms, affects_plants, plant_category, peak_season) VALUES

('Niedobór azotu', 'żółknięcie liści', 'niedobor', 'średnia',
'Niedobór azotu spowalnia wzrost i powoduje żółknięcie starszych liści.',
'Żółknięcie dolnych liści, spowolniony wzrost, jasna barwa całej rośliny',
'wszystkie warzywa,kwiaty', 'warzywa,kwiaty,owoce', 'cały_sezon'),

('Niedobór żelaza (chloroza)', 'żółte liście z zielonymi żyłkami', 'niedobor', 'średnia',
'Żółknięcie międzyżyłkowe młodych liści. Częste na glebach zasadowych.',
'Żółknięcie między żyłkami na młodych liściach, żyłki pozostają zielone',
'malina,hortensja,rodoendron,azalia', 'kwiaty,owoce', 'wiosna,lato'),

('Niedobór magnezu', 'chloroza międzyżyłkowa', 'niedobor', 'niska',
'Żółknięcie między żyłkami starszych liści.',
'Żółknięcie między żyłkami na starszych liściach, brzegi liści mogą ciemnieć',
'pomidor,papryka,jabłoń', 'warzywa,owoce', 'lato');
