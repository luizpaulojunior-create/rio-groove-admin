/**
 * Aplica melhorias em Conversion.jsx preservando UTF-8.
 * node scripts/patch-conversion-ga4.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const filePath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'pages', 'Conversion.jsx');
let src = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

function applyPatch(label, from, to) {
  if (!src.includes(from)) {
    console.error(`Bloco não encontrado: ${label}`);
    process.exit(1);
  }
  src = src.replace(from, to);
}

applyPatch(
  'load handler',
  `      const data = await analyticsService.getGa4Conversion(period);
      setReport(data);
    } catch (err) {
      console.error('Erro ao buscar conversão GA4:', err);
      setError('Não foi possível carregar os dados do Google Analytics.');`,
  `      const data = await analyticsService.getGa4Conversion(period);
      setReport(data);
      if (data?.fetchError) {
        setError(data.fetchError);
      }
    } catch (err) {
      console.error('Erro ao buscar conversão GA4:', err);
      const apiMsg = err.response?.data?.message;
      setError(
        apiMsg
          ? \`Não foi possível carregar os dados do Google Analytics: \${apiMsg}\`
          : 'Não foi possível carregar os dados do Google Analytics. Verifique se o backend está no ar.',
      );`,
);

applyPatch(
  'setup instructions',
  `              <p className="pt-2">
                No Google Cloud: crie uma conta de serviço, baixe o JSON e adicione o e-mail como
                <strong className="text-white"> Viewer </strong>
                em Admin ? Gerenciamento de acesso à propriedade no GA4.
                Depois configure <code className="text-amber-200">GA4_SERVICE_ACCOUNT_JSON</code> no Render.
              </p>`,
  `              <ol className="list-decimal pl-5 space-y-2 pt-1">
                <li>
                  Google Cloud: criar conta de serviço, baixar JSON e ativar{' '}
                  <strong className="text-white">Google Analytics Data API</strong>.
                </li>
                <li>
                  GA4: Admin → Gerenciamento de acesso à propriedade → adicionar o e-mail da conta como{' '}
                  <strong className="text-white">Viewer</strong>.
                </li>
                <li>
                  Render: <code className="text-amber-200">GA4_PROPERTY_ID=539502234</code> e colar o JSON em{' '}
                  <code className="text-amber-200">GA4_SERVICE_ACCOUNT_JSON</code> (JSON em uma linha ou base64).
                </li>
              </ol>`,
);

applyPatch(
  'error banner',
  `        <div className="card-premium border border-red-500/30 text-red-400 text-sm p-4">{error}</div>`,
  `        <div className="card-premium border border-red-500/30 text-red-400 text-sm p-4 flex gap-2 items-start">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>`,
);

applyPatch(
  'period label',
  `              Período: {startDate} ? {endDate}`,
  `              Período: {startDate} — {endDate}`,
);

fs.writeFileSync(filePath, src, 'utf8');
console.log('Conversion.jsx atualizado com UTF-8 OK');
