import { db } from "@/db";
import { apiSuccess, apiServerError } from "@/lib/api-response";

export async function GET() {
  try {
    const rateSets = await db
      .selectFrom("rate_set")
      .select(["id", "name", "start_date", "end_date"])
      .where("deleted_at", "is", null)
      .orderBy("start_date", "desc")
      .execute();
    return apiSuccess(rateSets);
  } catch (err) {
    return apiServerError(err);
  }
}