
"use client"

import { useState, useEffect } from "react"
import { Landmark, Briefcase, HandCoins, PiggyBank, Wallet, Lightbulb, Loader2, RefreshCw, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { generateBenefitsSuggestion, GenerateBenefitsSuggestionInput } from "@/ai/flows/generate-benefits-suggestion"
import { Button } from "@/components/ui/button"

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
}

export default function FinancePage() {
    const [userData, setUserData] = useState<UserData>({});
    const [suggestedBenefits, setSuggestedBenefits] = useState<BenefitSuggestion[]>([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true);
    const [suggestionError, setSuggestionError] = useState<string | null>(null);
    const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const loadData = () => {
        setIsLoading(true);
        const email = localStorage.getItem("currentUserEmail");
        if (email) {
            setCurrentUserEmail(email);
            const storedData = localStorage.getItem(`userData_${email}`);
            if (storedData) {
                const parsedData = JSON.parse(storedData);
                let formattedStatus = parsedData.employmentStatus?.charAt(0).toUpperCase() + parsedData.employmentStatus?.slice(1).replace(/-/g, ' ');
                if (formattedStatus === 'Unemployed not on benefits') formattedStatus = 'Unemployed';
                if (formattedStatus === 'Unemployed on benefits') formattedStatus = 'On Benefits';
                
                setUserData({ ...parsedData, employmentStatus: formattedStatus });
                return { ...parsedData, employmentStatus: formattedStatus };
            }
        }
        setIsLoading(false);
        return null;
    }

    const fetchSuggestions = async (currentUserData: UserData | null) => {
        if (!currentUserData || !currentUserData.age) {
            setIsLoadingSuggestions(false);
            return;
        }

        setIsLoadingSuggestions(true);
        setSuggestionError(null);
        
        try {
            const input: GenerateBenefitsSuggestionInput = {
                age: currentUserData.age || "",
                employmentStatus: currentUserData.employmentStatus || "",
                existingBenefits: currentUserData.benefits || [],
            };
            if (currentUserData.income) input.income = currentUserData.income;
            if (currentUserData.savings) input.savings = currentUserData.savings;

            const result = await generateBenefitsSuggestion(input);
            setSuggestedBenefits(result.suggestions);

        } catch (error: any) {
            console.error("Failed to fetch benefit suggestions:", error);
             if (error.message && (error.message.includes("429") || error.message.includes("Too Many Requests"))) {
                setSuggestionError("You've exceeded the number of requests for today. Please try again tomorrow.");
            } else {
                setSuggestionError("Sorry, there was an error fetching benefit suggestions.");
            }
        } finally {
            setIsLoadingSuggestions(false);
        }
    };

    useEffect(() => {
        const loadedData = loadData();
        fetchSuggestions(loadedData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleRefresh = () => {
        const loadedData = loadData();
        fetchSuggestions(loadedData);
    }

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
                <Button onClick={handleRefresh} disabled={isLoading || isLoadingSuggestions}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                </Button>
            </div>

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
                                    <AlertTitle className="font-bold">{suggestion.name}</AlertTitle>
                                    <AlertDescription>{suggestion.reason}</AlertDescription>
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
    )
}
