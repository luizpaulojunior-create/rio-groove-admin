import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Save, RefreshCw, Package, Shirt, Coffee, Table2, FileSpreadsheet, Wallet,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { CATEGORIES, UNIT_COST_BY_CATEGORY } from '../config/inventory';
import { getGeneralCostsForMonth, sumGeneralCostsMap } from '../config/generalCosts';
import GeneralCostsTab from '../components/insumo/GeneralCostsTab';
import { insumoCostsService, DTF_INSUMOS } from '../services/insumoCosts';

const TABS = [
  { id: 'costs', label: 'Custos & preços', icon: Package },
  { id: 'spreadsheet', label: 'Planilha de lucro', icon: Table2 },
  { id: 'general', label: 'Custos gerais', icon: Wallet },
  { id: 'dre', label: 'DRE mensal', icon: FileSpreadsheet },
];

const formatBRL = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '—';
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatPct = (value) => {
  if (value == null || !Number.isFinite(Number(value))) return '—';
  return `${Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
};

const parseInput = (value) => {
  if (value === '' || value === null || value === undefined) return '';
  const normalized = String(value).replace(',', '.');
  const num = Number(normalized);
  return Number.isFinite(num) ? num : '';
};

const currentMonthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const roundMoney = (value) => Math.round(Number(value || 0) * 100) / 100;

function blankCategoryForDtf(insumo) {
  if (insumo === 'Cropped') return 'Camisa';
  return insumo;
}

function profitClass(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num === 0) return 'text-[var(--color-text-muted)]';
  return num > 0 ? 'text-emerald-400' : 'text-red-400';
}

export default function InsumoCosts() {
  const [activeTab, setActiveTab] = useState('spreadsheet');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dreLoading, setDreLoading] = useState(false);
  const [config, setConfig] = useState(null);
  const [unitEconomics, setUnitEconomics] = useState([]);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [dreMonth, setDreMonth] = useState(currentMonthKey());
  const [dre, setDre] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const timeout = (promise, ms = 20000) =>
        Promise.race([
          promise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
        ]);

      const data = await timeout(insumoCostsService.getConfig());
      setConfig(data.config);
      setUnitEconomics(Array.isArray(data.unit_economics) ? data.unit_economics : []);
      setUpdatedAt(data.updated_at || null);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Erro ao carregar custos de insumos');
      setConfig({
        blank_unit_cost: { ...UNIT_COST_BY_CATEGORY },
        dtf_transfer_cost: Object.fromEntries(DTF_INSUMOS.map((k) => [k, 0])),
        catalog_selling_price: Object.fromEntries(CATEGORIES.map((k) => [k, 0])),
        general_monthly_costs: {},
        general_cost_entries: {},
        dtf_selling: {
          ready_art_discount: 20,
          exclusive_art_fee: {},
          printed_product_price: {},
        },
      });
      setUnitEconomics([]);
    } finally {
      setLoading(false);
    }
  };

  const loadDre = useCallback(async (month = dreMonth) => {
    try {
      setDreLoading(true);
      const data = await insumoCostsService.getDre(month);
      setDre(data);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Erro ao carregar DRE');
      setDre(null);
    } finally {
      setDreLoading(false);
    }
  }, [dreMonth]);

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if ((activeTab === 'dre' || activeTab === 'general') && config) {
      loadDre(dreMonth);
    }
  }, [activeTab, dreMonth, config, loadDre]);

  const updateBlankCost = (category, value) => {
    setConfig((prev) => ({
      ...prev,
      blank_unit_cost: { ...prev.blank_unit_cost, [category]: parseInput(value) },
    }));
  };

  const updateCatalogSelling = (category, value) => {
    setConfig((prev) => ({
      ...prev,
      catalog_selling_price: { ...prev.catalog_selling_price, [category]: parseInput(value) },
    }));
  };

  const updateDtfTransfer = (insumo, value) => {
    setConfig((prev) => ({
      ...prev,
      dtf_transfer_cost: { ...prev.dtf_transfer_cost, [insumo]: parseInput(value) },
    }));
  };

  const updateSelling = (field, insumo, value) => {
    setConfig((prev) => ({
      ...prev,
      dtf_selling: {
        ...prev.dtf_selling,
        [field]: { ...prev.dtf_selling[field], [insumo]: parseInput(value) },
      },
    }));
  };

  const updateReadyArtDiscount = (value) => {
    setConfig((prev) => ({
      ...prev,
      dtf_selling: { ...prev.dtf_selling, ready_art_discount: parseInput(value) },
    }));
  };

  const localUnitEconomics = useMemo(() => {
    if (!config) return [];
    const rows = [];

    for (const category of CATEGORIES) {
      const salePrice = Number(config.catalog_selling_price?.[category]) || 0;
      const dtfInsumo = category === 'Acessório' ? null : category;
      const blank = Number(config.blank_unit_cost?.[category]) || 0;
      const dtf = dtfInsumo ? Number(config.dtf_transfer_cost?.[dtfInsumo === 'Camisa' ? 'Camisa' : dtfInsumo]) || 0 : 0;
      const cogs = Math.round((blank + dtf) * 100) / 100;
      const profit = Math.round((salePrice - cogs) * 100) / 100;
      rows.push({
        id: `catalog-${category}`,
        section: 'Catálogo',
        label: category,
        saleType: 'Peça catálogo',
        salePrice,
        cogs,
        profit,
        marginPct: salePrice > 0 ? Math.round((profit / salePrice) * 1000) / 10 : null,
      });
    }

    const selling = config.dtf_selling || {};
    const discount = Number(selling.ready_art_discount) || 0;

    for (const insumo of DTF_INSUMOS) {
      const category = blankCategoryForDtf(insumo);
      const cogs = Math.round(
        ((Number(config.blank_unit_cost?.[category]) || 0) + (Number(config.dtf_transfer_cost?.[insumo]) || 0)) * 100,
      ) / 100;
      const artFee = Number(selling.exclusive_art_fee?.[insumo]) || 0;
      const productPrice = Number(selling.printed_product_price?.[insumo]) || 0;
      const readyPrice = Math.round((artFee + productPrice - discount) * 100) / 100;

      [
        { id: `ready-${insumo}`, saleType: 'Arte pronta (peça)', salePrice: readyPrice },
        { id: `piece-${insumo}`, saleType: 'Peça (arte exclusiva)', salePrice: productPrice },
        { id: `art-${insumo}`, saleType: 'Taxa arte exclusiva', salePrice: artFee, cogs: 0 },
      ].forEach(({ id, saleType, salePrice, cogs: fixedCogs }) => {
        const rowCogs = fixedCogs ?? cogs;
        const profit = Math.round((salePrice - rowCogs) * 100) / 100;
        rows.push({
          id,
          section: 'Personalizado',
          label: insumo,
          saleType,
          salePrice,
          cogs: rowCogs,
          profit,
          marginPct: salePrice > 0 ? Math.round((profit / salePrice) * 1000) / 10 : null,
        });
      });
    }

    return rows;
  }, [config]);

  const spreadsheetRows = config ? localUnitEconomics : unitEconomics;

  const localTotalExpenses = useMemo(
    () => roundMoney(sumGeneralCostsMap(getGeneralCostsForMonth(config, dreMonth))),
    [config, dreMonth],
  );

  const localNetProfit = dre ? roundMoney(dre.grossProfit - localTotalExpenses) : null;
  const localNetMarginPct = dre && dre.grossRevenue > 0
    ? Math.round((localNetProfit / dre.grossRevenue) * 1000) / 10
    : null;

  const handleSave = async () => {
    if (!config || saving) return;
    try {
      setSaving(true);
      const toastId = toast.loading('Salvando...');
      const result = await insumoCostsService.saveConfig(config);
      setConfig(result.config);
      setUpdatedAt(result.updated_at || new Date().toISOString());
      const refreshed = await insumoCostsService.getConfig();
      setUnitEconomics(Array.isArray(refreshed.unit_economics) ? refreshed.unit_economics : []);
      if (activeTab === 'dre' || activeTab === 'general') await loadDre(dreMonth);
      toast.update(toastId, {
        render: 'Salvo com sucesso.',
        type: 'success',
        isLoading: false,
        autoClose: 2500,
      });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center min-h-[320px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <p className="text-[var(--color-text-muted)] max-w-3xl">
            Planilha operacional: <strong className="text-white/80">Valor de venda − Custo de vendas = Lucro de venda</strong>.
            Custos gerais (luz, equipamentos, insumos) alimentam o DRE mensal.
          </p>
          {updatedAt && (
            <p className="text-xs text-[var(--color-text-muted)] mt-2">
              Última atualização: {new Date(updatedAt).toLocaleString('pt-BR')}
            </p>
          )}
        </div>
        <div className="flex gap-3 shrink-0">
          <button
            type="button"
            onClick={load}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-white hover:border-white/20 transition-colors"
          >
            <RefreshCw size={18} />
            Recarregar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[var(--color-primary)] text-white font-medium hover:opacity-90 disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-[var(--color-border)] pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-xl text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-[var(--color-surface)] text-white border border-[var(--color-border)] border-b-transparent -mb-px'
                : 'text-[var(--color-text-muted)] hover:text-white'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'spreadsheet' && (
        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center gap-3">
            <Table2 className="text-[var(--color-primary)]" size={22} />
            <div>
              <h3 className="text-lg font-semibold text-white">Planilha de lucro por peça</h3>
              <p className="text-sm text-[var(--color-text-muted)]">
                CMV = blank + DTF. Catálogo usa o preço de venda informado na aba Custos.
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[960px]">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] border-b border-[var(--color-border)] bg-black/20">
                  <th className="px-4 py-3">Seção</th>
                  <th className="px-4 py-3">Produto</th>
                  <th className="px-4 py-3">Tipo de venda</th>
                  <th className="px-4 py-3 text-right">Valor de venda</th>
                  <th className="px-4 py-3 text-right">Custo de vendas</th>
                  <th className="px-4 py-3 text-right">Lucro de venda</th>
                  <th className="px-4 py-3 text-right">Margem</th>
                </tr>
              </thead>
              <tbody>
                {spreadsheetRows.map((row) => (
                  <tr key={row.id} className="border-b border-[var(--color-border)]/60 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-[var(--color-text-muted)] text-sm">{row.section}</td>
                    <td className="px-4 py-3 text-white font-medium">{row.label}</td>
                    <td className="px-4 py-3 text-white/80 text-sm">{row.saleType}</td>
                    <td className="px-4 py-3 text-right text-white">{formatBRL(row.salePrice)}</td>
                    <td className="px-4 py-3 text-right text-[var(--color-text-muted)]">{formatBRL(row.cogs)}</td>
                    <td className={`px-4 py-3 text-right font-medium ${profitClass(row.profit)}`}>
                      {formatBRL(row.profit)}
                    </td>
                    <td className={`px-4 py-3 text-right ${profitClass(row.profit)}`}>
                      {formatPct(row.marginPct)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === 'general' && (
        <GeneralCostsTab
          config={config}
          setConfig={setConfig}
          month={dreMonth}
          onMonthChange={setDreMonth}
        />
      )}

      {activeTab === 'dre' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-end gap-4">
            <label className="space-y-1">
              <span className="text-sm text-[var(--color-text-muted)]">Mês de referência</span>
              <input
                type="month"
                value={dreMonth}
                onChange={(e) => setDreMonth(e.target.value)}
                className="block px-3 py-2 rounded-lg bg-black/40 border border-[var(--color-border)] text-white focus:border-[var(--color-primary)] outline-none"
              />
            </label>
            <button
              type="button"
              onClick={() => loadDre(dreMonth)}
              disabled={dreLoading}
              className="px-4 py-2 rounded-xl border border-[var(--color-border)] text-sm text-[var(--color-text-muted)] hover:text-white"
            >
              {dreLoading ? 'Calculando...' : 'Recalcular DRE'}
            </button>
          </div>

          {dreLoading && !dre ? (
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : dre ? (
            <>
              <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
                <div className="px-6 py-4 border-b border-[var(--color-border)]">
                  <h3 className="text-lg font-semibold text-white capitalize">
                    DRE — {dre.label}
                  </h3>
                  <p className="text-sm text-[var(--color-text-muted)] mt-1">
                    {dre.volume.catalogOrders} pedidos catálogo · {dre.volume.customOrders} personalizados pagos
                  </p>
                </div>
                <div className="divide-y divide-[var(--color-border)]/60">
                  <DreLine label="(+) Receita — produtos catálogo" value={dre.revenue.catalogProducts} />
                  <DreLine label="(+) Receita — frete catálogo" value={dre.revenue.catalogShipping} muted />
                  <DreLine label="(+) Receita — peças personalizadas" value={dre.revenue.customProducts} />
                  <DreLine label="(+) Receita — taxas de arte exclusiva" value={dre.revenue.customArtFees} />
                  <DreLine label="(+) Receita — frete personalizados" value={dre.revenue.customShipping} muted />
                  <DreLine label="(=) Receita bruta total" value={dre.grossRevenue} strong />
                  <DreLine label="(−) Custo de vendas (CMV)" value={-dre.cogs} negative />
                  <DreLine label="(=) Lucro bruto" value={dre.grossProfit} strong profit />
                  <DreLine label="Margem bruta" value={formatPct(dre.grossMarginPct)} text />
                </div>
              </section>

              <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
                <div className="px-6 py-4 border-b border-[var(--color-border)] flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Custos gerais do mês</h3>
                    <p className="text-sm text-[var(--color-text-muted)] mt-1">
                      Lançados na aba <button type="button" onClick={() => setActiveTab('general')} className="text-[var(--color-primary)] hover:underline">Custos gerais</button>.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('general')}
                    className="text-sm px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-white"
                  >
                    Editar custos
                  </button>
                </div>
                <div className="divide-y divide-[var(--color-border)]/60">
                  {(dre.generalCostGroups || []).length === 0 ? (
                    <p className="px-6 py-6 text-sm text-[var(--color-text-muted)]">
                      Nenhum custo geral lançado para este mês.
                    </p>
                  ) : (
                    dre.generalCostGroups.map((group) => (
                      <div key={group.id}>
                        <div className="px-6 py-2 bg-black/10 text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                          {group.label}
                        </div>
                        {group.items.map((item) => (
                          <DreLine key={item.key} label={`(−) ${item.label}`} value={-item.amount} negative muted />
                        ))}
                      </div>
                    ))
                  )}
                  <DreLine label="(−) Total custos gerais" value={-localTotalExpenses} negative strong />
                  <DreLine label="(=) Lucro líquido estimado" value={localNetProfit} strong profit />
                  <DreLine label="Margem líquida" value={formatPct(localNetMarginPct)} text />
                </div>
              </section>

              {Array.isArray(dre.notes) && dre.notes.length > 0 && (
                <ul className="text-xs text-[var(--color-text-muted)] space-y-1 list-disc pl-5">
                  {dre.notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              )}
            </>
          ) : null}
        </div>
      )}

      {activeTab === 'costs' && (
        <div className="space-y-8">
          <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center gap-3">
              <Package className="text-[var(--color-primary)]" size={22} />
              <div>
                <h3 className="text-lg font-semibold text-white">Blanks — custo e preço de venda (catálogo)</h3>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Custo usado no CMV. Preço de venda alimenta a planilha de lucro do catálogo.
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[640px]">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                    <th className="px-6 py-3">Categoria</th>
                    <th className="px-6 py-3">Custo blank (R$)</th>
                    <th className="px-6 py-3">Preço venda catálogo (R$)</th>
                    <th className="px-6 py-3 text-right">Lucro unit. est.</th>
                  </tr>
                </thead>
                <tbody>
                  {CATEGORIES.map((category) => {
                    const sale = Number(config.catalog_selling_price?.[category]) || 0;
                    const blank = Number(config.blank_unit_cost?.[category]) || 0;
                    const dtfKey = category === 'Acessório' ? null : category;
                    const dtf = dtfKey ? Number(config.dtf_transfer_cost?.[dtfKey === 'Camisa' ? 'Camisa' : dtfKey]) || 0 : 0;
                    const cogs = Math.round((blank + dtf) * 100) / 100;
                    const profit = Math.round((sale - cogs) * 100) / 100;
                    return (
                      <tr key={category} className="border-b border-[var(--color-border)]/60 last:border-0">
                        <td className="px-6 py-4 text-white">{category}</td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={config.blank_unit_cost?.[category] ?? ''}
                            onChange={(e) => updateBlankCost(category, e.target.value)}
                            className="w-32 px-3 py-2 rounded-lg bg-black/40 border border-[var(--color-border)] text-white focus:border-[var(--color-primary)] outline-none"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={config.catalog_selling_price?.[category] ?? ''}
                            onChange={(e) => updateCatalogSelling(category, e.target.value)}
                            className="w-32 px-3 py-2 rounded-lg bg-black/40 border border-[var(--color-border)] text-white focus:border-[var(--color-primary)] outline-none"
                          />
                        </td>
                        <td className={`px-6 py-4 text-right font-medium ${profitClass(profit)}`}>
                          {formatBRL(profit)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="px-6 py-3 text-xs text-[var(--color-text-muted)] border-t border-[var(--color-border)]">
              CMV do catálogo inclui DTF quando aplicável. SKU específico usa custo do{' '}
              <Link to="/admin/stock" className="text-[var(--color-primary)] hover:underline">Estoque</Link> no DRE real.
            </p>
          </section>

          <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center gap-3">
              <Shirt className="text-[var(--color-primary)]" size={22} />
              <div>
                <h3 className="text-lg font-semibold text-white">DTF — custo de transferência por peça</h3>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                    <th className="px-6 py-3">Insumo</th>
                    <th className="px-6 py-3">Blank ref.</th>
                    <th className="px-6 py-3">Custo DTF (R$)</th>
                  </tr>
                </thead>
                <tbody>
                  {DTF_INSUMOS.map((insumo) => (
                    <tr key={insumo} className="border-b border-[var(--color-border)]/60 last:border-0">
                      <td className="px-6 py-4 text-white">{insumo}</td>
                      <td className="px-6 py-4 text-[var(--color-text-muted)]">
                        {formatBRL(config.blank_unit_cost?.[blankCategoryForDtf(insumo)])}
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={config.dtf_transfer_cost?.[insumo] ?? ''}
                          onChange={(e) => updateDtfTransfer(insumo, e.target.value)}
                          className="w-32 px-3 py-2 rounded-lg bg-black/40 border border-[var(--color-border)] text-white focus:border-[var(--color-primary)] outline-none"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center gap-3">
              <Coffee className="text-[var(--color-primary)]" size={22} />
              <div>
                <h3 className="text-lg font-semibold text-white">Personalizados — preços de venda (DTF)</h3>
              </div>
            </div>
            <div className="px-6 py-4 border-b border-[var(--color-border)] flex flex-wrap items-center gap-4">
              <label className="text-sm text-[var(--color-text-muted)]">Desconto arte pronta (R$)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={config.dtf_selling?.ready_art_discount ?? ''}
                onChange={(e) => updateReadyArtDiscount(e.target.value)}
                className="w-32 px-3 py-2 rounded-lg bg-black/40 border border-[var(--color-border)] text-white focus:border-[var(--color-primary)] outline-none"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[720px]">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                    <th className="px-6 py-3">Insumo</th>
                    <th className="px-6 py-3">Taxa arte exclusiva</th>
                    <th className="px-6 py-3">Peça impressa</th>
                    <th className="px-6 py-3">Pacote exclusivo</th>
                    <th className="px-6 py-3">Arte pronta</th>
                  </tr>
                </thead>
                <tbody>
                  {DTF_INSUMOS.map((insumo) => {
                    const art = config.dtf_selling?.exclusive_art_fee?.[insumo] ?? '';
                    const product = config.dtf_selling?.printed_product_price?.[insumo] ?? '';
                    const discount = Number(config.dtf_selling?.ready_art_discount) || 0;
                    const packageTotal =
                      Number(art) && Number(product)
                        ? Math.round((Number(art) + Number(product)) * 100) / 100
                        : null;
                    const readyPrice =
                      packageTotal != null ? Math.round((packageTotal - discount) * 100) / 100 : null;

                    return (
                      <tr key={insumo} className="border-b border-[var(--color-border)]/60 last:border-0">
                        <td className="px-6 py-4 text-white font-medium">{insumo}</td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={art}
                            onChange={(e) => updateSelling('exclusive_art_fee', insumo, e.target.value)}
                            className="w-28 px-3 py-2 rounded-lg bg-black/40 border border-[var(--color-border)] text-white focus:border-[var(--color-primary)] outline-none"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={product}
                            onChange={(e) => updateSelling('printed_product_price', insumo, e.target.value)}
                            className="w-28 px-3 py-2 rounded-lg bg-black/40 border border-[var(--color-border)] text-white focus:border-[var(--color-primary)] outline-none"
                          />
                        </td>
                        <td className="px-6 py-4 text-white">{formatBRL(packageTotal)}</td>
                        <td className="px-6 py-4 text-emerald-400">{formatBRL(readyPrice)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function DreLine({ label, value, strong, muted, negative, profit, text }) {
  const content = text ? value : formatBRL(Math.abs(Number(value) || 0));
  const signed = negative ? `- ${content}` : content;
  const color = profit
    ? profitClass(value)
    : muted
      ? 'text-[var(--color-text-muted)]'
      : negative
        ? 'text-red-300'
        : 'text-white';

  return (
    <div className={`flex items-center justify-between px-6 py-3 ${strong ? 'bg-black/20' : ''}`}>
      <span className={`text-sm ${muted ? 'text-[var(--color-text-muted)]' : 'text-white/90'}`}>{label}</span>
      <span className={`font-medium ${color} ${strong ? 'text-base' : 'text-sm'}`}>{signed}</span>
    </div>
  );
}
