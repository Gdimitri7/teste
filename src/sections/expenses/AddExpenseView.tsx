import { useState } from 'react';

import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { Box, Typography, TextField, Button, MenuItem } from '@mui/material';

export function AddExpenseView() {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Alimentação');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState<Date | null>(new Date());
  const [paidBy, setPaidBy] = useState('Gustavo'); // default
  const [error, setError] = useState<string | null>(null);

  const CATEGORIES = ['Alimentação','Restaurante','Educação','Gasolina','Lazer','Saúde','Outros'];
  const USERS = ['Gustavo', 'Geovana'];

  const SUPABASE_URL = 'https://xhetvaflxvoxllspoimz.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoZXR2YWZseHZveGxsc3BvaW16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NTg3NDksImV4cCI6MjA3NzEzNDc0OX0.lkyrirrQm31gnDUAmB4lETpb0pHGGBaM3i32R9FkSrk';

  const handleAdd = async () => {
    if (!title || !category || !amount || !date || !paidBy) {
      setError('Preencha todos os campos');
      return;
    }

    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: 'return=representation',
        },
        body: JSON.stringify([{
          title,
          category,
          amount: parseFloat(amount),
          date: date.toISOString(),
          paid_by: paidBy
        }])
      });

      const data = await res.json();
      if (res.ok) {
        alert(`Gasto adicionado!\nQuem pagou: ${paidBy}`);
        setTitle('');
        setCategory('Alimentação');
        setAmount('');
        setDate(new Date());
        setPaidBy('Gustavo');
        setError(null);
      } else {
        console.error('Erro:', data);
        setError('Erro ao adicionar gasto');
      }
    } catch(err){
      console.error(err);
      setError('Erro ao adicionar gasto');
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p:3, color: '#a3c9a7' }}>
        <Typography variant="h4" sx={{ mb:3,  color: '#a3c9a7' }}>Adicionar Gasto</Typography>

        <Box sx={{ display:'flex', gap:2, flexWrap:'wrap', mb:2 }}>
          <TextField label="Título" value={title} onChange={e=>setTitle(e.target.value)} />

          <TextField select label="Categoria" value={category} onChange={e=>setCategory(e.target.value)}>
            {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>

          <TextField label="Valor" type="number" value={amount} onChange={e=>setAmount(e.target.value)} />

          <DatePicker
            label="Data"
            value={date}
            onChange={newDate => setDate(newDate)}
            slotProps={{ textField:{ fullWidth:true } }}
          />

          <TextField select label="Quem pagou?" value={paidBy} onChange={e=>setPaidBy(e.target.value)} sx={{ minWidth:200 }}>
            {USERS.map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
          </TextField>
        </Box>

        {error && <Typography color="error" sx={{ mb:2 }}>{error}</Typography>}

        <Button
  variant="contained"
  onClick={handleAdd}
  sx={{
    bgcolor: '#ffb353', // fundo
    color: '#fff',       // texto
    '&:hover': {
      bgcolor: '#fadab3ff', // hover   // cor ao passar o mouse
    },
    borderRadius: 2,           // borda arredondada opcional
    px: 3,                     // padding horizontal
  }}
>
  + Gasto
</Button>

      </Box>
    </LocalizationProvider>
  );
}
