import { NextResponse } from 'next/server';
import { db } from '@/db';
import { rateSetImportService } from '@/services/rate-set-import.service';
import { sql } from 'kysely';

export async function GET(): Promise<NextResponse> {
  try {
    const rateSets = await db
      .selectFrom('rate_set')
      .selectAll()
      .where('deleted_at', 'is', null)
      .orderBy('id', 'desc')
      .execute();

    return NextResponse.json({ data: rateSets });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message } }, { status: 500 });
  }
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const formData = await req.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const startDate = formData.get('start_date') as string;
    const endDate = formData.get('end_date') as string;
    const active = formData.get('active') === 'true';
    const file = formData.get('file') as File | null;

    if (!name || !startDate) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Name and Start Date are required' } },
        { status: 400 }
      );
    }

    const created = await db
      .insertInto('rate_set')
      .values({
        name,
        description: description || null,
        start_date: new Date(startDate),
        end_date: endDate ? new Date(endDate) : null,
        deactivated_at: active ? null : new Date(),
        updated_at: sql`now()`,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      await rateSetImportService.importExcelToRateSet(created.id, buffer);
    }

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message } }, { status: 500 });
  }
}