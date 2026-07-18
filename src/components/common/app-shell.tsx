"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Sparkles,
} from "lucide-react";
import { Brand } from "./brand";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/database";

const nav = [
  { href: "/super-admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/super-admin/operators", label: "Operators", icon: Building2 },
  { href: "/super-admin/locations", label: "Locations", icon: MapPin },
];

function Navigation({ mobile = false }: { mobile?: boolean }) {
  const path = usePathname();
  return (
    <nav className="space-y-1">
      {nav.map(({ href, label, icon: Icon }) => {
        const active =
          path === href ||
          (href !== "/super-admin/dashboard" && path.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
              mobile && "h-12",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50/70">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-sidebar p-4 lg:flex lg:flex-col">
        <Brand className="px-2 py-2" />
        <div className="mt-8">
          <p className="mb-3 px-3 text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
            Platform
          </p>
          <Navigation />
        </div>
        <div className="mt-auto rounded-2xl border bg-background p-4">
          <Sparkles className="mb-3 size-5 text-primary" />
          <p className="text-sm font-medium">Phase 1 foundation</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Provision operators and prepare their first location.
          </p>
        </div>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/90 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <Sheet>
              <SheetTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Open navigation"
                  />
                }
              >
                <Menu />
              </SheetTrigger>
              <SheetContent side="left" className="w-[290px] p-4">
                <SheetHeader className="px-0">
                  <SheetTitle>
                    <Brand />
                  </SheetTitle>
                  <SheetDescription>Platform administration</SheetDescription>
                </SheetHeader>
                <div className="mt-4">
                  <Navigation mobile />
                </div>
              </SheetContent>
            </Sheet>
            <Brand compact />
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-medium">Platform administration</p>
            <p className="text-xs text-muted-foreground">
              OperatorOS command centre
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-5">
                {profile.full_name}
              </p>
              <p className="text-xs text-muted-foreground">Super Admin</p>
            </div>
            <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {profile.full_name.slice(0, 2).toUpperCase()}
            </span>
            <form action="/api/auth/logout" method="post">
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                aria-label="Sign out"
              >
                <LogOut />
              </Button>
            </form>
          </div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
