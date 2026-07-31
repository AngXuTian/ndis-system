import { z } from 'zod';

export const clientSchema = z.object({
  first_name: z.string().trim().min(1, 'First name is required'),
  last_name: z.string().trim().min(1, 'Last name is required'),
  gender_id: z.number({ error: 'Gender is required' }),
  dob: z.string().min(1, 'Date of birth is required'),
  ndis_number: z.string().trim().min(1, 'NDIS number is required'),
  email: z.string().trim().email('Invalid email address'),
  phone_number: z.string().trim().optional().nullable(),
  address: z.string().trim().min(1, 'Address is required'),
  unit_building: z.string().trim().optional().nullable(),
  pricing_region: z.string().trim().min(1, 'Pricing region is required'),
  is_active: z.boolean().default(true),
});

export type ClientInput = z.infer<typeof clientSchema>;