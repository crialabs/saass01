'use client';

import {
  CtaSection,
  FeaturesSection,
  HeroSection,
  PricingSection,
  StatsSection,
  TestimonialsSection,
} from '@/components/marketing/sections';
import type {
  CtaData,
  FeaturesData,
  HeroData,
  PricingData,
  StatsData,
  TestimonialsData,
} from '@/components/marketing/types';

const mockHeroData: HeroData = {
  title: 'Transforme Sua Carreira com Educação de Excelência',
  subtitle:
    'Há mais de 40 anos formando profissionais competentes e preparados para o mercado',
  description:
    'Na Faculdade Vila Rica Politécnica, você encontra cursos técnicos e superiores com foco em prática, professores experientes e infraestrutura moderna em Ouro Preto.',
  ctaPrimary: {
    text: 'Inscrever-se Agora',
    href: '/admissao/inscricao',
  },
  ctaSecondary: {
    text: 'Conhecer Cursos',
    href: '/cursos',
  },
  badge: '🎓 Matrículas Abertas 2025',
};

const mockFeaturesData: FeaturesData = {
  title: 'Por Que Escolher a Vila Rica Politécnica?',
  subtitle: 'Diferenciais que fazem a diferença na sua formação',
  features: [
    {
      id: '1',
      icon: '💼',
      title: 'Formação Prática + Teórica',
      description:
        'Combinamos conhecimento teórico sólido com experiência prática em laboratórios equipados',
      link: { text: 'Saiba mais', href: '/sobre' },
    },
    {
      id: '2',
      icon: '👨‍🏫',
      title: 'Professores Experientes',
      description:
        'Corpo docente com experiência de mercado e comprometido com seu aprendizado',
      link: { text: 'Conheça a equipe', href: '/sobre/equipe' },
    },
    {
      id: '3',
      icon: '🏢',
      title: 'Parcerias com Empresas',
      description:
        'Convênios com grandes empresas para estágios e oportunidades de carreira',
      link: { text: 'Ver parcerias', href: '/carreira/estagios' },
    },
    {
      id: '4',
      icon: '🔬',
      title: 'Laboratórios Modernos',
      description:
        'Infraestrutura completa com laboratórios de informática, eletrotécnica e mais',
      link: {
        text: 'Conhecer infraestrutura',
        href: '/vida-no-campus/infraestrutura',
      },
    },
    {
      id: '5',
      icon: '❤️',
      title: 'Ambiente Acolhedor',
      description:
        'Ambiente que favorece o aprendizado e o desenvolvimento pessoal integral',
      link: { text: 'Ver depoimentos', href: '/vida-no-campus/depoimentos' },
    },
    {
      id: '6',
      icon: '🎯',
      title: 'Suporte Personalizado',
      description:
        'Acompanhamento pedagógico individualizado para garantir seu sucesso',
      link: { text: 'Saber mais', href: '/sobre' },
    },
  ],
};

const mockStatsData: StatsData = {
  title: 'Nossa Trajetória em Números',
  description:
    'Mais de 40 anos transformando vidas através da educação em Ouro Preto',
  stats: [
    { id: '1', value: 5000, label: 'Alunos Formados', suffix: '+' },
    {
      id: '2',
      value: 85,
      label: 'Taxa de Empregabilidade',
      suffix: '%',
      decimals: 0,
    },
    { id: '3', value: 40, label: 'Anos de Tradição', suffix: '+' },
    { id: '4', value: 50, label: 'Professores Especializados', suffix: '+' },
  ],
};

const mockPricingData: PricingData = {
  title: 'Cursos e Programas',
  subtitle: 'Encontre a formação ideal para sua carreira',
  tiers: [
    {
      id: '1',
      name: 'Ensino Médio',
      description: 'Formação básica com qualidade',
      price: 450,
      period: 'mês',
      currency: 'R$',
      features: [
        '3 anos de duração',
        'Turnos vespertino e matutino',
        'Preparação para ENEM',
        'Atividades extracurriculares',
        'Suporte pedagógico',
      ],
      ctaText: 'Saiba Mais',
      ctaHref: '/cursos/ensino-medio',
    },
    {
      id: '2',
      name: 'Cursos Técnicos',
      description: 'Profissionalização rápida e prática',
      price: 550,
      period: 'mês',
      currency: 'R$',
      highlighted: true,
      features: [
        '18 a 24 meses de duração',
        'Informática e Eletrotécnica',
        'Aulas práticas em laboratório',
        'Certificado reconhecido',
        'Programa de estágios',
        'Alta empregabilidade',
      ],
      ctaText: 'Ver Cursos',
      ctaHref: '/cursos/tecnicos',
    },
    {
      id: '3',
      name: 'Graduação Tecnológica',
      description: 'Nível superior focado em mercado',
      price: 650,
      period: 'mês',
      currency: 'R$',
      features: [
        '2 a 3 anos de duração',
        'Análise e Desenvolvimento',
        'Diploma de nível superior',
        'Professores mestres e doutores',
        'Projetos práticos',
        'Networking profissional',
      ],
      ctaText: 'Inscrever-se',
      ctaHref: '/admissao/inscricao',
    },
  ],
};

const mockTestimonialsData: TestimonialsData = {
  title: 'O Que Nossos Alunos Dizem',
  subtitle: 'Histórias reais de transformação através da educação',
  testimonials: [
    {
      id: '1',
      name: 'João Silva',
      role: 'Desenvolvedor',
      company: 'Startup Tech',
      content:
        'Cheguei na Vila Rica inseguro, não sabia qual caminho seguir. Com o apoio dos professores, descobri minha paixão por programação. Hoje trabalho em uma startup como desenvolvedor. Muito grato!',
      rating: 5,
    },
    {
      id: '2',
      name: 'Maria Santos',
      role: 'Técnica em Informática',
      company: 'Empresa de TI',
      content:
        'O curso técnico em informática foi a porta de entrada para minha carreira. Aprendi não apenas teórico, mas prático mesmo. Quando fui fazer entrevista, estava preparado. Recomendo!',
      rating: 5,
    },
    {
      id: '3',
      name: 'Pedro Oliveira',
      role: 'Aluno',
      company: 'Ensino Médio',
      content:
        'O diferencial da Vila Rica é o acolhimento. Aqui você é pessoa, não número. Os professores se importam com seu desenvolvimento e te ajudam a crescer.',
      rating: 5,
    },
  ],
};

const mockCtaData: CtaData = {
  title: 'Pronto Para Transformar Seu Futuro?',
  description:
    'Junte-se a milhares de alunos que já transformaram suas vidas através da educação de qualidade. Inscreva-se agora e comece sua jornada de sucesso na Vila Rica Politécnica.',
  ctaPrimary: {
    text: 'Inscrever-se Agora',
    href: '/admissao/inscricao',
  },
  ctaSecondary: {
    text: 'Agendar Visita',
    href: '/contato/agenda-visita',
  },
};

export default function MarketingPage() {
  return (
    <main className="min-h-screen">
      <HeroSection data={mockHeroData} />
      <FeaturesSection data={mockFeaturesData} />
      <StatsSection data={mockStatsData} />
      <PricingSection data={mockPricingData} />
      <TestimonialsSection data={mockTestimonialsData} />
      <CtaSection data={mockCtaData} />
    </main>
  );
}
