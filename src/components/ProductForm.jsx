import { useState, useEffect, useRef } from 'react'

export default function ProductForm({ initialData, onSubmit, onCancel, loading }) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    stock: 0,
    category: '',
    image_url: '',
    active: true
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        price: initialData.price || ''
      })
      setImagePreview(initialData.image_url || '')
    }
  }, [initialData])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview('')
    setFormData(prev => ({ ...prev, image_url: '' }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData, imageFile)
  }

  const inputStyle = { width: '100%', padding: '0.625rem', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', fontSize: '0.875rem' }
  const labelStyle = { display: 'block', marginBottom: '0.375rem', fontSize: '0.875rem', fontWeight: '500', color: '#334155' }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <div style={{ flex: 2 }}>
          <label style={labelStyle}>Nome do Produto</label>
          <input required type="text" name="name" value={formData.name} onChange={handleChange} style={inputStyle} placeholder="Ex: Camiseta Básica Branca" />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Categoria</label>
          <input type="text" name="category" value={formData.category} onChange={handleChange} style={inputStyle} placeholder="Ex: Camisetas" />
        </div>
      </div>
      
      <div>
        <label style={labelStyle}>Slug (opcional - gerado automaticamente se vazio)</label>
        <input type="text" name="slug" value={formData.slug} onChange={handleChange} style={inputStyle} placeholder="Ex: camiseta-basica-branca" />
      </div>

      <div>
        <label style={labelStyle}>Descrição</label>
        <textarea name="description" value={formData.description} onChange={handleChange} rows={4} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Descreva o produto..." />
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Preço (R$)</label>
          <input required type="number" step="0.01" min="0" name="price" value={formData.price} onChange={handleChange} style={inputStyle} placeholder="0.00" />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Quantidade em Estoque</label>
          <input required type="number" min="0" name="stock" value={formData.stock} onChange={handleChange} style={inputStyle} placeholder="0" />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Imagem do Produto</label>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageChange} 
              ref={fileInputRef}
              style={{ ...inputStyle, padding: '0.5rem', backgroundColor: 'white' }} 
            />
            <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
              Formatos suportados: JPG, PNG, WEBP.
            </span>
          </div>
          {imagePreview && (
            <div style={{ width: '120px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ width: '120px', height: '120px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc' }}>
                <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <button 
                type="button" 
                onClick={handleRemoveImage}
                style={{ padding: '0.25rem', fontSize: '0.75rem', backgroundColor: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}
              >
                Remover Imagem
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input type="checkbox" name="active" checked={formData.active} onChange={handleChange} style={{ width: '1rem', height: '1rem', cursor: 'pointer' }} />
          <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#334155' }}>Produto Ativo (visível na loja)</span>
        </label>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
        <button type="button" onClick={onCancel} style={{ flex: 1, padding: '0.75rem', backgroundColor: 'white', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>
          Cancelar
        </button>
        <button disabled={loading} type="submit" style={{ flex: 1, padding: '0.75rem', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '500', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Salvando...' : 'Salvar Produto'}
        </button>
      </div>
    </form>
  )
}
