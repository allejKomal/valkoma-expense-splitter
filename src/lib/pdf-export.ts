import type { Group, Balance, Transaction } from "../types/types"

export async function exportGroupToPDF(
    group: Group,
    balances: Balance[],
    transactions: Transaction[],
    darkMode: boolean = false
) {
    // Create a new window for PDF generation
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const getMemberName = (memberId: string) => {
        return group.members.find(m => m.id === memberId)?.name || 'Unknown'
    }

    const totalAmount = group.expenses.reduce((sum, expense) => sum + expense.amount, 0)
    const averagePerPerson = group.members.length > 0 ? totalAmount / group.members.length : 0

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${group.name} - Expense Report</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          color: ${darkMode ? '#ffffff' : '#000000'};
          background-color: ${darkMode ? '#1a1a1a' : '#ffffff'};
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid ${darkMode ? '#333333' : '#cccccc'};
          padding-bottom: 20px;
        }
        .group-title {
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .group-description {
          font-size: 16px;
          color: ${darkMode ? '#cccccc' : '#666666'};
          margin-bottom: 10px;
        }
        .stats {
          display: flex;
          justify-content: space-around;
          margin: 20px 0;
          flex-wrap: wrap;
        }
        .stat-card {
          background: ${darkMode ? '#2a2a2a' : '#f5f5f5'};
          padding: 15px;
          border-radius: 8px;
          text-align: center;
          margin: 5px;
          min-width: 150px;
        }
        .stat-value {
          font-size: 20px;
          font-weight: bold;
          color: ${darkMode ? '#ffffff' : '#333333'};
        }
        .stat-label {
          font-size: 12px;
          color: ${darkMode ? '#cccccc' : '#666666'};
          margin-top: 5px;
        }
        .section {
          margin: 30px 0;
          page-break-inside: avoid;
        }
        .section-title {
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 15px;
          border-bottom: 1px solid ${darkMode ? '#333333' : '#cccccc'};
          padding-bottom: 5px;
        }
        .members-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 10px;
          margin-bottom: 20px;
        }
        .member-card {
          background: ${darkMode ? '#2a2a2a' : '#f9f9f9'};
          padding: 10px;
          border-radius: 6px;
          border-left: 4px solid ${darkMode ? '#4a4a4a' : '#007bff'};
        }
        .expense-table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }
        .expense-table th,
        .expense-table td {
          border: 1px solid ${darkMode ? '#333333' : '#dddddd'};
          padding: 8px;
          text-align: left;
        }
        .expense-table th {
          background-color: ${darkMode ? '#333333' : '#f2f2f2'};
          font-weight: bold;
        }
        .expense-table tr:nth-child(even) {
          background-color: ${darkMode ? '#252525' : '#f9f9f9'};
        }
        .balance-positive {
          color: #28a745;
          font-weight: bold;
        }
        .balance-negative {
          color: #dc3545;
          font-weight: bold;
        }
        .balance-zero {
          color: ${darkMode ? '#cccccc' : '#666666'};
        }
        .transaction-card {
          background: ${darkMode ? '#2a2a2a' : '#f8f9fa'};
          border: 1px solid ${darkMode ? '#333333' : '#dee2e6'};
          border-radius: 6px;
          padding: 15px;
          margin: 10px 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .transaction-details {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .transaction-amount {
          font-size: 18px;
          font-weight: bold;
          color: ${darkMode ? '#4a90e2' : '#007bff'};
        }
        @media print {
          body { 
            background-color: white !important; 
            color: black !important;
          }
          .stat-card, .member-card, .transaction-card {
            background: #f5f5f5 !important;
            color: black !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="group-title">${group.name}</div>
        ${group.description ? `<div class="group-description">${group.description}</div>` : ''}
        <div class="group-description">Generated on ${new Date().toLocaleDateString()}</div>
      </div>

      <div class="stats">
        <div class="stat-card">
          <div class="stat-value">${group.members.length}</div>
          <div class="stat-label">Members</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${group.expenses.length}</div>
          <div class="stat-label">Expenses</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">$${totalAmount.toFixed(2)}</div>
          <div class="stat-label">Total Amount</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">$${averagePerPerson.toFixed(2)}</div>
          <div class="stat-label">Average per Person</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Group Members</div>
        <div class="members-grid">
          ${group.members.map(member => `
            <div class="member-card">
              <strong>${member.name}</strong>
              ${member.nickname ? `<br><small>"${member.nickname}"</small>` : ''}
              ${member.email ? `<br><small>${member.email}</small>` : ''}
            </div>
          `).join('')}
        </div>
      </div>

      <div class="section">
        <div class="section-title">All Expenses</div>
        <table class="expense-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Title</th>
              <th>Amount</th>
              <th>Paid By</th>
              <th>Category</th>
              <th>Split Details</th>
            </tr>
          </thead>
          <tbody>
            ${group.expenses.map(expense => `
              <tr>
                <td>${new Date(expense.date).toLocaleDateString()}</td>
                <td>
                  ${expense.title}
                  ${expense.description ? `<br><small style="color: #666;">${expense.description}</small>` : ''}
                </td>
                <td>$${expense.amount.toFixed(2)}</td>
                <td>${getMemberName(expense.paidBy)}</td>
                <td>${expense.category}</td>
                <td>
                  ${expense.splitBetween.map(split =>
        `${getMemberName(split.memberId)}: $${split.amount.toFixed(2)}`
    ).join('<br>')}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="section">
        <div class="section-title">Current Balances</div>
        <div class="members-grid">
          ${balances.map(balance => `
            <div class="member-card">
              <strong>${balance.memberName}</strong><br>
              <span class="${balance.balance > 0.01 ? 'balance-positive' : balance.balance < -0.01 ? 'balance-negative' : 'balance-zero'}">
                ${balance.balance > 0.01 ? `+$${balance.balance.toFixed(2)} (owed)` :
            balance.balance < -0.01 ? `$${Math.abs(balance.balance).toFixed(2)} (owes)` :
                '$0.00 (settled)'}
              </span>
            </div>
          `).join('')}
        </div>
      </div>

      ${transactions.length > 0 ? `
        <div class="section">
          <div class="section-title">Suggested Settlements</div>
          <p style="margin-bottom: 20px; color: ${darkMode ? '#cccccc' : '#666666'};">
            To settle all debts with the minimum number of transactions:
          </p>
          ${transactions.map(transaction => `
            <div class="transaction-card">
              <div class="transaction-details">
                <strong>${transaction.fromName}</strong>
                <span>pays</span>
                <strong>${transaction.toName}</strong>
              </div>
              <div class="transaction-amount">$${transaction.amount.toFixed(2)}</div>
            </div>
          `).join('')}
        </div>
      ` : `
        <div class="section">
          <div class="section-title">Settlement Status</div>
          <div style="text-align: center; padding: 20px; background: ${darkMode ? '#2a2a2a' : '#f8f9fa'}; border-radius: 8px;">
            <strong>✅ All settled up!</strong><br>
            <span style="color: ${darkMode ? '#cccccc' : '#666666'};">No money needs to be transferred between members.</span>
          </div>
        </div>
      `}
    </body>
    </html>
  `

    printWindow.document.write(htmlContent)
    printWindow.document.close()

    // Wait for content to load then print
    printWindow.onload = () => {
        printWindow.print()
        printWindow.close()
    }
}
