import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { LogIn, Eye, EyeOff } from 'lucide-react';

const loginSchema = z.object({
  username: z.string().min(1, 'Nome de usuário é obrigatório'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterClick: () => void;
}

export default function LoginModal({ isOpen, onClose, onRegisterClick }: LoginModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
      reset();
      onClose();
    } catch (error) {
      // Erro já tratado no AuthProvider
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LogIn className="h-5 w-5" />
            Fazer Login
          </DialogTitle>
          <DialogDescription>
            Entre com suas credenciais para acessar o sistema
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Nome de usuário</Label>
            <Input
              id="username"
              placeholder="Digite seu nome de usuário"
              {...register('username')}
              error={errors.username?.message}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Digite sua senha"
                {...register('password')}
                error={errors.password?.message}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
            
            <div className="text-center text-sm text-gray-600">
              Não tem uma conta?{' '}
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto"
                onClick={onRegisterClick}
              >
                Criar conta
              </Button>
            </div>
          </div>
        </form>

        {/* Credenciais de demonstração */}
        <div className="border-t pt-4 mt-4">
          <p className="text-xs text-gray-500 mb-2">Contas de demonstração:</p>
          <div className="text-xs space-y-1 text-gray-600">
            <div><strong>Admin:</strong> admin / admin123</div>
            <div><strong>Vendedor:</strong> vendedor1 / vend123</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
