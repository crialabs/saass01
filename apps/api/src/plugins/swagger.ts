import swagger from '@fastify/swagger';
import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import {
  jsonSchemaTransform,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';

import { loadEnv } from '@/config/env';

const swaggerPlugin: FastifyPluginAsync = async (app) => {
  const env = loadEnv();

  await app.withTypeProvider<ZodTypeProvider>().register(swagger, {
    openapi: {
      info: {
        title: 'Coltec API - Sistema de Gestão Educacional',
        description:
          'API completa para gestão de instituições de ensino técnico e superior. ' +
          'Inclui gestão acadêmica (cursos, disciplinas, módulos, aulas), gestão de usuários, ' +
          'sistema de avaliação (quizzes), acompanhamento de progresso, certificados, ' +
          'relatórios analíticos e muito mais. Documentação completa disponível em /docs.',
        version: '1.0.0',
        contact: {
          name: 'Equipe de Desenvolvimento Coltec',
          email: 'dev@coltec.app',
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT',
        },
      },
      servers: [
        {
          url: env.API_URL,
          description: `${env.NODE_ENV.charAt(0).toUpperCase() + env.NODE_ENV.slice(1)} server`,
        },
      ],
      components: {
        securitySchemes: {
          cookieAuth: {
            type: 'apiKey',
            in: 'cookie',
            name: 'better-auth.session_token',
            description:
              'Session cookie automatically set by Better Auth after successful authentication. Used for all authenticated endpoints.',
          },
        },
      },
      security: [
        {
          cookieAuth: [],
        },
      ],
      tags: [
        { name: 'Health', description: 'Health check endpoints' },
        {
          name: 'Auth',
          description:
            'Authentication endpoints powered by Better Auth. ' +
            'Available at /api/auth/*: ' +
            'sign-in/email (POST - login), ' +
            'sign-up/email (POST - register), ' +
            'sign-out (POST - logout), ' +
            'session (GET - current session), ' +
            'forget-password (POST - request reset), ' +
            'reset-password (POST - reset with token), ' +
            'verify-email (GET - verify email), ' +
            'sign-in/social (GET - OAuth login), ' +
            'callback/:provider (GET - OAuth callback). ' +
            'All endpoints manage session cookies automatically.',
        },
        {
          name: 'Users',
          description: 'User management endpoints (Admin only)',
        },
        { name: 'Sessions', description: 'Session management endpoints' },
        { name: 'Password', description: 'Password management endpoints' },
        { name: 'Verification', description: 'Email verification endpoints' },
        { name: 'Accounts', description: 'OAuth account management endpoints' },
        {
          name: 'Uploads',
          description: 'File upload and management endpoints',
        },
        {
          name: 'Courses',
          description:
            'Course management - Create, list, update courses and academic programs',
        },
        {
          name: 'Disciplines',
          description: 'Discipline management - Manage subjects within courses',
        },
        {
          name: 'Modules',
          description:
            'Module management - Organize content within disciplines',
        },
        {
          name: 'Lessons',
          description:
            'Lesson management - Individual learning units with video content',
        },
        {
          name: 'Materials',
          description:
            'Support materials - Documents, slides, and resources for lessons',
        },
        {
          name: 'Quizzes',
          description:
            'Quiz management - Assessments with questions and grading',
        },
        {
          name: 'Enrollments',
          description: 'Student enrollments - Register students in courses',
        },
        {
          name: 'Progress',
          description:
            'Learning progress - Track student progress through lessons',
        },
        {
          name: 'Quiz Results',
          description:
            'Quiz attempts and results - Student assessment submissions',
        },
        {
          name: 'Certificates',
          description:
            'Certificate management - Generate and manage completion certificates',
        },
        {
          name: 'Reports',
          description:
            'Analytics and reports - Course analytics and performance metrics',
        },
        {
          name: 'Dashboard',
          description:
            'Student dashboard - Consolidated view of student progress and activities',
        },
        {
          name: 'Instructors',
          description:
            'Instructor management - Manage instructor assignments and courses',
        },
        {
          name: 'Notifications',
          description:
            'Notification system - Send and manage user notifications',
        },
        {
          name: 'Bulk Operations',
          description: 'Bulk data operations - Mass import of courses and data',
        },
        {
          name: 'Admin',
          description: 'Admin-only system management endpoints',
        },
        {
          name: 'Metrics',
          description: 'System metrics and monitoring endpoints',
        },
      ],
    },
    transform: jsonSchemaTransform,
  });
};

export default fp(swaggerPlugin);
