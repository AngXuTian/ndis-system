import { NextRequest } from "next/server";
import { invoiceService, ValidationError } from "@/modules/invoice/invoice.service";
import { apiSuccess, apiValidationError, apiServerError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? undefined;
    const clientId = searchParams.get("clientId") ? Number(searchParams.get("clientId")) : undefined;
    const providerId = searchParams.get("providerId") ? Number(searchParams.get("providerId")) : undefined;
    const page = Number(searchParams.get("page") ?? 1);
    const pageSize = Number(searchParams.get("pageSize") ?? 20);

    const { rows, total } = await invoiceService.list({ search, clientId, providerId, page, pageSize });
    return apiSuccess(rows, { total, page, pageSize });
  } catch (err) {
    return apiServerError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await invoiceService.create(body);
    return apiSuccess(result, undefined, 201);
  } catch (err) {
    if (err instanceof ValidationError) return apiValidationError(err.errors);
    return apiServerError(err);
  }
}