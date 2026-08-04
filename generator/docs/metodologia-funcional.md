# Metodologia funcional reconstruída

## 1. Identificação

**Nome oficial:** Gerador Funcional Reconstruído da SU Mega.

A implementação preserva uma metodologia funcional recuperada. Não há afirmação de que o código, a ordem de decisões ou os pesos sejam os mesmos do gerador histórico utilizado na SU Mega – C2.

## 2. Separação epistemológica

### Fatos confirmados

- universo de dezenas 01 a 60;
- jogos de seis dezenas;
- carteira experimental de validação com 705 jogos;
- jogos únicos;
- quadras únicas;
- interseção máxima de três dezenas;
- cobertura integral dos 1.770 pares;
- planilha SU Mega - C2.xlsx como fonte oficial da carteira vigente.

### Regras funcionais reconstruídas

- construção progressiva em três fases;
- rejeição absoluta de duplicidades e quadras utilizadas;
- priorização de pares e trincas novas;
- controle de frequências das dezenas;
- controle da multiplicidade dos pares;
- pontuação configurável e desempate determinístico.

### Parâmetros experimentais

- pesos da pontuação;
- número de jogos no núcleo da Fase A;
- tamanho dos lotes de candidatas;
- probabilidades de amostragem dirigida por pares ausentes;
- semente utilizada.

## 3. Estruturas controladas

O estado da construção contém:

- conjunto de jogos já aceitos;
- conjunto de quadras já usadas;
- conjunto de trincas distintas;
- matriz de multiplicidade dos pares;
- vetor de frequência das 60 dezenas;
- lista atualizada de pares ainda ausentes;
- contadores de auditoria e rejeição.

## 4. Geração de candidatas

As candidatas são jogos ordenados de seis dezenas distintas. A amostragem utiliza PRNG determinístico `xorshift64*` com semente textual convertida para inteiro de 64 bits.

Nas Fases A e B, parte das candidatas é construída contendo pares ausentes. A Fase B exige que toda candidata válida acrescente ao menos um par novo.

## 5. Restrições absolutas

Uma candidata é rejeitada quando:

1. já existe como jogo completo;
2. contém uma quadra já presente em qualquer jogo aceito;
3. durante a Fase B, não cobre par novo.

A quadra repetida é o certificado operacional de interseção superior ao limite: dois jogos com quatro ou mais dezenas comuns compartilham uma quadra.

## 6. Pontuação configurável

Para cada candidata estruturalmente válida, mede-se:

- quantidade de pares novos;
- quantidade de trincas novas;
- aumento quadrático das frequências;
- aumento quadrático das multiplicidades dos pares;
- maior frequência projetada.

A pontuação é:

```text
novos_pares × peso_pares
+ novas_trincas × peso_trincas
− delta_quadrático_frequências × peso_equilíbrio
− delta_quadrático_pares × peso_multiplicidade
− maior_frequência_projetada × peso_máximo
```

## 7. Fases

### Fase A — Formação do núcleo

Opera até o número configurado de jogos do núcleo. Prioriza pares e trincas novas, mantendo quadras únicas, frequências equilibradas e baixa multiplicidade dos pares.

### Fase B — Fechamento dos pares

É ativada após o núcleo quando ainda existem pares ausentes. A amostragem é dirigida e nenhuma candidata sem par novo pode ser aceita.

### Fase C — Expansão combinatória

Inicia somente depois da cobertura integral dos pares. Prioriza trincas inéditas, equilíbrio das frequências e menor concentração dos pares até completar 705 jogos.

## 8. Desempate

Em igualdade de pontuação, a escolha segue, nesta ordem:

1. mais pares novos;
2. mais trincas novas;
3. menor frequência máxima projetada;
4. menor multiplicidade máxima projetada dos pares;
5. menor soma das frequências das dezenas da candidata;
6. menor soma das multiplicidades dos pares;
7. menor chave lexicográfica do jogo.

## 9. Preservação

Cada execução grava configuração, semente, carteira CSV, métricas, log, ambiente e hashes SHA-256 do código, da configuração e da carteira.
