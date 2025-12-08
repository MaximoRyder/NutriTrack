"use client";

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import { MealPlan } from "@/lib/types";
import { format } from "date-fns";
import { enUS, es, pt } from "date-fns/locale";
import { BookOpen, CalendarDays, Clock, Utensils } from "lucide-react";
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
                                    <Accordion type="single" collapsible className="w-full">
                                        {dayMeals.map((slot, index) => (
                                            <AccordionItem key={index} value={`item-${index}`} className="border-b last:border-0">
                                                <AccordionTrigger className="hover:no-underline py-3">
                                                    <div className="flex flex-1 items-center justify-between mr-4">
                                                        <div className="flex flex-col items-start gap-1 text-left">
                                                            <span className="font-semibold capitalize text-sm text-primary">
                                                                {t(`addMeal.${slot.mealType}`)}
                                                            </span>
                                                            <span className="text-sm font-medium text-muted-foreground w-full truncate max-w-[180px]">
                                                                {slot.isFlexible
                                                                    ? (slot.customName || t("addMeal.flexible"))
                                                                    : (slot.mealItem?.title || t("dashboard.noMealDetails"))}
                                                            </span>
                                                        </div>
                                                        {slot.mealItem?.recommendedTime && (
                                                            <div className="flex items-center text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded-full">
                                                                <Clock className="h-3 w-3 mr-1" />
                                                                {slot.mealItem.recommendedTime}
                                                            </div>
                                                        )}
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent>
                                                    <div className="pt-1 pb-2 space-y-3">
                                                        {slot.isFlexible ? (
                                                            <div className="space-y-2">
                                                                {slot.components?.map((comp, i) => (
                                                                    <div key={i} className="flex items-center justify-between text-sm p-2 bg-secondary/20 rounded-md">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="w-2 h-2 rounded-full bg-primary/70" />
                                                                            <span className="font-medium">{comp.group}</span>
                                                                        </div>
                                                                        <span className="font-bold text-muted-foreground">{comp.percentage}%</span>
                                                                    </div>
                                                                ))}
                                                                {(!slot.components || slot.components.length === 0) && (
                                                                    <p className="text-sm text-muted-foreground italic">{t("dashboard.noMealDetails")}</p>
                                                                )}
                                                                {slot.notes && (
                                                                    <div className="mt-2 text-xs text-muted-foreground bg-yellow-50/50 p-2 rounded border border-yellow-100 dark:border-yellow-900/30 dark:bg-yellow-900/10">
                                                                        <span className="font-semibold text-yellow-600 dark:text-yellow-500 mr-1">Nota:</span>
                                                                        {slot.notes}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-2 text-sm">
                                                                {slot.mealItem?.description && (
                                                                    <p className="text-muted-foreground leading-relaxed">
                                                                        {slot.mealItem.description}
                                                                    </p>
                                                                )}
                                                                {slot.mealItem?.portionInfo && (
                                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/30 p-2 rounded">
                                                                        <Utensils className="h-3 w-3" />
                                                                        <span className="font-medium">{t("patientPlan.portion")}:</span>
                                                                        {slot.mealItem.portionInfo}
                                                                    </div>
                                                                )}
                                                                {slot.notes && (
                                                                    <div className="text-xs text-primary italic mt-2">
                                                                        {t("patientPlan.nutritionistNotes")}: {slot.notes}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
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
