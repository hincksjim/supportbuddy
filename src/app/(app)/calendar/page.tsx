
"use client"

import { useState, useEffect, useCallback } from "react"
import { DayPicker as DayPickerCalendar, type DayProps } from "react-day-picker"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
import { PlusCircle, Trash2, Edit, CalendarIcon } from "lucide-react"
import { format, isSameDay } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"

interface Appointment {
  id: string
  date: string // ISO string
  time: string
  title: string
  notes: string
}

function AppointmentDialog({
  onSave,
  existingAppointment,
  initialDate,
  open,
  onOpenChange,
}: {
  onSave: (appointment: Appointment) => void
  existingAppointment?: Appointment | null
  initialDate: Date | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [title, setTitle] = useState("")
  const [time, setTime] = useState("09:00")
  const [notes, setNotes] = useState("")
  const [appointmentDate, setAppointmentDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    if (open) {
      if (existingAppointment) {
        setTitle(existingAppointment.title)
        setTime(existingAppointment.time)
        setNotes(existingAppointment.notes)
        setAppointmentDate(new Date(existingAppointment.date));
      } else {
        setTitle("")
        setTime("09:00")
        setNotes("")
        setAppointmentDate(initialDate || new Date());
      }
    }
  }, [open, existingAppointment, initialDate])

  const handleSave = () => {
    if (!appointmentDate) return;
    const newAppointment: Appointment = {
      id: existingAppointment?.id || new Date().toISOString(),
      date: appointmentDate.toISOString(),
      time,
      title,
      notes,
    }
    onSave(newAppointment)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {existingAppointment ? "Edit" : "New"} Appointment
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                  <PopoverTrigger asChild>
                  <Button
                      variant={"outline"}
                      className={cn(
                      "w-full justify-start text-left font-normal",
                      !appointmentDate && "text-muted-foreground"
                      )}
                  >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {appointmentDate ? format(appointmentDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                  <DayPickerCalendar
                      mode="single"
                      selected={appointmentDate}
                      onSelect={setAppointmentDate}
                      initialFocus
                  />
                  </PopoverContent>
              </Popover>
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., GP Appointment"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="time">Time</Label>
            <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Discuss scan results"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave}>Save Appointment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)

  const getStorageKey = (email: string) => `appointments_${email}`

  const loadAppointments = useCallback(() => {
    if (!currentUserEmail) return
    try {
      const stored = localStorage.getItem(getStorageKey(currentUserEmail))
      if (stored) {
        setAppointments(JSON.parse(stored))
      }
    } catch (e) {
      console.error("Failed to load appointments:", e)
    }
  }, [currentUserEmail])

  const saveAppointments = (apps: Appointment[]) => {
    if (!currentUserEmail) return
    localStorage.setItem(getStorageKey(currentUserEmail), JSON.stringify(apps))
  }

  useEffect(() => {
    const email = localStorage.getItem("currentUserEmail")
    setCurrentUserEmail(email)
  }, [])

  useEffect(() => {
    loadAppointments()
  }, [loadAppointments])

  const handleSaveAppointment = (appointment: Appointment) => {
    let updatedAppointments
    const existingIndex = appointments.findIndex((a) => a.id === appointment.id)
    if (existingIndex > -1) {
      updatedAppointments = [...appointments]
      updatedAppointments[existingIndex] = appointment
    } else {
      updatedAppointments = [...appointments, appointment]
    }
    setAppointments(updatedAppointments)
    saveAppointments(updatedAppointments)
  }

  const handleDeleteAppointment = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent the li's onClick from firing
    const updatedAppointments = appointments.filter((a) => a.id !== id)
    setAppointments(updatedAppointments)
    saveAppointments(updatedAppointments)
  }

  const handleNewAppointment = () => {
    setEditingAppointment(null)
    setIsDialogOpen(true)
  }

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment)
    setIsDialogOpen(true)
  }

  const selectedDayAppointments = appointments
    .filter((app) => date && isSameDay(new Date(app.date), date))
    .sort((a, b) => a.time.localeCompare(b.time))

  const CustomDay = (dayProps: DayProps) => {
    const { date, displayMonth } = dayProps;
    const hasAppointment = appointments.some((app) => isSameDay(new Date(app.date), date));
    return (
      <div className="relative">
        <button {...dayProps} className="react-day-picker-Day-button">
          {date.getDate()}
        </button>
        {hasAppointment && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
        )}
      </div>
    );
  };

  return (
    <>
      <div className="grid h-full grid-cols-1 md:grid-cols-2 gap-6 p-4 md:p-6">
        <Card>
          <CardContent className="p-2 md:p-4 flex justify-center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md"
              appointments={appointments}
            />
          </CardContent>
        </Card>
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Appointments</CardTitle>
                <CardDescription>{date ? format(date, "PPP") : "Select a date"}</CardDescription>
              </div>
              <Button onClick={handleNewAppointment}>
                <PlusCircle className="mr-2" /> New
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            {date && selectedDayAppointments.length > 0 ? (
              <ul className="space-y-4">
                {selectedDayAppointments.map((app) => (
                  <li
                    key={app.id}
                    className="p-4 border rounded-lg bg-muted/50 flex justify-between items-start cursor-pointer hover:bg-accent"
                    onClick={() => handleEditAppointment(app)}
                  >
                    <div>
                      <p className="font-semibold">{app.title}</p>
                      <p className="text-sm text-muted-foreground">{app.time}</p>
                      {app.notes && <p className="text-sm mt-2 whitespace-pre-wrap">{app.notes}</p>}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleEditAppointment(app); }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={(e) => handleDeleteAppointment(e, app.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-10 rounded-lg border-2 border-dashed">
                <h3 className="text-lg font-semibold">No Appointments</h3>
                <p className="text-muted-foreground mt-1">
                  {date ? "You have no appointments for this day." : "Select a day to see appointments."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <AppointmentDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSaveAppointment}
        existingAppointment={editingAppointment}
        initialDate={date}
      />
    </>
  )
}
