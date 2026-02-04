'use client';

import React from 'react';
import { Box, Paper, Typography, Stack } from '@mui/material';
import { colors } from '@/src/theme/colors';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
}

export default function StatCard({ title, value, icon, trend, subtitle }: StatCardProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: '16px 18px',
        borderRadius: '14px',
        border: '1px solid #E5E7EB',
        bgcolor: '#FFFFFF',
        minHeight: '110px',
        transition: 'all 0.15s ease',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(82, 140, 158, 0.06)',
          borderColor: 'rgba(82, 140, 158, 0.25)',
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Stack spacing={0.75}>
          <Typography
            sx={{
              color: '#6B7280',
              fontSize: '12px',
              fontWeight: 500,
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
            }}
          >
            {title}
          </Typography>
          <Typography
            sx={{
              color: '#1F2937',
              fontSize: '24px',
              fontWeight: 700,
              lineHeight: 1.2,
            }}
          >
            {value}
          </Typography>
          {trend && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography
                sx={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: trend.isPositive ? '#059669' : '#DC2626',
                }}
              >
                {trend.isPositive ? '+' : '-'}{trend.value}%
              </Typography>
              <Typography sx={{ fontSize: '11px', color: '#9CA3AF' }}>
                vs mes anterior
              </Typography>
            </Box>
          )}
          {subtitle && (
            <Typography sx={{ fontSize: '11px', color: '#9CA3AF' }}>
              {subtitle}
            </Typography>
          )}
        </Stack>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '10px',
            bgcolor: colors.primaryLight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: colors.primary,
            fontSize: '16px',
          }}
        >
          <i className={icon}></i>
        </Box>
      </Box>
    </Paper>
  );
}

