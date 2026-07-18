import { Building2, LogOut } from "lucide-react";
import { Brand } from "./brand";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/types/database";
export function OperatorShell({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50/70">
      <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Brand />
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{profile.full_name}</p>
              <p className="text-xs text-muted-foreground">Operator Admin</p>
            </div>
            <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Building2 className="size-4" />
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
        </div>
      </header>
      {children}
    </div>
  );
}
