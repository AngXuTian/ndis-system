import { rateSetRepository } from '@/repositories/rate-set.repository';

export class RateSetService {
  async findAll() {
    const res = await rateSetRepository.list({ limit: 1000, offset: 0 });
    return res.rows;
  }

  async list(options?: { pageSize?: number; page?: number }) {
    const limit = options?.pageSize ?? 20;
    const offset = ((options?.page ?? 1) - 1) * limit;
    return await rateSetRepository.list({ limit, offset });
  }
}

export const rateSetService = new RateSetService();