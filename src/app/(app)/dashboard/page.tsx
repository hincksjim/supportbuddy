import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { FileText, MessageSquare } from "lucide-react"

const conversationSummaries = [
  {
    id: 1,
    title: "Discussing treatment side effects",
    date: "2 days ago",
    summary:
      "We talked about managing nausea and fatigue. Suggested drinking ginger tea and taking short, frequent rests...",
  },
  {
    id: 2,
    title: "Questions about medication schedule",
    date: "1 week ago",
    summary:
      "Clarified the timing for morning and evening pills. Set up a reminder system on your phone...",
  },
  {
    id: 3,
    title: "Feeling anxious about next appointment",
    date: "2 weeks ago",
    summary:
      "Practiced a few breathing exercises together. We also made a list of questions to ask the doctor...",
  },
]

const uploadedDocuments = [
  {
    id: 1,
    name: "blood_test_results.pdf",
    uploadDate: "3 days ago",
    status: "Analyzed",
  },
  {
    id: 2,
    name: "ct_scan_report.jpg",
    uploadDate: "1 week ago",
    status: "Analyzed",
  },
  {
    id: 3,
    name: "prescription_details.pdf",
    uploadDate: "2 weeks ago",
    status: "Analyzed",
  },
]

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Activity Overview</h1>
        <p className="text-muted-foreground">
          Here&apos;s a summary of your recent conversations and documents.
        </p>
      </div>

      <section>
        <h2 className="text-2xl font-semibold font-headline mb-4">
          Recent Conversation Summaries
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {conversationSummaries.map((convo) => (
            <Card key={convo.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  {convo.title}
                </CardTitle>
                <CardDescription>{convo.date}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{convo.summary}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold font-headline mb-4">
          Uploaded Documents
        </h2>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File Name</TableHead>
                <TableHead className="hidden sm:table-cell">
                  Upload Date
                </TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {uploadedDocuments.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{doc.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {doc.uploadDate}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline">{doc.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </section>
    </div>
  )
}
