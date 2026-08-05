# RTP-SUM-010 — Resultado da Revalidação Multissementes Oficial

**Status:** execução concluída; aguardando avaliação constitucional.  
**Base constitucional:** Constituição Oficial da SU Mega v1.8, EC-SUM-006 e EC-SUM-007.  
**Artefato executado:** Gerador Funcional Reconstruído oficial incorporado à `main`.  
**Carteira oficial:** SU Mega – C2, integralmente preservada.  
**Candidata C3:** não iniciada.

## 1. Identificação da execução

- Commit oficial congelado: `02717317bfa523f125324b406a68c07b128a396d`
- Branch executada: `main`
- Árvore Git limpa: `sim`
- Autorização: `AUT-USUARIO-20260805-0938-RTP-SUM-009`
- Lista de sementes: `03517ba0a8e44d7447916a45cb3535421c2c18b7f145b031ba33793402520911`
- Quantidade: 30 sementes únicas
- Teste de identidade aprovado: `sim`
- Hash da carteira de referência: `d175ca529da9699b3e07ed3b23df42ca7fbae21bc0899d0c0c68ee0b804191be`

## 2. Resultado executivo

- Sementes planejadas: **30**
- Sementes executadas: **30**
- Execuções concluídas: **30/30**
- Carteiras estruturalmente aprovadas: **30/30**
- Hashes de carteira distintos: **30/30**
- Falhas, interrupções ou sementes repetidas: **0**

A bateria confirma estabilidade estrutural multissementes do gerador oficial no commit congelado. As 30 sementes produziram carteiras diferentes, mas todas respeitaram os critérios estruturais configurados.

## 3. Invariantes confirmadas em 30/30 sementes

- 705 jogos;
- 705 jogos únicos;
- nenhum jogo duplicado;
- nenhum jogo com tamanho inválido;
- nenhuma dezena fora do universo;
- nenhuma dezena repetida dentro de um jogo;
- cobertura dos 1.770 pares;
- 10.575 quadras distintas;
- nenhuma quadra repetida;
- interseção máxima igual a três dezenas;
- dispersão de frequência dentro do limite oficial máximo de dois.

## 4. Variações observadas

| Métrica | Mínimo | Máximo | Média | Mediana |
|---|---:|---:|---:|---:|
| Candidatas avaliadas | 1705800 | 1713600 | 1709960 | 1709700 |
| Jogo de fechamento dos pares | 153.0 | 156.0 | 154.6 | 154.5 |
| Trincas distintas | 13178.0 | 13247.0 | 13206.2 | 13207.5 |
| Fase B — jogos aceitos | 33.0 | 36.0 | 34.6 | 34.5 |
| Fase C — jogos aceitos | 549.0 | 552.0 | 550.4 | 550.5 |
| Frequência mínima | 69.0 | 70.0 | 69.9 | 70.0 |
| Frequência máxima | 71.0 | 71.0 | 71.0 | 71.0 |
| Desvio-padrão das frequências | 0.500000 | 0.532291 | 0.503229 | 0.500000 |
| Duração por semente, segundos | 8.495 | 8.751 | 8.588 | 8.578 |

### 4.1 Equilíbrio das dezenas

- **27 sementes (90%)** produziram frequências entre 70 e 71, com dispersão igual a 1 e desvio-padrão 0,5.
- **3 sementes (10%)** produziram frequências entre 69 e 71, com dispersão igual a 2 e desvio-padrão 0,5322906474.
- A dispersão igual a 2 permanece dentro do limite oficial `maximumFrequencySpread = 2`.

Sementes com dispersão 2:
- `202608040012`
- `202608040014`
- `202608040019`

### 4.2 Fechamento dos pares e fases

- Os pares foram fechados entre os jogos 153 e 156.
- A Fase A permaneceu fixa em 120 jogos.
- A Fase B variou de 33 a 36 jogos.
- A Fase C completou o total com 549 a 552 jogos.
- A variação representa caminhos de otimização diferentes, sem perda das invariantes finais.

### 4.3 Diversidade das carteiras

- As 30 carteiras possuem hashes SHA-256 diferentes.
- As trincas distintas variaram de 13.178 a 13.247, com média 13.206,2.
- A cobertura total de pares e a unicidade de quadras permaneceram constantes.

## 5. Integridade e preservação

- ZIP do artefato do GitHub Actions: `56d8b0ff3a6f85e27b7058ab777762862440ee5d88d1b741f52159765895ae8f`
- TAR.GZ consolidado: `5b0595b071b217dedfae69212256ae87ff86df993e249f35af31967de507d26a`
- Resumo `multiseed-summary.json`: `eb95946804f46eb5fcbebeac77b51885d55a08c4c8dbaa1cb8dd781c8c188bb8`
- Relatório de identidade: `5e86d1d336e90a42b17cf9d32593a36bb537913cba8eb440df7b5975b4f6ca8a`
- Manifesto de 123 arquivos: `7d0af586bf6ccce0c6b4586dee84ecc203b8c0c47aa92448436a5cd065d81c99`
- Hash agregado ordenado das 30 carteiras: `790b458de46b09d6b8a30227cff89da6b0b566ba53e9d7e8a29c0b4c82bcde21`

Todos os 123 arquivos relacionados no manifesto interno foram novamente verificados com sucesso após o download do artefato.


## 6. Verificação independente após o download

Além das validações produzidas pelo runner, os 30 arquivos `games.csv` foram recomputados independentemente após o download do artefato.

A recomputação confirmou em 30/30 sementes:

- 705 jogos e 705 jogos únicos;
- cobertura dos 1.770 pares;
- 10.575 quadras distintas;
- zero ocorrência de quadra repetida;
- interseção máxima igual a três;
- frequências mínimas e máximas compatíveis com os relatórios;
- correspondência dos 30 hashes dos arquivos `games.csv` com os hashes declarados.

Essa conferência não utilizou os valores dos arquivos `metrics.json` para recomputar as invariantes estruturais.

## 7. Tabela das 30 sementes

| Semente | Fechamento | Fase B | Fase C | Candidatas | Trincas | Frequência | Hash da carteira | Estado |
|---|---:|---:|---:|---:|---:|---:|---|---|
| `202608040001` | 156 | 36 | 549 | 1.713.600 | 13.247 | 70–71 | `4f4aa4463d3a…` | APROVADA |
| `202608040002` | 154 | 34 | 551 | 1.708.400 | 13.178 | 70–71 | `84babb816b49…` | APROVADA |
| `202608040003` | 154 | 34 | 551 | 1.708.400 | 13.221 | 70–71 | `da3287fcc21b…` | APROVADA |
| `202608040004` | 155 | 35 | 550 | 1.711.000 | 13.209 | 70–71 | `b7cbeafa73f2…` | APROVADA |
| `202608040005` | 156 | 36 | 549 | 1.713.600 | 13.180 | 70–71 | `1ad40ac2886b…` | APROVADA |
| `202608040006` | 155 | 35 | 550 | 1.711.000 | 13.211 | 70–71 | `0286172c01e9…` | APROVADA |
| `202608040007` | 155 | 35 | 550 | 1.711.000 | 13.193 | 70–71 | `32ced7215d28…` | APROVADA |
| `202608040008` | 154 | 34 | 551 | 1.708.400 | 13.214 | 70–71 | `3702deec787f…` | APROVADA |
| `202608040009` | 155 | 35 | 550 | 1.711.000 | 13.197 | 70–71 | `7a13b98f59d5…` | APROVADA |
| `202608040010` | 154 | 34 | 551 | 1.708.400 | 13.220 | 70–71 | `a315a4ddd675…` | APROVADA |
| `202608040011` | 154 | 34 | 551 | 1.708.400 | 13.211 | 70–71 | `7dd159934663…` | APROVADA |
| `202608040012` | 154 | 34 | 551 | 1.708.400 | 13.214 | 69–71 | `4517bc24850f…` | APROVADA |
| `202608040013` | 155 | 35 | 550 | 1.711.000 | 13.187 | 70–71 | `ea4da9216333…` | APROVADA |
| `202608040014` | 153 | 33 | 552 | 1.705.800 | 13.221 | 69–71 | `ed2d8815c850…` | APROVADA |
| `202608040015` | 155 | 35 | 550 | 1.711.000 | 13.217 | 70–71 | `995449e306ce…` | APROVADA |
| `202608040016` | 154 | 34 | 551 | 1.708.400 | 13.208 | 70–71 | `66e90d3b07a0…` | APROVADA |
| `202608040017` | 155 | 35 | 550 | 1.711.000 | 13.193 | 70–71 | `7b2d4083c2b0…` | APROVADA |
| `202608040018` | 154 | 34 | 551 | 1.708.400 | 13.207 | 70–71 | `f4e6a0c55ca2…` | APROVADA |
| `202608040019` | 154 | 34 | 551 | 1.708.400 | 13.195 | 69–71 | `fb37bc9a23de…` | APROVADA |
| `202608040020` | 155 | 35 | 550 | 1.711.000 | 13.195 | 70–71 | `808b6db009be…` | APROVADA |
| `202608040021` | 154 | 34 | 551 | 1.708.400 | 13.239 | 70–71 | `87702bab025c…` | APROVADA |
| `202608040022` | 155 | 35 | 550 | 1.711.000 | 13.188 | 70–71 | `a6993f98ecf0…` | APROVADA |
| `202608040023` | 155 | 35 | 550 | 1.711.000 | 13.190 | 70–71 | `89d6d06299ee…` | APROVADA |
| `202608040024` | 154 | 34 | 551 | 1.708.400 | 13.206 | 70–71 | `7e9852380ed0…` | APROVADA |
| `202608040025` | 154 | 34 | 551 | 1.708.400 | 13.197 | 70–71 | `f32f4d66d262…` | APROVADA |
| `202608040026` | 154 | 34 | 551 | 1.708.400 | 13.208 | 70–71 | `9cc1cb3a7808…` | APROVADA |
| `202608040027` | 156 | 36 | 549 | 1.713.600 | 13.214 | 70–71 | `0e1a47979ec3…` | APROVADA |
| `202608040028` | 155 | 35 | 550 | 1.711.000 | 13.200 | 70–71 | `f5f87f76215d…` | APROVADA |
| `202608040029` | 156 | 36 | 549 | 1.713.600 | 13.225 | 70–71 | `1eb2698297ba…` | APROVADA |
| `202608040030` | 154 | 34 | 551 | 1.708.400 | 13.201 | 70–71 | `72815ee584ce…` | APROVADA |

## 8. Conclusão técnica

A revalidação multissementes oficial foi concluída com sucesso. O Gerador Funcional Reconstruído demonstrou estabilidade estrutural nas 30 sementes previamente aprovadas, sob o código, a configuração, os pesos, os lotes, o PRNG, as fases e as condições de parada congelados.

A estabilidade observada significa que o gerador preservou todas as restrições estruturais oficiais. Ela não demonstra aumento da probabilidade matemática de premiação, superioridade sobre apostas aleatórias ou justificativa automática para substituir a Carteira Oficial SU Mega – C2.

O RTP-SUM-007 permanece classificado como validação do artefato local não reconciliado. O RTP-SUM-010 passa a fornecer a validação multissementes rastreável que faltava para o gerador oficial.

## 9. Recomendações constitucionais

Recomenda-se à Constituição Oficial da SU Mega:

1. aprovar o RTP-SUM-010 como resultado da bateria oficial;
2. reconhecer a estabilidade estrutural multissementes do gerador oficial;
3. registrar as três sementes com dispersão de frequência igual a 2 como variação válida dentro do limite configurado;
4. considerar cumprida a necessidade de revalidação oficial que permanecia aberta após o RTP-SUM-008;
5. manter inalterada a classificação histórica do RTP-SUM-007;
6. manter integralmente a SU Mega – C2;
7. não iniciar candidata C3 com base apenas nesta bateria;
8. proibir qualquer interpretação de superioridade probabilística não demonstrada.

## 10. Estado final

- SU Mega – C2: inalterada;
- gerador oficial: inalterado;
- parâmetros: inalterados;
- bateria: concluída;
- resultados: preservados e verificados;
- candidata C3: não iniciada;
- decisão constitucional: pendente.
