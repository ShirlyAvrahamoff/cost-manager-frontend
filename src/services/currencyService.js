// src/services/currencyService.js
import { getExchangeRatesUrl } from './settings';

/**
 * Fetches exchange rates JSON from the configured URL.
 * Expected shape: { "USD": 1, "GBP": 1.8, "EURO": 0.7, "ILS": 3.4 }
 */
export async function fetchExchangeRates() {
    const url = getExchangeRatesUrl();
    if (!url) {
        throw new Error('Exchange rates URL is not configured.');
    }

    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) {
        throw new Error(`Failed to fetch rates. HTTP ${res.status}`);
    }

    const data = await res.json();
    validateRatesShape(data);
    return data;
}

/**
 * Converts amount from source currency to target currency using the given rates.
 * All rates are relative to USD = 1.
 */
export function convert(amount, from, to, rates) {
  if (!amount) return 0;
  const f = String(from || 'USD').toUpperCase();
  const t = String(to || 'USD').toUpperCase();
  // rates = {"USD":1, "ILS":3.4, "GBP":1.8, "EURO":0.7}
  const inUSD = amount / (rates?.[f] || 1);
  return Number((inUSD * (rates?.[t] || 1)).toFixed(2));
}


function norm(k) {
    return String(k || '').toUpperCase().trim();
}

function validateRatesShape(r) {
    const required = ['USD', 'GBP', 'EURO', 'ILS'];
    for (const key of required) {
        if (typeof r[key] !== 'number' || Number.isNaN(r[key])) {
            throw new Error(`Invalid rates shape: missing/invalid ${key}`);
        }
    }
}
