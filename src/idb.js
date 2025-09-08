// src/idb.js
/**
 * IndexedDB wrapper class (React modules version).
 * - addCost() attaches the add-date automatically (spec: Date:{day} + internal _ts ISO).
 * - getCostsByMonthYear(year, month) fetches items per calendar month/year.
 * - getReport(year, month, currency) returns the exact report object per spec,
 *   computing total in the selected currency using remote exchange rates.
 */

export default class IDBWrapper {
  /**
   * @param {string} dbName
   * @param {number} version
   */
  constructor(dbName, version) {
    this.dbName = dbName;
    this.version = version;
    this.storeName = 'costs';
    this.dbPromise = this.initDB();
  }

  /**
   * Open (and upgrade) the database.
   * @returns {Promise<IDBDatabase>}
   */
  async initDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.dbName, this.version);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
        }
      };
      req.onsuccess = (e) => resolve(e.target.result);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  /**
   * Add a new cost; attaches add-date automatically.
   * @param {{sum:number, currency:string, category:string, description:string}} cost
   * @returns {Promise<Object>} newly added cost object
   */
  async addCost(cost) {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);

      const now = new Date();
      const item = {
        sum: Number(cost?.sum) || 0,
        currency: String(cost?.currency || 'USD').toUpperCase(),
        category: String(cost?.category || ''),
        description: String(cost?.description || ''),
        // per spec:
        Date: { day: now.getDate() },
        // internal timestamp (ISO) for accurate year/month filtering:
        _ts: now.toISOString()
      };

      const r = store.add(item);
      r.onsuccess = () => resolve(item);
      r.onerror = () => reject(r.error);
    });
  }

  /**
   * Legacy helper: get costs by month only (1-12).
   * @param {number} month
   * @returns {Promise<Array>}
   */
  async getCostsByMonth(month) {
    const db = await this.dbPromise;
    const m = Number(month);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const out = [];

      store.openCursor().onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          const v = cursor.value;
          const d = v._ts ? new Date(v._ts) : (v.date ? new Date(v.date) : null);
          if (d && d.getMonth() + 1 === m) out.push(v);
          cursor.continue();
        } else {
          resolve(out);
        }
      };
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Get costs by year and month.
   * Accepts (year, month). If called (month, year), auto-swaps for backward compatibility.
   * @param {number} year
   * @param {number} month
   * @returns {Promise<Array>}
   */
  async getCostsByMonthYear(year, month) {
    let y = Number(year);
    let m = Number(month);
    // Swap if the arguments look reversed: (month, year)
    if (y >= 1 && y <= 12 && m > 31) [y, m] = [m, y];

    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const out = [];

      store.openCursor().onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          const v = cursor.value;
          const d = v._ts ? new Date(v._ts) : (v.date ? new Date(v.date) : null);
          if (d && d.getFullYear() === y && d.getMonth() + 1 === m) {
            out.push(v);
          }
          cursor.continue();
        } else {
          resolve(out);
        }
      };
      tx.onerror = () => reject(tx.error);
    });
  }

  // ---------------- currency helpers (private) ----------------

  async fetchRatesFromSettings_() {
    const url = localStorage.getItem('exchangeRatesUrl') || '';
    if (!url) throw new Error('Exchange rates URL is not configured.');
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch rates. HTTP ${res.status}`);
    const data = await res.json();
    const required = ['USD', 'GBP', 'EURO', 'ILS'];
    for (const k of required) {
      if (typeof data[k] !== 'number' || Number.isNaN(data[k])) {
        throw new Error(`Invalid rates JSON shape. Missing/invalid ${k}`);
      }
    }
    return data;
  }

  convert_(amount, from, to, rates) {
    const f = String(from || 'USD').toUpperCase();
    const t = String(to || 'USD').toUpperCase();
    if (f === t) return amount;
    // All rates are relative to USD = 1 (per spec)
    const usd = amount / rates[f];
    return usd * rates[t];
  }

  /**
   * Build the monthly report per spec.
   * @param {number} year
   * @param {number} month
   * @param {string} currency - "USD" | "GBP" | "EURO" | "ILS"
   * @returns {Promise<{year:number, month:number, costs:Array, total:{currency:string,total:number}}>}
   */
  async getReport(year, month, currency) {
    const y = Number(year);
    const m = Number(month);
    const target = String(currency || 'USD').toUpperCase();

    const list = await this.getCostsByMonthYear(y, m);
    const rates = await this.fetchRatesFromSettings_();

    let totalInTarget = 0;

    // Keep each cost item as originally saved (currency stays original),
    // but compute total in the selected currency (per the example in the spec).
    const costs = list.map((c) => {
      const amount = Number(c.sum) || 0;
      const day = c?.Date?.day ?? (c._ts ? new Date(c._ts).getDate() : new Date().getDate());
      const origCur = String(c.currency || 'USD').toUpperCase();
      totalInTarget += this.convert_(amount, origCur, target, rates);
      return {
        sum: amount,
        currency: origCur,
        category: String(c.category || ''),
        description: String(c.description || ''),
        Date: { day }
      };
    });

    return {
      year: y,
      month: m,
      costs,
      total: { currency: target, total: Number(totalInTarget.toFixed(2)) }
    };
  }

  // ---------------- maintenance helpers ----------------

  async clearData() {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      tx.objectStore(this.storeName).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async updateCost(cost) {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      tx.objectStore(this.storeName).put(cost);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async deleteCost(id) {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      tx.objectStore(this.storeName).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}
