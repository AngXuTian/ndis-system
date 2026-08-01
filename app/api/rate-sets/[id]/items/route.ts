import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'kysely';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const rateSetId = Number(id);

    const items = await db
      .selectFrom('rate_set_support_item as si')
      .innerJoin('rate_set_category as cat', 'cat.id', 'si.category_id')
      .leftJoin('rate_set_support_item_price as p', 'p.support_item_id', 'si.id')
      .leftJoin('rate_set_support_item_type as type', 'type.id', 'p.type_id')
      .leftJoin('rate_set_support_item_attribute as attr', 'attr.support_item_id', 'si.id')
      .select([
        'si.id',
        'si.category_id',
        'si.item_number',
        'si.item_name',
        'si.unit',
        'cat.category_number',
        'cat.category_name',
        'type.code as type_code',
        'type.label as type_label',
        'p.start_date',
        'p.end_date',
        sql<number>`MAX(CASE WHEN p.pricing_region_code = 'ACT' THEN p.unit_price END)`.as('act'),
        sql<number>`MAX(CASE WHEN p.pricing_region_code = 'NSW' THEN p.unit_price END)`.as('nsw'),
        sql<number>`MAX(CASE WHEN p.pricing_region_code = 'NT' THEN p.unit_price END)`.as('nt'),
        sql<number>`MAX(CASE WHEN p.pricing_region_code = 'QLD' THEN p.unit_price END)`.as('qld'),
        sql<number>`MAX(CASE WHEN p.pricing_region_code = 'SA' THEN p.unit_price END)`.as('sa'),
        sql<number>`MAX(CASE WHEN p.pricing_region_code = 'TAS' THEN p.unit_price END)`.as('tas'),
        sql<number>`MAX(CASE WHEN p.pricing_region_code = 'VIC' THEN p.unit_price END)`.as('vic'),
        sql<number>`MAX(CASE WHEN p.pricing_region_code = 'WA' THEN p.unit_price END)`.as('wa'),
        sql<number>`MAX(CASE WHEN p.pricing_region_code = 'REMOTE' THEN p.unit_price END)`.as('remote'),
        sql<number>`MAX(CASE WHEN p.pricing_region_code = 'VERY_REMOTE' THEN p.unit_price END)`.as('very_remote'),
        sql<boolean>`MAX(CASE WHEN attr.attribute_code = 'IS_QUOTE_REQUIRED' THEN attr.value ELSE false END)`.as('is_quote_required'),
        sql<boolean>`MAX(CASE WHEN attr.attribute_code = 'IS_NF2F_SUPPORT_PROVISION' THEN attr.value ELSE false END)`.as('is_nf2f_support_provision'),
        sql<boolean>`MAX(CASE WHEN attr.attribute_code = 'IS_PROVIDER_TRAVEL' THEN attr.value ELSE false END)`.as('is_provider_travel'),
        sql<boolean>`MAX(CASE WHEN attr.attribute_code = 'IS_SHORT_NOTICE_CANCEL' THEN attr.value ELSE false END)`.as('is_short_notice_cancel'),
        sql<boolean>`MAX(CASE WHEN attr.attribute_code = 'IS_NDIA_REQUESTED_REPORTS' THEN attr.value ELSE false END)`.as('is_ndia_requested_reports'),
        sql<boolean>`MAX(CASE WHEN attr.attribute_code = 'IS_IRREGULAR_SIL_SUPPORTS' THEN attr.value ELSE false END)`.as('is_irregular_sil_supports'),
      ])
      .where('si.rate_set_id', '=', rateSetId)
      .groupBy([
        'si.id',
        'si.category_id',
        'si.item_number',
        'si.item_name',
        'si.unit',
        'cat.category_number',
        'cat.category_name',
        'type.code',
        'type.label',
        'p.start_date',
        'p.end_date',
      ])
      .execute();

    const categories = await db
      .selectFrom('rate_set_category')
      .select(['id', 'category_name'])
      .where('rate_set_id', '=', rateSetId)
      .execute();

    const supportItems = await db
      .selectFrom('rate_set_support_item')
      .select(['id', 'item_name'])
      .where('rate_set_id', '=', rateSetId)
      .execute();

    const types = await db
      .selectFrom('rate_set_support_item_type')
      .select(['code', 'label'])
      .execute();

    return NextResponse.json({
      data: {
        items,
        categories,
        supportItems,
        types,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message } }, { status: 500 });
  }
}