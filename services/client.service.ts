import { clientRepository, PaginatedResult } from '@/repositories/client.repository';
import { clientSchema, ClientInput } from '@/validations/client.validation';
import { Client } from '@/db/types';
import { Selectable } from 'kysely';

export class ClientService {
  async getAllClients(): Promise<Selectable<Client>[]> {
    return await clientRepository.findAll();
  }

  async list(options?: {
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResult<Selectable<Client>>> {
    if (options && (options.page || options.pageSize)) {
      return await clientRepository.findPaginated(options);
    }
    const rows = await clientRepository.findAll();
    return {
      rows,
      total: rows.length,
    };
  }

  async getClientById(id: number): Promise<Selectable<Client>> {
    const client = await clientRepository.findById(id);
    if (!client) {
      throw new Error('CLIENT_NOT_FOUND');
    }
    return client;
  }

  async createClient(rawInput: unknown): Promise<Selectable<Client>> {
    const validated: ClientInput = clientSchema.parse(rawInput);

    const existing = await clientRepository.findByNdisNumber(validated.ndis_number);
    if (existing) {
      throw new Error('NDIS_NUMBER_EXISTS');
    }

    const { is_active, dob, ...rest } = validated;

    return await clientRepository.create({
      ...rest,
      dob: new Date(dob).toISOString().split('T')[0],
      deactivated_at: is_active ? null : new Date().toISOString(),
    });
  }

  async updateClient(
    id: number,
    rawInput: unknown
  ): Promise<Selectable<Client> | undefined> {
    await this.getClientById(id);
    const validated: ClientInput = clientSchema.parse(rawInput);

    const existing = await clientRepository.findByNdisNumber(validated.ndis_number, id);
    if (existing) {
      throw new Error('NDIS_NUMBER_EXISTS');
    }

    const { is_active, dob, ...rest } = validated;

    return await clientRepository.update(id, {
      ...rest,
      dob: new Date(dob).toISOString().split('T')[0],
      deactivated_at: is_active ? null : new Date().toISOString(),
    });
  }

  async deleteClient(id: number): Promise<Selectable<Client> | undefined> {
    await this.getClientById(id);
    return await clientRepository.softDelete(id);
  }
}

export const clientService = new ClientService();