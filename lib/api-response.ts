import { NextResponse } from "next/server";

export function apiSuccess<T>(data: T, meta?: Record<string, unknown>, init?: number) {
  return NextResponse.json({ data, ...(meta ? { meta } : {}) }, { status: init ?? 200 });
}

export function apiError(code: string, message: string, details?: unknown, status = 400) {
  return NextResponse.json(
    { error: { code, message, ...(details ? { details } : {}) } },
    { status }
  );
}

export function apiValidationError(details: Record<string, string[]>) {
  return apiError("VALIDATION_ERROR", "One or more fields are invalid.", details, 422);
}

export function apiNotFound(entity: string) {
  return apiError("NOT_FOUND", `${entity} not found.`, undefined, 404);
}

export function apiServerError(err: unknown) {
  console.error(err);
  return apiError("INTERNAL_ERROR", "An unexpected error occurred.", undefined, 500);
}
