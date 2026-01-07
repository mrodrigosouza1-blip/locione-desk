/**
 * Constantes com todas as keys de tradução para o módulo Categories.
 */
export const CK = {
  // Títulos
  title: "categories.title",
  subtitle: "categories.subtitle",
  new: "categories.new",
  newCategory: "categories.newCategory",
  
  // Empty states
  empty: {
    title: "categories.empty.title",
    subtitle: "categories.empty.subtitle",
    onlySystem: "categories.empty.onlySystem",
    createFirst: "categories.empty.createFirst",
  },
  
  // Fields
  fields: {
    name: "categories.fields.name",
    icon: "categories.fields.icon",
  },
  
  // Modals
  modals: {
    create: {
      title: "categories.modals.create.title",
      namePlaceholder: "categories.modals.create.namePlaceholder",
    },
    edit: {
      title: "categories.modals.edit.title",
      systemNameNote: "categories.modals.edit.systemNameNote",
    },
  },
  
  // Actions
  actions: {
    edit: "categories.actions.edit",
    delete: "categories.actions.delete",
    create: "categories.actions.create",
    cancel: "categories.actions.cancel",
    save: "categories.actions.save",
  },
  
  // Messages
  messages: {
    deleteConfirm: "categories.messages.deleteConfirm",
    createError: "categories.messages.createError",
    updateError: "categories.messages.updateError",
    deleteError: "categories.messages.deleteError",
  },
  
  // Icon labels
  icons: {
    tag: "categories.icons.tag",
    shoppingCart: "categories.icons.shoppingCart",
    home: "categories.icons.home",
    car: "categories.icons.car",
    utensils: "categories.icons.utensils",
    heart: "categories.icons.heart",
    graduationCap: "categories.icons.graduationCap",
    music: "categories.icons.music",
    gamepad2: "categories.icons.gamepad2",
    briefcase: "categories.icons.briefcase",
    plane: "categories.icons.plane",
    coffee: "categories.icons.coffee",
    building: "categories.icons.building",
    dollarSign: "categories.icons.dollarSign",
  },
  
  // Search
  search: {
    placeholder: "categories.search.placeholder",
  },
} as const;

