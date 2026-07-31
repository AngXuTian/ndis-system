import { NextResponse } from 'next/server';
import { clientService } from '@/services/client.service';
import { ZodError } from 'zod';

export async function GET(req: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const page = searchParams.get('page');
    const pageSize = searchParams.get('pageSize');

    if (page || pageSize) {
      const result = await clientService.list({
        page: page ? Number(page) : 1,
        pageSize: pageSize ? Number(pageSize) : 10,
      });
      return NextResponse.json({ data: result });
    }

    const clients = await clientService.getAllClients();
    return NextResponse.json({ data: clients });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message } },
      { status: 500 }
    );
  }
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body: unknown = await req.json();
    const newClient = await clientService.createClient(body);
    return NextResponse.json({ data: newClient }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message === 'NDIS_NUMBER_EXISTS') {
      return NextResponse.json(
        { error: { code: 'NDIS_NUMBER_EXISTS', message: 'NDIS number already exists' } },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message } },
      { status: 500 }
    );
  }
}