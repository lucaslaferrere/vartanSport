'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';

interface TaskColumnHeaderProps {
    nombre: string;
    totalTareas: number;
    tareasCompletadas: number;
}

export default function TaskColumnHeader({ nombre, totalTareas, tareasCompletadas }: TaskColumnHeaderProps) {
    const porcentaje = totalTareas > 0 ? Math.round((tareasCompletadas / totalTareas) * 100) : 0;

    return (
        <Box sx={{ mb: 2, pb: 2, borderBottom: '1px solid #E5E7EB' }}>
            <Typography sx={{ fontSize: '16px', fontWeight: 600, color: '#111827', mb: 0.5 }}>
                {nombre}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ fontSize: '13px', color: '#6B7280' }}>
                    {totalTareas} {totalTareas === 1 ? 'tarea' : 'tareas'}
                </Typography>
                {totalTareas > 0 && (
                    <>
                        <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: '#D1D5DB' }} />
                        <Typography sx={{ fontSize: '13px', color: '#059669', fontWeight: 500 }}>
                            {porcentaje}% completado
                        </Typography>
                    </>
                )}
            </Box>
        </Box>
    );
}

