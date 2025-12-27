export const createQueryKeys = <T extends string>(name: T) => ({
  all: [name] as const,
  detail: (id: string) => [name, id] as const,
});
