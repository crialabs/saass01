'use client';

import { Menu, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from 'packages/ui/src/navigation-menu';
import { useState } from 'react';

import { cn } from '@/lib/utils';

const NAV_SECTIONS = [
  {
    label: 'Blog',
    items: [
      {
        href: '/blog',
        title: 'Todos os Artigos',
        description: 'Navegue por todos os artigos publicados',
      },
      {
        href: '/blog/categoria/educacao',
        title: 'Educação',
        description: 'Artigos sobre educação e aprendizado',
      },
      {
        href: '/blog/categoria/tecnologia',
        title: 'Tecnologia',
        description: 'Notícias e dicas sobre tecnologia',
      },
      {
        href: '/blog/categoria/inovacao',
        title: 'Inovação',
        description: 'Conteúdo sobre inovação e tendências',
      },
    ],
  },
  {
    label: 'Sobre',
    items: [
      {
        href: '/sobre',
        title: 'Sobre Nós',
        description: 'Conheça nossa instituição',
      },
      {
        href: '/sobre/historia',
        title: 'Nossa História',
        description: 'A trajetória e marcos da instituição',
      },
      {
        href: '/sobre/missao-visao-valores',
        title: 'Missão, Visão e Valores',
        description: 'Os pilares que nos guiam',
      },
      {
        href: '/sobre/equipe',
        title: 'Nossa Equipe',
        description: 'Conheça os profissionais',
      },
    ],
  },
  {
    label: 'Cursos',
    items: [
      {
        href: '/cursos',
        title: 'Todos os Cursos',
        description: 'Catálogo completo de cursos',
      },
      {
        href: '/cursos/ensino-medio',
        title: 'Ensino Médio',
        description: 'Cursos de ensino médio',
      },
      {
        href: '/cursos/tecnico',
        title: 'Técnico',
        description: 'Cursos técnicos profissionalizantes',
      },
      {
        href: '/cursos/graduacao',
        title: 'Graduação',
        description: 'Programas de graduação',
      },
      {
        href: '/cursos/pos-graduacao',
        title: 'Pós-Graduação',
        description: 'Cursos de pós-graduação',
      },
    ],
  },
  {
    label: 'Admissão',
    items: [
      {
        href: '/admissao',
        title: 'Admissão',
        description: 'Informações gerais de admissão',
      },
      {
        href: '/admissao/processo-seletivo',
        title: 'Processo Seletivo',
        description: 'Como funciona nosso processo',
      },
      {
        href: '/admissao/inscricao',
        title: 'Inscrição',
        description: 'Realizar inscrição nos cursos',
      },
      {
        href: '/admissao/bolsas-financiamento',
        title: 'Bolsas e Financiamento',
        description: 'Opções de bolsas disponíveis',
      },
      {
        href: '/admissao/faq',
        title: 'FAQ',
        description: 'Perguntas frequentes',
      },
    ],
  },
  {
    label: 'Campus',
    items: [
      {
        href: '/vida-no-campus',
        title: 'Vida no Campus',
        description: 'Conheça a vida no campus',
      },
      {
        href: '/vida-no-campus/infraestrutura',
        title: 'Infraestrutura',
        description: 'Instalações e recursos',
      },
      {
        href: '/vida-no-campus/atividades-extracurriculares',
        title: 'Atividades',
        description: 'Atividades extracurriculares',
      },
      {
        href: '/vida-no-campus/eventos',
        title: 'Eventos',
        description: 'Eventos e atividades',
      },
      {
        href: '/vida-no-campus/depoimentos',
        title: 'Depoimentos',
        description: 'O que alunos falam',
      },
    ],
  },
  {
    label: 'Carreira',
    items: [
      {
        href: '/carreira',
        title: 'Carreira',
        description: 'Desenvolvendo carreiras de sucesso',
      },
      {
        href: '/carreira/estagios',
        title: 'Estágios',
        description: 'Oportunidades de estágio',
      },
      {
        href: '/carreira/egresados',
        title: 'Egressados',
        description: 'Histórico de sucesso',
      },
      {
        href: '/carreira/oportunidades-emprego',
        title: 'Vagas de Emprego',
        description: 'Oportunidades de trabalho',
      },
    ],
  },
] as const;

export function Navbar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <header className="border-border bg-background/85 text-foreground supports-[backdrop-filter]:bg-background/70 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-3 text-lg font-semibold transition hover:opacity-80"
        >
          <Image
            src="/logo-coltec-new.png"
            alt="COLTEC"
            width={40}
            height={40}
            className="rounded-lg"
          />
          <span>COLTEC</span>
        </Link>

        <NavigationMenu className="hidden lg:flex">
          <NavigationMenuList className="gap-1">
            {NAV_SECTIONS.map((section) => (
              <NavigationMenuItem key={section.label}>
                <NavigationMenuTrigger className="px-3 text-sm font-semibold leading-tight tracking-tight">
                  {section.label}
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[360px] gap-3 p-4 md:w-[480px] md:grid-cols-2 lg:w-[560px]">
                    {section.items.map((item) => (
                      <ListItem
                        key={item.href}
                        href={item.href}
                        title={item.title}
                      >
                        {item.description}
                      </ListItem>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            ))}

            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link
                  href="/contato"
                  className={cn(
                    'bg-primary text-primary-foreground group inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-semibold transition',
                    'hover:bg-primary/90 focus-visible:ring-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
                  )}
                >
                  Contato
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
          <NavigationMenuViewport />
        </NavigationMenu>

        <button
          type="button"
          aria-expanded={isMobileOpen}
          aria-controls="mobile-nav"
          aria-label={isMobileOpen ? 'Fechar menu' : 'Abrir menu'}
          onClick={() => setIsMobileOpen((prev) => !prev)}
          className="text-foreground hover:bg-muted focus-visible:ring-primary inline-flex h-10 w-10 items-center justify-center rounded-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 lg:hidden"
        >
          {isMobileOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      <div
        id="mobile-nav"
        className={cn(
          'transition-all duration-200 lg:hidden',
          isMobileOpen ? 'max-h-[80vh] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="border-border bg-background mx-auto max-w-6xl space-y-4 border-t px-4 pb-6 pt-4 shadow-sm sm:px-6">
          <div className="space-y-3">
            {NAV_SECTIONS.map((section) => (
              <div key={section.label} className="space-y-2">
                <div className="text-primary text-sm font-semibold leading-tight tracking-tight">
                  {section.label}
                </div>
                <div className="grid gap-1">
                  {section.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="text-foreground hover:bg-muted focus-visible:ring-primary rounded-md px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    >
                      <div className="leading-tight">{item.title}</div>
                      <p className="text-muted-foreground text-xs">
                        {item.description}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/contato"
            className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary inline-flex w-full items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            Contato
          </Link>
        </div>
      </div>
    </header>
  );
}

const ListItem = ({
  href,
  title,
  children,
}: {
  href: string;
  title: string;
  children: React.ReactNode;
}) => (
  <li>
    <NavigationMenuLink asChild>
      <Link
        href={href}
        className={cn(
          'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors',
          'hover:bg-muted focus-visible:ring-primary focus-visible:ring-2 focus-visible:ring-offset-2'
        )}
      >
        <div className="text-foreground text-sm font-semibold leading-none">
          {title}
        </div>
        <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
          {children}
        </p>
      </Link>
    </NavigationMenuLink>
  </li>
);
