import { NextResponse } from 'next/server';
import { genderService } from '@/services/gender.service';
import { ZodError } from 'zod';

export async function GET(): Promise<NextResponse> {
  try {
    const genders = await genderService.getAllGenders();
    return NextResponse.json({ data: genders });
  } catch (error: unknown) {
    console.error('GET /api/genders Failed:', error);
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
    const newGender = await genderService.createGender(body);
    return NextResponse.json({ data: newGender }, { status: 201 });
  } catch (error: unknown) {
    console.error('POST /api/genders Failed:', error);

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
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message } },
      { status: 500 }
    );
  }
}