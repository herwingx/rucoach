import { getAuthData } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  CheckCircle,
  Users,
  CreditCard,
  LogOut,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/receptionist/dashboard", icon: LayoutDashboard },
  { label: "Check-in", href: "/receptionist/check-in", icon: CheckCircle },
  { label: "Clientes", href: "/receptionist/clients", icon: Users },
  { label: "Pagos", href: "/receptionist/payments", icon: CreditCard },
];

export default async function ReceptionistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role } = await getAuthData();

  if (!user || (role !== "receptionist" && role !== "admin")) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-xl safe-area-header-pt">
        <div className="container flex flex-wrap items-center justify-between gap-3 py-3">
          <Link
            href="/receptionist/dashboard"
            className="flex items-center gap-3 shrink-0"
          >
            <div className="size-9 rounded-lg overflow-hidden bg-black flex items-center justify-center shrink-0 border border-border/40 shadow-sm">
              <Image
                src="/android-chrome-512x512.png"
                alt="Logo RU Coach"
                width={36}
                height={36}
                className="size-full object-contain"
              />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-sm font-black tracking-tight uppercase">
                RU Coach <span className="text-primary">Recepción</span>
              </span>
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mt-0.5">
                Rodrigo Urbina
              </span>
            </div>
          </Link>

          <nav
            aria-label="Navegación de recepción"
            className="order-3 grid grid-cols-4 gap-1 w-full border-t border-border/40 pt-2 md:order-2 md:flex md:w-auto md:border-0 md:pt-0"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.href}
                  asChild
                  variant="ghost"
                  size="sm"
                  className="px-2 py-1.5 text-xs sm:text-sm h-9 rounded-lg justify-center gap-1.5 font-semibold text-muted-foreground hover:bg-primary/10 hover:text-primary"
                >
                  <Link href={item.href} prefetch={true}>
                    <Icon className="hidden sm:inline-block size-4 shrink-0" aria-hidden />
                    <span>{item.label}</span>
                  </Link>
                </Button>
              );
            })}
          </nav>

          <div className="order-2 flex items-center gap-2 md:order-3">
            <ThemeToggle />
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-11 gap-2 rounded-xl border-border/60 px-3 text-xs font-bold uppercase tracking-wider hover:bg-muted"
            >
              <Link href="/auth/logout" prefetch={false}>
                <LogOut className="size-4 shrink-0" aria-hidden />
                <span className="hidden sm:inline">Salir</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main
        id="main-content"
        className="flex-1 container py-6 md:py-8 space-y-6"
        tabIndex={-1}
      >
        {children}
      </main>
    </div>
  );
}
