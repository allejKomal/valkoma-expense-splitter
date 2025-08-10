import type { Group, Balance, Transaction, } from '../types/types'

export function calculateBalances(group: Group): Balance[] {
    const balances: { [memberId: string]: number } = {}

    // Initialize balances for all members
    group.members.forEach(member => {
        balances[member.id] = 0
    })

    // Calculate balances based on expenses
    group.expenses.forEach(expense => {
        // Person who paid gets credit
        balances[expense.paidBy] += expense.amount

        // Each person in the split owes their portion
        expense.splitBetween.forEach(split => {
            balances[split.memberId] -= split.amount
        })
    })

    // Convert to Balance array with member names
    return group.members.map(member => ({
        memberId: member.id,
        memberName: member.name,
        balance: balances[member.id] || 0
    }))
}

export function optimizeTransactions(balances: Balance[]): Transaction[] {
    // Create arrays of creditors (positive balance) and debtors (negative balance)
    const creditors = balances.filter(b => b.balance > 0.01).sort((a, b) => b.balance - a.balance)
    const debtors = balances.filter(b => b.balance < -0.01).sort((a, b) => a.balance - b.balance)

    const transactions: Transaction[] = []

    let i = 0, j = 0

    while (i < creditors.length && j < debtors.length) {
        const creditor = creditors[i]
        const debtor = debtors[j]

        const amount = Math.min(creditor.balance, Math.abs(debtor.balance))

        if (amount > 0.01) {
            transactions.push({
                from: debtor.memberId,
                to: creditor.memberId,
                amount,
                fromName: debtor.memberName,
                toName: creditor.memberName
            })
        }

        creditor.balance -= amount
        debtor.balance += amount

        if (creditor.balance <= 0.01) i++
        if (Math.abs(debtor.balance) <= 0.01) j++
    }

    return transactions
}
