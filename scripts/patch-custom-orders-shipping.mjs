/**
 * Admin: frete só como referência; cliente escolhe no pagamento.
 * node scripts/patch-custom-orders-shipping.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const filePath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'pages', 'CustomOrders.jsx');
let src = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

function apply(label, from, to) {
  if (!src.includes(from)) {
    console.error(`Bloco não encontrado: ${label}`);
    process.exit(1);
  }
  src = src.replace(from, to);
}

apply(
  'handleSave payload',
  `        {
          status,
          admin_notes: adminNotes,
          shipping_amount: shippingAmount !== '' ? Number(shippingAmount) : '',
          shipping_cep: cepDigits(shippingCep),
          shipping_method: shippingMethod,
          shipping_service_id: shippingServiceId,
        },`,
  `        {
          status,
          admin_notes: adminNotes,
        },`,
);

apply(
  'frete header',
  `                <p className="text-sm font-medium text-white">Frete — Melhor Envio</p>`,
  `                <p className="text-sm font-medium text-white">Frete — referência (cliente escolhe no pagamento)</p>`,
);

apply(
  'frete hint',
  `                  Usa peso/dimensões do insumo ({formatInsumoLabel(selected)} · qtd {selected.quantity}).
                  {shippingMethod ? \` Selecionado: \${shippingMethod}\` : ' Escolha uma opção abaixo ou informe valor manual.'}`,
  `                  Estimativa com peso/dimensões do insumo ({formatInsumoLabel(selected)} · qtd {selected.quantity}).
                  O cliente escolhe transportadora ou retirada no RJ ao pagar a peça.`,
);

apply(
  'quote options buttons',
  `                      <button
                        key={optionId}
                        type="button"
                        onClick={() => applyShippingOption(option)}
                        className={\`w-full text-left rounded-lg border px-3 py-2 text-sm transition-colors \${
                          active
                            ? 'border-primary bg-primary/10 text-white'
                            : 'border-white/10 bg-black/20 text-gray-300 hover:border-white/25'
                        }\`}
                      >`,
  `                      <div
                        key={optionId}
                        className="w-full text-left rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-gray-300"
                      >`,
);

apply(
  'close quote option button',
  `                      </button>`,
  `                      </div>`,
);

apply(
  'remove manual shipping block',
  `              <div>
                <label className="block text-xs text-gray-500 mb-1">Valor do frete (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={shippingAmount}
                  onChange={(e) => setShippingAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Total peça + frete: {formatMoney(
                    getOrderDisplayPricing({ ...selected, shipping_amount: shippingAmount || 0 }).productTotal,
                  )}
                </p>
              </div>`,
  `              {selected.shipping_method ? (
                <p className="text-xs text-emerald-400">
                  Frete escolhido pelo cliente: {selected.shipping_method} ({formatMoney(selected.shipping_amount || 0)})
                </p>
              ) : (
                <p className="text-xs text-gray-500">
                  Nenhum frete definido ainda — será escolhido pelo cliente no checkout da peça.
                </p>
              )}`,
);

fs.writeFileSync(filePath, src, 'utf8');
console.log('CustomOrders.jsx atualizado.');
