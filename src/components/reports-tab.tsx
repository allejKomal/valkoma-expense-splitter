"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "valkoma-package/primitive";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { useBudget } from "@/context/budget-context";

const COLORS = [
  "#8884d8", // light purple
  "#82ca9d", // light green
  "#ffc658", // light yellow-orange
  "#ff7f50", // coral
  "#a1caf1", // light blue
  "#d0ed57", // lime green
  "#ffbb28", // golden yellow
  "#ff8042", // orange
  "#8dd1e1", // teal blue
  "#d888d8", // lavender
];

export function ReportsTab() {
  const { group, filterExpenses } = useBudget();

  // Directly use context-provided filtering
  const filteredExpenses = filterExpenses();

  // Category totals
  const categoryData = useMemo(() => {
    const totals: Record<string, number> = {};
    filteredExpenses.forEach((exp) => {
      totals[exp.category] = (totals[exp.category] || 0) + exp.amount;
    });
    return Object.entries(totals).map(([category, total]) => ({
      name: category,
      value: total,
    }));
  }, [filteredExpenses]);

  // Spending per member
  const memberSpendingData = useMemo(() => {
    const totals: Record<string, number> = {};
    filteredExpenses.forEach((exp) => {
      exp.splits.forEach((split) => {
        const member = group.members.find((m) => m.id === split.participantId);
        if (member) {
          totals[member.name] = (totals[member.name] || 0) + split.amount;
        }
      });
    });
    return Object.entries(totals).map(([name, value]) => ({
      name,
      value,
    }));
  }, [filteredExpenses, group.members]);

  // Expense timeline
  const timelineData = useMemo(() => {
    const byDate: Record<string, number> = {};
    filteredExpenses.forEach((exp) => {
      const date = new Date(exp.date).toLocaleDateString();
      byDate[date] = (byDate[date] || 0) + exp.amount;
    });
    return Object.entries(byDate).map(([date, total]) => ({
      date,
      total,
    }));
  }, [filteredExpenses]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {categoryData.length === 0 ? (
            <p className="text-sm text-muted-foreground">No matching expenses.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) =>
                    name && percent !== undefined
                      ? `${name} ${(percent * 100).toFixed(0)}%`
                      : ""
                  }
                >
                  {categoryData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Member Spending */}
      <Card>
        <CardHeader>
          <CardTitle>Member Spending</CardTitle>
        </CardHeader>
        <CardContent>
          {memberSpendingData.length === 0 ? (
            <p className="text-sm text-muted-foreground">No matching expenses.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={memberSpendingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Expense Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {timelineData.length === 0 ? (
            <p className="text-sm text-muted-foreground">No matching expenses.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
