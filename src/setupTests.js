// 1) Extend Jest with DOM matchers (RTL)
import '@testing-library/jest-dom';

// 2) Fetch polyfill for JSDOM
import 'whatwg-fetch';

// 3) Polyfill for structuredClone (required by fake-indexeddb)
if (typeof global.structuredClone !== 'function') {
  global.structuredClone = (val) =>
    val === undefined ? val : JSON.parse(JSON.stringify(val));
}

// 4) Fake IndexedDB — automatically defines indexedDB on globalThis
import 'fake-indexeddb/auto';

// 5) Minimal localStorage mock (if missing)
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

// 6) Default URL for exchange rates (tests can still mock fetch as needed)
localStorage.setItem('exchangeRatesUrl', 'https://example.com/rates.json');

// 7) Silence window.alert in JSDOM
if (typeof window !== 'undefined') {
  if (typeof window.alert !== 'function') {
    window.alert = () => { };
  } else {
    jest.spyOn(window, 'alert').mockImplementation(() => { });
  }
}
