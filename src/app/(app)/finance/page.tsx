
"use client"

import { useState, useEffect, useRef } from "react"
import { Landmark, Briefcase, HandCoins, PiggyBank, Wallet, Lightbulb, Loader2, RefreshCw, AlertCircle, Download } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { generateBenefitsMatrix, GenerateBenefitsMatrixOutput } from "@/ai/flows/generate-benefits-matrix"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

interface UserData {
    name?: string;
    age?: string;
    employmentStatus?: string;
    income?: string;
    savings?: string;
    benefits?: string[];
}

interface BenefitSuggestion {
    name: string;
    reason: string;
    url: string;
    potentialAmount?: string;
}

interface CachedSuggestions {
    fingerprint: string;
    suggestions: BenefitSuggestion[];
}

export default function FinancePage() {
    const [userData, setUserData] = useState<UserData>({});
    const [suggestedBenefits, setSuggestedBenefits] = useState<BenefitSuggestion[]>([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);
    const [suggestionError, setSuggestionError] = useState<string | null>(null);
    const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    const getStorageKey = (email: string) => `financialSuggestionsCache_${email}`;
    const createFingerprint = (data: UserData) => JSON.stringify({ 
        age: data.age, 
        employmentStatus: data.employmentStatus, 
        income: data.income,
        savings: data.savings,
        benefits: data.benefits?.sort() 
    });


    const loadData = () => {
        const email = localStorage.getItem("currentUserEmail");
        if (email) {
            setCurrentUserEmail(email);
            const storedData = localStorage.getItem(`userData_${email}`);
            if (storedData) {
                const parsedData = JSON.parse(storedData);
                let formattedStatus = parsedData.employmentStatus?.charAt(0).toUpperCase() + parsedData.employmentStatus?.slice(1).replace(/-/g, ' ');
                if (formattedStatus === 'Unemployed not on benefits') formattedStatus = 'Unemployed';
                if (formattedStatus === 'Unemployed on benefits') formattedStatus = 'On Benefits';
                
                const userData = { ...parsedData, employmentStatus: formattedStatus };
                setUserData(userData);
                return { userData, email };
            }
        }
        return null;
    }

    const fetchSuggestions = async (currentUserData: UserData, userEmail: string) => {
        if (!currentUserData || !currentUserData.age || !currentUserData.employmentStatus) {
            setIsLoadingSuggestions(false);
            setSuggestionError("Your age and employment status must be set in your profile to get suggestions.");
            return;
        }

        setIsLoadingSuggestions(true);
        setSuggestionError(null);
        
        try {
            const matrixResult = await generateBenefitsMatrix({
                age: currentUserData.age,
                employmentStatus: currentUserData.employmentStatus,
                existingBenefits: currentUserData.benefits || [],
            });
            
            // Assuming the first scenario is always the "current situation" from the matrix prompt
            const currentSituationScenario = matrixResult.scenarios[0];
            
            const newSuggestions = currentSituationScenario.benefits
                .filter(b => b.isEligible && !b.isCurrent)
                .map(b => ({
                    name: b.name,
                    reason: b.requirements,
                    url: b.url,
                    potentialAmount: b.potentialAmount
                }));

            setSuggestedBenefits(newSuggestions);
            
            const cache: CachedSuggestions = {
                fingerprint: createFingerprint(currentUserData),
                suggestions: newSuggestions
            };
            localStorage.setItem(getStorageKey(userEmail), JSON.stringify(cache));

        } catch (error: any) {
            console.error("Failed to fetch benefit suggestions:", error);
             if (error.message && (error.message.includes("429") || error.message.includes("503"))) {
                setSuggestionError("The AI service is busy or rate limited. Please try again in a moment.");
            } else {
                setSuggestionError("Sorry, there was an error fetching benefit suggestions.");
            }
        } finally {
            setIsLoadingSuggestions(false);
        }
    };

    useEffect(() => {
        const loadResult = loadData();
        if (loadResult) {
            const { userData, email } = loadResult;
            const savedCache = localStorage.getItem(getStorageKey(email));
            
            if (savedCache) {
                const parsedCache: CachedSuggestions = JSON.parse(savedCache);
                const currentFingerprint = createFingerprint(userData);

                if (parsedCache.fingerprint === currentFingerprint) {
                    // Data is up to date, use cache
                    setSuggestedBenefits(parsedCache.suggestions);
                    setIsLoadingSuggestions(false);
                } else {
                    // Data has changed, regenerate
                    fetchSuggestions(userData, email);
                }
            } else {
                // No cache, generate
                fetchSuggestions(userData, email);
            }
        } else {
            setIsLoadingSuggestions(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleRefresh = () => {
        const loadResult = loadData();
        if (loadResult) {
            const { userData, email } = loadResult;
            localStorage.removeItem(getStorageKey(email));
            fetchSuggestions(userData, email);
        }
    }

    const handleDownloadPdf = async () => {
        const container = contentRef.current;
        if (!container) return;
        setIsDownloading(true);

        try {
            const canvas = await html2canvas(container, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = imgWidth / imgHeight;

            let finalImgWidth = pdfWidth - 20;
            let finalImgHeight = finalImgWidth / ratio;
            
            if (finalImgHeight > pdfHeight - 20) {
                 finalImgHeight = pdfHeight - 20;
                 finalImgWidth = finalImgHeight * ratio;
            }

            pdf.addImage(imgData, 'PNG', 10, 10, finalImgWidth, finalImgHeight);
            pdf.save('Financial-Summary.pdf');
        } catch (error) {
            console.error("Failed to generate PDF", error);
        } finally {
            setIsDownloading(false);
        }
    };

    const formatCurrency = (value: string | undefined) => {
        if (!value) return "Not provided";
        const number = parseFloat(value);
        if (isNaN(number)) return value;
        return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(number);
    }

    return (
        <div className="p-4 md:p-6 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Financials</h1>
                    <p className="text-muted-foreground">
                        A summary of your current financial situation and potential support.
                    </p>
                </div>
                 <div className="flex items-center gap-2">
                    <Button onClick={handleRefresh} disabled={isLoadingSuggestions}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh Suggestions
                    </Button>
                    <Button onClick={handleDownloadPdf} disabled={isDownloading} variant="outline">
                        {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        Download PDF
                    </Button>
                </div>
            </div>

            <div className="space-y-8" ref={contentRef}>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Briefcase className="w-6 h-6 text-primary" />
                                Employment
                            </CardTitle>
                            <CardDescription>Your current employment status.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {userData.employmentStatus ? (
                                <p className="text-2xl font-semibold">{userData.employmentStatus}</p>
                            ) : (
                                <p className="text-muted-foreground">No status provided.</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Wallet className="w-6 h-6 text-primary" />
                                Annual Income
                            </CardTitle>
                            <CardDescription>Your reported yearly income.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold">{formatCurrency(userData.income)}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <PiggyBank className="w-6 h-6 text-primary" />
                                Savings
                            </CardTitle>
                            <CardDescription>Your reported savings amount.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold">{formatCurrency(userData.savings)}</p>
                        </CardContent>
                    </Card>

                     <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <HandCoins className="w-6 h-6 text-primary" />
                                Existing Benefits
                            </CardTitle>
                            <CardDescription>Benefits you have indicated you are receiving.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {userData.benefits && userData.benefits.length > 0 ? (
                                <ul className="columns-1 sm:columns-2 list-disc list-inside space-y-1 text-muted-foreground">
                                    {userData.benefits.map((benefit, index) => (
                                        <li key={index}>{benefit}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-muted-foreground">No existing benefits listed.</p>
                            )}
                        </CardContent>
                    </Card>

                     <Card className="md:col-span-1 lg:col-span-3">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Lightbulb className="w-6 h-6 text-primary" />
                               Potential Additional Benefits
                            </CardTitle>
                            <CardDescription>Based on your profile, you might be able to claim these.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           {isLoadingSuggestions ? (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    <p>Analyzing your eligibility...</p>
                                </div>
                           ) : suggestionError ? (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Could Not Fetch Suggestions</AlertTitle>
                                    <AlertDescription>{suggestionError}</AlertDescription>
                                </Alert>
                           ) : suggestedBenefits.length > 0 ? (
                               <div className="space-y-4">
                                {suggestedBenefits.map((suggestion, index) => (
                                    <Alert key={index}>
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                                            <div className="flex-1">
                                                <AlertTitle className="font-bold">{suggestion.name}</AlertTitle>
                                                <AlertDescription className="mt-1">{suggestion.reason}</AlertDescription>
                                                {suggestion.potentialAmount && (
                                                     <p className="text-sm font-semibold mt-2 text-primary">{suggestion.potentialAmount}</p>
                                                )}
                                            </div>
                                            <Button asChild variant="secondary" size="sm" className="mt-2 sm:mt-0">
                                                <Link href={suggestion.url} target="_blank" rel="noopener noreferrer">
                                                    Learn More
                                                </Link>
                                            </Button>
                                        </div>
                                    </Alert>
                                ))}
                               </div>
                           ) : (
                               <p className="text-muted-foreground">No additional benefits were identified based on the information provided.</p>
                           )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )

    