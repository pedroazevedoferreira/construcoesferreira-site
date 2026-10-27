# Fotos e portfolio

O site usa cenas fotorrealistas como prévia visual. As fichas continuam descrevendo os trabalhos documentados, mas suas imagens não são registros das obras nomeadas. Não há selo visual nas imagens; os textos alternativos preservam essa distinção para leitores de tela. Retratos, marcas de clientes e parceiros foram preservados.

## Troca de uma foto

1. Separe uma foto com autorizacao de uso e confirme a qual obra pertence. Evite documentos legiveis, dados de terceiros e pessoas sem autorizacao.
2. Exporte em WebP, de preferencia entre 1200 e 1800 px no lado maior. Nao aumente artificialmente uma foto pequena para simular detalhes tecnicos.
3. Coloque em `assets/images/finais/` com nome simples, sem espacos, por exemplo `cbkc-sala-reuniao.webp`.
4. Na ficha abaixo, atualize o `src` da foto e o `href` do link de ampliacao. Atualize tambem o `alt`, `data-caption` e `og:image` quando for a capa.
5. Procure o nome antigo do arquivo no projeto e atualize os cards da home, Obras e projetos relacionados. Preserve `width` e `height` proporcionais a foto.
6. Abra a home, o filtro correspondente e a ficha em celular e desktop, nos dois temas. Confira o enquadramento e a ampliacao.

Nao apague imagens antigas enquanto houver referencias a elas. Nenhuma compilacao e necessaria.

## Mapa das imagens

| Uso / ficha                         | Imagens ilustrativas                                                                                           | Observação |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------- |
| Home e serviços                     | `ilustrativa-fachada-corporativa`, `ilustrativa-industrial`, `ilustrativa-residencial-v2`                     | Carrossel e cartões de áreas de atuação. |
| Reforço estrutural                   | `ilustrativa-reforco-metalico`, `ilustrativa-reforco-residencial`                                              | Prévia visual nas fichas e cartões; não retrata Otávio Kelly ou Campo da Areia. |
| Reforma de clínica                   | `ilustrativa-reforma-clinica`                                                                                 | Prévia visual; não retrata a Clínica LAB'S. |
| Escritórios corporativos             | `ilustrativa-sala-reuniao`, `ilustrativa-recepcao`                                                            | Prévia visual; não identifica a reforma da CBKC. |
| Áreas técnicas e acessibilidade      | `ilustrativa-sala-tecnica-v2`, `ilustrativa-acessibilidade-v2`                                                | Exemplos conceituais. |
| Laboratório e fachada corporativa    | `ilustrativa-laboratorio`, `ilustrativa-fachada-corporativa`                                                  | Prévia visual; não retrata UFRJ COPPETEC ou Technip. |
| Retrato da empresa                   | `sandro-ferreira.webp`                                                                                        | Retrato existente preservado. |
| Logos de empresas e parceiros        | `assets/images/logos/` e `parceiro-*`                                                                         | Marcas existentes preservadas. |

## Carrossel da home

O topo da home é um carrossel com cinco imagens (`HERO_SLIDES`): quatro cenas ilustrativas de serviços e obras, mais o retrato existente de Sandro no canteiro. Cada slide tem etiqueta, título, linha de apoio e link. As imagens principais têm versão `-960.webp` para celular (`srcset`). O enquadramento de cada imagem fica em `data-position` (por exemplo `62% 50%`), aplicado pelo JavaScript.

As imagens com prefixo `ilustrativa-` são cenas conceituais geradas para esta prévia e não representam obras executadas. Quando chegarem fotos reais, atualize arquivo, texto alternativo, legenda e referências de ampliação.

Uma mesma referência aparece em várias páginas. Pesquise todas as ocorrências antes de trocar ou remover um arquivo.

## Obras realizadas x áreas de atuação

- **Obras realizadas** (Obras, home e fichas com "Tipo: Obra realizada"): Otávio Kelly, Campo da Areia, Clínica LAB'S, Salas da CBKC, Technip, UFRJ COPPETEC e Caminho seguro · Ipiranga.
- **Áreas de atuação** (seção "Áreas de atuação" em Serviços, fichas com "Tipo: Área de atuação"): Construção residencial e Salas técnicas e CPD. Usam imagens ilustrativas e não representam obras executadas.

Os cartões e galerias de obras exibem imagens ilustrativas nesta prévia. Troque cada imagem pela foto real correspondente quando estiver disponível, mantendo os dados do projeto documentados.

Não mova uma área de atuação para "Obras realizadas" sem uma obra real, com cliente, local e escopo confirmados.

## Quando a foto real de uma obra chegar

A troca não muda layout, proporção nem componentes. Em cada lugar onde a obra aparece (home, Obras, fichas relacionadas e a própria ficha):

1. Troque `src`, `srcset` e o `href` de ampliação pelo arquivo novo. Mantenha `width` e `height` proporcionais à foto.
2. Atualize o `alt` e o `data-caption` descrevendo o que a foto mostra.
3. Se o assunto ficar mal enquadrado no corte, use `data-focus="top"`, `"bottom"`, `"left"` ou `"right"` na `<img>`. Não use `style=""`: a política de segurança bloqueia estilos inline.
4. Atualize este mapa com a situação da foto substituta.

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
