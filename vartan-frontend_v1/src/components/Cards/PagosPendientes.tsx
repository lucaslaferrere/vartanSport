'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Table, TableHead, TableRow,
  TableCell, TableBody, Chip, CircularProgress, Paper,
} from '@mui/material';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { ventaService } from '@services/venta.service';
import { IVenta } from '@models/entities/ventaEntity';
import { colors } from '@/src/theme/colors';

const PAGE_SIZE = 10;

interface PagosPendientesProps {
  onRefresh?: (fn: () => void) => void;
}

const btnBase: React.CSSProperties = {
  padding: '4px 10px',
  fontSize: '12px',
  fontWeight: 500,
  border: '1px solid #E5E7EB',
  borderRadius: '6px',
  cursor: 'pointer',
  backgroundColor: 'white',
  color: '#374151',
  lineHeight: 1.4,
};
const btnDisabled: React.CSSProperties = { ...btnBase, opacity: 0.4, cursor: 'default' };
const btnActive: React.CSSProperties = { ...btnBase, backgroundColor: '#588a9e', color: 'white', borderColor: '#588a9e' };

export default function PagosPendientes({ onRefresh }: PagosPendientesProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPage = Math.max(1, Number(searchParams.get('pp')) || 1);

  const [pendientes, setPendientes] = useState<IVenta[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchPendientes = useCallback(async (page = currentPage) => {
    setLoading(true);
    try {
      const data = await ventaService.getPendientesPaginated(page, PAGE_SIZE);
      setPendientes(data.ventas);
      setTotal(data.total);
    } catch (err) {
      console.error('Error cargando pagos pendientes:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => { fetchPendientes(currentPage); }, [currentPage, fetchPendientes]);

  useEffect(() => {
    if (onRefresh) onRefresh(() => fetchPendientes(currentPage));
  }, [onRefresh, fetchPendientes, currentPage]);

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('pp', String(page));
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const inicio = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const fin = Math.min(currentPage * PAGE_SIZE, total);
  const fmt = (n: number) => '$' + n.toLocaleString('es-AR');
  const totalPendiente = pendientes.reduce((acc, v) => acc + v.saldo, 0);

  // Páginas a mostrar: hasta 5 alrededor de la actual
  const pageNums: number[] = [];
  const half = 2;
  let pStart = Math.max(1, currentPage - half);
  const pEnd = Math.min(totalPages, pStart + 4);
  pStart = Math.max(1, pEnd - 4);
  for (let i = pStart; i <= pEnd; i++) pageNums.push(i);

  return (
    <Paper elevation={0} sx={{ borderRadius: '12px', p: 3, border: '1px solid #F3F4F6' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Box>
          <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            Pagos Pendientes
          </Typography>
          <Typography sx={{ fontSize: '28px', fontWeight: 700, color: '#1F2937', mt: 0.5 }}>
            {loading ? '—' : total}
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
        <>
          <Table size="small">
            <TableHead>
              <TableRow>
                {['#', 'Cliente', 'Seña', 'Deuda', 'Total', 'Vendedor'].map(h => (
                  <TableCell key={h} sx={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', borderBottom: '1px solid #F3F4F6' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {pendientes.map(v => (
                <TableRow key={v.id} sx={{ '&:hover': { bgcolor: '#FAFAFA' } }}>
                  <TableCell sx={{ fontSize: '12px', color: '#9CA3AF' }}>#{v.id}</TableCell>
                  <TableCell sx={{ fontSize: '13px' }}>{v.cliente?.nombre}</TableCell>
                  <TableCell sx={{ fontSize: '13px', fontWeight: 600, color: '#059669' }}>{fmt(v.sena ?? 0)}</TableCell>
                  <TableCell>
                    <Chip label={fmt(v.saldo)} size="small" sx={{ bgcolor: 'rgba(239,68,68,0.1)', color: '#DC2626', fontWeight: 700, fontSize: '11px' }} />
                  </TableCell>
                  <TableCell sx={{ fontSize: '13px', fontWeight: 600 }}>{fmt(v.total_final)}</TableCell>
                  <TableCell sx={{ fontSize: '13px', color: '#6B7280' }}>{v.usuario?.nombre}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Paginación */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, flexWrap: 'wrap', gap: 1 }}>
              <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>
                Mostrando {inicio}–{fin} de {total} registros
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <button style={currentPage === 1 ? btnDisabled : btnBase} disabled={currentPage === 1} onClick={() => goToPage(1)} title="Primera">«</button>
                <button style={currentPage === 1 ? btnDisabled : btnBase} disabled={currentPage === 1} onClick={() => goToPage(currentPage - 1)}>‹ Ant.</button>

                {pStart > 1 && <Typography sx={{ fontSize: '12px', color: '#9CA3AF', px: 0.5 }}>…</Typography>}

                {pageNums.map(n => (
                  <button key={n} style={n === currentPage ? btnActive : btnBase} onClick={() => n !== currentPage && goToPage(n)}>
                    {n}
                  </button>
                ))}

                {pEnd < totalPages && <Typography sx={{ fontSize: '12px', color: '#9CA3AF', px: 0.5 }}>…</Typography>}

                <button style={currentPage >= totalPages ? btnDisabled : btnBase} disabled={currentPage >= totalPages} onClick={() => goToPage(currentPage + 1)}>Sig. ›</button>
                <button style={currentPage >= totalPages ? btnDisabled : btnBase} disabled={currentPage >= totalPages} onClick={() => goToPage(totalPages)} title="Última">»</button>
              </Box>
            </Box>
          )}
        </>
      )}
    </Paper>
  );
}
