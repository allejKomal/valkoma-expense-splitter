"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

// ---------------------------
// Hardcoded Categories
// ---------------------------
export const EXPENSE_CATEGORIES = [
    "Food & Drinks",
    "Transportation",
    "Accommodation",
    "Groceries",
    "Shopping",
    "Entertainment",
    "Bills & Utilities",
    "Health",
    "Travel",
    "Other",
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];

// ---------------------------
// Types
// ---------------------------
export interface Participant {
    id: string;
    name: string;
    phone?: string;
    image?: string;
    notes?: string;
}

export interface SplitDetail {
    participantId: string;
    amount: number;
}

export interface Expense {
    id: string;
    title: string;
    amount: number;
    paidBy: string;
    splits: SplitDetail[];
    category: ExpenseCategory;
    date: string;
    notes?: string;
}

export interface Group {
    id: string;
    name: string;
    description?: string;
    members: Participant[];
    expenses: Expense[];
    createdAt: string;
}

export interface Settlement {
    from: string;
    to: string;
    amount: number;
}

export interface ExpenseFilters {
    search?: string;
    category?: ExpenseCategory | null;
    memberId?: string | null;
}

interface BudgetContextProps {
    group: Group;
    updateGroup: (updates: Partial<Omit<Group, "id" | "createdAt">>) => void;
    addParticipant: (p: Omit<Participant, "id">) => void;
    removeParticipant: (participantId: string) => void;
    addExpense: (e: Omit<Expense, "id" | "date"> & { date?: string }) => void;
    updateExpense: (updatedExpense: Expense) => void
    removeExpense: (expenseId: string) => void;
    calculateBalances: () => Record<string, number>;
    optimizeDebts: () => Settlement[];
    filterExpenses: (overrideFilters?: Partial<ExpenseFilters>) => Expense[];

    filters: ExpenseFilters;
    setFilters: React.Dispatch<React.SetStateAction<ExpenseFilters>>;
}

// ---------------------------
// Context
// ---------------------------
const BudgetContext = createContext<BudgetContextProps | undefined>(undefined);

export const BudgetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [filters, setFilters] = useState<ExpenseFilters>({
        search: "",
        category: null,
        memberId: null,
    });

    const [group, setGroup] = useState<Group>(() => {
        try {
            const stored = localStorage.getItem("budget-group");
            if (stored) return JSON.parse(stored) as Group;
        } catch (error) {
            console.error("Failed to parse budget-group from localStorage:", error);
        }
        return {
            id: uuidv4(),
            name: "My Shared Budget",
            description: "Track shared expenses with friends or family",
            members: [],
            expenses: [],
            createdAt: new Date().toISOString(),
        };
    });

    // Persist in localStorage
    useEffect(() => {
        try {
            localStorage.setItem("budget-group", JSON.stringify(group));
        } catch (error) {
            console.error("Failed to save budget-group to localStorage:", error);
        }
    }, [group]);

    // ---------------------------
    // Group Update
    // ---------------------------
    const updateGroup = (updates: Partial<Omit<Group, "id" | "createdAt">>) => {
        setGroup(prev => ({ ...prev, ...updates }));
    };

    // ---------------------------
    // Participant Management
    // ---------------------------
    const addParticipant = (p: Omit<Participant, "id">) => {
        setGroup(prev => {
            if (prev.members.some(m => m.name.trim().toLowerCase() === p.name.trim().toLowerCase())) {
                console.warn(`Participant "${p.name}" already exists.`);
                return prev;
            }
            return {
                ...prev,
                members: [...prev.members, { ...p, id: uuidv4() }],
            };
        });
    };

    const removeParticipant = (participantId: string) => {
        setGroup(prev => ({
            ...prev,
            members: prev.members.filter(m => m.id !== participantId),
            expenses: prev.expenses.filter(
                e => e.paidBy !== participantId && !e.splits.some(s => s.participantId === participantId)
            ),
        }));
    };

    // ---------------------------
    // Expense Management
    // ---------------------------
    const addExpense = (e: Omit<Expense, "id" | "date"> & { date?: string }) => {
        setGroup(prev => ({
            ...prev,
            expenses: [
                ...prev.expenses,
                { ...e, id: uuidv4(), date: e.date ?? new Date().toISOString() },
            ],
        }));
    };

    // Add this inside your BudgetProvider, alongside addExpense and removeExpense
    const updateExpense = (updatedExpense: Expense) => {
        setGroup(prev => ({
            ...prev,
            expenses: prev.expenses.map(e =>
                e.id === updatedExpense.id ? updatedExpense : e
            ),
        }));
    };


    const removeExpense = (expenseId: string) => {
        setGroup(prev => ({
            ...prev,
            expenses: prev.expenses.filter(e => e.id !== expenseId),
        }));
    };

    // ---------------------------
    // Balance Calculation
    // ---------------------------
    const calculateBalances = () => {
        const balances: Record<string, number> = Object.fromEntries(
            group.members.map(m => [m.id, 0])
        );

        for (const e of group.expenses) {
            balances[e.paidBy] = (balances[e.paidBy] ?? 0) + e.amount;
            for (const s of e.splits) {
                balances[s.participantId] = (balances[s.participantId] ?? 0) - s.amount;
            }
        }

        return balances;
    };

    // ---------------------------
    // Debt Optimization
    // ---------------------------
    const optimizeDebts = (): Settlement[] => {
        const balances = calculateBalances();
        const debtors: { id: string; amount: number }[] = [];
        const creditors: { id: string; amount: number }[] = [];

        Object.entries(balances).forEach(([id, amt]) => {
            if (amt < 0) debtors.push({ id, amount: -amt });
            else if (amt > 0) creditors.push({ id, amount: amt });
        });

        const settlements: Settlement[] = [];

        while (debtors.length && creditors.length) {
            const debtor = debtors[0];
            const creditor = creditors[0];
            const minAmount = Math.min(debtor.amount, creditor.amount);

            settlements.push({ from: debtor.id, to: creditor.id, amount: minAmount });

            debtor.amount -= minAmount;
            creditor.amount -= minAmount;

            if (debtor.amount === 0) debtors.shift();
            if (creditor.amount === 0) creditors.shift();
        }

        return settlements;
    };

    // ---------------------------
    // Expense Filtering
    // ---------------------------
    const filterExpenses = (overrideFilters?: Partial<ExpenseFilters>) => {
        const activeFilters = { ...filters, ...overrideFilters };
        const searchLower = activeFilters.search?.toLowerCase() || "";

        return group.expenses.filter(expense => {
            let matches = true;

            if (searchLower) {
                matches = matches && expense.title.toLowerCase().includes(searchLower);
            }
            if (activeFilters.category) {
                matches = matches && expense.category === activeFilters.category;
            }
            if (activeFilters.memberId) {
                matches =
                    matches &&
                    (expense.paidBy === activeFilters.memberId ||
                        expense.splits.some(s => s.participantId === activeFilters.memberId));
            }

            return matches;
        });
    };

    return (
        <BudgetContext.Provider
            value={{
                group,
                updateGroup,
                addParticipant,
                removeParticipant,
                addExpense,
                updateExpense,
                removeExpense,
                calculateBalances,
                optimizeDebts,
                filterExpenses,
                filters,
                setFilters,
            }}
        >
            {children}
        </BudgetContext.Provider>
    );
};

// ---------------------------
// Hook
// ---------------------------
export const useBudget = () => {
    const ctx = useContext(BudgetContext);
    if (!ctx) throw new Error("useBudget must be used inside BudgetProvider");
    return ctx;
};
