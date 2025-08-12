"use client";

import { useState } from "react";
import {
  Users,
  Receipt,
  BarChart3,
  Calculator,
  Filter,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "valkoma-package/primitive";

import BalancesTab from "@/components/balances-tab";
import MembersTab from "@/components/members-tab";
import ExpensesTab from "@/components/expenses-tab";
import { EXPENSE_CATEGORIES, useBudget } from "@/context/budget-context";
import { ReportsTab } from "@/components/reports-tab";
import ExportButton from "@/components/export"

export default function GroupPage() {
  const {
    group,
    filters,
    setFilters,
    filterExpenses,
  } = useBudget();

  const [activeTab, setActiveTab] = useState("expenses");


  // Stats
  const filteredExpenses = filterExpenses();
  const totalExpenses = filteredExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );
  const averageExpense =
    filteredExpenses.length > 0 ? totalExpenses / filteredExpenses.length : 0;

  const stats = [
    { label: "Members", value: group.members.length, icon: Users },
    { label: "Expenses", value: filteredExpenses.length, icon: Receipt },
    { label: "Total Amount", value: `$${totalExpenses.toFixed(2)}`, icon: BarChart3 },
    { label: "Average", value: `$${averageExpense.toFixed(2)}`, icon: Calculator },
  ];

  return (
    <div className="mx-auto p-4 max-w-[1100px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{group.name}</h1>
          {group.description && (
            <p className="text-muted-foreground">{group.description}</p>
          )}
        </div>
        <ExportButton />
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Input
          placeholder="Search expenses..."
          value={filters.search ?? ""}
          onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
          className="pl-10"
        />
        <Select
          value={filters.category ?? "all"}
          onValueChange={(val) =>
            setFilters((prev) => ({
              ...prev,
              category: val === "all" ? null : (val as any),
            }))
          }
        >
          <SelectTrigger className="w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {EXPENSE_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.memberId ?? "all"}
          onValueChange={(val) =>
            setFilters((prev) => ({
              ...prev,
              memberId: val === "all" ? null : val,
            }))
          }
        >
          <SelectTrigger className="w-[180px]">
            <Users className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Member" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Members</SelectItem>
            {group.members.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-5 w-full">
        {/* Stats Cards */}
        <div className="flex flex-col gap-4 w-[300px]">
          {stats.map(({ label, value, icon: Icon }) => (
            <Card key={label} className="h-[100px]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <div className="w-full">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="balances">Balances</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>

            <TabsContent value="expenses" className="mt-6">
              <ExpensesTab />
            </TabsContent>

            <TabsContent value="members" className="mt-6">
              <MembersTab />
            </TabsContent>

            <TabsContent value="balances" className="mt-6">
              <BalancesTab />
            </TabsContent>

            <TabsContent value="reports" className="mt-6">
              <ReportsTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
