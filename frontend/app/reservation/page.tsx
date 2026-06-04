"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Calendar, Clock, Users, MapPin, Phone, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { createReservation } from "@/lib/api"

const timeSlots = [
  "08:00", "09:00", "10:00", "11:00", "12:00", "13:00",
  "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"
]

const guestOptions = [1, 2, 3, 4, 5, 6, 7, 8]

export default function ReservationPage() {
  const [formData, setFormData] = useState({
    name: "", phone: "", email: "", date: "", time: "", guests: 2, notes: ""
  })
  const [submitted, setSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.time) { setError("Vui lòng chọn giờ"); return }
    setIsLoading(true)
    setError("")
    try {
      await createReservation(formData)
      setSubmitted(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Đặt bàn thất bại, vui lòng thử lại")
    } finally {
      setIsLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto max-w-md text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle className="h-10 w-10 text-primary" />
              </div>
              <h1 className="mb-4 text-2xl font-bold text-foreground">Đặt bàn thành công!</h1>
                <p className="mb-6 text-muted-foreground">
                Cảm ơn bạn đã đặt bàn tại TuanHuy cafe. Chúng tôi sẽ liên hệ với bạn sớm nhất để xác nhận.
              </p>
              <Card className="text-left">
                <CardContent className="space-y-3 pt-6">
                  <div className="flex items-center gap-3"><Calendar className="h-5 w-5 text-primary" /><span>{formData.date}</span></div>
                  <div className="flex items-center gap-3"><Clock className="h-5 w-5 text-primary" /><span>{formData.time}</span></div>
                  <div className="flex items-center gap-3"><Users className="h-5 w-5 text-primary" /><span>{formData.guests} người</span></div>
                </CardContent>
              </Card>
              <Button className="mt-6" onClick={() => setSubmitted(false)}>Đặt bàn mới</Button>
            </motion.div>
          </div>
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
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 text-center">
            <h1 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">Đặt bàn</h1>
            <p className="mx-auto max-w-2xl text-muted-foreground">Đặt trước bàn để có trải nghiệm tuyệt vời nhất tại TuanHuy cafe</p>
          </motion.div>

          <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-2">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin đặt bàn</CardTitle>
                  <CardDescription>Vui lòng điền đầy đủ thông tin để đặt bàn</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                      <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
                    )}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Họ tên</Label>
                        <Input id="name" placeholder="Nguyễn Văn A" value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Số điện thoại</Label>
                        <Input id="phone" type="tel" placeholder="0123 456 789" value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="email@example.com" value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="date">Ngày</Label>
                        <Input id="date" type="date" value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Số người</Label>
                        <div className="flex flex-wrap gap-2">
                          {guestOptions.map((num) => (
                            <button key={num} type="button" onClick={() => setFormData({ ...formData, guests: num })}
                              className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition-all ${
                                formData.guests === num ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                              }`}>{num}</button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Giờ</Label>
                      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                        {timeSlots.map((time) => (
                          <button key={time} type="button" onClick={() => setFormData({ ...formData, time })}
                            className={`rounded-lg px-2 py-2 text-sm font-medium transition-all ${
                              formData.time === time ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                            }`}>{time}</button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Ghi chú (tùy chọn)</Label>
                      <textarea id="notes" placeholder="Yêu cầu đặc biệt..." value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="flex min-h-[100px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                    </div>

                    <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                      {isLoading ? "Đang xử lý..." : "Xác nhận đặt bàn"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="space-y-6">
              <Card>
                <CardHeader><CardTitle>Thông tin liên hệ</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Địa chỉ</p>
                      <p className="text-sm text-muted-foreground">123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Điện thoại</p>
                      <p className="text-sm text-muted-foreground">0123 456 789</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Giờ mở cửa</p>
                      <div className="text-sm text-muted-foreground">
                        <p>Thứ 2 - Thứ 6: 7:00 - 22:00</p>
                        <p>Thứ 7: 8:00 - 23:00</p>
                        <p>Chủ nhật: 8:00 - 21:00</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
