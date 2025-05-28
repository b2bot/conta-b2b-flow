import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  Home,
  CreditCard,
  ListOrdered,
  FileText,
  Users,
  Menu,
  X,
  Plus,
  Search,
  LogOut,
  PieChart,
  UserCircle,
  Receipt
} from 'lucide-react';
import { Input } from './ui/input';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, active, onClick }) => {
  return (
    <Link
      to={to}
      className={cn('nav-item', active && 'nav-item-active')}
      onClick={onClick}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
};

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { signOut, user } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex w-full overflow-x-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 bottom-0 z-30 w-64 bg-white border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 border-b border-border px-4">
            <Link to="/" className="flex items-center space-x-2" onClick={closeSidebar}>
              <h1 className="text-2xl font-bold text-purple">Conta</h1>
              <div className="bg-purple text-white text-xs px-2 py-0.5 rounded-md">
                Partner B2B
              </div>
            </Link>
            <button
              className="absolute right-4 top-4 text-gray-500 lg:hidden"
              onClick={closeSidebar}
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-4 border-b border-border">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-purple flex items-center justify-center text-white font-semibold">
                {user?.nome_completo ? user.nome_completo[0].toUpperCase() : 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.nome_completo || 'Usuário'}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <NavItem
              to="/"
              icon={<Home size={18} />}
              label="Página inicial"
              active={isActive('/')}
              onClick={closeSidebar}
            />
            <NavItem
              to="/transacoes"
              icon={<CreditCard size={18} />}
              label="Transações"
              active={isActive('/transacoes')}
              onClick={closeSidebar}
            />
            <NavItem
              to="/receitas-detalhadas"
              icon={<Receipt size={18} />}
              label="Receitas Detalhadas"
              active={isActive('/receitas-detalhadas')}
              onClick={closeSidebar}
            />
            <NavItem
              to="/recorrentes"
              icon={<ListOrdered size={18} />}
              label="Lançamentos Recorrentes"
              active={isActive('/recorrentes')}
              onClick={closeSidebar}
            />
            <NavItem
              to="/categorias"
              icon={<FileText size={18} />}
              label="Categorias"
              active={isActive('/categorias')}
              onClick={closeSidebar}
            />
			<NavItem
              to="/planos"
              icon={<PieChart size={18} />}
              label="Planos"
              active={isActive('/planos')}
              onClick={closeSidebar}
            />
            <NavItem
              to="/centro-custos"
              icon={<PieChart size={18} />}
              label="Centro de Custos"
              active={isActive('/centro-custos')}
              onClick={closeSidebar}
			  />
            <NavItem
              to="/planos"
              icon={<PieChart size={18} />}
              label="Planos"
              active={isActive('/planos')}
              onClick={closeSidebar}
            />
            <NavItem
              to="/contatos"
              icon={<Users size={18} />}
              label="Contatos"
              active={isActive('/contatos')}
              onClick={closeSidebar}
            />
            <NavItem
              to="/perfil"
              icon={<UserCircle size={18} />}
              label="Meu Perfil"
              active={isActive('/perfil')}
              onClick={closeSidebar}
            />
          </div>

          <div className="p-4 border-t border-border">
            <Button
              variant="ghost"
              className="w-full flex items-center justify-start gap-2 text-muted-foreground"
              onClick={signOut}
            >
              <LogOut size={18} />
              <span className="text-sm">Sair</span>
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 w-full overflow-hidden">
        <header className="h-16 flex items-center px-4 border-b border-border bg-white lg:pl-6">
          <button
            className="p-1 rounded-md text-gray-500 hover:bg-gray-100 lg:hidden mr-4"
            onClick={toggleSidebar}
          >
            <Menu size={24} />
          </button>

          <div className="flex-1">
            <div className="relative w-full">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar..."
                className="w-full pl-8 rounded-full bg-gray-50 border-gray-200"
              />
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 w-full min-w-0 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
