
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bookmark, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface SavedMessage {
  id: string;
  content: string;
  date: string;
}

export default function SavedItemsPage() {
  const [savedMessages, setSavedMessages] = useState<SavedMessage[]>([])
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null)

  useEffect(() => {
    const email = localStorage.getItem("currentUserEmail")
    setCurrentUserEmail(email)
  }, [])

  useEffect(() => {
    if (currentUserEmail) {
      const key = `savedMessages_${currentUserEmail}`
      const stored = localStorage.getItem(key)
      if (stored) {
        setSavedMessages(JSON.parse(stored))
      }
    }
  }, [currentUserEmail])

  const handleDelete = (id: string) => {
    if (!currentUserEmail) return;
    const updatedMessages = savedMessages.filter(msg => msg.id !== id)
    setSavedMessages(updatedMessages)
    localStorage.setItem(`savedMessages_${currentUserEmail}`, JSON.stringify(updatedMessages))
  }

  return (
    <div className="p-4 md:p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Saved Items</h1>
        <p className="text-muted-foreground">
          A collection of important messages you've saved from your chats.
        </p>
      </div>

      {savedMessages.length > 0 ? (
        <div className="space-y-4">
          {savedMessages.map((message) => (
            <Card key={message.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Bookmark className="w-5 h-5 text-primary" />
                  Saved Message
                </CardTitle>
                <CardDescription>
                  Saved on {new Date(message.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} at {new Date(message.date).toLocaleTimeString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{message.content}</p>
              </CardContent>
              <CardFooter>
                 <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm"><Trash2 className="mr-2"/> Delete</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete this saved message. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(message.id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 rounded-lg border-2 border-dashed">
          <h2 className="text-xl font-semibold">No Saved Items Yet</h2>
          <p className="text-muted-foreground mt-2">
            You can save important messages from your support chat by clicking the bookmark icon.
          </p>
        </div>
      )}
    </div>
  )
}
