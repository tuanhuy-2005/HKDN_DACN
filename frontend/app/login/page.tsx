"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Coffee, Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { login, setToken, setUser } from "@/lib/api"
import type { SyntheticEvent } from "react"

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({ email: "", password: "" })

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    try {
      const payload = await login(formData.email, formData.password)
      setToken(payload.token)
      setUser(payload.user)
      if (payload.user.role === "admin") {
        router.push("/admin")
      } else {
        router.push("/account")
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Form */}
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
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
              <CardTitle className="text-2xl">Đăng nhập</CardTitle>
              <CardDescription>Nhập email và mật khẩu để đăng nhập vào tài khoản</CardDescription>
            </CardHeader>
            <CardContent className="px-0 sm:px-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@example.com"
                      className="pl-10"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Mật khẩu</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Nhập mật khẩu"
                      className="pl-10 pr-10"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                  {isLoading ? "Đang xử lý..." : (
                    <>Đăng nhập <ArrowRight className="h-4 w-4" /></>
                  )}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Chưa có tài khoản?{" "}
                <Link href="/register" className="text-primary hover:underline">Đăng ký ngay</Link>
              </p>

              <div className="mt-4 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                <p className="font-medium mb-1">Tài khoản thử nghiệm:</p>
                <p>Admin: admin@cafe.com / adminpassword</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden bg-secondary lg:block lg:flex-1">
        <div
          className="h-full w-full bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&h=1600&fit=crop')" }}
        >
          <div className="flex h-full w-full flex-col items-center justify-center bg-primary/60 p-12 text-primary-foreground">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="max-w-md text-center"
            >
              <h2 className="mb-4 text-3xl font-bold">Chào mừng trở lại!</h2>
              <p className="text-lg opacity-90">
                Đăng nhập để quản lý đơn hàng, theo dõi lịch sử đặt bàn và nhận nhiều ưu đãi hấp dẫn.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
