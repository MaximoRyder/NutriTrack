"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import { MealPlan } from "@/lib/types";
import { format } from "date-fns";
import { enUS, es, pt } from "date-fns/locale";
import { BookOpen, CalendarDays, Utensils } from "lucide-react";
import Link from "next/link";

interface CombinedMealPlanCardProps {
    activeMealPlan: MealPlan | null | undefined;
    date: Date | undefined;
    nutritionistInfo: any;
    isLoading: boolean;
}

export function CombinedMealPlanCard({
    activeMealPlan,
    date,
    nutritionistInfo,
    isLoading,
}: CombinedMealPlanCardProps) {
    const { t, locale } = useTranslation();
    const dateLocale = locale === "es" ? es : locale === "pt" ? pt : enUS;

    const getCurrentWeek = () => {
        if (!activeMealPlan?.startDate) return 1;
        const start = new Date(activeMealPlan.startDate);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.ceil(diffDays / 7);
    };

    if (isLoading) {
        return (
            <Card className="max-h-fit">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        {t("dashboard.activeMealPlan")}
                    </CardTitle>
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <Skeleton className="h-7 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-8" />
                        </div>
                        <Skeleton className="h-9 w-full mt-2" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!activeMealPlan) {
        return (
            <Card className="h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        {t("dashboard.activeMealPlan")}
                    </CardTitle>
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-4 text-center space-y-3">
                        <p className="text-sm text-muted-foreground">
                            {t("dashboard.noActivePlan")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {t("dashboard.nutritionistWillAssign")}
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const dayOfWeek = date
        ? format(date, "EEEE", { locale: enUS }).toLowerCase()
        : "monday";
    const dayMeals =
        activeMealPlan.weekStructure?.[
        dayOfWeek as keyof typeof activeMealPlan.weekStructure
        ] || [];

    return (
        <Card className="flex flex-col h-[350px] md:h-[400px]">
            <CardHeader className="pb-2">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <Utensils className="h-4 w-4" />
                    {t("dashboard.mealPlan")}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
                <Tabs defaultValue="daily" className="w-full h-full flex flex-col">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="summary">{t("dashboard.summary")}</TabsTrigger>
                        <TabsTrigger value="daily">{t("dashboard.dailyMeals")}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="summary" className="space-y-4">
                        <div>
                            <div className="text-xl font-bold">{activeMealPlan.name}</div>
                            {activeMealPlan.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    {activeMealPlan.description}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">
                                {t("dashboard.week")}:
                            </span>
                            <span className="font-semibold">{getCurrentWeek()}</span>
                        </div>

                        {nutritionistInfo && (
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-muted-foreground">
                                    {t("dashboard.assignedBy")}:
                                </span>
                                <span className="font-medium">
                                    {nutritionistInfo.displayName}
                                </span>
                            </div>
                        )}

                        <Link href="/plan">
                            <Button className="w-full mt-2" size="sm">
                                <BookOpen className="mr-2 h-4 w-4" />
                                {t("dashboard.viewFullPlan")}
                            </Button>
                        </Link>
                    </TabsContent>

                    <TabsContent value="daily" className="flex-1 min-h-0 flex flex-col">
                        <div className="mb-2 flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground capitalize">
                                {date ? format(date, "EEEE", { locale: dateLocale }) : ""}
                            </span>
                        </div>
                        <ScrollArea className="flex-1 pr-4 -mr-4">
                            {dayMeals.length > 0 ? (
                                <div className="space-y-4">
                                    {dayMeals.map((slot, index) => (
                                        <div
                                            key={index}
                                            className="flex flex-col gap-1 pb-3 border-b last:border-0 last:pb-0"
                                        >
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
                                                {slot.mealItem?.title ||
                                                    slot.notes ||
                                                    t("dashboard.noMealDetails")}
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
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
