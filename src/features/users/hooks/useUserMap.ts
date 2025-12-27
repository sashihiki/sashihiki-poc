import { useMemo } from 'react';
import { useUsers } from './useUsers';

export const useUserMap = () => {
  const { data: users, isLoading, error } = useUsers();

  const userMap = useMemo(() => {
    const map = new Map<string, string>();
    users?.forEach((u) => map.set(u.guid, u.name));
    return map;
  }, [users]);

  return { userMap, users, isLoading, error };
};
