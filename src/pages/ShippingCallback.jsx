import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { shippingService } from '../services/shipping';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export default function ShippingCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState(null);

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) {
      setStatus('error');
      setError('Código de autorização não encontrado na URL.');
      return;
    }

    const authenticate = async () => {
      try {
        await shippingService.handleOAuthCallback(code);
        setStatus('success');
        setTimeout(() => {
          navigate('/admin/shipping');
        }, 2000);
      } catch (err) {
        console.error('Erro na autenticação OAuth:', err);
        setStatus('error');
        setError(err.response?.data?.message || 'Falha ao autenticar com Melhor Envio.');
      }
    };

    authenticate();
  }, [searchParams, navigate]);

  return (
    <div className="flex h-[80vh] w-full items-center justify-center">
      <div className="glass-panel p-8 flex flex-col items-center max-w-md w-full text-center space-y-4">
        {status === 'processing' && (
          <>
            <Loader2 className="w-16 h-16 text-[var(--color-primary)] animate-spin" />
            <h2 className="text-xl font-heading mt-4">Autenticando Melhor Envio...</h2>
            <p className="text-[var(--color-text-muted)]">Aguarde enquanto conectamos sua conta.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle2 className="w-16 h-16 text-green-500" />
            <h2 className="text-xl font-heading text-green-500 mt-4">Conectado com Sucesso!</h2>
            <p className="text-[var(--color-text-muted)]">Redirecionando para o painel de envios...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-500" />
            <h2 className="text-xl font-heading text-red-500 mt-4">Erro na Conexão</h2>
            <p className="text-[var(--color-text-muted)]">{error}</p>
            <button 
              onClick={() => navigate('/admin/shipping')}
              className="mt-6 bg-[var(--color-surface)] border border-[var(--color-border)] px-6 py-2 rounded-xl text-sm font-medium hover:border-[var(--color-primary)] transition-colors text-white"
            >
              Voltar para Envios
            </button>
          </>
        )}
      </div>
    </div>
  );
}
