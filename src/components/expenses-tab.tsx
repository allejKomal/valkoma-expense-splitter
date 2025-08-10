"use client"

import { useState, useMemo } from 'react'
import { Plus, Edit, Trash2, Receipt, Image, Users } from 'lucide-react'
import {
  Card, CardContent,
  CardDescription, CardHeader, CardTitle,
  Button, Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogTrigger,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  RadioGroup, RadioGroupItem, Badge, Checkbox, Textarea, Label, Input
} from 'valkoma-package/primitive'
import { useToast } from 'valkoma-package/hooks'
import { type Group, type Expense, type ExpenseSplit, EXPENSE_CATEGORIES } from '../types/types'

interface ExpensesTabProps {
  group: Group
  onUpdateGroup: (group: Group) => void
  searchQuery: string
  categoryFilter: string
  memberFilter: string
}

export default function ExpensesTab({
  group,
  onUpdateGroup,
  searchQuery,
  categoryFilter,
  memberFilter
}: ExpensesTabProps) {
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [expenseTitle, setExpenseTitle] = useState('')
  const [expenseDescription, setExpenseDescription] = useState('')
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expensePaidBy, setExpensePaidBy] = useState('')
  const [expenseDate, setExpenseDate] = useState('')
  const [expenseCategory, setExpenseCategory] = useState('')
  const [splitType, setSplitType] = useState<'equal' | 'percentage' | 'exact'>('equal')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [customSplits, setCustomSplits] = useState<{ [memberId: string]: string }>({})
  const [receiptImage, setReceiptImage] = useState<string>('')
  const { toast } = useToast()

  const filteredExpenses = useMemo(() => {
    return group.expenses.filter(expense => {
      const matchesSearch = searchQuery === '' ||
        expense.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expense.description?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter

      const matchesMember = memberFilter === 'all' ||
        expense.paidBy === memberFilter ||
        expense.splitBetween.some(split => split.memberId === memberFilter)

      return matchesSearch && matchesCategory && matchesMember
    })
  }, [group.expenses, searchQuery, categoryFilter, memberFilter])

  const resetForm = () => {
    setExpenseTitle('')
    setExpenseDescription('')
    setExpenseAmount('')
    setExpensePaidBy('')
    setExpenseDate(new Date().toISOString().split('T')[0])
    setExpenseCategory('')
    setSplitType('equal')
    setSelectedMembers([])
    setCustomSplits({})
    setReceiptImage('')
    setEditingExpense(null)
  }

  const calculateSplits = (): ExpenseSplit[] => {
    const amount = parseFloat(expenseAmount)
    if (isNaN(amount) || selectedMembers.length === 0) return []

    if (splitType === 'equal') {
      const amountPerPerson = amount / selectedMembers.length
      return selectedMembers.map(memberId => ({
        memberId,
        amount: amountPerPerson,
        percentage: 100 / selectedMembers.length
      }))
    } else if (splitType === 'percentage') {
      return selectedMembers.map(memberId => {
        const percentage = parseFloat(customSplits[memberId] || '0')
        return {
          memberId,
          amount: (amount * percentage) / 100,
          percentage
        }
      })
    } else { // exact
      return selectedMembers.map(memberId => ({
        memberId,
        amount: parseFloat(customSplits[memberId] || '0')
      }))
    }
  }

  const validateSplits = (): boolean => {
    const amount = parseFloat(expenseAmount)
    if (isNaN(amount)) return false

    const splits = calculateSplits()
    const totalSplit = splits.reduce((sum, split) => sum + split.amount, 0)

    if (splitType === 'percentage') {
      const totalPercentage = splits.reduce((sum, split) => sum + (split.percentage || 0), 0)
      return Math.abs(totalPercentage - 100) < 0.01
    } else if (splitType === 'exact') {
      return Math.abs(totalSplit - amount) < 0.01
    }

    return true
  }

  const addExpense = () => {
    if (!expenseTitle.trim() || !expenseAmount || !expensePaidBy || selectedMembers.length === 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    if (!validateSplits()) {
      toast({
        title: "Error",
        description: splitType === 'percentage'
          ? "Percentages must add up to 100%"
          : "Split amounts must equal the total expense",
        variant: "destructive"
      })
      return
    }

    const newExpense: Expense = {
      id: Date.now().toString(),
      title: expenseTitle.trim(),
      description: expenseDescription.trim(),
      amount: parseFloat(expenseAmount),
      paidBy: expensePaidBy,
      splitBetween: calculateSplits(),
      splitType,
      date: expenseDate,
      category: expenseCategory,
      receipt: receiptImage,
      tags: [],
      createdAt: new Date().toISOString()
    }

    const updatedGroup = {
      ...group,
      expenses: [...group.expenses, newExpense]
    }

    onUpdateGroup(updatedGroup)
    resetForm()
    setIsAddExpenseOpen(false)

    toast({
      title: "Success",
      description: `Expense "${newExpense.title}" added successfully`
    })
  }

  const updateExpense = () => {
    if (!editingExpense || !expenseTitle.trim() || !expenseAmount || !expensePaidBy || selectedMembers.length === 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    if (!validateSplits()) {
      toast({
        title: "Error",
        description: splitType === 'percentage'
          ? "Percentages must add up to 100%"
          : "Split amounts must equal the total expense",
        variant: "destructive"
      })
      return
    }

    const updatedExpense: Expense = {
      ...editingExpense,
      title: expenseTitle.trim(),
      description: expenseDescription.trim(),
      amount: parseFloat(expenseAmount),
      paidBy: expensePaidBy,
      splitBetween: calculateSplits(),
      splitType,
      date: expenseDate,
      category: expenseCategory,
      receipt: receiptImage,
    }

    const updatedGroup = {
      ...group,
      expenses: group.expenses.map(e =>
        e.id === editingExpense.id ? updatedExpense : e
      )
    }

    onUpdateGroup(updatedGroup)
    resetForm()

    toast({
      title: "Success",
      description: `Expense "${updatedExpense.title}" updated successfully`
    })
  }

  const deleteExpense = (expenseId: string) => {
    const expense = group.expenses.find(e => e.id === expenseId)
    if (!expense) return

    if (confirm(`Are you sure you want to delete the expense "${expense.title}"?`)) {
      const updatedGroup = {
        ...group,
        expenses: group.expenses.filter(e => e.id !== expenseId)
      }

      onUpdateGroup(updatedGroup)

      toast({
        title: "Success",
        description: `Expense "${expense.title}" deleted successfully`
      })
    }
  }

  const startEditing = (expense: Expense) => {
    setEditingExpense(expense)
    setExpenseTitle(expense.title)
    setExpenseDescription(expense.description || '')
    setExpenseAmount(expense.amount.toString())
    setExpensePaidBy(expense.paidBy)
    setExpenseDate(expense.date)
    setExpenseCategory(expense.category)
    setSplitType(expense.splitType)
    setSelectedMembers(expense.splitBetween.map(split => split.memberId))
    setReceiptImage(expense.receipt || '')

    const splits: { [memberId: string]: string } = {}
    expense.splitBetween.forEach(split => {
      if (expense.splitType === 'percentage') {
        splits[split.memberId] = (split.percentage || 0).toString()
      } else if (expense.splitType === 'exact') {
        splits[split.memberId] = split.amount.toString()
      }
    })
    setCustomSplits(splits)
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setReceiptImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const getMemberName = (memberId: string) => {
    return group.members.find(m => m.id === memberId)?.name || 'Unknown'
  }

  const toggleMemberSelection = (memberId: string) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Expenses</h2>
        <Dialog open={isAddExpenseOpen || !!editingExpense} onOpenChange={(open) => {
          if (!open) {
            setIsAddExpenseOpen(false)
            resetForm()
          }
        }}>
          <DialogTrigger asChild>
            <Button
              onClick={() => setIsAddExpenseOpen(true)}
              disabled={group.members.length === 0}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingExpense ? 'Edit Expense' : 'Add New Expense'}
              </DialogTitle>
              <DialogDescription>
                {editingExpense ? 'Update expense details.' : 'Add a new shared expense.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expenseTitle">Title *</Label>
                  <Input
                    id="expenseTitle"
                    value={expenseTitle}
                    onChange={(e) => setExpenseTitle(e.target.value)}
                    placeholder="e.g., Dinner at Restaurant"
                  />
                </div>
                <div>
                  <Label htmlFor="expenseAmount">Amount *</Label>
                  <Input
                    id="expenseAmount"
                    type="number"
                    step="0.01"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="expenseDescription">Description</Label>
                <Textarea
                  id="expenseDescription"
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                  placeholder="Optional description"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expensePaidBy">Paid By *</Label>
                  <Select value={expensePaidBy} onValueChange={setExpensePaidBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select member" />
                    </SelectTrigger>
                    <SelectContent>
                      {group.members.map(member => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="expenseDate">Date *</Label>
                  <Input
                    id="expenseDate"
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="expenseCategory">Category</Label>
                <Select value={expenseCategory} onValueChange={setExpenseCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Split Between *</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {group.members.map(member => (
                    <div key={member.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={member.id}
                        checked={selectedMembers.includes(member.id)}
                        onCheckedChange={() => toggleMemberSelection(member.id)}
                      />
                      <Label htmlFor={member.id} className="text-sm font-normal">
                        {member.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Split Type</Label>
                <RadioGroup value={splitType} onValueChange={(value: 'equal' | 'percentage' | 'exact') => setSplitType(value)} className="mt-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="equal" id="equal" />
                    <Label htmlFor="equal">Equal Split</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="percentage" id="percentage" />
                    <Label htmlFor="percentage">Percentage Split</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="exact" id="exact" />
                    <Label htmlFor="exact">Exact Amounts</Label>
                  </div>
                </RadioGroup>
              </div>

              {(splitType === 'percentage' || splitType === 'exact') && (
                <div>
                  <Label>Custom Split</Label>
                  <div className="space-y-2 mt-2">
                    {selectedMembers.map(memberId => (
                      <div key={memberId} className="flex items-center gap-2">
                        <span className="w-24 text-sm">{getMemberName(memberId)}:</span>
                        <Input
                          type="number"
                          step={splitType === 'percentage' ? '1' : '0.01'}
                          placeholder={splitType === 'percentage' ? '%' : '$'}
                          value={customSplits[memberId] || ''}
                          onChange={(e) => setCustomSplits(prev => ({
                            ...prev,
                            [memberId]: e.target.value
                          }))}
                          className="w-20"
                        />
                        {splitType === 'percentage' && <span className="text-sm">%</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="receiptUpload">Receipt Image</Label>
                <Input
                  id="receiptUpload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="mt-1"
                />
                {receiptImage && (
                  <div className="mt-2">
                    <img
                      src={receiptImage || "/placeholder.svg"}
                      alt="Receipt"
                      className="max-w-full h-32 object-cover rounded border"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button onClick={editingExpense ? updateExpense : addExpense}>
                  {editingExpense ? 'Update' : 'Add'} Expense
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {group.members.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No members yet</h3>
            <p className="text-muted-foreground">
              Add members first before creating expenses.
            </p>
          </CardContent>
        </Card>
      ) : filteredExpenses.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Receipt className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No expenses yet</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || categoryFilter !== 'all' || memberFilter !== 'all'
                ? 'No expenses match your current filters.'
                : 'Start adding shared expenses for this group.'
              }
            </p>
            {(!searchQuery && categoryFilter === 'all' && memberFilter === 'all') && (
              <Button onClick={() => setIsAddExpenseOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Expense
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredExpenses.map((expense) => (
            <Card key={expense.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {expense.title}
                      <Badge variant="secondary">{expense.category}</Badge>
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Paid by {getMemberName(expense.paidBy)} on {new Date(expense.date).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-xl font-bold">${expense.amount.toFixed(2)}</div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEditing(expense)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteExpense(expense.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {expense.description && (
                  <p className="text-sm text-muted-foreground mb-3">{expense.description}</p>
                )}

                <div className="flex flex-wrap gap-2 mb-3">
                  {expense.splitBetween.map(split => (
                    <Badge key={split.memberId} variant="outline">
                      {getMemberName(split.memberId)}: ${split.amount.toFixed(2)}
                      {split.percentage && ` (${split.percentage.toFixed(1)}%)`}
                    </Badge>
                  ))}
                </div>

                {expense.receipt && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Image className="w-4 h-4" />
                    <span>Receipt attached</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
