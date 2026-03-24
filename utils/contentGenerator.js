/**
 * Generator treści dla ofert - OpenAI + Unsplash
 * Automatycznie generuje opisy, atrakcje i pobiera zdjęcia
 */

const axios = require('axios');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

/**
 * Generuje pełną treść oferty (opis, atrakcje, zdjęcia)
 * @param {string} miasto - Nazwa miasta docelowego
 * @param {string} kraj - Nazwa kraju
 * @returns {Promise<object>} - { opis, atrakcje, zdjecia }
 */
async function generateOfferContent(miasto, kraj) {
  console.log(`[CONTENT] Generowanie treści dla: ${miasto}, ${kraj}`);

  try {
    // Generuj wszystko równolegle
    const [opis, atrakcje, zdjecia] = await Promise.all([
      generateDescription(miasto, kraj),
      generateAttractions(miasto, kraj),
      fetchUnsplashPhotos(miasto, kraj),
    ]);

    console.log('[CONTENT] Wygenerowano treść pomyślnie');

    return {
      opis,
      atrakcje,
      zdjecia,
    };
  } catch (error) {
    console.error('[CONTENT] Błąd generowania treści:', error.message);
    // Zwróć fallbackowe dane w razie błędu
    return {
      opis: `${miasto} – fascynujące miasto w ${kraj}, które warto odwiedzić. Oferuje niezapomniane wrażenia i wiele atrakcji dla turystów.`,
      atrakcje: getFallbackAttractions(miasto),
      zdjecia: getFallbackPhotos(),
    };
  }
}

/**
 * Generuje opis miasta za pomocą OpenAI
 */
async function generateDescription(miasto, kraj) {
  if (!OPENAI_API_KEY) {
    console.warn('[CONTENT] Brak klucza OpenAI, używam fallback');
    return `${miasto} – fascynujące miasto w ${kraj}, które warto odwiedzić.`;
  }

  const prompt = `Napisz krótki, porywający opis turystyczny miasta ${miasto} w ${kraj} (2-3 zdania po polsku). 
Styl: entuzjastyczny, zachęcający do podróży. 
Wzmianki: co najważniejsze do zobaczenia, charakter miasta, klimat.`;

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Jesteś ekspertem od podróży. Piszesz zachęcające opisy miast po polsku.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 200,
        temperature: 0.7,
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const description = response.data.choices[0].message.content.trim();
    console.log('[CONTENT] Wygenerowano opis:', description.substring(0, 50) + '...');
    return description;
  } catch (error) {
    console.error('[CONTENT] Błąd OpenAI (opis):', error.response?.data?.error?.message || error.message);
    return `${miasto} – fascynujące miasto w ${kraj}, które warto odwiedzić.`;
  }
}

/**
 * Generuje listę atrakcji za pomocą OpenAI
 */
async function generateAttractions(miasto, kraj) {
  if (!OPENAI_API_KEY) {
    console.warn('[CONTENT] Brak klucza OpenAI, używam fallback');
    return getFallbackAttractions(miasto);
  }

  const prompt = `Podaj 6 najważniejszych atrakcji turystycznych w mieście ${miasto} (${kraj}).
Zwróć wynik jako JSON array w formacie:
[
  { "nazwa": "Nazwa atrakcji", "typ": "historia|natura|miasto|kultura|architektura", "ikona": "Landmark" }
]

Dostępne ikony: Waves, Mountain, Landmark, Building2, Palmtree, Ship, Castle, Heart, Crown, Coffee, Church, Scroll, Trees, Columns, ShoppingBag, Cross, Shield, Building, Sun, Flag, Flower2, Home, Palette, MapPin, Umbrella, Footprints, Atom

Wybierz najbardziej pasujące ikony do typu atrakcji.`;

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Jesteś ekspertem od podróży. Zwracasz tylko poprawny JSON, bez dodatkowego tekstu.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.5,
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const content = response.data.choices[0].message.content.trim();
    
    // Wyciągnij JSON z odpowiedzi (na wypadek gdyby był opakowany w markdown)
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const attractions = JSON.parse(jsonMatch[0]);
      console.log('[CONTENT] Wygenerowano atrakcje:', attractions.length);
      return attractions;
    }
    
    throw new Error('Nie udało się sparsować JSON z atrakcjami');
  } catch (error) {
    console.error('[CONTENT] Błąd OpenAI (atrakcje):', error.response?.data?.error?.message || error.message);
    return getFallbackAttractions(miasto);
  }
}

/**
 * Pobiera zdjęcia z Unsplash
 */
async function fetchUnsplashPhotos(miasto, kraj) {
  if (!UNSPLASH_ACCESS_KEY) {
    console.warn('[CONTENT] Brak klucza Unsplash, używam fallback');
    return getFallbackPhotos();
  }

  try {
    // Szukaj zdjęć miasta
    const query = `${miasto} ${kraj} city travel`;
    const response = await axios.get('https://api.unsplash.com/search/photos', {
      params: {
        query: query,
        per_page: 5,
        orientation: 'landscape',
      },
      headers: {
        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
      },
    });

    const photos = response.data.results;
    
    if (photos.length === 0) {
      console.warn('[CONTENT] Brak zdjęć dla:', query);
      return getFallbackPhotos();
    }

    // Pobierz URL-e zdjęć w odpowiednim rozmiarze
    const photoUrls = photos.map(photo => {
      return `${photo.urls.raw}&w=800&h=600&fit=crop`;
    });

    console.log('[CONTENT] Pobrano zdjęcia:', photoUrls.length);
    return photoUrls;
  } catch (error) {
    console.error('[CONTENT] Błąd Unsplash:', error.response?.data?.errors?.[0] || error.message);
    return getFallbackPhotos();
  }
}

/**
 * Zwraca fallbackowe atrakcje
 */
function getFallbackAttractions(miasto) {
  return [
    { nazwa: `Stare Miasto w ${miasto}`, typ: 'miasto', ikona: 'Building2' },
    { nazwa: 'Muzeum Narodowe', typ: 'kultura', ikona: 'Landmark' },
    { nazwa: 'Park Miejski', typ: 'natura', ikona: 'Trees' },
    { nazwa: 'Zamek / Pałac', typ: 'historia', ikona: 'Castle' },
    { nazwa: 'Rynek / Centrum', typ: 'miasto', ikona: 'MapPin' },
    { nazwa: 'Plaża / Bulwary', typ: 'natura', ikona: 'Waves' },
  ];
}

/**
 * Zwraca fallbackowe zdjęcia
 */
function getFallbackPhotos() {
  return [
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=800&h=600&fit=crop',
  ];
}

module.exports = {
  generateOfferContent,
  generateDescription,
  generateAttractions,
  fetchUnsplashPhotos,
};