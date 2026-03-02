'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Box, Typography, Grid, CircularProgress, Card, CardContent, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { colors } from '@/src/theme/colors';
import { comisionService, IMiResumenComision } from '@services/comision.service';
import { useMounted } from '@hooks/useMounted';
import StatCard from '@components/Cards/StatCard';

const formatCurrency = (value: number) => `$${value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const getCurrentMonth = () => new Date().getMonth() + 1;
const getCurrentYear = () => new Date().getFullYear();

export default function MiComisionPage() {
  const mounted = useMounted();
  const [resumen, setResumen] = useState<IMiResumenComision | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResumen = useCallback(async () => {
    if (!mounted) return;
    setLoading(true);
    setError(null);

    console.log('=== 🔍 LLAMANDO A getMiResumen ===');
    console.log('URL del endpoint:', '/api/mi-resumen-comision');
    console.log('Token presente:', !!localStorage.getItem('token'));

    try {
      console.log('⏳ Haciendo petición...');
      const data = await comisionService.getMiResumen();
      console.log('✅ Respuesta recibida:', data);
      console.log('📋 Tipo de data:', typeof data);
      console.log('📋 Es objeto válido:', data && typeof data === 'object');
      console.log('📋 Tiene usuario:', !!data?.usuario);
      console.log('📋 Tiene configuracion:', !!data?.configuracion);
      console.log('📋 Tiene mes_actual:', !!data?.mes_actual);

      console.log('🔄 Actualizando estado con setResumen...');
      setResumen(data);
      console.log('✅ Estado actualizado');
    } catch (err: any) {
      console.error('❌ Error al obtener resumen:', err);
      console.error('Error status:', err.response?.status);
      console.error('Error data:', err.response?.data);
      console.error('Error message:', err.message);

      const errorMessage = err.message === 'Network Error' || err.code === 'ERR_NETWORK'
        ? 'No se puede conectar al servidor'
        : err.response?.data?.error || 'Error al cargar el resumen de comisiones';
      setError(errorMessage);
    } finally {
      setLoading(false);
      console.log('=== ✅ fetchResumen completado ===');
    }
  }, [mounted]);

  useEffect(() => {
    console.log('🔵 useEffect ejecutado - mounted:', mounted);
    if (mounted) {
      console.log('🟢 Llamando a fetchResumen...');
      fetchResumen();
    } else {
      console.log('🔴 No mounted, no se llama fetchResumen');
    }
  }, [mounted, fetchResumen]);

  // Monitor de cambios en resumen
  useEffect(() => {
    console.log('🔔 Estado de resumen cambió:', {
      exists: !!resumen,
      hasUsuario: !!resumen?.usuario,
      hasConfiguracion: !!resumen?.configuracion,
      hasMesActual: !!resumen?.mes_actual
    });
  }, [resumen]);

  console.log('📊 Estado actual:', {
    mounted,
    loading,
    error: !!error,
    errorMessage: error,
    resumen: !!resumen,
    resumeKeys: resumen ? Object.keys(resumen) : []
  });

  if (!mounted) {
    console.log('⏸️ Componente no mounted, retornando null');
    return null;
  }

  if (loading) {
    console.log('⏳ Mostrando estado de loading...');
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 400, gap: 2 }}>
        <CircularProgress sx={{ color: colors.primary }} />
        <Typography sx={{ color: colors.textSecondary }}>Cargando resumen de comisión...</Typography>
      </Box>
    );
  }

  if (error) {
    console.log('❌ Mostrando error:', error);
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error" sx={{ mb: 2, fontSize: 18, fontWeight: 600 }}>
          {error}
        </Typography>
        <Typography sx={{ color: colors.textSecondary, mb: 3 }}>
          Por favor, verifica la consola (F12) para más detalles.
        </Typography>
        <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1, textAlign: 'left' }}>
          <Typography sx={{ fontFamily: 'monospace', fontSize: 12 }}>
            Estado: mounted={String(mounted)}, loading={String(loading)}, error={error || 'null'}, resumen={resumen ? 'exists' : 'null'}
          </Typography>
        </Box>
      </Box>
    );
  }

  if (!resumen) {
    console.log('❌ Resumen es null o undefined');
    console.log('❌ Valores:', { resumen, loading, error });
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error" sx={{ mb: 2, fontSize: 18, fontWeight: 600 }}>
          No se pudo cargar la información
        </Typography>
        <Typography sx={{ color: colors.textSecondary, mb: 3 }}>
          Los datos no se recibieron correctamente del servidor.
        </Typography>
        <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1, textAlign: 'left' }}>
          <Typography sx={{ fontFamily: 'monospace', fontSize: 12 }}>
            Debug: loading={String(loading)}, error={String(!!error)}, resumen={String(!!resumen)}
          </Typography>
        </Box>
      </Box>
    );
  }

  console.log('✅ Renderizando contenido completo');
  console.log('📦 Datos del resumen:', resumen);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: colors.textPrimary, fontSize: 24, mb: 0.5 }}>
          Mi Resumen de Comisión
        </Typography>
        <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: 14 }}>
          {resumen.usuario.nombre} - {resumen.usuario.email}
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Vendido"
            value={formatCurrency(resumen.mes_actual.total_ventas)}
            icon="fa-solid fa-dollar-sign"
            subtitle={`${resumen.mes_actual.cantidad_ventas} ventas`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
  <StatCard
    title="Comisión Neta"
    value={formatCurrency(resumen.mes_actual.comision_neta)}
    icon="fa-solid fa-percent"
    subtitle={`${resumen.configuracion.porcentaje_comision}% sobre ganancia`}
  />
        <Box sx={{ mt: 1, p: 1.5, bgcolor: '#F0FDF4', borderRadius: '8px', border: '1px solid #A7F3D0' }}>
          <Typography sx={{ fontSize: '11px', color: '#6B7280' }}>Base comisión (ganancia):</Typography>
          <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#059669' }}>
              {formatCurrency(resumen.mes_actual.total_ganancia ?? 0)}
          </Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Sueldo Base"
            value={formatCurrency(resumen.mes_actual.sueldo_base)}
            icon="fa-solid fa-money-bill"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total a Cobrar"
            value={formatCurrency(resumen.mes_actual.total_a_cobrar)}
            icon="fa-solid fa-wallet"
            subtitle={`${meses[(resumen.mes_actual.mes || getCurrentMonth()) - 1]} ${resumen.mes_actual.anio || getCurrentYear()}`}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Configuración */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.12)', borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '8px',
                    bgcolor: `${colors.primary}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2,
                  }}
                >
                  <i className="fa-solid fa-gear" style={{ color: colors.primary, fontSize: 20 }}></i>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: 16 }}>
                  Mi Configuración
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ color: colors.textSecondary, fontSize: 14 }}>
                    Porcentaje de comisión:
                  </Typography>
                  <Chip
                    label={`${resumen.configuracion.porcentaje_comision}%`}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(59, 130, 246, 0.1)',
                      color: '#1D4ED8',
                      fontWeight: 600
                    }}
                  />
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ color: colors.textSecondary, fontSize: 14 }}>
                    Sueldo base:
                  </Typography>
                  <Typography sx={{ fontWeight: 600, color: colors.textPrimary }}>
                    {formatCurrency(resumen.configuracion.sueldo_base)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ color: colors.textSecondary, fontSize: 14 }}>
                    Gasto publicitario:
                  </Typography>
                  <Typography sx={{ fontWeight: 600, color: colors.error }}>
                    -{formatCurrency(resumen.configuracion.gasto_publicitario)}
                  </Typography>
                </Box>

                {resumen.configuracion.observaciones && (
                  <Box sx={{ mt: 1, p: 2, bgcolor: '#F9FAFB', borderRadius: 1 }}>
                    <Typography sx={{ fontSize: 12, color: colors.textSecondary, mb: 0.5, fontWeight: 600 }}>
                      Observaciones del supervisor:
                    </Typography>
                    <Typography sx={{ fontSize: 13, color: colors.textPrimary }}>
                      {resumen.configuracion.observaciones}
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Detalle del Mes Actual */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.12)', borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '8px',
                    bgcolor: `${colors.success}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2,
                  }}
                >
                  <i className="fa-solid fa-calendar-check" style={{ color: colors.success, fontSize: 20 }}></i>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: 16 }}>
                  Mes Actual - {meses[(resumen.mes_actual.mes || getCurrentMonth()) - 1]} {resumen.mes_actual.anio || getCurrentYear()}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ color: colors.textSecondary, fontSize: 14 }}>
                    Total vendido:
                  </Typography>
                  <Typography sx={{ fontWeight: 600, color: colors.textPrimary }}>
                    {formatCurrency(resumen.mes_actual.total_ventas)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ color: colors.textSecondary, fontSize: 14 }}>
                    Cantidad de ventas:
                  </Typography>
                  <Typography sx={{ fontWeight: 600, color: colors.textPrimary }}>
                    {resumen.mes_actual.cantidad_ventas}
                  </Typography>
                </Box>

                <Box sx={{ height: 1, bgcolor: '#E5E7EB', my: 0.5 }} />

                {resumen.mes_actual.comision_bruta !== undefined && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ color: colors.textSecondary, fontSize: 14 }}>
                      Comisión bruta ({resumen.configuracion.porcentaje_comision}% sobre {formatCurrency(resumen.mes_actual.total_ganancia ?? 0)}):
                    </Typography>
                    <Typography sx={{ fontWeight: 600, color: colors.success }}>
                      {formatCurrency(resumen.mes_actual.comision_bruta)}
                    </Typography>
                  </Box>
                )}

                {resumen.mes_actual.gasto_publicitario !== undefined && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ color: colors.textSecondary, fontSize: 14 }}>
                      Gasto publicitario:
                    </Typography>
                    <Typography sx={{ fontWeight: 600, color: colors.error }}>
                      -{formatCurrency(resumen.mes_actual.gasto_publicitario)}
                    </Typography>
                  </Box>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ color: colors.textSecondary, fontSize: 14, fontWeight: 600 }}>
                    Comisión neta:
                  </Typography>
                  <Typography sx={{ fontWeight: 700, color: colors.success, fontSize: 16 }}>
                    {formatCurrency(resumen.mes_actual.comision_neta)}
                  </Typography>
                </Box>

                <Box sx={{ height: 1, bgcolor: '#E5E7EB', my: 0.5 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ color: colors.textSecondary, fontSize: 14 }}>
                    Sueldo base:
                  </Typography>
                  <Typography sx={{ fontWeight: 600, color: colors.textPrimary }}>
                    {formatCurrency(resumen.mes_actual.sueldo_base)}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    p: 2,
                    bgcolor: `${colors.primary}10`,
                    borderRadius: 1,
                    mt: 1
                  }}
                >
                  <Typography sx={{ fontSize: 15, fontWeight: 700, color: colors.textPrimary }}>
                    TOTAL A COBRAR:
                  </Typography>
                  <Typography sx={{ fontSize: 18, fontWeight: 700, color: colors.primary }}>
                    {formatCurrency(resumen.mes_actual.total_a_cobrar)}
                  </Typography>
                </Box>

                {resumen.mes_actual.observaciones_comision && (
                  <Box sx={{ mt: 1, p: 2, bgcolor: '#F9FAFB', borderRadius: 1 }}>
                    <Typography sx={{ fontSize: 12, color: colors.textSecondary, mb: 0.5, fontWeight: 600 }}>
                      Observaciones del mes:
                    </Typography>
                    <Typography sx={{ fontSize: 13, color: colors.textPrimary }}>
                      {resumen.mes_actual.observaciones_comision}
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Historial */}
        <Grid size={{ xs: 12 }}>
          <Card sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.12)', borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '8px',
                    bgcolor: `${colors.warning}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2,
                  }}
                >
                  <i className="fa-solid fa-clock-rotate-left" style={{ color: colors.warning, fontSize: 20 }}></i>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: 16 }}>
                  Historial de Comisiones
                </Typography>
              </Box>

              {resumen.historial.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography sx={{ color: colors.textSecondary }}>
                    No hay comisiones registradas todavía
                  </Typography>
                </Box>
              ) : (
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E5E7EB' }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                        <TableCell sx={{ fontWeight: 600, fontSize: 13 }}>Mes</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, fontSize: 13 }}>Ventas</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, fontSize: 13 }}>Comisión</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, fontSize: 13 }}>Sueldo</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, fontSize: 13 }}>Total</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: 13 }}>Observaciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {resumen.historial.map((h) => (
                        <TableRow key={h.id} hover>
                          <TableCell>
                            <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
                              {meses[h.mes - 1]} {h.anio}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography sx={{ fontSize: 13 }}>
                              {formatCurrency(h.total_ventas)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography sx={{ fontSize: 13, color: colors.success, fontWeight: 600 }}>
                              {formatCurrency(h.total_comision)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography sx={{ fontSize: 13 }}>
                              {formatCurrency(h.sueldo)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography sx={{ fontSize: 14, fontWeight: 700, color: colors.primary }}>
                              {formatCurrency(h.sueldo + h.total_comision)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: 13, color: colors.textSecondary }}>
                              {h.observaciones || '-'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

