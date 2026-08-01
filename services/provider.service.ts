import { providerRepository } from '@/repositories/provider.repository';
import { providerSchema, ProviderInput } from '@/validations/provider.validation';
import { Provider } from '@/db/types';
import { Selectable } from 'kysely';

export class ProviderService {
  async getAllProviders(): Promise<Selectable<Provider>[]> {
    return await providerRepository.findAll();
  }

  async list(options?: { page?: number; pageSize?: number }) {
    const rows = await providerRepository.findAll();
    return {
      rows,
      total: rows.length,
    };
  }

  async getProviderById(id: number): Promise<Selectable<Provider>> {
    const provider = await providerRepository.findById(id);
    if (!provider) {
      throw new Error('PROVIDER_NOT_FOUND');
    }
    return provider;
  }

  async createProvider(rawInput: unknown): Promise<Selectable<Provider>> {
    const validated: ProviderInput = providerSchema.parse(rawInput);
    const existing = await providerRepository.findByAbn(validated.abn);
    if (existing) {
      throw new Error('ABN_EXISTS');
    }

    const { is_active, ...rest } = validated;
    return await providerRepository.create({
      ...rest,
      deactivated_at: is_active ? null : new Date().toISOString(),
    });
  }

  async updateProvider(id: number, rawInput: unknown): Promise<Selectable<Provider> | undefined> {
    await this.getProviderById(id);
    const validated: ProviderInput = providerSchema.parse(rawInput);
    const existing = await providerRepository.findByAbn(validated.abn, id);
    if (existing) {
      throw new Error('ABN_EXISTS');
    }

    const { is_active, ...rest } = validated;
    return await providerRepository.update(id, {
      ...rest,
      deactivated_at: is_active ? null : new Date().toISOString(),
    });
  }

  async deleteProvider(id: number): Promise<Selectable<Provider> | undefined> {
    await this.getProviderById(id);
    return await providerRepository.softDelete(id);
  }
}

export const providerService = new ProviderService();