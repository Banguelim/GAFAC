import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import LoginModal from '@/components/login-modal';
import RegisterModal from '@/components/register-modal';
import { User, LogIn, UserPlus, LogOut } from 'lucide-react';

export default function UserMenu() {
  const { user, logout } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  if (!user) {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => setShowLoginModal(true)}>
              <LogIn className="mr-2 h-4 w-4" />
              Fazer Login
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowRegisterModal(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Criar Conta
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <LoginModal 
          isOpen={showLoginModal} 
          onClose={() => setShowLoginModal(false)}
          onRegisterClick={() => {
            setShowLoginModal(false);
            setShowRegisterModal(true);
          }}
        />
        <RegisterModal 
          isOpen={showRegisterModal} 
          onClose={() => setShowRegisterModal(false)}
          onLoginClick={() => {
            setShowRegisterModal(false);
            setShowLoginModal(true);
          }}
        />
      </>
    );
  }

  const userInitials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-10 w-10 rounded-full p-0">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs font-medium">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5 text-sm">
          <p className="font-medium">{user.name}</p>
          <p className="text-gray-500 text-xs">@{user.username}</p>
          <p className="text-gray-400 text-xs capitalize">{user.role}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
