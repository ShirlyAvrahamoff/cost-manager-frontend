// src/components/MonthlyReport.jsx
/**
 * Component for generating and displaying monthly expense reports.
 * Provides filters (month/year/currency), search, summary, and CSV export.
 * All totals are computed in the selected currency (per spec).
 */
import React, { useState, useEffect } from 'react';
import IDBWrapper from '../idb';
import {
  Box, Typography, Select, MenuItem, Card, CardContent,
  Button, TextField, InputLabel, FormControl, InputAdornment
} from '@mui/material';
import Fuse from 'fuse.js';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { fetchExchangeRates, convert } from '../services/currencyService';

// Palette for category accents (cards and summary)
const categoryColors = {
  Food: '#4CAF50',
  Transportation: '#2196F3',
  Entertainment: '#FF9800',
  Health: '#E91E63',
  Education: '#9C27B0',
  Utilities: '#00BCD4'
};

const currencies = ['USD', 'GBP', 'EURO', 'ILS'];
const currencySymbol = (c) =>
  ({ USD: '$', GBP: '£', EURO: '€', ILS: '₪' }[String(c).toUpperCase()] || '');

const MonthlyReport = () => {
  // Filters
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [currency, setCurrency] = useState('USD');

  // Data
  const [reportData, setReportData] = useState([]);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [rates, setRates] = useState(null);

  // Totals (in selected currency)
  const [totalConverted, setTotalConverted] = useState(0);
  const [totalsByCategoryConverted, setTotalsByCategoryConverted] = useState({});

  // Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredData, setFilteredData] = useState([]);

  /**
   * Normalize a cost's date:
   * - prefer _ts (ISO string)
   * - fallback to cost.date
   * - fallback to Date.day with the selected month/year
   */
  const normalizeCostDate = (cost) => {
    if (cost?._ts) {
      const d = new Date(cost._ts);
      if (!Number.isNaN(d.getTime())) return d;
    }
    if (cost?.date) {
      const d = new Date(cost.date);
      if (!Number.isNaN(d.getTime())) return d;
    }
    const day = Number(cost?.Date?.day);
    if (day) return new Date(selectedYear, selectedMonth - 1, day);
    return null;
  };

  /**
   * Load expenses for the selected month/year and compute:
   * - total in selected currency
   * - per-category totals in selected currency
   * - per-category counts
   */
  useEffect(() => {
    const fetchReportData = async () => {
      const idb = new IDBWrapper('CostManagerDB', 1);

      // NOTE: wrapper here expects (month, year). Keep as-is for this project.
      const costs = await idb.getCostsByMonthYear(selectedMonth, selectedYear);
      setReportData(costs);

      const counts = costs.reduce((acc, cost) => {
        acc[cost.category] = (acc[cost.category] || 0) + 1;
        return acc;
      }, {});
      setCategoryCounts(counts);

      const r = await fetchExchangeRates();
      setRates(r);

      // Total in selected currency
      const totalInTarget = costs.reduce((sum, c) => {
        const amt = Number(c.sum) || 0;
        const from = String(c.currency || 'USD').toUpperCase();
        return sum + convert(amt, from, currency, r);
      }, 0);
      setTotalConverted(totalInTarget);

      // Per-category totals in selected currency
      const byCat = costs.reduce((acc, c) => {
        const amt = Number(c.sum) || 0;
        const from = String(c.currency || 'USD').toUpperCase();
        const val = convert(amt, from, currency, r);
        acc[c.category] = (acc[c.category] || 0) + val;
        return acc;
      }, {});
      setTotalsByCategoryConverted(byCat);
    };

    fetchReportData();
  }, [selectedMonth, selectedYear, currency]);

  /**
   * Fuzzy search across category/description/date.
   */
  useEffect(() => {
    const fuse = new Fuse(reportData, {
      keys: ['category', 'description', 'date'],
      threshold: 0.3
    });
    const filtered = searchTerm ? fuse.search(searchTerm).map(r => r.item) : reportData;
    setFilteredData(filtered);
  }, [reportData, searchTerm]);

  /**
   * Export current data to CSV (includes approx per row in selected currency,
   * total in selected currency, and per-category totals in selected currency).
   */
  const exportToCSV = () => {
    const sym = currencySymbol(currency);

    const csvRows = [
      ['Category', 'Sum', 'Currency', 'Description', 'Date', `Approx in ${currency}`],
      ...reportData.map(cost => {
        const approx = rates
          ? convert(Number(cost.sum) || 0, String(cost.currency || 'USD').toUpperCase(), currency, rates)
          : '';
        const d = normalizeCostDate(cost);
        const dateStr = d
          ? d.toLocaleDateString()
          : (cost?.Date?.day
              ? `${String(selectedMonth).padStart(2, '0')}/${String(cost.Date.day).padStart(2, '0')}/${selectedYear}`
              : '');

        return [
          cost.category,
          (Number(cost.sum) || 0).toFixed(2),
          String(cost.currency || 'USD').toUpperCase(),
          cost.description,
          dateStr,
          approx === '' ? '' : `${sym}${approx.toFixed(2)}`
        ];
      }),
      [],
      ['Summary'],
      ['Total Expenses', reportData.length],
      [`Total in ${currency}`, `${sym}${totalConverted.toFixed(2)}`],
      [],
      [`Totals by category in ${currency}`],
      ...Object.entries(totalsByCategoryConverted).map(([cat, sum]) => [
        cat, `${sym}${sum.toFixed(2)}`
      ])
    ];

    const csvContent = csvRows.map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Monthly_Report_${selectedMonth}_${selectedYear}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sym = currencySymbol(currency);

  return (
    <Box sx={{ p: 4 }}>
      <Typography
        variant="h4"
        align="center"
        sx={{ color: '#2c3e50', fontWeight: 700, mb: 4 }}
      >
        Monthly Report
      </Typography>

      {/* Filters */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          mb: 4,
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}
      >
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Month</InputLabel>
          <Select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            label="Month"
            sx={{
              borderRadius: '12px',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0, 0, 0, 0.1)' }
            }}
          >
            {[...Array(12).keys()].map((m) => (
              <MenuItem key={m + 1} value={m + 1}>{m + 1}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Year</InputLabel>
          <Select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            label="Year"
            sx={{
              borderRadius: '12px',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0, 0, 0, 0.1)' }
            }}
          >
            {[...Array(21).keys()].map((offset) => {
              const y = 2030 - offset;
              return <MenuItem key={y} value={y}>{y}</MenuItem>;
            })}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 140 }}>
          <InputLabel>Currency</InputLabel>
          <Select
            value={currency}
            label="Currency"
            onChange={(e) => setCurrency(e.target.value)}
            sx={{
              borderRadius: '12px',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0, 0, 0, 0.1)' }
            }}
          >
            {currencies.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      {/* Search */}
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search expenses..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{
          mb: 4,
          '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
            '&:hover fieldset': { borderColor: '#3b82f6' }
          }
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: '#6b7280' }} />
            </InputAdornment>
          )
        }}
      />

      {filteredData.length > 0 ? (
        <Box>
          {/* Expense cards */}
          <Box sx={{ display: 'grid', gap: 2, mb: 4 }}>
            {filteredData.map((cost, idx) => {
              const originalCurrency = String(cost.currency || 'USD').toUpperCase();
              const approx = rates
                ? convert(Number(cost.sum) || 0, originalCurrency, currency, rates)
                : null;
              const d = normalizeCostDate(cost);

              return (
                <Card
                  key={idx}
                  sx={{
                    borderRadius: '16px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                    transition: 'transform 0.2s ease',
                    '&:hover': { transform: 'translateY(-2px)' }
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6" sx={{ color: categoryColors[cost.category] }}>
                        {cost.category}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {`${Number(cost.sum).toFixed(2)} ${originalCurrency}`}{" "}
                        {approx !== null && (
                          <Typography component="span" variant="body2" color="text.secondary">
                            {`(≈ ${sym}${approx.toFixed(2)} ${currency})`}
                          </Typography>
                        )}
                      </Typography>
                    </Box>
                    <Typography color="text.secondary">{cost.description}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {d ? d.toLocaleDateString() : (cost?.Date?.day ? `Day ${cost.Date.day}` : '-')}
                    </Typography>
                  </CardContent>
                </Card>
              );
            })}
          </Box>

          {/* Summary */}
          <Card sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', mb: 4 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Summary</Typography>
              <Box sx={{ display: 'grid', gap: 1 }}>
                <Typography>{`Total Expenses: ${reportData.length}`}</Typography>
                <Typography>{`Total in ${currency}: ${sym}${totalConverted.toFixed(2)}`}</Typography>

                {/* Extra: per-category totals in selected currency */}
                <Typography sx={{ mt: 1, fontWeight: 600 }}>{`Totals by category (in ${currency})`}</Typography>
                {Object.entries(totalsByCategoryConverted).map(([cat, sum]) => (
                  <Typography key={cat} sx={{ color: categoryColors[cat] || '#374151' }}>
                    {cat}: {sym}{sum.toFixed(2)}
                  </Typography>
                ))}

                {/* Category counts */}
                <Typography sx={{ mt: 1, fontWeight: 600 }}>Counts by category</Typography>
                {Object.entries(categoryCounts).map(([category, count]) => (
                  <Typography key={category} sx={{ color: categoryColors[category] }}>
                    {category}: {count} items
                  </Typography>
                ))}
              </Box>
            </CardContent>
          </Card>

          {/* Export */}
          <Box display="flex" justifyContent="center">
            <Button
              variant="contained"
              onClick={exportToCSV}
              startIcon={<FileDownloadIcon />}
              sx={{
                borderRadius: '12px',
                padding: '12px 24px',
                textTransform: 'none',
                background: 'linear-gradient(45deg, #3b82f6 30%, #60a5fa 90%)',
                boxShadow: '0 3px 15px rgba(59, 130, 246, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #2563eb 30%, #3b82f6 90%)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 6px 20px rgba(59, 130, 246, 0.4)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              Export to CSV
            </Button>
          </Box>
        </Box>
      ) : (
        <Typography
          variant="body1"
          align="center"
          sx={{ color: '#6b7280', fontSize: '1.1rem' }}
        >
          No expenses found for the selected month and year.
        </Typography>
      )}
    </Box>
  );
};

export default MonthlyReport;
