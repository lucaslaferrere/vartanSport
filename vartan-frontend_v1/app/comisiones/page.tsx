'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Box, Typography, Grid, CircularProgress } from '@mui/material';
import { colors } from '@/src/theme/colors';
import { comisionService } from '@services/comision.service';
import { usuarioService } from '@services/usuario.service';
import ConfigurarComisionModal from '@components/Modals/ConfigurarComisionModal';
import KPICard from '@components/Cards/KPICard';
import VendedorCard from '@components/Cards/VendedorCard';
import { DistribucionChart } from '@components/Charts/ComisionesCharts';
import { IUser } from '@models/entities/userEntity';
import { useAuthStore } from '@libraries/store';
import { useMounted } from '@hooks/useMounted';
import { useNotification } from '@components/Notifications';

interface IVendedorDisplay {
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
    comision_mes_anterior: number;
    historial_comisiones: { mes: number; anio: number; comision: number }[];
    rank?: number;
}


const formatCurrency = (value: number) => {
    if (value === undefined || value === null || isNaN(value)) return '$0';
    return '$' + value.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

export default function ComisionesPage() {
    const mounted = useMounted();
    const { addNotification } = useNotification();
    const { user } = useAuthStore();

    const [vendedores, setVendedores] = useState<IVendedorDisplay[]>([]);
    const [configurarModalOpen, setConfigurarModalOpen] = useState(false);
    const [vendedorSeleccionado, setVendedorSeleccionado] = useState<IUser | null>(null);
    const [miConfiguracion, setMiConfiguracion] = useState<IUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDataDueno = useCallback(async () => {
        if (!mounted) return;
        setLoading(true);
        setError(null);

        try {
            const [vendedoresData, comisionesData] = await Promise.all([
                usuarioService.getVendedores(),
                comisionService.getAll(),
            ]);


            const hoy = new Date();
            const mesActual = hoy.getMonth() + 1;
            const anioActual = hoy.getFullYear();
            const mesAnterior = mesActual === 1 ? 12 : mesActual - 1;
            const anioAnterior = mesActual === 1 ? anioActual - 1 : anioActual;

            const vendedoresDisplay: IVendedorDisplay[] = vendedoresData.map(v => {
                const comActual = comisionesData.find(c => c.usuario_id === v.id && c.mes === mesActual && c.anio === anioActual);
                const comAnterior = comisionesData.find(c => c.usuario_id === v.id && c.mes === mesAnterior && c.anio === anioAnterior);

                const ventas = comActual?.total_ventas || 0;
                const gastoPublicitario = v.gasto_publicitario || 0;
                const base = ventas - gastoPublicitario;
                const porcentaje = v.porcentaje_comision || 0;
                const comisionEst = base > 0 ? (base * porcentaje) / 100 : 0;
                const sueldoBase = v.sueldo || 0;
                const sueldoTotal = sueldoBase + comisionEst;

                const historial = comisionesData
                    .filter(c => c.usuario_id === v.id)
                    .sort((a, b) => (a.anio * 12 + a.mes) - (b.anio * 12 + b.mes))
                    .slice(-6)
                    .map(c => ({ mes: c.mes, anio: c.anio, comision: c.total_comision }));

                return {
                    id: v.id,
                    nombre: v.nombre,
                    email: v.email,
                    porcentaje_comision: porcentaje,
                    gasto_publicitario: gastoPublicitario,
                    sueldo: sueldoBase,
                    observaciones_config: v.observaciones_config,
                    ventas_mes_actual: ventas,
                    comision_estimada: comisionEst,
                    sueldo_total: sueldoTotal,
                    ventas_mes_anterior: comAnterior?.total_ventas || 0,
                    comision_mes_anterior: comAnterior?.total_comision || 0,
                    historial_comisiones: historial,
                };
            });

            // Ordenar por sueldo total (sueldo base + comisión) de mayor a menor
            const ordenados = [...vendedoresDisplay].sort((a, b) => b.sueldo_total - a.sueldo_total);
            ordenados.forEach((v, i) => { v.rank = i + 1; });

            setVendedores(ordenados);
        } catch (err) {
            console.error('Error:', err);
            setError('Error al cargar datos. Verifica que el backend esté corriendo.');
        } finally {
            setLoading(false);
        }
    }, [mounted]);

    const fetchDataVendedor = useCallback(async () => {
        if (!mounted) return;
        setLoading(true);
        setError(null);

        try {
            const userData = await usuarioService.getMe();
            setMiConfiguracion(userData);
        } catch (err) {
            console.error('Error:', err);
            setError('Error al cargar datos');
        } finally {
            setLoading(false);
        }
    }, [mounted]);

    useEffect(() => {
        if (mounted) {
            if (user?.rol === 'dueño') {
                fetchDataDueno();
            } else {
                fetchDataVendedor();
            }
        }
    }, [mounted, user?.rol, fetchDataDueno, fetchDataVendedor]);

    const handleConfigurar = (v: IVendedorDisplay) => {
        setVendedorSeleccionado({
            id: v.id,
            nombre: v.nombre,
            email: v.email,
            rol: 'vendedor',
            activo: true,
            porcentaje_comision: v.porcentaje_comision,
            gasto_publicitario: v.gasto_publicitario,
            sueldo: v.sueldo,
            observaciones_config: v.observaciones_config,
            fecha_creacion: new Date().toISOString(),
        });
        setConfigurarModalOpen(true);
    };

    const metricas = useMemo(() => {
        const totalCom = vendedores.reduce((s, v) => s + v.comision_estimada, 0);
        const totalSueldos = vendedores.reduce((s, v) => s + v.sueldo_total, 0);
        const totalVentas = vendedores.reduce((s, v) => s + v.ventas_mes_actual, 0);
        const promedio = vendedores.length > 0 ? totalCom / vendedores.length : 0;
        const totalAnterior = vendedores.reduce((s, v) => s + v.comision_mes_anterior, 0);
        const crec = totalAnterior > 0 ? ((totalCom - totalAnterior) / totalAnterior) * 100 : 0;
        return { totalCom, totalSueldos, totalVentas, promedio, crec };
    }, [vendedores]);

    const datosDistribucion = useMemo(() => {
        const filtrados = vendedores
            .filter(v => v.sueldo_total > 0)
            .map(v => ({ nombre: v.nombre, value: v.sueldo_total }));
        return filtrados;
    }, [vendedores]);


    if (!mounted) return null;

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <CircularProgress sx={{ color: colors.primary }} />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="error">{error}</Typography>
            </Box>
        );
    }

    return (
        <>
            <Box>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1F2937', fontSize: '24px', mb: 0.5 }}>
                            Comisiones
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '14px' }}>
                            {user?.rol === 'dueño' ? 'Dashboard de rendimiento' : 'Mi configuración'}
                        </Typography>
                    </Box>
                </Box>

                {/* Vista VENDEDOR */}
                {user?.rol === 'vendedor' && miConfiguracion && (
                    <Box sx={{ bgcolor: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', p: 4 }}>
                        <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', mb: 3 }}>
                            Mi Configuración
                        </Typography>
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Box sx={{ bgcolor: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '8px', p: 3, textAlign: 'center' }}>
                                    <Typography sx={{ fontSize: '12px', color: '#6B7280', mb: 1, textTransform: 'uppercase', fontWeight: 600 }}>Porcentaje</Typography>
                                    <Typography sx={{ fontSize: '32px', fontWeight: 700, color: colors.primary }}>{miConfiguracion.porcentaje_comision}%</Typography>
                                </Box>
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Box sx={{ bgcolor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', p: 3, textAlign: 'center' }}>
                                    <Typography sx={{ fontSize: '12px', color: '#6B7280', mb: 1, textTransform: 'uppercase', fontWeight: 600 }}>Gasto Pub.</Typography>
                                    <Typography sx={{ fontSize: '32px', fontWeight: 700, color: '#DC2626' }}>{formatCurrency(miConfiguracion.gasto_publicitario)}</Typography>
                                </Box>
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Box sx={{ bgcolor: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', p: 3 }}>
                                    <Typography sx={{ fontSize: '12px', color: '#6B7280', mb: 1, textTransform: 'uppercase', fontWeight: 600 }}>Cálculo</Typography>
                                    <Typography sx={{ fontSize: '13px', color: '#059669', fontWeight: 500 }}>(Ventas - Gasto) x {miConfiguracion.porcentaje_comision}%</Typography>
                                </Box>
                            </Grid>
                            {miConfiguracion.observaciones_config && (
                                <Grid size={{ xs: 12 }}>
                                    <Box sx={{ bgcolor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', p: 3 }}>
                                        <Typography sx={{ fontSize: '12px', color: '#6B7280', mb: 1.5, textTransform: 'uppercase', fontWeight: 600 }}>Observaciones</Typography>
                                        <Typography sx={{ fontSize: '14px', color: '#374151', fontStyle: 'italic' }}>{miConfiguracion.observaciones_config}</Typography>
                                    </Box>
                                </Grid>
                            )}
                        </Grid>
                    </Box>
                )}

                {/* Vista DUEÑO */}
                {user?.rol === 'dueño' && (
                    <>
                        {/* KPIs */}
                        <Grid container spacing={3} sx={{ mb: 4 }}>
                            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                                <KPICard
                                    title="Comisiones del Mes"
                                    value={formatCurrency(metricas.totalCom)}
                                    icon="fa-solid fa-coins"
                                    iconColor={colors.primary}
                                    iconBgColor="rgba(59, 130, 246, 0.1)"
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                                <KPICard
                                    title="Sueldos Totales"
                                    value={formatCurrency(metricas.totalSueldos)}
                                    icon="fa-solid fa-wallet"
                                    iconColor="#10B981"
                                    iconBgColor="rgba(16, 185, 129, 0.1)"
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                                <KPICard
                                    title="Total Ventas"
                                    value={formatCurrency(metricas.totalVentas)}
                                    icon="fa-solid fa-dollar-sign"
                                    iconColor="#F59E0B"
                                    iconBgColor="rgba(245, 158, 11, 0.1)"
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                                <KPICard
                                    title="Vendedores Activos"
                                    value={vendedores.length}
                                    icon="fa-solid fa-users"
                                    iconColor="#8B5CF6"
                                    iconBgColor="rgba(139, 92, 246, 0.1)"
                                />
                            </Grid>
                        </Grid>

                        {/* Gráficos */}
                        <Grid container spacing={3} sx={{ mb: 4 }}>
                            <Grid size={{ xs: 12 }}>
                                <DistribucionChart data={datosDistribucion} total={metricas.totalSueldos} formatCurrency={formatCurrency} />
                            </Grid>
                        </Grid>

                        {/* Vendedores */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography sx={{ fontSize: '16px', fontWeight: 600, color: '#1F2937' }}>
                                Vendedores ({vendedores.length})
                            </Typography>
                        </Box>

                        <Grid container spacing={3}>
                            {vendedores.map((v) => (
                                <Grid size={{ xs: 12, md: 6, lg: 4 }} key={v.id}>
                                    <VendedorCard
                                        vendedor={v}
                                        formatCurrency={formatCurrency}
                                        onConfigurar={() => handleConfigurar(v)}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    </>
                )}
            </Box>

            {user?.rol === 'dueño' && (
                <ConfigurarComisionModal
                    open={configurarModalOpen}
                    onClose={() => { setConfigurarModalOpen(false); setVendedorSeleccionado(null); }}
                    onSuccess={() => { fetchDataDueno(); addNotification('Configuración actualizada', 'success'); }}
                    vendedor={vendedorSeleccionado}
                />
            )}
        </>
    );
}

