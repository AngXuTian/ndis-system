import { rateSetRepository } from "@/repositories/rate-set.repository";
import { validateRateSet, hasErrors, type RateSetInput } from "@/modules/rate-set/rate-set.validation";

export class ValidationError extends Error {
  constructor(public errors: Record<string, string[]>) {
    super("Validation failed");
    this.name = "ValidationError";
  }
}

const EXCLUSION_VIOLATION = "23P01";

function isPgError(err: unknown, code: string): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === code
  );
}

export const rateSetService = {
  async list(params: { page?: number; pageSize?: number }) {
    const pageSize = params.pageSize ?? 20;
    const page = params.page ?? 1;
    return rateSetRepository.list({ limit: pageSize, offset: (page - 1) * pageSize });
  },

  async get(id: number) {
    const rateSet = await rateSetRepository.findById(id);
    if (!rateSet) return null;
    const summary = await rateSetRepository.summary(id);
    return { rateSet, summary };
  },

  async create(input: RateSetInput) {
    const errors = validateRateSet(input);
    if (hasErrors(errors)) throw new ValidationError(errors);

    try {
      return await rateSetRepository.create({
        name: input.name!.trim(),
        description: input.description?.trim() || null,
        start_date: input.start_date!,
        end_date: input.end_date || null,
      });
    } catch (err) {
      if (isPgError(err, EXCLUSION_VIOLATION)) {
        throw new ValidationError({
          start_date: ["This date range overlaps with an existing active rate set"],
        });
      }
      throw err;
    }
  },

  async update(id: number, input: RateSetInput) {
    const errors = validateRateSet(input);
    if (hasErrors(errors)) throw new ValidationError(errors);

    try {
      const updated = await rateSetRepository.update(id, {
        name: input.name!.trim(),
        description: input.description?.trim() || null,
        start_date: input.start_date!,
        end_date: input.end_date || null,
      });
      if (!updated) throw new Error("Rate set not found");
      return updated;
    } catch (err) {
      if (isPgError(err, EXCLUSION_VIOLATION)) {
        throw new ValidationError({
          start_date: ["This date range overlaps with an existing active rate set"],
        });
      }
      throw err;
    }
  },

  async remove(id: number) {
    const deleted = await rateSetRepository.softDelete(id);
    if (!deleted) throw new Error("Rate set not found");
    return deleted;
  },
};