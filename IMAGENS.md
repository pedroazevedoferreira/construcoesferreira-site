# Fotos e portfolio

O layout esta pronto. As obras aparecem no site sem etiqueta de origem da imagem: algumas fotos ainda sao provisorias (veja a coluna "Situacao" no mapa abaixo) e devem ser trocadas pela foto da propria obra. A troca e so de arquivo e texto; nenhum componente muda.

## Troca de uma foto

1. Separe uma foto com autorizacao de uso e confirme a qual obra pertence. Evite documentos legiveis, dados de terceiros e pessoas sem autorizacao.
2. Exporte em WebP, de preferencia entre 1200 e 1800 px no lado maior. Nao aumente artificialmente uma foto pequena para simular detalhes tecnicos.
3. Coloque em `assets/images/finais/` com nome simples, sem espacos, por exemplo `cbkc-sala-reuniao.webp`.
4. Na ficha abaixo, atualize o `src` da foto e o `href` do link de ampliacao. Atualize tambem o `alt`, `data-caption` e `og:image` quando for a capa.
5. Procure o nome antigo do arquivo no projeto e atualize os cards da home, Obras e projetos relacionados. Preserve `width` e `height` proporcionais a foto.
6. Abra a home, o filtro correspondente e a ficha em celular e desktop, nos dois temas. Confira o enquadramento e a ampliacao.

Nao apague imagens antigas enquanto houver referencias a elas. Nenhuma compilacao e necessaria.

## Mapa das imagens

| Ficha                          | Imagem atual                                                                    | Situacao                                                                                                            |
| ------------------------------ | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `projetos/corporativo.html`    | `otimizada-sala-reuniao.webp`, `otimizada-recepcao.webp`, `obra-escritorio.jpg` | A reforma das salas da CBKC e documentada no PDF. Estas fotos nao foram confirmadas como sendo dessa obra.          |
| `projetos/residencial.html`    | `ilustrativa-residencial.webp`                                                  | Area de atuacao, nao um projeto especifico executado. Ao criar um caso real, atualizar tambem nome, local e escopo. |
| `projetos/otavio-kelly.html`   | `obras/reforco-otavio-kelly.webp`                                               | Registro da galeria institucional anterior.                                                                         |
| `projetos/campo-da-areia.html` | `obras/reforco-campo-da-areia.webp`                                             | Registro da galeria institucional anterior.                                                                         |
| `projetos/clinica-labs.html`   | `obras/reforco-clinica-labs.webp`                                               | Registro da galeria institucional anterior.                                                                         |
| `projetos/salas-tecnicas.html` | `ilustrativa-sala-tecnica.webp`                                                 | Ilustracao ficticia gerada para o site (area de atuacao, sem cliente). Substituiu a foto pequena `otimizada-cpd.webp`. |
| `projetos/acessibilidade.html` | `otimizada-acessibilidade.webp`                                                 | Caminho seguro da Ipiranga documentado; foto de referencia, nao comprovada como sendo do local.                     |
| `projetos/ufrj.html`           | `obra-escritorio.jpg`                                                           | Ampliacao de laboratorio documentada; imagem ilustrativa.                                                           |
| `projetos/technip.html`        | `hero-fachada.webp`                                                             | Gerenciamento de reforma documentado; imagem ilustrativa.                                                           |
| Empresa                        | `sandro-ferreira.webp`                                                          | Retrato selecionado para esta pagina.                                                                               |
| Home (carrossel)               | `ilustrativa-obra-corporativa.webp`, `ilustrativa-obra-industrial.webp`, `ilustrativa-residencial.webp` | Ilustracoes ficticias dos servicos em destaque, com a etiqueta "Imagem ilustrativa". Nao representam obras executadas. |
| Home (carrossel)               | `obras/reforco-clinica-labs.webp`, `otimizada-sandro-obra.webp`                 | Obra realizada e registro de Sandro no canteiro. Confirmar que a foto de Sandro e real.                             |
| Home e A empresa               | `sandro-ferreira.webp` (640 px)                                                 | Retrato. Confirmar que e foto real; enviar versao maior (1200 px ou mais).                                          |

## Carrossel da home

O topo da home e um carrossel com cinco imagens (`HERO_SLIDES`): obras corporativas, obras industriais e construcao de casas (ilustracoes), Clinica LAB'S (obra realizada) e Sandro em campo. Cada slide tem etiqueta, titulo, linha de apoio e link. Use imagens com 1600 px ou mais de largura e uma versao `-960.webp` para celular (`srcset`). O enquadramento de cada imagem fica em `data-position` (por exemplo `62% 50%`), aplicado pelo JavaScript.

As ilustracoes `ilustrativa-obra-corporativa`, `ilustrativa-obra-industrial` e `ilustrativa-sala-tecnica` foram desenhadas para o site e sao ficticias. Elas aparecem sempre como imagem ilustrativa ou area de atuacao, nunca no lugar da foto de uma obra com nome de cliente. Quando houver foto real de uma obra corporativa ou industrial, troque o slide e a etiqueta.

`ilustrativa-residencial.webp` tambem aparece na pagina Servicos. Uma mesma referencia pode ser usada em mais de um lugar: pesquise todas as ocorrencias antes de trocar o arquivo.

## Obras realizadas x áreas de atuação

- **Obras realizadas** (Obras, home e fichas com "Tipo: Obra realizada"): Otávio Kelly, Campo da Areia, Clínica LAB'S, Salas da CBKC, Technip, UFRJ COPPETEC e Caminho seguro · Ipiranga.
- **Áreas de atuação** (seção "Áreas de atuação" em Serviços, fichas com "Tipo: Área de atuação"): Construção residencial e Salas técnicas e CPD. Usam imagens ilustrativas e não representam obras executadas.

As três obras da home (`#portfolio`, componente `work-card`) usam obras com foto real; troque-as quando houver casos mais fortes, sempre com fatos documentados. Cada página de serviço (`servicos/*.html`) também lista obras relacionadas.

Não mova uma área de atuação para "Obras realizadas" sem uma obra real, com cliente, local e escopo confirmados.

## Quando a foto real de uma obra chegar

A troca não muda layout, proporção nem componentes. Em cada lugar onde a obra aparece (home, Obras, fichas relacionadas e a própria ficha):

1. Troque `src` (e o `href` de ampliação, na ficha) pelo arquivo novo. Mantenha `width` e `height` proporcionais à foto.
2. Atualize o `alt` e o `data-caption` descrevendo o que a foto mostra.
3. Se o assunto ficar mal enquadrado no corte, use `data-focus="top"`, `"bottom"`, `"left"` ou `"right"` na `<img>`. Não use `style=""`: a política de segurança bloqueia estilos inline.
4. Atualize a coluna "Situação" do mapa acima.

## Ordem das obras em Obras

As obras aparecem em `obras.html` na ordem do `project-grid`, em linhas de três. Para mudar a ordem, mova o `<article class="work-card project-card">` desejado. Para incluir uma obra, copie um `<article>` inteiro e troque link, imagem, categoria (`data-category`), título, local e a linha "Atuação da Ferreira". O cartão "Não encontrou uma obra parecida" fica sempre por último.

As fichas têm, em comentário HTML, os blocos opcionais "Contexto e desafio" e "Resultado". Use-os somente com informações reais e autorizadas.

## Mais imagens na galeria

Use o bloco `gallery-grid` da ficha corporativa (`projetos/corporativo.html`) como modelo. Cada link com `data-lightbox`, `href` e `data-caption` entra automaticamente na navegacao da galeria, sem alterar o JavaScript. Nao duplique a foto da capa na grade: a capa ja faz parte da sequencia.

## Galeria de obras

A galeria fica em `obras.html#galeria` e é organizada por obra. O visitante escolhe uma categoria, abre a obra e vê a foto principal com as demais fotos do mesmo projeto logo abaixo. Cada obra também tem link direto, por exemplo `obras.html#album-otavio-kelly`.

Para incluir fotos em uma obra existente:

1. Siga os cuidados da seção "Troca de uma foto" (autorização, WebP, 1200 a 1800 px) e salve o arquivo em `assets/images/finais/`.
2. Em `obras.html`, dentro do `<article class="album">` da obra, acrescente um `<li>` com a `<img>` (com `src`, `alt` descritivo, `width`, `height` e `loading="lazy"`) na lista `album-photos`. A primeira foto da lista é a capa.

Para criar uma obra nova na galeria, copie um `<article class="album">` inteiro e troque `id` (`album-nome-da-obra`), `data-categoria`, título, linha de local e fotos. Use sempre a mesma grafia de categoria (por exemplo `Reforço estrutural`, `Residencial`, `Corporativo`): os botões de filtro são criados a partir dela.

Sem JavaScript, cada obra aparece como uma lista simples com todas as fotos.

## Origem dos dados

- `FPC (A4).pdf.pdf`, pagina 2: 25 anos de experiencia de Sandro Ferreira. Nao e a idade da empresa.
- Mesmo documento, pagina 4: empresas atendidas, trabalhos realizados diretamente ou em parceria e escopos institucionais. Os logos nao indicam endosso ou avaliacao dessas empresas.
- Galerias do site anterior: registros de reforco estrutural Otavio Kelly, Campo da Areia e Clinica LAB'S.
- Dados cadastrais e contatos preservados da versao anterior revisada. Ano de fundacao da empresa: 2019.

Nao acrescentar resultados, metragem, prazos, notas de clientes ou certificacoes sem comprovacao. Fotos melhoradas com IA nao devem alterar estrutura, acabamentos ou resultados para apresentar uma entrega que nao existiu.
