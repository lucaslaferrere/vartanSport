'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress, Typography } from '@mui/material';
import colors from '@/src/theme/colors';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/dashboard');
  }, [router]);

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh'
    }}>
      <CircularProgress sx={{ color: colors.primary, mb: 2 }} size={48} />
      <Typography sx={{ color: colors.textSecondary, fontSize: '16px' }}>
        Cargando Dashboard...
      </Typography>
    </Box>
  );
}

