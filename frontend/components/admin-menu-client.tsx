'use client';

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { Plus, Search, Edit2, Trash2, Coffee } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  getAdminMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  uploadMenuImage,
  MenuItem,
} from "@/lib/api"

const categories = [
  { id: "all", name: "Tất cả" },
  { id: "coffee", name: "Cà phê" },
  { id: "tea", name: "Trà" },
  { id: "smoothie", name: "Sinh tố" },
  { id: "pastry", name: "Bánh ngọt" },
]

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  category: "coffee",
  image_url: "",
  is_active: 1 as number,
}

export function AdminMenuClient() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState("")
  const [imageUploading, setImageUploading] = useState(false)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await getAdminMenuItems({
        q: searchQuery || undefined,
        category: activeCategory !== "all" ? activeCategory : undefined,
        limit: 50,
      })
      setItems(res.data.items)
    } catch {
      setItems([])
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, activeCategory])

  useEffect(() => {
    const t = setTimeout(fetchData, 300)
    return () => clearTimeout(t)
  }, [fetchData])

  const openCreate = () => {
    setEditingItem(null)
    setFormData(EMPTY_FORM)
    setFormError("")
    setShowForm(true)
  }

  const openEdit = (item: MenuItem) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      description: item.description ?? "",
      price: String(item.price),
      category: item.category,
      image_url: item.image_url ?? "",
      is_active: item.is_active,
    })
    setFormError("")
    setShowForm(true)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageUploading(true)
    try {
      const res = await uploadMenuImage(file)
      setFormData((prev) => ({ ...prev, image_url: res.data.image_url }))
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Upload ảnh thất bại")
    } finally {
      setImageUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    setFormError("")
    const payload = {
      name: formData.name,
      description: formData.description || null,
      price: parseInt(formData.price),
      category: formData.category,
      image_url: formData.image_url || null,
      is_active: formData.is_active,
    }
    try {
      if (editingItem) {
        const res = await updateMenuItem(editingItem.id, payload)
        setItems((prev) => prev.map((i) => (i.id === editingItem.id ? res.data : i)))
      } else {
        await createMenuItem(payload)
        await fetchData()
      }
      setShowForm(false)
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Lưu thất bại")
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa món này?")) return
    try {
      await deleteMenuItem(id)
      setItems((prev) => prev.filter((i) => i.id !== id))
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Xóa thất bại")
    }
  }

  const handleToggleActive = async (item: MenuItem) => {
    try {
      const res = await updateMenuItem(item.id, { is_active: item.is_active ? 0 : 1 })
      setItems((prev) => prev.map((i) => (i.id === item.id ? res.data : i)))
    } catch { /* ignore */ }
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Quản lý thực đơn</h1>
          <p className="text-muted-foreground">Quản lý các món trong thực đơn ({items.length} món)</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Thêm món mới
        </Button>
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Tìm kiếm món ăn..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                activeCategory === cat.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}>{cat.name}</button>
          ))}
        </div>
      </motion.div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl bg-muted h-64" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          <Coffee className="mx-auto mb-4 h-12 w-12 opacity-30" />
          <p>Chưa có món nào</p>
          <Button className="mt-4" onClick={openCreate}>Thêm món đầu tiên</Button>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item, index) => (
            <motion.div key={item.id}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}
              className="group overflow-hidden rounded-xl border border-border bg-card">
              <div className="relative aspect-square overflow-hidden bg-muted">
                {item.image_url ? (
                  <Image src={item.image_url} alt={item.name} fill className="object-cover" unoptimized />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Coffee className="h-12 w-12 text-muted-foreground/30" />
                  </div>
                )}
                {!item.is_active && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-medium text-white">Đã ẩn</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-foreground">{item.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-bold text-primary">{item.price.toLocaleString("vi-VN")}đ</span>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs capitalize">{item.category}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => openEdit(item)}>
                    <Edit2 className="h-3 w-3" /> Sửa
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleToggleActive(item)}
                    className={item.is_active ? "text-yellow-600" : "text-green-600"}>
                    {item.is_active ? "Ẩn" : "Hiện"}
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700"
                    onClick={() => handleDelete(item.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg rounded-xl bg-card p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="mb-4 text-xl font-bold text-foreground">
              {editingItem ? "Chỉnh sửa món" : "Thêm món mới"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{formError}</div>
              )}

              <div className="space-y-2">
                <Label>Tên món</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Giá (đ)</Label>
                  <Input type="number" min="0" value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Danh mục</Label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    {categories.filter((c) => c.id !== "all").map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Mô tả</Label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>

              <div className="space-y-2">
                <Label>Hình ảnh</Label>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload}
                  className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground" />
                {imageUploading && <p className="text-sm text-muted-foreground">Đang tải ảnh...</p>}
                {formData.image_url && (
                  <div className="relative h-32 w-32 overflow-hidden rounded-lg border">
                    <Image src={formData.image_url} alt="preview" fill className="object-cover" unoptimized />
                  </div>
                )}
                <Input placeholder="Hoặc nhập URL ảnh" value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} />
              </div>

              <div className="flex items-center gap-3">
                <input type="checkbox" id="is_active" checked={!!formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })}
                  className="h-4 w-4" />
                <Label htmlFor="is_active">Hiển thị công khai</Label>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowForm(false)}>
                  Hủy
                </Button>
                <Button type="submit" className="flex-1" disabled={formLoading}>
                  {formLoading ? "Đang lưu..." : (editingItem ? "Cập nhật" : "Thêm món")}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
