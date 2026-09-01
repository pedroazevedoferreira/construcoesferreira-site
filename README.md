# Ferreira Projetos e Construcoes

Site institucional estatico desenvolvido com HTML, CSS e JavaScript puro.

## Requisitos

- Qualquer servidor HTTP estatico (opcional para desenvolvimento)

## Executar localmente

Abra `index.html` diretamente no navegador ou use um servidor HTTP local.

Exemplo com Python:

```bash
python -m http.server 8000
```

Abra no navegador o endereco exibido pelo terminal.

## Estrutura principal

- `index.html`: pagina inicial
- `sobre.html`, `servicos.html`, `obras.html`, `contato.html`: paginas internas
- `css/styles.css`: estilos globais e responsivos
- `js/main.js`: comportamentos pequenos, sem bibliotecas externas
- `assets/`: imagens, fontes e favicon

O projeto nao contem banco de dados, painel administrativo, credenciais ou formularios processados pelo servidor. Os contatos sao encaminhados por links externos.
