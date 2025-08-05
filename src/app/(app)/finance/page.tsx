
"use client"

import { useState, useEffect } from "react"
import { Landmark, Briefcase, HandCoins, PiggyBank, Wallet } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface UserData {
    employmentStatus?: string;
    income?: string;
    savings?: string;
    benefits?: string[];
}

export default function FinancePage() {
    const [userData, setUserData] = useState<UserData>({});

    useEffect(() => {
        const email = localStorage.getItem("currentUserEmail");
        if (email) {
            const storedData = localStorage.getItem(`userData_${email}`);
            if (storedData) {
                const parsedData = JSON.parse(storedData);
                let formattedStatus = parsedData.employmentStatus?.charAt(0).toUpperCase() + parsedData.employmentStatus?.slice(1).replace(/-/g, ' ');
                if (formattedStatus === 'Unemployed not on benefits') formattedStatus = 'Unemployed';
                if (formattedStatus === 'Unemployed on benefits') formattedStatus = 'On Benefits';
                
                setUserData({ ...parsedData, employmentStatus: formattedStatus });
            }
        }
    }, [])

    const formatCurrency = (value: string) => {
        const number = parseFloat(value);
        if (isNaN(number)) return value;
        return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(number);
    }

    return (
        <div className="p-4 md:p-6 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Financials</h1>
                    <p className="text-muted-foreground">
                        A summary of your current financial situation.
                    </p>
                </div>
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

                {userData.income && (
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
                )}

                {userData.savings && (
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
                )}

                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <HandCoins className="w-6 h-6 text-primary" />
                            Benefits
                        </CardTitle>
                        <CardDescription>Benefits you have indicated you may be eligible for or are receiving.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {userData.benefits && userData.benefits.length > 0 ? (
                            <ul className="columns-1 sm:columns-2 md:columns-3 list-disc list-inside space-y-1 text-muted-foreground">
                                {userData.benefits.map((benefit, index) => (
                                    <li key={index}>{benefit}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-muted-foreground">No benefits selected.</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="text-center py-10 rounded-lg border-2 border-dashed">
                <Landmark className="mx-auto h-12 w-12 text-muted-foreground" />
                <h2 className="mt-4 text-xl font-semibold">More Financial Tools Coming Soon</h2>
                <p className="text-muted-foreground mt-2">This section is under construction.</p>
            </div>
        </div>
    )
}
