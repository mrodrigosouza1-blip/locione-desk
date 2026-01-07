/**
 * Constantes com todas as keys de tradução para modais de PIN.
 */
export const PK = {
  setup: {
    title: "pin.setup.title",
    titleChange: "pin.setup.titleChange",
    description: "pin.setup.description",
    descriptionChange: "pin.setup.descriptionChange",
    label: "pin.setup.label",
    confirmLabel: "pin.setup.confirmLabel",
    placeholder: "pin.setup.placeholder",
    confirmPlaceholder: "pin.setup.confirmPlaceholder",
    errors: {
      minLength: "pin.setup.errors.minLength",
      mismatch: "pin.setup.errors.mismatch",
      hashError: "pin.setup.errors.hashError",
    },
    actions: {
      cancel: "pin.setup.actions.cancel",
      confirm: "pin.setup.actions.confirm",
      saving: "pin.setup.actions.saving",
    },
  },
  verify: {
    title: "pin.verify.title",
    description: "pin.verify.description",
    label: "pin.verify.label",
    placeholder: "pin.verify.placeholder",
    errors: {
      incorrect: "pin.verify.errors.incorrect",
      verifyError: "pin.verify.errors.verifyError",
    },
    actions: {
      cancel: "pin.verify.actions.cancel",
      confirm: "pin.verify.actions.confirm",
      verifying: "pin.verify.actions.verifying",
    },
  },
} as const;


