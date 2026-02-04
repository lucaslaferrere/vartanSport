import {IWorkflowTaskInstanceGetResponse} from "@/models/response/tasks/iWorkflowTaskInstanceResponse";
import {IWorkflowTaskTemplateSearchResponse} from "@/models/response/tasks/iWorkflowTaskTemplateResponse";

export function SortWorkflowInstanceTasks(tasks: IWorkflowTaskInstanceGetResponse[]): IWorkflowTaskInstanceGetResponse[] {
    const dependencyCount: Record<string, number> = tasks.reduce((acc, task) => {
        acc[task.id] = task.dependencies.length;
        return acc;
    }, {} as Record<string, number>);

    const sortedTasks: IWorkflowTaskInstanceGetResponse[] = [];
    const independentTasks: IWorkflowTaskInstanceGetResponse[] = tasks.filter(task => task.dependencies.length === 0);

    while (independentTasks.length > 0) {
        const task = independentTasks.shift()!;
        sortedTasks.push(task);

        // Busca las tareas que dependían de la tarea actual (task.id es la fuente de la dependencia)
        for (const dependentTask of tasks.filter(t => t.dependencies.some(dep => dep.sourceId === task.id))) {
            dependencyCount[dependentTask.id]--;

            // Si una tarea ya no tiene dependencias, la añadimos a la cola
            if (dependencyCount[dependentTask.id] === 0) {
                independentTasks.push(dependentTask);
            }
        }
    }
    return sortedTasks;
}

export function SortWorkflowTemplateTasks(tasks: IWorkflowTaskTemplateSearchResponse[]): IWorkflowTaskTemplateSearchResponse[] {
    const dependencyCount: Record<string, number> = tasks.reduce((acc, task) => {
        acc[task.id] = task.dependencies.length;
        return acc;
    }, {} as Record<string, number>);

    const sortedTasks: IWorkflowTaskTemplateSearchResponse[] = [];
    const independentTasks: IWorkflowTaskTemplateSearchResponse[] = tasks.filter(task => task.dependencies.length === 0);

    while (independentTasks.length > 0) {
        const task = independentTasks.shift()!;
        sortedTasks.push(task);

        // Busca las tareas que dependían de la tarea actual (task.id es la fuente de la dependencia)
        for (const dependentTask of tasks.filter(t => t.dependencies.some(dep => dep.sourceId === task.id))) {
            dependencyCount[dependentTask.id]--;

            // Si una tarea ya no tiene dependencias, la añadimos a la cola
            if (dependencyCount[dependentTask.id] === 0) {
                independentTasks.push(dependentTask);
            }
        }
    }
    return sortedTasks;
}