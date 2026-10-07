# Fotos e portfolio

O layout esta pronto. As imagens de referencia estao identificadas no site e nao comprovam a execucao dos projetos citados. Nao remover os avisos antes de substituir as fotos por registros da respectiva obra.

## Troca de uma foto

1. Separe uma foto com autorizacao de uso e confirme a qual obra pertence. Evite documentos legiveis, dados de terceiros e pessoas sem autorizacao.
2. Exporte em WebP, de preferencia entre 1200 e 1800 px no lado maior. Nao aumente artificialmente uma foto pequena para simular detalhes tecnicos.
3. Coloque em `assets/images/finais/` com nome simples, sem espacos, por exemplo `cbkc-sala-reuniao.webp`.
4. Na ficha abaixo, atualize o `src` da foto e o `href` do link de ampliacao. Atualize tambem o `alt`, `data-caption`, o aviso da imagem e `og:image` quando for a capa.
5. Procure o nome antigo do arquivo no projeto e atualize os cards da home, Obras e projetos relacionados. Preserve `width` e `height` proporcionais a foto.
6. Abra a home, o filtro correspondente e a ficha em celular e desktop, nos dois temas. Confira o enquadramento e a ampliacao.

Nao apague imagens antigas enquanto houver referencias a elas. Nenhuma compilacao e necessaria.

## Mapa das imagens

| Ficha                          | Imagem atual                                                                    | Situacao                                                                                                            |
| ------------------------------ | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Home                           | `ilustrativa-corporativo.webp`                                                  | Ilustrativa; substituir por uma boa foto horizontal autorizada.                                                     |
| `projetos/corporativo.html`    | `otimizada-sala-reuniao.webp`, `otimizada-recepcao.webp`, `obra-escritorio.jpg` | A reforma das salas da CBKC e documentada no PDF. Estas fotos nao foram confirmadas como sendo dessa obra.          |
| `projetos/residencial.html`    | `ilustrativa-residencial.webp`                                                  | Area de atuacao, nao um projeto especifico executado. Ao criar um caso real, atualizar tambem nome, local e escopo. |
| `projetos/otavio-kelly.html`   | `obras/reforco-otavio-kelly.webp`                                               | Registro da galeria institucional anterior.                                                                         |
| `projetos/campo-da-areia.html` | `obras/reforco-campo-da-areia.webp`                                             | Registro da galeria institucional anterior.                                                                         |
| `projetos/clinica-labs.html`   | `obras/reforco-clinica-labs.webp`                                               | Registro da galeria institucional anterior.                                                                         |
| `projetos/salas-tecnicas.html` | `otimizada-cpd.webp`                                                            | Referencia de servico; sem atribuicao a cliente.                                                                    |
| `projetos/acessibilidade.html` | `otimizada-acessibilidade.webp`                                                 | Caminho seguro da Ipiranga documentado; foto de referencia, nao comprovada como sendo do local.                     |
| `projetos/ufrj.html`           | `obra-escritorio.jpg`                                                           | Ampliacao de laboratorio documentada; imagem ilustrativa.                                                           |
| `projetos/technip.html`        | `hero-fachada.webp`                                                             | Gerenciamento de reforma documentado; imagem ilustrativa.                                                           |
| Empresa                        | `sandro-ferreira.webp`                                                          | Retrato selecionado para esta pagina.                                                                               |
| Home                           | `otimizada-sandro-obra.webp`                                                    | Registro de Sandro no canteiro enviado pelo usuario.                                                                |

`ilustrativa-residencial.webp` tambem aparece na pagina Servicos. Uma mesma referencia pode ser usada em mais de um lugar: pesquise todas as ocorrencias antes de trocar o arquivo.

## Obras realizadas x áreas de atuação

- **Obras realizadas** (Obras, home e fichas com "Tipo: Obra realizada"): Otávio Kelly, Campo da Areia, Clínica LAB'S, Salas da CBKC, Technip, UFRJ COPPETEC e Caminho seguro · Ipiranga.
- **Áreas de atuação** (seção própria em Obras, fichas com "Tipo: Área de atuação"): Construção residencial e Salas técnicas e CPD. Usam imagens ilustrativas e não representam obras executadas.

Ao incluir ou retirar uma obra realizada, atualize também o número "7" da faixa de experiência na home (`experience-grid`).

Não mova uma área de atuação para "Obras realizadas" sem uma obra real, com cliente, local e escopo confirmados.

## Quando a foto real de uma obra chegar

A troca não muda layout, proporção nem componentes. Em cada lugar onde a obra aparece (home, Obras, fichas relacionadas e a própria ficha):

1. Troque `src` (e o `href` de ampliação, na ficha) pelo arquivo novo. Mantenha `width` e `height` proporcionais à foto.
2. Atualize o `alt` e o `data-caption` descrevendo o que a foto mostra.
3. Remova a etiqueta `<span class="image-label">Imagem ilustrativa</span>` do card.
4. Na ficha, troque a legenda da capa para "Registro da obra." e a linha "Imagem" da ficha técnica para "Registro da obra". Ajuste o texto de `project-disclosure`.
5. Se o assunto ficar mal enquadrado no corte 4:3, use `data-focus="top"`, `"bottom"`, `"left"` ou `"right"` na `<img>`. Não use `style=""`: a política de segurança bloqueia estilos inline.

As fichas têm, em comentário HTML, os blocos opcionais "O desafio" e "Resultado". Use-os somente com informações reais e autorizadas.

## Mais imagens na galeria

Use o bloco `gallery-grid` da ficha corporativa como modelo. Cada link com `data-lightbox`, `href` e `data-caption` entra automaticamente na navegacao da galeria, sem alterar o JavaScript. Nao duplique a foto da capa na grade: a capa ja faz parte da sequencia.

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
