import { useState, useMemo, useEffect } from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';

import { DashboardContent } from 'src/layouts/dashboard';

interface StockEntry {
  id?: number;
  month: string;
  name: string;
  quantity: number;
  unit_price: number;
  date?: string;
}

const months = [
  'JANEIRO','FEVEREIRO','MARÇO','ABRIL','MAIO','JUNHO','JULHO','AGOSTO',
  'SETEMBRO','OUTUBRO','NOVEMBRO','DEZEMBRO'
];

const SUPABASE_URL = 'https://xhetvaflxvoxllspoimz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoZXR2YWZseHZveGxsc3BvaW16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NTg3NDksImV4cCI6MjA3NzEzNDc0OX0.lkyrirrQm31gnDUAmB4lETpb0pHGGBaM3i32R9FkSrk';

export function StocksView() {
  const [entries, setEntries] = useState<StockEntry[]>([]);
  const [form, setForm] = useState({ month: months[0], name: '', quantity: 0, unit_price: 0 });

  const fetchEntries = async () => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/stocks?select=*`, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      const data = await res.json();
      setEntries(data);
    } catch(err) {
      console.error('Erro ao buscar dados:', err);
    }
  };

  useEffect(() => { fetchEntries(); }, []);

  const handleChange = (field: string, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleAdd = async () => {
    if (!form.name || form.quantity <= 0 || form.unit_price <= 0) return;

    const body = [{
      month: form.month,
      name: form.name,
      quantity: form.quantity,
      unit_price: form.unit_price
    }];

    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/stocks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: 'return=representation'
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (res.ok) {
        setEntries(prev => [...prev, ...data]);
        setForm({ ...form, name: '', quantity: 0, unit_price: 0 });
      } else {
        console.error('Erro ao adicionar:', data);
      }
    } catch(err) {
      console.error('Erro ao adicionar:', err);
    }
  };

  const handleDelete = async (id?: number, idx?: number) => {
    if (!id) return;

    try {
      await fetch(`${SUPABASE_URL}/rest/v1/stocks?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`
        }
      });

      if (idx !== undefined) setEntries(prev => prev.filter((_, i) => i !== idx));
    } catch(err) {
      console.error('Erro ao deletar:', err);
    }
  };

  const monthlyTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    months.forEach(month => {
      totals[month] = entries
        .filter(e => e.month === month)
        .reduce((acc, e) => acc + e.quantity * e.unit_price, 0);
    });
    return totals;
  }, [entries]);

  const totalAno = useMemo(
    () => Object.values(monthlyTotals).reduce((acc, val) => acc + val, 0),
    [monthlyTotals]
  );

  return (
    <DashboardContent maxWidth="xl">
      {/* Formulário */}
      <Box mb={3}>
        <Typography variant="h5">Adicionar Ação</Typography>
        <Grid container spacing={2} alignItems="center" mt={1}>
          <Grid size={{ xs:12, sm:3 }}>
            <TextField select fullWidth label="Mês" value={form.month} onChange={e=>handleChange('month', e.target.value)} SelectProps={{ native:true }}>
              {months.map(m => <option key={m} value={m}>{m}</option>)}
            </TextField>
          </Grid>
          <Grid size={{ xs:12, sm:3 }}>
            <TextField label="Nome da Ação" value={form.name} onChange={e=>handleChange('name', e.target.value)} fullWidth />
          </Grid>
          <Grid size={{ xs:12, sm:3 }}>
            <TextField type="number" label="Quantidade" value={form.quantity} onChange={e=>handleChange('quantity', Number(e.target.value))} fullWidth />
          </Grid>
          <Grid size={{ xs:12, sm:3 }}>
            <TextField type="number" label="Preço Unitário (R$)" value={form.unit_price} onChange={e=>handleChange('unit_price', Number(e.target.value))} fullWidth />
          </Grid>
          <Grid size={{ xs:12, sm:3 }}>
            <Button variant="contained" color="primary" onClick={handleAdd} fullWidth>Adicionar</Button>
          </Grid>
        </Grid>
      </Box>

      {/* Cards mensais */}
      {months.map((month, index) => {
        const monthEntries = entries.filter(e => e.month === month);
        const isEven = index % 2 === 0;

        return (
          <Box key={month} mb={4} sx={{ p:2, borderRadius:2, border:'1px solid', borderColor:'divider', boxShadow:1, backgroundColor:isEven?'background.paper':'grey.100' }}>
            <Typography variant="h6" sx={{ mb:1 }}>{month}</Typography>
            <Box component="table" width="100%" sx={{ borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign:'left', padding:'8px' }}>Nome da Ação</th>
                  <th style={{ textAlign:'right', padding:'8px' }}>Quantidade</th>
                  <th style={{ textAlign:'right', padding:'8px' }}>Preço Unitário (R$)</th>
                  <th style={{ textAlign:'right', padding:'8px' }}>Total Investido (R$)</th>
                  <th style={{ textAlign:'center', padding:'8px' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {monthEntries.map((entry, idx) => (
                  <tr key={entry.id || idx} style={{ position:'relative' }}>
                    <td style={{ padding:'8px' }}>{entry.name}</td>
                    <td style={{ padding:'8px', textAlign:'right' }}>{entry.quantity}</td>
                    <td style={{ padding:'8px', textAlign:'right' }}>{entry.unit_price.toFixed(2)}</td>
                    <td style={{ padding:'8px', textAlign:'right' }}>{(entry.quantity*entry.unit_price).toFixed(2)}</td>
                    <td style={{ padding:'8px', textAlign:'center', width:48 }}>
                      <IconButton size="small" onClick={() => handleDelete(entry.id, idx)} sx={{ opacity:0, transition:'opacity 0.2s','&:hover':{color:'error.main', opacity:1}}}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={4} style={{ padding:'8px', fontWeight:'bold' }}>Total do Mês (R$)</td>
                  <td style={{ padding:'8px', textAlign:'right', fontWeight:'bold' }}>{monthlyTotals[month].toFixed(2)}</td>
                </tr>
              </tbody>
            </Box>
          </Box>
        );
      })}

      {/* Total do Ano */}
      <Box mb={4} sx={{ p:2, borderRadius:2, border:'1px solid', borderColor:'divider', boxShadow:1, backgroundColor:'grey.200' }}>
        <Typography variant="h6" sx={{ mb:1 }}>Total do Ano (R$)</Typography>
        <Typography variant="h5" sx={{ textAlign:'right', fontWeight:'bold' }}>
          {totalAno.toFixed(2)}
        </Typography>
      </Box>

    </DashboardContent>
  );
}
