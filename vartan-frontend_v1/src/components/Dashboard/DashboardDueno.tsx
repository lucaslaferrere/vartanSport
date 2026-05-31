'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Grid, Paper, Stack, Select, MenuItem, FormControl,
  Skeleton, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TableSortLabel, Chip,
} from '@mui/material';
import { colors } from '@/src/theme/colors';
import { useAuthStore } from '@libraries/store';
import { dashboardService } from '@services/dashboard.service';
import { ventaService } from '@services/venta.service';
import { IDashboardMensual } from '@models/entities/dashboardEntity';
import { IVenta } from '@models/entities/ventaEntity';
import { useMounted } from '@hooks/useMounted';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

// ─── Constants ────────────────────────────────────────────────────────────────

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const ANIOS = Array.from({ length: 4 }, (_, i) => new Date().getFullYear() - i);
const CHART_COLORS = ['#588a9e', '#10B981', '#7C3AED', '#D97706', '#DC2626', '#2563EB', '#EC4899', '#06B6D4'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmtPesos = (v: number) =>
  '$' + Math.round(v).toLocaleString('es-AR');

const fmtShort = (v: number) => {
  if (v >= 1_000_000) return '$' + (v / 1_000_000).toFixed(1) + 'M';
  if (v >= 1_000) return '$' + Math.round(v / 1_000) + 'k';
  return '$' + Math.round(v);
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' });

const prevMesInfo = (mes: number, anio: number) => ({
  mes: mes === 1 ? 12 : mes - 1,
  anio: mes === 1 ? anio - 1 : anio,
});

// ─── useCountUp ───────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1200): number {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (target === 0) { setVal(0); return; }
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      if (t >= 1) {
        setVal(target);
      } else {
        setVal(target * (1 - (1 - t) ** 3));
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

// ─── Data derivation ─────────────────────────────────────────────────────────

function calcDailyData(
  ventasMes: IVenta[],
  ventasPrev: IVenta[],
  mes: number,
  anio: number,
) {
  const days = new Date(anio, mes, 0).getDate();
  return Array.from({ length: days }, (_, i) => {
    const day = i + 1;
    const actual = ventasMes
      .filter(v => new Date(v.fecha_venta).getDate() === day)
      .reduce((s, v) => s + v.total, 0);
    const anterior = ventasPrev
      .filter(v => new Date(v.fecha_venta).getDate() === day)
      .reduce((s, v) => s + v.total, 0);
    return { dia: String(day), actual, anterior };
  });
}

function calcTopProductos(ventas: IVenta[]) {
  const map = new Map<string, { cantidad: number; facturacion: number; nombreFull: string }>();
  ventas.forEach(v =>
    v.detalles?.forEach(d => {
      const key = d.producto?.nombre || 'Desconocido';
      const cur = map.get(key) || { cantidad: 0, facturacion: 0, nombreFull: key };
      map.set(key, {
        cantidad: cur.cantidad + d.cantidad,
        facturacion: cur.facturacion + d.subtotal,
        nombreFull: key,
      });
    })
  );
  return Array.from(map.entries())
    .map(([k, d]) => ({
      nombre: k.length > 18 ? k.substring(0, 16) + '…' : k,
      nombreFull: d.nombreFull,
      cantidad: d.cantidad,
      facturacion: d.facturacion,
      precioPromedio: d.cantidad > 0 ? Math.round(d.facturacion / d.cantidad) : 0,
    }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 10);
}

function calcMetodosPago(ventas: IVenta[]) {
  const map = new Map<string, { count: number; total: number }>();
  ventas.forEach(v => {
    const m = v.forma_pago?.nombre || 'Otro';
    const cur = map.get(m) || { count: 0, total: 0 };
    map.set(m, { count: cur.count + 1, total: cur.total + v.total });
  });
  const totalCount = [...map.values()].reduce((s, d) => s + d.count, 0);
  return Array.from(map.entries()).map(([name, d]) => ({
    name,
    value: d.count,
    amount: d.total,
    pct: totalCount > 0 ? Math.round((d.count / totalCount) * 100) : 0,
  }));
}

function calcVendedores(ventas: IVenta[]) {
  const map = new Map<string, { ventas: number; facturacion: number }>();
  ventas.forEach(v => {
    const nombre = v.usuario?.nombre || 'Sin asignar';
    const cur = map.get(nombre) || { ventas: 0, facturacion: 0 };
    map.set(nombre, { ventas: cur.ventas + 1, facturacion: cur.facturacion + v.total });
  });
  return Array.from(map.entries())
    .map(([nombre, d]) => ({ nombre, ...d }))
    .sort((a, b) => b.facturacion - a.facturacion);
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface DerivedData {
  dailyData: ReturnType<typeof calcDailyData>;
  topProductos: ReturnType<typeof calcTopProductos>;
  metodosPago: ReturnType<typeof calcMetodosPago>;
  vendedores: ReturnType<typeof calcVendedores>;
  ventasRecientes: IVenta[];
}

type SortField = 'fecha_venta' | 'total' | 'cliente';

// ─── Sub-components ───────────────────────────────────────────────────────────

interface KPICardProps {
  title: string;
  value: number;
  formatter: (v: number) => string;
  icon: string;
  iconBg: string;
  iconColor: string;
  subtitle?: string;
  delay?: number;
}

function KPICard({ title, value, formatter, icon, iconBg, iconColor, subtitle, delay = 0 }: KPICardProps) {
  const animated = useCountUp(value);
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: '14px 16px', sm: '18px 20px' },
        borderRadius: '14px',
        border: '1px solid #E5E7EB',
        bgcolor: '#FFFFFF',
        height: '100%',
        cursor: 'default',
        '@keyframes kpiIn': {
          from: { opacity: 0, transform: 'translateY(14px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        animation: 'kpiIn 0.4s ease-out both',
        animationDelay: `${delay}ms`,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.07)',
          borderColor: 'rgba(88,138,158,0.3)',
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{
            color: '#9CA3AF', fontSize: '10px', fontWeight: 600,
            letterSpacing: '0.08em', textTransform: 'uppercase', mb: 1,
          }}>
            {title}
          </Typography>
          <Typography sx={{
            color: '#1F2937',
            fontSize: { xs: '18px', sm: '22px' },
            fontWeight: 700,
            lineHeight: 1.1,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {formatter(animated)}
          </Typography>
          {subtitle && (
            <Typography sx={{ fontSize: '11px', color: '#9CA3AF', mt: 0.5 }}>{subtitle}</Typography>
          )}
        </Box>
        <Box sx={{
          width: 38, height: 38, flexShrink: 0,
          borderRadius: '10px', bgcolor: iconBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: iconColor, fontSize: '15px',
        }}>
          <i className={icon} />
        </Box>
      </Box>
    </Paper>
  );
}

function PanelCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Paper elevation={0} sx={{
      p: { xs: 2, sm: 3 },
      borderRadius: '14px',
      border: '1px solid #E5E7EB',
      height: '100%',
    }}>
      <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#1F2937', mb: 2.5, letterSpacing: '-0.01em' }}>
        {title}
      </Typography>
      {children}
    </Paper>
  );
}

function EmptyState({ message = 'Sin datos para este período' }: { message?: string }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 5, gap: 1 }}>
      <Box sx={{ fontSize: '26px', color: '#D1D5DB' }}><i className="fa-regular fa-chart-bar" /></Box>
      <Typography sx={{ fontSize: '12px', color: '#9CA3AF' }}>{message}</Typography>
    </Box>
  );
}

function FinRow({ label, value, color, bold, isDeduction }: {
  label: string; value: string; color?: string; bold?: boolean; isDeduction?: boolean;
}) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography sx={{ fontSize: '13px', color: isDeduction ? '#6B7280' : '#374151', fontWeight: bold ? 600 : 400 }}>
        {label}
      </Typography>
      <Typography sx={{
        fontSize: '13px', fontWeight: bold ? 700 : 500,
        color: color || (isDeduction ? '#DC2626' : '#1F2937'),
        fontVariantNumeric: 'tabular-nums',
      }}>
        {value}
      </Typography>
    </Stack>
  );
}

const FinDivider = () => <Box sx={{ borderTop: '1px dashed #E5E7EB' }} />;

// Custom tooltips
function TooltipDonut({ active, payload }: { active?: boolean; payload?: Array<{ payload: ReturnType<typeof calcMetodosPago>[number] }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <Paper elevation={3} sx={{ p: '8px 12px', borderRadius: '8px' }}>
      <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#1F2937' }}>{d.name}</Typography>
      <Typography sx={{ fontSize: '11px', color: '#6B7280' }}>{d.pct}% · {d.value} ventas</Typography>
      <Typography sx={{ fontSize: '11px', color: colors.success, fontWeight: 600 }}>{fmtPesos(d.amount)}</Typography>
    </Paper>
  );
}

function TooltipArea({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <Paper elevation={3} sx={{ p: '8px 12px', borderRadius: '8px' }}>
      <Typography sx={{ fontSize: '11px', color: '#9CA3AF', mb: 0.5 }}>Día {label}</Typography>
      {payload.map(p => (
        <Typography key={p.name} sx={{ fontSize: '12px', color: p.color, fontWeight: 600 }}>
          {p.name}: {fmtPesos(p.value)}
        </Typography>
      ))}
    </Paper>
  );
}

function TooltipBar({ active, payload }: { active?: boolean; payload?: Array<{ payload: ReturnType<typeof calcTopProductos>[number] }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <Paper elevation={3} sx={{ p: '8px 12px', borderRadius: '8px' }}>
      <Typography sx={{ fontSize: '12px', fontWeight: 700, mb: 0.5 }}>{d.nombreFull}</Typography>
      <Typography sx={{ fontSize: '11px', color: '#6B7280' }}>Unidades: <b>{d.cantidad}</b></Typography>
      <Typography sx={{ fontSize: '11px', color: colors.success }}>Facturado: {fmtPesos(d.facturacion)}</Typography>
      <Typography sx={{ fontSize: '11px', color: '#9CA3AF' }}>Precio prom.: {fmtPesos(d.precioPromedio)}</Typography>
    </Paper>
  );
}

function TooltipVendedor({ active, payload }: { active?: boolean; payload?: Array<{ payload: ReturnType<typeof calcVendedores>[number] }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <Paper elevation={3} sx={{ p: '8px 12px', borderRadius: '8px' }}>
      <Typography sx={{ fontSize: '12px', fontWeight: 700, mb: 0.5 }}>{d.nombre}</Typography>
      <Typography sx={{ fontSize: '11px', color: '#6B7280' }}>Ventas: {d.ventas}</Typography>
      <Typography sx={{ fontSize: '11px', color: colors.success }}>Facturado: {fmtPesos(d.facturacion)}</Typography>
    </Paper>
  );
}

// Skeleton
function DashboardSkeleton() {
  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box><Skeleton width={260} height={32} sx={{ mb: 1 }} /><Skeleton width={160} height={18} /></Box>
        <Box sx={{ display: 'flex', gap: 1 }}><Skeleton width={130} height={40} sx={{ borderRadius: '8px' }} /><Skeleton width={90} height={40} sx={{ borderRadius: '8px' }} /></Box>
      </Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[...Array(6)].map((_, i) => (
          <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
            <Skeleton height={100} sx={{ borderRadius: '14px', transform: 'none' }} />
          </Grid>
        ))}
      </Grid>
      <Skeleton height={300} sx={{ borderRadius: '14px', transform: 'none', mb: 3 }} />
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 7 }}><Skeleton height={360} sx={{ borderRadius: '14px', transform: 'none' }} /></Grid>
        <Grid size={{ xs: 12, md: 5 }}><Skeleton height={360} sx={{ borderRadius: '14px', transform: 'none' }} /></Grid>
      </Grid>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}><Skeleton height={260} sx={{ borderRadius: '14px', transform: 'none' }} /></Grid>
        <Grid size={{ xs: 12, md: 6 }}><Skeleton height={260} sx={{ borderRadius: '14px', transform: 'none' }} /></Grid>
      </Grid>
      <Skeleton height={380} sx={{ borderRadius: '14px', transform: 'none' }} />
    </Box>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DashboardDueno() {
  const mounted = useMounted();
  const { user } = useAuthStore();

  const now = new Date();
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [anio, setAnio] = useState(now.getFullYear());
  const [data, setData] = useState<IDashboardMensual | null>(null);
  const [derived, setDerived] = useState<DerivedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('fecha_venta');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const fetchData = useCallback(async () => {
    if (!mounted) return;
    setLoading(true);
    setError(null);
    try {
      const [kpis, ventas] = await Promise.all([
        dashboardService.getMensual(mes, anio),
        ventaService.getAllUnpaginated(),
      ]);

      const ventasMes = ventas.filter(v => {
        const f = new Date(v.fecha_venta);
        return f.getMonth() + 1 === mes && f.getFullYear() === anio;
      });

      const { mes: pMes, anio: pAnio } = prevMesInfo(mes, anio);
      const ventasPrev = ventas.filter(v => {
        const f = new Date(v.fecha_venta);
        return f.getMonth() + 1 === pMes && f.getFullYear() === pAnio;
      });

      setData(kpis);
      setDerived({
        dailyData: calcDailyData(ventasMes, ventasPrev, mes, anio),
        topProductos: calcTopProductos(ventasMes),
        metodosPago: calcMetodosPago(ventasMes),
        vendedores: calcVendedores(ventasMes),
        ventasRecientes: [...ventasMes]
          .sort((a, b) => new Date(b.fecha_venta).getTime() - new Date(a.fecha_venta).getTime())
          .slice(0, 15),
      });
    } catch {
      setError('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  }, [mounted, mes, anio]);

  useEffect(() => {
    if (mounted) fetchData();
  }, [mounted, fetchData]);

  if (loading) return <DashboardSkeleton />;

  if (error || !data || !derived) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error">{error || 'Sin datos'}</Typography>
      </Box>
    );
  }

  const ticketPromedio = data.cantidad_ventas > 0 ? data.facturacion / data.cantidad_ventas : 0;
  const margenColor = data.margen_porcentaje >= 0 ? colors.success : colors.error;
  const { mes: pMes } = prevMesInfo(mes, anio);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const ventasOrdenadas = [...derived.ventasRecientes].sort((a, b) => {
    let av: string | number = a.fecha_venta;
    let bv: string | number = b.fecha_venta;
    if (sortField === 'total') { av = a.total; bv = b.total; }
    if (sortField === 'cliente') { av = a.cliente?.nombre || ''; bv = b.cliente?.nombre || ''; }
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  }).slice(0, 10);

  const kpis: KPICardProps[] = [
    {
      title: 'Ventas del Mes',
      value: data.cantidad_ventas,
      formatter: v => String(Math.round(v)),
      icon: 'fa-solid fa-cart-shopping',
      iconBg: colors.primaryLight,
      iconColor: colors.primary,
    },
    {
      title: 'Facturación',
      value: data.facturacion,
      formatter: fmtPesos,
      icon: 'fa-solid fa-dollar-sign',
      iconBg: colors.infoLight,
      iconColor: colors.info,
    },
    {
      title: 'Ganancia Neta',
      value: data.ganancia_neta,
      formatter: fmtPesos,
      icon: 'fa-solid fa-chart-line',
      iconBg: colors.successLight,
      iconColor: colors.success,
    },
    {
      title: 'Margen',
      value: data.margen_porcentaje,
      formatter: v => `${v.toFixed(1)}%`,
      icon: 'fa-solid fa-percent',
      iconBg: data.margen_porcentaje >= 0 ? colors.successLight : colors.errorLight,
      iconColor: margenColor,
    },
    {
      title: 'Ticket Promedio',
      value: ticketPromedio,
      formatter: fmtPesos,
      icon: 'fa-solid fa-receipt',
      iconBg: colors.purpleLight,
      iconColor: colors.purple,
    },
    {
      title: 'Costo de Productos',
      value: data.costo_productos,
      formatter: fmtPesos,
      icon: 'fa-solid fa-boxes-stacked',
      iconBg: colors.errorLight,
      iconColor: colors.error,
    },
  ];

  const prevMesLabel = MESES[pMes - 1];
  const mesLabel = MESES[mes - 1];
  const topHeight = Math.max(derived.topProductos.length * 36 + 32, 180);
  const vendHeight = Math.max(derived.vendedores.length * 40 + 32, 180);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: colors.textPrimary, fontSize: { xs: '20px', sm: '26px' }, mb: 0.5 }}>
            Dashboard{user ? ` — ${user.nombre}` : ''}
          </Typography>
          <Typography sx={{ color: colors.textSecondary, fontSize: '13px' }}>
            {mesLabel} {anio} · Resumen ejecutivo
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <FormControl size="small">
            <Select value={mes} onChange={e => setMes(Number(e.target.value))} sx={{ fontSize: '14px', minWidth: 130 }}>
              {MESES.map((n, i) => <MenuItem key={i + 1} value={i + 1}>{n}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small">
            <Select value={anio} onChange={e => setAnio(Number(e.target.value))} sx={{ fontSize: '14px', minWidth: 90 }}>
              {ANIOS.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
            </Select>
          </FormControl>
        </Stack>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {kpis.map((kpi, i) => (
          <Grid key={kpi.title} size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
            <KPICard {...kpi} delay={i * 60} />
          </Grid>
        ))}
      </Grid>

      {/* Area chart — Evolución diaria */}
      <Box sx={{ mb: 3 }}>
        <PanelCard title={`Evolución de Facturación — ${mesLabel} vs ${prevMesLabel}`}>
          {derived.dailyData.every(d => d.actual === 0 && d.anterior === 0) ? (
            <EmptyState />
          ) : (
            <Box>
              {/* Legend manual */}
              <Stack direction="row" spacing={2.5} sx={{ mb: 1.5 }}>
                <Stack direction="row" alignItems="center" spacing={0.75}>
                  <Box sx={{ width: 24, height: 2, bgcolor: '#588a9e', borderRadius: 1 }} />
                  <Typography sx={{ fontSize: '12px', color: '#374151' }}>{mesLabel}</Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={0.75}>
                  <Box sx={{ width: 24, height: 2, bgcolor: '#D97706', borderRadius: 1, opacity: 0.7 }} />
                  <Typography sx={{ fontSize: '12px', color: '#374151' }}>{prevMesLabel}</Typography>
                </Stack>
              </Stack>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={derived.dailyData} margin={{ top: 5, right: 16, left: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#588a9e" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#588a9e" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gradAnterior" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D97706" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#D97706" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis
                    dataKey="dia"
                    tick={{ fontSize: 11, fill: '#9CA3AF' }}
                    axisLine={false} tickLine={false}
                    interval={3}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#9CA3AF' }}
                    axisLine={false} tickLine={false}
                    tickFormatter={fmtShort}
                    width={58}
                  />
                  <Tooltip content={<TooltipArea />} />
                  <Area
                    type="monotone" dataKey="anterior"
                    stroke="#D97706" strokeWidth={1.5} strokeDasharray="4 2"
                    fill="url(#gradAnterior)"
                    name={prevMesLabel}
                    dot={false}
                    isAnimationActive
                  />
                  <Area
                    type="monotone" dataKey="actual"
                    stroke="#588a9e" strokeWidth={2}
                    fill="url(#gradActual)"
                    name={mesLabel}
                    dot={false}
                    isAnimationActive
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          )}
        </PanelCard>
      </Box>

      {/* Top productos + Métodos de pago */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Top 10 productos */}
        <Grid size={{ xs: 12, md: 7 }} sx={{ display: 'flex', flexDirection: 'column' }}>
          <PanelCard title="Top Productos — Unidades Vendidas">
            {derived.topProductos.length === 0 ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height={topHeight}>
                <BarChart
                  data={derived.topProductos}
                  layout="vertical"
                  margin={{ left: 0, right: 16, top: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category" dataKey="nombre"
                    tick={{ fontSize: 11, fill: '#374151' }}
                    width={120} axisLine={false} tickLine={false}
                  />
                  <Tooltip content={<TooltipBar />} />
                  <Bar dataKey="cantidad" fill="#588a9e" name="Unidades" radius={[0, 4, 4, 0]} isAnimationActive />
                </BarChart>
              </ResponsiveContainer>
            )}
          </PanelCard>
        </Grid>

        {/* Métodos de pago */}
        <Grid size={{ xs: 12, md: 5 }} sx={{ display: 'flex', flexDirection: 'column' }}>
          <PanelCard title="Métodos de Pago">
            {derived.metodosPago.length === 0 ? (
              <EmptyState />
            ) : (
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', gap: 2 }}>
                <Box sx={{ flexShrink: 0 }}>
                  <ResponsiveContainer width={190} height={190}>
                    <PieChart>
                      <Pie
                        data={derived.metodosPago}
                        cx="50%" cy="50%"
                        innerRadius={55} outerRadius={88}
                        dataKey="value"
                        paddingAngle={3}
                        isAnimationActive
                      >
                        {derived.metodosPago.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<TooltipDonut />} />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  {derived.metodosPago.map((m, i) => (
                    <Box key={m.name} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                      <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: CHART_COLORS[i % CHART_COLORS.length], flexShrink: 0 }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>{m.name}</Typography>
                        <Typography sx={{ fontSize: '10px', color: '#9CA3AF' }}>{m.pct}% · {m.value} ventas</Typography>
                      </Box>
                      <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#1F2937', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                        {fmtShort(m.amount)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </PanelCard>
        </Grid>
      </Grid>

      {/* Vendedores + Desglose financiero */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Vendedores */}
        <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex', flexDirection: 'column' }}>
          <PanelCard title="Facturación por Vendedor">
            {derived.vendedores.length === 0 ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height={vendHeight}>
                <BarChart
                  data={derived.vendedores}
                  layout="vertical"
                  margin={{ left: 0, right: 16, top: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={fmtShort} />
                  <YAxis
                    type="category" dataKey="nombre"
                    tick={{ fontSize: 11, fill: '#374151' }}
                    width={110} axisLine={false} tickLine={false}
                  />
                  <Tooltip content={<TooltipVendedor />} />
                  <Bar dataKey="facturacion" fill="#10B981" name="Facturación" radius={[0, 4, 4, 0]} isAnimationActive />
                </BarChart>
              </ResponsiveContainer>
            )}
          </PanelCard>
        </Grid>

        {/* Desglose financiero */}
        <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex', flexDirection: 'column' }}>
          <PanelCard title="Desglose Financiero">
            <Stack spacing={1.5}>
              <FinRow label="Facturación total" value={fmtPesos(data.facturacion)} bold />
              <FinRow label="— Costo de productos" value={`- ${fmtPesos(data.costo_productos)}`} isDeduction />
              <FinDivider />
              <FinRow label="Ganancia bruta" value={fmtPesos(data.ganancia_real)} color={colors.primary} bold />
              <FinRow label="— Publicidad" value={`- ${fmtPesos(data.publicidad)}`} isDeduction />
              <FinRow label="— Comisiones vendedores" value={`- ${fmtPesos(data.comision_vendedores)}`} isDeduction />
              <FinRow label="— Gastos fijos" value={`- ${fmtPesos(data.gastos_fijos)}`} isDeduction />
              <FinDivider />
              <FinRow label="Ganancia neta" value={fmtPesos(data.ganancia_neta)} color={margenColor} bold />
              <Box sx={{ pt: 0.5 }}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
                  <Typography sx={{ fontSize: '11px', color: '#9CA3AF' }}>Margen de ganancia</Typography>
                  <Typography sx={{ fontSize: '13px', fontWeight: 700, color: margenColor, fontVariantNumeric: 'tabular-nums' }}>
                    {data.margen_porcentaje.toFixed(1)}%
                  </Typography>
                </Stack>
                <Box sx={{ height: 6, bgcolor: '#E5E7EB', borderRadius: '3px', overflow: 'hidden' }}>
                  <Box sx={{
                    width: `${Math.min(Math.max(data.margen_porcentaje, 0), 100)}%`,
                    height: '100%', bgcolor: margenColor, borderRadius: '3px',
                    transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)',
                  }} />
                </Box>
              </Box>
            </Stack>
          </PanelCard>
        </Grid>
      </Grid>

      {/* Tabla ventas recientes */}
      <PanelCard title={`Ventas Recientes — ${mesLabel} ${anio}`}>
        {ventasOrdenadas.length === 0 ? (
          <EmptyState message="No hay ventas registradas en este período" />
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& .MuiTableCell-head': { borderBottom: '2px solid #F3F4F6', py: 1 } }}>
                  <TableCell>
                    <TableSortLabel
                      active={sortField === 'fecha_venta'}
                      direction={sortField === 'fecha_venta' ? sortDir : 'asc'}
                      onClick={() => handleSort('fecha_venta')}
                      sx={{ fontSize: '10px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}
                    >
                      Fecha
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortField === 'cliente'}
                      direction={sortField === 'cliente' ? sortDir : 'asc'}
                      onClick={() => handleSort('cliente')}
                      sx={{ fontSize: '10px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}
                    >
                      Cliente
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontSize: '10px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Productos
                  </TableCell>
                  <TableCell sx={{ fontSize: '10px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Pago
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortField === 'total'}
                      direction={sortField === 'total' ? sortDir : 'asc'}
                      onClick={() => handleSort('total')}
                      sx={{ fontSize: '10px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}
                    >
                      Total
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontSize: '10px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Saldo
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ventasOrdenadas.map((v, i) => (
                  <TableRow
                    key={v.id}
                    sx={{
                      '@keyframes rowIn': { from: { opacity: 0 }, to: { opacity: 1 } },
                      animation: 'rowIn 0.3s ease-out both',
                      animationDelay: `${i * 25}ms`,
                      '&:hover': { bgcolor: '#F9FAFB' },
                      '& .MuiTableCell-root': { borderBottom: '1px solid #F3F4F6', py: 1 },
                    }}
                  >
                    <TableCell sx={{ fontSize: '13px', color: '#374151', whiteSpace: 'nowrap' }}>
                      {fmtDate(v.fecha_venta)}
                    </TableCell>
                    <TableCell sx={{ fontSize: '13px', color: '#1F2937', fontWeight: 500 }}>
                      {v.cliente?.nombre || '—'}
                    </TableCell>
                    <TableCell sx={{ fontSize: '12px', color: '#6B7280' }}>
                      {v.detalles && v.detalles.length > 0
                        ? v.detalles.length === 1
                          ? (v.detalles[0].producto?.nombre?.substring(0, 24) || '1 producto')
                          : `${v.detalles.length} productos`
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={v.forma_pago?.nombre || 'N/D'}
                        size="small"
                        sx={{
                          fontSize: '11px', height: '22px',
                          bgcolor: colors.primaryLight, color: colors.primaryDark, fontWeight: 500,
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: '13px', fontWeight: 700, color: '#1F2937', fontVariantNumeric: 'tabular-nums' }}>
                      {fmtPesos(v.total)}
                    </TableCell>
                    <TableCell>
                      {v.saldo > 0 ? (
                        <Typography sx={{ fontSize: '12px', fontWeight: 600, color: colors.error }}>
                          {fmtPesos(v.saldo)} pendiente
                        </Typography>
                      ) : (
                        <Typography sx={{ fontSize: '12px', color: colors.success }}>
                          <i className="fa-solid fa-circle-check" style={{ marginRight: 4 }} />
                          Pagado
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </PanelCard>
    </Box>
  );
}
