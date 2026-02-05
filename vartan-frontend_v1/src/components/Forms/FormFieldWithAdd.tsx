'use client';

import React, { useState } from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import FormField from '@components/Forms/FormField';

interface FormFieldWithAddProps {
  label: string;
  required?: boolean;
  error?: boolean;
  placeholder?: string;
  value?: any;
  onChange?: (value: any) => void;
  options?: any[];
  getOptionLabel?: (option: any) => string;
  loading?: boolean;
  onAddNew?: () => void;
  addButtonTooltip?: string;
}

export default function FormFieldWithAdd({
  label,
  required = false,
  error = false,
  placeholder = '',
  value,
  onChange,
  options = [],
  getOptionLabel,
  loading = false,
  onAddNew,
  addButtonTooltip = 'Agregar nuevo'
}: FormFieldWithAddProps) {

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 500,
            fontSize: '14px',
            color: '#374151'
          }}
        >
          {label} {required && '*'}
        </Typography>
        {onAddNew && (
          <Tooltip title={addButtonTooltip} arrow>
            <IconButton
              size="small"
              onClick={onAddNew}
              sx={{
                color: '#059669',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                width: 24,
                height: 24,
                '&:hover': {
                  backgroundColor: 'rgba(16, 185, 129, 0.2)'
                }
              }}
            >
              <i className="fa-solid fa-plus" style={{ fontSize: '10px' }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <FormField
        label=""
        type="autocomplete"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        options={options}
        getOptionLabel={getOptionLabel}
        loading={loading}
        error={error}
      />
    </Box>
  );
}
