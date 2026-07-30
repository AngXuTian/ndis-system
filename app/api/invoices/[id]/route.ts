import { NextRequest } from "next/server";
import { invoiceService, ValidationError } from "@/services/invoice.service";
import { apiSuccess, apiValidationError, apiNotFound, apiServerError } from "@/lib/api-response";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const result = await invoiceService.get(Number(id));
    if (!result) return apiNotFound("Invoice");
    return apiSuccess(result);
  } catch (err) {
    return apiServerError(err);
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const result = await invoiceService.update(Number(id), body);
    return apiSuccess(result);
  } catch (err) {
    if (err instanceof ValidationError) return apiValidationError(err.errors);
    if (err instanceof Error && err.message === "Invoice not found") return apiNotFound("Invoice");
    return apiServerError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await invoiceService.remove(Number(id));
    return apiSuccess({ deleted: true });
  } catch (err) {
    if (err instanceof Error && err.message === "Invoice not found") return apiNotFound("Invoice");
    return apiServerError(err);
  }
}