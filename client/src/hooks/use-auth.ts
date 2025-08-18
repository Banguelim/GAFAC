import { createContext, useContext } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { User } from '@shared/schema';

// Tipos para autenticação
export interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'vendor';
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  password: string;
  name: string;
  role?: 'vendor';
}

// Context de autenticação
export interface AuthContextType {
  user: AuthUser | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  register: (data: RegisterData) => Promise<void>;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

// Hook para usar o contexto de autenticação
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

// Hook para login
export function useLogin() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (credentials: LoginCredentials): Promise<AuthUser> => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao fazer login');
      }

      const data = await response.json();
      return data.user;
    },
    onSuccess: (user) => {
      // Armazena no localStorage
      localStorage.setItem('authUser', JSON.stringify(user));
      // Invalida queries para refrescar dados
      queryClient.invalidateQueries();
    },
  });
}

// Hook para registro
export function useRegister() {
  return useMutation({
    mutationFn: async (data: RegisterData): Promise<User> => {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          role: data.role || 'vendor',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar conta');
      }

      return response.json();
    },
  });
}

// Hook para verificar usuário atual
export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: (): AuthUser | null => {
      const stored = localStorage.getItem('authUser');
      return stored ? JSON.parse(stored) : null;
    },
    staleTime: Infinity, // Só revalida quando necessário
  });
}

// Função para logout
export function logout() {
  localStorage.removeItem('authUser');
  window.location.reload(); // Força refresh da página
}
