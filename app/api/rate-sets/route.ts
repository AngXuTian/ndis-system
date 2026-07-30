import { NextRequest } from "next/server";
import { rateSetService, ValidationError } from "@/services/rate-set.service";
import { apiSuccess, apiValidationError, apiServerError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") ?? 1);
    const pageSize = Number(searchParams.get("pageSize") ?? 20);

    const { rows, total } = await rateSetService.list({ page, pageSize });
    return apiSuccess(rows, { total, page, pageSize });
  } catch (err) {
    return apiServerError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rateSet = await rateSetService.create(body);
    return apiSuccess(rateSet, undefined, 201);
  } catch (err) {
    if (err instanceof ValidationError) return apiValidationError(err.errors);
    return apiServerError(err);
  }
}