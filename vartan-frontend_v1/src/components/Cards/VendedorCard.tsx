'use client';

import React from 'react';
import { Box, Typography, Grid, IconButton } from '@mui/material';
import { colors } from '@/src/theme/colors';

interface VendedorCardProps {
    vendedor: {
        id: number;
        nombre: string;
        email: string;
        porcentaje_comision: number;
        gasto_publicitario: number;
        sueldo: number;
        observaciones_config?: string;
        ventas_mes_actual: number;
        comision_estimada: number;
        sueldo_total: number;
        ventas_mes_anterior: number;
        historial_comisiones: { mes: number; anio: number; comision: number }[];
        rank?: number;
    };
    formatCurrency: (value: number) => string;
    onConfigurar: () => void;
}

export default function VendedorCard({ vendedor, formatCurrency, onConfigurar }: VendedorCardProps) {
    const isTopPerformer = vendedor.rank && vendedor.rank <= 3;
    const rankEmoji = vendedor.rank === 1 ? '🥇' : vendedor.rank === 2 ? '🥈' : '🥉';
    const ventasSubieron = vendedor.ventas_mes_actual >= vendedor.ventas_mes_anterior;

    return (
        <Box sx={{
            bgcolor: 'white',
            border: `2px solid ${isTopPerformer ? '#F59E0B' : '#E5E7EB'}`,
            borderRadius: '12px',
            p: 3,
            transition: 'all 0.2s',
            position: 'relative',
            '&:hover': {
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                borderColor: colors.primary,
            }
        }}>
            {isTopPerformer && (
                <Box sx={{
                    position: 'absolute',
                    top: -10,
                    right: 16,
                    bgcolor: '#F59E0B',
                    color: 'white',
                    borderRadius: '12px',
                    px: 2,
                    py: 0.5,
                    fontSize: '12px',
                    fontWeight: 700,
                    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
                }}>
                    {rankEmoji} Top {vendedor.rank}
                </Box>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                    <Typography sx={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', mb: 0.5 }}>
                        {vendedor.nombre}
                    </Typography>
                    <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>
                        {vendedor.email}
                    </Typography>
                </Box>
                <IconButton
                    onClick={onConfigurar}
                    sx={{
                        bgcolor: 'rgba(59, 130, 246, 0.1)',
                        color: colors.primary,
                        '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.2)' },
                    }}
                >
                    <i className="fa-solid fa-sliders" style={{ fontSize: '14px' }} />
                </IconButton>
            </Box>

            <Box sx={{ bgcolor: '#F9FAFB', borderRadius: '8px', p: 2, mb: 2 }}>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 4 }}>
                        <Typography sx={{ fontSize: '11px', color: '#6B7280', mb: 0.5 }}>Comisión</Typography>
                        <Typography sx={{ fontSize: '16px', fontWeight: 600, color: colors.primary }}>
                            {vendedor.porcentaje_comision}%
                        </Typography>
                    </Grid>
                    <Grid size={{ xs: 4 }}>
                        <Typography sx={{ fontSize: '11px', color: '#6B7280', mb: 0.5 }}>Gasto Pub.</Typography>
                        <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#DC2626' }}>
                            {formatCurrency(vendedor.gasto_publicitario)}
                        </Typography>
                    </Grid>
                    <Grid size={{ xs: 4 }}>
                        <Typography sx={{ fontSize: '11px', color: '#6B7280', mb: 0.5 }}>Sueldo Base</Typography>
                        <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#10B981' }}>
                            {formatCurrency(vendedor.sueldo)}
                        </Typography>
                    </Grid>
                </Grid>
            </Box>

            <Box sx={{ borderTop: '1px solid #E5E7EB', pt: 2 }}>
                <Typography sx={{ fontSize: '11px', color: '#6B7280', mb: 1 }}>Mes Actual</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>Ventas:</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#1F2937' }}>
                            {formatCurrency(vendedor.ventas_mes_actual)}
                        </Typography>
                        {vendedor.ventas_mes_anterior > 0 && (
                            <i
                                className={`fa-solid fa-arrow-${ventasSubieron ? 'up' : 'down'}`}
                                style={{ fontSize: '10px', color: ventasSubieron ? '#10B981' : '#EF4444' }}
                            />
                        )}
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>Comisión estimada:</Typography>
                    <Typography sx={{ fontSize: '13px', fontWeight: 600, color: colors.primary }}>
                        {formatCurrency(vendedor.comision_estimada)}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: '1px dashed #E5E7EB' }}>
                    <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#1F2937' }}>Sueldo Total:</Typography>
                    <Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#10B981' }}>
                        {formatCurrency(vendedor.sueldo_total)}
                    </Typography>
                </Box>
            </Box>

            {vendedor.observaciones_config && (
                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #E5E7EB' }}>
                    <Typography sx={{ fontSize: '11px', color: '#6B7280', mb: 0.5 }}>Observaciones</Typography>
                    <Typography sx={{ fontSize: '12px', color: '#374151', fontStyle: 'italic', lineHeight: 1.5 }}>
                        {vendedor.observaciones_config}
                    </Typography>
                </Box>
            )}
        </Box>
    );
}

