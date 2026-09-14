# Ferreira Projetos e Construcoes

Site institucional estatico em HTML, CSS e JavaScript puro. Sem build, framework, banco de dados ou dependencias de producao.

## Deploy

Publicado no Cloudflare Workers (static assets), com deploy automatico a cada push na branch `main`:

https://construcoesferreira-site.pedroazevedoferreira2006.workers.dev/

## Executar localmente

Abra `index.html` diretamente no navegador. As paginas e os contatos funcionam como arquivos estaticos. Os cabecalhos HTTP de seguranca e a pagina de erro para enderecos inexistentes dependem da hospedagem; nao sao aplicados pelo protocolo `file:`.

## Estrutura principal

- `index.html`: pagina inicial
- `sobre.html`, `servicos.html`, `obras.html`, `contato.html`: paginas internas
- `projetos/`: nove fichas de projetos e areas de atuacao, com galeria ampliavel
- `index.html#depoimento`: avaliacao de Rafael Curvelo, com fonte no Google
- `privacidade.html`: funcionamento dos contatos e armazenamento local
- `css/styles.css`: estilos globais e responsivos
- `js/main.js`: comportamentos pequenos, sem bibliotecas externas
- `js/theme-init.js`: preferencia de tema antes da renderizacao
- `assets/`: imagens, fontes e favicon
- `_headers`: politicas de seguranca do Cloudflare
- `_redirects`: enderecos da antiga pagina de avaliacoes levam ao depoimento na home
- `.assetsignore`: impede que backups, documentos internos e ferramentas entrem na hospedagem
- `IMAGENS.md`: mapa das fotos, fontes dos dados e roteiro de substituicao
- `tests/smoke.cjs`: teste de regressao, fora da publicacao

## Contato e depoimento

O formulario de contato valida os campos e prepara uma mensagem para o WhatsApp. O visitante confirma o envio no proprio WhatsApp; nao existe envio de e-mail ou cadastro no servidor. Se a nova janela for bloqueada, um link permite continuar. Rascunhos nao sao salvos.

Ha um unico depoimento na home: Rafael Curvelo, nota individual de 5 de 5, texto e link do Google fornecidos pelo responsavel pelo site. O texto foi preservado integralmente; nao foi atribuido um resultado de verificacao automatica. O link leva ao perfil de avaliacoes do autor, nao a um identificador especifico da avaliacao. A data relativa "5 meses atras" foi omitida para nao envelhecer incorretamente.

Edite o depoimento diretamente em `index.html`, na secao `#depoimento`. A nota pertence apenas a esse relato: nao e uma media da empresa nem um contador de clientes. Os dois paineis vazios e desfocados atras do relato sao decoracao sem nomes, estrelas ou textos de avaliacoes ficticias. Nao ha carrossel, paginas ou depoimentos ocultos. A apresentacao funciona sem JavaScript.

## Seguranca e manutencao

O site nao possui painel administrativo, credenciais ou formularios processados pelo servidor. Fontes, imagens e scripts proprios sao locais. A politica CSP nao permite scripts externos, conexoes de dados ou submissao de formularios na pagina principal. Frames sao permitidos somente nos dominios do Google usados pelo mapa incorporado na pagina de contato.

O mapa carrega de forma adiada e mantem as cores originais para preservar sua legibilidade nos dois temas. Ao carregar, o iframe faz conexoes externas ao Google; a pagina Privacidade informa esse comportamento. O link "Como chegar" funciona tambem quando o mapa e bloqueado por uma extensao ou pela rede.

O tema e salvo em `localStorage`; a animacao inicial usa `sessionStorage`. Bloquear o armazenamento nao impede a navegacao. Menus, paginas, portfolio e contatos diretos continuam utilizaveis sem JavaScript. Animacoes respeitam movimento reduzido.

Proteja as contas do GitHub e Cloudflare com autenticacao em dois fatores. Nao adicione senhas, documentos de clientes ou comprovantes de autorizacao ao repositorio. A ausencia de backend reduz a superficie de ataque, mas nao garante seguranca absoluta.

## Validar alteracoes

As ferramentas abaixo sao apenas de desenvolvimento e ficam fora do site. Em PowerShell:

```powershell
npm install --prefix "$env:TEMP/ferreira-tests" --no-save --package-lock=false playwright @axe-core/playwright
node tests/smoke.cjs "$env:TEMP/ferreira-tests/node_modules"
```

O teste usa o Microsoft Edge instalado no Windows. Em outro ambiente, defina `BROWSER_PATH` para um Chromium instalado ou instale o navegador do Playwright. O servidor de teste e temporario, escuta somente em `127.0.0.1` e e encerrado ao terminar. Nenhuma mensagem real e enviada.

O teste verifica 16 paginas, sete larguras, dois temas, links locais, imagens, acessibilidade automatizada, filtros, menu, galeria e formulario. Inclui navegacao sem JavaScript, o depoimento unico com fonte e pausa das animacoes. O conteudo de terceiros do mapa e simulado no teste automatizado; confira o carregamento real do Google Maps no navegador antes de publicar alteracoes no mapa. Isso nao substitui testes manuais com leitores de tela, dispositivos fisicos ou uma auditoria de seguranca independente.
