// src/idb.js
/**
 * IndexedDB wrapper for React.
 * Vanilla version (for testing) should be provided separately.
 */

const DB_NAME = 'costsdb';
const STORE_NAME = 'costs';

export async function openCostsDB(version = 1) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, version);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function addCost(db, cost) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const date = new Date();
        const item = { ...cost, date: { day: date.getDate() } };
        const request = store.add(item);

        request.onsuccess = () => resolve(item);
        request.onerror = () => reject(request.error);
    });
}

export async function getCostsByMonthYear(db, year, month) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
            const results = request.result.filter((c) => {
                const d = new Date(c.date || Date.now());
                return d.getFullYear() === year && d.getMonth() + 1 === month;
            });
            resolve(results);
        };

        request.onerror = () => reject(request.error);
    });
}
