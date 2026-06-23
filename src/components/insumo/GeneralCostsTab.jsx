import { useMemo, useState } from 'react';
import { Plus, Trash2, Receipt, Layers } from 'lucide-react';
import {
  GENERAL_COST_GROUPS,
  GENERAL_COST_LABELS,
  emptyGeneralCostsMap,
  sumGeneralCostsMap,
  getGeneralCostsForMonth,
} from '../../config/generalCosts';

const formatBRL = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '—';
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const parseInput = (value) => {
  if (value === '' || value === null || value === undefined) return '';
  const normalized = String(value).replace(',', '.');
  const num = Number(normalized);
  return Number.isFinite(num) ? num : '';
};

const roundMoney = (value) => Math.round(Number(value || 0) * 100) / 100;

export default function GeneralCostsTab({ config, setConfig, month, onMonthChange }) {
  const [entryForm, setEntryForm] = useState({
    category: 'raw_materials',
    description: '',
    amount: '',
    date: '',
  });

  const monthCosts = useMemo(
    () => getGeneralCostsForMonth(config, month),
    [config, month],
  );

  const monthTotal = useMemo(() => roundMoney(sumGeneralCostsMap(monthCosts)), [monthCosts]);

  const entries = config?.general_cost_entries?.[month] || [];

  const updateGeneralCost = (category, value) => {
    setConfig((prev) => ({
      ...prev,
      general_monthly_costs: {
        ...prev.general_monthly_costs,
        [month]: {
          ...emptyGeneralCostsMap(),
          ...(prev.general_monthly_costs?.[month] || {}),
          [category]: parseInput(value),
        },
      },
    }));
  };

  const addEntry = () => {
    const amount = roundMoney(entryForm.amount);
    if (!amount || amount <= 0) return;

    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      category: entryForm.category,
      description: String(entryForm.description || '').trim(),
      amount,
      date: entryForm.date || null,
    };

    setConfig((prev) => {
      const prevMonthCosts = {
        ...emptyGeneralCostsMap(),
        ...(prev.general_monthly_costs?.[month] || {}),
      };
      prevMonthCosts[entry.category] = roundMoney((prevMonthCosts[entry.category] || 0) + amount);

      return {
        ...prev,
        general_monthly_costs: {
          ...prev.general_monthly_costs,
          [month]: prevMonthCosts,
        },
        general_cost_entries: {
          ...prev.general_cost_entries,
          [month]: [...(prev.general_cost_entries?.[month] || []), entry],
        },
      };
    });

    setEntryForm({ category: entryForm.category, description: '', amount: '', date: '' });
  };

  const removeEntry = (entry) => {
    setConfig((prev) => {
      const prevMonthCosts = {
        ...emptyGeneralCostsMap(),
        ...(prev.general_monthly_costs?.[month] || {}),
      };
      prevMonthCosts[entry.category] = roundMoney(
        Math.max(0, (prevMonthCosts[entry.category] || 0) - (Number(entry.amount) || 0)),
      );

      return {
        ...prev,
        general_monthly_costs: {
          ...prev.general_monthly_costs,
          [month]: prevMonthCosts,
        },
        general_cost_entries: {
          ...prev.general_cost_entries,
          [month]: (prev.general_cost_entries?.[month] || []).filter((item) => item.id !== entry.id),
        },
      };
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <label className="space-y-1">
          <span className="text-sm text-[var(--color-text-muted)]">Mês de referência</span>
          <input
            type="month"
            value={month}
            onChange={(e) => onMonthChange(e.target.value)}
            className="block px-3 py-2 rounded-lg bg-black/40 border border-[var(--color-border)] text-white focus:border-[var(--color-primary)] outline-none"
          />
        </label>
        <div className="rounded-xl border border-[var(--color-border)] bg-black/20 px-5 py-3 text-right">
          <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Total custos gerais</p>
          <p className="text-2xl font-semibold text-white">{formatBRL(monthTotal)}</p>
        </div>
      </div>

      {GENERAL_COST_GROUPS.map((group) => (
        <section
          key={group.id}
          className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center gap-3">
            <Layers className="text-[var(--color-primary)]" size={20} />
            <div>
              <h3 className="text-lg font-semibold text-white">{group.label}</h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[560px]">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                  <th className="px-6 py-3">Tipo de custo</th>
                  <th className="px-6 py-3 text-right">Valor no mês (R$)</th>
                </tr>
              </thead>
              <tbody>
                {group.items.map((item) => (
                  <tr key={item.key} className="border-b border-[var(--color-border)]/60 last:border-0">
                    <td className="px-6 py-3 text-white/90">{item.label}</td>
                    <td className="px-6 py-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={monthCosts[item.key] ?? ''}
                        onChange={(e) => updateGeneralCost(item.key, e.target.value)}
                        className="w-full max-w-[160px] ml-auto block px-3 py-2 rounded-lg bg-black/40 border border-[var(--color-border)] text-white text-right focus:border-[var(--color-primary)] outline-none"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center gap-3">
          <Receipt className="text-[var(--color-primary)]" size={20} />
          <div>
            <h3 className="text-lg font-semibold text-white">Lançamentos detalhados</h3>
            <p className="text-sm text-[var(--color-text-muted)]">
              Registre compras, contas e despesas — o valor soma automaticamente na categoria.
            </p>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-3 border-b border-[var(--color-border)]">
          <label className="md:col-span-3 space-y-1">
            <span className="text-xs text-[var(--color-text-muted)]">Categoria</span>
            <select
              value={entryForm.category}
              onChange={(e) => setEntryForm((prev) => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-black/40 border border-[var(--color-border)] text-white focus:border-[var(--color-primary)] outline-none"
            >
              {GENERAL_COST_GROUPS.flatMap((group) =>
                group.items.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.label}
                  </option>
                )),
              )}
            </select>
          </label>
          <label className="md:col-span-4 space-y-1">
            <span className="text-xs text-[var(--color-text-muted)]">Descrição</span>
            <input
              type="text"
              placeholder="Ex.: Conta CEMIG, filme DTF 100m..."
              value={entryForm.description}
              onChange={(e) => setEntryForm((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-black/40 border border-[var(--color-border)] text-white focus:border-[var(--color-primary)] outline-none"
            />
          </label>
          <label className="md:col-span-2 space-y-1">
            <span className="text-xs text-[var(--color-text-muted)]">Valor (R$)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={entryForm.amount}
              onChange={(e) => setEntryForm((prev) => ({ ...prev, amount: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-black/40 border border-[var(--color-border)] text-white focus:border-[var(--color-primary)] outline-none"
            />
          </label>
          <label className="md:col-span-2 space-y-1">
            <span className="text-xs text-[var(--color-text-muted)]">Data</span>
            <input
              type="date"
              value={entryForm.date}
              onChange={(e) => setEntryForm((prev) => ({ ...prev, date: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-black/40 border border-[var(--color-border)] text-white focus:border-[var(--color-primary)] outline-none"
            />
          </label>
          <div className="md:col-span-1 flex items-end">
            <button
              type="button"
              onClick={addEntry}
              className="w-full flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm hover:opacity-90"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[720px]">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                <th className="px-6 py-3">Data</th>
                <th className="px-6 py-3">Categoria</th>
                <th className="px-6 py-3">Descrição</th>
                <th className="px-6 py-3 text-right">Valor</th>
                <th className="px-6 py-3 w-12" />
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-[var(--color-text-muted)] text-sm">
                    Nenhum lançamento neste mês. Use o formulário acima ou preencha direto nas categorias.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-[var(--color-border)]/60 last:border-0">
                    <td className="px-6 py-3 text-[var(--color-text-muted)] text-sm">
                      {entry.date ? new Date(`${entry.date}T12:00:00`).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td className="px-6 py-3 text-white/90 text-sm">
                      {GENERAL_COST_LABELS[entry.category] || entry.category}
                    </td>
                    <td className="px-6 py-3 text-white/80 text-sm">{entry.description || '—'}</td>
                    <td className="px-6 py-3 text-right text-white">{formatBRL(entry.amount)}</td>
                    <td className="px-6 py-3">
                      <button
                        type="button"
                        onClick={() => removeEntry(entry)}
                        className="p-1.5 text-[var(--color-text-muted)] hover:text-red-400"
                        title="Remover lançamento"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
