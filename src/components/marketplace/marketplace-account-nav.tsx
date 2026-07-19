"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CalendarDays,
  ChevronDown,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/database";

type SafeMarketplaceProfile = {
  fullName: string;
  role: UserRole;
};

export function MarketplaceAccountNav({
  profile,
}: {
  profile: SafeMarketplaceProfile | null;
}) {
  if (!profile) {
    return (
      <nav
        aria-label="Marketplace account"
        className="flex items-center gap-1.5"
      >
        <Link
          href="/locations"
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "hidden sm:inline-flex",
          )}
        >
          Explore
        </Link>
        <Link href="/login" className={buttonVariants({ variant: "outline" })}>
          Sign In
        </Link>
        <Link href="/customer/signup" className={buttonVariants()}>
          Create Account
        </Link>
      </nav>
    );
  }

  return (
    <nav aria-label="Marketplace account" className="flex items-center gap-1.5">
      <Link
        href="/locations"
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "hidden lg:inline-flex",
        )}
      >
        Explore
      </Link>
      <div className="hidden items-center gap-1.5 md:flex">
        <DesktopRoleLinks role={profile.role} />
        <AccountDropdown profile={profile} />
      </div>
      <div className="md:hidden">
        <MobileAccountMenu profile={profile} />
      </div>
    </nav>
  );
}

function DesktopRoleLinks({ role }: { role: UserRole }) {
  if (role === "CUSTOMER") {
    return (
      <>
        <Link
          href="/my-bookings"
          className={buttonVariants({ variant: "ghost" })}
        >
          <CalendarDays />
          My Bookings
        </Link>
        <Link
          href="/notifications"
          aria-label="Notifications"
          className={buttonVariants({ variant: "ghost", size: "icon" })}
        >
          <Bell />
        </Link>
      </>
    );
  }

  const admin = roleDestination(role);
  return (
    <Link href={admin.href} className={buttonVariants({ variant: "ghost" })}>
      <LayoutDashboard />
      {admin.label}
    </Link>
  );
}

function AccountDropdown({ profile }: { profile: SafeMarketplaceProfile }) {
  const initials = profileInitials(profile.fullName);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            className="h-10 gap-2 rounded-full pl-1.5 pr-3"
            aria-label={`Open account menu for ${profile.fullName}`}
          />
        }
      >
        <Avatar size="sm">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>

        <span className="max-w-36 truncate">{profile.fullName}</span>

        <ChevronDown className="size-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64 p-2">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2 py-2">
            <span className="block truncate text-sm font-semibold text-foreground">
              {profile.fullName}
            </span>

            <span className="mt-0.5 block font-normal text-muted-foreground">
              {roleLabel(profile.role)}
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <RoleMenuItems role={profile.role} />
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <LogoutMenuItem />
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileAccountMenu({ profile }: { profile: SafeMarketplaceProfile }) {
  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            aria-label="Open account menu"
          />
        }
      >
        <Menu />
      </SheetTrigger>
      <SheetContent side="right" className="w-[min(88vw,360px)] p-0">
        <SheetHeader className="border-b p-5 pr-12">
          <div className="flex items-center gap-3">
            <Avatar size="lg">
              <AvatarFallback>
                {profileInitials(profile.fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 text-left">
              <SheetTitle className="truncate">{profile.fullName}</SheetTitle>
              <SheetDescription>{roleLabel(profile.role)}</SheetDescription>
            </div>
          </div>
        </SheetHeader>
        <div className="space-y-1 p-4">
          <Link href="/locations" className={mobileLinkClass}>
            Explore workspaces
          </Link>
          {profile.role === "CUSTOMER" ? (
            <>
              <Link href="/my-bookings" className={mobileLinkClass}>
                <CalendarDays />
                My Bookings
              </Link>
              <Link href="/notifications" className={mobileLinkClass}>
                <Bell />
                Notifications
              </Link>
            </>
          ) : (
            <Link
              href={roleDestination(profile.role).href}
              className={mobileLinkClass}
            >
              <LayoutDashboard />
              {roleDestination(profile.role).label}
            </Link>
          )}
        </div>
        <div className="mt-auto border-t p-4">
          <LogoutButton className="w-full justify-start" />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function RoleMenuItems({ role }: { role: UserRole }) {
  if (role === "CUSTOMER") {
    return (
      <>
        <DropdownMenuItem
          render={<Link href="/my-bookings" />}
          className="px-2 py-2"
        >
          <CalendarDays />
          My Bookings
        </DropdownMenuItem>
        <DropdownMenuItem
          render={<Link href="/notifications" />}
          className="px-2 py-2"
        >
          <Bell />
          Notifications
        </DropdownMenuItem>
      </>
    );
  }

  const admin = roleDestination(role);
  return (
    <DropdownMenuItem render={<Link href={admin.href} />} className="px-2 py-2">
      <LayoutDashboard />
      {admin.label}
    </DropdownMenuItem>
  );
}

function LogoutMenuItem() {
  const { logout, loggingOut } = useMarketplaceLogout();
  return (
    <DropdownMenuItem
      variant="destructive"
      className="px-2 py-2"
      disabled={loggingOut}
      onClick={logout}
    >
      {loggingOut ? <Loader2 className="animate-spin" /> : <LogOut />}
      {loggingOut ? "Signing out…" : "Logout"}
    </DropdownMenuItem>
  );
}

function LogoutButton({ className }: { className?: string }) {
  const { logout, loggingOut } = useMarketplaceLogout();
  return (
    <Button
      type="button"
      variant="ghost"
      className={className}
      disabled={loggingOut}
      onClick={logout}
    >
      {loggingOut ? <Loader2 className="animate-spin" /> : <LogOut />}
      {loggingOut ? "Signing out…" : "Logout"}
    </Button>
  );
}

function useMarketplaceLogout() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const logout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Logout failed");
      router.replace("/");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  };

  return { logout, loggingOut };
}

function roleDestination(role: UserRole) {
  return role === "SUPER_ADMIN"
    ? { href: "/super-admin/dashboard", label: "Super Admin Dashboard" }
    : { href: "/operator/dashboard", label: "Operator Dashboard" };
}

function roleLabel(role: UserRole) {
  if (role === "CUSTOMER") return "Customer";
  if (role === "SUPER_ADMIN") return "Super Admin";
  return "Operator Admin";
}

function profileInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "CU"
  );
}

const mobileLinkClass =
  "flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
