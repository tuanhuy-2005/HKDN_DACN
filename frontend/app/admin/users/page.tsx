"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Users, Search, Save, UserCog, Mail, Phone, ShieldCheck } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { getAdminUsers, updateAdminUser, type User } from "@/lib/api"

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [query, setQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    const loadUsers = async () => {
      setIsLoading(true)
      try {
        const res = await getAdminUsers({ limit: 100 })
        setUsers(res.data.items)
        setSelectedUser((current) => current ?? res.data.items[0] ?? null)
      } catch (error: unknown) {
        setMessage(error instanceof Error ? error.message : "Không thể tải danh sách user")
      } finally {
        setIsLoading(false)
      }
    }

    loadUsers()
  }, [])

  const filteredUsers = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return users
    return users.filter((user) => {
      const text = `${user.name} ${user.email} ${user.phone} ${user.role}`.toLowerCase()
      return text.includes(term)
    })
  }, [query, users])

  useEffect(() => {
    if (!selectedUser && filteredUsers.length > 0) {
      setSelectedUser(filteredUsers[0])
    }
  }, [filteredUsers, selectedUser])

  const handleChangeField = (field: keyof User, value: string) => {
    if (!selectedUser) return
    setSelectedUser({ ...selectedUser, [field]: value })
  }

  const handleSave = async () => {
    if (!selectedUser) return
    setIsSaving(true)
    setMessage("")
    try {
      const res = await updateAdminUser(selectedUser.id, {
        name: selectedUser.name,
        email: selectedUser.email,
        phone: selectedUser.phone,
        role: selectedUser.role,
      })
      const nextUser = res.data
      setUsers((current) => current.map((user) => (user.id === nextUser.id ? nextUser : user)))
      setSelectedUser(nextUser)
      setMessage("Đã cập nhật user")
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "Cập nhật user thất bại")
    } finally {
      setIsSaving(false)
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    if (role === "admin") return "default"
    return "secondary"
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Quản lý người dùng</h1>
        <p className="text-muted-foreground">Xem và chỉnh sửa thông tin tài khoản khách hàng và quản trị viên</p>
      </motion.div>

      {message && (
        <div className="mb-6 rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground">
          {message}
        </div>
      )}

      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
            placeholder="Tìm theo tên, email, SĐT, vai trò"
          />
        </div>
        <div className="rounded-lg bg-muted px-4 py-2 text-sm text-muted-foreground">
          {filteredUsers.length} tài khoản
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Danh sách user</CardTitle>
            <CardDescription>Chọn một user để xem hoặc chỉnh sửa</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-16 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Users className="mx-auto mb-3 h-12 w-12 opacity-30" />
                <p>Không có user phù hợp</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredUsers.map((user) => {
                  const isActive = selectedUser?.id === user.id
                  return (
                    <button
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className={`w-full rounded-xl border p-4 text-left transition-all ${
                        isActive
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card hover:border-primary/50"
                      }`}
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground">{user.name}</h3>
                            <Badge variant={getRoleBadgeVariant(user.role) as "default" | "secondary"}>{user.role}</Badge>
                          </div>
                          <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                            <p className="flex items-center gap-2"><Mail className="h-4 w-4" />{user.email}</p>
                            <p className="flex items-center gap-2"><Phone className="h-4 w-4" />{user.phone}</p>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p>ID #{user.id}</p>
                          <p>{new Date(user.created_at).toLocaleDateString("vi-VN")}</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              Chi tiết user
            </CardTitle>
            <CardDescription>Cập nhật thông tin và vai trò tài khoản</CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedUser ? (
              <div className="py-12 text-center text-muted-foreground">
                <ShieldCheck className="mx-auto mb-3 h-12 w-12 opacity-30" />
                <p>Chưa chọn user nào</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Họ tên</label>
                  <Input value={selectedUser.name} onChange={(e) => handleChangeField("name", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <Input value={selectedUser.email} onChange={(e) => handleChangeField("email", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Số điện thoại</label>
                  <Input value={selectedUser.phone} onChange={(e) => handleChangeField("phone", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Vai trò</label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={selectedUser.role === "admin" ? "default" : "outline"}
                      onClick={() => handleChangeField("role", "admin")}
                    >
                      Admin
                    </Button>
                    <Button
                      type="button"
                      variant={selectedUser.role === "user" ? "default" : "outline"}
                      onClick={() => handleChangeField("role", "user")}
                    >
                      User
                    </Button>
                  </div>
                </div>
                <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                  Tạo lúc: {new Date(selectedUser.created_at).toLocaleString("vi-VN")}
                </div>
                <Button className="w-full gap-2" onClick={handleSave} disabled={isSaving}>
                  <Save className="h-4 w-4" />
                  {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
