
'use client';

import React from 'react';
import { Box, Typography, Select, MenuItem, FormControl } from '@mui/material';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import TaskColumn from './TaskColumn';
import TaskItem from './TaskItem';
import { ITarea, IEmpleado } from '@models/entities/tareaEntity';
import { useAuthStore } from '@libraries/store';

interface TaskBoardProps {
    empleados: IEmpleado[];
    tareasPorEmpleado: Map<number, ITarea[]>;
    onToggle: (tarea: ITarea) => void;
    onAdd: (empleadoId: number, titulo: string, descripcion?: string) => void;
    onDelete: (id: number) => void;
    onMoveTask?: (tareaId: number, newEmpleadoId: number) => void;
    loading: boolean;
    filtro: 'todas' | 'pendientes' | 'completadas';
    onFiltroChange: (filtro: 'todas' | 'pendientes' | 'completadas') => void;
}

export default function TaskBoard({
    empleados,
    tareasPorEmpleado,
    onToggle,
    onAdd,
    onDelete,
    onMoveTask,
    loading,
    filtro,
    onFiltroChange,
}: TaskBoardProps) {
    const { user } = useAuthStore();
    const isDueno = user?.rol === 'dueño';
    const [activeTarea, setActiveTarea] = React.useState<ITarea | null>(null);

    // Configurar sensores para drag and drop
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Requiere mover 8px antes de activar el drag
            },
        })
    );

    const aplicarFiltro = (tareas: ITarea[]) => {
        switch (filtro) {
            case 'pendientes':
                return tareas.filter((t) => !t.completada);
            case 'completadas':
                return tareas.filter((t) => t.completada);
            default:
                return tareas;
        }
    };

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        // Buscar la tarea que se está arrastrando
        for (const [_, tareas] of tareasPorEmpleado) {
            const tarea = tareas.find(t => t.id === active.id);
            if (tarea) {
                setActiveTarea(tarea);
                break;
            }
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        setActiveTarea(null);

        if (!over || !onMoveTask) return;

        const tareaId = active.id as number;
        const newEmpleadoId = over.id as number;

        // Buscar el empleado actual de la tarea
        let currentEmpleadoId: number | null = null;
        for (const [empleadoId, tareas] of tareasPorEmpleado) {
            if (tareas.some(t => t.id === tareaId)) {
                currentEmpleadoId = empleadoId;
                break;
            }
        }

        // Solo mover si cambió de empleado
        if (currentEmpleadoId !== null && currentEmpleadoId !== newEmpleadoId) {
            onMoveTask(tareaId, newEmpleadoId);
        }
    };

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <Box>
                {/* Filtros */}
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>
                        {isDueno ? 'Todas las Tareas' : 'Mis Tareas'}
                    </Typography>

                    <FormControl size="small">
                        <Select
                            value={filtro}
                            onChange={(e) => onFiltroChange(e.target.value as typeof filtro)}
                            sx={{
                                fontSize: '14px',
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E5E7EB' },
                                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#D1D5DB' },
                            }}
                        >
                            <MenuItem value="todas">Todas</MenuItem>
                            <MenuItem value="pendientes">Pendientes</MenuItem>
                            <MenuItem value="completadas">Completadas</MenuItem>
                        </Select>
                    </FormControl>
                </Box>

                {/* Grid Responsive - 3 columnas en pantallas grandes */}
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                            xs: '1fr',
                            sm: 'repeat(2, 1fr)',
                            md: 'repeat(2, 1fr)',
                            lg: 'repeat(3, 1fr)',
                            xl: 'repeat(3, 1fr)',
                        },
                        gap: 3,
                        pb: 2,
                    }}
                >
                    {empleados.map((empleado) => {
                        const tareas = tareasPorEmpleado.get(empleado.id) || [];
                        const tareasFiltradas = aplicarFiltro(tareas);

                        return (
                            <TaskColumn
                                key={empleado.id}
                                empleadoId={empleado.id}
                                empleadoNombre={empleado.nombre}
                                tareas={tareasFiltradas}
                                onToggle={onToggle}
                                onAdd={(titulo, descripcion) => onAdd(empleado.id, titulo, descripcion)}
                                onDelete={onDelete}
                                canDelete={isDueno}
                                canDrag={isDueno}
                                loading={loading}
                            />
                        );
                    })}
                </Box>
            </Box>

            {/* Overlay que se muestra mientras se arrastra */}
            <DragOverlay>
                {activeTarea ? (
                    <Box sx={{
                        opacity: 0.8,
                        transform: 'rotate(5deg)',
                        cursor: 'grabbing'
                    }}>
                        <TaskItem
                            tarea={activeTarea}
                            onToggle={() => {}}
                            canDelete={false}
                            canDrag={false}
                        />
                    </Box>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
