import type { RequestHandler } from 'express';
import { ZodTypeAny } from 'zod';

export const validateRequest = (schema: {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}): RequestHandler => {
  return (request, _response, next) => {
    if (schema.body) {
      request.body = schema.body.parse(request.body);
    }

    if (schema.query) {
      request.query = schema.query.parse(request.query);
    }

    if (schema.params) {
      request.params = schema.params.parse(request.params);
    }

    next();
  };
};

