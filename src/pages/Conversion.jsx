import { useCallback, useEffect, useState } from 'react';
import {
  BarChart3,
  Smartphone,
  Monitor,
  Tablet,
  AlertCircle,
  RefreshCw,
  ShoppingCart,
  Eye,
  CreditCard,
  CheckCircle2,
} from 'lucide-react';
import { analyticsService } from '../services/analytics';

const PERIODS = [
  { id: '7d', label: '7 dias' },
  { id: '30d', label: '30 dias' },
  { id: '90d', label: '90 dias' },
];

const STEP_ICONS = {
  page_view: Eye,
  view_item: Eye,
  add_to_cart: ShoppingCart,
  begin_checkout: CreditCard,
  purchase: CheckCircle2,
};

function DeviceIcon({ device }) {
  if (device === 'mobile') return <Smartphone size={18} />;
  if (device === 'tablet') return <Tablet size={18} />;
  return <Monitor size={18} />;
}

export default function Conversion() {
  const [period, setPeriod] = useState('7d');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await analyticsService.getGa4Conversion(period);
      setReport(data);
    } catch (err) {
      console.error('Erro ao buscar conversão GA4:', err);
      setError('Não foi possível carregar os dados do Google Analytics.');
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !report) {
    return (
      <div className="flex justify-center p-8">
        <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (report && !report.configured) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="font-heading text-4xl flex items-center gap-3">
            <BarChart3 className="text-[var(--color-primary)]" size={32} />
            Funil de Conversão (GA4)
          </h1>
        </div>

        <div className="card-premium border border-amber-500/30 bg-amber-500/5 p-6">
          <div className="flex gap-3 items-start">
            <AlertCircle className="text-amber-400 shrink-0 mt-1" size={22} />
            <div className="space-y-3 text-sm text-[var(--color-text-muted)]">
              <p className="text-white font-medium">Integração GA4 pendente no backend</p>
              <p>{report.message}</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Propriedade GA4: <strong className="text-white">{report.propertyId}</strong></li>
                <li>Measurement ID: <strong className="text-white">{report.measurementId}</strong></li>
              </ul>
              <p className="pt-2">
                No Google Cloud: crie uma conta de serviço, baixe o JSON e adicione o e-mail como
                <strong className="text-white"> Viewer </strong>
                em Admin ? Gerenciamento de acesso à propriedade no GA4.
                Depois configure <code className="text-amber-200">GA4_SERVICE_ACCOUNT_JSON</code> no Render.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { overview, funnel, devices, topProducts, insights, startDate, endDate } = report || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-4xl flex items-center gap-3">
            <BarChart3 className="text-[var(--color-primary)]" size={32} />
            Funil de Conversão (GA4)
          </h1>
          {startDate && endDate && (
            <p className="text-sm text-[var(--color-text-muted)] mt-2">
              Período: {startDate} ? {endDate}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-[var(--color-border)] overflow-hidden">
            {PERIODS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setPeriod(item.id)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  period === item.id
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'text-[var(--color-text-muted)] hover:text-white hover:bg-white/5'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="p-2 rounded-xl border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-white transition-colors disabled:opacity-50"
            title="Atualizar"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {error && (
        <div className="card-premium border border-red-500/30 text-red-400 text-sm p-4">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-premium">
          <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] mb-2">Sessões</p>
          <h3 className="font-heading text-4xl">{overview?.sessions?.toLocaleString('pt-BR') || 0}</h3>
        </div>
        <div className="card-premium">
          <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] mb-2">Usuários</p>
          <h3 className="font-heading text-4xl">{overview?.activeUsers?.toLocaleString('pt-BR') || 0}</h3>
        </div>
        <div className="card-premium">
          <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] mb-2">Compras</p>
          <h3 className="font-heading text-4xl">{overview?.purchases?.toLocaleString('pt-BR') || 0}</h3>
        </div>
        <div className="card-premium">
          <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] mb-2">Receita GA4</p>
          <h3 className="font-heading text-3xl">
            R$ {Number(overview?.purchaseRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-premium">
          <p className="text-xs text-[var(--color-text-muted)]">Conversão produto ? compra</p>
          <p className="font-heading text-3xl text-[#22C55E] mt-1">{insights?.overallConversion || 0}%</p>
        </div>
        <div className="card-premium">
          <p className="text-xs text-[var(--color-text-muted)]">Abandono após carrinho</p>
          <p className="font-heading text-3xl text-amber-400 mt-1">{insights?.cartAbandonment || 0}%</p>
        </div>
        <div className="card-premium">
          <p className="text-xs text-[var(--color-text-muted)]">Desistência no checkout</p>
          <p className="font-heading text-3xl text-red-400 mt-1">{insights?.checkoutDropoff || 0}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card-premium">
          <h3 className="text-2xl font-heading tracking-wide mb-6 border-b border-[var(--color-border)] pb-3 text-white">
            Funil de eventos
          </h3>
          <div className="space-y-5">
            {(funnel || []).map((step, index) => {
              const Icon = STEP_ICONS[step.step] || Eye;
              const width = Math.max(step.rateFromTop || 0, 4);

              return (
                <div key={step.step} className="space-y-2">
                  <div className="flex justify-between items-center gap-4 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[var(--color-text-muted)] w-5">{index + 1}.</span>
                      <Icon size={16} className="text-[var(--color-primary)] shrink-0" />
                      <span className="font-medium truncate">{step.label}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-heading text-xl">{step.users.toLocaleString('pt-BR')}</span>
                      <span className="text-[var(--color-text-muted)] text-xs ml-2">usuários</span>
                    </div>
                  </div>
                  <div className="h-3 bg-[var(--color-surface)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[var(--color-primary)] to-orange-400 transition-all duration-500"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
                    <span>{step.events.toLocaleString('pt-BR')} eventos</span>
                    <span>
                      {step.rateFromPrevious != null
                        ? `${step.rateFromPrevious}% da etapa anterior`
                        : `${step.rateFromTop}% do topo`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card-premium">
          <h3 className="text-2xl font-heading tracking-wide mb-6 border-b border-[var(--color-border)] pb-3 text-white">
            Por dispositivo
          </h3>
          <div className="space-y-4">
            {(devices || []).map((item) => (
              <div key={item.device} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[var(--color-primary)]">
                  <DeviceIcon device={item.device} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-[var(--color-text-muted)]">{item.sessions} sessões</span>
                  </div>
                  <div className="flex justify-between text-xs text-[var(--color-text-muted)] mt-1">
                    <span>{item.purchases} compras</span>
                    <span className="text-[#22C55E]">{item.conversionRate}% conv.</span>
                  </div>
                </div>
              </div>
            ))}
            {(!devices || devices.length === 0) && (
              <p className="text-sm text-[var(--color-text-muted)]">Sem dados de dispositivo.</p>
            )}
          </div>
        </div>
      </div>

      <div className="card-premium">
        <h3 className="text-2xl font-heading tracking-wide mb-6 border-b border-[var(--color-border)] pb-3 text-white">
          Produtos ? visualização vs carrinho vs compra
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                <th className="pb-3 font-medium">Produto</th>
                <th className="pb-3 font-medium text-right">Views</th>
                <th className="pb-3 font-medium text-right">Carrinho</th>
                <th className="pb-3 font-medium text-right">Compras</th>
                <th className="pb-3 font-medium text-right">% Carrinho</th>
                <th className="pb-3 font-medium text-right">% Compra</th>
              </tr>
            </thead>
            <tbody>
              {(topProducts || []).map((product) => (
                <tr key={product.name} className="border-b border-[var(--color-border)]/50">
                  <td className="py-3 pr-4 max-w-[240px] truncate">{product.name}</td>
                  <td className="py-3 text-right">{product.views}</td>
                  <td className="py-3 text-right">{product.addedToCart}</td>
                  <td className="py-3 text-right">{product.purchased}</td>
                  <td className="py-3 text-right text-amber-400">{product.cartRate}%</td>
                  <td className="py-3 text-right text-[#22C55E]">{product.purchaseRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!topProducts || topProducts.length === 0) && (
            <p className="text-sm text-[var(--color-text-muted)] py-4">Sem dados de produtos no período.</p>
          )}
        </div>
      </div>
    </div>
  );
}
