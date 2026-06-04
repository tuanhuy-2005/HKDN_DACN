import Link from "next/link"
import { Coffee, ExternalLink, Mail, MapPin, Phone } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                <Coffee className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-semibold text-foreground">TuanHuy cafe</span>
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Nơi bạn có thể thưởng thức những ly cà phê tuyệt vời trong không gian ấm cúng và hiện đại.
            </p>
            <div className="flex gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                aria-label="Facebook"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                aria-label="Instagram"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Liên kết nhanh</h3>
            <ul className="space-y-2">
              {[
                { href: "/", label: "Trang chủ" },
                { href: "/menu", label: "Thực đơn" },
                { href: "/reservation", label: "Đặt bàn" },
                { href: "/about", label: "Về chúng tôi" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Hours */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Giờ mở cửa</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex justify-between">
                <span>Thứ 2 - Thứ 6</span>
                <span>7:00 - 22:00</span>
              </li>
              <li className="flex justify-between">
                <span>Thứ 7</span>
                <span>8:00 - 23:00</span>
              </li>
              <li className="flex justify-between">
                <span>Chủ nhật</span>
                <span>8:00 - 21:00</span>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Liên hệ</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                <span>0123 456 789</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                <span>info@tuanhuycafe.vn</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 border-t border-border pt-6">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} TuanHuy cafe. Tất cả quyền được bảo lưu.
          </p>
        </div>
      </div>
    </footer>
  )
}
