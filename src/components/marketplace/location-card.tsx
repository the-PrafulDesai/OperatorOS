import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { currency, productTypeLabel } from "@/lib/products/labels";
import type { LocationWorkspace } from "@/types/database";
export function LocationCard({ workspace }: { workspace: LocationWorkspace }) {
  const image = workspace.images.find((item) => item.is_cover) ?? workspace.images[0];
  const from = workspace.products.length ? Math.min(...workspace.products.map((p) => p.price)) : 0;
  return <article className="group overflow-hidden rounded-3xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"><div className="relative aspect-[16/10] bg-slate-200">{image?.public_url ? <Image src={image.public_url} alt={image.alt_text || workspace.location.name} fill className="object-cover transition duration-500 group-hover:scale-[1.03]" sizes="(max-width: 768px) 100vw, 33vw" /> : <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-slate-300" />}<span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-medium shadow-sm backdrop-blur">OperatorOS verified</span></div><div className="p-5"><p className="flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="size-4" />{workspace.location.city}</p><h2 className="mt-2 text-xl font-semibold tracking-tight">{workspace.location.name}</h2><p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">{workspace.location.description || workspace.location.address}</p><div className="mt-4 flex flex-wrap gap-1.5">{[...new Set(workspace.products.map((p) => p.type))].slice(0, 3).map((type) => <span key={type} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium">{productTypeLabel[type]}</span>)}</div><div className="mt-5 flex items-end justify-between border-t pt-4"><div><p className="text-xs text-muted-foreground">From</p><p className="font-semibold">{currency(from)}</p></div><Link href={`/locations/${workspace.location.slug}`} className={buttonVariants({ variant: "outline" })}>View workspace<ArrowRight /></Link></div></div></article>;
}
