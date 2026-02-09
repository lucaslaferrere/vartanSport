'use client';

import React from 'react';
import { Box, Typography, Grid } from '@mui/material';
import { colors } from '@/src/theme/colors';

const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316', '#84CC16'];

interface ChartCardProps {
    title: string;
    children: React.ReactNode;
}

function ChartCard({ title, children }: ChartCardProps) {
    return (
        <Box sx={{ bgcolor: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', p: 3 }}>
            <Typography sx={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', mb: 3 }}>
                {title}
            </Typography>
            {children}
        </Box>
    );
}

// Componente de barra simple sin recharts
function SimpleBar({ label, value, maxValue, color }: { label: string; value: number; maxValue: number; color: string }) {
    const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
    return (
        <Box sx={{ mb: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>{label}</Typography>
                <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#1F2937' }}>
                    ${(value / 1000).toFixed(1)}k
                </Typography>
            </Box>
            <Box sx={{ bgcolor: '#E5E7EB', borderRadius: '4px', height: 8 }}>
                <Box sx={{ bgcolor: color, borderRadius: '4px', height: '100%', width: `${percentage}%`, transition: 'width 0.3s' }} />
            </Box>
        </Box>
    );
}

interface RankingChartProps {
    data: { nombre: string; comision: number }[];
    formatCurrency: (value: number) => string;
}

export function RankingChart({ data, formatCurrency: _formatCurrency }: RankingChartProps) {
    const maxValue = Math.max(...data.map(d => d.comision), 1);

    return (
        <ChartCard title="Ranking de Comisiones del Mes">
            <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                {data.length === 0 ? (
                    <Typography sx={{ color: '#6B7280', fontSize: '14px', textAlign: 'center', py: 4 }}>
                        No hay datos disponibles
                    </Typography>
                ) : (
                    data.map((item, index) => (
                        <SimpleBar
                            key={`ranking-${index}`}
                            label={`${index + 1}. ${item.nombre}`}
                            value={item.comision}
                            maxValue={maxValue}
                            color={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                    ))
                )}
            </Box>
        </ChartCard>
    );
}

interface EvolucionChartProps {
    data: { mes: string; total: number }[];
    formatCurrency: (value: number) => string;
}

export function EvolucionChart({ data, formatCurrency: _formatCurrency }: EvolucionChartProps) {
    const maxValue = Math.max(...data.map(d => d.total), 1);

    return (
        <ChartCard title="Evolución de Comisiones" >
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 200, pt: 2 }}>
                {data.length === 0 ? (
                    <Typography sx={{ color: '#6B7280', fontSize: '14px', textAlign: 'center', width: '100%', py: 4 }}>
                        No hay datos disponibles
                    </Typography>
                ) : (
                    data.map((item, index) => {
                        const height = maxValue > 0 ? (item.total / maxValue) * 160 : 0;
                        return (
                            <Box key={`evol-${index}`} sx={{ flex: 1, textAlign: 'center' }}>
                                <Box
                                    sx={{
                                        bgcolor: colors.primary,
                                        borderRadius: '4px 4px 0 0',
                                        height: height,
                                        minHeight: 4,
                                        transition: 'height 0.3s',
                                        mx: 'auto',
                                        width: '70%',
                                    }}
                                />
                                <Typography sx={{ fontSize: '10px', color: '#6B7280', mt: 1 }}>
                                    {item.mes.split(' ')[0]}
                                </Typography>
                                <Typography sx={{ fontSize: '10px', fontWeight: 600, color: '#1F2937' }}>
                                    ${(item.total / 1000).toFixed(0)}k
                                </Typography>
                            </Box>
                        );
                    })
                )}
            </Box>
        </ChartCard>
    );
}

interface DistribucionChartProps {
    data: { nombre: string; value: number }[];
    total: number;
    formatCurrency: (value: number) => string;
}

export function DistribucionChart({ data, total, formatCurrency }: DistribucionChartProps) {
    return (
        <ChartCard title="Distribución de Sueldos Totales">
            <Grid container spacing={3}>
                {/* Gráfico de torta visual */}
                <Grid size={{ xs: 12, md: 5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: 250 }}>
                        {data.length === 0 ? (
                            <Typography sx={{ color: '#6B7280', fontSize: '14px', textAlign: 'center' }}>
                                No hay datos disponibles
                            </Typography>
                        ) : (
                            <Box sx={{ position: 'relative', width: 200, height: 200 }}>
                                <svg width="200" height="200" viewBox="0 0 200 200">
                                    {data.map((item, index) => {
                                        const percentage = total > 0 ? (item.value / total) * 100 : 0;
                                        const angle = (percentage / 100) * 360;

                                        // Calcular el inicio del arco (acumulado de los anteriores)
                                        let startAngle = 0;
                                        for (let i = 0; i < index; i++) {
                                            const prevPercentage = total > 0 ? (data[i].value / total) * 100 : 0;
                                            startAngle += (prevPercentage / 100) * 360;
                                        }

                                        const startRad = (startAngle - 90) * (Math.PI / 180);
                                        const endRad = (startAngle + angle - 90) * (Math.PI / 180);

                                        const outerRadius = 90;
                                        const innerRadius = 50;

                                        const x1 = 100 + outerRadius * Math.cos(startRad);
                                        const y1 = 100 + outerRadius * Math.sin(startRad);
                                        const x2 = 100 + outerRadius * Math.cos(endRad);
                                        const y2 = 100 + outerRadius * Math.sin(endRad);
                                        const x3 = 100 + innerRadius * Math.cos(endRad);
                                        const y3 = 100 + innerRadius * Math.sin(endRad);
                                        const x4 = 100 + innerRadius * Math.cos(startRad);
                                        const y4 = 100 + innerRadius * Math.sin(startRad);

                                        const largeArcFlag = angle > 180 ? 1 : 0;

                                        const pathData = [
                                            `M ${x1} ${y1}`,
                                            `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                                            `L ${x3} ${y3}`,
                                            `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
                                            'Z'
                                        ].join(' ');

                                        return (
                                            <path
                                                key={`slice-${index}`}
                                                d={pathData}
                                                fill={CHART_COLORS[index % CHART_COLORS.length]}
                                            />
                                        );
                                    })}
                                </svg>
                                <Box sx={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    textAlign: 'center'
                                }}>
                                    <Typography sx={{ fontSize: '11px', color: '#6B7280' }}>Total</Typography>
                                    <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#1F2937' }}>
                                        {formatCurrency(total)}
                                    </Typography>
                                </Box>
                            </Box>
                        )}
                    </Box>
                </Grid>

                {/* Leyenda */}
                <Grid size={{ xs: 12, md: 7 }}>
                    <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                        {data.length === 0 ? (
                            <Typography sx={{ color: '#6B7280', fontSize: '14px', textAlign: 'center', py: 4 }}>
                                No hay datos disponibles
                            </Typography>
                        ) : (
                            data.map((item, index) => {
                                const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
                                return (
                                    <Box key={`dist-${index}`} sx={{ display: 'flex', alignItems: 'center', mb: 1.5, gap: 2 }}>
                                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: CHART_COLORS[index % CHART_COLORS.length], flexShrink: 0 }} />
                                        <Box sx={{ flex: 1 }}>
                                            <Typography sx={{ fontSize: '13px', color: '#1F2937', fontWeight: 500 }}>
                                                {item.nombre}
                                            </Typography>
                                        </Box>
                                        <Typography sx={{ fontSize: '13px', color: '#6B7280' }}>
                                            {percentage}%
                                        </Typography>
                                        <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#1F2937', minWidth: 70, textAlign: 'right' }}>
                                            {formatCurrency(item.value)}
                                        </Typography>
                                    </Box>
                                );
                            })
                        )}
                    </Box>
                </Grid>
            </Grid>
        </ChartCard>
    );
}

interface ComparativoChartProps {
    data: { nombre: string; ventas: number; comision: number }[];
    formatCurrency: (value: number) => string;
}

export function ComparativoChart({ data, formatCurrency: _formatCurrency }: ComparativoChartProps) {
    const maxValue = Math.max(...data.flatMap(d => [d.ventas, d.comision]), 1);

    return (
        <ChartCard title="Ventas vs Comisiones">
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '2px', bgcolor: '#10B981' }} />
                    <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>Ventas</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '2px', bgcolor: colors.primary }} />
                    <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>Comisión</Typography>
                </Box>
            </Box>
            <Box sx={{ maxHeight: 250, overflow: 'auto' }}>
                {data.length === 0 ? (
                    <Typography sx={{ color: '#6B7280', fontSize: '14px', textAlign: 'center', py: 4 }}>
                        No hay datos disponibles
                    </Typography>
                ) : (
                    data.map((item, index) => (
                        <Box key={`comp-${index}`} sx={{ mb: 2 }}>
                            <Typography sx={{ fontSize: '12px', color: '#6B7280', mb: 0.5 }}>{item.nombre}</Typography>
                            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                                <Box sx={{ flex: 1 }}>
                                    <Box sx={{ bgcolor: '#E5E7EB', borderRadius: '4px', height: 8 }}>
                                        <Box sx={{ bgcolor: '#10B981', borderRadius: '4px', height: '100%', width: `${(item.ventas / maxValue) * 100}%` }} />
                                    </Box>
                                </Box>
                                <Typography sx={{ fontSize: '10px', color: '#6B7280', minWidth: 50 }}>
                                    ${(item.ventas / 1000).toFixed(0)}k
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', mt: 0.5 }}>
                                <Box sx={{ flex: 1 }}>
                                    <Box sx={{ bgcolor: '#E5E7EB', borderRadius: '4px', height: 8 }}>
                                        <Box sx={{ bgcolor: colors.primary, borderRadius: '4px', height: '100%', width: `${(item.comision / maxValue) * 100}%` }} />
                                    </Box>
                                </Box>
                                <Typography sx={{ fontSize: '10px', color: '#6B7280', minWidth: 50 }}>
                                    ${(item.comision / 1000).toFixed(0)}k
                                </Typography>
                            </Box>
                        </Box>
                    ))
                )}
            </Box>
        </ChartCard>
    );
}

