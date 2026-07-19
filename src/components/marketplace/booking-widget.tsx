"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { currency, pricingUnitLabel } from "@/lib/products/labels";
import type { WorkspaceProduct } from "@/types/database";

export function BookingWidget({ product }: { product: WorkspaceProduct }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [checking, setChecking] = useState(false);
  const [inventoryUnitId, setInventoryUnitId] = useState(
    product.inventory.find((i) => i.status === "AVAILABLE")?.id ?? "",
  );
  const submit = async (formData: FormData) => {
    setChecking(true);
    setMessage("");
    const common = { productId: product.id, productType: product.type };
    const body =
      product.type === "DAY_PASS"
        ? {
            ...common,
            bookingDate: formData.get("bookingDate"),
            quantity: Number(formData.get("quantity")),
          }
        : product.type === "MEETING_ROOM"
          ? {
              ...common,
              bookingDate: formData.get("bookingDate"),
              startTime: formData.get("startTime"),
              endTime: formData.get("endTime"),
              attendees: Number(formData.get("attendees")),
            }
          : product.type === "DEDICATED_DESK"
            ? {
                ...common,
                inventoryUnitId,
                startDate: formData.get("startDate"),
                months: Number(formData.get("months")),
              }
            : {
                ...common,
                startDate: formData.get("startDate"),
                months: Number(formData.get("months")),
                teamSize: Number(formData.get("teamSize")),
              };
    const availability = await fetch("/api/marketplace/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const availabilityResult = await availability.json();
    if (!availability.ok) {
      setMessage(
        availabilityResult.error?.message ?? "This option is unavailable.",
      );
      setChecking(false);
      return;
    }
    setMessage(
      `Available · ${currency(availabilityResult.data.totalAmount)} total`,
    );
    const hold = await fetch("/api/customer/holds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (hold.status === 401) {
      const next = `${window.location.pathname}#book-${product.id}`;
      router.push(`/login?next=${encodeURIComponent(next)}`);
      return;
    }
    const holdResult = await hold.json();
    if (!hold.ok) {
      setMessage(holdResult.error?.message ?? "The hold could not be created.");
      setChecking(false);
      return;
    }
    router.push(`/checkout/${holdResult.data.id}`);
  };
  return (
    <div
      id={`book-${product.id}`}
      className="rounded-2xl border bg-white p-5 shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold">{product.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {product.description}
          </p>
        </div>
        <div className="text-right">
          <p className="font-semibold">{currency(product.price)}</p>
          <p className="text-[11px] text-muted-foreground">
            {pricingUnitLabel[product.pricing_unit]}
          </p>
        </div>
      </div>
      <form action={submit} className="mt-5 grid gap-4 sm:grid-cols-2">
        {(product.type === "DAY_PASS" || product.type === "MEETING_ROOM") && (
          <Field label="Date">
            <Input name="bookingDate" type="date" required />
          </Field>
        )}
        {product.type === "DAY_PASS" && (
          <Field label="Passes">
            <Input
              name="quantity"
              type="number"
              min="1"
              max={product.maximum_booking_quantity ?? product.capacity}
              defaultValue="1"
              required
            />
          </Field>
        )}
        {product.type === "MEETING_ROOM" && (
          <>
            <Field label="Start time">
              <Input name="startTime" type="time" required />
            </Field>
            <Field label="End time">
              <Input name="endTime" type="time" required />
            </Field>
            <Field label="Attendees">
              <Input
                name="attendees"
                type="number"
                min="1"
                max={product.capacity}
                defaultValue="1"
                required
              />
            </Field>
          </>
        )}
        {(product.type === "DEDICATED_DESK" ||
          product.type === "PRIVATE_CABIN") && (
          <>
            <Field label="Start date">
              <Input name="startDate" type="date" required />
            </Field>
            <Field label="Months">
              <Input
                name="months"
                type="number"
                min={product.minimum_tenure_months ?? 1}
                max="36"
                defaultValue={product.minimum_tenure_months ?? 1}
                required
              />
            </Field>
          </>
        )}
        {product.type === "DEDICATED_DESK" && (
          <div className="space-y-2 sm:col-span-2">
            <Label>Desk</Label>
            <Select
              value={inventoryUnitId}
              onValueChange={(value) => setInventoryUnitId(value ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose an available desk" />
              </SelectTrigger>
              <SelectContent>
                {product.inventory
                  .filter((i) => i.status === "AVAILABLE")
                  .map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name || unit.code}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {product.type === "PRIVATE_CABIN" && (
          <Field label="Team size">
            <Input
              name="teamSize"
              type="number"
              min="1"
              max={product.capacity}
              defaultValue="1"
              required
            />
          </Field>
        )}
        <div className="sm:col-span-2">
          <Button
            className="h-10 w-full"
            disabled={
              checking ||
              (product.type === "DEDICATED_DESK" && !inventoryUnitId)
            }
            onClick={(e) => {
              e.preventDefault();
              const form = e.currentTarget.form;
              if (!form) return;
              const formData = new FormData(form);
              submit(formData);
            }}
          >
            {checking ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
            {checking
              ? "Checking and holding…"
              : "Check availability & continue"}
          </Button>
          {message && (
            <p
              role="status"
              className={`mt-3 text-sm ${message.startsWith("Available") ? "text-emerald-700" : "text-destructive"}`}
            >
              {message}
            </p>
          )}
          <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5" />
            Prices are calculated securely. A successful selection is held for
            10 minutes.
          </p>
        </div>
      </form>
    </div>
  );
}
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
