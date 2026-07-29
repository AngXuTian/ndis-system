import { db } from "@/db";
import { apiSuccess, apiServerError } from "@/lib/api-response";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const categories = await db
      .selectFrom("rate_set_category")
      .select(["id", "category_number", "category_name"])
      .where("rate_set_id", "=", Number(id))
      .where("deleted_at", "is", null)
      .orderBy("sorting", "asc")
      .execute();
    return apiSuccess(categories);
  } catch (err) {
    return apiServerError(err);
  }
}