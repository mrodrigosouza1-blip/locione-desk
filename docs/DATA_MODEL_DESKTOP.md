# Entidades principais

## Account
* id
* name
* type
* initial_balance_cents

## CreditCard
* id
* name
* limit_total_cents
* limit_available_cents
* closing_day
* due_day

## Transaction
* id
* type
* amount_cents
* date
* competence_month
* account_id (opcional)
* credit_card_id (opcional)
* category_id (opcional)

## Category
* id
* name
* icon

## Goal
* id
* name
* type
* target_value_cents

## Budget
* id
* category_id
* month
* budget_cents

