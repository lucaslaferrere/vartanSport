'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Grid, Typography, CircularProgress, Alert, Chip, Button, FormControlLabel, Checkbox, MenuItem, Select, TextField, InputAdornment } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useUserPermissions } from '@components/Validators/UserPermissionsContext';
import { comprobanteService, IComprobante, IFiltrosComprobantes } from '@services/comprobante.service';
import { usuarioService } from '@services/usuario.service';
import { ventaService } from '@services/venta.service';
import { IFormaPago } from '@models/entities/ventaEntity';
import { useNotification } from '@components/Notifications';
import ComprobanteCard from '@components/Cards/ComprobanteCard';
import ComprobantePreviewModal from '@components/Modals/ComprobantePreviewModal';

interface IVendedor {
  id: number;
  nombre: string;
}

type Periodo = 'hoy' | 'ayer' | '7dias' | 'todo';

export default function ComprobantesPage() {
  const router = useRouter();
  const { userRole } = useUserPermissions();
  const { addNotification } = useNotification();

  const [comprobantes, setComprobantes] = useState<IComprobante[]>([]);
  const [total, setTotal] = useState(0);
  const [pendientes, setPendientes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vendedores, setVendedores] = useState<IVendedor[]>([]);
  const [formasPago, setFormasPago] = useState<IFormaPago[]>([]);

  const [periodo, setPeriodo] = useState<Periodo>('hoy');
  const [vendedorId, setVendedorId] = useState<number | ''>('');
  const [soloPendientes, setSoloPendientes] = useState(false);
  const [formaPagoId, setFormaPagoId] = useState<number | ''>('');
  const [numeroVenta, setNumeroVenta] = useState<string>('');

  const [previewItem, setPreviewItem] = useState<{ comp: IComprobante; tipo: 'sena' | 'saldo' } | null>(null);
  const [descargandoZip, setDescargandoZip] = useState(false);
  const [marcandoTodos, setMarcandoTodos] = useState(false);

  // Redirigir si es vendedor
  useEffect(() => {
    if (userRole === 'vendedor') {
      router.replace('/dashboard');
    }
  }, [userRole, router]);

  const fetchVendedores = useCallback(async () => {
    try {
      const data = await usuarioService.getVendedores();
      setVendedores(data);
    } catch {
      // No crítico
    }
  }, []);

  const fetchFormasPago = useCallback(async () => {
    try {
      const data = await ventaService.getFormasPago();
      setFormasPago(data || []);
    } catch {
      // No crítico
    }
  }, []);

  const fetchComprobantes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const numVentaId = numeroVenta ? Number(numeroVenta) : undefined;
      const filtros: IFiltrosComprobantes = {
        // Si se busca por nº venta ignoramos el filtro de período para encontrarlo
        // sin importar la fecha en que fue registrado
        periodo: numVentaId ? 'todo' : periodo,
        vendedor_id: vendedorId || undefined,
        solo_pendientes: soloPendientes || undefined,
        forma_pago_id: formaPagoId || undefined,
        numero_venta: numVentaId,
      };
      const data = await comprobanteService.getAll(filtros);

      // Dedup: misma venta_id puede venir como entrada legacy (sin pago_id) y como
      // entrada de pagos_venta (con pago_id). Preferir la de pagos_venta.
      const seen = new Map<number, IComprobante>();
      for (const comp of data.comprobantes) {
        const existing = seen.get(comp.venta_id);
        if (!existing || (comp.pago_id != null && existing.pago_id == null)) {
          seen.set(comp.venta_id, comp);
        }
      }

      // Filtro client-side por nº venta (garantiza el resultado aunque el backend
      // no soporte el parámetro numero_venta todavía)
      let comprobantesFinales = Array.from(seen.values());
      if (numVentaId) {
        comprobantesFinales = comprobantesFinales.filter(c => c.venta_id === numVentaId);
      }

      setComprobantes(comprobantesFinales);
      setTotal(comprobantesFinales.length);
      setPendientes(comprobantesFinales.filter(c => !c.revisado).length);
    } catch {
      setError('No se pudieron cargar los comprobantes.');
    } finally {
      setLoading(false);
    }
  }, [periodo, vendedorId, soloPendientes, formaPagoId, numeroVenta]);

  useEffect(() => {
    fetchVendedores();
    fetchFormasPago();
  }, [fetchVendedores, fetchFormasPago]);

  useEffect(() => {
    fetchComprobantes();
  }, [fetchComprobantes]);

  const handleRevisar = async (comp: IComprobante) => {
    const nuevoEstado = !comp.revisado;
    // Optimistic update
    setComprobantes(prev =>
      prev.map(c => c.venta_id === comp.venta_id ? { ...c, revisado: nuevoEstado } : c)
    );
    setPendientes(prev => nuevoEstado ? prev - 1 : prev + 1);
    try {
      await comprobanteService.marcarRevisado(comp.venta_id, nuevoEstado, comp.pago_id);
      addNotification(nuevoEstado ? 'Comprobante marcado como revisado' : 'Comprobante marcado como pendiente', 'success');
    } catch {
      // Revertir
      setComprobantes(prev =>
        prev.map(c => c.venta_id === comp.venta_id ? { ...c, revisado: comp.revisado } : c)
      );
      setPendientes(prev => nuevoEstado ? prev + 1 : prev - 1);
      addNotification('Error al actualizar el comprobante', 'error');
    }
  };

  const handleDescargar = async (comp: IComprobante) => {
    const ext = comp.comprobante_url.split('.').pop()?.toLowerCase() ?? 'pdf';
    const nombre = `comprobante_sena_venta_${comp.venta_id}.${ext}`;
    try {
      await comprobanteService.descargar(comp.venta_id, nombre);
    } catch {
      addNotification('Error al descargar el comprobante', 'error');
    }
  };

  const handleDescargarSaldo = async (comp: IComprobante) => {
    const ext = comp.comprobante_saldo_url?.split('.').pop()?.toLowerCase() ?? 'pdf';
    const nombre = `comprobante_saldo_venta_${comp.venta_id}.${ext}`;
    try {
      await comprobanteService.descargarSaldo(comp.venta_id, nombre);
    } catch {
      addNotification('Error al descargar el comprobante de saldo', 'error');
    }
  };

  const handleDescargarZip = async () => {
    setDescargandoZip(true);
    try {
      await comprobanteService.descargarZip({
        periodo,
        vendedor_id: vendedorId || undefined,
        solo_pendientes: soloPendientes || undefined,
        forma_pago_id: formaPagoId || undefined,
      });
    } catch {
      addNotification('Error al descargar el ZIP', 'error');
    } finally {
      setDescargandoZip(false);
    }
  };

  const handleMarcarFiltradosRevisados = async () => {
    const pendientesVisibles = comprobantes.filter(c => !c.revisado);
    if (pendientesVisibles.length === 0) {
      addNotification('No hay comprobantes pendientes en la vista actual', 'info');
      return;
    }
    setMarcandoTodos(true);
    try {
      const ids = pendientesVisibles.map(c => c.venta_id);
      const pagoIds = pendientesVisibles
        .map(c => c.pago_id)
        .filter((id): id is number => id != null);
      await comprobanteService.marcarTodosRevisados(ids, true, pagoIds.length > 0 ? pagoIds : undefined);
      addNotification(`${ids.length} comprobantes marcados como revisados`, 'success');
      // Refrescar desde el servidor para confirmar el estado persistido
      await fetchComprobantes();
    } catch {
      addNotification('Error al marcar los comprobantes', 'error');
    } finally {
      setMarcandoTodos(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: { xs: '20px', sm: '24px' }, fontWeight: 700, color: '#111827' }}>
          <i className="fa-solid fa-file-invoice" style={{ marginRight: 10, color: '#588a9e' }} />
          Comprobantes
        </Typography>
      </Box>

      {/* Filtros */}
      <Box sx={{
        p: 2, mb: 3, bgcolor: 'white', borderRadius: '10px',
        border: '1px solid #E5E7EB',
        display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center'
      }}>
        {/* Período */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          {(['hoy', 'ayer', '7dias', 'todo'] as Periodo[]).map(p => (
            <Chip
              key={p}
              label={p === 'hoy' ? 'Hoy' : p === 'ayer' ? 'Ayer' : p === '7dias' ? 'Últimos 7 días' : 'Todo'}
              onClick={() => setPeriodo(p)}
              variant={periodo === p ? 'filled' : 'outlined'}
              color={periodo === p ? 'primary' : 'default'}
              size="small"
              sx={{ cursor: 'pointer', fontSize: '12px' }}
            />
          ))}
        </Box>

        {/* Vendedor */}
        <Select
          value={vendedorId}
          onChange={(e) => setVendedorId(e.target.value as number | '')}
          size="small"
          displayEmpty
          sx={{ fontSize: '13px', minWidth: 180, bgcolor: 'white' }}
        >
          <MenuItem value=""><em>Todos los vendedores</em></MenuItem>
          {vendedores.map(v => (
            <MenuItem key={v.id} value={v.id}>{v.nombre}</MenuItem>
          ))}
        </Select>

        {/* Forma de pago */}
        <Select
          value={formaPagoId}
          onChange={(e) => setFormaPagoId(e.target.value as number | '')}
          size="small"
          displayEmpty
          sx={{ fontSize: '13px', minWidth: 180, bgcolor: 'white' }}
        >
          <MenuItem value=""><em>Todas las formas de pago</em></MenuItem>
          {formasPago.map(fp => (
            <MenuItem key={fp.id} value={fp.id}>{fp.nombre}</MenuItem>
          ))}
        </Select>

        {/* Número de venta */}
        <TextField
          size="small"
          placeholder="Nº venta"
          value={numeroVenta}
          onChange={e => {
            const val = e.target.value.replace(/\D/g, '');
            setNumeroVenta(val);
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <i className="fa-solid fa-hashtag" style={{ fontSize: '11px', color: '#9CA3AF' }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{ width: 120, '& input': { fontSize: '13px' } }}
        />

        {/* Solo pendientes */}
        <FormControlLabel
          control={
            <Checkbox
              checked={soloPendientes}
              onChange={(e) => setSoloPendientes(e.target.checked)}
              size="small"
            />
          }
          label={<Typography sx={{ fontSize: '13px' }}>Solo pendientes</Typography>}
        />
      </Box>

      {/* Resumen + Acciones */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', mb: 2, gap: 2 }}>
        <Typography sx={{ fontSize: '13px', color: '#6B7280' }}>
          {total} comprobante{total !== 1 ? 's' : ''}
          {pendientes > 0 && (
            <Box component="span" sx={{ ml: 1, color: '#D97706', fontWeight: 600 }}>
              ({pendientes} pendiente{pendientes !== 1 ? 's' : ''} de revisión)
            </Box>
          )}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={handleDescargarZip}
            disabled={descargandoZip || comprobantes.length === 0}
            startIcon={<i className="fa-solid fa-file-zipper" style={{ fontSize: '12px' }} />}
            sx={{ fontSize: '12px', textTransform: 'none' }}
          >
            {descargandoZip ? 'Descargando...' : 'Descargar todos'}
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={handleMarcarFiltradosRevisados}
            disabled={marcandoTodos || pendientes === 0}
            startIcon={<i className="fa-solid fa-check-double" style={{ fontSize: '12px' }} />}
            sx={{ fontSize: '12px', textTransform: 'none' }}
          >
            {marcandoTodos ? 'Marcando...' : 'Marcar filtrados como revisados'}
          </Button>
        </Box>
      </Box>

      {/* Estados */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {error && !loading && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}

      {!loading && !error && comprobantes.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <i className="fa-solid fa-file-slash" style={{ fontSize: '40px', color: '#D1D5DB' }} />
          <Typography sx={{ mt: 2, color: '#9CA3AF', fontSize: '14px' }}>
            No hay comprobantes para los filtros seleccionados
          </Typography>
        </Box>
      )}

      {/* Grid de cards */}
      {!loading && !error && comprobantes.length > 0 && (
        <Grid container spacing={2}>
          {comprobantes.map(comp => (
            <Grid key={comp.venta_id} size={{ xs: 6, sm: 4, md: 3 }}>
              <ComprobanteCard
                comprobante={comp}
                onVer={() => setPreviewItem({ comp, tipo: 'sena' })}
                onDescargar={() => handleDescargar(comp)}
                onVerSaldo={comp.comprobante_saldo_url ? () => setPreviewItem({ comp, tipo: 'saldo' }) : undefined}
                onDescargarSaldo={comp.comprobante_saldo_url ? () => handleDescargarSaldo(comp) : undefined}
                onRevisar={() => handleRevisar(comp)}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Preview Modal */}
      {previewItem && (
        <ComprobantePreviewModal
          open={!!previewItem}
          onClose={() => setPreviewItem(null)}
          ventaId={previewItem.comp.venta_id}
          comprobanteUrl={previewItem.tipo === 'saldo' ? (previewItem.comp.comprobante_saldo_url ?? '') : previewItem.comp.comprobante_url}
          esSaldo={previewItem.tipo === 'saldo'}
          revisado={previewItem.comp.revisado}
          onRevisar={() => {
            handleRevisar(previewItem.comp);
            setPreviewItem(prev => prev ? { ...prev, comp: { ...prev.comp, revisado: !prev.comp.revisado } } : null);
          }}
        />
      )}
    </Box>
  );
}
