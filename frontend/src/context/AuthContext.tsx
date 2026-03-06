import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
    id: number;
    name: string;
    username: string;
    role: string;
    restaurantId?: number;
    restaurantName?: string;
}

interface AuthContextType {
    user: User | null;
    updateUser: (data: Partial<User>) => void; // Nova função
    login: (username: string, password: string, deviceId?: string, restaurantSlug?: string) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // ✅ CARREGAR USUÁRIO DO LOCALSTORAGE AO INICIAR
    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (savedUser && token) {
            try {
                setUser(JSON.parse(savedUser));
            } catch (e) {
                console.error('Dados de usuário corrompidos, limpando...', e);
                localStorage.removeItem('user');
                localStorage.removeItem('token');
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (username: string, password: string, deviceId?: string, restaurantSlug?: string) => {
        try {
            // ✅ LOGIN REAL com API Relativa (Fix para Mobile e Auto-Registro Disp)
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    password: password,
                    deviceId: deviceId,
                    deviceName: navigator.userAgent,
                    restaurantSlug: restaurantSlug // Novo Campo
                })
            });

            const data = await response.json();

            // Tratar flag de requireSlug retornada pelo backend
            if (!data.success) {
                // Se o backend pedir slug, lançamos erro com essa info extra
                if (data.requireSlug) {
                    const error: any = new Error(data.message);
                    error.requireSlug = true;
                    throw error;
                }
                throw new Error(data.message);
            }

            // ✅ GUARDAR NO LOCALSTORAGE
            localStorage.setItem('token', data.data.token);
            localStorage.setItem('user', JSON.stringify(data.data.user));
            setUser(data.data.user);

        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    const updateUser = (data: Partial<User>) => {
        setUser(prev => {
            if (!prev) return null;
            const updated = { ...prev, ...data };
            localStorage.setItem('user', JSON.stringify(updated));
            return updated;
        });
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, updateUser, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};