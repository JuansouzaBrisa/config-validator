# Config Validator - TODO

## Arquitetura e Banco de Dados
- [x] Definir schema do banco de dados (submissions, devices, review_items, users)
- [x] Implementar migrations com Drizzle ORM
- [x] Criar query helpers em server/db.ts

## Autenticação e Perfis
- [x] Implementar sistema de roles (novato, analista)
- [x] Criar página de login com seleção de perfil
- [x] Implementar logout e gerenciamento de sessão
- [ ] Adicionar campo "analista de plantão" no dashboard (futuro)

## Formulário de Submissão (Novato)
- [x] Criar página de submissão com campos: título, link do chamado, descrição
- [x] Implementar adição dinâmica de múltiplos devices
- [x] Adicionar editor de código estilo GitHub para cada device
- [x] Validar campos obrigatórios (link do chamado)
- [x] Implementar salvamento de submissão no banco

## Interface de Revisão (Analista)
- [x] Criar página de revisão com listagem de submissões pendentes
- [x] Implementar clique para marcar status de cada linha (verde/vermelho/amarelo)
- [x] Adicionar campo de comentário/nota por item
- [ ] Implementar atualização de status geral da submissão (futuro)
- [ ] Criar botão "Concluir Revisão" (futuro)

## Visualização de Retorno (Novato)
- [x] Criar página de visualização com feedback do analista
- [x] Implementar coloração de linhas conforme status (verde/vermelho/amarelo)
- [x] Exibir notas do analista ao clicar nas linhas
- [ ] Permitir correção e marcação como "pronto" (futuro)

## Dashboard e Histórico
- [x] Criar dashboard com listagem de submissões
- [x] Implementar filtro por status (Pendente, Em revisão, Concluído)
- [ ] Implementar filtro por data (futuro)
- [x] Exibir histórico com informações de submissor, data e status

## Design e Estilo
- [x] Definir paleta de cores elegante e refinada (gradientes, cores semânticas)
- [x] Implementar design system com Tailwind CSS
- [x] Aplicar tipografia profissional (Inter via Google Fonts)
- [x] Criar componentes reutilizáveis (shadcn/ui)
- [x] Implementar responsividade mobile (grid responsivo)

## Testes
- [x] Escrever testes unitários para procedures (vitest)
- [x] Testar autorização e validação
- [x] Todos os 16 testes passando com sucesso

## Deploy e Finalização
- [x] Revisar todo o código
- [x] Salvar checkpoint final
- [x] Criar componentes reutilizáveis (SubmissionCard, ReviewStatusBadge, CodeBlock)
- [x] Adicionar tipografia Inter e melhorar design system

## Autenticação Interna (Nova)
- [x] Atualizar schema users com campos password_hash e password_salt
- [x] Implementar procedures tRPC para login e registro
- [x] Criar página de login/registro com validação
- [x] Remover OAuth e usar autenticação interna

## Gerenciamento de Usuários (Nova)
- [x] Criar página de admin para gerenciar usuários
- [x] Implementar CRUD de usuários (criar, editar, deletar)
- [x] Permitir admin alterar role (novato/analista)
- [ ] Adicionar filtro e busca de usuários (futuro)

## Modo Dark (Nova)
- [x] Adicionar toggle de tema na navbar/header
- [x] Implementar persistência de preferência no localStorage
- [x] Tema escuro disponível em todas as páginas
- [x] Cores com bom contraste em dark mode
