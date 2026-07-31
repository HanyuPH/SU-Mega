# Validação — SU Mega – C2

Data da geração: **31/07/2026**

## Integridade da Carteira Oficial

- Total de jogos: **705**
- Ouro: **141**
- Diamante: **141**
- Platina: **141**
- Safira: **141**
- Ônix: **141**
- Numeração ausente: **0**
- IDs duplicados: **0**
- Jogos duplicados: **0**
- Jogos com quantidade diferente de seis dezenas: **0**
- Dezenas fora do intervalo 01–60: **0**
- Dezenas repetidas dentro do mesmo jogo: **0**
- Jogos fora da ordem original: **0**

## Testes funcionais automatizados

Foram aprovados testes das regras utilizadas diretamente pelo aplicativo:

- contadores de Pendente, Registrado e Apostado;
- atualização dos contadores após mudança de status;
- filtro por sistema/bloco;
- filtro por grupo oficial;
- combinação de sistema e grupo;
- filtro pelo número local do jogo;
- pesquisa que exige todas as dezenas digitadas;
- filtro por status;
- rejeição de dezenas e números de jogo inválidos;
- exportação estrutural de 705 marcações;
- validação de backup compatível;
- rejeição de backup de outro aplicativo ou de status inválido.

## Testes PWA automatizados

- manifesto válido com nome **SU Mega – C2**;
- modo `standalone`;
- ícone vetorial escalável disponível;
- todos os ativos do cache inicial existem;
- instalação e ativação do service worker simuladas;
- remoção de cache antigo validada;
- fallback offline da navegação validado;
- controles obrigatórios presentes no HTML;
- ordem correta dos scripts de dados, regras e interface;
- regras responsivas para celular e tela estreita presentes;
- proteção contra corte lateral presente;
- grade de seis dezenas presente;
- folha de impressão presente.

## Hashes de integridade

Planilha oficial `SU Mega - C2.xlsx`:

`2a91121e89965cd62ced6591f57ba716ebfc956cef446390899d3d2a54ed9f27`

Dados dos 705 jogos usados pelo aplicativo:

`518af4d8fc79783d4eecc4ab7c233424c51640a7372bf1d25437ebf3fa5af370`

## Comandos

```bash
node tests/validate-data.mjs
node tests/validate-app.mjs
node tests/validate-pwa.mjs
```

A validação também é executada automaticamente pelo GitHub Actions em cada envio para a branch `main`.

## Validação final no iPhone

A instalação real pelo Safari e o carregamento público offline devem ser confirmados depois que o GitHub Pages estiver ativado, pois dependem da URL HTTPS publicada e de uma ação manual nas configurações do repositório.
