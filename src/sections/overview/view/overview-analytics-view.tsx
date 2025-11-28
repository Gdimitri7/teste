import { ptBR } from 'date-fns/locale/pt-BR';
import { startOfMonth, startOfWeek, format } from 'date-fns';
import { useEffect, useState, useMemo, useCallback } from 'react';
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
import Table from '@mui/material/Table';
import Paper from '@mui/material/Paper';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

// Recharts (Para o gráfico de tendência)
import { DashboardContent } from 'src/layouts/dashboard'; // Importação assumida

import { Chart } from 'src/components/chart'; // Importação assumida
import { SvgColor } from 'src/components/svg-color'; // Importação assumida

import { AnalyticsWidgetSummary } from '../analytics-widget-summary'; // Importação assumida

// --- INTERFACES ---------------------------------------------------------

interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  paid_by: string;
}

interface EventRow {
  id: string;
  title: string;
  description?: string | null;
  date: string; // 'YYYY-MM-DD'
  time: string; // 'HH:MM:SS'
}

interface CategorizedChartData {
  series: number[];
  labels: string[];
}

interface MonthlyTrendData {
  name: string; // Ex: 'Jan 24'
  total: number;
}

// --- FUNÇÃO NATIVA DE FORMATAÇÃO DE MOEDA ---
const formatBRLCurrency = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || value === 0) return 'R$ 0,00';
  const num = typeof value === 'string' ? parseFloat(value) : value;

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(num);
};

// --- CUSTOM HOOK PARA DADOS DO SUPABASE (Refatorado e Otimizado) ---

const useSupabaseData = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  // NOTA: Chaves de segurança
  const SUPABASE_URL = 'https://xhetvaflxvoxllspoimz.supabase.co';
  const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoZXR2YWZseHZveGxsc3BvaW16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NTg3NDksImV4cCI6MjA3NzEzNDc0OX0.lkyrirrQm31gnDUAmB4lETpb0pHGGBaM3i32R9FkSrk';

  const fetchExpenses = useCallback(async () => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/expenses?order=date.desc`, {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      });
      const data = await res.json();
      setExpenses(data);
    } catch (err) {
      console.error('Erro ao buscar despesas:', err);
      setExpenses([]);
    }
  }, [SUPABASE_ANON_KEY, SUPABASE_URL]);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/events?order=date.asc&order=time.asc`, {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      });
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erro ao buscar eventos:', err);
      setEvents([]);
    }
  }, [SUPABASE_ANON_KEY, SUPABASE_URL]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchExpenses(), fetchEvents()]);
      setLoading(false);
    };
    fetchData();
  }, [fetchExpenses, fetchEvents]);

  // --- CÁLCULOS CHAVE ---

  const now = new Date();

  // 1. Gastos Semanais
  const weeklyExpensesTotal = useMemo(() => {
    const startOfThisWeek = startOfWeek(now, { weekStartsOn: 1, locale: ptBR });
    return expenses
      .filter((e) => new Date(e.date) >= startOfThisWeek)
      .reduce((acc, e) => acc + e.amount, 0);
  }, [expenses, now]);

  // 2. Total de Gastos Mensais
  const monthlyExpensesTotal = useMemo(() => {
    const startOfThisMonth = startOfMonth(now);
    return expenses
      .filter((e) => new Date(e.date) >= startOfThisMonth)
      .reduce((acc, e) => acc + e.amount, 0);
  }, [expenses, now]);

  // 3. Dados de Tendência Mensal
  const monthlyTrendData = useMemo(() => {
    const monthlyMap = expenses.reduce(
      (map, expense) => {
        const date = new Date(expense.date);
        // Formato 'MMM yy' (Ex: Nov 25)
        const monthYear = format(date, 'MMM yy', { locale: ptBR });
        map[monthYear] = (map[monthYear] || 0) + expense.amount;
        return map;
      },
      {} as Record<string, number>
    );

    // Converte e ordena pela data real para garantir a ordem cronológica
    const trend: MonthlyTrendData[] = Object.keys(monthlyMap).map((key) => ({
      name: key,
      total: monthlyMap[key],
    }));

    trend.sort((a, b) => {
      const dateA = new Date(a.name.replace(' ', ' 1, 20'));
      const dateB = new Date(b.name.replace(' ', ' 1, 20'));
      return dateA.getTime() - dateB.getTime();
    });
    return trend;
  }, [expenses]);

  // 4. Média Histórica (Para Alerta de Desvio)
  const historicalMonthlyAverage = useMemo(() => {
    const totalMonths = monthlyTrendData.length;
    if (totalMonths < 2) return 0; // Precisa de pelo menos 2 meses para média

    const totalHistoricalSpent = monthlyTrendData.reduce((acc, data) => acc + data.total, 0);
    return totalHistoricalSpent / totalMonths;
  }, [monthlyTrendData]);

  // 5. Próximo Evento
  const nextEventData = useMemo(() => {
    const today = new Date();
    const futureEvents = events
      .map((e) => ({ ...e, eventDate: new Date(`${e.date}T${e.time}`) }))
      .filter((e) => e.eventDate > today) // Estritamente futuro
      .sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime());

    return futureEvents[0] || null;
  }, [events]);

  const daysUntilNextEvent = useMemo(() => {
    if (!nextEventData) return 0;
    const diffTime = nextEventData.eventDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }, [nextEventData, now]);

  // 6. Despesas Recentes (últimas 5)
  const recentExpenses = useMemo(() => expenses.slice(0, 5), [expenses]);

  // 7. Despesas por Categoria para Gráfico
  const expensesByCategory: CategorizedChartData = useMemo(() => {
    const categoryMap = expenses.reduce(
      (map, expense) => {
        map[expense.category] = (map[expense.category] || 0) + expense.amount;
        return map;
      },
      {} as Record<string, number>
    );

    const total = Object.values(categoryMap).reduce((sum, val) => sum + val, 0);

    // Retorna porcentagem para o gráfico de Rosca
    return {
      series: total > 0 ? Object.values(categoryMap).map((value) => (value / total) * 100) : [],
      labels: Object.keys(categoryMap),
    };
  }, [expenses]);

  // 8. Total de Eventos Futuros
  const futureEventsTotal = events.filter(
    (e) => new Date(`${e.date}T${e.time}`) > new Date()
  ).length;

  return {
    loading,
    weeklyExpensesTotal,
    monthlyExpensesTotal,
    historicalMonthlyAverage,
    monthlyTrendData,
    nextEventData,
    daysUntilNextEvent,
    recentExpenses,
    expensesByCategory,
    futureEventsTotal,
  };
};

// --- COMPONENTES VISUAIS AUXILIARES ---

// Componente para o Gráfico de Área (Tendência)
function AnalyticsMonthlyTrend({ data, average }: { data: MonthlyTrendData[]; average: number }) {
  const chartHeight = 300;

  return (
    <Card sx={{ p: 3, boxShadow: 8, height: '100%' }}>
      <Typography variant="h6" sx={{ mb: 1, color: '#5c5259' }}>
        Tendência de Gastos Mensais 📉
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Média Histórica:{' '}
        <span style={{ fontWeight: 700, color: '#FF4B4B' }}>{formatBRLCurrency(average)}</span>
      </Typography>

      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0097A7" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#0097A7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="name" interval="preserveStartEnd" tick={{ fontSize: 10 }} />
            <YAxis
              tickFormatter={(value: number) => `R$ ${value.toFixed(0)}`}
              domain={[0, 'auto']}
            />
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <Tooltip
              formatter={(value: number, name: string) => [
                formatBRLCurrency(value),
                name === 'total' ? 'Total' : name,
              ]}
              labelFormatter={(label: string) => `Mês: ${label}`}
            />

            {/* Área dos Dados Reais */}
            <Area
              type="monotone"
              dataKey="total"
              stroke="#0097A7"
              fillOpacity={1}
              fill="url(#colorTotal)"
              name="Total Gasto"
            />

            {/* Linha de Média Histórica (Alerta) */}
            {average > 0 && (
              <Area
                type="monotone"
                dataKey={() => average}
                strokeDasharray="5 5"
                stroke="#FF4B4B"
                dot={false}
                name="Média Histórica"
                fill="none"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <Box
          sx={{
            height: chartHeight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Dados insuficientes (mínimo 2 meses) para análise de tendência.
          </Typography>
        </Box>
      )}
    </Card>
  );
}

// Componente para o Gráfico de Categoria
function AnalyticsExpensesByCategory({
  title,
  chart,
}: {
  title: string;
  chart: CategorizedChartData;
}) {
  const chartOptions = {
    labels: chart.labels,
    series: chart.series,
    colors: ['#FF4B4B', '#0097A7', '#FBC02D', '#9C27B0', '#039BE5', '#FF7043', '#388E3C'], // Cores vibrantes
    chart: { toolbar: { show: false } },
    legend: { show: true, position: 'bottom' as const },
    // Mostra o valor percentual no rótulo
    dataLabels: { enabled: true, formatter: (val: number) => `${val.toFixed(1)}%` },
    tooltip: {
      fillSeriesColor: false,
      y: {
        formatter: (val: number) => `${val.toFixed(1)}%`, // Formata o tooltip para %
      },
    },
    plotOptions: { pie: { donut: { labels: { show: true } } } },
  };

  return (
    <Card sx={{ p: 3, boxShadow: 8, height: '100%' }}>
      <Typography variant="h6" sx={{ mb: 3 }}>
        {title} 💸
      </Typography>
      {chart.series.length > 0 ? (
        <Box sx={{ height: 350, '& .apexcharts-canvas': { height: '100%' } }}>
          <Chart dir="ltr" type="donut" series={chart.series} options={chartOptions} />
        </Box>
      ) : (
        <Box sx={{ height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Sem dados de despesas para exibir.
          </Typography>
        </Box>
      )}
    </Card>
  );
}

// Componente para a Lista de Despesas Recentes
function AnalyticsRecentExpenses({ title, list }: { title: string; list: Expense[] }) {
  return (
    <Card sx={{ p: 3, boxShadow: 8, height: '100%' }}>
      <Typography variant="h6" sx={{ mb: 3 }}>
        {title} 🧾
      </Typography>
      <TableContainer component={Paper} elevation={0} sx={{ maxHeight: 350 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Título</TableCell>
              <TableCell>Categoria</TableCell>
              <TableCell align="right">Valor</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {list.map((row: Expense) => (
              <TableRow key={row.id}>
                <TableCell>{row.title}</TableCell>
                <TableCell>{row.category}</TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle2" color="error">
                    {formatBRLCurrency(row.amount)}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
            {list.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} sx={{ textAlign: 'center' }}>
                  Nenhuma despesa recente registrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}

// --- VISÃO PRINCIPAL (Refatorada) ---

export function OverviewAnalyticsView() {
  const {
    loading,
    weeklyExpensesTotal,
    monthlyExpensesTotal,
    historicalMonthlyAverage,
    monthlyTrendData,
    nextEventData,
    daysUntilNextEvent,
    recentExpenses,
    expensesByCategory,
    futureEventsTotal,
  } = useSupabaseData();

  // Função auxiliar para formatar datas e horas
  const formatDate = (d: Date) => format(d, 'dd/MMM/yyyy', { locale: ptBR });
  const formatTime = (d: Date) => format(d, 'HH:mm');

  // Cálculo de Desvio Mensal
  const monthlyDeviation = monthlyExpensesTotal - historicalMonthlyAverage;
  const isOverBudget = monthlyDeviation > 0 && historicalMonthlyAverage > 0;

  if (loading) {
    return (
      <DashboardContent maxWidth="xl">
        <Box
          sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}
        >
          <CircularProgress size={50} sx={{ color: '#00B8D9' }} />
          <Typography variant="h5" sx={{ ml: 2, color: 'text.secondary' }}>
            Carregando dados do Supabase...
          </Typography>
        </Box>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent maxWidth="xl">
      <Grid container spacing={3}>
        {/* SAUDAÇÃO INICIAL (100% de Largura) */}
        <Grid size={{ xs: 12 }}>
          <Typography variant="h3" sx={{ mb: 1, color: '#0097A7', fontWeight: 700 }}>
            Dashboard de Impacto Financeiro 📊
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Confira as últimas métricas, tendências de gastos e o seu planejamento.
          </Typography>
        </Grid>

        {/* LINHA 1: KEY METRICS - 4 CARDS */}

        {/* 1. Gastos Semanais (Foco: Curto Prazo) */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Gastos Semanais"
            total={weeklyExpensesTotal}
            percent={0} // Percentual de alteração deve ser calculado contra a semana anterior, mas é mockado aqui.
            color="warning"
            icon={
              <SvgColor
                src="/assets/icons/navbar/ic-conta.svg"
                sx={{ color: '#fff', width: 50, height: 50 }}
              />
            }
            sx={{ bgcolor: '#FF4B4B', color: '#fff' }} // Vermelho de alerta para gastos
            chart={{ series: [50, 60, 70, 80], categories: ['Seg', 'Ter', 'Qua', 'Qui'] }}
          >
            <Typography variant="caption" color="#fff" display="block">
              Comparado ao total semanal esperado.
            </Typography>
          </AnalyticsWidgetSummary>
        </Grid>

        {/* 2. Total de Gastos Mensais + ALERTA DE DESVIO */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Total Mensal"
            total={monthlyExpensesTotal}
            // Usa o desvio percentual como indicador
            percent={
              historicalMonthlyAverage > 0 ? (monthlyDeviation / historicalMonthlyAverage) * 100 : 0
            }
            color={isOverBudget ? 'error' : 'success'}
            icon={
              <SvgColor
                src="/assets/icons/navbar/ic-reports.svg"
                sx={{ color: '#fff', width: 50, height: 50 }}
              />
            }
            sx={{
              bgcolor: isOverBudget ? '#C62828' : '#2E7D32', // Cor baseada no desvio
              color: '#fff',
            }}
            chart={{
              series: [20, 41, 63, 33, 56, 35, 60],
              categories: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7'],
            }}
          >
            <Typography variant="caption" color="#fff" display="block" sx={{ fontWeight: 700 }}>
              {isOverBudget
                ? `Desvio: ${formatBRLCurrency(monthlyDeviation)}`
                : `Abaixo do alvo: ${formatBRLCurrency(Math.abs(monthlyDeviation))}`}
            </Typography>
          </AnalyticsWidgetSummary>
        </Grid>

        {/* 3. Próximo Evento (Foco: Ação Imediata) */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title={nextEventData ? `${nextEventData.title}` : 'Sem Eventos'}
            total={daysUntilNextEvent}
            percent={0}
            icon={
              <SvgColor
                src="/assets/icons/navbar/ic-agenda.svg"
                sx={{ color: '#fff', width: 50, height: 50 }}
              />
            }
            sx={{ bgcolor: '#0097A7', color: '#fff' }} // Azul de planejamento
            chart={{ categories: ['Dias'], series: [daysUntilNextEvent] }}
          >
            {nextEventData ? (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="#fff" sx={{ fontWeight: 700 }}>
                  Em {daysUntilNextEvent} {daysUntilNextEvent === 1 ? 'dia' : 'dias'}
                </Typography>
                <Typography variant="caption" color="#fff" display="block">
                  {formatDate(nextEventData.eventDate)} às {formatTime(nextEventData.eventDate)}
                </Typography>
              </Box>
            ) : (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="#fff">
                  Nenhum evento futuro encontrado.
                </Typography>
              </Box>
            )}
          </AnalyticsWidgetSummary>
        </Grid>

        {/* 4. Total de Eventos Futuros */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Total de Compromissos"
            total={futureEventsTotal}
            percent={0}
            color="info"
            icon={
              <SvgColor
                src="/assets/icons/navbar/ic-vision.svg"
                sx={{ color: '#fff', width: 50, height: 50 }}
              />
            }
            sx={{ bgcolor: '#FFB353', color: '#fff' }} // Laranja de atenção
            chart={{ series: [10, 5, 15, 20], categories: ['Q1', 'Q2', 'Q3', 'Q4'] }}
          >
            <Typography variant="caption" color="#fff" display="block">
              Total planejado a partir de hoje.
            </Typography>
          </AnalyticsWidgetSummary>
        </Grid>

        {/* LINHA 2: GRÁFICOS E LISTAS DETALHADAS */}

        {/* 5. Gráfico de Tendência Mensal (FATOR UAU) */}
        <Grid size={{ xs: 12, md: 6 }}>
          <AnalyticsMonthlyTrend data={monthlyTrendData} average={historicalMonthlyAverage} />
        </Grid>

        {/* 6. Despesas por Categoria (VISUAL) */}
        <Grid size={{ xs: 12, md: 6 }}>
          <AnalyticsExpensesByCategory
            title="Distribuição de Despesas (Total)"
            chart={expensesByCategory}
          />
        </Grid>

        {/* LINHA 3: DETALHES */}

        {/* 7. Despesas Recentes (VISUAL) */}
        <Grid size={{ xs: 12 }}>
          <AnalyticsRecentExpenses title="Últimas 5 Transações Registradas" list={recentExpenses} />
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
