import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/fetch';
import type { Expense, ExpenseFormData } from '@/features/expenses/types';
import { expenseKeys } from './keys';

type ExpenseResponse = {
  expense: Expense;
};

export const useCreateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ExpenseFormData) =>
      fetchApi<ExpenseResponse>('/api/expenses', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all });
    },
  });
};
