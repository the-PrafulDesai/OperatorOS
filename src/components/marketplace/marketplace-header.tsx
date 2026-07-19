import { Brand } from "@/components/common/brand";
import { MarketplaceAccountNav } from "@/components/marketplace/marketplace-account-nav";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";

export async function MarketplaceHeader() {
  const profile = await getCurrentProfile();
  const safeProfile = profile?.is_active
    ? { fullName: profile.full_name, role: profile.role }
    : null;

  return (
    <header className="border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-3 px-5 sm:px-8">
        <Brand />
        <MarketplaceAccountNav profile={safeProfile} />
      </div>
    </header>
  );
}
