'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Box, Typography, Chip, CircularProgress } from '@mui/material';
import { ColumnDef } from '@tanstack/react-table';
import TableClientSide from '@components/Tables/TableClientSide';
import StatusTabs from '@components/Tabs/StatusTabs';
import ConfirmModal from '@components/Modals/ConfirmModal';
import { TableFilterType } from '@components/Tables/Filters/TableFilterType';
import { colors } from '@/src/theme/colors';
import { pedidoService } from '@services/pedido.service';
import { IPedido } from '@models/entities/pedidoEntity';
import { useAuthStore } from '@libraries/store';
import { useMounted } from '@hooks/useMounted';
import { useNotification } from '@components/Notifications';
import { debugAuth } from '@/src/utils/debugAuth';

interface IPedidoDisplay {
  id: number;
  fecha: string;
  cliente: string;
  productos: number;
  total: number;
  estado: string;
}

type ConfirmAction = {
  type: 'despachar' | 'cancelar';
  pedido: IPedidoDisplay;
};

function PedidosPage() {
  const mounted = useMounted();
  const { addNotification } = useNotification();
  const [pedidos, setPedidos] = useState<IPedidoDisplay[]>([]);
  const [allPedidos, setAllPedidos] = useState<IPedidoDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('todos');
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const { user } = useAuthStore();

  const transformPedido = (pedido: IPedido): IPedidoDisplay => {
    // Calcular la cantidad total de items sumando las cantidades de cada detalle
    const cantidadItems = pedido.venta?.detalles?.reduce((acc, detalle) => acc + detalle.cantidad, 0) || 0;

    return {
      id: pedido.id,
      fecha: new Date(pedido.fecha_creacion).toLocaleDateString('es-AR'),
      cliente: pedido.venta?.cliente?.nombre || 'Cliente desconocido',
      productos: cantidadItems,
      total: pedido.venta?.total_final || 0,
      estado: pedido.estado,
    };
  };

  const fetchPedidos = useCallback(async () => {
    if (!mounted) return;

    // Debug de autenticación
    debugAuth();

    // Verificar que el usuario esté cargado
    if (!user) {
      console.warn('⚠️ Usuario no cargado todavía');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log('📦 Cargando pedidos - Rol:', user?.rol);
      const pedidosData = user?.rol === 'dueño'
        ? await pedidoService.getAll()
        : await pedidoService.getMisPedidos();

      const transformed = pedidosData.map(transformPedido);
      setAllPedidos(transformed);
      setPedidos(transformed);
      console.log('✅ Pedidos cargados:', transformed.length);
    } catch (err: unknown) {
      console.error('❌ Error fetching pedidos:', err);

      // Mejorar el manejo de errores
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { status?: number; data?: { message?: string } } };
        if (axiosError.response?.status === 401) {
          setError('No autorizado. Por favor, inicia sesión nuevamente.');
          return;
        }
      }

      const errorMessage = err instanceof Error && err.message.includes('Network')
        ? 'No se puede conectar al servidor'
        : 'Error al cargar los pedidos';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [mounted, user]);

  useEffect(() => {
  if (mounted) {
      fetchPedidos();
    }
  }, [mounted, fetchPedidos]);

  useEffect(() => {
    if (activeTab === 'todos') {
      setPedidos(allPedidos);
    } else {
      setPedidos(allPedidos.filter(p => p.estado === activeTab));
    }
  }, [activeTab, allPedidos]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  const handleDespachar = (row: IPedidoDisplay) => {
    setConfirmAction({ type: 'despachar', pedido: row });
  };

  const handleCancelar = (row: IPedidoDisplay) => {
    setConfirmAction({ type: 'cancelar', pedido: row });
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;

    try {
      const { type, pedido } = confirmAction;

      if (type === 'despachar') {
        await pedidoService.updateEstado(pedido.id, { estado: 'despachado' });
        addNotification('Pedido despachado correctamente', 'success');
      } else if (type === 'cancelar') {
        await pedidoService.updateEstado(pedido.id, { estado: 'cancelado' });
        addNotification('Pedido cancelado correctamente', 'success');
      }

      fetchPedidos();
    } catch (err) {
      console.error('Error actualizando pedido:', err);
      addNotification('Error al actualizar el pedido', 'error');
    } finally {
      setConfirmAction(null);
    }
  };

  const tabs = [
    { id: 'todos', label: 'Todos', count: allPedidos.length, color: 'default' as const },
    { id: 'pendiente', label: 'Pendientes', count: allPedidos.filter(p => p.estado === 'pendiente').length, color: 'warning' as const },
    { id: 'despachado', label: 'Despachados', count: allPedidos.filter(p => p.estado === 'despachado').length, color: 'success' as const },
    { id: 'cancelado', label: 'Cancelados', count: allPedidos.filter(p => p.estado === 'cancelado').length, color: 'error' as const },
  ];

  const getEstadoChip = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return <Chip label="Pendiente" size="small" sx={{ bgcolor: 'rgba(245, 158, 11, 0.1)', color: '#D97706', fontWeight: 600, fontSize: '11px' }} />;
      case 'despachado':
        return <Chip label="Despachado" size="small" sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#059669', fontWeight: 600, fontSize: '11px' }} />;
      case 'cancelado':
        return <Chip label="Cancelado" size="small" sx={{ bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#DC2626', fontWeight: 600, fontSize: '11px' }} />;
      default:
        return null;
    }
  };

  const columns: ColumnDef<IPedidoDisplay>[] = [
    {
      accessorKey: 'id',
      header: 'N° Pedido',
      cell: ({ getValue }) => (
        <Typography sx={{ fontWeight: 600, fontSize: '13px' }}>#{getValue() as number}</Typography>
      )
    },
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
      accessorKey: 'productos',
      header: 'Items',
      meta: { align: 'center' as const }
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
    {
      accessorKey: 'estado',
      header: 'Estado',
      cell: ({ getValue }) => getEstadoChip(getValue() as string),
    },
  ];

  const getActions = () => {
    return [
      {
        icon: 'fa-solid fa-truck',
        color: '#059669',
        onClick: handleDespachar,
        tooltip: 'Despachar pedido',
        disabled: (row: IPedidoDisplay) => row.estado !== 'pendiente'
      },
      {
        icon: 'fa-solid fa-xmark',
        color: '#DC2626',
        onClick: handleCancelar,
        tooltip: 'Cancelar pedido',
        disabled: (row: IPedidoDisplay) => row.estado === 'cancelado'
      }
    ];
  };

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
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1F2937', fontSize: '24px', mb: 0.5 }}>
            Pedidos
          </Typography>
          <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '14px' }}>
            Gestión de envíos y entregas
          </Typography>
        </Box>

        <StatusTabs tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />

        <TableClientSide
          data={pedidos}
          columns={columns}
          actions={getActions()}
        />
      </Box>

      {/* Modal de confirmación */}
      <ConfirmModal
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
        title={confirmAction?.type === 'despachar' ? 'Confirmar despacho' : 'Confirmar cancelación'}
        message={
          confirmAction?.type === 'despachar'
            ? `¿Está seguro que desea marcar el pedido #${confirmAction.pedido.id} como despachado?`
            : `¿Está seguro que desea cancelar el pedido #${confirmAction?.pedido.id}?`
        }
        confirmText={confirmAction?.type === 'despachar' ? 'Despachar' : 'Cancelar'}
        confirmColor={confirmAction?.type === 'despachar' ? '#059669' : '#DC2626'}
        icon={confirmAction?.type === 'despachar' ? 'fa-solid fa-truck' : 'fa-solid fa-xmark'}
        iconColor={confirmAction?.type === 'despachar' ? '#059669' : '#DC2626'}
      />
    </>
  );
}

export default PedidosPage;
