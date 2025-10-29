import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import ptLocale from '@fullcalendar/core/locales/pt';
import interactionPlugin from '@fullcalendar/interaction';

import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Box } from '@mui/material';

type EventRow = {
  id: string;
  title: string;
  description?: string | null;
  date: string; // 'YYYY-MM-DD'
  time: string; // 'HH:MM:SS'
};

const SUPABASE_URL = 'https://xhetvaflxvoxllspoimz.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoZXR2YWZseHZveGxsc3BvaW16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NTg3NDksImV4cCI6MjA3NzEzNDc0OX0.lkyrirrQm31gnDUAmB4lETpb0pHGGBaM3i32R9FkSrk';

export function AgendaView() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editEvent, setEditEvent] = useState<EventRow | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState<Date | null>(new Date());
  const [time, setTime] = useState<Date | null>(new Date());

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
    fetchEvents();
  }, []);

  const formatDate = (d: Date) => d.toISOString().split('T')[0];
  const formatTime = (t: Date) => t.toTimeString().split(' ')[0];

  const handleOpenAdd = (startDate?: Date) => {
    setEditEvent(null);
    setTitle('');
    setDescription('');
    setDate(startDate ?? new Date());
    setTime(new Date());
    setOpenDialog(true);
  };

  const handleOpenEdit = (event: EventRow) => {
    setEditEvent(event);
    setTitle(event.title);
    setDescription(event.description ?? '');
    setDate(new Date(`${event.date}T00:00:00`));
    setTime(new Date(`1970-01-01T${event.time}`));
    setOpenDialog(true);
  };

  const handleSave = async () => {
    if (!title || !date || !time) {
      alert('Preencha todos os campos');
      return;
    }

    const payload = {
      title,
      description: description || null,
      date: formatDate(date),
      time: formatTime(time),
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
      console.error(err);
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
    } catch (err) {
      console.error(err);
      alert('Erro ao deletar evento');
    }
  };

  const handleEventClick = (clickInfo: any) => {
    const ev = events.find(e => e.id === clickInfo.event.id);
    if (ev) handleOpenEdit(ev);
  };

  const handleDateSelect = (selectInfo: any) => {
    handleOpenAdd(selectInfo.start);
  };

  return (
<Box sx={{ position: 'relative' }}>
  {/* Botão flutuante no canto superior esquerdo */}
  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
    <Button variant="contained" color="primary" onClick={() => handleOpenAdd()}>
      Adicionar Evento
    </Button>
  </Box>

  <FullCalendar
    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
    initialView="dayGridMonth"
    locale={ptLocale}
    headerToolbar={{
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay',
    }}
    events={events.map(e => ({
      id: e.id,
      title: e.title,
      start: `${e.date}T${e.time}`,
    }))}
    selectable
    select={handleDateSelect}
    eventClick={handleEventClick}
  />

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editEvent ? 'Editar Evento' : 'Adicionar Evento'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="Título" fullWidth value={title} onChange={e => setTitle(e.target.value)} />
          <TextField
            label="Descrição"
            fullWidth
            multiline
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
          <TextField
            label="Data"
            type="date"
            value={date ? formatDate(date) : ''}
            onChange={e => setDate(new Date(e.target.value))}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Hora"
            type="time"
            value={time ? formatTime(time).slice(0, 5) : ''}
            onChange={e => setTime(new Date(`1970-01-01T${e.target.value}`))}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          {editEvent && (
            <Button color="error" onClick={() => editEvent && handleDelete(editEvent.id)}>
              Deletar
            </Button>
          )}
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AgendaView;
