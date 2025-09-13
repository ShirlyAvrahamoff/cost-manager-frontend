// 1) RTL matchers
import '@testing-library/jest-dom';

// 2) fetch ל־jsdom
import 'whatwg-fetch';

// 3) polyfill ל-structuredClone (נדרש ע"י fake-indexeddb)
if (typeof global.structuredClone !== 'function') {
  global.structuredClone = (val) =>
    val === undefined ? val : JSON.parse(JSON.stringify(val));
}

// 4) Fake IndexedDB — הגדרה אוטומטית של indexedDB על globalThis
import 'fake-indexeddb/auto';

// 5) localStorage מינימלי (למקרה שחסר)
if (typeof global.localStorage === 'undefined') {
  class LocalStorageMock {
    constructor() { this.store = {}; }
    getItem(k) { return this.store[k] ?? null; }
    setItem(k, v) { this.store[k] = String(v); }
    removeItem(k) { delete this.store[k]; }
    clear() { this.store = {}; }
  }
  global.localStorage = new LocalStorageMock();
}

// 6) URL דמה לשערי מט"ח (הטסטים עדיין יכולים למקם mock ל-fetch)
localStorage.setItem('exchangeRatesUrl', 'https://example.com/rates.json');

// 7) השתקת window.alert ב־jsdom
if (typeof window !== 'undefined') {
  if (typeof window.alert !== 'function') {
    window.alert = () => {};
  } else {
    jest.spyOn(window, 'alert').mockImplementation(() => {});
  }
}
