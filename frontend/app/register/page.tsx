"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Coffee, Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { register, setToken, setUser } from "@/lib/api"
import type { SyntheticEvent } from "react"

export default function RegisterPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  })

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp")
      return
    }
    setIsLoading(true)
    setError("")
    try {
      const payload = await register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      })
      setToken(payload.token)
      setUser(payload.user)
      router.push("/account")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Đăng ký thất bại")
    } finally {
      setIsLoading(false)
    }
  }

  const benefits = [
    "Đặt bàn nhanh chóng và tiện lợi",
    "Theo dõi lịch sử đơn hàng",
    "Nhận thông báo ưu đãi đặc biệt",
    "Tích điểm đổi quà"
  ]

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Image */}
      <div className="hidden bg-secondary lg:block lg:flex-1">
        <div
          className="h-full w-full bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=1200&h=1600&fit=crop')" }}
        >
          <div className="flex h-full w-full flex-col items-center justify-center bg-primary/60 p-12 text-primary-foreground">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="max-w-md"
            >
              <h2 className="mb-6 text-3xl font-bold">Tham gia TuanHuy cafe ngay!</h2>
              <ul className="space-y-3">
                {benefits.map((benefit, index) => (
                  <motion.li
                    key={benefit}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-foreground/20">
                      <Check className="h-4 w-4" />
                    </div>
                    <span>{benefit}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <Link href="/" className="mb-8 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Coffee className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold text-foreground">TuanHuy cafe</span>
          </Link>

          <Card className="border-0 shadow-none sm:border sm:shadow-sm">
            <CardHeader className="space-y-1 px-0 sm:px-6">
              <CardTitle className="text-2xl">Tạo tài khoản</CardTitle>
              <CardDescription>Đăng ký để trải nghiệm dịch vụ tốt nhất</CardDescription>
            </CardHeader>
            <CardContent className="px-0 sm:px-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name">Họ tên</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="name" type="text" placeholder="Nguyễn Văn A" className="pl-10"
                      value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="email@example.com" className="pl-10"
                      value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="phone" type="tel" placeholder="0123 456 789" className="pl-10"
                      value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Mật khẩu</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="password" type={showPassword ? "text" : "password"} placeholder="Tối thiểu 8 ký tự"
                      className="pl-10 pr-10" value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })} required minLength={8} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="confirmPassword" type={showPassword ? "text" : "password"} placeholder="Nhập lại mật khẩu"
                      className="pl-10" value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} required />
                  </div>
                </div>

                <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                  {isLoading ? "Đang xử lý..." : (
                    <>Tạo tài khoản <ArrowRight className="h-4 w-4" /></>
                  )}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Đã có tài khoản?{" "}
                <Link href="/login" className="text-primary hover:underline">Đăng nhập</Link>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
