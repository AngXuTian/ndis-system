import { NextResponse } from 'next/server';
import { db } from '@/db';

import { sql } from 'kysely';
import { rateSetImportService } from '@/services/rate-set-import.service';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const rateSet = await db
      .selectFrom('rate_set')
      .selectAll()
      .where('id', '=', Number(id))
      .where('deleted_at', 'is', null)
      .executeTakeFirst();

    if (!rateSet) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Rate set not found' } }, { status: 404 });
    }

    return NextResponse.json({ data: rateSet });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message } }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const rateSetId = Number(id);

    const formData = await req.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const startDate = formData.get('start_date') as string;
    const endDate = formData.get('end_date') as string;
    const active = formData.get('active') === 'true';
    const file = formData.get('file') as File | null;

    const updated = await db
      .updateTable('rate_set')
      .set({
        name,
        description: description || null,
        start_date: new Date(startDate),
        end_date: endDate ? new Date(endDate) : null,
        deactivated_at: active ? null : new Date(),
        updated_at: sql`now()`,
      })
      .where('id', '=', rateSetId)
      .returningAll()
      .executeTakeFirstOrThrow();

    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      await rateSetImportService.importExcelToRateSet(rateSetId, buffer);
    }

    return NextResponse.json({ data: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message } }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    await db
      .updateTable('rate_set')
      .set({
        deactivated_at: sql`now()`,
        deleted_at: sql`now()`,
        updated_at: sql`now()`,
      })
      .where('id', '=', Number(id))
      .execute();

    return NextResponse.json({ data: { success: true } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message } }, { status: 500 });
  }
}