'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Box, Typography, Grid, CircularProgress } from '@mui/material';
import { ColumnDef } from '@tanstack/react-table';
import TableClientSide from '@components/Tables/TableClientSide';
import StatCard from '@components/Cards/StatCard';
import { colors } from '@/src/theme/colors';
import { comisionService } from '@services/comision.service';
import { IComision } from '@models/entities/comisionentity';
import { useAuthStore } from '@libraries/store';
import { useMounted } from '@hooks/useMounted';

interface IComisionDisplay {
  id: number;
  nombre: string;
  mes: string;
  ventas: number;
  comision: number;
}

interface IComisionesStats {
  totalComisiones: number;
  totalVentas: number;
  empleados: number;
  promedioComision: number;
}

const mesesNombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function ComisionesPage() {
  const mounted = useMounted();
  const [comisiones, setComisiones] = useState<IComisionDisplay[]>([]);
  const [stats, setStats] = useState<IComisionesStats>({
    totalComisiones: 0,
    totalVentas: 0,
    empleados: 0,
    promedioComision: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  const transformComision = (comision: IComision): IComisionDisplay => ({
    id: comision.id,
    nombre: comision.usuario?.nombre || 'Empleado',
    mes: `${mesesNombres[comision.mes - 1]} ${comision.anio}`,
    ventas: comision.total_ventas,
    comision: comision.total_comision,
  });

  const calcularStats = (comisionesData: IComision[]): IComisionesStats => {
    const totalComisiones = comisionesData.reduce((acc, c) => acc + c.total_comision, 0);
    const totalVentas = comisionesData.reduce((acc, c) => acc + c.total_ventas, 0);
    const empleadosUnicos = new Set(comisionesData.map(c => c.usuario_id)).size;
    const promedio = comisionesData.length > 0 ? totalComisiones / comisionesData.length : 0;

    return {
      totalComisiones,
      totalVentas,
      empleados: empleadosUnicos,
      promedioComision: promedio,
    };
  };

  const fetchComisiones = useCallback(async () => {
    if (!mounted) return;

    setLoading(true);
    setError(null);
    try {
      const comisionesData = user?.rol === 'dueño'
        ? await comisionService.getAll()
        : await comisionService.getMisComisiones();

      setComisiones(comisionesData.map(transformComision));
      setStats(calcularStats(comisionesData));
    } catch (err: unknown) {
      console.error('Error fetching comisiones:', err);
      const errorMessage = err instanceof Error && err.message.includes('Network')
        ? 'No se puede conectar al servidor'
        : 'Error al cargar las comisiones';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [mounted, user?.rol]);

  useEffect(() => {
    if (mounted) {
      fetchComisiones();
    }
  }, [mounted, fetchComisiones]);

  if (!mounted) return null;

  const formatCurrency = (value: number) => '$' + value.toLocaleString('es-AR');

  const columns: ColumnDef<IComisionDisplay>[] = [
    { accessorKey: 'nombre', header: 'Empleado' },
    { accessorKey: 'mes', header: 'Período' },
    {
      accessorKey: 'ventas',
      header: 'Total Ventas',
      cell: ({ getValue }) => (
        <Typography sx={{ fontWeight: 500, fontSize: '13px' }}>
          {formatCurrency(getValue() as number)}
        </Typography>
      ),
    },
    {
      accessorKey: 'comision',
      header: 'Comisión',
      cell: ({ getValue }) => (
        <Typography sx={{ color: colors.primary, fontWeight: 700, fontSize: '13px' }}>
          {formatCurrency(getValue() as number)}
        </Typography>
      ),
    },
  ];

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
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1F2937', fontSize: '24px', mb: 0.5 }}>
            Comisiones
          </Typography>
          <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '14px' }}>
            Control de comisiones por empleado
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard title="Total Comisiones" value={formatCurrency(stats.totalComisiones)} icon="fa-solid fa-coins" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard title="Total Ventas" value={formatCurrency(stats.totalVentas)} icon="fa-solid fa-dollar-sign" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard title="Empleados" value={stats.empleados} icon="fa-solid fa-users" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard title="Promedio Comisión" value={formatCurrency(stats.promedioComision)} icon="fa-solid fa-chart-pie" />
          </Grid>
        </Grid>

        {/* Tabla */}
        <TableClientSide
          title="Historial de Comisiones"
          data={comisiones}
          columns={columns}
        />
      </Box>
    </>
  );
}
