'use client';

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { colors } from '@/src/theme/colors';

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  icon?: string;
  iconColor?: string;
}

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cerrar',
  confirmColor = colors.primary,
  icon = 'fa-solid fa-circle-question',
  iconColor = colors.primary,
}: ConfirmModalProps) {
  if (!open) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgcolor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1300,
      }}
      onClick={onClose}
    >
      <Box
        sx={{
          bgcolor: 'white',
          borderRadius: '8px',
          width: '90%',
          maxWidth: '440px',
          p: 3,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              bgcolor: `${iconColor}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
            }}
          >
            <i className={icon} style={{ fontSize: '24px', color: iconColor }} />
          </Box>

          <Typography
            sx={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#1F2937',
              mb: 1,
              textAlign: 'center',
            }}
          >
            {title}
          </Typography>

          <Typography
            sx={{
              fontSize: '14px',
              color: '#6B7280',
              textAlign: 'center',
              lineHeight: 1.5,
            }}
          >
            {message}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, mt: 3 }}>
          <Button
            onClick={onClose}
            sx={{
              flex: 1,
              color: '#6B7280',
              bgcolor: 'transparent',
              border: '1px solid #E5E7EB',
              textTransform: 'none',
              fontSize: '14px',
              fontWeight: 500,
              py: 0.75,
              borderRadius: '6px',
              '&:hover': {
                bgcolor: '#F9FAFB',
                border: '1px solid #D1D5DB',
              },
            }}
          >
            {cancelText}
          </Button>

          <Button
            onClick={handleConfirm}
            sx={{
              flex: 1,
              color: 'white',
              bgcolor: confirmColor,
              textTransform: 'none',
              fontSize: '14px',
              fontWeight: 500,
              py: 0.75,
              borderRadius: '6px',
              '&:hover': {
                bgcolor: confirmColor,
                filter: 'brightness(0.9)',
              },
            }}
          >
            {confirmText}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

