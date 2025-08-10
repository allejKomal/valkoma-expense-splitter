"use client"

import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Legend, LineChart, Line, ResponsiveContainer
} from 'recharts'
import {
  Card, CardContent, CardDescription,
  CardHeader, CardTitle, ChartContainer,
  ChartTooltip, ChartTooltipContent
} from 'valkoma-package/primitive'
import type { Group } from '../types/types'
import { useMemo } from 'react'

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))'
]

interface ReportsTabProps {
  group: Group
}

export default function ReportsTab({ group }: ReportsTabProps) {
  const categoryData = useMemo(() => {
    const totals: { [key: string]: number } = {}

    group.expenses.forEach(e => {
      if (e.category) {
        totals[e.category] = (totals[e.category] || 0) + e.amount
      }
    })

    const grandTotal = group.expenses.reduce((s, e) => s + e.amount, 0)

    return Object.entries(totals).map(([name, value]) => ({
      name,
      value,
      percentage: ((value / grandTotal) * 100).toFixed(1)
    }))
  }, [group.expenses])

  const memberData = useMemo(() => {
    const result: Record<string, { paid: number, owes: number }> = {}
    group.members.forEach(m => (result[m.id] = { paid: 0, owes: 0 }))

    group.expenses.forEach(e => {
      result[e.paidBy].paid += e.amount
      e.splitBetween.forEach(s => (result[s.memberId].owes += s.amount))
    })

    return group.members.map(m => ({
      name: m.name,
      paid: result[m.id].paid,
      owes: result[m.id].owes,
      net: result[m.id].paid - result[m.id].owes
    }))
  }, [group])

  const timelineData = useMemo(() => {
    const t: Record<string, number> = {}
    group.expenses.forEach(e => {
      const d = new Date(e.date).toISOString().split('T')[0]
      t[d] = (t[d] || 0) + e.amount
    })

    const sorted = Object.entries(t)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([d, amt]) => ({
        date: new Date(d).toLocaleDateString(),
        amount: amt
      }))

    let cum = 0
    return sorted.map(item => {
      cum += item.amount
      return { ...item, cumulative: cum }
    })
  }, [group.expenses])

  // const total = group.expenses.reduce((s, e) => s + e.amount, 0)
  // const average = group.members.length ? total / group.members.length : 0
  // const largestExpense = group.expenses.reduce((max, e) => e.amount > max.amount ? e : max, { amount: 0, title: '' })

  if (group.expenses.length === 0) {
    return (
      <div className="py-12 text-center">
        <Card>
          <CardContent className="pt-6">
            <BarChart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No data to display</h3>
            <p className="text-muted-foreground">
              Add some expenses to see reports and analytics.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Reports & Analytics</h2>
      {/* Category Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">By Category</CardTitle>
            <CardDescription className="text-xs">Spending distribution</CardDescription>
          </CardHeader>
          <CardContent className="h-[220px] p-0">
            <ChartContainer
              config={{
                value: {
                  label: "Amount",
                  color: "hsl(var(--chart-1))"
                }
              }}
              className="h-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    outerRadius={70}
                    innerRadius={40}
                    labelLine={false}
                    label={({ name }) => name}
                  >
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (active && payload?.length) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-background border rounded-md px-3 py-2 shadow-sm text-sm">
                            <p className="font-semibold">{data.name}</p>
                            <p className="text-muted-foreground">
                              ${data.value.toFixed(2)} ({data.percentage}%)
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>


        </Card>

        {/* Member Spending */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Member Spending</CardTitle>
            <CardDescription className="text-xs">Paid vs Share</CardDescription>
          </CardHeader>
          <CardContent className="h-[240px] w-full p-0">
            <ChartContainer
              config={{
                paid: {
                  label: "Paid",
                  color: "hsl(var(--chart-1))",
                },
                owes: {
                  label: "Owes",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-full"
            >
              <ResponsiveContainer height="100%">
                <BarChart
                  data={memberData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="2 2" vertical={false} strokeOpacity={0.1} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} width={32} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend iconSize={12} wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="paid" fill="var(--color-paid)" name="Paid" barSize={16} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="owes" fill="var(--color-owes)" name="Owes" barSize={16} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>

        </Card>
      </div>

      {/* Spending Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Spending Timeline</CardTitle>
          <CardDescription className="text-xs">Daily & Cumulative</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              amount: {
                label: "Daily Spending",
                color: "hsl(var(--chart-1))",
              },
              cumulative: {
                label: "Cumulative Total",
                color: "hsl(var(--chart-2))",
              },
            }}
            className="h-[260px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={timelineData}
                margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="2 2" vertical={false} strokeOpacity={0.1} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} width={32} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend iconSize={12} wrapperStyle={{ fontSize: '12px' }} />
                <Bar
                  dataKey="amount"
                  fill="var(--color-amount)"
                  name="Daily"
                  barSize={16}
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  type="monotone"
                  dataKey="cumulative"
                  stroke="var(--color-cumulative)"
                  strokeWidth={2}
                  name="Cumulative"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>

        </CardContent>
      </Card>
    </div>
  )
}
