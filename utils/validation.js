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
 * Waliduje datę w formacie polskim
 * @param {string} data - Data w formacie "6 kwietnia 2026" lub "06.04.2026"
 * @returns {object} - { valid: boolean, value: string, error: string|null }
 */
function validateData(data) {
  if (!data || data.trim() === '') {
    return { valid: false, value: null, error: 'Data jest wymagana' };
  }

  const trimmedData = data.trim();
  
  // Sprawdź czy data jest w poprawnym formacie polskim (np. "6 kwietnia 2026")
  const polishDateRegex = /^(\d{1,2})\s+(stycznia|lutego|marca|kwietnia|maja|czerwca|lipca|sierpnia|września|października|listopada|grudnia)\s+(\d{4})$/i;
  
  if (polishDateRegex.test(trimmedData)) {
    return { valid: true, value: trimmedData, error: null };
  }
  
  // Spróbuj sparsować inne formaty i przekonwertować na polski
  const dateObj = new Date(trimmedData);
  if (!isNaN(dateObj.getTime())) {
    // Konwertuj na polski format
    const months = [
      'stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
      'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'
    ];
    const day = dateObj.getDate();
    const month = months[dateObj.getMonth()];
    const year = dateObj.getFullYear();
    
    return { valid: true, value: `${day} ${month} ${year}`, error: null };
  }

  return { valid: false, value: null, error: 'Nieprawidłowy format daty. Użyj formatu: "6 kwietnia 2026"' };
}

/**
 * Waliduje kod lotniska IATA
 * @param {string} kod - Kod lotniska (np. "WMI", "CHQ")
 * @returns {object} - { valid: boolean, value: string, error: string|null }
 */
function validateKodLotniska(kod) {
  if (!kod || kod.trim() === '') {
    return { valid: false, value: null, error: 'Kod lotniska jest wymagany' };
  }

  const cleanKod = kod.trim().toUpperCase();
  
  // Kod IATA to dokładnie 3 litery
  if (!/^[A-Z]{3}$/.test(cleanKod)) {
    return { valid: false, value: null, error: 'Kod lotniska musi składać się z dokładnie 3 liter (np. WMI, CHQ)' };
  }

  return { valid: true, value: cleanKod, error: null };
}

/**
 * Waliduje czas lotu
 * @param {string} czas - Czas w formacie "2 godz. 55 min"
 * @returns {object} - { valid: boolean, value: string, error: string|null }
 */
function validateCzas(czas) {
  if (!czas || czas.trim() === '') {
    return { valid: false, value: null, error: 'Czas lotu jest wymagany' };
  }

  const trimmedCzas = czas.trim();
  
  // Akceptuj różne formaty:
  // "2 godz. 55 min", "2h 55m", "2:55", "175 min"
  const validPatterns = [
    /^\d+\s+godz\.?\s+\d+\s+min$/,           // "2 godz. 55 min"
    /^\d+\s*godz\.?\s*\d*\s*min?$/,          // "2 godz", "2 godz 55 min"
    /^\d+\s*h\.?\s*\d+\s*m\.?$/,             // "2h 55m"
    /^\d+:\d+$/,                               // "2:55"
    /^\d+\s+min$/,                             // "175 min"
    /^\d+\s*min$/,                             // "175min"
  ];
  
  const isValid = validPatterns.some(pattern => pattern.test(trimmedCzas.toLowerCase()));
  
  if (!isValid) {
    return { valid: false, value: null, error: 'Nieprawidłowy format czasu. Użyj: "2 godz. 55 min" lub "2h 55m"' };
  }

  // Normalizuj do formatu "X godz. Y min"
  let normalized = trimmedCzas.toLowerCase();
  
  // Zamień skróty na pełne formy
  normalized = normalized
    .replace(/(\d+)\s*h\.?\s*(\d+)\s*m\.?/, '$1 godz. $2 min')
    .replace(/(\d+):(\d+)/, '$1 godz. $2 min')
    .replace(/(\d+)\s*min/, '$1 min');

  return { valid: true, value: normalized, error: null };
}

/**
 * Waliduje przesiadki
 * @param {string} przesiadki - Tekst opisujący przesiadki
 * @returns {object} - { valid: boolean, value: string, error: string|null }
 */
function validatePrzesiadki(przesiadki) {
  if (!przesiadki || przesiadki.trim() === '') {
    return { valid: true, value: 'bez przesiadek', error: null };
  }

  const trimmed = przesiadki.trim().toLowerCase();
  
  // Normalizuj odpowiedzi
  if (trimmed === '0' || trimmed === 'bez' || trimmed === 'brak' || trimmed === 'bez przesiadek' || trimmed === 'bezpośredni') {
    return { valid: true, value: 'bez przesiadek', error: null };
  }
  
  if (trimmed === '1' || trimmed === 'jedna') {
    return { valid: true, value: '1 przesiadka', error: null };
  }
  
  if (trimmed === '2' || trimmed === 'dwie') {
    return { valid: true, value: '2 przesiadki', error: null };
  }

  return { valid: true, value: przesiadki.trim(), error: null };
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
 * Waliduje nazwę kraju
 * @param {string} kraj - Nazwa kraju
 * @returns {object} - { valid: boolean, value: string, error: string|null }
 */
function validateKraj(kraj) {
  if (!kraj || kraj.trim() === '') {
    return { valid: false, value: null, error: 'Nazwa kraju jest wymagana' };
  }

  const trimmed = kraj.trim();
  
  if (trimmed.length < 2) {
    return { valid: false, value: null, error: 'Nazwa kraju jest za krótka' };
  }

  return { valid: true, value: trimmed, error: null };
}

/**
 * Generuje unikalne ID dla oferty
 * @param {Array} existingOffers - Istniejące oferty (opcjonalne)
 * @returns {string} - Nowe ID
 */
function generateId(existingOffers) {
  // Użyj timestamp + random dla unikalności
  // Format: czas_w_milisekundach_6cyfr_random
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `${timestamp}_${random}`;
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

  // Miasto
  const miastoResult = validateMiasto(offer.miasto);
  if (!miastoResult.valid) {
    errors.push(`Miasto: ${miastoResult.error}`);
  } else {
    validatedOffer.miasto = miastoResult.value;
  }

  // Kraj
  const krajResult = validateKraj(offer.kraj);
  if (!krajResult.valid) {
    errors.push(`Kraj: ${krajResult.error}`);
  } else {
    validatedOffer.kraj = krajResult.value;
    validatedOffer.flaga = getFlagUrl(krajResult.value);
  }

  // Data wylotu
  const dataWylotuResult = validateData(offer.dataWylotu);
  if (!dataWylotuResult.valid) {
    errors.push(`Data wylotu: ${dataWylotuResult.error}`);
  } else {
    validatedOffer.dataWylotu = dataWylotuResult.value;
  }

  // Data powrotu
  const dataPowrotuResult = validateData(offer.dataPowrotu);
  if (!dataPowrotuResult.valid) {
    errors.push(`Data powrotu: ${dataPowrotuResult.error}`);
  } else {
    validatedOffer.dataPowrotu = dataPowrotuResult.value;
  }

  // Czas lotu
  const czasResult = validateCzas(offer.czas);
  if (!czasResult.valid) {
    errors.push(`Czas lotu: ${czasResult.error}`);
  } else {
    validatedOffer.czas = czasResult.value;
  }

  // Przesiadki
  const przesiadkiResult = validatePrzesiadki(offer.przesiadki);
  validatedOffer.przesiadki = przesiadkiResult.value;

  // Cena
  const cenaResult = validateCena(offer.cena);
  if (!cenaResult.valid) {
    errors.push(`Cena: ${cenaResult.error}`);
  } else {
    validatedOffer.cena = cenaResult.value;
  }

  // Kod wylotu
  const kodWylotuResult = validateKodLotniska(offer.kodWylotu);
  if (!kodWylotuResult.valid) {
    errors.push(`Kod lotniska wylotu: ${kodWylotuResult.error}`);
  } else {
    validatedOffer.kodWylotu = kodWylotuResult.value;
  }

  // Kod przylotu
  const kodPrzylotuResult = validateKodLotniska(offer.kodPrzylotu);
  if (!kodPrzylotuResult.valid) {
    errors.push(`Kod lotniska przylotu: ${kodPrzylotuResult.error}`);
  } else {
    validatedOffer.kodPrzylotu = kodPrzylotuResult.value;
  }

  // ID
  validatedOffer.id = generateId(existingOffers);

  return {
    valid: errors.length === 0,
    offer: errors.length === 0 ? validatedOffer : null,
    errors,
  };
}

module.exports = {
  validateOffer,
  validateMiasto,
  validateKraj,
  validateData,
  validateCena,
  validateKodLotniska,
  validateCzas,
  validatePrzesiadki,
  getFlagUrl,
  generateId,
};