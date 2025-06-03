"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import type { AnalysisData } from "@/types/analysis"

export function SummaryCards({ data }: { data: AnalysisData }) {
  // Get top categories by amount
  const topCategories = Object.entries(data.expenditure_by_category)
    .filter(([, amount]) => amount !== 0)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, 3)

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {topCategories.map(([category, amount]) => (
        <Card key={category}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium capitalize">{category}</CardTitle>
            <CardDescription>
              {data.transaction_details.filter((t) => t.type === category).length} transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">{formatCurrency(Math.abs(amount))}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {((Math.abs(amount) / Math.abs(data.total_expenditure)) * 100).toFixed(1)}% of total spending
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
