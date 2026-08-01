export interface RateSetRecord {
  id: number;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  deactivated_at: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface RateSetCategoryOption {
  id: number;
  category_name: string;
}

export interface RateSetSupportItemOption {
  id: number;
  item_name: string;
}

export interface RateSetTypeOption {
  code: string;
  label: string;
}

export interface RateSetItemRecord {
  id: number;
  category_id: number;
  item_number: string;
  item_name: string;
  unit: string | null;
  category_number: string;
  category_name: string;
  type_code: string | null;
  type_label: string | null;
  start_date: string | null;
  end_date: string | null;
  act: number | null;
  nsw: number | null;
  nt: number | null;
  qld: number | null;
  sa: number | null;
  tas: number | null;
  vic: number | null;
  wa: number | null;
  remote: number | null;
  very_remote: number | null;
  is_quote_required: boolean;
  is_nf2f_support_provision: boolean;
  is_provider_travel: boolean;
  is_short_notice_cancel: boolean;
  is_ndia_requested_reports: boolean;
  is_irregular_sil_supports: boolean;
}

export interface RateSetItemsApiResponse {
  items: RateSetItemRecord[];
  categories: RateSetCategoryOption[];
  supportItems: RateSetSupportItemOption[];
  types: RateSetTypeOption[];
}