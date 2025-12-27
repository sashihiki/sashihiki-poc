import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/lib/fetch';
import type { Expense } from '@/features/expenses/types';
import { expenseKeys } from './keys';

type ExpenseResponse = {
  expense: Expense;
};

export const useExpense = (id: string | undefined) => {
  return useQuery({
    queryKey: expenseKeys.detail(id!),
    queryFn: () => fetchApi<ExpenseResponse>(`/api/expenses/${id}`),
    select: (data) => data.expense,
    enabled: !!id,
  });
};
