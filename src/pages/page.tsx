"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Receipt,
  BarChart3,
  Calculator,
  Download,
  Filter,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Button,
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
import type { Group, Balance, Transaction } from "../types/types";
import { calculateBalances, optimizeTransactions } from "../lib/balance-calculator";
import { exportGroupToPDF } from "../lib/pdf-export";
import ReportsTab from "@/components/reports-tab";
import BalancesTab from "@/components/balances-tab";
import MembersTab from "@/components/members-tab";
import ExpensesTab from "@/components/expenses-tab";

// Temporary static/mock group data until real data source is connected
const initialGroup: Group = {
  id: "1",
  name: "My Awesome Group",
  description: "A description about this group",
  members: [
    { id: "m1", name: "Alice" },
    { id: "m2", name: "Bob" },
  ],
  expenses: [
    {
      id: "e1",
      title: "Dinner at Restaurant",
      description: "Dinner at a fancy place",
      amount: 50,
      category: "Food & Dining",
      date: new Date().toISOString(),
      paidBy: "m1",
      splitType: "equal",
      splitBetween: [
        { memberId: "m1", amount: 25 },
        { memberId: "m2", amount: 25 },
      ],
      tags: ["dinner", "outing"],
      createdAt: new Date().toISOString(),
    },
    {
      id: "e2",
      title: "Movie Tickets",
      description: "Watched a movie",
      amount: 30,
      category: "Entertainment",
      date: new Date().toISOString(),
      paidBy: "m2",
      splitType: "equal",
      splitBetween: [
        { memberId: "m1", amount: 15 },
        { memberId: "m2", amount: 15 },
      ],
      tags: ["movie", "fun"],
      createdAt: new Date().toISOString(),
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};


export default function GroupPage() {
  const [group, setGroup] = useState<Group>(initialGroup);
  const [activeTab, setActiveTab] = useState("expenses");
  const [balances, setBalances] = useState<Balance[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [memberFilter, setMemberFilter] = useState<string>("all");

  useEffect(() => {
    const calculatedBalances = calculateBalances(group);
    const optimizedTransactions = optimizeTransactions(
      calculatedBalances,
    );
    setBalances(calculatedBalances);
    setTransactions(optimizedTransactions);
  }, [group]);

  const handleExportPDF = async () => {
    await exportGroupToPDF(group, balances, transactions);
  };

  const totalExpenses = group.expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );
  const averageExpense =
    group.expenses.length > 0 ? totalExpenses / group.expenses.length : 0;

  const stats = [
    {
      label: "Members",
      value: group.members.length,
      icon: Users,
    },
    {
      label: "Expenses",
      value: group.expenses.length,
      icon: Receipt,
    },
    {
      label: "Total Amount",
      value: `$${totalExpenses.toFixed(2)}`,
      icon: BarChart3,
    },
    {
      label: "Average",
      value: `$${averageExpense.toFixed(2)}`,
      icon: Calculator,
    },
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
        <Button onClick={handleExportPDF}>
          <Download className="w-4 h-4 mr-2" />
          Export PDF
        </Button>
      </div>
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Input
          placeholder="Search expenses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="Food & Dining">Food & Dining</SelectItem>
            <SelectItem value="Transportation">Transportation</SelectItem>
            <SelectItem value="Accommodation">Accommodation</SelectItem>
            <SelectItem value="Entertainment">Entertainment</SelectItem>
            <SelectItem value="Utilities">Utilities</SelectItem>
            <SelectItem value="Shopping">Shopping</SelectItem>
            <SelectItem value="Healthcare">Healthcare</SelectItem>
            <SelectItem value="Travel">Travel</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
        <Select value={memberFilter} onValueChange={setMemberFilter}>
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
        <div className="w-full">
          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="balances">Balances</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>

            <TabsContent value="expenses" className="mt-6">
              <ExpensesTab
                group={group}
                onUpdateGroup={setGroup}
                searchQuery={searchQuery}
                categoryFilter={categoryFilter}
                memberFilter={memberFilter}
              />
            </TabsContent>

            <TabsContent value="members" className="mt-6">
              <MembersTab group={group} onUpdateGroup={setGroup} />
            </TabsContent>

            <TabsContent value="balances" className="mt-6">
              <BalancesTab
                balances={balances}
                transactions={transactions}
              />
            </TabsContent>

            <TabsContent value="reports" className="mt-6">
              <ReportsTab group={group} />
            </TabsContent>
          </Tabs>

        </div>

      </div>
    </div>
  );
}
