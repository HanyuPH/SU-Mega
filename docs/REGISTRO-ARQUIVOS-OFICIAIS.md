# Registro de Arquivos Oficiais e Históricos — SU Mega

**Data de consolidação:** 06/08/2026  
**Constituição aplicável:** Constituição Oficial da SU Mega v1.9  
**Carteira vigente:** SU Mega - C2

Este documento classifica os arquivos analisados na consolidação do Ecossistema SU. A classificação define força normativa e uso permitido; não altera retroativamente o conteúdo dos arquivos históricos.

## 1. Arquivo oficial vigente

### SU Mega - C2.xlsx

- classificação: **fonte oficial vigente da carteira**;
- SHA-256 físico da planilha: `2a91121e89965cd62ced6591f57ba716ebfc956cef446390899d3d2a54ed9f27`;
- hash lógico dos 705 jogos: `518af4d8fc79783d4eecc4ab7c233424c51640a7372bf1d25437ebf3fa5af370`;
- quantidade: 705 jogos;
- composição: cinco blocos de 141 jogos — Ouro, Diamante, Platina, Safira e Ônix;
- integridade verificada: jogos válidos e únicos, estrutura completa e ausência de erros de fórmula identificados.

A planilha C2 permanece como única fonte oficial das dezenas, ordem, numeração, blocos, grupos e jogos.

## 2. Carteira histórica substituída

### SU Mega - C1.xlsx

- classificação: **carteira histórica substituída pela C2**;
- SHA-256: `9cc4e77477cca1c994788c11b97d224214f132a468845fd037978e04d6ca556f`;
- uso permitido: preservação histórica, comparação documental e rastreabilidade;
- uso proibido: operação oficial, publicação atual, substituição da C2 ou fonte de reconstrução vigente.

### Limitação técnica registrada

A aba `Conferência` contém 141 resultados `#NAME?` no intervalo `K611:K751`, correspondentes ao bloco Ônix. As fórmulas referenciam a aba `Ônix` sem tratamento compatível no mecanismo de cálculo utilizado.

Como a C1 foi formalmente substituída, essas fórmulas não serão corrigidas no arquivo oficial vigente. O erro permanece documentado como limitação histórica e não afeta a C2.

## 3. Snapshot histórico de resultados

### megasena-download-resultados(1).csv

- classificação: **snapshot histórico completo no intervalo, porém desatualizado**;
- SHA-256: `19f460c7a5cfa4a78324d54d71a05fca64dd58a1c03657095a903871f46fb058`;
- intervalo: concursos 1-3024;
- último concurso presente: 3024, de 27/06/2026;
- quantidade de registros: 3.024;
- lacunas no intervalo: nenhuma;
- duplicidades de concurso: nenhuma;
- registros com quantidade ou faixa inválida de dezenas: nenhum.

O arquivo não poderá ser utilizado como banco operacional vigente, pois foi superado pelos dados oficiais atualizados pelo workflow do repositório.

## 4. Documento histórico substituído

### 📗 MS 4 — Painel Mestre do Projeto Mega-Sena.txt

- classificação: **registro histórico substituído**;
- SHA-256: `5ab7d1299e7a973fa0aadbf628c4d53c57d141d9da11084ae20fdfa348c83f76`;
- conteúdo preservado apenas para rastreabilidade;
- limitações: declara que a ativação do GitHub Pages ainda dependeria de confirmação e descreve armazenamento predominantemente local, anterior à documentação oficial do Firebase Authentication, Cloud Firestore e sincronização privada local-first.

Este arquivo não possui força normativa e não deverá ser utilizado para reconstruir o estado atual do projeto.

## 5. Fontes operacionais vigentes

A reconstrução e a operação atual da SU Mega deverão utilizar:

1. Constituição Oficial da SU Mega v1.9;
2. Constituição Oficial do Ecossistema SU vigente;
3. planilha `SU Mega - C2.xlsx`;
4. arquivo `VERSION`;
5. branch `main` para produção;
6. branch `beta` para desenvolvimento e validação;
7. dados oficiais mantidos pelo workflow do repositório;
8. código, regras do Firestore, testes e documentação vigente do repositório.

## 6. Regra de prevalência

Em caso de divergência, prevalecem a Constituição vigente, a planilha C2 homologada, o arquivo `VERSION` e a documentação atual do repositório. A C1, o CSV histórico e o painel substituído não poderão prevalecer sobre essas fontes.

## 7. Estado final

- arquivos oficiais vigentes analisados: 1;
- carteiras históricas substituídas: 1;
- snapshots históricos desatualizados: 1;
- documentos históricos substituídos: 1;
- pendências de classificação: nenhuma;
- alteração na Carteira C2: nenhuma.
