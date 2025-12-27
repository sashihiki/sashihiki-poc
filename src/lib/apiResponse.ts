export type ApiResponse<T> = {
  [K in string]: T;
};

export type ApiListResponse<K extends string, T> = {
  [P in K]: T[];
};
