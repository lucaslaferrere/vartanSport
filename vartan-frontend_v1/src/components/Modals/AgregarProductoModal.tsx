'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Typography } from '@mui/material';
import BaseModal from './BaseModal';
import FormField from '@components/Forms/FormField';
import FormFieldWithAdd from '@components/Forms/FormFieldWithAdd';
import AgregarTipoProductoModal from './AgregarTipoProductoModal';
import AgregarEquipoModal from './AgregarEquipoModal';
import { IProductoCreateRequest } from '@models/request/IProductoRequest';
import { TALLES_OPTIONS } from '@models/enums/TalleEnum';
import { COLORES_OPTIONS } from '@models/enums/ColorEnum';
import { ITipoProducto, IEquipo } from '@models/entities/catalogoEntity';
import { productoService } from '@services/producto.service';
import { tipoProductoService, equipoService } from '@services/catalogo.service';
import { useNotification } from '@components/Notifications';

interface AgregarProductoModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AgregarProductoModal({ open, onClose, onSuccess }: AgregarProductoModalProps) {
  const { addNotification } = useNotification();
  const [formData, setFormData] = useState<IProductoCreateRequest>({
    nombre: '',
    costo_unitario: 0,
    talles: [],
    colores: [],
    tipo_producto_id: undefined,
    equipo_id: undefined
  });
  const [tiposProducto, setTiposProducto] = useState<ITipoProducto[]>([]);
  const [equipos, setEquipos] = useState<IEquipo[]>([]);
  const [selectedTipoProducto, setSelectedTipoProducto] = useState<ITipoProducto | null>(null);
  const [selectedEquipo, setSelectedEquipo] = useState<IEquipo | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingCatalogos, setLoadingCatalogos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tipoProductoModalOpen, setTipoProductoModalOpen] = useState(false);
  const [equipoModalOpen, setEquipoModalOpen] = useState(false);

  const loadCatalogos = useCallback(async () => {
    setLoadingCatalogos(true);
    try {
      const [tiposData, equiposData] = await Promise.all([
        tipoProductoService.getAll(),
        equipoService.getAll()
      ]);
      setTiposProducto(tiposData.filter(t => t.activo));
      setEquipos(equiposData.filter(e => e.activo));
    } catch (err) {
      console.error('Error cargando catálogos:', err);
      addNotification('Error al cargar las categorías', 'error');
    } finally {
      setLoadingCatalogos(false);
    }
  }, [addNotification]);

  useEffect(() => {
    if (open) {
      loadCatalogos();
    }
  }, [open, loadCatalogos]);

  const handleSubmit = async () => {
    setError(null);

    if (!formData.nombre.trim()) {
      setError('El nombre del producto es requerido');
      return;
    }

    if (formData.costo_unitario <= 0) {
      setError('El costo unitario debe ser mayor a 0');
      return;
    }

    if (!formData.talles || formData.talles.length === 0) {
      setError('Debe seleccionar al menos un talle');
      return;
    }

    if (!formData.colores || formData.colores.length === 0) {
      setError('Debe seleccionar al menos un color');
      return;
    }

    setLoading(true);

    try {
      await productoService.create(formData);
      handleClose();
      onSuccess();
    } catch (err) {
      console.error('Error creando producto:', err);
      addNotification('Error al crear el producto', 'error');
      setError('Error al crear el producto. Inténtelo nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      nombre: '',
      costo_unitario: 0,
      talles: [],
      colores: [],
      tipo_producto_id: undefined,
      equipo_id: undefined
    });
    setSelectedTipoProducto(null);
    setSelectedEquipo(null);
    setError(null);
    onClose();
  };

  const handleTipoProductoChange = (newValue: ITipoProducto | null) => {
    setSelectedTipoProducto(newValue);
    setFormData(prev => ({
      ...prev,
      tipo_producto_id: newValue ? newValue.id : undefined
    }));
  };

  const handleEquipoChange = (newValue: IEquipo | null) => {
    setSelectedEquipo(newValue);
    setFormData(prev => ({
      ...prev,
      equipo_id: newValue ? newValue.id : undefined
    }));
  };

  const handleTipoProductoSuccess = () => {
    loadCatalogos();
    setTipoProductoModalOpen(false);
    addNotification('Tipo de producto agregado exitosamente', 'success');
  };

  const handleEquipoSuccess = () => {
    loadCatalogos();
    setEquipoModalOpen(false);
    addNotification('Equipo agregado exitosamente', 'success');
  };

  return (
    <>
      <BaseModal
        title="Agregar Producto"
        open={open}
        onClose={handleClose}
        onSubmit={handleSubmit}
        submitText="Agregar"
        isLoading={loading}
        error={error}
      >
        <FormField
          label="Nombre del Producto"
          required
          placeholder="Ingrese el nombre del producto"
          value={formData.nombre}
          onChange={(value) => {
            setFormData(prev => ({ ...prev, nombre: value }));
            if (error) setError(null);
          }}
          error={!!error && !formData.nombre.trim()}
        />

        <FormFieldWithAdd
          label="Tipo de Producto"
          placeholder="Seleccione el tipo de producto"
          value={selectedTipoProducto}
          onChange={handleTipoProductoChange}
          options={tiposProducto}
          getOptionLabel={(option) => option.nombre}
          loading={loadingCatalogos}
          onAddNew={() => setTipoProductoModalOpen(true)}
          addButtonTooltip="Agregar nuevo tipo de producto"
        />

        <FormFieldWithAdd
          label="Equipo"
          placeholder="Seleccione el equipo"
          value={selectedEquipo}
          onChange={handleEquipoChange}
          options={equipos}
          getOptionLabel={(option) => option.nombre}
          loading={loadingCatalogos}
          onAddNew={() => setEquipoModalOpen(true)}
          addButtonTooltip="Agregar nuevo equipo"
        />

        <FormField
          label="Costo Unitario"
          required
          type="number"
          placeholder="0.00"
          value={formData.costo_unitario || ''}
          onChange={(value) => {
            setFormData(prev => ({ ...prev, costo_unitario: value }));
            if (error) setError(null);
          }}
          error={!!error && formData.costo_unitario <= 0}
          startAdornment={<Typography sx={{ mr: 1, color: '#9CA3AF', fontSize: '14px' }}>$</Typography>}
          inputProps={{ min: 0, step: 0.01 }}
        />

        <FormField
          label="Talles"
          required
          type="multiselect"
          placeholder="Seleccione los talles disponibles"
          value={formData.talles}
          onChange={(value) => {
            setFormData(prev => ({ ...prev, talles: value || [] }));
            if (error) setError(null);
          }}
          options={TALLES_OPTIONS}
          getOptionLabel={(option) => option}
          error={!!error && (!formData.talles || formData.talles.length === 0)}
        />

        <FormField
          label="Colores"
          required
          type="multiselect"
          placeholder="Seleccione los colores disponibles"
          value={formData.colores}
          onChange={(value) => {
            setFormData(prev => ({ ...prev, colores: value || [] }));
            if (error) setError(null);
          }}
          options={COLORES_OPTIONS}
          getOptionLabel={(option) => option}
          error={!!error && (!formData.colores || formData.colores.length === 0)}
        />
      </BaseModal>

      {/* Modales para agregar categorías */}
      <AgregarTipoProductoModal
        open={tipoProductoModalOpen}
        onClose={() => setTipoProductoModalOpen(false)}
        onSuccess={handleTipoProductoSuccess}
      />

      <AgregarEquipoModal
        open={equipoModalOpen}
        onClose={() => setEquipoModalOpen(false)}
        onSuccess={handleEquipoSuccess}
      />
    </>
  );
}
