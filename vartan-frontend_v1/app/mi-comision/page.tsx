'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Box, Typography, Grid, CircularProgress, Divider, Paper, Select, MenuItem, FormControl, InputLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Card, CardContent } from '@mui/material';
import { colors } from '@/src/theme/colors';
import { comisionService, IMiResumenComision } from '@services/comision.service';
import { useMounted } from '@hooks/useMounted';

const formatCurrency = (value: number) => '$' + value.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function MiComisionPage() {
  const mounted = useMounted();
  const [resumen, setResumen] = useState<IMiResumenComision | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMes, setLoadingMes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMes, setSelectedMes] = useState(new Date().getMonth() + 1);
  const [selectedAnio, setSelectedAnio] = useState(new Date().getFullYear());
  const isFirstLoad = useRef(true);

  const currentAnio = new Date().getFullYear();

  useEffect(() => {
    if (!mounted) return;

    let cancelled = false;

    const fetch = async () => {
      if (isFirstLoad.current) {
        setLoading(true);
      } else {
        setLoadingMes(true);
      }
      setError(null);

      try {
        const data = await comisionService.getMiResumen(selectedMes, selectedAnio);
        if (!cancelled) setResumen(data);
      } catch (err: any) {
        if (!cancelled && isFirstLoad.current) {
          setError(err.response?.data?.error || 'Error al cargar el resumen de comisiones');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingMes(false);
          isFirstLoad.current = false;
        }
      }
    };

    fetch();
    return () => { cancelled = true; };
  }, [mounted, selectedMes, selectedAnio]);

  const availableYears = useMemo(() => {
    if (!resumen) return [currentAnio];
    const years = new Set([currentAnio, ...resumen.historial.map(h => h.anio)]);
    return [...years].sort((a, b) => b - a);
  }, [resumen, currentAnio]);

  if (!mounted) return null;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress sx={{ color: colors.primary }} />
      </Box>
    );
  }

  if (error || !resumen) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error">{error || 'No se pudo cargar la información'}</Typography>
      </Box>
    );
  }

  const rows = [
    { label: 'Facturación', value: formatCurrency(resumen.mes_actual.total_ventas), color: '#1F2937' },
    { label: 'Cantidad de ventas', value: String(resumen.mes_actual.cantidad_ventas), color: '#1F2937' },
    { label: 'Comisión vendedor', value: formatCurrency(resumen.mes_actual.comision_neta), color: '#059669' },
    { label: 'Bonos', value: formatCurrency(resumen.mes_actual.sueldo_base), color: '#1F2937' },
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1F2937', fontSize: 24, mb: 0.5 }}>
            Mi Comisión
          </Typography>
          <Typography variant="body2" sx={{ color: '#6B7280', fontSize: 14 }}>
            {resumen.usuario.nombre} — {meses[selectedMes - 1]} {selectedAnio}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Mes</InputLabel>
            <Select value={selectedMes} label="Mes" onChange={(e) => setSelectedMes(Number(e.target.value))}>
              {meses.map((m, i) => <MenuItem key={i + 1} value={i + 1}>{m}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 90 }}>
            <InputLabel>Año</InputLabel>
            <Select value={selectedAnio} label="Año" onChange={(e) => setSelectedAnio(Number(e.target.value))}>
              {availableYears.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Tarjeta resumen */}
      <Paper
        elevation={0}
        sx={{ borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden', maxWidth: 420, mb: 4, opacity: loadingMes ? 0.5 : 1, transition: 'opacity 0.15s' }}
      >
        <Box sx={{ px: 3, py: 2, bgcolor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
          <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#1F2937' }}>
            Resumen — {meses[selectedMes - 1]} {selectedAnio}
          </Typography>
        </Box>
        <Box sx={{ px: 3, py: 1.5, display: 'flex', flexDirection: 'column' }}>
          {rows.map((row, i) => (
            <Box key={i}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.25 }}>
                <Typography sx={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>{row.label}</Typography>
                <Typography sx={{ fontSize: '13px', fontWeight: 600, color: row.color, ml: 1 }}>{row.value}</Typography>
              </Box>
              {i < rows.length - 1 && <Divider />}
            </Box>
          ))}
        </Box>
        <Box sx={{ mx: 3, mb: 2.5, mt: 0.5, p: 2, bgcolor: `${colors.primary}10`, borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#1F2937' }}>TOTAL A COBRAR</Typography>
          <Typography sx={{ fontSize: '16px', fontWeight: 700, color: colors.primary }}>{formatCurrency(resumen.mes_actual.total_a_cobrar)}</Typography>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Configuración */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.12)', borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ width: 40, height: 40, borderRadius: '8px', bgcolor: `${colors.primary}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2 }}>
                  <i className="fa-solid fa-gear" style={{ color: colors.primary, fontSize: 20 }}></i>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: 16 }}>Mi Configuración</Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ color: '#6B7280', fontSize: 14 }}>Porcentaje de comisión:</Typography>
                  <Typography sx={{ fontWeight: 600, color: colors.primary }}>{resumen.configuracion.porcentaje_comision}%</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ color: '#6B7280', fontSize: 14 }}>Bonos:</Typography>
                  <Typography sx={{ fontWeight: 600, color: '#1F2937' }}>{formatCurrency(resumen.configuracion.sueldo_base)}</Typography>
                </Box>
                {resumen.configuracion.observaciones && (
                  <Box sx={{ mt: 1, p: 2, bgcolor: '#F9FAFB', borderRadius: 1 }}>
                    <Typography sx={{ fontSize: 12, color: '#6B7280', mb: 0.5, fontWeight: 600 }}>Observaciones:</Typography>
                    <Typography sx={{ fontSize: 13, color: '#374151' }}>{resumen.configuracion.observaciones}</Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Historial */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.12)', borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Box sx={{ width: 40, height: 40, borderRadius: '8px', bgcolor: `${colors.warning}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2 }}>
                  <i className="fa-solid fa-clock-rotate-left" style={{ color: colors.warning, fontSize: 20 }}></i>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: 16 }}>Historial de Comisiones</Typography>
              </Box>
              {resumen.historial.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography sx={{ color: '#6B7280' }}>No hay comisiones registradas todavía</Typography>
                </Box>
              ) : (
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E5E7EB' }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                        <TableCell sx={{ fontWeight: 600, fontSize: 13 }}>Mes</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, fontSize: 13 }}>Ventas</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, fontSize: 13 }}>Comisión</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, fontSize: 13 }}>Bonos</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, fontSize: 13 }}>Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {resumen.historial.map((h) => (
                        <TableRow
                          key={h.id}
                          hover
                          onClick={() => { setSelectedMes(h.mes); setSelectedAnio(h.anio); }}
                          sx={{ cursor: 'pointer', ...(selectedMes === h.mes && selectedAnio === h.anio ? { bgcolor: `${colors.primary}08` } : {}) }}
                        >
                          <TableCell>
                            <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{meses[h.mes - 1]} {h.anio}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography sx={{ fontSize: 13 }}>{formatCurrency(h.total_ventas)}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography sx={{ fontSize: 13, color: '#059669', fontWeight: 600 }}>{formatCurrency(h.total_comision)}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography sx={{ fontSize: 13 }}>{formatCurrency(h.sueldo)}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography sx={{ fontSize: 14, fontWeight: 700, color: colors.primary }}>{formatCurrency(h.sueldo + h.total_comision)}</Typography>
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
