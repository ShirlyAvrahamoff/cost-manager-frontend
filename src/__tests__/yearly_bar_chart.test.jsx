// UI smoke test for the Yearly bar chart.
// We mock IDBWrapper and the currency service using factory-style mocks
// to avoid referencing out-of-scope variables inside jest.mock.

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

// Mock IDBWrapper: resolve a simple total for each month.
jest.mock('../idb', () => {
  const mockGetReport = jest.fn((year, month, currency) =>
    Promise.resolve({
      total: { total: month * 10, currency },
      costs: [],
    })
  );
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      getReport: mockGetReport,
    })),
    mockGetReport,
  };
});

// Mock currency service: identity conversion.
jest.mock('../services/currency_service', () => ({
  __esModule: true,
  fetchExchangeRates: jest.fn().mockResolvedValue({
    USD: 1,
    GBP: 1.8,
    EURO: 0.7,
    ILS: 3.4,
  }),
  convert: (amount) => amount,
}));

import YearlyBarChart from '../components/yearly_bar_chart';
import { mockGetReport } from '../idb';

beforeEach(() => {
  mockGetReport.mockClear();
});

test('loads data for all 12 months and renders header + selectors', async () => {
  render(<YearlyBarChart />);

  // Header appears
  expect(await screen.findByText(/Totals by Month/i)).toBeInTheDocument();

  // The component should call getReport for 12 months
  await waitFor(() => {
    expect(mockGetReport).toHaveBeenCalledTimes(12);
  });

  // Use role-based queries instead of label text since MUI label association can vary.
  const combos = screen.getAllByRole('combobox');
  expect(combos.length).toBeGreaterThanOrEqual(2);

  // Basic sanity: first looks like a year, second shows a currency.
  // (Order is not guaranteed, so just check both contain plausible values.)
  expect(combos.some(el => /\b20\d{2}\b/.test(el.textContent || ''))).toBe(true);
  expect(combos.some(el => /(USD|EUR|GBP|ILS)/i.test(el.textContent || ''))).toBe(true);
});
