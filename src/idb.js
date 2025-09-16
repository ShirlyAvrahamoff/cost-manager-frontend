// src/idb.js
// -----------------------------------------------------------------------------
// IDBWrapper (React modules version)
// Responsibilities:
//   • Open/upgrade the 'costsdb' IndexedDB (v1) with store 'costs' + index 'ym' (year, month)
//   • Provide CRUD-ish API: addCost, updateCost, deleteCost, getCostsByMonthYear, getReport, clearData
//   • Handle VersionError fallback if a higher version was previously opened locally
//   • Convert totals using units-per-USD rates fetched from a configurable URL (fallback to defaults)
// Data semantics (per spec):
//   • The date attached to a cost is the insertion date (now). We persist Date.day and internal year/month/day/_ts.
// Notes:
//   • Promises are returned for all async operations (spec requirement).
//   • This file adds comments only. No changes to code or behavior.
// -----------------------------------------------------------------------------

export default class IDBWrapper {
  /**
   * Construct a new wrapper instance.
   * @param {string} dbName - Database name (default: 'costsdb')
   * @param {number} version - Database version (default: 1)
   */
  constructor(dbName = 'costsdb', version = 1) {
    this.dbName = dbName;
    this.version = version;
    this.storeName = 'costs';
    this.ALLOWED = ['USD', 'ILS', 'GBP', 'EURO'];
    this.DEFAULT_RATES = { USD: 1, GBP: 1.8, EURO: 0.7, ILS: 3.4 };
    this.dbPromise = this.initDB(); // Lazy-open once; reuse for all calls
  }

  // ---------- open / upgrade with VersionError fallback ----------

  /**
   * Open the DB and create/upgrade schema as needed.
   * Ensures object store 'costs' and index 'ym' exist.
   * Also backfills missing date fields for existing records during upgrade.
   *
   * @returns {Promise<IDBDatabase>}
   */
  initDB() {
    return new Promise((resolve, reject) => {
      const openWithDesired = () => {
        const req = indexedDB.open(this.dbName, this.version);

        // Create schema or ensure index presence; backfill date fields if needed.
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          let store;
          if (!db.objectStoreNames.contains(this.storeName)) {
            store = db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
          } else {
            store = e.target.transaction.objectStore(this.storeName);
          }
          if (!store.indexNames.contains('ym')) {
            store.createIndex('ym', ['year', 'month'], { unique: false });
          }

          // Backfill: ensure (year, month, day, Date.day) exist for old data
          const curReq = store.openCursor();
          curReq.onsuccess = (ev) => {
            const cur = ev.target.result;
            if (!cur) return;
            const v = cur.value;
            let changed = false;
            const d = v._ts ? new Date(v._ts) : new Date();
            if (typeof v.year !== 'number') { v.year = d.getFullYear(); changed = true; }
            if (typeof v.month !== 'number') { v.month = d.getMonth() + 1; changed = true; }
            if (typeof v.day !== 'number') { v.day = d.getDate(); changed = true; }
            if (!v.Date || typeof v.Date.day !== 'number') { v.Date = { day: v.day }; changed = true; }
            if (changed) cur.update(v);
            cur.continue();
          };
        };

        req.onsuccess = (e) => resolve(e.target.result);

        // If a higher version exists locally, open without version to avoid VersionError.
        req.onerror = (e) => {
          const err = e.target.error;
          if ((err && err.name === 'VersionError') ||
              String(err || '').includes('The requested version')) {
            const r2 = indexedDB.open(this.dbName); 
            r2.onsuccess = (ev) => resolve(ev.target.result);
            r2.onerror = (ev) => reject(ev.target.error);
          } else {
            reject(err);
          }
        };
      };

      openWithDesired();
    });
  }

  // ---------- helpers ----------

  /**
   * Fetch exchange rates from localStorage-configured URL.
   * Falls back to DEFAULT_RATES on error/invalid shape.
   * @returns {Promise<Record<string, number>>}
   */
  async fetchRates_() {
    try {
      const url = localStorage.getItem('exchangeRatesUrl') || '';
      if (!url) return this.DEFAULT_RATES;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch rates');
      const data = await res.json();
      for (const k of this.ALLOWED) {
        if (typeof data[k] !== 'number' || Number.isNaN(data[k]) || data[k] <= 0) {
          throw new Error(`Invalid rate for ${k}`);
        }
      }
      return data;
    } catch {
      return this.DEFAULT_RATES;
    }
  }

  /**
   * Convert using "units per USD" model.
   * @param {number|string} amount
   * @param {string} from
   * @param {string} to
   * @param {Record<string, number>} rates
   * @returns {number}
   */
  convert_(amount, from, to, rates) {
    const f = String(from || 'USD').toUpperCase();
    const t = String(to || 'USD').toUpperCase();
    if (f === t) return Number(amount) || 0;
    const rf = rates[f] ?? 1; // units of FROM per 1 USD
    const rt = rates[t] ?? 1; // units of TO per 1 USD
    const usd = (Number(amount) || 0) / rf;
    return usd * rt;
  }

  /**
   * Validate incoming cost structure before inserts.
   * Throws on invalid input.
   * @param {any} cost
   * @returns {void}
   */
  validate_(cost) {
    if (typeof cost !== 'object' || cost === null) throw new Error('Invalid cost object.');
    if (typeof cost.sum !== 'number' || Number.isNaN(cost.sum) || cost.sum <= 0) throw new Error('sum must be > 0');
    const cur = String(cost.currency || '').toUpperCase();
    if (!this.ALLOWED.includes(cur)) throw new Error('currency must be USD/ILS/GBP/EURO');
    if (!String(cost.category || '').trim()) throw new Error('category required');
    if (!String(cost.description || '').trim()) throw new Error('description required');
  }

  // ---------- public API ----------

  /**
   * Add a new cost item with insertion date (now).
   * Returns only the public fields per spec.
   *
   * @param {{sum:number,currency:string,category:string,description:string}} cost
   * @returns {Promise<{sum:number,currency:string,category:string,description:string}>}
   */
  async addCost(cost) {
    this.validate_(cost);
    const db = await this.dbPromise;
    const now = new Date();

    const record = {
      sum: Number(cost.sum),
      currency: String(cost.currency).toUpperCase(),
      category: String(cost.category),
      description: String(cost.description),
      Date: { day: now.getDate() }, // Spec-visible date (day only)
      _ts: now.toISOString(),       // Internal ISO timestamp
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate()
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const r = store.add(record);
      r.onsuccess = () => resolve({
        sum: record.sum, currency: record.currency, category: record.category, description: record.description
      });
      r.onerror = () => reject(r.error);
    });
  }

  /**
   * Update an existing cost item by id. Allows updating: sum/category/description/currency/date.
   * When 'date' is provided, internal date fields are kept coherent (year/month/day/_ts/Date.day).
   *
   * @param {{id:number,sum?:number,category?:string,description?:string,currency?:string,date?:Date|string}} partial
   * @returns {Promise<void>}
   */
  async updateCost(partial) {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const getReq = store.get(partial.id);
      getReq.onsuccess = () => {
        const cur = getReq.result;
        if (!cur) return reject(new Error('Expense not found'));
        const out = { ...cur };
        if (partial.sum !== null && partial.sum !== undefined) out.sum = Number(partial.sum);
        if (partial.category !== null && partial.category !== undefined) out.category = String(partial.category);
        if (partial.description !== null && partial.description !== undefined) out.description = String(partial.description);
        if (partial.currency) out.currency = String(partial.currency).toUpperCase();

        if (partial.date) {
          const d = (partial.date instanceof Date) ? partial.date : new Date(partial.date);
          if (!Number.isNaN(d.getTime())) {
            out._ts = d.toISOString();
            out.year = d.getFullYear();
            out.month = d.getMonth() + 1;
            out.day = d.getDate();
            out.Date = { day: out.day };
          }
        }

        const putReq = store.put(out);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  /**
   * Delete a cost by id.
   * @param {number} id
   * @returns {Promise<void>}
   */
  async deleteCost(id) {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const r = tx.objectStore(this.storeName).delete(id);
      r.onsuccess = () => resolve();
      r.onerror = () => reject(r.error);
    });
  }

  /**
   * Get all costs for a given (year, month).
   * The method tolerates swapped parameters (month, year) and fixes them heuristically.
   * Falls back to cursor scan when index 'ym' is absent.
   *
   * @param {number} year
   * @param {number} month
   * @returns {Promise<Array<any>>}
   */
  async getCostsByMonthYear(year, month) {
    let y = Number(year), m = Number(month);
    // Heuristic swap: (month<=12) & (year>31) → interpret as (year, month)
    if (y >= 1 && y <= 12 && m > 31) [y, m] = [m, y]; 
    const db = await this.dbPromise;

    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);

      let idx;
      try { idx = store.index('ym'); } catch (_e) { idx = null; }

      // No index? Fallback to full scan using _ts fields.
      if (!idx) {
        const out = [];
        store.openCursor().onsuccess = (e) => {
          const c = e.target.result;
          if (!c) return resolve(out);
          const v = c.value;
          const d = v._ts ? new Date(v._ts) : null;
          if (d && d.getFullYear() === y && (d.getMonth() + 1) === m) out.push(v);
          c.continue();
        };
        tx.onerror = () => reject(tx.error);
        return;
      }

      // Fast path: query by compound index [year, month]
      const out = [];
      const req = idx.openCursor(IDBKeyRange.only([y, m]));
      req.onsuccess = (e) => {
        const c = e.target.result;
        if (!c) return resolve(out);
        out.push(c.value);
        c.continue();
      };
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Build a detailed report per (year, month) converted into the target currency.
   * @param {number} year
   * @param {number} month
   * @param {'USD'|'ILS'|'GBP'|'EURO'} currency
   * @returns {Promise<{year:number, month:number, costs:Array, total:{currency:string,total:number}}>}
   */
  async getReport(year, month, currency) {
    const y = Number(year), m = Number(month);
    const target = String(currency || 'USD').toUpperCase();
    if (!this.ALLOWED.includes(target)) throw new Error('currency must be USD/ILS/GBP/EURO');

    const [rows, rates] = await Promise.all([
      this.getCostsByMonthYear(y, m),
      this.fetchRates_()
    ]);

    let total = 0;
    const costs = rows.map((r) => {
      const sum = Number(r.sum) || 0;
      const cur = String(r.currency || 'USD').toUpperCase();
      total += this.convert_(sum, cur, target, rates);
      return {
        sum,
        currency: cur,
        category: String(r.category || ''),
        description: String(r.description || ''),
        Date: { day: r?.Date?.day ?? r.day ?? 1 }
      };
    });

    return { year: y, month: m, costs, total: { currency: target, total: Number(total.toFixed(2)) } };
  }

  /**
   * Clear all data from the object store.
   * @returns {Promise<void>}
   */
  async clearData() {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      tx.objectStore(this.storeName).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}
