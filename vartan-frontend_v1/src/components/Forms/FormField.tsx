'use client';

import React from 'react';
import { TextField, Typography, Box, Autocomplete } from '@mui/material';
import { colors } from '@/src/theme/colors';

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: boolean;
  type?: 'text' | 'number' | 'autocomplete' | 'multiselect';
  placeholder?: string;
  value?: any;
  onChange?: (value: any) => void;
  options?: any[];
  getOptionLabel?: (option: any) => string;
  loading?: boolean;
  freeSolo?: boolean;
  multiple?: boolean;
  startAdornment?: React.ReactNode;
  inputProps?: any;
}

export default function FormField({
  label,
  required = false,
  error = false,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  options = [],
  getOptionLabel,
  loading = false,
  freeSolo = false,
  multiple = false,
  startAdornment,
  inputProps
}: FormFieldProps) {
  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: 'transparent',
      border: '1px solid #E5E7EB',
      borderRadius: '6px',
      '& fieldset': {
        border: 'none'
      },
      '&:hover': {
        borderColor: '#D1D5DB',
      },
      '&.Mui-focused': {
        borderColor: colors.primary,
        boxShadow: 'none'
      },
      '&.Mui-error': {
        borderColor: '#EF4444'
      }
    },
    '& .MuiOutlinedInput-input': {
      padding: '10px 12px',
      fontSize: '14px'
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography
        variant="body2"
        sx={{
          mb: 1,
          fontWeight: 500,
          fontSize: '14px',
          color: '#374151'
        }}
      >
        {label} {required && '*'}
      </Typography>

      {type === 'autocomplete' || type === 'multiselect' ? (
        <Autocomplete
          size="small"
          multiple={type === 'multiselect'}
          loading={loading}
          options={options}
          getOptionLabel={getOptionLabel}
          value={value}
          onChange={(event, newValue) => onChange?.(newValue)}
          freeSolo={freeSolo}
          onInputChange={freeSolo ? (event, newValue) => onChange?.(newValue) : undefined}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder={placeholder}
              error={error}
              sx={fieldSx}
            />
          )}
          noOptionsText="No hay opciones disponibles"
          loadingText="Cargando..."
          sx={{
            '& .MuiAutocomplete-popper': {
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              mt: 0.5
            },
            '& .MuiAutocomplete-paper': {
              boxShadow: 'none',
              border: 'none',
              borderRadius: '8px',
              overflow: 'hidden'
            },
            '& .MuiAutocomplete-listbox': {
              padding: '8px 0',
              '& .MuiAutocomplete-option': {
                padding: '10px 16px',
                fontSize: '14px',
                color: '#374151',
                borderBottom: '1px solid #F3F4F6',
                '&:hover': {
                  backgroundColor: '#F9FAFB',
                  color: '#111827'
                },
                '&.Mui-focused': {
                  backgroundColor: colors.primaryLight,
                  color: colors.primary,
                  fontWeight: 500
                },
                '&[aria-selected="true"]': {
                  backgroundColor: colors.primary,
                  color: 'white',
                  fontWeight: 500,
                  '&:hover': {
                    backgroundColor: colors.primaryDark
                  }
                },
                '&:last-child': {
                  borderBottom: 'none'
                }
              }
            },
            '& .MuiAutocomplete-noOptions': {
              padding: '12px 16px',
              fontSize: '14px',
              color: '#9CA3AF',
              fontStyle: 'italic'
            },
            '& .MuiAutocomplete-loading': {
              padding: '12px 16px',
              fontSize: '14px',
              color: '#9CA3AF'
            }
          }}
        />
      ) : (
        <TextField
          fullWidth
          size="small"
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
          error={error}
          sx={fieldSx}
          slotProps={{
            input: startAdornment ? { startAdornment } : undefined,
            htmlInput: inputProps
          }}
        />
      )}
    </Box>
  );
}
