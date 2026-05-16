import React from 'react'

export default function ProductCard({ product, onEdit, onDelete }) {
  return (
    <div style={{
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      overflow: 'hidden',
      backgroundColor: 'white',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        height: '160px',
        backgroundColor: '#f1f5f9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: product.image_url ? `url(${product.image_url})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
        {!product.image_url && <span style={{ color: '#94a3b8' }}>Sem imagem</span>}
      </div>
      <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.125rem', color: '#0f172a', fontWeight: '600' }}>{product.name}</h3>
          <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', backgroundColor: product.active ? '#dcfce7' : '#fee2e2', color: product.active ? '#166534' : '#991b1b', borderRadius: '9999px', fontWeight: '500' }}>
            {product.active ? 'Ativo' : 'Inativo'}
          </span>
        </div>
        <p style={{ margin: '0 0 1rem 0', color: '#64748b', fontSize: '0.875rem', flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {product.description || 'Sem descrição'}
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
          <span style={{ fontWeight: '600', color: '#059669', fontSize: '1.125rem' }}>
            R$ {product.price ? Number(product.price).toFixed(2).replace('.', ',') : '0,00'}
          </span>
          <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Estoque: <strong style={{ color: '#0f172a' }}>{product.stock || 0}</strong>
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={() => onEdit(product)}
            style={{ flex: 1, padding: '0.5rem', backgroundColor: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontWeight: '500', transition: 'background-color 0.2s' }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9' }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc' }}
          >
            Editar
          </button>
          <button 
            onClick={() => onDelete(product.id)}
            style={{ flex: 1, padding: '0.5rem', backgroundColor: 'white', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '4px', cursor: 'pointer', fontWeight: '500', transition: 'background-color 0.2s' }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2' }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'white' }}
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  )
}
