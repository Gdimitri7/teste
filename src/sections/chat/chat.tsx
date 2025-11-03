import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

import DeleteIcon from "@mui/icons-material/Delete";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  IconButton,
} from "@mui/material";

const supabase = createClient(
  "https://xhetvaflxvoxllspoimz.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoZXR2YWZseHZveGxsc3BvaW16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NTg3NDksImV4cCI6MjA3NzEzNDc0OX0.lkyrirrQm31gnDUAmB4lETpb0pHGGBaM3i32R9FkSrk"
);

export function ChatView() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const userId = "anon";

  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });

      if (!error && data) setMessages(data);
    };

    fetchMessages();

    const subscription = supabase
      .channel("realtime:messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "messages" },
        (payload) => {
          setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;
    await supabase.from("messages").insert([{ user_id: userId, content: input }]);
    setInput("");
  };

  const deleteMessage = async (id: string) => {
    await supabase.from("messages").delete().eq("id", id);
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
  };

  return (
<Box
  sx={{
    width: 420,
    height: "65vh",
    mx: "auto",
    mt: 6,
    p: 3,
    borderRadius: 4,
    background: "linear-gradient(135deg, #f8bbd0 0%, #e1bee7 100%)",
    boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    overflow: "hidden",
    position: "relative",
  }}
>
  {/* brilho suave no fundo */}
  <Box
    sx={{
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      background:
        "radial-gradient(circle at 30% 10%, rgba(255,255,255,0.4), transparent 60%)",
      pointerEvents: "none",
    }}
  />

  <Typography
    variant="h5"
    textAlign="center"
    fontWeight="bold"
    sx={{
      color: "#fff",
      mb: 1,
      textShadow: "0 2px 6px rgba(0,0,0,0.2)",
      fontFamily: "'Dancing Script', cursive",
      fontSize: "1.8rem",
    }}
  >
    💌 Fala comigo, meu amor
  </Typography>

  <Box
    sx={{
      flexGrow: 1,
      overflowY: "auto",
      backgroundColor: "rgba(255,255,255,0.95)",
      borderRadius: 3,
      boxShadow: "inset 0 0 10px rgba(0,0,0,0.08)",
      p: 2,
      mb: 2,
      display: "flex",
      flexDirection: "column",
      backdropFilter: "blur(6px)",
    }}
  >
    {messages.map((msg) => (
      <Paper
        key={msg.id}
        elevation={3}
        sx={{
          position: "relative",
          backgroundColor:
            msg.user_id === userId
              ? "linear-gradient(135deg, #ffe0f0, #f8bbd0)"
              : "linear-gradient(135deg, #f3e5f5, #ede7f6)",
          p: 1.5,
          mb: 1.5,
          borderRadius: 4,
          alignSelf: msg.user_id === userId ? "flex-end" : "flex-start",
          textAlign: msg.user_id === userId ? "right" : "left",
          maxWidth: "80%",
          marginLeft: msg.user_id === userId ? "auto" : 0,
          boxShadow: "0 3px 8px rgba(0,0,0,0.1)",
          transition: "all 0.2s ease-in-out",
          "&:hover .delete-btn": { opacity: 1 },
        }}
      >
        <Typography
          variant="body1"
          sx={{
            color: "#333",
            fontSize: "1rem",
            pr: 3,
            fontFamily: "'Poppins', sans-serif",
          }}
        >
          {msg.content}
        </Typography>

        {msg.user_id === userId && (
          <IconButton
            size="small"
            className="delete-btn"
            sx={{
              position: "absolute",
              top: 4,
              right: 4,
              opacity: 0,
              transition: "opacity 0.2s",
              color: "#d32f2f",
            }}
            onClick={() => deleteMessage(msg.id)}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        )}
      </Paper>
    ))}
  </Box>

  <Box sx={{ display: "flex", gap: 1 }}>
    <TextField
      fullWidth
      size="small"
      value={input}
      onChange={(e) => setInput(e.target.value)}
      placeholder="Manda um bilhetinho doce..."
      onKeyDown={(e) => e.key === "Enter" && sendMessage()}
      sx={{
        backgroundColor: "#fff",
        borderRadius: 3,
        input: {
          color: "#ad1457",
          fontFamily: "'Poppins', sans-serif",
        },
      }}
    />
    <Button
      variant="contained"
      onClick={sendMessage}
      sx={{
        background: "linear-gradient(135deg, #ec407a, #ab47bc)",
        "&:hover": { background: "linear-gradient(135deg, #d81b60, #8e24aa)" },
        borderRadius: 3,
        px: 3,
        boxShadow: "0 3px 6px rgba(0,0,0,0.2)",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      💬
    </Button>
  </Box>
</Box>

  );
}
