import axios from 'axios';

// Simple Nutritionix wrapper for server-side usage.
// Requires environment variables:
// - NUTRITIONIX_APP_ID
// - NUTRITIONIX_API_KEY
//
// Note: Do NOT commit your real keys. Use a .env file locally and a secrets manager in production.

const APP_ID = process.env.NUTRITIONIX_APP_ID;
const API_KEY = process.env.NUTRITIONIX_API_KEY;

if (!APP_ID || !API_KEY) {
  // Do not throw at import time in case the API isn't used in some environments.
  // But we expose a helper to check availability.
}

const BASE = 'https://trackapi.nutritionix.com/v2';

function ensureKeys() {
  if (!APP_ID || !API_KEY) {
    throw new Error('Nutritionix API keys not configured. Set NUTRITIONIX_APP_ID and NUTRITIONIX_API_KEY in environment.');
  }
}

async function searchInstant(query) {
  // Instant search endpoint: POST /search/instant
  ensureKeys();
  const url = `${BASE}/search/instant`;
  const res = await axios.post(url, { query }, {
    headers: {
      'x-app-id': APP_ID,
      'x-app-key': API_KEY,
      'Content-Type': 'application/json'
    }
  });
  return res.data;
}

async function naturalLanguage(query) {
  // Natural language endpoint: POST /natural/nutrients
  ensureKeys();
  const url = `${BASE}/natural/nutrients`;
  const res = await axios.post(url, { query }, {
    headers: {
      'x-app-id': APP_ID,
      'x-app-key': API_KEY,
      'Content-Type': 'application/json'
    }
  });
  return res.data;
}

async function getBrand(itemId) {
  // Nutritionix v2 doesn't expose a direct "get by id" for all item types via trackapi easily.
  // This helper shows how to call the item endpoint if you have an item id.
  ensureKeys();
  const url = `${BASE}/search/item`;
  const res = await axios.get(url, {
    params: { ndb_no: itemId },
    headers: {
      'x-app-id': APP_ID,
      'x-app-key': API_KEY
    }
  });
  return res.data;
}

export default { searchInstant, naturalLanguage, getBrand, ensureKeys };
