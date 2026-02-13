'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Box, Typography, Grid, Paper, CircularProgress, Stack, LinearProgress } from '@mui/material';
import StatCard from '@components/Cards/StatCard';
import { colors } from '@/src/theme/colors';
import { useAuthStore } from '@libraries/store';
import { ventaService } from '@services/venta.service';
import { comisionService } from '@services/comision.service';
import { IVenta } from '@models/entities/ventaEntity';
import { useMounted } from '@hooks/useMounted';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface IChartData {
  name: string;
  ventas: number;
  ingresos: number;
}

interface IStatsVendedor {
  ventasHoy: number;
  ventasMes: number;
  ingresosGenerados: number;
  comisionEstimada: number;
  ticketPromedio: number;
  productosVendidos: number;
}

interface IComisionData {
  configuracion?: {
    porcentaje_comision: number;
    sueldo_base: number;
  };
  mes_actual?: {
    comision_neta: number;
    total_a_cobrar: number;
  };
}

export default function DashboardVendedor() {
  const mounted = useMounted();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [misVentas, setMisVentas] = useState<IVenta[]>([]);
  const [comisionData, setComisionData] = useState<IComisionData | null>(null);
  const [ventasPorDia, setVentasPorDia] = useState<IChartData[]>([]);
  const [statsVendedor, setStatsVendedor] = useState<IStatsVendedor>({
    ventasHoy: 0,
    ventasMes: 0,
    ingresosGenerados: 0,
    comisionEstimada: 0,
    ticketPromedio: 0,
    productosVendidos: 0,
  });

  const fetchVendedorData = useCallback(async () => {
    if (!mounted) return;

    setLoading(true);
    setError(null);

    try {
      const [ventasData, comisionInfo] = await Promise.all([
        ventaService.getMisVentas(),
        comisionService.getMiResumen().catch(() => null),
      ]);

      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

      const ventasHoy = ventasData.filter((v: IVenta) => {
        const fechaVenta = new Date(v.fecha_venta);
        fechaVenta.setHours(0, 0, 0, 0);
        return fechaVenta.getTime() === hoy.getTime();
      }).length;

      const ventasMes = ventasData.filter((v: IVenta) => new Date(v.fecha_venta) >= inicioMes);
      const ingresosGenerados = ventasMes.reduce((sum: number, v: IVenta) => sum + v.total, 0);
      const ticketPromedio = ventasMes.length > 0 ? ingresosGenerados / ventasMes.length : 0;
      const productosVendidos = ventasMes.reduce((sum: number, v: IVenta) => {
        return sum + (v.detalles?.reduce((itemSum: number, item) => itemSum + item.cantidad, 0) || 0);
      }, 0);

      const comisionEstimada = comisionInfo?.mes_actual?.comision_neta || 0;

      const ventasPorDiaData: IChartData[] = [];
      for (let i = 6; i >= 0; i--) {
        const dia = new Date(hoy);
        dia.setDate(dia.getDate() - i);
        dia.setHours(0, 0, 0, 0);

        const ventasDia = ventasData.filter((v: IVenta) => {
          const fechaVenta = new Date(v.fecha_venta);
          fechaVenta.setHours(0, 0, 0, 0);
          return fechaVenta.getTime() === dia.getTime();
        });

        ventasPorDiaData.push({
          name: dia.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' }),
          ventas: ventasDia.length,
          ingresos: ventasDia.reduce((sum: number, v: IVenta) => sum + v.total, 0),
        });
      }

      setMisVentas(ventasMes);
      setComisionData(comisionInfo);
      setVentasPorDia(ventasPorDiaData);
      setStatsVendedor({
        ventasHoy,
        ventasMes: ventasMes.length,
        ingresosGenerados,
        comisionEstimada,
        ticketPromedio,
        productosVendidos,
      });
    } catch (err) {
      console.error('Error cargando datos del vendedor:', err);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }, [mounted]);

  useEffect(() => {
    if (mounted) {
      fetchVendedorData();
    }
  }, [mounted, fetchVendedorData]);

  const formatCurrency = (value: number) => '$' + value.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
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

  const porcentajeMeta = comisionData?.configuracion?.porcentaje_comision || 0;
  const sueldoBase = comisionData?.configuracion?.sueldo_base || 0;
  const totalACobrar = comisionData?.mes_actual?.total_a_cobrar || sueldoBase;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: { xs: 2, sm: 4 } }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: colors.textPrimary, fontSize: { xs: '20px', sm: '24px' }, mb: 0.5 }}>
          Mi Dashboard {user && `- ${user.nombre}`}
        </Typography>
        <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: { xs: '12px', sm: '14px' } }}>
          Tus ventas y comisiones • {new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </Typography>
      </Box>

      {/* KPIs */}
      <Grid container spacing={{ xs: 2, sm: 2 }} sx={{ mb: { xs: 3, sm: 4 } }}>
        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <StatCard title="Ventas Hoy" value={statsVendedor.ventasHoy} icon="fa-solid fa-cart-shopping" />
        </Grid>
        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <StatCard title="Ventas del Mes" value={statsVendedor.ventasMes} icon="fa-solid fa-chart-simple" />
        </Grid>
        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <StatCard title="Ingresos Generados" value={formatCurrency(statsVendedor.ingresosGenerados)} icon="fa-solid fa-dollar-sign" />
        </Grid>
        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <StatCard title="Mi Comisión" value={formatCurrency(statsVendedor.comisionEstimada)} icon="fa-solid fa-wallet" subtitle={`${porcentajeMeta}% de ventas`} />
        </Grid>
      </Grid>

      {/* Resumen de Comisión y Métricas */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 3, sm: 4 } }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: '12px', border: '1px solid #E5E7EB', height: '100%' }}>
            <Typography sx={{ fontSize: { xs: '14px', sm: '16px' }, fontWeight: 700, color: '#1F2937', mb: 2 }}>
              Mi Comisión Este Mes
            </Typography>
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>Sueldo Base</Typography>
                <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>{formatCurrency(sueldoBase)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>Comisión ({porcentajeMeta}%)</Typography>
                <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#588a9e' }}>+ {formatCurrency(statsVendedor.comisionEstimada)}</Typography>
              </Stack>
              <Box sx={{ borderTop: '1px solid #E5E7EB', pt: 2 }}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography sx={{ fontSize: '14px', fontWeight: 700 }}>Total a Cobrar</Typography>
                  <Typography sx={{ fontSize: '18px', fontWeight: 700, color: '#059669' }}>{formatCurrency(totalACobrar)}</Typography>
                </Stack>
              </Box>
              <Box>
                <Typography sx={{ fontSize: '11px', color: '#6B7280', mb: 0.5 }}>Progreso de Ventas</Typography>
                <LinearProgress variant="determinate" value={Math.min((statsVendedor.ventasMes / 30) * 100, 100)} sx={{ height: 8, borderRadius: 1, bgcolor: '#E5E7EB', '& .MuiLinearProgress-bar': { bgcolor: '#588a9e' } }} />
                <Typography sx={{ fontSize: '10px', color: '#9CA3AF', mt: 0.5 }}>{statsVendedor.ventasMes} ventas este mes</Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: '12px', border: '1px solid #E5E7EB', height: '100%' }}>
            <Typography sx={{ fontSize: { xs: '14px', sm: '16px' }, fontWeight: 700, color: '#1F2937', mb: 2 }}>
              Mis Métricas
            </Typography>
            <Grid container spacing={2}>
              <Grid size={6}>
                <Paper elevation={0} sx={{ p: 1.5, bgcolor: '#F9FAFB', borderRadius: '8px', textAlign: 'center' }}>
                  <Typography sx={{ fontSize: '10px', color: '#6B7280', mb: 0.5, fontWeight: 600 }}>TICKET PROMEDIO</Typography>
                  <Typography sx={{ fontSize: '20px', fontWeight: 700 }}>{formatCurrency(statsVendedor.ticketPromedio)}</Typography>
                </Paper>
              </Grid>
              <Grid size={6}>
                <Paper elevation={0} sx={{ p: 1.5, bgcolor: '#F9FAFB', borderRadius: '8px', textAlign: 'center' }}>
                  <Typography sx={{ fontSize: '10px', color: '#6B7280', mb: 0.5, fontWeight: 600 }}>PRODUCTOS</Typography>
                  <Typography sx={{ fontSize: '20px', fontWeight: 700 }}>{statsVendedor.productosVendidos}</Typography>
                </Paper>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Gráficos */}
      <Grid container spacing={{ xs: 2, sm: 3 }}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: '12px', border: '1px solid #E5E7EB' }}>
            <Typography sx={{ fontSize: { xs: '14px', sm: '16px' }, fontWeight: 700, color: '#1F2937', mb: 2 }}>
              Mis Ventas - Últimos 7 días
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={ventasPorDia}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#6B7280" style={{ fontSize: '12px' }} />
                <YAxis yAxisId="left" stroke="#588a9e" style={{ fontSize: '12px' }} />
                <YAxis yAxisId="right" orientation="right" stroke="#285283" style={{ fontSize: '12px' }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '12px' }} formatter={(value: number | undefined, name: string | undefined) => {
                  if (!value) return ['0', name || ''];
                  if (name === 'ingresos') return [formatCurrency(value), 'Ingresos'];
                  return [value, 'Ventas'];
                }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line yAxisId="left" type="monotone" dataKey="ventas" stroke="#588a9e" strokeWidth={2} name="Mis Ventas" />
                <Line yAxisId="right" type="monotone" dataKey="ingresos" stroke="#285283" strokeWidth={2} name="Ingresos" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: '12px', border: '1px solid #E5E7EB', height: '100%' }}>
            <Typography sx={{ fontSize: { xs: '14px', sm: '16px' }, fontWeight: 700, color: '#1F2937', mb: 2 }}>
              Últimas Ventas
            </Typography>
            <Stack spacing={1.5} sx={{ maxHeight: 300, overflowY: 'auto' }}>
              {misVentas.slice(0, 5).map((venta) => (
                <Box key={venta.id} sx={{ p: 1.5, bgcolor: '#F9FAFB', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                    <Typography sx={{ fontSize: '12px', fontWeight: 600 }}>{venta.cliente?.nombre || 'Cliente'}</Typography>
                    <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#588a9e' }}>{formatCurrency(venta.total)}</Typography>
                  </Stack>
                  <Typography sx={{ fontSize: '10px', color: '#6B7280' }}>
                    {new Date(venta.fecha_venta).toLocaleDateString('es-AR')} • {venta.detalles?.length || 0} items
                  </Typography>
                </Box>
              ))}
              {misVentas.length === 0 && (
                <Typography sx={{ fontSize: '12px', color: '#9CA3AF', textAlign: 'center', py: 3 }}>
                  No hay ventas registradas este mes
                </Typography>
              )}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

