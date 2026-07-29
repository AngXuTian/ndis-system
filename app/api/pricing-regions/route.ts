import { db } from "@/db";
import { apiSuccess, apiServerError } from "@/lib/api-response";

export async function GET() {
  try {
    const regions = await db
      .selectFrom("rate_set_support_item_pricing_region")
      .selectAll()
      .where("deactivated_at", "is", null)
      .orderBy("label")
      .execute();
    return apiSuccess(regions);
  } catch (err) {
    return apiServerError(err);
  }
}
