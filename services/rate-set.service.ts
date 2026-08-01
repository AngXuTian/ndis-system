import { db } from '@/db';

export class RateSetService {
  async findAll() {
    return await db
      .selectFrom('rate_set')
      .selectAll()
      .where('deleted_at', 'is', null)
      .orderBy('id', 'desc')
      .execute();
  }

  async list() {
    return await this.findAll();
  }
}

export const rateSetService = new RateSetService();