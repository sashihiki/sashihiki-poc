import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/fetch';
import type { Expense, ExpenseFormData } from '@/features/expenses/types';
import { expenseKeys } from './keys';

type ExpenseResponse = {
  expense: Expense;
};

export const useUpdateExpense = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ExpenseFormData) =>
      fetchApi<ExpenseResponse>(`/api/expenses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all });
      queryClient.invalidateQueries({ queryKey: expenseKeys.detail(id) });
    },
  });
};
