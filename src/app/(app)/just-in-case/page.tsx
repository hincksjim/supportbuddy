
"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  FileUp, Loader2, PlusCircle, FileText, X, ShieldCheck, Info, RefreshCw,
  MessageSquare, BookOpen, Wrench, Heart, Computer, Vault, Save, Trash2, Video, AudioLines
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
  memoryVault: VaultItem[];
}

interface MessageToLovedOne {
  id: string;
  recipient: string;
  message: string;
  // delaySend?: string; // Delay sending is a backend feature, so we'll omit for now
}

interface VaultItem {
  id: string;
  title: string;
  fileDataUri: string;
  fileType: string;
  fileName: string;
  date: string;
}

const initialData: GoodbyeData = {
  messages: [],
  lifeAdvice: { lessons: "", stories: "", legacy: "", regrets: "" },
  practicalInstructions: { documentsLocation: "", passwordAccess: "", homeCare: "", subscriptions: "" },
  endOfLifeWishes: { funeral: "", memorialMedia: "", peopleToInform: "", organDonation: "" },
  digitalLegacy: { socialMedia: "", photosAndVideos: "", digitalContent: "", onlineAccounts: "" },
  memoryVault: [],
};

// Component for a single text area section
function TextSection({ title, description, value, onChange }: { title: string, description: string, value: string, onChange: (val: string) => void }) {
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
        />
      </CardContent>
    </Card>
  )
}

// Component for Messages to Loved Ones
function MessagesTab({ data, setData }: { data: MessageToLovedOne[], setData: (d: MessageToLovedOne[]) => void }) {
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
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMessage(msg.id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={`recipient-${msg.id}`}>Recipient Name/Group</Label>
                            <Input id={`recipient-${msg.id}`} value={msg.recipient} onChange={(e) => updateMessage(msg.id, 'recipient', e.target.value)} placeholder="e.g., My children, My partner" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={`message-${msg.id}`}>Message</Label>
                            <Textarea id={`message-${msg.id}`} value={msg.message} onChange={(e) => updateMessage(msg.id, 'message', e.target.value)} placeholder="Your letter or message..." rows={5} />
                        </div>
                    </CardContent>
                </Card>
            ))}
            <Button onClick={addMessage}><PlusCircle className="mr-2"/> Add Message</Button>
        </div>
    )
}

// Component for Memory Vault
function MemoryVaultTab({ data, setData }: { data: VaultItem[], setData: (d: VaultItem[]) => void }) {
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
            setData([...data, newVaultItem]);
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
                        disabled={isUploading}
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
                        <CardContent className="flex-1 flex flex-col justify-between">
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
    return () => {
        saveData();
    }
  }, [loadData, saveData]);

  const handleFieldChange = (tab: keyof GoodbyeData, field: string, value: string) => {
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
            <Button onClick={saveData}><Save className="mr-2 h-4 w-4" /> Save</Button>
            <Button onClick={loadData} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
            </Button>
        </div>
      </div>

       <Alert variant="destructive">
          <ShieldCheck className="h-4 w-4" />
          <AlertTitle>For Your Information & Security</AlertTitle>
          <AlertDescription>
            This is a prototype. All information entered here is stored **only on your current device's browser** and is not encrypted or backed up online. Do not store highly sensitive information like passwords directly.
          </AlertDescription>
        </Alert>
      
        <Tabs defaultValue="messages" className="w-full">
            <TabsList className="grid w-full grid-cols-1 md:grid-cols-6 h-auto">
                <TabsTrigger value="messages"><MessageSquare className="mr-2"/>Messages</TabsTrigger>
                <TabsTrigger value="advice"><BookOpen className="mr-2"/>Advice</TabsTrigger>
                <TabsTrigger value="instructions"><Wrench className="mr-2"/>Instructions</TabsTrigger>
                <TabsTrigger value="wishes"><Heart className="mr-2"/>Wishes</TabsTrigger>
                <TabsTrigger value="legacy"><Computer className="mr-2"/>Digital Legacy</TabsTrigger>
                <TabsTrigger value="vault"><Vault className="mr-2"/>Memory Vault</TabsTrigger>
            </TabsList>
            
            <TabsContent value="messages" className="pt-4">
                <MessagesTab data={data.messages} setData={handleMessageChange} />
            </TabsContent>
            
            <TabsContent value="advice" className="pt-4 space-y-4">
                <TextSection title="Life Lessons & Advice" description="Wisdom you want to pass on to others." value={data.lifeAdvice.lessons} onChange={(v) => handleFieldChange('lifeAdvice', 'lessons', v)} />
                <TextSection title="Life Stories & Heritage" description="Share stories about your life, background, and heritage." value={data.lifeAdvice.stories} onChange={(v) => handleFieldChange('lifeAdvice', 'stories', v)} />
                <TextSection title="How I Want To Be Remembered" description="The values, memories, or accomplishments you want people to remember." value={data.lifeAdvice.legacy} onChange={(v) => handleFieldChange('lifeAdvice', 'legacy', v)} />
                <TextSection title="Regrets or Warnings" description="Things you might regret or want others to avoid." value={data.lifeAdvice.regrets} onChange={(v) => handleFieldChange('lifeAdvice', 'regrets', v)} />
            </TabsContent>

            <TabsContent value="instructions" className="pt-4 space-y-4">
                <TextSection title="Location of Important Documents" description="Where to find things like your will, birth certificate, property deeds, etc. (Do not upload them here unless encrypted)." value={data.practicalInstructions.documentsLocation} onChange={(v) => handleFieldChange('practicalInstructions', 'documentsLocation', v)} />
                <TextSection title="Password Access" description="Instructions on how to access your password manager (e.g., LastPass, Bitwarden) or a notebook with key passwords." value={data.practicalInstructions.passwordAccess} onChange={(v) => handleFieldChange('practicalInstructions', 'passwordAccess', v)} />
                <TextSection title="Care Instructions" description="How to take care of the house, car, pets, plants, or business." value={data.practicalInstructions.homeCare} onChange={(v) => handleFieldChange('practicalInstructions', 'homeCare', v)} />
                <TextSection title="Subscriptions to Cancel" description="List of services to cancel (e.g., Netflix, gym memberships, magazines) and people/services to notify." value={data.practicalInstructions.subscriptions} onChange={(v) => handleFieldChange('practicalInstructions', 'subscriptions', v)} />
            </TabsContent>
            
            <TabsContent value="wishes" className="pt-4 space-y-4">
                <TextSection title="Funeral & Memorial Wishes" description="Preferences for your funeral, memorial service, or cremation." value={data.endOfLifeWishes.funeral} onChange={(v) => handleFieldChange('endOfLifeWishes', 'funeral', v)} />
                <TextSection title="Memorial Media" description="Music, poems, readings, or photos you'd like to be used." value={data.endOfLifeWishes.memorialMedia} onChange={(v) => handleFieldChange('endOfLifeWishes', 'memorialMedia', v)} />
                <TextSection title="People to Inform" description="A list of people you want to be informed of your passing." value={data.endOfLifeWishes.peopleToInform} onChange={(v) => handleFieldChange('endOfLifeWishes', 'peopleToInform', v)} />
                <TextSection title="Organ Donation & Health Legacy" description="Your wishes regarding organ donation or any health legacy desires." value={data.endOfLifeWishes.organDonation} onChange={(v) => handleFieldChange('endOfLifeWishes', 'organDonation', v)} />
            </TabsContent>

            <TabsContent value="legacy" className="pt-4 space-y-4">
                <TextSection title="Social Media Accounts" description="What to do with your accounts on Facebook, X (Twitter), Instagram, etc. (e.g., memorialize, delete)." value={data.digitalLegacy.socialMedia} onChange={(v) => handleFieldChange('digitalLegacy', 'socialMedia', v)} />
                <TextSection title="Photos & Videos" description="Instructions for what to do with your digital photos and videos." value={data.digitalLegacy.photosAndVideos} onChange={(v) => handleFieldChange('digitalLegacy', 'photosAndVideos', v)} />
                <TextSection title="Other Digital Content" description="What to do with any other digital content you want shared or deleted (e.g., blogs, websites, files)." value={data.digitalLegacy.digitalContent} onChange={(v) => handleFieldChange('digitalLegacy', 'digitalContent', v)} />
                <TextSection title="Online Accounts" description="Instructions for other online accounts (e.g., gaming, forums, email)." value={data.digitalLegacy.onlineAccounts} onChange={(v) => handleFieldChange('digitalLegacy', 'onlineAccounts', v)} />
            </TabsContent>

            <TabsContent value="vault" className="pt-4">
                <MemoryVaultTab data={data.memoryVault} setData={handleVaultChange} />
            </TabsContent>

        </Tabs>
    </div>
  )
}

    