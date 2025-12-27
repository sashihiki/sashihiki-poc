import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/lib/fetch';
import type { Expense } from '@/features/expenses/types';
import { expenseKeys } from './keys';

type ExpensesResponse = {
  expenses: Expense[];
};

export const useExpenses = () => {
  return useQuery({
    queryKey: expenseKeys.all,
    queryFn: () => fetchApi<ExpensesResponse>('/api/expenses'),
    select: (data) => data.expenses,
  });
};
