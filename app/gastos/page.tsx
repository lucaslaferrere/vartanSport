'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Box, Typography, Chip, Grid, CircularProgress } from '@mui/material';
import { ColumnDef } from '@tanstack/react-table';
import TableClientSide from '@components/Tables/TableClientSide';
import StatCard from '@components/Cards/StatCard';
import StatusTabs from '@components/Tabs/StatusTabs';
import PrimaryButton from '@components/Buttons/PrimaryButton';
import OutlineButton from '@components/Buttons/OutlineButton';
import { TableFilterType } from '@components/Tables/Filters/TableFilterType';
import { colors } from '@/src/theme/colors';
import { gastoService } from '@services/gasto.service';
import { IGasto, IGastoResumen } from '@models/entities/gastoEntity';
import { useMounted } from '@hooks/useMounted';

interface IGastoDisplay {
  id: number;
  fecha: string;
  concepto: string;
  categoria: string;
  monto: number;
  metodoPago: string;
  observaciones: string;
}

interface IGastosStats {
  totalGastos: number;
  cantidadGastos: number;
  gastoPromedio: number;
  categoriaTop: string;
}

const categoriaOptions = [
  { value: 'Proveedor', label: 'Proveedor' },
  { value: 'Alquiler', label: 'Alquiler' },
  { value: 'Mercadería', label: 'Mercadería' },
  { value: 'Servicios', label: 'Servicios' },
  { value: 'Otros', label: 'Otros' },
];

const metodoPagoOptions = [
  { value: 'Efectivo', label: 'Efectivo' },
  { value: 'Transferencia', label: 'Transferencia' },
  { value: 'Tarjeta', label: 'Tarjeta' },
];

export default function GastosPage() {
  const mounted = useMounted();
  const [gastos, setGastos] = useState<IGastoDisplay[]>([]);
  const [allGastos, setAllGastos] = useState<IGastoDisplay[]>([]);
  const [stats, setStats] = useState<IGastosStats>({
    totalGastos: 0,
    cantidadGastos: 0,
    gastoPromedio: 0,
    categoriaTop: 'Sin datos',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('gastos');

  const tabs = [
    { id: 'gastos', label: 'Gastos', count: allGastos.length, color: 'default' as const },
    { id: 'recurrentes', label: 'Gastos Recurrentes', count: 0, color: 'warning' as const },
    { id: 'pendientes', label: 'Pendientes', count: 0, color: 'error' as const },
  ];

  const transformGasto = (gasto: IGasto): IGastoDisplay => ({
    id: gasto.id,
    fecha: new Date(gasto.fecha).toLocaleDateString('es-AR'),
    concepto: gasto.descripcion,
    categoria: gasto.categoria,
    monto: gasto.monto,
    metodoPago: gasto.metodo_pago || 'N/A',
    observaciones: gasto.notas || '',
  });

  const calcularStats = (gastosData: IGasto[], resumen: IGastoResumen[]): IGastosStats => {
    const total = gastosData.reduce((acc, g) => acc + g.monto, 0);
    const cantidad = gastosData.length;
    const promedio = cantidad > 0 ? total / cantidad : 0;
    const categoriaTop = resumen.length > 0
      ? resumen.reduce((a, b) => a.total > b.total ? a : b).categoria
      : 'Sin datos';

    return { totalGastos: total, cantidadGastos: cantidad, gastoPromedio: promedio, categoriaTop };
  };

  const fetchGastos = useCallback(async () => {
    if (!mounted) return;

    setLoading(true);
    setError(null);
    try {
      const [gastosResponse, resumenResponse] = await Promise.all([
        gastoService.getAll(),
        gastoService.getResumen(),
      ]);

      const transformed = gastosResponse.gastos.map(transformGasto);
      setAllGastos(transformed);
      setGastos(transformed);
      setStats(calcularStats(gastosResponse.gastos, resumenResponse));
    } catch (err: unknown) {
      console.error('Error fetching gastos:', err);
      const errorMessage = err instanceof Error && err.message.includes('Network')
        ? 'No se puede conectar al servidor'
        : 'Error al cargar los gastos';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [mounted]);

  useEffect(() => {
    if (mounted) {
      fetchGastos();
    }
  }, [mounted, fetchGastos]);

  if (!mounted) return null;

  useEffect(() => {
    if (activeTab === 'gastos') {
      setGastos(allGastos);
    } else {
      setGastos([]);
    }
  }, [activeTab, allGastos]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  const getCategoriaChip = (categoria: string) => {
    const categoriaColors: Record<string, { bg: string; color: string }> = {
      'Proveedor': { bg: 'rgba(245, 158, 11, 0.1)', color: '#D97706' },
      'Alquiler': { bg: 'rgba(139, 92, 246, 0.1)', color: '#7C3AED' },
      'Mercadería': { bg: 'rgba(59, 130, 246, 0.1)', color: '#2563EB' },
      'Servicios': { bg: 'rgba(16, 185, 129, 0.1)', color: '#059669' },
      'Otros': { bg: 'rgba(107, 114, 128, 0.1)', color: '#4B5563' },
    };
    const style = categoriaColors[categoria] || { bg: 'rgba(107, 114, 128, 0.1)', color: '#4B5563' };
    return <Chip label={categoria} size="small" sx={{ bgcolor: style.bg, color: style.color, fontWeight: 600, fontSize: '11px' }} />;
  };

  const getMetodoPagoChip = (metodo: string) => {
    const metodoPagoColors: Record<string, { bg: string; color: string }> = {
      'Efectivo': { bg: 'rgba(16, 185, 129, 0.1)', color: '#059669' },
      'Transferencia': { bg: 'rgba(245, 158, 11, 0.1)', color: '#D97706' },
      'Tarjeta': { bg: 'rgba(139, 92, 246, 0.1)', color: '#7C3AED' },
    };
    const style = metodoPagoColors[metodo] || { bg: 'rgba(107, 114, 128, 0.1)', color: '#4B5563' };
    return <Chip label={metodo} size="small" sx={{ bgcolor: style.bg, color: style.color, fontWeight: 600, fontSize: '11px' }} />;
  };

  const columns: ColumnDef<IGastoDisplay>[] = [
    {
      accessorKey: 'id',
      header: 'N° Gasto',
      cell: ({ getValue }) => (
        <Typography sx={{ fontWeight: 600, fontSize: '13px' }}>#{getValue() as number}</Typography>
      )
    },
    { accessorKey: 'fecha', header: 'Fecha' },
    {
      accessorKey: 'concepto',
      header: 'Concepto',
      meta: {
        filterVariant: TableFilterType.Text,
        filterAccessorKey: 'concepto',
        filterProps: { placeholder: 'Buscar concepto...' }
      }
    },
    {
      accessorKey: 'categoria',
      header: 'Categoría',
      meta: {
        filterVariant: TableFilterType.Select,
        filterAccessorKey: 'categoria',
        filterProps: { options: categoriaOptions }
      },
      cell: ({ getValue }) => getCategoriaChip(getValue() as string),
    },
    {
      accessorKey: 'monto',
      header: 'Monto',
      cell: ({ getValue }) => (
        <Typography sx={{ color: '#DC2626', fontWeight: 600, fontSize: '13px' }}>
          -${(getValue() as number).toLocaleString('es-AR')}
        </Typography>
      ),
    },
    {
      accessorKey: 'metodoPago',
      header: 'Método Pago',
      meta: {
        filterVariant: TableFilterType.Select,
        filterAccessorKey: 'metodoPago',
        filterProps: { options: metodoPagoOptions }
      },
      cell: ({ getValue }) => getMetodoPagoChip(getValue() as string),
    },
    {
      accessorKey: 'observaciones',
      header: 'Observaciones',
      cell: ({ getValue }) => (
        <Typography sx={{ color: '#6B7280', fontSize: '13px' }}>
          {(getValue() as string) || '-'}
        </Typography>
      ),
    },
  ];

  const formatCurrency = (value: number) => '$' + value.toLocaleString('es-AR');

  const headerActions = (
    <Box sx={{ display: 'flex', gap: 2 }}>
      <OutlineButton icon="fa-solid fa-rotate" onClick={() => console.log('Nuevo Recurrente')}>
        Nuevo Recurrente
      </OutlineButton>
      <PrimaryButton icon="fa-solid fa-plus" onClick={() => console.log('Nuevo Gasto')}>
        Nuevo Gasto
      </PrimaryButton>
    </Box>
  );

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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1F2937', fontSize: '24px', mb: 0.5 }}>
              Gastos
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '14px' }}>
              Gestiona los gastos de tu negocio
            </Typography>
          </Box>
          {headerActions}
        </Box>

        <StatusTabs tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard title="Total Gastos" value={formatCurrency(stats.totalGastos)} icon="fa-solid fa-arrow-trend-down" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard title="Cantidad de Gastos" value={stats.cantidadGastos} icon="fa-solid fa-receipt" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard title="Gasto Promedio" value={formatCurrency(stats.gastoPromedio)} icon="fa-solid fa-calculator" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard title="Categoría Top" value={stats.categoriaTop} icon="fa-solid fa-tag" />
          </Grid>
        </Grid>

        <TableClientSide title="Registro de Gastos" data={gastos} columns={columns} />
      </Box>
    </>
  );
}
