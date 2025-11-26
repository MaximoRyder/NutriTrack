"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import { MealPlan } from "@/lib/types";
import { format } from "date-fns";
import { enUS, es, pt } from "date-fns/locale";
import { Utensils } from "lucide-react";

interface DailyMealPlanCardProps {
    activeMealPlan: MealPlan | null | undefined;
    date: Date | undefined;
}

export function DailyMealPlanCard({ activeMealPlan, date }: DailyMealPlanCardProps) {
    const { t, locale } = useTranslation();
    const dateLocale = locale === 'es' ? es : locale === 'pt' ? pt : enUS;

    if (!date || !activeMealPlan) {
        return (
            <Card className="h-full">
                <CardHeader>
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                        <Utensils className="h-4 w-4" />
                        {t("dashboard.dailyMeals")}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground text-center py-8">
                        {t("dashboard.noPlanSelected")}
                    </p>
                </CardContent>
            </Card>
        );
    }

    const dayOfWeek = format(date, "EEEE", { locale: enUS }).toLowerCase();
    const dayMeals = activeMealPlan.weekStructure?.[dayOfWeek as keyof typeof activeMealPlan.weekStructure] || [];

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <Utensils className="h-4 w-4" />
                    {t("dashboard.dailyMeals")}
                    <span className="text-sm font-normal text-muted-foreground ml-auto capitalize">
                        {format(date, "EEEE", { locale: dateLocale })}
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
                <ScrollArea className="h-[250px] pr-4">
                    {dayMeals.length > 0 ? (
                        <div className="space-y-4">
                            {dayMeals.map((slot, index) => (
                                <div key={index} className="flex flex-col gap-1 pb-3 border-b last:border-0 last:pb-0">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium capitalize text-sm">
                                            {t(`addMeal.${slot.mealType}`)}
                                        </span>
                                        {slot.mealItem?.recommendedTime && (
                                            <span className="text-xs text-muted-foreground">
                                                {slot.mealItem.recommendedTime}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {slot.mealItem?.title || slot.notes || t("dashboard.noMealDetails")}
                                    </p>
                                    {slot.mealItem?.portionInfo && (
                                        <p className="text-xs text-muted-foreground italic">
                                            {slot.mealItem.portionInfo}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full py-8 text-center space-y-2">
                            <p className="text-sm text-muted-foreground">
                                {t("dashboard.noMealsScheduled")}
                            </p>
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
