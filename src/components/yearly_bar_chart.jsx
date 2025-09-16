// src/components/YearlyBarChart.jsx
// -----------------------------------------------------------------------------
// YearlyBarChart — SVG bar chart of totals per month in a selected year.
// Responsibilities:
//   • For a chosen (year, currency), call db.getReport(year, month, currency) 12x
//   • Collect monthly totals and render an accessible SVG bar chart
//   • Provide selectors for year and currency; handle loading/errors
// Notes:
//   • db.getReport returns total in the requested currency (units-per-USD model).
//   • The SVG includes axis labels and <title> for basic a11y.
//   • Comments only. No code changes.
// -----------------------------------------------------------------------------

import React, { useEffect, useMemo, useState } from 'react';
import { Box, Card, CardContent, Typography, FormControl, InputLabel, Select, MenuItem, Stack, Alert, LinearProgress } from '@mui/material';
import IDBWrapper from '../idb';

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const db = new IDBWrapper('costsdb', 1);

export default function YearlyBarChart() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [currency, setCurrency] = useState('USD');
  const [monthlyTotals, setMonthlyTotals] = useState(Array(12).fill(0));
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  // Reasonable year range for selection (±2 years around current)
  const years = useMemo(() => {
    const y = new Date().getFullYear();
    return [y - 2, y - 1, y, y + 1];
  }, []);
  const currencies = ['USD', 'GBP', 'EURO', 'ILS'];

  // Load 12 monthly reports whenever (year, currency) changes.
  useEffect(() => {
    (async () => {
      setLoading(true); setErr('');
      try {
        const reports = await Promise.all(
          Array.from({ length: 12 }, (_, i) => db.getReport(year, i + 1, currency))
        );
        setMonthlyTotals(reports.map(r => r.total.total || 0));
      } catch (e) {
        setErr(e?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    })();
  }, [year, currency]);

  const hasAny = monthlyTotals.some(v => v > 0);
  const fmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

  // Basic SVG layout constants (padding, bar size, scale)
  const chartWidth = 900, chartHeight = 320;
  const padding = { top: 36, right: 20, bottom: 40, left: 40 };
  const innerW = chartWidth - padding.left - padding.right;
  const innerH = chartHeight - padding.top - padding.bottom;
  const gap = 12;
  const barWidth = (innerW - gap * (12 - 1)) / 12;
  const maxValue = Math.max(1, ...monthlyTotals) * 1.12;

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" align="center" sx={{ color: '#2c3e50', fontWeight: 700, mb: 3 }}>
        Totals by Month — {year} ({currency})
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Total expenses per month in the selected year, shown in the selected currency.
      </Typography>

      <Card elevation={0} sx={{ p: 3, borderRadius: '16px', bgcolor: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <CardContent>
          <Stack direction="row" spacing={2} sx={{ mb: 2 }} alignItems="center" flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Year</InputLabel>
              <Select label="Year" value={year} onChange={(e) => setYear(e.target.value)}>
                {years.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Currency</InputLabel>
              <Select label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {currencies.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>

          {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
          {loading && <LinearProgress sx={{ mb: 2 }} />}

          {!loading && !err && !hasAny && (
            <Typography align="center" color="text.secondary" sx={{ my: 4 }}>
              No expenses found for the selected year.
            </Typography>
          )}

          {!loading && !err && hasAny && (
            <Box sx={{ overflowX: 'auto' }}>
              {/* Accessible SVG bar chart with month labels and values */}
              <svg width={chartWidth} height={chartHeight} role="img" aria-label="Yearly totals bar chart">
                {/* X-axis month labels */}
                {MONTH_LABELS.map((label, i) => {
                  const x = padding.left + i * (barWidth + gap) + barWidth / 2;
                  const y = chartHeight - padding.bottom + 18;
                  return <text key={label} x={x} y={y} textAnchor="middle" fontSize="14" fill="#555">{label}</text>;
                })}

                {/* Y-axis baseline */}
                <line x1={padding.left} y1={padding.top} x2={padding.left} y2={chartHeight - padding.bottom} stroke="#ccc" />

                {/* Bars and value labels */}
                {monthlyTotals.map((val, i) => {
                  const h = (val / maxValue) * innerH;
                  const x = padding.left + i * (barWidth + gap);
                  const y = chartHeight - padding.bottom - h;
                  return (
                    <g key={i}>
                      <rect x={x} y={y} width={barWidth} height={h} rx="6" fill="#4caf50">
                        <title>{`${MONTH_LABELS[i]}: ${val.toFixed(2)} ${currency}`}</title>
                      </rect>
                      <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" fontSize="14" fill="#333">
                        {fmt.format(Math.round(val))}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
