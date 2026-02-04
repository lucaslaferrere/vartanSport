import { create } from 'zustand';
import { IUser } from '../models/entities/userEntity';

interface AuthState {
    user: IUser | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (token: string, user: IUser) => void;
    logout: () => void;
    setUser: (user: IUser) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    login: (token, user) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
        }
        set({ token, user, isAuthenticated: true });
    },
    logout: () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
        set({ token: null, user: null, isAuthenticated: false });
    },
    setUser: (user) => set({ user }),
}));

// Inicializar desde localStorage
export const initializeAuth = () => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (token && userStr) {
            const user = JSON.parse(userStr);
            useAuthStore.setState({ token, user, isAuthenticated: true });
        }
    }
};