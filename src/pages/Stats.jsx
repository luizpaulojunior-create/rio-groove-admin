import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, ShoppingBag, Shirt } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { analyticsService } from '../services/analytics';

export default function Stats() {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsData, chartResp] = await Promise.all([
          analyticsService.getDashboardStats(),
          analyticsService.getSalesChartData('30d'),
        ]);
        setStats(statsData || {});
        setChartData(Array.isArray(chartResp) ? chartResp : []);
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        setStats({});
        setChartData([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex justify-center p-8">
        <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-heading text-4xl flex items-center gap-3">
          <BarChart3 className="text-[var(--color-primary)]" size={32} />
          Estatísticas e Analytics
        </h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card-premium relative overflow-hidden group hover:border-[var(--color-primary)] transition-colors">
          <div className="absolute -right-4 -top-4 text-[rgba(255,255,255,0.02)] group-hover:text-[rgba(255,43,6,0.05)] transition-colors">
            <TrendingUp size={100} />
          </div>
          <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] font-medium mb-2 relative z-10">Vendas (Mês)</p>
          <h3 className="font-heading text-5xl relative z-10">R$ {Number(stats.totalSales || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          <span className="text-[#22C55E] text-xs font-sans font-medium mt-2 block relative z-10">{stats.salesGrowth >= 0 ? '+' : ''}{stats.salesGrowth || 0}% vs mês ant.</span>
        </div>
        
        <div className="card-premium relative overflow-hidden group hover:border-[var(--color-primary)] transition-colors">
          <div className="absolute -right-4 -top-4 text-[rgba(255,255,255,0.02)] group-hover:text-[rgba(255,43,6,0.05)] transition-colors">
            <ShoppingBag size={100} />
          </div>
          <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] font-medium mb-2 relative z-10">Pedidos (Mês)</p>
          <h3 className="font-heading text-5xl relative z-10">{stats.totalOrders || 0}</h3>
          <span className="text-[#22C55E] text-xs font-sans font-medium mt-2 block relative z-10">{stats.ordersGrowth >= 0 ? '+' : ''}{stats.ordersGrowth || 0}% vs mês ant.</span>
        </div>
        
        <div className="card-premium relative overflow-hidden group hover:border-[var(--color-primary)] transition-colors">
          <div className="absolute -right-4 -top-4 text-[rgba(255,255,255,0.02)] group-hover:text-[rgba(255,43,6,0.05)] transition-colors">
            <Users size={100} />
          </div>
          <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] font-medium mb-2 relative z-10">Novos Clientes</p>
          <h3 className="font-heading text-5xl relative z-10">{stats.newCustomers || 0}</h3>
          <span className="text-red-500 text-xs font-sans font-medium mt-2 block relative z-10">{stats.customersGrowth >= 0 ? '+' : ''}{stats.customersGrowth || 0}% vs mês ant.</span>
        </div>
        
        <div className="card-premium relative overflow-hidden group hover:border-[var(--color-primary)] transition-colors">
          <div className="absolute -right-4 -top-4 text-[rgba(255,255,255,0.02)] group-hover:text-[rgba(255,43,6,0.05)] transition-colors">
            <Shirt size={100} />
          </div>
          <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] font-medium mb-2 relative z-10">Itens Vendidos</p>
          <h3 className="font-heading text-5xl relative z-10">{stats.itemsConsumed || stats.totalProductsSold || 0}</h3>
          <span className="text-[#22C55E] text-xs font-sans font-medium mt-2 block relative z-10">Pedidos pagos</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card-premium min-h-[400px] flex flex-col">
          <h3 className="text-2xl font-heading tracking-wide mb-6 border-b border-[var(--color-border)] pb-3 text-white">
            Receita (30 dias)
          </h3>
          <div className="flex-1 min-h-[280px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={12} />
                  <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickFormatter={(v) => `R$${v}`} />
                  <Tooltip
                    contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)' }}
                    formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, 'Receita']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#FF4D00" fill="rgba(255,77,0,0.15)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex-1 flex items-center justify-center border border-dashed border-[var(--color-border)] rounded-2xl bg-[rgba(255,255,255,0.01)] min-h-[280px]">
                <p className="text-[var(--color-text-muted)] font-sans text-sm">Sem dados de receita ainda.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-premium">
            <h3 className="text-2xl font-heading tracking-wide mb-6 border-b border-[var(--color-border)] pb-3 text-white">
              Tamanhos Mais Vendidos
            </h3>
            <div className="space-y-4">
              {(stats.topSizes || []).map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 font-heading text-xl">{item.size}</div>
                  <div className="flex-1 h-2 bg-[var(--color-surface)] rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--color-primary)]" style={{ width: `${item.pct}%` }} />
                  </div>
                  <div className="w-10 text-right text-sm text-[var(--color-text-muted)]">{item.pct}%</div>
                </div>
              ))}
              {(!stats.topSizes || stats.topSizes.length === 0) && (
                <p className="text-sm text-[var(--color-text-muted)]">Sem dados de tamanhos ainda.</p>
              )}
            </div>
          </div>

          <div className="card-premium">
            <h3 className="text-2xl font-heading tracking-wide mb-6 border-b border-[var(--color-border)] pb-3 text-white">
              Cores Mais Vendidas
            </h3>
            <div className="space-y-4">
              {(stats.topColors || []).map((item, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border border-[var(--color-border)]" style={{ backgroundColor: item.hex || '#ccc' }} />
                    <span className="text-sm font-medium">{item.color}</span>
                  </div>
                  <span className="font-heading text-xl text-[var(--color-text-muted)]">{item.count} un</span>
                </div>
              ))}
              {(!stats.topColors || stats.topColors.length === 0) && (
                <p className="text-sm text-[var(--color-text-muted)]">Sem dados de cores ainda.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
