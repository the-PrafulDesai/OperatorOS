export type UserRole = "SUPER_ADMIN" | "OPERATOR_ADMIN" | "CUSTOMER";
export type OperatorStatus = "ACTIVE" | "SUSPENDED" | "INACTIVE";
export type LocationStatus = "DRAFT" | "ACTIVE" | "SUSPENDED";

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
