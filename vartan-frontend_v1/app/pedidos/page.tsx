'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Box, Typography, Chip, CircularProgress } from '@mui/material';
import { ColumnDef } from '@tanstack/react-table';
import TableClientSide from '@components/Tables/TableClientSide';
import StatusTabs from '@components/Tabs/StatusTabs';
import { TableFilterType } from '@components/Tables/Filters/TableFilterType';
import { colors } from '@/src/theme/colors';
import { pedidoService } from '@services/pedido.service';
import { IPedido } from '@models/entities/pedidoEntity';
import { useAuthStore } from '@libraries/store';
import { useMounted } from '@hooks/useMounted';

interface IPedidoDisplay {
  id: number;
  fecha: string;
  cliente: string;
  productos: number;
  total: number;
  estado: string;
}

function PedidosPage() {
  const mounted = useMounted();
  const [pedidos, setPedidos] = useState<IPedidoDisplay[]>([]);
  const [allPedidos, setAllPedidos] = useState<IPedidoDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('todos');
  const { user } = useAuthStore();

  const transformPedido = (pedido: IPedido): IPedidoDisplay => {
    const cantidadItems = pedido.venta?.detalles?.reduce((acc, d) => acc + d.cantidad, 0) || 0;

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

    setLoading(true);
    setError(null);
    try {
      const pedidosData = user?.rol === 'dueño'
        ? await pedidoService.getAll()
        : await pedidoService.getMisPedidos();

      const transformed = pedidosData.map(transformPedido);
      setAllPedidos(transformed);
      setPedidos(transformed);
    } catch (err: unknown) {
      console.error('Error fetching pedidos:', err);
      const errorMessage = err instanceof Error && err.message.includes('Network')
        ? 'No se puede conectar al servidor'
        : 'Error al cargar los pedidos';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [mounted, user?.rol]);

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

  const handleDespachar = async (row: IPedidoDisplay) => {
    try {
      await pedidoService.updateEstado(row.id, { estado: 'despachado' });
      fetchPedidos();
    } catch (err) {
      console.error('Error despachando pedido:', err);
    }
  };

  const handleCancelar = async (row: IPedidoDisplay) => {
    try {
      await pedidoService.updateEstado(row.id, { estado: 'cancelado' });
      fetchPedidos();
    } catch (err) {
      console.error('Error cancelando pedido:', err);
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
        tooltip: 'Despachar',
        disabled: (row: IPedidoDisplay) => row.estado !== 'pendiente'
      },
      {
        icon: 'fa-solid fa-xmark',
        color: '#DC2626',
        onClick: handleCancelar,
        tooltip: 'Cancelar',
        disabled: (row: IPedidoDisplay) => row.estado !== 'pendiente'
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
    </>
  );
}

export default PedidosPage;
