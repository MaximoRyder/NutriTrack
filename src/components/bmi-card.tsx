"use client";

import { BmiGauge } from "@/components/bmi-gauge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import { useMemo } from "react";

interface BmiCardProps {
    userProfile: any;
}

export function BmiCard({ userProfile }: BmiCardProps) {
    const { t } = useTranslation();

    const calculatedBMI = useMemo(() => {
        if (userProfile?.currentWeightKg && userProfile?.heightCm) {
            const h = userProfile.heightCm / 100;
            return (userProfile.currentWeightKg / (h * h)).toFixed(1);
        }
        return null;
    }, [userProfile]);

    if (!calculatedBMI) return null;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {t("settings.calculatedBmi")}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{calculatedBMI}</div>
                <CardDescription className="text-xs text-muted-foreground mb-4">
                    {t("settings.bmiDesc")}
                </CardDescription>
                <div className="mt-2">
                    <BmiGauge bmi={Number(calculatedBMI)} />
                </div>
            </CardContent>
        </Card>
    );
}
