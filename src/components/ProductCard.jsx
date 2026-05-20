import React from 'react'
import { Edit, Trash2 } from 'lucide-react'
import { normalizeImageUrl } from '../utils/imageUtils'

export default function ProductCard({ product, onEdit, onDelete }) {
  return (
    <div className="card-premium flex flex-col h-full !p-0 overflow-hidden group">
      <div 
        className="h-[200px] w-full bg-[#050505] relative flex items-center justify-center border-b border-[var(--color-border)] overflow-hidden"
      >
        {product.image_url ? (
          <img 
            src={normalizeImageUrl(product.image_url)} 
            alt={product.name} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <span className="text-[var(--color-text-muted)] font-sans text-sm tracking-widest uppercase">Sem Imagem</span>
        )}
        
        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] to-transparent opacity-60" />
        
        {/* Status Badge */}
        <div className="absolute top-4 right-4">
          <span className={`px-3 py-1 text-[10px] uppercase tracking-widest font-bold rounded-full backdrop-blur-md border ${
            product.active 
              ? 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20' 
              : 'bg-red-500/10 text-red-500 border-red-500/20'
          }`}>
            {product.active ? 'Ativo' : 'Inativo'}
          </span>
        </div>
      </div>
      
      <div className="p-6 flex-1 flex flex-col">
        <h3 className="font-heading text-2xl text-white mb-2 leading-tight">{product.name}</h3>
        
        <p className="text-[var(--color-text-muted)] text-sm font-sans flex-1 line-clamp-2 mb-6">
          {product.description || 'Sem descrição'}
        </p>
        
        <div className="flex justify-between items-end mb-6 pb-6 border-b border-[var(--color-border)]">
          <div>
            <span className="block text-[10px] uppercase text-[var(--color-text-muted)] tracking-widest mb-1">Preço</span>
            <span className="font-heading text-2xl text-white">
              R$ {product.price ? Number(product.price).toFixed(2).replace('.', ',') : '0,00'}
            </span>
          </div>
          <div className="text-right">
            <span className="block text-[10px] uppercase text-[var(--color-text-muted)] tracking-widest mb-1">Estoque</span>
            <span className="font-sans font-bold text-white text-lg">
              {product.stock || 0}
            </span>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => onEdit(product)}
            className="flex-1 btn-secondary !h-10 text-sm gap-2"
          >
            <Edit size={16} />
            Editar
          </button>
          <button 
            onClick={() => onDelete(product.id)}
            className="flex-1 btn-secondary !h-10 text-sm !border-red-500/20 text-red-400 hover:!bg-red-500/10 hover:!text-red-300 gap-2"
          >
            <Trash2 size={16} />
            Excluir
          </button>
        </div>
      </div>
    </div>
  )
}