import { Settings as SettingsIcon, Save } from 'lucide-react';

export default function Settings() {
  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex justify-between items-center">
        <h1 className="font-heading text-4xl flex items-center gap-3">
          Configurações
        </h1>
        <button className="btn-primary">
          <Save size={20} className="mr-2" />
          Salvar Alterações
        </button>
      </div>

      <div className="card-premium space-y-10">
        {/* Informações da Loja */}
        <section className="space-y-6">
          <h3 className="text-2xl font-heading tracking-wide border-b border-[var(--color-border)] pb-3 text-white">
            Informações da Loja
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs uppercase tracking-widest font-medium text-[var(--color-text-muted)] mb-2">Nome da Loja</label>
              <input defaultValue="Rio Groove Store" className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-5 h-12 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all duration-300" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest font-medium text-[var(--color-text-muted)] mb-2">Email de Contato</label>
              <input defaultValue="contato@riogroove.com.br" className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-5 h-12 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all duration-300" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs uppercase tracking-widest font-medium text-[var(--color-text-muted)] mb-2">Descrição SEO Global</label>
              <textarea rows={4} defaultValue="Loja oficial Rio Groove. Roupas com estilo, conforto e atitude." className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all duration-300 resize-none" />
            </div>
          </div>
        </section>

        {/* Integrações */}
        <section className="space-y-6">
          <h3 className="text-2xl font-heading tracking-wide border-b border-[var(--color-border)] pb-3 text-white">
            Integrações & API
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs uppercase tracking-widest font-medium text-[var(--color-text-muted)] mb-2">Melhor Envio Client ID</label>
              <input type="password" defaultValue="************************" className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-5 h-12 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all duration-300" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest font-medium text-[var(--color-text-muted)] mb-2">Melhor Envio Client Secret</label>
              <input type="password" defaultValue="************************" className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-5 h-12 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all duration-300" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
