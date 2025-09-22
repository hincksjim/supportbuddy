
"use client"

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Lightbulb, Utensils, Apple, Soup, Coffee, ChevronDown, Flame, Wallet, Star, PlusCircle, ShoppingCart, Calendar, Trash2, Download, Printer, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { generateDietaryRecommendation, GenerateDietaryRecommendationOutput } from "@/ai/flows/generate-dietary-recommendation";
import { generateShoppingList, GenerateShoppingListOutput } from "@/ai/flows/generate-shopping-list";
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
import jsPDF from "jspdf";
import "jspdf-autotable";

interface UserData {
    initialDiagnosis?: string;
}

export interface MealSuggestion {
  name: string;
  reason: string;
  ingredients: string[];
  instructions: string;
  calories: number;
  costPerPortion: number;
}

interface PlannedMeal extends MealSuggestion {
  id: string; 
}

type MealType = 'breakfast' | 'lunch' | 'dinner';

const categoryIcons = {
    breakfast: <Coffee className="w-6 h-6 text-primary" />,
    lunch: <Soup className="w-6 h-6 text-primary" />,
    dinner: <Utensils className="w-6 h-6 text-primary" />,
    snacks: <Apple className="w-6 h-6 text-primary" />,
};

const mealIcons: Record<MealType, React.ReactNode> = {
    breakfast: <Coffee className="w-4 h-4 text-muted-foreground" />,
    lunch: <Soup className="w-4 h-4 text-muted-foreground" />,
    dinner: <Utensils className="w-4 h-4 text-muted-foreground" />,
};

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];


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
                                {daysOfWeek.map(d => (
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
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
    const { toast } = useToast();

    // State from shopping list page
    const [mealPlan, setMealPlan] = useState<Record<string, Record<MealType, PlannedMeal | null>>>({});
    const [shoppingList, setShoppingList] = useState<GenerateShoppingListOutput | null>(null);
    const [isLoadingList, setIsLoadingList] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const listRef = useRef<HTMLDivElement>(null);


    const getFavoritesKey = (email: string) => `favoriteMeals_${email}`;
    const getMealPlanKey = (email: string) => `mealPlan_${email}`;

    const loadMealPlan = useCallback(() => {
        if (!currentUserEmail) return;
        const storedPlan = localStorage.getItem(getMealPlanKey(currentUserEmail));
        if (storedPlan) {
            setMealPlan(JSON.parse(storedPlan));
        } else {
            const emptyPlan = daysOfWeek.reduce((acc, day) => {
                acc[day] = { breakfast: null, lunch: null, dinner: null };
                return acc;
            }, {} as Record<string, Record<MealType, PlannedMeal | null>>);
            setMealPlan(emptyPlan);
        }
    }, [currentUserEmail]);

    useEffect(() => {
        const email = localStorage.getItem("currentUserEmail");
        if (email) {
            setCurrentUserEmail(email);
            const storedFavorites = localStorage.getItem(getFavoritesKey(email));
            if (storedFavorites) {
                setFavoriteMeals(JSON.parse(storedFavorites));
            }
            loadMealPlan();
            fetchDataAndGenerate(email);
        } else {
            setIsLoadingSuggestions(false);
            setError("Could not identify user. Please log in again.");
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUserEmail]);
    
     useEffect(() => {
        if (currentUserEmail) {
            loadMealPlan();
        }
    }, [currentUserEmail, loadMealPlan]);

    const fetchDataAndGenerate = async (email: string) => {
        setIsLoadingSuggestions(true);
        setError(null);
        try {
            const storedUser = localStorage.getItem(`userData_${email}`);
            const storedDiary = localStorage.getItem(`diaryEntries_${email}`);
            
            const userData: UserData = storedUser ? JSON.parse(storedUser) : {};
            const diaryEntries: DiaryEntry[] = storedDiary ? JSON.parse(storedDiary) : [];

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
            setIsLoadingSuggestions(false);
        }
    }


    const handleRefreshSuggestions = () => {
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

        setMealPlan(prevPlan => {
            const newPlan = { ...prevPlan };
            if (!newPlan[day]) {
                newPlan[day] = { breakfast: null, lunch: null, dinner: null };
            }
            newPlan[day][mealType] = { ...meal, id: new Date().toISOString() };
            
            localStorage.setItem(getMealPlanKey(currentUserEmail), JSON.stringify(newPlan));
            return newPlan;
        });
        
        toast({
            title: `Added to ${day}'s ${mealType}`,
            description: `"${meal.name}" has been added to your meal plan.`,
        });
    };
    
    const handleRemoveMeal = (day: string, mealType: MealType) => {
        if (!currentUserEmail) return;
        
        setMealPlan(prevPlan => {
            const newMealPlan = { ...prevPlan };
            newMealPlan[day][mealType] = null;
            localStorage.setItem(getMealPlanKey(currentUserEmail), JSON.stringify(newMealPlan));
            return newMealPlan;
        });

        toast({ title: "Meal removed from plan." });
    };

    const handleGenerateList = async () => {
        const allMeals = Object.values(mealPlan).flatMap(day => Object.values(day)).filter(Boolean) as PlannedMeal[];
        if (allMeals.length === 0) {
            toast({ title: "Meal plan is empty", description: "Add some meals to your plan first.", variant: "destructive" });
            return;
        }

        setIsLoadingList(true);
        setError(null);
        setShoppingList(null);

        try {
            const result = await generateShoppingList({ meals: allMeals });
            setShoppingList(result);
        } catch (err: any) {
            console.error("Failed to generate shopping list:", err);
            setError("Sorry, there was an error generating your shopping list. Please try again.");
        } finally {
            setIsLoadingList(false);
        }
    };

    const handleDownloadPdf = () => {
        if (!shoppingList || !listRef.current) return;
        setIsDownloading(true);

        const pdf = new jsPDF();
        pdf.setFontSize(18);
        pdf.text("Your Weekly Shopping List", 14, 22);
        pdf.setFontSize(11);
        pdf.setTextColor(100);
        pdf.text(`Total Estimated Cost: £${shoppingList.totalEstimatedCost.toFixed(2)}`, 14, 30);

        const tableData = shoppingList.list.flatMap(category => {
            const categoryRow = [{ content: category.category, colSpan: 3, styles: { fontStyle: 'bold', fillColor: '#f4f4f4' } }];
            const itemRows = category.items.map(item => [item.name, item.quantity, `£${item.estimatedCost.toFixed(2)}`]);
            return [categoryRow, ...itemRows];
        });

        (pdf as any).autoTable({
            startY: 35,
            head: [['Item', 'Quantity', 'Est. Cost']],
            body: tableData,
            theme: 'striped',
        });
        
        pdf.save("shopping-list.pdf");
        setIsDownloading(false);
    };

    const mealCount = Object.values(mealPlan).flatMap(day => Object.values(day)).filter(Boolean).length;


    return (
        <div className="p-4 md:p-6 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Dietary Menu & Shopping List</h1>
                    <p className="text-muted-foreground">
                        AI-powered meal suggestions, weekly planner, and shopping list generator.
                    </p>
                </div>
                <Button onClick={handleRefreshSuggestions} disabled={isLoadingSuggestions}>
                    {isLoadingSuggestions ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
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

            {isLoadingSuggestions ? (
                <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p>Generating your personalized dietary plan...</p>
                </div>
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
            ) : null}

            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                            <CardTitle className="flex items-center gap-2"><Calendar /> Your Meal Plan</CardTitle>
                            <CardDescription>
                                {mealCount > 0 ? `You have ${mealCount} meal(s) planned for this week.` : "Your meal plan is empty. Add meals from the suggestions above."}
                            </CardDescription>
                        </div>
                         <Button onClick={handleGenerateList} disabled={isLoadingList || mealCount === 0}>
                            {isLoadingList ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4" />}
                            Generate Shopping List
                        </Button>
                    </div>
                </CardHeader>
                 <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {daysOfWeek.map(day => (
                        <Card key={day} className="bg-muted/30">
                            <CardHeader className="p-4">
                                <CardTitle className="text-base">{day}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0 space-y-3">
                                {(['breakfast', 'lunch', 'dinner'] as MealType[]).map(mealType => {
                                    const meal = mealPlan[day]?.[mealType];
                                    return (
                                        <div key={mealType} className="flex items-start gap-3 text-sm">
                                            {mealIcons[mealType]}
                                            {meal ? (
                                                <div className="flex-1 relative group">
                                                    <p className="font-semibold leading-tight">{meal.name}</p>
                                                    <p className="text-xs text-muted-foreground">~{meal.calories} kcal</p>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="absolute -top-1 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => handleRemoveMeal(day, mealType)}
                                                    >
                                                        <Trash2 className="w-4 h-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <p className="text-muted-foreground italic">Not planned</p>
                                            )}
                                        </div>
                                    )
                                })}
                            </CardContent>
                        </Card>
                    ))}
                </CardContent>
            </Card>
            
            {isLoadingList ? (
                 <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p>Generating your shopping list...</p>
                </div>
            ) : shoppingList ? (
                <Card ref={listRef}>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                             <div>
                                <CardTitle className="flex items-center gap-2">Generated Shopping List</CardTitle>
                                <CardDescription>
                                    Total Estimated Cost: <span className="font-bold text-primary">£{shoppingList.totalEstimatedCost.toFixed(2)}</span>
                                </CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={handleDownloadPdf} variant="outline" disabled={isDownloading}>
                                    {isDownloading ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Download className="mr-2"/>}
                                    Download PDF
                                </Button>
                                <Button onClick={() => window.print()} variant="outline">
                                    <Printer className="mr-2"/> Print
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {shoppingList.list.map(category => (
                            <div key={category.category}>
                                <h3 className="font-bold text-lg mb-2 border-b pb-1">{category.category}</h3>
                                <table className="w-full text-sm">
                                    <tbody>
                                        {category.items.map(item => (
                                            <tr key={item.name} className="border-b last:border-b-0">
                                                <td className="py-2 pr-4">{item.name}</td>
                                                <td className="py-2 px-4 text-muted-foreground">{item.quantity}</td>
                                                <td className="py-2 pl-4 text-right font-medium">£{item.estimatedCost.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                         <div className="text-right font-bold text-lg pt-4 border-t">
                            Total: £{shoppingList.totalEstimatedCost.toFixed(2)}
                        </div>
                    </CardContent>
                </Card>
            ) : error ? (
                <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            ) : (
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Ready to Generate</AlertTitle>
                    <AlertDescription>
                        Once you have meals in your plan, click the "Generate Shopping List" button to create your list.
                    </AlertDescription>
                </Alert>
            )}

        </div>
    )
}
