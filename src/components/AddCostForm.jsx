// src/components/AddCostForm.jsx
import React, { useState, useMemo } from 'react';
import {
  Button, TextField, MenuItem, Container, Paper, Typography, Box,
  InputAdornment, FormControl, InputLabel, Select
} from '@mui/material';
import CategoryIcon from '@mui/icons-material/Category';
import DescriptionIcon from '@mui/icons-material/Description';
import IDBWrapper from '../idb';

const db = new IDBWrapper('CostManagerDB', 2);

export default function AddCostForm() {
  const [form, setForm] = useState({ sum: '', currency: 'USD', category: '', description: '' });

  const currencySymbol = useMemo(() => {
    const map = { USD: '$', ILS: '₪', GBP: '£', EURO: '€' };
    return map[String(form.currency).toUpperCase()] ?? '';
  }, [form.currency]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    try {
      if (!form.sum || String(form.sum).trim() === '' || isNaN(form.sum)) return alert('Sum must be a valid number');
      if (Number(form.sum) <= 0) return alert('Sum must be > 0');
      if (!form.currency) return alert('Please select a currency');
      if (!form.category) return alert('Please select a category');
      if (!form.description.trim()) return alert('Please fill description');

      await db.addCost({
        sum: Number(form.sum),
        currency: String(form.currency).toUpperCase(),
        category: form.category,
        description: form.description
      });

      alert('Expense added successfully!');
      setForm({ sum: '', currency: 'USD', category: '', description: '' });
    } catch (e) {
      alert(e.message || 'Failed to add expense');
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" align="center" sx={{ color: '#2c3e50', fontWeight: 700, mb: 4 }}>
        Add New Expense
      </Typography>
      <Container maxWidth="sm">
        <Paper elevation={0} sx={{ p: 4, borderRadius: '16px', bgcolor: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <form onSubmit={(e) => e.preventDefault()}>
            <TextField
              label="Sum" name="sum" value={form.sum} onChange={handleChange}
              fullWidth margin="normal" variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <span style={{ color: '#6b7280', fontWeight: 600 }}>{currencySymbol}</span>
                  </InputAdornment>
                )
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' }, mb: 2 }}
            />

            <FormControl fullWidth margin="normal" size="small" sx={{ mb: 2 }}>
              <InputLabel id="currency-label">Currency</InputLabel>
              <Select labelId="currency-label" label="Currency" name="currency" value={form.currency} onChange={handleChange}>
                <MenuItem value="USD">USD ($)</MenuItem>
                <MenuItem value="ILS">ILS (₪)</MenuItem>
                <MenuItem value="GBP">GBP (£)</MenuItem>
                <MenuItem value="EURO">EURO (€)</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Category" name="category" value={form.category} onChange={handleChange} select
              fullWidth margin="normal" variant="outlined"
              InputProps={{ startAdornment: (<InputAdornment position="start"><CategoryIcon sx={{ color: '#6b7280' }} /></InputAdornment>) }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' }, mb: 2 }}
            >
              {['Food','Transportation','Entertainment','Health','Education','Utilities','Car'].map(c => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </TextField>

            <TextField
              label="Description" name="description" value={form.description} onChange={handleChange}
              fullWidth margin="normal" variant="outlined"
              InputProps={{ startAdornment: (<InputAdornment position="start"><DescriptionIcon sx={{ color: '#6b7280' }} /></InputAdornment>) }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' }, mb: 3 }}
            />

            <Box display="flex" justifyContent="center">
              <Button variant="contained" size="large" onClick={handleSubmit} sx={{ borderRadius: '12px', px: 6, py: 1.5, textTransform: 'none' }}>
                Add Expense
              </Button>
            </Box>
          </form>
        </Paper>
      </Container>
    </Box>
  );
}
