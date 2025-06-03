export interface Transaction {
  date: string
  description: string
  amount: number
  category: string
}

export interface AnalysisData {
  initial_balance: number
  final_balance: number
  total_income: number
  total_expenditure: number
  expenditure_by_category: {
    [key: string]: number
  }
  transaction_details: Transaction[]
}
