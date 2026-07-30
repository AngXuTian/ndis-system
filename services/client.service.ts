import { clientRepository } from "@/repositories/client.repository";
import { validateClient, hasErrors, type ClientInput } from "@/modules/client/client.validation";

export class ValidationError extends Error {
  constructor(public errors: Record<string, string[]>) {
    super("Validation failed");
    this.name = "ValidationError";
  }
}

export const clientService = {
  async list(params: { search?: string; page?: number; pageSize?: number }) {
    const pageSize = params.pageSize ?? 20;
    const page = params.page ?? 1;
    return clientRepository.list({
      search: params.search,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
  },

  async get(id: number) {
    return clientRepository.findById(id);
  },

  async create(input: ClientInput) {
    const errors = validateClient(input);
    if (hasErrors(errors)) throw new ValidationError(errors);

    return clientRepository.create({
      first_name: input.first_name!.trim(),
      last_name: input.last_name!.trim(),
      gender_id: input.gender_id!,
      dob: input.dob!,
      ndis_number: input.ndis_number!.trim(),
      email: input.email!.trim(),
      phone_number: input.phone_number?.trim() || null,
      address: input.address!.trim(),
      unit_building: input.unit_building?.trim() || null,
      pricing_region: input.pricing_region!,
    });
  },

  async update(id: number, input: ClientInput) {
    const errors = validateClient(input);
    if (hasErrors(errors)) throw new ValidationError(errors);

    const updated = await clientRepository.update(id, {
      first_name: input.first_name!.trim(),
      last_name: input.last_name!.trim(),
      gender_id: input.gender_id!,
      dob: input.dob!,
      ndis_number: input.ndis_number!.trim(),
      email: input.email!.trim(),
      phone_number: input.phone_number?.trim() || null,
      address: input.address!.trim(),
      unit_building: input.unit_building?.trim() || null,
      pricing_region: input.pricing_region!,
    });

    if (!updated) throw new Error("Client not found");
    return updated;
  },

  async remove(id: number) {
    const deleted = await clientRepository.softDelete(id);
    if (!deleted) throw new Error("Client not found");
    return deleted;
  },
};
