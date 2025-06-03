"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Upload, FileText, X, CheckCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { analyzeTransactions } from "@/lib/transaction-analyzer"
import { 
  type PdfUploadProps, 
  type ExtractionApiResponse, 
  type ExtractionApiError,
  type AnalysisData 
} from "@/types/analysis"

export function PdfUpload({ onAnalysisComplete }: PdfUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const pdfFile = acceptedFiles[0]
    if (pdfFile && pdfFile.type === "application/pdf") {
      setFile(pdfFile)
      setError(null)
    } else {
      setError("Please upload a valid PDF file")
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024, // 10MB
  })

  const removeFile = () => {
    setFile(null)
    setError(null)
    setProgress(0)
    setStatus("")
  }

  const processFile = async () => {
    if (!file) return

    setIsProcessing(true)
    setProgress(0)
    setError(null)
    setStatus("Loading PDF.js...")

    try {
      // Dynamically import PDF.js
      const pdfjs = await import("pdfjs-dist")
      // Set up PDF.js worker
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url,
      ).toString();

      setProgress(10)
      setStatus("Reading PDF file...")

      // Convert file to array buffer
      const arrayBuffer = await file.arrayBuffer()

      setProgress(20)
      setStatus("Loading PDF document...")

      // Load PDF document
      const pdf = await pdfjs.getDocument({
        data: arrayBuffer,
        verbosity: 0,
      }).promise

      setProgress(30)
      setStatus(`Converting ${pdf.numPages} pages to images...`)

      const images: string[] = []

      // Convert each page to image
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum)
          const viewport = page.getViewport({ scale: 1.5 })

          // Create canvas
          const canvas = document.createElement("canvas")
          const context = canvas.getContext("2d")
          if (!context) {
            throw new Error("Failed to get canvas context")
          }
          
          canvas.height = viewport.height
          canvas.width = viewport.width

          // Render page to canvas
          await page.render({
            canvasContext: context,
            viewport: viewport,
          }).promise

          // Convert canvas to base64 image
          const imageData = canvas.toDataURL("image/jpeg", 0.8)
          const base64 = imageData.split(",")[1]

          if (base64 && base64.length > 100) {
            images.push(base64)
          }

          // Update progress
          const pageProgress = 30 + (pageNum / pdf.numPages) * 40
          setProgress(pageProgress)
          setStatus(`Converted page ${pageNum}/${pdf.numPages}`)

          // Clean up
          page.cleanup()
        } catch (pageError) {
          console.error(`Error processing page ${pageNum}:`, pageError)
          // Continue with other pages
        }
      }

      if (images.length === 0) {
        throw new Error("No pages could be converted from the PDF. Please ensure it's a valid bank statement.")
      }

      setProgress(70)
      setStatus(`Extracting transaction data from ${images.length} pages...`)

      // Send images to backend for extraction
      const extractResponse = await fetch("/api/extract-transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ images }),
      })

      if (!extractResponse.ok) {
        let errorData: ExtractionApiError
        try {
          errorData = await extractResponse.json()
        } catch {
          errorData = { error: "Unknown error" }
        }
        throw new Error(`Failed to extract transaction data: ${errorData.error || "Server error"}`)
      }

      const extractionResult: ExtractionApiResponse = await extractResponse.json()
      const { transactions, initial_balance } = extractionResult

      if (!transactions || transactions.length === 0) {
        throw new Error("No transactions found in the PDF. Please ensure it's a valid bank statement.")
      }

      setProgress(90)
      setStatus("Analyzing transactions locally...")

      // Analyze transactions on client side
      const analysis: AnalysisData = analyzeTransactions(transactions, initial_balance || 0)

      setProgress(100)
      setStatus("Analysis complete! Preparing dashboard...")

      console.log(`Analyzed ${transactions.length} transactions:`)
      console.log(`- Total Income: $${analysis.total_income.toFixed(2)}`)
      console.log(`- Total Expenditure: $${Math.abs(analysis.total_expenditure).toFixed(2)}`)
      console.log(
        `- Categories:`,
        Object.keys(analysis.expenditure_by_category).filter((cat) => analysis.expenditure_by_category[cat] !== 0),
      )

      // Show success message briefly before transitioning
      setTimeout(() => {
        onAnalysisComplete(analysis)
      }, 1000)
    } catch (err) {
      console.error("PDF processing error:", err)
      let errorMessage = "An error occurred while processing the PDF"

      if (err instanceof Error) {
        errorMessage = err.message
      }

      setError(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-4">
      {!file ? (
        <Card>
          <CardContent className="p-6">
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
                "hover:border-primary hover:bg-primary/5",
              )}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Upload Bank Statement</h3>
              <p className="text-muted-foreground mb-4">
                {isDragActive
                  ? "Drop your PDF file here..."
                  : "Drag and drop your bank statement PDF here, or click to browse"}
              </p>
              <Button variant="outline">Choose File</Button>
              <p className="text-xs text-muted-foreground mt-2">Supports PDF files up to 10MB</p>
            </div>
            {error && (
              <div className="flex items-center gap-2 mt-4 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              {!isProcessing && (
                <Button variant="ghost" size="sm" onClick={removeFile}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {isProcessing && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                  <span className="text-sm">{status}</span>
                </div>
                <Progress value={progress} className="w-full" />
                <p className="text-xs text-muted-foreground">
                  {progress < 70 ? "Processing in your browser for privacy" : "AI extraction and local analysis"}
                </p>
              </div>
            )}

            {!isProcessing && progress === 100 && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Analysis complete!</span>
              </div>
            )}

            {!isProcessing && progress === 0 && (
              <div className="space-y-2">
                <Button onClick={processFile} className="w-full">
                  Analyze Bank Statement
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  PDF processing and analysis happen locally for privacy
                </p>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 mt-4 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default PdfUpload