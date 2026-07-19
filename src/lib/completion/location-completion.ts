import type {
  CompletionItem,
  CompletionSummary,
  LocationWorkspace,
} from "@/types/database";
import { productReadiness } from "./product-readiness";

export function evaluateLocationCompletion(
  workspace: LocationWorkspace,
): CompletionSummary {
  const { location, hours, images, products } = workspace;
  const active = products.filter((p) => p.status === "ACTIVE");
  const items: CompletionItem[] = [
    {
      key: "profile",
      label: "Location profile",
      complete: Boolean(
        location.name &&
        location.description &&
        location.description.length >= 40 &&
        location.address &&
        location.city &&
        location.state &&
        location.phone &&
        location.email,
      ),
      href: "/operator/location?tab=overview",
      detail: "Overview, address, and contact information",
    },
    {
      key: "amenities",
      label: "Amenities",
      complete: location.amenities.length > 0,
      href: "/operator/location?tab=amenities",
      detail: "Select at least one customer-facing amenity",
    },
    {
      key: "hours",
      label: "Operating hours",
      complete: hours.some((day) => day.is_open),
      href: "/operator/location?tab=hours",
      detail: "Configure at least one open day",
    },
    {
      key: "policies",
      label: "Policies",
      complete: Boolean(location.house_rules && location.cancellation_policy),
      href: "/operator/location?tab=hours",
      detail: "Add house rules and cancellation policy",
    },
    {
      key: "photos",
      label: "Location photos",
      complete: images.some((image) => image.is_cover),
      href: "/operator/location?tab=photos",
      detail: "Upload and select a cover image",
    },
    {
      key: "products",
      label: "Workspace products",
      complete: products.length > 0 && active.length > 0,
      href: "/operator/products",
      detail: "Create and activate at least one product",
    },
    {
      key: "product-readiness",
      label: "Pricing and availability",
      complete:
        active.length > 0 &&
        active.every((product) => productReadiness(product).valid),
      href: "/operator/products",
      detail: "Complete media, pricing, availability, and inventory",
    },
  ];
  const complete = items.filter((item) => item.complete);
  const missing = items.filter((item) => !item.complete);
  return {
    percentage: Math.round((complete.length / items.length) * 100),
    complete,
    missing,
    canSubmit: missing.length === 0,
  };
}
