import { useEffect, useState, useMemo } from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

import { DashboardContent } from 'src/layouts/dashboard';

import { SvgColor } from 'src/components/svg-color';

import { AnalyticsWidgetSummary } from '../analytics-widget-summary';

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

export function OverviewAnalyticsView() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);

  const SUPABASE_URL = 'https://xhetvaflxvoxllspoimz.supabase.co';
  const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoZXR2YWZseHZveGxsc3BvaW16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NTg3NDksImV4cCI6MjA3NzEzNDc0OX0.lkyrirrQm31gnDUAmB4lETpb0pHGGBaM3i32R9FkSrk';

  // Buscar despesas
  const fetchExpenses = async () => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/expenses?order=date.desc`, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      });
      const data = await res.json();
      setExpenses(data);
    } catch (err) {
      console.error(err);
      setExpenses([]);
    }
  };

  // Buscar eventos
  const fetchEvents = async () => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/events?order=date.asc&order=time.asc`, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      });
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setEvents([]);
    }
  };

  useEffect(() => {
    fetchExpenses();
    fetchEvents();
  }, []);

  // Gastos Semanais
  const weeklyExpensesTotal = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    startOfWeek.setHours(0, 0, 0, 0);

    return expenses
      .filter(e => new Date(e.date) >= startOfWeek)
      .reduce((acc, e) => acc + e.amount, 0);
  }, [expenses]);

  // Próximo evento
  const nextEvent = useMemo(() => {
    const today = new Date();
    const futureEvents = events
      .map(e => ({ ...e, eventDate: new Date(`${e.date}T${e.time}`) }))
      .filter(e => e.eventDate >= today)
      .sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime());
    return futureEvents[0] || null;
  }, [events]);

  const daysUntilNextEvent = useMemo(() => {
    if (!nextEvent) return 0;
    const diffTime = nextEvent.eventDate.getTime() - new Date().getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [nextEvent]);

  const formatDate = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <DashboardContent maxWidth="xl">
      <Grid container spacing={3}>
        {/* Gastos Semanais */}
<Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Gastos Semanais"
            total={weeklyExpensesTotal}
            percent={0}
            color="warning"
 icon={<SvgColor src="/assets/icons/navbar/ic-conta.svg" sx={{ color: '#fff', width: 50, height: 50 }} />} 
            sx={{
    bgcolor: '#a3c9a7 ', // vermelho rosa custom
    color: '#fff',
  }}           
            chart={{
              categories: expenses.map(e => e.category),
              series: expenses.map(e => e.amount),
            }}
          />
        </Grid>

        {/* Dias até próximo evento */}
<Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title={nextEvent ? ` ${nextEvent.title}` : 'Próximo Evento'}
            total={daysUntilNextEvent}
            percent={0}
 icon={<SvgColor src="/assets/icons/navbar/ic-agenda.svg" sx={{ color: '#fff', width: 50, height: 50 }} />} 
             sx={{
    bgcolor: '#ffb353', // vermelho rosa custom
    color: '#fff',
  }}
            chart={{
              categories: ['Dias'],
              series: [daysUntilNextEvent],
            }}
          >
            {nextEvent && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(nextEvent.eventDate)}
                </Typography>
              </Box>
            )}
          </AnalyticsWidgetSummary>
        </Grid>

        {/* Mantém os demais cards */}
<Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Purchase orders"
            percent={2.8}
            total={1723315}
            
 icon={<SvgColor src="/assets/icons/navbar/ic-agenda.svg" sx={{ color: '#fff', width: 50, height: 50 }} />}            
 sx={{
    bgcolor: '#ff6e4a', // vermelho rosa custom
    color: '#fff',
  }}
            chart={{
              categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
              series: [40, 70, 50, 28, 70, 75, 7, 64],
            }}
          />
        </Grid>

<Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Messages"
            percent={3.6}
            total={234}
            sx={{
    bgcolor: '#5c5259', // vermelho rosa custom
    color: '#fff',
  }}
            icon={<img alt="Messages" src="/assets/icons/glass/ic-glass-message.svg" />}
            chart={{
              categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
              series: [56, 30, 23, 54, 47, 40, 62, 73],
            }}
          />
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
