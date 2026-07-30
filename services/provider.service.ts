import { providerRepository } from "@/repositories/provider.repository";
import { validateProvider, hasErrors, type ProviderInput } from "@/modules/provider/provider.validation";

export class ValidationError extends Error {
  constructor(public errors: Record<string, string[]>) {
    super("Validation failed");
    this.name = "ValidationError";
  }
}

export const providerService = {
  async list(params: { search?: string; page?: number; pageSize?: number }) {
    const pageSize = params.pageSize ?? 20;
    const page = params.page ?? 1;
    return providerRepository.list({
      search: params.search,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
  },

  async get(id: number) {
    return providerRepository.findById(id);
  },

  async create(input: ProviderInput) {
    const errors = validateProvider(input);
    if (hasErrors(errors)) throw new ValidationError(errors);

    return providerRepository.create({
      abn: input.abn!.trim(),
      name: input.name!.trim(),
      email: input.email!.trim(),
      phone_number: input.phone_number?.trim() || null,
      address: input.address!.trim(),
      unit_building: input.unit_building?.trim() || null,
    });
  },

  async update(id: number, input: ProviderInput) {
    const errors = validateProvider(input);
    if (hasErrors(errors)) throw new ValidationError(errors);

    const updated = await providerRepository.update(id, {
      abn: input.abn!.trim(),
      name: input.name!.trim(),
      email: input.email!.trim(),
      phone_number: input.phone_number?.trim() || null,
      address: input.address!.trim(),
      unit_building: input.unit_building?.trim() || null,
    });

    if (!updated) throw new Error("Provider not found");
    return updated;
  },

  async remove(id: number) {
    const deleted = await providerRepository.softDelete(id);
    if (!deleted) throw new Error("Provider not found");
    return deleted;
  },
};