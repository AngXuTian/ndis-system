import { db } from '@/db';
import { sql, Selectable } from 'kysely';
import { Client } from '@/db/types';

export interface CreateClientPayload {
  first_name: string;
  last_name: string;
  gender_id: number;
  dob: string;
  ndis_number: string;
  email: string;
  phone_number?: string | null;
  address: string;
  unit_building?: string | null;
  pricing_region: string;
  deactivated_at?: string | null;
}

export interface UpdateClientPayload {
  first_name?: string;
  last_name?: string;
  gender_id?: number;
  dob?: string;
  ndis_number?: string;
  email?: string;
  phone_number?: string | null;
  address?: string;
  unit_building?: string | null;
  pricing_region?: string;
  deactivated_at?: string | null;
}

export interface PaginatedResult<T> {
  rows: T[];
  total: number;
}

export class ClientRepository {
  async findAll(): Promise<Selectable<Client>[]> {
    return await db
      .selectFrom('client')
      .selectAll()
      .where('deleted_at', 'is', null)
      .orderBy('id', 'desc')
      .execute();
  }

  async findPaginated({
    page = 1,
    pageSize = 10,
  }: {
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResult<Selectable<Client>>> {
    const offset = (page - 1) * pageSize;

    const [rows, countResult] = await Promise.all([
      db
        .selectFrom('client')
        .selectAll()
        .where('deleted_at', 'is', null)
        .orderBy('id', 'desc')
        .limit(pageSize)
        .offset(offset)
        .execute(),
      db
        .selectFrom('client')
        .select(db.fn.count<number>('id').as('total'))
        .where('deleted_at', 'is', null)
        .executeTakeFirst(),
    ]);

    return {
      rows,
      total: Number(countResult?.total ?? 0),
    };
  }

  async findById(id: number): Promise<Selectable<Client> | undefined> {
    return await db
      .selectFrom('client')
      .selectAll()
      .where('id', '=', id)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();
  }

  async findByNdisNumber(
    ndisNumber: string,
    excludeId?: number
  ): Promise<Selectable<Client> | undefined> {
    let query = db
      .selectFrom('client')
      .selectAll()
      .where('ndis_number', '=', ndisNumber)
      .where('deleted_at', 'is', null);

    if (excludeId) {
      query = query.where('id', '!=', excludeId);
    }

    return await query.executeTakeFirst();
  }

  // In repositories/client.repository.ts create method:
  async create(data: CreateClientPayload): Promise<Selectable<Client>> {
    // Split names into an array of string tokens for PostgreSQL text[]
    const namePartsArray = `${data.first_name} ${data.last_name}`
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    return await db
      .insertInto('client')
      .values({
        ...data,
        name_parts: namePartsArray, // <-- Now passes string[] instead of string
        updated_at: sql`now()`,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async update(
    id: number,
    data: UpdateClientPayload
  ): Promise<Selectable<Client> | undefined> {
    const { first_name, last_name, ...rest } = data;

    // Build updated fields object
    const updateData: Record<string, unknown> = {
      ...rest,
      updated_at: sql`now()`,
    };

    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;

    if (first_name !== undefined || last_name !== undefined) {
      const existing = await this.findById(id);
      const fn = first_name ?? existing?.first_name ?? '';
      const ln = last_name ?? existing?.last_name ?? '';

      updateData.name_parts = `${fn} ${ln}`
        .trim()
        .split(/\s+/)
        .filter(Boolean);
    }

    return await db
      .updateTable('client')
      .set(updateData)
      .where('id', '=', id)
      .where('deleted_at', 'is', null)
      .returningAll()
      .executeTakeFirst();
  }

  async softDelete(id: number): Promise<Selectable<Client> | undefined> {
    return await db
      .updateTable('client')
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

export const clientRepository = new ClientRepository();