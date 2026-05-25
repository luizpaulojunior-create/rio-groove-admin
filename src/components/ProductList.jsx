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

  const fetchProducts = async (showLoading = true) => {
    try {
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
    fetchProducts(false)
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
      
      await fetchProducts(false)
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
      <div className="flex justify-center p-12">
        <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card-premium border-red-500/20 bg-red-500/5 text-center p-8">
        <p className="text-red-400 mb-4">{error}</p>
        <button onClick={fetchProducts} className="btn-secondary !h-10 mx-auto">
          Tentar novamente
        </button>
      </div>
    )
  }

  if (isFormOpen) {
    return (
      <div className="card-premium max-w-4xl mx-auto">
        <h2 className="font-heading text-3xl mb-8 border-b border-[var(--color-border)] pb-4 text-white">
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
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-4xl mb-2">Produtos</h1>
          <p className="text-[var(--color-text-muted)] font-sans">Gerencie o catálogo da sua loja</p>
        </div>
        <button 
          onClick={handleAddNew}
          className="btn-primary"
        >
          Novo Produto
        </button>
      </div>

      {products.length === 0 ? (
        <div className="card-premium border-dashed text-center p-12 flex flex-col items-center">
          <h3 className="font-heading text-2xl text-white mb-2">Nenhum produto encontrado</h3>
          <p className="text-[var(--color-text-muted)] font-sans mb-6">Comece adicionando seu primeiro produto ao catálogo.</p>
          <button 
            onClick={handleAddNew}
            className="btn-secondary"
          >
            Adicionar Produto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
