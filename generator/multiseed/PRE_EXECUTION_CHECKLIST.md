# Checklist pré-execução da bateria multissementes

A bateria somente poderá ser executada quando todos os itens estiverem confirmados:

- [ ] protocolo incorporado à `main`;
- [ ] execução realizada na branch `main`;
- [ ] commit exato congelado;
- [ ] árvore Git limpa;
- [ ] checks aprovados;
- [ ] hashes individuais do artefato oficial aprovados;
- [ ] SHA-256 de `generator/multiseed/seeds.json` igual a `03517ba0a8e44d7447916a45cb3535421c2c18b7f145b031ba33793402520911`;
- [ ] lista com exatamente 30 sementes únicas;
- [ ] semente de referência excluída da bateria;
- [ ] conteúdo e ordem iguais à lista aprovada no manifesto;
- [ ] semente de referência reproduzida integralmente;
- [ ] autorização explícita do usuário registrada;
- [ ] identificador da autorização definido;
- [ ] diretório de saída inexistente ou completamente vazio;
- [ ] diretório de saída separado do repositório, do gerador e dos resultados oficiais;
- [ ] ausência de bateria anterior no diretório de saída;
- [ ] nenhuma alteração em pesos, lotes, PRNG, fases ou condições de parada;
- [ ] confirmação de que a execução não constitui candidata C3.

A ausência ou divergência de qualquer item mantém a bateria bloqueada.
