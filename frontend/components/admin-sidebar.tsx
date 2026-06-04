"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Coffee, 
  LayoutDashboard, 
  Calendar, 
  Receipt, 
  Users, 
  Settings,
  LogOut,
  Menu,
  X,
  Bell
} from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"

const sidebarLinks = [
  { href: "/admin", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/admin/menu", label: "Quản lý thực đơn", icon: Coffee },
  { href: "/admin/reservations", label: "Quản lý đặt bàn", icon: Calendar },
  { href: "/admin/invoices", label: "Quản lý hóa đơn", icon: Receipt },
  { href: "/admin/users", label: "Quản lý người dùng", icon: Users },
  { href: "/admin/settings", label: "Cài đặt", icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Mobile Header */}
      <header className="fixed left-0 right-0 top-0 z-50 flex h-16 items-center justify-between border-b border-sidebar-border bg-sidebar px-4 lg:hidden">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
            <Coffee className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <span className="font-semibold text-sidebar-foreground">Admin</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-sidebar-foreground">
            <Bell className="h-5 w-5" />
          </Button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={() => setIsOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 top-16 z-50 w-[280px] border-r border-sidebar-border bg-sidebar lg:hidden"
            >
              <SidebarContent pathname={pathname} onLinkClick={() => setIsOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="fixed bottom-0 left-0 top-0 z-40 hidden w-[280px] border-r border-sidebar-border bg-sidebar lg:block">
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
            <Coffee className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <span className="font-semibold text-sidebar-foreground">TuanHuy cafe Admin</span>
        </div>
        <SidebarContent pathname={pathname} />
      </aside>
    </>
  )
}

function SidebarContent({ pathname, onLinkClick }: Readonly<{ pathname: string; onLinkClick?: () => void }>) {
  return (
    <div className="flex h-full flex-col">
      <nav className="flex-1 space-y-1 p-4">
        {sidebarLinks.map((link) => {
          const isActive = pathname === link.href || 
            (link.href !== "/admin" && pathname.startsWith(link.href))
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onLinkClick}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <link.icon className="h-5 w-5" />
              {link.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="mb-3 flex items-center gap-3 rounded-lg bg-sidebar-accent p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground">
            A
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium text-sidebar-foreground">Admin</p>
            <p className="truncate text-xs text-sidebar-foreground/70">admin@cafelatte.vn</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          asChild
        >
          <Link href="/login">
            <LogOut className="h-5 w-5" />
            Đăng xuất
          </Link>
        </Button>
      </div>
    </div>
  )
}
