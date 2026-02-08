'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';

interface EmptyTaskStateProps {
    message?: string;
}

export default function EmptyTaskState({ message = 'No hay tareas todavía' }: EmptyTaskStateProps) {
    return (
        <Box
            sx={{
                textAlign: 'center',
                py: 6,
                px: 3,
            }}
        >
            <Box
                sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    bgcolor: '#F3F4F6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    mb: 2,
                }}
            >
                <i className="fa-solid fa-list-check" style={{ fontSize: '20px', color: '#9CA3AF' }} />
            </Box>
            <Typography sx={{ fontSize: '14px', color: '#6B7280', fontWeight: 500 }}>
                {message}
            </Typography>
            <Typography sx={{ fontSize: '12px', color: '#9CA3AF', mt: 0.5 }}>
                Agrega una nueva tarea para comenzar
            </Typography>
        </Box>
    );
}

