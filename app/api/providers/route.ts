import { NextResponse } from 'next/server';
import { providerService } from '@/services/provider.service';
import { ZodError } from 'zod';

export async function GET(): Promise<NextResponse> {
  try {
    const providers = await providerService.getAllProviders();
    return NextResponse.json({ data: providers });
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
    const newProvider = await providerService.createProvider(body);
    return NextResponse.json({ data: newProvider }, { status: 201 });
  } catch (error: unknown) {
    console.error('POST /api/providers Error:', error); // <-- Logs precise Zod errors to terminal

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
    if (error instanceof Error && error.message === 'ABN_EXISTS') {
      return NextResponse.json(
        { error: { code: 'ABN_EXISTS', message: 'ABN already exists' } },
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