# LociOne Desk

Aplicativo financeiro pessoal desktop, totalmente offline, com banco de dados local.

## Descrição

O LociOne Desk é um aplicativo desktop para controle financeiro pessoal que funciona completamente offline, sem necessidade de conexão com a internet ou sincronização em nuvem. Todos os dados são armazenados localmente em um banco de dados SQLite.

## Funcionalidades

### Core
- **Dashboard (Visão Geral)**: Visão consolidada de contas, receitas, despesas, cartões e orçamentos
- **Contas**: Gerenciamento de contas correntes, poupança, dinheiro e outras
- **Cartões de Crédito**: Controle completo de cartões com limite, faturas e pagamentos
- **Lançamentos**: Registro de receitas, despesas, transferências e movimentações
- **Importações**: Importação de extratos e recibos com prévia editável
- **Categorias**: Organização de lançamentos por categorias
- **Metas**: Sistema de metas com cofrinhos separados
- **Orçamentos**: Controle de orçamento mensal por categoria
- **Relatórios**: Análises e exportação de dados
- **Configurações**: Personalização de moeda, data e backups

## Características

- ✅ 100% offline - sem nuvem
- ✅ Banco de dados local (SQLite)
- ✅ Desktop apenas - sem mobile
- ✅ Valores em centavos (inteiros)
- ✅ Competência contábil separada da data
- ✅ Parcelamento de compras no cartão
- ✅ Tema claro/escuro
- ✅ Backup local

## Como rodar localmente

### Pré-requisitos
- Node.js 18+
- Rust (para Tauri)

### Instalação
```bash
cd /Users/desktop/app/locione_desk
npm install
```

### Desenvolvimento

#### Rodar WEB + Electron juntos (recomendado)
```bash
pnpm dev:electron
```
Este comando automaticamente:
- Libera a porta 1420 se estiver ocupada
- Inicia o servidor Vite (WEB)
- Aguarda o servidor estar pronto
- Inicia o Electron

#### Rodar separadamente (dois terminais)

**Terminal 1 - WEB:**
```bash
pnpm dev:web:free
```
O script `dev:web:free` automaticamente libera a porta 1420 antes de iniciar o Vite.

**Terminal 2 - Electron:**
```bash
pnpm wait:web && pnpm electron:dev
```

#### Liberar porta 1420 manualmente
Se precisar liberar a porta 1420 manualmente:
```bash
npx kill-port 1420
```


### Build
```bash
npm run tauri build
```

## Estrutura do projeto

```
locione_desk/
 ├─ src/
 │   ├─ app/          # Componentes principais e rotas
 │   ├─ ui/           # Componentes de interface
 │   ├─ domain/       # Lógica de negócio e modelos
 │   ├─ infra/        # Banco de dados e persistência
 │   ├─ styles/       # Estilos e temas
 │   └─ main.tsx      # Ponto de entrada
 ├─ docs/             # Documentação do projeto (FONTE DA VERDADE)
 ├─ public/           # Arquivos estáticos
 ├─ README.md
 └─ package.json
```

## Documentação

⚠️ **IMPORTANTE**: A pasta `/docs` contém a documentação completa do projeto e é a **fonte da verdade** para todas as regras e funcionalidades:

- `PRODUCT_RULES_DESKTOP.md` - Regras de negócio e funcionalidades
- `UI_LAYOUT_DESKTOP.md` - Layout e padrões de interface
- `DATA_MODEL_DESKTOP.md` - Modelo de dados

Todas as implementações devem seguir fielmente os documentos em `/docs`.

## Tecnologias

- **Tauri** - Framework para aplicativos desktop
- **React** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **SQLite** - Banco de dados local
- **Vite** - Build tool

## Licença

Projeto privado - LociOne Desk

