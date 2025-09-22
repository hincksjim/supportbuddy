
"use client"

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, Calendar, Coffee, Soup, Utensils, Printer, Download, ShoppingCart, Info, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateShoppingList, GenerateShoppingListOutput } from "@/ai/flows/generate-shopping-list";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import jsPDF from "jspdf";
import "jspdf-autotable";

interface MealSuggestion {
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

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const mealIcons: Record<MealType, React.ReactNode> = {
    breakfast: <Coffee className="w-4 h-4 text-muted-foreground" />,
    lunch: <Soup className="w-4 h-4 text-muted-foreground" />,
    dinner: <Utensils className="w-4 h-4 text-muted-foreground" />,
};

export default function ShoppingListPage() {
    const [mealPlan, setMealPlan] = useState<Record<string, Record<MealType, PlannedMeal | null>>>({});
    const [shoppingList, setShoppingList] = useState<GenerateShoppingListOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    const getStorageKey = (email: string) => `mealPlan_${email}`;

    const loadMealPlan = useCallback(() => {
        if (!currentUserEmail) return;
        const storedPlan = localStorage.getItem(getStorageKey(currentUserEmail));
        if (storedPlan) {
            setMealPlan(JSON.parse(storedPlan));
        } else {
            // Initialize empty plan for all days
            const emptyPlan = daysOfWeek.reduce((acc, day) => {
                acc[day] = { breakfast: null, lunch: null, dinner: null };
                return acc;
            }, {} as Record<string, Record<MealType, PlannedMeal | null>>);
            setMealPlan(emptyPlan);
        }
    }, [currentUserEmail]);

    useEffect(() => {
        const email = localStorage.getItem('currentUserEmail');
        setCurrentUserEmail(email);
    }, []);

    useEffect(() => {
        if (currentUserEmail) {
            loadMealPlan();
        }
    }, [currentUserEmail, loadMealPlan]);

    const handleGenerateList = async () => {
        const allMeals = Object.values(mealPlan).flatMap(day => Object.values(day)).filter(Boolean) as PlannedMeal[];
        if (allMeals.length === 0) {
            toast({ title: "Meal plan is empty", description: "Add some meals to your plan first.", variant: "destructive" });
            return;
        }

        setIsLoading(true);
        setError(null);
        setShoppingList(null);

        try {
            const result = await generateShoppingList({ meals: allMeals });
            setShoppingList(result);
        } catch (err: any) {
            console.error("Failed to generate shopping list:", err);
            setError("Sorry, there was an error generating your shopping list. Please try again.");
        } finally {
            setIsLoading(false);
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

    const handleRemoveMeal = (day: string, mealType: MealType) => {
        if (!currentUserEmail) return;
        
        const newMealPlan = { ...mealPlan };
        newMealPlan[day][mealType] = null;
        setMealPlan(newMealPlan);
        
        localStorage.setItem(getStorageKey(currentUserEmail), JSON.stringify(newMealPlan));
        toast({ title: "Meal removed from plan." });
    };

    const allMeals = Object.values(mealPlan).flatMap(day => Object.values(day));
    const mealCount = allMeals.filter(Boolean).length;

    return (
        <div className="p-4 md:p-6 space-y-8">
             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Weekly Shopping List</h1>
                    <p className="text-muted-foreground">
                        Generate a shopping list based on your meal plan. Add meals from the Dietary Menu.
                    </p>
                </div>
                 <Button onClick={handleGenerateList} disabled={isLoading || mealCount === 0}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4" />}
                    Generate Shopping List
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Calendar /> Your Meal Plan</CardTitle>
                    <CardDescription>
                        {mealCount > 0 ? `You have ${mealCount} meal(s) planned for this week.` : "Your meal plan is empty. Go to the Dietary Menu to add meals."}
                    </CardDescription>
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

            {shoppingList ? (
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
                    </CardContent>
                </Card>
            ) : !isLoading && (
                 <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Ready to Generate</AlertTitle>
                    <AlertDescription>
                        Once you have meals in your plan, click the "Generate Shopping List" button to create your list.
                    </AlertDescription>
                </Alert>
            )}

            {error && (
                 <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
        </div>
    )
}
