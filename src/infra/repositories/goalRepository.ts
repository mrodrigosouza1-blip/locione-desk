import { getDatabase, saveDatabaseAsync } from "../database";
import type { Goal, CreateGoalDto, GoalMovement } from "../../domain/types";
import { getGoalBalanceCents } from "../../domain/goals/goalService";
import { emitAppEvent } from "../../ui/state/appEvents";

export const goalRepository = {
  async findAll(): Promise<Goal[]> {
    const db = getDatabase();
    return [...db.goals].sort((a: Goal, b: Goal) => b.created_at.localeCompare(a.created_at));
  },

  async findById(id: number): Promise<Goal | undefined> {
    const db = getDatabase();
    return db.goals.find((g: Goal) => g.id === id);
  },

  async create(data: CreateGoalDto): Promise<Goal> {
    const db = getDatabase();
    const newId = db.goals.length > 0 ? Math.max(...db.goals.map((g: Goal) => g.id)) + 1 : 1;
    const goal: Goal = {
      id: newId,
      name: data.name,
      type: data.type,
      currency_code: data.currency_code,
      target_value_cents: data.target_value_cents,
      deposited_amount: 0, // Inicializa com 0
      config: data.config ? JSON.stringify(data.config) : undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.goals.push(goal);
    await saveDatabaseAsync();
    emitAppEvent("data:changed");
    return goal;
  },

  async update(id: number, data: Partial<CreateGoalDto>): Promise<Goal> {
    const db = getDatabase();
    const index = db.goals.findIndex((g: Goal) => g.id === id);
    if (index === -1) throw new Error("Goal not found");
    
    const updatedGoal: Partial<Goal> = {
      updated_at: new Date().toISOString(),
    };
    
    if (data.name) {
      updatedGoal.name = data.name;
    }
    
    if (data.type) {
      updatedGoal.type = data.type;
    }
    
    if (data.config) {
      updatedGoal.config = typeof data.config === "string" ? data.config : JSON.stringify(data.config);
    }
    
    if (data.currency_code) {
      updatedGoal.currency_code = data.currency_code;
    }
    
    if (data.target_value_cents !== undefined) {
      updatedGoal.target_value_cents = data.target_value_cents;
    }
    
    db.goals[index] = {
      ...db.goals[index],
      ...updatedGoal,
    };
    await saveDatabaseAsync();
    emitAppEvent("data:changed");
    return db.goals[index];
  },

  async delete(id: number, options?: { cascade?: boolean }): Promise<void> {
    const db = getDatabase();
    
    if (options?.cascade) {
      // Excluir movimentos da meta
      db.goalMovements = db.goalMovements.filter((m: any) => m.goal_id !== id);
    } else {
      // Manter movimentos como órfãos (goal_id permanece, mas meta não existe mais)
      // Ou podemos setar goal_id = null se preferir
      // Por enquanto, mantemos os movimentos com goal_id (órfãos)
    }
    
    // Excluir meta
    db.goals = db.goals.filter((g) => g.id !== id);
    await saveDatabaseAsync();
    emitAppEvent("data:changed");
  },

  // Movimentos (depósitos e resgates)
  async getMovements(goalId: number): Promise<GoalMovement[]> {
    const db = getDatabase();
    return (db.goalMovements || []).filter((m: any) => m.goal_id === goalId)
      .sort((a: any, b: any) => b.date.localeCompare(a.date));
  },

  async createMovement(movement: Omit<GoalMovement, "id" | "created_at">): Promise<GoalMovement> {
    const db = getDatabase();
    const newId = (db.goalMovements || []).length > 0 
      ? Math.max(...(db.goalMovements || []).map((m: any) => m.id)) + 1 
      : 1;
    
    const newMovement: GoalMovement = {
      id: newId,
      ...movement,
      created_at: new Date().toISOString(),
    };
    
    if (!db.goalMovements) {
      db.goalMovements = [];
    }
    
    db.goalMovements.push(newMovement);
    
    // NOTA: deposited_amount é atualizado no handler do modal, não aqui
    // para evitar duplicação
    
    await saveDatabaseAsync();
    emitAppEvent("data:changed");
    return newMovement;
  },

  async deposit(goalId: number, amountCents: number, date: string, description?: string): Promise<GoalMovement> {
    const goal = await this.findById(goalId);
    if (!goal) throw new Error("Meta não encontrada");
    
    return await this.createMovement({
      goal_id: goalId,
      type: "deposit",
      amount_cents: amountCents,
      currency: goal.currency_code,
      date,
      description: description || `Depósito em meta`,
    });
  },

  async withdraw(goalId: number, amountCents: number, date: string, targetAccountId: number, description?: string): Promise<GoalMovement> {
    // Validar saldo disponível
    const balance = await getGoalBalanceCents(goalId);
    if (balance < amountCents) {
      throw new Error("Valor insuficiente na meta");
    }
    
    const goal = await this.findById(goalId);
    if (!goal) throw new Error("Meta não encontrada");
    
    return await this.createMovement({
      goal_id: goalId,
      type: "withdraw", // Usar "withdraw" em vez de "redeem"
      amount_cents: amountCents,
      currency: goal.currency_code,
      date,
      destination_account_id: targetAccountId,
      description: description || `Resgate de meta`,
    });
  },
};
