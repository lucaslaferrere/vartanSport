'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Box, CircularProgress, Typography, Grid, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, IconButton } from '@mui/material';
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
  dni: string;
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
  const { user, token } = useAuthStore();
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
  const [generatingLink, setGeneratingLink] = useState(false);
  const [linkGenerado, setLinkGenerado] = useState<string | null>(null);

  const transformCliente = (cliente: ICliente): IClienteDisplay => ({
    id: cliente.id,
    nombre: cliente.nombre,
    dni: cliente.dni || '-',
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

  useEffect(() => {
    // Read from localStorage as the authoritative source — same strategy as the axios interceptor.
    // The Zustand `token` is used as the effect trigger; if it is somehow null on first run
    // (store not yet hydrated), the localStorage fallback guarantees a connection anyway.
    const activeToken = token ?? localStorage.getItem('token');
    if (!activeToken) return;

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const eventSource = new EventSource(`${baseUrl}/api/clientes/stream?token=${activeToken}`);

    eventSource.addEventListener('new_client', (event: MessageEvent) => {
      try {
        const nuevoCliente: ICliente = JSON.parse(event.data);
        const display = transformCliente(nuevoCliente);

        setClientes(prev => [display, ...prev]);

        const fechaCliente = new Date(nuevoCliente.fecha_creacion);
        const ahora = new Date();
        const esEsteMes =
          fechaCliente.getMonth() === ahora.getMonth() &&
          fechaCliente.getFullYear() === ahora.getFullYear();

        setStats(prev => ({
          totalClientes: prev.totalClientes + 1,
          clientesNuevos: prev.clientesNuevos + (esEsteMes ? 1 : 0),
        }));

        addNotification(`Nuevo cliente registrado: ${nuevoCliente.nombre}`, 'success');
      } catch (err) {
        console.error('SSE parse error:', err);
      }
    });

    eventSource.onerror = () => {
      console.warn('SSE connection error – EventSource will retry automatically');
    };

    return () => {
      eventSource.close();
    };
  }, [token]); // re-runs only if the auth token changes (e.g. after login/logout)

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

  const handleGenerarLink = async () => {
    setGeneratingLink(true);
    try {
      const data = await clienteService.generarInvitacion();
      const token = data.url.split('?token=')[1];
      if (!token) {
        addNotification('Error: el servidor no devolvió un token válido', 'error');
        return;
      }
      const fullUrl = `${window.location.origin}/registro-cliente/${token}`;
      setLinkGenerado(fullUrl);
    } catch {
      addNotification('Error al generar el enlace de registro', 'error');
    } finally {
      setGeneratingLink(false);
    }
  };

  // Debe llamarse directamente desde un click (sin awaits previos) para que funcione en iOS
  const handleCopiarLink = () => {
    if (!linkGenerado) return;
    navigator.clipboard.writeText(linkGenerado)
      .then(() => addNotification('Enlace copiado al portapapeles', 'success'))
      .catch(() => addNotification('No se pudo copiar. Copialo manualmente.', 'warning'));
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
    { accessorKey: 'dni', header: 'DNI' },
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
    { accessorKey: 'ciudad', header: 'Localidad' },
    { accessorKey: 'provincia', header: 'Provincia' },
    { accessorKey: 'pais', header: 'País' },
    { accessorKey: 'fechaCreacion', header: 'Fecha Registro' },
  ];

  const headerActions = (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Tooltip title="Genera un enlace de un solo uso (válido 24hs) para que el cliente complete su propio registro">
        <span>
          <PrimaryButton
            icon={generatingLink ? undefined : 'fa-solid fa-share-nodes'}
            onClick={handleGenerarLink}
            disabled={generatingLink}
            sx={{ bgcolor: '#5a8a72', '&:hover': { bgcolor: '#3d6b55' } }}
          >
            {generatingLink
              ? <><CircularProgress size={14} sx={{ color: '#fff', mr: 1 }} />Generando...</>
              : 'Compartir formulario'}
          </PrimaryButton>
        </span>
      </Tooltip>
      <PrimaryButton icon="fa-solid fa-user-plus" onClick={handleOpenAgregarCliente}>
        Cliente
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

      {/* Dialog link de invitación */}
      <Dialog open={!!linkGenerado} onClose={() => setLinkGenerado(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontSize: '16px', fontWeight: 600 }}>
          Enlace de registro generado
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#6B7280', mb: 2 }}>
            Válido por 24 horas. Compartilo con el cliente para que complete su registro.
          </Typography>
          <TextField
            fullWidth
            value={linkGenerado ?? ''}
            slotProps={{ input: { readOnly: true } }}
            size="small"
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setLinkGenerado(null)} color="inherit" size="small">
            Cerrar
          </Button>
          <Button onClick={handleCopiarLink} variant="contained" size="small"
            sx={{ bgcolor: '#5a8a72', '&:hover': { bgcolor: '#3d6b55' } }}>
            Copiar enlace
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default ClientesPage;
