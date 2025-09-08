import React, { useState, useMemo } from 'react';
import { IconButton, Box } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';

import AddCostForm from './components/AddCostForm';
import CategoryPieChart from './components/CategoryPieChart';
import Sidebar from './components/Sidebar';
import MonthlyReport from './components/MonthlyReport';
import EditExpenseForm from './components/EditExpenseForm';
import Settings from './components/Settings';
import YearlyBarChart from './components/YearlyBarChart';

/**
 * Application shell with sidebar and routing.
 */
function AppShell() {
    const [selectedComponent, setSelectedComponent] = useState('AddCostForm');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const navigate = useNavigate();

    const routeMap = useMemo(() => ({
        AddCostForm: '/add',
        MonthlyReport: '/report',
        CategoryPieChart: '/pie',
        EditExpenseForm: '/edit',
        Settings: '/settings',
        YearlyBarChart: '/yearly',
    }), []);

    const toggleSidebar = () => setIsSidebarOpen((v) => !v);

    const handleSelectComponent = (name) => {
        setSelectedComponent(name);
        const path = routeMap[name] || '/add';
        navigate(path);
    };

    return (
        <Box
            sx={{
                display: 'flex',
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                overflow: 'hidden',
            }}
        >
            {isSidebarOpen && (
                <Box sx={{ position: 'relative' }}>
                    <Sidebar onSelectComponent={handleSelectComponent} />
                    <IconButton
                        onClick={toggleSidebar}
                        sx={{
                            position: 'absolute',
                            top: '20px',
                            right: '20px',
                            zIndex: 1,
                            backgroundColor: 'white',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                            '&:hover': { backgroundColor: '#f8f9fa' },
                        }}
                        aria-label="Toggle sidebar"
                    >
                        <MenuIcon />
                    </IconButton>
                </Box>
            )}

            <Box
                sx={{
                    flex: 1,
                    position: 'relative',
                    padding: '20px',
                    overflow: 'auto',
                }}
            >
                {!isSidebarOpen && (
                    <IconButton
                        onClick={toggleSidebar}
                        sx={{
                            position: 'fixed',
                            top: '20px',
                            left: '20px',
                            zIndex: 1,
                            backgroundColor: 'white',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                            '&:hover': { backgroundColor: '#f8f9fa' },
                        }}
                        aria-label="Open sidebar"
                    >
                        <MenuIcon />
                    </IconButton>
                )}

                <Box
                    sx={{
                        maxWidth: '1200px',
                        margin: '0 auto',
                        borderRadius: '20px',
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                        overflow: 'hidden',
                    }}
                >
                    <Routes>
                        <Route path="/" element={<Navigate to="/add" replace />} />
                        <Route path="/add" element={<AddCostForm />} />
                        <Route path="/report" element={<MonthlyReport />} />
                        <Route path="/pie" element={<CategoryPieChart />} />
                        <Route path="/edit" element={<EditExpenseForm />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/yearly" element={<YearlyBarChart />} />
                        <Route path="*" element={<Navigate to="/add" replace />} />
                    </Routes>
                </Box>
            </Box>
        </Box>
    );
}

/**
 * Main application component wrapped with Router.
 */
export default function App() {
    return (
        <Router>
            <AppShell />
        </Router>
    );
}
