import type { WorkspaceProduct } from "@/types/database";
export function productReadiness(product: WorkspaceProduct) {
  const missing: string[] = [];
  if (!product.name.trim()) missing.push("product name");
  if (!product.description || product.description.trim().length < 30)
    missing.push("meaningful description");
  if (!(Number(product.price) > 0)) missing.push("positive price");
  if (!(product.capacity > 0)) missing.push("capacity");
  if (product.images.length === 0) missing.push("at least one image");
  if (
    ["DAY_PASS", "MEETING_ROOM"].includes(product.type) &&
    !product.availability.some((d) => d.is_available)
  )
    missing.push("available schedule");
  if (product.type === "DAY_PASS" && !product.maximum_booking_quantity)
    missing.push("maximum booking quantity");
  if (product.type === "MEETING_ROOM") {
    if (!product.minimum_booking_minutes) missing.push("minimum duration");
    if (!Number(product.configuration.slotIntervalMinutes))
      missing.push("slot interval");
  }
  if (["DEDICATED_DESK", "PRIVATE_CABIN"].includes(product.type)) {
    if (!product.minimum_tenure_months) missing.push("minimum tenure");
    if (!product.available_from) missing.push("available-from date");
  }
  if (
    product.type === "DEDICATED_DESK" &&
    !product.inventory.some((unit) => unit.status === "AVAILABLE")
  )
    missing.push("at least one available desk");
  return { valid: missing.length === 0, missing };
}
