/**
 * Constantes com todas as keys de tradução para Licença.
 */
export const LK = {
  title: "license.title",
  subtitle: "license.subtitle",
  currentPlan: "license.currentPlan",
  activateLicense: "license.activateLicense",
  
  plan: {
    free: "license.plan.free",
    annual: "license.plan.annual",
    lifetime: "license.plan.lifetime",
  },
  
  planDescription: {
    free: "license.planDescription.free",
    annual: "license.planDescription.annual",
    lifetime: "license.planDescription.lifetime",
  },
  
  active: "license.active",
  inactive: "license.inactive",
  expired: "license.expired",
  
  activatedAt: "license.activatedAt",
  expiresAt: "license.expiresAt",
  licenseId: "license.licenseId",
  
  tokenLabel: "license.tokenLabel",
  tokenPlaceholder: "license.tokenPlaceholder",
  tokenNote: "license.tokenNote",
  tokenRequired: "license.tokenRequired",
  
  activate: "license.activate",
  activateAnnual: "license.activateAnnual",
  activateLifetime: "license.activateLifetime",
  activating: "license.activating",
  deactivate: "license.deactivate",
  clear: "license.clear",
  activateFree: "license.activateFree",
  
  freeTest: "license.freeTest",
  freeTestDescription: "license.freeTestDescription",
  
  activated: "license.activated",
  freeActivated: "license.freeActivated",
  deactivated: "license.deactivated",
  
  invalidToken: "license.invalidToken",
  signatureInvalid: "license.signatureInvalid",
  productMismatch: "license.productMismatch",
  customerEmail: "license.customerEmail",
  errorLoading: "license.errorLoading",
  errorActivating: "license.errorActivating",
  errorDeactivating: "license.errorDeactivating",
  
  // CRL (Certificate Revocation List)
  statusRevoked: "license.status.revoked",
  statusRevokedDetails: "license.status.revokedDetails",
  refreshStatus: "license.actions.refreshStatus",
  refreshing: "license.actions.refreshing",
  crlUpdated: "license.messages.crlUpdated",
  crlUpdateFailed: "license.messages.crlUpdateFailed",
  crlLastUpdated: "license.messages.crlLastUpdated",
  revokedAt: "license.revokedAt",
  reason: "license.reason",
  copyToken: "license.copyToken",
  tokenCopied: "license.tokenCopied",
  tokenCopyFailed: "license.tokenCopyFailed",
  
  // Online revocation check
  onlineStatus: "license.onlineStatus",
  onlineModeToggle: "license.onlineModeToggle",
  onlineModeDescription: "license.onlineModeDescription",
  onlineStatusLabel: "license.onlineStatusLabel",
  onlineStatusActive: "license.onlineStatusActive",
  onlineStatusRevoked: "license.onlineStatusRevoked",
  onlineStatusUnknown: "license.onlineStatusUnknown",
  onlineLastCheck: "license.onlineLastCheck",
  onlineRevokedDetails: "license.onlineRevokedDetails",
  onlineCheckNow: "license.onlineCheckNow",
  onlineCheckCompleted: "license.onlineCheckCompleted",
  onlineCheckFailed: "license.onlineCheckFailed",
  onlineModeEnabled: "license.onlineModeEnabled",
  onlineModeDisabled: "license.onlineModeDisabled",
  
  // Actions
  actions: {
    openPlansSite: "license.actions.openPlansSite",
  },
  
  // Messages
  messages: {
    openSiteFailed: "license.messages.openSiteFailed",
  },
} as const;

