/**
 * Sezonowe porady ogrodnicze dla Polski
 * Źródła: poradnikogrodniczy.pl, leroymerlin.pl, własny research
 */

export const seasonalHints = {
  1: { // Styczeń
    month: "Styczeń",
    icon: "❄️",
    priority: "low",
    vegetables: [
      "Planowanie ogrodu na nowy sezon - szkicuj rozmieszczenie grządek",
      "Zamawianie nasion i cebulek z katalogów",
      "Kontrola przechowywanych cebul (dalie, begonie, kanny) - usuwanie zepsutych",
      "Ściółkowanie wieloletnich roślin (jeśli nie zrobione w listopadzie)"
    ],
    flowers: [
      "Sprawdzenie stanu cebul kwiatowych w piwnicy",
      "Planowanie układu rabat - które kolory obok siebie",
      "Przyglądanie się katalogom nasion - zamawianie nowości",
      "Kontrola narzędzi ogrodniczych - ostrzenie sekatora"
    ],
    general: [
      "Zimowa przerwa - odpoczynek przed sezonem",
      "Czytanie o nowych odmianach roślin"
    ]
  },

  2: { // Luty
    month: "Luty",
    icon: "❄️",
    priority: "medium",
    vegetables: [
      "Siew na rozsadę: papryka, pomidory wysokie, bakłażan, seler (koniec II)",
      "Siew cebuli na rozsadę (w pojemnikach)",
      "Przycinanie drzew i krzewów owocowych (gdy brak przymrozków)"
    ],
    flowers: [
      "Siew kwiatów jednorocznych na rozsadę: begonie bulwiaste, petunie, surfinie",
      "Siew nasturcji w doniczkach (uwaga - nie lubi przesadzania!)",
      "Cięcie krzewów liściastych (nie kwitnących wiosną)"
    ],
    general: [
      "Kontrola narzędzi - naprawa, ostrzenie",
      "Przygotowanie pojemników do rozsady (umycie, dezynfekcja)"
    ]
  },

  3: { // Marzec
    month: "Marzec",
    icon: "🌱",
    priority: "high",
    vegetables: [
      "Siew bezpośrednio do gruntu: groch, bób, marchew wczesna, sałata, szpinak, rzodkiewka",
      "Sadzenie czosnku jarego (początek III)",
      "Siew na rozsadę: kapusta, kalafior, brokuły, ogórki (koniec III)",
      "Przygotowanie gleby - kompost, nawóz naturalny"
    ],
    flowers: [
      "Siew bezpośrednio: mak, chaber, nagietek, świeca, len",
      "Cięcie róż - usunięcie martwych i słabych pędów (koniec III)",
      "Dzielenie bylin (funkia, piwonia - ale lepiej jesienią!)",
      "Sadzenie cebulek letnich w doniczkach: dalie, begonie, kanny (koniec III)",
      "Usunięcie zimowego okrycia z róż (gdy brak przymrozków)"
    ],
    general: [
      "Grabie - spulchnienie gleby",
      "Usunięcie zimowych liści ze ściółki",
      "Pierwsze podlewanie (jeśli sucho)"
    ]
  },

  4: { // Kwiecień
    month: "Kwiecień",
    icon: "🌸",
    priority: "high",
    vegetables: [
      "Siew bezpośrednio: burak, cebula z nasion, marchew, pietruszka, koper, rzodkiewka",
      "Sadzenie ziemniaków (połowa IV, po świętach)",
      "Wysadzanie rozsady: kapusta wczesna, sałata, cebula",
      "Siew fasoli szparagowej (koniec IV - gdy ziemia ciepła)"
    ],
    flowers: [
      "Sadzenie cebulek letnich: dalie, begonie, kanny, mieczyki (po 15 IV)",
      "Siew kwiatów jednorocznych bezpośrednio: słonecznik, aster, kosmos, cynia",
      "Usuwanie przekwitniętych tulipanów/narcyzów - LIŚCIE ZOSTAWIĆ! (potrzebują fotosyntezy)",
      "Mulczowanie rabat korą lub kompostem",
      "Cięcie lawendy - usunięcie suchych kwiatostanów z zeszłego roku"
    ],
    general: [
      "Regularne podlewanie młodych sadzonek",
      "Pielenie chwastów (łatwiej kiedy małe)"
    ]
  },

  5: { // Maj
    month: "Maj",
    icon: "🌷",
    priority: "high",
    vegetables: [
      "Wysadzanie rozsady: pomidory, ogórki, papryka (PO 15 MAJA - przymrozki!)",
      "Siew bezpośrednio: fasola, kabaczek, cukinia, dynia, kukurydza",
      "Okrywanie młodych roślin agrowłókniną (na noc, jeśli zimno)",
      "Ściółkowanie grządek słomą lub korą - zachowa wilgoć"
    ],
    flowers: [
      "Wysadzanie rozsady: begonie, petunie, surfinie, pelargonie, lobelia",
      "Pinching (uszczypywanie wierzchołków) petunii → więcej kwiatów!",
      "Deadheading (usuwanie przekwitniętych kwiatów) - róże, piwonie",
      "Podpinanie pnączy - róże pnące, powojniki",
      "Nawożenie róż nawozem dla róż (NPK 10-20-10)"
    ],
    general: [
      "Podlewanie wieczorem (mniej parowania)",
      "Mulczowanie - zachowanie wilgoci w glebie"
    ]
  },

  6: { // Czerwiec
    month: "Czerwiec",
    icon: "☀️",
    priority: "high",
    vegetables: [
      "Regularne podlewanie (rano 6-8 lub wieczorem po 18)",
      "Nawożenie warzyw owocujących (pomidory, ogórki) co 2 tygodnie",
      "Zbiór wczesnych warzyw: rzodkiewka, sałata, groszek cukrowy, szpinak",
      "Pasywnkowanie pomidorów (usuwanie bocznych pędów)"
    ],
    flowers: [
      "Deadheading róż 2x w tygodniu → ciągłe kwitnienie!",
      "Nawożenie kwiatów jednorocznych co 2 tygodnie (NPK 10-30-10)",
      "Podlewanie rano lub wieczorem - NIE w południe!",
      "Cięcie lawendy po przekwitnięciu (1/3 wysokości)",
      "Podpinanie wysokich bylin (delphinuim, malwy)"
    ],
    general: [
      "Pielenie regularnie",
      "Mulczowanie - utrzymanie wilgoci",
      "Kontrola szkodników (mszyce, ślimaki)"
    ]
  },

  7: { // Lipiec
    month: "Lipiec",
    icon: "☀️",
    priority: "high",
    vegetables: [
      "Intensywne podlewanie podczas upałów (codziennie wieczorem)",
      "Zbiór warzyw: pomidory, ogórki, papryka, kabaczki, cukinie",
      "Siew rzodkiewki jesiennej, rukoli, sałaty (sukcesja)",
      "Nawożenie pomidorów, ogórków co tydzień"
    ],
    flowers: [
      "Deadheading róż CODZIENNIE → maksymalne kwitnienie!",
      "Podlewanie codziennie wieczorem (upały)",
      "Sadzonki lawendy - cięcie młodych pędów 10cm, w ziemi piaszczystej",
      "Nawożenie dalii co 2 tygodnie (NPK 10-20-20)",
      "Cięcie przekwitniętych piwonii - tylko kwiatostany, liście zostawić!"
    ],
    general: [
      "Podlewanie rano 6-7 lub wieczorem po 19",
      "Ściółka słomiana - zatrzyma wilgoć"
    ]
  },

  8: { // Sierpień
    month: "Sierpień",
    icon: "🌾",
    priority: "high",
    vegetables: [
      "Zbiór pomidorów, ogórków, papryki - szczyt sezonu!",
      "Siew zimujących warzyw: szpinak, rukola, sałata zimowa, rzodkiewka",
      "Zbiór i suszenie ziół: bazylia, oregano, tymianek, szałwia",
      "Konserwowanie i mrożenie warzyw"
    ],
    flowers: [
      "Deadheading róż, dalii, cynie",
      "Zbiór i suszenie lawendy (gdy kwiaty półotwarte)",
      "OSTATNIE nawożenie róż (początek VIII) - później NIE nawozić!",
      "Cięcie przekwitniętych bylin wieloletnich",
      "Przycinanie żywopłotu ostatni raz przed zimą"
    ],
    general: [
      "Podlewanie regularnie",
      "Planowanie jesiennych nasadzeń"
    ]
  },

  9: { // Wrzesień
    month: "Wrzesień",
    icon: "🍂",
    priority: "high",
    vegetables: [
      "Zbiór warzyw korzeniowych: marchew, burak, pietruszka, seler",
      "Siew czosnku ozimego (koniec IX)",
      "Siew sałaty zimowej pod osłony",
      "Wykopywanie ziemniaków (gdy nać uschnie)"
    ],
    flowers: [
      "SADZENIE CEBULEK WIOSENNYCH: tulipany, narcyzy, krokusy, szafirki (IX-XI)",
      "DZIELENIE BYLIN - NAJLEPSZY CZAS! Piwonie, funkia, liliowce, irysy",
      "Cięcie dalii - NIE TERAZ! Dopiero po pierwszych przymrozkach",
      "Sadzenie róż z odkrytym korzeniem (koniec IX)",
      "Ostatnie nawożenie trawnika (fosfor+potas, BEZ azotu)"
    ],
    general: [
      "Przygotowanie kompostownika na jesienne liście",
      "Czyszczenie narzędzi przed zimą"
    ]
  },

  10: { // Październik
    month: "Październik",
    icon: "🍁",
    priority: "high",
    vegetables: [
      "Zbiór pozostałych warzyw przed przymrozkami",
      "Sadzenie czosnku ozimego (kontynuacja)",
      "Przekopanie grządek + kompost",
      "Przykrycie grządek czarną folią (ziemia szybciej się rozgrzeje wiosną)"
    ],
    flowers: [
      "WYKOPYWANIE CEBUL WRAŻLIWYCH: dalie, begonie, kanny, mieczyki (po przymrozkach!)",
      "Sadzenie cebulek wiosennych (kontynuacja - do przymrozków)",
      "Cięcie bylin 5-10cm nad ziemią: piwonie, liliowce, funkia",
      "ŚCIÓŁKOWANIE RÓŻ korą sosnową 20-30cm (koniec X)",
      "Sadzenie drzew i krzewów z odkrytym korzeniem"
    ],
    general: [
      "Grabie liści - kompost lub ściółka",
      "Sprzątanie ogrodu przed zimą"
    ]
  },

  11: { // Listopad
    month: "Listopad",
    icon: "❄️",
    priority: "medium",
    vegetables: [
      "Ostateczne sprzątanie grządek",
      "Kompostowanie resztek roślinnych (NIE chorych!)",
      "Ochrona grządek folią lub ściółką"
    ],
    flowers: [
      "OSTATNIE sadzenie cebulek wiosennych (przed przymrozkami)",
      "Zabezpieczanie róż okrywowych: kopczyki ziemi + agrowłóknina",
      "Ściółkowanie bylin liśćmi lub korą (10-15cm)",
      "Sprzątanie ogrodu - usuwanie chorych liści (NIE do kompostu!)",
      "Zabezpieczanie krzewów wrażliwych agrowłókniną"
    ],
    general: [
      "Czyszczenie i konserwacja narzędzi",
      "Przygotowanie do zimy"
    ]
  },

  12: { // Grudzień
    month: "Grudzień",
    icon: "🎄",
    priority: "low",
    vegetables: [
      "Planowanie ogrodu na nowy sezon",
      "Przeglądanie katalogów nasion - lista zakupów",
      "Kontrola przechowywanych warzyw (ziemniaki, marchew w piwnicy)"
    ],
    flowers: [
      "Odpoczynek i planowanie",
      "Przeglądanie magazynów ogrodniczych - inspiracje",
      "Zamawianie cebulek i nasion na wiosną",
      "Kontrola cebul kwiatowych w piwnicy"
    ],
    general: [
      "Zimowa przerwa - odpoczynek!",
      "Czytanie książek ogrodniczych",
      "Planowanie nowych rabat"
    ]
  }
};

// Helper function to get current month hints
export const getCurrentMonthHints = () => {
  const currentMonth = new Date().getMonth() + 1; // 1-12
  return seasonalHints[currentMonth];
};

// Helper to get next month hints
export const getNextMonthHints = () => {
  const nextMonth = new Date().getMonth() + 2; // next month (1-12)
  const monthIndex = nextMonth > 12 ? 1 : nextMonth;
  return seasonalHints[monthIndex];
};
