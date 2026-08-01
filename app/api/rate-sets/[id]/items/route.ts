import { NextResponse } from 'next/server';
import { rateSetRepository } from '@/repositories/rate-set.repository';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rateSetId = Number(id);

    if (isNaN(rateSetId)) {
      return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'Invalid ID' } }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);

    const filterCategory = searchParams.get('categoryId');
    const filterSupportItem = searchParams.get('supportItemId');
    const filterType = searchParams.get('typeId');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');

    const filters = {
      categoryId: filterCategory && filterCategory !== 'ALL' ? Number(filterCategory) : undefined,
      supportItemId: filterSupportItem && filterSupportItem !== 'ALL' ? Number(filterSupportItem) : undefined,
      typeId: filterType && filterType !== 'ALL' ? Number(filterType) : undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
    };

    const items = await rateSetRepository.itemsTable(rateSetId, filters);
    const filterOpts = await rateSetRepository.filterOptions(rateSetId);

    return NextResponse.json({
      data: {
        items,
        categories: filterOpts.categories,
        supportItems: filterOpts.supportItems,
        types: filterOpts.types,
        priceRange: filterOpts.priceRange,
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching rate set items:', error); // Check terminal output for this log!
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message } }, { status: 500 });
  }
}