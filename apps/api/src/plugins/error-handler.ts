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

export default fp(async (app: FastifyInstance) => {
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
