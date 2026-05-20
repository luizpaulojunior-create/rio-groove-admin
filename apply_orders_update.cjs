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

// 2. Replace the Modal block
const modalRegex = /<Modal[\s\S]*?<\/Modal>/;

const newModal = `<Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={\`PEDIDO #\${selectedOrder?.id}\`}
        maxWidth="max-w-[1200px]"
      >
        {selectedOrder && (
          <div className="flex flex-col xl:flex-row gap-[24px] max-w-full pb-4">
            
            {/* COLUNA ESQUERDA (65%) */}
            <div className="w-full xl:w-[65%] space-y-6">
              
              {/* 1. STATUS DO PEDIDO */}
              <div className="bg-[#0D0D0D] border border-[rgba(255,255,255,0.06)] rounded-[24px] p-6 shadow-sm">
                <h2 className="font-heading text-[28px] uppercase tracking-widest font-bold leading-tight text-white mb-8">Status do Pedido</h2>
                
                <div className="relative flex justify-between items-start px-2 overflow-x-auto pb-6 custom-scrollbar">
                  {(() => {
                    const normStatus = getNormalizedStatus(selectedOrder.timelineStep || selectedOrder.status);
                    const isCancelled = normStatus === 'cancelado' || normStatus === 'cancelled';
                    
                    let activeIdx = TIMELINE_STEPS.findIndex(s => s.id === normStatus);
                    if (isCancelled || activeIdx === -1) {
                      let lastIdx = -1;
                      const allLogsStr = JSON.stringify(selectedOrder.logs || []).toLowerCase();
                      TIMELINE_STEPS.forEach((step, i) => {
                        if (allLogsStr.includes(step.id.toLowerCase()) || allLogsStr.includes(step.label.toLowerCase())) {
                          if (i > lastIdx) lastIdx = i;
                        }
                      });
                      activeIdx = lastIdx >= 0 ? lastIdx : 0;
                    }

                    const opSteps = TIMELINE_STEPS.slice(0, 8); // Até Etiqueta Gerada

                    return opSteps.map((step, idx) => {
                      const isCompleted = idx < activeIdx;
                      const isCurrent = !isCancelled && idx === activeIdx;
                      const isCancelledStep = isCancelled && idx === activeIdx;

                      let circleStyle = "w-4 h-4 rounded-full transition-all duration-300 z-10 relative shrink-0 ";
                      let lineClass = "absolute top-2 -translate-y-1/2 left-[50%] w-full h-[2px] -z-0 ";

                      if (isCurrent) {
                        circleStyle += "bg-[#22C55E] ring-4 ring-[#22C55E]/20 shadow-[0_0_15px_rgba(34,197,94,0.5)]";
                        lineClass += "bg-[rgba(255,255,255,0.06)]";
                      } else if (isCompleted) {
                        circleStyle += "bg-[#22C55E]";
                        lineClass += "bg-[#22C55E] opacity-50";
                      } else if (isCancelledStep) {
                        circleStyle += "bg-red-500 ring-4 ring-red-500/20";
                        lineClass += "bg-red-500 opacity-50";
                      } else {
                        circleStyle += "bg-[#EAB308] opacity-50";
                        lineClass += "bg-[rgba(255,255,255,0.06)]";
                      }

                      return (
                        <div key={step.id} className="relative flex-1 flex flex-col items-center min-w-[100px] gap-3">
                          {idx < opSteps.length - 1 && (
                            <div className={lineClass}></div>
                          )}
                          <div className={circleStyle}></div>
                          <span className={\`text-[12px] font-sans font-medium text-center px-1 leading-tight \${isCurrent ? 'text-[#22C55E]' : (isCompleted ? 'text-white/80' : 'text-white/40')}\`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* 2. ITENS DO PEDIDO */}
              <div className="bg-[#0D0D0D] border border-[rgba(255,255,255,0.06)] rounded-[24px] p-6 shadow-sm">
                <h2 className="font-heading text-[28px] uppercase tracking-widest font-bold leading-tight text-white mb-6">Itens do Pedido</h2>
                
                <div className="space-y-4">
                  {(selectedOrder.items || []).map((item, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row gap-5 p-4 bg-[#050505] rounded-2xl border border-[rgba(255,255,255,0.06)]">
                      <div className="w-[88px] h-[88px] bg-[#0D0D0D] rounded-xl flex items-center justify-center overflow-hidden shrink-0 border border-[rgba(255,255,255,0.03)]">
                        {(item.product?.images?.[0] || item.image) ? <img src={item.product?.images?.[0]?.url || item.product?.images?.[0] || item.image} alt="" className="w-full h-full object-cover" loading="lazy" /> : <Package size={24} className="text-white/20"/>}
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-sans font-medium text-[16px] text-white leading-tight">{String(item.product?.name || item.name || item.title || 'Produto sem nome')}</p>
                            <p className="font-sans text-[12px] text-white/50 mt-1">SKU: {String(item.product?.sku || item.sku || 'N/A')}</p>
                          </div>
                          <div className="text-right shrink-0 ml-4">
                            <p className="font-sans font-medium text-[16px] text-white">R$ {((Number(item.quantity) || 1) * (Number(item.price) || 0)).toFixed(2)}</p>
                            <p className="font-sans text-[12px] text-white/50 mt-1">{Number(item.quantity) || 1}x R$ {Number(item.price || 0).toFixed(2)}</p>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-6 mt-auto">
                          <div>
                            <span className="block font-sans text-[10px] uppercase text-white/50 mb-0.5 tracking-wider">Cor</span>
                            <span className="font-sans text-[14px] text-white/80">{String(item.color || '-')}</span>
                          </div>
                          <div>
                            <span className="block font-sans text-[10px] uppercase text-white/50 mb-0.5 tracking-wider">Tamanho</span>
                            <span className="font-sans text-[14px] text-white/80">{String(item.size || '-')}</span>
                          </div>
                          <div>
                            <span className="block font-sans text-[10px] uppercase text-white/50 mb-0.5 tracking-wider">Estoque Base</span>
                            <span className={\`font-sans text-[14px] \${STOCK_DEDUCTED_STATUSES.includes(getNormalizedStatus(selectedOrder.timelineStep || selectedOrder.status)) ? "text-[#22C55E]" : "text-[#EAB308]"}\`}>
                              {STOCK_DEDUCTED_STATUSES.includes(getNormalizedStatus(selectedOrder.timelineStep || selectedOrder.status)) ? 'Baixado' : 'Pendente'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!selectedOrder.items || selectedOrder.items.length === 0) && (
                    <p className="font-sans text-[14px] text-white/40 text-center py-4">Nenhum item encontrado.</p>
                  )}
                </div>
              </div>

              {/* 3. ACOMPANHAMENTO DA ENTREGA */}
              {(() => {
                const normStatus = getNormalizedStatus(selectedOrder.timelineStep || selectedOrder.status);
                const isCancelled = normStatus === 'cancelado' || normStatus === 'cancelled';
                let activeIdx = TIMELINE_STEPS.findIndex(s => s.id === normStatus);
                if (isCancelled || activeIdx === -1) {
                  let lastIdx = -1;
                  const allLogsStr = JSON.stringify(selectedOrder.logs || []).toLowerCase();
                  TIMELINE_STEPS.forEach((step, i) => {
                    if (allLogsStr.includes(step.id.toLowerCase()) || allLogsStr.includes(step.label.toLowerCase())) {
                      if (i > lastIdx) lastIdx = i;
                    }
                  });
                  activeIdx = lastIdx >= 0 ? lastIdx : 0;
                }
                
                const isAfterEtiqueta = activeIdx >= 7 && !isCancelled;
                
                return (
                  <div className={\`bg-[#0D0D0D] border border-[rgba(255,255,255,0.06)] rounded-[24px] p-6 shadow-sm transition-all duration-500 \${isAfterEtiqueta ? 'ring-1 ring-[#22C55E]/30 shadow-[0_0_30px_rgba(34,197,94,0.05)]' : 'opacity-80'}\`}>
                    <h2 className="font-heading text-[28px] uppercase tracking-widest font-bold leading-tight text-white mb-6">Acompanhamento da Entrega</h2>
                    
                    <div className="space-y-0 pl-2">
                      {TIMELINE_STEPS.slice(8).map((step, relativeIdx, arr) => {
                        const idx = relativeIdx + 8;
                        const isCompleted = idx < activeIdx;
                        const isCurrent = !isCancelled && idx === activeIdx;
                        const isCancelledStep = isCancelled && idx === activeIdx;

                        let dotStyle = "w-3 h-3 rounded-full relative z-10 transition-all duration-300 ";
                        let trackStyle = "absolute left-[5px] top-3 bottom-[-24px] w-[2px] ";

                        if (isCurrent) {
                          dotStyle += "bg-[#22C55E] ring-4 ring-[#22C55E]/20 shadow-[0_0_10px_rgba(34,197,94,0.5)]";
                          trackStyle += "bg-[rgba(255,255,255,0.06)]";
                        } else if (isCompleted) {
                          dotStyle += "bg-[#22C55E]";
                          trackStyle += "bg-[#22C55E] opacity-30";
                        } else if (isCancelledStep) {
                          dotStyle += "bg-red-500";
                          trackStyle += "bg-transparent";
                        } else {
                          dotStyle += "bg-[#EAB308] opacity-30";
                          trackStyle += "bg-[rgba(255,255,255,0.06)]";
                        }

                        return (
                          <div key={step.id} className="relative flex gap-6">
                            {relativeIdx < arr.length - 1 && <div className={trackStyle}></div>}
                            <div className="pt-1.5 shrink-0">
                              <div className={dotStyle}></div>
                            </div>
                            <div className={\`pb-8 w-full \${isCurrent ? 'bg-[#050505] p-4 rounded-2xl border border-[rgba(34,197,94,0.15)] -mt-2' : ''}\`}>
                              <p className={\`font-sans text-[14px] font-medium \${isCurrent ? 'text-[#22C55E]' : (isCompleted ? 'text-white' : 'text-white/40')}\`}>{step.label}</p>
                              {isCurrent && step.id === 'postado' && <p className="font-sans text-[12px] text-[#22C55E]/70 mt-1">Pedido recebido pela transportadora.</p>}
                              {isCurrent && step.id === 'em_transito' && <p className="font-sans text-[12px] text-[#22C55E]/70 mt-1">Pedido em deslocamento.</p>}
                              {isCurrent && step.id === 'saiu_para_entrega' && <p className="font-sans text-[12px] text-[#22C55E]/70 mt-1">O entregador está a caminho.</p>}
                              {isCurrent && step.id === 'entregue' && <p className="font-sans text-[12px] text-[#22C55E]/70 mt-1">Pedido entregue ao destinatário.</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

            </div>

            {/* COLUNA DIREITA (35%) */}
            <div className="w-full xl:w-[35%] space-y-6">
              
              {/* 1. AÇÕES OPERACIONAIS */}
              {(() => {
                const normStatus = getNormalizedStatus(selectedOrder.timelineStep || selectedOrder.status);
                const isCancelled = normStatus === 'cancelado' || normStatus === 'cancelled';
                let activeIdx = TIMELINE_STEPS.findIndex(s => s.id === normStatus);
                if (isCancelled || activeIdx === -1) {
                  let lastIdx = -1;
                  const allLogsStr = JSON.stringify(selectedOrder.logs || []).toLowerCase();
                  TIMELINE_STEPS.forEach((step, i) => {
                    if (allLogsStr.includes(step.id.toLowerCase()) || allLogsStr.includes(step.label.toLowerCase())) {
                      if (i > lastIdx) lastIdx = i;
                    }
                  });
                  activeIdx = lastIdx >= 0 ? lastIdx : 0;
                }
                
                // Exibir somente até "Etiqueta Gerada" (índice 7)
                if (!isCancelled && activeIdx <= 7) {
                  return (
                    <div className="bg-[#0D0D0D] border border-[#FF4D00]/20 rounded-[24px] p-6 shadow-[0_0_20px_rgba(255,77,0,0.05)]">
                      <h2 className="font-heading text-[28px] uppercase tracking-widest font-bold leading-tight text-[#FF4D00] mb-6">Ações Operacionais</h2>
                      <div className="space-y-4">
                        {getNextActions()}
                      </div>
                    </div>
                  );
                }
                
                if (isCancelled) {
                  return (
                     <div className="bg-[#0D0D0D] border border-red-500/20 rounded-[24px] p-6">
                      <h2 className="font-heading text-[28px] uppercase tracking-widest font-bold leading-tight text-red-500 mb-2">Pedido Cancelado</h2>
                      <p className="font-sans text-[12px] text-white/50">As operações para este pedido foram encerradas.</p>
                    </div>
                  );
                }
                return null;
              })()}

              {/* 2. LOGÍSTICA & ENVIO */}
              <div className="bg-[#0D0D0D] border border-[rgba(255,255,255,0.06)] rounded-[24px] p-6 shadow-sm">
                <h2 className="font-heading text-[28px] uppercase tracking-widest font-bold leading-tight text-white mb-6">Logística & Envio</h2>
                
                <div className="space-y-4">
                  <div className="bg-[#050505] p-4 rounded-2xl border border-[rgba(255,255,255,0.06)] flex flex-col gap-3">
                    <span className="block font-sans text-[10px] uppercase text-white/50 tracking-wider">Código de Rastreio</span>
                    <div className="flex gap-2 items-center">
                      {selectedOrder.trackingCode || selectedOrder.tracking_code ? (
                        <p className="font-sans text-[18px] text-white font-bold tracking-widest">{selectedOrder.trackingCode || selectedOrder.tracking_code}</p>
                      ) : (
                        <div className="flex gap-2 w-full">
                          <input 
                            type="text" 
                            value={manualTrackingCode}
                            onChange={(e) => setManualTrackingCode(e.target.value)}
                            placeholder="Ex: BR123456789"
                            className="w-full bg-[#0D0D0D] border border-[rgba(255,255,255,0.1)] rounded-xl px-3 py-2 text-[12px] text-white focus:outline-none focus:border-[#FF4D00] transition-colors"
                          />
                          <button 
                            onClick={handleSaveTracking}
                            disabled={isProcessing || !manualTrackingCode.trim()}
                            className="px-4 py-2 bg-[#FF4D00] text-white rounded-xl text-[12px] font-medium hover:bg-[#e64500] transition-colors disabled:opacity-50 shrink-0"
                          >
                            Salvar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#050505] p-4 rounded-2xl border border-[rgba(255,255,255,0.06)]">
                      <span className="block font-sans text-[10px] uppercase text-white/50 mb-1 tracking-wider">Método de Envio</span>
                      <p className="font-sans text-[14px] text-white capitalize">{String(selectedOrder.shippingInfo?.method || selectedOrder.shippingMethod || selectedOrder.shipping_method || 'Correios/Jadlog')}</p>
                    </div>
                    <div className="bg-[#050505] p-4 rounded-2xl border border-[rgba(255,255,255,0.06)]">
                      <span className="block font-sans text-[10px] uppercase text-white/50 mb-1 tracking-wider">Valor do Frete</span>
                      <p className="font-sans text-[14px] text-white font-medium">R$ {Number(selectedOrder.shippingInfo?.price || selectedOrder.shipping_price || selectedOrder.shippingPrice || 0).toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="bg-[#050505] p-4 rounded-2xl border border-[rgba(255,255,255,0.06)]">
                    <span className="block font-sans text-[10px] uppercase text-white/50 mb-1 tracking-wider">Endereço de Entrega</span>
                    <p className="font-sans text-[14px] text-white/80 leading-relaxed mt-2">
                      {String(selectedOrder.shippingInfo?.address || selectedOrder.shipping_street || selectedOrder.address?.street || 'Não informado')}
                      {String(selectedOrder.shipping_number || selectedOrder.address?.number ? \`, \${selectedOrder.shipping_number || selectedOrder.address?.number}\` : '')}<br/>
                      {String(selectedOrder.shippingInfo?.city || selectedOrder.shipping_city || selectedOrder.address?.city || '-')} - {String(selectedOrder.shippingInfo?.state || selectedOrder.shipping_state || selectedOrder.address?.state || '-')}<br/>
                      CEP: {String(selectedOrder.shippingInfo?.zipCode || selectedOrder.shipping_cep || selectedOrder.address?.cep || '-')}
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. CLIENTE */}
              <div className="bg-[#0D0D0D] border border-[rgba(255,255,255,0.06)] rounded-[24px] p-6 shadow-sm">
                <h2 className="font-heading text-[28px] uppercase tracking-widest font-bold leading-tight text-white mb-6">Cliente</h2>
                
                <div className="space-y-4">
                  <p className="font-sans text-[16px] text-white font-medium">{String(selectedOrder.customer?.name || selectedOrder.customer_name || selectedOrder.customerName || '-')}</p>
                  
                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center bg-[#050505] p-3 rounded-xl border border-[rgba(255,255,255,0.06)]">
                      <span className="font-sans text-[12px] text-white/50">CPF</span>
                      <span className="font-sans text-[14px] text-white/90">{String(selectedOrder.customer?.cpf || selectedOrder.customer_cpf || selectedOrder.cpf || '-')}</span>
                    </div>
                    <div className="flex justify-between items-center bg-[#050505] p-3 rounded-xl border border-[rgba(255,255,255,0.06)] group">
                      <span className="font-sans text-[12px] text-white/50">Email</span>
                      <div className="flex gap-2 items-center">
                        <span className="font-sans text-[14px] text-white/90">{String(selectedOrder.customer?.email || selectedOrder.customer_email || selectedOrder.customerEmail || '-')}</span>
                        <button onClick={() => copyToClipboard(selectedOrder.customer?.email || selectedOrder.customer_email || selectedOrder.customerEmail)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-[#FF4D00] transition-all"><Copy size={12}/></button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center bg-[#050505] p-3 rounded-xl border border-[rgba(255,255,255,0.06)]">
                      <span className="font-sans text-[12px] text-white/50">Telefone</span>
                      <span className="font-sans text-[14px] text-white/90">{String(selectedOrder.customer?.phone || selectedOrder.customer_phone || selectedOrder.phone || '-')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. HISTÓRICO & LOGS */}
              <div className="bg-[#0D0D0D] border border-[rgba(255,255,255,0.06)] rounded-[24px] p-6 shadow-sm">
                <h2 className="font-heading text-[28px] uppercase tracking-widest font-bold leading-tight text-white mb-6">Histórico & Logs</h2>
                
                <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                  {(selectedOrder.logs || []).slice().reverse().map((log, idx) => (
                    <div key={idx} className="relative pl-4 border-l-2 border-[#FF4D00]/30 pb-4 last:pb-0">
                      <div className="absolute left-[-5px] top-1.5 w-2 h-2 rounded-full bg-[#FF4D00]"></div>
                      <p className="font-sans text-[14px] text-white/90">{String(log.action || log.message || 'Atualização de pedido')}</p>
                      <div className="flex gap-3 text-[10px] text-white/40 mt-1 uppercase tracking-wider">
                        <span>{String(log.user || 'Sistema')}</span>
                        <span>&bull;</span>
                        <span>{new Date(log.createdAt || log.created_at || new Date()).toLocaleString('pt-BR')}</span>
                      </div>
                    </div>
                  ))}
                  {(!selectedOrder.logs || selectedOrder.logs.length === 0) && (
                    <div className="relative pl-4 border-l-2 border-[#FF4D00]/30">
                      <div className="absolute left-[-5px] top-1.5 w-2 h-2 rounded-full bg-[#FF4D00]"></div>
                      <p className="font-sans text-[14px] text-white/90">Pedido criado</p>
                      <div className="flex gap-3 text-[10px] text-white/40 mt-1 uppercase tracking-wider">
                        <span>Sistema</span>
                        <span>&bull;</span>
                        <span>{new Date(selectedOrder.createdAt || selectedOrder.date).toLocaleString('pt-BR')}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}
      </Modal>`;

if(content.match(modalRegex)) {
  content = content.replace(modalRegex, newModal);
} else {
  console.log("Modal block not found");
}

fs.writeFileSync(file, content);
console.log('Update finished!');
