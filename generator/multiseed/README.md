# Runner multissementes oficial

Este diretório preserva a infraestrutura de revalidação multissementes preparada conforme a EC-SUM-006 e corrigida pela EC-SUM-007.

Arquivos:

- `official-artifact-manifest.json`: hashes individuais do artefato oficial, métricas da referência, branch esperada, hash e conteúdo aprovado da lista de sementes e diretórios oficiais protegidos;
- `seeds.json`: lista congelada das 30 sementes planejadas, ainda não autorizadas para execução;
- `PRE_EXECUTION_CHECKLIST.md`: requisitos obrigatórios anteriores à bateria;
- `STATUS.md`: estado atual da preparação.

O comando `generator/multiseed.mjs` executa por padrão somente o teste de identidade.

Antes da identidade, o runner valida o SHA-256 e o conteúdo exato de `seeds.json`.

O modo de bateria exige:

- branch `main`;
- commit exato;
- árvore Git limpa;
- identificador de autorização;
- confirmação literal;
- lista aprovada sem divergências;
- diretório de saída novo ou vazio, separado dos resultados oficiais;
- teste de identidade aprovado.

A presença do runner não autoriza a bateria. Nenhuma das 30 sementes deverá ser executada sem nova autorização explícita do usuário, posterior ao merge do protocolo.
