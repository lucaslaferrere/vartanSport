import { IUser } from '../entities/userEntity';

export interface ILoginResponse {
    token: string;
    usuario: IUser;
}

export interface IRegisterResponse {
    message: string;
    usuario: IUser;
}