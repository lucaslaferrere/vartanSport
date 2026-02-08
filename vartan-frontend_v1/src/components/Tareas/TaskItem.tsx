'use client';

import React, { useState } from 'react';
import { Box, Checkbox, Typography, IconButton, Collapse } from '@mui/material';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { ITarea } from '@models/entities/tareaEntity';
import { colors } from '@/src/theme/colors';

interface TaskItemProps {
    tarea: ITarea;
    onToggle: (tarea: ITarea) => void;
    onDelete?: (id: number) => void;
    canDelete?: boolean;
    canDrag?: boolean;
}

export default function TaskItem({ tarea, onToggle, onDelete, canDelete = false, canDrag = false }: TaskItemProps) {
    const [expanded, setExpanded] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    // Configurar como draggable
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: tarea.id,
        disabled: !canDrag || tarea.completada, // No permitir drag de tareas completadas
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <Box
            ref={setNodeRef}
            style={style}
            sx={{
                bgcolor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                p: 1.5,
                mb: 1.5,
                transition: 'all 0.2s ease',
                opacity: tarea.completada ? 0.6 : 1,
                cursor: canDrag && !tarea.completada ? 'grab' : 'default',
                '&:hover': {
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    borderColor: colors.primary,
                },
                '&:active': {
                    cursor: canDrag && !tarea.completada ? 'grabbing' : 'default',
                },
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            {...attributes}
            {...listeners}
        >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                {/* Ícono de drag */}
                {canDrag && !tarea.completada && (
                    <Box sx={{ color: '#D1D5DB', cursor: 'grab', pt: 0.3 }}>
                        <i className="fa-solid fa-grip-vertical" style={{ fontSize: '14px' }} />
                    </Box>
                )}

                {/* Checkbox */}
                <Checkbox
                    checked={tarea.completada}
                    onChange={(e) => {
                        e.stopPropagation();
                        onToggle(tarea);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    sx={{
                        padding: 0,
                        '& .MuiSvgIcon-root': { fontSize: 20 },
                        color: '#D1D5DB',
                        '&.Mui-checked': { color: colors.primary },
                    }}
                />

                {/* Contenido */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    {/* Título */}
                    <Typography
                        sx={{
                            fontSize: '14px',
                            fontWeight: 500,
                            color: tarea.completada ? '#9CA3AF' : '#111827',
                            textDecoration: tarea.completada ? 'line-through' : 'none',
                            cursor: tarea.descripcion ? 'pointer' : 'default',
                            wordBreak: 'break-word',
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (tarea.descripcion) setExpanded(!expanded);
                        }}
                    >
                        {tarea.titulo}
                    </Typography>

                    {/* Fecha */}
                    <Typography sx={{ fontSize: '12px', color: '#9CA3AF', mt: 0.5 }}>
                        {formatDate(tarea.fecha_creacion)}
                    </Typography>

                    {/* Descripción expandible */}
                    {tarea.descripcion && (
                        <Collapse in={expanded}>
                            <Typography
                                sx={{
                                    fontSize: '13px',
                                    color: '#6B7280',
                                    mt: 1,
                                    pt: 1,
                                    borderTop: '1px solid #F3F4F6',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                }}
                            >
                                {tarea.descripcion}
                            </Typography>
                        </Collapse>
                    )}
                </Box>

                {/* Botón eliminar (solo visible al hover y si tiene permiso) */}
                {canDelete && isHovered && (
                    <IconButton
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete?.(tarea.id);
                        }}
                        sx={{
                            color: '#EF4444',
                            p: 0.5,
                            '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)' },
                        }}
                    >
                        <i className="fa-solid fa-trash" style={{ fontSize: '12px' }} />
                    </IconButton>
                )}
            </Box>
        </Box>
    );
}

