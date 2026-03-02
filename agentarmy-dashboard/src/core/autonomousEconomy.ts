// ---------------------------------------------------------------------------
// Autonomous Economy Engine
// ---------------------------------------------------------------------------
// Manages the internal quantum‑bit (Qb) economy: minting, spending, budgets,
// taxation, rewards, and treasury. Enables agents and missions to operate
// within a self‑regulating economic framework.
// ---------------------------------------------------------------------------

export type TransactionKind =
  | 'mint'
  | 'spend'
  | 'reward'
  | 'tax'
  | 'transfer'
  | 'penalty'
  | 'refund';

export interface EconomyTransaction {
  id: string;
  kind: TransactionKind;
  from: string;
  to: string;
  amount: number;
  reason: string;
  timestamp: string;
}

export interface EconomyAccount {
  entityId: string;
  balance: number;
  totalEarned: number;
  totalSpent: number;
  totalTaxed: number;
  createdAt: string;
}

export interface BudgetRule {
  id: string;
  entityPattern: string;       // glob‑style pattern or exact entityId
  maxSpendPerMission: number;
  maxSpendPerHour: number;
  taxRate: number;             // 0‑1
  active: boolean;
}

export interface EconomySummary {
  treasuryBalance: number;
  totalAccounts: number;
  totalTransactions: number;
  totalMinted: number;
  totalSpent: number;
  totalTaxCollected: number;
  activeBudgetRules: number;
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class AutonomousEconomyEngine {
  private accounts: Map<string, EconomyAccount> = new Map();
  private transactions: EconomyTransaction[] = [];
  private budgetRules: Map<string, BudgetRule> = new Map();
  private treasury = 0;
  private totalMinted = 0;
  private totalTaxCollected = 0;
  private listeners: Array<(tx: EconomyTransaction) => void> = [];

  // ---- Accounts ----

  getOrCreateAccount(entityId: string): EconomyAccount {
    if (this.accounts.has(entityId)) return this.accounts.get(entityId)!;
    const account: EconomyAccount = {
      entityId,
      balance: 0,
      totalEarned: 0,
      totalSpent: 0,
      totalTaxed: 0,
      createdAt: new Date().toISOString(),
    };
    this.accounts.set(entityId, account);
    return account;
  }

  getAccount(entityId: string): EconomyAccount | null {
    return this.accounts.get(entityId) ?? null;
  }

  getBalance(entityId: string): number {
    return this.accounts.get(entityId)?.balance ?? 0;
  }

  // ---- Minting ----

  mint(entityId: string, amount: number, reason = 'system mint'): EconomyTransaction {
    const account = this.getOrCreateAccount(entityId);
    account.balance += amount;
    account.totalEarned += amount;
    this.totalMinted += amount;
    return this.record('mint', 'treasury', entityId, amount, reason);
  }

  // ---- Spending ----

  spend(entityId: string, amount: number, reason = 'mission spend'): EconomyTransaction | null {
    const account = this.getOrCreateAccount(entityId);
    if (account.balance < amount) return null; // insufficient funds

    // Check budget rules
    const rule = this.findBudgetRule(entityId);
    if (rule && amount > rule.maxSpendPerMission) return null;

    account.balance -= amount;
    account.totalSpent += amount;

    // Apply tax
    const tax = rule ? amount * rule.taxRate : 0;
    if (tax > 0) {
      this.treasury += tax;
      this.totalTaxCollected += tax;
      account.totalTaxed += tax;
      this.record('tax', entityId, 'treasury', tax, `Tax on: ${reason}`);
    }

    return this.record('spend', entityId, 'system', amount, reason);
  }

  // ---- Transfers ----

  transfer(from: string, to: string, amount: number, reason = 'transfer'): EconomyTransaction | null {
    const fromAcct = this.getOrCreateAccount(from);
    if (fromAcct.balance < amount) return null;

    const toAcct = this.getOrCreateAccount(to);
    fromAcct.balance -= amount;
    fromAcct.totalSpent += amount;
    toAcct.balance += amount;
    toAcct.totalEarned += amount;

    return this.record('transfer', from, to, amount, reason);
  }

  // ---- Rewards & Penalties ----

  reward(entityId: string, amount: number, reason = 'performance reward'): EconomyTransaction {
    const account = this.getOrCreateAccount(entityId);
    account.balance += amount;
    account.totalEarned += amount;
    this.treasury -= amount;
    return this.record('reward', 'treasury', entityId, amount, reason);
  }

  penalize(entityId: string, amount: number, reason = 'policy violation'): EconomyTransaction {
    const account = this.getOrCreateAccount(entityId);
    const actual = Math.min(amount, account.balance);
    account.balance -= actual;
    this.treasury += actual;
    return this.record('penalty', entityId, 'treasury', actual, reason);
  }

  // ---- Budget Rules ----

  addBudgetRule(rule: BudgetRule): void {
    this.budgetRules.set(rule.id, rule);
  }

  removeBudgetRule(ruleId: string): boolean {
    return this.budgetRules.delete(ruleId);
  }

  getBudgetRules(): BudgetRule[] {
    return Array.from(this.budgetRules.values());
  }

  // ---- Query ----

  getTransactions(limit = 100): EconomyTransaction[] {
    return this.transactions.slice(-limit);
  }

  getTransactionsForEntity(entityId: string, limit = 50): EconomyTransaction[] {
    return this.transactions
      .filter((tx) => tx.from === entityId || tx.to === entityId)
      .slice(-limit);
  }

  getSummary(): EconomySummary {
    return {
      treasuryBalance: this.treasury,
      totalAccounts: this.accounts.size,
      totalTransactions: this.transactions.length,
      totalMinted: this.totalMinted,
      totalSpent: Array.from(this.accounts.values()).reduce((s, a) => s + a.totalSpent, 0),
      totalTaxCollected: this.totalTaxCollected,
      activeBudgetRules: Array.from(this.budgetRules.values()).filter((r) => r.active).length,
    };
  }

  // ---- Events ----

  on(listener: (tx: EconomyTransaction) => void): () => void {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter((l) => l !== listener); };
  }

  // ---- Internals ----

  private record(kind: TransactionKind, from: string, to: string, amount: number, reason: string): EconomyTransaction {
    const tx: EconomyTransaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      kind, from, to, amount, reason,
      timestamp: new Date().toISOString(),
    };
    this.transactions.push(tx);
    if (this.transactions.length > 50_000) {
      this.transactions = this.transactions.slice(-50_000);
    }
    for (const fn of this.listeners) fn(tx);
    return tx;
  }

  private findBudgetRule(entityId: string): BudgetRule | null {
    for (const rule of this.budgetRules.values()) {
      if (!rule.active) continue;
      if (rule.entityPattern === entityId || rule.entityPattern === '*') return rule;
    }
    return null;
  }
}
