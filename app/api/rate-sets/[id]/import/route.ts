import { rateSetImportService } from '@/services/rate-set-import.service';
import { NextResponse } from 'next/server';


export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const rateSetId = Number(id);

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'No Excel file provided' } },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await rateSetImportService.importExcelToRateSet(rateSetId, buffer);

    return NextResponse.json({ data: result }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error during import';
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message } }, { status: 500 });
  }
}