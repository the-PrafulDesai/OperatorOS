import type { WorkspaceProductInput } from "@/validations/workspace-product";
import type {
  ManagedLocation,
  ScheduleDay,
  WorkspaceProduct,
} from "@/types/database";

export const productPricingUnit = (type: WorkspaceProductInput["type"]) =>
  type === "DAY_PASS"
    ? "PER_PERSON_PER_DAY"
    : type === "MEETING_ROOM"
      ? "PER_HOUR"
      : "PER_MONTH";
export function productRow(input: WorkspaceProductInput) {
  const base = {
    type: input.type,
    name: input.name.trim(),
    description: input.description.trim(),
    price: input.price,
    capacity: input.capacity,
    amenities: input.amenities,
    pricing_unit: productPricingUnit(input.type),
    maximum_booking_quantity: null as number | null,
    minimum_booking_minutes: null as number | null,
    minimum_tenure_months: null as number | null,
    security_deposit: 0,
    available_from: null as string | null,
    configuration: {} as Record<string, unknown>,
  };
  if (input.type === "DAY_PASS")
    return {
      ...base,
      maximum_booking_quantity: input.maximumBookingQuantity,
      configuration: {
        sameDayBookingAllowed: input.sameDayBookingAllowed,
        autoAssignSeat: input.autoAssignSeat,
      },
    };
  if (input.type === "MEETING_ROOM")
    return {
      ...base,
      minimum_booking_minutes: input.minimumBookingMinutes,
      configuration: {
        slotIntervalMinutes: input.slotIntervalMinutes,
        bufferMinutes: input.bufferMinutes,
      },
    };
  if (input.type === "DEDICATED_DESK")
    return {
      ...base,
      minimum_tenure_months: input.minimumTenureMonths,
      security_deposit: input.securityDeposit,
      available_from: input.availableFrom,
      configuration: { zone: input.zone },
    };
  return {
    ...base,
    minimum_tenure_months: input.minimumTenureMonths,
    security_deposit: input.securityDeposit,
    available_from: input.availableFrom,
  };
}
export function scheduleRows(input: WorkspaceProductInput, productId: string) {
  return input.schedule.map((day) => ({
    workspace_product_id: productId,
    day_of_week: day.dayOfWeek,
    is_available: day.isAvailable,
    opens_at: day.isAvailable ? day.opensAt : null,
    closes_at: day.isAvailable ? day.closesAt : null,
  }));
}
export function validateScheduleWithinLocation(
  input: WorkspaceProductInput,
  hours: ScheduleDay[],
) {
  const issues: string[] = [];
  input.schedule
    .filter((day) => day.isAvailable)
    .forEach((day) => {
      const locationDay = hours.find(
        (item) => item.day_of_week === day.dayOfWeek,
      );
      if (!locationDay?.is_open)
        issues.push(`Day ${day.dayOfWeek + 1} is closed at the location.`);
      else if (
        !day.opensAt ||
        !day.closesAt ||
        day.opensAt < (locationDay.opens_at ?? "") ||
        day.closesAt > (locationDay.closes_at ?? "")
      )
        issues.push(
          `Availability on day ${day.dayOfWeek + 1} must fall within location hours.`,
        );
    });
  return issues;
}
export function proposedProduct(
  input: WorkspaceProductInput,
  current?: WorkspaceProduct,
): WorkspaceProduct {
  const row = productRow(input);
  return {
    id: current?.id ?? crypto.randomUUID(),
    location_id: current?.location_id ?? "",
    slug: current?.slug ?? "",
    status: input.desiredStatus,
    created_at: current?.created_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: current?.images ?? [],
    inventory: current?.inventory ?? [],
    availability: input.schedule.map((d) => ({
      day_of_week: d.dayOfWeek,
      is_available: d.isAvailable,
      opens_at: d.opensAt,
      closes_at: d.closesAt,
    })),
    ...row,
  } as WorkspaceProduct;
}
export function locationHoursForProduct(
  location: ManagedLocation,
  hours: ScheduleDay[],
) {
  return { location, hours };
}
