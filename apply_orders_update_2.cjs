const fs = require('fs');

const file = 'src/pages/Orders.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Replace getNextActions
const getNextActionsRegex = /  const getNextActions = \(\) => \{[\s\S]*?return actions;\n  \};/;
const newGetNextActions = `  const getNextActions = () => {
    if (!selectedOrder) return [];
    const norm = getNormalizedStatus(selectedOrder.timelineStep || selectedOrder.status);

    const actions = [];
    
    if (norm === 'aguardando_pagamento') {
      actions.push(<button key="ap" onClick={() => handleUpdateStatus('pagamento_aprovado')} disabled={isProcessing} className="w-full h-12 bg-[#22C55E] text-white rounded-2xl text-[14px] font-medium hover:bg-[#1ea951] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-[0_0_15px_rgba(34,197,94,0.3)]"><CheckCircle2 size={18} />Aprovar Pagamento</button>);
    }
    
    if (norm === 'pagamento_aprovado') {
      actions.push(<button key="er" onClick={() => handleUpdateStatus('estoque_reservado')} disabled={isProcessing} className="w-full h-12 bg-[#FF4D00] text-white rounded-2xl text-[14px] font-medium hover:bg-[#e64500] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-[0_0_15px_rgba(255,77,0,0.3)]"><Package size={18} />Reservar Estoque</button>);
    }

    if (norm === 'estoque_reservado') {
      actions.push(<button key="aprod" onClick={() => handleUpdateStatus('aguardando_producao')} disabled={isProcessing} className="w-full h-12 bg-[#EAB308] text-black rounded-2xl text-[14px] font-medium hover:bg-[#dca506] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-[0_0_15px_rgba(234,179,8,0.3)]"><ArrowRight size={18} />Enviar para Produção</button>);
    }

    if (norm === 'aguardando_producao') {
      actions.push(<button key="eprod" onClick={() => handleUpdateStatus('em_producao')} disabled={isProcessing} className="w-full h-12 bg-[#EAB308] text-black rounded-2xl text-[14px] font-medium hover:bg-[#dca506] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-[0_0_15px_rgba(234,179,8,0.3)]"><Loader2 size={18} />Iniciar Produção</button>);
    }

    if (norm === 'em_producao') {
      actions.push(<button key="cprod" onClick={() => handleUpdateStatus('producao_concluida')} disabled={isProcessing} className="w-full h-12 bg-[#22C55E] text-white rounded-2xl text-[14px] font-medium hover:bg-[#1ea951] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-[0_0_15px_rgba(34,197,94,0.3)]"><CheckCircle2 size={18} />Concluir Produção</button>);
    }

    if (norm === 'producao_concluida') {
      actions.push(<button key="pe" onClick={() => handleUpdateStatus('preparando_envio')} disabled={isProcessing} className="w-full h-12 bg-[#FF4D00] text-white rounded-2xl text-[14px] font-medium hover:bg-[#e64500] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-[0_0_15px_rgba(255,77,0,0.3)]"><Package size={18} />Preparar Envio</button>);
    }

    if (norm === 'preparando_envio') {
      actions.push(<button key="ge" onClick={() => window.open('https://melhorenvio.com.br/carrinho', '_blank')} disabled={isProcessing} className="w-full h-12 bg-[#FF4D00] text-white rounded-2xl text-[14px] font-medium hover:bg-[#e64500] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-[0_0_15px_rgba(255,77,0,0.3)]"><Truck size={18} />Carrinho Melhor Envio</button>);
    }

    return actions;
  };`;

if(content.match(getNextActionsRegex)) {
  content = content.replace(getNextActionsRegex, newGetNextActions);
} else {
  console.log("getNextActions block not found");
}

fs.writeFileSync(file, content);
console.log('Update finished!');
