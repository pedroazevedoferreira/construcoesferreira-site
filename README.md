# Ferreira Projetos e Construcoes

Site institucional estatico em HTML, CSS e JavaScript puro. Sem build, framework, banco de dados ou dependencias de producao.

## Deploy

Publicado no Cloudflare Workers (static assets), com deploy automatico a cada push na branch `main`:

https://construcoesferreira-site.pedroazevedoferreira2006.workers.dev/

## Executar localmente

Para uma previa fiel, sirva os arquivos por HTTP. Com Node.js instalado, execute na pasta do projeto:

```powershell
node tests/preview.cjs
```

Abra o endereco mostrado no terminal; `Ctrl+C` encerra a previa. O servidor usa uma porta livre, escuta somente neste computador e reproduz os cabecalhos de seguranca e redirecionamentos locais. Nao instala dependencias, nao compila nem publica o site. Node.js e necessario apenas para essa ferramenta opcional de desenvolvimento, nunca na hospedagem.

Nao use `file://` para aprovar o visual: o navegador pode bloquear fontes locais e as mascaras SVG dos desenhos arquitetonicos nesse protocolo. As paginas continuam sendo HTML, CSS e JavaScript estaticos, sem build. A hospedagem HTTPS serve os mesmos arquivos.

## Estrutura principal

- `index.html`: pagina inicial
- `sobre.html`, `servicos.html`, `obras.html`, `contato.html`: paginas internas
- `projetos/`: nove fichas de projetos e areas de atuacao, com galeria ampliavel
- `index.html#depoimento`: avaliacao de Rafael Curvelo, com fonte no Google
- Home: hero, experiencia, servicos, obras realizadas, como funciona, clientes, depoimentos, responsavel tecnico e chamada final
- `obras.html`: obras realizadas (com filtros), areas de atuacao (imagens ilustrativas) e galeria de fotos
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

O favicon usa somente o cubo oficial, com fundo transparente e enquadramento justo. `assets/favicon.svg` e a fonte vetorial; `assets/favicon.png` e sua renderizacao de 64px. O cabecalho usa a imagem independente `assets/images/brand-cube.png`, preservando seu enquadramento original. As referencias nas 16 paginas usam `?v=cubo-2` para renovar o cache do icone.

## Contato e depoimento

O formulario de contato pede nome e cidade/bairro; tipo de projeto, prazo e descricao sao opcionais. Ele valida os campos e prepara uma mensagem para o WhatsApp ("Ola, Ferreira! Meu nome e...") apenas com o que o visitante digitou. O visitante confirma o envio no proprio WhatsApp; nao existe envio de e-mail ou cadastro no servidor. Se a nova janela for bloqueada, um link permite continuar. Rascunhos nao sao salvos.

Ha um unico depoimento na home: Rafael Curvelo, nota individual de 5 de 5, texto e link do Google fornecidos pelo responsavel pelo site. O texto foi preservado integralmente; nao foi atribuido um resultado de verificacao automatica. O link leva ao perfil de avaliacoes do autor, nao a um identificador especifico da avaliacao. A data relativa "5 meses atras" foi omitida para nao envelhecer incorretamente.

Edite o depoimento diretamente em `index.html`, na secao `#depoimento`. A nota pertence apenas a esse relato: nao e uma media da empresa nem um contador de clientes.

Com um unico relato real, a home mostra uma citacao em destaque, sem carrossel e sem cards vazios. O JavaScript e o CSS do carrossel (setas, indicadores, teclado e gesto no celular, com movimento reduzido respeitado) continuam no projeto; a marcacao anterior esta no historico do git. Restaure-a somente quando houver pelo menos dois relatos reais, com autoria e fonte.

## Seguranca e manutencao

### Desenhos arquitetonicos

Os seis SVGs locais em `assets/drawings/` sao estudos graficos decorativos, sem escala e sem relacao com obras executadas. Nao incluem scripts, imagens externas, gradientes ou cotas numericas. O CSS aplica os desenhos como mascaras monocromaticas com as cores existentes do tema e opacidade de 16%.

Contato usa uma perspectiva residencial; Servicos, porticos estruturais; Empresa, um corte de edificio; Obras, uma planta. A home tem uma perspectiva de pavilhao na margem do depoimento. Os desenhos ampliados sao parcialmente recortados nas bordas, integrados ao fundo, sem formar ilustracoes em blocos separados. Um detalhe construtivo ocupa o vazio abaixo do titulo de valores em Empresa; um recorte da planta ocupa o vazio equivalente junto as perguntas frequentes em Contato. As pequenas linhas de cota junto ao contato ficam fora da coluna do formulario.

As camadas decorativas ocupam somente espacos negativos que ja existem no desktop. Nao criam colunas, padding, alturas minimas nem intervalos entre secoes. Abaixo de 1024px, sao omitidas: o mobile mantem o fluxo compacto original, sem faixas reservadas para desenhos. Fotos, galerias, formularios, conteudo legal e pagina de erro permanecem livres de fundos ilustrados. Nenhum desenho recebe foco ou captura cliques. Navegadores sem suporte a mascaras CSS mantem o fundo limpo. O teste remove temporariamente a decoracao e confirma que as posicoes e dimensoes do conteudo nao mudam.

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

O teste verifica 16 paginas, dez larguras (319 a 1920px, incluindo 375 e 430px), dois temas, links locais, imagens, acessibilidade automatizada, filtros, menu, galeria e formulario. Inclui navegacao sem JavaScript, o depoimento unico com fonte e pausa das animacoes. O conteudo de terceiros do mapa e simulado no teste automatizado; confira o carregamento real do Google Maps no navegador antes de publicar alteracoes no mapa. Isso nao substitui testes manuais com leitores de tela, dispositivos fisicos ou uma auditoria de seguranca independente.
