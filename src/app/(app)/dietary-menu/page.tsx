
"use client"

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Lightbulb, Utensils, Apple, Soup, Cookie, Coffee, ChevronDown, Flame, Wallet } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { generateDietaryRecommendation, GenerateDietaryRecommendationOutput } from "@/ai/flows/generate-dietary-recommendation";
import { DiaryEntry } from "@/app/(app)/diary/page";
import { marked } from "marked";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface UserData {
    initialDiagnosis?: string;
}

const categoryIcons = {
    breakfast: <Coffee className="w-6 h-6 text-primary" />,
    lunch: <Soup className="w-6 h-6 text-primary" />,
    dinner: <Utensils className="w-6 h-6 text-primary" />,
    snacks: <Apple className="w-6 h-6 text-primary" />,
};

export default function DietaryMenuPage() {
    const [recommendations, setRecommendations] = useState<GenerateDietaryRecommendationOutput | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
    const [openCollapsibles, setOpenCollapsibles] = useState<string[]>([]);

    const toggleCollapsible = (id: string) => {
        setOpenCollapsibles(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
    }

    const fetchDataAndGenerate = async (email: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const storedUser = localStorage.getItem(`userData_${email}`);
            const storedDiary = localStorage.getItem(`diaryEntries_${email}`);
            
            const userData: UserData = storedUser ? JSON.parse(storedUser) : {};
            const diaryEntries: DiaryEntry[] = storedDiary ? JSON.parse(storedDiary) : [];

            // Get the last 7 days of entries
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const recentEntries = diaryEntries.filter(entry => new Date(entry.date) >= sevenDaysAgo);

            const result = await generateDietaryRecommendation({
                diagnosis: userData.initialDiagnosis || "Not specified",
                recentMeals: recentEntries,
            });
            setRecommendations(result);
        } catch (err: any) {
            console.error("Failed to generate dietary recommendations:", err);
            setError("Sorry, there was an error generating your recommendations. Please try refreshing.");
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        const email = localStorage.getItem("currentUserEmail");
        if (email) {
            setCurrentUserEmail(email);
            fetchDataAndGenerate(email);
        } else {
            setIsLoading(false);
            setError("Could not identify user. Please log in again.");
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleRefresh = () => {
        if (currentUserEmail) {
            fetchDataAndGenerate(currentUserEmail);
        }
    }

    return (
        <div className="p-4 md:p-6 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Dietary Recommendations</h1>
                    <p className="text-muted-foreground">
                        AI-powered meal suggestions based on your health profile and recent activity.
                    </p>
                </div>
                <Button onClick={handleRefresh} disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                    New Suggestions
                </Button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p>Generating your personalized dietary plan...</p>
                </div>
            ) : error ? (
                <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            ) : recommendations ? (
                <div className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Lightbulb className="text-primary"/> AI Dietary Commentary</CardTitle>
                            <CardDescription>A quick look at your recent eating habits.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: marked.parse(recommendations.dietaryCommentary) as string }} />
                        </CardContent>
                    </Card>

                    <Card>
                         <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Utensils className="text-primary"/> Meal Suggestions</CardTitle>
                            <CardDescription>Here are some healthy ideas to try for the week ahead. Click on any meal to see the recipe.</CardDescription>
                        </CardHeader>
                         <CardContent className="space-y-6">
                            {Object.entries(recommendations.recommendations).map(([category, suggestions]) => (
                                suggestions.length > 0 && (
                                     <div key={category}>
                                        <h3 className="font-semibold text-lg capitalize flex items-center gap-2 mb-3">
                                             {categoryIcons[category as keyof typeof categoryIcons]}
                                            {category}
                                        </h3>
                                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                            {suggestions.map(suggestion => (
                                                <Collapsible key={suggestion.name} open={openCollapsibles.includes(suggestion.name)} onOpenChange={() => toggleCollapsible(suggestion.name)}>
                                                    <Card className="bg-muted/30">
                                                        <CollapsibleTrigger asChild>
                                                            <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50 rounded-t-lg">
                                                                <div className="flex-1">
                                                                    <CardTitle className="text-base">{suggestion.name}</CardTitle>
                                                                    <p className="text-sm text-muted-foreground mt-1">{suggestion.reason}</p>
                                                                </div>
                                                                 <ChevronDown className={cn("h-5 w-5 transition-transform", openCollapsibles.includes(suggestion.name) && "rotate-180")} />
                                                            </div>
                                                        </CollapsibleTrigger>
                                                        <CollapsibleContent>
                                                            <CardContent className="pt-0 p-4 space-y-4">
                                                                <div className="flex items-center justify-between text-sm font-semibold border-t pt-4">
                                                                     <span>Recipe</span>
                                                                     <div className="flex items-center gap-4">
                                                                        <span className="flex items-center gap-1"><Wallet className="w-4 h-4 text-green-600"/>~£{suggestion.costPerPortion.toFixed(2)}</span>
                                                                        <span className="flex items-center gap-1"><Flame className="w-4 h-4 text-destructive"/>~{suggestion.calories} kcal</span>
                                                                     </div>
                                                                </div>
                                                                 <div>
                                                                    <h4 className="font-semibold text-sm mb-2">Ingredients</h4>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {suggestion.ingredients.map((ing, i) => (
                                                                            <Badge key={i} variant="secondary">{ing}</Badge>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-semibold text-sm mb-2">Instructions</h4>
                                                                    <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: marked.parse(suggestion.instructions.replace(/\\n/g, '\n')) as string }} />
                                                                </div>
                                                            </CardContent>
                                                        </CollapsibleContent>
                                                    </Card>
                                                </Collapsible>
                                            ))}
                                        </div>
                                    </div>
                                )
                            ))}
                         </CardContent>
                    </Card>
                </div>
            ) : (
                <div className="text-center py-20 rounded-lg border-2 border-dashed">
                    <h2 className="text-xl font-semibold">No Recommendations</h2>
                    <p className="text-muted-foreground mt-2">Could not generate recommendations. Please ensure your profile is complete and try refreshing.</p>
                </div>
            )}
        </div>
    )
}
