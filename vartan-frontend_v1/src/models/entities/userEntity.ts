export interface IUser {
    id: number;
    nombre: string;
    email: string;
    rol: 'dueño' | 'vendedor';
    activo: boolean;
    fecha_creacion: string;
}