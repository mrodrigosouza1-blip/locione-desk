import { getDatabase, saveDatabaseAsync } from "../database";
import type { Category, CreateCategoryDto, Transaction } from "../../domain/types";

export const categoryRepository = {
  async findAll(): Promise<Category[]> {
    const db = getDatabase();
    return db.categories.sort((a: Category, b: Category) => a.name.localeCompare(b.name));
  },

  async findById(id: number): Promise<Category | undefined> {
    const db = getDatabase();
    return db.categories.find((c: Category) => c.id === id);
  },

  async create(data: CreateCategoryDto): Promise<Category> {
    const db = getDatabase();
    
    // Validar nome duplicado (case-insensitive)
    const existing = db.categories.find(
      (c: Category) => c.name.toLowerCase() === data.name.toLowerCase()
    );
    if (existing) {
      throw new Error("Já existe uma categoria com este nome");
    }
    
    const newId = db.categories.length > 0 ? Math.max(...db.categories.map((c: Category) => c.id)) + 1 : 1;
    const category: Category = {
      id: newId,
      ...data,
      is_system: false, // Categorias criadas pelo usuário não são do sistema
      created_at: new Date().toISOString(),
    };
    db.categories.push(category);
    await saveDatabaseAsync();
    return category;
  },

  async update(id: number, data: Partial<CreateCategoryDto>): Promise<Category> {
    const db = getDatabase();
    const index = db.categories.findIndex((c: Category) => c.id === id);
    if (index === -1) throw new Error("Category not found");
    
    const category = db.categories[index];
    
    // Proteger categoria do sistema: não permitir alterar nome
    if (category.is_system || id === 1 || category.name === "Sem categoria") {
      // Permitir apenas alterar ícone
      if (data.name && data.name.toLowerCase() !== category.name.toLowerCase()) {
        throw new Error("Não é possível alterar o nome da categoria do sistema");
      }
    }
    
    // Validar nome duplicado (se estiver alterando o nome)
    if (data.name) {
      const name = data.name.trim();
      if (name && name.toLowerCase() !== category.name.toLowerCase()) {
        const existing = db.categories.find(
          (c: Category) => c.id !== id && c.name.toLowerCase() === name.toLowerCase()
        );
        if (existing) {
          throw new Error("Já existe uma categoria com este nome");
        }
      }
    }
    
    db.categories[index] = {
      ...db.categories[index],
      ...data,
    };
    await saveDatabaseAsync();
    return db.categories[index];
  },

  async delete(id: number): Promise<void> {
    const db = getDatabase();
    const category = db.categories.find((c: Category) => c.id === id);
    
    if (!category) {
      throw new Error("Categoria não encontrada");
    }
    
    // Bloquear exclusão de categorias do sistema
    if (category.is_system || id === 1 || category.name === "Sem categoria") {
      throw new Error("Não é possível deletar a categoria do sistema");
    }
    
    // Reatribuir transações para "Sem categoria" (id = 1)
    const semCategoria = db.categories.find((c) => c.id === 1 || c.name === "Sem categoria");
    if (semCategoria) {
      db.transactions.forEach((t: Transaction) => {
        if (t.category_id === id) {
          t.category_id = semCategoria.id;
        }
      });
    }
    
    // Excluir categoria
    db.categories = db.categories.filter((c: Category) => c.id !== id);
    await saveDatabaseAsync();
  },

  async clear(): Promise<void> {
    const db = getDatabase();
    // Manter categoria do sistema "Sem categoria"
    const systemCategory = db.categories.find((c: Category) => c.id === 1 || c.name === "Sem categoria");
    db.categories = systemCategory ? [systemCategory] : [];
    await saveDatabaseAsync();
  },

  async replaceAll(categories: Category[]): Promise<void> {
    const db = getDatabase();
    // Garantir que categoria do sistema sempre existe
    const hasSystemCategory = categories.some((c: Category) => c.id === 1 || c.name === "Sem categoria");
    if (!hasSystemCategory) {
      categories.unshift({
        id: 1,
        name: "Sem categoria",
        icon: "tag",
        is_system: true,
        created_at: new Date().toISOString(),
      });
    }
    db.categories = categories;
    await saveDatabaseAsync();
  },
};
