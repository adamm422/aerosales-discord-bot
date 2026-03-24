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
    // Jeśli kraj nie jest podany, rozpoznaj go przez OpenAI
    let detectedKraj = kraj;
    if (!detectedKraj || detectedKraj === 'unknown') {
      detectedKraj = await getCountryFromCity(miasto);
    }

    // Generuj wszystko równolegle
    const [opis, atrakcje, zdjecia] = await Promise.all([
      generateDescription(miasto, detectedKraj || miasto),
      generateAttractions(miasto, detectedKraj || miasto),
      fetchUnsplashPhotos(miasto, detectedKraj || miasto),
    ]);

    console.log('[CONTENT] Wygenerowano treść pomyślnie');

    return {
      opis,
      atrakcje,
      zdjecia,
      kraj: detectedKraj,
    };
  } catch (error) {
    console.error('[CONTENT] Błąd generowania treści:', error.message);
    // Zwróć fallbackowe dane w razie błędu
    return {
      opis: `${miasto} – fascynujące miasto, które warto odwiedzić. Oferuje niezapomniane wrażenia i wiele atrakcji dla turystów.`,
      atrakcje: getFallbackAttractions(miasto),
      zdjecia: getFallbackPhotos(),
      kraj: kraj || null,
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

  const prompt = `Napisz szczegółowy, porywający opis turystyczny miasta ${miasto} w ${kraj} (4-5 zdań po polsku).

WYMAGANIA:
- Styl: entuzjastyczny, zachęcający do podróży, malowniczy
- Wzmianki o konkretnych zabytkach, charakterystycznych miejscach lub unikalnych cechach miasta
- Opisz klimat, atmosferę, co czyni to miejsce wyjątkowym
- Unikaj ogólników typu "warto odwiedzić" - podaj konkrety
- Długość: minimum 300 znaków, maksimum 500 znaków

PRZYKŁAD DOBREGO OPISU:
"Kreta – największa grecka wyspa, perła Morza Śródziemnego. Słynie z malowniczych plaż ze szmaragdową wodą, starożytnych ruin pałacu Knossos, majestatycznego wąwozu Samaria oraz urokliwych miasteczek z wenecką architekturą. Chania, zachodnia stolica wyspy, urzeka wąskimi uliczkami Starego Miasta, portem weneckim i latarniami morskimi."`;

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Jesteś doświadczonym pisarzem turystycznym. Tworzysz szczegółowe, barwne opisy miast po polsku. Używasz konkretnych nazw miejsc i zabytków.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 400,
        temperature: 0.8,
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

  const prompt = `Podaj 6 najważniejszych, KONKRETNYCH atrakcji turystycznych w mieście ${miasto} (${kraj}).

WYMAGANIA:
- Podaj WYŁĄCZNIE rzeczywiste, nazwane miejsca (nie ogólniki typu "Stare Miasto" czy "Muzeum Narodowe")
- Nazwy atrakcji muszą być konkretne i rozpoznawalne dla turystów
- Uwzględnij różnorodność: zabytki, przyroda, kultura, architektura

PRZYKŁADY DOBRYCH ATRAKCJI DLA MEDYOLANU:
- Katedra Duomo di Milano (nie "Katedra")
- Teatro alla Scala (nie "Teatr")
- Galeria Vittorio Emanuele II (nie "Galeria handlowa")
- Park Sempione (nie "Park Miejski")
- Zamek Sforzów (Castello Sforzesco)
- Kościół Santa Maria delle Grazie

Zwróć wynik jako JSON array w formacie:
[
  { "nazwa": "Konkretna Nazwa Atrakcji", "typ": "historia|natura|miasto|kultura|architektura", "ikona": "Landmark" }
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
            content: 'Jesteś ekspertem od podróży. Znasz konkretne, nazwane atrakcje turystyczne w każdym mieście. Zwracasz tylko poprawny JSON, bez dodatkowego tekstu.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 600,
        temperature: 0.7,
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
    // Szukaj zdjęć miasta z losową stroną aby unikać duplikatów
    const query = `${miasto} ${kraj} city travel`;
    const randomPage = Math.floor(Math.random() * 5) + 1; // Losowa strona 1-5
    
    const response = await axios.get('https://api.unsplash.com/search/photos', {
      params: {
        query: query,
        per_page: 10,
        page: randomPage,
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

    // Wybierz losowe 5 zdjęć z wyników
    const shuffled = photos.sort(() => 0.5 - Math.random());
    const selectedPhotos = shuffled.slice(0, 5);

    // Pobierz URL-e zdjęć w odpowiednim rozmiarze z unikalnym parametrem
    const photoUrls = selectedPhotos.map((photo, index) => {
      const uniqueParam = `&sig=${Date.now()}_${index}`;
      return `${photo.urls.raw}&w=800&h=600&fit=crop${uniqueParam}`;
    });

    console.log('[CONTENT] Pobrano zdjęcia (strona ${randomPage}):', photoUrls.length);
    return photoUrls;
  } catch (error) {
    console.error('[CONTENT] Błąd Unsplash:', error.response?.data?.errors?.[0] || error.message);
    return getFallbackPhotos();
  }
}

/**
 * Rozpoznaje kraj na podstawie miasta używając OpenAI
 * @param {string} miasto - Nazwa miasta
 * @returns {Promise<string>} - Nazwa kraju
 */
async function getCountryFromCity(miasto) {
  if (!OPENAI_API_KEY) {
    console.warn('[CONTENT] Brak klucza OpenAI, nie mogę rozpoznać kraju');
    return null;
  }

  const prompt = `Podaj nazwę kraju, w którym znajduje się miasto: ${miasto}

Zasady:
- Zwróć TYLKO nazwę kraju, bez dodatkowego tekstu
- Użyj polskiej nazwy kraju (np. "Włochy", nie "Italy")
- Jeśli miasto to postać (np. "Londyn"), zwróć "Wielka Brytania"
- Jeśli to wyspa (np. "Kreta", "Korfu"), zwróć odpowiedni kraj (np. "Grecja")

Przykłady:
- Zurich → Szwajcaria
- Rzym → Włochy
- Kreta → Grecja
- Dubaj → Emiraty Arabskie
- Paryż → Francja`;

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Jesteś ekspertem od geografii. Zwracasz tylko nazwę kraju po polsku, bez dodatkowego tekstu.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 50,
        temperature: 0.1,
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const kraj = response.data.choices[0].message.content.trim();
    console.log(`[CONTENT] Rozpoznano kraj dla ${miasto}: ${kraj}`);
    return kraj;
  } catch (error) {
    console.error('[CONTENT] Błąd OpenAI (kraj):', error.response?.data?.error?.message || error.message);
    return null;
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
  getCountryFromCity,
};