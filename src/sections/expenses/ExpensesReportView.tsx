import { useState, useEffect, useMemo, useCallback } from 'react';
// Recharts para visualização moderna de gráficos
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
  AreaChart, // NOVO: Para o gráfico de tendência
  XAxis,
  YAxis,
  CartesianGrid,
  Area,
} from 'recharts';

import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
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
  DialogActions,
  Card,
  IconButton,
  Grid,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';

// Import assumido
// import { Iconify } from 'src/components/iconify';

// --- DEFINIÇÕES E CONSTANTES ---

interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  paid_by: string;
}

// CORREÇÃO ESSENCIAL: Adiciona um índice de assinatura para satisfazer a tipagem do Recharts
interface PieChartData {
  name: string;
  value: number;
  [key: string]: any; // Permite que o Recharts adicione propriedades como 'fill', 'payload', etc.
}

interface TrendData {
  name: string; // Ex: 'Jan 24'
  total: number;
}

interface CustomPieChartProps {
  data: PieChartData[];
  total: number;
}

const USERS = ['Gustavo', 'Geovana'];
const CATEGORIES = [
  'Alimentação',
  'Restaurante',
  'Educação',
  'Gasolina',
  'Lazer',
  'Saúde',
  'Outros',
];
const PERIODS = ['Semanal', 'Mensal', 'Anual', 'Todos'];
// Cores mais vibrantes para o efeito "chocante"
const COLORS = ['#FF4B4B', '#0097A7', '#FBC02D', '#9C27B0', '#039BE5', '#FF7043', '#388E3C'];

// Função de formatação BRL
const formatBRLCurrency = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || value === 0) return 'R$ 0,00';
  const num = typeof value === 'string' ? parseFloat(value as string) : value;

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(num);
};

// --- SUBCOMPONENTE DE GRÁFICO PERSONALIZADO (MANTIDO) ---

const CustomPieChart = ({ data, total }: CustomPieChartProps) => {
  const maxCategory =
    data.length > 0
      ? data.reduce((prev, current) => (prev.value > current.value ? prev : current))
      : null;

  return (
    <Card sx={{ p: 3, boxShadow: 8, height: '100%', minHeight: 400 }}>
      <Typography variant="h6" sx={{ mb: 1, color: '#5c5259' }}>
        1. Distribuição de Gastos por Categoria
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        Total no Período:{' '}
        <Typography component="span" sx={{ fontWeight: 700, color: '#FF4B4B' }}>
          {formatBRLCurrency(total)}
        </Typography>
      </Typography>

      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              innerRadius={60}
              paddingAngle={3}
              fill="#8884d8"
              labelLine={false}
              isAnimationActive // Animação de transição
            >
              {data.map((entry: PieChartData, index: number) => (
                <Cell
                  key={`cell-${entry.name}`}
                  fill={COLORS[index % COLORS.length]}
                  // Destaque visual
                  strokeWidth={entry.name === maxCategory?.name ? 4 : 1}
                  stroke={entry.name === maxCategory?.name ? COLORS[index % COLORS.length] : '#fff'}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [
                formatBRLCurrency(value),
                `${name} (${((value / total) * 100).toFixed(1)}%)`,
              ]}
            />
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{ paddingTop: 16, fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Nenhuma despesa encontrada no período selecionado.
          </Typography>
        </Box>
      )}

      {maxCategory && (
        <Alert severity="warning" sx={{ mt: 2, bgcolor: '#FFFDE7', color: '#B74700' }}>
          Maior Impacto: **{maxCategory.name}** ({formatBRLCurrency(maxCategory.value)})
        </Alert>
      )}
    </Card>
  );
};

// --- COMPONENTE PRINCIPAL ---

export function ExpensesReportView() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filterPeriod, setFilterPeriod] = useState<string>('Mensal');
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);

  // Constantes Supabase
  const SUPABASE_URL = 'https://xhetvaflxvoxllspoimz.supabase.co';
  const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoZXR2YWZseHZveGxsc3BvaW16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NTg3NDksImV4cCI6MjA3NzEzNDc0OX0.lkyrirrQm31gnDUAmB4lETpb0pHGGBaM3i32R9FkSrk';

  // --- LÓGICA DE DADOS E FILTRAGEM ---

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/expenses?order=date.desc`, {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      });
      const data = await res.json();
      setExpenses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [SUPABASE_ANON_KEY, SUPABASE_URL]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // Função para filtrar despesas baseada no período (MANTIDA)
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    let startDate: Date | null = null;

    if (filterPeriod === 'Semanal') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
    } else if (filterPeriod === 'Mensal') {
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
    } else if (filterPeriod === 'Anual') {
      startDate = new Date(now);
      startDate.setFullYear(now.getFullYear() - 1);
    }

    if (filterPeriod === 'Todos' || !startDate) {
      return expenses;
    }

    startDate.setHours(0, 0, 0, 0);

    return expenses.filter((e) => new Date(e.date) >= startDate!);
  }, [expenses, filterPeriod]);

  // Cálculos para o Gráfico e Totais (MANTIDA)
  const reportData = useMemo(() => {
    const categoryMap = filteredExpenses.reduce(
      (map, expense) => {
        map[expense.category] = (map[expense.category] || 0) + expense.amount;
        return map;
      },
      {} as Record<string, number>
    );

    const pieData: PieChartData[] = Object.keys(categoryMap).map((category) => ({
      name: category,
      value: categoryMap[category],
    }));

    const totalSpent = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);

    return { pieData, totalSpent };
  }, [filteredExpenses]);

  // --- NOVO: Lógica para Gráfico de Tendência e Média Histórica ---

  const monthlyTrendData = useMemo(() => {
    // Agrupa todos os gastos por Mês/Ano (para o gráfico de evolução)
    const monthlyMap = expenses.reduce(
      (map, expense) => {
        const date = new Date(expense.date);
        const monthYear = `${date.toLocaleString('pt-BR', { month: 'short', year: '2-digit' })}`;
        map[monthYear] = (map[monthYear] || 0) + expense.amount;
        return map;
      },
      {} as Record<string, number>
    );

    const trend: TrendData[] = Object.keys(monthlyMap).map((key) => ({
      name: key,
      total: monthlyMap[key],
    }));

    // Ordena os dados cronologicamente
    trend.sort((a, b) => {
      const [aMonth, aYear] = a.name.split(' ');
      const [bMonth, bYear] = b.name.split(' ');
      // Mapeamento simples de mês (pode falhar com abreviações não padronizadas)
      const monthOrder: Record<string, number> = {
        jan: 0,
        fev: 1,
        mar: 2,
        abr: 3,
        mai: 4,
        jun: 5,
        jul: 6,
        ago: 7,
        set: 8,
        out: 9,
        nov: 10,
        dez: 11,
      };
      const dateA = new Date(parseInt(`20${aYear}`), monthOrder[aMonth.toLowerCase()], 1);
      const dateB = new Date(parseInt(`20${bYear}`), monthOrder[bMonth.toLowerCase()], 1);

      return dateA.getTime() - dateB.getTime();
    });

    return trend;
  }, [expenses]);

  const historicalAverage = useMemo(() => {
    const totalMonths = monthlyTrendData.length;
    if (totalMonths === 0) return 0;

    const totalHistoricalSpent = monthlyTrendData.reduce((acc, data) => acc + data.total, 0);
    // Usa um mínimo de 2 meses para calcular a média e evitar picos irreais
    const relevantMonths = Math.max(2, totalMonths);

    return totalHistoricalSpent / relevantMonths;
  }, [monthlyTrendData]);

  // --- LÓGICA DE EDIÇÃO E DELEÇÃO (MANTIDA) ---

  const handleOpenEdit = (expense: Expense) => setEditExpense(expense);
  const handleCloseEdit = () => setEditExpense(null);

  const handleSaveEdit = async () => {
    if (!editExpense || !editExpense.id || editExpense.amount <= 0) return;

    // ... (Lógica de PATCH Supabase omitida para brevidade, pois já estava correta)
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/expenses?id=eq.${editExpense.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          title: editExpense.title,
          category: editExpense.category,
          amount: editExpense.amount,
          date: editExpense.date.split('T')[0],
          paid_by: editExpense.paid_by,
        }),
      });

      if (res.ok) {
        handleCloseEdit();
        fetchExpenses();
        alert('Despesa atualizada com sucesso!');
      } else {
        alert('Erro ao salvar edição.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao salvar edição.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja deletar este gasto?')) return;

    // ... (Lógica de DELETE Supabase omitida para brevidade, pois já estava correta)
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/expenses?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      });

      if (res.ok) {
        fetchExpenses();
        alert('Despesa deletada.');
      } else {
        alert('Erro ao deletar despesa.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao deletar despesa.');
    }
  };

  // --- SUBCOMPONENTE DE GRÁFICO DE TENDÊNCIA ---

  const CustomTrendChart = ({ data, average }: { data: TrendData[]; average: number }) => {
    const isOverAverage = filterPeriod === 'Mensal' && reportData.totalSpent > average;
    const difference = reportData.totalSpent - average;

    return (
      <Card sx={{ p: 3, boxShadow: 8, height: '100%', minHeight: 400 }}>
        <Typography variant="h6" sx={{ mb: 1, color: '#5c5259' }}>
          2. Alerta de Performance Mensal
        </Typography>

        {/* CARD CHOCANTE - ALERTA */}
        <Card
          sx={{
            p: 2,
            mb: 2,
            bgcolor: isOverAverage ? '#FF4B4B' : '#388E3C', // Vermelho para Perigo, Verde para Controle
            color: '#fff',
            textAlign: 'center',
          }}
        >
          <Typography variant="h4" sx={{ mb: 0.5 }}>
            {filterPeriod === 'Mensal'
              ? isOverAverage
                ? '🚨 ACIMA DO ALVO 🚨'
                : '✅ NO CONTROLE ✅'
              : 'Análise de Média'}
          </Typography>
          {filterPeriod === 'Mensal' && average > 0 && (
            <Typography variant="h5">
              Desvio: **{formatBRLCurrency(Math.abs(difference))}**
            </Typography>
          )}
          <Typography variant="body2">Média Histórica: {formatBRLCurrency(average)}</Typography>
        </Card>
        {/* FIM CARD CHOCANTE */}

        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, color: '#5c5259' }}>
          Evolução Mensal Total
        </Typography>

        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0097A7" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#0097A7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" interval="preserveStartEnd" tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={(value) => `R$ ${value.toFixed(0)}`} domain={[0, 'auto']} />
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <Tooltip formatter={(value: number) => formatBRLCurrency(value)} />
              {/* Linha de Referência da Média Histórica */}
              <Area
                type="monotone"
                dataKey="total"
                stroke="#0097A7"
                fillOpacity={1}
                fill="url(#colorTotal)"
              />
              {average > 0 && (
                <Area
                  type="monotone"
                  dataKey={() => average} // Renderiza a média como uma linha horizontal
                  strokeDasharray="5 5"
                  stroke="#FF4B4B"
                  dot={false}
                  name={`Média Histórica (${formatBRLCurrency(average)})`}
                  fill="none"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <Box
            sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Typography variant="body2" color="text.secondary">
              Dados insuficientes para análise de tendência.
            </Typography>
          </Box>
        )}
      </Card>
    );
  };

  // --- JSX PRINCIPAL ---

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3, maxWidth: '100%', mx: 'auto' }}>
        <Typography variant="h3" sx={{ mb: 1, color: '#FF4B4B', fontWeight: 800 }}>
          Relatórios de Impacto Financeiro 🚨
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Dashboard de análise, tendência e gerenciamento de despesas.
        </Typography>

        {/* CONTROLES E FILTROS */}
        <Card sx={{ p: 3, mb: 4, boxShadow: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <Typography variant="subtitle1">Análise de Período:</Typography>
            <TextField
              select
              size="small"
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              sx={{ minWidth: 120 }}
            >
              {PERIODS.map((p) => (
                <MenuItem key={p} value={p}>
                  {p}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </Card>

        {/* DASHBOARD DE VISUALIZAÇÃO (GRID TRÊS COLUNAS) */}
        <Grid container spacing={3}>
          {/* Bloco 1: Métrica de Sumário (Mantido, com cores atualizadas) */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card
              sx={{
                p: 3,
                boxShadow: 8,
                height: '100%',
                bgcolor: '#43A047',
                color: '#fff',
                minHeight: 180,
              }}
            >
              <Typography variant="h4" sx={{ mb: 1 }}>
                Total Gasto ({filterPeriod})
              </Typography>
              <Typography variant="h2" sx={{ fontWeight: 700 }}>
                {loading ? '...' : formatBRLCurrency(reportData.totalSpent)}
              </Typography>
              <Typography variant="body2" sx={{ mt: 2 }}>
                Gastos em **{filterPeriod}**.
              </Typography>
            </Card>
          </Grid>

          {/* Bloco 2: Alerta de Performance e Tendência (NOVO) */}
          <Grid size={{ xs: 12, md: 8 }}>
            <CustomTrendChart data={monthlyTrendData} average={historicalAverage} />
          </Grid>

          {/* Bloco 3: Gráfico de Distribuição */}
          <Grid size={{ xs: 12, md: 6 }}>
            <CustomPieChart data={reportData.pieData} total={reportData.totalSpent} />
          </Grid>

          {/* Bloco 4: Tabela de Detalhes */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h5" sx={{ mt: 0, mb: 2, color: '#5c5259' }}>
              3. Detalhes e Ações
            </Typography>

            <Paper sx={{ width: '100%', overflow: 'hidden', boxShadow: 3 }}>
              <TableContainer sx={{ maxHeight: 500 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Data</TableCell>
                      <TableCell>Título</TableCell>
                      <TableCell>Categoria</TableCell>
                      <TableCell>Pago por</TableCell>
                      <TableCell align="right">Valor</TableCell>
                      <TableCell align="center">Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <CircularProgress size={24} sx={{ color: '#0097A7' }} />
                        </TableCell>
                      </TableRow>
                    ) : filteredExpenses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          Nenhum gasto para este período.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredExpenses.map((expense) => (
                        <TableRow key={expense.id} hover>
                          <TableCell>
                            {new Date(expense.date).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell>{expense.title}</TableCell>
                          <TableCell>
                            <Chip
                              label={expense.category}
                              size="small"
                              variant="outlined"
                              sx={{ borderColor: '#0097A7', color: '#0097A7' }}
                            />
                          </TableCell>
                          <TableCell>{expense.paid_by}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, color: '#FF4B4B' }}>
                            {formatBRLCurrency(expense.amount)}
                          </TableCell>
                          <TableCell align="center">
                            <Stack direction="row" spacing={1} justifyContent="center">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleOpenEdit(expense)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDelete(expense.id)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>

        {/* MODAL DE EDIÇÃO (MANTIDO) */}
        <Dialog open={!!editExpense} onClose={handleCloseEdit}>
          <DialogTitle sx={{ color: '#0097A7' }}>Editar Gasto</DialogTitle>
          <DialogContent sx={{ pt: '10px !important' }}>
            <Stack spacing={2} sx={{ mt: 1, minWidth: 350 }}>
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
                    prev ? { ...prev, amount: parseFloat(e.target.value) || 0 } : null
                  )
                }
              />
              <DatePicker
                label="Data"
                value={
                  editExpense && editExpense.date ? new Date(editExpense.date.split('T')[0]) : null
                }
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
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseEdit}>Cancelar</Button>
            <Button
              variant="contained"
              onClick={handleSaveEdit}
              sx={{ bgcolor: '#0097A7', '&:hover': { bgcolor: '#006064' } }}
            >
              Salvar
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
}
