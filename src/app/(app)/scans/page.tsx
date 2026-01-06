
"use client"

import { useState, useRef, ChangeEvent, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileUp, Scan, ZoomIn, ZoomOut, Move, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

// These will be dynamically imported
let cornerstone: any;
let cornerstoneMath: any;
let cornerstoneTools: any;
let Hammer: any;
let cornerstoneWADOImageLoader: any;

export default function ScansPage() {
    const [file, setFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const elementRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [libsLoaded, setLibsLoaded] = useState(false);

    useEffect(() => {
        const loadCornerstoneLibs = async () => {
            try {
                cornerstone = (await import('cornerstone-core')).default;
                cornerstoneMath = (await import('cornerstone-math')).default;
                cornerstoneTools = (await import('cornerstone-tools')).default;
                Hammer = (await import('hammerjs')).default;
                cornerstoneWADOImageLoader = (await import('cornerstone-wado-image-loader')).default;
                
                cornerstoneTools.external.Hammer = Hammer;
                cornerstoneTools.external.cornerstone = cornerstone;
                cornerstoneTools.external.cornerstoneMath = cornerstoneMath;
                cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
                
                try {
                    cornerstoneWADOImageLoader.external.dicomParser = require('dicom-parser');
                } catch(e) {
                    console.error("dicom-parser could not be loaded", e);
                }

                cornerstoneWADOImageLoader.webWorkerManager.initialize({
                    maxWebWorkers: navigator.hardwareConcurrency || 1,
                    startWebWorkersOnDemand: true,
                    webWorkerPath: 'https://cdn.jsdelivr.net/npm/cornerstone-wado-image-loader@4.1.6/dist/cornerstoneWADOImageLoaderWebWorker.min.js',
                    taskConfiguration: {
                        decodeTask: {
                            initializeCodecsOnStartup: false,
                            usePDFJS: false,
                            strict: false,
                        },
                    },
                });
                
                // Initialize cornerstone-tools
                cornerstoneTools.init();
                
                // Add the tools we'll need
                cornerstoneTools.addTool(cornerstoneTools.WwwcTool);
                cornerstoneTools.addTool(cornerstoneTools.ZoomTool, {
                    configuration: { invert: true, preventZoomOutsideImage: true }
                });
                cornerstoneTools.addTool(cornerstoneTools.PanTool);
                cornerstoneTools.addTool(cornerstoneTools.StackScrollMouseWheelTool);
                
                setLibsLoaded(true);

            } catch (error) {
                console.error("Failed to load cornerstone libraries:", error);
                setError("There was an error loading the medical imaging libraries.");
            }
        };

        loadCornerstoneLibs();

        return () => {
            if (cornerstone && elementRef.current) {
                try {
                    cornerstone.disable(elementRef.current);
                } catch(e) {
                    // It might already be disabled
                }
            }
        };
    }, []);

    const displayImage = (imageFile: File) => {
        if (!elementRef.current || !libsLoaded || !imageFile) return;

        const element = elementRef.current;
        
        try {
            cornerstone.disable(element);
        } catch(e) {
            // ignore error
        }

        cornerstone.enable(element);
        
        const imageId = cornerstoneWADOImageLoader.wadouri.fileManager.add(imageFile);

        cornerstone.loadImage(imageId).then((image: any) => {
            cornerstone.displayImage(element, image);
            
            // Activate the tools for the element
            cornerstoneTools.setToolActive('Wwwc', { mouseButtonMask: 1 }); // Left-click for contrast
            cornerstoneTools.setToolActive('Zoom', { mouseButtonMask: 2 }); // Right-click for zoom
            cornerstoneTools.setToolActive('Pan', { mouseButtonMask: 4 }); // Middle-click for pan
            cornerstoneTools.setToolActive('StackScrollMouseWheel', {}); // Mouse wheel for stack scrolling
            
        }, (err: any) => {
            console.error('Error loading DICOM image:', err);
            setError(`Failed to load DICOM image. This may not be a valid viewable image.`);
        });
    };

    useEffect(() => {
        if (file && libsLoaded) {
            displayImage(file);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [file, libsLoaded]);

    const processFile = (selectedFile: File) => {
        if (selectedFile) {
            if (selectedFile.name.toLowerCase().endsWith('.dcm')) {
                setFileName(selectedFile.name);
                setError(null);
                setFile(selectedFile);
            } else {
                setError("Please select a valid DICOM (.dcm) file.");
                setFile(null);
                setFileName("");
            }
        }
    }

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            processFile(selectedFile);
        }
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
        if (event.dataTransfer.files && event.dataTransfer.files[0]) {
            processFile(event.dataTransfer.files[0]);
        }
    };
    
    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
    };

    const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
    };
    
    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    const resetViewport = () => {
        if (elementRef.current && cornerstone) {
            cornerstone.reset(elementRef.current);
        }
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
                         {fileName || "No file selected. Upload a .dcm file to begin."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {error && (
                        <div className="text-destructive text-center p-4 border border-destructive/50 rounded-md">
                            <p>{error}</p>
                        </div>
                    )}
                    {!file ? (
                         <div
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-md transition-colors",
                                isDragging ? "border-primary bg-accent" : "border-border"
                            )}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragEnter={handleDragEnter}
                            onDragLeave={handleDragLeave}
                        >
                            <Scan className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground mb-2">Drag & drop your DICOM file here or</p>
                            <Button onClick={handleButtonClick} disabled={!libsLoaded}>
                                <FileUp className="mr-2" />
                                Browse Files
                            </Button>
                            <Input type="file" ref={fileInputRef} className="hidden" accept=".dcm" onChange={handleFileChange} />
                        </div>
                    ) : (
                        <div 
                            ref={elementRef}
                            className="w-full min-h-[512px] bg-black rounded-lg border flex items-center justify-center cursor-grab"
                            onContextMenu={(e) => e.preventDefault()} // Prevent right-click menu
                        />
                    )}
                     {file && (
                        <div className="flex items-center justify-center gap-4 flex-wrap bg-muted p-2 rounded-md">
                           <div className="text-xs text-muted-foreground flex items-center gap-2"><ZoomIn className="w-4 h-4"/> Left-Click+Drag to adjust contrast</div>
                           <div className="text-xs text-muted-foreground flex items-center gap-2"><ZoomIn className="w-4 h-4"/> Right-Click+Drag to Zoom</div>
                           <div className="text-xs text-muted-foreground flex items-center gap-2"><Move className="w-4 h-4"/> Middle-Click+Drag to Pan</div>
                            <Button onClick={resetViewport} variant="outline" size="sm"><RotateCcw className="mr-2"/>Reset</Button>
                             <Button onClick={handleButtonClick} variant="outline" size="sm">
                                <FileUp className="mr-2" />
                                Change File
                            </Button>
                            <Input type="file" ref={fileInputRef} className="hidden" accept=".dcm" onChange={handleFileChange} />
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
