"use client";

import { useBudget } from "@/context/budget-context";
import {
  ArrowRight, TrendingUp, TrendingDown, Minus
} from "lucide-react";
import {
  Card, CardContent,
  Badge, Separator
} from "valkoma-package/primitive";

export default function BalancesTab() {
  const { group, calculateBalances, optimizeDebts } = useBudget();

  const balancesMap = calculateBalances();
  const settlements = optimizeDebts();

  // Turn balances object into array with member details
  const balances = group.members.map(m => ({
    memberId: m.id,
    memberName: m.name,
    balance: balancesMap[m.id] ?? 0
  }));

  const positiveBalances = balances.filter(b => b.balance > 0.01);
  const negativeBalances = balances.filter(b => b.balance < -0.01);
  const zeroBalances = balances.filter(b => Math.abs(b.balance) <= 0.01);

  const renderList = (
    list: typeof balances,
    color: string,
    sign: "+" | "-" | "",
    fallback: string
  ) =>
    list.length === 0 ? (
      <p className="text-muted-foreground text-sm">{fallback}</p>
    ) : (
      <ul className="space-y-1">
        {list.map(b => (
          <li key={b.memberId} className="flex justify-between text-sm">
            <span className="truncate">{b.memberName}</span>
            <Badge className={`bg-${color}-100 text-${color}-800`}>
              {sign}${Math.abs(b.balance).toFixed(2)}
            </Badge>
          </li>
        ))}
      </ul>
    );

  return (
    <div className="space-y-8">
      {/* Balances */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Current Balances</h2>

        {balances.length === 0 ? (
          <Card className="text-center py-10">
            <CardContent>
              <Minus className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold">No balances yet</h3>
              <p className="text-muted-foreground">
                Add expenses to view balances.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Owed Money */}
            <div className="rounded-md border p-4">
              <div className="flex items-center gap-2 text-green-600 font-medium mb-1">
                <TrendingUp className="w-4 h-4" />
                Owed Money
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                Members who should receive money
              </p>
              {renderList(positiveBalances, "green", "+", "No one is owed money")}
            </div>

            {/* Owes Money */}
            <div className="rounded-md border p-4">
              <div className="flex items-center gap-2 text-red-600 font-medium mb-1">
                <TrendingDown className="w-4 h-4" />
                Owes Money
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                Members who need to pay
              </p>
              {renderList(negativeBalances, "red", "-", "No one owes money")}
            </div>

            {/* All Settled */}
            <div className="rounded-md border p-4">
              <div className="flex items-center gap-2 text-gray-600 font-medium mb-1">
                <Minus className="w-4 h-4" />
                All Settled
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                Members with no outstanding balance
              </p>
              {renderList(zeroBalances, "gray", "", "No one is settled")}
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Settlements */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Suggested Settlements</h2>

        {settlements.length === 0 ? (
          <Card className="text-center py-10">
            <CardContent>
              <Minus className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold">All settled up!</h3>
              <p className="text-muted-foreground">
                No transactions needed between members.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground mb-2">
              Settle debts with the minimum number of transactions:
            </p>
            {settlements.map((tx, i) => {
              const fromName =
                group.members.find(m => m.id === tx.from)?.name || "Unknown";
              const toName =
                group.members.find(m => m.id === tx.to)?.name || "Unknown";
              return (
                <div
                  key={i}
                  className="flex items-center justify-between border rounded-md px-4 py-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{fromName}</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{toName}</span>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800 px-3 py-0.5 text-sm">
                    ${tx.amount.toFixed(2)}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
