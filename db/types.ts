import type { ColumnType, Generated, Selectable, Insertable, Updateable } from "kysely";

type Timestamp = ColumnType<Date, Date | string, Date | string>;

// ---------- rate_set ----------
export interface RateSetTable {
  id: Generated<number>;
  name: string;
  description: string | null;
  start_date: Timestamp;
  end_date: Timestamp | null;
  created_at: Generated<Timestamp>;
  updated_at: Generated<Timestamp>;
  deactivated_at: Timestamp | null;
  deleted_at: Timestamp | null;
}
export type RateSet = Selectable<RateSetTable>;
export type NewRateSet = Insertable<RateSetTable>;
export type RateSetUpdate = Updateable<RateSetTable>;

// ---------- rate_set_category ----------
export interface RateSetCategoryTable {
  id: Generated<number>;
  rate_set_id: number;
  category_number: string;
  category_name: string;
  sorting: Generated<number>;
  created_at: Generated<Timestamp>;
  updated_at: Generated<Timestamp>;
  deactivated_at: Timestamp | null;
  deleted_at: Timestamp | null;
}
export type RateSetCategory = Selectable<RateSetCategoryTable>;
export type NewRateSetCategory = Insertable<RateSetCategoryTable>;
export type RateSetCategoryUpdate = Updateable<RateSetCategoryTable>;

// ---------- rate_set_support_item ----------
export interface RateSetSupportItemTable {
  id: Generated<number>;
  rate_set_id: number;
  category_id: number;
  item_number: string;
  item_name: string;
  unit: string | null;
  sorting: Generated<number>;
  created_at: Generated<Timestamp>;
  updated_at: Generated<Timestamp>;
  deactivated_at: Timestamp | null;
  deleted_at: Timestamp | null;
}
export type RateSetSupportItem = Selectable<RateSetSupportItemTable>;
export type NewRateSetSupportItem = Insertable<RateSetSupportItemTable>;
export type RateSetSupportItemUpdate = Updateable<RateSetSupportItemTable>;

// ---------- rate_set_support_item_attribute_type ----------
export interface RateSetSupportItemAttributeTypeTable {
  code: string;
  label: string;
  created_at: Generated<Timestamp>;
  deactivated_at: Timestamp | null;
}
export type RateSetSupportItemAttributeType = Selectable<RateSetSupportItemAttributeTypeTable>;

// ---------- rate_set_support_item_attribute ----------
export interface RateSetSupportItemAttributeTable {
  id: Generated<number>;
  support_item_id: number;
  attribute_code: string;
  value: Generated<boolean>;
  created_at: Generated<Timestamp>;
}
export type RateSetSupportItemAttribute = Selectable<RateSetSupportItemAttributeTable>;
export type NewRateSetSupportItemAttribute = Insertable<RateSetSupportItemAttributeTable>;

// ---------- rate_set_support_item_type ----------
export interface RateSetSupportItemTypeTable {
  id: Generated<number>;
  code: string;
  label: string;
  created_at: Generated<Timestamp>;
  deactivated_at: Timestamp | null;
}
export type RateSetSupportItemType = Selectable<RateSetSupportItemTypeTable>;

// ---------- rate_set_support_item_pricing_region ----------
export interface RateSetSupportItemPricingRegionTable {
  code: string;
  label: string;
  full_label: string;
  created_at: Generated<Timestamp>;
  deactivated_at: Timestamp | null;
}
export type RateSetSupportItemPricingRegion = Selectable<RateSetSupportItemPricingRegionTable>;

// ---------- rate_set_support_item_price ----------
export interface RateSetSupportItemPriceTable {
  id: Generated<number>;
  rate_set_id: number;
  support_item_id: number;
  type_id: number | null;
  pricing_region_code: string | null;
  unit_price: string | null; // numeric -> string in pg driver
  start_date: Timestamp;
  end_date: Timestamp | null;
  created_at: Generated<Timestamp>;
  updated_at: Generated<Timestamp>;
}
export type RateSetSupportItemPrice = Selectable<RateSetSupportItemPriceTable>;
export type NewRateSetSupportItemPrice = Insertable<RateSetSupportItemPriceTable>;
export type RateSetSupportItemPriceUpdate = Updateable<RateSetSupportItemPriceTable>;

// ---------- gender ----------
export interface GenderTable {
  id: Generated<number>;
  code: string;
  label: string;
  created_at: Generated<Timestamp>;
  updated_at: Generated<Timestamp>;
  deactivated_at: Timestamp | null;
}
export type Gender = Selectable<GenderTable>;

// ---------- client ----------
export interface ClientTable {
  id: Generated<number>;
  first_name: string;
  last_name: string;
  name_parts: Generated<string[]>;
  gender_id: number;
  dob: Timestamp; // date
  ndis_number: string;
  email: string;
  phone_number: string | null;
  address: string;
  unit_building: string | null;
  pricing_region: string;
  created_at: Generated<Timestamp>;
  updated_at: Generated<Timestamp>;
  deactivated_at: Timestamp | null;
  deleted_at: Timestamp | null;
}
export type Client = Selectable<ClientTable>;
export type NewClient = Insertable<ClientTable>;
export type ClientUpdate = Updateable<ClientTable>;

// ---------- provider ----------
export interface ProviderTable {
  id: Generated<number>;
  abn: string;
  name: string;
  name_parts: Generated<string[]>;
  email: string | null;
  phone_number: string | null;
  address: string | null;
  unit_building: string | null;
  created_at: Generated<Timestamp>;
  updated_at: Generated<Timestamp>;
  deactivated_at: Timestamp | null;
  deleted_at: Timestamp | null;
}
export type Provider = Selectable<ProviderTable>;
export type NewProvider = Insertable<ProviderTable>;
export type ProviderUpdate = Updateable<ProviderTable>;

// ---------- invoice ----------
export interface InvoiceTable {
  id: Generated<number>;
  client_id: number | null;
  provider_id: number | null;
  invoice_number: string | null;
  invoice_date: Timestamp | null; // date
  amount: string | null;
  expected_amount: string | null;
  status: Generated<"drafted" | "completed">;
  created_at: Generated<Timestamp>;
  updated_at: Generated<Timestamp>;
  deleted_at: Timestamp | null;
}
export type Invoice = Selectable<InvoiceTable>;
export type NewInvoice = Insertable<InvoiceTable>;
export type InvoiceUpdate = Updateable<InvoiceTable>;

// ---------- invoice_item ----------
export interface InvoiceItemTable {
  id: Generated<number>;
  invoice_id: number;
  rate_set_id: number | null;
  category_id: number | null;
  support_item_id: number | null;
  start_date: Timestamp | null;
  end_date: Timestamp | null;
  max_rate: string | null;
  unit: string | null;
  input_rate: string | null;
  amount: string | null;
  sort_order: Generated<number>;
  created_at: Generated<Timestamp>;
  updated_at: Generated<Timestamp>;
  deleted_at: Timestamp | null;
}
export type InvoiceItem = Selectable<InvoiceItemTable>;
export type NewInvoiceItem = Insertable<InvoiceItemTable>;
export type InvoiceItemUpdate = Updateable<InvoiceItemTable>;

// ---------- app_user ----------
export interface AppUserTable {
  id: Generated<number>;
  email: string;
  full_name: string;
  is_default: Generated<boolean>;
  created_at: Generated<Timestamp>;
  updated_at: Generated<Timestamp>;
  deactivated_at: Timestamp | null;
  deleted_at: Timestamp | null;
}
export type AppUser = Selectable<AppUserTable>;
export type NewAppUser = Insertable<AppUserTable>;
export type AppUserUpdate = Updateable<AppUserTable>;

// ---------- auth_password ----------
export interface AuthPasswordTable {
  user_id: number;
  password_hash: string;
  password_updated_at: Generated<Timestamp>;
}
export type AuthPassword = Selectable<AuthPasswordTable>;

// ---------- rbac_role ----------
export interface RbacRoleTable {
  id: Generated<number>;
  code: string;
  label: string;
  is_default: Generated<boolean>;
  created_at: Generated<Timestamp>;
  deactivated_at: Timestamp | null;
}
export type RbacRole = Selectable<RbacRoleTable>;

// ---------- rbac_permission ----------
export interface RbacPermissionTable {
  id: Generated<number>;
  code: string;
  label: string;
  created_at: Generated<Timestamp>;
}
export type RbacPermission = Selectable<RbacPermissionTable>;

// ---------- rbac_user_role ----------
export interface RbacUserRoleTable {
  user_id: number;
  role_id: number;
  created_at: Generated<Timestamp>;
}
export type RbacUserRole = Selectable<RbacUserRoleTable>;

// ---------- rbac_user_role_permission ----------
export interface RbacUserRolePermissionTable {
  role_id: number;
  permission_id: number;
  created_at: Generated<Timestamp>;
}
export type RbacUserRolePermission = Selectable<RbacUserRolePermissionTable>;

// ---------- auth_session ----------
export interface AuthSessionTable {
  id: Generated<string>; // uuid
  user_id: number;
  role_id: number;
  token_hash: string;
  user_agent: string | null;
  ip: string | null;
  expires_at: Timestamp;
  revoked_at: Timestamp | null;
  created_at: Generated<Timestamp>;
}
export type AuthSession = Selectable<AuthSessionTable>;
export type NewAuthSession = Insertable<AuthSessionTable>;
export type AuthSessionUpdate = Updateable<AuthSessionTable>;

// ---------- audit_log ----------
export interface AuditLogTable {
  id: Generated<string>;
  actor_user_id: number | null;
  actor_role_id: number | null;
  action: string;
  permission_code: string | null;
  entity: string;
  entity_id: string | null;
  payload: unknown | null;
  changes_diff: unknown | null;
  created_at: Generated<Timestamp>;
}
export type AuditLog = Selectable<AuditLogTable>;
export type NewAuditLog = Insertable<AuditLogTable>;

// ---------- invoice_upload_batch ----------
export interface InvoiceUploadBatchTable {
  id: Generated<string>;
  uploaded_by: number;
  status: Generated<string>;
  file_count: number;
  total_size: string;
  error_message: string | null;
  created_at: Generated<Timestamp>;
  updated_at: Generated<Timestamp>;
}
export type InvoiceUploadBatch = Selectable<InvoiceUploadBatchTable>;
export type NewInvoiceUploadBatch = Insertable<InvoiceUploadBatchTable>;

// ---------- invoice_upload_file ----------
export interface InvoiceUploadFileTable {
  id: Generated<string>;
  batch_id: string;
  original_name: string;
  object_key: string;
  content_type: string;
  size: string;
  etag: string;
  processing_status: Generated<string>;
  attempt_count: Generated<number>;
  error_message: string | null;
  warnings: Generated<unknown>;
  extraction_result: unknown | null;
  invoice_id: number | null;
  ai_provider: string | null;
  model: string | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  total_tokens: number | null;
  processing_started_at: Timestamp | null;
  processing_completed_at: Timestamp | null;
  created_at: Generated<Timestamp>;
  updated_at: Generated<Timestamp>;
}
export type InvoiceUploadFile = Selectable<InvoiceUploadFileTable>;
export type NewInvoiceUploadFile = Insertable<InvoiceUploadFileTable>;
export type InvoiceUploadFileUpdate = Updateable<InvoiceUploadFileTable>;

// ---------- DB ----------
export interface DB {
  rate_set: RateSetTable;
  rate_set_category: RateSetCategoryTable;
  rate_set_support_item: RateSetSupportItemTable;
  rate_set_support_item_attribute_type: RateSetSupportItemAttributeTypeTable;
  rate_set_support_item_attribute: RateSetSupportItemAttributeTable;
  rate_set_support_item_type: RateSetSupportItemTypeTable;
  rate_set_support_item_pricing_region: RateSetSupportItemPricingRegionTable;
  rate_set_support_item_price: RateSetSupportItemPriceTable;
  gender: GenderTable;
  client: ClientTable;
  provider: ProviderTable;
  invoice: InvoiceTable;
  invoice_item: InvoiceItemTable;
  app_user: AppUserTable;
  auth_password: AuthPasswordTable;
  rbac_role: RbacRoleTable;
  rbac_permission: RbacPermissionTable;
  rbac_user_role: RbacUserRoleTable;
  rbac_user_role_permission: RbacUserRolePermissionTable;
  auth_session: AuthSessionTable;
  audit_log: AuditLogTable;
  invoice_upload_batch: InvoiceUploadBatchTable;
  invoice_upload_file: InvoiceUploadFileTable;
}
