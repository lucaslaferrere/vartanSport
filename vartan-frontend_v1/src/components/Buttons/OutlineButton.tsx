'use client';

import React from 'react';
import { Button, ButtonProps } from '@mui/material';
import { colors } from '@/src/theme/colors';

interface OutlineButtonProps extends Omit<ButtonProps, 'variant'> {
  icon?: string;
}

export default function OutlineButton({ children, icon, ...props }: OutlineButtonProps) {
  return (
    <Button
      variant="outlined"
      {...props}
      sx={{
        color: colors.primary,
        borderColor: colors.primary,
        textTransform: 'none',
        fontWeight: 600,
        fontSize: '14px',
        borderRadius: '10px',
        px: 3,
        py: 1,
        boxShadow: 'none',
        '&:hover': {
          bgcolor: colors.primaryLight,
          borderColor: colors.primary,
        },
        ...props.sx,
      }}
    >
      {icon && <i className={icon} style={{ marginRight: '8px', fontSize: '14px' }} />}
      {children}
    </Button>
  );
}

