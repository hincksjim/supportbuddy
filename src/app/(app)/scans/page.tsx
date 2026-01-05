
"use client"

import { useState, useRef, ChangeEvent } from "react";
// import DicomViewer from "react-dicom-viewer";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FileUp, Scan } from "lucide-react";

export default function ScansPage() {
    const [file, setFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState<string>("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.name.toLowerCase().endsWith('.dcm')) {
                setFile(selectedFile);
                setFileName(selectedFile.name);
            } else {
                alert("Please select a valid DICOM (.dcm) file.");
            }
        }
    };
    
    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="p-4 md:p-6 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Medical Scans</h1>
                    <p className="text-muted-foreground">
                        Upload and view your DICOM (.dcm) scan files.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>DICOM Viewer</CardTitle>
                    <CardDescription>
                        This feature is currently under maintenance. We are working to restore it.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="w-full min-h-[512px] bg-secondary rounded-lg border flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                            <Scan className="mx-auto h-24 w-24" />
                            <p className="mt-4">The DICOM viewer is temporarily unavailable.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
