"use client"

import { useState } from "react"
import { PdfUpload } from "@/components/pdf-upload"
import { FinancialDashboard } from "@/components/financial-dashboard"
import type { AnalysisData } from "@/types/analysis"

export function PdfUploadPage() {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null)
  const [showUpload, setShowUpload] = useState(true)

  const handleAnalysisComplete = (data: AnalysisData) => {
    setAnalysisData(data)
    setShowUpload(false)
  }

  const handleNewUpload = () => {
    setAnalysisData(null)
    setShowUpload(true)
  }

  if (showUpload || !analysisData) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold tracking-tight mb-4">Bank Statement Analyzer</h1>
            <p className="text-lg text-muted-foreground">
              Upload your bank statement PDF and get instant AI-powered financial analysis
            </p>
          </div>
          <PdfUpload onAnalysisComplete={handleAnalysisComplete} />
        </div>
      </div>
    )
  }

  return <FinancialDashboard data={analysisData} onNewUpload={handleNewUpload} />
}
