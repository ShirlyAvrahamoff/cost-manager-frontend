// src/components/AddCostForm.jsx
/**
 * Component for adding a new cost entry.
 * Provides a form with fields for sum, currency, category, and description.
 * The date is attached automatically on insert by the idb layer.
 */
import React, { useState, useMemo } from 'react';
import {
  Button,
  TextField,
  MenuItem,
  Container,
  Paper,
  Typography,
  Box,
  InputAdornment,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import CategoryIcon from '@mui/icons-material/Category';
import DescriptionIcon from '@mui/icons-material/Description';
import IDBWrapper from '../idb'; // assumes default export is a class-like wrapper

const db = new IDBWrapper('CostManagerDB', 1);

function AddCostForm() {
  const [form, setForm] = useState({
    sum: '',
    currency: 'USD',
    category: '',
    description: ''
  });

  // currency symbol per selection
  const currencySymbol = useMemo(() => {
    const map = { USD: '$', ILS: '₪', GBP: '£', EURO: '€' };
    return map[String(form.currency).toUpperCase()] ?? '';
  }, [form.currency]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.sum) {
      alert('Please fill in the sum before adding.');
      return;
    }
    if (isNaN(form.sum) || String(form.sum).trim() === '') {
      alert('Sum must be a valid number.');
      return;
    }
    if (Number(form.sum) <= 0) {
      alert('Sum must be greater than 0.');
      return;
    }
    if (!form.currency) {
      alert('Please select a currency.');
      return;
    }
    if (!form.category) {
      alert('Please select a category before adding.');
      return;
    }
    if (!form.description) {
      alert('Please fill in the description before adding.');
      return;
    }

    await db.addCost({
      sum: Number(form.sum),
      currency: String(form.currency).toUpperCase(),
      category: form.category,
      description: form.description
    });

    alert('Expense added successfully!');
    setForm({ sum: '', currency: 'USD', category: '', description: '' });
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography
        variant="h4"
        align="center"
        gutterBottom
        sx={{ color: '#2c3e50', fontWeight: 700, mb: 4 }}
      >
        Add New Expense
      </Typography>
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: '16px',
            bgcolor: 'white',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
          }}
        >
          <form onSubmit={(e) => e.preventDefault()}>
            <TextField
              label="Sum"
              name="sum"
              value={form.sum}
              onChange={handleChange}
              fullWidth
              margin="normal"
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <span style={{ color: '#6b7280', fontWeight: 600 }}>
                      {currencySymbol}
                    </span>
                  </InputAdornment>
                )
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  '&:hover fieldset': { borderColor: '#3b82f6' }
                },
                mb: 2
              }}
            />

            <FormControl fullWidth margin="normal" size="small" sx={{ mb: 2 }}>
              <InputLabel id="currency-label">Currency</InputLabel>
              <Select
                labelId="currency-label"
                label="Currency"
                name="currency"
                value={form.currency}
                onChange={handleChange}
              >
                <MenuItem value="USD">USD</MenuItem>
                <MenuItem value="ILS">ILS</MenuItem>
                <MenuItem value="GBP">GBP</MenuItem>
                <MenuItem value="EURO">EURO</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Category"
              name="category"
              value={form.category}
              onChange={handleChange}
              select
              fullWidth
              margin="normal"
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CategoryIcon sx={{ color: '#6b7280' }} />
                  </InputAdornment>
                )
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  '&:hover fieldset': { borderColor: '#3b82f6' }
                },
                mb: 2
              }}
            >
              <MenuItem value="Food">Food</MenuItem>
              <MenuItem value="Transportation">Transportation</MenuItem>
              <MenuItem value="Entertainment">Entertainment</MenuItem>
              <MenuItem value="Health">Health</MenuItem>
              <MenuItem value="Education">Education</MenuItem>
              <MenuItem value="Utilities">Utilities</MenuItem>
            </TextField>

            <TextField
              label="Description"
              name="description"
              value={form.description}
              onChange={handleChange}
              fullWidth
              margin="normal"
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <DescriptionIcon sx={{ color: '#6b7280' }} />
                  </InputAdornment>
                )
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  '&:hover fieldset': { borderColor: '#3b82f6' }
                },
                mb: 3
              }}
            />

            <Box display="flex" justifyContent="center">
              <Button
                variant="contained"
                size="large"
                onClick={handleSubmit}
                sx={{
                  borderRadius: '12px',
                  padding: '12px 48px',
                  fontSize: '1.1rem',
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
                Add Expense
              </Button>
            </Box>
          </form>
        </Paper>
      </Container>
    </Box>
  );
}

export default AddCostForm;
