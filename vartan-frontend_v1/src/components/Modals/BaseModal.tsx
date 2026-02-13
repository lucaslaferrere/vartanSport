'use client';

import React from 'react';
import { Box, Alert, Button, Stack } from '@mui/material';
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
        sx={{
          width: { xs: "95%", sm: "85%", md: "70%", lg: "50%" },
          maxWidth: { xs: "100%", sm: "600px", md: "800px" },
          maxHeight: { xs: "90vh", sm: "85vh" },
          overflow: "auto",
          zIndex: 9999
        }}
        onClose={onClose}
      >
        <Box sx={{ p: { xs: 1.5, sm: 2.5 } }}>
          {error && (
            <Alert severity="error" sx={{ mb: { xs: 2, sm: 3 }, fontSize: { xs: '12px', sm: '14px' } }}>
              {error}
            </Alert>
          )}
          {children}
        </Box>

        <Stack
          direction="row"
          spacing={1}
          justifyContent="flex-end"
          sx={{ px: { xs: 1.5, sm: 2.5 }, pb: { xs: 1.5, sm: 2 } }}
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
              fontSize: { xs: '11px', sm: '12px' },
              px: { xs: 0.75, sm: 1 },
              py: 0.25,
              minHeight: { xs: '24px', sm: '26px' },
              minWidth: { xs: '45px', sm: '50px' },
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
              fontSize: { xs: '11px', sm: '12px' },
              px: { xs: 1, sm: 1.5 },
              py: 0.25,
              minHeight: { xs: '24px', sm: '26px' },
              minWidth: { xs: '55px', sm: '60px' },
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
