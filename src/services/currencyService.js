// src/services/currencyService.js
import { getExchangeRatesUrl } from './settings';

const DEFAULT_RATES_URL =
  '/rates.json';

const EXTERNAL_RATES_URL =
  'https://gist.githubusercontent.com/ShirlyAvrahamoff/31522888d5fb081ad27734650d888959/raw/e9960bb7be1ca27bcc8982893346ce306da0cd9f/rates.json';

/**
 * Fetch exchange rates JSON from the configured URL.
 * Expected shape: { USD: 1, GBP: 1.8, EURO: 0.7, ILS: 3.4 }
 * The values are “units per 1 USD”.
 * Falls back to /rates.json, then to the external gist, ואז לערכי ברירת מחדל.
 */
export async function fetchExchangeRates() {
  let url = getExchangeRatesUrl();
  // נקה מרכאות שנשמרו בטעות
  if (typeof url === 'string') {
    url = url.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1').trim();
  }
  if (!url) url = DEFAULT_RATES_URL;

  // Helper קטן
  const tryFetch = async (u) => {
    const res = await fetch(u, { method: 'GET', cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    validateRatesShape(data);
    return data;
  };

  // נסה: URL נוכחי → לוקאלי → gist → דיפולט קשיח
  try {
    return await tryFetch(url);
  } catch (e1) {
    // לוקאלי
    if (url !== DEFAULT_RATES_URL) {
      try {
        return await tryFetch(DEFAULT_RATES_URL);
      } catch {}
    }
    // gist חיצוני
    try {
      return await tryFetch(EXTERNAL_RATES_URL);
    } catch {}
    // דיפולט קשיח
    return { USD: 1, GBP: 1.8, EURO: 0.7, ILS: 3.4 };
  }
}

/**
 * Convert amount between currencies using the given rates.
 * Rates are “units per 1 USD”, so:
 *   amount_in_usd = amount / rates[from]
 *   amount_in_to  = amount_in_usd * rates[to]
 */
export function convert(amount, from, to, rates) {
  const a = Number(amount) || 0;
  const f = String(from || 'USD').toUpperCase();
  const t = String(to || 'USD').toUpperCase();
  const rf = rates?.[f];
  const rt = rates?.[t];
  if (!rf || !rt) return 0;
  const inUSD = a / rf;
  return Number((inUSD * rt).toFixed(2));
}

function validateRatesShape(r) {
  const required = ['USD', 'GBP', 'EURO', 'ILS'];
  for (const k of required) {
    if (typeof r?.[k] !== 'number' || Number.isNaN(r[k])) {
      throw new Error(`Invalid rates shape: missing/invalid ${k}`);
    }
  }
}
