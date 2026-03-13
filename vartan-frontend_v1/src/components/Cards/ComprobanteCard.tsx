'use client';

import React from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import { IComprobante } from '@services/comprobante.service';

interface ComprobanteCardProps {
  comprobante: IComprobante;
  onVer: () => void;
  onDescargar: () => void;
  onRevisar: () => void;
}

const formatCurrency = (n: number) =>
  `$${n.toLocaleString('es-AR', { minimumFractionDigits: 0 })}`;

const formatFecha = (iso: string) =>
  new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });

const getExtension = (url: string) => url.split('.').pop()?.toLowerCase() ?? '';

export default function ComprobanteCard({ comprobante, onVer, onDescargar, onRevisar }: ComprobanteCardProps) {
  const { revisado, venta_id, vendedor, cliente, total_final, fecha_venta, comprobante_url } = comprobante;
  const ext = getExtension(comprobante_url);
  const isPdf = ext === 'pdf';

  return (
    <Box
      sx={{
        borderRadius: '10px',
        border: '1px solid #E5E7EB',
        borderLeft: revisado ? '1px solid #E5E7EB' : '4px solid #F59E0B',
        bgcolor: 'white',
        overflow: 'hidden',
        position: 'relative',
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.10)' },
      }}
    >
      {/* Badge revisado */}
      {revisado && (
        <Box sx={{
          position: 'absolute', top: 8, right: 8,
          bgcolor: '#DCFCE7', borderRadius: '50%',
          width: 24, height: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <i className="fa-solid fa-check" style={{ color: '#16A34A', fontSize: '11px' }} />
        </Box>
      )}

      {/* Preview área */}
      <Box sx={{
        height: 100,
        bgcolor: '#F9FAFB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottom: '1px solid #E5E7EB',
        cursor: 'pointer',
      }} onClick={onVer}>
        <i
          className={isPdf ? 'fa-solid fa-file-pdf' : 'fa-solid fa-file-image'}
          style={{ fontSize: '36px', color: isPdf ? '#EF4444' : '#3B82F6' }}
        />
      </Box>

      {/* Info */}
      <Box sx={{ p: 1.25 }}>
        <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#111827' }}>
          Venta #{venta_id}
        </Typography>
        <Typography sx={{ fontSize: '11px', color: '#6B7280', mt: 0.25 }}>
          {vendedor.nombre}
        </Typography>
        <Typography sx={{ fontSize: '11px', color: '#6B7280' }}>
          {cliente.nombre}
        </Typography>
        <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#1F2937', mt: 0.5 }}>
          {formatCurrency(total_final)}
        </Typography>
        <Typography sx={{ fontSize: '10px', color: '#9CA3AF' }}>
          {formatFecha(fecha_venta)}
        </Typography>
      </Box>

      {/* Acciones */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-around',
        borderTop: '1px solid #F3F4F6',
        p: 0.5,
      }}>
        <Tooltip title="Ver">
          <IconButton size="small" onClick={onVer} sx={{ color: '#6B7280' }}>
            <i className="fa-solid fa-eye" style={{ fontSize: '13px' }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Descargar">
          <IconButton size="small" onClick={onDescargar} sx={{ color: '#6B7280' }}>
            <i className="fa-solid fa-download" style={{ fontSize: '13px' }} />
          </IconButton>
        </Tooltip>
        <Tooltip title={revisado ? 'Marcar como pendiente' : 'Marcar como revisado'}>
          <IconButton
            size="small"
            onClick={onRevisar}
            sx={{ color: revisado ? '#16A34A' : '#D97706' }}
          >
            <i className={`fa-solid ${revisado ? 'fa-rotate-left' : 'fa-check'}`} style={{ fontSize: '13px' }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}
