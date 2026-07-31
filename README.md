# SU Mega – C2

Aplicativo web oficial derivado da **Carteira Oficial SU Mega – C2**.

## Fonte oficial

A única fonte de verdade dos jogos é a planilha oficial **SU Mega - C2.xlsx**, utilizada para gerar e auditar os dados publicados neste repositório. A planilha permanece sob controle do projeto e não é substituída pelo aplicativo.

O aplicativo preserva exatamente:

- 705 jogos;
- 5 blocos oficiais com 141 jogos cada;
- ordem Ouro, Diamante, Platina, Safira e Ônix;
- numeração 001–141 dentro de cada bloco;
- todas as dezenas e a ordem dos jogos;
- grupos oficiais 001–020, 021–040, 041–060, 061–080, 081–100, 101–120 e 121–141.

Qualquer alteração futura deve ser realizada primeiro na planilha oficial e somente depois refletida no aplicativo.

## Funcionalidades

- status Pendente, Registrado e Apostado;
- contadores gerais e de jogos visíveis;
- filtros por status, bloco, grupo, número do jogo e dezenas;
- armazenamento automático no navegador;
- exportação e importação de backup;
- restauração do estado original com confirmação;
- impressão dos jogos visíveis;
- PWA instalável e funcionamento offline;
- layout responsivo para iPhone, celular e computador;
- dados pessoais e marcações armazenados somente no dispositivo.

## Estrutura

- `index.html` — interface principal;
- `styles.css` — visual responsivo;
- `core.js` — regras puras de filtros, contadores e validação;
- `app.js` — interface, armazenamento, backup e instalação;
- `data/games-01.js` a `data/games-10.js` — dados derivados da planilha oficial;
- `data/metadata.json` — metadados e hashes de integridade;
- `manifest.json` — configuração PWA;
- `service-worker.js` — cache e funcionamento offline;
- `assets/icons/icon.svg` — ícone vetorial do aplicativo;
- `tests/validate-data.mjs` — auditoria automatizada dos jogos;
- `tests/validate-app.mjs` — testes de filtros, contadores e backup;
- `tests/validate-pwa.mjs` — testes estruturais do PWA e cache offline;
- `VALIDATION.md` — relatório completo de validação.

## Validação

```bash
node tests/validate-data.mjs
node tests/validate-app.mjs
node tests/validate-pwa.mjs
```

Hash SHA-256 da planilha oficial:

`2a91121e89965cd62ced6591f57ba716ebfc956cef446390899d3d2a54ed9f27`

Hash SHA-256 dos 705 jogos serializados:

`518af4d8fc79783d4eecc4ab7c233424c51640a7372bf1d25437ebf3fa5af370`

## Executar localmente

Use um servidor HTTP local, pois service workers não funcionam ao abrir o arquivo diretamente:

```bash
python3 -m http.server 8000
```

Depois acesse `http://localhost:8000`.

## GitHub Pages

Em **Settings → Pages**, selecione:

- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/ (root)`

Endereço esperado:

`https://hanyuph.github.io/SU-Mega/`

## Privacidade

O aplicativo não envia apostas, marcações ou dados pessoais para servidores externos. Os status ficam no `localStorage` do navegador e podem ser transferidos por backup JSON.
