import { Skeleton } from "@/components/ui/skeleton";
export default function Loading(){return <main className="mx-auto max-w-7xl space-y-6 px-5 py-16"><Skeleton className="h-12 w-80"/><div className="grid gap-6 md:grid-cols-3">{[1,2,3].map((i)=><Skeleton key={i} className="h-96 rounded-3xl"/>)}</div></main>}
