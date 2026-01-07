/**
 * EXEMPLOS DE USO DO COMPONENTE EmptyState
 * 
 * Este arquivo demonstra como usar o componente EmptyState
 * em diferentes cenários do aplicativo.
 */

import EmptyState from "./EmptyState";
import { illustrations } from "../../assets/illustrations";
import { Plus, Lock, RefreshCw } from "lucide-react";

// ============================================
// EXEMPLO 1: Tela sem contas
// ============================================
export function ExampleEmptyAccounts() {
  return (
    <EmptyState
      image={illustrations.empty.accounts}
      title="Nenhuma conta cadastrada"
      description="Comece criando sua primeira conta para gerenciar suas finanças. Você pode adicionar contas correntes, poupança, dinheiro e outras."
      action={
        <button className="btn btn-primary">
          <Plus size={16} />
          Criar primeira conta
        </button>
      }
    />
  );
}

// ============================================
// EXEMPLO 2: Recurso premium bloqueado
// ============================================
export function ExamplePremiumLocked() {
  return (
    <EmptyState
      image={illustrations.premium.locked}
      title="Recurso Premium"
      description="Este recurso está disponível apenas para usuários Premium. Faça upgrade para desbloquear funcionalidades avançadas e ter acesso completo ao LociOne Desk."
      action={
        <button className="btn btn-primary">
          <Lock size={16} />
          Fazer upgrade para Premium
        </button>
      }
    />
  );
}

// ============================================
// EXEMPLO 3: Erro genérico
// ============================================
export function ExampleGenericError() {
  return (
    <EmptyState
      image={illustrations.errors.generic}
      title="Ops! Algo deu errado"
      description="Não foi possível carregar os dados. Por favor, tente novamente. Se o problema persistir, verifique sua conexão ou entre em contato com o suporte."
      action={
        <button className="btn btn-primary">
          <RefreshCw size={16} />
          Tentar novamente
        </button>
      }
    />
  );
}

// ============================================
// EXEMPLO 4: Sem transações
// ============================================
export function ExampleEmptyTransactions() {
  return (
    <EmptyState
      image={illustrations.empty.transactions}
      title="Nenhuma transação encontrada"
      description="Você ainda não possui transações registradas neste período. Comece adicionando receitas ou despesas."
      action={
        <button className="btn btn-primary">
          <Plus size={16} />
          Adicionar transação
        </button>
      }
    />
  );
}

// ============================================
// EXEMPLO 5: Sem categorias
// ============================================
export function ExampleEmptyCategories() {
  return (
    <EmptyState
      image={illustrations.empty.categories}
      title="Nenhuma categoria cadastrada"
      description="Organize suas finanças criando categorias personalizadas para classificar suas receitas e despesas."
      action={
        <button className="btn btn-primary">
          <Plus size={16} />
          Criar categoria
        </button>
      }
    />
  );
}

// ============================================
// EXEMPLO 6: Erro de banco de dados
// ============================================
export function ExampleDatabaseError() {
  return (
    <EmptyState
      image={illustrations.errors.database}
      title="Erro no banco de dados"
      description="Ocorreu um problema ao acessar o banco de dados local. Verifique se os arquivos do aplicativo estão íntegros e tente novamente."
      action={
        <button className="btn btn-primary">
          <RefreshCw size={16} />
          Recarregar aplicativo
        </button>
      }
    />
  );
}

