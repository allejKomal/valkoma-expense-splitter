"use client";

import { useEffect, useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import {

  Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Input, Textarea, Label,
  Checkbox,
  Badge
} from "valkoma-package/primitive";
import { EXPENSE_CATEGORIES, useBudget, type Expense } from "@/context/budget-context";
import { toast } from "sonner";

export default function ExpensesTab() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Form state
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expensePaidBy, setExpensePaidBy] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);
  const [expenseCategory, setExpenseCategory] = useState("");
  const [splitType, setSplitType] = useState<"equal" | "percentage" | "exact">("equal");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [customSplits, setCustomSplits] = useState<{ [memberId: string]: string }>({});
  const [receiptImage, setReceiptImage] = useState("");

  const { group, addExpense, removeExpense, updateExpense, filterExpenses } = useBudget();
  const filteredExpenses = filterExpenses();


  // Populate form when editing
  useEffect(() => {
    if (editingExpense) {
      setExpenseTitle(editingExpense.title);
      setExpenseDescription(editingExpense.notes || "");
      setExpenseAmount(editingExpense.amount.toString());
      setExpensePaidBy(editingExpense.paidBy);
      setExpenseDate(editingExpense.date);
      setExpenseCategory(editingExpense.category);
      setSplitType(
        editingExpense.splits.every(s => s.amount === editingExpense.amount / editingExpense.splits.length)
          ? "equal"
          : "exact" // simple heuristic
      );
      setSelectedMembers(editingExpense.splits.map(s => s.participantId));
      const splitsMap: { [id: string]: string } = {};
      editingExpense.splits.forEach(s => {
        splitsMap[s.participantId] = s.amount.toString();
      });
      setCustomSplits(splitsMap);
    }
  }, [editingExpense]);

  // Auto-configure when only one group member exists
  useEffect(() => {
    if (group.members.length === 1) {
      const onlyMember = group.members[0];

      setExpensePaidBy(onlyMember.id);
      setSplitType("equal");
      setSelectedMembers([onlyMember.id]);
    }
  }, [group.members]);


  const resetForm = () => {
    setExpenseTitle("");
    setExpenseDescription("");
    setExpenseAmount("");
    setExpenseDate(new Date().toISOString().split("T")[0]);
    setExpenseCategory("");
    setSplitType("equal");
    setReceiptImage("");
    setCustomSplits({});
    setEditingExpense(null);

    if (group.members.length === 1) {
      const onlyMember = group.members[0];
      setExpensePaidBy(onlyMember.id);
      setSelectedMembers([onlyMember.id]);
    } else {
      setExpensePaidBy("");
      setSelectedMembers([]);
    }
  };


  const calculateSplits = () => {
    const amount = parseFloat(expenseAmount);
    if (isNaN(amount) || selectedMembers.length === 0) return [];

    if (splitType === "equal") {
      const amountPerPerson = amount / selectedMembers.length;
      return selectedMembers.map(memberId => ({
        participantId: memberId,
        amount: amountPerPerson
      }));
    } else if (splitType === "percentage") {
      return selectedMembers.map(memberId => {
        const percentage = parseFloat(customSplits[memberId] || "0");
        return {
          participantId: memberId,
          amount: (amount * percentage) / 100
        };
      });
    } else {
      return selectedMembers.map(memberId => ({
        participantId: memberId,
        amount: parseFloat(customSplits[memberId] || "0")
      }));
    }
  };

  const validateSplits = () => {
    const amount = parseFloat(expenseAmount);
    if (isNaN(amount)) return false;

    const splits = calculateSplits();
    const totalSplit = splits.reduce((sum, s) => sum + s.amount, 0);

    if (splitType === "percentage") {
      const totalPercentage = selectedMembers.reduce(
        (sum, m) => sum + parseFloat(customSplits[m] || "0"),
        0
      );
      return Math.abs(totalPercentage - 100) < 0.01;
    } else if (splitType === "exact") {
      return Math.abs(totalSplit - amount) < 0.01;
    }

    return true;
  };

  const handleSaveExpense = () => {
    if (!expenseTitle.trim() || !expenseAmount || !expensePaidBy || selectedMembers.length === 0) {
      toast("Please fill in all required fields", {
        duration: Infinity,
      });
      return;
    }
    if (!validateSplits()) {
      toast("Invalid split configuration");
      return;
    }

    const expenseData: Expense = {
      id: editingExpense?.id || Date.now().toString(),
      title: expenseTitle,
      amount: parseFloat(expenseAmount),
      paidBy: expensePaidBy,
      splits: calculateSplits(),
      category: expenseCategory as any,
      notes: expenseDescription,
      date: expenseDate,
    };

    if (editingExpense) {
      updateExpense(expenseData);
    } else {
      addExpense(expenseData);
    }

    resetForm();
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-4">
      <section className="w-full px-4 md:px-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold">Expenses</h2>
            <p className="text-xs text-muted-foreground">Track shared costs</p>
          </div>
          <Button size="sm" onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </div>

        {/* Table Headings */}
        <div className="hidden md:grid grid-cols-6 gap-4 text-xs font-medium text-muted-foreground px-2 py-2 border-b">
          <span>Title</span>
          <span>Date</span>
          <span>Amount</span>
          <span>Category</span>
          <span>Paid By</span>
          <span className="text-right">Actions</span>
        </div>

        {/* Expense Rows */}
        {filteredExpenses.length === 0 ? (
          <p className="text-sm text-muted-foreground mt-6">No expenses yet.</p>
        ) : (
          <ul className="grid gap-2">
            {filteredExpenses.map((expense) => {
              const paidByMember = group.members.find((m) => m.id === expense.paidBy);

              return (
                <li
                  key={expense.id}
                  className="group relative border rounded-md p-3  text-sm flex flex-col gap-2"
                >
                  {/* Top row: title & amount */}
                  <div className="flex justify-between items-start">
                    <div className="flex gap-2">
                      <div className="font-medium text-sm truncate">{expense.title}</div>
                      <Badge variant="secondary" className="px-2 py-0.5">
                        Paid by {paidByMember?.name ?? "Unknown"}
                      </Badge>
                    </div>
                    <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                      ${expense.amount.toFixed(2)}
                    </div>
                  </div>

                  {/* Badges row */}
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="px-2 py-0.5">
                      {expense.category}
                    </Badge>
                    <Badge variant="outline" className="px-2 py-0.5">
                      {new Date(expense.date).toLocaleDateString()}
                    </Badge>
                  </div>

                  {/* Notes (optional) */}
                  {expense.notes && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {expense.notes}
                    </p>
                  )}

                  {/* Hover actions */}
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => {
                        setEditingExpense(expense);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => removeExpense(expense.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>



      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-3xl p-6 z-[50]">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl">{editingExpense ? "Edit Expense" : "Add Expense"}</DialogTitle>
            <DialogDescription>Provide all the details to record the expense.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title */}
            <div className="flex flex-col gap-1">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={expenseTitle} onChange={e => setExpenseTitle(e.target.value)} />
            </div>

            {/* Amount */}
            <div className="flex flex-col gap-1">
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" type="number" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} />
            </div>

            {/* Paid By */}
            <div className="flex flex-col gap-1">
              <Label>Paid By</Label>
              <Select value={expensePaidBy} onValueChange={setExpensePaidBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent>
                  {group.members.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div className="flex flex-col gap-1">
              <Label>Category</Label>
              <Select value={expenseCategory} onValueChange={setExpenseCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date */}
            <div className="flex flex-col gap-1">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={expenseDate} onChange={e => setExpenseDate(e.target.value)} />
            </div>

            {/* Split Type */}
            <div className="flex flex-col gap-1">
              <Label>Split Type</Label>
              <Select value={splitType} onValueChange={(val: any) => setSplitType(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select split type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equal">Equal</SelectItem>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="exact">Exact Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Members */}
            <div className="md:col-span-2 flex flex-col gap-2">
              <Label>Members</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {group.members.map((m) => (
                  <div key={m.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      id={`member-${m.id}`}
                      checked={selectedMembers.includes(m.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedMembers((prev) => [...prev, m.id]);
                        } else {
                          setSelectedMembers((prev) => prev.filter((id) => id !== m.id));
                        }
                      }}
                    />
                    <label htmlFor={`member-${m.id}`} className="cursor-pointer">
                      {m.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Splits */}
            {splitType !== "equal" && selectedMembers.length > 0 && (
              <div className="md:col-span-2 flex flex-col gap-2">
                <Label>Custom Splits</Label>
                <div className="grid gap-2">
                  {selectedMembers.map(mId => (
                    <div key={mId} className="flex items-center gap-4">
                      <span className="w-40 text-sm text-muted-foreground">
                        {group.members.find(m => m.id === mId)?.name}
                      </span>
                      <Input
                        type="number"
                        placeholder={splitType === "percentage" ? "%" : "Amount"}
                        value={customSplits[mId] || ""}
                        onChange={(e) =>
                          setCustomSplits(prev => ({ ...prev, [mId]: e.target.value }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="md:col-span-2 flex flex-col gap-1">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={expenseDescription} onChange={e => setExpenseDescription(e.target.value)} />
            </div>

            {/* Receipt Upload */}
            <div className="md:col-span-2 flex flex-col gap-1">
              <Label htmlFor="receipt">Receipt</Label>
              <Input id="receipt" type="file" onChange={e => setReceiptImage(e.target.files?.[0]?.name || "")} />
              {receiptImage && <p className="text-sm text-muted-foreground mt-1">Selected: {receiptImage}</p>}
            </div>

            {/* Save Button */}
            <div className="md:col-span-2">
              <Button className="w-full" onClick={handleSaveExpense}>
                {editingExpense ? "Update Expense" : "Save Expense"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
