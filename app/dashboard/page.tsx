'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Chip } from '@mui/material';
import { ColumnDef } from '@tanstack/react-table';
import StatCard from '@components/Cards/StatCard';
import TableClientSide from '@components/Tables/TableClientSide';
import { TableFilterType } from '@components/Tables/Filters/TableFilterType';
import { colors } from '@/src/theme/colors';
import { useAuthStore } from '@libraries/store';

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
}

const metodoPagoOptions = [
  { value: 'Efectivo', label: 'Efectivo' },
  { value: 'Transferencia Bancaria', label: 'Transferencia Bancaria' },
  { value: 'Transferencia Financiera', label: 'Transferencia Financiera' },
];

// Datos mock
const mockVentas: IVentaReciente[] = [
  { id: 1, cliente: 'Juan Pérez', producto: 'Remera Nike Dri-Fit', cantidad: 2, total: 45000, metodoPago: 'Efectivo', fecha: '03/02/2026' },
  { id: 2, cliente: 'María González', producto: 'Campera Adidas', cantidad: 1, total: 89000, metodoPago: 'Transferencia Bancaria', fecha: '03/02/2026' },
  { id: 3, cliente: 'Carlos Rodríguez', producto: 'Zapatillas Puma', cantidad: 1, total: 125000, metodoPago: 'Efectivo', fecha: '02/02/2026' },
  { id: 4, cliente: 'Ana Martínez', producto: 'Short Running', cantidad: 3, total: 36000, metodoPago: 'Transferencia Financiera', fecha: '02/02/2026' },
  { id: 5, cliente: 'Luis Fernández', producto: 'Medias Pack x3', cantidad: 2, total: 18000, metodoPago: 'Efectivo', fecha: '01/02/2026' },
];

const mockStats: IDashboardStats = {
  ventasHoy: 15,
  ingresosMes: 2450000,
  gananciasBrutas: 1850000,
  productosVendidos: 234,
};

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    setMounted(true);
  }, []);

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

  return (
      <>
        <Box>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: colors.textPrimary, fontSize: '24px', mb: 0.5 }}>
              Dashboard {user && `- Bienvenido ${user.nombre}`}
            </Typography>
            <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: '14px' }}>
              Resumen de actividad y estadísticas del día
            </Typography>
          </Box>

          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard title="Ventas Hoy" value={mockStats.ventasHoy} icon="fa-solid fa-cart-shopping" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard title="Ingresos del Mes" value={formatCurrency(mockStats.ingresosMes)} icon="fa-solid fa-dollar-sign" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard title="Ganancias Brutas" value={formatCurrency(mockStats.gananciasBrutas)} icon="fa-solid fa-chart-line" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard title="Productos Vendidos" value={mockStats.productosVendidos} icon="fa-solid fa-box" subtitle="Este mes" />
            </Grid>
          </Grid>

          <Box sx={{ mb: 4 }}>
            <TableClientSide title="Ventas Recientes" data={mockVentas} columns={ventasColumns} showFilters={true} />
          </Box>
        </Box>
      </>
  );
}
