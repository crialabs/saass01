import { AppError } from '@repo/packages-utils/errors';
import type {
  FastifyError,
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from 'fastify';
import fp from 'fastify-plugin';

import { loadEnv } from '@/config/env';

const env = loadEnv();

/**
 * Fastify plugin that registers the global error handler.
 *
 * Error handling strategy:
 * - Domain errors extending {@link AppError}:
 *   - Uses the error's `statusCode` for the HTTP status.
 *   - Responds with `{ error: { message, code, details? } }`.
 * - Validation errors emitted by Fastify/Zod (`error.validation` present):
 *   - Responds with HTTP 400 and `{ error: { message: "Validation failed", code: "VALIDATION_ERROR", details } }`.
 * - All other errors:
 *   - Uses `error.statusCode` when available, otherwise 500.
 *   - In production and for 500 errors, replaces the message with a generic "Internal server error".
 *   - Responds with `{ error: { message, code: "INTERNAL_ERROR" } }`.
 *
 * All errors are logged via `request.log.error` with request context, and implementation details are
export default fp(async (app: FastifyInstance) => {
  const env = loadEnv();
  app.setErrorHandler(
    (
      error: FastifyError,
      request: FastifyRequest,
      reply: FastifyReply
    ): void => {
      request.log.error(
        {
          err: error,
          reqId: request.id,
          url: request.url,
          method: request.method,
        },
        'Request error'
      );

      if (error instanceof AppError) {
        void reply.status(error.statusCode).send({
          error: {
            message: error.message,
            code: error.code,
            ...(error.details && { details: error.details }),
          },
        });
        return;
      }

      if (error.validation) {
        void reply.status(400).send({
          error: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: error.validation,
          },
        });
        return;
      }

      const isProduction = env.NODE_ENV === 'production';
      const statusCode = error.statusCode || 500;

      void reply.status(statusCode).send({
        error: {
          message:
            isProduction && statusCode === 500
              ? 'Internal server error'
              : error.message || 'An error occurred',
          code: 'INTERNAL_ERROR',
        },
      });
    }
  );
});
