import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() { return <div className="page-container"><Skeleton className="h-4 w-32" /><Skeleton className="mt-3 h-9 w-72" /><div className="mt-8 grid gap-6 lg:grid-cols-2"><Skeleton className="h-64 rounded-2xl" /><Skeleton className="h-64 rounded-2xl" /></div></div>; }
