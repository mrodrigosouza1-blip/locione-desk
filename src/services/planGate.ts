/**
 * Sistema centralizado de gates para controle de features por plano
 */

import { isPremium } from "./licenseGate";
import type { GateContext } from "./usageCounters";

export type GateKey =
  | "budgets.access"
  | "reports.access"
  | "accounts.create"
  | "creditCards.create"
  | "categories.create"
  | "goals.create"
  | "transactions.create"
  | "transactions.create.account"
  | "transactions.create.card"
  | "premium.pin"
  | "premium.alerts"
  | "premium.receipt_import"
  | "premium.secondary_currency"
  | "premium.backup";

export interface GateResult {
  ok: boolean;
  title?: string;
  reason?: string;
  cta?: "upgrade";
}

/**
 * Verifica se um gate está aberto (permitido)
 */
export function checkGate(gate: GateKey, ctx: GateContext): GateResult {
  // Se for Premium ativo, sempre permitir
  if (isPremium()) {
    return { ok: true };
  }
  
  // Regras do plano FREE
  switch (gate) {
    case "budgets.access":
      return {
        ok: false,
        title: "gate.budgets.title",
        reason: "gate.budgets.message",
        cta: "upgrade",
      };
    
    case "reports.access":
      return {
        ok: false,
        title: "gate.reports.title",
        reason: "gate.reports.message",
        cta: "upgrade",
      };
    
    case "accounts.create":
      if (ctx.accountsCount >= 1) {
        return {
          ok: false,
          title: "gate.accounts.title",
          reason: "gate.accounts.message",
          cta: "upgrade",
        };
      }
      return { ok: true };
    
    case "creditCards.create":
      if (ctx.creditCardsCount >= 1) {
        return {
          ok: false,
          title: "gate.creditCards.title",
          reason: "gate.creditCards.message",
          cta: "upgrade",
        };
      }
      return { ok: true };
    
    case "categories.create":
      if (ctx.categoriesCount >= 5) {
        return {
          ok: false,
          title: "gate.categories.title",
          reason: "gate.categories.message",
          cta: "upgrade",
        };
      }
      return { ok: true };
    
    case "goals.create":
      if (ctx.goalsCount >= 1) {
        return {
          ok: false,
          title: "gate.goals.title",
          reason: "gate.goals.message",
          cta: "upgrade",
        };
      }
      return { ok: true };
    
    case "transactions.create":
      if (ctx.totalTransactions >= 50) {
        return {
          ok: false,
          title: "gate.transactions.title",
          reason: "gate.transactions.message",
          cta: "upgrade",
        };
      }
      return { ok: true };
    
    case "transactions.create.account":
      // A regra mais restritiva prevalece
      if (ctx.totalTransactions >= 50) {
        return {
          ok: false,
          title: "gate.transactions.title",
          reason: "gate.transactions.message",
          cta: "upgrade",
        };
      }
      if (ctx.accountTransactions >= 25) {
        return {
          ok: false,
          title: "gate.transactions.account.title",
          reason: "gate.transactions.account.message",
          cta: "upgrade",
        };
      }
      return { ok: true };
    
    case "transactions.create.card":
      // A regra mais restritiva prevalece
      if (ctx.totalTransactions >= 50) {
        return {
          ok: false,
          title: "gate.transactions.title",
          reason: "gate.transactions.message",
          cta: "upgrade",
        };
      }
      if (ctx.cardTransactions >= 25) {
        return {
          ok: false,
          title: "gate.transactions.card.title",
          reason: "gate.transactions.card.message",
          cta: "upgrade",
        };
      }
      return { ok: true };
    
    case "premium.pin":
      return {
        ok: false,
        title: "gate.pin.title",
        reason: "gate.pin.message",
        cta: "upgrade",
      };
    
    case "premium.alerts":
      return {
        ok: false,
        title: "gate.alerts.title",
        reason: "gate.alerts.message",
        cta: "upgrade",
      };
    
    case "premium.receipt_import":
      return {
        ok: false,
        title: "gate.receiptImport.title",
        reason: "gate.receiptImport.message",
        cta: "upgrade",
      };
    
    case "premium.secondary_currency":
      return {
        ok: false,
        title: "gate.secondaryCurrency.title",
        reason: "gate.secondaryCurrency.message",
        cta: "upgrade",
      };
    
    case "premium.backup":
      return {
        ok: false,
        title: "gate.backup.title",
        reason: "gate.backup.message",
        cta: "upgrade",
      };
    
    default:
      return { ok: true };
  }
}

