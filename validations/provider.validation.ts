import { z } from 'zod';

export const providerSchema = z.object({
  abn: z
    .string()
    .trim()
    .min(1, 'ABN is required')
    .regex(/^\d{1,11}$/, 'ABN must be digits only and maximum 11 digits'),

  name: z
    .string()
    .trim()
    .min(1, 'Provider name is required'),

  email: z
    .string()
    .trim()
    .email('Invalid email address'),

  phone_number: z
    .preprocess(
      (val) => (val === '' || val === undefined ? null : val),
      z.string().trim().nullable()
    )
    .refine(
      (val) => val === null || /^\d{3,16}$/.test(val),
      'Phone number must contain 3 to 16 digits'
    ),

  address: z
    .string()
    .trim()
    .min(1, 'Address is required'),

  unit_building: z
    .preprocess(
      (val) => (val === '' || val === undefined ? null : val),
      z.string().trim().nullable()
    ),

  is_active: z.boolean().default(true),
});

export type ProviderInput = z.infer<typeof providerSchema>;