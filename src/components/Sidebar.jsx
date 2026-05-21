import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  Boxes, 
  Layers, 
  BarChart3, 
  Settings,
  Megaphone,
  Mail,
  Users,
  Search,
  Ticket,
  X
} from 'lucide-react';

const menuItems = [
  { path: '/admin/dashboard', name: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/orders', name: 'Pedidos', icon: ShoppingBag },
  { path: '/admin/products', name: 'Produtos', icon: Package },
  { path: '/admin/stock', name: 'Estoque', icon: Boxes },
  { path: '/admin/collections', name: 'Coleções', icon: Layers },
  { path: '/admin/customers', name: 'Clientes', icon: Users },
  { path: '/admin/coupons', name: 'Cupons', icon: Ticket },
  { path: '/admin/stats', name: 'Relatórios', icon: BarChart3 },
];

const growthItems = [
  { path: '/admin/campaigns', name: 'Campanhas', icon: Megaphone },
  { path: '/admin/newsletter', name: 'Newsletter', icon: Mail },
  { path: '/admin/affiliates', name: 'Afiliados', icon: Users },
  { path: '/admin/seo', name: 'SEO', icon: Search },
];

const settingsItem = { path: '/admin/settings', name: 'Configurações', icon: Settings };

export default function Sidebar({ isOpen, setIsOpen }) {
  const SidebarContent = (
    <div className="flex flex-col h-full bg-[var(--color-background)] border-r border-[var(--color-border)] w-[320px]">
      {/* Logo Area */}
      <div className="h-[90px] flex items-center px-8 border-b border-[var(--color-border)] shrink-0">
        <h1 className="font-heading text-3xl tracking-widest flex items-center gap-2">
          <span className="text-white">RIO GROOVE</span>
          <span className="text-[var(--color-primary)]">STORE</span>
        </h1>
        {/* Mobile Close Button */}
        <button 
          className="lg:hidden ml-auto text-[var(--color-text-muted)] hover:text-white"
          onClick={() => setIsOpen(false)}
        >
          <X size={24} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-6">
        
        {/* Core Operational */}
        <div className="space-y-2">
          <p className="px-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Operacional</p>
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300
                ${isActive 
                  ? 'bg-gradient-to-r from-[rgba(255,43,6,0.2)] to-transparent border-l-3 border-[var(--color-primary)] text-white glow-red' 
                  : 'text-[var(--color-text-muted)] hover:bg-[rgba(255,255,255,0.04)] hover:text-white'
                }
              `}
            >
              <item.icon size={22} />
              <span className="font-medium text-lg">{item.name}</span>
            </NavLink>
          ))}
        </div>

        {/* Growth & Branding */}
        <div className="space-y-2">
          <p className="px-4 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Marketing & Growth</p>
          {growthItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300
                ${isActive 
                  ? 'bg-gradient-to-r from-[rgba(255,43,6,0.2)] to-transparent border-l-3 border-[var(--color-primary)] text-white glow-red' 
                  : 'text-[var(--color-text-muted)] hover:bg-[rgba(255,255,255,0.04)] hover:text-white'
                }
              `}
            >
              <item.icon size={22} />
              <span className="font-medium text-lg">{item.name}</span>
            </NavLink>
          ))}
        </div>

        {/* Settings */}
        <div className="space-y-2 pt-4 border-t border-[var(--color-border)]">
          <NavLink
            to={settingsItem.path}
            onClick={() => setIsOpen(false)}
            className={({ isActive }) => `
              flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300
              ${isActive 
                ? 'bg-gradient-to-r from-[rgba(255,43,6,0.2)] to-transparent border-l-3 border-[var(--color-primary)] text-white glow-red' 
                : 'text-[var(--color-text-muted)] hover:bg-[rgba(255,255,255,0.04)] hover:text-white'
              }
            `}
          >
            <settingsItem.icon size={22} />
            <span className="font-medium text-lg">{settingsItem.name}</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed top-0 left-0 bottom-0 z-40">
        {SidebarContent}
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="fixed top-0 left-0 bottom-0 z-50 lg:hidden"
            >
              {SidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
