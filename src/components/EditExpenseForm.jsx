// src/components/EditExpenseForm.jsx
import React, { useState, useEffect } from 'react';
import {
  Button, TextField, MenuItem, Container, Paper, Typography, Box, Select,
  FormControl, InputLabel, InputAdornment, Dialog, DialogActions, DialogContent,
  DialogContentText, DialogTitle
} from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CategoryIcon from '@mui/icons-material/Category';
import DescriptionIcon from '@mui/icons-material/Description';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import IDBWrapper from '../idb';

const db = new IDBWrapper('CostManagerDB', 2);

const categoryColors = {
  Food: '#4CAF50', Transportation: '#2196F3', Entertainment: '#FF9800',
  Health: '#E91E63', Education: '#9C27B0', Utilities: '#00BCD4'
};

const getSymbol = (c) => ({ USD: '$', GBP: '£', EURO: '€', ILS: '₪' }[String(c || 'USD').toUpperCase()] || '');

const parseExpenseDate = (exp, year, month) => {
  if (exp?._ts) {
    const d = new Date(exp._ts);
    if (!Number.isNaN(d.getTime())) return d;
  }
  if (exp?.date) {
    const d = new Date(exp.date);
    if (!Number.isNaN(d.getTime())) return d;
  }
  const day = Number(exp?.Date?.day);
  if (day) {
    const d = new Date(year, month - 1, day);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
};

const toInputDate = (d) => {
  if (!d || Number.isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export default function EditExpenseForm() {
  const [form, setForm] = useState({ id: '', sum: '', category: '', description: '', date: '' });
  const [expenses, setExpenses] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  const noData = expenses.length === 0;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const allExpenses = await db.getCostsByMonthYear(selectedYear, selectedMonth);
      if (cancelled) return;
      setExpenses(allExpenses);
      setForm({ id: '', sum: '', category: '', description: '', date: '' });
      setOpenDeleteDialog(false);
    })();
    return () => { cancelled = true; };
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    if (form.id && !expenses.some(e => e.id === form.id)) {
      setForm({ id: '', sum: '', category: '', description: '', date: '' });
    }
  }, [expenses]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleEdit = async () => {
    if (!form.id || !form.sum) return alert('Please select an expense and fill the amount.');
    const numericSum = parseFloat(form.sum);
    if (isNaN(numericSum) || numericSum <= 0) return alert('Amount must be a positive number.');
    if (!form.description.trim()) return alert('Description is required.');
    if (!form.date) return alert('Date is required.');

    await db.updateCost({
      ...form,
      sum: numericSum,
      date: new Date(form.date)
    });

    alert('Expense updated successfully!');
    const updated = await db.getCostsByMonthYear(selectedYear, selectedMonth);
    setExpenses(updated);
    setForm({ id: '', sum: '', category: '', description: '', date: '' });
  };

  const handleExpenseSelect = (e) => {
    const selectedExpense = expenses.find(x => x.id === e.target.value);
    if (selectedExpense) {
      const d = parseExpenseDate(selectedExpense, selectedYear, selectedMonth);
      setForm({
        id: selectedExpense.id,
        sum: String(selectedExpense.sum ?? ''),
        category: selectedExpense.category || '',
        description: selectedExpense.description || '',
        date: toInputDate(d)
      });
    }
  };

  const handleDelete = async () => {
    if (!form.id) return;
    await db.deleteCost(form.id);
    setOpenDeleteDialog(false);
    alert('Expense deleted successfully!');
    const updated = await db.getCostsByMonthYear(selectedYear, selectedMonth);
    setExpenses(updated);
    setForm({ id: '', sum: '', category: '', description: '', date: '' });
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" align="center" sx={{ color: '#2c3e50', fontWeight: 700, mb: 4 }}>
        Edit Expense
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Month</InputLabel>
          <Select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))} label="Month">
            {[...Array(12).keys()].map(i => <MenuItem key={i+1} value={i+1}>{i+1}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Year</InputLabel>
          <Select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))} label="Year">
            {[...Array(21).keys()].map(off => {
              const y = 2030 - off; return <MenuItem key={y} value={y}>{y}</MenuItem>;
            })}
          </Select>
        </FormControl>
      </Box>

      <Container maxWidth="sm">
        <Paper elevation={0} sx={{ p: 4, borderRadius: '16px', bgcolor: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <form>
            <FormControl fullWidth sx={{ mb: 1.5 }}>
              <InputLabel>Select Expense</InputLabel>
              <Select name="id" value={form.id} onChange={handleExpenseSelect} label="Select Expense" disabled={noData}>
                {expenses.map((exp) => {
                  const sym = getSymbol(exp.currency);
                  return (
                    <MenuItem key={exp.id} value={exp.id}>
                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto 2fr', gap: 2, alignItems: 'center', width: '100%' }}>
                        <Typography sx={{ color: categoryColors[exp.category], fontWeight: 500 }}>{exp.category}</Typography>
                        <Typography sx={{ fontVariantNumeric: 'tabular-nums' }}>{`${sym}${Number(exp.sum || 0).toLocaleString()}`}</Typography>
                        <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', justifySelf: 'end' }} title={exp.description}>
                          {exp.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>

            {noData && (
              <Typography align="center" color="text.secondary" sx={{ my: 2 }}>
                No expenses found for the selected month and year.
              </Typography>
            )}

            {form.id && (
              <>
                <TextField
                  label="Sum" name="sum" value={form.sum} onChange={handleChange}
                  fullWidth margin="normal" variant="outlined"
                  InputProps={{ startAdornment: (<InputAdornment position="start"><AttachMoneyIcon sx={{ color: '#6b7280' }} /></InputAdornment>) }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' }, mb: 2 }}
                />

                <TextField
                  label="Category" name="category" value={form.category} onChange={handleChange} select
                  fullWidth margin="normal" variant="outlined"
                  InputProps={{ startAdornment: (<InputAdornment position="start"><CategoryIcon sx={{ color: '#6b7280' }} /></InputAdornment>) }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' }, mb: 2 }}
                >
                  {['Food','Transportation','Entertainment','Health','Education','Utilities'].map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </TextField>

                <TextField
                  label="Description" name="description" value={form.description} onChange={handleChange}
                  fullWidth margin="normal" variant="outlined"
                  InputProps={{ startAdornment: (<InputAdornment position="start"><DescriptionIcon sx={{ color: '#6b7280' }} /></InputAdornment>) }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' }, mb: 2 }}
                />

                <TextField
                  label="Date" name="date" type="date" value={form.date} onChange={handleChange}
                  fullWidth margin="normal" variant="outlined"
                  InputProps={{ startAdornment: (<InputAdornment position="start"><CalendarTodayIcon sx={{ color: '#6b7280' }} /></InputAdornment>) }}
                  InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' }, mb: 3 }}
                />

                <Box display="flex" justifyContent="center" gap={2}>
                  <Button variant="contained" size="large" onClick={handleEdit} startIcon={<EditIcon />} sx={{ borderRadius: '12px', px: 4 }}>
                    Save Changes
                  </Button>
                  <Button variant="contained" size="large" onClick={() => setOpenDeleteDialog(true)} startIcon={<DeleteIcon />} sx={{ borderRadius: '12px', px: 4 }}>
                    Delete Expense
                  </Button>
                </Box>
              </>
            )}
          </form>
        </Paper>
      </Container>

      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Confirm Expense Deletion</DialogTitle>
        <DialogContent><DialogContentText>This action cannot be undone.</DialogContentText></DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDelete} variant="contained" autoFocus>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
