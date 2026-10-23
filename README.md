# Ferreira Projetos e Construcoes

Site institucional estatico em HTML, CSS e JavaScript puro. Sem build, framework, banco de dados ou dependencias de producao.

## Deploy e versoes

Publicado no Cloudflare Workers (static assets):

- `main` publica o site oficial: https://construcoesferreira-site.pedroazevedoferreira2006.workers.dev/
- `reformulacao` gera a previa da reformulacao, sem afetar o site oficial: https://reformulacao-construcoesferreira-site.pedroazevedoferreira2006.workers.dev/
- A tag `v1.0` guarda o site anterior a reformulacao; a tag `v2.0` marca a primeira publicacao da reformulacao.

## Executar localmente

```powershell
node tests/preview.cjs
```

Abra o endereco mostrado no terminal; `Ctrl+C` encerra a previa. Nao use `file://` para aprovar o visual.

## Estrutura

- `index.html`: inicio (hero, diferenciais, portfolio, servicos, metodo, a empresa, avaliacao, chamada para orcamento)
- `servicos.html`: visao geral das cinco categorias de servico, metodo (`#metodo`) e areas de atuacao (`#areas-de-atuacao`)
- `servicos/*.html`: uma pagina por categoria (engenharia estrutural, construcao e reformas, gerenciamento de obras, infraestrutura e telecomunicacoes, acessibilidade e adequacoes)
- `obras.html`: portfolio com filtros e fotos por obra (`#galeria`)
- `projetos/*.html`: fichas das sete obras e das duas areas de atuacao, com galeria ampliavel
- `sobre.html` (menu "A empresa"), `empresas.html` (atendimento para empresas, no rodape e nos servicos), `contato.html`, `privacidade.html`, `404.html`
- `css/styles.css`: design system (tokens no inicio do arquivo, depois componentes na ordem das paginas e, no fim, os pontos de quebra)
- `js/main.js`: menu, tema, filtros, formulario, galerias, atalho do WhatsApp e animacoes discretas
- `js/theme-init.js`: aplica o tema salvo antes da primeira pintura
- `_headers`, `_redirects`, `.assetsignore`: seguranca, enderecos antigos e arquivos que nao sao publicados
- `IMAGENS.md`: mapa das fotos e roteiro de troca. `PENDENCIAS.md`: dados que precisam de validacao antes da publicacao.

Cabecalho e rodape se repetem em cada pagina. Ao mudar um link, telefone ou item de menu, procure o mesmo trecho em todos os arquivos `.html`.

## Identidade visual

Tokens em `:root` (`css/styles.css`):

- Azul profundo `#142D3A`: titulos, faixas institucionais e rodape.
- Off-white `#F5F2EC`: fundo principal; branco para secoes alternadas e cartoes.
- Laranja `#E96522`: icones, marcadores e detalhes. Botoes primarios usam `#C2511A`, um tom mais fechado do mesmo laranja, para manter o texto branco legivel (contraste minimo de 4,5:1).
- Cinza `#64717A`: base dos textos secundarios (`--muted`, ajustado para contraste).
- Tipografia: Inter (arquivo local), uma unica familia.

O tema escuro reaproveita os mesmos componentes com outros valores de token.

## Contato e formulario

O formulario de orcamento (`contato.html#orcamento`) pede nome, empresa (opcional), telefone, e-mail (opcional), servico de interesse, cidade ou regiao e a descricao. Ele valida os campos e, conforme o botao escolhido, prepara a mensagem no WhatsApp ou no aplicativo de e-mail do visitante. O site nao tem backend: nada e enviado pelo site e a mensagem so chega a Ferreira quando o visitante confirma o envio no WhatsApp ou no e-mail. A mensagem de status diz exatamente isso. As paginas de servico abrem o formulario com o servico ja escolhido (`contato.html?servico=<slug>#orcamento`).

Os botoes de WhatsApp usam o numero oficial e uma mensagem inicial de acordo com a pagina. Eventos de conversao (`data-analytics-event`) sao enviados ao `dataLayer` somente se GTM ou Analytics forem instalados.

Ha um unico depoimento real na home (`index.html#depoimento`): Rafael Curvelo, nota 5 de 5 publicada no Google, texto preservado integralmente.

## Validar alteracoes

```powershell
npm install --prefix "$env:TEMP/ferreira-tests" --no-save --package-lock=false playwright @axe-core/playwright
node tests/smoke.cjs "$env:TEMP/ferreira-tests/node_modules"
```

O teste usa o Microsoft Edge instalado no Windows (ou `BROWSER_PATH`). Ele verifica todas as paginas em 11 larguras (320 a 1920px) e nos dois temas, ausencia de rolagem horizontal, imagens, links locais e ancoras, acessibilidade automatizada (axe, WCAG 2.2 AA), filtros, menu, galeria, formulario, depoimento, redirecionamentos e navegacao sem JavaScript. Nenhuma mensagem real e enviada. Isso nao substitui testes com leitores de tela e dispositivos fisicos.

## Seguranca

O site nao possui painel, credenciais ou formularios processados pelo servidor. A politica CSP nao permite scripts externos, estilos inline, conexoes de dados ou submissao de formularios; frames apenas do Google Maps na pagina de contato. Proteja as contas do GitHub e Cloudflare com autenticacao em dois fatores.
