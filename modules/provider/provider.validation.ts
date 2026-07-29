export interface ProviderInput {
  abn?: string;
  name?: string;
  email?: string;
  phone_number?: string | null;
  address?: string;
  unit_building?: string | null;
}

export type ValidationErrors = Record<string, string[]>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DIGITS_RE = /^\d+$/;

export function validateProvider(input: ProviderInput): ValidationErrors {
  const errors: ValidationErrors = {};
  const push = (field: string, message: string) => {
    (errors[field] ??= []).push(message);
  };

  if (!input.abn || !input.abn.trim()) {
    push("abn", "ABN is required");
  } else if (!DIGITS_RE.test(input.abn) || input.abn.length > 11) {
    push("abn", "ABN must be digits only, max 11 digits");
  }

  if (!input.name || !input.name.trim()) {
    push("name", "Name is required");
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

  return errors;
}

export function hasErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}