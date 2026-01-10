-- CreateEnum
CREATE TYPE "CourseLevel" AS ENUM ('tecnico', 'graduacao', 'pos_graduacao');

-- CreateEnum
CREATE TYPE "CourseGrade" AS ENUM ('tecnologo', 'bacharelado', 'licenciatura');

-- CreateEnum
CREATE TYPE "CourseModality" AS ENUM ('presencial', 'ead', 'hibrido');

-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('rascunho', 'publicado', 'arquivado');

-- CreateEnum
CREATE TYPE "LessonType" AS ENUM ('video_gravado', 'video_ao_vivo', 'texto', 'quiz', 'atividade_pratica', 'leitura');

-- CreateEnum
CREATE TYPE "MaterialType" AS ENUM ('slides', 'pdf', 'video', 'audio', 'link', 'codigo_fonte', 'planilha', 'outro');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('multipla_escolha', 'verdadeiro_falso', 'dissertativa', 'correspondencia');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ativo', 'suspenso', 'concluido', 'cancelado', 'trancado');

-- CreateEnum
CREATE TYPE "ProgressStatus" AS ENUM ('nao_iniciada', 'em_progresso', 'concluida');

-- CreateEnum
CREATE TYPE "CertificateType" AS ENUM ('conclusao', 'participacao', 'extensao');

-- CreateEnum
CREATE TYPE "CertificateStatus" AS ENUM ('gerado', 'emitido', 'revogado');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "billingCustomerId" TEXT,
ADD COLUMN     "billingProvider" TEXT,
ADD COLUMN     "paymentMethod" JSONB;

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "descricaoCurta" TEXT,
    "cargaHorariaTotal" INTEGER NOT NULL,
    "cargaHorariaMinima" INTEGER,
    "nivel" "CourseLevel" NOT NULL,
    "grau" "CourseGrade",
    "duracaoSemestres" INTEGER NOT NULL,
    "modality" "CourseModality" NOT NULL DEFAULT 'presencial',
    "status" "CourseStatus" NOT NULL DEFAULT 'rascunho',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "categoryId" TEXT,
    "subcategoryId" TEXT,
    "coordenadorId" TEXT,
    "dataInicioVigencia" TIMESTAMP(3),
    "thumbnailPath" TEXT,
    "bannerPath" TEXT,
    "customFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disciplines" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ementa" TEXT,
    "cargaHorariaTeorica" INTEGER NOT NULL,
    "cargaHorariaPratica" INTEGER NOT NULL,
    "cargaHorariaTotal" INTEGER NOT NULL,
    "areaConhecimento" TEXT,
    "periodo" INTEGER NOT NULL,
    "obrigatoria" BOOLEAN NOT NULL DEFAULT true,
    "objetivos" TEXT[],
    "competencias" TEXT[],
    "prerequisitos" TEXT[],
    "bibliografiaBasica" TEXT[],
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disciplines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modules" (
    "id" TEXT NOT NULL,
    "disciplineId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "ordem" INTEGER NOT NULL,
    "cargaHorariaEstimada" INTEGER,
    "objetivosAprendizagem" TEXT[],
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lessons" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" "LessonType" NOT NULL,
    "ordem" INTEGER NOT NULL,
    "videoUrl" TEXT,
    "duracaoMinutos" INTEGER,
    "thumbnailUrl" TEXT,
    "obrigatoria" BOOLEAN NOT NULL DEFAULT true,
    "liberada" BOOLEAN NOT NULL DEFAULT true,
    "permiteDownload" BOOLEAN NOT NULL DEFAULT false,
    "percentualConclusaoMinimo" INTEGER NOT NULL DEFAULT 100,
    "marcaDaguaAtiva" BOOLEAN NOT NULL DEFAULT false,
    "transcricaoDisponivel" BOOLEAN NOT NULL DEFAULT false,
    "legendasDisponiveis" TEXT[],
    "resolucoesDisponiveis" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materials" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "tipo" "MaterialType" NOT NULL,
    "descricao" TEXT,
    "arquivoPath" TEXT,
    "url" TEXT,
    "tamanhoBytes" INTEGER,
    "formato" TEXT,
    "obrigatorio" BOOLEAN NOT NULL DEFAULT false,
    "ordem" INTEGER NOT NULL,
    "downloadsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quizzes" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "instrucoes" TEXT,
    "tempoLimiteMinutos" INTEGER,
    "notaMinimaAprovacao" DOUBLE PRECISION NOT NULL,
    "tentativasMaximas" INTEGER NOT NULL DEFAULT 3,
    "ordemAleatoria" BOOLEAN NOT NULL DEFAULT false,
    "mostrarRespostaImediata" BOOLEAN NOT NULL DEFAULT false,
    "mostrarGabaritoFinal" BOOLEAN NOT NULL DEFAULT true,
    "permitirRevisao" BOOLEAN NOT NULL DEFAULT true,
    "pontuacaoTotal" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "enunciado" TEXT NOT NULL,
    "tipo" "QuestionType" NOT NULL,
    "ordem" INTEGER NOT NULL,
    "pontos" INTEGER NOT NULL,
    "obrigatoria" BOOLEAN NOT NULL DEFAULT true,
    "explicacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_options" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "correta" BOOLEAN NOT NULL DEFAULT false,
    "feedback" TEXT,
    "ordem" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "enrollmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startDate" TIMESTAMP(3),
    "expectedCompletionDate" TIMESTAMP(3),
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ativo',
    "paymentMethod" TEXT,
    "installments" INTEGER,
    "scholarshipPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progress" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "disciplineId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "status" "ProgressStatus" NOT NULL DEFAULT 'nao_iniciada',
    "watchedMinutes" INTEGER,
    "totalMinutes" INTEGER,
    "completionPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "viewedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "score" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_attempts" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "disciplineId" TEXT NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "correctAnswers" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "scorePercentage" DOUBLE PRECISION NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "timeSpentSeconds" INTEGER NOT NULL,
    "attempts" INTEGER NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quiz_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_answers" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "selectedOptionId" TEXT,
    "correctOptionId" TEXT,
    "correct" BOOLEAN NOT NULL,
    "pointsEarned" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificates" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "certificateType" "CertificateType" NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completionDate" TIMESTAMP(3),
    "overallScore" DOUBLE PRECISION,
    "certificateNumber" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "studentRegistration" TEXT NOT NULL,
    "courseName" TEXT NOT NULL,
    "courseCode" TEXT NOT NULL,
    "totalHours" INTEGER NOT NULL,
    "signatureLine1" TEXT,
    "signatureLine1Title" TEXT,
    "signatureLine2" TEXT,
    "signatureLine2Title" TEXT,
    "digitalSignature" BOOLEAN NOT NULL DEFAULT false,
    "digitalSignatureHash" TEXT,
    "status" "CertificateStatus" NOT NULL DEFAULT 'gerado',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "courses_codigo_key" ON "courses"("codigo");

-- CreateIndex
CREATE INDEX "courses_codigo_idx" ON "courses"("codigo");

-- CreateIndex
CREATE INDEX "courses_status_idx" ON "courses"("status");

-- CreateIndex
CREATE INDEX "courses_nivel_idx" ON "courses"("nivel");

-- CreateIndex
CREATE INDEX "disciplines_courseId_idx" ON "disciplines"("courseId");

-- CreateIndex
CREATE INDEX "disciplines_periodo_idx" ON "disciplines"("periodo");

-- CreateIndex
CREATE UNIQUE INDEX "disciplines_courseId_codigo_key" ON "disciplines"("courseId", "codigo");

-- CreateIndex
CREATE INDEX "modules_disciplineId_idx" ON "modules"("disciplineId");

-- CreateIndex
CREATE INDEX "modules_ordem_idx" ON "modules"("ordem");

-- CreateIndex
CREATE INDEX "lessons_moduleId_idx" ON "lessons"("moduleId");

-- CreateIndex
CREATE INDEX "lessons_ordem_idx" ON "lessons"("ordem");

-- CreateIndex
CREATE INDEX "materials_lessonId_idx" ON "materials"("lessonId");

-- CreateIndex
CREATE INDEX "materials_ordem_idx" ON "materials"("ordem");

-- CreateIndex
CREATE INDEX "quizzes_lessonId_idx" ON "quizzes"("lessonId");

-- CreateIndex
CREATE INDEX "questions_quizId_idx" ON "questions"("quizId");

-- CreateIndex
CREATE INDEX "questions_ordem_idx" ON "questions"("ordem");

-- CreateIndex
CREATE INDEX "question_options_questionId_idx" ON "question_options"("questionId");

-- CreateIndex
CREATE INDEX "enrollments_studentId_idx" ON "enrollments"("studentId");

-- CreateIndex
CREATE INDEX "enrollments_courseId_idx" ON "enrollments"("courseId");

-- CreateIndex
CREATE INDEX "enrollments_status_idx" ON "enrollments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_studentId_courseId_key" ON "enrollments"("studentId", "courseId");

-- CreateIndex
CREATE INDEX "progress_studentId_idx" ON "progress"("studentId");

-- CreateIndex
CREATE INDEX "progress_courseId_idx" ON "progress"("courseId");

-- CreateIndex
CREATE INDEX "progress_status_idx" ON "progress"("status");

-- CreateIndex
CREATE UNIQUE INDEX "progress_studentId_lessonId_key" ON "progress"("studentId", "lessonId");

-- CreateIndex
CREATE INDEX "quiz_attempts_quizId_idx" ON "quiz_attempts"("quizId");

-- CreateIndex
CREATE INDEX "quiz_attempts_studentId_idx" ON "quiz_attempts"("studentId");

-- CreateIndex
CREATE INDEX "quiz_attempts_courseId_idx" ON "quiz_attempts"("courseId");

-- CreateIndex
CREATE INDEX "quiz_answers_attemptId_idx" ON "quiz_answers"("attemptId");

-- CreateIndex
CREATE INDEX "quiz_answers_questionId_idx" ON "quiz_answers"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_certificateNumber_key" ON "certificates"("certificateNumber");

-- CreateIndex
CREATE INDEX "certificates_studentId_idx" ON "certificates"("studentId");

-- CreateIndex
CREATE INDEX "certificates_courseId_idx" ON "certificates"("courseId");

-- CreateIndex
CREATE INDEX "certificates_certificateNumber_idx" ON "certificates"("certificateNumber");

-- AddForeignKey
ALTER TABLE "disciplines" ADD CONSTRAINT "disciplines_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modules" ADD CONSTRAINT "modules_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "disciplines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_options" ADD CONSTRAINT "question_options_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress" ADD CONSTRAINT "progress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress" ADD CONSTRAINT "progress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_answers" ADD CONSTRAINT "quiz_answers_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "quiz_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_answers" ADD CONSTRAINT "quiz_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_answers" ADD CONSTRAINT "quiz_answers_selectedOptionId_fkey" FOREIGN KEY ("selectedOptionId") REFERENCES "question_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
