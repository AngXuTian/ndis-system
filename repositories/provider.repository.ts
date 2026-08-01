import { db } from '@/db';
import { sql, Selectable } from 'kysely';
import { Provider } from '@/db/types';

export interface CreateProviderPayload {
  abn: string;
  name: string;
  email: string;
  phone_number?: string | null;
  address: string;
  unit_building?: string | null;
  deactivated_at?: string | null;
}

export interface UpdateProviderPayload {
  abn?: string;
  name?: string;
  email?: string;
  phone_number?: string | null;
  address?: string;
  unit_building?: string | null;
  deactivated_at?: string | null;
}

export class ProviderRepository {
  async list() {
    return await this.findAll(); 
  }

  async findAll(): Promise<Selectable<Provider>[]> {
    return await db
      .selectFrom('provider')
      .selectAll()
      .where('deleted_at', 'is', null)
      .orderBy('id', 'desc')
      .execute();
  }

  async findById(id: number): Promise<Selectable<Provider> | undefined> {
    return await db
      .selectFrom('provider')
      .selectAll()
      .where('id', '=', id)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();
  }

  async findByAbn(
    abn: string,
    excludeId?: number
  ): Promise<Selectable<Provider> | undefined> {
    let query = db
      .selectFrom('provider')
      .selectAll()
      .where('abn', '=', abn)
      .where('deleted_at', 'is', null);

    if (excludeId) {
      query = query.where('id', '!=', excludeId);
    }

    return await query.executeTakeFirst();
  }

  async create(data: CreateProviderPayload): Promise<Selectable<Provider>> {
  const namePartsArray = data.name.trim().split(/\s+/).filter(Boolean);

  return await db
    .insertInto('provider')
    .values({
      abn: data.abn,
      name: data.name,
      email: data.email,
      phone_number: data.phone_number ?? null,
      address: data.address,
      unit_building: data.unit_building ?? null,
      name_parts: namePartsArray,
      deactivated_at: data.deactivated_at ?? null,
      updated_at: sql`now()`,
    })
    .returningAll()
    .executeTakeFirstOrThrow();
}

  async update(
    id: number,
    data: UpdateProviderPayload
  ): Promise<Selectable<Provider> | undefined> {
    const { name, ...rest } = data;

    const updateData: Record<string, unknown> = {
      ...rest,
      updated_at: sql`now()`,
    };

    if (name !== undefined) {
      updateData.name = name;
      updateData.name_parts = name.trim().split(/\s+/).filter(Boolean);
    }

    return await db
      .updateTable('provider')
      .set(updateData)
      .where('id', '=', id)
      .where('deleted_at', 'is', null)
      .returningAll()
      .executeTakeFirst();
  }

  async softDelete(id: number): Promise<Selectable<Provider> | undefined> {
    return await db
      .updateTable('provider')
      .set({
        deleted_at: sql`now()`,
        updated_at: sql`now()`,
      })
      .where('id', '=', id)
      .where('deleted_at', 'is', null)
      .returningAll()
      .executeTakeFirst();
  }
}

export const providerRepository = new ProviderRepository();