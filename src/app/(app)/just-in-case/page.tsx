
"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { FileUp, Loader2, PlusCircle, FileText, X, ShieldCheck, Info, RefreshCw } from "lucide-react"

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
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface GoodbyeDocument {
  id: string
  title: string
  fileDataUri: string
  fileType: string
  fileName: string
  date: string
}

function UploadGoodbyeDocumentDialog({ onDocumentComplete }: { onDocumentComplete: (newDoc: GoodbyeDocument) => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [title, setTitle] = useState("")
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""))
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!file || !title.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a file and a title.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = async () => {
        const documentDataUri = reader.result as string

        const newDoc: GoodbyeDocument = {
          id: new Date().toISOString(),
          title,
          fileDataUri: documentDataUri,
          fileType: file.type,
          fileName: file.name,
          date: new Date().toISOString(),
        }

        onDocumentComplete(newDoc)
        setIsLoading(false)
        
        document.getElementById('close-upload-goodbyedoc-dialog')?.click()

        setFile(null)
        setTitle("")
      }
      reader.onerror = (error) => {
        throw error
      }
    } catch (error) {
      console.error("Document upload failed:", error)
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your document. Please try again.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="lg" className="fixed bottom-24 right-6 h-16 w-16 rounded-full shadow-lg md:bottom-8 md:right-8">
          <PlusCircle className="h-8 w-8" />
           <span className="sr-only">Add New Document</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add a "Goodbye" Document</DialogTitle>
            <DialogDescription>
              Upload an important document like a will or power of attorney. This is stored securely on your device.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Document Title</Label>
              <Input
                id="title"
                placeholder="e.g., 'Last Will and Testament'"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="document">Document File</Label>
              <div className="relative">
                <Input
                  id="document"
                  type="file"
                  className="absolute inset-0 z-10 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleFileChange}
                  accept="image/*,application/pdf"
                  required
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
          </div>
          <CardFooter className="p-0">
             <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Document"
                )}
              </Button>
              <DialogClose id="close-upload-goodbyedoc-dialog" className="hidden" />
          </CardFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ViewGoodbyeDocumentDialog({ doc, children }: { doc: GoodbyeDocument; children: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{doc.title}</DialogTitle>
          <DialogDescription>
            Uploaded on {new Date(doc.date).toLocaleDateString()}.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto rounded-md border flex-1">
            {doc.fileType.startsWith("image/") ? (
                <Image src={doc.fileDataUri} alt={doc.fileName} width={800} height={1200} className="object-contain" />
            ) : (
                <iframe src={doc.fileDataUri} className="w-full h-full" title={doc.fileName} />
            )}
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

export default function GoodbyePage() {
  const [documents, setDocuments] = useState<GoodbyeDocument[]>([])
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = () => {
    setIsLoading(true);
    const email = localStorage.getItem("currentUserEmail");
    setCurrentUserEmail(email);
    if (email) {
        try {
            const storedDocs = localStorage.getItem(`goodbyeDocs_${email}`);
            if (storedDocs) {
                setDocuments(JSON.parse(storedDocs));
            } else {
                setDocuments([]);
            }
        } catch (error) {
            console.error("Could not load documents from localStorage", error);
        }
    }
    setIsLoading(false);
  }
  
  useEffect(() => {
    loadData();
  }, [])

  const handleNewDocument = (newDoc: GoodbyeDocument) => {
    if (!currentUserEmail) return;
    const updatedDocs = [newDoc, ...documents]
    setDocuments(updatedDocs)
    try {
      localStorage.setItem(`goodbyeDocs_${currentUserEmail}`, JSON.stringify(updatedDocs))
    } catch (error) {
      console.error("Could not save documents to localStorage", error)
    }
  }

  const handleDelete = (id: string) => {
    if (!currentUserEmail) return;
    const updatedDocs = documents.filter(r => r.id !== id);
    setDocuments(updatedDocs);
    localStorage.setItem(`goodbyeDocs_${currentUserEmail}`, JSON.stringify(updatedDocs));
  }


  return (
    <div className="p-4 md:p-6 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold font-headline">Goodbye</h1>
            <p className="text-muted-foreground">
            A private space for your most important documents.
            </p>
        </div>
        <Button onClick={loadData} disabled={isLoading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
        </Button>
      </div>

      <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Planning for the Future</AlertTitle>
          <AlertDescription>
           While cancer treatments improve daily, sometimes no matter what treatment you receive, the cancer will win. This section is to help you plan for the end if you are deemed terminal, and helps you take control on what will happen in the end.
          </AlertDescription>
      </Alert>

       <Alert variant="destructive">
          <ShieldCheck className="h-4 w-4" />
          <AlertTitle>For Your Information</AlertTitle>
          <AlertDescription>
            This is a prototype. All documents uploaded here are stored **only on your current device's browser** and are not backed up online.
          </AlertDescription>
        </Alert>
      
      {documents.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {documents.map((doc) => (
            <ViewGoodbyeDocumentDialog key={doc.id} doc={doc}>
              <Card className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer flex flex-col h-full relative group">
                <CardHeader className="flex-shrink-0">
                  <div className="relative aspect-[1.4/1] w-full rounded-md overflow-hidden border">
                      <div className="flex flex-col items-center justify-center h-full bg-secondary p-4">
                          <FileText className="w-12 h-12 text-muted-foreground" />
                          <p className="text-xs text-center mt-2 text-muted-foreground break-all">{doc.fileName}</p>
                      </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between">
                   <div>
                    <CardTitle className="text-lg mb-2">{doc.title}</CardTitle>
                    <CardDescription className="text-xs mb-2">{new Date(doc.date).toLocaleDateString()}</CardDescription>
                   </div>
                </CardContent>
                <Button 
                    variant="destructive" 
                    size="icon" 
                    className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(doc.id);
                    }}
                >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                </Button>
              </Card>
            </ViewGoodbyeDocumentDialog>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 rounded-lg border-2 border-dashed">
            <h2 className="text-xl font-semibold">No Documents Yet</h2>
            <p className="text-muted-foreground mt-2">Click the '+' button to upload your first document.</p>
        </div>
      )}

      <UploadGoodbyeDocumentDialog onDocumentComplete={handleNewDocument} />
    </div>
  )
}
