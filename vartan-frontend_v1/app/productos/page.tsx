'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Box, Typography, Chip, CircularProgress, Grid, Stack } from '@mui/material';
import { ColumnDef } from '@tanstack/react-table';
import TableClientSide from '@components/Tables/TableClientSide';
import StatCard from '@components/Cards/StatCard';
import PrimaryButton from '@components/Buttons/PrimaryButton';
import OutlineButton from '@components/Buttons/OutlineButton';
import AgregarProductoModal from '@components/Modals/AgregarProductoModal';
import AgregarStockModal from '@components/Modals/AgregarStockModal';
import EditarProductoModal from '@components/Modals/EditarProductoModal';
import DetalleStockModal from '@components/Modals/DetalleStockModal';
import ConfirmDeleteModal from '@components/Modals/ConfirmDeleteModal';
import { TableFilterType } from '@components/Tables/Filters/TableFilterType';
import { colors } from '@/src/theme/colors';
import { productoService } from '@services/producto.service';
import { IProducto } from '@models/entities/productoEntity';
import { useAuthStore } from '@libraries/store';
import { useMounted } from '@hooks/useMounted';
import { useNotification } from '@components/Notifications';

interface IProductoDisplay {
  id: number;
  nombre: string;
  costoUnitario: number;
  activo: boolean;
  fechaCreacion: string;
  tallesDisponibles: string[];
  coloresDisponibles: string[];
  stockTotal: number;
  tipoProducto: string;
  equipo: string;
}

interface IProductosStats {
  totalProductos: number;
  productosActivos: number;
}

export default function ProductosPage() {
  const mounted = useMounted();
  const { addNotification } = useNotification();
  const [productos, setProductos] = useState<IProductoDisplay[]>([]);
  const [stats, setStats] = useState<IProductosStats>({
    totalProductos: 0,
    productosActivos: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agregarProductoModalOpen, setAgregarProductoModalOpen] = useState(false);
  const [agregarStockModalOpen, setAgregarStockModalOpen] = useState(false);
  const [editarProductoModalOpen, setEditarProductoModalOpen] = useState(false);
  const [detalleStockModalOpen, setDetalleStockModalOpen] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<IProducto | null>(null);
  const [productoDetalleStock, setProductoDetalleStock] = useState<IProducto | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [productoToDelete, setProductoToDelete] = useState<IProductoDisplay | null>(null);
  const { user } = useAuthStore();

  const transformProducto = (producto: IProducto): IProductoDisplay => ({
    id: producto.id,
    nombre: producto.nombre,
    costoUnitario: producto.costo_unitario,
    activo: producto.activo,
    fechaCreacion: new Date(producto.fecha_creacion).toLocaleDateString('es-AR'),
    tallesDisponibles: producto.talles_disponibles || [],
    coloresDisponibles: producto.colores_disponibles || [],
    stockTotal: producto.stock_total || 0,
    tipoProducto: producto.tipo_producto?.nombre || 'Sin tipo',
    equipo: producto.equipo?.nombre || 'Sin equipo',
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

  const handleEdit = async (row: IProductoDisplay) => {
    try {
      const producto = await productoService.getById(row.id);
      setProductoSeleccionado(producto);
      setEditarProductoModalOpen(true);
    } catch (err) {
      console.error('Error cargando producto para editar:', err);
      addNotification('Error al cargar el producto para editar', 'error');
    }
  };

  const handleDelete = (row: IProductoDisplay) => {
    setProductoToDelete(row);
    setConfirmDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!productoToDelete) return;

    try {
      await productoService.delete(productoToDelete.id);
      fetchProductos();
      addNotification('Producto eliminado exitosamente', 'success');
    } catch (err) {
      console.error('Error eliminando producto:', err);
      addNotification('Error al eliminar el producto', 'error');
    } finally {
      setProductoToDelete(null);
    }
  };

  const formatCurrency = (value: number) => '$' + value.toLocaleString('es-AR');

  const getEstadoChip = (activo: boolean) => {
    if (activo) {
      return <Chip label="Activo" size="small" sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#059669', fontWeight: 600, fontSize: '11px' }} />;
    }
    return <Chip label="Inactivo" size="small" sx={{ bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#DC2626', fontWeight: 600, fontSize: '11px' }} />;
  };

  const renderTallesChips = (talles: string[]) => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {talles.length > 0 ? (
        talles.map((talle, index) => (
          <Chip
            key={index}
            label={talle}
            size="small"
            sx={{
              bgcolor: 'rgba(59, 130, 246, 0.1)',
              color: '#1D4ED8',
              fontWeight: 500,
              fontSize: '11px',
              height: '20px'
            }}
          />
        ))
      ) : (
        <Typography variant="caption" sx={{ color: '#9CA3AF', fontStyle: 'italic' }}>
          Sin talles
        </Typography>
      )}
    </Box>
  );

  const renderColoresChips = (colores: string[]) => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {colores.length > 0 ? (
        colores.map((color, index) => (
          <Chip
            key={index}
            label={color}
            size="small"
            sx={{
              bgcolor: 'rgba(168, 85, 247, 0.1)',
              color: '#7C3AED',
              fontWeight: 500,
              fontSize: '11px',
              height: '20px'
            }}
          />
        ))
      ) : (
        <Typography variant="caption" sx={{ color: '#9CA3AF', fontStyle: 'italic' }}>
          Sin colores
        </Typography>
      )}
    </Box>
  );

  const renderStockTotal = (stock: number) => (
    <Box sx={{ textAlign: 'center' }}>
      <Typography
        sx={{
          fontWeight: 600,
          fontSize: '13px',
          color: stock > 0 ? '#059669' : '#DC2626',
          backgroundColor: stock > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          padding: '4px 8px',
          borderRadius: '6px',
          minWidth: '40px',
          display: 'inline-block'
        }}
      >
        {stock}
      </Typography>
    </Box>
  );

  const columns: ColumnDef<IProductoDisplay>[] = [
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
      accessorKey: 'tipoProducto',
      header: 'Tipo',
      cell: ({ getValue }) => {
        const tipo = getValue() as string;
        return tipo === 'Sin tipo' ? (
          <Typography variant="caption" sx={{ color: '#9CA3AF', fontStyle: 'italic' }}>
            Sin tipo
          </Typography>
        ) : (
          <Chip
            label={tipo}
            size="small"
            sx={{
              bgcolor: 'rgba(34, 197, 94, 0.1)',
              color: '#16A34A',
              fontWeight: 500,
              fontSize: '11px',
              height: '20px'
            }}
          />
        );
      }
    },
    {
      accessorKey: 'equipo',
      header: 'Equipo',
      cell: ({ getValue }) => {
        const equipo = getValue() as string;
        return equipo === 'Sin equipo' ? (
          <Typography variant="caption" sx={{ color: '#9CA3AF', fontStyle: 'italic' }}>
            Sin equipo
          </Typography>
        ) : (
          <Chip
            label={equipo}
            size="small"
            sx={{
              bgcolor: 'rgba(239, 68, 68, 0.1)',
              color: '#DC2626',
              fontWeight: 500,
              fontSize: '11px',
              height: '20px'
            }}
          />
        );
      }
    },
    {
      accessorKey: 'costoUnitario',
      header: 'Costo',
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
    {
      accessorKey: 'tallesDisponibles',
      header: 'Talles',
      cell: ({ getValue }) => renderTallesChips(getValue() as string[]),
    },
    {
      accessorKey: 'coloresDisponibles',
      header: 'Colores',
      cell: ({ getValue }) => renderColoresChips(getValue() as string[]),
    },
    {
      accessorKey: 'stockTotal',
      header: 'Stock',
      cell: ({ getValue }) => renderStockTotal(getValue() as number),
    },
    {
      accessorKey: 'fechaCreacion',
      header: 'Fecha',
    },
  ];

  const headerActions = user?.rol === 'dueño' ? (
    <Stack direction="row" spacing={2}>
      <OutlineButton
        icon="fa-solid fa-boxes-stacked"
        onClick={() => setAgregarStockModalOpen(true)}
        sx={{
          borderColor: colors.primary,
          color: colors.primary,
          '&:hover': {
            borderColor: colors.primaryDark,
            backgroundColor: colors.primaryHover
          }
        }}
      >
         Stock
      </OutlineButton>
      <PrimaryButton
        icon="fa-solid fa-tag"
        onClick={() => setAgregarProductoModalOpen(true)}
      >
         Producto
      </PrimaryButton>
    </Stack>
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
    },
    {
      icon: 'fa-solid fa-eye',
      color: '#2563EB',
      onClick: async (row: IProductoDisplay) => {
        try {
          const producto = await productoService.getById(row.id);
          setProductoDetalleStock(producto);
          setDetalleStockModalOpen(true);
        } catch (err) {
          console.error('Error cargando producto para detalle:', err);
          addNotification('Error al cargar el detalle del producto', 'error');
        }
      },
      tooltip: 'Ver Detalle de Stock'
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

      {/* Modales */}
      <AgregarProductoModal
        open={agregarProductoModalOpen}
        onClose={() => setAgregarProductoModalOpen(false)}
        onSuccess={() => {
          fetchProductos();
          setAgregarProductoModalOpen(false);
          addNotification('Producto creado exitosamente', 'success');
        }}
      />

      <AgregarStockModal
        open={agregarStockModalOpen}
        onClose={() => setAgregarStockModalOpen(false)}
        onSuccess={() => {
          fetchProductos(); // Refrescar la tabla
          setAgregarStockModalOpen(false);
          addNotification('Stock agregado exitosamente', 'success');
        }}
      />

      <EditarProductoModal
        open={editarProductoModalOpen}
        onClose={() => setEditarProductoModalOpen(false)}
        onSuccess={() => {
          fetchProductos();
          setEditarProductoModalOpen(false);
          addNotification('Producto actualizado exitosamente', 'success');
        }}
        producto={productoSeleccionado}
      />

      <DetalleStockModal
        open={detalleStockModalOpen}
        onClose={() => setDetalleStockModalOpen(false)}
        producto={productoDetalleStock}
      />

      {/* Modal de confirmación de eliminación */}
      <ConfirmDeleteModal
        open={confirmDeleteOpen}
        onClose={() => {
          setConfirmDeleteOpen(false);
          setProductoToDelete(null);
        }}
        onConfirm={confirmDelete}
        itemName={productoToDelete?.nombre}
      />
    </>
  );
}
