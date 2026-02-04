'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Box, Typography, Chip, CircularProgress, Grid } from '@mui/material';
import { ColumnDef } from '@tanstack/react-table';
import TableClientSide from '@components/Tables/TableClientSide';
import StatCard from '@components/Cards/StatCard';
import PrimaryButton from '@components/Buttons/PrimaryButton';
import { TableFilterType } from '@components/Tables/Filters/TableFilterType';
import { colors } from '@/src/theme/colors';
import { productoService } from '@services/producto.service';
import { IProducto } from '@models/entities/productoEntity';
import { useAuthStore } from '@libraries/store';
import { useMounted } from '@hooks/useMounted';

interface IProductoDisplay {
  id: number;
  nombre: string;
  costoUnitario: number;
  activo: boolean;
  fechaCreacion: string;
}

interface IProductosStats {
  totalProductos: number;
  productosActivos: number;
}

export default function ProductosPage() {
  const mounted = useMounted();
  const [productos, setProductos] = useState<IProductoDisplay[]>([]);
  const [stats, setStats] = useState<IProductosStats>({
    totalProductos: 0,
    productosActivos: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  const transformProducto = (producto: IProducto): IProductoDisplay => ({
    id: producto.id,
    nombre: producto.nombre,
    costoUnitario: producto.costo_unitario,
    activo: producto.activo,
    fechaCreacion: new Date(producto.fecha_creacion).toLocaleDateString('es-AR'),
  });

  const calcularStats = (productosData: IProducto[]): IProductosStats => ({
    totalProductos: productosData.length,
    productosActivos: productosData.filter(p => p.activo).length,
  });

  const fetchProductos = useCallback(async () => {
    if (!mounted) return;

    setLoading(true);
    setError(null);
    try {
      const productosData = await productoService.getAll();
      setProductos(productosData.map(transformProducto));
      setStats(calcularStats(productosData));
    } catch (err: unknown) {
      console.error('Error fetching productos:', err);
      const errorMessage = err instanceof Error && err.message.includes('Network')
        ? 'No se puede conectar al servidor'
        : 'Error al cargar los productos';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [mounted]);

  useEffect(() => {
    if (mounted) {
      fetchProductos();
    }
  }, [mounted, fetchProductos]);

  if (!mounted) return null;

  const handleEdit = (row: IProductoDisplay) => {
    console.log('Editar producto:', row);
  };

  const handleDelete = async (row: IProductoDisplay) => {
    try {
      await productoService.delete(row.id);
      fetchProductos();
    } catch (err) {
      console.error('Error eliminando producto:', err);
    }
  };

  const formatCurrency = (value: number) => '$' + value.toLocaleString('es-AR');

  const getEstadoChip = (activo: boolean) => {
    if (activo) {
      return <Chip label="Activo" size="small" sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#059669', fontWeight: 600, fontSize: '11px' }} />;
    }
    return <Chip label="Inactivo" size="small" sx={{ bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#DC2626', fontWeight: 600, fontSize: '11px' }} />;
  };

  const columns: ColumnDef<IProductoDisplay>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ getValue }) => (
        <Typography sx={{ fontWeight: 600, fontSize: '13px' }}>#{getValue() as number}</Typography>
      )
    },
    {
      accessorKey: 'nombre',
      header: 'Producto',
      meta: {
        filterVariant: TableFilterType.Text,
        filterAccessorKey: 'nombre',
        filterProps: { placeholder: 'Buscar producto...' }
      }
    },
    {
      accessorKey: 'costoUnitario',
      header: 'Costo Unitario',
      cell: ({ getValue }) => (
        <Typography sx={{ color: colors.primary, fontWeight: 600, fontSize: '13px' }}>
          {formatCurrency(getValue() as number)}
        </Typography>
      ),
    },
    {
      accessorKey: 'activo',
      header: 'Estado',
      cell: ({ getValue }) => getEstadoChip(getValue() as boolean),
    },
    { accessorKey: 'fechaCreacion', header: 'Fecha Creación' },
  ];

  const headerActions = user?.rol === 'dueño' ? (
    <PrimaryButton icon="fa-solid fa-plus" onClick={() => console.log('Nuevo Producto')}>
      Nuevo Producto
    </PrimaryButton>
  ) : null;

  const actions = user?.rol === 'dueño' ? [
    {
      icon: 'fa-solid fa-pen',
      color: '#6B7280',
      onClick: handleEdit,
      tooltip: 'Editar'
    },
    {
      icon: 'fa-solid fa-trash',
      color: '#DC2626',
      onClick: handleDelete,
      tooltip: 'Eliminar'
    }
  ] : [];

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
            Productos
          </Typography>
          <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '14px' }}>
            Catálogo de productos disponibles
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard title="Total Productos" value={stats.totalProductos} icon="fa-solid fa-box" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard title="Productos Activos" value={stats.productosActivos} icon="fa-solid fa-check-circle" />
          </Grid>
        </Grid>

        {/* Tabla con filtros */}
        <TableClientSide
          title="Lista de Productos"
          data={productos}
          columns={columns}
          headerActions={headerActions}
          actions={actions}
        />
      </Box>
    </>
  );
}
