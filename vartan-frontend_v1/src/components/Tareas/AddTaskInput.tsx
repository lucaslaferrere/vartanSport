'use client';

import React, { useState } from 'react';
import { Box, TextField, IconButton, Collapse } from '@mui/material';
import { colors } from '@/src/theme/colors';

interface AddTaskInputProps {
    onAdd: (titulo: string, descripcion?: string) => void;
    loading?: boolean;
}

export default function AddTaskInput({ onAdd, loading = false }: AddTaskInputProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [titulo, setTitulo] = useState('');
    const [descripcion, setDescripcion] = useState('');

    const handleSubmit = () => {
        if (titulo.trim()) {
            onAdd(titulo.trim(), descripcion.trim() || undefined);
            setTitulo('');
            setDescripcion('');
            setIsOpen(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
        if (e.key === 'Escape') {
            setIsOpen(false);
            setTitulo('');
            setDescripcion('');
        }
    };

    if (!isOpen) {
        return (
            <Box
                onClick={() => setIsOpen(true)}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 1.5,
                    border: '1px dashed #D1D5DB',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                        borderColor: colors.primary,
                        bgcolor: 'rgba(59, 130, 246, 0.02)',
                    },
                }}
            >
                <i className="fa-solid fa-plus" style={{ fontSize: '12px', color: colors.primary }} />
                <span style={{ fontSize: '14px', color: '#6B7280' }}>Nueva tarea</span>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                bgcolor: 'white',
                border: `1px solid ${colors.primary}`,
                borderRadius: '8px',
                p: 1.5,
            }}
        >
            {/* Campo título */}
            <TextField
                fullWidth
                autoFocus
                placeholder="Título de la tarea..."
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                sx={{
                    mb: 1,
                    '& .MuiOutlinedInput-root': {
                        fontSize: '14px',
                        '& fieldset': { border: 'none' },
                    },
                    '& .MuiInputBase-input': { padding: '8px 0' },
                }}
            />

            {/* Campo descripción */}
            <Collapse in={titulo.length > 0}>
                <TextField
                    fullWidth
                    multiline
                    rows={2}
                    placeholder="Descripción (opcional)..."
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                    sx={{
                        mb: 1,
                        '& .MuiOutlinedInput-root': {
                            fontSize: '13px',
                            '& fieldset': { border: 'none' },
                            bgcolor: '#F9FAFB',
                            borderRadius: '6px',
                        },
                        '& .MuiInputBase-input': { padding: '8px' },
                    }}
                />
            </Collapse>

            {/* Botones */}
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <IconButton
                    size="small"
                    onClick={() => {
                        setIsOpen(false);
                        setTitulo('');
                        setDescripcion('');
                    }}
                    disabled={loading}
                    sx={{ color: '#6B7280', '&:hover': { bgcolor: '#F3F4F6' } }}
                >
                    <i className="fa-solid fa-xmark" style={{ fontSize: '14px' }} />
                </IconButton>
                <IconButton
                    size="small"
                    onClick={handleSubmit}
                    disabled={loading || !titulo.trim()}
                    sx={{
                        color: 'white',
                        bgcolor: colors.primary,
                        '&:hover': { bgcolor: '#2563EB' },
                        '&:disabled': { bgcolor: '#D1D5DB', color: 'white' },
                    }}
                >
                    <i className="fa-solid fa-check" style={{ fontSize: '14px' }} />
                </IconButton>
            </Box>
        </Box>
    );
}

