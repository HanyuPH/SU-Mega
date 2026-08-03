# SU Mega Beta v23 — Arquitetura de sincronização

## Fonte oficial dos dados

O Firestore é a fonte oficial para as marcações dos jogos e para o histórico de concursos. O `localStorage` permanece somente como espelho local para a interface e para compatibilidade com o funcionamento offline já existente.

## Estrutura mantida

- Marcações: `users/{uid}/gameStatuses/{gameId}`
- Concursos: `users/{uid}/contests/{numeroDoConcurso}`
- Apostas por concurso: documento de configurações já utilizado pelo módulo `contest-bets-cloud.js`

Os caminhos anteriores foram preservados para evitar migração de regras de segurança e perda de dados.

## Fluxo em tempo real

1. Uma alteração visual no cartão é detectada.
2. Somente o jogo alterado é colocado no lote de gravação.
3. O Firestore confirma localmente a alteração e mantém a fila quando o aparelho está offline.
4. `onSnapshot()` distribui a nova situação para Safari, aplicativo instalado e demais dispositivos conectados à mesma conta.
5. A interface, os contadores, os filtros e as conferências são atualizados.

## Cache e múltiplas abas

O módulo usa cache persistente do Firestore e gerenciamento de múltiplas abas. Se o navegador não oferecer suporte, o aplicativo continua com o cache padrão do SDK.

## Migração inicial

Na primeira abertura da v23, marcações locais não pendentes que ainda não possuam documento remoto são enviadas uma única vez. Documentos já existentes no Firestore são preservados como fonte oficial.

## Concursos

Cada concurso continua em um documento próprio. Inclusões, alterações e exclusões são acompanhadas em tempo real e refletidas nos demais ambientes conectados.

## Estados exibidos

- `Salvando na nuvem…`: existe gravação local aguardando confirmação.
- `Sincronizado em tempo real`: o servidor confirmou o estado atual.
- `Dados locais • aguardando servidor`: o cache está disponível, mas a confirmação remota ainda não chegou.
- `Offline • alterações em espera`: as alterações serão enviadas quando a internet retornar.

## Segurança de promoção

A versão oficial SU Mega v19 permanece na branch `main`. A v23 só poderá ser promovida após validação cruzada entre Safari e aplicativo instalado.