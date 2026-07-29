export interface ClientInput {
  first_name?: string;
  last_name?: string;
  gender_id?: number | null;
  dob?: string | null;
  ndis_number?: string;
  email?: string;
  phone_number?: string | null;
  address?: string;
  unit_building?: string | null;
  pricing_region?: string;
}

export type ValidationErrors = Record<string, string[]>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DIGITS_RE = /^\d+$/;

export function validateClient(input: ClientInput): ValidationErrors {
  const errors: ValidationErrors = {};

  const push = (field: string, message: string) => {
    (errors[field] ??= []).push(message);
  };

  if (!input.first_name || !input.first_name.trim()) {
    push("first_name", "First name is required");
  }

  if (!input.last_name || !input.last_name.trim()) {
    push("last_name", "Last name is required");
  }

  if (input.gender_id === undefined || input.gender_id === null) {
    push("gender_id", "Gender is required");
  }

  if (!input.dob) {
    push("dob", "Date of birth is required");
  }

  if (!input.ndis_number || !input.ndis_number.trim()) {
    push("ndis_number", "NDIS number is required");
  } else if (!DIGITS_RE.test(input.ndis_number) || input.ndis_number.length > 16) {
    push("ndis_number", "NDIS number must be digits only, max 16 digits");
  }

  if (!input.email || !input.email.trim()) {
    push("email", "Email is required");
  } else if (!EMAIL_RE.test(input.email)) {
    push("email", "Email must be a valid email address");
  }

  if (input.phone_number) {
    if (!DIGITS_RE.test(input.phone_number) || input.phone_number.length < 3 || input.phone_number.length > 16) {
      push("phone_number", "Phone number must be 3-16 digits");
    }
  }

  if (!input.address || !input.address.trim()) {
    push("address", "Address is required");
  }

  if (input.unit_building !== undefined && input.unit_building !== null && input.unit_building !== "") {
    if (!input.unit_building.trim()) {
      push("unit_building", "Unit/building must not be empty if provided");
    }
  }

  if (!input.pricing_region || !input.pricing_region.trim()) {
    push("pricing_region", "Pricing region is required");
  }

  return errors;
}

export function hasErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}
