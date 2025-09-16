// Unit tests for the IndexedDB wrapper (no UI).
import IDBWrapper from '../idb';

const RATES = { USD: 1, GBP: 1.8, EURO: 0.7, ILS: 3.4 };

// Utility: delete the database before each test to start clean.
function deleteDB(name = 'costsdb') {
  return new Promise((resolve) => {
    const req = indexedDB.deleteDatabase(name);
    req.onsuccess = req.onerror = req.onblocked = () => resolve();
  });
}

beforeEach(async () => {
  await deleteDB();
  // Mock fetch() to return the required rates JSON.
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve(RATES) })
  );
});

afterEach(() => {
  jest.resetAllMocks();
});

test('addCost + getCostsByMonthYear + getReport (USD)', async () => {
  const db = new IDBWrapper('costsdb', 1);

  // Insert: 200 USD and 100 GBP.
  await db.addCost({ sum: 200, currency: 'USD', category: 'Food', description: 'pizza' });
  await db.addCost({ sum: 100, currency: 'GBP', category: 'Education', description: 'Zoom' });

  const now = new Date();
  const list = await db.getCostsByMonthYear(now.getFullYear(), now.getMonth() + 1);
  expect(list).toHaveLength(2);

  const report = await db.getReport(now.getFullYear(), now.getMonth() + 1, 'USD');

  // Conversion rule used by your app:
  // USD value = amount / rate[from]; then * rate[target].
  // For 100 GBP with GBP=1.8, USD = 100 / 1.8 = 55.56.
  const expectedTotal = Number((200 + 100 / 1.8).toFixed(2));
  expect(report.total.total).toBe(expectedTotal);
  expect(report.total.currency).toBe('USD');

  // Items remain in their original currency.
  expect(report.costs.some(c => c.currency === 'USD')).toBe(true);
  expect(report.costs.some(c => c.currency === 'GBP')).toBe(true);
});
