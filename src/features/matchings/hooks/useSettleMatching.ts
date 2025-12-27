import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/fetch';
import { matchingKeys } from './keys';

export const useSettleMatching = (matchingId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => fetchApi(`/api/matchings/${matchingId}/settle`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: matchingKeys.all });
      queryClient.invalidateQueries({ queryKey: matchingKeys.detail(matchingId) });
    },
  });
};
