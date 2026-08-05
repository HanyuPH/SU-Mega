# Runner multissementes oficial

Este diretório preserva a infraestrutura de revalidação multissementes aprovada para preparação pela EC-SUM-006.

Arquivos:

- `official-artifact-manifest.json`: hashes individuais do artefato oficial e métricas da semente de referência;
- `seeds.json`: lista congelada das 30 sementes planejadas, ainda não autorizadas para execução.

O comando `generator/multiseed.mjs` executa por padrão somente o teste de identidade. O modo de bateria exige commit exato, árvore Git limpa, identificador de autorização e confirmação literal.

A presença do runner não autoriza a bateria. Nenhuma execução multissementes deverá ocorrer sem nova autorização explícita do usuário.
