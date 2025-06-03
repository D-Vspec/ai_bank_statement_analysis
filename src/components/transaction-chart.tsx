"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { formatCurrency } from "@/lib/utils"
import { getTransactionCounts } from "@/lib/transaction-analyzer"
import type { AnalysisData } from "@/types/analysis"

type ChartMode = "amount" | "count"

export function TransactionChart({ data }: { data: AnalysisData }) {
  const [mode, setMode] = useState<ChartMode>("amount")

  // Get transaction counts by category
  const transactionCounts = getTransactionCounts(data.transaction_details)

  // Prepare chart data
  const chartData = Object.entries(data.expenditure_by_category)
    .map(([category, amount]) => {
      return {
        category: category.charAt(0).toUpperCase() + category.slice(1),
        amount: Math.abs(amount), // Convert to positive for display
        count: transactionCounts[category] || 0,
      }
    })
    .filter((item) => item.amount > 0 || item.count > 0) // Only show categories with data

  return (
    <Card className="col-span-1">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Transactions by Category</CardTitle>
          <ToggleGroup type="single" value={mode} onValueChange={(value) => value && setMode(value as ChartMode)}>
            <ToggleGroupItem value="amount" aria-label="Show amounts">
              Amount
            </ToggleGroupItem>
            <ToggleGroupItem value="count" aria-label="Show counts">
              Count
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <CardDescription>
          {mode === "amount" ? "Total spending amount by category" : "Number of transactions by category"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            [mode]: {
              label: mode === "amount" ? "Amount" : "Count",
              color: "hsl(var(--chart-1))",
            },
          }}
          className="h-[300px]"
        >
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 24 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="category"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) =>
                mode === "amount" ? formatCurrency(value).replace(/\.00$/, "") : value.toString()
              }
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => (mode === "amount" ? formatCurrency(value as number) : value.toString())}
                />
              }
            />
            <Bar dataKey={mode} fill="var(--color-amount)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
