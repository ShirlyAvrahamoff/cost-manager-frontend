// src/components/AddCostForm.jsx
// -----------------------------------------------------------------------------
// add_cost_form.jsx — Form component for adding a new expense item.
// UI: MUI components; Persistence: IndexedDB via IDBWrapper.
// DB target: 'costsdb' (version 1), store: 'costs'.
// Per project spec, the date is set automatically on add (current date).
// Validation (UI-level):
//   - sum: required, numeric, > 0
//   - currency: one of USD / ILS / GBP / EURO 
//   - category: selected from curated list 
//   - description: required (non-empty)
// -----------------------------------------------------------------------------

import React, { useState, useMemo } from 'react';
import {
  Button, TextField, MenuItem, Container, Paper, Typography, Box,
  InputAdornment, FormControl, InputLabel, Select
} from '@mui/material';
import CategoryIcon from '@mui/icons-material/Category';
import DescriptionIcon from '@mui/icons-material/Description';
import IDBWrapper from '../idb';

// Single app-wide DB wrapper instance for this component's operations.
// DB name and version align with the course auto-grader (costsdb, v1).
const db = new IDBWrapper('costsdb', 1);

export default function AddCostForm() {
  // Controlled form state.
  // sum: string for the input; converted to number at submit.
  // currency: one of USD/ILS/GBP/EURO (UI offers these options).
  // category: selected from dropdown (includes 'Other').
  // description: free text.
  const [form, setForm] = useState({ sum: '', currency: 'USD', category: '', description: '' });

  // Display-only symbol based on selected currency (not stored in DB).
  const currencySymbol = useMemo(() => {
    const map = { USD: '$', ILS: '₪', GBP: '£', EURO: '€' };
    return map[String(form.currency).toUpperCase()] ?? '';
  }, [form.currency]);

  /** Generic controlled-input change handler (name -> value). */
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  /**
   * Validate and submit the expense to IndexedDB (through IDBWrapper).
   * Per spec:
   *  - sum must be a valid number > 0
   *  - currency must be one of USD/ILS/GBP/EURO
   *  - category is required (dropdown; includes "Other")
   *  - description is required (non-empty)
   * The date is set internally by the library to "now".
   */
  const handleSubmit = async () => {
    try {
      // Basic UI validation (messages are user-facing alerts).
      if (!form.sum || String(form.sum).trim() === '' || isNaN(form.sum)) return alert('Sum must be a valid number');
      if (Number(form.sum) <= 0) return alert('Sum must be > 0');
      if (!form.currency) return alert('Please select a currency');
      if (!form.category) return alert('Please select a category');
      if (!form.description.trim()) return alert('Please fill description');

      // Persist to IndexedDB via the wrapper (adds current date internally).
      await db.addCost({
        sum: Number(form.sum),
        currency: String(form.currency).toUpperCase(),
        category: form.category,
        description: form.description
      });

      alert('Expense added successfully!');
      // Reset to defaults after successful add.
      setForm({ sum: '', currency: 'USD', category: '', description: '' });
    } catch (e) {
      // Bubble the error message (wrapper may throw validation/IDB errors).
      alert(e.message || 'Failed to add expense');
    }
  };

  // -----------------------------------------------------------------------------
  // Render: semantic structure with MUI styling.
  // -----------------------------------------------------------------------------
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" align="center" sx={{ color: '#2c3e50', fontWeight: 700, mb: 4 }}>
        Add New Expense
      </Typography>

      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{ p: 4, borderRadius: '16px', bgcolor: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
        >
          {/* Prevent page reload; we handle submission via button click */}
          <form onSubmit={(e) => e.preventDefault()}>
            {/* Sum input (numeric as string; symbol is purely visual) */}
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

            {/* Currency dropdown (course tokens: USD / ILS / GBP / EURO) */}
            <FormControl fullWidth margin="normal" size="small" sx={{ mb: 2 }}>
              <InputLabel id="currency-label">Currency</InputLabel>
              <Select labelId="currency-label" label="Currency" name="currency" value={form.currency} onChange={handleChange}>
                <MenuItem value="USD">USD ($)</MenuItem>
                <MenuItem value="ILS">ILS (₪)</MenuItem>
                <MenuItem value="GBP">GBP (£)</MenuItem>
                <MenuItem value="EURO">EURO (€)</MenuItem>
              </Select>
            </FormControl>

            {/* Category dropdown — curated list (includes “Other” per requirement) */}
            <TextField
              label="Category" name="category" value={form.category} onChange={handleChange} select
              fullWidth margin="normal" variant="outlined"
              InputProps={{ startAdornment: (<InputAdornment position="start"><CategoryIcon sx={{ color: '#6b7280' }} /></InputAdornment>) }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' }, mb: 2 }}
            >
              {['Food','Transportation','Entertainment','Health','Education','Utilities','Car','Other'].map(c => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </TextField>

            {/* Description (required, free text) */}
            <TextField
              label="Description" name="description" value={form.description} onChange={handleChange}
              fullWidth margin="normal" variant="outlined"
              InputProps={{ startAdornment: (<InputAdornment position="start"><DescriptionIcon sx={{ color: '#6b7280' }} /></InputAdornment>) }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' }, mb: 3 }}
            />

            {/* Submit (adds the expense; date is auto-attached by the DB layer) */}
            <Box display="flex" justifyContent="center">
              <Button
                variant="contained" size="large" onClick={handleSubmit}
                sx={{ borderRadius: '12px', px: 6, py: 1.5, textTransform: 'none' }}
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
