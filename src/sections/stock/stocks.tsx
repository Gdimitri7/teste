import { useState, useMemo, useEffect, useCallback } from 'react';
// 1. Imports de Terceiros (Recharts)
import {
  ResponsiveContainer,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
} from 'recharts';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
// 2. Imports do MUI/Material (Organizados)
import Typography from '@mui/material/Typography';
import DeleteIcon from '@mui/icons-material/Delete';

// 3. Imports Locais/Componentes
import { DashboardContent } from 'src/layouts/dashboard';

import { Chart } from 'src/components/chart'; // Componente assumido

import { AnalyticsWidgetSummary } from 'src/sections/overview/analytics-widget-summary';
// --- DEFINIÇÕES E INTERFACES ---

interface StockEntry {
  id?: number;
  month: string;
  name: string;
  quantity: number;
  unit_price: number;
  date?: string;
}

interface MonthlyPortfolio {
  month: string;
  total_invested: number;
  weighted_average_price: number;
  total_quantity: number;
  entries: StockEntry[];
}

interface MonthlyTrendData {
  name: string; // Ex: 'JAN'
  total: number;
}

const months = [
  'JANEIRO',
  'FEVEREIRO',
  'MARÇO',
  'ABRIL',
  'MAIO',
  'JUNHO',
  'JULHO',
  'AGOSTO',
  'SETEMBRO',
  'OUTUBRO',
  'NOVEMBRO',
  'DEZEMBRO',
];

const SUPABASE_URL = 'https://xhetvaflxvoxllspoimz.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoZXR2YWZseHZveGxsc3BvaW16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NTg3NDksImV4cCI6MjA3NzEzNDc0OX0.lkyrirrQm31gnDUAmB4lETpb0pHGGBaM3i32R9FkSrk';

// --- UTILS ---

const formatBRLCurrency = (value: number | string | null | undefined) => {
  if (value === null || value === undefined) return 'R$ 0,00';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(num);
};

// --- SUBCOMPONENTE: FORMULÁRIO DE ENTRADA (Inalterado) ---

interface StockFormProps {
  form: { month: string; name: string; quantity: number; unit_price: number };
  handleChange: (field: string, value: string | number) => void;
  handleAdd: () => Promise<void>;
}

function StockForm({ form, handleChange, handleAdd }: StockFormProps) {
  return (
    <Card sx={{ p: 3, mb: 4, boxShadow: 5, bgcolor: '#f4f7f9' }}>
      <Typography variant="h5" sx={{ mb: 2, color: '#0097A7' }}>
        Adicionar Transação
      </Typography>
      <Grid container spacing={2} alignItems="center">
        <Grid size={{ xs: 12, sm: 3 }}>
          <TextField
            select
            fullWidth
            label="Mês"
            value={form.month}
            onChange={(e) => handleChange('month', e.target.value)}
          >
            {months.map((m) => (
              <MenuItem key={m} value={m}>
                {m}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <TextField
            label="Nome da Ação"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 2 }}>
          <TextField
            type="number"
            label="Quantidade"
            value={form.quantity || ''}
            onChange={(e) => handleChange('quantity', Number(e.target.value))}
            fullWidth
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 2 }}>
          <TextField
            type="number"
            label="Preço Unitário (R$)"
            value={form.unit_price || ''}
            onChange={(e) => handleChange('unit_price', Number(e.target.value))}
            fullWidth
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleAdd}
            fullWidth
            sx={{ bgcolor: '#0097A7', '&:hover': { bgcolor: '#006064' } }}
          >
            Registrar
          </Button>
        </Grid>
      </Grid>
    </Card>
  );
}

// --- SUBCOMPONENTE: GRÁFICO DE INVESTIMENTO ACUMULADO (Inalterado) ---

function CumulativeChart({ data }: { data: MonthlyTrendData[] }) {
  const cumulativeData = data.reduce(
    (acc, curr, index) => {
      const previousTotal = index > 0 ? acc[index - 1].cumulativeTotal : 0;
      acc.push({
        ...curr,
        cumulativeTotal: previousTotal + curr.total,
      });
      return acc;
    },
    [] as (MonthlyTrendData & { cumulativeTotal: number })[]
  );

  return (
    <Card sx={{ p: 3, boxShadow: 8, height: '100%' }}>
      <Typography variant="h6" sx={{ mb: 1, color: '#5c5259' }}>
        Evolução do Investimento Acumulado (R$)
      </Typography>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={cumulativeData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="name" interval="preserveStartEnd" tick={{ fontSize: 10 }} />
          <YAxis tickFormatter={(value: number) => `R$ ${value.toFixed(0)}`} domain={[0, 'auto']} />
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <Tooltip
            formatter={(value: number) => formatBRLCurrency(value)}
            labelFormatter={(label: string) => `Mês: ${label}`}
          />
          <Area
            type="monotone"
            dataKey="cumulativeTotal"
            stroke="#8884d8"
            fillOpacity={1}
            fill="url(#colorCumulative)"
            name="Total Acumulado"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}

// --- SUBCOMPONENTE: RESUMO MENSAL DETALHADO ---

function MonthlySummary({
  portfolio,
  handleDelete,
}: {
  portfolio: MonthlyPortfolio;
  handleDelete: (id?: number, idx?: number) => Promise<void>;
}) {
  return (
    <Box
      mb={4}
      sx={{
        p: 3,
        borderRadius: 2,
        border: '1px solid',
        borderColor: '#0097A7',
        boxShadow: 3,
        bgcolor: '#E1F5FE',
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" sx={{ color: '#004D40' }}>
          {portfolio.month} - {formatBRLCurrency(portfolio.total_invested)}
        </Typography>
        <Box sx={{ bgcolor: '#0097A7', p: 0.5, px: 1.5, borderRadius: 1 }}>
          <Typography variant="caption" sx={{ color: '#fff', fontWeight: 'bold' }}>
            Preço Médio Ponderado: {formatBRLCurrency(portfolio.weighted_average_price)}
          </Typography>
        </Box>
      </Stack>

      {/* Tabela com correção de estilo CSS para MUI sx */}
      <Box
        component="table"
        width="100%"
        sx={{ borderCollapse: 'collapse', '& td, & th': { borderBottom: '1px solid #ccc' } }}
      >
        <thead>
          <tr style={{ backgroundColor: '#B2EBF2' }}>
            <th style={{ textAlign: 'left', padding: '10px' }}>Nome da Ação</th>
            <th style={{ textAlign: 'right', padding: '10px' }}>Quantidade</th>
            <th style={{ textAlign: 'right', padding: '10px' }}>Preço Unitário</th>
            <th style={{ textAlign: 'right', padding: '10px' }}>Custo (R$)</th>
            <th style={{ textAlign: 'center', padding: '10px', width: 48 }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {portfolio.entries.map((entry, idx) => (
            <Box
              component="tr"
              key={entry.id || idx}
              sx={{
                backgroundColor: '#fff',
                // ✨ CORREÇÃO 1: Usando `sx` no `tr` para permitir `&:hover`
                '&:hover': { backgroundColor: '#F0F8FF' },
              }}
            >
              <td style={{ padding: '10px' }}>{entry.name}</td>
              <td style={{ padding: '10px', textAlign: 'right' }}>{entry.quantity}</td>
              <td style={{ padding: '10px', textAlign: 'right' }}>
                {formatBRLCurrency(entry.unit_price)}
              </td>
              <td
                style={{ padding: '10px', textAlign: 'right', fontWeight: 600, color: '#D32F2F' }}
              >
                {formatBRLCurrency(entry.quantity * entry.unit_price)}
              </td>
              <td style={{ padding: '10px', textAlign: 'center', width: 48 }}>
                <IconButton
                  size="small"
                  onClick={() => handleDelete(entry.id, idx)}
                  sx={{ color: '#D32F2F', '&:hover': { color: '#B71C1C' } }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </td>
            </Box>
          ))}
          <tr style={{ backgroundColor: '#B2EBF2' }}>
            <td colSpan={3} style={{ padding: '10px', fontWeight: 'bold', textAlign: 'right' }}>
              Total do Mês
            </td>
            <td
              style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#004D40' }}
            >
              {formatBRLCurrency(portfolio.total_invested)}
            </td>
            <td style={{ padding: '10px' }} />{' '}
            {/* ✨ CORREÇÃO 2: Deixar a tag 'td' sem conteúdo é aceitável, mas sem self-closing desnecessário */}
          </tr>
        </tbody>
      </Box>
    </Box>
  );
}

// --- VISÃO PRINCIPAL ---

export function StocksView() {
  const [entries, setEntries] = useState<StockEntry[]>([]);
  const [form, setForm] = useState({
    month: months[new Date().getMonth()],
    name: '',
    quantity: 0,
    unit_price: 0,
  });

  // --- FETCH & CRUD LÓGICA (Inalterada) ---

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/stocks?select=*`, {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      });
      const data = await res.json();
      setEntries(data || []);
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleChange = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAdd = async () => {
    if (!form.name || form.quantity <= 0 || form.unit_price <= 0) return;

    const body = [
      {
        month: form.month,
        name: form.name.toUpperCase(),
        quantity: form.quantity,
        unit_price: form.unit_price,
        date: new Date().toISOString().split('T')[0],
      },
    ];

    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/stocks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: 'return=representation',
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok) {
        fetchEntries();
        setForm({ ...form, name: '', quantity: 0, unit_price: 0 });
      } else {
        console.error('Erro ao adicionar:', data);
      }
    } catch (err) {
      console.error('Erro ao adicionar:', err);
    }
  };

  const handleDelete = async (id?: number, idx?: number) => {
    if (!id || !window.confirm('Tem certeza que deseja deletar esta transação?')) return;

    try {
      await fetch(`${SUPABASE_URL}/rest/v1/stocks?id=eq.${id}`, {
        method: 'DELETE',
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      });

      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error('Erro ao deletar:', err);
    }
  };

  // --- CÁLCULOS AVANÇADOS (useMemo) ---

  const portfolioSummary = useMemo(() => {
    const monthlyData: Record<string, MonthlyPortfolio> = {};
    const monthlyTrend: MonthlyTrendData[] = [];
    let totalInvestidoAnual = 0;

    months.forEach((month) => {
      const entriesInMonth = entries.filter((e) => e.month === month);

      const totalInvested = entriesInMonth.reduce((acc, e) => acc + e.quantity * e.unit_price, 0);
      const totalQuantity = entriesInMonth.reduce((acc, e) => acc + e.quantity, 0);

      const weightedAvgPrice = totalQuantity > 0 ? totalInvested / totalQuantity : 0;

      monthlyData[month] = {
        month,
        total_invested: totalInvested,
        weighted_average_price: weightedAvgPrice,
        total_quantity: totalQuantity,
        entries: entriesInMonth,
      };

      totalInvestidoAnual += totalInvested;

      monthlyTrend.push({
        name: month.substring(0, 3),
        total: totalInvested,
      });
    });

    return {
      monthlyData,
      totalInvestidoAnual,
      monthlyTrend,
    };
  }, [entries]);

  const { monthlyData, totalInvestidoAnual, monthlyTrend } = portfolioSummary;

  // --- RENDERIZAÇÃO ---

  return (
    <DashboardContent maxWidth="xl">
      <Typography variant="h3" sx={{ mb: 1, color: '#8884d8', fontWeight: 800 }}>
        Análise de Portfólio de Ações 📈
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Gerencie e visualize a evolução do seu custo de aquisição (PAC) e investimento.
      </Typography>

      {/* 1. FORMULÁRIO DE ENTRADA */}
      <StockForm form={form} handleChange={handleChange} handleAdd={handleAdd} />

      <Grid container spacing={3} mb={5}>
        {/* 2. GRÁFICO DE TENDÊNCIA ACUMULADA (FATOR UAU) */}
        <Grid size={{ xs: 12, md: 6 }}>
          <CumulativeChart data={monthlyTrend} />
        </Grid>

        {/* 3. RESUMO ANUAL (MÉTRICA CHAVE) */}
        <Grid size={{ xs: 12, md: 6 }}>
          <AnalyticsWidgetSummary
            title="CUSTO TOTAL DE AQUISIÇÃO NO ANO"
            total={totalInvestidoAnual}
            percent={0}
            color="info"
            icon={<DeleteIcon />}
            sx={{
              height: '100%',
              minHeight: 360,
              bgcolor: '#8884d8',
              color: '#fff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            // ✨ CORREÇÃO 3: Adicionado o `chart` (mock) que é uma prop requerida
            chart={{ series: [1, 2, 3], categories: ['A', 'B', 'C'] }}
          >
            <Typography variant="h4" sx={{ mt: 2, fontWeight: 700 }}>
              {formatBRLCurrency(totalInvestidoAnual)}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, color: '#fff' }}>
              Soma de todas as entradas registradas.
            </Typography>
          </AnalyticsWidgetSummary>
        </Grid>
      </Grid>

      {/* 4. LISTA DE ENTRADAS MENSAIS DETALHADAS */}
      <Typography variant="h4" sx={{ mb: 3, mt: 3, color: '#5c5259' }}>
        Detalhes por Mês
      </Typography>

      {months.map((month) => {
        const portfolio = monthlyData[month];
        if (portfolio.entries.length === 0) return null;

        return <MonthlySummary key={month} portfolio={portfolio} handleDelete={handleDelete} />;
      })}

      {/* Mensagem de Ausência de Dados */}
      {entries.length === 0 && (
        <Box
          sx={{
            p: 5,
            textAlign: 'center',
            color: 'text.secondary',
            border: '2px dashed #ccc',
            borderRadius: 2,
          }}
        >
          <Typography variant="h6">Nenhuma Transação Registrada</Typography>
          <Typography variant="body1">
            Use o formulário acima para começar a registrar seus investimentos.
          </Typography>
        </Box>
      )}
    </DashboardContent>
  );
}
