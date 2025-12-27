import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/fetch';
import { matchingKeys } from './keys';

export const useAddExpenseToMatching = (matchingId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { expense_guid: string; request_amount?: number | null }) =>
      fetchApi(`/api/matchings/${matchingId}/expenses`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: matchingKeys.detail(matchingId) });
    },
  });
};
