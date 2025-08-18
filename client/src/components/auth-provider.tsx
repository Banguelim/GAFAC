import { ReactNode, useEffect, useState } from 'react';
import { AuthContext, useLogin, useRegister, useCurrentUser, logout, type AuthUser, type LoginCredentials, type RegisterData } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const { data: currentUser, isLoading } = useCurrentUser();
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const { toast } = useToast();

  useEffect(() => {
    setUser(currentUser || null);
  }, [currentUser]);

  const login = async (credentials: LoginCredentials) => {
    try {
      const user = await loginMutation.mutateAsync(credentials);
      setUser(user);
      toast({
        title: "Login realizado com sucesso!",
        description: `Bem-vindo, ${user.name}`,
      });
    } catch (error) {
      toast({
        title: "Erro no login",
        description: error instanceof Error ? error.message : "Credenciais inválidas",
        variant: "destructive",
      });
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      await registerMutation.mutateAsync(data);
      toast({
        title: "Conta criada com sucesso!",
        description: "Agora você pode fazer login",
      });
    } catch (error) {
      toast({
        title: "Erro ao criar conta",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    toast({
      title: "Logout realizado",
      description: "Até logo!",
    });
  };

  const value = {
    user,
    login,
    logout: handleLogout,
    register,
    isLoading: isLoading || loginMutation.isPending || registerMutation.isPending,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
