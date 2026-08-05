# RTP-SUM-009 — Protocolo de Revalidação Multissementes do Artefato Oficial

**Status:** implementação técnica preparada; bateria não autorizada e não executada.  
**Base constitucional:** Constituição Oficial da SU Mega v1.7 e EC-SUM-006.  
**Carteira oficial:** SU Mega – C2, integralmente preservada.  
**Candidata C3:** inexistente.

## 1. Objetivo

Preparar um protocolo e um runner multissementes rastreáveis para validar futuramente o Gerador Funcional Reconstruído preservado na branch `main`, eliminando as falhas de identidade identificadas no RTP-SUM-008.

Esta etapa cria somente a infraestrutura de validação. A bateria de 30 sementes depende de nova autorização explícita do usuário.

## 2. Princípios obrigatórios

1. O runner deve importar diretamente `generatePortfolio` de `generator/lib/generator-core.mjs`.
2. É proibido copiar, reescrever ou adaptar a lógica do algoritmo em implementação paralela.
3. Pesos, lotes, PRNG, fases, critérios de desempate e condições de parada permanecem inalterados.
4. A configuração oficial é `generator/config.example.json`.
5. O teste de identidade da semente `202608031101` ocorre antes de qualquer bateria.
6. Qualquer divergência de hash ou métrica cancela automaticamente a execução.
7. A bateria exige commit exato, árvore Git limpa e identificação da autorização explícita.
8. Todos os resultados devem ser gravados fora da execução oficial preservada.
9. Nenhum resultado experimental modifica a SU Mega – C2.
10. A preparação e a execução da bateria são etapas distintas.

## 3. Artefato oficial congelado

### 3.1 Commit de origem do gerador

`ce51511f114aface34871ef23a67897fafaab5f9`

### 3.2 Commit-base do protocolo

`d21aad3305ecd08fbb2fb36419ad1a9c3435fe9a`

### 3.3 Identidade por arquivos

O arquivo `generator/multiseed/official-artifact-manifest.json` preserva hashes SHA-256 individuais de:

- configuração oficial;
- combinações;
- núcleo do gerador;
- utilitários de entrada e saída;
- cálculo de métricas;
- PRNG;
- configuração da execução de referência;
- carteira experimental de referência.

A verificação por arquivos individuais evita que a inclusão de documentação ou do próprio runner altere indevidamente a identidade do núcleo oficial.

## 4. Teste de identidade obrigatório

Semente:

`202608031101`

Hash esperado da carteira:

`d175ca529da9699b3e07ed3b23df42ca7fbae21bc0899d0c0c68ee0b804191be`

Métricas obrigatórias:

- 705 jogos;
- 705 jogos únicos;
- 1.711.000 candidatas avaliadas;
- fases A = 120, B = 35 e C = 550;
- fechamento dos pares no jogo 155;
- 1.770 pares cobertos;
- 13.210 trincas distintas;
- 10.575 quadras distintas;
- nenhuma quadra repetida;
- interseção máxima de três dezenas;
- frequências entre 70 e 71;
- desvio-padrão das frequências igual a 0,5.

O runner compara o hash da carteira e todas essas métricas. Qualquer divergência encerra o processo com erro antes da primeira semente da bateria.

## 5. Lista de sementes congelada

A lista está em:

`generator/multiseed/seeds.json`

Ela contém 30 sementes previamente registradas:

`202608040001` a `202608040030`.

O documento permanece identificado como:

`planned-not-authorized-for-execution`

A lista não poderá ser alterada entre a autorização e a execução.

## 6. Runner oficial

Arquivo:

`generator/multiseed.mjs`

O runner possui dois modos.

### 6.1 Modo de identidade

Comando:

```bash
node generator/multiseed.mjs \
  --mode identity \
  --expected-commit <COMMIT_CONGELADO> \
  --out <DIRETORIO_TEMPORARIO>
```

Esse modo:

- verifica hashes do artefato oficial;
- verifica o commit informado;
- executa somente a semente de referência;
- compara carteira e métricas;
- grava relatório e CSV de identidade;
- não executa as 30 sementes.

### 6.2 Modo de bateria

Comando reservado para etapa futura:

```bash
node generator/multiseed.mjs \
  --mode battery \
  --expected-commit <COMMIT_CONGELADO> \
  --authorization-id <IDENTIFICADOR_DA_AUTORIZACAO> \
  --confirm-battery AUTORIZACAO-EXPLICITA-CONFIRMADA \
  --out <DIRETORIO_DE_RESULTADOS>
```

O modo de bateria permanece bloqueado quando faltar qualquer um dos seguintes elementos:

- commit esperado;
- coincidência entre commit esperado e commit executado;
- árvore Git limpa;
- identificador da autorização;
- confirmação literal exigida.

Mesmo depois dessas verificações, o runner executa primeiro o teste de identidade e cancela a bateria diante de qualquer divergência.

## 7. Preservação dos resultados futuros

Para cada semente serão preservados:

- configuração completa;
- carteira em CSV;
- métricas completas;
- hash SHA-256 da carteira.

O relatório consolidado registrará:

- autorização;
- commit;
- branch;
- ambiente Node/V8/sistema operacional/CPU;
- resultado do teste de identidade;
- lista congelada de sementes;
- resultado de cada execução.

## 8. Testes automatizados

Os testes verificam:

1. existência de 30 sementes únicas;
2. exclusão da semente de referência da bateria;
3. estado não autorizado da lista;
4. hashes individuais do artefato oficial;
5. modo padrão limitado ao teste de identidade;
6. bloqueio da bateria sem autorização;
7. exigência de commit exato;
8. exigência de árvore Git limpa.

O workflow `validate-multiseed-runner.yml` executa somente:

- verificação de sintaxe;
- testes automatizados;
- teste de identidade.

O workflow não contém comando de bateria.

## 9. Critérios para futura autorização

Antes da bateria, deverão ser confirmados:

1. PR do protocolo revisado e incorporado;
2. commit exato congelado;
3. checks aprovados;
4. identidade aprovada nesse commit;
5. lista de sementes inalterada;
6. autorização explícita do usuário para a bateria;
7. diretório de saída vazio e separado;
8. proibição de alterações durante a execução.

## 10. Critérios de cancelamento

A bateria deverá ser cancelada automaticamente se:

- qualquer hash individual divergir;
- o commit divergir;
- a árvore Git estiver suja;
- faltar autorização;
- o hash da carteira de referência divergir;
- qualquer métrica de referência divergir;
- a lista tiver sementes repetidas ou vazias;
- ocorrer erro em qualquer semente.

## 11. Limitações

- a infraestrutura preparada ainda não demonstra estabilidade multissementes;
- nenhum resultado das 30 sementes foi produzido nesta etapa;
- a futura bateria não constitui estudo ou candidata C3;
- sucesso estrutural não demonstra superioridade probabilística;
- os parâmetros continuam classificados conforme o RTP-SUM-006.

## 12. Recomendação

Submeter este protocolo e o runner para revisão técnica e constitucional. Após incorporação, solicitar autorização específica e separada para executar a bateria de 30 sementes no commit congelado.
