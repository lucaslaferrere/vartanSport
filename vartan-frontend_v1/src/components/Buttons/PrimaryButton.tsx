'use client';

import React from 'react';
import { Button, ButtonProps } from '@mui/material';

interface PrimaryButtonProps extends Omit<ButtonProps, 'variant'> {
  icon?: string;
}

export default function PrimaryButton({ children, icon, ...props }: PrimaryButtonProps) {
  return (
    <Button
      variant="contained"
      {...props}
      sx={{
        bgcolor: '#528c9e',
        color: '#FFFFFF',
        textTransform: 'none',
        fontWeight: 600,
        fontSize: '14px',
        borderRadius: '10px',
        px: 3,
        py: 1,
        boxShadow: 'none',
        '&:hover': {
          bgcolor: '#3d6a78',
          boxShadow: '0 4px 12px rgba(82, 140, 158, 0.3)',
        },
        ...props.sx,
      }}
    >
      {icon && <i className={icon} style={{ marginRight: '8px', fontSize: '14px' }} />}
      {children}
    </Button>
  );
}

