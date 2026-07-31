import { db } from '@/db';
import { sql, Selectable } from 'kysely';
import { Gender } from '@/db/types';

export interface CreateGenderPayload {
  code: string;
  label: string;
  deactivated_at?: string | null;
}

export interface UpdateGenderPayload {
  code?: string;
  label?: string;
  deactivated_at?: string | null;
}

export class GenderRepository {
  async findAll(): Promise<Selectable<Gender>[]> {
    return await db
      .selectFrom('gender')
      .selectAll()
      .where('deleted_at', 'is', null)
      .orderBy('id', 'asc')
      .execute();
  }

  async findById(id: number): Promise<Selectable<Gender> | undefined> {
    return await db
      .selectFrom('gender')
      .selectAll()
      .where('id', '=', id)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();
  }

  async create(data: CreateGenderPayload): Promise<Selectable<Gender>> {
    return await db
      .insertInto('gender')
      .values({
        code: data.code,
        label: data.label,
        deactivated_at: data.deactivated_at ?? null,
        updated_at: sql`now()`,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async update(id: number, data: UpdateGenderPayload): Promise<Selectable<Gender> | undefined> {
    return await db
      .updateTable('gender')
      .set({
        ...data,
        updated_at: sql`now()`,
      })
      .where('id', '=', id)
      .where('deleted_at', 'is', null)
      .returningAll()
      .executeTakeFirst();
  }

  async softDelete(id: number): Promise<Selectable<Gender> | undefined> {
    return await db
      .updateTable('gender')
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

export const genderRepository = new GenderRepository();