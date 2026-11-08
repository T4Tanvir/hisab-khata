import type { MiddlewareHandler } from 'hono';
import type { ZodSchema } from 'zod';

export const validateBody = <T extends ZodSchema>(schema: T): MiddlewareHandler => {
  return async (c, next) => {
    let body;
    try {
      body = await c.req.json();
    } catch {
      return c.json(
        {
          error: {
            code: 'INVALID_JSON',
            message: 'অনুরোধের JSON সঠিক নয়',
          },
        },
        400
      );
    }

    const result = schema.safeParse(body);
    if (!result.success) {
      return c.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: result.error.errors[0]?.message || 'প্রদত্ত তথ্য সঠিক নয়',
            details: result.error.flatten().fieldErrors,
          },
        },
        400
      );
    }

    c.set('validatedBody', result.data);
    await next();
  };
};
