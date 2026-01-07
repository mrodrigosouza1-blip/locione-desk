# Checklist de Release - LociOne Desk

Este documento lista os passos obrigatórios para criar e validar um build de produção.

---

## A) Pré-Build

- [ ] Limpar builds anteriores:
  ```bash
  rm -rf dist release
  ```
  Ou usar o script:
  ```bash
  pnpm run release:clean
  ```

- [ ] Verificar versões:
  ```bash
  pnpm -v
  node -v
  ```

- [ ] Instalar dependências (se necessário):
  ```bash
  pnpm install
  ```

- [ ] Verificar TypeScript (opcional, mas recomendado):
  ```bash
  pnpm run typecheck
  ```

---

## B) Build

- [ ] Executar build completo:
  ```bash
  pnpm run build
  ```

- [ ] Validar que a pasta `release/` foi criada

- [ ] Confirmar que `release/` contém os artifacts esperados:
  - [ ] macOS: `LociOne Desk-*.dmg` (instalador DMG)
  - [ ] Windows: `LociOne Desk Setup *.exe` (instalador NSIS)
  - [ ] Linux: `LociOne Desk-*.AppImage` (executável AppImage)

---

## C) Smoke Test no App Empacotado

**IMPORTANTE:** Todos os testes devem ser executados no app instalado/rodando do `release/`, NÃO no modo dev.

### Atalhos de Teclado
- [ ] `Ctrl/Cmd + ,` → abre Configurações
- [ ] `Ctrl/Cmd + L` → abre Licença/Planos
- [ ] `Ctrl/Cmd + K` → abre Quick Actions Modal
- [ ] Atalhos não disparam quando digitando em inputs

### Relatórios
- [ ] Acessar página de Relatórios
- [ ] Resumo visual aparece (período, totais de entrada/saída, saldo)
- [ ] Gráficos são renderizados corretamente
- [ ] **No FREE:**
  - [ ] Ações premium (Exportar PDF, Imprimir) estão bloqueadas
  - [ ] Ao clicar em ação premium, mostra mensagem `gate.*` **sem navegar automaticamente** para `/license`

### Backup
- [ ] Acessar Configurações > Backup
- [ ] Bloco informativo aparece (explicando o que é backup, onde fica, como restaurar)

### PIN Básico
- [ ] Acessar Configurações > Segurança
- [ ] Ativar PIN básico (4 dígitos)
- [ ] Fechar e reabrir o app
- [ ] App solicita PIN e desbloqueia corretamente

### About (Sobre)
- [ ] Acessar Sobre o App
- [ ] **Em PRODUÇÃO:**
  - [ ] "Diretório de Dados" mostra texto neutro: "Seus dados ficam armazenados neste computador." (ou tradução)
  - [ ] **NÃO** aparece path técnico (`/Users/...`, `C:\Users\...`, etc.)
  - [ ] "Plataforma" **NÃO** aparece

### Verificação "Sem Dev Leaks"
- [ ] "FREE (teste)" **NÃO** aparece em nenhum lugar
- [ ] Botão "Ativar FREE" **NÃO** aparece
- [ ] Nenhum caminho absoluto é exibido na UI

---

## D) Artefatos

### Localização
- Os artifacts ficam na pasta `release/` na raiz do projeto

### Nomes Esperados dos Arquivos

**macOS:**
- `LociOne Desk-{version}-{arch}.dmg`
- Exemplo: `LociOne Desk-1.0.0-arm64.dmg`
- Arquivo `.blockmap` pode aparecer (para atualizações)

**Windows:**
- `LociOne Desk Setup {version}.exe`
- Exemplo: `LociOne Desk Setup 1.0.0.exe`
- Arquivos `.blockmap` podem aparecer

**Linux:**
- `LociOne Desk-{version}-{arch}.AppImage`
- Exemplo: `LociOne Desk-1.0.0-x86_64.AppImage`

### Verificação Rápida
```bash
ls -lh release/
```

---

## Comandos Rápidos

```bash
# Limpar builds anteriores
pnpm run release:clean

# Verificar TypeScript
pnpm run typecheck

# Build completo
pnpm run build

# Verificar artifacts gerados
ls -lh release/
```

---

## Notas

- Este checklist deve ser executado em cada plataforma alvo (macOS, Windows, Linux) antes do release.
- Em caso de falha em qualquer item, documentar o problema e corrigir antes de considerar o release válido.
