export interface Transaction {
  date: string
  description: string
  amount: number
  type: string
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

export interface ExtractedPageData {
  initial_balance?: number
  transactions: Transaction[]
}

export interface ExtractionRequestBody {
  images: string[]
}

export interface ExtractionResponse {
  initial_balance: number | null
  transactions: Transaction[]
}

export interface ExtractionErrorResponse {
  error: string
}

// PDF Upload related types
export interface PdfUploadProps {
  onAnalysisComplete: (data: AnalysisData) => void
}

export interface ExtractionApiResponse {
  transactions: Transaction[]
  initial_balance?: number | null
}

export interface ExtractionApiError {
  error: string
}