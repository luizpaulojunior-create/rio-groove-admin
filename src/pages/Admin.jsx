import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import ProductList from '../components/ProductList'

export default function Admin() {
  const { signOut, user } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')

  const renderContent = () => {
    switch (activeTab) {
      case 'produtos':
        return <ProductList />
      case 'dashboard':
      default:
        return (
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
            <h2 style={{ marginTop: 0, marginBottom: '1rem', color: '#0f172a' }}>Visão Geral</h2>
            <p style={{ color: '#475569', lineHeight: '1.6', margin: '0 0 0.5rem 0' }}>
              Bem-vindo ao painel de administração da Rio Groove.
            </p>
            <p style={{ color: '#475569', lineHeight: '1.6', margin: 0 }}>
              Use este sistema para gerenciar produtos, upload de imagens, pedidos e estoque da loja.
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginTop: '2.5rem' }}>
              {[
                { id: 'produtos', label: 'Produtos', desc: 'Catálogo e preços' },
                { id: 'imagens', label: 'Imagens', desc: 'Galeria de mídia' },
                { id: 'pedidos', label: 'Pedidos', desc: 'Vendas e envios' },
                { id: 'estoque', label: 'Estoque', desc: 'Controle de inventário' }
              ].map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => setActiveTab(item.id)}
                  style={{ 
                    padding: '1.5rem', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '8px', 
                    textAlign: 'center',
                    backgroundColor: '#f8fafc',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s'
                  }}
                  onMouseOver={(e) => { 
                    e.currentTarget.style.borderColor = '#cbd5e1'; 
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseOut={(e) => { 
                    e.currentTarget.style.borderColor = '#e2e8f0'; 
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.125rem' }}>{item.label}</h3>
                  <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.5rem', marginBottom: 0 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      <header style={{ backgroundColor: '#0f172a', color: 'white', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
          <h1 style={{ fontSize: '1.25rem', margin: 0, fontWeight: '600' }}>Rio Groove Admin</h1>
          <nav style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={() => setActiveTab('dashboard')}
              style={{ 
                background: activeTab === 'dashboard' ? 'rgba(255,255,255,0.1)' : 'transparent', 
                border: 'none', 
                color: activeTab === 'dashboard' ? 'white' : '#94a3b8', 
                cursor: 'pointer', 
                fontWeight: activeTab === 'dashboard' ? '500' : '400',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => { if(activeTab !== 'dashboard') e.currentTarget.style.color = 'white' }}
              onMouseOut={(e) => { if(activeTab !== 'dashboard') e.currentTarget.style.color = '#94a3b8' }}
            >
              Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('produtos')}
              style={{ 
                background: activeTab === 'produtos' ? 'rgba(255,255,255,0.1)' : 'transparent', 
                border: 'none', 
                color: activeTab === 'produtos' ? 'white' : '#94a3b8', 
                cursor: 'pointer', 
                fontWeight: activeTab === 'produtos' ? '500' : '400',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => { if(activeTab !== 'produtos') e.currentTarget.style.color = 'white' }}
              onMouseOut={(e) => { if(activeTab !== 'produtos') e.currentTarget.style.color = '#94a3b8' }}
            >
              Produtos
            </button>
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <span style={{ fontSize: '0.875rem', color: '#94a3b8', display: { xs: 'none', sm: 'block' } }}>{user?.email}</span>
          <button 
            onClick={signOut} 
            style={{ 
              padding: '0.5rem 1rem', 
              backgroundColor: 'transparent', 
              color: 'white', 
              border: '1px solid #334155', 
              borderRadius: '4px', 
              cursor: 'pointer',
              fontSize: '0.875rem',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#1e293b'; e.currentTarget.style.borderColor = '#475569' }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = '#334155' }}
          >
            Sair
          </button>
        </div>
      </header>
      
      <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%', flex: 1 }}>
        {renderContent()}
      </main>
    </div>
  )
}
