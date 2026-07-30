import { NextRequest } from "next/server";
import { providerService, ValidationError } from "@/services/provider.service";
import { apiSuccess, apiValidationError, apiNotFound, apiServerError } from "@/lib/api-response";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const provider = await providerService.get(Number(id));
    if (!provider) return apiNotFound("Provider");
    return apiSuccess(provider);
  } catch (err) {
    return apiServerError(err);
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const provider = await providerService.update(Number(id), body);
    return apiSuccess(provider);
  } catch (err) {
    if (err instanceof ValidationError) return apiValidationError(err.errors);
    if (err instanceof Error && err.message === "Provider not found") return apiNotFound("Provider");
    return apiServerError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await providerService.remove(Number(id));
    return apiSuccess({ deleted: true });
  } catch (err) {
    if (err instanceof Error && err.message === "Provider not found") return apiNotFound("Provider");
    return apiServerError(err);
  }
}