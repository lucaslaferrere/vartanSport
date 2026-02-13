'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Box, Typography, Chip, Grid, CircularProgress, IconButton, Tooltip } from '@mui/material';
import { ColumnDef } from '@tanstack/react-table';
import TableClientSide from '@components/Tables/TableClientSide';
import StatCard from '@components/Cards/StatCard';
import StatusTabs from '@components/Tabs/StatusTabs';
import PrimaryButton from '@components/Buttons/PrimaryButton';
import AgregarGastoModal from '@components/Modals/AgregarGastoModal';
import ConfirmModal from '@components/Modals/ConfirmModal';
import { TableFilterType } from '@components/Tables/Filters/TableFilterType';
import { colors, chipColors } from '@/src/theme/colors';
import { gastoService } from '@services/gasto.service';
import { IGasto, IGastoResumen } from '@models/entities/gastoEntity';
import { useMounted } from '@hooks/useMounted';
import { gastosConfig } from '@/src/config/layoutConfig';
import { useNotification } from '@components/Notifications';

// Interfaz auxiliar para manejar errores de API sin usar 'any'
interface IApiError {
  response?: {
    data?: { error?: string } | string;
    status?: number;
  };
  message?: string;
  code?: string;
}

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

const getChipStyle = (key: string, _type: 'categoria' | 'metodoPago') => {
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
  const { addNotification } = useNotification();
  const [gastos, setGastos] = useState<IGastoDisplay[]>([]);
  const [allGastos, setAllGastos] = useState<IGastoDisplay[]>([]);
  const [stats, setStats] = useState<IGastosStats>({ totalGastos: 0, cantidadGastos: 0, gastoPromedio: 0, categoriaTop: 'Sin datos' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('gastos');
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [gastoToDelete, setGastoToDelete] = useState<IGastoDisplay | null>(null);

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

      // Intentar obtener resumen del servidor
      try {
        const resumen = await gastoService.getResumen();
        console.log('✅ Resumen obtenido del servidor:', resumen);

        // Validar que el resumen tenga la estructura esperada
        if (resumen && typeof resumen.total !== 'undefined' && typeof resumen.cantidad !== 'undefined') {
          setStats({
            totalGastos: resumen.total || 0,
            cantidadGastos: resumen.cantidad || 0,
            gastoPromedio: resumen.cantidad > 0 ? resumen.total / resumen.cantidad : 0,
            categoriaTop: resumen.por_categoria && resumen.por_categoria.length > 0
                ? resumen.por_categoria.reduce((a: IGastoResumen, b: IGastoResumen) => (a.total > b.total ? a : b)).categoria
                : 'Sin datos'
          });
        } else {
          throw new Error('Respuesta del servidor con formato inválido');
        }
      } catch (unknownError: unknown) {
        // [FIX 1] Reemplazado :any por :unknown y cast a IApiError
        const resumenError = unknownError as IApiError;
        console.warn('⚠️ Error al obtener resumen del servidor, calculando localmente:', resumenError?.response?.data || resumenError.message);
        // Usar cálculo local cuando el servidor falla (error 500 o cualquier otro)
        setStats(calcularStatsLocales(response.gastos));
      }
    } catch (unknownError: unknown) {
      // [FIX 2] Reemplazado :any por :unknown y cast a IApiError
      const err = unknownError as IApiError;
      console.error('❌ Error al cargar gastos:', err);

      let errorMessage = 'Error al cargar los gastos';

      if (err.message === 'Network Error' || err.code === 'ERR_NETWORK') {
        errorMessage = '⚠️ No se puede conectar al servidor backend (http://localhost:8080). Por favor, verifica que el backend esté corriendo.';
      } else if (err.response?.status === 500) {
        errorMessage = 'Error en el servidor. Por favor, contacta al administrador.';
      } else if (err.response?.status === 401) {
        errorMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
      }

      setError(errorMessage);
      setGastos([]);
      setAllGastos([]);
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

  const handleDelete = (gasto: IGastoDisplay) => {
    setGastoToDelete(gasto);
    setConfirmDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!gastoToDelete) return;

    try {
      await gastoService.delete(gastoToDelete.id);
      addNotification('Gasto eliminado exitosamente', 'success');
      fetchGastos();
    } catch (unknownError: unknown) {
      // [FIX 3] Reemplazado :any por :unknown y cast a IApiError
      const err = unknownError as IApiError;
      console.error('Error eliminando gasto:', err);
      // Verificación de tipo segura para 'error' dentro de data
      const responseData = err.response?.data;
      const errorMessage = (typeof responseData === 'object' && responseData !== null && 'error' in responseData)
          ? (responseData as { error: string }).error
          : 'Error al eliminar el gasto';

      addNotification(errorMessage, 'error');
    } finally {
      setGastoToDelete(null);
    }
  };

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
    {
      id: 'acciones',
      header: 'Acciones',
      cell: ({ row }) => (
          <Tooltip title="Eliminar gasto">
            <IconButton
                onClick={() => handleDelete(row.original)}
                sx={{
                  color: colors.error,
                  '&:hover': {
                    bgcolor: 'rgba(244, 67, 54, 0.1)',
                  },
                }}
                size="small"
            >
              <i className="fa-solid fa-trash" style={{ fontSize: 16 }}></i>
            </IconButton>
          </Tooltip>
      ),
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
        <Box sx={{ p: 4, textAlign: 'center', maxWidth: 600, mx: 'auto', mt: 8 }}>
          <Box sx={{
            bgcolor: '#FFF5F5',
            border: '2px solid #FED7D7',
            borderRadius: 2,
            p: 4,
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <i className="fa-solid fa-circle-exclamation" style={{ fontSize: 48, color: colors.error, marginBottom: 16 }}></i>
            <Typography variant="h5" sx={{ fontWeight: 600, color: colors.error, mb: 2 }}>
              Error al Cargar Gastos
            </Typography>
            <Typography sx={{ color: colors.textSecondary, mb: 3, whiteSpace: 'pre-wrap' }}>
              {error}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}>
              <PrimaryButton
                  icon="fa-solid fa-rotate-right"
                  onClick={() => {
                    setError(null);
                    fetchGastos();
                  }}
              >
                Reintentar
              </PrimaryButton>
              {error.includes('backend') && (
                  <Typography sx={{ fontSize: 12, color: colors.textSecondary, mt: 2, textAlign: 'left' }}>
                    {/* [FIX 4 & 5] Escapado de comillas dobles */}
                    <strong>💡 Solución:</strong><br/>
                    1. Abre una terminal<br/>
                    2. Navega a la carpeta del backend<br/>
                    3. Ejecuta: <code style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: 4 }}>go run main.go</code><br/>
                    4. Espera a que aparezca: &quot;Listening and serving HTTP on :8080&quot;<br/>
                    5. Haz clic en &quot;Reintentar&quot;
                  </Typography>
              )}
            </Box>
          </Box>
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
            <PrimaryButton icon="fa-solid fa-plus" onClick={() => setModalOpen(true)}>Nuevo Gasto</PrimaryButton>
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

        <AgregarGastoModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            onSuccess={() => {
              setModalOpen(false);
              fetchGastos();
            }}
        />

        <ConfirmModal
            open={confirmDeleteOpen}
            onClose={() => {
              setConfirmDeleteOpen(false);
              setGastoToDelete(null);
            }}
            onConfirm={confirmDelete}
            title="Eliminar gasto"
            message={`¿Está seguro que desea eliminar el gasto "${gastoToDelete?.concepto}"?`}
            confirmText="Eliminar"
            confirmColor="#DC2626"
            icon="fa-solid fa-trash"
            iconColor="#DC2626"
        />
      </Box>
  );
}