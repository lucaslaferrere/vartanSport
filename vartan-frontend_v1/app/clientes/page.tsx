'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Box, CircularProgress, Typography, Grid } from '@mui/material';
import { ColumnDef } from '@tanstack/react-table';
import TableClientSide from '@components/Tables/TableClientSide';
import StatCard from '@components/Cards/StatCard';
import PrimaryButton from '@components/Buttons/PrimaryButton';
import { TableFilterType } from '@components/Tables/Filters/TableFilterType';
import { colors } from '@/src/theme/colors';
import { clienteService } from '@services/cliente.service';
import { ICliente } from '@models/entities/clienteEntity';
import { useMounted } from '@hooks/useMounted';
import { useAuthStore } from '@libraries/store';
import AgregarClienteModal from '@components/Modals/AgregarClienteModal';
import EditarClienteModal from '@components/Modals/EditarClienteModal';
import ConfirmModal from '@components/Modals/ConfirmModal';
import { useNotification } from '@components/Notifications';

interface IClienteDisplay {
  id: number;
  nombre: string;
  telefono: string;
  email: string;
  direccion: string;
  ciudad: string;
  provincia: string;
  pais: string;
  fechaCreacion: string;
}

interface IClientesStats {
  totalClientes: number;
  clientesNuevos: number;
}

function ClientesPage() {
  const mounted = useMounted();
  const { addNotification } = useNotification();
  const { user } = useAuthStore();
  const [clientes, setClientes] = useState<IClienteDisplay[]>([]);
  const [stats, setStats] = useState<IClientesStats>({
    totalClientes: 0,
    clientesNuevos: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agregarClienteModalOpen, setAgregarClienteModalOpen] = useState(false);
  const [editarClienteModalOpen, setEditarClienteModalOpen] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ICliente | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState<IClienteDisplay | null>(null);

  const transformCliente = (cliente: ICliente): IClienteDisplay => ({
    id: cliente.id,
    nombre: cliente.nombre,
    telefono: cliente.telefono || '-',
    email: cliente.email || '-',
    direccion: cliente.direccion || '-',
    ciudad: cliente.ciudad || '-',
    provincia: cliente.provincia || '-',
    pais: cliente.pais || '-',
    fechaCreacion: new Date(cliente.fecha_creacion).toLocaleDateString('es-AR'),
  });

  const calcularStats = (clientesData: ICliente[]): IClientesStats => {
    const mesActual = new Date().getMonth();
    const anioActual = new Date().getFullYear();

    const clientesNuevos = clientesData.filter(c => {
      const fecha = new Date(c.fecha_creacion);
      return fecha.getMonth() === mesActual && fecha.getFullYear() === anioActual;
    }).length;

    return {
      totalClientes: clientesData.length,
      clientesNuevos,
    };
  };

  const handleEdit = async (row: IClienteDisplay) => {
    try {
      const cliente = await clienteService.getById(row.id);
      setClienteSeleccionado(cliente);
      setEditarClienteModalOpen(true);
    } catch (err) {
      console.error('Error cargando cliente para editar:', err);
      addNotification('Error al cargar el cliente para editar', 'error');
    }
  };

  const fetchClientes = useCallback(async () => {
    if (!mounted) return;

    setLoading(true);
    setError(null);
    try {
      const clientesData = await clienteService.getAll();
      setClientes(clientesData.map(transformCliente));
      setStats(calcularStats(clientesData));
    } catch (err: unknown) {
      console.error('Error fetching clientes:', err);
      const errorMessage = err instanceof Error && err.message.includes('Network')
        ? 'No se puede conectar al servidor'
        : 'Error al cargar los clientes';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [mounted]);

  useEffect(() => {
    if (mounted) {
      fetchClientes();
    }
  }, [mounted, fetchClientes]);

  if (!mounted) return null;

  const handleDelete = async (row: IClienteDisplay): Promise<void> => {
    setClienteToDelete(row);
    setConfirmDeleteOpen(true);
  };
  const confirmDelete = async () => {
    if (!clienteToDelete) return;

    try {
      await clienteService.delete(clienteToDelete.id);
      fetchClientes();
      addNotification('Cliente eliminado exitosamente', 'success');
    } catch (err: unknown) {
      console.error('Error eliminando cliente:', err);

      type AxiosLike = { response?: { status?: number; data?: { error?: string } } };
      const axiosErr = err as AxiosLike;

      if (axiosErr.response?.status === 403) {
        addNotification('No tienes permisos para eliminar clientes', 'error');
      } else if (axiosErr.response?.data?.error) {
        addNotification(axiosErr.response.data.error || 'Error al eliminar el cliente', 'error');
      } else {
        addNotification('Error al eliminar el cliente', 'error');
      }
    } finally {
      setClienteToDelete(null);
    }
  };

  const handleOpenAgregarCliente = () => {
    setAgregarClienteModalOpen(true);
  };

  const columns: ColumnDef<IClienteDisplay>[] = [
    {
      accessorKey: 'nombre',
      header: 'Nombre',
      meta: {
        filterVariant: TableFilterType.Text,
        filterAccessorKey: 'nombre',
        filterProps: { placeholder: 'Buscar nombre...' }
      }
    },
    { accessorKey: 'telefono', header: 'Teléfono' },
    {
      accessorKey: 'email',
      header: 'Email',
      meta: {
        filterVariant: TableFilterType.Text,
        filterAccessorKey: 'email',
        filterProps: { placeholder: 'Buscar email...' }
      }
    },
    { accessorKey: 'direccion', header: 'Dirección' },
    { accessorKey: 'ciudad', header: 'Ciudad' },
    { accessorKey: 'provincia', header: 'Provincia' },
    { accessorKey: 'pais', header: 'País' },
    { accessorKey: 'fechaCreacion', header: 'Fecha Registro' },
  ];

  const headerActions = (
    <PrimaryButton icon="fa-solid fa-user-plus" onClick={handleOpenAgregarCliente}>
      Cliente
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
            Clientes
          </Typography>
          <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '14px' }}>
            Gestión de clientes y contactos
          </Typography>
        </Box>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard title="Total Clientes" value={stats.totalClientes} icon="fa-solid fa-users" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard title="Nuevos (Este Mes)" value={stats.clientesNuevos} icon="fa-solid fa-user-plus" />
          </Grid>
        </Grid>

        {/* Tabla con filtros */}
        <TableClientSide
          title="Lista de Clientes"
          data={clientes}
          columns={columns}
          headerActions={headerActions}
          actions={(() => {
            const base = [
              {
                icon: 'fa-solid fa-pen',
                color: '#6B7280',
                onClick: handleEdit,
                tooltip: 'Editar'
              }
            ];
            if (user?.rol === 'dueño') {
              base.push({
                icon: 'fa-solid fa-trash',
                color: '#DC2626',
                onClick: handleDelete,
                tooltip: 'Eliminar'
              });
            }
            return base;
          })()}
        />

        {/* Modal para agregar cliente */}
        <AgregarClienteModal
          open={agregarClienteModalOpen}
          onClose={() => setAgregarClienteModalOpen(false)}
          onSuccess={() => {
            fetchClientes();
            setAgregarClienteModalOpen(false);
            addNotification('Cliente agregado exitosamente', 'success');
          }}
        />

        {/* Modal para editar cliente */}
        <EditarClienteModal
          open={editarClienteModalOpen}
          onClose={() => setEditarClienteModalOpen(false)}
          cliente={clienteSeleccionado}
          onSuccess={() => {
            fetchClientes();
            setEditarClienteModalOpen(false);
            addNotification('Cliente editado exitosamente', 'success');
          }}
        />

        {/* Modal de confirmación de eliminación */}
        <ConfirmModal
          open={confirmDeleteOpen}
          onClose={() => {
            setConfirmDeleteOpen(false);
            setClienteToDelete(null);
          }}
          onConfirm={confirmDelete}
          title="Eliminar cliente"
          message={`¿Está seguro que desea eliminar al cliente "${clienteToDelete?.nombre}"?`}
          confirmText="Eliminar"
        />
      </Box>
    </>
  );
}

export default ClientesPage;
