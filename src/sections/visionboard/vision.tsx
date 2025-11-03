import { fabric } from "fabric";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

import { Box, Button, Typography } from "@mui/material";

export function VisionBoardView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [mode, setMode] = useState<"move" | "draw" | "delete">("move");
  const [loading, setLoading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  const SUPABASE_URL = "https://xhetvaflxvoxllspoimz.supabase.co";
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoZXR2YWZseHZveGxsc3BvaW16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NTg3NDksImV4cCI6MjA3NzEzNDc0OX0.lkyrirrQm31gnDUAmB4lETpb0pHGGBaM3i32R9FkSrk";

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

useEffect(() => {
  const c = new fabric.Canvas(canvasRef.current!, {
    width: 800,
    height: 600,
    backgroundColor: "#fafafa",
  });
  setCanvas(c);

  // cleanup correto
  return () => {
    c.dispose(); // executa, mas não retorna nada
  };
}, []);


  // Atualiza comportamento quando o modo muda
  useEffect(() => {
    if (!canvas) return;

    // alterna modo desenho
    canvas.isDrawingMode = mode === "draw";

    // desativa seleção de objetos no modo desenho ou deletar
    canvas.selection = mode === "move";
    canvas.forEachObject((obj) => (obj.selectable = mode === "move"));

    // limpa eventos anteriores e adiciona de novo
    canvas.off("mouse:down");
    if (mode === "delete") {
      canvas.on("mouse:down", (e) => {
        if (e.target) {
          canvas.remove(e.target);
          canvas.renderAll();
        }
      });
    }
  }, [mode, canvas]);

  // Carrega o quadro existente
  useEffect(() => {
    const loadBoard = async () => {
      const { data, error } = await supabase
        .from("vision_boards")
        .select("*")
        .eq("user_id", "anon")
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Erro ao carregar quadro:", error);
        return;
      }

      if (data && data.board_data && canvas) {
        canvas.loadFromJSON(data.board_data, () => canvas.renderAll());
        console.log("Quadro carregado do Supabase!");
      }
    };
    if (canvas) loadBoard();
  }, [canvas]);

  // Upload da imagem
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !canvas) return;

    setLoading(true);
    const fileName = `${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("vision_board_images")
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      console.error("Erro ao subir imagem:", uploadError);
      alert("Erro ao enviar imagem");
      setLoading(false);
      return;
    }

    const { data } = supabase.storage
      .from("vision_board_images")
      .getPublicUrl(fileName);
    const publicUrl = data.publicUrl;

    fabric.Image.fromURL(publicUrl, (img) => {
      if (!img) return;
      img.scaleToWidth(200);
      canvas.add(img);
      canvas.renderAll();
    });

    setUploadedImages((prev) => [...prev, publicUrl]);
    setLoading(false);
  };

  // Modos
  const setDrawingMode = () => setMode("draw");
  const setMoveMode = () => setMode("move");
  const setDeleteMode = () => setMode("delete");

  // Salvar quadro
  const saveBoard = async () => {
    if (!canvas) return;
    setLoading(true);

    const jsonData = JSON.stringify(canvas.toJSON());

    const { error } = await supabase.from("vision_boards").upsert(
      [
        {
          user_id: "anon",
          board_data: jsonData,
          image_urls: uploadedImages,
        },
      ],
      { onConflict: "user_id" }
    );

    setLoading(false);

    if (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar quadro!");
    } else {
      alert("Quadro salvo com sucesso!");
    }
  };

  return (
    <Box sx={{ p: 3, textAlign: "center" }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Vision Board
      </Typography>

      <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mb: 2 }}>
        <input type="file" accept="image/*" onChange={handleImageUpload} />

        <Button
          variant="contained"
          color={mode === "draw" ? "error" : "primary"}
          onClick={setDrawingMode}
        >
          Modo Pincel
        </Button>

        <Button
          variant="contained"
          color={mode === "move" ? "secondary" : "primary"}
          onClick={setMoveMode}
        >
          Modo Mover
        </Button>

        <Button
          variant="contained"
          color={mode === "delete" ? "error" : "primary"}
          onClick={setDeleteMode}
        >
          Modo Deletar
        </Button>

        <Button
          variant="contained"
          color="success"
          onClick={saveBoard}
          disabled={loading}
        >
          {loading ? "Salvando..." : "Salvar quadro"}
        </Button>
      </Box>

      <canvas
        ref={canvasRef}
        style={{
          border: "1px solid #ccc",
          borderRadius: 8,
          marginTop: 20,
        }}
      />
    </Box>
  );
}
