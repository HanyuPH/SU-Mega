# RTP-SUM-008 — Reconciliação do Artefato da Validação Multissementes

**Data da auditoria:** 04/08/2026  
**Constituição de referência:** Constituição Oficial da SU Mega v1.6  
**Ressalva de origem:** EC-SUM-005  
**Carteira oficial preservada:** SU Mega – C2, 705 jogos, sem alterações  
**Situação de C3:** inexistente; nenhum estudo de candidata foi iniciado  
**Branch da auditoria:** `audit/rtp-sum-008-reconciliacao`

## 1. Objetivo

Identificar o artefato realmente utilizado no RTP-SUM-007 e reconciliá-lo com o Gerador Funcional Reconstruído preservado pelo RTP-SUM-006 e incorporado à branch `main` do repositório `HanyuPH/SU-Mega`.

A auditoria foi executada sem modificar a SU Mega – C2, sem alterar o gerador oficial e sem repetir a bateria de 30 sementes.

## 2. Fontes e evidências examinadas

Foram examinados:

1. branch `main` atual do repositório oficial;
2. commit de incorporação do gerador: `ce51511f114aface34871ef23a67897fafaab5f9`;
3. diretório `generator/` preservado pelo RTP-SUM-006;
4. configuração oficial `generator/config.example.json`;
5. código `generator/generate.mjs`, `generator/lib/generator-core.mjs` e `generator/lib/rng.mjs`;
6. execução oficial `generator/runs/seed-202608031101/`;
7. histórico de branches e commits do repositório;
8. registros do RTP-SUM-007 fornecidos à Constituição;
9. registros do pacote local anteriormente entregue como `RTP_SUM_007_Validacao_Multissementes.zip`;
10. reprodução forense isolada, usando o código oficial e somente a hipótese de lotes de 800 candidatas.

Não foram localizados no repositório:

- o arquivo executável do RTP-SUM-007;
- o código-fonte da bateria multissementes;
- uma branch de origem;
- um commit de origem;
- o hash `53211ac2ec31359d76ad3ba55c95bca2689d9fe4b7cabc07a64341ff8909ea4e`;
- o relatório RTP-SUM-007 versionado;
- os 30 diretórios da bateria multissementes.

## 3. Identificação do artefato oficial do RTP-SUM-006

### 3.1 Repositório, branch e commit

- Repositório: `HanyuPH/SU-Mega`
- Branch oficial: `main`
- Commit de incorporação: `ce51511f114aface34871ef23a67897fafaab5f9`
- Mensagem: `feat: preservar Gerador Funcional Reconstruído da SU Mega`

### 3.2 Arquivo executável e núcleo

O comando oficial de geração é:

`generator/generate.mjs`

O arquivo importa e executa o núcleo:

`generator/lib/generator-core.mjs`

O gerador pseudoaleatório está em:

`generator/lib/rng.mjs`

### 3.3 Hashes oficiais preservados

- SHA-256 agregado do código: `ee3aac0a5a035f4d081dc7ddaecb81a73dba1f0a162abd46b34df7f06bd25dc3`
- SHA-256 da configuração: `4641a200d7fab9895cd7a7af4a9f17710b974fe0b051a15a51fe8e1f5c3432c1`
- SHA-256 da carteira da semente de referência: `d175ca529da9699b3e07ed3b23df42ca7fbae21bc0899d0c0c68ee0b804191be`

Hashes individuais obtidos do pacote preservado do RTP-SUM-006:

- `generator/generate.mjs`: `34e25eba413f364987c6bde663e65ba26a6fb9722e054aae2cba14d5a3c43b41`
- `generator/lib/generator-core.mjs`: `694da8158293edd5ae700f2a57d0b11a7466d645fa3cd97b163cbe3ea8838344`
- `generator/lib/rng.mjs`: `4465f864684717eee26c8bbc3061308891d50a24171c837095a43f3ee4c04b45`

### 3.4 Observação sobre o escopo dos hashes

O hash `ee3aac0a...` não é o hash de um único executável. Ele é um hash agregado calculado sobre 17 arquivos `.mjs`, `.json` e `.md` do diretório `generator/`, excluindo `runs/`.

O hash `53211ac2...` foi registrado no RTP-SUM-007 como hash do gerador ou artefato executado, mas seu arquivo e seu escopo não foram preservados. Portanto, a diferença entre esses dois hashes, isoladamente, não constitui comparação válida arquivo a arquivo.

## 4. Configuração oficial do gerador em `main`

### 4.1 Parâmetros gerais

- universo: 01 a 60;
- dezenas por jogo: 6;
- jogos-alvo: 705;
- núcleo da Fase A: 120 jogos;
- interseção máxima: 3;
- dispersão máxima de frequência: 2.

### 4.2 Lotes de candidatas

- Fase A: 1.800 candidatas por posição;
- Fase B: 5.000 candidatas por posição;
- Fase C: 2.400 candidatas por posição.

### 4.3 Pesos

Fase A:

- novos pares: 2.000;
- novas trincas: 45;
- equilíbrio de frequência: 18;
- multiplicidade de pares: 5;
- frequência máxima: 100.

Fase B:

- novos pares: 50.000;
- novas trincas: 25;
- equilíbrio de frequência: 30;
- multiplicidade de pares: 8;
- frequência máxima: 500.

Fase C:

- novos pares: 50.000;
- novas trincas: 160;
- equilíbrio de frequência: 170;
- multiplicidade de pares: 20;
- frequência máxima: 500.

### 4.4 Amostragem dirigida

Fase A:

- probabilidade de forçar par ausente: 0,70;
- probabilidade de incluir múltiplos pares: 0,55;
- tentativas de múltiplos pares: 3.

Fase B:

- probabilidade de forçar par ausente: 1,00;
- probabilidade de incluir múltiplos pares: 0,65;
- tentativas de múltiplos pares: 3.

Fase C:

- amostragem dirigida desativada.

### 4.5 Condições de parada

- sucesso ao aceitar exatamente 705 jogos;
- falha se a Fase B atingir 620 jogos e ainda existirem pares ausentes;
- falha se um lote não produzir candidata válida;
- falha final se qualquer critério mínimo de validação não for cumprido.

### 4.6 Gerador pseudoaleatório

O artefato oficial utiliza PRNG determinístico `xorshift64*`, implementado com inteiros `BigInt` de 64 bits.

## 5. Execução oficial da semente 202608031101

Resultados preservados em `main`:

- candidatas avaliadas: 1.711.000;
- Fase A: 120 jogos;
- Fase B: 35 jogos;
- Fase C: 550 jogos;
- fechamento dos pares: jogo 155;
- trincas distintas: 13.210;
- quadras distintas: 10.575;
- quadras repetidas: 0;
- multiplicidade dos pares: 3 a 9;
- frequência das dezenas: 70 a 71;
- desvio-padrão das frequências: 0,5;
- hash da carteira: `d175ca529da9699b3e07ed3b23df42ca7fbae21bc0899d0c0c68ee0b804191be`.

## 6. Identificação possível do artefato do RTP-SUM-007

Os registros disponíveis permitem identificar somente:

- pacote entregue: `RTP_SUM_007_Validacao_Multissementes.zip`;
- relatório entregue: `RTP-SUM-007.md`;
- hash atribuído ao artefato: `53211ac2ec31359d76ad3ba55c95bca2689d9fe4b7cabc07a64341ff8909ea4e`;
- sementes principais: `202608040001` a `202608040030`;
- semente de referência: `202608031101`;
- 800 candidatas por posição;
- 564.000 candidatas por execução;
- ausência de branch e commit identificados.

O nome exato do arquivo executável não foi preservado nos registros disponíveis. O pacote não está atualmente disponível no repositório, nas fontes do projeto ou no ambiente desta auditoria.

Classificação técnica do artefato:

> Artefato local não versionado, de origem não reconciliada, utilizado para produzir o RTP-SUM-007.

## 7. Divergências confirmadas

### 7.1 Quantidade de candidatas

O total de 564.000 equivale exatamente a:

`705 × 800`

Isso demonstra que o RTP-SUM-007 avaliou um lote fixo de 800 candidatas para cada posição aceita.

O artefato oficial não usa lote fixo. Na semente de referência, o total oficial é:

- 120 × 1.800 = 216.000;
- 35 × 5.000 = 175.000;
- 550 × 2.400 = 1.320.000;
- total = 1.711.000.

Portanto, a configuração de lotes do RTP-SUM-007 é incompatível com a configuração oficial de `main`.

### 7.2 Métricas da mesma semente

| Métrica | RTP-SUM-006 / `main` | RTP-SUM-007 |
|---|---:|---:|
| Candidatas avaliadas | 1.711.000 | 564.000 |
| Fechamento dos pares | jogo 155 | jogo 185 |
| Trincas distintas | 13.210 | 13.648 |
| Frequência mínima | 70 | 68 |
| Frequência máxima | 71 | 73 |
| Desvio-padrão das frequências | 0,5000 | 0,9574 |

A mesma semente produziu carteiras estruturalmente diferentes.

## 8. Reprodução forense controlada

Foi realizada uma única reprodução isolada, que não constitui nova bateria multissementes.

Procedimento:

1. usar exatamente o código preservado pelo RTP-SUM-006;
2. manter a semente `202608031101`;
3. manter pesos, RNG, fases, amostragem dirigida e condições de parada;
4. alterar somente, em arquivo temporário fora do repositório, os três lotes para 800 candidatas;
5. executar uma única vez.

Resultados:

- candidatas avaliadas: 564.000;
- fechamento dos pares: jogo 161;
- Fase A: 120;
- Fase B: 41;
- Fase C: 544;
- trincas distintas: 13.053;
- multiplicidade dos pares: 2 a 9;
- frequência das dezenas: 69 a 71;
- desvio-padrão das frequências: 0,5322906474;
- hash da carteira forense: `b36c6c46796571286047a5223ebc3dfd9eaa129031deab23c18e2fb0c0fc7f6b`;
- hash da configuração forense: `d56d58a38929c844624cbebbdb49083d108e7760d78b5bd10dcc17058fdb76d0`.

Comparação com o RTP-SUM-007:

| Métrica | Oficial com lote temporário 800 | RTP-SUM-007 |
|---|---:|---:|
| Candidatas | 564.000 | 564.000 |
| Fechamento dos pares | 161 | 185 |
| Trincas distintas | 13.053 | 13.648 |
| Frequências | 69–71 | 68–73 |
| Desvio-padrão | 0,5323 | 0,9574 |

Conclusão da reprodução:

> A redução dos lotes para 800 não explica os resultados do RTP-SUM-007. Existe pelo menos uma divergência adicional em código, gerador pseudoaleatório, pesos, amostragem, tratamento das fases, desempate, condições de parada ou outro parâmetro interno não registrado.

## 9. Comparação dos itens obrigatórios

### 9.1 Arquivo executável

- Oficial: `generator/generate.mjs`, com núcleo em `generator/lib/generator-core.mjs`.
- RTP-SUM-007: arquivo exato não identificado.

### 9.2 Versão

- Oficial: versão definida pelo commit `ce51511f...`.
- RTP-SUM-007: versão não identificada.

### 9.3 Commit e branch

- Oficial: `main`, commit `ce51511f...`.
- RTP-SUM-007: inexistentes nos registros disponíveis.

### 9.4 SHA-256

- Oficial agregado: `ee3aac0a...`.
- RTP-SUM-007: `53211ac2...`, com escopo de cálculo não demonstrado.

### 9.5 Código

Não foi possível produzir diff linha a linha porque o arquivo executado não foi preservado. A identidade exata foi rejeitada pelas divergências de configuração e saída.

### 9.6 Configuração

Diferença confirmada nos lotes de candidatas. Demais diferenças não podem ser integralmente verificadas sem o `config.json` original da execução e o executável.

### 9.7 Pesos

Não comprovados para o RTP-SUM-007. Não há evidência auditável suficiente para afirmar identidade com os pesos de `main`.

### 9.8 Condições de parada

Não comprovadas para o RTP-SUM-007. O total fixo de 564.000 demonstra avaliação de 800 candidatas em cada uma das 705 posições, mas não demonstra as demais condições.

### 9.9 Tamanho dos lotes

- Oficial: 1.800 / 5.000 / 2.400 por fase.
- RTP-SUM-007: 800 por posição.
- Divergência confirmada.

### 9.10 PRNG

- Oficial: `xorshift64*` com `BigInt` de 64 bits.
- RTP-SUM-007: não comprovado.

### 9.11 Tratamento das fases

- Oficial: A até 120 jogos; B até cobertura integral dos pares; C até 705.
- RTP-SUM-007: os resultados sugerem fases funcionais semelhantes, mas a implementação exata não foi preservada.

### 9.12 Parâmetros internos

Não reconciliados. A reprodução forense demonstra que existe divergência além do lote.

### 9.13 Métricas da mesma semente

Divergentes, conforme as tabelas anteriores.

## 10. Causa das divergências

### Fatos comprovados

1. O RTP-SUM-007 usou 800 candidatas por posição.
2. A configuração oficial usa lotes diferentes por fase.
3. A mesma semente produziu métricas diferentes.
4. O código oficial com lotes temporários de 800 também não reproduziu o RTP-SUM-007.
5. O artefato do RTP-SUM-007 não possui branch ou commit identificados.
6. O arquivo executável não está disponível para diff.
7. O hash `53211ac2...` não está registrado no repositório.

### Hipótese técnica mais provável

O RTP-SUM-007 foi produzido por uma implementação local simplificada ou reescrita, inspirada nas regras funcionais do Gerador Reconstruído, mas não derivada de forma verificável do commit oficial de `main`.

Essa hipótese não pode ser promovida a fato enquanto o pacote original não for recuperado e examinado.

## 11. Respostas às perguntas obrigatórias

### 1. Qual artefato foi realmente executado?

Um artefato local não versionado, associado ao hash `53211ac2...` e ao pacote `RTP_SUM_007_Validacao_Multissementes.zip`. O arquivo executável exato não foi preservado ou localizado.

### 2. O artefato corresponde exatamente ao preservado na branch `main`?

Não. A identidade exata é rejeitada pela configuração de lotes e pelas métricas divergentes da mesma semente.

### 3. Existe diferença de código?

Não foi possível comprovar por diff linha a linha, porque o artefato não está disponível. Contudo, a reprodução forense prova que a diferença não se limita ao tamanho dos lotes. Há divergência adicional de código ou de parâmetros internos não registrados.

### 4. Existe diferença apenas de configuração?

Não. Alterar somente os lotes para 800 não reproduziu os resultados do RTP-SUM-007.

### 5. Existe diferença apenas de ambiente?

Não. A diferença de ambiente não explica a configuração incompatível nem o comportamento determinístico divergente. O ambiente pode alterar o tempo de execução, mas não é explicação suficiente para as carteiras diferentes.

### 6. Existe diferença apenas de versão?

Não é possível classificar como simples diferença de versão, porque nenhuma versão, branch ou commit do artefato foi preservado.

### 7. O RTP-SUM-007 permanece válido?

Permanece válido somente como registro de estabilidade estrutural do artefato local não reconciliado. Não é válido como comprovação multissementes do Gerador Funcional Reconstruído presente em `main`.

### 8. Será necessária nova bateria multissementes?

Sim. A nova bateria deverá executar diretamente o código do commit oficial, sem reimplementação independente e com verificação prévia da semente de referência.

### 9. Quais correções deverão ser realizadas?

1. reclassificar o escopo do RTP-SUM-007;
2. manter aberta a ressalva da EC-SUM-005;
3. criar runner multissementes oficial dentro de `generator/`;
4. fazer o runner importar `generatePortfolio` do núcleo oficial;
5. proibir cópia ou reescrita paralela do algoritmo;
6. registrar commit, branch, hash agregado e hashes individuais;
7. preservar configuração integral de cada execução;
8. validar primeiro a semente `202608031101` contra a carteira oficial experimental preservada;
9. somente depois executar a bateria de 30 sementes;
10. versionar relatório, resultados e workflow no GitHub.

### 10. Qual recomendação deverá ser encaminhada à Constituição?

Aprovar o RTP-SUM-008 como encerramento da investigação, mas não encerrar a ressalva da EC-SUM-005. Reclassificar o RTP-SUM-007 como validação auxiliar de artefato não reconciliado e exigir nova validação multissementes do artefato oficial de `main` antes de qualquer conclusão sobre estabilidade do Gerador Funcional Reconstruído.

## 12. Validade técnica do RTP-SUM-007

Classificação recomendada:

> Válido com escopo restrito ao artefato local de hash `53211ac2...`; inválido como evidência de estabilidade multissementes do artefato oficial incorporado pelo RTP-SUM-006.

Os resultados de 30/30 sucessos não devem ser descartados, mas também não devem ser atribuídos ao código oficial sem nova execução rastreável.

## 13. Necessidade de repetição da bateria

A repetição é tecnicamente necessária, porém somente após:

1. criação e revisão de um runner multissementes oficial;
2. preservação do runner em branch específica;
3. confirmação de que ele importa o núcleo oficial;
4. teste de identidade da semente de referência;
5. aprovação do protocolo;
6. registro antecipado das 30 sementes;
7. congelamento do commit e da configuração.

A nova execução não deverá alterar os pesos, regras, lotes, condições de parada ou demais parâmetros oficiais.

## 14. Recomendações técnicas

1. Criar `generator/multiseed.mjs` exclusivamente como orquestrador.
2. Importar diretamente `generatePortfolio` de `generator/lib/generator-core.mjs`.
3. Não duplicar lógica de geração no runner.
4. Receber a lista de sementes por arquivo versionado.
5. Copiar a configuração oficial e alterar exclusivamente o campo `seed` em memória ou em cópias por execução.
6. Registrar o SHA do commit antes da execução.
7. Registrar SHA-256 de todos os módulos executados.
8. Registrar o hash agregado com escopo claramente documentado.
9. Falhar imediatamente se a semente de referência não produzir o hash `d175ca529d...`.
10. Preservar resultados e relatório consolidado em branch específica.
11. Executar workflow GitHub Actions no mesmo commit auditado.
12. Não incorporar carteiras experimentais à aplicação.

## 15. Recomendação constitucional

Recomenda-se à Constituição Oficial da SU Mega:

1. aprovar o RTP-SUM-008;
2. reconhecer que a identidade do artefato do RTP-SUM-007 com `main` não foi comprovada;
3. registrar que a identidade exata foi tecnicamente rejeitada pelas divergências observadas;
4. manter a ressalva da EC-SUM-005 aberta;
5. limitar formalmente o alcance do RTP-SUM-007 ao artefato local não reconciliado;
6. autorizar a preparação de um protocolo de revalidação multissementes do artefato oficial;
7. impedir qualquer conclusão sobre C3;
8. manter a SU Mega – C2 integralmente inalterada.

## 16. Estado final

- Reconciliação concluída: sim.
- Artefato do RTP-SUM-007 localizado integralmente: não.
- Identidade com `main`: não comprovada e incompatível com as evidências.
- RTP-SUM-007 descartado: não.
- RTP-SUM-007 reclassificado: recomendado.
- Nova bateria necessária: sim, após protocolo oficial.
- C2 alterada: não.
- C3 iniciada: não.
