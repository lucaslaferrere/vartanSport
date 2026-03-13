'use client';

import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, Box, IconButton, Typography, CircularProgress } from '@mui/material';
import { comprobanteService } from '@services/comprobante.service';

interface ComprobantePreviewModalProps {
  open: boolean;
  onClose: () => void;
  ventaId: number | null;
  comprobanteUrl: string;
  onRevisar?: () => void;
  revisado?: boolean;
}

export default function ComprobantePreviewModal({
  open,
  onClose,
  ventaId,
  comprobanteUrl,
  onRevisar,
  revisado,
}: ComprobantePreviewModalProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const ext = comprobanteUrl?.split('.').pop()?.toLowerCase() ?? '';
  const isPdf = ext === 'pdf';

  useEffect(() => {
    if (!open || !ventaId) return;

    let revoked = false;
    setLoading(true);
    setError(false);
    setObjectUrl(null);

    comprobanteService.getArchivoBlob(ventaId)
      .then(blob => {
        if (!revoked) {
          const url = window.URL.createObjectURL(blob);
          setObjectUrl(url);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));

    return () => {
      revoked = true;
      setObjectUrl(prev => {
        if (prev) window.URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [open, ventaId]);

  const handleDescargar = () => {
    if (!ventaId) return;
    const nombre = `comprobante_venta_${ventaId}.${ext}`;
    comprobanteService.descargar(ventaId, nombre);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '12px' } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '15px' }}>
          Comprobante — Venta #{ventaId}
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
        {loading && <CircularProgress size={40} />}
        {error && (
          <Typography sx={{ color: '#EF4444', fontSize: '13px' }}>
            No se pudo cargar el archivo.
          </Typography>
        )}
        {objectUrl && !loading && (
          isPdf ? (
            <Box component="iframe"
              src={objectUrl}
              sx={{ width: '100%', height: '600px', border: 'none', borderRadius: '6px' }}
            />
          ) : (
            <Box component="img"
              src={objectUrl}
              alt={`Comprobante venta #${ventaId}`}
              sx={{ maxWidth: '100%', maxHeight: '600px', borderRadius: '6px', objectFit: 'contain' }}
            />
          )
        )}
      </DialogContent>
    </Dialog>
  );
}
