import { db } from "@/db";
import { apiSuccess, apiServerError } from "@/lib/api-response";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");

    let query = db
      .selectFrom("rate_set_support_item")
      .select(["id", "category_id", "item_number", "item_name", "unit"])
      .where("rate_set_id", "=", Number(id))
      .where("deleted_at", "is", null);

    if (categoryId) query = query.where("category_id", "=", Number(categoryId));

    const items = await query.orderBy("sorting", "asc").execute();
    return apiSuccess(items);
  } catch (err) {
    return apiServerError(err);
  }
}