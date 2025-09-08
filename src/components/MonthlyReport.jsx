// src/components/MonthlyReport.jsx
/**
 * Component for generating and displaying monthly expense reports.
 * Provides options to filter expenses by month/year and export to CSV.
 * @module MonthlyReport
 */
import React, { useState, useEffect } from 'react';
import IDBWrapper from '../idb';
import { Box, Typography, Select, MenuItem, Card, CardContent, Button, TextField, InputLabel, FormControl } from '@mui/material';
import Fuse from 'fuse.js';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { InputAdornment } from '@mui/material';

/**
 * @typedef {Object} ReportState
 * @property {number} selectedMonth - Currently selected month (1-12)
 * @property {number} selectedYear - Currently selected year
 * @property {Array} reportData - Raw expense data
 * @property {number} totalSum - Total sum of expenses
 * @property {Object} categoryCounts - Count of expenses by category
 * @property {string} searchTerm - Current search filter
 * @property {Array} filteredData - Filtered expense data
 */

/**
 * @typedef {Object} CategoryColors
 * @property {string} Food - Color for food category
 * @property {string} Transportation - Color for transportation category
 * @property {string} Entertainment - Color for entertainment category
 * @property {string} Health - Color for health category
 * @property {string} Education - Color for education category
 * @property {string} Utilities - Color for utilities category
 */

/** @type {CategoryColors} */
const categoryColors = {
    Food: '#4CAF50',
    Transportation: '#2196F3',
    Entertainment: '#FF9800',
    Health: '#E91E63',
    Education: '#9C27B0',
    Utilities: '#00BCD4'
};

/**
 * MonthlyReport Component
 * Provides interface for viewing and exporting monthly expense reports.
 * Includes filtering, searching, and CSV export functionality.
 * @returns {JSX.Element} A component to display and export monthly reports.
 */
const MonthlyReport = () => {
    /** @type {[number, Function]} Selected month state and setter */
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    /** @type {[number, Function]} Selected year state and setter */
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    /** @type {[Array, Function]} Report data state and setter */
    const [reportData, setReportData] = useState([]);
    /** @type {[number, Function]} Total sum state and setter */
    const [totalSum, setTotalSum] = useState(0);
    /** @type {[Object, Function]} Category counts state and setter */
    const [categoryCounts, setCategoryCounts] = useState({});
    /** @type {[string, Function]} Search term state and setter */
    const [searchTerm, setSearchTerm] = useState('');
    /** @type {[Array, Function]} Filtered data state and setter */
    const [filteredData, setFilteredData] = useState([]);

    /**
     * Fetches expenses for the selected month and year.
     * Updates report data, total sum, and category counts.
     * @type {React.EffectCallback}
     */
    useEffect(() => {
        const fetchReportData = async () => {
            const idb = new IDBWrapper('CostManagerDB', 1);
            const costs = await idb.getCostsByMonthYear(selectedMonth, selectedYear);
            setReportData(costs);
            const total = costs.reduce((sum, cost) => sum + parseFloat(cost.sum || 0), 0);
            setTotalSum(total);

            const counts = costs.reduce((acc, cost) => {
                acc[cost.category] = (acc[cost.category] || 0) + 1;
                return acc;
            }, {});
            setCategoryCounts(counts);
        };

        fetchReportData();
    }, [selectedMonth, selectedYear]);

    /**
     * Filters expenses based on the search term using fuzzy search.
     * @type {React.EffectCallback}
     */
    useEffect(() => {
        const fuse = new Fuse(reportData, {
            keys: ['category', 'description', 'date'],
            threshold: 0.3
        });
        const filteredData = searchTerm ? fuse.search(searchTerm).map(result => result.item) : reportData;
        setFilteredData(filteredData);
    }, [reportData, searchTerm]);

    /**
     * Exports the filtered expenses to a CSV file.
     * Includes summary statistics and category counts.
     */
    const exportToCSV = () => {
        const csvRows = [
            ['Category', 'Sum', 'Description', 'Date'],
            ...reportData.map(cost => [cost.category, cost.sum, cost.description, new Date(cost.date).toLocaleDateString()]),
            [],
            ['Summary'],
            ['Total Expenses', reportData.length],
            ['Total Sum', totalSum.toFixed(2)],
            ['Average Expense', reportData.length > 0 ? (totalSum / reportData.length).toFixed(2) : 'N/A'],
            ...Object.entries(categoryCounts).map(([category, count]) => [`${category} items`, count])
        ];

        const csvContent = csvRows.map(e => e.join(",")).join("\n");
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

    return (
        <Box sx={{ p: 4 }}>
            <Typography 
                variant="h4" 
                align="center" 
                sx={{ 
                    color: '#2c3e50',
                    fontWeight: 700,
                    mb: 4
                }}
            >
                Monthly Report
            </Typography>

            <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                mb: 4,
                flexWrap: 'wrap',
                justifyContent: 'center'
            }}>
                <FormControl sx={{ minWidth: 120 }}>
                    <InputLabel>Month</InputLabel>
                    <Select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        label="Month"
                        sx={{
                            borderRadius: '12px',
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(0, 0, 0, 0.1)',
                            },
                        }}
                    >
                        {[...Array(12).keys()].map((month) => (
                            <MenuItem key={month + 1} value={month + 1}>{month + 1}</MenuItem>
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
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(0, 0, 0, 0.1)',
                            },
                        }}
                    >
                        {[...Array(21).keys()].map((yearOffset) => {
                            const year = 2030 - yearOffset;
                            return <MenuItem key={year} value={year}>{year}</MenuItem>;
                        })}
                    </Select>
                </FormControl>
            </Box>

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
                        '&:hover fieldset': {
                            borderColor: '#3b82f6',
                        },
                    },
                }}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon sx={{ color: '#6b7280' }} />
                        </InputAdornment>
                    ),
                }}
            />

            {filteredData.length > 0 ? (
                <Box>
                    <Box sx={{ display: 'grid', gap: 2, mb: 4 }}>
                        {filteredData.map((cost, index) => (
                            <Card 
                                key={index} 
                                sx={{ 
                                    borderRadius: '16px',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                                    transition: 'transform 0.2s ease',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                    },
                                }}
                            >
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                        <Typography variant="h6" sx={{ color: categoryColors[cost.category] }}>
                                            {cost.category}
                                        </Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                            ₪{cost.sum}
                                        </Typography>
                                    </Box>
                                    <Typography color="text.secondary">{cost.description}</Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                        {new Date(cost.date).toLocaleDateString()}
                                    </Typography>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>

                    <Card sx={{ 
                        borderRadius: '16px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                        mb: 4
                    }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Summary</Typography>
                            <Box sx={{ display: 'grid', gap: 1 }}>
                                <Typography>Total Expenses: {reportData.length}</Typography>
                                <Typography>Total Sum: ₪{totalSum.toFixed(2)}</Typography>
                                {Object.entries(categoryCounts).map(([category, count]) => (
                                    <Typography key={category} sx={{ color: categoryColors[category] }}>
                                        {category}: {count} items
                                    </Typography>
                                ))}
                            </Box>
                        </CardContent>
                    </Card>

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
                                    boxShadow: '0 6px 20px rgba(59, 130, 246, 0.4)',
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
                    sx={{ 
                        color: '#6b7280',
                        fontSize: '1.1rem'
                    }}
                >
                    No expenses found for the selected month and year.
                </Typography>
            )}
        </Box>
    ); // Returns a container with monthly expense report, including filters, search, expense cards, summary, and export option
};

export default MonthlyReport;
