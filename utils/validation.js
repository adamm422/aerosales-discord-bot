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
    return { valid: true, value: '', error: null }; // Link opcjonalny
  }

  const trimmed = link.trim();
  
  // Prosta walidacja URL
  const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
  
  if (!urlPattern.test(trimmed)) {
    return { valid: false, value: null, error: 'Nieprawidłowy format linku. Upewnij się, że zaczyna się od http:// lub https://' };
  }

  // Dodaj https:// jeśli brakuje protokołu
  let finalLink = trimmed;
  if (!finalLink.startsWith('http://') && !finalLink.startsWith('https://')) {
    finalLink = 'https://' + finalLink;
  }

  return { valid: true, value: finalLink, error: null };
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
  validateData,
  validateCena,
  validateCzasLotu,
  validatePrzesiadki,
  validateOpis,
  validateLink,
  getFlagUrl,
  generateId,
};
