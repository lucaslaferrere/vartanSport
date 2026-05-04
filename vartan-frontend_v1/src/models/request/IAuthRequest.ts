export interface ILoginRequest {
    email: string;
    password: string;
}

export interface IRegisterRequest {
    nombre: string;
    email: string;
    password: string;
    rol: 'dueño' | 'vendedor' | 'demo' | 'repositor';
}