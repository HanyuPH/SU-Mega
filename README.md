# SU Mega – C2

Aplicativo web oficial derivado da **Carteira Oficial SU Mega – C2**.

## Fonte oficial

A única fonte de verdade dos jogos é a planilha oficial **SU Mega - C2.xlsx**. O aplicativo preserva os 705 jogos, cinco blocos de 141 jogos, ordem Ouro, Diamante, Platina, Safira e Ônix, numeração 001–141, grupos e dezenas.

Qualquer mudança futura deve ser feita primeiro na planilha oficial e somente depois refletida no aplicativo.

A antiga planilha **SU Mega - C1.xlsx** está classificada como carteira histórica substituída e não possui força operacional vigente.

A classificação completa dos arquivos oficiais, históricos e substituídos está registrada em `docs/REGISTRO-ARQUIVOS-OFICIAIS.md`.

## Versões documentadas

- versão estável: **v19**;
- branch estável: `main`;
- beta mais recente documentada: **v29**;
- commit de publicação da Beta v29: `a9c3ec508a5fd308de8800c10e9cb1aa7757763e`;
- branch Beta ativa: `beta`;
- arquivo de registro: `VERSION`.

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

O arquivo local `megasena-download-resultados(1).csv`, encerrado no concurso 3024 de 27/06/2026, está classificado apenas como snapshot histórico e não é fonte operacional vigente.

A consulta manual também está disponível no GitHub Actions por meio de `workflow_dispatch`.

## Estrutura principal

- `index.html` — interface;
- `styles.css` e `contests.css` — visual responsivo;
- `core.js` e `contest-core.js` — regras puras;
- `app.js` — carteira e marcações;
- `contests.js` — histórico, conferência e comparação;
- `official-results.js` — consulta e registro automático;
- `cloud-sync-v2.js` — autenticação e sincronização da versão estável;
- `service-worker.js` — PWA e funcionamento offline;
- `scripts/update-megasena-result.mjs` — coletor da CAIXA;
- `data/games-01.js` a `data/games-10.js` — Carteira C2;
- `tests/validate-contests.mjs` — testes da conferência;
- `VERSION` — registro formal da versão, carteira, hashes, antecessora e estado constitucional;
- `docs/REGISTRO-ARQUIVOS-OFICIAIS.md` — classificação dos arquivos oficiais e históricos analisados.

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

## Conta, privacidade e sincronização

O aplicativo adota funcionamento **local-first**:

- marcações e concursos são mantidos no `localStorage` para uso imediato e funcionamento offline;
- o backup manual permanece disponível e não é substituído pela nuvem;
- sem autenticação, os dados operacionais permanecem apenas no navegador utilizado.

Quando o usuário entra com e-mail e senha:

- a autenticação é processada pelo Firebase Authentication;
- status dos jogos e concursos são sincronizados com o Cloud Firestore;
- os dados são gravados na árvore privada correspondente ao `uid` autenticado;
- listeners em tempo real atualizam os dispositivos conectados à mesma conta;
- alterações feitas offline permanecem localmente até a reconexão.

As regras do Firestore autorizam leitura e gravação somente ao usuário autenticado cujo `uid` corresponda ao caminho acessado. O aplicativo não envia a carteira oficial nem apostas para serviços publicitários. Credenciais não são armazenadas pelo código do aplicativo.

## Governança documental

- Constituição própria: **Constituição Oficial da SU Mega v1.9**;
- situação constitucional: oficial;
- última emenda constitucional documentada: **EC-SUM-008**;
- a EC-SUM-008 ratificou integralmente o RTP-SUM-010 e determinou a preservação definitiva de suas evidências;
- a Carteira Oficial SU Mega – C2 permanece integralmente preservada;
- a Carteira C1, snapshots históricos e painéis substituídos não alteram o estado oficial atual;
- estudos, relatórios e versões Beta não alteram a carteira sem validação e incorporação constitucional;
- o aplicativo e o repositório são implementações operacionais derivadas da Constituição e da planilha oficial.

## GitHub Pages

Endereço oficial:

`https://hanyuph.github.io/SU-Mega/`
