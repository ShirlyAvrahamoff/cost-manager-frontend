// src/services/currencyService.js
// -----------------------------------------------------------------------------
// Currency service — fetch & convert
// Responsibilities:
//   • Load exchange rates JSON (units-per-USD) from a configurable URL
//   • Provide a pure conversion helper that uses those rates
// Fallback order (robustness):
//   settings URL -> /rates.json (same-origin) -> external gist -> hard-coded defaults
// Notes:
//   • Rates shape per spec: { USD:1, GBP:1.8, EURO:0.7, ILS:3.4 }
//   • No mutations of inputs; convert() is pure.
// -----------------------------------------------------------------------------

import { getExchangeRatesUrl } from './settings';

const DEFAULT_RATES_URL =
  '/rates.json'; // Same-origin default (avoids CORS in dev and prod)

const EXTERNAL_RATES_URL =
  'https://gist.githubusercontent.com/ShirlyAvrahamoff/31522888d5fb081ad27734650d888959/raw/e9960bb7be1ca27bcc8982893346ce306da0cd9f/rates.json';

/**
 * Fetch exchange rates JSON from the configured URL.
 * Expected shape: { USD: 1, GBP: 1.8, EURO: 0.7, ILS: 3.4 }
 * Values are "units per 1 USD".
 * Robust fallback chain handled internally.
 *
 * @returns {Promise<Record<'USD'|'GBP'|'EURO'|'ILS', number>>}
 */
export async function fetchExchangeRates() {
  let url = getExchangeRatesUrl();
  // Normalize accidentally saved quotes around the URL, if any
  if (typeof url === 'string') {
    url = url.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1').trim();
  }
  if (!url) url = DEFAULT_RATES_URL;

  // Helper: fetch and validate (throws on invalid shape)
  const tryFetch = async (u) => {
    const res = await fetch(u, { method: 'GET', cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    validateRatesShape(data);
    return data;
  };

  // Try: current URL -> local -> external gist -> hard-coded defaults
  try {
    return await tryFetch(url);
  } catch (e1) {
    // Local fallback
    if (url !== DEFAULT_RATES_URL) {
      try {
        return await tryFetch(DEFAULT_RATES_URL);
      } catch { /* swallow and continue */ }
    }
    // External gist fallback
    try {
      return await tryFetch(EXTERNAL_RATES_URL);
    } catch { /* swallow and continue */ }
    // Final fallback: hard-coded defaults (spec examples)
    return { USD: 1, GBP: 1.8, EURO: 0.7, ILS: 3.4 };
  }
}

/**
 * Convert an amount between currencies using "units per USD" rates.
 * Model:
 *   amountInUSD = amount / rates[from]
 *   amountInTo  = amountInUSD * rates[to]
 *
 * @param {number|string} amount - Input amount to convert
 * @param {'USD'|'GBP'|'EURO'|'ILS'} from - Source currency token
 * @param {'USD'|'GBP'|'EURO'|'ILS'} to - Target currency token
 * @param {Record<string, number>} rates - Rates map (units per USD)
 * @returns {number} Converted amount rounded to 2 decimals
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

/**
 * Validate that the rates object includes all required currency keys
 * and that each value is a valid number.
 *
 * @param {unknown} r - Candidate rates object
 * @throws {Error} When a key is missing or an invalid value is detected
 * @returns {void}
 */
function validateRatesShape(r) {
  const required = ['USD', 'GBP', 'EURO', 'ILS'];
  for (const k of required) {
    if (typeof r?.[k] !== 'number' || Number.isNaN(r[k])) {
      throw new Error(`Invalid rates shape: missing/invalid ${k}`);
    }
  }
}
