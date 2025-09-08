// src/components/Sidebar.jsx
/**
 * Sidebar navigation for primary app views.
 */
import React from 'react';
import { Button, Box, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PieChartIcon from '@mui/icons-material/PieChart';
import DescriptionIcon from '@mui/icons-material/Description';
import EditIcon from '@mui/icons-material/Edit';
import SettingsIcon from '@mui/icons-material/Settings';
import BarChartIcon from '@mui/icons-material/BarChart';
import { NavLink as RouterLink } from 'react-router-dom';

const itemSx = {
    padding: '12px 20px',
    justifyContent: 'flex-start',
    color: '#2c3e50',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: '12px',
    '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    },
    transition: 'all 0.3s ease',
    textAlign: 'left',
};

const Sidebar = ({ onSelectComponent }) => {
    const handleCompat = (name) => {
        if (typeof onSelectComponent === 'function') {
            onSelectComponent(name);
        }
    };

    return (
        <Box
            sx={{
                width: '280px',
                height: '100%',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                borderRight: '1px solid rgba(255, 255, 255, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                padding: '32px 20px',
                gap: '24px',
            }}
        >
            <Typography
                variant="h5"
                sx={{ color: '#2c3e50', fontWeight: 600, textAlign: 'center', marginBottom: '20px' }}
            >
                Cost Manager
            </Typography>

            <Button component={RouterLink} to="/add" onClick={() => handleCompat('AddCostForm')} startIcon={<AddIcon />} sx={itemSx}>
                Add Cost
            </Button>
            <Button component={RouterLink} to="/pie" onClick={() => handleCompat('CategoryPieChart')} startIcon={<PieChartIcon />} sx={itemSx}>
                Category Chart
            </Button>
            <Button component={RouterLink} to="/report" onClick={() => handleCompat('MonthlyReport')} startIcon={<DescriptionIcon />} sx={itemSx}>
                Monthly Report
            </Button>
            <Button component={RouterLink} to="/edit" onClick={() => handleCompat('EditExpenseForm')} startIcon={<EditIcon />} sx={itemSx}>
                Edit Expense
            </Button>
            <Button component={RouterLink} to="/yearly" onClick={() => handleCompat('YearlyBarChart')} startIcon={<BarChartIcon />} sx={itemSx}>
                Yearly Chart
            </Button>
            <Button component={RouterLink} to="/settings" onClick={() => handleCompat('Settings')} startIcon={<SettingsIcon />} sx={itemSx}>
                Settings
            </Button>
        </Box>
    );
};

export default Sidebar;
