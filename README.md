# 📊 Cost Manager – Front-End

A single-page **expense tracker** built with **React** and **MUI**, storing data locally via **IndexedDB**.  
Users can add expenses, view monthly reports, and see visual insights with charts. 
The app fetches **exchange rates** from a configurable URL in **Settings**.

> **Main currency:** USD  
> **UI language:** English

---

## ✨ Features

- **Add Cost** – record amount, currency, category, description (date auto-set to now).
- **Monthly Report** – detailed list for a selected month & year, with totals and (optional) original amounts.
- **Category Chart (Pie)** – category distribution per month & year.
- **Yearly Chart (Bar)** – total expenses per month across a selected year.
- **Currency Switching** – USD / ILS / GBP / EURO (converted via remote JSON).
- **Settings** – configure an **Exchange Rates URL** (persisted in `localStorage`).
- **IndexedDB storage** – persistent, client-side database with a Promise-based wrapper.
- **Unit Tests** – Jest + Testing Library (mocked IndexedDB & fetch).

---

## 🗄 Data Storage (IndexedDB)

- **Database name:** `costsdb`  
- **DB version:** (opened with `openCostsDB("costsdb", 1)`)  
- **Object store:** `costs`  
- **Index:** by year & month (e.g., `["year","month"]`) for fast monthly queries  
- **Stored fields (per cost):**  
  - `sum:number`  
  - `currency:"USD"|"ILS"|"GBP"|"EURO"`  
  - `category:string` *(UI provides a dropdown; see Categories below)*  
  - `description:string`  
  - `Date:{ day:number }` *(for the vanilla spec)*  
  - plus internal fields used for reporting (`year`, `month`, `day`, timestamp)

> If you previously opened a higher DB version locally, delete the old DB in Chrome DevTools → **Application** → **IndexedDB** → **costsdb** → *Delete database*, then hard-reload.

---

## 💱 Exchange Rates

Supported currency tokens (per spec): **USD**, **ILS**, **GBP**, **EURO**  
The app fetches a JSON of the form:

```json
{ "USD": 1, "GBP": 1.8, "EURO": 0.7, "ILS": 3.4 }
```

- The URL is configurable in **Settings** and persisted in `localStorage`.
- Conversion model: *units per USD* (same convention used by the vanilla `idb.js`).

---

## 🖼 Screenshots

Screenshots live under `/Screenshots`.

### Add Cost
<img src="screenshots\add_cost.png" width="600"/>

### Category Chart
<img src="screenshots\pie.png" width="600"/>

### Monthly Report
<img src="screenshots\monthly_report.png" width="600"/>

### Edit Expense
<img src="screenshots\edit_cost.png" width="600"/>

### Yearly Chart
<img src="screenshots\bar_chart.png" width="600"/>

### Settings
<img src="screenshots\setting.png" width="600"/>

---

## 🏗 Tech Stack

- **React 18**
- **MUI (Material UI)**
- **Recharts**
- **IndexedDB**
- **Jest + Testing Library**
- **Babel & Webpack**

---

## 📂 Project Structure

```plaintext
client-side final/
├─ public/
│  ├─ index.html
│  └─ rates.json
├─ src/
│  ├─ components/
│  │  ├─ add_cost_form.jsx
│  │  ├─ category_pie_chart.jsx
│  │  ├─ monthly_report.jsx
│  │  ├─ edit_expense_form.jsx
│  │  ├─ yearly_bar_chart.jsx
│  │  └─ sidebar.jsx
│  ├─ services/
│  │  ├─ currency_service.js
│  │  └─ settings.js
│  ├─ __tests__/             
│  ├─ __mocks__/              
│  ├─ idb.js                  
│  ├─ app.jsx
│  ├─ index.js
│  └─ setupTests.js
├─ screenshots/
│  ├─ add_cost.png
│  ├─ bar_chart.png
│  ├─ monthly_report.png
│  ├─ edit_cost.png
│  ├─ pie.png
│  └─ settings.png
├─ babel.config.js
├─ jest.config.js
├─ webpack.config.js
└─ package.json
```

---

## 🧪 Testing

**Test environment bootstrap:** `src/setupTests.js`  
Includes:
- `@testing-library/jest-dom`
- `fake-indexeddb` (to emulate IndexedDB in tests)
- `whatwg-fetch` (stub for `fetch`)
- minimal `localStorage` mock (if needed)

**Example suites (file names align with lowercase/underscore convention):**
- `__tests__/idb.wrapper.test.js`
- `__tests__/add_cost_form.test.jsx`
- `__tests__/yearly_bar_chart.test.jsx`

---

## ✅ Spec & Style Compliance

- **DB:** IndexedDB, **version 1**, store `costs`, index by `[year,month]`.
- **Currencies:** tokens are **USD**, **ILS**, **GBP**, **EURO** (exact strings).
- **Vanilla library:** exposes global `idb` and returns Promises.
- **UI:** React + MUI (desktop browsers).
- **Code style:** follows the provided guide (semicolons, camelCase for functions/vars, PascalCase for classes, no wrapper objects, no named functions inside blocks, etc.).
- **Categories:** controlled dropdown in UI; library accepts any non-empty string.

---
