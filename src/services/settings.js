// src/services/settings.js
const KEY = 'exchangeRatesUrl';

export function getExchangeRatesUrl() {
    return localStorage.getItem(KEY) || '';
}

export function setExchangeRatesUrl(url) {
    if (typeof url !== 'string') return;
    localStorage.setItem(KEY, url.trim());
}
