import { useState, useCallback } from 'react';
import { ITarea } from '@models/entities/tareaEntity';
import { ITareaCreateRequest, ITareaUpdateRequest } from '@models/request/ITareaRequest';
import { tareaService } from '@services/tarea.service';
import { useNotification } from '@components/Notifications';

export function useTaskManager() {
    const { addNotification } = useNotification();
    const [loading, setLoading] = useState(false);

    const createTask = useCallback(async (data: ITareaCreateRequest): Promise<ITarea | null> => {
        setLoading(true);
        try {
            const newTask = await tareaService.create(data);
            addNotification('Tarea creada exitosamente', 'success');
            return newTask;
        } catch (error) {
            console.error('Error creando tarea:', error);
            addNotification('Error al crear la tarea', 'error');
            return null;
        } finally {
            setLoading(false);
        }
    }, [addNotification]);

    const updateTask = useCallback(async (id: number, data: ITareaUpdateRequest): Promise<ITarea | null> => {
        setLoading(true);
        try {
            const updatedTask = await tareaService.update(id, data);
            return updatedTask;
        } catch (error) {
            console.error('Error actualizando tarea:', error);
            addNotification('Error al actualizar la tarea', 'error');
            return null;
        } finally {
            setLoading(false);
        }
    }, [addNotification]);

    const toggleTaskStatus = useCallback(async (task: ITarea): Promise<ITarea | null> => {
        return updateTask(task.id, { completada: !task.completada });
    }, [updateTask]);

    const deleteTask = useCallback(async (id: number): Promise<boolean> => {
        setLoading(true);
        try {
            await tareaService.delete(id);
            addNotification('Tarea eliminada', 'success');
            return true;
        } catch (error) {
            console.error('Error eliminando tarea:', error);
            addNotification('Error al eliminar la tarea', 'error');
            return false;
        } finally {
            setLoading(false);
        }
    }, [addNotification]);

    return {
        loading,
        createTask,
        updateTask,
        toggleTaskStatus,
        deleteTask,
    };
}