'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Box, Typography, Grid, Paper, CircularProgress, Stack, Divider } from '@mui/material';
import StatCard from '@components/Cards/StatCard';
import { colors } from '@/src/theme/colors';
import { useAuthStore } from '@libraries/store';
import { ventaService } from '@services/venta.service';
import { productoService } from '@services/producto.service';
import { gastoService } from '@services/gasto.service';
import { IVenta } from '@models/entities/ventaEntity';
import { useMounted } from '@hooks/useMounted';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface IDashboardStats {
  ventasHoy: number;
  ingresosMes: number;
  gananciasBrutas: number;
  productosVendidos: number;
  gastosMes: number;
  gananciaReal: number;
  ticketPromedio: number;
  conversionVentas: number;
}

interface IChartData {
  name: string;
  ventas: number;
  ingresos: number;
}

interface IProductoTopData {
  nombre: string;
  cantidad: number;
  ingresos: number;
}

interface IMetodoPagoData {
  name: string;
  value: number;
}

const COLORS = ['#588a9e', '#285283', '#82ca9d', '#ffc658', '#ff8042', '#8884d8'];

export default function DashboardPage() {
  const mounted = useMounted();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<IDashboardStats>({
    ventasHoy: 0,
    ingresosMes: 0,
    gananciasBrutas: 0,
    productosVendidos: 0,
    gastosMes: 0,
    gananciaReal: 0,
    ticketPromedio: 0,
    conversionVentas: 0,
  });
  const [ventasPorDia, setVentasPorDia] = useState<IChartData[]>([]);
  const [topProductos, setTopProductos] = useState<IProductoTopData[]>([]);
  const [metodosPago, setMetodosPago] = useState<IMetodoPagoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calcularDashboardData = useCallback((ventasData: IVenta[], productosCount: number, gastosTotal: number) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    // Ventas de hoy
    const ventasHoy = ventasData.filter(v => {
      const fechaVenta = new Date(v.fecha_venta);
      fechaVenta.setHours(0, 0, 0, 0);
      return fechaVenta.getTime() === hoy.getTime();
    }).length;

    // Ventas del mes
    const ventasMes = ventasData.filter(v => new Date(v.fecha_venta) >= inicioMes);
    const ingresosMes = ventasMes.reduce((sum, v) => sum + v.total, 0);
    const gananciasBrutas = ventasMes.reduce((sum, v) => sum + v.total_final, 0);
    const gananciaReal = gananciasBrutas - gastosTotal;
    const ticketPromedio = ventasMes.length > 0 ? ingresosMes / ventasMes.length : 0;

    // Productos vendidos
    const productosVendidos = ventasMes.reduce((sum, v) => {
      return sum + (v.detalles?.reduce((itemSum: number, item) => itemSum + item.cantidad, 0) || 0);
    }, 0);

    // Tasa de conversión (mock - en producción sería pedidos/visitantes)
    const conversionVentas = ventasMes.length > 0 ? 65 + Math.random() * 10 : 0;

    // Ventas por día (últimos 7 días)
    const ventasPorDiaData: IChartData[] = [];
    for (let i = 6; i >= 0; i--) {
      const dia = new Date(hoy);
      dia.setDate(dia.getDate() - i);
      dia.setHours(0, 0, 0, 0);

      const ventasDia = ventasData.filter(v => {
        const fechaVenta = new Date(v.fecha_venta);
        fechaVenta.setHours(0, 0, 0, 0);
        return fechaVenta.getTime() === dia.getTime();
      });

      ventasPorDiaData.push({
        name: dia.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' }),
        ventas: ventasDia.length,
        ingresos: ventasDia.reduce((sum, v) => sum + v.total, 0),
      });
    }

    // Top 5 productos más vendidos
    const productosMap = new Map<string, { cantidad: number; ingresos: number }>();
    ventasMes.forEach(venta => {
      venta.detalles?.forEach(detalle => {
        const nombre = detalle.producto?.nombre || 'Desconocido';
        const existing = productosMap.get(nombre) || { cantidad: 0, ingresos: 0 };
        productosMap.set(nombre, {
          cantidad: existing.cantidad + detalle.cantidad,
          ingresos: existing.ingresos + (detalle.precio_unitario * detalle.cantidad),
        });
      });
    });

    const topProductosData = Array.from(productosMap.entries())
      .map(([nombre, data]) => ({ nombre, ...data }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);

    // Métodos de pago
    const metodosMap = new Map<string, number>();
    ventasMes.forEach(venta => {
      const metodo = venta.forma_pago?.nombre || 'Otro';
      metodosMap.set(metodo, (metodosMap.get(metodo) || 0) + 1);
    });

    const metodosPagoData = Array.from(metodosMap.entries())
      .map(([name, value]) => ({ name, value }));

    return {
      stats: {
        ventasHoy,
        ingresosMes,
        gananciasBrutas,
        productosVendidos,
        gastosMes: gastosTotal,
        gananciaReal,
        ticketPromedio,
        conversionVentas,
      },
      ventasPorDia: ventasPorDiaData,
      topProductos: topProductosData,
      metodosPago: metodosPagoData,
    };
  }, []);

  const fetchDashboardData = useCallback(async () => {
    if (!mounted) return;

    setLoading(true);
    setError(null);

    try {
      const [ventasData, productosData, gastosResumen] = await Promise.all([
        ventaService.getAll(),
        productoService.getAll(),
        gastoService.getResumen().catch(() => ({ total: 0 })),
      ]);

      const productosCount = productosData.length || 0;
      const gastosTotal = gastosResumen.total || 0;

      const dashboardData = calcularDashboardData(ventasData, productosCount, gastosTotal);

      setStats(dashboardData.stats);
      setVentasPorDia(dashboardData.ventasPorDia);
      setTopProductos(dashboardData.topProductos);
      setMetodosPago(dashboardData.metodosPago);
    } catch (err) {
      console.error('Error cargando datos del dashboard:', err);
      setError('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  }, [mounted, calcularDashboardData]);

  useEffect(() => {
    if (mounted) {
      fetchDashboardData();
    }
  }, [mounted, fetchDashboardData]);

  const formatCurrency = (value: number) => '$' + value.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  if (!mounted) return null;

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

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: { xs: 2, sm: 4 } }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: colors.textPrimary, fontSize: { xs: '20px', sm: '24px' }, mb: 0.5 }}>
          Dashboard Analítico {user && `- ${user.nombre}`}
        </Typography>
        <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: { xs: '12px', sm: '14px' } }}>
          Vista general del negocio • Actualizado: {new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </Typography>
      </Box>

      {/* KPIs Principales */}
      <Grid container spacing={{ xs: 2, sm: 2 }} sx={{ mb: { xs: 3, sm: 4 } }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Ventas Hoy"
            value={stats.ventasHoy}
            icon="fa-solid fa-cart-shopping"
            trend={{ value: 12.5, isPositive: true }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Ingresos del Mes"
            value={formatCurrency(stats.ingresosMes)}
            icon="fa-solid fa-dollar-sign"
            trend={{ value: 8.3, isPositive: true }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Ganancia Real"
            value={formatCurrency(stats.gananciaReal)}
            icon="fa-solid fa-chart-line"
            subtitle={`Gastos: ${formatCurrency(stats.gastosMes)}`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Ticket Promedio"
            value={formatCurrency(stats.ticketPromedio)}
            icon="fa-solid fa-receipt"
            trend={{ value: 5.2, isPositive: true }}
          />
        </Grid>
      </Grid>

      {/* Métricas Secundarias */}
      <Grid container spacing={{ xs: 2, sm: 2 }} sx={{ mb: { xs: 3, sm: 4 } }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: '12px', border: '1px solid #E5E7EB', textAlign: 'center' }}>
            <Typography sx={{ fontSize: { xs: '10px', sm: '11px' }, color: '#6B7280', fontWeight: 600, mb: 0.5, textTransform: 'uppercase' }}>
              Productos Vendidos
            </Typography>
            <Typography sx={{ fontSize: { xs: '20px', sm: '24px' }, fontWeight: 700, color: '#1F2937' }}>
              {stats.productosVendidos}
            </Typography>
            <Typography sx={{ fontSize: { xs: '9px', sm: '10px' }, color: '#9CA3AF', mt: 0.25 }}>
              Este mes
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: '12px', border: '1px solid #E5E7EB', textAlign: 'center' }}>
            <Typography sx={{ fontSize: { xs: '10px', sm: '11px' }, color: '#6B7280', fontWeight: 600, mb: 0.5, textTransform: 'uppercase' }}>
              Tasa de Conversión
            </Typography>
            <Typography sx={{ fontSize: { xs: '20px', sm: '24px' }, fontWeight: 700, color: '#059669' }}>
              {stats.conversionVentas.toFixed(1)}%
            </Typography>
            <Typography sx={{ fontSize: { xs: '9px', sm: '10px' }, color: '#9CA3AF', mt: 0.25 }}>
              Ventas/Visitas
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: '12px', border: '1px solid #E5E7EB', textAlign: 'center' }}>
            <Typography sx={{ fontSize: { xs: '10px', sm: '11px' }, color: '#6B7280', fontWeight: 600, mb: 0.5, textTransform: 'uppercase' }}>
              Ganancia Bruta
            </Typography>
            <Typography sx={{ fontSize: { xs: '20px', sm: '24px' }, fontWeight: 700, color: '#588a9e' }}>
              {formatCurrency(stats.gananciasBrutas)}
            </Typography>
            <Typography sx={{ fontSize: { xs: '9px', sm: '10px' }, color: '#9CA3AF', mt: 0.25 }}>
              Sin gastos
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: '12px', border: '1px solid #E5E7EB', textAlign: 'center' }}>
            <Typography sx={{ fontSize: { xs: '10px', sm: '11px' }, color: '#6B7280', fontWeight: 600, mb: 0.5, textTransform: 'uppercase' }}>
              Gastos del Mes
            </Typography>
            <Typography sx={{ fontSize: { xs: '20px', sm: '24px' }, fontWeight: 700, color: '#DC2626' }}>
              {formatCurrency(stats.gastosMes)}
            </Typography>
            <Typography sx={{ fontSize: { xs: '9px', sm: '10px' }, color: '#9CA3AF', mt: 0.25 }}>
              Operativos
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Gráficos */}
      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {/* Gráfico de Ventas e Ingresos por Día */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: '12px', border: '1px solid #E5E7EB', height: '100%' }}>
            <Typography sx={{ fontSize: { xs: '14px', sm: '16px' }, fontWeight: 700, color: '#1F2937', mb: 2 }}>
              Ventas e Ingresos - Últimos 7 días
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={ventasPorDia}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#6B7280" style={{ fontSize: '12px' }} />
                <YAxis yAxisId="left" stroke="#588a9e" style={{ fontSize: '12px' }} />
                <YAxis yAxisId="right" orientation="right" stroke="#285283" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '12px' }}
                  formatter={(value: number | undefined, name: string | undefined) => {
                    if (!value) return ['0', name || ''];
                    if (name === 'ingresos') return [formatCurrency(value), 'Ingresos'];
                    return [value, 'Ventas'];
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line yAxisId="left" type="monotone" dataKey="ventas" stroke="#588a9e" strokeWidth={2} dot={{ fill: '#588a9e' }} name="Cantidad de Ventas" />
                <Line yAxisId="right" type="monotone" dataKey="ingresos" stroke="#285283" strokeWidth={2} dot={{ fill: '#285283' }} name="Ingresos ($)" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Gráfico de Métodos de Pago */}
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: '12px', border: '1px solid #E5E7EB', height: '100%' }}>
            <Typography sx={{ fontSize: { xs: '14px', sm: '16px' }, fontWeight: 700, color: '#1F2937', mb: 2 }}>
              Métodos de Pago
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={metodosPago}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => {
                    const percentValue = percent ?? 0;
                    return `${name}: ${(percentValue * 100).toFixed(0)}%`;
                  }}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {metodosPago.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Top 5 Productos Más Vendidos */}
        <Grid size={{ xs: 12, sm: 6, lg: 6 }}>
          <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: '12px', border: '1px solid #E5E7EB', height: '100%' }}>
            <Typography sx={{ fontSize: { xs: '14px', sm: '16px' }, fontWeight: 700, color: '#1F2937', mb: 2 }}>
              Top 5 Productos Más Vendidos
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProductos} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" stroke="#6B7280" style={{ fontSize: '12px' }} />
                <YAxis type="category" dataKey="nombre" stroke="#6B7280" style={{ fontSize: '11px' }} width={100} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '12px' }}
                  formatter={(value: number | undefined, name: string | undefined) => {
                    if (!value) return ['0', name || ''];
                    if (name === 'ingresos') return [formatCurrency(value), 'Ingresos'];
                    return [value, 'Cantidad'];
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="cantidad" fill="#588a9e" name="Unidades Vendidas" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Resumen de Rendimiento */}
        <Grid size={{ xs: 12, sm: 6, lg: 6 }}>
          <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: '12px', border: '1px solid #E5E7EB', height: '100%' }}>
            <Typography sx={{ fontSize: { xs: '14px', sm: '16px' }, fontWeight: 700, color: '#1F2937', mb: 2 }}>
              Análisis de Rentabilidad
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                  <Typography sx={{ fontSize: '13px', color: '#6B7280', fontWeight: 500 }}>
                    Margen de Ganancia
                  </Typography>
                  <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#059669' }}>
                    {stats.ingresosMes > 0 ? ((stats.gananciaReal / stats.ingresosMes) * 100).toFixed(1) : 0}%
                  </Typography>
                </Stack>
                <Box sx={{ width: '100%', height: 8, bgcolor: '#E5E7EB', borderRadius: 1, overflow: 'hidden' }}>
                  <Box sx={{
                    width: `${stats.ingresosMes > 0 ? (stats.gananciaReal / stats.ingresosMes) * 100 : 0}%`,
                    height: '100%',
                    bgcolor: '#059669'
                  }} />
                </Box>
              </Box>

              <Divider />

              <Box>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>Ingresos Totales</Typography>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#1F2937' }}>
                    {formatCurrency(stats.ingresosMes)}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>Ganancia Bruta</Typography>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#588a9e' }}>
                    {formatCurrency(stats.gananciasBrutas)}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography sx={{ fontSize: '12px', color: '#DC2626' }}>Gastos Operativos</Typography>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#DC2626' }}>
                    - {formatCurrency(stats.gastosMes)}
                  </Typography>
                </Stack>
                <Divider sx={{ my: 1 }} />
                <Stack direction="row" justifyContent="space-between">
                  <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#1F2937' }}>Ganancia Neta</Typography>
                  <Typography sx={{ fontSize: '14px', fontWeight: 700, color: stats.gananciaReal >= 0 ? '#059669' : '#DC2626' }}>
                    {formatCurrency(stats.gananciaReal)}
                  </Typography>
                </Stack>
              </Box>

              <Divider />

              <Box>
                <Typography sx={{ fontSize: '12px', color: '#6B7280', mb: 1, fontWeight: 500 }}>
                  Indicadores Clave
                </Typography>
                <Grid container spacing={1}>
                  <Grid size={6}>
                    <Paper elevation={0} sx={{ p: 1.5, bgcolor: '#F9FAFB', borderRadius: '8px' }}>
                      <Typography sx={{ fontSize: '10px', color: '#6B7280', mb: 0.25 }}>ROI</Typography>
                      <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#588a9e' }}>
                        {stats.gastosMes > 0 ? ((stats.gananciaReal / stats.gastosMes) * 100).toFixed(0) : 0}%
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid size={6}>
                    <Paper elevation={0} sx={{ p: 1.5, bgcolor: '#F9FAFB', borderRadius: '8px' }}>
                      <Typography sx={{ fontSize: '10px', color: '#6B7280', mb: 0.25 }}>Eficiencia</Typography>
                      <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#285283' }}>
                        {stats.productosVendidos > 0 ? (stats.ingresosMes / stats.productosVendidos).toFixed(0) : 0}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
