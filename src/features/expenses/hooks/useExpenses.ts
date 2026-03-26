import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/lib/fetch';
import type { Expense, ExpenseStatus } from '@/features/expenses/types';
import { expenseKeys } from './keys';

type ExpensesResponse = {
  expenses: Expense[];
};

export const useExpenses = (status?: ExpenseStatus) => {
  const params = status ? `?status=${status}` : '';
  return useQuery({
    queryKey: expenseKeys.list(status),
    queryFn: () => fetchApi<ExpensesResponse>(`/api/expenses${params}`),
    select: (data) => data.expenses,
  });
};
