'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Table, TableHead, TableRow,
  TableCell, TableBody, Chip, CircularProgress, Paper
} from '@mui/material';
import { ventaService } from '@services/venta.service';
import { IVenta } from '@models/entities/ventaEntity';
import { colors } from '@/src/theme/colors';

export default function PagosPendientes() {
  const [pendientes, setPendientes] = useState<IVenta[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPendientes = useCallback(async () => {
    try {
      const data = await ventaService.getPendientes();
      setPendientes(data);
    } catch (err) {
      console.error('Error cargando pagos pendientes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPendientes(); }, [fetchPendientes]);

  const totalPendiente = pendientes.reduce((acc, v) => acc + v.saldo, 0);
  const fmt = (n: number) => '$' + n.toLocaleString('es-AR');

  return (
    <Paper elevation={0} sx={{ borderRadius: '12px', p: 3, border: '1px solid #F3F4F6' }}>
      {/* Header estilo StatCard */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Box>
          <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            Pagos Pendientes
          </Typography>
          <Typography sx={{ fontSize: '28px', fontWeight: 700, color: '#1F2937', mt: 0.5 }}>
            {loading ? '—' : pendientes.length}
          </Typography>
        </Box>
        <Box sx={{ bgcolor: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px', p: 1.2 }}>
          <i className="fa-solid fa-clock" style={{ color: '#D97706', fontSize: '20px' }} />
        </Box>
      </Box>

      <Typography sx={{ fontSize: '13px', color: '#6B7280', mb: 2 }}>
        Total a cobrar: <strong style={{ color: '#D97706' }}>{fmt(totalPendiente)}</strong>
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={24} sx={{ color: colors.primary }} />
        </Box>
      ) : pendientes.length === 0 ? (
        <Typography sx={{ textAlign: 'center', color: '#9CA3AF', py: 2, fontSize: '14px' }}>
          Sin pagos pendientes ✓
        </Typography>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              {['Cliente', 'Seña', 'Deuda', 'Total', 'Vendedor'].map(h => (
                <TableCell key={h} sx={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', borderBottom: '1px solid #F3F4F6' }}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {pendientes.map(v => (
              <TableRow key={v.id} sx={{ '&:hover': { bgcolor: '#FAFAFA' } }}>
                <TableCell sx={{ fontSize: '13px' }}>
                  {v.cliente?.nombre}
                </TableCell>
                <TableCell sx={{ fontSize: '13px', fontWeight: 600, color: '#059669' }}>
                  {fmt(v.sena ?? 0)}
                </TableCell>
                <TableCell>
                  <Chip
                    label={fmt(v.saldo)}
                    size="small"
                    sx={{ bgcolor: 'rgba(239,68,68,0.1)', color: '#DC2626', fontWeight: 700, fontSize: '11px' }}
                  />
                </TableCell>
                <TableCell sx={{ fontSize: '13px', fontWeight: 600 }}>
                  {fmt(v.total_final)}
                </TableCell>
                <TableCell sx={{ fontSize: '13px', color: '#6B7280' }}>
                  {v.usuario?.nombre}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Paper>
  );
}