export const fetchApi = async <T>(url: string, options?: RequestInit): Promise<T> => {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'リクエストに失敗しました' }));
    throw new Error(error.error || 'リクエストに失敗しました');
  }

  return res.json();
};
