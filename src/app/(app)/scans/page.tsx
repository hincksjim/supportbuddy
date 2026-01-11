
"use client"

import { useState, useRef, ChangeEvent, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileUp, Scan, ZoomIn, ZoomOut, Move, RotateCcw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// These will be dynamically imported
let cornerstone: any;
let cornerstoneMath: any;
let cornerstoneTools: any;
let Hammer: any;
let cornerstoneWADOImageLoader: any;
let dicomParser: any;
let JSZip: any;

export default function ScansPage() {
    const [files, setFiles] = useState<File[]>([]);
    const [fileNames, setFileNames] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const elementRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [libsLoaded, setLibsLoaded] = useState(false);

    useEffect(() => {
        const loadCornerstoneLibs = async () => {
            try {
                cornerstone = (await import('cornerstone-core')).default;
                cornerstoneMath = (await import('cornerstone-math')).default;
                cornerstoneTools = (await import('cornerstone-tools')).default;
                Hammer = (await import('hammerjs')).default;
                cornerstoneWADOImageLoader = (await import('cornerstone-wado-image-loader')).default;
                dicomParser = (await import('dicom-parser')).default;
                JSZip = (await import('jszip')).default;

                cornerstoneTools.external.Hammer = Hammer;
                cornerstoneTools.external.cornerstone = cornerstone;
                cornerstoneTools.external.cornerstoneMath = cornerstoneMath;
                cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
                cornerstoneWADOImageLoader.external.dicomParser = dicomParser;
                
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
                
                cornerstoneTools.init();
                
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

    const displayImageStack = (imageFiles: File[]) => {
        if (!elementRef.current || !libsLoaded || imageFiles.length === 0) return;

        const element = elementRef.current;
        
        try {
            cornerstone.disable(element);
        } catch(e) {
            // ignore error
        }

        cornerstone.enable(element);
        
        const imageIds = imageFiles.map(imageFile => {
            return cornerstoneWADOImageLoader.wadouri.fileManager.add(imageFile);
        });

        const stack = {
            currentImageIdIndex: 0,
            imageIds: imageIds,
        };

        cornerstone.loadImage(imageIds[0]).then((image: any) => {
            cornerstone.displayImage(element, image);
            cornerstoneTools.addStackStateManager(element, ['stack']);
            cornerstoneTools.addToolState(element, 'stack', stack);
            
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
        if (files.length > 0 && libsLoaded) {
            displayImageStack(files);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [files, libsLoaded]);

    const processFiles = async (selectedFiles: FileList | null) => {
        if (!selectedFiles || selectedFiles.length === 0) return;
        
        setIsLoading(true);
        const fileArray = Array.from(selectedFiles);
        let dcmFiles: File[] = [];
        let uploadedFileNames: string[] = [];

        try {
            const zipFile = fileArray.find(file => file.name.toLowerCase().endsWith('.zip'));

            if (zipFile) {
                uploadedFileNames.push(zipFile.name);
                const zip = await JSZip.loadAsync(zipFile);
                const dcmFilePromises: Promise<File>[] = [];

                zip.forEach((relativePath, zipEntry) => {
                    if (zipEntry.name.toLowerCase().endsWith('.dcm') && !zipEntry.dir) {
                        const promise = zipEntry.async('blob').then(blob => {
                            return new File([blob], zipEntry.name.split('/').pop() || 'dicom.dcm', { type: 'application/dicom' });
                        });
                        dcmFilePromises.push(promise);
                    }
                });
                dcmFiles = await Promise.all(dcmFilePromises);

            } else {
                dcmFiles = fileArray.filter(file => file.name.toLowerCase().endsWith('.dcm'));
                uploadedFileNames = dcmFiles.map(f => f.name);
            }

            if (dcmFiles.length > 0) {
                setFileNames(uploadedFileNames);
                setError(null);
                setFiles(dcmFiles);
            } else {
                setError("Please select valid DICOM (.dcm) files or a ZIP file containing them.");
                setFiles([]);
                setFileNames([]);
            }
        } catch (err) {
            console.error("Error processing files:", err);
            setError("There was an error processing the uploaded file. It might be corrupted.");
        } finally {
            setIsLoading(false);
        }
    };


    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        processFiles(event.target.files);
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
        if (event.dataTransfer.files) {
            processFiles(event.dataTransfer.files);
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
                         {fileNames.length > 0 ? `Viewing ${files.length} image(s) from ${fileNames.join(', ')}` : "No file selected. Upload one or more .dcm files, or a .zip archive, to begin."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {error && (
                        <div className="text-destructive text-center p-4 border border-destructive/50 rounded-md">
                            <p>{error}</p>
                        </div>
                    )}
                    {files.length === 0 ? (
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
                            {isLoading ? (
                                <Loader2 className="mx-auto h-16 w-16 text-muted-foreground mb-4 animate-spin"/>
                            ) : (
                                <Scan className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                            )}
                            <p className="text-muted-foreground mb-2">Drag & drop your DICOM file(s) or ZIP here, or</p>
                            <Button onClick={handleButtonClick} disabled={!libsLoaded || isLoading}>
                                <FileUp className="mr-2" />
                                Browse Files
                            </Button>
                            <Input type="file" ref={fileInputRef} className="hidden" accept=".dcm,.zip" onChange={handleFileChange} multiple />
                        </div>
                    ) : (
                        <div 
                            ref={elementRef}
                            className="w-full min-h-[512px] bg-black rounded-lg border flex items-center justify-center cursor-grab"
                            onContextMenu={(e) => e.preventDefault()} // Prevent right-click menu
                        />
                    )}
                     {files.length > 0 && (
                        <div className="flex items-center justify-center gap-4 flex-wrap bg-muted p-2 rounded-md">
                           <div className="text-xs text-muted-foreground flex items-center gap-2"><ZoomIn className="w-4 h-4"/> Left-Click+Drag to adjust contrast</div>
                           <div className="text-xs text-muted-foreground flex items-center gap-2"><ZoomIn className="w-4 h-4"/> Right-Click+Drag to Zoom</div>
                           <div className="text-xs text-muted-foreground flex items-center gap-2"><Move className="w-4 h-4"/> Middle-Click+Drag to Pan</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-2">Mouse Wheel to scroll through slices</div>
                            <Button onClick={resetViewport} variant="outline" size="sm"><RotateCcw className="mr-2"/>Reset</Button>
                             <Button onClick={handleButtonClick} variant="outline" size="sm">
                                <FileUp className="mr-2" />
                                Change File(s)
                            </Button>
                            <Input type="file" ref={fileInputRef} className="hidden" accept=".dcm,.zip" onChange={handleFileChange} multiple />
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
