
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Home, 
  Receipt, 
  CreditCard, 
  Tags, 
  BarChart2, 
  Settings, 
  Users,
  LogOut,
  Menu,
  X,
  BookOpen,
  RotateCcw,
  User
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Transações', href: '/transacoes', icon: Receipt },
    { name: 'Recorrentes', href: '/recorrentes', icon: RotateCcw },
    { name: 'Contatos', href: '/contatos', icon: Users },
    { name: 'Centro de Custos', href: '/centro-custos', icon: Tags },
    { name: 'Categorias', href: '/categorias', icon: BookOpen },
  ];
  
  const handleSignOut = () => {
    signOut();
    navigate('/login');
  };

  if (!user) return null;

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile navigation */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden fixed top-4 left-4 z-50">
            <Menu />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="bg-gray-900 text-white border-0 max-w-[250px] p-0">
          <div className="flex items-center justify-center h-16 p-4 border-b border-gray-700">
            <h1 className="text-lg font-bold">Finance B2B</h1>
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-4 top-4 text-white hover:bg-gray-800"
              onClick={() => setOpen(false)}
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Close menu</span>
            </Button>
          </div>
          <nav className="flex flex-col h-full">
            <div className="flex-1 py-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="flex items-center px-4 py-3 text-sm hover:bg-gray-800"
                  onClick={() => setOpen(false)}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              ))}
            </div>
            <div className="p-4 border-t border-gray-700">
              <div className="flex items-center">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user?.avatar_url} alt={user?.nome_completo || 'User'} />
                  <AvatarFallback>{getInitials(user?.nome_completo || '')}</AvatarFallback>
                </Avatar>
                <div className="ml-3">
                  <p className="text-sm font-medium">{user?.nome_completo}</p>
                  <p className="text-xs text-gray-400">{user?.email}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                className="w-full mt-4 py-2 flex items-center justify-center text-white hover:bg-gray-800"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </nav>
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-1 min-h-0 bg-gray-900">
          <div className="flex items-center justify-center h-16 px-4 bg-gray-800">
            <h1 className="text-lg font-bold text-white">Finance B2B</h1>
          </div>
          <div className="flex flex-col flex-1 overflow-y-auto">
            <nav className="flex-1 px-2 py-4 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "group flex items-center px-3 py-3 text-sm font-medium rounded-md text-white",
                    location.pathname === item.href 
                      ? "bg-gray-800 text-white" 
                      : "text-gray-300 hover:bg-gray-700"
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.name}
                </Link>
              ))}
            </nav>
            <div className="flex-shrink-0 p-4 border-t border-gray-700">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start px-3 py-2 text-white hover:bg-gray-700">
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarImage src={user?.avatar_url} alt={user?.nome_completo || 'User'} />
                      <AvatarFallback>{getInitials(user?.nome_completo || '')}</AvatarFallback>
                    </Avatar>
                    <span className="truncate">{user?.nome_completo}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user?.nome_completo}</p>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/perfil" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Meu Perfil</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onSelect={handleSignOut}
                    className="cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64">
        <main className="py-6 px-4 sm:px-6 md:px-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
