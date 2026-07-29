import { NextRequest } from "next/server";
import { rateSetService, ValidationError } from "@/modules/rate-set/rate-set.service";
import { apiSuccess, apiValidationError, apiNotFound, apiServerError } from "@/lib/api-response";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const result = await rateSetService.get(Number(id));
    if (!result) return apiNotFound("Rate set");
    return apiSuccess(result);
  } catch (err) {
    return apiServerError(err);
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const rateSet = await rateSetService.update(Number(id), body);
    return apiSuccess(rateSet);
  } catch (err) {
    if (err instanceof ValidationError) return apiValidationError(err.errors);
    if (err instanceof Error && err.message === "Rate set not found") return apiNotFound("Rate set");
    return apiServerError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await rateSetService.remove(Number(id));
    return apiSuccess({ deleted: true });
  } catch (err) {
    if (err instanceof Error && err.message === "Rate set not found") return apiNotFound("Rate set");
    return apiServerError(err);
  }
}