"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Search, Calendar, Clock, Users, Phone, Mail, Check, X, Eye } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  getAdminReservation,
  getAdminReservations,
  updateAdminReservation,
  Reservation,
} from "@/lib/api"

const statusOptions = [
  { id: "all", name: "Tất cả" },
  { id: "pending", name: "Chờ xử lý" },
  { id: "confirmed", name: "Đã xác nhận" },
  { id: "cancelled", name: "Đã hủy" },
]

export default function AdminReservationsPage() {
  const [items, setItems] = useState<Reservation[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeStatus, setActiveStatus] = useState("all")
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await getAdminReservations({
        q: searchQuery || undefined,
          status: activeStatus === "all" ? undefined : activeStatus,
        limit: 50,
      })
      setItems(res.data.items)
      setTotal(res.meta.total)
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

  const handleStatusChange = async (id: number, status: string) => {
    setActionLoading(id)
    try {
      const updated = await updateAdminReservation(id, { status })
      setItems((prev) => prev.map((r) => (r.id === id ? { ...r, ...updated.data } : r)))
      if (selectedReservation?.id === id) setSelectedReservation({ ...selectedReservation, ...updated.data })
    } catch {
      /* ignore */
    } finally {
      setActionLoading(null)
    }
  }

  const openReservation = async (reservation: Reservation) => {
    setSelectedReservation(reservation)
    try {
      const res = await getAdminReservation(reservation.id)
      setSelectedReservation({ ...reservation, ...res.data })
    } catch {
      /* keep list data */
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-green-100 text-green-700"
      case "pending": return "bg-yellow-100 text-yellow-700"
      case "cancelled": return "bg-red-100 text-red-700"
      default: return "bg-secondary text-secondary-foreground"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed": return "Đã xác nhận"
      case "pending": return "Chờ xử lý"
      case "cancelled": return "Đã hủy"
      default: return status
    }
  }

  const pending = items.filter((r) => r.status === "pending").length
  const confirmed = items.filter((r) => r.status === "confirmed").length
  const cancelled = items.filter((r) => r.status === "cancelled").length

  let tableContent: React.ReactNode
  if (isLoading) {
    tableContent = <div className="p-8 text-center text-muted-foreground">Đang tải...</div>
  } else if (items.length === 0) {
    tableContent = <div className="p-8 text-center text-muted-foreground">Không có đặt bàn nào</div>
  } else {
    tableContent = (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Khách hàng</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Ngày</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Giờ</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Số người</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Trạng thái</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {items.map((reservation, index) => (
              <motion.tr key={reservation.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}
                className="border-b border-border last:border-0 hover:bg-muted/50">
                <td className="px-4 py-4">
                  <p className="font-medium text-foreground">{reservation.customer ?? reservation.name}</p>
                  <p className="text-sm text-muted-foreground">{reservation.phone}</p>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2 text-foreground">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {reservation.date ?? reservation.reservation_date}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2 text-foreground">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {reservation.time ?? reservation.reservation_time}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2 text-foreground">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    {reservation.guests}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${getStatusBadge(reservation.status)}`}>
                    {getStatusText(reservation.status)}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => void openReservation(reservation)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {reservation.status === "pending" && (
                      <>
                        <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700"
                          disabled={actionLoading === reservation.id}
                          onClick={() => handleStatusChange(reservation.id, "confirmed")}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700"
                          disabled={actionLoading === reservation.id}
                          onClick={() => handleStatusChange(reservation.id, "cancelled")}>
                          <X className="h-4 w-4" />
                        </Button>
                      </>
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
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Quản lý đặt bàn</h1>
        <p className="text-muted-foreground">Quản lý tất cả yêu cầu đặt bàn ({total} tổng)</p>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100">
            <Clock className="h-6 w-6 text-yellow-700" />
          </div>
          <div><p className="text-2xl font-bold text-foreground">{pending}</p><p className="text-sm text-muted-foreground">Chờ xử lý</p></div>
        </CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
            <Check className="h-6 w-6 text-green-700" />
          </div>
          <div><p className="text-2xl font-bold text-foreground">{confirmed}</p><p className="text-sm text-muted-foreground">Đã xác nhận</p></div>
        </CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100">
            <X className="h-6 w-6 text-red-700" />
          </div>
          <div><p className="text-2xl font-bold text-foreground">{cancelled}</p><p className="text-sm text-muted-foreground">Đã hủy</p></div>
        </CardContent></Card>
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Tìm kiếm khách hàng, số điện thoại..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <div className="flex gap-2">
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

      {/* Detail Modal */}
      {selectedReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-xl bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Chi tiết đặt bàn</h2>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusBadge(selectedReservation.status)}`}>
                {getStatusText(selectedReservation.status)}
              </span>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{selectedReservation.customer ?? selectedReservation.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedReservation.guests} người</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Số điện thoại</p>
                  <p className="font-medium text-foreground">{selectedReservation.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium text-foreground">{selectedReservation.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Thời gian</p>
                  <p className="font-medium text-foreground">
                    {selectedReservation.date ?? selectedReservation.reservation_date} - {selectedReservation.time ?? selectedReservation.reservation_time}
                  </p>
                </div>
              </div>
              {selectedReservation.notes && (
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-sm text-muted-foreground">Ghi chú:</p>
                  <p className="text-foreground">{selectedReservation.notes}</p>
                </div>
              )}
            </div>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setSelectedReservation(null)}>Đóng</Button>
              {selectedReservation.status === "pending" && (
                <Button className="flex-1" disabled={actionLoading === selectedReservation.id}
                  onClick={() => handleStatusChange(selectedReservation.id, "confirmed")}>
                  Xác nhận
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
