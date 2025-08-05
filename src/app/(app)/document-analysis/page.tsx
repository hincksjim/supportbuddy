"use client"

import { useState } from "react"
import { FileUp, Loader2, FileQuestion } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { analyzeMedicalDocument } from "@/ai/flows/analyze-medical-document"

export default function DocumentAnalysisPage() {
  const [file, setFile] = useState<File | null>(null)
  const [question, setQuestion] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!file || !question.trim()) {
      toast({
        title: "Missing Information",
        description: "Please upload a document and ask a question.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const documentDataUri = reader.result as string;
        const analysisResult = await analyzeMedicalDocument({ documentDataUri, question })
        setResult(analysisResult.answer)
        setIsLoading(false)
      };
      reader.onerror = (error) => {
        throw error
      }
    } catch (error) {
      console.error("Analysis failed:", error)
      toast({
        title: "Analysis Failed",
        description: "There was an error analyzing your document. Please try again.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Document Analysis</h1>
        <p className="text-muted-foreground">
          Upload a medical document and ask a question to get an AI-powered analysis.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card className="shadow-lg">
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Upload and Ask</CardTitle>
              <CardDescription>
                Provide a document and your question below.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="document">Medical Document</Label>
                <div className="relative">
                  <Input
                    id="document"
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileChange}
                    accept="image/*,application/pdf"
                  />
                  <div className="flex items-center justify-center w-full h-24 border-2 border-dashed rounded-md hover:border-primary transition-colors">
                    <div className="text-center">
                        <FileUp className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">
                            {file ? file.name : "Click to upload a file"}
                        </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="question">Your Question</Label>
                <Textarea
                  id="question"
                  placeholder="e.g., 'What are the key findings in this report?' or 'Please summarize this document.'"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Analyze Document"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
        
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Analysis Result</CardTitle>
            <CardDescription>
              The AI's answer to your question will appear here.
            </CardDescription>
          </CardHeader>
          <CardContent className="min-h-[260px] flex items-center justify-center">
            {isLoading && (
              <div className="text-center text-muted-foreground">
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
                <p>Analyzing your document, please wait...</p>
              </div>
            )}
            {!isLoading && !result && (
              <div className="text-center text-muted-foreground">
                <FileQuestion className="mx-auto h-12 w-12 mb-4" />
                <p>Your result will be shown here once the analysis is complete.</p>
              </div>
            )}
            {result && (
              <div className="prose prose-sm dark:prose-invert max-w-none text-foreground">
                <p>{result}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
