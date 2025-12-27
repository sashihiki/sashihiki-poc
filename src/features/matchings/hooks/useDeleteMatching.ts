import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/fetch';
import { matchingKeys } from './keys';

export const useDeleteMatching = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (matchingId: string) =>
      fetchApi(`/api/matchings/${matchingId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: matchingKeys.all });
    },
  });
};
