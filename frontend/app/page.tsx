"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { ArrowRight, Coffee, Calendar, Star, Clock, Users, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { getMenuItems, MenuItem } from "@/lib/api"

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
}

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

type FeaturedDrink = MenuItem & { rating: number }

const defaultHeroImage = "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=800&fit=crop"

function mapRating(index: number): number {
  return Number((4.9 - index * 0.1).toFixed(1))
}

export default function HomePage() {
  const [featuredDrinks, setFeaturedDrinks] = useState<FeaturedDrink[]>([])
  const [menuTotal, setMenuTotal] = useState(0)
  const [categoryTotal, setCategoryTotal] = useState(0)
  const [averagePrice, setAveragePrice] = useState(0)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getMenuItems({ limit: 50 })
        const items = res.data.items
        const visibleItems = items.filter((item) => item.is_active === 1)

        setMenuTotal(res.meta.total)
        setCategoryTotal(new Set(visibleItems.map((item) => item.category)).size)
        setAveragePrice(
          visibleItems.length > 0
            ? Math.round(visibleItems.reduce((sum, item) => sum + item.price, 0) / visibleItems.length)
            : 0
        )
        setFeaturedDrinks(visibleItems.slice(0, 4).map((item, index) => ({ ...item, rating: mapRating(index) })))
      } catch {
        setFeaturedDrinks([])
      }
    }

    load()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-secondary/50 to-background">
          <div className="container mx-auto px-4 py-16 md:py-24">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-6"
              >
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                  <Sparkles className="h-4 w-4" />
                  Chào mừng đến với TuanHuy cafe
                </div>
                <h1 className="text-4xl font-bold leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl text-balance">
                  Thưởng thức <span className="text-primary">cà phê</span> tuyệt vời mỗi ngày
                </h1>
                <p className="max-w-lg text-lg leading-relaxed text-muted-foreground text-pretty">
                  Nơi bạn có thể tìm thấy những tách cà phê hảo hạng nhất, được pha chế bởi những barista chuyên nghiệp trong không gian ấm cúng và hiện đại.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button size="lg" asChild>
                    <Link href="/menu" className="gap-2">
                      Xem thực đơn
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/reservation" className="gap-2">
                      <Calendar className="h-4 w-4" />
                      Đặt bàn ngay
                    </Link>
                  </Button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative"
              >
                <div className="relative aspect-square overflow-hidden rounded-3xl bg-secondary">
                  <Image src={defaultHeroImage} alt="Không gian quán cà phê" fill className="object-cover" priority />
                </div>
                {/* Floating card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="absolute -bottom-6 -left-6 rounded-2xl bg-card p-4 shadow-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <Star className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">4.9/5</p>
                      <p className="text-sm text-muted-foreground">1000+ đánh giá</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="border-y border-border bg-card/50">
          <div className="container mx-auto px-4 py-12">
            <motion.div
              variants={stagger}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-8 md:grid-cols-4"
            >
              {[
                { icon: Coffee, value: String(menuTotal || 0), label: "Món trong menu" },
                { icon: Users, value: String(categoryTotal || 0), label: "Danh mục" },
                { icon: Star, value: String(featuredDrinks.length), label: "Món nổi bật" },
                { icon: Clock, value: averagePrice > 0 ? `${averagePrice.toLocaleString("vi-VN")}đ` : "-", label: "Giá trung bình" },
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  variants={fadeInUp}
                  className="text-center"
                >
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-2xl font-bold text-foreground md:text-3xl">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Featured Drinks */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12 text-center"
            >
              <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
                Đồ uống nổi bật
              </h2>
              <p className="mx-auto max-w-2xl text-muted-foreground">
                Khám phá những thức uống được yêu thích nhất tại TuanHuy cafe
              </p>
            </motion.div>

            <motion.div
              variants={stagger}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
            >
              {featuredDrinks.map((drink) => (
                <motion.div key={drink.id} variants={fadeInUp}>
                  <Card className="group overflow-hidden transition-all hover:shadow-lg">
                    <div className="relative aspect-square overflow-hidden">
                      <Image
                        src={drink.image_url || defaultHeroImage}
                        alt={drink.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-card/90 px-2 py-1 backdrop-blur-sm">
                        <Star className="h-3 w-3 fill-primary text-primary" />
                        <span className="text-xs font-medium text-foreground">{drink.rating}</span>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="mb-1 font-semibold text-foreground">{drink.name}</h3>
                      <p className="mb-3 text-sm text-muted-foreground line-clamp-2">{drink.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-primary">{drink.price.toLocaleString("vi-VN")}đ</span>
                        <Button size="sm" variant="secondary">
                          Thêm
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            <div className="mt-12 text-center">
              <Button size="lg" variant="outline" asChild>
                <Link href="/menu" className="gap-2">
                  Xem tất cả thực đơn
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-primary py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mx-auto max-w-2xl space-y-6"
            >
              <h2 className="text-3xl font-bold text-primary-foreground md:text-4xl">
                Đặt bàn ngay hôm nay
              </h2>
              <p className="text-primary-foreground/80">
                Chúng tôi luôn sẵn sàng phục vụ bạn với những tách cà phê tuyệt vời nhất. Đặt bàn trước để có trải nghiệm tốt nhất.
              </p>
              <Button size="lg" variant="secondary" asChild>
                <Link href="/reservation" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Đặt bàn ngay
                </Link>
              </Button>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
