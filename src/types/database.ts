export type UserRole = "SUPER_ADMIN" | "OPERATOR_ADMIN" | "CUSTOMER";
export type OperatorStatus = "ACTIVE" | "SUSPENDED" | "INACTIVE";
export type LocationStatus = "DRAFT" | "ACTIVE" | "SUSPENDED";
export type LocationReviewStatus =
  | "DRAFT"
  | "IN_REVIEW"
  | "CHANGES_REQUESTED"
  | "APPROVED";
export type WorkspaceProductType =
  | "DAY_PASS"
  | "MEETING_ROOM"
  | "DEDICATED_DESK"
  | "PRIVATE_CABIN";
export type WorkspaceProductStatus = "DRAFT" | "ACTIVE" | "INACTIVE";
export type PricingUnit = "PER_PERSON_PER_DAY" | "PER_HOUR" | "PER_MONTH";
export type InventoryUnitStatus = "AVAILABLE" | "BLOCKED" | "INACTIVE";

export interface ScheduleDay {
  id?: string;
  day_of_week: number;
  is_open?: boolean;
  is_available?: boolean;
  opens_at: string | null;
  closes_at: string | null;
}
export interface MediaImage {
  id: string;
  storage_path: string;
  alt_text: string | null;
  sort_order: number;
  is_cover: boolean;
  public_url?: string;
}
export interface InventoryUnit {
  id: string;
  workspace_product_id: string;
  code: string;
  name: string | null;
  status: InventoryUnitStatus;
  available_from: string | null;
}
export interface WorkspaceProduct {
  id: string;
  location_id: string;
  type: WorkspaceProductType;
  name: string;
  slug: string;
  description: string | null;
  status: WorkspaceProductStatus;
  price: number;
  pricing_unit: PricingUnit;
  capacity: number;
  amenities: string[];
  maximum_booking_quantity: number | null;
  minimum_booking_minutes: number | null;
  minimum_tenure_months: number | null;
  security_deposit: number;
  available_from: string | null;
  configuration: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  images: MediaImage[];
  availability: ScheduleDay[];
  inventory: InventoryUnit[];
}
export interface ManagedLocation {
  id: string;
  operator_id: string;
  name: string;
  slug: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  city: string;
  address: string;
  state: string | null;
  postal_code: string | null;
  country: string;
  timezone: string;
  amenities: string[];
  parking_available: boolean;
  parking_information: string | null;
  house_rules: string | null;
  cancellation_policy: string | null;
  cover_image_path: string | null;
  status: LocationStatus;
  review_status: LocationReviewStatus;
  review_notes: string | null;
  is_published: boolean;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}
export interface LocationWorkspace {
  location: ManagedLocation;
  hours: ScheduleDay[];
  images: MediaImage[];
  products: WorkspaceProduct[];
  operator?: {
    id: string;
    company_name: string;
    status: OperatorStatus;
  } | null;
}
export interface CompletionItem {
  key: string;
  label: string;
  complete: boolean;
  href: string;
  detail: string;
}
export interface CompletionSummary {
  percentage: number;
  complete: CompletionItem[];
  missing: CompletionItem[];
  canSubmit: boolean;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  operator_code: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OperatorSummary {
  id: string;
  company_name: string;
  slug: string;
  status: OperatorStatus;
  created_at: string;
  primary_admin: {
    id: string;
    full_name: string;
    email: string;
    operator_code: string | null;
  } | null;
  locations: Array<{
    id: string;
    name: string;
    city: string;
    address: string;
    state: string | null;
    postal_code: string | null;
    country: string;
    status: LocationStatus;
    is_published: boolean;
  }>;
}
