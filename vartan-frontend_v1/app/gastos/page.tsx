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
import { colors, chipColors } from '@/src/theme/colors';
import { gastoService } from '@services/gasto.service';
import { IGasto } from '@models/entities/gastoEntity';
import { useMounted } from '@hooks/useMounted';
import { gastosConfig } from '@/src/config/layoutConfig';

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

const transformGasto = (gasto: IGasto): IGastoDisplay => ({
  id: gasto.id,
  fecha: new Date(gasto.fecha).toLocaleDateString('es-AR'),
  concepto: gasto.descripcion,
  categoria: gasto.categoria,
  monto: gasto.monto,
  metodoPago: gasto.metodo_pago || 'N/A',
  observaciones: gasto.notas || '',
});

const calcularStatsLocales = (gastosData: IGasto[]): IGastosStats => {
  const total = gastosData.reduce((acc, g) => acc + g.monto, 0);
  const cantidad = gastosData.length;
  const promedio = cantidad > 0 ? total / cantidad : 0;
  const categorias = gastosData.reduce((acc, g) => {
    acc[g.categoria] = (acc[g.categoria] || 0) + g.monto;
    return acc;
  }, {} as Record<string, number>);
  const categoriaTop = Object.keys(categorias).length > 0
    ? Object.entries(categorias).reduce((a, b) => (a[1] > b[1] ? a : b))[0]
    : 'Sin datos';
  return { totalGastos: total, cantidadGastos: cantidad, gastoPromedio: promedio, categoriaTop };
};

const getChipStyle = (key: string, type: 'categoria' | 'metodoPago') => {
  const normalizedKey = key.toLowerCase().replace('í', 'i').replace('á', 'a');
  const styleMap: Record<string, keyof typeof chipColors> = {
    proveedor: 'proveedor',
    alquiler: 'alquiler',
    mercaderia: 'mercaderia',
    servicios: 'servicios',
    otros: 'otros',
    efectivo: 'efectivo',
    transferencia: 'transferencia',
    tarjeta: 'tarjeta',
  };
  return chipColors[styleMap[normalizedKey] || 'default'];
};

const formatCurrency = (value: number) => `$${value.toLocaleString('es-AR')}`;

export default function GastosPage() {
  const mounted = useMounted();
  const [gastos, setGastos] = useState<IGastoDisplay[]>([]);
  const [allGastos, setAllGastos] = useState<IGastoDisplay[]>([]);
  const [stats, setStats] = useState<IGastosStats>({ totalGastos: 0, cantidadGastos: 0, gastoPromedio: 0, categoriaTop: 'Sin datos' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('gastos');

  const tabs = gastosConfig.tabs.map((tab) => ({
    ...tab,
    count: tab.id === 'gastos' ? allGastos.length : 0,
  }));

  const fetchGastos = useCallback(async () => {
    if (!mounted) return;
    setLoading(true);
    setError(null);
    try {
      const response = await gastoService.getAll();
      const transformed = response.gastos.map(transformGasto);
      setAllGastos(transformed);
      setGastos(transformed);
      try {
        const resumen = await gastoService.getResumen();
        const total = response.gastos.reduce((acc, g) => acc + g.monto, 0);
        const cantidad = response.gastos.length;
        const promedio = cantidad > 0 ? total / cantidad : 0;
        const categoriaTop = resumen.length > 0 ? resumen.reduce((a, b) => (a.total > b.total ? a : b)).categoria : 'Sin datos';
        setStats({ totalGastos: total, cantidadGastos: cantidad, gastoPromedio: promedio, categoriaTop });
      } catch {
        setStats(calcularStatsLocales(response.gastos));
      }
    } catch (err) {
      setError(err instanceof Error && err.message.includes('Network') ? 'No se puede conectar al servidor' : 'Error al cargar los gastos');
    } finally {
      setLoading(false);
    }
  }, [mounted]);

  useEffect(() => {
    if (mounted) fetchGastos();
  }, [mounted, fetchGastos]);

  useEffect(() => {
    setGastos(activeTab === 'gastos' ? allGastos : []);
  }, [activeTab, allGastos]);

  if (!mounted) return null;

  const columns: ColumnDef<IGastoDisplay>[] = [
    {
      accessorKey: 'id',
      header: 'N° Gasto',
      cell: ({ getValue }) => <Typography sx={{ fontWeight: 600, fontSize: 13 }}>#{getValue() as number}</Typography>,
    },
    { accessorKey: 'fecha', header: 'Fecha' },
    {
      accessorKey: 'concepto',
      header: 'Concepto',
      meta: { filterVariant: TableFilterType.Text, filterAccessorKey: 'concepto', filterProps: { placeholder: 'Buscar concepto...' } },
    },
    {
      accessorKey: 'categoria',
      header: 'Categoría',
      meta: { filterVariant: TableFilterType.Select, filterAccessorKey: 'categoria', filterProps: { options: gastosConfig.categorias } },
      cell: ({ getValue }) => {
        const val = getValue() as string;
        const style = getChipStyle(val, 'categoria');
        return <Chip label={val} size="small" sx={{ bgcolor: style.bg, color: style.color, fontWeight: 600, fontSize: 11 }} />;
      },
    },
    {
      accessorKey: 'monto',
      header: 'Monto',
      cell: ({ getValue }) => <Typography sx={{ color: colors.error, fontWeight: 600, fontSize: 13 }}>-{formatCurrency(getValue() as number)}</Typography>,
    },
    {
      accessorKey: 'metodoPago',
      header: 'Método Pago',
      meta: { filterVariant: TableFilterType.Select, filterAccessorKey: 'metodoPago', filterProps: { options: gastosConfig.metodosPago } },
      cell: ({ getValue }) => {
        const val = getValue() as string;
        const style = getChipStyle(val, 'metodoPago');
        return <Chip label={val} size="small" sx={{ bgcolor: style.bg, color: style.color, fontWeight: 600, fontSize: 11 }} />;
      },
    },
    {
      accessorKey: 'observaciones',
      header: 'Observaciones',
      cell: ({ getValue }) => <Typography sx={{ color: colors.textSecondary, fontSize: 13 }}>{(getValue() as string) || '-'}</Typography>,
    },
  ];

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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: colors.textPrimary, fontSize: 24, mb: 0.5 }}>Gastos</Typography>
          <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: 14 }}>Gestiona los gastos de tu negocio</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <OutlineButton icon="fa-solid fa-rotate">Nuevo Recurrente</OutlineButton>
          <PrimaryButton icon="fa-solid fa-plus">Nuevo Gasto</PrimaryButton>
        </Box>
      </Box>

      <StatusTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

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
  );
}

