import { fabric } from 'fabric';
import { createClient } from '@supabase/supabase-js';
import { useEffect, useRef, useState, useCallback } from 'react';

import SaveIcon from '@mui/icons-material/Save';
import BrushIcon from '@mui/icons-material/Brush';
import OpenWithIcon from '@mui/icons-material/OpenWith';
import FormatShapesIcon from '@mui/icons-material/FormatShapes';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { Box, Button, Typography, Stack, TextField, InputAdornment, Slider } from '@mui/material';

// --- HOOK DE DADOS SUPABASE ---

const SUPABASE_URL = 'https://xhetvaflxvoxllspoimz.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoZXR2YWZseHZveGxsc3BvaW16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NTg3NDksImV4cCI6MjA3NzEzNDc0OX0.lkyrirrQm31gnDUAmB4lETpb0pHGBaM3i32R9FkSrk';

const useSupabaseBoard = () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return supabase;
};

// --- COMPONENTE PRINCIPAL ---

export function VisionBoardView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [mode, setMode] = useState<'move' | 'draw' | 'delete' | 'text'>('move');
  const [loading, setLoading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  const [brushColor, setBrushColor] = useState('#FF0000');
  const [brushWidth, setBrushWidth] = useState(5);

  const supabase = useSupabaseBoard();

  // --- 1. INICIALIZAÇÃO DO CANVAS ---
  useEffect(() => {
    const c = new fabric.Canvas(canvasRef.current!, {
      width: 800,
      height: 600,
      backgroundColor: '#f7f7f7',
      selection: true,
    });
    setCanvas(c);

    return () => {
      c.dispose();
    };
  }, []);

  // --- 2. LÓGICA DE MODO E PINCEL (ESTÁVEL) ---
  useEffect(() => {
    if (!canvas) return;

    // 1. Configurações de Desenho
    const isDrawing = mode === 'draw';
    canvas.isDrawingMode = isDrawing;

    if (isDrawing) {
      canvas.freeDrawingBrush.color = brushColor;
      canvas.freeDrawingBrush.width = brushWidth;
    }

    // 2. Configurações de Seleção e Movimentação
    const enableSelection = mode === 'move' || mode === 'text';
    canvas.selection = enableSelection;

    // Limpa o evento mouse:down anterior para evitar duplicação (especialmente do modo 'delete')
    canvas.off('mouse:down');

    // Itera sobre todos os objetos para definir suas propriedades de interação
    canvas.forEachObject((obj) => {
      // Objeto só é selecionável se estiver nos modos 'move' ou 'text'
      obj.selectable = enableSelection;
      // Objeto deve ser interativo em todos os modos, exceto 'draw'
      obj.evented = !isDrawing;
    });

    // 3. Lógica de Deletar com clique
    if (mode === 'delete') {
      canvas.on('mouse:down', (e) => {
        if (e.target) {
          // Remove o objeto clicado
          canvas.remove(e.target);
          canvas.renderAll();
        }
      });
      canvas.hoverCursor = 'alias'; // Cursor de "deletar" ou "não permitido"

      // Desativa a seleção de objetos em grupo no modo delete
      canvas.selection = false;
    } else if (mode === 'draw') {
      canvas.hoverCursor = 'crosshair';
    } else {
      canvas.hoverCursor = 'default';
    }

    // Garante que o canvas seja redesenhado com as novas configurações
    canvas.renderAll();
  }, [mode, canvas, brushColor, brushWidth]);

  // --- 3. CARREGAMENTO E PERSISTÊNCIA ---

  // Carrega o quadro existente
  useEffect(() => {
    const loadBoard = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('vision_boards')
        .select('*')
        .eq('user_id', 'anon')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao carregar quadro:', error);
        setLoading(false);
        return;
      }

      if (data && data.board_data && canvas) {
        // NOTE: loadFromJSON é uma operação assíncrona que pode demorar.
        canvas.loadFromJSON(data.board_data, () => canvas.renderAll());
        setUploadedImages(data.image_urls || []);
        console.log('Quadro carregado do Supabase!');
      }
      setLoading(false);
    };
    if (canvas) loadBoard();
  }, [canvas, supabase]);

  // Salvar quadro (Usa useCallback para estabilidade)
  const saveBoard = useCallback(async () => {
    if (!canvas) return;
    setLoading(true);

    // Desativa o modo de desenho antes de salvar, apenas por segurança
    canvas.isDrawingMode = false;

    const jsonData = JSON.stringify(canvas.toJSON());

    const { error } = await supabase.from('vision_boards').upsert(
      [
        {
          user_id: 'anon',
          board_data: jsonData,
          image_urls: uploadedImages,
        },
      ],
      { onConflict: 'user_id' }
    );

    setLoading(false);

    if (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar quadro!');
    } else {
      alert('Quadro salvo com sucesso!');
    }
  }, [canvas, supabase, uploadedImages]);

  // --- 4. FUNÇÕES DE INTERAÇÃO ---

  // Upload da imagem
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !canvas) return;

    setLoading(true);
    const fileName = `${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from('vision_board_images')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      console.error('Erro ao subir imagem:', uploadError);
      alert('Erro ao enviar imagem');
      setLoading(false);
      return;
    }

    const { data } = supabase.storage.from('vision_board_images').getPublicUrl(fileName);
    const publicUrl = data.publicUrl;

    fabric.Image.fromURL(publicUrl, (img) => {
      if (!img) return;
      img.scaleToWidth(200);
      img.set({
        left: canvas.width! / 2 - 100, // Centraliza
        top: canvas.height! / 2 - 100,
        selectable: true,
      });
      canvas.add(img);
      canvas.renderAll();
    });

    setUploadedImages((prev) => [...prev, publicUrl]);
    setLoading(false);
    setMode('move');
  };

  // Adicionar Texto
  const handleAddText = () => {
    if (!canvas) return;

    const text = new fabric.IText('Nova meta...', {
      left: 50,
      top: 50,
      fontFamily: 'Arial',
      fontSize: 24,
      fill: '#000000',
      selectable: true,
    });
    canvas.add(text);
    canvas.renderAll();
    setMode('move');
  };

  // --- 5. RENDERIZAÇÃO E CONTROLES ---

  return (
    <Box sx={{ p: 3, textAlign: 'center' }}>
      <Typography variant="h3" sx={{ mb: 1, color: '#0097A7', fontWeight: 700 }}>
        Vision Board Interativo ✨
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Crie e visualize seus objetivos usando o Fabric.js e a persistência do Supabase.
      </Typography>

      {/* CONTROLES DE INTERAÇÃO E MODO */}
      <Stack direction="column" spacing={2} sx={{ mb: 3 }}>
        {/* LINHA 1: Modos e Salvar */}
        <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
          <Button
            variant="contained"
            color={mode === 'move' ? 'secondary' : 'primary'}
            onClick={() => setMode('move')}
            startIcon={<OpenWithIcon />}
            disabled={loading}
          >
            Mover & Escalar
          </Button>

          <Button
            variant="contained"
            color={mode === 'draw' ? 'error' : 'primary'}
            onClick={() => setMode('draw')}
            startIcon={<BrushIcon />}
            disabled={loading}
          >
            Modo Pincel
          </Button>

          <Button
            variant="contained"
            color={mode === 'delete' ? 'error' : 'primary'}
            onClick={() => setMode('delete')}
            startIcon={<DeleteForeverIcon />}
            disabled={loading}
          >
            Modo Deletar
          </Button>

          <Button
            variant="contained"
            color="success"
            onClick={saveBoard}
            disabled={loading}
            startIcon={<SaveIcon />}
          >
            {loading ? 'Salvando...' : 'Salvar Quadro'}
          </Button>
        </Stack>

        {/* LINHA 2: Adicionar Elementos e Pincel */}
        <Stack
          direction="row"
          spacing={2}
          justifyContent="center"
          alignItems="center"
          flexWrap="wrap"
          sx={{ bgcolor: '#f0f0f0', p: 1.5, borderRadius: 1 }}
        >
          {/* Adicionar Imagem */}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={loading}
            style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px' }}
          />

          {/* Adicionar Texto */}
          <Button
            variant="outlined"
            onClick={handleAddText}
            startIcon={<FormatShapesIcon />}
            disabled={loading}
          >
            Adicionar Texto
          </Button>

          {/* Controles de Pincel (Apenas visíveis no modo Desenho) */}
          {mode === 'draw' && (
            <>
              <TextField
                label="Cor"
                type="color"
                size="small"
                value={brushColor}
                onChange={(e) => setBrushColor(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BrushIcon sx={{ color: brushColor }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: 150 }}
              />
              <Box sx={{ width: 200, display: 'flex', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ mr: 1, minWidth: 60 }}>
                  Espessura: {brushWidth}
                </Typography>
                <Slider
                  size="small"
                  value={brushWidth}
                  onChange={(_, val) => setBrushWidth(val as number)}
                  min={1}
                  max={50}
                  valueLabelDisplay="auto"
                />
              </Box>
            </>
          )}
        </Stack>
      </Stack>

      {/* CANVAS (O Quadro em Si) */}
      <canvas
        ref={canvasRef}
        style={{
          border: '2px solid #0097A7',
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          display: 'block',
        }}
      />
    </Box>
  );
}
