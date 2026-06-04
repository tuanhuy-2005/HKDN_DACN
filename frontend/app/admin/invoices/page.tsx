"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Search, Receipt, Eye, Printer, Calendar, DollarSign } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getAdminInvoice, getAdminInvoices, updateAdminInvoice, Invoice } from "@/lib/api"

const statusOptions = [
  { id: "all", name: "Tất cả" },
  { id: "paid", name: "Đã thanh toán" },
  { id: "pending", name: "Chờ thanh toán" },
  { id: "cancelled", name: "Đã hủy" },
]

function formatPrice(price: number) {
  return price.toLocaleString("vi-VN") + "đ"
}

export default function AdminInvoicesPage() {
  const [items, setItems] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeStatus, setActiveStatus] = useState("all")
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [actionLoading, setActionLoading] = useState<string | number | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await getAdminInvoices({
        q: searchQuery || undefined,
          status: activeStatus === "all" ? undefined : activeStatus,
        limit: 50,
      })
      setItems(res.data.items)
    } catch {
      setItems([])
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, activeStatus])

  useEffect(() => {
    const t = setTimeout(fetchData, 300)
    return () => clearTimeout(t)
  }, [fetchData])

  const handleMarkPaid = async (invoice: Invoice) => {
    setActionLoading(invoice.id)
    try {
      const updated = await updateAdminInvoice(invoice.id, { status: "paid" })
      setItems((prev) => prev.map((i) => (i.id === invoice.id ? { ...i, ...updated.data } : i)))
      if (selectedInvoice?.id === invoice.id) setSelectedInvoice({ ...selectedInvoice, ...updated.data })
    } catch { /* ignore */ } finally {
      setActionLoading(null)
    }
  }

  const openInvoice = async (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    try {
      const res = await getAdminInvoice(invoice.id)
      setSelectedInvoice({ ...invoice, ...res.data })
    } catch {
      /* keep list data */
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-700"
      case "pending": return "bg-yellow-100 text-yellow-700"
      case "cancelled": return "bg-red-100 text-red-700"
      default: return "bg-secondary text-secondary-foreground"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "paid": return "Đã thanh toán"
      case "pending": return "Chờ thanh toán"
      case "cancelled": return "Đã hủy"
      default: return status
    }
  }

  const getPaymentMethodText = (method: string | null) => {
    switch (method) {
      case "cash": return "Tiền mặt"
      case "card": case "banking": return "Thẻ/Chuyển khoản"
      case "momo": return "MoMo"
      default: return method ?? "—"
    }
  }

  const totalRevenue = items.filter((i) => i.status === "paid").reduce((sum, i) => sum + i.total, 0)
  const pendingCount = items.filter((i) => i.status === "pending").length

  let tableContent: React.ReactNode
  if (isLoading) {
    tableContent = <div className="p-8 text-center text-muted-foreground">Đang tải...</div>
  } else if (items.length === 0) {
    tableContent = <div className="p-8 text-center text-muted-foreground">Không có hóa đơn nào</div>
  } else {
    tableContent = (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Mã HĐ</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Khách hàng</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Ngày</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Tổng tiền</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Thanh toán</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Trạng thái</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {items.map((invoice, index) => (
              <motion.tr key={invoice.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}
                className="border-b border-border last:border-0 hover:bg-muted/50">
                <td className="px-4 py-4">
                  <p className="font-mono font-medium text-foreground">{invoice.code}</p>
                </td>
                <td className="px-4 py-4">
                  <p className="font-medium text-foreground">{invoice.customer ?? invoice.user_name ?? "—"}</p>
                  <p className="text-sm text-muted-foreground">{invoice.items?.length ?? 0} sản phẩm</p>
                </td>
                <td className="px-4 py-4">
                  <p className="text-foreground">{invoice.date}</p>
                  <p className="text-sm text-muted-foreground">{invoice.time}</p>
                </td>
                <td className="px-4 py-4">
                  <p className="font-semibold text-foreground">{formatPrice(invoice.total)}</p>
                </td>
                <td className="px-4 py-4">
                  <p className="text-foreground">{getPaymentMethodText(invoice.paymentMethod)}</p>
                </td>
                <td className="px-4 py-4">
                  <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${getStatusBadge(invoice.status)}`}>
                    {getStatusText(invoice.status)}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => void openInvoice(invoice)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {invoice.status === "pending" && (
                      <Button variant="ghost" size="sm" className="text-green-600 text-xs"
                        disabled={actionLoading === invoice.id}
                        onClick={() => handleMarkPaid(invoice)}>
                        Thanh toán
                      </Button>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Quản lý hóa đơn</h1>
        <p className="text-muted-foreground">Quản lý tất cả hóa đơn và giao dịch</p>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Receipt className="h-6 w-6 text-primary" />
          </div>
          <div><p className="text-2xl font-bold text-foreground">{items.length}</p><p className="text-sm text-muted-foreground">Tổng hóa đơn</p></div>
        </CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
            <DollarSign className="h-6 w-6 text-green-700" />
          </div>
          <div><p className="text-lg font-bold text-foreground">{formatPrice(totalRevenue)}</p><p className="text-sm text-muted-foreground">Doanh thu</p></div>
        </CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100">
            <Calendar className="h-6 w-6 text-yellow-700" />
          </div>
          <div><p className="text-2xl font-bold text-foreground">{pendingCount}</p><p className="text-sm text-muted-foreground">Chờ thanh toán</p></div>
        </CardContent></Card>
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Tìm kiếm hóa đơn, khách hàng..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {statusOptions.map((s) => (
            <button key={s.id} onClick={() => setActiveStatus(s.id)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                activeStatus === s.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}>{s.name}</button>
          ))}
        </div>
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardContent className="p-0">
            {tableContent}
          </CardContent>
        </Card>
      </motion.div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-xl bg-card p-6 max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground">Hóa đơn #{selectedInvoice.code}</h2>
                <p className="text-sm text-muted-foreground">{selectedInvoice.date} - {selectedInvoice.time}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusBadge(selectedInvoice.status)}`}>
                {getStatusText(selectedInvoice.status)}
              </span>
            </div>

            <div className="mb-4 rounded-lg bg-muted p-3">
              <p className="text-sm text-muted-foreground">Khách hàng</p>
              <p className="font-medium text-foreground">{selectedInvoice.customer ?? selectedInvoice.user_name ?? "—"}</p>
            </div>

            {selectedInvoice.items && selectedInvoice.items.length > 0 && (
              <div className="mb-4 space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Sản phẩm</p>
                {selectedInvoice.items.map((item) => (
                  <div key={`${item.menu_item_id}-${item.name}`} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="font-medium text-foreground">{item.name}</p>
                      <p className="text-sm text-muted-foreground">x{item.quantity}</p>
                    </div>
                    <p className="font-medium text-foreground">{formatPrice(item.line_total)}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="mb-4 flex items-center justify-between rounded-lg bg-primary/10 p-4">
              <p className="font-medium text-foreground">Tổng cộng</p>
              <p className="text-xl font-bold text-primary">{formatPrice(selectedInvoice.total)}</p>
            </div>

            <div className="mb-6 text-sm text-muted-foreground">
              <p>Phương thức: {getPaymentMethodText(selectedInvoice.paymentMethod)}</p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setSelectedInvoice(null)}>Đóng</Button>
              {selectedInvoice.status === "pending" && (
                <Button className="flex-1" disabled={actionLoading === selectedInvoice.id}
                  onClick={() => handleMarkPaid(selectedInvoice)}>
                  <Printer className="mr-2 h-4 w-4" />
                  Xác nhận thanh toán
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
