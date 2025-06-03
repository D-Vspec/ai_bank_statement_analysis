import type { Transaction, AnalysisData } from "@/types/analysis"

interface RawTransaction {
  date: string
  description: string
  type: string
  amount: number
  balance?: number
}

// Category mapping rules
const CATEGORY_RULES = {
  food: [
    "restaurant",
    "cafe",
    "coffee",
    "pizza",
    "burger",
    "food",
    "grocery",
    "supermarket",
    "mcdonalds",
    "kfc",
    "subway",
    "starbucks",
    "dunkin",
    "uber eats",
    "doordash",
    "grubhub",
    "deliveroo",
    "just eat",
    "takeaway",
    "dining",
    "lunch",
    "dinner",
    "breakfast",
    "meal",
    "kitchen",
    "bakery",
    "deli",
    "market",
    "fresh",
    "organic",
  ],
  shopping: [
    "amazon",
    "ebay",
    "walmart",
    "target",
    "costco",
    "mall",
    "store",
    "shop",
    "retail",
    "clothing",
    "fashion",
    "shoes",
    "electronics",
    "apple",
    "best buy",
    "home depot",
    "lowes",
    "ikea",
    "furniture",
    "department",
    "outlet",
    "boutique",
    "online",
    "purchase",
    "buy",
    "order",
    "merchandise",
    "goods",
  ],
  leisure: [
    "netflix",
    "spotify",
    "hulu",
    "disney",
    "amazon prime",
    "youtube",
    "movie",
    "cinema",
    "theater",
    "entertainment",
    "game",
    "gaming",
    "steam",
    "playstation",
    "xbox",
    "nintendo",
    "gym",
    "fitness",
    "sport",
    "club",
    "membership",
    "subscription",
    "music",
    "concert",
    "event",
    "ticket",
    "recreation",
    "hobby",
  ],
  transport: [
    "gas",
    "fuel",
    "petrol",
    "shell",
    "bp",
    "exxon",
    "chevron",
    "uber",
    "lyft",
    "taxi",
    "bus",
    "train",
    "metro",
    "subway",
    "parking",
    "toll",
    "car",
    "vehicle",
    "auto",
    "transport",
    "travel",
    "flight",
    "airline",
    "airport",
    "rental",
    "maintenance",
    "repair",
    "insurance",
    "registration",
  ],
  utilities: [
    "electric",
    "electricity",
    "gas bill",
    "water",
    "sewer",
    "internet",
    "wifi",
    "phone",
    "mobile",
    "cellular",
    "cable",
    "tv",
    "utility",
    "power",
    "energy",
    "heating",
    "cooling",
    "trash",
    "waste",
    "recycling",
    "telecom",
    "broadband",
    "service provider",
    "bill payment",
    "monthly service",
  ],
  healthcare: [
    "doctor",
    "hospital",
    "medical",
    "pharmacy",
    "medicine",
    "prescription",
    "health",
    "dental",
    "dentist",
    "clinic",
    "insurance",
    "copay",
    "deductible",
    "therapy",
    "treatment",
    "surgery",
    "checkup",
    "appointment",
    "lab",
    "test",
    "x-ray",
    "mri",
    "scan",
    "emergency",
    "urgent care",
    "specialist",
  ],
  transfer: [
    "transfer",
    "atm",
    "withdrawal",
    "deposit",
    "bank",
    "check",
    "payment",
    "wire",
    "ach",
    "direct deposit",
    "payroll",
    "salary",
    "wage",
    "income",
    "refund",
    "reimbursement",
    "cash",
    "venmo",
    "paypal",
    "zelle",
    "cashapp",
    "peer",
    "p2p",
    "send",
    "receive",
    "balance transfer",
    "loan payment",
  ],
}

function categorizeTransaction(description: string, type: string): string {
  console.log("Categorizing transaction:", description, type)
  const desc = description.toLowerCase()
  const transactionType = type.toLowerCase()

  // Check if it's income/credit
  if (
    transactionType.includes("credit") ||
    transactionType.includes("deposit") ||
    transactionType.includes("income") ||
    transactionType.includes("salary") ||
    transactionType.includes("refund") ||
    transactionType.includes("interest")
  ) {
    return "transfer"
  }

  // Check each category
  for (const [category, keywords] of Object.entries(CATEGORY_RULES)) {
    for (const keyword of keywords) {
      if (desc.includes(keyword)) {
        return category
      }
    }
  }

  return "unknown"
}

export function analyzeTransactions(rawTransactions: RawTransaction[], initialBalance = 0): AnalysisData {
  // Convert raw transactions to categorized transactions
  const transactions: Transaction[] = rawTransactions.map((raw) => ({
    date: raw.date,
    description: raw.description,
    amount: raw.amount,
    type: categorizeTransaction(raw.description, raw.type),
  }))

  // Sort transactions by date to ensure proper order
  transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // Calculate totals
  let totalIncome = 0
  let totalExpenditure = 0

  // Initialize category totals
  const expenditureByCategory: { [key: string]: number } = {
    food: 0,
    shopping: 0,
    leisure: 0,
    transport: 0,
    utilities: 0,
    healthcare: 0,
    transfer: 0,
    unknown: 0,
  }

  // Process each transaction
  transactions.forEach((transaction) => {
    if (transaction.amount > 0) {
      totalIncome += transaction.amount
    } else {
      totalExpenditure += transaction.amount
      // Add to category (amount is already negative)
      expenditureByCategory[transaction.type] += transaction.amount
    }
  })

  // Calculate final balance
  const finalBalance = initialBalance + totalIncome + totalExpenditure

  return {
    initial_balance: initialBalance,
    final_balance: finalBalance,
    total_income: totalIncome,
    total_expenditure: totalExpenditure,
    expenditure_by_category: expenditureByCategory,
    transaction_details: transactions,
  }
}

// Helper function to get transaction counts by category
export function getTransactionCounts(transactions: Transaction[]): { [key: string]: number } {
  const counts: { [key: string]: number } = {
    food: 0,
    shopping: 0,
    leisure: 0,
    transport: 0,
    utilities: 0,
    healthcare: 0,
    transfer: 0,
    unknown: 0,
  }

  transactions.forEach((transaction) => {
    if (transaction.amount < 0) {
      // Only count expenditures
      counts[transaction.type]++
    }
  })

  return counts
}

// Helper function to get income transactions count
export function getIncomeTransactionCount(transactions: Transaction[]): number {
  return transactions.filter((t) => t.amount > 0).length
}

// Helper function to get expenditure transactions count
export function getExpenditureTransactionCount(transactions: Transaction[]): number {
  return transactions.filter((t) => t.amount < 0).length
}
