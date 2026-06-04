"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Search, Coffee, ShoppingBag } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { getMenuItems, MenuItem } from "@/lib/api"
import { addToCart } from "@/lib/cart"
import Image from "next/image"

const categories = [
  { id: "all", name: "Tất cả" },
  { id: "coffee", name: "Cà phê" },
  { id: "tea", name: "Trà" },
  { id: "smoothie", name: "Sinh tố" },
  { id: "pastry", name: "Bánh ngọt" },
]

const skeletonCards = ["one", "two", "three", "four", "five", "six", "seven", "eight"]

function formatPrice(price: number): string {
  return price.toLocaleString("vi-VN") + "đ"
}

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")

  const fetchMenu = async (q: string, category: string) => {
    setIsLoading(true)
    setError("")
    try {
      const nextCategory = category === "all" ? undefined : category
      const res = await getMenuItems({
        q: q || undefined,
        category: nextCategory,
        limit: 50,
      })
      setItems(res.data.items)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không thể tải thực đơn")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMenu(searchQuery, activeCategory)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, activeCategory])

  let content: React.ReactNode

  if (isLoading) {
    content = (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {skeletonCards.map((card) => (
          <div key={card} className="h-72 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    )
  } else if (error) {
    content = (
      <div className="py-20 text-center text-muted-foreground">
        <p className="text-red-500">{error}</p>
        <button onClick={() => fetchMenu(searchQuery, activeCategory)} className="mt-4 text-primary hover:underline">
          Thử lại
        </button>
      </div>
    )
  } else if (items.length === 0) {
    content = (
      <div className="py-20 text-center text-muted-foreground">
        <Coffee className="mx-auto mb-4 h-12 w-12 opacity-30" />
        <p>Không tìm thấy món phù hợp</p>
      </div>
    )
  } else {
    content = (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-lg"
          >
            <div className="relative aspect-square overflow-hidden bg-muted">
              {item.image_url ? (
                <Image
                  src={item.image_url}
                  alt={item.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  unoptimized
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Coffee className="h-16 w-16 text-muted-foreground/30" />
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-foreground">{item.name}</h3>
              {item.description && (
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{item.description}</p>
              )}
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="text-lg font-bold text-primary">{formatPrice(item.price)}</span>
                <span className="rounded-full bg-secondary px-2 py-1 text-xs text-secondary-foreground capitalize">
                  {item.category}
                </span>
              </div>
              <Button
                className="mt-3 w-full gap-2"
                variant="secondary"
                onClick={() => addToCart(item)}
              >
                <ShoppingBag className="h-4 w-4" />
                Thêm vào giỏ
              </Button>
            </div>
          </motion.div>
        ))}
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
            <h1 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">Thực đơn</h1>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Khám phá những đồ uống và bánh ngọt được chế biến từ nguyên liệu chất lượng cao
            </p>
          </motion.div>

          {/* Search & Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 flex flex-col gap-4 sm:flex-row"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm món..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    activeCategory === cat.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Content */}
          {content}
        </div>
      </main>

      <Footer />
    </div>
  )
}
