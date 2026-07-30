import { NextRequest } from "next/server";
import { clientService, ValidationError } from "@/services/client.service";
import { apiSuccess, apiValidationError, apiNotFound, apiServerError } from "@/lib/api-response";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const client = await clientService.get(Number(id));
    if (!client) return apiNotFound("Client");
    return apiSuccess(client);
  } catch (err) {
    return apiServerError(err);
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const client = await clientService.update(Number(id), body);
    return apiSuccess(client);
  } catch (err) {
    if (err instanceof ValidationError) return apiValidationError(err.errors);
    if (err instanceof Error && err.message === "Client not found") return apiNotFound("Client");
    return apiServerError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await clientService.remove(Number(id));
    return apiSuccess({ deleted: true });
  } catch (err) {
    if (err instanceof Error && err.message === "Client not found") return apiNotFound("Client");
    return apiServerError(err);
  }
}
