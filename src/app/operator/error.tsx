"use client";
import { CircleAlert, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <div className="page-container"><div className="surface-card p-10 text-center"><CircleAlert className="mx-auto text-destructive" /><h1 className="mt-4 text-xl font-semibold">Your workspace could not be loaded</h1><p className="mt-2 text-sm text-muted-foreground">Please try again. If the issue continues, contact your platform administrator.</p><Button onClick={reset} className="mt-5"><RefreshCw />Try again</Button></div></div>; }
