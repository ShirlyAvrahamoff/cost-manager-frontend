// UI test for the "Add Expense" form.
// We mock IDBWrapper so no real IndexedDB writes happen.

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Provide a factory mock for IDBWrapper and export the mock function for assertions.
jest.mock('../idb', () => {
  const mockAddCost = jest.fn().mockResolvedValue({});
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      addCost: mockAddCost,
    })),
    mockAddCost,
  };
});

// Important: import after jest.mock so the test receives the mocked exports.
import AddCostForm from '../components/AddCostForm';
import { mockAddCost } from '../idb';

beforeEach(() => {
  mockAddCost.mockClear();
  // Silence "Not implemented: window.alert" errors in JSDOM.
  window.alert = jest.fn();
});

test('fills form and calls addCost with normalized values', async () => {
  render(<AddCostForm />);

  // Type sum
  const sum = screen.getByLabelText(/Sum/i);
  await userEvent.type(sum, '123');

  // Select currency (MUI Select)
  const currency = screen.getByLabelText(/Currency/i);
  fireEvent.mouseDown(currency);
  const gbp = await screen.findByRole('option', { name: /GBP/i });
  fireEvent.click(gbp);

  // Select category (TextField-select)
  const category = screen.getByLabelText(/Category/i);
  fireEvent.mouseDown(category);
  const food = await screen.findByRole('option', { name: /Food/i });
  fireEvent.click(food);

  // Type description
  const desc = screen.getByLabelText(/Description/i);
  await userEvent.type(desc, 'abc');

  // Submit
  const btn = screen.getByRole('button', { name: /Add Expense/i });
  await userEvent.click(btn);

  expect(mockAddCost).toHaveBeenCalledTimes(1);
  expect(mockAddCost).toHaveBeenCalledWith({
    sum: 123,
    currency: 'GBP',
    category: 'Food',
    description: 'abc',
  });
});
