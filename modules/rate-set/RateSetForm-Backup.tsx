import { NextRequest } from "next/server";
import { rateSetRepository } from "@/repositories/rate-set.repository";
import { importNdisCatalogue } from "@/modules/rate-set/ndis-catalogue-import";
import { apiSuccess, apiNotFound, apiError, apiServerError } from "@/lib/api-response";

interface Params {
  params: Promise<{ id: string }>;
}

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const rateSetId = Number(id);

    const rateSet = await rateSetRepository.findById(rateSetId);
    if (!rateSet) return apiNotFound("Rate set");

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return apiError("VALIDATION_ERROR", "A file is required.", { file: ["File is required"] }, 422);
    }

    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    if (file.type && !allowedTypes.includes(file.type) && !file.name?.endsWith(".xlsx")) {
      return apiError(
        "VALIDATION_ERROR",
        "Only .xlsx files are supported.",
        { file: ["Only .xlsx files are supported"] },
        422
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const summary = await importNdisCatalogue(rateSetId, buffer);

    return apiSuccess(summary);
  } catch (err) {
    return apiServerError(err);
  }
}

