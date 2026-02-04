'use client';

import { Box } from '@mui/material';
import React from 'react';
import { colors } from '@/src/theme/colors';

export default function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        maxWidth: { xs: 400, lg: 500 },
        width: '100%',
        bgcolor: colors.white,
        borderRadius: 4,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        p: { xs: 3, sm: 4, md: 5 },
      }}
    >
      {children}
    </Box>
  );
}

