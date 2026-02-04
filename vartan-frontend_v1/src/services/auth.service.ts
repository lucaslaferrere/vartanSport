import { api } from '@libraries/api';
import { ILoginRequest, IRegisterRequest } from '@models/request/IAuthRequest';
import { ILoginResponse, IRegisterResponse } from '@models/response/IAuthResponse';
import { IUser } from '@models/entities/userEntity';

export const authService = {
    login: async (data: ILoginRequest): Promise<ILoginResponse> => {
        const response = await api.post<ILoginResponse>('/auth/login', data);
        return response.data;
    },

    register: async (data: IRegisterRequest): Promise<IRegisterResponse> => {
        const response = await api.post<IRegisterResponse>('/auth/register', data);
        return response.data;
    },

    getProfile: async (): Promise<IUser> => {
        const response = await api.get<IUser>('/api/profile');
        return response.data;
    },
};
