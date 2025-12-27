export const getErrorMessage = (error: unknown, fallback = 'エラーが発生しました'): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return fallback;
};
