"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TransactionChart } from "@/components/transaction-chart"
import { TransactionTable } from "@/components/transaction-table"
import { SummaryCards } from "@/components/summary-cards"
import { ArrowDownIcon, ArrowUpIcon, Upload, TrendingUp, TrendingDown } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import type { AnalysisData } from "@/types/analysis"
import { Button } from "@/components/ui/button"
import { CategoryDistribution } from "@/components/category-distribution"

interface FinancialDashboardProps {
  data: AnalysisData
  onNewUpload: () => void
}

export function FinancialDashboard({ data, onNewUpload }: FinancialDashboardProps) {
  if (!data) {
    return <div className="p-8">No financial data available.</div>
  }

  const netChange = data.final_balance - data.initial_balance

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Dashboard</h1>
          <p className="text-muted-foreground">Analyze your bank statement transactions and spending patterns</p>
        </div>
        <Button onClick={onNewUpload} variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          New Analysis
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Initial Balance</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(data.initial_balance)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <ArrowUpIcon className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(data.total_income)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenditure</CardTitle>
            <ArrowDownIcon className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">{formatCurrency(Math.abs(data.total_expenditure))}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Final Balance</CardTitle>
            <TrendingDown className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{formatCurrency(data.final_balance)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Change</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netChange >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {formatCurrency(netChange)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{netChange >= 0 ? "Positive" : "Negative"} change</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <CategoryDistribution data={data} />
            <TransactionChart data={data} />
          </div>
          <SummaryCards data={data} />
        </TabsContent>
        <TabsContent value="transactions">
          <TransactionTable data={data} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
