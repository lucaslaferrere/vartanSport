'use client';
import React from 'react';
import { Box } from '@mui/material';
import { useDroppable } from '@dnd-kit/core';
import TaskColumnHeader from './TaskColumnHeader';
import TaskItem from './TaskItem';
import AddTaskInput from './AddTaskInput';
import EmptyTaskState from './EmptyTaskState';
import { ITarea } from '@models/entities/tareaEntity';

interface TaskColumnProps {
    empleadoId: number;
    empleadoNombre: string;
    tareas: ITarea[];
    onToggle: (tarea: ITarea) => void;
    onAdd: (titulo: string, descripcion?: string) => void;
    onDelete?: (id: number) => void;
    canDelete?: boolean;
    canDrag?: boolean;
    loading?: boolean;
}

export default function TaskColumn({
    empleadoId,
    empleadoNombre,
    tareas,
    onToggle,
    onAdd,
    onDelete,
    canDelete = false,
    canDrag = false,
    loading = false,
}: TaskColumnProps) {
    const totalTareas = tareas.length;
    const tareasCompletadas = tareas.filter((t) => t.completada).length;

    // Configurar como zona de drop
    const { setNodeRef, isOver } = useDroppable({
        id: empleadoId,
    });

    return (
        <Box
            ref={setNodeRef}
            sx={{
                width: '100%',
                bgcolor: isOver ? '#F0F9FF' : '#F9FAFB',
                borderRadius: '12px',
                p: 2.5,
                border: isOver ? '2px dashed #3B82F6' : '1px solid #E5E7EB',
                height: 'fit-content',
                maxHeight: { xs: 'auto', md: 'calc(100vh - 180px)' },
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.2s ease',
            }}
        >
            {/* Header */}
            <TaskColumnHeader nombre={empleadoNombre} totalTareas={totalTareas} tareasCompletadas={tareasCompletadas} />

            {/* Lista de tareas */}
            <Box sx={{ flex: 1, overflowY: 'auto', mb: 2, minHeight: 200 }}>
                {tareas.length === 0 ? (
                    <EmptyTaskState />
                ) : (
                    tareas.map((tarea) => (
                        <TaskItem
                            key={tarea.id}
                            tarea={tarea}
                            onToggle={onToggle}
                            onDelete={onDelete}
                            canDelete={canDelete}
                            canDrag={canDrag}
                        />
                    ))
                )}
            </Box>

            {/* Input para agregar tarea */}
            <AddTaskInput onAdd={onAdd} loading={loading} />
        </Box>
    );
}


