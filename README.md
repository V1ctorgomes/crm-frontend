# CRM Frontend

Frontend do projeto CRM, desenvolvido com Next.js, React e TypeScript.

## Tecnologias utilizadas

- Next.js
- React
- TypeScript
- Node.js
- Docker
- EasyPanel

## Objetivo

Este projeto é responsável pela interface do sistema CRM, consumindo a API do backend para exibir informações, status da aplicação e, futuramente, módulos como autenticação, dashboard e cadastro de clientes.

## Ambiente

O frontend utiliza a variável abaixo para se comunicar com o backend:

```env
NEXT_PUBLIC_API_URL=
```

Em produção, essa variável está configurada no EasyPanel.

## Como rodar localmente

Instale as dependências:

```bash
npm install
```

Crie um `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Inicie o projeto:

```bash
npm run dev
```

O frontend ficará disponível em:

```text
http://localhost:3000
```

## Build de produção

```bash
npm run build
npm start
```

## Deploy

O deploy está sendo feito no EasyPanel.

### Variáveis de ambiente usadas em produção

- `NEXT_PUBLIC_API_URL`

## Estrutura inicial

- `app/page.tsx`: página inicial
- `app/layout.tsx`: layout principal

## Status atual

- [x] Projeto criado
- [x] Deploy do frontend realizado
- [x] Integração com backend funcionando
- [ ] Criar layout inicial do CRM
- [ ] Criar tela de login
- [ ] Criar dashboard
- [ ] Criar módulo de clientes