'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Box, Typography, Grid, CircularProgress, Card, CardContent, Chip, Divider, Paper, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { colors } from '@/src/theme/colors';
import { comisionService, IMiResumenComision } from '@services/comision.service';
import { IComision } from '@models/entities/comisionentity';
import { usuarioService } from '@services/usuario.service';
import { ventaService } from '@services/venta.service';
import ConfigurarComisionModal from '@components/Modals/ConfigurarComisionModal';
import KPICard from '@components/Cards/KPICard';
import StatCard from '@components/Cards/StatCard';
import VendedorCard from '@components/Cards/VendedorCard';
import { DistribucionChart } from '@components/Charts/ComisionesCharts';
import { IUser } from '@models/entities/userEntity';
import { useAuthStore } from '@libraries/store';
import { useMounted } from '@hooks/useMounted';
import { useNotification } from '@components/Notifications';

const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const VENDOR_COLORS = ['#588a9e', '#285283', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#F97316'];

interface IHistorialRow extends IComision {
    nombre: string;
    rol: IUser['rol'];
}

interface IVendedorDisplay {
    id: number;
    nombre: string;
    email: string;
    rol: IUser['rol'];
    porcentaje_comision: number;
    gasto_publicitario: number;
    sueldo: number;
    observaciones_config?: string;
    ventas_mes_actual: number;
    cantidad_ventas_mes_actual: number;
    ganancia_mes_actual: number;
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
const [miResumen, setMiResumen] = useState<IMiResumenComision | null>(null);
    const [historialCompleto, setHistorialCompleto] = useState<IHistorialRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [calcularMes, setCalcularMes] = useState(new Date().getMonth() + 1);
    const [calcularAnio, setCalcularAnio] = useState(new Date().getFullYear());

    const fetchDataDueno = useCallback(async () => {
        if (!mounted) return;
        setLoading(true);
        setError(null);

        try {
            // Auto-calcular el período seleccionado y su mes anterior.
            const mesActualAuto = calcularMes;
            const anioActualAuto = calcularAnio;
            const mesAnteriorAuto = mesActualAuto === 1 ? 12 : mesActualAuto - 1;
            const anioAnteriorAuto = mesActualAuto === 1 ? anioActualAuto - 1 : anioActualAuto;
            await Promise.all([
                comisionService.calcularComisiones(mesActualAuto, anioActualAuto).catch(() => null),
                comisionService.calcularComisiones(mesAnteriorAuto, anioAnteriorAuto).catch(() => null),
            ]);

            const [vendedoresData, comisionesData, miUsuario, resumenDueno, todasVentas] = await Promise.all([
                usuarioService.getVendedores(),
                comisionService.getAll(),
                usuarioService.getMe(),
                comisionService.getMiResumen().catch(() => null),
                ventaService.getAllUnpaginated(),
            ]);

            const ventasPorUsuario = new Map<number, number>();
            const gananciaPorUsuario = new Map<number, number>();
            todasVentas.forEach(v => {
                const fecha = new Date(v.fecha_venta);
                if (fecha.getMonth() + 1 === mesActualAuto && fecha.getFullYear() === anioActualAuto) {
                    ventasPorUsuario.set(v.usuario_id, (ventasPorUsuario.get(v.usuario_id) || 0) + 1);
                    gananciaPorUsuario.set(v.usuario_id, (gananciaPorUsuario.get(v.usuario_id) || 0) + (v.ganancia || 0));
                }
            });

            setMiResumen(resumenDueno);

            // Incluir al dueño autenticado para que su comisión también aparezca en el dashboard.
            const usuariosBase = [...vendedoresData];
            if (!usuariosBase.some((u) => u.id === miUsuario.id)) {
                usuariosBase.push(miUsuario);
            }

            // Fetch gastos publicitarios del mes actual desde comisiones_publicitarias,
            // ya que comActual.gasto_publicitario puede llegar null del backend.
            const gastosResults = await Promise.allSettled(
                usuariosBase.map(u =>
                    comisionService.getComisionPublicitaria(u.id, mesActualAuto, anioActualAuto)
                )
            );
            const gastoMap = new Map<number, number>();
            const sueldoMap = new Map<number, number>();
            usuariosBase.forEach((u, i) => {
                const r = gastosResults[i];
                if (r.status === 'fulfilled') {
                    gastoMap.set(u.id, r.value.valor_comision ?? 0);
                    sueldoMap.set(u.id, r.value.sueldo ?? u.sueldo ?? 0);
                } else {
                    sueldoMap.set(u.id, u.sueldo ?? 0);
                }
            });

            const mesActual = calcularMes;
            const anioActual = calcularAnio;
            const mesAnterior = mesActual === 1 ? 12 : mesActual - 1;
            const anioAnterior = mesActual === 1 ? anioActual - 1 : anioActual;

            const vendedoresDisplay: IVendedorDisplay[] = usuariosBase.map(v => {
                const comActual = comisionesData.find(c => c.usuario_id === v.id && c.mes === mesActual && c.anio === anioActual);
                const comAnterior = comisionesData.find(c => c.usuario_id === v.id && c.mes === mesAnterior && c.anio === anioAnterior);

                const ventas = comActual?.total_ventas || 0;
                const comisionEst = comActual?.total_comision || 0;
                const sueldoBase = sueldoMap.get(v.id) ?? v.sueldo ?? 0;
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
                    rol: v.rol,
                    porcentaje_comision: v.porcentaje_comision,
                    gasto_publicitario: gastoMap.get(v.id) ?? comActual?.gasto_publicitario ?? 0,
                    sueldo: sueldoBase,
                    observaciones_config: v.observaciones_config,
                    ventas_mes_actual: ventas,
                    cantidad_ventas_mes_actual: ventasPorUsuario.get(v.id) || 0,
                    ganancia_mes_actual: gananciaPorUsuario.get(v.id) || 0,
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

            // Construir historial completo: todas las comisiones de todos los usuarios
            const usuariosMap = new Map(usuariosBase.map(u => [u.id, u]));
            const historial: IHistorialRow[] = comisionesData
                .map(c => {
                    const u = usuariosMap.get(c.usuario_id);
                    return u ? { ...c, nombre: u.nombre, rol: u.rol } : null;
                })
                .filter((c): c is IHistorialRow => c !== null)
                .sort((a, b) => (b.anio * 12 + b.mes) - (a.anio * 12 + a.mes));
            setHistorialCompleto(historial);
        } catch (err) {
            console.error('Error:', err);
            setError('Error al cargar datos. Verifica que el backend esté corriendo.');
        } finally {
            setLoading(false);
        }
    }, [mounted, calcularMes, calcularAnio]);

    const fetchDataVendedor = useCallback(async () => {
        if (!mounted) return;
        setLoading(true);
        setError(null);

        try {
            const resumen = await comisionService.getMiResumen().catch(() => null);
            setMiResumen(resumen);
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
            rol: v.rol,
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

    const historialChartData = useMemo(() => {
        const monthKeys = [...new Set(historialCompleto.map(h => `${h.anio}-${String(h.mes).padStart(2, '0')}`))]
            .sort();
        return monthKeys.map(key => {
            const [anioStr, mesStr] = key.split('-');
            const mes = Number(mesStr);
            const anio = Number(anioStr);
            const point: Record<string, string | number> = {
                name: meses[mes - 1].slice(0, 3) + ' ' + String(anio).slice(2),
            };
            historialCompleto
                .filter(h => h.mes === mes && h.anio === anio)
                .forEach(h => {
                    point[`ventas_${h.nombre}`] = h.total_ventas;
                    point[`com_${h.nombre}`] = h.total_comision;
                });
            return point;
        });
    }, [historialCompleto]);

    const vendedoresHistorial = useMemo(() =>
        [...new Set(historialCompleto.map(h => h.nombre))],
        [historialCompleto]
    );


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
                            {user?.rol === 'dueño' ? 'Dashboard de rendimiento - ' + meses[calcularMes - 1] + ' ' + calcularAnio : 'Mi configuración'}
                        </Typography>
                    </Box>
                    {user?.rol === 'dueño' && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                            <FormControl size="small" sx={{ minWidth: 130 }}>
                                <InputLabel>Mes</InputLabel>
                                <Select value={calcularMes} label="Mes" onChange={(e) => setCalcularMes(Number(e.target.value))}>
                                    {meses.map((m, i) => (
                                        <MenuItem key={i + 1} value={i + 1}>{m}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl size="small" sx={{ minWidth: 90 }}>
                                <InputLabel>Año</InputLabel>
                                <Select value={calcularAnio} label="Año" onChange={(e) => setCalcularAnio(Number(e.target.value))}>
                                    {[2024, 2025, 2026].map(a => (
                                        <MenuItem key={a} value={a}>{a}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    )}
                </Box>

                {/* Vista VENDEDOR */}
                {user?.rol === 'vendedor' && miResumen && (
                    <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden', maxWidth: 420 }}>
                        <Box sx={{ px: 3, py: 2, bgcolor: '#F9FAFB', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Typography sx={{ color: '#fff', fontSize: '13px', fontWeight: 700 }}>{user.nombre?.charAt(0).toUpperCase()}</Typography>
                            </Box>
                            <Box>
                                <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#1F2937', lineHeight: 1.2 }}>{user.nombre}</Typography>
                                <Typography sx={{ fontSize: '11px', color: '#6B7280' }}>{new Date().toLocaleString('es-AR', { month: 'long', year: 'numeric' })}</Typography>
                            </Box>
                        </Box>
                        <Box sx={{ px: 3, py: 1.5, display: 'flex', flexDirection: 'column' }}>
                            {[
                                { label: 'Facturación', value: formatCurrency(miResumen.mes_actual.total_ventas), color: '#1F2937' },
                                { label: 'Cantidad de ventas', value: String(miResumen.mes_actual.cantidad_ventas), color: '#1F2937' },
                                { label: 'Comisión vendedor', value: formatCurrency(miResumen.mes_actual.comision_neta), color: '#059669' },
                                { label: 'Bonos', value: formatCurrency(miResumen.configuracion.sueldo_base), color: '#1F2937' },
                            ].map((row, i, arr) => (
                                <Box key={i}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.25 }}>
                                        <Typography sx={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>{row.label}</Typography>
                                        <Typography sx={{ fontSize: '13px', fontWeight: 600, color: row.color, ml: 1 }}>{row.value}</Typography>
                                    </Box>
                                    {i < arr.length - 1 && <Divider />}
                                </Box>
                            ))}
                        </Box>
                        <Box sx={{ mx: 3, mb: 2.5, mt: 0.5, p: 2, bgcolor: `${colors.primary}10`, borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#1F2937' }}>TOTAL A COBRAR</Typography>
                            <Typography sx={{ fontSize: '16px', fontWeight: 700, color: colors.primary }}>{formatCurrency(miResumen.mes_actual.total_a_cobrar)}</Typography>
                        </Box>
                    </Paper>
                )}

                {/* Vista DUEÃ‘O */}
                {user?.rol === 'dueño' && (
                    <>
                        {/* Resumen Personal del dueño */}
                        {miResumen && (
                            <Box sx={{ mb: 5 }}>
                                <Typography sx={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', mb: 3 }}>
                                    Mi Comisión Personal
                                </Typography>

                                {/* KPIs personales */}
                                <Grid container spacing={3} sx={{ mb: 3 }}>
                                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                        <StatCard
                                            title="Facturado"
                                            value={formatCurrency(miResumen.mes_actual.total_ventas)}
                                            icon="fa-solid fa-dollar-sign"
                                            subtitle={`${miResumen.mes_actual.cantidad_ventas} ventas`}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                        <StatCard
                                            title="Ganancias"
                                            value={formatCurrency(miResumen.mes_actual.total_ganancia ?? 0)}
                                            icon="fa-solid fa-money-bill"
                                            subtitle="Precio venta - costo"
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                        <StatCard
                                            title="Comisión Neta"
                                            value={formatCurrency(miResumen.mes_actual.comision_neta)}
                                            icon="fa-solid fa-percent"
                                            subtitle={`${miResumen.configuracion.porcentaje_comision}% sobre ganancia`}
                                        />
                                        <Box sx={{ mt: 1, p: 1.5, bgcolor: '#F0FDF4', borderRadius: '8px', border: '1px solid #A7F3D0' }}>
                                            <Typography sx={{ fontSize: '11px', color: '#6B7280' }}>Bonos:</Typography>
                                            <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#059669' }}>
                                                {formatCurrency(miResumen.mes_actual.sueldo_base)}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                        <StatCard
                                            title="Total a Cobrar"
                                            value={formatCurrency(miResumen.mes_actual.total_a_cobrar)}
                                            icon="fa-solid fa-wallet"
                                            subtitle={new Date().toLocaleString('es-AR', { month: 'long', year: 'numeric' })}
                                        />
                                    </Grid>
                                </Grid>

                                {/* Configuración + Detalle del mes */}
                                <Grid container spacing={3}>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <Card sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.12)', borderRadius: 2 }}>
                                            <CardContent>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                    <Box sx={{ width: 40, height: 40, borderRadius: '8px', bgcolor: `${colors.primary}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2 }}>
                                                        <i className="fa-solid fa-gear" style={{ color: colors.primary, fontSize: 20 }}></i>
                                                    </Box>
                                                    <Typography variant="h6" sx={{ fontWeight: 600, fontSize: 16 }}>Mi Configuración</Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <Typography sx={{ color: colors.textSecondary, fontSize: 14 }}>Porcentaje de comisión:</Typography>
                                                        <Chip label={`${miResumen.configuracion.porcentaje_comision}%`} size="small" sx={{ bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#1D4ED8', fontWeight: 600 }} />
                                                    </Box>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <Typography sx={{ color: colors.textSecondary, fontSize: 14 }}>Bonos:</Typography>
                                                        <Typography sx={{ fontWeight: 600, color: colors.textPrimary }}>{formatCurrency(miResumen.configuracion.sueldo_base)}</Typography>
                                                    </Box>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <Card sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.12)', borderRadius: 2 }}>
                                            <CardContent>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                    <Box sx={{ width: 40, height: 40, borderRadius: '8px', bgcolor: `${colors.success}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2 }}>
                                                        <i className="fa-solid fa-calendar-check" style={{ color: colors.success, fontSize: 20 }}></i>
                                                    </Box>
                                                    <Typography variant="h6" sx={{ fontWeight: 600, fontSize: 16 }}>
                                                        Mes actual (personal) - {new Date().toLocaleString('es-AR', { month: 'long', year: 'numeric' })}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <Typography sx={{ color: colors.textSecondary, fontSize: 14 }}>Total vendido:</Typography>
                                                        <Typography sx={{ fontWeight: 600 }}>{formatCurrency(miResumen.mes_actual.total_ventas)}</Typography>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <Typography sx={{ color: colors.textSecondary, fontSize: 14 }}>Cantidad de ventas:</Typography>
                                                        <Typography sx={{ fontWeight: 600 }}>{miResumen.mes_actual.cantidad_ventas}</Typography>
                                                    </Box>
                                                    <Divider />
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <Typography sx={{ color: colors.textSecondary, fontSize: 14 }}>Ganancias:</Typography>
                                                        <Typography sx={{ fontWeight: 600 }}>{formatCurrency(miResumen.mes_actual.total_ganancia ?? 0)}</Typography>
                                                    </Box>
                                                    <Divider />
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <Typography sx={{ color: colors.textSecondary, fontSize: 14 }}>Comisión Vendedor ({miResumen.configuracion.porcentaje_comision}%):</Typography>
                                                        <Typography sx={{ fontWeight: 700, color: colors.success, fontSize: 16 }}>{formatCurrency(miResumen.mes_actual.comision_neta)}</Typography>
                                                    </Box>
                                                    <Divider />
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, bgcolor: `${colors.primary}10`, borderRadius: 1, mt: 1 }}>
                                                        <Typography sx={{ fontSize: 15, fontWeight: 700 }}>TOTAL A COBRAR:</Typography>
                                                        <Typography sx={{ fontSize: 18, fontWeight: 700, color: colors.primary }}>{formatCurrency(miResumen.mes_actual.total_a_cobrar)}</Typography>
                                                    </Box>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                </Grid>

                                <Divider sx={{ mt: 4, mb: 4 }} />
                            </Box>
                        )}

                        {/* KPIs */}
                        <Grid container spacing={3} sx={{ mb: 4 }}>
                            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                                <KPICard
                                    title="Comisiones Vendedores"
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
                                    title="Total Facturado"
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

                        {/* GrÃ¡ficos */}
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

                        {/* Análisis histórico */}
                        {historialCompleto.length > 0 && (
                            <Box sx={{ mt: 5 }}>
                                <Typography sx={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', mb: 3 }}>
                                    Análisis Histórico
                                </Typography>
                                <Grid container spacing={3}>
                                    <Grid size={{ xs: 12, lg: 6 }}>
                                        <Paper elevation={0} sx={{ p: 3, borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                                            <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#1F2937', mb: 2 }}>
                                                Facturación por Vendedor
                                            </Typography>
                                            <ResponsiveContainer width="100%" height={280}>
                                                <BarChart data={historialChartData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                                    <XAxis dataKey="name" stroke="#6B7280" style={{ fontSize: '11px' }} />
                                                    <YAxis stroke="#6B7280" style={{ fontSize: '11px' }} tickFormatter={(v: number) => '$' + (v / 1000).toFixed(0) + 'k'} />
                                                    <Tooltip
                                                        formatter={(value, name) => [formatCurrency(value as number ?? 0), String(name ?? '').replace('ventas_', '')]}
                                                        contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '12px' }}
                                                    />
                                                    <Legend wrapperStyle={{ fontSize: '11px' }} formatter={(name: string) => name.replace('ventas_', '')} />
                                                    {vendedoresHistorial.map((nombre, i) => (
                                                        <Bar key={nombre} dataKey={`ventas_${nombre}`} fill={VENDOR_COLORS[i % VENDOR_COLORS.length]} radius={[3, 3, 0, 0]} />
                                                    ))}
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </Paper>
                                    </Grid>
                                    <Grid size={{ xs: 12, lg: 6 }}>
                                        <Paper elevation={0} sx={{ p: 3, borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                                            <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#1F2937', mb: 2 }}>
                                                Comisión por Vendedor
                                            </Typography>
                                            <ResponsiveContainer width="100%" height={280}>
                                                <BarChart data={historialChartData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                                    <XAxis dataKey="name" stroke="#6B7280" style={{ fontSize: '11px' }} />
                                                    <YAxis stroke="#6B7280" style={{ fontSize: '11px' }} tickFormatter={(v: number) => '$' + (v / 1000).toFixed(0) + 'k'} />
                                                    <Tooltip
                                                        formatter={((value: number | undefined, name: string | number | undefined) => [formatCurrency(value ?? 0), String(name ?? '').replace('com_', '')]) as never}
                                                        contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '12px' }}
                                                    />
                                                    <Legend wrapperStyle={{ fontSize: '11px' }} formatter={(name: string) => name.replace('com_', '')} />
                                                    {vendedoresHistorial.map((nombre, i) => (
                                                        <Bar key={nombre} dataKey={`com_${nombre}`} fill={VENDOR_COLORS[i % VENDOR_COLORS.length]} radius={[3, 3, 0, 0]} />
                                                    ))}
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </Paper>
                                    </Grid>
                                </Grid>
                            </Box>
                        )}
                    </>
                )}
            </Box>

            {user?.rol === 'dueño' && (
                <ConfigurarComisionModal
                    open={configurarModalOpen}
                    onClose={() => { setConfigurarModalOpen(false); setVendedorSeleccionado(null); }}
                    onSuccess={() => { fetchDataDueno(); addNotification('Configuración actualizada', 'success'); }}
                    vendedor={vendedorSeleccionado}
                    mesInicial={calcularMes}
                    anioInicial={calcularAnio}
                />
            )}
        </>
    );
}



