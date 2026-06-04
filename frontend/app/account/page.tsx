"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { User, Mail, Phone, Receipt, CalendarDays, Save } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { getMe, getMyInvoices, getMyReservations, updateMe, removeToken, getUser, setUser } from "@/lib/api"
import type { Invoice, Reservation } from "@/lib/api"

export default function AccountPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<{ name: string; email: string; phone: string } | null>(null)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    const user = getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const load = async () => {
      setLoading(true)
      try {
        const [me, resRes, invRes] = await Promise.all([getMe(), getMyReservations(), getMyInvoices()])
        setProfile({
          name: String(me.name ?? ''),
          email: String(me.email ?? ''),
          phone: String(me.phone ?? ''),
        })
        setReservations(resRes.data.items)
        setInvoices(invRes.data.items)
      } catch {
        setMessage('Không thể tải dữ liệu tài khoản')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [router])

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    setMessage('')
    try {
      const res = await updateMe(profile)
      const nextUser = res.data.user
      setProfile({
        name: String(nextUser.name ?? ''),
        email: String(nextUser.email ?? ''),
        phone: String(nextUser.phone ?? ''),
      })
      setUser(nextUser)
      setMessage('Đã cập nhật tài khoản')
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : 'Cập nhật thất bại')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    removeToken()
    router.push('/')
  }

  const getReservationBadgeVariant = (status: string) => {
    if (status === 'confirmed') return 'default'
    if (status === 'cancelled') return 'destructive'
    return 'secondary'
  }

  const getInvoiceBadgeVariant = (status: string) => {
    if (status === 'paid') return 'default'
    if (status === 'cancelled') return 'destructive'
    return 'secondary'
  }

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="py-16">
          <div className="container mx-auto px-4 text-center text-muted-foreground">Đang tải...</div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
            <h1 className="mb-3 text-3xl font-bold text-foreground md:text-4xl">Quản lý tài khoản</h1>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Cập nhật thông tin cá nhân, xem lịch sử đặt bàn và hóa đơn.
            </p>
          </motion.div>

          {message && (
            <div className="mx-auto mb-6 max-w-4xl rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground">
              {message}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <Card>
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Xin chào</p>
                    <h2 className="text-xl font-semibold text-foreground">{profile.name}</h2>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Họ tên</Label>
                    <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input className="pl-10" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Số điện thoại</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input className="pl-10" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button className="flex-1 gap-2" onClick={handleSave} disabled={saving}>
                    <Save className="h-4 w-4" />
                    {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={handleLogout}>Đăng xuất</Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">Lịch sử đặt bàn</h3>
                  </div>
                  <div className="space-y-3">
                    {reservations.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Chưa có đặt bàn nào</p>
                    ) : (
                      reservations.slice(0, 4).map((reservation) => (
                        <div key={reservation.id} className="rounded-lg border border-border p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-medium text-foreground">{reservation.date ?? reservation.reservation_date}</p>
                              <p className="text-sm text-muted-foreground">{reservation.time ?? reservation.reservation_time} · {reservation.guests} người</p>
                            </div>
                            <Badge variant={getReservationBadgeVariant(reservation.status)}>
                              {reservation.status}
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">Hóa đơn gần đây</h3>
                  </div>
                  <div className="space-y-3">
                    {invoices.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Chưa có hóa đơn nào</p>
                    ) : (
                      invoices.slice(0, 4).map((invoice) => (
                        <div key={invoice.id} className="rounded-lg border border-border p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-medium text-foreground">{invoice.code}</p>
                              <p className="text-sm text-muted-foreground">{(invoice.items?.length ?? 0)} sản phẩm · {invoice.total.toLocaleString('vi-VN')}đ</p>
                            </div>
                            <Badge variant={getInvoiceBadgeVariant(invoice.status)}>
                              {invoice.status}
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}