'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Box, Typography, Chip, Grid, CircularProgress } from '@mui/material';
import { ColumnDef } from '@tanstack/react-table';
import TableClientSide from '@components/Tables/TableClientSide';
import StatCard from '@components/Cards/StatCard';
import PrimaryButton from '@components/Buttons/PrimaryButton';
import AgregarVentaModal from '@components/Modals/AgregarVentaModal';
import DetalleVentaModal from '@components/Modals/DetalleVentaModal';
import EditarVentaModal from '@components/Modals/EditarVentaModal';
import ConfirmModal from '@components/Modals/ConfirmModal';
import { TableFilterType } from '@components/Tables/Filters/TableFilterType';
import { colors } from '@/src/theme/colors';
import { ventaService } from '@services/venta.service';
import { IVenta } from '@models/entities/ventaEntity';
import { useAuthStore } from '@libraries/store';
import { useMounted } from '@hooks/useMounted';
import { useNotification } from '@components/Notifications';

interface IVentaDisplay {
  id: number;
  fecha: string;
  cliente: string;
  producto: string;
  cantidad: number;
  metodoPago: string;
  total: number;
  vendedor: string;
}

interface IVentasStats {
  ventasHoy: number;
  totalHoy: number;
  ventasMes: number;
  totalMes: number;
}

const metodoPagoOptions = [
  { value: 'Efectivo', label: 'Efectivo' },
  { value: 'Transferencia Financiera', label: 'Transferencia Financiera' },
  { value: 'Transferencia a Cero', label: 'Transferencia a Cero' },
  { value: 'Transferencia Bancaria', label: 'Transferencia Bancaria' },
];

export default function VentasPage() {
  const mounted = useMounted();
  const { addNotification } = useNotification();
  const [ventas, setVentas] = useState<IVentaDisplay[]>([]);
  const [stats, setStats] = useState<IVentasStats>({
    ventasHoy: 0,
    totalHoy: 0,
    ventasMes: 0,
    totalMes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agregarVentaModalOpen, setAgregarVentaModalOpen] = useState(false);
  const [detalleVentaModalOpen, setDetalleVentaModalOpen] = useState(false);
  const [editarVentaModalOpen, setEditarVentaModalOpen] = useState(false);
  const [eliminarVentaModalOpen, setEliminarVentaModalOpen] = useState(false);
  const [ventaSeleccionada, setVentaSeleccionada] = useState<IVenta | null>(null);
  const { user } = useAuthStore();

  const transformVenta = (venta: IVenta): IVentaDisplay => {
    const primerDetalle = venta.detalles?.[0];
    const cantidadTotal = venta.detalles?.reduce((acc, d) => acc + d.cantidad, 0) || 0;

    return {
      id: venta.id,
      fecha: new Date(venta.fecha_venta).toLocaleDateString('es-AR'),
      cliente: venta.cliente?.nombre || 'Cliente desconocido',
      producto: primerDetalle?.producto?.nombre || 'Varios productos',
      cantidad: cantidadTotal,
      metodoPago: venta.forma_pago?.nombre || 'N/A',
      total: venta.total_final,
      vendedor: venta.usuario?.nombre || 'N/A',
    };
  };

  const calcularStats = (ventasData: IVenta[]): IVentasStats => {
    const hoy = new Date().toDateString();
    const mesActual = new Date().getMonth();
    const anioActual = new Date().getFullYear();

    const ventasHoyData = ventasData.filter(v =>
      new Date(v.fecha_venta).toDateString() === hoy
    );

    const ventasMesData = ventasData.filter(v => {
      const fecha = new Date(v.fecha_venta);
      return fecha.getMonth() === mesActual && fecha.getFullYear() === anioActual;
    });

    return {
      ventasHoy: ventasHoyData.length,
      totalHoy: ventasHoyData.reduce((acc, v) => acc + v.total_final, 0),
      ventasMes: ventasMesData.length,
      totalMes: ventasMesData.reduce((acc, v) => acc + v.total_final, 0),
    };
  };

  const fetchVentas = useCallback(async () => {
    if (!mounted) return;

    setLoading(true);
    setError(null);
    try {
      const ventasData = user?.rol === 'dueño'
        ? await ventaService.getAll()
        : await ventaService.getMisVentas();

      setVentas(ventasData.map(transformVenta));
      setStats(calcularStats(ventasData));
    } catch (err: unknown) {
      console.error('Error fetching ventas:', err);
      const errorMessage = err instanceof Error && err.message.includes('Network')
        ? 'No se puede conectar al servidor'
        : 'Error al cargar las ventas';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [mounted, user?.rol]);

  useEffect(() => {
    if (mounted) {
      fetchVentas();
    }
  }, [mounted, fetchVentas]);

  if (!mounted) return null;

  const getMetodoPagoChip = (metodo: string) => {
    const chipColors: Record<string, { bg: string; color: string }> = {
      'Efectivo': { bg: 'rgba(16, 185, 129, 0.1)', color: '#059669' },
      'Transferencia Financiera': { bg: 'rgba(245, 158, 11, 0.1)', color: '#D97706' },
      'Transferencia a Cero': { bg: 'rgba(59, 130, 246, 0.1)', color: '#2563EB' },
      'Transferencia Bancaria': { bg: 'rgba(139, 92, 246, 0.1)', color: '#7C3AED' },
    };
    const style = chipColors[metodo] || { bg: 'rgba(107, 114, 128, 0.1)', color: '#6B7280' };
    return <Chip label={metodo} size="small" sx={{ bgcolor: style.bg, color: style.color, fontWeight: 600, fontSize: '11px' }} />;
  };

  const columns: ColumnDef<IVentaDisplay>[] = [
    { accessorKey: 'fecha', header: 'Fecha' },
    {
      accessorKey: 'cliente',
      header: 'Cliente',
      meta: {
        filterVariant: TableFilterType.Text,
        filterAccessorKey: 'cliente',
        filterProps: { placeholder: 'Buscar cliente...' }
      }
    },
    {
      accessorKey: 'producto',
      header: 'Producto',
      meta: {
        filterVariant: TableFilterType.Text,
        filterAccessorKey: 'producto',
        filterProps: { placeholder: 'Buscar producto...' }
      }
    },
    {
      accessorKey: 'cantidad',
      header: 'Cant.',
      meta: { align: 'center' as const }
    },
    {
      accessorKey: 'metodoPago',
      header: 'Método de Pago',
      meta: {
        filterVariant: TableFilterType.Select,
        filterAccessorKey: 'metodoPago',
        filterProps: { options: metodoPagoOptions }
      },
      cell: ({ getValue }) => getMetodoPagoChip(getValue() as string),
    },
    {
      accessorKey: 'total',
      header: 'Total',
      cell: ({ getValue }) => (
        <Typography sx={{ color: colors.primary, fontWeight: 600, fontSize: '13px' }}>
          ${(getValue() as number).toLocaleString('es-AR')}
        </Typography>
      ),
    },
    { accessorKey: 'vendedor', header: 'Vendedor' },
  ];

  const handleVerDetalle = async (row: IVentaDisplay) => {
    try {
      const todasLasVentas = user?.rol === 'dueño'
        ? await ventaService.getAll()
        : await ventaService.getMisVentas();

      const venta = todasLasVentas.find((v: IVenta) => v.id === row.id);
      setVentaSeleccionada(venta || null);
      setDetalleVentaModalOpen(true);
    } catch (err) {
      console.error('Error cargando detalle de venta:', err);
      addNotification('Error al cargar el detalle', 'error');
    }
  };

  const handleEliminar = async (row: IVentaDisplay): Promise<void> => {
    try {
      const todasLasVentas = user?.rol === 'dueño'
        ? await ventaService.getAll()
        : await ventaService.getMisVentas();

      const venta = todasLasVentas.find((v: IVenta) => v.id === row.id) || null;
      setVentaSeleccionada(venta);
      setEliminarVentaModalOpen(true);
    } catch (err) {
      console.error('Error cargando venta para eliminar:', err);
      addNotification('Error al cargar la venta', 'error');
    }
  };

  const confirmEliminar = async () => {
    if (!ventaSeleccionada) return;
    try {
      // TODO: Implementar ventaService.delete(ventaSeleccionada.id)
      addNotification('Venta eliminada correctamente', 'success');
      setEliminarVentaModalOpen(false);
      fetchVentas();
    } catch (err) {
      console.error('Error eliminando venta:', err);
      addNotification('Error al eliminar la venta', 'error');
    }
  };

  const actions = [
    {
      icon: 'fa-solid fa-eye',
      color: '#2563EB',
      onClick: handleVerDetalle,
      tooltip: 'Ver Detalle'
    },
    {
      icon: 'fa-solid fa-pen',
      color: '#6B7280',
      onClick: async (row: IVentaDisplay) => {
        try {
          const todasLasVentas = user?.rol === 'dueño'
            ? await ventaService.getAll()
            : await ventaService.getMisVentas();

          const venta = todasLasVentas.find((v: IVenta) => v.id === row.id);
          setVentaSeleccionada(venta || null);
          setEditarVentaModalOpen(true);
        } catch (err) {
          console.error('Error cargando venta para editar:', err);
          addNotification('Error al cargar la venta', 'error');
        }
      },
      tooltip: 'Editar'
    },
    {
      icon: 'fa-solid fa-trash',
      color: '#DC2626',
      onClick: handleEliminar,
      tooltip: 'Eliminar'
    }
  ];

  const formatCurrency = (value: number) => '$' + value.toLocaleString('es-AR');

  const headerActions = (
    <PrimaryButton icon="fa-solid fa-cash-register" onClick={() => setAgregarVentaModalOpen(true)}>
      Venta
    </PrimaryButton>
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
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1F2937', fontSize: '24px', mb: 0.5 }}>
            Ventas
          </Typography>
          <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '14px' }}>
            Registro y seguimiento de transacciones
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard title="Ventas Hoy" value={stats.ventasHoy} icon="fa-solid fa-shopping-bag" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard title="Total Hoy" value={formatCurrency(stats.totalHoy)} icon="fa-solid fa-dollar-sign" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard title="Ventas del Mes" value={stats.ventasMes} icon="fa-solid fa-calendar" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard title="Total del Mes" value={formatCurrency(stats.totalMes)} icon="fa-solid fa-chart-line" />
          </Grid>
        </Grid>

        {/* Tabla con filtros */}
        <TableClientSide
          title="Historial de Ventas"
          data={ventas}
          columns={columns}
          headerActions={headerActions}
          actions={actions}
        />

        {/* Modal para agregar venta */}
        <AgregarVentaModal
          open={agregarVentaModalOpen}
          onClose={() => setAgregarVentaModalOpen(false)}
          onSuccess={() => {
            fetchVentas();
            setAgregarVentaModalOpen(false);
            addNotification('Venta creada exitosamente', 'success');
          }}
        />

        {/* Modal de detalle de venta */}
        <DetalleVentaModal
          open={detalleVentaModalOpen}
          onClose={() => setDetalleVentaModalOpen(false)}
          venta={ventaSeleccionada}
        />

        {/* Modal de editar venta */}
        <EditarVentaModal
          open={editarVentaModalOpen}
          onClose={() => setEditarVentaModalOpen(false)}
          onSuccess={() => {
            fetchVentas();
            setEditarVentaModalOpen(false);
            addNotification('Venta actualizada exitosamente', 'success');
          }}
          venta={ventaSeleccionada}
        />

        {/* Modal de confirmación de eliminación */}
        <ConfirmModal
          open={eliminarVentaModalOpen}
          onClose={() => setEliminarVentaModalOpen(false)}
          onConfirm={confirmEliminar}
          title="Eliminar venta"
          message={`¿Está seguro que desea eliminar la venta ${ventaSeleccionada ? `del cliente ${ventaSeleccionada.cliente?.nombre || 'desconocido'}` : ''}?`}
          confirmText="Eliminar"
          confirmColor="#DC2626"
          icon="fa-solid fa-trash"
          iconColor="#DC2626"
        />
      </Box>
    </>
  );
}
