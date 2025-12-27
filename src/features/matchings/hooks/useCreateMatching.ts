import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/fetch';
import type {
  ExpenseMatching,
  MatchingExpense,
  MatchingFormData,
} from '@/features/matchings/types';
import { matchingKeys } from './keys';

type MatchingResponse = {
  matching: ExpenseMatching & {
    expenses: MatchingExpense[];
  };
};

export const useCreateMatching = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: MatchingFormData) =>
      fetchApi<MatchingResponse>('/api/matchings', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: matchingKeys.all });
    },
  });
};
