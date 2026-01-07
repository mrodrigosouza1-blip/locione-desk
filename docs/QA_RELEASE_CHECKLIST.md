# LociOne Desk — QA / Release Checklist (Desktop)

Data: ____/____/____
Versão: ____________

## 0) Pré-requisitos
- Node/pnpm ok
- Build limpa (sem overlays)
- Toast funcionando (sem alert)
- i18n ok (keys sem fallback estranho)

## 1) Comandos de validação (obrigatório)
Rodar na raiz do projeto:

- Typecheck Electron:
  pnpm run typecheck:electron

- Varredura de logs (deve estar controlado / centralizado):
  rg -n "(DEBUG ROUTE|console\.log|console\.warn|console\.error)" src electron

- Build:
  pnpm run build

- Build Electron (ajuste se seu script tiver outro nome):
  pnpm run electron:build

## 2) Fluxos críticos (não pode falhar)
### 2.1 Boot do app
- Abrir app (build e dev)
  Esperado: carrega banco → abre Dashboard
  Erro: toast “Não foi possível iniciar” + opção de diagnóstico (sem tela branca)

### 2.2 PIN (segurança)
- Cenário A: PIN DESATIVADO
  - Abrir app → NÃO pede PIN
- Cenário B: Ativar PIN nas Configurapp → abrir → pede PIN
- Cenário C: Desativar PIN
  - Desativar → abrir → NÃO pede PIN
- Cenário D: PIN errado
  - Tentativas falham → toast amigável (sem travar)

### 2.3 Relatórios / Exportações
- Exportar PDF:
  - Sucesso: toast “Exportação concluída”
  - Falha: toast “Não foi possível exportar” (sem crash)

### 2.4 Backup / Restore
- Criar backup:
  - Sucesso: arquivo criado + toast
  - Falha: toast “Não foi possível criar backup”
- Restaurar backup:
  - Sucesso: dados presentes após reload
  - Falha: toast “Não foi possível restaurar backup”

## 3) Persistência / Dados (onde mora a dor)
### 3.1 DB ausente
- Simular:
  - Apagar arquivo do DB (em userData) OU limpar storage fallback
- Esperado:
  - App recria DB e segue
  - toast informativo opcional (“Base recriada”)

### 3.2 DB corrompido / inválido
- Simular:
  - Escrever lixo no arquivo do DB ou invalidar JSON
- Esperado:
  - App não crasha
  - Abre Diagnostics (ou oferece “Reparar / Resetar”)
  -Simular:
  - Remover settings, setar valores inválidos
- Esperado:
  - fallback seguro
  - UI continua funcional

## 4) Smoke test rápido (2 minutos)
- Abre app
- Vai em Transações → cria 1 lançamento
- Vai em Dashboard → vê refletir
- Vai em Relatórios → exporta PDF
- Vai em Settings → toggle PIN (se aplicável) e volta

## 5) Critérios de aprovação (release OK)
- Sem crash
- Sem tela bloqueada indevida
- Todos erros viram toast + logger
- typecheck:electron ok
- build ok
