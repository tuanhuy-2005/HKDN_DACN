"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ShoppingBag, Minus, Plus, Trash2, CreditCard, ArrowRight } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createInvoice, getToken } from "@/lib/api"
import { clearCart, getCart, removeCartItem, updateCartItemQuantity, type CartItem } from "@/lib/cart"
import Image from "next/image"

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")

  const syncCart = () => {
    setItems(getCart())
  }

  useEffect(() => {
    syncCart()
    globalThis.addEventListener("storage", syncCart)
    return () => globalThis.removeEventListener("storage", syncCart)
  }, [])

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const handleQuantity = (menuItemId: number, nextQty: number) => {
    updateCartItemQuantity(menuItemId, nextQty)
    syncCart()
  }

  const handleRemove = (menuItemId: number) => {
    removeCartItem(menuItemId)
    syncCart()
  }

  const handleCheckout = async () => {
    if (!getToken()) {
      setMessage("Vui lòng đăng nhập để thanh toán")
      return
    }

    if (items.length === 0) {
      setMessage("Giỏ hàng đang trống")
      return
    }

    setIsLoading(true)
    setMessage("")
    try {
      await createInvoice({
        items: items.map((item) => ({ menu_item_id: item.menu_item_id, quantity: item.quantity })),
        payment_method: "cash",
        status: "paid",
      })
      clearCart()
      syncCart()
      setMessage("Đặt hàng thành công")
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "Thanh toán thất bại")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
            <h1 className="mb-3 text-3xl font-bold text-foreground md:text-4xl">Giỏ hàng</h1>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Kiểm tra món đã chọn trước khi đặt hàng và thanh toán.
            </p>
          </motion.div>

          {message && (
            <div className="mx-auto mb-6 max-w-3xl rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground">
              {message}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
            <div className="space-y-4">
              {items.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <ShoppingBag className="mb-4 h-14 w-14 text-muted-foreground/30" />
                    <h2 className="mb-2 text-xl font-semibold text-foreground">Giỏ hàng đang trống</h2>
                    <p className="mb-6 text-muted-foreground">Hãy quay lại thực đơn và thêm món bạn thích.</p>
                    <Button asChild>
                      <Link href="/menu" className="gap-2">
                        Xem thực đơn
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                items.map((item) => (
                  <Card key={item.menu_item_id}>
                    <CardContent className="flex gap-4 p-4">
                      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-muted">
                        {item.image_url ? (
                          <Image src={item.image_url} alt={item.name} fill className="object-cover" unoptimized />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-foreground">{item.name}</h3>
                            <Badge variant="secondary" className="mt-2 capitalize">{item.category}</Badge>
                          </div>
                          <button className="text-muted-foreground hover:text-red-600" onClick={() => handleRemove(item.menu_item_id)}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center gap-2 rounded-full border border-border px-2 py-1">
                            <button onClick={() => handleQuantity(item.menu_item_id, item.quantity - 1)} className="rounded-full p-1 hover:bg-secondary">
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="min-w-6 text-center text-sm font-medium">{item.quantity}</span>
                            <button onClick={() => handleQuantity(item.menu_item_id, item.quantity + 1)} className="rounded-full p-1 hover:bg-secondary">
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Đơn giá</p>
                            <p className="font-semibold text-foreground">{item.price.toLocaleString("vi-VN")}đ</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            <Card className="h-fit">
              <CardContent className="space-y-4 p-5">
                <h2 className="text-xl font-semibold text-foreground">Tổng đơn</h2>
                <div className="space-y-3 rounded-xl bg-muted/40 p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Số món</span>
                    <span className="font-medium text-foreground">{items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Tạm tính</span>
                    <span className="font-medium text-foreground">{total.toLocaleString("vi-VN")}đ</span>
                  </div>
                </div>
                <Button className="w-full gap-2" size="lg" onClick={handleCheckout} disabled={isLoading || items.length === 0}>
                  <CreditCard className="h-4 w-4" />
                  {isLoading ? "Đang xử lý..." : "Thanh toán / tạo hóa đơn"}
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/menu">Tiếp tục chọn món</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}