/** Categorias de custos gerais — espelhar em backend/src/config/generalCosts.js */

export const GENERAL_COST_GROUPS = [
  {
    id: 'infrastructure',
    label: 'Infraestrutura',
    items: [
      { key: 'electricity', label: 'Luz / Energia elétrica' },
      { key: 'water', label: 'Água' },
      { key: 'gas', label: 'Gás' },
      { key: 'rent', label: 'Aluguel' },
      { key: 'condo', label: 'Condomínio / IPTU' },
      { key: 'internet', label: 'Internet / Telefone' },
    ],
  },
  {
    id: 'production',
    label: 'Produção & Insumos',
    items: [
      { key: 'raw_materials', label: 'Compra de insumos (blanks, filme, tinta)' },
      { key: 'packaging', label: 'Embalagens / Sacolas / Tags' },
      { key: 'production_supplies', label: 'Material de produção' },
      { key: 'equipment_maintenance', label: 'Manutenção de equipamentos' },
    ],
  },
  {
    id: 'investments',
    label: 'Equipamentos & Investimentos',
    items: [
      { key: 'equipment_purchase', label: 'Compra de equipamentos' },
      { key: 'machinery', label: 'Máquinas / Prensas / Impressoras' },
      { key: 'furniture', label: 'Móveis / Estrutura física' },
    ],
  },
  {
    id: 'people',
    label: 'Pessoal',
    items: [
      { key: 'payroll', label: 'Folha / Pró-labore' },
      { key: 'freelancers', label: 'Freelas / Designers' },
    ],
  },
  {
    id: 'commercial',
    label: 'Comercial',
    items: [
      { key: 'marketing', label: 'Marketing / Anúncios' },
      { key: 'commissions', label: 'Comissões / Afiliados' },
    ],
  },
  {
    id: 'operations',
    label: 'Operacional & Logística',
    items: [
      { key: 'shipping_ops', label: 'Frete / Logística operacional' },
      { key: 'software', label: 'Software / Ferramentas (SaaS)' },
      { key: 'professional_services', label: 'Serviços profissionais' },
      { key: 'travel', label: 'Transporte / Viagens' },
    ],
  },
  {
    id: 'financial',
    label: 'Financeiro & Impostos',
    items: [
      { key: 'payment_fees', label: 'Taxas de pagamento (Mercado Pago, etc.)' },
      { key: 'taxes', label: 'Impostos / DAS / Notas' },
      { key: 'accounting', label: 'Contador / Jurídico' },
      { key: 'bank_fees', label: 'Tarifas bancárias' },
    ],
  },
  {
    id: 'other',
    label: 'Outros',
    items: [{ key: 'other', label: 'Outros custos gerais' }],
  },
];

export const GENERAL_COST_KEYS = GENERAL_COST_GROUPS.flatMap((group) =>
  group.items.map((item) => item.key),
);

export const GENERAL_COST_LABELS = Object.fromEntries(
  GENERAL_COST_GROUPS.flatMap((group) => group.items.map((item) => [item.key, item.label])),
);

export function emptyGeneralCostsMap() {
  return Object.fromEntries(GENERAL_COST_KEYS.map((key) => [key, 0]));
}

export function sumGeneralCostsMap(costsMap = {}) {
  return GENERAL_COST_KEYS.reduce((sum, key) => sum + (Number(costsMap[key]) || 0), 0);
}

export function getGeneralCostsForMonth(config, monthKey) {
  const base = emptyGeneralCostsMap();
  const stored = config?.general_monthly_costs?.[monthKey] || {};
  for (const key of GENERAL_COST_KEYS) {
    base[key] = Number(stored[key]) || 0;
  }
  return base;
}
