import { Menu, Bell, LogOut } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Header({ onMenuClick }) {
  const location = useLocation();
  const { user, signOut } = useAuth();
  
  // Format the path to show as title
  const getPageTitle = () => {
    const path = location.pathname.split('/').pop();
    switch (path) {
      case 'dashboard': return 'Dashboard';
      case 'orders': return 'Pedidos';
      case 'products': return 'Produtos';
      case 'stock': return 'Estoque';
      case 'collections': return 'Coleções';
      case 'shipping': return 'Melhor Envio';
      case 'stats': return 'Estatísticas';
      case 'settings': return 'Configurações';
      default: return 'Painel Admin';
    }
  };

  return (
    <header className="h-[90px] sticky top-0 z-30 bg-[rgba(0,0,0,0.65)] backdrop-blur-[16px] border-b border-[var(--color-border)] px-4 md:px-8 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 text-[var(--color-text-muted)] hover:text-white transition-colors"
        >
          <Menu size={24} />
        </button>
        <h2 className="font-heading text-2xl md:text-3xl tracking-wide text-white">
          {getPageTitle()}
        </h2>
      </div>

      <div className="flex items-center gap-6">
        <button className="text-[var(--color-text-muted)] hover:text-white transition-colors relative">
          <Bell size={22} />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[var(--color-primary)] rounded-full glow-red"></span>
        </button>

        <div className="flex items-center gap-3 pl-6 border-l border-[var(--color-border)]">
          <div className="hidden md:block text-right">
            <p className="text-sm font-medium text-white">{user?.email?.split('@')[0] || 'Admin User'}</p>
            <p className="text-xs text-[var(--color-text-muted)]">{user?.email || 'admin@riogroove.com'}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[var(--color-primary)] to-orange-500 p-0.5">
            <div className="w-full h-full rounded-full bg-[var(--color-surface)] flex items-center justify-center overflow-hidden">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'Admin'}&backgroundColor=transparent`}
                alt="User Avatar"
                className="w-full h-full object-cover"
                loading="lazy"
                width="32"
                height="32"
              />
            </div>
          </div>
          <button 
            onClick={signOut}
            className="ml-2 p-2 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
            title="Sair"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
