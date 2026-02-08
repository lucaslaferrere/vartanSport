'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import TaskBoard from '@components/Tareas/TaskBoard';
import ConfirmModal from '@components/Modals/ConfirmModal';
import { ITarea, IEmpleado } from '@models/entities/tareaEntity';
import { tareaService } from '@services/tarea.service';
import { useTaskManager } from '@hooks/useTaskManager';
import { useAuthStore } from '@libraries/store';
import { useNotification } from '@components/Notifications';
import { useMounted } from '@hooks/useMounted';

export default function TareasPage() {
    const mounted = useMounted();
    const { user } = useAuthStore();
    const { addNotification } = useNotification();
    const { createTask, toggleTaskStatus, deleteTask, loading: taskLoading } = useTaskManager();

    const [tareas, setTareas] = useState<ITarea[]>([]);
    const [empleados, setEmpleados] = useState<IEmpleado[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filtro, setFiltro] = useState<'todas' | 'pendientes' | 'completadas'>('todas');
    const [tareaAEliminar, setTareaAEliminar] = useState<number | null>(null);

    const loadData = useCallback(async () => {
        if (!mounted) return;

        setLoading(true);
        setError(null);

        try {
            const tareasData = await tareaService.getAll();
            setTareas(tareasData || []); // Asegurar que sea array

            // Si es dueño, cargar lista de empleados
            if (user?.rol === 'dueño') {
                const empleadosData = await tareaService.getEmpleados();
                setEmpleados(empleadosData || []); // Asegurar que sea array
            } else if (user) {
                // Si es vendedor, crear lista con solo el usuario actual
                setEmpleados([
                    {
                        id: user.id,
                        nombre: user.nombre,
                        email: user.email,
                    },
                ]);
            }
        } catch (err) {
            console.error('Error cargando tareas:', err);
            setError('Error al cargar las tareas');
            addNotification('Error al cargar las tareas', 'error');
        } finally {
            setLoading(false);
        }
    }, [mounted, user, addNotification]);

    useEffect(() => {
        if (mounted && user) {
            loadData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mounted, user]);

    const handleToggle = async (tarea: ITarea) => {
        // Optimistic update
        setTareas((prev) =>
            prev.map((t) => (t.id === tarea.id ? { ...t, completada: !t.completada } : t))
        );

        const result = await toggleTaskStatus(tarea);

        if (!result) {
            // Revertir si falla
            setTareas((prev) =>
                prev.map((t) => (t.id === tarea.id ? { ...t, completada: tarea.completada } : t))
            );
        }
    };

    const handleAdd = async (empleadoId: number, titulo: string, descripcion?: string) => {
        const tempId = -Date.now();
        const empleado = empleados.find(e => e.id === empleadoId);
        const tempTask: ITarea = {
            id: tempId,
            titulo,
            descripcion: descripcion || '',
            completada: false,
            empleado_id: user?.rol === 'dueño' ? empleadoId : user?.id || 0,
            empleado_nombre: empleado?.nombre || user?.nombre || '',
            fecha_creacion: new Date().toISOString(),
            fecha_actualizacion: new Date().toISOString(),
        };

        // Actualización optimista: mostrar la tarea inmediatamente
        setTareas((prev) => [...prev, tempTask]);

        // Crear la tarea en el servidor en segundo plano
        const newTask = await createTask({
            titulo,
            descripcion,
            empleado_id: user?.rol === 'dueño' ? empleadoId : user?.id,
        });

        if (newTask) {
            // Reemplazar la tarea temporal con la real del servidor
            setTareas((prev) => prev.map(t => t.id === tempId ? newTask : t));
        } else {
            // Si falla, remover la tarea temporal
            setTareas((prev) => prev.filter(t => t.id !== tempId));
        }
    };

    const handleDelete = async () => {
        if (!tareaAEliminar) return;

        const success = await deleteTask(tareaAEliminar);

        if (success) {
            setTareas((prev) => prev.filter((t) => t.id !== tareaAEliminar));
        }

        setTareaAEliminar(null);
    };

    const handleMoveTask = async (tareaId: number, newEmpleadoId: number) => {
        // Actualización optimista
        setTareas((prev) =>
            prev.map((t) =>
                t.id === tareaId
                    ? { ...t, empleado_id: newEmpleadoId, empleado_nombre: empleados.find(e => e.id === newEmpleadoId)?.nombre || '' }
                    : t
            )
        );

        // Actualizar en el servidor
        try {
            await tareaService.update(tareaId, { empleado_id: newEmpleadoId });
            addNotification('Tarea reasignada exitosamente', 'success');
        } catch (error) {
            console.error('Error reasignando tarea:', error);
            addNotification('Error al reasignar la tarea', 'error');
            // Revertir el cambio
            loadData();
        }
    };

    // Agrupar tareas por empleado - con validación
    const tareasPorEmpleado = new Map<number, ITarea[]>();
    if (empleados && empleados.length > 0 && tareas) {
        empleados.forEach((empleado) => {
            const tareasFiltradas = tareas.filter((t) => t.empleado_id === empleado.id);
            tareasPorEmpleado.set(empleado.id, tareasFiltradas);
        });
    }

    if (!mounted || !user) return null;

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <CircularProgress />
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
            <Box sx={{ p: 3 }}>
                <TaskBoard
                    empleados={empleados}
                    tareasPorEmpleado={tareasPorEmpleado}
                    onToggle={handleToggle}
                    onAdd={handleAdd}
                    onDelete={(id) => setTareaAEliminar(id)}
                    onMoveTask={handleMoveTask}
                    loading={taskLoading}
                    filtro={filtro}
                    onFiltroChange={setFiltro}
                />
            </Box>

            {/* Modal de confirmación para eliminar */}
            <ConfirmModal
                open={!!tareaAEliminar}
                onClose={() => setTareaAEliminar(null)}
                onConfirm={handleDelete}
                title="Eliminar tarea"
                message="¿Estás seguro de que deseas eliminar esta tarea? Esta acción no se puede deshacer."
                confirmText="Eliminar"
            />
        </>
    );
}