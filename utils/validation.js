/**
 * Walidacja danych oferty lotniczej
 */

const COUNTRY_FLAGS = {
  'grecja': 'https://flagcdn.com/w640/gr.png',
  'cypr': 'https://flagcdn.com/w640/cy.png',
  'hiszpania': 'https://flagcdn.com/w640/es.png',
  'portugalia': 'https://flagcdn.com/w640/pt.png',
  'wlochy': 'https://flagcdn.com/w640/it.png',
  'włochy': 'https://flagcdn.com/w640/it.png',
  'francja': 'https://flagcdn.com/w640/fr.png',
  'turcja': 'https://flagcdn.com/w640/tr.png',
  'egipt': 'https://flagcdn.com/w640/eg.png',
  'maroko': 'https://flagcdn.com/w640/ma.png',
  'tunezja': 'https://flagcdn.com/w640/tn.png',
  'bulgaria': 'https://flagcdn.com/w640/bg.png',
  'bułgaria': 'https://flagcdn.com/w640/bg.png',
  'rumunia': 'https://flagcdn.com/w640/ro.png',
  'chorwacja': 'https://flagcdn.com/w640/hr.png',
  'albania': 'https://flagcdn.com/w640/al.png',
  'czarnogora': 'https://flagcdn.com/w640/me.png',
  'czarnogóra': 'https://flagcdn.com/w640/me.png',
  'malta': 'https://flagcdn.com/w640/mt.png',
  'austria': 'https://flagcdn.com/w640/at.png',
  'niemcy': 'https://flagcdn.com/w640/de.png',
  'czechy': 'https://flagcdn.com/w640/cz.png',
  'węgry': 'https://flagcdn.com/w640/hu.png',
  'wegry': 'https://flagcdn.com/w640/hu.png',
  'polska': 'https://flagcdn.com/w640/pl.png',
  'uk': 'https://flagcdn.com/w640/gb.png',
  'wielka brytania': 'https://flagcdn.com/w640/gb.png',
  'irlandia': 'https://flagcdn.com/w640/ie.png',
  'norwegia': 'https://flagcdn.com/w640/no.png',
  'szwecja': 'https://flagcdn.com/w640/se.png',
  'finlandia': 'https://flagcdn.com/w640/fi.png',
  'dania': 'https://flagcdn.com/w640/dk.png',
  'holandia': 'https://flagcdn.com/w640/nl.png',
  'belgia': 'https://flagcdn.com/w640/be.png',
  'szwajcaria': 'https://flagcdn.com/w640/ch.png',
  'islandia': 'https://flagcdn.com/w640/is.png',
  'usa': 'https://flagcdn.com/w640/us.png',
  'kanada': 'https://flagcdn.com/w640/ca.png',
  'meksyk': 'https://flagcdn.com/w640/mx.png',
  'dubaj': 'https://flagcdn.com/w640/ae.png',
  'emiraty': 'https://flagcdn.com/w640/ae.png',
  'tajlandia': 'https://flagcdn.com/w640/th.png',
  'japonia': 'https://flagcdn.com/w640/jp.png',
  'chiny': 'https://flagcdn.com/w640/cn.png',
};

/**
 * Pobiera URL flagi kraju
 * @param {string} kraj - Nazwa kraju
 * @returns {string} - URL flagi
 */
function getFlagUrl(kraj) {
  if (!kraj) return 'https://flagcdn.com/w640/unknown.png';
  
  const normalizedKraj = kraj.toLowerCase().trim();
  return COUNTRY_FLAGS[normalizedKraj] || 'https://flagcdn.com/w640/unknown.png';
}

/**
 * Waliduje cenę
 * @param {string} cena - Cena w formacie "123 PLN" lub "123"
 * @returns {object} - { valid: boolean, value: string, error: string|null }
 */
function validateCena(cena) {
  if (!cena || cena.trim() === '') {
    return { valid: false, value: null, error: 'Cena jest wymagana' };
  }

  // Usuń spacje i zamień przecinek na kropkę
  let cleanCena = cena.trim().replace(/\s+/g, '').replace(',', '.');
  
  // Usuń "PLN" jeśli jest
  cleanCena = cleanCena.replace(/pln/gi, '');
  
  // Sprawdź czy to liczba
  const numValue = parseFloat(cleanCena);
  if (isNaN(numValue) || numValue <= 0) {
    return { valid: false, value: null, error: 'Cena musi być dodatnią liczbą' };
  }
  
  // Sprawdź czy cena jest rozsądna (nie więcej niż 100000 PLN)
  if (numValue > 100000) {
    return { valid: false, value: null, error: 'Cena jest zbyt wysoka (max 100000 PLN)' };
  }

  return { valid: true, value: `${Math.round(numValue)} PLN`, error: null };
}

/**
 * Waliduje datę w formacie dd/mm/rrrr
 * @param {string} data - Data w formacie "dd/mm/rrrr"
 * @returns {object} - { valid: boolean, value: string, error: string|null }
 */
function validateData(data) {
  if (!data || data.trim() === '') {
    return { valid: false, value: null, error: 'Data jest wymagana' };
  }

  const trimmedData = data.trim();
  
  // Sprawdź czy data jest w formacie dd/mm/rrrr
  const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  
  if (!dateRegex.test(trimmedData)) {
    return { valid: false, value: null, error: 'Nieprawidłowy format daty. Użyj formatu: dd/mm/rrrr (np. 15/04/2026)' };
  }

  const match = trimmedData.match(dateRegex);
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);

  // Sprawdź czy data jest prawidłowa
  const dateObj = new Date(year, month - 1, day);
  if (dateObj.getDate() !== day || dateObj.getMonth() !== month - 1 || dateObj.getFullYear() !== year) {
    return { valid: false, value: null, error: 'Nieprawidłowa data' };
  }

  return { valid: true, value: trimmedData, error: null };
}

/**
 * Waliduje czas lotu
 * @param {string} czas - Czas w formacie "x godz. x min" lub "x h x min" lub samo "x godz"
 * @returns {object} - { valid: boolean, value: string, error: string|null }
 */
function validateCzasLotu(czas) {
  if (!czas || czas.trim() === '') {
    return { valid: false, value: null, error: 'Czas lotu jest wymagany' };
  }

  const trimmedCzas = czas.trim().toLowerCase();
  
  // Akceptuj różne formaty:
  // "2 godz. 30 min", "2h 30m", "2:30", "150 min", "2 godz"
  const validPatterns = [
    /^(\d+)\s*godz\.?\s*(\d+)\s*min$/,      // "2 godz. 30 min", "2 godz 30 min"
    /^(\d+)\s*godz\.?$/,                      // "2 godz", "2 godz."
    /^(\d+)\s*h\.?\s*(\d+)\s*m\.?$/,        // "2h 30m"
    /^(\d+)\s*h\.?$/,                         // "2h"
    /^(\d+):(\d+)$/,                           // "2:30"
    /^(\d+)\s*min$/,                           // "150 min"
  ];
  
  const matchedPattern = validPatterns.find(pattern => pattern.test(trimmedCzas));
  
  if (!matchedPattern) {
    return { valid: false, value: null, error: 'Nieprawidłowy format czasu. Użyj: "2 godz. 30 min" lub "2h 30m" lub "150 min"' };
  }

  // Normalizuj do formatu "X godz. Y min"
  let godziny = 0;
  let minuty = 0;
  
  if (/^(\d+)\s*godz\.?$/.test(trimmedCzas)) {
    // Tylko godziny
    godziny = parseInt(trimmedCzas.match(/^(\d+)\s*godz\.?$/)[1], 10);
  } else if (/^(\d+)\s*h\.?$/.test(trimmedCzas)) {
    // Tylko godziny (skrót)
    godziny = parseInt(trimmedCzas.match(/^(\d+)\s*h\.?$/)[1], 10);
  } else if (/^(\d+)\s*min$/.test(trimmedCzas)) {
    // Tylko minuty
    minuty = parseInt(trimmedCzas.match(/^(\d+)\s*min$/)[1], 10);
    godziny = Math.floor(minuty / 60);
    minuty = minuty % 60;
  } else {
    // Format z godzinami i minutami
    const match = trimmedCzas.match(/^(\d+)\s*(?:godz\.?|h\.?)\s*(?:(\d+)\s*(?:min|m\.?))?$/);
    if (match) {
      godziny = parseInt(match[1], 10);
      minuty = match[2] ? parseInt(match[2], 10) : 0;
    } else if (/^(\d+):(\d+)$/.test(trimmedCzas)) {
      const colonMatch = trimmedCzas.match(/^(\d+):(\d+)$/);
      godziny = parseInt(colonMatch[1], 10);
      minuty = parseInt(colonMatch[2], 10);
    }
  }

  // Formatuj wynik
  if (minuty === 0) {
    return { valid: true, value: `${godziny} godz.`, error: null };
  }
  return { valid: true, value: `${godziny} godz. ${minuty} min`, error: null };
}

/**
 * Waliduje przesiadki
 * @param {string} przesiadki - Liczba przesiadek ("0", "1", "2", "bez przesiadek")
 * @returns {object} - { valid: boolean, value: string, error: string|null }
 */
function validatePrzesiadki(przesiadki) {
  if (!przesiadki || przesiadki.trim() === '') {
    return { valid: true, value: '0', error: null };
  }

  const trimmed = przesiadki.trim().toLowerCase();
  
  // Normalizuj odpowiedzi
  if (trimmed === '0' || trimmed === 'bez' || trimmed === 'brak' || trimmed === 'bez przesiadek' || trimmed === 'bezpośredni' || trimmed === 'bezposredni') {
    return { valid: true, value: '0', error: null };
  }
  
  if (trimmed === '1' || trimmed === 'jedna') {
    return { valid: true, value: '1', error: null };
  }
  
  if (trimmed === '2' || trimmed === 'dwie') {
    return { valid: true, value: '2', error: null };
  }

  if (trimmed === '3' || trimmed === 'trzy') {
    return { valid: true, value: '3', error: null };
  }

  // Sprawdź czy to liczba
  const num = parseInt(trimmed, 10);
  if (!isNaN(num) && num >= 0 && num <= 10) {
    return { valid: true, value: num.toString(), error: null };
  }

  return { valid: false, value: null, error: 'Nieprawidłowa liczba przesiadek. Użyj liczby 0-10 lub słów: bez, jedna, dwie' };
}

/**
 * Waliduje nazwę miasta
 * @param {string} miasto - Nazwa miasta
 * @returns {object} - { valid: boolean, value: string, error: string|null }
 */
function validateMiasto(miasto) {
  if (!miasto || miasto.trim() === '') {
    return { valid: false, value: null, error: 'Nazwa miasta jest wymagana' };
  }

  const trimmed = miasto.trim();
  
  if (trimmed.length < 2) {
    return { valid: false, value: null, error: 'Nazwa miasta jest za krótka' };
  }

  if (trimmed.length > 100) {
    return { valid: false, value: null, error: 'Nazwa miasta jest za długa (max 100 znaków)' };
  }

  return { valid: true, value: trimmed, error: null };
}

/**
 * Waliduje opis
 * @param {string} opis - Opis miejsca docelowego
 * @returns {object} - { valid: boolean, value: string, error: string|null }
 */
function validateOpis(opis) {
  if (!opis || opis.trim() === '') {
    return { valid: true, value: '', error: null }; // Opis opcjonalny
  }

  const trimmed = opis.trim();
  
  if (trimmed.length > 1000) {
    return { valid: false, value: null, error: 'Opis jest za długi (max 1000 znaków)' };
  }

  return { valid: true, value: trimmed, error: null };
}

/**
 * Waliduje link do oferty
 * @param {string} link - URL do oferty
 * @returns {object} - { valid: boolean, value: string, error: string|null }
 */
function validateLink(link) {
  if (!link || link.trim() === '') {
    return { valid: false, value: null, error: 'Link jest wymagany' };
  }

  const trimmed = link.trim();
  
  // Akceptuj każdy niepusty string jako link
  // Dodaj https:// jeśli brakuje protokołu
  let finalLink = trimmed;
  if (!finalLink.startsWith('http://') && !finalLink.startsWith('https://')) {
    finalLink = 'https://' + finalLink;
  }

  return { valid: true, value: finalLink, error: null };
}

/**
 * Konwertuje polskie znaki na znaki bez ogonków i tworzy slug
 * @param {string} text - Tekst do przetworzenia
 * @returns {string} - Slug (małe litery, bez polskich znaków)
 */
function createSlug(text) {
  const polishToLatin = {
    'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n',
    'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z',
    'Ą': 'A', 'Ć': 'C', 'Ę': 'E', 'Ł': 'L', 'Ń': 'N',
    'Ó': 'O', 'Ś': 'S', 'Ź': 'Z', 'Ż': 'Z'
  };
  
  return text
    .split('')
    .map(char => polishToLatin[char] || char)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Generuje unikalne ID dla oferty oparte na mieście docelowym
 * Format: miasto1, miasto2, miasto3, ...
 * @param {string} city - Nazwa miasta docelowego
 * @param {Array} existingOffers - Istniejące oferty
 * @returns {string} - Nowe ID
 */
function generateId(city, existingOffers = []) {
  const citySlug = createSlug(city);
  
  // Znajdź wszystkie oferty dla tego miasta
  const cityOffers = existingOffers.filter(o => {
    const offerCity = o.dokad || o.miasto || '';
    return createSlug(offerCity) === citySlug;
  });
  
  // Znajdź najwyższy numer
  let maxNumber = 0;
  for (const offer of cityOffers) {
    if (offer.id) {
      const match = offer.id.match(new RegExp(`^${citySlug}\\d+$`, 'i'));
      if (match) {
        const num = parseInt(offer.id.replace(new RegExp(`^${citySlug}`, 'i'), ''), 10);
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    }
  }
  
  // Generuj nowe ID: miasto(numer+1)
  return `${citySlug}${maxNumber + 1}`;
}

/**
 * Waliduje całą ofertę
 * @param {object} offer - Obiekt oferty
 * @param {Array} existingOffers - Istniejące oferty (do generowania ID)
 * @returns {object} - { valid: boolean, offer: object|null, errors: string[] }
 */
function validateOffer(offer, existingOffers) {
  const errors = [];
  const validatedOffer = {};

  // Data wylotu (format: dd/mm/rrrr)
  const dataWylotuResult = validateData(offer.dataWylotu);
  if (!dataWylotuResult.valid) {
    errors.push(`Data wylotu: ${dataWylotuResult.error}`);
  } else {
    validatedOffer.dataWylotu = dataWylotuResult.value;
  }

  // Data powrotu (format: dd/mm/rrrr)
  const dataPowrotuResult = validateData(offer.dataPowrotu);
  if (!dataPowrotuResult.valid) {
    errors.push(`Data powrotu: ${dataPowrotuResult.error}`);
  } else {
    validatedOffer.dataPowrotu = dataPowrotuResult.value;
  }

  // Skąd (miasto wylotu)
  const skadResult = validateMiasto(offer.skad);
  if (!skadResult.valid) {
    errors.push(`Skąd: ${skadResult.error}`);
  } else {
    validatedOffer.skad = skadResult.value;
  }

  // Dokąd (miasto przylotu)
  const dokadResult = validateMiasto(offer.dokad);
  if (!dokadResult.valid) {
    errors.push(`Dokąd: ${dokadResult.error}`);
  } else {
    validatedOffer.dokad = dokadResult.value;
  }

  // Czas lotu
  const czasLotuResult = validateCzasLotu(offer.czasLotu);
  if (!czasLotuResult.valid) {
    errors.push(`Czas lotu: ${czasLotuResult.error}`);
  } else {
    validatedOffer.czasLotu = czasLotuResult.value;
  }

  // Przesiadki
  const przesiadkiResult = validatePrzesiadki(offer.przesiadki);
  if (!przesiadkiResult.valid) {
    errors.push(`Przesiadki: ${przesiadkiResult.error}`);
  } else {
    validatedOffer.przesiadki = przesiadkiResult.value;
  }

  // Opis (opcjonalny)
  const opisResult = validateOpis(offer.opis || '');
  validatedOffer.opis = opisResult.value;

  // Link (opcjonalny)
  const linkResult = validateLink(offer.link || '');
  validatedOffer.link = linkResult.value;

  // Cena (opcjonalna)
  if (offer.cena) {
    const cenaResult = validateCena(offer.cena);
    if (!cenaResult.valid) {
      errors.push(`Cena: ${cenaResult.error}`);
    } else {
      validatedOffer.cena = cenaResult.value;
    }
  }

  // ID - generuj na podstawie miasta docelowego
  validatedOffer.id = generateId(validatedOffer.dokad, existingOffers);

  return {
    valid: errors.length === 0,
    offer: errors.length === 0 ? validatedOffer : null,
    errors,
  };
}

/**
 * Parsuje miasto z kodem lotniska (format: "Miasto KOD")
 * @param {string} input - np. "Warszawa WMI"
 * @returns {object} - { valid: boolean, miasto: string, kod: string, error: string|null }
 */
function parseMiastoZKodem(input) {
  if (!input || input.trim() === '') {
    return { valid: false, miasto: null, kod: null, error: 'Pole jest wymagane' };
  }

  const trimmed = input.trim();
  
  // Szukaj wzorca: tekst + spacja + kod lotniska (2-4 litery)
  const match = trimmed.match(/^(.+?)\s+([A-Z]{2,4})$/);
  
  if (!match) {
    return {
      valid: false,
      miasto: null,
      kod: null,
      error: 'Nieprawidłowy format. Użyj: "Miasto KOD" (np. Warszawa WMI)'
    };
  }

  const miasto = match[1].trim();
  const kod = match[2].toUpperCase();

  if (miasto.length < 2) {
    return { valid: false, miasto: null, kod: null, error: 'Nazwa miasta jest za krótka' };
  }

  return { valid: true, miasto, kod, error: null };
}

/**
 * Parsuje datę w formacie dd.mm-dd.mm.rr
 * @param {string} input - np. "07.04-14.04.26" lub "7.04-14.04.2026"
 * @returns {object} - { valid: boolean, skrot: string, pelna: string, error: string|null }
 */
function parseDateRange(input) {
  if (!input || input.trim() === '') {
    return { valid: false, skrot: null, pelna: null, error: 'Data jest wymagana' };
  }

  const trimmed = input.trim();
  
  // Wzorce: dd.mm-dd.mm.rr lub d.mm-dd.mm.rrrr lub dd.mm-dd.mm.rrrr
  const match = trimmed.match(/^(\d{1,2})\.(\d{1,2})-(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/);
  
  if (!match) {
    return {
      valid: false,
      skrot: null,
      pelna: null,
      error: 'Nieprawidłowy format. Użyj: dd.mm-dd.mm.rr (np. 07.04-14.04.26)'
    };
  }

  const dzienWylotu = parseInt(match[1], 10);
  const miesiacWylotu = parseInt(match[2], 10);
  const dzienPowrotu = parseInt(match[3], 10);
  const miesiacPowrotu = parseInt(match[4], 10);
  let rok = parseInt(match[5], 10);

  // Obsługa roku (20xx)
  if (rok < 100) {
    rok = 2000 + rok;
  }

  // Walidacja dat
  const months = {
    1: 'stycznia', 2: 'lutego', 3: 'marca', 4: 'kwietnia',
    5: 'maja', 6: 'czerwca', 7: 'lipca', 8: 'sierpnia',
    9: 'września', 10: 'października', 11: 'listopada', 12: 'grudnia'
  };

  if (!months[miesiacWylotu] || !months[miesiacPowrotu]) {
    return { valid: false, skrot: null, pelna: null, error: 'Nieprawidłowy miesiąc' };
  }

  // Sprawdź czy dzień jest prawidłowy
  const daysInMonth = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const isLeapYear = (rok % 4 === 0 && rok % 100 !== 0) || (rok % 400 === 0);
  if (isLeapYear) daysInMonth[2] = 29;

  if (dzienWylotu < 1 || dzienWylotu > daysInMonth[miesiacWylotu] ||
      dzienPowrotu < 1 || dzienPowrotu > daysInMonth[miesiacPowrotu]) {
    return { valid: false, skrot: null, pelna: null, error: 'Nieprawidłowy dzień miesiąca' };
  }

  // Format skrócony (do pola "Kiedy") - rok dwucyfrowy
  const rokSkrot = rok.toString().slice(-2);
  const skrot = `${dzienWylotu.toString().padStart(2, '0')}.${miesiacWylotu.toString().padStart(2, '0')}-${dzienPowrotu.toString().padStart(2, '0')}.${miesiacPowrotu.toString().padStart(2, '0')}.${rokSkrot}`;
  
  // Format pełny (np. "7-14 kwietnia 2026" lub "7 kwietnia - 14 maja 2026")
  // Używany w lewym górnym rogu karty oferty
  let pelna;
  if (miesiacWylotu === miesiacPowrotu) {
    // Ten sam miesiąc: "1-31 sierpnia 2026"
    pelna = `${dzienWylotu}-${dzienPowrotu} ${months[miesiacWylotu]} ${rok}`;
  } else {
    // Różne miesiące: "28 lipca - 4 sierpnia 2026"
    pelna = `${dzienWylotu} ${months[miesiacWylotu]} - ${dzienPowrotu} ${months[miesiacPowrotu]} ${rok}`;
  }

  // Pełne daty wylotu i powrotu osobno (do JSONa)
  const dataWylotuPelna = `${dzienWylotu} ${months[miesiacWylotu]} ${rok}`;
  const dataPowrotuPelna = `${dzienPowrotu} ${months[miesiacPowrotu]} ${rok}`;

  return {
    valid: true,
    skrot,
    pelna,
    dataWylotuPelna,
    dataPowrotuPelna,
    dataWylotu: `${dzienWylotu.toString().padStart(2, '0')}/${miesiacWylotu.toString().padStart(2, '0')}/${rok}`,
    dataPowrotu: `${dzienPowrotu.toString().padStart(2, '0')}/${miesiacPowrotu.toString().padStart(2, '0')}/${rok}`,
    error: null
  };
}

/**
 * Parsuje czas lotu z formatu x.xx lub x na "X godz. Y min"
 * @param {string} input - np. "1.15", "15.20", "2" lub "3.30"
 * @returns {object} - { valid: boolean, value: string, error: string|null }
 */
function parseCzasLotu(input) {
  if (!input || input.trim() === '') {
    return { valid: false, value: null, error: 'Czas lotu jest wymagany' };
  }

  const trimmed = input.trim().replace(',', '.');
  
  // Format: tylko godziny (np. "2", "15")
  const hoursOnlyMatch = trimmed.match(/^(\d+)$/);
  if (hoursOnlyMatch) {
    const godziny = parseInt(hoursOnlyMatch[1], 10);
    return { valid: true, value: `${godziny} godz.`, error: null };
  }
  
  // Format: liczba.liczba (np. 1.15, 15.20)
  const match = trimmed.match(/^(\d+)\.(\d{1,2})$/);
  
  if (!match) {
    return {
      valid: false,
      value: null,
      error: 'Nieprawidłowy format. Użyj: godziny.minuty (np. 2.30 lub 15.20) lub same godziny (np. 2)'
    };
  }

  const godziny = parseInt(match[1], 10);
  let minuty = parseInt(match[2], 10);
  
  // Jeśli minuty są podane jako jedna cyfra, przemnoż przez 10
  if (match[2].length === 1) {
    minuty = minuty * 10;
  }

  if (minuty > 59) {
    return { valid: false, value: null, error: 'Minuty muszą być mniejsze niż 60' };
  }

  // Format wynikowy
  if (minuty === 0) {
    return { valid: true, value: `${godziny} godz.`, error: null };
  }
  return { valid: true, value: `${godziny} godz. ${minuty} min`, error: null };
}

/**
 * Parsuje przesiadki - liczba na tekst
 * @param {string} input - np. "0", "1", "2"
 * @returns {object} - { valid: boolean, value: string, error: string|null }
 */
function parsePrzesiadki(input) {
  if (!input || input.trim() === '') {
    return { valid: false, value: null, error: 'Liczba przesiadek jest wymagana' };
  }

  const trimmed = input.trim();
  const num = parseInt(trimmed, 10);

  if (isNaN(num) || num < 0 || num > 10) {
    return { valid: false, value: null, error: 'Podaj liczbę od 0 do 10' };
  }

  const forms = {
    0: 'Bez przesiadek',
    1: 'Jedna przesiadka',
    2: 'Dwie przesiadki',
    3: 'Trzy przesiadki',
  };

  if (forms[num]) {
    return { valid: true, value: forms[num], error: null };
  }
  
  return { valid: true, value: `${num} przesiadki`, error: null };
}

/**
 * Główna funkcja parsująca dane oferty
 * @param {object} data - Surowe dane z formularza
 * @returns {object} - { valid: boolean, offer: object|null, errors: string[] }
 */
function parseOfferData(data) {
  const errors = [];
  const offer = {};

  // Parsuj Skąd
  const skadResult = parseMiastoZKodem(data.skad);
  if (!skadResult.valid) {
    errors.push(`Skąd: ${skadResult.error}`);
  } else {
    offer.skad = { miasto: skadResult.miasto, kod: skadResult.kod };
  }

  // Parsuj Dokąd
  const dokadResult = parseMiastoZKodem(data.dokad);
  if (!dokadResult.valid) {
    errors.push(`Dokąd: ${dokadResult.error}`);
  } else {
    offer.dokad = { miasto: dokadResult.miasto, kod: dokadResult.kod };
  }

  // Parsuj datę
  const kiedyResult = parseDateRange(data.kiedy);
  if (!kiedyResult.valid) {
    errors.push(`Kiedy: ${kiedyResult.error}`);
  } else {
    offer.dataWylotu = { skrot: kiedyResult.skrot, pelna: kiedyResult.pelna };
    offer.dataPowrotu = { skrot: '', pelna: '' }; // placeholder
    offer.kiedy = kiedyResult.skrot; // format skrócony
    offer.dataPelna = kiedyResult.pelna; // format pełny
  }

  // Parsuj przesiadki
  const przesiadkiResult = parsePrzesiadki(data.przesiadki);
  if (!przesiadkiResult.valid) {
    errors.push(`Przesiadki: ${przesiadkiResult.error}`);
  } else {
    offer.przesiadki = przesiadkiResult.value;
  }

  // Parsuj czas lotu
  const czasResult = parseCzasLotu(data.czasLotu);
  if (!czasResult.valid) {
    errors.push(`Czas lotu: ${czasResult.error}`);
  } else {
    offer.czasLotu = czasResult.value;
  }

  // Parsuj cenę
  const cenaResult = validateCena(data.cena + ' PLN');
  if (!cenaResult.valid) {
    errors.push(`Cena: ${cenaResult.error}`);
  } else {
    offer.cena = parseInt(cenaResult.value.replace(' PLN', ''), 10);
  }

  // Waliduj link
  const linkResult = validateLink(data.link);
  if (!linkResult.valid) {
    errors.push(`Link: ${linkResult.error}`);
  } else {
    offer.link = linkResult.value;
  }

  // Generuj ID na podstawie miasta docelowego
  if (offer.dokad && offer.dokad.miasto) {
    offer.id = generateId(offer.dokad.miasto, []); // existingOffers będzie pobrane w addOffer
  }

  return {
    valid: errors.length === 0,
    offer: errors.length === 0 ? offer : null,
    errors,
  };
}

/**
 * Pobiera URL flagi kraju na podstawie miasta
 * @param {string} miasto - Nazwa miasta
 * @returns {string} - URL flagi
 */
function getFlagUrlByCity(miasto) {
  const cityToCountry = {
    'chania': 'grecja',
    'kreta': 'grecja',
    'korfu': 'grecja',
    'ateny': 'grecja',
    'londyn': 'wielka brytania',
    'manchester': 'wielka brytania',
    'liverpool': 'wielka brytania',
    'paryz': 'francja',
    'nicea': 'francja',
    'marsylia': 'francja',
    'rzym': 'wlochy',
    'mediolan': 'wlochy',
    'wenecja': 'wlochy',
    'barcelona': 'hiszpania',
    'madryt': 'hiszpania',
    'malaga': 'hiszpania',
    'lisbona': 'portugalia',
    'porto': 'portugalia',
    'antalya': 'turcja',
    'stambul': 'turcja',
    'izmir': 'turcja',
    'hurghada': 'egipt',
    'sharm': 'egipt',
    'kair': 'egipt',
    'dubaj': 'emiraty',
    'abu dhabi': 'emiraty',
    'malta': 'malta',
    'valletta': 'malta',
  };
  
  const citySlug = createSlug(miasto);
  const kraj = cityToCountry[citySlug] || 'unknown';
  return COUNTRY_FLAGS[kraj] || 'https://flagcdn.com/w640/unknown.png';
}

/**
 * Parsuje wszystkie dane oferty (dla kroku 2 z linkiem)
 * Tworzy strukturę zgodną ze stroną
 * @param {object} data - Surowe dane z obu kroków
 * @param {Array} existingOffers - Istniejące oferty (do generowania ID)
 * @returns {object} - { valid: boolean, offer: object|null, errors: string[] }
 */
function parseOfferDataStep2(data, existingOffers = []) {
  const errors = [];
  const offer = {};

  // Parsuj Skąd
  const skadResult = parseMiastoZKodem(data.skad);
  if (!skadResult.valid) {
    errors.push(`Skąd: ${skadResult.error}`);
  }

  // Parsuj Dokąd
  const dokadResult = parseMiastoZKodem(data.dokad);
  if (!dokadResult.valid) {
    errors.push(`Dokąd: ${dokadResult.error}`);
  }

  // Parsuj datę
  const kiedyResult = parseDateRange(data.kiedy);
  if (!kiedyResult.valid) {
    errors.push(`Kiedy: ${kiedyResult.error}`);
  }

  // Parsuj czas i przesiadki (format: "2.30, 0")
  let czasLotu = '';
  let przesiadki = '';
  const czasPrzesiadkiParts = data.czasPrzesiadki.split(',').map(s => s.trim());
  if (czasPrzesiadkiParts.length !== 2) {
    errors.push('Czas i przesiadki: Użyj formatu "czas, przesiadki" (np. "2.30, 0")');
  } else {
    const czasResult = parseCzasLotu(czasPrzesiadkiParts[0]);
    const przesiadkiResult = parsePrzesiadki(czasPrzesiadkiParts[1]);
    
    if (!czasResult.valid) {
      errors.push(`Czas lotu: ${czasResult.error}`);
    } else {
      czasLotu = czasResult.value;
    }
    
    if (!przesiadkiResult.valid) {
      errors.push(`Przesiadki: ${przesiadkiResult.error}`);
    } else {
      przesiadki = przesiadkiResult.value.toLowerCase();
    }
  }

  // Parsuj cenę
  const cenaResult = validateCena(data.cena + ' PLN');
  if (!cenaResult.valid) {
    errors.push(`Cena: ${cenaResult.error}`);
  }

  // Waliduj link
  const linkResult = validateLink(data.link);
  if (!linkResult.valid) {
    errors.push(`Link: ${linkResult.error}`);
  }

  if (errors.length > 0) {
    return { valid: false, offer: null, errors };
  }

  // Generuj ID na podstawie miasta docelowego
  const citySlug = createSlug(dokadResult.miasto);
  const id = generateId(dokadResult.miasto, existingOffers);

  // Buduj ofertę w formacie strony
  offer.id = id;
  offer.miasto = dokadResult.miasto;
  offer.kraj = getCountryName(dokadResult.miasto);
  offer.flaga = getFlagUrlByCity(dokadResult.miasto);
  offer.dataWylotu = kiedyResult.dataWylotuPelna;
  offer.dataPowrotu = kiedyResult.dataPowrotuPelna;
  offer.czas = czasLotu;
  offer.przesiadki = przesiadki;
  offer.cena = cenaResult.value;
  offer.kodWylotu = skadResult.kod;
  offer.kodPrzylotu = dokadResult.kod;
  offer.opis = '';
  offer.atrakcje = [];
  offer.zdjecia = [];
  offer.link = linkResult.value;

  return {
    valid: true,
    offer,
    errors: [],
  };
}

/**
 * Pobiera nazwę kraju na podstawie miasta
 * @param {string} miasto - Nazwa miasta
 * @returns {string} - Nazwa kraju
 */
function getCountryName(miasto) {
  const cityToCountry = {
    'chania': 'Grecja',
    'kreta': 'Grecja',
    'korfu': 'Grecja',
    'ateny': 'Grecja',
    'londyn': 'Wielka Brytania',
    'manchester': 'Wielka Brytania',
    'liverpool': 'Wielka Brytania',
    'paryz': 'Francja',
    'nicea': 'Francja',
    'marsylia': 'Francja',
    'rzym': 'Włochy',
    'mediolan': 'Włochy',
    'wenecja': 'Włochy',
    'barcelona': 'Hiszpania',
    'madryt': 'Hiszpania',
    'malaga': 'Hiszpania',
    'lisbona': 'Portugalia',
    'porto': 'Portugalia',
    'antalya': 'Turcja',
    'stambul': 'Turcja',
    'izmir': 'Turcja',
    'hurghada': 'Egipt',
    'sharm': 'Egipt',
    'kair': 'Egipt',
    'dubaj': 'Zjednoczone Emiraty Arabskie',
    'abu dhabi': 'Zjednoczone Emiraty Arabskie',
    'malta': 'Malta',
    'valletta': 'Malta',
  };
  
  const citySlug = createSlug(miasto);
  return cityToCountry[citySlug] || 'Nieznany';
}

module.exports = {
  validateOffer,
  validateMiasto,
  validateData,
  validateCena,
  validateCzasLotu,
  validatePrzesiadki,
  validateOpis,
  validateLink,
  getFlagUrl,
  generateId,
  parseOfferData,
  parseOfferDataStep2,
  parseMiastoZKodem,
  parseDateRange,
  parseCzasLotu,
  parsePrzesiadki,
};
