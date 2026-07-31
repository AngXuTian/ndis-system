import { NextResponse } from 'next/server';
import { invoiceService } from '@/services/invoice.service';
import { ZodError } from 'zod';

export async function GET(): Promise<NextResponse> {
  try {
    const invoices = await invoiceService.getAllInvoices();
    return NextResponse.json({ data: invoices });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message } }, { status: 500 });
  }
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body = await req.json();
    const newInvoice = await invoiceService.saveInvoice(body);
    return NextResponse.json({ data: newInvoice }, { status: 201 });
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
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: { code: 'BAD_REQUEST', message } }, { status: 400 });
  }
}