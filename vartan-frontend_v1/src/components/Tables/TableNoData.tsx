import { Stack, TableCell, TableRow, Box, Typography } from '@mui/material';
import React from 'react';
import { colors } from '@/src/theme/colors';

export default function TableNoData({ msg, colSpan }: { msg: string; colSpan: number }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan}>
        <Stack alignItems="center" justifyContent="center" spacing={2} sx={{ minHeight: 300, py: 4 }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: colors.backgroundLight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <i className="fa-solid fa-inbox" style={{ fontSize: 40, color: colors.textSecondary }} />
          </Box>
          <Typography variant="h6" sx={{ color: colors.textPrimary, fontWeight: 600 }}>{msg}</Typography>
          <Typography variant="body2" sx={{ color: colors.textSecondary }}>No se encontraron registros para mostrar</Typography>
        </Stack>
      </TableCell>
    </TableRow>
  );
}

