"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Bell, Clock3, Database, ShieldCheck, Store, Users, Receipt, Calendar } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { getAdminSummary } from "@/lib/api"

type SettingState = {
  notifyNewOrders: boolean
  autoConfirmReservations: boolean
  showOutOfStockItems: boolean
}

const defaultSettings: SettingState = {
  notifyNewOrders: true,
  autoConfirmReservations: false,
  showOutOfStockItems: true,
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SettingState>(defaultSettings)
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof getAdminSummary>>["data"] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = globalThis.localStorage?.getItem("cafe_admin_settings")
    if (saved) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(saved) })
      } catch {
        /* ignore */
      }
    }
  }, [])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await getAdminSummary()
        setSummary(res.data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const updateSetting = (key: keyof SettingState, value: boolean) => {
    const next = { ...settings, [key]: value }
    setSettings(next)
    globalThis.localStorage?.setItem("cafe_admin_settings", JSON.stringify(next))
  }

  const counts = summary?.counts

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Cài đặt admin</h1>
        <p className="text-muted-foreground">Thiết lập hệ thống và xem dữ liệu vận hành đang đổ về</p>
      </motion.div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card><CardContent className="flex items-center gap-4 p-4"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10"><Users className="h-6 w-6 text-primary" /></div><div><p className="text-2xl font-bold text-foreground">{loading ? "..." : counts?.users ?? 0}</p><p className="text-sm text-muted-foreground">Tài khoản</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-4"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100"><Receipt className="h-6 w-6 text-green-700" /></div><div><p className="text-2xl font-bold text-foreground">{loading ? "..." : (summary?.revenue ?? 0).toLocaleString("vi-VN") + "đ"}</p><p className="text-sm text-muted-foreground">Doanh thu</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-4"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100"><Calendar className="h-6 w-6 text-yellow-700" /></div><div><p className="text-2xl font-bold text-foreground">{loading ? "..." : counts?.reservations ?? 0}</p><p className="text-sm text-muted-foreground">Đặt bàn</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-4"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary"><Database className="h-6 w-6 text-foreground" /></div><div><p className="text-2xl font-bold text-foreground">{loading ? "..." : counts?.menuItems ?? 0}</p><p className="text-sm text-muted-foreground">Món đang bán</p></div></CardContent></Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Store className="h-5 w-5" />Thiết lập chung</CardTitle>
            <CardDescription>Các tùy chọn vận hành cơ bản cho quản trị viên</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
              <div>
                <p className="font-medium text-foreground">Thông báo đơn mới</p>
                <p className="text-sm text-muted-foreground">Bật thông báo khi có hóa đơn mới</p>
              </div>
              <Switch checked={settings.notifyNewOrders} onCheckedChange={(checked) => updateSetting("notifyNewOrders", checked)} />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
              <div>
                <p className="font-medium text-foreground">Tự xác nhận đặt bàn</p>
                <p className="text-sm text-muted-foreground">Đổi trạng thái sang xác nhận khi tiếp nhận</p>
              </div>
              <Switch checked={settings.autoConfirmReservations} onCheckedChange={(checked) => updateSetting("autoConfirmReservations", checked)} />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
              <div>
                <p className="font-medium text-foreground">Hiển thị món hết hàng</p>
                <p className="text-sm text-muted-foreground">Cho phép admin thấy món tạm ẩn trong danh sách</p>
              </div>
              <Switch checked={settings.showOutOfStockItems} onCheckedChange={(checked) => updateSetting("showOutOfStockItems", checked)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" />Trạng thái dữ liệu</CardTitle>
            <CardDescription>Dữ liệu đang được nối từ đặt bàn, gọi món và doanh thu</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg bg-muted p-4 text-sm text-foreground">
              <div className="mb-2 flex items-center gap-2 text-muted-foreground"><Bell className="h-4 w-4" />Đơn hàng và đặt bàn hiện đang đẩy về backend qua API</div>
              <div className="mb-2 flex items-center gap-2 text-muted-foreground"><Clock3 className="h-4 w-4" />Doanh thu lấy từ hóa đơn đã thanh toán</div>
              <div className="flex items-center gap-2 text-muted-foreground"><Database className="h-4 w-4" />Trang tổng quan và cài đặt dùng chung nguồn dữ liệu</div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {summary?.recentInvoices.slice(0, 2).map((invoice) => (
                <div key={invoice.id} className="rounded-lg border border-border p-3">
                  <p className="text-sm text-muted-foreground">Hóa đơn gần nhất</p>
                  <p className="font-medium text-foreground">{invoice.code}</p>
                  <p className="text-sm text-muted-foreground">{invoice.total.toLocaleString("vi-VN")}đ</p>
                </div>
              ))}
              {summary?.recentReservations.slice(0, 2).map((reservation) => (
                <div key={reservation.id} className="rounded-lg border border-border p-3">
                  <p className="text-sm text-muted-foreground">Đặt bàn gần nhất</p>
                  <p className="font-medium text-foreground">{reservation.customer || reservation.name}</p>
                  <p className="text-sm text-muted-foreground">{reservation.date || reservation.reservation_date} · {reservation.time || reservation.reservation_time}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}