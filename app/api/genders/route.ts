import { db } from "@/db";
import { apiSuccess, apiServerError } from "@/lib/api-response";

export async function GET() {
  try {
    const genders = await db
      .selectFrom("gender")
      .selectAll()
      .where("deactivated_at", "is", null)
      .orderBy("label")
      .execute();
    return apiSuccess(genders);
  } catch (err) {
    return apiServerError(err);
  }
}
