'use client';

import React from 'react';
import { Box, Typography, Alert, Button, Stack } from '@mui/material';
import AnimatedModal from '@components/Modals/AnimatedModal';
import MainCard from '@components/Cards/MainCard';
import { colors } from '@/src/theme/colors';

interface BaseModalProps {
  title: string;
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  submitText?: string;
  isLoading?: boolean;
  error?: string | null;
  children: React.ReactNode;
}

export default function BaseModal({
  title,
  open,
  onClose,
  onSubmit,
  submitText = 'Agregar',
  isLoading = false,
  error,
  children
}: BaseModalProps) {
  return (
    <AnimatedModal open={open} onClose={onClose}>
      <MainCard
        modal
        darkTitle
        content={false}
        title={title}
        sx={{ width: "50%", zIndex: 9999 }}
        onClose={onClose}
      >
        <Box sx={{ p: 2.5 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          {children}
        </Box>

        <Stack
          direction="row"
          spacing={1}
          justifyContent="flex-end"
          sx={{ px: 2.5, pb: 2 }}
        >
          <Button
            size="small"
            onClick={onClose}
            sx={{
              color: '#EF4444',
              backgroundColor: 'transparent',
              border: 'none',
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '12px',
              px: 1,
              py: 0.25,
              minHeight: '26px',
              minWidth: '50px',
              '&:hover': {
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: 'none'
              }
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={onSubmit}
            disabled={isLoading}
            sx={{
              backgroundColor: colors.primary,
              color: 'white',
              borderRadius: '6px',
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '12px',
              px: 1.5,
              py: 0.25,
              minHeight: '26px',
              minWidth: '60px',
              border: 'none',
              boxShadow: 'none',
              '&:hover': {
                backgroundColor: colors.primaryDark,
                boxShadow: 'none'
              },
              '&:disabled': {
                backgroundColor: '#E5E7EB',
                color: '#9CA3AF'
              }
            }}
          >
            {submitText}
          </Button>
        </Stack>
      </MainCard>
    </AnimatedModal>
  );
}
