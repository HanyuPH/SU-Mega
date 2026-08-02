# SU Mega – C2

Aplicativo web oficial derivado da **Carteira Oficial SU Mega – C2**.

## Fonte oficial

A única fonte de verdade dos jogos é a planilha oficial **SU Mega - C2.xlsx**. O aplicativo preserva os 705 jogos, cinco blocos de 141 jogos, ordem Ouro, Diamante, Platina, Safira e Ônix, numeração 001–141, grupos e dezenas.

Qualquer mudança futura deve ser feita primeiro na planilha oficial e somente depois refletida no aplicativo.

## Funcionalidades

- status Pendente, Registrado e Apostado;
- contadores gerais e de jogos visíveis;
- filtros por status, bloco, grupo, número do jogo e dezenas;
- armazenamento local, backup e impressão;
- PWA responsivo, instalável e offline;
- cadastro manual de concursos;
- consulta automática do resultado oficial da CAIXA;
- busca de concurso específico;
- histórico local dos concursos;
- importação de histórico por CSV;
- conferência de todos os jogos, somente registrados ou somente apostados;
- contagem de quadras, quinas e senas;
- comparação de desempenho entre Ouro, Diamante, Platina, Safira e Ônix;
- destaque das dezenas acertadas e dos melhores jogos.

## Atualização oficial

O workflow `.github/workflows/update-megasena-result.yml` consulta a API oficial da CAIXA durante o período noturno e atualiza:

- `data/ultimo-concurso.json`;
- `data/concursos-oficiais.json`.

A consulta manual também está disponível no GitHub Actions por meio de `workflow_dispatch`.

## Estrutura principal

- `index.html` — interface;
- `styles.css` e `contests.css` — visual responsivo;
- `core.js` e `contest-core.js` — regras puras;
- `app.js` — carteira e marcações;
- `contests.js` — histórico, conferência e comparação;
- `official-results.js` — consulta e registro automático;
- `scripts/update-megasena-result.mjs` — coletor da CAIXA;
- `data/games-01.js` a `data/games-10.js` — Carteira C2;
- `tests/validate-contests.mjs` — testes da conferência.

## Validação

```bash
node tests/validate-data.mjs
node tests/validate-app.mjs
node tests/validate-pwa.mjs
node tests/validate-contests.mjs
```

Hash SHA-256 da planilha oficial:

`2a91121e89965cd62ced6591f57ba716ebfc956cef446390899d3d2a54ed9f27`

Hash SHA-256 dos 705 jogos:

`518af4d8fc79783d4eecc4ab7c233424c51640a7372bf1d25437ebf3fa5af370`

## GitHub Pages

Endereço oficial:

`https://hanyuph.github.io/SU-Mega/`

Ambiente Beta:

`https://hanyuph.github.io/SU-Mega/beta/`

A publicação do GitHub Pages reúne a branch `main` na raiz e a branch `beta` na pasta `/beta/`.

## Privacidade

Jogos, marcações e concursos ficam no navegador do usuário. O aplicativo não envia apostas ou dados pessoais para servidores externos.
