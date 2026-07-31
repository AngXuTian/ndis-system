import { NextResponse } from 'next/server';
import { providerService } from '@/services/provider.service';
import { ZodError } from 'zod';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body: unknown = await req.json();
    const updatedProvider = await providerService.updateProvider(Number(id), body);
    return NextResponse.json({ data: updatedProvider });
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

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    await providerService.deleteProvider(Number(id));
    return NextResponse.json({ data: { success: true } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message } },
      { status: 500 }
    );
  }
}