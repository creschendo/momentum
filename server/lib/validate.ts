import type { ZodSchema } from 'zod';
import { ZodError } from 'zod';
import type { Response } from 'express';

function formatZodError(err: ZodError): string {
  return err.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
}

export function validate<T>(schema: ZodSchema<T>, data: unknown, res: Response): T | null {
  const result = schema.safeParse(data);
  if (!result.success) {
    res.status(400).json({ error: formatZodError(result.error) });
    return null;
  }
  return result.data;
}
