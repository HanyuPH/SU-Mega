# RTP-SUM-009 — Protocolo de Revalidação Multissementes do Artefato Oficial

**Status:** implementação técnica corrigida conforme a EC-SUM-007; bateria não autorizada e não executada.  
**Base constitucional:** Constituição Oficial da SU Mega v1.8, EC-SUM-006 e EC-SUM-007.  
**Carteira oficial:** SU Mega – C2, integralmente preservada.  
**Candidata C3:** inexistente.

## 1. Objetivo

Preparar um protocolo e um runner multissementes rastreáveis para validar futuramente o Gerador Funcional Reconstruído preservado na branch `main`, eliminando as falhas de identidade identificadas no RTP-SUM-008.

Esta etapa cria somente a infraestrutura de validação. A bateria de 30 sementes depende de autorização explícita posterior ao merge do protocolo.

## 2. Princípios obrigatórios

1. O runner importa diretamente `generatePortfolio` de `generator/lib/generator-core.mjs`.
2. É proibido copiar, reescrever ou adaptar a lógica do algoritmo em implementação paralela.
3. Pesos, lotes, PRNG, fases, critérios de desempate e condições de parada permanecem inalterados.
4. A configuração oficial é `generator/config.example.json`.
5. O teste de identidade da semente `202608031101` ocorre antes de qualquer bateria.
6. Qualquer divergência de hash, métrica, branch, lista de sementes ou diretório de saída cancela automaticamente a execução.
7. A bateria exige commit exato, branch `main`, árvore Git limpa e identificação da autorização explícita.
8. Todos os resultados devem ser gravados em diretório novo ou vazio, separado dos resultados oficiais.
9. Nenhum resultado experimental modifica a SU Mega – C2.
10. A preparação, o merge e a execução da bateria são etapas distintas.

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

O runner compara o hash da carteira e todas essas métricas. Qualquer divergência encerra o processo antes da primeira semente da bateria.

## 5. Lista de sementes congelada

A lista aprovada está em:

`generator/multiseed/seeds.json`

SHA-256 aprovado:

`03517ba0a8e44d7447916a45cb3535421c2c18b7f145b031ba33793402520911`

Ela contém exatamente 30 sementes:

`202608040001` a `202608040030`.

O documento permanece identificado como:

`planned-not-authorized-for-execution`

Antes do teste de identidade e antes da bateria, o runner confirma obrigatoriamente:

- caminho canônico do arquivo;
- SHA-256 exato;
- exatamente 30 sementes;
- sementes únicas;
- exclusão da semente de referência;
- semente de referência correta;
- estado não autorizado correto;
- conteúdo e ordem exatamente iguais à lista aprovada registrada no manifesto.

Qualquer divergência cancela a execução.

## 6. Branch autorizada

A bateria somente pode ser executada na branch:

`main`

O runner consulta automaticamente a branch atual por meio do Git e cancela a execução quando encontra qualquer outro nome.

O teste de identidade utilizado na revisão do PR pode ocorrer na branch do PR, mas o modo `battery` exige obrigatoriamente a `main`.

## 7. Diretório de saída

No modo de bateria, o diretório de saída deve:

- ainda não existir; ou
- existir como diretório completamente vazio;
- ser separado do repositório e do diretório estrutural do gerador;
- não coincidir, conter ou estar contido no diretório oficial `generator/runs/seed-202608031101`;
- não conter resultado, resumo ou arquivo de bateria anterior.

A validação ocorre antes da criação do diretório de identidade e antes da execução de qualquer semente. Qualquer arquivo existente cancela a bateria.

## 8. Runner oficial

Arquivo:

`generator/multiseed.mjs`

O runner possui dois modos.

### 8.1 Modo de identidade

```bash
node generator/multiseed.mjs \
  --mode identity \
  --expected-commit <COMMIT_CONGELADO> \
  --out <DIRETORIO_TEMPORARIO>
```

Esse modo:

- verifica o hash e o conteúdo exato da lista aprovada;
- verifica hashes do artefato oficial;
- verifica o commit informado;
- executa somente a semente de referência;
- compara carteira e métricas;
- grava relatório e CSV de identidade;
- não executa as 30 sementes.

### 8.2 Modo de bateria

Comando reservado para etapa futura:

```bash
node generator/multiseed.mjs \
  --mode battery \
  --expected-commit <COMMIT_CONGELADO> \
  --authorization-id <IDENTIFICADOR_DA_AUTORIZACAO> \
  --confirm-battery AUTORIZACAO-EXPLICITA-CONFIRMADA \
  --out <DIRETORIO_NOVO_OU_VAZIO_FORA_DO_REPOSITORIO>
```

O modo de bateria permanece bloqueado quando faltar ou divergir qualquer um dos seguintes elementos:

- commit esperado;
- coincidência entre commit esperado e commit executado;
- branch `main`;
- árvore Git limpa;
- identificador da autorização;
- confirmação literal exigida;
- hash e conteúdo da lista de sementes;
- diretório de saída novo ou vazio e separado;
- teste de identidade.

## 9. Preservação dos resultados futuros

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
- validação do diretório de saída;
- verificação criptográfica e semântica das sementes;
- resultado do teste de identidade;
- lista congelada de sementes;
- resultado de cada execução.

## 10. Testes automatizados

Os testes verificam:

1. existência de 30 sementes únicas;
2. exclusão da semente de referência;
3. estado não autorizado da lista;
4. hash exato de `seeds.json`;
5. correspondência exata com a lista aprovada;
6. cancelamento por hash alterado;
7. cancelamento por lista alterada;
8. hashes individuais do artefato oficial;
9. modo padrão limitado à identidade;
10. bloqueio sem autorização;
11. commit exato;
12. árvore Git limpa;
13. cancelamento em branch divergente;
14. aceitação somente da branch `main`;
15. cancelamento diante de diretório não vazio;
16. proibição de utilizar o diretório oficial de referência.

O workflow `validate-multiseed-runner.yml` executa somente:

- verificação de sintaxe;
- todos os testes automatizados;
- teste de identidade;
- confirmação de que nenhum resumo de bateria foi produzido.

O workflow não contém comando de bateria.

## 11. Critérios para futura autorização

Antes da bateria, deverão ser confirmados:

1. PR do protocolo revisado e incorporado à `main`;
2. commit exato congelado;
3. execução na branch `main`;
4. árvore Git limpa;
5. checks aprovados;
6. identidade aprovada nesse commit;
7. hash e lista de sementes aprovados;
8. autorização explícita do usuário para a bateria;
9. diretório de saída novo ou vazio e separado;
10. proibição de alterações durante a execução.

## 12. Critérios de cancelamento

A bateria deverá ser cancelada automaticamente se:

- qualquer hash individual do artefato divergir;
- o commit divergir;
- a branch não for `main`;
- a árvore Git estiver suja;
- faltar autorização;
- o hash da lista de sementes divergir;
- a lista não tiver exatamente 30 sementes únicas;
- a referência estiver incluída;
- o conteúdo ou a ordem não corresponder à lista aprovada;
- o diretório de saída estiver ocupado ou conflitar com área oficial;
- o hash da carteira de referência divergir;
- qualquer métrica de referência divergir;
- ocorrer erro em qualquer semente.

## 13. Correções da EC-SUM-007

As três ressalvas obrigatórias foram implementadas:

1. verificação automática da branch `main` no modo de bateria;
2. hash SHA-256 e correspondência integral da lista de sementes antes da identidade e da bateria;
3. validação preventiva do diretório de saída antes de qualquer gravação.

Foram adicionados testes negativos específicos para branch divergente, hash alterado, lista alterada, diretório não vazio e diretório oficial.

## 14. Limitações

- a infraestrutura preparada ainda não demonstra estabilidade multissementes;
- nenhum resultado das 30 sementes foi produzido nesta etapa;
- a futura bateria não constitui estudo ou candidata C3;
- sucesso estrutural não demonstra superioridade probabilística;
- os parâmetros continuam classificados conforme o RTP-SUM-006.

## 15. Recomendação

Após a aprovação dos checks, verificar o escopo do PR nº 6 e encaminhar o cumprimento da EC-SUM-007 à Constituição. Somente então o PR poderá sair do modo rascunho. O merge e a execução da bateria dependerão de autorizações explícitas separadas.
