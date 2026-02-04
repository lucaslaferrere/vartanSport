import { Box } from '@mui/material';
import React from 'react';
import { colors } from '@/src/theme/colors';

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
        p: 2,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 480 }}>{children}</Box>
    </Box>
  );
}

