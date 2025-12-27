import type { NextApiRequest, NextApiResponse } from 'next';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const;
type HttpMethod = (typeof HTTP_METHODS)[number];
type Handler = (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void;

type Handlers = Partial<Record<HttpMethod, Handler>>;

const isHttpMethod = (method: string | undefined): method is HttpMethod => {
  return typeof method === 'string' && HTTP_METHODS.some((m) => m === method);
};

export const createApiHandler = (handlers: Handlers) => {
  const allowedMethods = HTTP_METHODS.filter((m) => m in handlers);

  return async (req: NextApiRequest, res: NextApiResponse) => {
    const method = req.method;

    if (!isHttpMethod(method)) {
      res.setHeader('Allow', allowedMethods);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const handler = handlers[method];

    if (!handler) {
      res.setHeader('Allow', allowedMethods);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    return handler(req, res);
  };
};
