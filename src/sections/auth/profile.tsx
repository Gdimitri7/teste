import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

const SUPABASE_URL = 'https://xhetvaflxvoxllspoimz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoZXR2YWZseHZveGxsc3BvaW16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NTg3NDksImV4cCI6MjA3NzEzNDc0OX0.lkyrirrQm31gnDUAmB4lETpb0pHGGBaM3i32R9FkSrk';
const AVATAR_BUCKET = 'avatar';

export function UserProfileView() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const token = localStorage.getItem('token'); // seu token armazenado

  useEffect(() => {
    const fetchUser = async (): Promise<void> => {
      if (!token) {
        setLoading(false);
        setError('Usuário não autenticado');
        return;
      }

      try {
        // Pega email do auth.users via token
        const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: SUPABASE_ANON_KEY,
          },
        });

        if (!res.ok) throw new Error('Erro ao buscar usuário');

        const data = await res.json();
        setUserId(data.id);
        setEmail(data.email || '');

        // Busca profile do usuário (avatar e displayName)
        const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${data.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
            Prefer: 'return=representation'
          }
        });
        const profileData = await profileRes.json();
        if (profileData && profileData.length > 0) {
          setDisplayName(profileData[0].full_name || '');
          setPreview(profileData[0].avatar_url || null);
        }

      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Erro ao carregar perfil');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleUpload = async (): Promise<string> => {
    if (!file || !userId) return '';

    const filePath = `${userId}-${Date.now()}.${file.name.split('.').pop()}`;

    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${AVATAR_BUCKET}/${filePath}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: SUPABASE_ANON_KEY,
        'Content-Type': file.type,
      },
      body: file,
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Erro ao enviar arquivo: ${txt}`);
    }

    return `${SUPABASE_URL}/storage/v1/object/public/${AVATAR_BUCKET}/${filePath}`;
  };

  const handleSave = async (): Promise<void> => {
    if (!userId) return;

    try {
      let avatar_url = preview || '';
      if (file) {
        avatar_url = await handleUpload();
      }

      // Salva ou atualiza profile via REST
      await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          id: userId,
          full_name: displayName,
          avatar_url
        })
      });

      setSuccess(true);
      setError(null);
      setPreview(avatar_url);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao salvar perfil');
      setSuccess(false);
    }
  };

  if (loading) return <Typography>Carregando...</Typography>;

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 5, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h5">Editar Perfil</Typography>
      {error && <Typography color="error">{error}</Typography>}
      {success && <Typography color="success.main">Perfil salvo com sucesso!</Typography>}

      <TextField label="Email" value={email} disabled />
      <TextField
        label="Display Name"
        value={displayName}
        onChange={e => setDisplayName(e.target.value)}
      />

      <Button variant="contained" component="label">
        Upload de Avatar
        <input type="file" hidden accept="image/*" onChange={handleFileChange} />
      </Button>

      {preview && <img src={preview} alt="Preview Avatar" style={{ width: 100, borderRadius: '50%' }} />}

      <Button variant="contained" onClick={handleSave}>
        Salvar
      </Button>
    </Box>
  );
}
