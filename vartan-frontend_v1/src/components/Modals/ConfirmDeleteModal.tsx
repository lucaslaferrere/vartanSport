'use client';

import React from 'react';
import { Box, Typography, Button, Modal } from '@mui/material';

interface ConfirmDeleteModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message?: string;
    itemName?: string;
}

export default function ConfirmDeleteModal({
                                               open,
                                               onClose,
                                               onConfirm,
                                               title = 'Confirmar Eliminación',
                                               message,
                                               itemName
                                           }: ConfirmDeleteModalProps) {
    const defaultMessage = itemName
        ? `¿Está seguro que desea eliminar "${itemName}"?`
        : '¿Está seguro que desea eliminar este elemento?';

    return (
        <Modal
            open={open}
            onClose={onClose}
            aria-labelledby="confirm-delete-title"
            aria-describedby="confirm-delete-description"
        >
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '90%', sm: 400 },
          bgcolor: 'background.paper',
          borderRadius: '6px',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
          p: 0,
          outline: 'none'
        }}
      >
        <Box
          sx={{
            p: 2,
            borderBottom: '1px solid #E5E7EB'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                bgcolor: '#FEE2E2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <i
                className="fa-solid fa-triangle-exclamation"
                style={{ color: '#DC2626', fontSize: '14px' }}
              />
            </Box>
            <Typography
              id="confirm-delete-title"
              sx={{
                fontSize: '15px',
                fontWeight: 600,
                color: '#111827'
              }}
            >
              {title}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ p: 2.5 }}>
          <Typography
            id="confirm-delete-description"
            sx={{
              fontSize: '13px',
              color: '#4B5563',
              lineHeight: 1.5
            }}
          >
            {message || defaultMessage}
          </Typography>
          <Typography
            sx={{
              fontSize: '12px',
              color: '#6B7280',
              mt: 1,
              lineHeight: 1.4
            }}
          >
            Esta acción no se puede deshacer.
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 1,
            p: 1.5,
            borderTop: '1px solid #E5E7EB'
          }}
        >
          <Button
            onClick={onClose}
            sx={{
              color: '#EF4444',
              fontSize: '12px',
              fontWeight: 500,
              textTransform: 'none',
              px: 1.5,
              py: 0.5,
              minHeight: 0,
              '&:hover': {
                bgcolor: 'transparent'
              }
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            sx={{
              bgcolor: '#DC2626',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 500,
              textTransform: 'none',
              px: 2,
              py: 0.5,
              minHeight: 0,
              borderRadius: '6px',
              '&:hover': {
                bgcolor: '#B91C1C'
              }
            }}
          >
            Eliminar
          </Button>
        </Box>
      </Box>
        </Modal>
    );
}