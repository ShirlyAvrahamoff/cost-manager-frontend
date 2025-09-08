// src/components/CategoryPieChart.jsx
/**
 * Component for displaying a pie chart of costs by category.
 * Fetches data from IndexedDB and visualizes it using Chart.js.
 * @module CategoryPieChart
 */
import React, { useEffect, useState } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import IDBWrapper from '../idb';
import { Box, Typography, FormControl, Select, MenuItem, InputLabel, Card } from '@mui/material';

ChartJS.register(ArcElement, Tooltip, Legend);

/**
 * @typedef {Object} ChartDataset
 * @property {Array<number>} data - Array of numerical values for each category
 * @property {Array<string>} backgroundColor - Array of colors for each category
 * @property {string} borderColor - Color of the border between segments
 * @property {number} borderWidth - Width of the border between segments
 */

/**
 * @typedef {Object} ChartData
 * @property {Array<string>} labels - Array of category labels
 * @property {Array<ChartDataset>} datasets - Array of dataset objects
 */

/**
 * @typedef {Object} CategoryTotals
 * @property {number} [Food] - Total for food category
 * @property {number} [Transportation] - Total for transportation category
 * @property {number} [Entertainment] - Total for entertainment category
 * @property {number} [Health] - Total for health category
 * @property {number} [Education] - Total for education category
 * @property {number} [Utilities] - Total for utilities category
 */

/**
 * CategoryPieChart Component
 * Provides a visual representation of expense distribution by category.
 * Includes month/year selection and dynamic data updates.
 * @returns {JSX.Element} A pie chart displaying costs by category.
 */
function CategoryPieChart() {
    /** @type {[ChartData, Function]} Chart data state and setter */
    const [chartData, setChartData] = useState({
        labels: [],
        datasets: [{
            data: [],
            backgroundColor: [
                '#4CAF50',  // Food
                '#2196F3',  // Transportation
                '#FF9800',  // Entertainment
                '#E91E63',  // Health
                '#9C27B0',  // Education
                '#00BCD4'   // Utilities
            ],
            borderColor: 'rgba(255, 255, 255, 0.8)',
            borderWidth: 2
        }]
    });

    /** @type {[number, Function]} Selected month state and setter */
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    /** @type {[number, Function]} Selected year state and setter */
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    /**
     * Fetches data and updates the pie chart when month or year changes.
     * Calculates totals by category and updates chart data accordingly.
     * @type {React.EffectCallback}
     */
    useEffect(() => {
        const fetchData = async () => {
            const idb = new IDBWrapper('CostManagerDB', 1);
            const costs = await idb.getCostsByMonthYear(selectedMonth, selectedYear);
            
            if (costs.length === 0) {
                setChartData({
                    labels: [],
                    datasets: [{
                        data: [],
                        backgroundColor: [],
                        borderColor: 'rgba(255, 255, 255, 0.8)',
                        borderWidth: 2
                    }],
                });
                return;
            }

            /** @type {CategoryTotals} */
            const categoryTotals = costs.reduce((acc, cost) => {
                acc[cost.category] = (acc[cost.category] || 0) + parseFloat(cost.sum || 0);
                return acc;
            }, {});

            setChartData({
                labels: Object.keys(categoryTotals),
                datasets: [{
                    data: Object.values(categoryTotals),
                    backgroundColor: [
                        '#4CAF50',  // Food
                        '#2196F3',  // Transportation
                        '#FF9800',  // Entertainment
                        '#E91E63',  // Health
                        '#9C27B0',  // Education
                        '#00BCD4'   // Utilities
                    ],
                    borderColor: 'rgba(255, 255, 255, 0.8)',
                    borderWidth: 2
                }],
            });
        };

        fetchData();
    }, [selectedMonth, selectedYear]);

// Layout for selecting month and year and displaying the pie chart.
// Includes Material-UI components and the Chart.js Pie chart.

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
                Category Distribution
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

            <Card sx={{
                maxWidth: '800px',
                margin: '0 auto',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                p: 4
            }}>
                {chartData.labels.length > 0 ? (
                    <Box sx={{
                        width: '100%',
                        height: '400px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                        <Pie
                            data={chartData}
                            options={{
                                plugins: {
                                    legend: {
                                        position: 'bottom',
                                        labels: {
                                            padding: 20,
                                            font: {
                                                size: 14
                                            }
                                        }
                                    },
                                    tooltip: {
                                        callbacks: {
                                            label: function(context) {
                                                const value = context.raw;
                                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                                const percentage = ((value / total) * 100).toFixed(1);
                                                return `₪${value} (${percentage}%)`;
                                            }
                                        },
                                        titleFont: {
                                            size: 14
                                        },
                                        bodyFont: {
                                            size: 14
                                        },
                                        padding: 12,
                                        boxPadding: 6
                                    }
                                },
                                maintainAspectRatio: false,
                                animation: {
                                    animateScale: true,
                                    animateRotate: true,
                                    duration: 1000,
                                    easing: 'easeInOutQuart'
                                }
                            }}
                        />
                    </Box>
                ) : (
                    <Typography
                        variant="body1"
                        align="center"
                        sx={{
                            color: '#6b7280',
                            fontSize: '1.1rem',
                            py: 8
                        }}
                    >
                        No expenses found for the selected month and year.
                    </Typography>
                )}
            </Card>
        </Box>
    ); // Returns a container with month/year selectors and a pie chart showing expense distribution by category
}

export default CategoryPieChart;