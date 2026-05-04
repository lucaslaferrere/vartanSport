'use client';

import React from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import { IComprobante } from '@services/comprobante.service';

interface ComprobanteCardProps {
  comprobante: IComprobante;
  onVer: () => void;
  onDescargar: () => void;
  onVerSaldo?: () => void;
  onDescargarSaldo?: () => void;
  onRevisar: () => void;
}

const formatCurrency = (n: number) =>
  `$${n.toLocaleString('es-AR', { minimumFractionDigits: 0 })}`;

const formatFecha = (iso: string) =>
  new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });

const getExtension = (url: string) => url.split('.').pop()?.toLowerCase() ?? '';

export default function ComprobanteCard({ comprobante, onVer, onDescargar, onVerSaldo, onDescargarSaldo, onRevisar }: ComprobanteCardProps) {
  const { revisado, venta_id, vendedor, cliente, total_final, fecha_venta, comprobante_url, comprobante_saldo_url, forma_pago, forma_pago_saldo } = comprobante;
  const ext = getExtension(comprobante_url);
  const isPdf = ext === 'pdf';
  const tieneSaldo = !!comprobante_saldo_url;

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

      {/* Preview área — una o dos columnas según si hay saldo */}
      <Box sx={{ display: 'flex', borderBottom: '1px solid #E5E7EB' }}>
        <Box
          sx={{
            flex: 1,
            height: 100,
            bgcolor: '#F9FAFB',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            borderRight: tieneSaldo ? '1px solid #E5E7EB' : 'none',
          }}
          onClick={onVer}
        >
          <i
            className={isPdf ? 'fa-solid fa-file-pdf' : 'fa-solid fa-file-image'}
            style={{ fontSize: tieneSaldo ? '24px' : '36px', color: isPdf ? '#EF4444' : '#3B82F6' }}
          />
          {tieneSaldo && (
            <Typography sx={{ fontSize: '9px', color: '#9CA3AF', mt: 0.5 }}>Seña</Typography>
          )}
        </Box>

        {tieneSaldo && (
          <Box
            sx={{
              flex: 1,
              height: 100,
              bgcolor: '#F9FAFB',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            onClick={onVerSaldo}
          >
            {(() => {
              const extSaldo = getExtension(comprobante_saldo_url!);
              const isPdfSaldo = extSaldo === 'pdf';
              return (
                <i
                  className={isPdfSaldo ? 'fa-solid fa-file-pdf' : 'fa-solid fa-file-image'}
                  style={{ fontSize: '24px', color: isPdfSaldo ? '#EF4444' : '#3B82F6' }}
                />
              );
            })()}
            <Typography sx={{ fontSize: '9px', color: '#9CA3AF', mt: 0.5 }}>Saldo</Typography>
          </Box>
        )}
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
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.25 }}>
          <Typography sx={{ fontSize: '10px', color: '#588a9e', fontWeight: 600 }}>
            {forma_pago.nombre}
          </Typography>
          {forma_pago_saldo && (
            <Typography sx={{ fontSize: '10px', color: '#6B7280' }}>
              + {forma_pago_saldo.nombre}
            </Typography>
          )}
        </Box>
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
        <Tooltip title={tieneSaldo ? 'Ver seña' : 'Ver'}>
          <IconButton size="small" onClick={onVer} sx={{ color: '#6B7280' }}>
            <i className="fa-solid fa-eye" style={{ fontSize: '13px' }} />
          </IconButton>
        </Tooltip>
        <Tooltip title={tieneSaldo ? 'Descargar seña' : 'Descargar'}>
          <IconButton size="small" onClick={onDescargar} sx={{ color: '#6B7280' }}>
            <i className="fa-solid fa-download" style={{ fontSize: '13px' }} />
          </IconButton>
        </Tooltip>
        {tieneSaldo && (
          <>
            <Tooltip title="Ver saldo">
              <IconButton size="small" onClick={onVerSaldo} sx={{ color: '#6B7280' }}>
                <i className="fa-solid fa-eye" style={{ fontSize: '13px' }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Descargar saldo">
              <IconButton size="small" onClick={onDescargarSaldo} sx={{ color: '#6B7280' }}>
                <i className="fa-solid fa-download" style={{ fontSize: '13px' }} />
              </IconButton>
            </Tooltip>
          </>
        )}
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
