
"use client"

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Lightbulb, Utensils, Apple, Soup, Coffee, ChevronDown, Flame, Wallet, Star, PlusCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { generateDietaryRecommendation, GenerateDietaryRecommendationOutput } from "@/ai/flows/generate-dietary-recommendation";
import { DiaryEntry } from "@/app/(app)/diary/page";
import { marked } from "marked";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";


interface UserData {
    initialDiagnosis?: string;
}

// Extracted from generate-dietary-recommendation.ts to be used here
export interface MealSuggestion {
  name: string;
  reason: string;
  ingredients: string[];
  instructions: string;
  calories: number;
  costPerPortion: number;
}

interface PlannedMeal extends MealSuggestion {
  id: string; // Unique ID for this planning instance
}

type MealType = 'breakfast' | 'lunch' | 'dinner';

const categoryIcons = {
    breakfast: <Coffee className="w-6 h-6 text-primary" />,
    lunch: <Soup className="w-6 h-6 text-primary" />,
    dinner: <Utensils className="w-6 h-6 text-primary" />,
    snacks: <Apple className="w-6 h-6 text-primary" />,
};

function AddToMealPlanDialog({ meal, onAddToPlan }: { meal: MealSuggestion, onAddToPlan: (day: string, mealType: MealType, meal: MealSuggestion) => void }) {
    const [day, setDay] = useState('Monday');
    const [mealType, setMealType] = useState<MealType>('dinner');
    const [isOpen, setIsOpen] = useState(false);

    const handleSave = () => {
        onAddToPlan(day, mealType, meal);
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="secondary" size="sm" className="w-full mt-4">
                    <PlusCircle className="mr-2" />
                    Add to Meal Plan
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add "{meal.name}" to Meal Plan</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="day-select">Day</Label>
                        <Select value={day} onValueChange={setDay}>
                            <SelectTrigger id="day-select">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                                    <SelectItem key={d} value={d}>{d}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="meal-type-select">Meal</Label>
                        <Select value={mealType} onValueChange={(v) => setMealType(v as MealType)}>
                            <SelectTrigger id="meal-type-select">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="breakfast">Breakfast</SelectItem>
                                <SelectItem value="lunch">Lunch</SelectItem>
                                <SelectItem value="dinner">Dinner</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                    <Button onClick={handleSave}>Add to Plan</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function MealCard({ suggestion, isFavorite, onToggleFavorite, onAddToPlan }: { suggestion: MealSuggestion, isFavorite: boolean, onToggleFavorite: (suggestion: MealSuggestion) => void, onAddToPlan: (day: string, mealType: MealType, meal: MealSuggestion) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <Card className="bg-muted/30 relative flex flex-col h-full">
                 <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 z-10"
                    onClick={() => onToggleFavorite(suggestion)}
                >
                    <Star className={cn("h-5 w-5", isFavorite ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground")} />
                </Button>
                <CollapsibleTrigger asChild>
                    <div className="flex items-start justify-between p-4 cursor-pointer hover:bg-accent/50 rounded-t-lg flex-grow">
                        <div className="flex-1 pr-8">
                            <CardTitle className="text-base">{suggestion.name}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">{suggestion.reason}</p>
                        </div>
                        <ChevronDown className={cn("h-5 w-5 transition-transform", isOpen && "rotate-180")} />
                    </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <CardContent className="pt-0 p-4 space-y-4">
                        <div className="flex items-center justify-between text-sm font-semibold border-t pt-4">
                            <span>Recipe</span>
                            <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1"><Wallet className="w-4 h-4 text-green-600" />~£{suggestion.costPerPortion.toFixed(2)}</span>
                                <span className="flex items-center gap-1"><Flame className="w-4 h-4 text-destructive" />~{suggestion.calories} kcal</span>
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
                        <AddToMealPlanDialog meal={suggestion} onAddToPlan={onAddToPlan} />
                    </CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    )
}

export default function DietaryMenuPage() {
    const [recommendations, setRecommendations] = useState<GenerateDietaryRecommendationOutput | null>(null);
    const [favoriteMeals, setFavoriteMeals] = useState<MealSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
    const { toast } = useToast();

    const getFavoritesKey = (email: string) => `favoriteMeals_${email}`;
    const getMealPlanKey = (email: string) => `mealPlan_${email}`;

    useEffect(() => {
        const email = localStorage.getItem("currentUserEmail");
        if (email) {
            setCurrentUserEmail(email);
            // Load favorites
            const storedFavorites = localStorage.getItem(getFavoritesKey(email));
            if (storedFavorites) {
                setFavoriteMeals(JSON.parse(storedFavorites));
            }
            // Fetch new recommendations
            fetchDataAndGenerate(email);
        } else {
            setIsLoading(false);
            setError("Could not identify user. Please log in again.");
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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


    const handleRefresh = () => {
        if (currentUserEmail) {
            fetchDataAndGenerate(currentUserEmail);
        }
    }
    
    const handleToggleFavorite = (suggestion: MealSuggestion) => {
        if (!currentUserEmail) return;

        let updatedFavorites;
        const isAlreadyFavorite = favoriteMeals.some(fav => fav.name === suggestion.name);

        if (isAlreadyFavorite) {
            updatedFavorites = favoriteMeals.filter(fav => fav.name !== suggestion.name);
        } else {
            updatedFavorites = [...favoriteMeals, suggestion];
        }
        
        setFavoriteMeals(updatedFavorites);
        localStorage.setItem(getFavoritesKey(currentUserEmail), JSON.stringify(updatedFavorites));
    }

    const handleAddToPlan = (day: string, mealType: MealType, meal: MealSuggestion) => {
        if (!currentUserEmail) return;

        const mealPlanKey = getMealPlanKey(currentUserEmail);
        const storedPlan = localStorage.getItem(mealPlanKey);
        const mealPlan = storedPlan ? JSON.parse(storedPlan) : {};

        if (!mealPlan[day]) {
            mealPlan[day] = { breakfast: null, lunch: null, dinner: null };
        }
        
        mealPlan[day][mealType] = { ...meal, id: new Date().toISOString() };
        localStorage.setItem(mealPlanKey, JSON.stringify(mealPlan));
        
        toast({
            title: `Added to ${day}'s ${mealType}`,
            description: `"${meal.name}" has been added to your meal plan.`,
        });
    };


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

            {favoriteMeals.length > 0 && (
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Star className="text-yellow-400 fill-yellow-400" /> My Favorite Meals</CardTitle>
                        <CardDescription>Your saved meal ideas for quick reference.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {favoriteMeals.map(suggestion => (
                                <MealCard 
                                    key={`fav-${suggestion.name}`}
                                    suggestion={suggestion}
                                    isFavorite={true}
                                    onToggleFavorite={handleToggleFavorite}
                                    onAddToPlan={handleAddToPlan}
                                />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

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
                            <CardDescription>Here are some healthy ideas to try. Click on any meal to see the recipe, and save your favorites using the star icon.</CardDescription>
                        </CardHeader>
                         <CardContent className="space-y-6">
                            {Object.entries(recommendations.recommendations).map(([category, suggestions]) => (
                                (suggestions as MealSuggestion[]).length > 0 && (
                                     <div key={category}>
                                        <h3 className="font-semibold text-lg capitalize flex items-center gap-2 mb-3">
                                             {categoryIcons[category as keyof typeof categoryIcons]}
                                            {category}
                                        </h3>
                                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                            {(suggestions as MealSuggestion[]).map(suggestion => (
                                                <MealCard
                                                    key={suggestion.name}
                                                    suggestion={suggestion}
                                                    isFavorite={favoriteMeals.some(fav => fav.name === suggestion.name)}
                                                    onToggleFavorite={handleToggleFavorite}
                                                    onAddToPlan={handleAddToPlan}
                                                />
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
