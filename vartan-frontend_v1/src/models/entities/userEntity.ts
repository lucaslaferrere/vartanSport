export interface IUser {
    id: number;
    nombre: string;
    email: string;
    rol: 'dueño' | 'vendedor';
    activo: boolean;
    porcentaje_comision: number;     // Porcentaje de comisión (ej: 10 = 10%)
    gasto_publicitario: number;       // Monto fijo de gasto publicitario
    observaciones_config?: string;    // Observaciones del dueño para el vendedor (coincide con backend)
    sueldo: number;                   // Sueldo base del empleado
    fecha_creacion: string;
}