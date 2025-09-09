// src/services/currencyService.js
import { getExchangeRatesUrl } from './settings';

/**
 * Fetch exchange rates JSON from the configured URL.
 * Expected shape: { USD: 1, GBP: 1.8, EURO: 0.7, ILS: 3.4 }
 * The values are “units per 1 USD”.
 * Falls back to /rates.json for local development if no URL is configured.
 */
export async function fetchExchangeRates() {
  let url = getExchangeRatesUrl();
  if (!url) url = '/rates.json';

  const res = await fetch(url, { method: 'GET' });
  if (!res.ok) {
    // Try local fallback once if the remote URL fails
    if (url !== '/rates.json') {
      const fb = await fetch('/rates.json');
      if (fb.ok) {
        const data2 = await fb.json();
        validateRatesShape(data2);
        return data2;
      }
    }
    throw new Error(`Failed to fetch rates. HTTP ${res.status}`);
  }

  const data = await res.json();
  validateRatesShape(data);
  return data;
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
