"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Coffee, Menu, X, Calendar, ShoppingBag, Home, User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getCartCount, subscribeCart } from "@/lib/cart"
import { getUser, getToken, removeToken } from "@/lib/api"

const navLinks = [
  { href: "/", label: "Trang chủ", icon: Home },
  { href: "/menu", label: "Thực đơn", icon: Coffee },
  { href: "/reservation", label: "Đặt bàn", icon: Calendar },
]

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [userName, setUserName] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const syncState = () => {
      setCartCount(getCartCount())
      const user = getUser()
      setUserName(user && typeof user.name === 'string' ? user.name : null)
      setIsLoggedIn(Boolean(getToken()))
    }

    syncState()
    globalThis.addEventListener('storage', syncState)
    globalThis.addEventListener('focus', syncState)
    const unsubscribeCart = subscribeCart(syncState)
    globalThis.addEventListener('cafe-auth-updated', syncState)
    return () => {
      globalThis.removeEventListener('storage', syncState)
      globalThis.removeEventListener('focus', syncState)
      globalThis.removeEventListener('cafe-auth-updated', syncState)
      unsubscribeCart()
    }
  }, [])

  const handleLogout = () => {
    removeToken()
    setUserName(null)
    router.push('/')
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Coffee className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold text-foreground">TuanHuy cafe</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-3 md:flex">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/cart" className="relative flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              <span className="sr-only">Giỏ hàng</span>
              {cartCount > 0 && (
                <Badge className="absolute -right-2 -top-2 h-5 min-w-5 px-1 text-[10px]">{cartCount}</Badge>
              )}
            </Link>
          </Button>
          {isLoggedIn ? (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link href="/account" className="gap-2">
                  <User className="h-4 w-4" />
                  {userName ?? 'Tài khoản'}
                </Link>
              </Button>
              <Button size="sm" variant="ghost" onClick={handleLogout} className="gap-2">
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link href="/login">Đăng nhập</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">Đăng ký</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-secondary md:hidden"
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-border bg-background md:hidden"
          >
            <div className="container mx-auto flex flex-col gap-2 p-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <link.icon className="h-5 w-5" />
                  {link.label}
                </Link>
              ))}
              <div className="mt-2 flex flex-col gap-2 border-t border-border pt-4">
                <Button variant="outline" asChild className="w-full">
                  <Link href="/cart">Giỏ hàng{cartCount > 0 ? ` (${cartCount})` : ''}</Link>
                </Button>
                {isLoggedIn ? (
                  <Button asChild className="w-full">
                    <Link href="/account">Tài khoản</Link>
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" asChild className="w-full">
                      <Link href="/login">Đăng nhập</Link>
                    </Button>
                    <Button asChild className="w-full">
                      <Link href="/register">Đăng ký</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
