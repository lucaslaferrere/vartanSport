'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Grid, Paper, CircularProgress, Stack,
  Select, MenuItem, FormControl,
} from '@mui/material';
import StatCard from '@components/Cards/StatCard';
import { colors } from '@/src/theme/colors';
import { useAuthStore } from '@libraries/store';
import { dashboardService } from '@services/dashboard.service';
import { ventaService } from '@services/venta.service';
import { IDashboardMensual } from '@models/entities/dashboardEntity';
import { IVenta } from '@models/entities/ventaEntity';
import { useMounted } from '@hooks/useMounted';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const COLORS = ['#588a9e', '#285283', '#82ca9d', '#ffc658', '#ff8042', '#8884d8'];

const ANIOS = Array.from({ length: 4 }, (_, i) => new Date().getFullYear() - i);

export default function DashboardDueno() {
  const mounted = useMounted();
  const { user } = useAuthStore();

  const now = new Date();
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [anio, setAnio] = useState(now.getFullYear());
  const [data, setData] = useState<IDashboardMensual | null>(null);
  const [topProductos, setTopProductos] = useState<{ nombre: string; cantidad: number }[]>([]);
  const [metodosPago, setMetodosPago] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calcularChartsData = (ventas: IVenta[], mesNum: number, anioNum: number) => {
    const ventasMes = ventas.filter(v => {
      const f = new Date(v.fecha_venta);
      return f.getMonth() + 1 === mesNum && f.getFullYear() === anioNum;
    });

    const productosMap = new Map<string, number>();
    ventasMes.forEach(v =>
      v.detalles?.forEach(d => {
        const nombre = d.producto?.nombre || 'Desconocido';
        productosMap.set(nombre, (productosMap.get(nombre) || 0) + d.cantidad);
      })
    );
    const top = Array.from(productosMap.entries())
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);

    const metodosMap = new Map<string, number>();
    ventasMes.forEach(v => {
      const m = v.forma_pago?.nombre || 'Otro';
      metodosMap.set(m, (metodosMap.get(m) || 0) + 1);
    });
    const metodos = Array.from(metodosMap.entries()).map(([name, value]) => ({ name, value }));

    return { top, metodos };
  };

  const fetchData = useCallback(async () => {
    if (!mounted) return;
    setLoading(true);
    setError(null);
    try {
      const [kpis, ventas] = await Promise.all([
        dashboardService.getMensual(mes, anio),
        ventaService.getAll(),
      ]);
      setData(kpis);
      const { top, metodos } = calcularChartsData(ventas, mes, anio);
      setTopProductos(top);
      setMetodosPago(metodos);
    } catch {
      setError('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  }, [mounted, mes, anio]);

  useEffect(() => {
    if (mounted) fetchData();
  }, [mounted, fetchData]);

  const fmt = (v: number) => '$' + v.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress sx={{ color: colors.primary }} />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error">{error || 'Sin datos'}</Typography>
      </Box>
    );
  }

  const margenColor = data.margen_porcentaje >= 0 ? '#059669' : '#DC2626';

  return (
    <Box>
      {/* Header + selector */}
      <Box sx={{ mb: { xs: 2, sm: 4 }, display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: colors.textPrimary, fontSize: { xs: '20px', sm: '24px' }, mb: 0.5 }}>
            Dashboard {user && `— ${user.nombre}`}
          </Typography>
          <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: { xs: '12px', sm: '14px' } }}>
            {MESES[mes - 1]} {anio}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <FormControl size="small">
            <Select value={mes} onChange={e => setMes(Number(e.target.value))} sx={{ fontSize: '14px', minWidth: 130 }}>
              {MESES.map((nombre, i) => (
                <MenuItem key={i + 1} value={i + 1}>{nombre}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small">
            <Select value={anio} onChange={e => setAnio(Number(e.target.value))} sx={{ fontSize: '14px', minWidth: 90 }}>
              {ANIOS.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
            </Select>
          </FormControl>
        </Stack>
      </Box>

      {/* KPIs */}
      <Grid container spacing={{ xs: 2, sm: 2 }} sx={{ mb: { xs: 3, sm: 4 } }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Ventas del Mes" value={data.cantidad_ventas} icon="fa-solid fa-cart-shopping" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Facturación" value={fmt(data.facturacion)} icon="fa-solid fa-dollar-sign" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Ganancia Neta" value={fmt(data.ganancia_neta)} icon="fa-solid fa-chart-line" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Margen" value={`${data.margen_porcentaje.toFixed(1)}%`} icon="fa-solid fa-percent" />
        </Grid>
      </Grid>

      {/* Desglose financiero + gráficos */}
      <Grid container spacing={{ xs: 2, sm: 3 }}>

        {/* Desglose de rentabilidad */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: '12px', border: '1px solid #E5E7EB', height: '100%' }}>
            <Typography sx={{ fontSize: { xs: '14px', sm: '16px' }, fontWeight: 700, color: '#1F2937', mb: 2 }}>
              Desglose Financiero
            </Typography>
            <Stack spacing={1.5}>
              <Row label="Facturación" value={fmt(data.facturacion)} color="#1F2937" bold />
              <Row label="— Costo de productos" value={`- ${fmt(data.costo_productos)}`} color="#6B7280" />
              <Divider />
              <Row label="Ganancia bruta" value={fmt(data.ganancia_real)} color="#588a9e" bold />
              <Row label="— Publicidad" value={`- ${fmt(data.publicidad)}`} color="#6B7280" />
              <Row label="— Comisiones vendedores" value={`- ${fmt(data.comision_vendedores)}`} color="#6B7280" />
              <Row label="— Gastos fijos" value={`- ${fmt(data.gastos_fijos)}`} color="#DC2626" />
              <Divider />
              <Row label="Ganancias" value={fmt(data.ganancia_neta)} color={margenColor} bold />

              <Box sx={{ pt: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                  <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>Margen</Typography>
                  <Typography sx={{ fontSize: '14px', fontWeight: 700, color: margenColor }}>
                    {data.margen_porcentaje.toFixed(1)}%
                  </Typography>
                </Stack>
                <Box sx={{ width: '100%', height: 8, bgcolor: '#E5E7EB', borderRadius: 1, overflow: 'hidden' }}>
                  <Box sx={{ width: `${Math.min(Math.max(data.margen_porcentaje, 0), 100)}%`, height: '100%', bgcolor: margenColor }} />
                </Box>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        {/* Métodos de pago */}
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: '12px', border: '1px solid #E5E7EB', height: '100%' }}>
            <Typography sx={{ fontSize: { xs: '14px', sm: '16px' }, fontWeight: 700, color: '#1F2937', mb: 2 }}>
              Métodos de Pago
            </Typography>
            {metodosPago.length === 0 ? (
              <Typography sx={{ color: '#9CA3AF', fontSize: '13px', textAlign: 'center', pt: 4 }}>Sin datos</Typography>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={metodosPago}
                    cx="50%" cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {metodosPago.map((_e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>

        {/* Top productos */}
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: '12px', border: '1px solid #E5E7EB', height: '100%' }}>
            <Typography sx={{ fontSize: { xs: '14px', sm: '16px' }, fontWeight: 700, color: '#1F2937', mb: 2 }}>
              Top 5 Productos
            </Typography>
            {topProductos.length === 0 ? (
              <Typography sx={{ color: '#9CA3AF', fontSize: '13px', textAlign: 'center', pt: 4 }}>Sin datos</Typography>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={topProductos} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis type="number" stroke="#6B7280" style={{ fontSize: '12px' }} />
                  <YAxis type="category" dataKey="nombre" stroke="#6B7280" style={{ fontSize: '11px' }} width={90} />
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="cantidad" fill="#588a9e" name="Unidades" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

function Row({ label, value, color, bold }: { label: string; value: string; color: string; bold?: boolean }) {
  return (
    <Stack direction="row" justifyContent="space-between">
      <Typography sx={{ fontSize: '13px', color: '#6B7280', fontWeight: bold ? 600 : 400 }}>{label}</Typography>
      <Typography sx={{ fontSize: '13px', fontWeight: bold ? 700 : 500, color }}>{value}</Typography>
    </Stack>
  );
}

function Divider() {
  return <Box sx={{ borderTop: '1px solid #E5E7EB' }} />;
}
