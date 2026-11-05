import type { ErrorHandler } from 'hono';
import { ZodError } from 'zod';

export const errorHandler: ErrorHandler = (err, c) => {
  console.error('Unhandled error:', err);

  if (err instanceof ZodError) {
    return c.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'প্রদত্ত তথ্য সঠিক নয়',
          details: err.flatten().fieldErrors,
        },
      },
      400
    );
  }

  return c.json(
    {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: err.message || 'সার্ভারে সমস্যা হয়েছে, কিছুক্ষণ পর চেষ্টা করুন',
      },
    },
    500
  );
};

