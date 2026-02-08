'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';

interface KPICardProps {
    title: string;
    value: string | number;
    icon: string;
    iconColor: string;
    iconBgColor: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
}

export default function KPICard({ title, value, icon, iconColor, iconBgColor, trend }: KPICardProps) {
    return (
        <Box sx={{ bgcolor: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ bgcolor: iconBgColor, borderRadius: '8px', p: 1.5 }}>
                    <i className={icon} style={{ fontSize: '20px', color: iconColor }} />
                </Box>
                {trend && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <i
                            className={`fa-solid fa-arrow-${trend.isPositive ? 'up' : 'down'}`}
                            style={{ fontSize: '12px', color: trend.isPositive ? '#10B981' : '#EF4444' }}
                        />
                        <Typography sx={{
                            fontSize: '12px',
                            color: trend.isPositive ? '#10B981' : '#EF4444',
                            fontWeight: 600
                        }}>
                            {Math.abs(trend.value).toFixed(1)}%
                        </Typography>
                    </Box>
                )}
            </Box>
            <Typography sx={{ fontSize: '12px', color: '#6B7280', mb: 0.5 }}>
                {title}
            </Typography>
            <Typography sx={{ fontSize: '24px', fontWeight: 700, color: '#1F2937' }}>
                {value}
            </Typography>
        </Box>
    );
}

