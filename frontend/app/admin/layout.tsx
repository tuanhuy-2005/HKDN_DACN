import { AdminSidebar } from "@/components/admin-sidebar"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <main className="pt-16 lg:pl-[280px] lg:pt-0">
        {children}
      </main>
    </div>
  )
}
