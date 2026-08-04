# Gerador Funcional Reconstruído da SU Mega

Implementação independente, documentada, reproduzível e testável da metodologia funcional recuperada de **Cobertura Global Balanceada**.

## Limite de identidade

Este código **não é apresentado como o gerador histórico original da SU Mega – C2**. Os pesos, lotes de candidatas e probabilidades registrados na configuração são parâmetros experimentais auditáveis. A planilha `SU Mega - C2.xlsx` permanece a fonte oficial da carteira vigente.

O diretório `generator/` é isolado da aplicação estável. A execução não lê, altera, reorganiza nem substitui os jogos da C2.

## Requisitos

- Node.js 20 ou superior;
- nenhuma dependência externa.

## Reprodução da execução preservada

A partir da raiz do repositório:

```bash
node generator/generate.mjs \
  --config generator/config.example.json \
  --out generator/runs/seed-202608031101
```

Validação:

```bash
node generator/validate.mjs \
  --games generator/runs/seed-202608031101/games.csv \
  --config generator/runs/seed-202608031101/config.json
```

Testes automatizados:

```bash
node --test generator/tests/*.test.mjs
```

Ou, dentro de `generator/`:

```bash
npm run generate
npm run validate
npm test
```

## Arquivos preservados

- `config.example.json`: parâmetros classificados como confirmados, reconstruídos ou experimentais;
- `generate.mjs`: comando de geração e preservação da execução;
- `validate.mjs`: validação independente da carteira CSV;
- `metrics.mjs`: cálculo independente das métricas;
- `lib/`: núcleo determinístico sem dependências externas;
- `tests/`: testes automatizados;
- `runs/seed-202608031101/`: execução experimental reproduzível;
- `docs/metodologia-funcional.md`: especificação funcional;
- `docs/comparacao-c2.md`: comparação estrutural, sem alegação de identidade histórica.

## Critérios absolutos

Cada candidata é rejeitada quando duplica um jogo ou reutiliza qualquer quadra. Como dois jogos com interseção de quatro ou mais dezenas compartilham ao menos uma quadra, a regra de quadras únicas também garante interseção máxima de três dezenas.

## Função de pontuação

A função é configurável por fase e combina:

- pares ainda ausentes;
- trincas ainda inéditas;
- penalização do desequilíbrio quadrático das frequências;
- penalização do aumento da multiplicidade dos pares;
- penalização da maior frequência projetada.

Os pesos não são declarados como pesos históricos originais.

## Condições de parada

- sucesso ao aceitar exatamente 705 jogos;
- falha se a Fase B atingir o limite configurado ainda com pares ausentes;
- falha se um lote inteiro não produzir candidata estruturalmente válida;
- falha final se qualquer critério mínimo de validação não for cumprido.
