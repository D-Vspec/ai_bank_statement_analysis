"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Cell, Pie, PieChart } from "recharts"
import { formatCurrency } from "@/lib/utils"
import type { AnalysisData } from "@/types/analysis"

export function CategoryDistribution({ data }: { data: AnalysisData }) {
  // Prepare chart data
  const chartData = Object.entries(data.expenditure_by_category)
    .filter(([, amount]) => amount !== 0) // Filter out zero amounts
    .map(([category, amount]) => ({
      name: category.charAt(0).toUpperCase() + category.slice(1),
      value: Math.abs(amount), // Convert to positive for display
    }))

  // Color palette for categories
  const COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
    "hsl(var(--chart-6))",
    "hsl(var(--chart-7))",
    "hsl(var(--chart-8))",
  ]

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Spending Distribution</CardTitle>
        <CardDescription>Expenditure breakdown by category</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            value: {
              label: "Amount",
              color: "hsl(var(--chart-1))",
            },
          }}
          className="h-[300px]"
        >
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)} />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}