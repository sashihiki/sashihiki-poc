import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/lib/fetch';
import type { ExpenseMatching } from '@/features/matchings/types';
import { matchingKeys } from './keys';

type MatchingsResponse = {
  matchings: ExpenseMatching[];
};

export const useMatchings = () => {
  return useQuery({
    queryKey: matchingKeys.all,
    queryFn: () => fetchApi<MatchingsResponse>('/api/matchings'),
    select: (data) => data.matchings,
  });
};
