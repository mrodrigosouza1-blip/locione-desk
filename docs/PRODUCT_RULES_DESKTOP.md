# 1. Visão geral do produto
Este projeto é um aplicativo financeiro pessoal DESKTOP, totalmente offline, com banco de dados local, sem qualquer sincronização em nuvem.
Objetivo principal: Permitir controle financeiro realista e confiável de contas bancárias, cartões de crédito, lançamentos, metas, orçamentos e relatórios, respeitando regras do mundo real.
Plataforma alvo:
* Desktop apenas
* Offline-first
* Banco de dados local (ex: SQLite)
* Sem mobile, sem cloud

# 2. Regras fundamentais de dinheiro
## 2.1 Representação de valores
* Todo valor monetário é armazenado como inteiro em centavos
* Exemplo:
    * R$ 10,50 → 1050
* Nunca armazenar float como valor final
## 2.2 Sinal dos valores
* Entrada (receita): valor positivo
* Saída (despesa): valor negativo
## 2.3 Datas
Toda movimentação possui:
* date: data real do evento
* competence_month: mês/ano contábil usado para relatórios
Por padrão:
* competence_month = mês de date
* Pode ser ajustado manualmente (ex: fatura, correção)

# 3. Tipos de lançamentos
Tipos permitidos:
* income – receita
* expense – despesa
* transfer – transferência entre contas
* credit_card_charge – compra no cartão
* card_payment – pagamento de fatura
* goal_deposit – depósito em meta
* goal_withdraw – resgate de meta

# 4. Dashboard — "VISÃO GERAL"
Cards exibidos:
## 4.1 Dinheiro disponível (por conta)
* Mostrado separadamente por conta
* Inclui:
    * saldo normal
    * saldo de metas
* Exibe:
    * saldo total
    * saldo sem metas
    * saldo com metas
* Clique no card → abre detalhe da conta
## 4.2 Receitas (por conta)
* Total de receitas no período selecionado
* Separadas por conta
## 4.3 Despesas (por conta)
* Total de despesas no período
* Separadas por conta
## 4.4 Cartões de crédito
* Para cada cartão:
    * fatura atual
    * limite disponível
* Cartão NÃO entra no dinheiro disponível
* Clique no card → abre detalhe do cartão
## 4.5 Últimos lançamentos
* Mostrar no máximo 5
* Clique → abre detalhe/edição
## 4.6 Atalhos
* Nova transação
* Contas
* Categorias
* Relatórios
## 4.7 Orçamento (resumo)
* Mostrar orçamentos ativos
* Destaque para o mais crítico

# 5. Contas (core)
## 5.1 Tipos de conta
* Conta corrente
* Poupança
* Dinheiro
* Outras
## 5.2 Regras
* Conta possui:
    * saldo inicial
    * lançamentos associados
* Saldo da conta:

saldo = saldo_inicial + soma(lançamentos)
## 5.3 Páginas
* Lista de contas
* Detalhe da conta
* Criar / Editar conta

# 6. Cartões de crédito (separado de contas)
## 6.1 Criação do cartão
Campos obrigatórios:
* nome
* limite total
* limite disponível inicial
* dia de fechamento
* dia de vencimento
O limite disponível inicial pode ser menor que o limite total A base de cálculo sempre parte do limite disponível informado
## 6.2 Regras de fatura
* Compras feitas após o fechamento entram na próxima fatura
* Fatura atual soma apenas compras daquele ciclo
## 6.3 Limite
* Compras reduzem limite disponível
* Pagamentos aumentam limite disponível
* Bloquear lançamento se limite disponível for insuficiente
## 6.4 Pagamentos de fatura
Tipos:
* pagamento total
* pagamento parcial
* pagamento antecipado
Regras:
* usuário escolhe qual conta paga
* pagamento gera lançamento na conta
* pagamento afeta fatura e limite
## 6.5 Páginas
* Lista de cartões
* Detalhe do cartão
* Criar / Editar cartão

# 7. Parcelamento no cartão
* Compra pode ser:
    * à vista
    * parcelada (Nx)
Regras:
* Parcelamento gera N lançamentos futuros
* Cada parcela possui seu competence_month
* Limite é reduzido pelo valor total da compra
* Fatura atual soma apenas parcelas do ciclo

# 8. Importações (extrato / recibo)
## Disponibilidade
Botão Importar deve existir em:
1. Tela de lançamentos (lista)
2. Modal de lançamento da conta
3. Modal de lançamento do cartão
## Fluxo padrão
1. Importar extrato ou recibo
2. Ler dados automaticamente
3. Mostrar prévia
4. Todos os campos são editáveis
5. Usuário confirma:
    * tipo
    * valor
    * data
    * conta OU cartão
6. Salvar
## Regras
* Extrato pode gerar múltiplos lançamentos
* Recibo geralmente gera 1
* Em cartão:
    * permitir parcelamento antes de salvar
    * validar limite disponível

# 9. Categorias
## Regras
* Categoria possui:
    * nome
    * ícone
* Categoria "Sem categoria" sempre existe
* Sugestão automática por descrição (regra local)
## Páginas
* Lista
* Criar / Editar

# 10. Metas
## Tipos
### 10.1 Meta por Passos
* Passos agrupados de 25 em 25
* Dois modos:
    * valor fixo por passo
    * valor = número do passo
### 10.2 Meta por Mês
* Usuário escolhe os meses
* Dois modos:
    * valor fixo por dia
    * valor = número do dia
### 10.3 Meta Livre
* Valor total definido
* Depósitos livres
## Regras comuns
* Metas são livres
* Usuário deposita quando quiser
* Cada meta cria:
    * um cofrinho próprio
* Existe um cofre central
* Dinheiro de metas:
    * entra no dinheiro disponível
    * aparece separado no detalhe da conta
## Resgate
* Meta possui botão "Resgatar"
* Usuário escolhe para qual conta vai

# 11. Orçamento
## Regras
* Orçamento mensal
* Por categoria
* Campos:
    * orçamento
    * gasto
    * progresso
    * restante
    * comparação com mês anterior
## Páginas
* Lista (somente ativos)
* Criar / Editar

# 12. Relatórios
## Filtros
* período (7/15/30 ou custom)
* conta ou cartão
* moeda
## Blocos
* Gastos por categoria (top 5)
* Evolução (até 5 dias)
* Top gastos do mês (top 5)
## Ações
* Exportar CSV
* Exportar PDF
* Imprimir
* Salvar

# 13. Configurações
* Moeda padrão (BRL, EUR, USD…)
* Formato de data (DD/MM/AAAA)
* Backup local
* Importação de backup

