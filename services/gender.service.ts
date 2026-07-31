import { genderRepository } from '@/repositories/gender.repository';
import { genderSchema, GenderInput } from '@/validations/gender.validation';
import { Gender } from '@/db/types';
import { Selectable } from 'kysely';

export class GenderService {
  async getAllGenders(): Promise<Selectable<Gender>[]> {
    return await genderRepository.findAll();
  }

  async createGender(rawInput: unknown): Promise<Selectable<Gender>> {
    const validated: GenderInput = genderSchema.parse(rawInput);
    const { is_active, ...rest } = validated;

    return await genderRepository.create({
      ...rest,
      deactivated_at: is_active ? null : new Date().toISOString(),
    });
  }

  async updateGender(id: number, rawInput: unknown): Promise<Selectable<Gender> | undefined> {
    const validated: GenderInput = genderSchema.parse(rawInput);
    const { is_active, ...rest } = validated;

    return await genderRepository.update(id, {
      ...rest,
      deactivated_at: is_active ? null : new Date().toISOString(),
    });
  }

  async deleteGender(id: number): Promise<Selectable<Gender> | undefined> {
    return await genderRepository.softDelete(id);
  }
}

export const genderService = new GenderService();