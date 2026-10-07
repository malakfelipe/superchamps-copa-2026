# SuperChamps — edição Copa do Mundo 2026 🏆

**Bolão virtual parimutuel da Copa do Mundo FIFA 2026.** Sem dinheiro real — as odds nascem do próprio pool de palpites do grupo, não de uma casa. Ligas públicas e privadas, ranking ao vivo, transparência total.

> 🔒 **Projeto encerrado.** Este repositório é um **snapshot congelado da edição Copa 2026** (julho/2026), preservado como portfólio. A infraestrutura de produção (Supabase, Vercel, domínio) foi desativada. O código roda localmente em **modo demo** (dados mock, sem backend).

🔗 **Demo estática (showcase):** https://malakfelipe.github.io/superchamps-copa-2026/

---

## O que é

Um **bolão parimutuel**: todo mundo aposta pontos virtuais num resultado, e a odd de cada resultado é derivada de **como o grupo distribuiu os palpites** — igual às apostas mútuas do turfe. Quanto mais gente no favorito, menor o retorno; a zebra paga mais. Zero dinheiro real (decisão de produto pra evitar licenciamento/KYC/AML).

## Features

| Área | Destaque |
|---|---|
| **Mecânica** | Odds parimutuel ao vivo derivadas do pool · stake máx 50% · cancelar até 5min antes · hedge permitido |
| **Copa do Mundo** | Fase de grupos + chaveamento (bracket) do mata-mata · placar exato (121 combinações) · pênaltis |
| **Ligas** | Públicas e privadas · ranking por saldo · desempate por nº de acertos · convite por código |
| **Social** | Perfil público · transparência de apostas · indicação com bônus |
| **Economia** | 1.000 pts iniciais · reset por competição · boost de saldo baixo · referral |
| **Onboarding** | Tour de 4 etapas com aposta-tutorial |

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | **Next.js 16** (App Router, React Server Components) · **React 19** · **TypeScript** |
| UI | **Tailwind CSS v4** · **shadcn/ui** · design system próprio (marca #00BC7E) · dark mode |
| Backend / DB | **Supabase** — PostgreSQL + Auth + RLS + Edge Functions (Deno) + pg_cron |
| Hospedagem | **Vercel** |
| Dados esportivos | API de fixtures/resultados (sync via Edge Functions) |

## Arquitetura (resumo)

```
            ┌─────────────────────────────┐
  Browser → │  Next.js 16 (App Router)    │  RSC + Server Actions
            │  Tailwind 4 + shadcn/ui     │
            └──────────────┬──────────────┘
                           │  (RLS por usuário)
            ┌──────────────▼──────────────┐
            │          Supabase           │
            │  Postgres + RLS + Auth      │
            │  RPCs SECURITY DEFINER:     │  place_bet / settle_match /
            │   parimutuel settlement     │   reset_balances / boost
            └──────────────┬──────────────┘
                           │  pg_cron
            ┌──────────────▼──────────────┐
            │      Edge Functions (Deno)  │
            │  sync-fixtures · live-scores│  → API esportiva externa
            │  settle-match · drip        │
            └─────────────────────────────┘
```

Settlement **parimutuel** vive em RPCs `SECURITY DEFINER` no Postgres (atômico, auditável). Apostas só entram por função server-side — nunca direto do cliente.

## Rodar localmente (modo demo, sem backend)

```bash
npm install
npm run dev
```

Sem nenhum `.env`, o app roda em **modo demo** automaticamente — com dados de exemplo da Copa, sem backend. Abre em `http://localhost:3000`.

> Este snapshot inclui pequenos ajustes de *demo-enablement* vs. o código de produção (o middleware libera a navegação quando não há Supabase configurado, e o seletor de jogos usa dados mock da Copa), para o app ser navegável localmente sem nenhuma infraestrutura.

---

**Autor:** Felipe Malak · [FMBStudio](https://github.com/malakfelipe) · 2026
Projeto pessoal — bolão virtual sem fins lucrativos.
