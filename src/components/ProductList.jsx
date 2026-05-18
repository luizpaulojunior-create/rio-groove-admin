import { useState, useEffect } from 'react'
import { productsService } from '../services/products'
import { storageService } from '../services/storage'
import ProductCard from './ProductCard'
import ProductForm from './ProductForm'

export default function ProductList() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formLoading, setFormLoading] = useState(false)

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const data = await productsService.getProducts()
      setProducts(data || [])
    } catch (err) {
      setError(err.message || 'Erro ao carregar produtos.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleAddNew = () => {
    setEditingProduct(null)
    setIsFormOpen(true)
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setIsFormOpen(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.')) return
    
    try {
      const productToDelete = products.find(p => p.id === id)
      
      await productsService.deleteProduct(id)
      
      if (productToDelete?.image_url) {
        await storageService.deleteProductImage(productToDelete.image_url)
      }
      
      setProducts(products.filter(p => p.id !== id))
    } catch (err) {
      alert('Erro ao excluir produto')
      console.error(err)
    }
  }

  const handleSubmit = async (formData, imageFile) => {
    try {
      setFormLoading(true)
      
      const payload = new FormData();
      
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== undefined) {
          payload.append(key, formData[key]);
        }
      });
      
      if (imageFile) {
        payload.append('image', imageFile);
        
        if (editingProduct && editingProduct.image_url) {
          await storageService.deleteProductImage(editingProduct.image_url);
        }
      } else if (editingProduct && editingProduct.image_url && !formData.image_url) {
        payload.append('image_url', '');
        await storageService.deleteProductImage(editingProduct.image_url);
      }

      if (editingProduct) {
        await productsService.updateProduct(editingProduct.id, payload)
      } else {
        await productsService.createProduct(payload)
      }
      
      await fetchProducts()
      setIsFormOpen(false)
    } catch (err) {
      alert(`Erro ao salvar produto: ${err.message}`)
      console.error(err)
    } finally {
      setFormLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
        <p>Carregando produtos...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '1.5rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '8px' }}>
        <p style={{ margin: 0 }}>{error}</p>
        <button onClick={fetchProducts} style={{ marginTop: '1rem', padding: '0.5rem 1rem', backgroundColor: '#991b1b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Tentar novamente
        </button>
      </div>
    )
  }

  if (isFormOpen) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: 'white', padding: '2.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
        <h2 style={{ marginTop: 0, marginBottom: '2rem', color: '#0f172a', fontSize: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
          {editingProduct ? 'Editar Produto' : 'Adicionar Novo Produto'}
        </h2>
        <ProductForm 
          initialData={editingProduct} 
          onSubmit={handleSubmit} 
          onCancel={() => setIsFormOpen(false)}
          loading={formLoading}
        />
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, color: '#0f172a', fontSize: '1.5rem' }}>Produtos</h2>
          <p style={{ margin: '0.5rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>Gerencie o catálogo da sua loja</p>
        </div>
        <button 
          onClick={handleAddNew}
          style={{ padding: '0.75rem 1.25rem', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'background-color 0.2s' }}
          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#1e293b' }}
          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#0f172a' }}
        >
          <span>+</span> Novo Produto
        </button>
      </div>

      {products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', backgroundColor: 'white', borderRadius: '12px', border: '2px dashed #cbd5e1' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>Nenhum produto encontrado</h3>
          <p style={{ margin: '0 0 1.5rem 0', color: '#64748b' }}>Comece adicionando seu primeiro produto ao catálogo.</p>
          <button 
            onClick={handleAddNew}
            style={{ padding: '0.5rem 1rem', backgroundColor: 'white', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}
          >
            Adicionar Produto
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {products.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onEdit={handleEdit} 
              onDelete={handleDelete} 
            />
          ))}
        </div>
      )}
    </div>
  )
}
