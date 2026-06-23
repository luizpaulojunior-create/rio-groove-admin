import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { buildDashboardStats, buildSalesChartData, buildTopProducts, analyticsService } from '../services/analytics';
import { stockService } from '../services/stock';
import { ordersService } from '../services/orders';
import { AlertTriangle, AlertCircle, Clock, Package, TrendingUp, Zap, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function fetchWithTimeout(promise, fallback, ms = 20000) {
  return Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [stockItems, setStockItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [statsData, stockData, ordersData, chartResp, topProdResp] = await Promise.all([
        fetchWithTimeout(analyticsService.getDashboardStats(), null),
        fetchWithTimeout(stockService.getStock(), []),
        fetchWithTimeout(ordersService.getOrders(), []),
        fetchWithTimeout(analyticsService.getSalesChartData('30d'), []),
        fetchWithTimeout(analyticsService.getTopProducts(), []),
      ]);

      const validOrders = Array.isArray(ordersData) ? ordersData : [];
      validOrders.sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt));

      const resolvedStats = statsData?.available
        ? statsData
        : buildDashboardStats(validOrders, stockData || []);
      const resolvedChart = Array.isArray(chartResp) && chartResp.length > 0
        ? chartResp
        : buildSalesChartData(validOrders, '30d');
      const resolvedTop = Array.isArray(topProdResp) && topProdResp.length > 0
        ? topProdResp
        : buildTopProducts(validOrders);

      setStats(resolvedStats || {});
      setStockItems(stockData || []);
      setOrders(validOrders);
      setChartData(resolvedChart.length > 0 ? resolvedChart : [
        { date: 'Seg', revenue: 0 },
        { date: 'Ter', revenue: 0 },
        { date: 'Qua', revenue: 0 },
        { date: 'Qui', revenue: 0 },
        { date: 'Sex', revenue: 0 },
        { date: 'Sáb', revenue: 0 },
        { date: 'Dom', revenue: 0 }
      ]);
      setTopProducts(resolvedTop);
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const lowStockItems = useMemo(() => stockItems.filter(i => Number(i.quantity) > 0 && Number(i.quantity) <= Number(i.min_stock)), [stockItems]);
  const outOfStockItems = useMemo(() => stockItems.filter(i => Number(i.quantity) === 0), [stockItems]);
  
  const pendingOrders = useMemo(() => orders.filter(o => o.status === 'aguardando_pagamento' || o.status === 'aguardando_producao' || o.status === 'em_producao' || o.status === 'pending_payment'), [orders]);
  
  const recentSales = useMemo(() => orders.filter(o => o.status !== 'cancelado').slice(0, 5), [orders]);

  // Customer KPIs logic
  const { totalCustomers, newCustomers, activeCustomers, vipCustomers } = useMemo(() => {
    const customersMap = {};
    const now = new Date();
    
    orders.forEach(order => {
      const email = order.customer?.email;
      const phone = order.customer?.phone;
      const name = order.customer?.name;
      const id = email || phone || name;
      
      if (!id || id === '-' || id === 'Desconhecido') return;
      
      if (!customersMap[id]) {
        customersMap[id] = { orders: 0, totalSpent: 0, lastOrder: new Date(order.created_at || order.createdAt) };
      }
      
      customersMap[id].orders += 1;
      if (order.status !== 'cancelado') {
        customersMap[id].totalSpent += Number(order.total_amount || order.total || 0);
      }
      const orderDate = new Date(order.created_at || order.createdAt);
      if (orderDate > customersMap[id].lastOrder) customersMap[id].lastOrder = orderDate;
    });

    const customersList = Object.values(customersMap);
    const total = customersList.length;
    
    let active = 0;
    let vip = 0;
    let novatos = 0;

    customersList.forEach(c => {
      const daysSinceLastOrder = Math.floor((now - c.lastOrder) / (1000 * 60 * 60 * 24));
      if (daysSinceLastOrder <= 90) active++;
      if (c.totalSpent >= 1000 || c.orders >= 5) vip++;
      if (c.orders === 1 && daysSinceLastOrder <= 30) novatos++;
    });

    return { totalCustomers: total, activeCustomers: active, vipCustomers: vip, newCustomers: novatos };
  }, [orders]);

  const productsSold = useMemo(() => orders.reduce((acc, order) => {
    if (order.status !== 'cancelado' && Array.isArray(order.items)) {
       return acc + order.items.reduce((sum, item) => sum + Number(item.quantity || 1), 0);
    }
    return acc;
  }, 0), [orders]);

  const kpis = [
    { title: 'Faturamento Total', value: `R$ ${Number(stats?.totalSales || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, change: stats?.salesGrowth ? `${stats.salesGrowth > 0 ? '+' : ''}${stats.salesGrowth}%` : null },
    { title: 'Pedidos Hoje', value: stats?.todayOrders || 0, change: stats?.todayOrdersGrowth ? `${stats.todayOrdersGrowth > 0 ? '+' : ''}${stats.todayOrdersGrowth}%` : null },
    { title: 'Ticket Médio', value: `R$ ${Number(stats?.averageTicket || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, change: null },
    { title: 'Produtos Vendidos', value: stats?.totalProductsSold || productsSold || 0, change: null },
    { title: 'Estoque Crítico', value: lowStockItems.length, change: null, isCritical: lowStockItems.length > 0 },
    { title: 'Variantes Esgotadas', value: outOfStockItems.length, change: null, isDanger: outOfStockItems.length > 0 },
  ];

  const customerKpis = [
    { title: 'Clientes Ativos', value: activeCustomers, change: null },
    { title: 'Clientes VIP', value: vipCustomers, change: null, highlight: true },
    { title: 'Novos Clientes (30d)', value: newCustomers, change: null },
    { title: 'Total de Clientes', value: totalCustomers, change: null },
  ];

  const storefrontKpis = [
    { title: 'Conversão', value: '3.2%', change: '+0.4%' },
    { title: 'Abandono Checkout', value: '68%', change: '-2.1%' },
    { title: 'Mais Clicado', value: 'Camiseta Zé Pilintra', change: null },
    { title: 'Campanhas Ativas', value: '2', change: null, highlight: true },
  ];

  if (loading) {
    return (
      <div className="min-h-[80vh] bg-[#050505] flex flex-col gap-8">
        <div className="h-32 bg-[#0D0D0D] rounded-[32px] animate-pulse border border-white/5"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-40 bg-[#0D0D0D] rounded-[32px] animate-pulse border border-white/5"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-12 space-y-12">
      {/* Hero Dashboard */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="font-heading text-6xl md:text-8xl tracking-wider text-white uppercase leading-none mb-2">
              Cockpit
              <span className="text-[#FF4D00]">.</span>
            </h1>
            <p className="font-sans text-xl text-[var(--color-text-muted)]">
              Inteligência Operacional Rio Groove
            </p>
          </div>
          <div className="flex items-center gap-4 bg-[#0D0D0D] px-6 py-4 rounded-[24px] border border-white/5 shadow-lg">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
            <span className="font-sans text-sm text-white/80 uppercase tracking-widest font-medium">Sistema Online</span>
          </div>
        </div>
      </motion.div>

      {/* Main KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {kpis.map((kpi, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`bg-[#0D0D0D] rounded-[32px] p-8 border border-white/5 relative overflow-hidden group hover:border-[#FF4D00]/30 transition-all duration-300 hover:-translate-y-1 ${kpi.isDanger ? 'border-red-500/20' : kpi.isCritical ? 'border-yellow-500/20' : ''}`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br from-[#FF4D00]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${kpi.isDanger ? 'from-red-500/10' : kpi.isCritical ? 'from-yellow-500/10' : ''}`} />
            <p className="font-sans text-[var(--color-text-muted)] text-sm mb-4 opacity-60 uppercase tracking-wider font-medium">{kpi.title}</p>
            <div className="flex items-end justify-between relative z-10">
              <h3 className={`font-heading text-5xl tracking-wider ${kpi.isDanger ? 'text-red-500' : kpi.isCritical ? 'text-yellow-500' : 'text-white'}`}>
                {kpi.value}
              </h3>
              {kpi.change && (
                <span className={`text-sm font-sans font-medium px-3 py-1 rounded-full ${kpi.change.startsWith('+') ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                  {kpi.change}
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Customer KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {customerKpis.map((kpi, i) => (
          <motion.div
            key={`cust-${i}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + (i * 0.1) }}
            className={`bg-[#050505] rounded-[24px] p-6 border ${kpi.highlight ? 'border-[#FF4D00]/30 shadow-[0_0_15px_rgba(255,77,0,0.05)]' : 'border-white/5'}`}
          >
            <p className="font-sans text-[var(--color-text-muted)] text-[10px] mb-2 opacity-60 uppercase tracking-wider font-bold">{kpi.title}</p>
            <h3 className={`font-heading text-4xl tracking-wider ${kpi.highlight ? 'text-[#FF4D00]' : 'text-white'}`}>
              {kpi.value}
            </h3>
          </motion.div>
        ))}
      </div>

      {/* Storefront KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {storefrontKpis.map((kpi, i) => (
          <motion.div
            key={`storefront-${i}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + (i * 0.1) }}
            className={`bg-[#050505] rounded-[24px] p-6 border ${kpi.highlight ? 'border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.05)]' : 'border-white/5'}`}
          >
            <div className="flex justify-between items-start mb-2">
              <p className="font-sans text-[var(--color-text-muted)] text-[10px] opacity-60 uppercase tracking-wider font-bold">{kpi.title}</p>
              {kpi.change && (
                <span className={`text-[10px] font-bold ${kpi.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                  {kpi.change}
                </span>
              )}
            </div>
            <h3 className={`font-heading text-2xl tracking-wider truncate ${kpi.highlight ? 'text-purple-500' : 'text-white'}`} title={kpi.value}>
              {kpi.value}
            </h3>
          </motion.div>
        ))}
      </div>

      {/* Alertas e Últimas Vendas */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Alertas Operacionais */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-[#0D0D0D] rounded-[32px] p-8 border border-white/5 flex flex-col h-full"
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-heading text-3xl text-white flex items-center gap-3">
              <Activity className="text-[#FF4D00]" />
              Alertas Operacionais
            </h2>
          </div>
          <div className="space-y-4 flex-1">
            {outOfStockItems.length > 0 && (
              <div className="flex items-center gap-5 p-5 rounded-[24px] bg-red-500/5 border border-red-500/10">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="text-red-500" />
                </div>
                <div>
                  <p className="font-sans text-white font-medium text-lg">{outOfStockItems.length} Produtos Esgotados</p>
                  <p className="font-sans text-sm text-red-400/80">Necessidade imediata de reposição</p>
                </div>
              </div>
            )}
            
            {lowStockItems.length > 0 && (
              <div className="flex items-center gap-5 p-5 rounded-[24px] bg-yellow-500/5 border border-yellow-500/10">
                <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="text-yellow-500" />
                </div>
                <div>
                  <p className="font-sans text-white font-medium text-lg">{lowStockItems.length} Variantes em Estoque Crítico</p>
                  <p className="font-sans text-sm text-yellow-400/80">Risco iminente de ruptura de estoque</p>
                </div>
              </div>
            )}
            
            {pendingOrders.length > 0 && (
              <div className="flex items-center gap-5 p-5 rounded-[24px] bg-blue-500/5 border border-blue-500/10">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="text-blue-500" />
                </div>
                <div>
                  <p className="font-sans text-white font-medium text-lg">{pendingOrders.length} Pedidos Pendentes</p>
                  <p className="font-sans text-sm text-blue-400/80">Aguardando processamento ou pagamento</p>
                </div>
              </div>
            )}
            
            {outOfStockItems.length === 0 && lowStockItems.length === 0 && pendingOrders.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-white/30 py-12">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <Activity size={24} />
                </div>
                <p className="font-sans text-lg font-medium">Operação Estável</p>
                <p className="font-sans text-sm">Nenhum alerta crítico no momento.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Últimas Vendas */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-[#0D0D0D] rounded-[32px] p-8 border border-white/5 flex flex-col h-full"
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-heading text-3xl text-white flex items-center gap-3">
              <Zap className="text-[#FF4D00]" />
              Últimas Vendas
            </h2>
            <button className="text-sm font-sans text-white/50 hover:text-white transition-colors uppercase tracking-wider font-medium">Ver Todas</button>
          </div>
          <div className="space-y-3 flex-1">
            {recentSales.map((order, i) => (
              <div key={order.id || i} className="flex items-center justify-between p-4 rounded-[20px] bg-white/[0.02] hover:bg-white/[0.04] transition-colors border border-transparent hover:border-white/5 group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center font-heading text-xl text-white">
                    {order.customer?.name?.charAt(0)?.toUpperCase() || '-'}
                  </div>
                  <div>
                    <p className="font-sans text-white font-medium">{order.customer?.name || 'Cliente Sem Nome'}</p>
                    <p className="font-sans text-xs text-white/40 mt-1">
                      {new Date(order.created_at || order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • {order.items?.length || 1} {order.items?.length === 1 ? 'item' : 'itens'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-sans text-white font-medium text-lg">
                    R$ {Number(order.total_amount || order.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <div className="mt-1 flex justify-end">
                    <span className="text-[10px] font-sans px-2 py-1 rounded-md bg-white/5 text-[#FF4D00] uppercase tracking-wider font-bold">
                      {order.statusLabel || 'Aprovado'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            
            {recentSales.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-white/30 py-12">
                <Zap size={32} className="mb-4 opacity-50" />
                <p className="font-sans">Nenhuma venda recente.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Gráfico e Top Produtos */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Gráfico */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="xl:col-span-2 bg-[#0D0D0D] rounded-[32px] p-8 border border-white/5"
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-heading text-3xl text-white flex items-center gap-3">
              <TrendingUp className="text-[#FF4D00]" />
              Faturamento Semanal
            </h2>
          </div>
          <div className="h-[350px] w-full min-w-0 mt-4">
            {chartData && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={280}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF4D00" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#FF4D00" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#ffffff50" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    tickMargin={10} 
                  />
                  <YAxis 
                    stroke="#ffffff50" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => value >= 1000 ? `R$${(value/1000).toFixed(1)}k` : `R$${value}`}
                    tickMargin={10}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #ffffff10', borderRadius: '16px', color: '#fff', fontFamily: 'Inter' }}
                    itemStyle={{ color: '#FF4D00', fontWeight: 'bold' }}
                    labelStyle={{ color: '#ffffff80', marginBottom: '8px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    name="Receita"
                    stroke="#FF4D00" 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                    activeDot={{ r: 6, fill: '#FF4D00', stroke: '#0D0D0D', strokeWidth: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-white/30 font-sans border border-white/5 rounded-2xl bg-white/[0.01]">
                <TrendingUp size={32} className="mb-4 opacity-50" />
                <p>Aguardando dados de faturamento</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Top Produtos */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#0D0D0D] rounded-[32px] p-8 border border-white/5 flex flex-col"
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-heading text-3xl text-white flex items-center gap-3">
              <Package className="text-[#FF4D00]" />
              Top Produtos
            </h2>
          </div>
          <div className="space-y-4 flex-1">
            {topProducts && topProducts.length > 0 ? (
              topProducts.slice(0, 5).map((product, i) => (
                <div key={product.id || i} className="flex items-center gap-4 p-3 rounded-[20px] bg-white/[0.02] hover:bg-white/[0.04] transition-colors border border-transparent hover:border-white/5 group">
                  <div className="w-14 h-14 rounded-xl bg-white/5 overflow-hidden flex-shrink-0">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/20">
                        <Package size={24} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-white text-sm font-medium truncate">{product.name || 'Produto'}</p>
                    <p className="font-sans text-xs text-white/50 mt-1">{product.sales || 0} vendas</p>
                  </div>
                  {product.stock <= 5 && (
                    <div className="px-3 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-500 text-[10px] font-sans font-bold uppercase tracking-wider">
                      Baixo
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-white/30 py-12">
                <Package size={32} className="mb-4 opacity-50" />
                <p className="font-sans text-center">Nenhum produto<br/>vendido recentemente.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

    </div>
  );
}
