# Validação — SU Mega – C2

Data da atualização: **31/07/2026**

## Integridade da Carteira Oficial

- Total: **705 jogos**
- Ouro, Diamante, Platina, Safira e Ônix: **141 jogos cada**
- IDs duplicados: **0**
- Jogos duplicados: **0**
- Jogos ausentes: **0**
- Dezenas fora de 01–60: **0**
- Ordem e estrutura alteradas: **0**

## Conferência e comparação

Foram validados:

- seleção de exatamente seis dezenas;
- cadastro, edição e exclusão de concursos;
- armazenamento local do histórico;
- importação do CSV histórico da Mega-Sena;
- conferência dos 705 jogos;
- escopo Todos, Registrados e Apostados;
- contagem de quadra, quina e sena;
- melhor acerto geral;
- comparação entre os cinco blocos;
- distinção entre jogos de mesma numeração em blocos diferentes;
- destaque visual das dezenas acertadas;
- consulta do último concurso e busca de concurso específico;
- validação da resposta oficial da CAIXA;
- atualização e cache offline dos resultados oficiais.

## Concurso de referência

Concurso **3038**, dezenas **30 35 38 39 46 50**:

- jogos conferidos: **705**
- melhor resultado: **3 acertos**
- jogos empatados com 3 acertos: **8**
- quadras: **0**
- quinas: **0**
- senas: **0**

Melhores jogos esperados:

- Diamante 015 e 039
- Platina 063 e 103
- Safira 007 e 138
- Ônix 002 e 024

## Comandos

```bash
node tests/validate-data.mjs
node tests/validate-app.mjs
node tests/validate-pwa.mjs
node tests/validate-contests.mjs
```

A validação é executada pelo GitHub Actions em cada envio para `main`.
