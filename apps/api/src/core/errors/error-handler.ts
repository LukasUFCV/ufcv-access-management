import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

import { AppError } from './app-error.js';

export const errorHandler = (
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
) => {
  if (error instanceof AppError) {
    return response.status(error.statusCode).json({
      message: error.message,
      details: error.details,
    });
  }

  if (error instanceof ZodError) {
    return response.status(400).json({
      message: 'Données invalides.',
      details: error.flatten(),
    });
  }

  return response.status(500).json({
    message: 'Une erreur inattendue est survenue.',
  });
};

