import { useState } from 'react';

import { Box, Button, Typography } from '@mui/material';

export function BlogView() {
  const [noPosition, setNoPosition] = useState({ top: '50%', left: '50%' });
  const [showCongrats, setShowCongrats] = useState(false);

  const handleNoClick = () => {
    // Gera posição aleatória para o botão 'Não'
    const top = Math.floor(Math.random() * 80) + 10 + '%';
    const left = Math.floor(Math.random() * 80) + 10 + '%';
    setNoPosition({ top, left });
  };

  const handleYesClick = () => {
    setShowCongrats(true);
  };

  if (showCongrats) {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
        }}
      >
        <Typography variant="h2" color="primary">
          Parabéns! 💖
        </Typography>
        <Typography variant="h5">Você disse sim! 🥰</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: '100vh',
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: 3,
      }}
    >
      <Typography variant="h4">Me daria seu anel?</Typography>
      <Box sx={{ position: 'relative', width: '100%', height: '100px' }}>
        <Button
          variant="contained"
          color="success"
          onClick={handleYesClick}
          sx={{ mr: 2 }}
        >
          Sim
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleNoClick}
          sx={{
            position: 'absolute',
            top: noPosition.top,
            left: noPosition.left,
            transition: '0.2s',
          }}
        >
          Não
        </Button>
      </Box>
    </Box>
  );
}
