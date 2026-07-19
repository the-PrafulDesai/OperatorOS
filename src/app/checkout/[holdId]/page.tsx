import { notFound } from "next/navigation";
import { CheckoutPanel } from "@/components/booking/checkout-panel";
import { MarketplaceHeader } from "@/components/marketplace/marketplace-header";
import { requireRole } from "@/lib/auth/require-role";
import { getCustomerHold } from "@/lib/data/phase3";
export const metadata={title:"Secure checkout | OperatorOS"};
export default async function CheckoutPage({params}:{params:Promise<{holdId:string}>}){const profile=await requireRole("CUSTOMER");const hold=await getCustomerHold(profile.id,(await params).holdId).catch(()=>null);if(!hold)notFound();return <main className="min-h-screen bg-slate-50/70"><MarketplaceHeader/><div className="mx-auto max-w-6xl px-5 py-10 sm:px-8"><CheckoutPanel hold={hold}/></div></main>}
