"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { getBudgetGist } from "@/service/get-gist"; import { createBudgetGist } from "@/service/creat-gist";
import { gh } from "@/service/git-api";
import { updateBudgetGist } from "@/service/udpate-gist";
import { toast } from "sonner";

// ---------------------------
// Categories & Types
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
    updateExpense: (updatedExpense: Expense) => void;
    removeExpense: (expenseId: string) => void;
    calculateBalances: () => Record<string, number>;
    optimizeDebts: () => Settlement[];
    filterExpenses: (overrideFilters?: Partial<ExpenseFilters>) => Expense[];
    filters: ExpenseFilters;
    setFilters: React.Dispatch<React.SetStateAction<ExpenseFilters>>;
}

const BudgetContext = createContext<BudgetContextProps | undefined>(undefined);

export const BudgetProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [gistId, setGistId] = useState<string | null>(null);
    const [filters, setFilters] = useState<ExpenseFilters>({
        search: "",
        category: null,
        memberId: null,
    });

    const [group, setGroup] = useState<Group>({
        id: uuidv4(),
        name: "My Shared Budget",
        description: "Track shared expenses with friends or family",
        members: [],
        expenses: [],
        createdAt: new Date().toISOString(),
    });

    // ---------------------------
    // Init Flow: Find or Create Gist
    // ---------------------------
    useEffect(() => {
        async function init() {
            try {
                let savedId = localStorage.getItem("budget-gist-id");

                // ✅ Step 1: If we already have a saved gist ID
                if (savedId) {
                    try {
                        const remoteGroup = await getBudgetGist(savedId);

                        if (!remoteGroup) {
                            // ❌ Gist exists but budget.json missing
                            const newGist = await createBudgetGist();
                            savedId = newGist.id;
                            localStorage.setItem("budget-gist-id", savedId || "");
                            setGistId(savedId);
                            setGroup(await getBudgetGist(savedId || ""));
                            return;
                        }

                        // ✅ Gist and budget.json found
                        setGistId(savedId);
                        setGroup(remoteGroup);
                        return;
                    } catch (err: any) {
                        if (err?.response?.status === 404) {
                            // ❌ Gist ID in storage but gist deleted → create new
                            const newGist = await createBudgetGist();
                            savedId = newGist.id;
                            localStorage.setItem("budget-gist-id", savedId || "");
                            setGistId(savedId);
                            setGroup(await getBudgetGist(savedId || ""));
                            return;
                        }
                        throw err; // some other error
                    }
                }

                // ✅ Step 2: If no gist ID saved, search for existing gists
                const { data: gists } = await gh.get("/gists");
                const existing = gists.find((g: any) => g.files["budget.json"]);

                if (existing) {
                    savedId = existing.id;
                    localStorage.setItem("budget-gist-id", savedId || "");
                    setGistId(savedId);
                    setGroup(await getBudgetGist(savedId || ""));
                    return;
                }

                // ✅ Step 3: Create a new gist if none found
                const newGist = await createBudgetGist();
                savedId = newGist.id;
                localStorage.setItem("budget-gist-id", savedId || "");
                setGistId(savedId);
                setGroup(await getBudgetGist(savedId || ""));

            } catch (e) {
                toast("Failed to initialize budget gist");
                console.log(e);

            }
        }

        init();
    }, []);


    // ---------------------------
    // Sync group to Gist when it changes
    // ---------------------------
    useEffect(() => {
        if (!gistId) return;

        const timeout = setTimeout(async () => {
            try {
                await updateBudgetGist(gistId!, group);
            } catch (e) {
                toast("Failed to update gist");
                console.log(e);
            }
        }, 1000); // debounce updates

        return () => clearTimeout(timeout);
    }, [group, gistId]);

    // ---------------------------
    // Group Update
    // ---------------------------
    const updateGroup = (
        updates: Partial<Omit<Group, "id" | "createdAt">>
    ) => {
        setGroup((prev) => ({ ...prev, ...updates }));
    };

    // ---------------------------
    // Participant Management
    // ---------------------------
    const addParticipant = (p: Omit<Participant, "id">) => {
        setGroup((prev) => {
            if (
                prev.members.some(
                    (m) => m.name.trim().toLowerCase() === p.name.trim().toLowerCase()
                )
            ) {
                (`Participant "${p.name}" already exists.`);
                return prev;
            }
            return {
                ...prev,
                members: [...prev.members, { ...p, id: uuidv4() }],
            };
        });
    };

    const removeParticipant = (participantId: string) => {
        setGroup((prev) => ({
            ...prev,
            members: prev.members.filter((m) => m.id !== participantId),
            expenses: prev.expenses.filter(
                (e) =>
                    e.paidBy !== participantId &&
                    !e.splits.some((s) => s.participantId === participantId)
            ),
        }));
    };

    // ---------------------------
    // Expense Management
    // ---------------------------
    const addExpense = (
        e: Omit<Expense, "id" | "date"> & { date?: string }
    ) => {
        setGroup((prev) => ({
            ...prev,
            expenses: [
                ...prev.expenses,
                { ...e, id: uuidv4(), date: e.date ?? new Date().toISOString() },
            ],
        }));
    };

    const updateExpense = (updatedExpense: Expense) => {
        setGroup((prev) => ({
            ...prev,
            expenses: prev.expenses.map((e) =>
                e.id === updatedExpense.id ? updatedExpense : e
            ),
        }));
    };

    const removeExpense = (expenseId: string) => {
        setGroup((prev) => ({
            ...prev,
            expenses: prev.expenses.filter((e) => e.id !== expenseId),
        }));
    };

    // ---------------------------
    // Balance Calculation
    // ---------------------------
    const calculateBalances = () => {
        const balances: Record<string, number> = Object.fromEntries(
            group.members.map((m) => [m.id, 0])
        );

        for (const e of group.expenses) {
            balances[e.paidBy] = (balances[e.paidBy] ?? 0) + e.amount;
            for (const s of e.splits) {
                balances[s.participantId] =
                    (balances[s.participantId] ?? 0) - s.amount;
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

            settlements.push({
                from: debtor.id,
                to: creditor.id,
                amount: minAmount,
            });

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

        return group.expenses.filter((expense) => {
            let matches = true;

            if (searchLower) {
                matches =
                    matches && expense.title.toLowerCase().includes(searchLower);
            }
            if (activeFilters.category) {
                matches = matches && expense.category === activeFilters.category;
            }
            if (activeFilters.memberId) {
                matches =
                    matches &&
                    (expense.paidBy === activeFilters.memberId ||
                        expense.splits.some(
                            (s) => s.participantId === activeFilters.memberId
                        ));
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

export const useBudget = () => {
    const ctx = useContext(BudgetContext);
    if (!ctx) throw new Error("useBudget must be used inside BudgetProvider");
    return ctx;
};
