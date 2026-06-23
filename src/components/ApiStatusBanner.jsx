import { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { getBackendRootUrl } from '../lib/api';

export default function ApiStatusBanner() {
  const [status, setStatus] = useState('checking');

  const check = async () => {
    setStatus('checking');
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);
      const res = await fetch(`${getBackendRootUrl()}/health`, {
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timer);
      setStatus(res.ok ? 'online' : 'offline');
    } catch {
      setStatus('offline');
    }
  };

  useEffect(() => {
    check();
  }, []);

  if (status === 'checking' || status === 'online') return null;

  return (
    <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex items-start gap-3">
        <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={20} />
        <div>
          <p className="text-white font-medium">Backend indisponível</p>
          <p className="text-sm text-red-200/80 mt-1">
            Pedidos, estoque e custos dependem da API ({getBackendRootUrl()}). Verifique o deploy no Render
            ou aguarde o serviço voltar — algumas telas carregam parcialmente.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={check}
        className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-red-400/30 text-sm text-white hover:bg-red-500/10 shrink-0"
      >
        <RefreshCw size={16} />
        Testar conexão
      </button>
    </div>
  );
}
