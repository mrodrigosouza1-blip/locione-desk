# Como Funcionam os Módulos do Sistema

Este documento explica em detalhes como funcionam os principais módulos do sistema: **Cartões de Crédito**, **Contas**, **Dashboard** e **Metas**.

---

## 📊 Dashboard

O Dashboard é a tela principal do sistema, fornecendo uma visão consolidada da situação financeira.

### O que é exibido:

1. **Cards de Contas**
   - Lista todas as contas cadastradas
   - Mostra o saldo atual de cada conta
   - Calcula receitas e despesas do mês atual por conta
   - Clique no card para ver detalhes da conta

2. **Cards de Cartões de Crédito**
   - Lista todos os cartões cadastrados
   - Mostra a **fatura atual** (valor em aberto)
   - Mostra o **limite disponível**
   - Clique no card para ver detalhes do cartão

3. **Resumo Financeiro (3 cards)**
   - **Total de Receitas**: Soma de todas as receitas do mês
   - **Total de Despesas**: Soma de todas as despesas do mês
   - **Transações Recentes**: Contador de transações do período

4. **Transações Recentes**
   - Lista as 5 transações mais recentes
   - Mostra descrição, data, categoria e valor
   - Link para página completa de transações

5. **Resumo de Orçamentos**
   - Mostra o orçamento atual do mês
   - Exibe quanto foi gasto vs. orçamento definido
   - Barra de progresso visual
   - Indicadores de status (dentro do orçamento, excedido, crítico)

### Como funciona:

- **Atualização automática**: O dashboard escuta eventos de mudança de dados e atualiza automaticamente
- **Período**: Por padrão, mostra dados do mês atual
- **Cálculo de saldos**: Usa `accountRepository.getBalance()` para calcular saldos em tempo real
- **Cálculo de faturas**: Usa `creditCardRepository.getCurrentInvoice()` para calcular faturas atuais

### Arquivos relacionados:
- `src/ui/pages/Dashboard.tsx` - Interface principal
- `src/services/budgetSummary.ts` - Lógica de resumo de orçamentos

---

## 💳 Cartões de Crédito

O sistema gerencia cartões de crédito com controle de limite, faturas e ciclos de faturamento.

### Conceitos principais:

#### 1. **Limite Total e Limite Disponível**
- **Limite Total** (`limit_cents`): Limite máximo do cartão
- **Limite Disponível** (`limit_available_cents`): Limite que ainda pode ser usado
- Quando uma compra é feita, o limite disponível é reduzido automaticamente

#### 2. **Ciclo de Faturamento**
- Cada cartão tem um **dia de fechamento** (`closing_day`) e **dia de vencimento** (`due_day`)
- O sistema calcula automaticamente qual ciclo uma compra pertence baseado na data da compra
- **Competência** (`competence_month`): Mês em que a compra aparece na fatura (formato YYYY-MM)

#### 3. **Fatura Atual**
- A fatura atual contém todas as compras (`credit_card_charge`) do ciclo atual
- O valor da fatura = compras - pagamentos já realizados
- Pagamentos (`card_payment`) reduzem o valor da fatura

#### 4. **Compras Parceladas**
- Compras podem ser divididas em parcelas
- Cada parcela é uma transação separada com:
  - `installment_number`: Número da parcela (1, 2, 3...)
  - `installment_total`: Total de parcelas
  - `parent_transaction_id`: ID da primeira parcela (para agrupar)
- Cada parcela entra na fatura do mês correspondente à sua competência

### Regras de Negócio:

1. **Criação de Compra**:
   - Valida se há limite disponível suficiente
   - Cria transação do tipo `credit_card_charge` com valor negativo
   - Reduz automaticamente o limite disponível
   - Define a competência baseada na data da compra e dia de fechamento

2. **Pagamento de Fatura**:
   - Cria transação do tipo `card_payment` na conta escolhida
   - Aumenta o limite disponível do cartão
   - Reduz o valor da fatura atual

3. **Cálculo de Competência**:
   - Se a compra foi feita **antes ou no dia de fechamento** do mês: competência = mês da compra
   - Se a compra foi feita **depois do fechamento**: competência = próximo mês

### Exemplo prático:

```
Cartão: Limite R$ 5.000,00 | Fechamento: dia 10

Situação em 15/01:
- Compra de R$ 500 em 05/01 → Competência: 2024-01 (entra na fatura de janeiro)
- Compra de R$ 300 em 12/01 → Competência: 2024-01 (entra na fatura de janeiro)
- Compra de R$ 200 em 15/01 → Competência: 2024-02 (entra na fatura de fevereiro)

Fatura de Janeiro (fecha dia 10/02):
- Total: R$ 800 (500 + 300)
- Limite disponível: R$ 4.200 (5.000 - 800)
```

### Arquivos relacionados:
- `src/infra/repositories/creditCardRepository.ts` - CRUD de cartões
- `src/domain/invoiceService.ts` - Cálculo de faturas e ciclos
- `src/domain/billingCycle.ts` - Lógica de ciclos de faturamento
- `src/ui/pages/CreditCardsPage.tsx` - Lista de cartões
- `src/ui/pages/CreditCardDetailPage.tsx` - Detalhes do cartão

---

## 💰 Contas

Contas representam contas bancárias, carteiras ou outros meios de armazenar dinheiro.

### Tipos de Conta:

- **checking**: Conta corrente
- **savings**: Poupança
- **investment**: Investimentos
- **other**: Outros

### Conceitos principais:

#### 1. **Saldo Inicial**
- Cada conta tem um `initial_balance_cents` (saldo inicial)
- Usado como base para calcular o saldo atual

#### 2. **Cálculo de Saldo**
```
Saldo Atual = Saldo Inicial + Soma de todas as transações da conta
```

#### 3. **Saldo com e sem Metas**
- **Saldo sem Metas**: Exclui transações de depósito/resgate de metas (`goal_deposit`, `goal_withdraw`)
- **Saldo com Metas**: Saldo normal + saldo do cofre de metas da mesma moeda
- O sistema cria automaticamente uma conta "Cofre Metas" por moeda para armazenar valores das metas

### Tipos de Transações em Contas:

1. **income**: Receita (valor positivo)
2. **expense**: Despesa (valor negativo)
3. **transfer**: Transferência entre contas (cria 2 transações vinculadas)
4. **goal_deposit**: Depósito em meta (retira da conta, vai para o cofre)
5. **goal_withdraw**: Resgate de meta (retira do cofre, volta para a conta)

### Regras de Negócio:

1. **Criação de Transação**:
   - Receitas são sempre positivas
   - Despesas são sempre negativas
   - O sistema ajusta automaticamente o sinal se necessário

2. **Transferências**:
   - Cria 2 transações vinculadas pelo `transfer_id`
   - Uma na conta origem (negativa) e outra na conta destino (positiva)
   - Ambas têm o mesmo valor absoluto

3. **Exclusão de Conta**:
   - **Sem cascade**: Transações são desvinculadas (account_id = null)
   - **Com cascade**: Transações são excluídas permanentemente

### Arquivos relacionados:
- `src/infra/repositories/accountRepository.ts` - CRUD de contas e cálculos de saldo
- `src/ui/pages/AccountsPage.tsx` - Lista de contas
- `src/ui/pages/AccountDetailPage.tsx` - Detalhes da conta

---

## 🎯 Metas

Metas permitem economizar dinheiro para objetivos específicos, com diferentes estratégias de poupança.

### Tipos de Meta:

#### 1. **Por Passos** (`steps`)
- Divide o valor total em passos
- Dois modos:
  - **Valor fixo por passo**: Cada passo tem o mesmo valor
  - **Progressivo**: Valor aumenta conforme o número do passo (passo 1 = R$ 1, passo 2 = R$ 2, etc.)

#### 2. **Por Mês** (`monthly`)
- Economiza em meses específicos do ano
- Dois modos:
  - **Valor fixo por dia**: Deposita o mesmo valor todos os dias do mês selecionado
  - **Por número do dia**: Valor = número do dia (dia 1 = R$ 1, dia 15 = R$ 15, etc.)

#### 3. **Livre** (`free`)
- Sem regras específicas
- Usuário deposita quando e quanto quiser

### Como Funciona:

#### 1. **Cofre Central**
- Todas as metas compartilham um "cofre central" por moeda
- Quando você deposita em uma meta, o dinheiro sai da conta e vai para o cofre
- O cofre é uma conta especial do sistema (`is_system = true`, nome: "Cofre Metas")

#### 2. **Depósitos**
- Ao depositar em uma meta:
  1. Cria transação `goal_deposit` na conta origem (negativa)
  2. Cria movimento de depósito na meta
  3. Atualiza `deposited_amount` da meta
  4. O dinheiro fica no cofre central

#### 3. **Resgates**
- Ao resgatar de uma meta:
  1. Valida se há saldo suficiente na meta
  2. Cria transação `goal_withdraw` na conta destino (positiva)
  3. Cria movimento de resgate na meta
  4. Reduz `deposited_amount` da meta
  5. O dinheiro volta do cofre para a conta escolhida

#### 4. **Cálculo de Saldo da Meta**
```
Saldo da Meta = Soma de depósitos - Soma de resgates
```

### Exemplo prático:

```
Meta: "Viagem para Europa" - R$ 10.000
Tipo: Por Passos (10 passos de R$ 1.000)

Passo 1: Depósito de R$ 1.000
- Conta "Banco" → -R$ 1.000
- Cofre Metas → +R$ 1.000
- Meta "Viagem" → deposited_amount = R$ 1.000

Passo 5: Depósito de R$ 1.000
- Conta "Banco" → -R$ 1.000
- Cofre Metas → +R$ 2.000 (total)
- Meta "Viagem" → deposited_amount = R$ 5.000

Saldo da Meta: R$ 5.000 (50% do objetivo)
```

### Regras de Negócio:

1. **Criação de Meta**:
   - Define nome, tipo, valor alvo e configuração
   - `deposited_amount` inicia em 0
   - Configuração é armazenada como JSON no campo `config`

2. **Sugestão de Depósito**:
   - Sistema sugere valor baseado no tipo e configuração da meta
   - Para "Por Passos" progressivo: sugere valor = número do passo × 100
   - Para "Por Mês" por número: sugere valor = número do dia × 100

3. **Resgate**:
   - Não permite resgatar mais do que o saldo disponível
   - Saldo nunca pode ser negativo

4. **Moeda**:
   - Cada meta tem uma moeda específica
   - Depósitos/resgates devem ser na mesma moeda
   - Cofre central é separado por moeda

### Arquivos relacionados:
- `src/infra/repositories/goalRepository.ts` - CRUD de metas e movimentos
- `src/domain/goals/goalService.ts` - Lógica de negócio (cálculos, sugestões)
- `src/ui/pages/GoalsPage.tsx` - Lista e gerenciamento de metas
- `src/ui/components/GoalDetailsModal.tsx` - Modal de detalhes da meta

---

## 🔄 Integração entre Módulos

### Transações como Conector

As **transações** são o elemento central que conecta todos os módulos:

- **Contas ↔ Transações**: Contas têm transações que alteram seu saldo
- **Cartões ↔ Transações**: Compras e pagamentos são transações vinculadas ao cartão
- **Metas ↔ Transações**: Depósitos e resgates são transações especiais

### Fluxo de Dados:

```
Dashboard
  ├─> Carrega Contas → accountRepository.findAll()
  ├─> Calcula Saldos → accountRepository.getBalance()
  ├─> Carrega Cartões → creditCardRepository.findAll()
  ├─> Calcula Faturas → creditCardRepository.getCurrentInvoice()
  └─> Carrega Transações → transactionRepository.findAll()

Conta Detalhada
  ├─> Mostra Saldo → accountRepository.getBalance()
  ├─> Lista Transações → transactionRepository.findAll({ accountId })
  └─> Mostra Saldo com Metas → accountRepository.getBalance() + cofre

Cartão Detalhado
  ├─> Mostra Fatura → invoiceService.getCurrentInvoice()
  ├─> Lista Compras → transactionRepository.findAll({ creditCardId })
  └─> Atualiza Limite → creditCardRepository.updateAvailableLimit()

Meta Detalhada
  ├─> Mostra Saldo → goalService.getGoalBalanceCents()
  ├─> Lista Movimentos → goalRepository.getMovements()
  └─> Depósito/Resgate → Cria transações goal_deposit/goal_withdraw
```

---

## 📝 Notas Importantes

1. **Valores em Centavos**: Todo o sistema trabalha com valores em centavos (inteiros) para evitar problemas de precisão com ponto flutuante

2. **Competência vs Data**: 
   - `date`: Data real da transação
   - `competence_month`: Mês em que a transação aparece na fatura/relatório

3. **Sincronização**: O sistema usa eventos (`appEvents`) para sincronizar atualizações entre componentes

4. **Moedas**: Cada conta, cartão e meta pode ter uma moeda diferente. O sistema suporta múltiplas moedas simultaneamente

5. **Cofre de Metas**: É criado automaticamente quando necessário. Uma conta "Cofre Metas" existe por moeda e é gerenciada pelo sistema

---

## 🛠️ Arquivos Principais por Módulo

### Dashboard
- `src/ui/pages/Dashboard.tsx`
- `src/services/budgetSummary.ts`

### Cartões
- `src/infra/repositories/creditCardRepository.ts`
- `src/domain/invoiceService.ts`
- `src/domain/billingCycle.ts`
- `src/ui/pages/CreditCardsPage.tsx`
- `src/ui/pages/CreditCardDetailPage.tsx`

### Contas
- `src/infra/repositories/accountRepository.ts`
- `src/ui/pages/AccountsPage.tsx`
- `src/ui/pages/AccountDetailPage.tsx`

### Metas
- `src/infra/repositories/goalRepository.ts`
- `src/domain/goals/goalService.ts`
- `src/ui/pages/GoalsPage.tsx`
- `src/ui/components/GoalDetailsModal.tsx`

### Transações (Comum)
- `src/infra/repositories/transactionRepository.ts`
- `src/ui/pages/TransactionsPage.tsx`
