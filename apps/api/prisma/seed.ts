import 'dotenv-flow/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin } from 'better-auth/plugins';
import { createAccessControl } from 'better-auth/plugins/access';
import { adminAc, defaultStatements } from 'better-auth/plugins/admin/access';
import { Pool } from 'pg';

import {
  CertificateStatus,
  CertificateType,
  CourseGrade,
  CourseLevel,
  CourseModality,
  CourseStatus,
  EnrollmentStatus,
  LessonType,
  MaterialType,
  PrismaClient,
  ProgressStatus,
  QuestionType,
  Role,
} from '../src/generated/client/client.js';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const ac = createAccessControl(defaultStatements);

const adminRole = ac.newRole({
  ...adminAc.statements,
});

const superAdminRole = ac.newRole({
  ...adminAc.statements,
});

const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  baseURL: 'http://localhost:8080',
  secret: 'temp-seed-secret',
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    admin({
      ac,
      roles: {
        admin: adminRole,
        super_admin: superAdminRole,
      },
      defaultRole: 'user',
    }),
  ],
});

async function main() {
  console.log('🌱 Seeding database...');

  if (process.env.NODE_ENV === 'production') {
    console.error('❌ SAFETY ERROR: Seed script is blocked in production!');
    process.exit(1);
  }

  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);

  console.log('🗑️  Cleaning existing data...');
  await prisma.certificate.deleteMany();
  await prisma.quizAnswer.deleteMany();
  await prisma.quizAttempt.deleteMany();
  await prisma.progress.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.questionOption.deleteMany();
  await prisma.question.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.material.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.module.deleteMany();
  await prisma.discipline.deleteMany();
  await prisma.course.deleteMany();
  await prisma.upload.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  console.log('👥 Creating users...');
  const usersData = [
    {
      email: 'admin@example.com',
      name: 'Super Admin',
      password: 'Admin@123456',
      role: Role.super_admin,
      emailVerified: true,
    },
    {
      email: 'alice@example.com',
      name: 'Alice Johnson',
      password: 'Alice@123456',
      role: Role.user,
      emailVerified: true,
    },
    {
      email: 'bob@example.com',
      name: 'Bob Smith',
      password: 'Bob@123456',
      role: Role.admin,
      emailVerified: true,
    },
    {
      email: 'charlie@example.com',
      name: 'Charlie Davis',
      password: 'Charlie@123456',
      role: Role.user,
      emailVerified: true,
    },
    {
      email: 'diana@example.com',
      name: 'Diana Martinez',
      password: 'Diana@123456',
      role: Role.user,
      emailVerified: true,
    },
    {
      email: 'professor@example.com',
      name: 'Prof. Carlos Silva',
      password: 'Professor@123456',
      role: Role.admin,
      emailVerified: true,
    },
  ];

  const createdUsers: Record<string, string> = {};

  for (const userData of usersData) {
    const response = await auth.api.signUpEmail({
      body: {
        email: userData.email,
        password: userData.password,
        name: userData.name,
      },
    });

    if (!response || !response.user) {
      console.error(`❌ Failed to create user: ${userData.email}`);
      continue;
    }

    await prisma.user.update({
      where: { id: response.user.id },
      data: {
        role: userData.role,
        emailVerified: userData.emailVerified,
      },
    });

    createdUsers[userData.email] = response.user.id;
    console.log(`✅ Created user: ${userData.email} (${userData.role})`);
  }

  console.log('📚 Creating courses...');
  const courses = await Promise.all([
    prisma.course.create({
      data: {
        codigo: 'ADS001',
        nome: 'Análise e Desenvolvimento de Sistemas',
        descricao:
          'Curso superior de tecnologia em Análise e Desenvolvimento de Sistemas com foco em programação, banco de dados e desenvolvimento web.',
        descricaoCurta: 'Tecnologia em Análise e Desenvolvimento de Sistemas',
        cargaHorariaTotal: 2400,
        cargaHorariaMinima: 2000,
        nivel: CourseLevel.graduacao,
        grau: CourseGrade.tecnologo,
        duracaoSemestres: 5,
        modality: CourseModality.ead,
        status: CourseStatus.publicado,
        ativo: true,
        dataInicioVigencia: new Date('2024-01-01'),
      },
    }),
    prisma.course.create({
      data: {
        codigo: 'ENG001',
        nome: 'Engenharia de Software',
        descricao:
          'Bacharelado em Engenharia de Software com ênfase em metodologias ágeis, arquitetura de software e gestão de projetos.',
        descricaoCurta: 'Bacharelado em Engenharia de Software',
        cargaHorariaTotal: 3600,
        cargaHorariaMinima: 3200,
        nivel: CourseLevel.graduacao,
        grau: CourseGrade.bacharelado,
        duracaoSemestres: 8,
        modality: CourseModality.presencial,
        status: CourseStatus.publicado,
        ativo: true,
        dataInicioVigencia: new Date('2024-01-01'),
      },
    }),
    prisma.course.create({
      data: {
        codigo: 'TEC001',
        nome: 'Técnico em Informática',
        descricao:
          'Curso técnico com foco em manutenção de computadores, redes e programação básica.',
        descricaoCurta: 'Técnico em Informática',
        cargaHorariaTotal: 1200,
        cargaHorariaMinima: 1000,
        nivel: CourseLevel.tecnico,
        duracaoSemestres: 3,
        modality: CourseModality.hibrido,
        status: CourseStatus.publicado,
        ativo: true,
        dataInicioVigencia: new Date('2024-02-01'),
      },
    }),
    prisma.course.create({
      data: {
        codigo: 'MBA001',
        nome: 'MBA em Gestão de Projetos de TI',
        descricao:
          'Pós-graduação em Gestão de Projetos de TI com certificação PMP.',
        descricaoCurta: 'MBA em Gestão de Projetos de TI',
        cargaHorariaTotal: 480,
        cargaHorariaMinima: 400,
        nivel: CourseLevel.pos_graduacao,
        duracaoSemestres: 2,
        modality: CourseModality.ead,
        status: CourseStatus.publicado,
        ativo: true,
        dataInicioVigencia: new Date('2024-03-01'),
      },
    }),
  ]);

  console.log(`✅ Created ${courses.length} courses`);

  console.log('📖 Creating disciplines...');
  type DisciplineType = Awaited<ReturnType<typeof prisma.discipline.create>>;
  const disciplines: DisciplineType[] = [];

  for (const course of courses) {
    if (course.codigo === 'ADS001') {
      const courseDisciplines = await Promise.all([
        prisma.discipline.create({
          data: {
            courseId: course.id,
            codigo: 'ADS001-ALG',
            nome: 'Algoritmos e Programação',
            ementa:
              'Conceitos fundamentais de algoritmos, estruturas de dados básicas, lógica de programação e resolução de problemas.',
            cargaHorariaTeorica: 40,
            cargaHorariaPratica: 40,
            cargaHorariaTotal: 80,
            periodo: 1,
            obrigatoria: true,
            objetivos: [
              'Desenvolver raciocínio lógico para resolução de problemas',
              'Aprender estruturas de dados básicas',
              'Implementar algoritmos em linguagem de programação',
            ],
            competencias: [
              'Capacidade de análise e resolução de problemas',
              'Conhecimento de estruturas de dados',
              'Habilidade de programação',
            ],
            prerequisitos: [],
            bibliografiaBasica: [
              'CORMEN, T. H. et al. Algoritmos: teoria e prática. 3. ed. Rio de Janeiro: Elsevier, 2012.',
            ],
          },
        }),
        prisma.discipline.create({
          data: {
            courseId: course.id,
            codigo: 'ADS001-BD',
            nome: 'Banco de Dados',
            ementa:
              'Modelagem de dados, SQL, normalização, transações e gerenciamento de banco de dados relacionais.',
            cargaHorariaTeorica: 30,
            cargaHorariaPratica: 50,
            cargaHorariaTotal: 80,
            periodo: 2,
            obrigatoria: true,
            objetivos: [
              'Modelar bancos de dados relacionais',
              'Dominar linguagem SQL',
              'Aplicar técnicas de normalização',
            ],
            competencias: [
              'Modelagem de dados',
              'SQL avançado',
              'Otimização de consultas',
            ],
            prerequisitos: ['ADS001-ALG'],
            bibliografiaBasica: [
              'DATE, C. J. Introdução a sistemas de bancos de dados. 8. ed. Rio de Janeiro: Campus, 2004.',
            ],
          },
        }),
        prisma.discipline.create({
          data: {
            courseId: course.id,
            codigo: 'ADS001-WEB',
            nome: 'Desenvolvimento Web',
            ementa:
              'HTML, CSS, JavaScript, frameworks frontend e backend, APIs REST e desenvolvimento full-stack.',
            cargaHorariaTeorica: 40,
            cargaHorariaPratica: 80,
            cargaHorariaTotal: 120,
            periodo: 3,
            obrigatoria: true,
            objetivos: [
              'Desenvolver aplicações web modernas',
              'Dominar frameworks frontend e backend',
              'Criar APIs RESTful',
            ],
            competencias: [
              'Desenvolvimento frontend',
              'Desenvolvimento backend',
              'Integração de sistemas',
            ],
            prerequisitos: ['ADS001-ALG', 'ADS001-BD'],
            bibliografiaBasica: [
              'FLANAGAN, D. JavaScript: o guia definitivo. 6. ed. Porto Alegre: Bookman, 2013.',
            ],
          },
        }),
      ]);
      disciplines.push(...courseDisciplines);
    } else if (course.codigo === 'ENG001') {
      const courseDisciplines = await Promise.all([
        prisma.discipline.create({
          data: {
            courseId: course.id,
            codigo: 'ENG001-ARQ',
            nome: 'Arquitetura de Software',
            ementa:
              'Padrões arquiteturais, design patterns, microserviços e arquitetura de sistemas distribuídos.',
            cargaHorariaTeorica: 60,
            cargaHorariaPratica: 60,
            cargaHorariaTotal: 120,
            periodo: 5,
            obrigatoria: true,
            objetivos: [
              'Compreender padrões arquiteturais',
              'Aplicar design patterns',
              'Projetar sistemas escaláveis',
            ],
            competencias: [
              'Arquitetura de software',
              'Design patterns',
              'Sistemas distribuídos',
            ],
            prerequisitos: [],
            bibliografiaBasica: [
              'FOWLER, M. Patterns of Enterprise Application Architecture. Boston: Addison-Wesley, 2002.',
            ],
          },
        }),
      ]);
      disciplines.push(...courseDisciplines);
    }
  }

  console.log(`✅ Created ${disciplines.length} disciplines`);

  console.log('📦 Creating modules and lessons...');
  const lessons: Array<{ id: string; moduleId: string; disciplineId: string }> =
    [];

  for (const discipline of disciplines) {
    const modules = await Promise.all([
      prisma.module.create({
        data: {
          disciplineId: discipline.id,
          titulo: 'Introdução e Fundamentos',
          descricao:
            'Módulo introdutório com conceitos fundamentais da disciplina.',
          ordem: 1,
          cargaHorariaEstimada: 20,
          objetivosAprendizagem: [
            'Compreender os conceitos básicos',
            'Identificar os principais componentes',
            'Aplicar conhecimentos iniciais',
          ],
        },
      }),
      prisma.module.create({
        data: {
          disciplineId: discipline.id,
          titulo: 'Conceitos Avançados',
          descricao: 'Módulo com tópicos avançados e práticas profissionais.',
          ordem: 2,
          cargaHorariaEstimada: 30,
          objetivosAprendizagem: [
            'Dominar conceitos avançados',
            'Aplicar em cenários reais',
            'Desenvolver projetos práticos',
          ],
        },
      }),
    ]);

    for (const courseModule of modules) {
      const moduleLessons = await Promise.all([
        prisma.lesson.create({
          data: {
            moduleId: courseModule.id,
            titulo: `Aula 1 - ${courseModule.titulo}`,
            descricao: 'Primeira aula do módulo com introdução aos conceitos.',
            tipo: LessonType.video_gravado,
            ordem: 1,
            videoUrl: 'https://example.com/video1.mp4',
            duracaoMinutos: 45,
            obrigatoria: true,
            liberada: true,
            permiteDownload: false,
            percentualConclusaoMinimo: 100,
            marcaDaguaAtiva: false,
            transcricaoDisponivel: true,
            legendasDisponiveis: ['pt-BR', 'en'],
            resolucoesDisponiveis: ['1080p', '720p', '480p'],
          },
        }),
        prisma.lesson.create({
          data: {
            moduleId: courseModule.id,
            titulo: `Aula 2 - ${courseModule.titulo}`,
            descricao: 'Segunda aula com exercícios práticos.',
            tipo: LessonType.video_gravado,
            ordem: 2,
            videoUrl: 'https://example.com/video2.mp4',
            duracaoMinutos: 50,
            obrigatoria: true,
            liberada: true,
            permiteDownload: true,
            percentualConclusaoMinimo: 100,
            marcaDaguaAtiva: true,
            transcricaoDisponivel: true,
            legendasDisponiveis: ['pt-BR'],
            resolucoesDisponiveis: ['1080p', '720p'],
          },
        }),
        prisma.lesson.create({
          data: {
            moduleId: courseModule.id,
            titulo: `Quiz - ${courseModule.titulo}`,
            descricao: 'Avaliação de conhecimentos do módulo.',
            tipo: LessonType.quiz,
            ordem: 3,
            duracaoMinutos: 30,
            obrigatoria: true,
            liberada: true,
            permiteDownload: false,
            percentualConclusaoMinimo: 70,
            marcaDaguaAtiva: false,
            transcricaoDisponivel: false,
            legendasDisponiveis: [],
            resolucoesDisponiveis: [],
          },
        }),
      ]);

      lessons.push(
        ...moduleLessons.map((l) => ({
          id: l.id,
          moduleId: courseModule.id,
          disciplineId: discipline.id,
        }))
      );
    }
  }

  console.log(`✅ Created modules and ${lessons.length} lessons`);

  console.log('📎 Creating materials...');
  let materialCount = 0;

  for (const lesson of lessons) {
    if (lesson.id) {
      const lessonRecord = await prisma.lesson.findUnique({
        where: { id: lesson.id },
      });
      if (lessonRecord && lessonRecord.tipo !== LessonType.quiz) {
        await Promise.all([
          prisma.material.create({
            data: {
              lessonId: lesson.id,
              titulo: 'Slides da Aula',
              tipo: MaterialType.slides,
              descricao:
                'Apresentação em PowerPoint com os principais tópicos.',
              arquivoPath: '/materials/slides-aula.pdf',
              tamanhoBytes: 2048000,
              formato: 'pdf',
              obrigatorio: true,
              ordem: 1,
            },
          }),
          prisma.material.create({
            data: {
              lessonId: lesson.id,
              titulo: 'Material Complementar',
              tipo: MaterialType.pdf,
              descricao: 'Artigo científico relacionado ao tema.',
              url: 'https://example.com/article.pdf',
              tamanhoBytes: 1024000,
              formato: 'pdf',
              obrigatorio: false,
              ordem: 2,
            },
          }),
        ]);
        materialCount += 2;
      }
    }
  }

  console.log(`✅ Created ${materialCount} materials`);

  console.log('❓ Creating quizzes and questions...');
  let quizCount = 0;
  let questionCount = 0;

  for (const lesson of lessons) {
    if (lesson.id) {
      const lessonRecord = await prisma.lesson.findUnique({
        where: { id: lesson.id },
      });
      if (lessonRecord && lessonRecord.tipo === LessonType.quiz) {
        const quiz = await prisma.quiz.create({
          data: {
            lessonId: lesson.id,
            titulo: 'Avaliação de Conhecimentos',
            descricao: 'Quiz para avaliar o aprendizado do módulo.',
            instrucoes: 'Responda todas as questões. Você tem 3 tentativas.',
            tempoLimiteMinutos: 30,
            notaMinimaAprovacao: 7.0,
            tentativasMaximas: 3,
            ordemAleatoria: true,
            mostrarRespostaImediata: false,
            mostrarGabaritoFinal: true,
            permitirRevisao: true,
            pontuacaoTotal: 10,
          },
        });

        const questions = await Promise.all([
          prisma.question.create({
            data: {
              quizId: quiz.id,
              enunciado:
                'Qual é a principal vantagem de usar banco de dados relacionais?',
              tipo: QuestionType.multipla_escolha,
              ordem: 1,
              pontos: 2,
              obrigatoria: true,
              explicacao:
                'Bancos relacionais garantem integridade referencial e consistência dos dados.',
            },
          }),
          prisma.question.create({
            data: {
              quizId: quiz.id,
              enunciado: 'SQL é uma linguagem declarativa.',
              tipo: QuestionType.verdadeiro_falso,
              ordem: 2,
              pontos: 1,
              obrigatoria: true,
              explicacao:
                'SQL é uma linguagem declarativa, você descreve o que quer, não como fazer.',
            },
          }),
          prisma.question.create({
            data: {
              quizId: quiz.id,
              enunciado:
                'Explique o conceito de normalização de banco de dados.',
              tipo: QuestionType.dissertativa,
              ordem: 3,
              pontos: 3,
              obrigatoria: true,
              explicacao:
                'Normalização é o processo de organizar dados para reduzir redundância.',
            },
          }),
        ]);

        for (const question of questions) {
          if (question.tipo === QuestionType.multipla_escolha) {
            await Promise.all([
              prisma.questionOption.create({
                data: {
                  questionId: question.id,
                  texto: 'Facilita a integridade dos dados',
                  correta: true,
                  feedback:
                    'Correto! Bancos relacionais garantem integridade referencial.',
                  ordem: 1,
                },
              }),
              prisma.questionOption.create({
                data: {
                  questionId: question.id,
                  texto: 'É mais rápido que NoSQL',
                  correta: false,
                  feedback: 'Não necessariamente. Depende do caso de uso.',
                  ordem: 2,
                },
              }),
              prisma.questionOption.create({
                data: {
                  questionId: question.id,
                  texto: 'Não precisa de índices',
                  correta: false,
                  feedback: 'Índices são importantes para performance.',
                  ordem: 3,
                },
              }),
              prisma.questionOption.create({
                data: {
                  questionId: question.id,
                  texto: 'É sempre gratuito',
                  correta: false,
                  feedback: 'Existem soluções pagas e gratuitas.',
                  ordem: 4,
                },
              }),
            ]);
          } else if (question.tipo === QuestionType.verdadeiro_falso) {
            await Promise.all([
              prisma.questionOption.create({
                data: {
                  questionId: question.id,
                  texto: 'Verdadeiro',
                  correta: true,
                  feedback: 'Correto! SQL é declarativa.',
                  ordem: 1,
                },
              }),
              prisma.questionOption.create({
                data: {
                  questionId: question.id,
                  texto: 'Falso',
                  correta: false,
                  feedback: 'SQL é uma linguagem declarativa.',
                  ordem: 2,
                },
              }),
            ]);
          }
          questionCount++;
        }

        quizCount++;
      }
    }
  }

  console.log(
    `✅ Created ${quizCount} quizzes with ${questionCount} questions`
  );

  console.log('📝 Creating enrollments...');
  const studentIds = [
    createdUsers['alice@example.com'],
    createdUsers['charlie@example.com'],
    createdUsers['diana@example.com'],
  ].filter(Boolean) as string[];

  type EnrollmentType = Awaited<ReturnType<typeof prisma.enrollment.create>>;
  const enrollments: EnrollmentType[] = [];
  for (const course of courses.slice(0, 2)) {
    for (const studentId of studentIds) {
      const enrollment = await prisma.enrollment.create({
        data: {
          studentId,
          courseId: course.id,
          enrollmentDate: new Date(),
          startDate: new Date(),
          expectedCompletionDate: new Date(
            new Date().setMonth(
              new Date().getMonth() + course.duracaoSemestres * 6
            )
          ),
          status: EnrollmentStatus.ativo,
          paymentMethod: 'cartao_credito',
          installments: course.duracaoSemestres,
          scholarshipPercentage:
            studentId === createdUsers['diana@example.com'] ? 50 : 0,
          contactEmail: Object.keys(createdUsers).find(
            (key) => createdUsers[key] === studentId
          ),
        },
      });
      enrollments.push(enrollment);
    }
  }

  console.log(`✅ Created ${enrollments.length} enrollments`);

  console.log('📊 Creating progress records...');
  let progressCount = 0;

  for (const enrollment of enrollments.slice(0, 2)) {
    const course = courses.find((c) => c.id === enrollment.courseId);
    if (!course) continue;

    const courseDisciplines = disciplines.filter(
      (d) => d.courseId === course.id
    );
    const courseLessons = lessons.filter((l) =>
      courseDisciplines.some((d) => d.id === l.disciplineId)
    );

    for (const lesson of courseLessons.slice(0, 3)) {
      const progress = await prisma.progress.create({
        data: {
          studentId: enrollment.studentId,
          lessonId: lesson.id,
          moduleId: lesson.moduleId,
          disciplineId: lesson.disciplineId,
          courseId: enrollment.courseId,
          status:
            Math.random() > 0.5
              ? ProgressStatus.concluida
              : ProgressStatus.em_progresso,
          watchedMinutes: Math.floor(Math.random() * 45) + 10,
          totalMinutes: 45,
          completionPercentage:
            Math.random() > 0.5 ? 100 : Math.floor(Math.random() * 80) + 20,
          viewedAt: new Date(
            Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
          ),
          completedAt:
            Math.random() > 0.5
              ? new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000)
              : null,
          score: Math.random() > 0.5 ? Math.random() * 2 + 8 : null,
        },
      });
      progressCount++;
    }
  }

  console.log(`✅ Created ${progressCount} progress records`);

  console.log('🎯 Creating quiz attempts...');
  const quizzes = await prisma.quiz.findMany();
  let attemptCount = 0;

  for (const enrollment of enrollments.slice(0, 2)) {
    for (const quiz of quizzes.slice(0, 2)) {
      const lesson = await prisma.lesson.findUnique({
        where: { id: quiz.lessonId },
        include: { module: { include: { discipline: true } } },
      });

      if (!lesson) continue;

      const questions = await prisma.question.findMany({
        where: { quizId: quiz.id },
        include: { options: true },
      });

      const correctAnswers = questions.reduce(
        (sum, q) => sum + (q.options.find((o) => o.correta) ? 1 : 0),
        0
      );
      const totalQuestions = questions.length;
      const score = (correctAnswers / totalQuestions) * 10;
      const passed = score >= quiz.notaMinimaAprovacao;

      const attempt = await prisma.quizAttempt.create({
        data: {
          quizId: quiz.id,
          studentId: enrollment.studentId,
          courseId: enrollment.courseId,
          disciplineId: lesson.module.discipline.id,
          totalQuestions,
          correctAnswers,
          score,
          scorePercentage: (correctAnswers / totalQuestions) * 100,
          passed,
          timeSpentSeconds: Math.floor(Math.random() * 1200) + 300,
          attempts: 1,
        },
      });

      for (const question of questions) {
        const correctOption = question.options.find((o) => o.correta);
        const selectedOption =
          Math.random() > 0.3
            ? correctOption
            : question.options[
                Math.floor(Math.random() * question.options.length)
              ];

        await prisma.quizAnswer.create({
          data: {
            attemptId: attempt.id,
            questionId: question.id,
            questionText: question.enunciado,
            selectedOptionId: selectedOption?.id || null,
            correctOptionId: correctOption?.id || null,
            correct: selectedOption?.correta || false,
            pointsEarned: selectedOption?.correta ? question.pontos : 0,
          },
        });
      }

      attemptCount++;
    }
  }

  console.log(`✅ Created ${attemptCount} quiz attempts`);

  console.log('🏆 Creating certificates...');
  const completedEnrollments = enrollments.filter(
    (e) => e.status === EnrollmentStatus.ativo
  );

  for (const enrollment of completedEnrollments.slice(0, 1)) {
    const course = courses.find((c) => c.id === enrollment.courseId);
    const student = await prisma.user.findUnique({
      where: { id: enrollment.studentId },
    });

    if (!course || !student) continue;

    const certificateNumber = `CERT-${course.codigo}-${Date.now()}`;

    await prisma.certificate.create({
      data: {
        studentId: enrollment.studentId,
        courseId: enrollment.courseId,
        certificateType: CertificateType.conclusao,
        issueDate: new Date(),
        completionDate: new Date(),
        overallScore: 9.5,
        certificateNumber,
        studentName: student.name || student.email,
        studentRegistration: `REG-${student.id.slice(0, 8).toUpperCase()}`,
        courseName: course.nome,
        courseCode: course.codigo,
        totalHours: course.cargaHorariaTotal,
        signatureLine1: 'Prof. Carlos Silva',
        signatureLine1Title: 'Coordenador do Curso',
        digitalSignature: true,
        status: CertificateStatus.emitido,
      },
    });
  }

  console.log('✅ Created certificates');

  console.log('📤 Creating uploads...');
  for (const [email, userId] of Object.entries(createdUsers).slice(0, 3)) {
    await prisma.upload.create({
      data: {
        filename: `upload-${userId}-${Date.now()}.pdf`,
        originalName: 'documento.pdf',
        mimeType: 'application/pdf',
        size: Math.floor(Math.random() * 5000000) + 100000,
        url: `/uploads/${userId}/documento.pdf`,
        userId,
      },
    });
  }

  console.log('✅ Created uploads');

  console.log('');
  console.log('✅ Database seeded successfully!');
  console.log('');
  console.log('📊 Summary:');
  console.log(`  - ${Object.keys(createdUsers).length} users`);
  console.log(`  - ${courses.length} courses`);
  console.log(`  - ${disciplines.length} disciplines`);
  console.log(`  - ${lessons.length} lessons`);
  console.log(`  - ${materialCount} materials`);
  console.log(`  - ${quizCount} quizzes`);
  console.log(`  - ${questionCount} questions`);
  console.log(`  - ${enrollments.length} enrollments`);
  console.log(`  - ${progressCount} progress records`);
  console.log(`  - ${attemptCount} quiz attempts`);
  console.log('');
  console.log('🔑 Test accounts:');
  console.log('  admin@example.com / Admin@123456 (super_admin)');
  console.log('  alice@example.com / Alice@123456 (user)');
  console.log('  bob@example.com / Bob@123456 (admin)');
  console.log('  charlie@example.com / Charlie@123456 (user)');
  console.log('  diana@example.com / Diana@123456 (user)');
  console.log('  professor@example.com / Professor@123456 (admin)');
  console.log('');
  console.log('⚠️  IMPORTANT: Change passwords after first login!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
