'use client';

import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, Box, IconButton, Typography } from '@mui/material';
import { comprobanteService } from '@services/comprobante.service';

interface ComprobantePreviewModalProps {
  open: boolean;
  onClose: () => void;
  ventaId: number | null;
  comprobanteUrl: string;
  esSaldo?: boolean;
  onRevisar?: () => void;
  revisado?: boolean;
}

export default function ComprobantePreviewModal({
  open,
  onClose,
  ventaId,
  comprobanteUrl,
  esSaldo = false,
  onRevisar,
  revisado,
}: ComprobantePreviewModalProps) {
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const ext = comprobanteUrl?.split('.').pop()?.toLowerCase() ?? '';
  const isPdf = ext === 'pdf';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

  useEffect(() => {
    if (!open) return;
    setError(false);

    if (comprobanteUrl) {
      const normalized = comprobanteUrl.replace(/\\/g, '/').replace(/^\/+/, '');
      setDisplayUrl(`${apiUrl}/${normalized}`);
    } else {
      setDisplayUrl(null);
    }
  }, [open, comprobanteUrl, apiUrl]);

  const handleDescargar = () => {
    if (!ventaId) return;
    if (esSaldo) {
      const nombre = `comprobante_saldo_venta_${ventaId}.${ext}`;
      comprobanteService.descargarSaldo(ventaId, nombre);
    } else {
      const nombre = `comprobante_sena_venta_${ventaId}.${ext}`;
      comprobanteService.descargar(ventaId, nombre);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '12px' } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '15px' }}>
          Comprobante {esSaldo ? 'saldo' : 'seña'} — Venta #{ventaId}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {onRevisar && (
            <IconButton
              size="small"
              onClick={onRevisar}
              title={revisado ? 'Marcar como pendiente' : 'Marcar como revisado'}
              sx={{ color: revisado ? '#16A34A' : '#D97706', border: '1px solid currentColor', borderRadius: '6px', px: 1 }}
            >
              <i className={`fa-solid ${revisado ? 'fa-rotate-left' : 'fa-check'}`} style={{ fontSize: '12px', marginRight: 4 }} />
              <Typography sx={{ fontSize: '12px' }}>{revisado ? 'Pendiente' : 'Revisado'}</Typography>
            </IconButton>
          )}
          <IconButton size="small" onClick={handleDescargar} title="Descargar" sx={{ color: '#6B7280' }}>
            <i className="fa-solid fa-download" style={{ fontSize: '14px' }} />
          </IconButton>
          <IconButton size="small" onClick={onClose} sx={{ color: '#6B7280' }}>
            <i className="fa-solid fa-times" style={{ fontSize: '14px' }} />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 2, minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {error && (
          <Typography sx={{ color: '#EF4444', fontSize: '13px' }}>
            No se pudo cargar el archivo.
          </Typography>
        )}
        {displayUrl && !error && (
          isPdf ? (
            <Box component="iframe"
              src={displayUrl}
              sx={{ width: '100%', height: '600px', border: 'none', borderRadius: '6px' }}
            />
          ) : (
            <Box component="img"
              src={displayUrl}
              alt={`Comprobante venta #${ventaId}`}
              onError={() => setError(true)}
              sx={{ maxWidth: '100%', maxHeight: '600px', borderRadius: '6px', objectFit: 'contain' }}
            />
          )
        )}
        {!displayUrl && !error && (
          <Typography sx={{ color: '#9CA3AF', fontSize: '13px' }}>Sin comprobante</Typography>
        )}
      </DialogContent>
    </Dialog>
  );
}
