import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/lib/fetch';
import { createQueryKeys } from '@/lib/queryKeys';
import type { User } from '@/features/users/types';

type UsersResponse = {
  users: User[];
};

export const userKeys = createQueryKeys('users');

export const useUsers = () => {
  return useQuery({
    queryKey: userKeys.all,
    queryFn: () => fetchApi<UsersResponse>('/api/users'),
    select: (data) => data.users,
  });
};
