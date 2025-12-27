import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/lib/fetch';
import type { ExpenseMatching, MatchingExpense } from '@/features/matchings/types';
import { matchingKeys } from './keys';

type MatchingResponse = {
  matching: ExpenseMatching & {
    expenses: MatchingExpense[];
  };
};

export const useMatching = (id: string | undefined) => {
  return useQuery({
    queryKey: matchingKeys.detail(id!),
    queryFn: () => fetchApi<MatchingResponse>(`/api/matchings/${id}`),
    select: (data) => data.matching,
    enabled: !!id,
  });
};
