import { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';

import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  MenuItem,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';

interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  paid_by: string;
}

const USERS = ['Gustavo', 'Geovana'];
const CATEGORIES = ['Alimentação', 'Restaurante', 'Educação', 'Gasolina', 'Lazer', 'Saúde', 'Outros'];
const PERIODS = ['Semanal', 'Mensal', 'Anual'];
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28FFF', '#FF6699', '#33CC99'];

export function ExpensesReportView() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filterUser, setFilterUser] = useState<string | null>(null);
  const [period, setPeriod] = useState<'Semanal' | 'Mensal' | 'Anual'>('Semanal');
  const [error, setError] = useState<string | null>(null);

  const [openEdit, setOpenEdit] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);

  const SUPABASE_URL = 'https://xhetvaflxvoxllspoimz.supabase.co';
  const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoZXR2YWZseHZveGxsc3BvaW16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NTg3NDksImV4cCI6MjA3NzEzNDc0OX0.lkyrirrQm31gnDUAmB4lETpb0pHGGBaM3i32R9FkSrk';

  const getPeriodFilter = () => {
    const now = new Date();
    let start: Date;

    switch (period) {
      case 'Semanal': {
        const day = now.getDay();
        start = new Date(now);
        start.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
        start.setHours(0, 0, 0, 0);
        break;
      }
      case 'Mensal':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'Anual':
        start = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        start = new Date(0);
    }

    return start.toISOString().split('T')[0];
  };

  const fetchExpenses = async () => {
    try {
      let url = `${SUPABASE_URL}/rest/v1/expenses?order=date.desc`;
      const startDate = getPeriodFilter();
      url += `&date=gte.${startDate}`;
      if (filterUser) url += `&paid_by=eq.${filterUser}`;

      const res = await fetch(url, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setExpenses(data);
        setError(null);
      } else {
        console.error('Erro:', data);
        setError('Erro ao buscar despesas');
      }
    } catch (err) {
      console.error(err);
      setError('Erro ao buscar despesas');
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [filterUser, period]);

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente deletar este gasto?')) return;
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/expenses?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      if (res.ok) fetchExpenses();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenEdit = (expense: Expense) => {
    setEditExpense({ ...expense });
    setOpenEdit(true);
  };
  const handleCloseEdit = () => {
    setOpenEdit(false);
    setEditExpense(null);
  };
  const handleSaveEdit = async () => {
    if (!editExpense) return;
    try {
      const { id, title, category, amount, date, paid_by } = editExpense;
      const res = await fetch(`${SUPABASE_URL}/rest/v1/expenses?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: 'return=representation'
        },
        body: JSON.stringify({ title, category, amount, date, paid_by })
      });
      if (res.ok) {
        fetchExpenses();
        handleCloseEdit();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatEuro = (value: number) =>
    value.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });

  const chartData = useMemo(() => {
    const categoryMap: Record<string, number> = {};
    expenses.forEach((e) => {
      categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
    });
    return Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  const total = chartData.reduce((acc, cur) => acc + cur.value, 0);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3,color: '#a3c9a7'}}>
        <Typography variant="h4" sx={{ mb: 3 }}>
          Relatório de Gastos
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
          <TextField
            select
            label="Período"
            value={period}
            onChange={(e) => setPeriod(e.target.value as 'Semanal' | 'Mensal' | 'Anual')}
            sx={{ minWidth: 150 }}
          >
            {PERIODS.map((p) => (
              <MenuItem key={p} value={p}>
                {p}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Quem pagou?"
            value={filterUser || ''}
            onChange={(e) => setFilterUser(e.target.value || null)}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">Todos</MenuItem>
            {USERS.map((u) => (
              <MenuItem key={u} value={u}>
                {u}
              </MenuItem>
            ))}
          </TextField>

          <Button
  variant="contained"
  onClick={fetchExpenses}
  sx={{
    bgcolor: '#ffb353', // fundo
    color: '#fff',       // texto
    '&:hover': {
      bgcolor: '#fadab3ff', // hover
    },
  }}
>
  Atualizar
</Button>

        </Box>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <TableContainer component={Paper} sx={{ mb: 4,}}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Título</TableCell>
                <TableCell>Categoria</TableCell>
                <TableCell>Valor</TableCell>
                <TableCell>Data</TableCell>
                <TableCell>Quem pagou</TableCell>
                <TableCell>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {expenses.map((exp) => (
                <TableRow key={exp.id}>
                  <TableCell>{exp.title}</TableCell>
                  <TableCell>{exp.category}</TableCell>
                  <TableCell>{formatEuro(exp.amount)}</TableCell>
                  <TableCell>{new Date(exp.date).toLocaleDateString()}</TableCell>
                  <TableCell>{exp.paid_by}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Button variant="outlined" size="small" onClick={() => handleOpenEdit(exp)}>
                        Editar
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => handleDelete(exp.id)}
                      >
                        Deletar
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Typography variant="h6" sx={{ mb: 2 }}>
          Total {filterUser ? `(${filterUser})` : 'Geral'}: {formatEuro(total)}
        </Typography>

        <Box sx={{ width: 400, height: 400, margin: '0 auto' }}>
          <Typography variant="h6" sx={{ textAlign: 'center', mb: 1 }}>
            {filterUser ? filterUser : 'Todos'} - Total: {formatEuro(total)}
          </Typography>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={120}
                label
              >
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatEuro(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Box>

        {/* Modal Edição */}
        <Dialog open={openEdit} onClose={handleCloseEdit}>
          <DialogTitle>Editar Gasto</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Título"
              value={editExpense?.title || ''}
              onChange={(e) =>
                setEditExpense((prev) => (prev ? { ...prev, title: e.target.value } : null))
              }
            />
            <TextField
              select
              label="Categoria"
              value={editExpense?.category || ''}
              onChange={(e) =>
                setEditExpense((prev) => (prev ? { ...prev, category: e.target.value } : null))
              }
            >
              {CATEGORIES.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Valor"
              type="number"
              value={editExpense?.amount || 0}
              onChange={(e) =>
                setEditExpense((prev) =>
                  prev ? { ...prev, amount: parseFloat(e.target.value) } : null
                )
              }
            />
            <DatePicker
              label="Data"
              value={editExpense ? new Date(editExpense.date) : null}
              onChange={(d) =>
                setEditExpense((prev) => (prev && d ? { ...prev, date: d.toISOString() } : prev))
              }
              slotProps={{ textField: { fullWidth: true } }}
            />
            <TextField
              select
              label="Quem pagou?"
              value={editExpense?.paid_by || ''}
              onChange={(e) =>
                setEditExpense((prev) => (prev ? { ...prev, paid_by: e.target.value } : null))
              }
            >
              {USERS.map((u) => (
                <MenuItem key={u} value={u}>
                  {u}
                </MenuItem>
              ))}
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseEdit}>Cancelar</Button>
            <Button variant="contained" onClick={handleSaveEdit}>
              Salvar
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
}
