'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip,
} from '@mui/material';
import BaseModal from './BaseModal';
import { IProducto, IStockPorTalle } from '@models/entities/productoEntity';
import { productoService } from '@services/producto.service';

interface DetalleStockModalProps {
  open: boolean;
  onClose: () => void;
  producto: IProducto | null;
}

export default function DetalleStockModal({ open, onClose, producto }: DetalleStockModalProps) {
  const [stockPorTalle, setStockPorTalle] = useState<IStockPorTalle[]>([]);
  const [stockTotal, setStockTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStock = useCallback(async () => {
    if (!producto) return;
    setLoading(true);
    setError(null);
    try {
      const data = await productoService.getStockPorTalle(producto.id);
      setStockPorTalle(data.stock_por_talle);
      setStockTotal(data.stock_total);
    } catch {
      setError('Error al cargar el detalle del stock');
    } finally {
      setLoading(false);
    }
  }, [producto]);

  useEffect(() => {
    if (open && producto) loadStock();
  }, [open, producto, loadStock]);

  const handleClose = () => {
    setStockPorTalle([]);
    setError(null);
    onClose();
  };

  const getStockColor = (cantidad: number) =>
    cantidad === 0 ? '#DC2626' : cantidad <= 5 ? '#F59E0B' : '#059669';
  const getStockBg = (cantidad: number) =>
    cantidad === 0 ? 'rgba(239,68,68,0.1)' : cantidad <= 5 ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)';

  if (!producto) return null;

  return (
    <BaseModal
      title={`Stock: ${producto.nombre}`}
      open={open}
      onClose={handleClose}
      onSubmit={handleClose}
      submitText="Cerrar"
      isLoading={loading}
      error={error}
    >
      <Box sx={{ minWidth: 360 }}>
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography sx={{ color: '#6B7280' }}>Cargando...</Typography>
          </Box>
        ) : (stockPorTalle ?? []).length > 0 ? (
          <>
            <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #E5E7EB' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#F9FAFB' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, fontSize: '13px' }}>Talle</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '13px', textAlign: 'center' }}>Stock</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '13px', textAlign: 'center' }}>Estado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stockPorTalle.map(item => (
                    <TableRow key={item.talle}>
                      <TableCell>
                        <Chip
                          label={item.talle}
                          size="small"
                          sx={{ bgcolor: 'rgba(59,130,246,0.1)', color: '#1D4ED8', fontWeight: 500, fontSize: '11px' }}
                        />
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Typography sx={{
                          fontWeight: 600, fontSize: '13px',
                          color: getStockColor(item.cantidad),
                          bgcolor: getStockBg(item.cantidad),
                          px: 1, py: 0.5, borderRadius: '6px', display: 'inline-block', minWidth: '40px',
                        }}>
                          {item.cantidad}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        {item.cantidad === 0
                          ? <Chip label="Sin stock" size="small" sx={{ bgcolor: 'rgba(239,68,68,0.1)', color: '#DC2626', fontSize: '11px' }} />
                          : item.cantidad <= 5
                          ? <Chip label="Stock bajo" size="small" sx={{ bgcolor: 'rgba(245,158,11,0.1)', color: '#F59E0B', fontSize: '11px' }} />
                          : <Chip label="Disponible" size="small" sx={{ bgcolor: 'rgba(16,185,129,0.1)', color: '#059669', fontSize: '11px' }} />
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ mt: 2, p: 2, bgcolor: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '6px' }}>
              <Typography sx={{ fontSize: '13px', color: '#0369A1', fontWeight: 500 }}>
                Stock total: <strong>{stockTotal}</strong> unidades •{' '}
                {stockPorTalle.filter(i => i.cantidad === 0).length} talle{stockPorTalle.filter(i => i.cantidad === 0).length !== 1 ? 's' : ''} sin stock
              </Typography>
            </Box>
          </>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography sx={{ color: '#9CA3AF', fontSize: '13px' }}>
              No hay stock registrado para este producto.
            </Typography>
          </Box>
        )}
      </Box>
    </BaseModal>
  );
}
