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

const fmtPesos = (v: number) => '$' + Math.round(v).toLocaleString('es-AR');
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
      if (t >= 1) { setVal(target); } else {
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

function calcDailyData(ventasMes: IVenta[], ventasPrev: IVenta[], mes: number, anio: number) {
  const days = new Date(anio, mes, 0).getDate();
  return Array.from({ length: days }, (_, i) => {
    const day = i + 1;
    const actual = ventasMes.filter(v => new Date(v.fecha_venta).getDate() === day).reduce((s, v) => s + v.total, 0);
    const anterior = ventasPrev.filter(v => new Date(v.fecha_venta).getDate() === day).reduce((s, v) => s + v.total, 0);
    return { dia: String(day), actual, anterior };
  });
}

function calcTopProductos(ventas: IVenta[]) {
  const map = new Map<string, { cantidad: number; facturacion: number; nombreFull: string }>();
  ventas.forEach(v =>
    v.detalles?.forEach(d => {
      const key = d.producto?.nombre || 'Desconocido';
      const cur = map.get(key) || { cantidad: 0, facturacion: 0, nombreFull: key };
      map.set(key, { cantidad: cur.cantidad + d.cantidad, facturacion: cur.facturacion + d.subtotal, nombreFull: key });
    })
  );
  return Array.from(map.entries())
    .map(([k, d]) => ({
      nombre: k.length > 16 ? k.substring(0, 14) + '…' : k,
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
    name, value: d.count, amount: d.total,
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
  return Array.from(map.entries()).map(([nombre, d]) => ({ nombre, ...d })).sort((a, b) => b.facturacion - a.facturacion);
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface PrevMetrics { cantidad_ventas: number; facturacion: number; ticket_promedio: number; }

interface DerivedData {
  dailyData: ReturnType<typeof calcDailyData>;
  topProductos: ReturnType<typeof calcTopProductos>;
  metodosPago: ReturnType<typeof calcMetodosPago>;
  vendedores: ReturnType<typeof calcVendedores>;
  ventasRecientes: IVenta[];
  prevMetrics: PrevMetrics;
}

type SortField = 'fecha_venta' | 'total' | 'cliente';

// ─── KPICard — compact, sin icono, con variación ──────────────────────────────

interface KPICardProps {
  title: string;
  value: number;
  formatter: (v: number) => string;
  prevValue?: number;
  delay?: number;
}

function KPICard({ title, value, formatter, prevValue, delay = 0 }: KPICardProps) {
  const animated = useCountUp(value);
  const variation = prevValue != null && prevValue !== 0
    ? ((value - prevValue) / Math.abs(prevValue)) * 100
    : null;
  const isUp = variation != null && variation >= 0;

  return (
    <Paper elevation={0} sx={{
      p: '10px 14px',
      borderRadius: '12px',
      border: '1px solid #E5E7EB',
      bgcolor: '#FFFFFF',
      height: '100%',
      minHeight: '78px',
      cursor: 'default',
      overflow: 'hidden',
      '@keyframes kpiIn': { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      animation: 'kpiIn 0.35s ease-out both',
      animationDelay: `${delay}ms`,
      transition: 'transform 0.18s ease, box-shadow 0.18s ease',
      '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 20px rgba(0,0,0,0.07)', borderColor: 'rgba(88,138,158,0.3)' },
    }}>
      <Typography sx={{ color: '#9CA3AF', fontSize: '10px', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', mb: '4px', lineHeight: 1 }}>
        {title}
      </Typography>
      <Typography sx={{ color: '#1F2937', fontSize: '20px', fontWeight: 700, lineHeight: 1, fontVariantNumeric: 'tabular-nums', mb: '4px' }}>
        {formatter(animated)}
      </Typography>
      {variation !== null && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          <i className={`fa-solid fa-arrow-${isUp ? 'up' : 'down'}`} style={{ fontSize: '8px', color: isUp ? '#059669' : '#DC2626' }} />
          <Typography sx={{ fontSize: '10px', fontWeight: 700, color: isUp ? '#059669' : '#DC2626', lineHeight: 1 }}>
            {Math.abs(variation).toFixed(1)}%
          </Typography>
          <Typography sx={{ fontSize: '10px', color: '#9CA3AF', lineHeight: 1 }}>vs ant.</Typography>
        </Box>
      )}
    </Paper>
  );
}

// ─── PanelCard ────────────────────────────────────────────────────────────────

function PanelCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Paper elevation={0} sx={{ p: '16px', borderRadius: '14px', border: '1px solid #E5E7EB', height: '100%' }}>
      <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#1F2937', mb: 1.5, letterSpacing: '-0.01em' }}>
        {title}
      </Typography>
      {children}
    </Paper>
  );
}

function EmptyState({ message = 'Sin datos para este período' }: { message?: string }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, gap: 1 }}>
      <Box sx={{ fontSize: '22px', color: '#D1D5DB' }}><i className="fa-regular fa-chart-bar" /></Box>
      <Typography sx={{ fontSize: '12px', color: '#9CA3AF' }}>{message}</Typography>
    </Box>
  );
}

// ─── Desglose helpers ─────────────────────────────────────────────────────────

function FinRow({ label, value, color, bold, isDeduction }: { label: string; value: string; color?: string; bold?: boolean; isDeduction?: boolean }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography sx={{ fontSize: '12px', color: isDeduction ? '#6B7280' : '#374151', fontWeight: bold ? 600 : 400 }}>{label}</Typography>
      <Typography sx={{ fontSize: '12px', fontWeight: bold ? 700 : 500, color: color || (isDeduction ? '#DC2626' : '#1F2937'), fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </Typography>
    </Stack>
  );
}
const FinDivider = () => <Box sx={{ borderTop: '1px dashed #E5E7EB' }} />;

// ─── Tooltips ─────────────────────────────────────────────────────────────────

function TooltipDonut({ active, payload }: { active?: boolean; payload?: Array<{ payload: ReturnType<typeof calcMetodosPago>[number] }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <Paper elevation={3} sx={{ p: '8px 12px', borderRadius: '8px' }}>
      <Typography sx={{ fontSize: '12px', fontWeight: 700 }}>{d.name}</Typography>
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
        <Typography key={p.name} sx={{ fontSize: '12px', color: p.color, fontWeight: 600 }}>{p.name}: {fmtPesos(p.value)}</Typography>
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

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box><Skeleton width={240} height={28} sx={{ mb: 0.5 }} /><Skeleton width={140} height={16} /></Box>
        <Box sx={{ display: 'flex', gap: 1 }}><Skeleton width={120} height={36} sx={{ borderRadius: '8px' }} /><Skeleton width={80} height={36} sx={{ borderRadius: '8px' }} /></Box>
      </Box>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        {[...Array(6)].map((_, i) => <Grid key={i} size={{ xs: 6, sm: 4, md: 2 }}><Skeleton height={80} sx={{ borderRadius: '12px', transform: 'none' }} /></Grid>)}
      </Grid>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '6fr 4fr' }, gap: 2, mb: 2 }}>
        <Skeleton height={260} sx={{ borderRadius: '14px', transform: 'none' }} />
        <Skeleton height={260} sx={{ borderRadius: '14px', transform: 'none' }} />
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '40fr 25fr 35fr' }, gap: 2, mb: 2 }}>
        <Skeleton height={300} sx={{ borderRadius: '14px', transform: 'none' }} />
        <Skeleton height={300} sx={{ borderRadius: '14px', transform: 'none' }} />
        <Skeleton height={300} sx={{ borderRadius: '14px', transform: 'none' }} />
      </Box>
      <Skeleton height={360} sx={{ borderRadius: '14px', transform: 'none' }} />
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

      const prevFacturacion = ventasPrev.reduce((s, v) => s + v.total, 0);
      const prevCantidad = ventasPrev.length;

      setData(kpis);
      setDerived({
        dailyData: calcDailyData(ventasMes, ventasPrev, mes, anio),
        topProductos: calcTopProductos(ventasMes),
        metodosPago: calcMetodosPago(ventasMes),
        vendedores: calcVendedores(ventasMes),
        ventasRecientes: [...ventasMes]
          .sort((a, b) => new Date(b.fecha_venta).getTime() - new Date(a.fecha_venta).getTime())
          .slice(0, 15),
        prevMetrics: {
          cantidad_ventas: prevCantidad,
          facturacion: prevFacturacion,
          ticket_promedio: prevCantidad > 0 ? prevFacturacion / prevCantidad : 0,
        },
      });
    } catch {
      setError('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  }, [mounted, mes, anio]);

  useEffect(() => { if (mounted) fetchData(); }, [mounted, fetchData]);

  if (loading) return <DashboardSkeleton />;
  if (error || !data || !derived) {
    return <Box sx={{ p: 4, textAlign: 'center' }}><Typography color="error">{error || 'Sin datos'}</Typography></Box>;
  }

  const ticketPromedio = data.cantidad_ventas > 0 ? data.facturacion / data.cantidad_ventas : 0;
  const margenColor = data.margen_porcentaje >= 0 ? colors.success : colors.error;
  const { mes: pMes } = prevMesInfo(mes, anio);
  const prevMesLabel = MESES[pMes - 1];
  const mesLabel = MESES[mes - 1];

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
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
    { title: 'Ventas del Mes', value: data.cantidad_ventas, formatter: v => String(Math.round(v)), prevValue: derived.prevMetrics.cantidad_ventas },
    { title: 'Facturación', value: data.facturacion, formatter: fmtPesos, prevValue: derived.prevMetrics.facturacion },
    { title: 'Ganancia Neta', value: data.ganancia_neta, formatter: fmtPesos },
    { title: 'Margen', value: data.margen_porcentaje, formatter: v => `${v.toFixed(1)}%` },
    { title: 'Ticket Promedio', value: ticketPromedio, formatter: fmtPesos, prevValue: derived.prevMetrics.ticket_promedio },
    { title: 'Costo Productos', value: data.costo_productos, formatter: fmtPesos },
  ];

  const vendHeight = Math.min(Math.max(derived.vendedores.length * 28 + 20, 100), 240);

  return (
    <Box>
      {/* ── Header ── */}
      <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: colors.textPrimary, fontSize: { xs: '18px', sm: '22px' }, mb: 0.25 }}>
            Dashboard{user ? ` — ${user.nombre}` : ''}
          </Typography>
          <Typography sx={{ color: colors.textSecondary, fontSize: '12px' }}>{mesLabel} {anio} · Resumen ejecutivo</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <FormControl size="small">
            <Select value={mes} onChange={e => setMes(Number(e.target.value))} sx={{ fontSize: '13px', minWidth: 120 }}>
              {MESES.map((n, i) => <MenuItem key={i + 1} value={i + 1}>{n}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small">
            <Select value={anio} onChange={e => setAnio(Number(e.target.value))} sx={{ fontSize: '13px', minWidth: 85 }}>
              {ANIOS.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
            </Select>
          </FormControl>
        </Stack>
      </Box>

      {/* ── Fila 1: KPI Cards ── */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        {kpis.map((kpi, i) => (
          <Grid key={kpi.title} size={{ xs: 6, sm: 4, md: 2 }}>
            <KPICard {...kpi} delay={i * 55} />
          </Grid>
        ))}
      </Grid>

      {/* ── Fila 2: Area chart (60%) + Desglose Financiero (40%) ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '6fr 4fr' }, gap: 2, mb: 2 }}>
        {/* Area chart */}
        <PanelCard title={`Evolución de Facturación — ${mesLabel} vs ${prevMesLabel}`}>
          {derived.dailyData.every(d => d.actual === 0 && d.anterior === 0) ? <EmptyState /> : (
            <Box>
              <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
                <Stack direction="row" alignItems="center" spacing={0.75}>
                  <Box sx={{ width: 20, height: 2, bgcolor: '#588a9e', borderRadius: 1 }} />
                  <Typography sx={{ fontSize: '11px', color: '#374151' }}>{mesLabel}</Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={0.75}>
                  <Box sx={{ width: 20, height: 2, bgcolor: '#D97706', borderRadius: 1, opacity: 0.7 }} />
                  <Typography sx={{ fontSize: '11px', color: '#374151' }}>{prevMesLabel}</Typography>
                </Stack>
              </Stack>
              <ResponsiveContainer width="100%" height={185}>
                <AreaChart data={derived.dailyData} margin={{ top: 4, right: 12, left: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#588a9e" stopOpacity={0.25} /><stop offset="95%" stopColor="#588a9e" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gradAnterior" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D97706" stopOpacity={0.15} /><stop offset="95%" stopColor="#D97706" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis dataKey="dia" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} interval={4} />
                  <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={fmtShort} width={52} />
                  <Tooltip content={<TooltipArea />} />
                  <Area type="monotone" dataKey="anterior" stroke="#D97706" strokeWidth={1.5} strokeDasharray="4 2" fill="url(#gradAnterior)" name={prevMesLabel} dot={false} isAnimationActive />
                  <Area type="monotone" dataKey="actual" stroke="#588a9e" strokeWidth={2} fill="url(#gradActual)" name={mesLabel} dot={false} isAnimationActive />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          )}
        </PanelCard>

        {/* Desglose Financiero */}
        <PanelCard title="Desglose Financiero">
          <Stack spacing={1}>
            <FinRow label="Facturación total" value={fmtPesos(data.facturacion)} bold />
            <FinRow label="— Costo de productos" value={`- ${fmtPesos(data.costo_productos)}`} isDeduction />
            <FinDivider />
            <FinRow label="Ganancia bruta" value={fmtPesos(data.ganancia_real)} color={colors.primary} bold />
            <FinRow label="— Publicidad" value={`- ${fmtPesos(data.publicidad)}`} isDeduction />
            <FinRow label="— Comisiones" value={`- ${fmtPesos(data.comision_vendedores)}`} isDeduction />
            <FinRow label="— Gastos fijos" value={`- ${fmtPesos(data.gastos_fijos)}`} isDeduction />
            <FinDivider />
            <FinRow label="Ganancia neta" value={fmtPesos(data.ganancia_neta)} color={margenColor} bold />
            <Box sx={{ pt: 0.5 }}>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                <Typography sx={{ fontSize: '11px', color: '#9CA3AF' }}>Margen</Typography>
                <Typography sx={{ fontSize: '12px', fontWeight: 700, color: margenColor, fontVariantNumeric: 'tabular-nums' }}>
                  {data.margen_porcentaje.toFixed(1)}%
                </Typography>
              </Stack>
              <Box sx={{ height: 5, bgcolor: '#E5E7EB', borderRadius: '3px', overflow: 'hidden' }}>
                <Box sx={{ width: `${Math.min(Math.max(data.margen_porcentaje, 0), 100)}%`, height: '100%', bgcolor: margenColor, borderRadius: '3px', transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)' }} />
              </Box>
            </Box>
          </Stack>
        </PanelCard>
      </Box>

      {/* ── Fila 3: Top Productos (40%) + Métodos Pago (25%) + Vendedores (35%) ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '40fr 25fr 35fr' }, gap: 2, mb: 2 }}>
        {/* Top Productos */}
        <PanelCard title="Top Productos — Unidades">
          {derived.topProductos.length === 0 ? <EmptyState /> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={derived.topProductos} layout="vertical" margin={{ left: 0, right: 12, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="nombre" tick={{ fontSize: 10, fill: '#374151' }} width={108} axisLine={false} tickLine={false} />
                <Tooltip content={<TooltipBar />} />
                <Bar dataKey="cantidad" fill="#588a9e" name="Unidades" radius={[0, 3, 3, 0]} isAnimationActive />
              </BarChart>
            </ResponsiveContainer>
          )}
        </PanelCard>

        {/* Métodos de Pago — donut + leyenda vertical */}
        <PanelCard title="Métodos de Pago">
          {derived.metodosPago.length === 0 ? <EmptyState /> : (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
              <ResponsiveContainer width="100%" height={130}>
                <PieChart>
                  <Pie data={derived.metodosPago} cx="50%" cy="50%" innerRadius={38} outerRadius={60} dataKey="value" paddingAngle={3} isAnimationActive>
                    {derived.metodosPago.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<TooltipDonut />} />
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ width: '100%' }}>
                {derived.metodosPago.map((m, i) => (
                  <Box key={m.name} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: CHART_COLORS[i % CHART_COLORS.length], flexShrink: 0 }} />
                      <Typography sx={{ fontSize: '11px', color: '#374151', fontWeight: 500 }} noWrap>{m.name}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#1F2937', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', ml: 1 }}>
                      {m.pct}%
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </PanelCard>

        {/* Facturación por Vendedor */}
        <PanelCard title="Facturación por Vendedor">
          {derived.vendedores.length === 0 ? <EmptyState /> : (
            <ResponsiveContainer width="100%" height={vendHeight}>
              <BarChart data={derived.vendedores} layout="vertical" margin={{ left: 0, right: 12, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={fmtShort} />
                <YAxis type="category" dataKey="nombre" tick={{ fontSize: 10, fill: '#374151' }} width={100} axisLine={false} tickLine={false} />
                <Tooltip content={<TooltipVendedor />} />
                <Bar dataKey="facturacion" fill="#10B981" name="Facturación" radius={[0, 3, 3, 0]} isAnimationActive />
              </BarChart>
            </ResponsiveContainer>
          )}
        </PanelCard>
      </Box>

      {/* ── Fila 4: Tabla Ventas Recientes ── */}
      <PanelCard title={`Ventas Recientes — ${mesLabel} ${anio}`}>
        {ventasOrdenadas.length === 0 ? <EmptyState message="No hay ventas registradas en este período" /> : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& .MuiTableCell-head': { borderBottom: '2px solid #F3F4F6', py: 0.75 } }}>
                  <TableCell>
                    <TableSortLabel active={sortField === 'fecha_venta'} direction={sortField === 'fecha_venta' ? sortDir : 'asc'} onClick={() => handleSort('fecha_venta')} sx={{ fontSize: '10px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Fecha</TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel active={sortField === 'cliente'} direction={sortField === 'cliente' ? sortDir : 'asc'} onClick={() => handleSort('cliente')} sx={{ fontSize: '10px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Cliente</TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontSize: '10px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Productos</TableCell>
                  <TableCell sx={{ fontSize: '10px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pago</TableCell>
                  <TableCell>
                    <TableSortLabel active={sortField === 'total'} direction={sortField === 'total' ? sortDir : 'asc'} onClick={() => handleSort('total')} sx={{ fontSize: '10px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total</TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontSize: '10px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Saldo</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ventasOrdenadas.map((v, i) => (
                  <TableRow key={v.id} sx={{
                    '@keyframes rowIn': { from: { opacity: 0 }, to: { opacity: 1 } },
                    animation: 'rowIn 0.3s ease-out both',
                    animationDelay: `${i * 25}ms`,
                    '&:hover': { bgcolor: '#F9FAFB' },
                    '& .MuiTableCell-root': { borderBottom: '1px solid #F3F4F6', py: 0.75 },
                  }}>
                    <TableCell sx={{ fontSize: '12px', color: '#374151', whiteSpace: 'nowrap' }}>{fmtDate(v.fecha_venta)}</TableCell>
                    <TableCell sx={{ fontSize: '12px', color: '#1F2937', fontWeight: 500 }}>{v.cliente?.nombre || '—'}</TableCell>
                    <TableCell sx={{ fontSize: '11px', color: '#6B7280' }}>
                      {v.detalles && v.detalles.length > 0 ? (v.detalles.length === 1 ? (v.detalles[0].producto?.nombre?.substring(0, 22) || '1 producto') : `${v.detalles.length} productos`) : '—'}
                    </TableCell>
                    <TableCell>
                      <Chip label={v.forma_pago?.nombre || 'N/D'} size="small" sx={{ fontSize: '10px', height: '20px', bgcolor: colors.primaryLight, color: colors.primaryDark, fontWeight: 500 }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: '12px', fontWeight: 700, color: '#1F2937', fontVariantNumeric: 'tabular-nums' }}>{fmtPesos(v.total)}</TableCell>
                    <TableCell>
                      {v.saldo > 0
                        ? <Typography sx={{ fontSize: '11px', fontWeight: 600, color: colors.error }}>{fmtPesos(v.saldo)} pendiente</Typography>
                        : <Typography sx={{ fontSize: '11px', color: colors.success }}><i className="fa-solid fa-circle-check" style={{ marginRight: 3 }} />Pagado</Typography>
                      }
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
