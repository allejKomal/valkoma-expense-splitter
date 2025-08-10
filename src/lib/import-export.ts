import type { AppData, Group } from "@/types/types"


export function exportToJSON(data: AppData, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function exportToCSV(groups: Group[], filename: string) {
  const headers = [
    'Group Name',
    'Expense Title',
    'Description',
    'Amount',
    'Paid By',
    'Date',
    'Category',
    'Split Type',
    'Split Details'
  ]

  const rows: string[][] = []

  groups.forEach(group => {
    group.expenses.forEach(expense => {
      const paidByName = group.members.find(m => m.id === expense.paidBy)?.name || 'Unknown'
      const splitDetails = expense.splitBetween
        .map(split => {
          const memberName = group.members.find(m => m.id === split.memberId)?.name || 'Unknown'
          return `${memberName}: $${split.amount.toFixed(2)}`
        })
        .join('; ')

      rows.push([
        group.name,
        expense.title,
        expense.description || '',
        expense.amount.toFixed(2),
        paidByName,
        expense.date,
        expense.category,
        expense.splitType,
        splitDetails
      ])
    })
  })

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}


export async function importFromFile(file: File): Promise<AppData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string

        if (file.type === 'application/json' || file.name.endsWith('.json')) {
          const data = JSON.parse(content)
          resolve(data as AppData)
        } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
          // For CSV import, we'll need to parse and convert to our data structure
          // This is a simplified version - in a real app you might want more sophisticated CSV parsing
          reject(new Error('CSV import not fully implemented'))
        } else {
          reject(new Error('Unsupported file type'))
        }
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}
