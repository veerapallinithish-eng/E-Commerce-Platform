import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api, { getImageUrl } from '../../api'

export default function ProductForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category_id: '',
    image_url: ''
  })
  const [files, setFiles] = useState([])
  const [filePreviews, setFilePreviews] = useState([])
  const [gallery, setGallery] = useState([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    api.get('/categories').then(res => setCategories(res.data))
  }, [])

  useEffect(() => {
    if (isEdit) {
      api.get(`/products/${id}`).then(res => {
        const p = res.data
        setForm({
          name: p.name,
          description: p.description || '',
          price: p.price,
          stock: p.stock,
          category_id: p.category_id,
          image_url: p.image_url || ''
        })
        setGallery(p.gallery?.length ? p.gallery : (p.image_url ? [p.image_url] : []))
      })
    }
  }, [id, isEdit])

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function addFiles(selectedFiles) {
    const selected = Array.from(selectedFiles).filter(file => file.type.startsWith('image/'))
    setFiles(current => [...current, ...selected])
    setFilePreviews(current => [...current, ...selected.map(file => URL.createObjectURL(file))])
    setError(selected.length === selectedFiles.length ? '' : 'Only image files can be uploaded')
  }

  function handleFileChange(e) {
    addFiles(e.target.files)
    e.target.value = ''
  }

  function removeExistingImage(index) {
    setGallery(current => current.filter((_, imageIndex) => imageIndex !== index))
  }

  function removeSelectedFile(index) {
    URL.revokeObjectURL(filePreviews[index])
    setFiles(current => current.filter((_, fileIndex) => fileIndex !== index))
    setFilePreviews(current => current.filter((_, fileIndex) => fileIndex !== index))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const uploadedUrls = []
      if (files.length) {
        setUploading(true)
        for (let fileIndex = 0; fileIndex < files.length; fileIndex += 1) {
          const formData = new FormData()
          formData.append('image', files[fileIndex])
          const uploadRes = await api.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: event => {
              const fileProgress = event.total ? event.loaded / event.total : 0
              setProgress(Math.round(((fileIndex + fileProgress) / files.length) * 100))
            }
          })
          uploadedUrls.push(uploadRes.data.image_url)
        }
      }

      const imageUrls = [...gallery, ...uploadedUrls]

      const payload = {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        stock: parseInt(form.stock, 10),
        category_id: parseInt(form.category_id, 10),
        image_url: imageUrls[0] || '',
        image_urls: imageUrls
      }

      if (isEdit) {
        await api.put(`/products/${id}`, payload)
      } else {
        await api.post('/products', payload)
      }

      navigate('/admin/products')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save product')
    } finally {
      setSaving(false)
      setUploading(false)
      setProgress(0)
    }
  }

  const stockPreviewLow = form.stock !== '' && Number(form.stock) > 0 && Number(form.stock) < 5
  const stockPreviewOut = form.stock !== '' && Number(form.stock) === 0

  return (
    <div className="container fade-in" style={{ maxWidth: 520 }}>
      <h2>{isEdit ? 'Edit Product' : 'Add New Product'}</h2>

      <form onSubmit={handleSubmit} className="card slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Product Name</label>
          <input name="name" placeholder="Product Name" value={form.name} onChange={handleChange} required style={{ marginTop: 4 }} />
        </div>

        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Description</label>
          <textarea name="description" placeholder="Description" rows={3} value={form.description} onChange={handleChange} style={{ marginTop: 4 }} />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Price (₹)</label>
            <input name="price" type="number" step="0.01" placeholder="0.00" value={form.price} onChange={handleChange} required style={{ marginTop: 4 }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Stock</label>
            <input name="stock" type="number" placeholder="0" value={form.stock} onChange={handleChange} required style={{ marginTop: 4 }} />
            {stockPreviewOut && <span className="badge badge-outofstock" style={{ marginTop: 6, display: 'inline-flex' }}>Will show Out of Stock</span>}
            {stockPreviewLow && <span className="badge badge-lowstock" style={{ marginTop: 6, display: 'inline-flex' }}>Will show Low Stock</span>}
          </div>
        </div>

        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Category</label>
          <select name="category_id" value={form.category_id} onChange={handleChange} required style={{ marginTop: 4 }}>
            <option value="">Select Category</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Product Images</label>
          <label
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files) }}
            style={{
              display: 'block',
              marginTop: 4,
              padding: '24px 16px',
              textAlign: 'center',
              cursor: 'pointer',
              border: `2px dashed ${dragging ? 'var(--primary)' : 'var(--border)'}`,
              borderRadius: 10,
              background: dragging ? 'rgba(39, 105, 82, 0.08)' : 'transparent'
            }}
          >
            <strong>Drop images here</strong>
            <span style={{ display: 'block', marginTop: 4, color: 'var(--text-muted)', fontSize: 12 }}>or click to choose multiple PNG, JPG, JPEG, or WebP files</span>
            <input type="file" accept="image/*" multiple onChange={handleFileChange} style={{ display: 'none' }} />
          </label>
        </div>

        {(gallery.length > 0 || files.length > 0) ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 10 }}>
            {gallery.map((imageUrl, index) => (
              <div key={`existing-${imageUrl}-${index}`} style={{ position: 'relative' }}>
                <img src={getImageUrl(imageUrl)} alt={`Gallery ${index + 1}`} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />
                <button type="button" onClick={() => removeExistingImage(index)} aria-label="Remove image" style={{ position: 'absolute', top: 4, right: 4 }}>×</button>
              </div>
            ))}
            {files.map((selectedFile, index) => (
              <div key={`${selectedFile.name}-${selectedFile.lastModified}`} style={{ position: 'relative' }}>
                <img src={filePreviews[index]} alt={`New upload ${index + 1}`} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />
                <button type="button" onClick={() => removeSelectedFile(index)} aria-label="Remove image" style={{ position: 'absolute', top: 4, right: 4 }}>×</button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>No images selected</div>
        )}

        {uploading && <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Uploading {progress}%</div>}

        {error && <p className="text-danger" style={{ margin: 0 }}>{error}</p>}

        <button className="btn" type="submit" disabled={saving || uploading}>
          {uploading ? 'Uploading image...' : saving ? 'Saving...' : isEdit ? 'Update Product' : 'Add Product'}
        </button>
      </form>
    </div>
  )
}
