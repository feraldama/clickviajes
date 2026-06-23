"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  MapPin,
  Package,
  Plane,
  Truck,
  Coins,
  Building2,
  FileText,
  ClipboardList,
  CalendarDays,
  Layers,
  UserCog,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Logo } from "@/components/Logo";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  /** Si se indica, solo visible para estos roles. */
  roles?: string[];
}

// Se irán sumando módulos (Cotizaciones, Reservas, Pagos) en próximas fases.
const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/destinos", label: "Destinos", icon: MapPin },
  { href: "/paquetes", label: "Paquetes", icon: Package },
  { href: "/viajes", label: "Viajes", icon: Plane },
  { href: "/cotizaciones", label: "Cotizaciones", icon: FileText },
  { href: "/reservas", label: "Reservas", icon: ClipboardList },
  { href: "/calendario", label: "Calendario", icon: CalendarDays },
  { href: "/proveedores", label: "Proveedores", icon: Truck },
  { href: "/tipos-cambio", label: "Tipos de cambio", icon: Coins, roles: ["AGENCY_ADMIN", "SUPER_ADMIN"] },
  { href: "/usuarios", label: "Usuarios", icon: UserCog, roles: ["AGENCY_ADMIN"] },
  { href: "/agencias", label: "Agencias", icon: Building2, roles: ["SUPER_ADMIN"] },
  { href: "/planes", label: "Planes", icon: Layers, roles: ["SUPER_ADMIN"] },
];

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Super administrador",
  AGENCY_ADMIN: "Administrador",
  SELLER: "Vendedor",
};

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const items = NAV.filter((i) => !i.roles || (user && i.roles.includes(user.role)));

  const initials = user?.fullName
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-dvh">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-surface transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Logo />
          <button
            className="cursor-pointer rounded-md p-1 text-muted-fg hover:bg-muted lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-btn px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-fg hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-line p-3">
          <button
            onClick={() => void logout()}
            className="flex w-full cursor-pointer items-center gap-3 rounded-btn px-3 py-2.5 text-sm font-medium text-muted-fg transition-colors duration-150 hover:bg-destructive/5 hover:text-destructive"
          >
            <LogOut className="h-5 w-5" aria-hidden="true" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Overlay móvil */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-foreground/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Contenido */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line bg-surface/80 px-4 backdrop-blur-md lg:px-8">
          <button
            className="cursor-pointer rounded-md p-2 text-foreground hover:bg-muted lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="ml-auto flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium leading-tight text-foreground">{user?.fullName}</p>
              <p className="text-xs text-muted-fg">{user ? ROLE_LABEL[user.role] ?? user.role : ""}</p>
            </div>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {initials}
            </span>
          </div>
        </header>

        <main className="px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
