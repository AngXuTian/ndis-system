export interface RateSetInput {
  name?: string;
  description?: string | null;
  start_date?: string;
  end_date?: string | null;
}

export type ValidationErrors = Record<string, string[]>;

function push(errors: ValidationErrors, field: string, message: string) {
  (errors[field] ??= []).push(message);
}

export function validateRateSet(input: RateSetInput): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!input.name || !input.name.trim()) {
    push(errors, "name", "Name is required");
  }

  if (!input.start_date) {
    push(errors, "start_date", "Start date is required");
  }

  if (input.start_date && input.end_date) {
    if (new Date(input.start_date) > new Date(input.end_date)) {
      push(errors, "end_date", "End date must be on or after start date");
    }
  }

  return errors;
}

export function hasErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}