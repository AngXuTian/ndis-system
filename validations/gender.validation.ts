import { z } from 'zod';

export const genderSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'Code is required')
    .transform((val) => val.toUpperCase()),
  label: z
    .string()
    .trim()
    .min(1, 'Label is required'),
  is_active: z.boolean().default(true),
});

export type GenderInput = z.infer<typeof genderSchema>;