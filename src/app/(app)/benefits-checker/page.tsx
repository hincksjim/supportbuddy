
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Loader2, RefreshCw, CheckCircle2, XCircle, MinusCircle } from "lucide-react"
import { generateBenefitsMatrix, GenerateBenefitsMatrixOutput } from "@/ai/flows/generate-benefits-matrix"

interface UserData {
    age?: string;
    employmentStatus?: string;
    benefits?: string[];
}

export default function BenefitsCheckerPage() {
    const [matrixData, setMatrixData] = useState<GenerateBenefitsMatrixOutput | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
    const [userData, setUserData] = useState<UserData>({});

    const loadUserData = () => {
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
        return null;
    }

    const generateMatrix = async (currentUserData: UserData) => {
        if (!currentUserData.age || !currentUserData.employmentStatus) {
            setError("Your age and employment status must be set in your profile to generate the benefits matrix.");
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const result = await generateBenefitsMatrix({
                age: currentUserData.age,
                employmentStatus: currentUserData.employmentStatus,
                existingBenefits: currentUserData.benefits || [],
            });
            setMatrixData(result);
        } catch (err) {
            console.error("Failed to generate benefits matrix:", err);
            setError("Sorry, there was an error generating the benefits matrix. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleRefresh = () => {
        const loadedData = loadUserData();
        if(loadedData) {
            generateMatrix(loadedData);
        }
    }

    useEffect(() => {
        const loadedData = loadUserData();
        if(loadedData) {
            generateMatrix(loadedData);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Get a unique list of all benefit names across all scenarios
    const allBenefitNames = matrixData ? 
        Array.from(new Set(matrixData.scenarios.flatMap(s => s.benefits.map(b => b.name))))
        : [];
        
    return (
        <div className="p-4 md:p-6 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Benefits Checker</h1>
                    <p className="text-muted-foreground">
                        Compare your current benefits with what you might be entitled to in different situations.
                    </p>
                </div>
                <Button onClick={handleRefresh} disabled={isLoading}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh Matrix
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Benefits Matrix</CardTitle>
                    <CardDescription>
                        This table shows potential eligibility based on the information in your profile.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <p>Generating your personalized benefits matrix...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-20 text-destructive">
                            <p>{error}</p>
                        </div>
                    ) : matrixData ? (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="font-bold min-w-[200px]">Benefit</TableHead>
                                        <TableHead className="font-bold text-center">Currently Receiving</TableHead>
                                        {matrixData.scenarios.map(scenario => (
                                            <TableHead key={scenario.scenario} className="font-bold text-center min-w-[250px]">
                                                {scenario.scenario}
                                                <p className="text-xs font-normal text-muted-foreground mt-1">{scenario.description}</p>
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {allBenefitNames.map(benefitName => (
                                        <TableRow key={benefitName}>
                                            <TableCell className="font-medium">{benefitName}</TableCell>
                                            
                                            {/* Column for "Currently Receiving" */}
                                            <TableCell className="text-center">
                                                {userData.benefits?.includes(benefitName) ? (
                                                     <div className="flex flex-col items-center text-green-600">
                                                        <CheckCircle2 className="w-6 h-6" />
                                                        <span className="text-xs">Yes</span>
                                                     </div>
                                                ) : (
                                                    <div className="flex flex-col items-center text-muted-foreground">
                                                        <XCircle className="w-6 h-6" />
                                                        <span className="text-xs">No</span>
                                                    </div>
                                                )}
                                            </TableCell>

                                            {/* Columns for each scenario */}
                                            {matrixData.scenarios.map(scenario => {
                                                const benefitInfo = scenario.benefits.find(b => b.name === benefitName);
                                                if (!benefitInfo) {
                                                    return <TableCell key={scenario.scenario} className="text-center text-muted-foreground">—</TableCell>;
                                                }
                                                return (
                                                    <TableCell key={scenario.scenario} className="text-center">
                                                        {benefitInfo.isEligible ? (
                                                            benefitInfo.isCurrent ? (
                                                                <div className="flex flex-col items-center text-blue-600" title={benefitInfo.reason}>
                                                                    <MinusCircle className="w-6 h-6" />
                                                                    <span className="text-xs">Already Receiving</span>
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-col items-center text-green-600" title={benefitInfo.reason}>
                                                                    <CheckCircle2 className="w-6 h-6" />
                                                                     <span className="text-xs">Likely Eligible</span>
                                                                </div>
                                                            )
                                                        ) : (
                                                            <div className="flex flex-col items-center text-destructive" title={benefitInfo.reason}>
                                                                <XCircle className="w-6 h-6" />
                                                                <span className="text-xs">Not Eligible</span>
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                )
                                            })}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                         <div className="text-center py-20 rounded-lg border-2 border-dashed">
                            <h2 className="text-xl font-semibold">No data</h2>
                            <p className="text-muted-foreground mt-2">Could not generate the matrix. Please ensure your profile is complete and try refreshing.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
