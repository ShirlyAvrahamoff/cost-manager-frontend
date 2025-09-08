// src/components/YearlyBarChart.jsx
import React, { useEffect, useMemo, useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Stack,
    Alert,
    LinearProgress,
    Button
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import idb from '../idb';
import { fetchExchangeRates, convert } from '../services/currencyService';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Vertical bar chart (SVG) for totals per month in a selected year and currency.
 */
export default function YearlyBarChart() {
    const [year, setYear] = useState(new Date().getFullYear());
    const [currency, setCurrency] = useState('USD');
    const [monthlyTotals, setMonthlyTotals] = useState(Array(12).fill(0));
    const [loading, setLoading] = useState(false);
    const [ratesError, setRatesError] = useState('');
    const [dataError, setDataError] = useState('');
    const navigate = useNavigate();

    const years = useMemo(() => {
        const y = new Date().getFullYear();
        return [y - 2, y - 1, y, y + 1];
    }, []);
    const currencies = ['USD', 'GBP', 'EURO', 'ILS'];

    useEffect(() => {
        loadData(year, currency);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [year, currency]);

    async function loadData(selectedYear, targetCurrency) {
        setLoading(true);
        setRatesError('');
        setDataError('');

        try {
            const rates = await fetchExchangeRates();

            // Support both signatures
            let db;
            try { db = await idb.openCostsDB('costsdb', 1); }
            catch { db = await idb.openCostsDB(1); }

            const promises = [];
            for (let m = 1; m <= 12; m += 1) {
                promises.push(idb.getCostsByMonthYear(db, selectedYear, m));
            }
            const monthlyCosts = await Promise.all(promises);

            const totals = monthlyCosts.map((list) =>
                list.reduce((sum, item) => {
                    const amount = Number(item.sum) || 0;
                    const src = String(item.currency || 'USD').toUpperCase();
                    try { return sum + convert(amount, src, targetCurrency, rates); }
                    catch { return sum; }
                }, 0)
            );

            setMonthlyTotals(totals);
        } catch (err) {
            const msg = err?.message || 'Unexpected error';
            if (/configured|rates|fetch/i.test(msg)) setRatesError(msg);
            else setDataError(msg);
        } finally {
            setLoading(false);
        }
    }

    const maxValue = useMemo(
        () => Math.max(1, ...monthlyTotals.map((v) => Math.round(v))),
        [monthlyTotals]
    );

    // SVG chart sizes
    const chartWidth = 900;
    const chartHeight = 300;
    const padding = { top: 10, right: 20, bottom: 40, left: 40 };
    const innerW = chartWidth - padding.left - padding.right;
    const innerH = chartHeight - padding.top - padding.bottom;

    const barCount = 12;
    const gap = 10;
    const barWidth = (innerW - gap * (barCount - 1)) / barCount;

    return (
        <Box sx={{ p: 3 }}>
            <Card>
                <CardContent>
                    <Typography variant="h5" gutterBottom>Yearly Chart</Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Total expenses per month for the selected year. Values are shown in the selected currency.
                    </Typography>

                    <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                        <FormControl size="small" sx={{ minWidth: 140 }}>
                            <InputLabel id="year-label">Year</InputLabel>
                            <Select
                                labelId="year-label"
                                label="Year"
                                value={year}
                                onChange={(e) => setYear(Number(e.target.value))}
                            >
                                {years.map((y) => (
                                    <MenuItem key={y} value={y}>{y}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl size="small" sx={{ minWidth: 140 }}>
                            <InputLabel id="currency-label">Currency</InputLabel>
                            <Select
                                labelId="currency-label"
                                label="Currency"
                                value={currency}
                                onChange={(e) => setCurrency(String(e.target.value))}
                            >
                                {currencies.map((c) => (
                                    <MenuItem key={c} value={c}>{c}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack>

                    {ratesError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {ratesError}{' '}
                            {/not configured/i.test(ratesError) && (
                                <Button size="small" variant="outlined" sx={{ ml: 1 }} onClick={() => navigate('/settings')}>
                                    Go to Settings
                                </Button>
                            )}
                        </Alert>
                    )}
                    {dataError && <Alert severity="error" sx={{ mb: 2 }}>{dataError}</Alert>}
                    {loading && <LinearProgress sx={{ mb: 2 }} />}

                    {/* SVG vertical bars */}
                    <Box sx={{ overflowX: 'auto' }}>
                        <svg width={chartWidth} height={chartHeight} role="img" aria-label="Yearly totals bar chart">
                            {/* X axis labels */}
                            {MONTH_LABELS.map((label, i) => {
                                const x = padding.left + i * (barWidth + gap) + barWidth / 2;
                                const y = chartHeight - padding.bottom + 18;
                                return (
                                    <text key={label} x={x} y={y} textAnchor="middle" fontSize="12" fill="#555">
                                        {label}
                                    </text>
                                );
                            })}

                            {/* Y axis line */}
                            <line
                                x1={padding.left}
                                y1={padding.top}
                                x2={padding.left}
                                y2={chartHeight - padding.bottom}
                                stroke="#ccc"
                            />

                            {/* Bars */}
                            {monthlyTotals.map((val, i) => {
                                const h = (val / maxValue) * innerH;
                                const x = padding.left + i * (barWidth + gap);
                                const y = chartHeight - padding.bottom - h;
                                return (
                                    <g key={i}>
                                        <rect
                                            x={x}
                                            y={y}
                                            width={barWidth}
                                            height={h}
                                            rx="6"
                                            fill="#4caf50"
                                        >
                                            <title>{`${MONTH_LABELS[i]}: ${val.toFixed(2)} ${currency}`}</title>
                                        </rect>
                                        <text
                                            x={x + barWidth / 2}
                                            y={y - 6}
                                            textAnchor="middle"
                                            fontSize="11"
                                            fill="#333"
                                        >
                                            {val.toFixed(0)}
                                        </text>
                                    </g>
                                );
                            })}
                        </svg>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}
