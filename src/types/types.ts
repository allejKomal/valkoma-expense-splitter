export interface Member {
    id: string
    name: string
    nickname?: string
    avatar?: string
    email?: string
}

export interface ExpenseSplit {
    memberId: string
    amount: number
    percentage?: number
}

export interface Expense {
    id: string
    title: string
    description?: string
    amount: number
    paidBy: string
    splitBetween: ExpenseSplit[]
    splitType: 'equal' | 'percentage' | 'exact'
    date: string
    category: string
    receipt?: string
    tags: string[]
    createdAt: string
}

export interface Group {
    id: string
    name: string
    description?: string
    members: Member[]
    expenses: Expense[]
    createdAt: string
    updatedAt: string
}

export interface Balance {
    memberId: string
    memberName: string
    balance: number // positive = owed money, negative = owes money
}

export interface Transaction {
    from: string
    to: string
    amount: number
    fromName: string
    toName: string
}

export interface AppData {
    groups: Group[]
    version: string
}

export const EXPENSE_CATEGORIES = [
    'Food & Dining',
    'Transportation',
    'Accommodation',
    'Entertainment',
    'Utilities',
    'Shopping',
    'Healthcare',
    'Travel',
    'Other'
] as const

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number]
