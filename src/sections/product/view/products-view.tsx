// src/views/ExpensesView.tsx
import { useState, useEffect, useCallback } from 'react';

import {
  Box,
  Typography,
  TextField,
  Button,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  Paper,
} from '@mui/material';

export function ProductsView() {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('token'); // access_token do login
  const userId = localStorage.getItem('user_id'); // id do usuário logado

  // Supabase public info
  const SUPABASE_URL = "https://xhetvaflxvoxllspoimz.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoZXR2YWZseHZveGxsc3BvaW16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NTg3NDksImV4cCI6MjA3NzEzNDc0OX0.lkyrirrQm31gnDUAmB4lETpb0pHGGBaM3i32R9FkSrk"; // ou NEXT_PUBLIC_SUPABASE_ANON_KEY

  const fetchExpenses = useCallback(async () => {
  if (!token || !userId) return;

  try {
    setLoading(true);
    const res = await fetch(
  `${SUPABASE_URL}/rest/v1/expenses?user_id=eq.${userId}&order=date.desc&select=*`,
  { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` } }
);

    const data = await res.json();
    setExpenses(data);
    setLoading(false);
  } catch (err) {
    console.error(err);
    setError('Erro ao carregar despesas');
    setLoading(false);
  }
}, [token, userId]);

  const handleAddExpense = async () => {
    if (!title || !category || !amount) {
      setError('Preencha todos os campos');
      return;
    }

    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/expenses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token}`,
          Prefer: "return=representation",
        },
        body: JSON.stringify([
          {
            title,
            category,
            amount: parseFloat(amount),
            user_id: userId,
            date: new Date().toISOString(),
          },
        ]),
      });

      const data = await res.json();
      if (res.ok) {
        setExpenses(prev => [data[0], ...prev]);
        setTitle("");
        setCategory("");
        setAmount("");
        setError(null);
      } else {
        console.error(data);
        setError("Erro ao adicionar gasto");
      }
    } catch (err) {
      console.error(err);
      setError("Erro ao adicionar gasto");
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Gastos Mensais
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          label="Título"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <TextField
          label="Categoria"
          value={category}
          onChange={e => setCategory(e.target.value)}
        />
        <TextField
          label="Valor"
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
        />
        <Button variant="contained" onClick={handleAddExpense}>
          Adicionar
        </Button>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Título</TableCell>
              <TableCell>Categoria</TableCell>
              <TableCell>Valor</TableCell>
              <TableCell>Data</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  Nenhum gasto registrado
                </TableCell>
              </TableRow>
            ) : (
              expenses.map((e: any) => (
                <TableRow key={e.id}>
                  <TableCell>{e.title}</TableCell>
                  <TableCell>{e.category}</TableCell>
                  <TableCell>R$ {parseFloat(e.amount).toFixed(2)}</TableCell>
                  <TableCell>{new Date(e.date).toLocaleDateString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
