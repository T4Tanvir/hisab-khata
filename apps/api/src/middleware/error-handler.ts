import type { ErrorHandler } from 'hono';
import { ZodError } from 'zod';
import { AppError } from '../lib/errors';

export const errorHandler: ErrorHandler = (err, c) => {
  if (err instanceof AppError) {
    return c.json({ error: { code: err.code, message: err.message } }, err.status);
  }

  if (err instanceof ZodError) {
    return c.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: err.errors[0]?.message || 'প্রদত্ত তথ্য সঠিক নয়',
          details: err.flatten().fieldErrors,
        },
      },
      400
    );
  }

  // Unexpected error: log details on the server, never leak them to the client
  console.error('Unhandled error:', err);
  return c.json(
    {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'সার্ভারে সমস্যা হয়েছে, কিছুক্ষণ পর চেষ্টা করুন',
      },
    },
    500
  );
};
