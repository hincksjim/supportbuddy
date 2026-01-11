
"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { FileUp, Loader2, PlusCircle, FileText, X } from "lucide-react"
import { marked } from "marked"
import JSZip from 'jszip';

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { analyzeMedicalDocument } from "@/ai/flows/analyze-medical-document"

export interface AnalysisFile {
  fileDataUri: string;
  fileType: string;
  fileName: string;
}

export interface AnalysisResult {
  id: string
  title: string
  question: string
  files: AnalysisFile[]
  analysis: string
  date: string
}

const MAX_SAVED_ANALYSES = 10;

function UploadAnalysisDialog({ onAnalysisComplete }: { onAnalysisComplete: (newAnalysis: AnalysisResult) => void }) {
  const [files, setFiles] = useState<File[]>([])
  const [question, setQuestion] = useState("Summarize the key findings in this document.")
  const [isLoading, setIsLoading] = useState(false)
  const [title, setTitle] = useState("")
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(selectedFiles);
      if (selectedFiles.length === 1) {
        setTitle(selectedFiles[0].name.replace(/\.[^/.]+$/, ""));
      } else if (selectedFiles.length > 1) {
        setTitle("Multiple Files Analysis");
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (files.length === 0 || !question.trim() || !title.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide at least one file, a title, and a question.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true);

    try {
        let filesToProcess: { name: string, type: string, dataUri: string }[] = [];

        for (const file of files) {
            if (file.name.toLowerCase().endsWith('.zip')) {
                const zip = await JSZip.loadAsync(file);
                for (const relativePath in zip.files) {
                    if (!zip.files[relativePath].dir) {
                        const zipFile = zip.files[relativePath];
                        const blob = await zipFile.async('blob');
                        const dataUri = await new Promise<string>((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = e => resolve(e.target?.result as string);
                            reader.onerror = reject;
                            reader.readAsDataURL(blob);
                        });
                        filesToProcess.push({ name: zipFile.name, type: blob.type, dataUri });
                    }
                }
            } else {
                 const dataUri = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = e => resolve(e.target?.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
                filesToProcess.push({ name: file.name, type: file.type, dataUri });
            }
        }
        
        let combinedAnalysis = "";
        for (const fileToProcess of filesToProcess) {
            const analysisResult = await analyzeMedicalDocument({ documentDataUri: fileToProcess.dataUri, question });
            combinedAnalysis += `\n\n---\n\n### Analysis for: ${fileToProcess.name}\n\n${analysisResult.answer}`;
        }
        
        const newAnalysisResult: AnalysisResult = {
            id: new Date().toISOString(),
            title,
            question,
            files: filesToProcess.map(f => ({ fileName: f.name, fileType: f.type, fileDataUri: f.dataUri })),
            analysis: combinedAnalysis.trim(),
            date: new Date().toISOString(),
        };

        onAnalysisComplete(newAnalysisResult);
        document.getElementById('close-upload-dialog')?.click();

    } catch (error) {
        console.error("Analysis failed:", error);
        toast({
            title: "Analysis Failed",
            description: "There was an error analyzing your document(s). Please try again.",
            variant: "destructive",
        });
    } finally {
        setIsLoading(false);
        setFiles([]);
        setTitle("");
        setQuestion("Summarize the key findings in this document.");
    }
  }

  return (
    <Dialog onOpenChange={(open) => { if(!open) { setFiles([]); setTitle(""); }}}>
      <DialogTrigger asChild>
        <Button size="lg" className="fixed bottom-24 right-6 h-16 w-16 rounded-full shadow-lg md:bottom-8 md:right-8">
          <PlusCircle className="h-8 w-8" />
           <span className="sr-only">Add New Analysis</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Analyze New Document(s)</DialogTitle>
            <DialogDescription>
              Upload one or more documents (or a ZIP file) to get an AI-powered analysis.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Analysis Title</Label>
              <Input
                id="title"
                placeholder="e.g., 'Annual Health Checkup'"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="document">Medical Document(s)</Label>
              <div className="relative">
                <Input
                  id="document"
                  type="file"
                  className="absolute inset-0 z-10 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleFileChange}
                  accept="application/pdf,image/jpeg,image/png,.zip"
                  required
                  multiple
                />
                <div className="flex items-center justify-center w-full min-h-24 p-2 border-2 border-dashed rounded-md hover:border-primary transition-colors">
                  <div className="text-center">
                    <FileUp className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      {files.length > 0 ? `${files.length} file(s) selected` : "Click or drag to upload"}
                    </p>
                     {files.length > 0 && <p className="text-xs text-muted-foreground">{files.map(f => f.name).join(', ')}</p>}
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="question">Question</Label>
              <Textarea
                id="question"
                placeholder="e.g., 'What are the key findings in these documents?'"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="min-h-[80px]"
                required
              />
            </div>
          </div>
          <CardFooter className="p-0">
             <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Analyze and Save"
                )}
              </Button>
              <DialogClose id="close-upload-dialog" className="hidden" />
          </CardFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ViewAnalysisDialog({ result, children }: { result: AnalysisResult; children: React.ReactNode }) {
  const analysisHtml = marked.parse(result.analysis || "");

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{result.title}</DialogTitle>
          <DialogDescription>
            Analyzed on {new Date(result.date).toLocaleDateString()}. Question: "{result.question}"
          </DialogDescription>
        </DialogHeader>
        <div className="grid md:grid-cols-2 gap-4 overflow-hidden flex-1">
          <div className="overflow-y-auto rounded-md border p-2 space-y-2">
             <h3 className="font-semibold text-sm px-2">Source Documents ({result.files.length})</h3>
             {result.files.map((file, index) => (
                 <Card key={index} className="p-2">
                    {file.fileType.startsWith("image/") ? (
                        <Image src={file.fileDataUri} alt={file.fileName} width={400} height={600} className="object-contain w-full" />
                    ) : (
                        <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                            <FileText className="w-6 h-6 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{file.fileName}</span>
                        </div>
                    )}
                 </Card>
             ))}
          </div>
          <div 
            className="prose prose-sm dark:prose-invert max-w-none text-foreground p-2 overflow-y-auto"
            dangerouslySetInnerHTML={{ __html: analysisHtml as string }}
          />
        </div>
         <DialogFooter className="mt-4 sm:justify-end">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function DocumentAnalysisPage() {
  const [results, setResults] = useState<AnalysisResult[]>([])
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const { toast } = useToast();

  const loadResults = useCallback(() => {
    if (!currentUserEmail) return;
    try {
        const storedResults = localStorage.getItem(`analysisResults_${currentUserEmail}`);
        if (storedResults) {
            const parsedResults = JSON.parse(storedResults);
            parsedResults.sort((a: AnalysisResult, b: AnalysisResult) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setResults(parsedResults);
        }
    } catch (error) {
        console.error("Could not load analysis results from localStorage", error);
    }
  }, [currentUserEmail]);

  useEffect(() => {
    const email = localStorage.getItem("currentUserEmail");
    setCurrentUserEmail(email);
  }, []);
  
  useEffect(() => {
    if (currentUserEmail) {
        loadResults();
    }
  }, [currentUserEmail, loadResults])

  useEffect(() => {
    window.addEventListener('focus', loadResults);
    return () => {
        window.removeEventListener('focus', loadResults);
    }
  }, [loadResults]);


  const handleNewAnalysis = (newAnalysis: AnalysisResult) => {
    if (!currentUserEmail) return;
    
    const updatedResults = [newAnalysis, ...results]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, MAX_SAVED_ANALYSES);

    setResults(updatedResults);
    
    try {
      localStorage.setItem(`analysisResults_${currentUserEmail}`, JSON.stringify(updatedResults));
    } catch (error: any) {
        if (error.name === 'QuotaExceededError') {
            toast({
                variant: 'destructive',
                title: 'Storage Limit Reached',
                description: 'The oldest analysis was removed to make space. Your new analysis has been saved.',
            });
        } else {
             console.error("Could not save analysis results to localStorage", error)
             toast({
                variant: 'destructive',
                title: 'Save Error',
                description: 'There was an issue saving your analysis.',
            });
        }
    }
  }

  const handleDelete = (id: string) => {
    if (!currentUserEmail) return;
    const updatedResults = results.filter(r => r.id !== id);
    setResults(updatedResults);
    localStorage.setItem(`analysisResults_${currentUserEmail}`, JSON.stringify(updatedResults));
  }


  return (
    <div className="p-4 md:p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold font-headline">Document Analysis History</h1>
            <p className="text-muted-foreground">
            Review your past document analyses. All data is stored on your device.
            </p>
        </div>
      </div>
      
      {results.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.map((result) => (
            <ViewAnalysisDialog key={result.id} result={result}>
              <Card className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer flex flex-col h-full relative group">
                <CardHeader className="flex-shrink-0">
                  <div className="relative aspect-[1.4/1] w-full rounded-md overflow-hidden border">
                    {result.files?.[0]?.fileType?.startsWith("image/") ? (
                      <Image src={result.files[0].fileDataUri} alt={result.files[0].fileName} fill className="object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full bg-secondary p-4">
                          <FileText className="w-12 h-12 text-muted-foreground" />
                          <p className="text-xs text-center mt-2 text-muted-foreground break-all">{result.files[0]?.fileName || 'Document'}</p>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between">
                   <div>
                    <CardTitle className="text-lg mb-2">{result.title}</CardTitle>
                    <CardDescription className="text-xs mb-2">{new Date(result.date).toLocaleDateString()}</CardDescription>
                    <div 
                        className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground line-clamp-3"
                        dangerouslySetInnerHTML={{ __html: marked.parse(result.analysis || "") as string }}
                    />
                   </div>
                </CardContent>
                <Button 
                    variant="destructive" 
                    size="icon" 
                    className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(result.id);
                    }}
                >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                </Button>
              </Card>
            </ViewAnalysisDialog>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 rounded-lg border-2 border-dashed">
            <h2 className="text-xl font-semibold">No Analyses Yet</h2>
            <p className="text-muted-foreground mt-2">Click the '+' button to upload your first document.</p>
        </div>
      )}

      <UploadAnalysisDialog onAnalysisComplete={handleNewAnalysis} />
    </div>
  )
}

    