# RTP-SUM-006 — Preservação do Gerador Funcional Reconstruído da SU Mega

**Status:** proposta técnica para avaliação constitucional.  
**Data da execução preservada:** 03/08/2026, horário de Brasília.  
**Carteira oficial preservada:** SU Mega – C2.  
**Identificação da implementação:** Gerador Funcional Reconstruído da SU Mega.

## 1. Objetivo

Preservar em código versionável, reproduzível, testável e auditável uma implementação independente das regras funcionais recuperadas da metodologia Cobertura Global Balanceada, sem alegar recuperação do gerador histórico original da C2.

## 2. Problema resolvido

A metodologia funcional estava recuperada, mas ainda faltava uma implementação independente que registrasse semente, configuração, critérios de pontuação, rejeições, fases, resultados, métricas, ambiente e hashes.

## 3. Metodologia utilizada

Foi implementado um gerador determinístico em JavaScript ESM, sem dependências externas, com PRNG `xorshift64*`, construção em três fases e amostragem dirigida por pares ausentes.

Restrições absolutas:

- jogos de seis dezenas distintas no universo 01–60;
- jogos completos não duplicados;
- quadras não reutilizadas;
- interseção máxima de três dezenas;
- na Fase B, aceitação somente de candidatas que cubram ao menos um par ausente.

A pontuação configurável considera pares novos, trincas novas, equilíbrio quadrático das frequências, multiplicidade dos pares e frequência máxima projetada.

## 4. Solução implementada

Foi criado o diretório isolado `generator/`, contendo código-fonte, configuração, documentação, testes, execução experimental preservada, carteira CSV, métricas, log, ambiente e hashes.

A implementação não lê nem altera os arquivos operacionais da aplicação e não modifica a SU Mega – C2.

## 5. Execução preservada

**Semente:** `202608031101`  
**Jogos aceitos por fase:** A = 120; B = 35; C = 550.  
**Fechamento dos pares:** concluído no jogo 155.  
**Candidatas avaliadas:** 1.711.000.  
**Candidatas aceitas:** 705.  
**Candidatas rejeitadas:** 1.710.295.

Motivos de rejeição:

- jogo duplicado: 11;
- quadra repetida ou interseção superior a três: 238.449;
- candidata válida não selecionada por pontuação inferior: 1.471.835;
- demais rejeições estruturais: 0.

## 6. Métricas obtidas

- 705 jogos únicos;
- seis dezenas válidas por jogo;
- 1.770 pares cobertos;
- multiplicidade dos pares entre 3 e 9;
- 13.210 trincas distintas;
- 10.575 quadras distintas;
- nenhuma quadra repetida;
- interseção máxima de três dezenas;
- frequência das dezenas entre 70 e 71;
- frequência média de 70,5;
- desvio-padrão populacional das frequências de 0,5.

O tempo exato e os dados completos estão em `runs/seed-202608031101/metrics.json` e `execution.log`.

## 7. Impacto esperado

O projeto passa a possuir uma base técnica independente para auditorias, testes de parâmetros e futuras pesquisas controladas. O gerador permite reproduzir a carteira experimental a partir da mesma semente e configuração, sem depender da aplicação estável.

## 8. Limitações

- não reproduz nem promete reproduzir os jogos exatos da C2;
- não comprova que os pesos experimentais sejam os pesos históricos originais;
- uma semente bem-sucedida não demonstra superioridade probabilística;
- a carteira gerada é experimental e não constitui SU Mega – C3;
- mudanças futuras de versão do ambiente devem ser registradas e novamente validadas.

## 9. Pendências

- revisão humana do código e dos documentos;
- execução do workflow de validação no GitHub;
- aprovação explícita do usuário;
- somente após aprovação, avaliação para incorporação constitucional deste RTP.

## 10. Recomendação final

A implementação está tecnicamente apta para revisão constitucional como preservação do **Gerador Funcional Reconstruído da SU Mega**. Não está autorizada a promoção da carteira experimental nem o início automático de uma candidata SU Mega – C3.
