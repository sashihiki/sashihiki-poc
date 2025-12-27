import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/fetch';
import { matchingKeys } from './keys';

export const useRemoveExpenseFromMatching = (matchingId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (expenseGuid: string) =>
      fetchApi(`/api/matchings/${matchingId}/expenses`, {
        method: 'DELETE',
        body: JSON.stringify({ expense_guid: expenseGuid }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: matchingKeys.detail(matchingId) });
    },
  });
};
