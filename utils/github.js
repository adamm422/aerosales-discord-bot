/**
 * Integracja z GitHub API do zarządzania plikiem ofert
 */

const axios = require('axios');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';
const OFFERS_FILE_PATH = process.env.OFFERS_FILE_PATH || 'src/data/oferty.json';

/**
 * Pobiera aktualną zawartość pliku ofert z GitHub
 * @returns {Promise<object>} - { content: Array, sha: string }
 */
async function getOffersFile() {
  try {
    const response = await axios.get(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${OFFERS_FILE_PATH}?ref=${GITHUB_BRANCH}`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    // Dekoduj zawartość z base64
    const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
    const offers = JSON.parse(content);

    return {
      content: offers,
      sha: response.data.sha,
    };
  } catch (error) {
    console.error('Error fetching offers file:', error.message);
    
    if (error.response?.status === 404) {
      throw new Error('Plik ofert nie został znaleziony w repozytorium');
    }
    
    if (error.response?.status === 401) {
      throw new Error('Brak autoryzacji do GitHub API - sprawdź token');
    }

    throw new Error(`Błąd pobierania pliku: ${error.message}`);
  }
}

/**
 * Zapisuje zaktualizowaną listę ofert do GitHub
 * @param {Array} offers - Lista ofert
 * @param {string} sha - SHA aktualnego pliku
 * @param {string} message - Message commita
 * @returns {Promise<object>} - Odpowiedź z GitHub
 */
async function saveOffersFile(offers, sha, message) {
  try {
    // Konwertuj oferty na JSON z wcięciami
    const content = JSON.stringify(offers, null, 2);
    
    // Zakoduj do base64
    const contentBase64 = Buffer.from(content).toString('base64');

    const response = await axios.put(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${OFFERS_FILE_PATH}`,
      {
        message: message || `Aktualizacja ofert - ${new Date().toISOString()}`,
        content: contentBase64,
        sha: sha,
        branch: GITHUB_BRANCH,
      },
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error saving offers file:', error.message);
    
    if (error.response?.status === 409) {
      throw new Error('Konflikt - plik został zmodyfikowany przez kogoś innego. Spróbuj ponownie.');
    }
    
    if (error.response?.status === 422) {
      throw new Error('Nieprawidłowe dane - sprawdź format ofert');
    }

    throw new Error(`Błąd zapisywania pliku: ${error.message}`);
  }
}

/**
 * Dodaje nową ofertę do repozytorium
 * @param {object} newOffer - Nowa oferta
 * @returns {Promise<object>} - { success: boolean, offer: object, commit: object, error: string|null }
 */
async function addOffer(newOffer) {
  try {
    // Pobierz aktualne oferty
    const { content: offers, sha } = await getOffersFile();

    // Sprawdź czy oferta już istnieje (np. taki sam lot w tym samym terminie)
    const exists = offers.some(o => 
      o.miasto === newOffer.miasto && 
      o.dataWylotu === newOffer.dataWylotu &&
      o.dataPowrotu === newOffer.dataPowrotu
    );

    if (exists) {
      return {
        success: false,
        offer: null,
        commit: null,
        error: 'Oferta o podanych parametrach już istnieje',
      };
    }

    // Dodaj nową ofertę
    offers.push(newOffer);

    // Zapisz do GitHub
    const commitMessage = `Dodano ofertę: ${newOffer.miasto} (${newOffer.kraj}) - ${newOffer.cena}`;
    const commit = await saveOffersFile(offers, sha, commitMessage);

    return {
      success: true,
      offer: newOffer,
      commit: {
        sha: commit.commit.sha,
        message: commit.commit.message,
        url: commit.commit.html_url,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error adding offer:', error);
    return {
      success: false,
      offer: null,
      commit: null,
      error: error.message,
    };
  }
}

/**
 * Pobiera listę wszystkich ofert
 * @returns {Promise<Array>} - Lista ofert
 */
async function getAllOffers() {
  try {
    const { content: offers } = await getOffersFile();
    return offers;
  } catch (error) {
    console.error('Error getting offers:', error);
    throw error;
  }
}

/**
 * Usuwa ofertę po ID
 * @param {string} offerId - ID oferty do usunięcia
 * @returns {Promise<object>} - Wynik operacji
 */
async function deleteOffer(offerId) {
  try {
    const { content: offers, sha } = await getOffersFile();
    
    const index = offers.findIndex(o => o.id === offerId);
    if (index === -1) {
      return {
        success: false,
        error: 'Oferta o podanym ID nie istnieje',
      };
    }

    const deletedOffer = offers[index];
    offers.splice(index, 1);

    const commitMessage = `Usunięto ofertę: ${deletedOffer.miasto} (${deletedOffer.kraj})`;
    const commit = await saveOffersFile(offers, sha, commitMessage);

    return {
      success: true,
      deletedOffer,
      commit: {
        sha: commit.commit.sha,
        message: commit.commit.message,
      },
    };
  } catch (error) {
    console.error('Error deleting offer:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Aktualizuje istniejącą ofertę
 * @param {string} offerId - ID oferty
 * @param {object} updates - Pola do aktualizacji
 * @returns {Promise<object>} - Wynik operacji
 */
async function updateOffer(offerId, updates) {
  try {
    const { content: offers, sha } = await getOffersFile();
    
    const index = offers.findIndex(o => o.id === offerId);
    if (index === -1) {
      return {
        success: false,
        error: 'Oferta o podanym ID nie istnieje',
      };
    }

    // Zaktualizuj ofertę
    offers[index] = { ...offers[index], ...updates };

    const commitMessage = `Zaktualizowano ofertę: ${offers[index].miasto} (${offers[index].kraj})`;
    const commit = await saveOffersFile(offers, sha, commitMessage);

    return {
      success: true,
      offer: offers[index],
      commit: {
        sha: commit.commit.sha,
        message: commit.commit.message,
      },
    };
  } catch (error) {
    console.error('Error updating offer:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = {
  getOffersFile,
  saveOffersFile,
  addOffer,
  getAllOffers,
  deleteOffer,
  updateOffer,
};