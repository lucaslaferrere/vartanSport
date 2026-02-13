'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Box, Typography, Grid, Chip, CircularProgress } from '@mui/material';
import { ColumnDef } from '@tanstack/react-table';
import StatCard from '@components/Cards/StatCard';
import TableClientSide from '@components/Tables/TableClientSide';
import { TableFilterType } from '@components/Tables/Filters/TableFilterType';
import { colors } from '@/src/theme/colors';
import { useAuthStore } from '@libraries/store';
import { ventaService } from '@services/venta.service';
import { productoService } from '@services/producto.service';
import { IVenta } from '@models/entities/ventaEntity';
import { useMounted } from '@hooks/useMounted';

interface IVentaReciente {
  id: number;
  cliente: string;
  producto: string;
  cantidad: number;
  total: number;
  metodoPago: string;
  fecha: string;
}

interface IDashboardStats {
  ventasHoy: number;
  ingresosMes: number;
  gananciasBrutas: number;
  productosVendidos: number;
  totalProductos: number;
}

const metodoPagoOptions = [
  { value: 'Efectivo', label: 'Efectivo' },
  { value: 'Transferencia Bancaria', label: 'Transferencia Bancaria' },
  { value: 'Transferencia Financiera', label: 'Transferencia Financiera' },
  { value: 'Transferencia a Cero', label: 'Transferencia a Cero' },
];

export default function DashboardPage() {
  const mounted = useMounted();
  const { user } = useAuthStore();
  const [ventas, setVentas] = useState<IVentaReciente[]>([]);
  const [stats, setStats] = useState<IDashboardStats>({
    ventasHoy: 0,
    ingresosMes: 0,
    gananciasBrutas: 0,
    productosVendidos: 0,
    totalProductos: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const transformVenta = (venta: IVenta): IVentaReciente => ({
    id: venta.id,
    cliente: venta.cliente?.nombre || 'Cliente no especificado',
    producto: venta.detalles?.[0]?.producto?.nombre || 'Producto no especificado',
    cantidad: venta.detalles?.reduce((sum: number, item) => sum + item.cantidad, 0) || 0,
    total: venta.total,
    metodoPago: venta.forma_pago?.nombre || 'No especificado',
    fecha: new Date(venta.fecha_venta).toLocaleDateString('es-AR'),
  });

  const calcularStats = (ventasData: IVenta[], productosCount: number): IDashboardStats => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    const ventasHoy = ventasData.filter(v => {
      const fechaVenta = new Date(v.fecha_venta);
      fechaVenta.setHours(0, 0, 0, 0);
      return fechaVenta.getTime() === hoy.getTime();
    }).length;

    const ventasMes = ventasData.filter(v => new Date(v.fecha_venta) >= inicioMes);

    const ingresosMes = ventasMes.reduce((sum, v) => sum + v.total, 0);
    const gananciasBrutas = ventasMes.reduce((sum, v) => sum + v.total_final, 0);
    const productosVendidos = ventasMes.reduce((sum, v) => {
      return sum + (v.detalles?.reduce((itemSum: number, item) => itemSum + item.cantidad, 0) || 0);
    }, 0);

    return {
      ventasHoy,
      ingresosMes,
      gananciasBrutas,
      productosVendidos,
      totalProductos: productosCount,
    };
  };

  const fetchDashboardData = useCallback(async () => {
    if (!mounted) return;

    setLoading(true);
    setError(null);

    try {
      // Obtener ventas
      const ventasData = await ventaService.getAll();

      // Obtener productos para el conteo
      const productosData = await productoService.getAll();
      const productosCount = productosData.length || 0;

      // Transformar ventas para la tabla (últimas 10)
      const ventasRecientes = ventasData
        .sort((a: IVenta, b: IVenta) => new Date(b.fecha_venta).getTime() - new Date(a.fecha_venta).getTime())
        .slice(0, 10)
        .map(transformVenta);

      setVentas(ventasRecientes);
      setStats(calcularStats(ventasData, productosCount));
    } catch (err) {
      console.error('Error cargando datos del dashboard:', err);
      setError('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  }, [mounted]);

  useEffect(() => {
    if (mounted) {
      fetchDashboardData();
    }
  }, [mounted, fetchDashboardData]);

  const formatCurrency = (value: number) => '$' + value.toLocaleString('es-AR');

  const getMetodoPagoChip = (metodo: string) => {
    const chipColors: Record<string, { bg: string; color: string }> = {
      'Efectivo': { bg: 'rgba(16, 185, 129, 0.1)', color: '#059669' },
      'Transferencia Financiera': { bg: 'rgba(245, 158, 11, 0.1)', color: '#D97706' },
      'Transferencia a Cero': { bg: 'rgba(245, 158, 11, 0.1)', color: '#D97706' },
      'Transferencia Bancaria': { bg: 'rgba(139, 92, 246, 0.1)', color: '#7C3AED' },
    };
    const style = chipColors[metodo] || { bg: 'rgba(107, 114, 128, 0.1)', color: '#6B7280' };
    return <Chip label={metodo} size="small" sx={{ bgcolor: style.bg, color: style.color, fontWeight: 600, fontSize: '11px' }} />;
  };

  const ventasColumns: ColumnDef<IVentaReciente>[] = [
    {
      accessorKey: 'cliente',
      header: 'Cliente',
      meta: {
        filterVariant: TableFilterType.Text,
        filterAccessorKey: 'cliente',
        filterProps: { placeholder: 'Buscar...' }
      }
    },
    { accessorKey: 'producto', header: 'Producto' },
    { accessorKey: 'cantidad', header: 'Cant.', meta: { align: 'center' as const } },
    {
      accessorKey: 'total',
      header: 'Total',
      cell: ({ getValue }) => (
        <Typography sx={{ color: colors.primary, fontWeight: 600, fontSize: '13px' }}>
          {formatCurrency(getValue() as number)}
        </Typography>
      ),
    },
    {
      accessorKey: 'metodoPago',
      header: 'Método',
      meta: {
        filterVariant: TableFilterType.Select,
        filterAccessorKey: 'metodoPago',
        filterProps: { options: metodoPagoOptions }
      },
      cell: ({ getValue }) => getMetodoPagoChip(getValue() as string),
    },
    { accessorKey: 'fecha', header: 'Fecha' },
  ];

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
    <>
      <Box>
        <Box sx={{ mb: { xs: 2, sm: 4 } }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: colors.textPrimary, fontSize: { xs: '20px', sm: '24px' }, mb: 0.5 }}>
            Dashboard {user && `- Bienvenido ${user.nombre}`}
          </Typography>
          <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: { xs: '12px', sm: '14px' } }}>
            Resumen de actividad y estadísticas del día
          </Typography>
        </Box>

        <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 3, sm: 4 } }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard title="Ventas Hoy" value={stats.ventasHoy} icon="fa-solid fa-cart-shopping" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard title="Ingresos del Mes" value={formatCurrency(stats.ingresosMes)} icon="fa-solid fa-dollar-sign" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard title="Ganancias Brutas" value={formatCurrency(stats.gananciasBrutas)} icon="fa-solid fa-chart-line" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard title="Productos Vendidos" value={stats.productosVendidos} icon="fa-solid fa-box" subtitle="Este mes" />
          </Grid>
        </Grid>

        <Box sx={{ mb: { xs: 3, sm: 4 } }}>
          <TableClientSide title="Ventas Recientes" data={ventas} columns={ventasColumns} showFilters={true} />
        </Box>
      </Box>
    </>
  );
}
