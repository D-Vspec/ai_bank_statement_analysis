import { type NextRequest, NextResponse } from "next/server"
import Groq from "groq-sdk"
import { 
  type Transaction, 
  type ExtractedPageData, 
  type ExtractionRequestBody, 
  type ExtractionResponse, 
  type ExtractionErrorResponse 
} from "@/types/analysis"

const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

const EXTRACTION_PROMPT = 
`
Extract ALL visible transaction data from this bank statement page. Return ONLY a JSON object with this structure:

{
  "initial_balance": 1000.00,
  "transactions": [
    {
        "date": "YYYY-MM-DD",
        "description": "transaction description",
        "type" : "TYPE HERE",
        "amount": -123.45,
    }
  ]
}

IMPORTANT INSTRUCTIONS:
- Extract the INITIAL/OPENING balance from the statement (usually shown at the top or beginning)
- If you can't find an explicit initial balance, use the balance from the first transaction, else consider it 0
- For transactions, use negative amounts for debits/expenditures, positive for credits/income
- Include the running balance after each transaction if visible
- If you can't read a field clearly, use null
- Return only the JSON object, no other text
- Only give the initial balance from the first page, not subsequent pages
- The initial balance should be the first value in the JSON object, outside the transactions array
- Do not deviate from the structure, do not add extra fields
- ALL CREDITS ARE POSITIVE, ALL DEBITS ARE NEGATIVE
- Do not use any extra characters, no markdown, no code blocks

categorization rules:
- food: restaurants, groceries, cafes, food delivery
- shopping: retail stores, online shopping, clothing, electronics
- leisure: entertainment, movies, games, sports, hobbies
- transport: fuel, parking, public transport, ride-sharing, car services
- utilities: electricity, water, gas, internet, phone bills
- healthcare: medical, pharmacy, insurance, dental
- transfer: bank transfers, atm withdrawals, peer-to-peer payments
- unknown: unclear or unidentifiable transactions`

function isValidTransaction(transaction: unknown): transaction is Transaction {
  return (
    typeof transaction === 'object' &&
    transaction !== null &&
    typeof (transaction as Transaction).date === 'string' &&
    typeof (transaction as Transaction).description === 'string' &&
    typeof (transaction as Transaction).amount === 'number' &&
    typeof (transaction as Transaction).type === 'string'
  )
}

function isValidExtractedPageData(data: unknown): data is ExtractedPageData {
  if (typeof data !== 'object' || data === null) {
    return false
  }

  const pageData = data as ExtractedPageData
  
  // Check if transactions array exists and is valid
  if (!Array.isArray(pageData.transactions)) {
    return false
  }

  // Check if all transactions are valid
  const allTransactionsValid = pageData.transactions.every(isValidTransaction)
  if (!allTransactionsValid) {
    return false
  }

  // Check initial_balance if it exists
  if (pageData.initial_balance !== undefined && typeof pageData.initial_balance !== 'number') {
    return false
  }

  return true
}

export async function POST(request: NextRequest): Promise<NextResponse<ExtractionResponse | ExtractionErrorResponse>> {
  try {
    const body: unknown = await request.json()
    
    // Type guard for request body
    if (!body || typeof body !== 'object' || !('images' in body)) {
      return NextResponse.json({ error: "No images provided" }, { status: 400 })
    }

    const { images } = body as ExtractionRequestBody

    if (!Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: "No images provided" }, { status: 400 })
    }

    // Validate that all images are strings
    if (!images.every(img => typeof img === 'string')) {
      return NextResponse.json({ error: "All images must be base64 strings" }, { status: 400 })
    }

    const extractedData: string[] = []

    // Process each image
    for (let i = 0; i < images.length; i++) {
      const base64Image = images[i]

      console.log(`Extracting data from page ${i + 1}...`)

      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: EXTRACTION_PROMPT },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        model: VISION_MODEL,
        max_tokens: 2000,
      })

      const pageResult = chatCompletion.choices[0]?.message?.content
      if (pageResult) {
        extractedData.push(pageResult)
      }

      // Add delay between requests to avoid rate limiting
      if (i < images.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    // Combine all extracted data
    let initialBalance: number | null = null
    const allTransactions: Transaction[] = []

    for (let i = 0; i < extractedData.length; i++) {
      const pageData = extractedData[i]
      try {
        const cleanData = pageData
          .trim()
          .replace(/```json/g, "")
          .replace(/```/g, "")
        
        const parsedData: unknown = JSON.parse(cleanData)
        
        // Validate the parsed data
        if (!isValidExtractedPageData(parsedData)) {
          console.error("Invalid data structure from page:", i + 1)
          console.error("Raw data:", pageData)
          continue
        }

        const pageResult: ExtractedPageData = parsedData

        // Extract initial balance from first page only
        if (i === 0 && pageResult.initial_balance !== undefined) {
          initialBalance = pageResult.initial_balance
        }

        // Add transactions from this page
        allTransactions.push(...pageResult.transactions)
      } catch (parseError) {
        console.error("Error parsing JSON from page:", parseError)
        console.error("Raw data:", pageData)
      }
    }

    console.log(`Extracted ${allTransactions.length} transactions`)

    // Return the combined result in the expected format
    const result: ExtractionResponse = {
      initial_balance: initialBalance,
      transactions: allTransactions
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error extracting transactions:", error)
    return NextResponse.json({ error: "Failed to extract transaction data" }, { status: 500 })
  }
}