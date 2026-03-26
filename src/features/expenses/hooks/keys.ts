import { createQueryKeys } from '@/lib/queryKeys';

const base = createQueryKeys('expenses');

export const expenseKeys = {
  all: base.all,
  detail: base.detail,
  list: (status?: string) => ['expenses', 'list', ...(status ? [status] : [])] as const,
};
