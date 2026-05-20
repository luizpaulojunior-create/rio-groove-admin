-- Por favor, execute este SQL no SQL Editor do Supabase para corrigir a constraint de status:

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (
  status IN (
    'created',
    'pending',
    'pending_payment',
    'paid',
    'approved',
    'reserved',
    'production_pending',
    'in_production',
    'production_done',
    'shipping_pending',
    'label_generated',
    'shipped',
    'in_transit',
    'out_for_delivery',
    'delivered',
    'cancelled',
    'rejected',
    'refunded',
    'in_process',
    'in_mediation',
    'aguardando_pagamento',
    'pagamento_aprovado',
    'estoque_reservado',
    'aguardando_producao',
    'em_producao',
    'producao_concluida',
    'preparando_envio',
    'etiqueta_gerada',
    'postado',
    'em_transito',
    'saiu_para_entrega',
    'entregue',
    'cancelado',
    'awaiting_payment',
    'awaiting_capture',
    'payment_failed'
  )
);
