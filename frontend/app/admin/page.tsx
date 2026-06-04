"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
  Coffee, Calendar, Receipt, Users,
  TrendingUp, TrendingDown, ArrowUpRight
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getAdminSummary, type AdminSummary } from "@/lib/api"

const fadeInUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<AdminSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const res = await getAdminSummary()
        setSummary(res.data)
      } catch { /* ignore */ } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const counts = summary?.counts
  const recentInvoices = summary?.recentInvoices ?? []
  const recentReservations = summary?.recentReservations ?? []
  const totalRevenue = summary?.revenue ?? 0

  const stats = [
    {
      title: "Tổng doanh thu",
      value: totalRevenue.toLocaleString("vi-VN") + "đ",
      change: isLoading ? "..." : `${counts?.paidInvoices ?? 0} đơn`,
      trend: "up",
      icon: Receipt,
      description: "Đơn đã thanh toán"
    },
    {
      title: "Hóa đơn",
      value: String(counts?.invoices ?? 0),
      change: isLoading ? "..." : `${(counts?.invoices ?? 0) - (counts?.paidInvoices ?? 0)} chờ`,
      trend: (counts?.invoices ?? 0) - (counts?.paidInvoices ?? 0) > 0 ? "down" : "up",
      icon: Coffee,
      description: "Đơn chờ thanh toán"
    },
    {
      title: "Đặt bàn",
      value: String(counts?.reservations ?? 0),
      change: isLoading ? "..." : `${counts?.pendingReservations ?? 0} chờ`,
      trend: (counts?.pendingReservations ?? 0) > 0 ? "down" : "up",
      icon: Calendar,
      description: "Đặt bàn chờ xử lý"
    },
    {
      title: "Khách hàng",
      value: String(counts?.users ?? 0),
      change: "Tổng cộng",
      trend: "up",
      icon: Users,
      description: "Tổng tài khoản"
    }
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed": case "paid": return "bg-green-100 text-green-700"
      case "pending": return "bg-yellow-100 text-yellow-700"
      case "cancelled": return "bg-red-100 text-red-700"
      default: return "bg-secondary text-secondary-foreground"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "paid": return "Đã TT"
      case "pending": return "Chờ"
      case "confirmed": return "Đã XN"
      case "cancelled": return "Hủy"
      default: return status
    }
  }

  let invoiceContent: React.ReactNode
  if (isLoading) {
    invoiceContent = (
      <div className="space-y-3">
        {[
          "invoice-skeleton-1",
          "invoice-skeleton-2",
          "invoice-skeleton-3",
        ].map((key) => (
          <div key={key} className="animate-pulse h-16 rounded-lg bg-muted" />
        ))}
      </div>
    )
  } else if (recentInvoices.length === 0) {
    invoiceContent = <p className="py-4 text-center text-sm text-muted-foreground">Chưa có hóa đơn</p>
  } else {
    invoiceContent = (
      <div className="space-y-3">
        {recentInvoices.map((inv) => (
          <div key={inv.id} className="flex items-center justify-between rounded-lg border border-border p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                <Coffee className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">{inv.customer || "Khách"}</p>
                <p className="font-mono text-xs text-muted-foreground">{inv.code}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium text-foreground">{inv.total.toLocaleString("vi-VN")}đ</p>
              <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadge(inv.status)}`}>
                {getStatusText(inv.status)}
              </span>
            </div>
          </div>
        ))}
      </div>
    )
  }

  let reservationContent: React.ReactNode
  if (isLoading) {
    reservationContent = (
      <div className="space-y-3">
        {[
          "reservation-skeleton-1",
          "reservation-skeleton-2",
          "reservation-skeleton-3",
        ].map((key) => (
          <div key={key} className="animate-pulse h-16 rounded-lg bg-muted" />
        ))}
      </div>
    )
  } else if (recentReservations.length === 0) {
    reservationContent = <p className="py-4 text-center text-sm text-muted-foreground">Chưa có đặt bàn</p>
  } else {
    reservationContent = (
      <div className="space-y-3">
        {recentReservations.map((res) => (
          <div key={res.id} className="flex items-center justify-between rounded-lg border border-border p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">{res.customer || res.name}</p>
                <p className="text-sm text-muted-foreground">
                  {res.guests} người - {res.time || res.reservation_time}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{res.date || res.reservation_date}</p>
              <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadge(res.status)}`}>
                {getStatusText(res.status)}
              </span>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Tổng quan</h1>
        <p className="text-muted-foreground">Tổng quan hoạt động kinh doanh</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div key={stat.title} variants={fadeInUp} initial="initial" animate="animate" transition={{ delay: index * 0.1 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                    stat.trend === "up" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}>
                    {stat.trend === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {stat.change}
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold text-foreground truncate">{isLoading ? "..." : stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Data */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Invoices */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Hóa đơn gần đây</CardTitle>
                <CardDescription>5 hóa đơn mới nhất</CardDescription>
              </div>
              <Link href="/admin/invoices">
                <Button variant="ghost" size="sm" className="gap-1">
                  Xem tất cả <ArrowUpRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {invoiceContent}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Reservations */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Đặt bàn gần đây</CardTitle>
                <CardDescription>Các yêu cầu đặt bàn mới</CardDescription>
              </div>
              <Link href="/admin/reservations">
                <Button variant="ghost" size="sm" className="gap-1">
                  Xem tất cả <ArrowUpRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {reservationContent}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
