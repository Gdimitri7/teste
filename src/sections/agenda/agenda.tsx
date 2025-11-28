import { ptBR } from 'date-fns/locale';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import ptLocale from '@fullcalendar/core/locales/pt-br';
import interactionPlugin from '@fullcalendar/interaction';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { DateSelectArg, EventClickArg, EventDropArg } from '@fullcalendar/core';
// ✨ CORREÇÃO CRÍTICA

import DeleteIcon from '@mui/icons-material/Delete';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// Imports Avançados do MUI
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Stack,
  IconButton,
  Typography,
  CircularProgress,
} from '@mui/material';

// Importação correta do locale para date-fns

// Definições de Tipo (Melhoradas)
type EventRow = {
  id: string;
  title: string;
  description?: string | null;
  date: string; // 'YYYY-MM-DD'
  time: string; // 'HH:MM:SS'
};

// Interface para o formulário (Estado consolidado)
interface FormState {
  title: string;
  description: string;
  dateTime: Date | null;
}

// --- CONSTANTES ---
const SUPABASE_URL = 'https://xhetvaflxvoxllspoimz.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoZXR2YWZseHZveGxsc3BvaW16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NTg3NDksImV4cCI6MjA3NzEzNDc0OX0.lkyrirrQm31gnDUAmB4lETpb0pHGGBaM3i32R9FkSrk';

// --- UTILS (Formatadores ISO 8601) ---

const formatDateTimeForSupabase = (date: Date): { date: string; time: string } => {
  const isoString = date.toISOString();
  const [datePart, timeWithZ] = isoString.split('T');

  // Pega HH:MM:SS e remove o 'Z'
  const timePart = timeWithZ.substring(0, 8);

  return { date: datePart, time: timePart };
};

// --- COMPONENTE PRINCIPAL ---

export function AgendaView() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editEvent, setEditEvent] = useState<EventRow | null>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState<FormState>({
    title: '',
    description: '',
    dateTime: new Date(),
  });

  // --- LÓGICA DE DADOS (FETCH) ---

  const fetchEvents = useCallback(async () => {
    setLoading(true);
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
      console.error('Erro ao buscar eventos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Formato para o FullCalendar
  const calendarEvents = useMemo(
    () =>
      events.map((e) => ({
        id: e.id,
        title: e.title,
        start: `${e.date}T${e.time}`,
        allDay: false,
        backgroundColor: '#00B8D9', // Cor para destaque visual
        borderColor: '#00B8D9',
        extendedProps: {
          description: e.description,
        },
      })),
    [events]
  );

  // --- HANDLERS DE ABERTURA DE DIALOG ---

  const handleOpenAdd = (start?: Date) => {
    setEditEvent(null);
    setFormData({
      title: '',
      description: '',
      dateTime: start ?? new Date(),
    });
    setOpenDialog(true);
  };

  const handleOpenEdit = (event: EventRow) => {
    setEditEvent(event);
    const combinedDateTime = new Date(`${event.date}T${event.time}`);
    setFormData({
      title: event.title,
      description: event.description ?? '',
      dateTime: combinedDateTime,
    });
    setOpenDialog(true);
  };

  // --- CRUD OPERATIONS ---

  const handleSave = async () => {
    if (!formData.title || !formData.dateTime) {
      alert('Preencha pelo menos o Título e a Data/Hora.');
      return;
    }

    const { date, time } = formatDateTimeForSupabase(formData.dateTime);

    const payload = {
      title: formData.title,
      description: formData.description || null,
      date,
      time,
    };

    try {
      if (editEvent) {
        // Editar
        await fetch(`${SUPABASE_URL}/rest/v1/events?id=eq.${editEvent.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            Prefer: 'return=representation',
          },
          body: JSON.stringify(payload),
        });
      } else {
        // Criar
        await fetch(`${SUPABASE_URL}/rest/v1/events`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            Prefer: 'return=representation',
          },
          body: JSON.stringify([payload]),
        });
      }

      await fetchEvents();
      setOpenDialog(false);
    } catch (err) {
      console.error('Erro ao salvar evento:', err);
      alert('Erro ao salvar evento');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente deletar este evento?')) return;
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/events?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      });
      await fetchEvents();
      setOpenDialog(false);
    } catch (err) {
      console.error('Erro ao deletar evento:', err);
      alert('Erro ao deletar evento');
    }
  };

  // --- FULLCALENDAR INTERACTION HANDLERS ---

  const handleEventClick = (clickInfo: EventClickArg) => {
    const ev = events.find((e) => e.id === clickInfo.event.id);
    if (ev) handleOpenEdit(ev);
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    handleOpenAdd(selectInfo.start);
  };

  // Permite arrastar e soltar eventos
  const handleEventDrop = async (dropInfo: EventDropArg) => {
    const id = dropInfo.event.id;
    const newStart = dropInfo.event.start;

    if (!newStart) return;

    if (
      !confirm(
        `Deseja mover o evento "${dropInfo.event.title}" para ${newStart.toLocaleDateString()} ${newStart.toLocaleTimeString()}?`
      )
    ) {
      dropInfo.revert();
      return;
    }

    const { date, time } = formatDateTimeForSupabase(newStart);

    try {
      await fetch(`${SUPABASE_URL}/rest/v1/events?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: 'return=representation',
        },
        body: JSON.stringify({ date, time }),
      });
      fetchEvents();
    } catch (err) {
      console.error('Erro ao mover evento:', err);
      dropInfo.revert();
      alert('Erro ao mover evento');
    }
  };

  // --- JSX PRINCIPAL ---

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <Box sx={{ p: 3, maxWidth: '100%', mx: 'auto' }}>
        <Typography variant="h3" sx={{ mb: 1, color: '#00B8D9', fontWeight: 800 }}>
          Agenda Inteligente 📅
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Organize e gerencie seus compromissos com arrastar e soltar.
        </Typography>

        {/* Botão de Adicionar Evento */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleOpenAdd()}
            sx={{ bgcolor: '#00B8D9', '&:hover': { bgcolor: '#00838F' } }}
          >
            + Adicionar Evento
          </Button>
        </Box>

        {loading ? (
          <Box
            sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}
          >
            <CircularProgress color="primary" />
          </Box>
        ) : (
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            locale={ptLocale}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay',
            }}
            events={calendarEvents}
            selectable
            editable
            eventDrop={handleEventDrop}
            select={handleDateSelect}
            eventClick={handleEventClick}
            eventMinWidth={40}
            slotDuration="00:30:00"
          />
        )}

        {/* DIALOG DE EDIÇÃO/CRIAÇÃO */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="sm">
          <DialogTitle sx={{ color: '#00B8D9' }}>
            {editEvent ? 'Editar Evento' : 'Adicionar Novo Evento'}
          </DialogTitle>
          <DialogContent sx={{ pt: '10px !important' }}>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TextField
                label="Título"
                fullWidth
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
              <TextField
                label="Descrição (opcional)"
                fullWidth
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <DateTimePicker
                label="Data e Hora"
                value={formData.dateTime}
                onChange={(newValue) => setFormData({ ...formData, dateTime: newValue })}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            {editEvent && (
              <IconButton
                color="error"
                onClick={() => editEvent && handleDelete(editEvent.id)}
                aria-label="Deletar Evento"
                sx={{ mr: 'auto' }}
              >
                <DeleteIcon />
                <Typography variant="button" sx={{ ml: 0.5 }}>
                  Deletar
                </Typography>
              </IconButton>
            )}
            <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
            <Button
              variant="contained"
              onClick={handleSave}
              sx={{ bgcolor: '#00B8D9', '&:hover': { bgcolor: '#00838F' } }}
            >
              Salvar
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
}

export default AgendaView;
