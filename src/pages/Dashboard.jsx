import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { analyticsService } from '../services/analytics';
import { stockService } from '../services/stock';
import { AlertTriangle, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsData, stockData] = await Promise.all([
        analyticsService.getDashboardStats().catch(() => ({})),
        stockService.getStock().catch(() => [])
      ]);
      setStats(statsData || {});
      setStockItems(stockData || []);
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const lowStockItems = stockItems.filter(i => Number(i.quantity) > 0 && Number(i.quantity) <= Number(i.minStock));
  const outOfStockItems = stockItems.filter(i => Number(i.quantity) === 0);

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative h-[300px] rounded-[32px] overflow-hidden flex items-center px-8 md:px-16"
      >
        <div 
          className="absolute inset-0 bg-cover bg-center z-0"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/30 z-10" />
        
        <div className="relative z-20">
          <h1 className="font-heading text-6xl md:text-8xl tracking-wider leading-none">
            <span className="block text-white">PAINEL</span>
            <span className="block text-white">RIO GROOVE</span>
            <span className="block text-[var(--color-primary)] text-glow">ADMIN</span>
          </h1>
        </div>
      </motion.div>

      {/* Stats Grid */}
      {loading ? (
        <div className="flex justify-center p-8">
          <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {[
              { title: 'Vendas Totais', value: `R$ ${Number(stats?.totalSales || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, change: `+${stats?.salesGrowth || 0}%` },
              { title: 'Pedidos do Dia', value: `${stats?.todayOrders || 0}`, change: `+${stats?.todayOrdersGrowth || 0}%` },
              { title: 'Ticket Médio', value: `R$ ${Number(stats?.averageTicket || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, change: `${stats?.ticketGrowth || 0}%` },
              { title: 'Clientes Ativos', value: `${stats?.activeCustomers || 0}`, change: `+${stats?.activeCustomersGrowth || 0}%` },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-panel p-6 glass-panel-hover"
              >
                <p className="text-[var(--color-text-muted)] text-sm font-medium mb-2">{stat.title}</p>
                <div className="flex items-end justify-between">
                  <h3 className="font-heading text-4xl">{stat.value}</h3>
                  <span className={`text-sm font-medium ${stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                    {stat.change}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Alertas de Estoque */}
          {(!loading && (outOfStockItems.length > 0 || lowStockItems.length > 0)) && (
            <div className="space-y-4">
              <h2 className="font-heading text-2xl border-b border-[var(--color-border)] pb-2">Alertas de Estoque</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {outOfStockItems.map((item, i) => (
                  <div key={`out-${i}`} className="glass-panel p-4 border-l-4 border-red-500 flex items-center gap-4">
                    <div className="p-3 bg-red-500/10 text-red-500 rounded-xl">
                      <AlertCircle size={24} />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">Sem Estoque: {item.color} - {item.size}</h4>
                      <p className="text-sm text-[var(--color-text-muted)]">Necessidade urgente de reposição.</p>
                    </div>
                  </div>
                ))}
                {lowStockItems.map((item, i) => (
                  <div key={`low-${i}`} className="glass-panel p-4 border-l-4 border-yellow-500 flex items-center gap-4">
                    <div className="p-3 bg-yellow-500/10 text-yellow-500 rounded-xl">
                      <AlertTriangle size={24} />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">Estoque Baixo: {item.color} - {item.size}</h4>
                      <p className="text-sm text-[var(--color-text-muted)]">Restam apenas {item.quantity} unidades (Min: {item.minStock}).</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
