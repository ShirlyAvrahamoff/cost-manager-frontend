// src/components/EditExpenseForm.jsx
/**
 * Component for editing or deleting an existing cost entry.
 * Provides a form to select and update/delete an expense from the database.
 * @module EditExpenseForm
 */
import React, { useState, useEffect } from 'react';
import {
  Button,
  TextField,
  MenuItem,
  Container,
  Paper,
  Typography,
  Box,
  Select,
  FormControl,
  InputLabel,
  InputAdornment,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CategoryIcon from '@mui/icons-material/Category';
import DescriptionIcon from '@mui/icons-material/Description';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import IDBWrapper from '../idb';

// Initialize the database with a specific name and version
const db = new IDBWrapper('CostManagerDB', 1);

// Category colors
const categoryColors = {
  Food: '#4CAF50',
  Transportation: '#2196F3',
  Entertainment: '#FF9800',
  Health: '#E91E63',
  Education: '#9C27B0',
  Utilities: '#00BCD4'
};

// Currency symbol helper
const getSymbol = (c) =>
  ({ USD: '$', GBP: '£', EURO: '€', ILS: '₪' }[String(c || 'USD').toUpperCase()] || '');

// Safe date helpers
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

function EditExpenseForm() {
  const [form, setForm] = useState({
    id: '',
    sum: '',
    category: '',
    description: '',
    date: ''
  });

  const [expenses, setExpenses] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  useEffect(() => {
    const fetchExpenses = async () => {
      const allExpenses = await db.getCostsByMonthYear(selectedMonth, selectedYear);
      setExpenses(allExpenses);
    };
    fetchExpenses();
  }, [selectedMonth, selectedYear]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEdit = async () => {
    if (!form.id || !form.sum) {
      alert('Please select an expense and fill the amount.');
      return;
    }
    const numericSum = parseFloat(form.sum);
    if (isNaN(numericSum)) {
      alert('Amount must contain only numbers');
      return;
    }
    if (numericSum <= 0) {
      alert('Amount must be greater than 0');
      return;
    }
    if (!form.description.trim()) {
      alert('Description is required');
      return;
    }
    if (!form.date) {
      alert('Date is required');
      return;
    }

    const updatedExpense = {
      ...form,
      sum: numericSum,
      date: new Date(form.date) // valid because we require YYYY-MM-DD
    };

    await db.updateCost(updatedExpense);
    alert('Expense updated successfully!');
    const updatedExpenses = await db.getCostsByMonthYear(selectedMonth, selectedYear);
    setExpenses(updatedExpenses);
    setForm({ id: '', sum: '', category: '', description: '', date: '' });
  };

  const handleExpenseSelect = (event) => {
    const selectedExpense = expenses.find(expense => expense.id === event.target.value);
    if (selectedExpense) {
      const d = parseExpenseDate(selectedExpense, selectedYear, selectedMonth);
      setForm({
        id: selectedExpense.id,
        sum: String(selectedExpense.sum ?? ''),
        category: selectedExpense.category || '',
        description: selectedExpense.description || '',
        date: toInputDate(d) // safe for <input type="date">
      });
    }
  };

  const handleOpenDeleteDialog = () => {
    if (!form.id) {
      alert('Please select an expense to delete');
      return;
    }
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => setOpenDeleteDialog(false);

  const handleDelete = async () => {
    try {
      if (!form.id) {
        alert('Please select an expense to delete');
        return;
      }
      await db.deleteCost(form.id);
      setOpenDeleteDialog(false);
      alert('Expense deleted successfully!');
      const updatedExpenses = await db.getCostsByMonthYear(selectedMonth, selectedYear);
      setExpenses(updatedExpenses);
      setForm({ id: '', sum: '', category: '', description: '', date: '' });
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Failed to delete expense. Please try again.');
      setOpenDeleteDialog(false);
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography
        variant="h4"
        align="center"
        sx={{ color: '#2c3e50', fontWeight: 700, mb: 4 }}
      >
        Edit Expense
      </Typography>

      <Box
        sx={{
          display: 'flex',
          gap: 2,
          mb: 4,
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}
      >
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Month</InputLabel>
          <Select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            label="Month"
            sx={{
              borderRadius: '12px',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0, 0, 0, 0.1)' }
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
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            label="Year"
            sx={{
              borderRadius: '12px',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0, 0, 0, 0.1)' }
            }}
          >
            {[...Array(21).keys()].map((yearOffset) => {
              const year = 2030 - yearOffset;
              return <MenuItem key={year} value={year}>{year}</MenuItem>;
            })}
          </Select>
        </FormControl>
      </Box>

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
          <form>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Select Expense</InputLabel>
              <Select
                name="id"
                value={form.id}
                onChange={handleExpenseSelect}
                label="Select Expense"
                sx={{
                  borderRadius: '12px',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0, 0, 0, 0.1)' }
                }}
              >
                {expenses.map((expense) => {
                  const sym = getSymbol(expense.currency);
                  return (
                    <MenuItem key={expense.id} value={expense.id}>
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: '1fr auto 2fr',
                          alignItems: 'center',
                          width: '100%',
                          gap: 2
                        }}
                      >
                        <Typography sx={{ color: categoryColors[expense.category], fontWeight: 500 }}>
                          {expense.category}
                        </Typography>
                        <Typography sx={{ fontVariantNumeric: 'tabular-nums' }}>
                          {`${sym}${Number(expense.sum || 0).toLocaleString()}`}
                        </Typography>
                        <Typography
                          sx={{
                            color: 'text.secondary',
                            fontSize: '0.9rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            justifySelf: 'end'
                          }}
                          title={expense.description}
                        >
                          {expense.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>

            {form.id && (
              <>
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
                        <AttachMoneyIcon sx={{ color: '#6b7280' }} />
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
                    mb: 2
                  }}
                />

                <TextField
                  label="Date"
                  name="date"
                  type="date"
                  value={form.date}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarTodayIcon sx={{ color: '#6b7280' }} />
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
                  InputLabelProps={{ shrink: true }}
                />

                <Box display="flex" justifyContent="center" gap={2}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleEdit}
                    startIcon={<EditIcon />}
                    sx={{
                      borderRadius: '12px',
                      padding: '8px 32px',
                      fontSize: '1rem',
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
                    Save Changes
                  </Button>

                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleOpenDeleteDialog}
                    startIcon={<DeleteIcon />}
                    sx={{
                      borderRadius: '12px',
                      padding: '8px 32px',
                      fontSize: '1rem',
                      textTransform: 'none',
                      background: 'linear-gradient(45deg, #ef4444 30%, #f87171 90%)',
                      boxShadow: '0 3px 15px rgba(239, 68, 68, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #dc2626 30%, #ef4444 90%)',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 6px 20px rgba(239, 68, 68, 0.4)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Delete Expense
                  </Button>
                </Box>
              </>
            )}
          </form>
        </Paper>
      </Container>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Confirm Expense Deletion"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this expense? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} sx={{ color: '#6b7280' }}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            sx={{
              background: 'linear-gradient(45deg, #ef4444 30%, #f87171 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #dc2626 30%, #ef4444 90%)'
              }
            }}
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default EditExpenseForm;
