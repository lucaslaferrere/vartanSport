'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip } from '@mui/material';
import BaseModal from './BaseModal';
import { IProducto, IProductoStock } from '@models/entities/productoEntity';
import { productoService } from '@services/producto.service';

interface DetalleStockModalProps {
  open: boolean;
  onClose: () => void;
  producto: IProducto | null;
}

export default function DetalleStockModal({ open, onClose, producto }: DetalleStockModalProps) {
  const [stockDetalle, setStockDetalle] = useState<IProductoStock[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStockDetalle = useCallback(async () => {
    if (!producto) return;

    setLoading(true);
    setError(null);
    try {
      const stockData = await productoService.getStockByProducto(producto.id);
      setStockDetalle(stockData);
    } catch (err) {
      console.error('Error cargando detalle de stock:', err);
      setError('Error al cargar el detalle del stock');
    } finally {
      setLoading(false);
    }
  }, [producto]);

  useEffect(() => {
    if (open && producto) {
      loadStockDetalle();
    }
  }, [open, producto, loadStockDetalle]);

  const handleClose = () => {
    setStockDetalle([]);
    setError(null);
    onClose();
  };

  const getStockColor = (cantidad: number) => {
    if (cantidad === 0) return '#DC2626';
    if (cantidad <= 5) return '#F59E0B';
    return '#059669';
  };

  const getStockBgColor = (cantidad: number) => {
    if (cantidad === 0) return 'rgba(239, 68, 68, 0.1)';
    if (cantidad <= 5) return 'rgba(245, 158, 11, 0.1)';
    return 'rgba(16, 185, 129, 0.1)';
  };

  if (!producto) return null;

  return (
    <BaseModal
      title={`Detalle de Stock: ${producto.nombre}`}
      open={open}
      onClose={handleClose}
      onSubmit={handleClose}
      submitText="Cerrar"
      isLoading={loading}
      error={error}
    >
      <Box sx={{ minWidth: 600 }}>
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography>Cargando detalle del stock...</Typography>
          </Box>
        ) : stockDetalle.length > 0 ? (
          <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #E5E7EB' }}>
            <Table size="small">
              <TableHead sx={{ backgroundColor: '#F9FAFB' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, fontSize: '13px' }}>Talle</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '13px' }}>Color</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '13px', textAlign: 'center' }}>Stock</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '13px', textAlign: 'center' }}>Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stockDetalle.map((item) => (
                  <TableRow key={`${item.talle}-${item.color}`}>
                    <TableCell>
                      <Chip
                        label={item.talle}
                        size="small"
                        sx={{
                          bgcolor: 'rgba(59, 130, 246, 0.1)',
                          color: '#1D4ED8',
                          fontWeight: 500,
                          fontSize: '11px'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {item.color && (
                        <Chip
                          label={item.color}
                          size="small"
                          sx={{
                            bgcolor: 'rgba(168, 85, 247, 0.1)',
                            color: '#7C3AED',
                            fontWeight: 500,
                            fontSize: '11px'
                          }}
                        />
                      )}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Typography
                        sx={{
                          fontWeight: 600,
                          fontSize: '13px',
                          color: getStockColor(item.cantidad),
                          backgroundColor: getStockBgColor(item.cantidad),
                          padding: '4px 8px',
                          borderRadius: '6px',
                          display: 'inline-block',
                          minWidth: '40px'
                        }}
                      >
                        {item.cantidad}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      {item.cantidad === 0 ? (
                        <Chip label="Sin stock" size="small" sx={{ bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#DC2626', fontSize: '11px' }} />
                      ) : item.cantidad <= 5 ? (
                        <Chip label="Stock bajo" size="small" sx={{ bgcolor: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', fontSize: '11px' }} />
                      ) : (
                        <Chip label="Disponible" size="small" sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#059669', fontSize: '11px' }} />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
              No hay información de stock disponible para este producto.
            </Typography>
          </Box>
        )}

        {stockDetalle.length > 0 && (
          <Box sx={{ mt: 3, p: 2, backgroundColor: '#F0F9FF', borderRadius: '6px', border: '1px solid #BAE6FD' }}>
            <Typography variant="body2" sx={{ fontSize: '13px', color: '#0369A1', fontWeight: 500 }}>
              Resumen del inventario:
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '12px', color: '#0369A1', mt: 0.5 }}>
              • Total de combinaciones: <strong>{stockDetalle.length}</strong>
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '12px', color: '#0369A1' }}>
              • Stock total: <strong>{stockDetalle.reduce((total, item) => total + item.cantidad, 0)}</strong> unidades
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '12px', color: '#0369A1' }}>
              • Sin stock: <strong>{stockDetalle.filter(item => item.cantidad === 0).length}</strong> combinaciones
            </Typography>
          </Box>
        )}
      </Box>
    </BaseModal>
  );
}
