import { useState, useMemo } from 'react';

import AddIcon from '@mui/icons-material/Add';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import {
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  Card,
  Stack,
  InputAdornment,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';

// CORREÇÃO: Mudança para named import para resolver o erro "has no default export".
import { Iconify } from 'src/components/iconify';

// --- FUNÇÕES DE UTILIDADE ---

// Função de formatação para exibir o valor em tempo real
const formatBRLCurrencyDisplay = (value: string | number) => {
  const num = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;
  if (isNaN(num)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(num);
};

// --- COMPONENTE CUSTOMIZADO: CAMPO DE VALOR EM DESTAQUE ---

const CurrencyField = ({
  amount,
  setAmount,
}: {
  amount: string;
  setAmount: (value: string) => void;
}) => {
  // Calcula o valor formatado para o preview
  const formattedPreview = useMemo(() => formatBRLCurrencyDisplay(amount), [amount]);

  return (
    <Card
      sx={{
        p: 3,
        mt: 2,
        mb: 3,
        bgcolor: '#f9f9f9', // Fundo leve para o campo de valor
        boxShadow: 8, // Sombra para destaque
        minWidth: { xs: '100%', md: '300px' },
        position: 'relative',
        border: amount ? '2px solid #ffb353' : '1px solid #e0e0e0', // Borda colorida se tiver valor
        transition: 'border 0.3s',
      }}
    >
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
        Valor da Despesa
      </Typography>
      <TextField
        fullWidth
        autoFocus
        variant="standard"
        value={amount}
        onChange={(e) => {
          // Remove todos os caracteres que não são dígitos, ponto ou vírgula
          const rawValue = e.target.value.replace(/[^\d,.]/g, '');
          // Normaliza vírgula para ponto e garante apenas um ponto decimal
          const cleanValue = rawValue.replace(',', '.').replace(/(\..*)\./g, '$1');
          setAmount(cleanValue);
        }}
        placeholder="0.00"
        inputProps={{
          style: { textAlign: 'right', fontSize: '2.5rem', fontWeight: 700, lineHeight: 1.2 },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Typography variant="h4" sx={{ color: '#ff6e4a', mr: 1 }}>
                R$
              </Typography>
            </InputAdornment>
          ),
          disableUnderline: true, // Remove a linha do TextField 'standard'
        }}
      />
      {/* Preview de valor formatado no rodapé */}
      <Typography
        variant="caption"
        sx={{
          position: 'absolute',
          bottom: 8,
          left: 16,
          color: '#a3c9a7',
          fontWeight: 600,
        }}
      >
        {formattedPreview}
      </Typography>
    </Card>
  );
};

// --- VIEW PRINCIPAL ---

export function AddExpenseView() {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Alimentação');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState<Date | null>(new Date());
  const [paidBy, setPaidBy] = useState('Gustavo');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const CATEGORIES = [
    'Alimentação',
    'Restaurante',
    'Educação',
    'Gasolina',
    'Lazer',
    'Saúde',
    'Outros',
  ];
  const USERS = ['Gustavo', 'Geovana'];

  // Chaves do Supabase (NOTA: Em produção, estas deveriam ser variáveis de ambiente)
  const SUPABASE_URL = 'https://xhetvaflxvoxllspoimz.supabase.co';
  const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoZXR2YWZseHZveGxsc3BvaW16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NTg3NDksImV4cCI6MjA3NzEzNDc0OX0.lkyrirrQm31gnDUAmB4lETpb0pHGGBaM3i32R9FkSrk';

  const handleAdd = async () => {
    setError(null);
    setSuccess(null);

    // 1. Validação
    if (!title || !category || !amount || !date || !paidBy) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }

    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('O valor deve ser um número positivo válido.');
      return;
    }

    setLoading(true);

    // 2. Envio para o Supabase
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: 'return=representation',
        },
        body: JSON.stringify([
          {
            title,
            category,
            amount: parsedAmount,
            date: date.toISOString(),
            paid_by: paidBy,
          },
        ]),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(
          `Gasto de ${formatBRLCurrencyDisplay(parsedAmount)} adicionado com sucesso! Pago por ${paidBy}.`
        );
        // Resetar formulário
        setTitle('');
        setAmount('');
        // Mantém a data de hoje por conveniência, mas redefine a categoria e pagador.
        setCategory('Alimentação');
        setPaidBy('Gustavo');
      } else {
        console.error('Erro:', data);
        setError('Erro ao adicionar gasto. Verifique os dados e tente novamente.');
      }
    } catch (err) {
      console.error(err);
      setError('Erro de conexão ao adicionar gasto. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
        {/* CABEÇALHO VISUAL */}
        <Typography variant="h3" sx={{ mb: 1, color: '#5c5259', fontWeight: 800 }}>
          Nova Transação 💳
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Maximize o controle financeiro registrando todos os seus gastos.
        </Typography>

        {/* FEEDBACK DE STATUS (Alertas flutuantes) */}
        <Stack spacing={2} sx={{ mb: 3 }}>
          {success && (
            <Alert severity="success" onClose={() => setSuccess(null)} variant="filled">
              {success}
            </Alert>
          )}
          {error && (
            <Alert severity="error" onClose={() => setError(null)} variant="filled">
              {error}
            </Alert>
          )}
        </Stack>

        {/* CARD PRINCIPAL (Formulário Elevado) */}
        <Card sx={{ p: { xs: 3, md: 5 }, borderRadius: 3, boxShadow: 10 }}>
          {/* CAMPO DE VALOR EM DESTAQUE (o "nunca visto antes") */}
          <CurrencyField amount={amount} setAmount={setAmount} />

          <Grid container spacing={3}>
            {/* TÍTULO E CATEGORIA */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Título da Despesa"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                select
                label="Categoria"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* DATA E QUEM PAGOU */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <DatePicker
                label="Data da Transação"
                value={date}
                onChange={(newDate) => setDate(newDate)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                select
                label="Quem pagou?"
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
              >
                {USERS.map((u) => (
                  <MenuItem key={u} value={u}>
                    {u}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>

          {/* BOTÃO DE SUBMISSÃO COM LOADING */}
          <Box sx={{ mt: 5, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              size="large"
              // CORREÇÃO: Usando o AddIcon do MUI em vez do Iconify problemático
              startIcon={loading ? null : <AddIcon />}
              onClick={handleAdd}
              disabled={loading}
              sx={{
                bgcolor: '#ffb353', // Cor vibrante do seu tema
                color: '#fff',
                '&:hover': { bgcolor: '#ff9823' },
                py: 1.5,
                minWidth: 180,
                boxShadow: '0 4px 10px 0 rgba(255, 179, 83, 0.4)', // Sombra para o botão
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Confirmar Gasto'}
            </Button>
          </Box>
        </Card>
      </Box>
    </LocalizationProvider>
  );
}
