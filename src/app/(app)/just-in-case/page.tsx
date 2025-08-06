"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  FileUp, Loader2, PlusCircle, FileText, X, ShieldCheck, Info, RefreshCw,
  MessageSquare, BookOpen, Wrench, Heart, Computer, Vault, Save, Trash2, Video, AudioLines, Gavel, Printer, Download
} from "lucide-react"
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
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
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
import Image from "next/image"

// Main data structure for the entire page
interface GoodbyeData {
  messages: MessageToLovedOne[];
  lifeAdvice: {
    lessons: string;
    stories: string;
    legacy: string;
    regrets: string;
  };
  practicalInstructions: {
    documentsLocation: string;
    passwordAccess: string;
    homeCare: string;
    subscriptions: string;
  };
  endOfLifeWishes: {
    funeral: string;
    memorialMedia: string;
    peopleToInform: string;
    organDonation: string;
  };
  digitalLegacy: {
    socialMedia: string;
    photosAndVideos: string;
    digitalContent: string;
    onlineAccounts: string;
  };
  will: {
    executors: string;
    guardians: string;
    assetDistribution: string;
    personalWishes: string;
    latestWill: LatestWill | null;
  };
  memoryVault: VaultItem[];
}

interface MessageToLovedOne {
  id: string;
  recipient: string;
  message: string;
}

interface VaultItem {
  id: string;
  title: string;
  fileDataUri: string;
  fileType: string;
  fileName: string;
  date: string;
}

interface LatestWill {
    fileDataUri: string;
    fileName: string;
    fileType: string;
    uploadDate: string;
}

const initialData: GoodbyeData = {
  messages: [],
  lifeAdvice: { lessons: "", stories: "", legacy: "", regrets: "" },
  practicalInstructions: { documentsLocation: "", passwordAccess: "", homeCare: "", subscriptions: "" },
  endOfLifeWishes: { funeral: "", memorialMedia: "", peopleToInform: "", organDonation: "" },
  digitalLegacy: { socialMedia: "", photosAndVideos: "", digitalContent: "", onlineAccounts: "" },
  will: { executors: "", guardians: "", assetDistribution: "", personalWishes: "", latestWill: null },
  memoryVault: [],
};

// Component for a single text area section
function TextSection({ title, description, value, onChange, disabled = false }: { title: string, description: string, value: string, onChange: (val: string) => void, disabled?: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={6}
          placeholder={`Your notes on ${title.toLowerCase()}...`}
          disabled={disabled}
        />
      </CardContent>
    </Card>
  )
}

// Component for Messages to Loved Ones
function MessagesTab({ data, setData, disabled }: { data: MessageToLovedOne[], setData: (d: MessageToLovedOne[]) => void, disabled: boolean }) {
    const addMessage = () => {
        const newMessage = { id: new Date().toISOString(), recipient: "", message: "" };
        setData([...data, newMessage]);
    }
    const updateMessage = (id: string, field: 'recipient' | 'message', value: string) => {
        setData(data.map(msg => msg.id === id ? { ...msg, [field]: value } : msg));
    }
    const deleteMessage = (id: string) => {
        setData(data.filter(msg => msg.id !== id));
    }

    return (
        <div className="space-y-4">
            {data.map(msg => (
                <Card key={msg.id}>
                    <CardContent className="pt-6 space-y-4">
                        <div className="flex justify-end">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMessage(msg.id)} disabled={disabled}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={`recipient-${msg.id}`}>Recipient Name/Group</Label>
                            <Input id={`recipient-${msg.id}`} value={msg.recipient} onChange={(e) => updateMessage(msg.id, 'recipient', e.target.value)} placeholder="e.g., My children, My partner" disabled={disabled} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={`message-${msg.id}`}>Message</Label>
                            <Textarea id={`message-${msg.id}`} value={msg.message} onChange={(e) => updateMessage(msg.id, 'message', e.target.value)} placeholder="Your letter or message..." rows={5} disabled={disabled}/>
                        </div>
                    </CardContent>
                </Card>
            ))}
            <Button onClick={addMessage} disabled={disabled}><PlusCircle className="mr-2"/> Add Message</Button>
        </div>
    )
}

function ViewWillDialog({ will, children }: { will: LatestWill; children: React.ReactNode }) {
    const handlePrint = () => {
        const iframe = document.getElementById('will-iframe') as HTMLIFrameElement;
        if (iframe) {
            iframe.contentWindow?.print();
        } else {
            const printable = window.open('', '_blank');
            printable?.document.write(`<html><head><title>Print Will</title></head><body><img src="${will.fileDataUri}" style="max-width:100%;" /></body></html>`);
            printable?.document.close();
            printable?.print();
        }
    }

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = will.fileDataUri;
        link.download = will.fileName || 'will-document';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Will Document: {will.fileName}</DialogTitle>
          <DialogDescription>
            Uploaded on {new Date(will.uploadDate).toLocaleDateString()}.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto rounded-md border flex-1">
          {will.fileType.startsWith("image/") ? (
              <Image src={will.fileDataUri} alt={will.fileName} width={800} height={1200} className="object-contain" />
          ) : (
              <iframe id="will-iframe" src={will.fileDataUri} className="w-full h-full" title={will.fileName} />
          )}
        </div>
         <DialogFooter className="mt-4 sm:justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleDownload}>
              <Download className="mr-2" />
              Download
            </Button>
            <Button type="button" onClick={handlePrint}>
              <Printer className="mr-2" />
              Print
            </Button>
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

// Component for Will tab
function WillTab({ data, setData, disabled }: { data: GoodbyeData['will'], setData: (d: GoodbyeData['will']) => void, disabled: boolean }) {
    const { toast } = useToast();
    const [isUploading, setIsUploading] = useState(false);
    const [hasWill, setHasWill] = useState(!!data.latestWill);

    const handleTextChange = (field: keyof Omit<GoodbyeData['will'], 'latestWill'>, value: string) => {
        setData({ ...data, [field]: value });
    }
    
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        setIsUploading(true);

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const newWill: LatestWill = {
                fileDataUri: reader.result as string,
                fileName: file.name,
                fileType: file.type,
                uploadDate: new Date().toISOString(),
            };
            setData({ ...data, latestWill: newWill });
            setIsUploading(false);
            toast({ title: "Will uploaded successfully" });
        };
        reader.onerror = () => {
            setIsUploading(false);
            toast({ title: "File upload failed", variant: "destructive" });
        };
    };

    const removeWill = () => {
        setData({ ...data, latestWill: null });
    }

    return (
        <div className="space-y-6">
             <Card>
                <CardHeader>
                     <div className="flex items-center space-x-2">
                        <Switch id="has-will-switch" checked={hasWill} onCheckedChange={setHasWill} disabled={disabled}/>
                        <Label htmlFor="has-will-switch" className="text-base font-semibold">Do you have a will to upload?</Label>
                    </div>
                </CardHeader>
                <CardContent>
                    {hasWill ? (
                        // "I have a will" view
                         <Card>
                            <CardHeader>
                                <CardTitle>Latest Will Document</CardTitle>
                                <CardDescription>Upload a copy of your most recent official will. Click to view.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {data.latestWill ? (
                                    <ViewWillDialog will={data.latestWill}>
                                        <div className="flex items-center justify-between p-4 border rounded-md bg-muted/50 hover:bg-muted cursor-pointer transition-colors">
                                            <div className="flex items-center gap-4">
                                                <FileText className="w-8 h-8 text-primary"/>
                                                <div>
                                                    <p className="font-semibold">{data.latestWill.fileName}</p>
                                                    <p className="text-sm text-muted-foreground">Uploaded on {new Date(data.latestWill.uploadDate).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); removeWill() }} disabled={disabled} className="text-destructive hover:bg-destructive/10">
                                                <Trash2 className="w-4 h-4"/>
                                            </Button>
                                        </div>
                                    </ViewWillDialog>
                                ) : (
                                    <div className="relative">
                                        <Input
                                        id="will-upload"
                                        type="file"
                                        className="absolute inset-0 z-10 w-full h-full opacity-0 cursor-pointer"
                                        onChange={handleFileUpload}
                                        disabled={isUploading || disabled}
                                        accept="application/pdf,image/*"
                                        />
                                        <div className="flex items-center justify-center w-full h-24 border-2 border-dashed rounded-md hover:border-primary transition-colors">
                                        {isUploading ? <Loader2 className="h-8 w-8 animate-spin"/> : (
                                            <div className="text-center">
                                                <FileUp className="mx-auto h-8 w-8 text-muted-foreground" />
                                                <p className="mt-2 text-sm text-muted-foreground">Click to upload your will</p>
                                            </div>
                                        )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        // "I don't have a will" view
                        <div className="space-y-4">
                            <TextSection title="Executors" description="The person or people you would like to carry out your wishes." value={data.executors} onChange={(v) => handleTextChange('executors', v)} disabled={disabled} />
                            <TextSection title="Guardians" description="Who you would like to look after any children or pets." value={data.guardians} onChange={(v) => handleTextChange('guardians', v)} disabled={disabled} />
                            <TextSection title="Asset Distribution" description="Your general wishes for how your property and belongings should be distributed." value={data.assetDistribution} onChange={(v) => handleTextChange('assetDistribution', v)} disabled={disabled} />
                            <TextSection title="Personal Wishes" description="Any other specific personal wishes or items you want to mention." value={data.personalWishes} onChange={(v) => handleTextChange('personalWishes', v)} disabled={disabled} />
                        </div>
                    )}
                </CardContent>
            </Card>

            {!hasWill && (
              <Alert variant="destructive">
                  <Gavel className="h-4 w-4" />
                  <AlertTitle>Not a Legal Document</AlertTitle>
                  <AlertDescription>
                    The information in this section is for guidance only and is **not** a legally binding will. Please consult a solicitor to create an official will.
                  </AlertDescription>
              </Alert>
            )}
        </div>
    )
}


// Component for Memory Vault
function MemoryVaultTab({ data, setData, disabled }: { data: VaultItem[], setData: (d: VaultItem[]) => void, disabled: boolean }) {
    const { toast } = useToast();
    const [isUploading, setIsUploading] = useState(false);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        setIsUploading(true);

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const newVaultItem: VaultItem = {
                id: new Date().toISOString(),
                title: file.name.replace(/\.[^/.]+$/, ""),
                fileDataUri: reader.result as string,
                fileType: file.type,
                fileName: file.name,
                date: new Date().toISOString(),
            };
            setData([...data, newVaultItem].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
            setIsUploading(false);
            toast({ title: "File added to vault" });
        };
        reader.onerror = () => {
            setIsUploading(false);
            toast({ title: "File upload failed", variant: "destructive" });
        };
    };

    const deleteItem = (id: string) => {
        setData(data.filter(item => item.id !== id));
    };
    
    const getIconForFileType = (fileType: string) => {
        if (fileType.startsWith("image/")) return <FileText className="w-12 h-12 text-muted-foreground" />;
        if (fileType.startsWith("video/")) return <Video className="w-12 h-12 text-muted-foreground" />;
        if (fileType.startsWith("audio/")) return <AudioLines className="w-12 h-12 text-muted-foreground" />;
        return <FileText className="w-12 h-12 text-muted-foreground" />;
    }

    return (
        <div className="space-y-6">
             <Card>
                <CardHeader>
                    <CardTitle>Upload a new file</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative">
                        <Input
                        id="vault-upload"
                        type="file"
                        className="absolute inset-0 z-10 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleFileUpload}
                        disabled={isUploading || disabled}
                        />
                        <div className="flex items-center justify-center w-full h-24 border-2 border-dashed rounded-md hover:border-primary transition-colors">
                        {isUploading ? <Loader2 className="h-8 w-8 animate-spin"/> : (
                            <div className="text-center">
                                <FileUp className="mx-auto h-8 w-8 text-muted-foreground" />
                                <p className="mt-2 text-sm text-muted-foreground">Click to upload a file</p>
                            </div>
                        )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {data.length > 0 && (
                 <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {data.map((item) => (
                    <Card key={item.id} className="shadow-lg hover:shadow-xl transition-shadow flex flex-col h-full relative group">
                        <CardHeader className="flex-shrink-0">
                        <div className="relative aspect-[1.4/1] w-full rounded-md overflow-hidden border">
                            {item.fileType.startsWith("image/") ? (
                                <img src={item.fileDataUri} alt={item.fileName} className="object-cover w-full h-full" />
                            ) : (
                            <div className="flex flex-col items-center justify-center h-full bg-secondary p-4">
                                {getIconForFileType(item.fileType)}
                                <p className="text-xs text-center mt-2 text-muted-foreground break-all">{item.fileName}</p>
                            </div>
                            )}
                        </div>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col justify-between pt-4">
                        <div>
                            <CardTitle className="text-lg mb-2">{item.title}</CardTitle>
                            <CardDescription className="text-xs mb-2">{new Date(item.date).toLocaleDateString()}</CardDescription>
                        </div>
                        </CardContent>
                        <Button 
                            variant="destructive" 
                            size="icon" 
                            className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                                e.stopPropagation();
                                deleteItem(item.id);
                            }}
                            disabled={disabled}
                        >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                        </Button>
                    </Card>
                    ))}
                </div>
            )}
        </div>
    )
}


export default function GoodbyePage() {
  const [data, setData] = useState<GoodbyeData>(initialData);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const dataRef = useRef(data);

  useEffect(() => {
      dataRef.current = data;
  }, [data]);

  const loadData = useCallback(() => {
    setIsLoading(true);
    const email = localStorage.getItem("currentUserEmail");
    if (email) {
      setCurrentUserEmail(email);
      try {
        const storedData = localStorage.getItem(`goodbyeData_${email}`);
        if (storedData) {
          setData(JSON.parse(storedData));
        } else {
          setData(initialData);
        }
      } catch (error) {
        console.error("Could not load data from localStorage", error);
        setData(initialData);
      }
    }
    setIsLoading(false);
  }, []);
  
  const saveData = useCallback(() => {
    if (!currentUserEmail) return;
    try {
        localStorage.setItem(`goodbyeData_${currentUserEmail}`, JSON.stringify(dataRef.current));
    } catch(e) {
        console.error("Could not save data", e);
    }
  }, [currentUserEmail]);

  useEffect(() => {
    loadData();
    // This will save data when the user navigates away or closes the tab.
    const handleBeforeUnload = () => {
        saveData();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
        saveData(); // Save on component unmount (e.g., navigating between pages)
        window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [loadData, saveData]);

  const handleFieldChange = (tab: keyof Omit<GoodbyeData, 'messages' | 'memoryVault' | 'will'>, field: string, value: string) => {
    setData(prev => {
        const newData = JSON.parse(JSON.stringify(prev)); // Deep copy
        (newData[tab] as any)[field] = value;
        return newData;
    });
  };
  
  const handleMessageChange = (messages: MessageToLovedOne[]) => {
      setData(prev => ({...prev, messages}));
  }
  
  const handleVaultChange = (items: VaultItem[]) => {
      setData(prev => ({...prev, memoryVault: items}));
  }
  
  const handleWillChange = (willData: GoodbyeData['will']) => {
      setData(prev => ({ ...prev, will: willData }));
  }

  if (isLoading) {
      return (
          <div className="flex justify-center items-center h-full p-6">
              <Loader2 className="h-8 w-8 animate-spin"/>
          </div>
      )
  }

  return (
    <div className="p-4 md:p-6 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold font-headline">Just In Case</h1>
            <p className="text-muted-foreground">
            A private space for your most important thoughts and instructions.
            </p>
        </div>
        <div className="flex gap-2">
            <Button onClick={saveData}><Save className="mr-2 h-4 w-4" /> Save Now</Button>
            <Button onClick={loadData} variant="outline" disabled={isLoading}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
            </Button>
        </div>
      </div>
      
        <Tabs defaultValue="messages" className="w-full">
            <TabsList className="grid w-full grid-cols-1 md:grid-cols-7 h-auto">
                <TabsTrigger value="messages"><MessageSquare className="mr-2"/>Messages</TabsTrigger>
                <TabsTrigger value="advice"><BookOpen className="mr-2"/>Advice</TabsTrigger>
                <TabsTrigger value="instructions"><Wrench className="mr-2"/>Instructions</TabsTrigger>
                <TabsTrigger value="wishes"><Heart className="mr-2"/>Wishes</TabsTrigger>
                <TabsTrigger value="legacy"><Computer className="mr-2"/>Digital Legacy</TabsTrigger>
                <TabsTrigger value="will"><Gavel className="mr-2"/>Will</TabsTrigger>
                <TabsTrigger value="vault"><Vault className="mr-2"/>Memory Vault</TabsTrigger>
            </TabsList>
            
            <TabsContent value="messages" className="pt-4">
                <MessagesTab data={data.messages} setData={handleMessageChange} disabled={isLoading}/>
            </TabsContent>
            
            <TabsContent value="advice" className="pt-4 space-y-4">
                <TextSection title="Life Lessons & Advice" description="Wisdom you want to pass on to others." value={data.lifeAdvice.lessons} onChange={(v) => handleFieldChange('lifeAdvice', 'lessons', v)} disabled={isLoading} />
                <TextSection title="Life Stories & Heritage" description="Share stories about your life, background, and heritage." value={data.lifeAdvice.stories} onChange={(v) => handleFieldChange('lifeAdvice', 'stories', v)} disabled={isLoading}/>
                <TextSection title="How I Want To Be Remembered" description="The values, memories, or accomplishments you want people to remember." value={data.lifeAdvice.legacy} onChange={(v) => handleFieldChange('lifeAdvice', 'legacy', v)} disabled={isLoading}/>
                <TextSection title="Regrets or Warnings" description="Things you might regret or want others to avoid." value={data.lifeAdvice.regrets} onChange={(v) => handleFieldChange('lifeAdvice', 'regrets', v)} disabled={isLoading}/>
            </TabsContent>

            <TabsContent value="instructions" className="pt-4 space-y-4">
                <TextSection title="Location of Important Documents" description="Where to find things like your will, birth certificate, property deeds, etc. (Do not upload them here unless encrypted)." value={data.practicalInstructions.documentsLocation} onChange={(v) => handleFieldChange('practicalInstructions', 'documentsLocation', v)} disabled={isLoading}/>
                <TextSection title="Password Access" description="Instructions on how to access your password manager (e.g., LastPass, Bitwarden) or a notebook with key passwords." value={data.practicalInstructions.passwordAccess} onChange={(v) => handleFieldChange('practicalInstructions', 'passwordAccess', v)} disabled={isLoading}/>
                <TextSection title="Care Instructions" description="How to take care of the house, car, pets, plants, or business." value={data.practicalInstructions.homeCare} onChange={(v) => handleFieldChange('practicalInstructions', 'homeCare', v)} disabled={isLoading}/>
                <TextSection title="Subscriptions to Cancel" description="List of services to cancel (e.g., Netflix, gym memberships, magazines) and people/services to notify." value={data.practicalInstructions.subscriptions} onChange={(v) => handleFieldChange('practicalInstructions', 'subscriptions', v)} disabled={isLoading}/>
            </TabsContent>
            
            <TabsContent value="wishes" className="pt-4 space-y-4">
                <TextSection title="Funeral & Memorial Wishes" description="Preferences for your funeral, memorial service, or cremation." value={data.endOfLifeWishes.funeral} onChange={(v) => handleFieldChange('endOfLifeWishes', 'funeral', v)} disabled={isLoading}/>
                <TextSection title="Memorial Media" description="Music, poems, readings, or photos you'd like to be used." value={data.endOfLifeWishes.memorialMedia} onChange={(v) => handleFieldChange('endOfLifeWishes', 'memorialMedia', v)} disabled={isLoading}/>
                <TextSection title="People to Inform" description="A list of people you want to be informed of your passing." value={data.endOfLifeWishes.peopleToInform} onChange={(v) => handleFieldChange('endOfLifeWishes', 'peopleToInform', v)} disabled={isLoading}/>
                <TextSection title="Organ Donation & Health Legacy" description="Your wishes regarding organ donation or any health legacy desires." value={data.endOfLifeWishes.organDonation} onChange={(v) => handleFieldChange('endOfLifeWishes', 'organDonation', v)} disabled={isLoading}/>
            </TabsContent>

            <TabsContent value="legacy" className="pt-4 space-y-4">
                <TextSection title="Social Media Accounts" description="What to do with your accounts on Facebook, X (Twitter), Instagram, etc. (e.g., memorialize, delete)." value={data.digitalLegacy.socialMedia} onChange={(v) => handleFieldChange('digitalLegacy', 'socialMedia', v)} disabled={isLoading}/>
                <TextSection title="Photos & Videos" description="Instructions for what to do with your digital photos and videos." value={data.digitalLegacy.photosAndVideos} onChange={(v) => handleFieldChange('digitalLegacy', 'photosAndVideos', v)} disabled={isLoading}/>
                <TextSection title="Other Digital Content" description="What to do with any other digital content you want shared or deleted (e.g., blogs, websites, files)." value={data.digitalLegacy.digitalContent} onChange={(v) => handleFieldChange('digitalLegacy', 'digitalContent', v)} disabled={isLoading}/>
                <TextSection title="Online Accounts" description="Instructions for other online accounts (e.g., gaming, forums, email)." value={data.digitalLegacy.onlineAccounts} onChange={(v) => handleFieldChange('digitalLegacy', 'onlineAccounts', v)} disabled={isLoading}/>
            </TabsContent>

            <TabsContent value="will" className="pt-4 space-y-4">
                <WillTab data={data.will} setData={handleWillChange} disabled={isLoading} />
            </TabsContent>

            <TabsContent value="vault" className="pt-4">
                <MemoryVaultTab data={data.memoryVault} setData={handleVaultChange} disabled={isLoading} />
            </TabsContent>

        </Tabs>
    </div>
  )
}
