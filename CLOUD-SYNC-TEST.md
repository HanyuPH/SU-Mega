# SU Mega Cloud — roteiro de validação

## Pré-requisitos

- Authentication por e-mail/senha ativado.
- Usuário criado no Firebase Authentication.
- Cloud Firestore Standard criado.
- Regras de `firestore.rules` publicadas no console.
- `hanyuph.github.io` listado nos domínios autorizados.

## Teste obrigatório iPhone → iPad

1. Fechar e reabrir o aplicativo no iPhone para atualizar o Service Worker.
2. Entrar com o usuário Firebase.
3. Alterar três jogos para: Registrado, Apostado e Pendente.
4. Cadastrar um concurso de teste.
5. Abrir o aplicativo no iPad e entrar com a mesma conta.
6. Confirmar os três status e o concurso.

## Teste obrigatório iPad → iPhone

1. Alterar um status no iPad.
2. Editar o concurso no iPad.
3. Confirmar atualização automática no iPhone.

## Teste offline

1. Ativar modo avião no iPad.
2. Alterar um status.
3. Desativar modo avião.
4. Aguardar o indicador mudar de `Offline` para `Sincronizado`.
5. Confirmar a mudança no iPhone.

## Backup

1. Exportar backup manual.
2. Alterar marcações.
3. Importar o backup.
4. Confirmar que o estado restaurado também é enviado à nuvem.

## Critério de conclusão

A implantação só é considerada validada após os testes nos dois dispositivos, sem perda ou duplicação de concursos.
