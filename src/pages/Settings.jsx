import { Settings as SettingsIcon, Save } from 'lucide-react';

export default function Settings() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center">
        <h1 className="font-heading text-4xl flex items-center gap-3">
          <SettingsIcon className="text-[var(--color-primary)]" size={32} />
          Configurações
        </h1>
        <button className="bg-[var(--color-primary)] text-white px-6 py-2.5 rounded-xl font-medium hover:bg-[var(--color-primary-hover)] transition-colors glow-red flex items-center gap-2">
          <Save size={20} />
          Salvar Alterações
        </button>
      </div>

      <div className="glass-panel p-8 space-y-8">
        {/* Informações da Loja */}
        <section className="space-y-4">
          <h3 className="text-xl font-heading tracking-wide border-b border-[var(--color-border)] pb-2 text-white">
            Informações da Loja
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Nome da Loja</label>
              <input defaultValue="Rio Groove Store" className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Email de Contato</label>
              <input defaultValue="contato@riogroove.com.br" className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Descrição SEO Global</label>
              <textarea rows={3} defaultValue="Loja oficial Rio Groove. Roupas com estilo, conforto e atitude." className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors resize-none" />
            </div>
          </div>
        </section>

        {/* Integrações */}
        <section className="space-y-4">
          <h3 className="text-xl font-heading tracking-wide border-b border-[var(--color-border)] pb-2 text-white">
            Integrações & API
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Melhor Envio Client ID</label>
              <input type="password" defaultValue="************************" className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Melhor Envio Client Secret</label>
              <input type="password" defaultValue="************************" className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
