"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import type { AssignedDayMealSlot, MealPlan, UserProfile } from "@/lib/types";
import { Calendar as CalendarIcon, Clock, ImageIcon, Stethoscope, Video } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function PlanPage() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activePlan, setActivePlan] = useState<MealPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMeal, setSelectedMeal] = useState<{
    slot: AssignedDayMealSlot;
    day: string;
  } | null>(null);

  const today = new Date()
    .toLocaleDateString("en-US", { weekday: "long" })
    .toLowerCase() as keyof MealPlan["weekStructure"];

  const DAYS = [
    { key: "monday", label: t("patientPlan.days.monday") },
    { key: "tuesday", label: t("patientPlan.days.tuesday") },
    { key: "wednesday", label: t("patientPlan.days.wednesday") },
    { key: "thursday", label: t("patientPlan.days.thursday") },
    { key: "friday", label: t("patientPlan.days.friday") },
    { key: "saturday", label: t("patientPlan.days.saturday") },
    { key: "sunday", label: t("patientPlan.days.sunday") },
  ] as const;

  const MEAL_TYPE_LABELS: Record<string, string> = {
    breakfast: t("addMeal.breakfast"),
    lunch: t("addMeal.lunch"),
    dinner: t("addMeal.dinner"),
    snack: t("addMeal.snack"),
    other: t("addMeal.other"),
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.email) return;

      try {
        // Fetch user profile
        const profileRes = await fetch("/api/users/profile");
        if (profileRes.ok) {
          const profile = await profileRes.json();
          setUserProfile(profile);

          // If user has nutritionist, fetch active plan
          if (profile.assignedNutritionistId) {
            const planRes = await fetch(
              `/api/meal-plans/active?patientId=${profile.id}`
            );
            if (planRes.ok) {
              const data = await planRes.json();
              setActivePlan(data.activePlan);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [session]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-full max-w-md mb-4" />
            <div className="flex gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-32" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="w-full">
              <div className="grid w-full grid-cols-3 sm:grid-cols-4 md:grid-cols-7 h-auto gap-1 mb-4">
                {Array.from({ length: 7 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-full" />
                ))}
              </div>
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 mb-1">
                            <Skeleton className="h-5 w-16" />
                            <Skeleton className="h-4 w-12" />
                          </div>
                          <Skeleton className="h-6 w-[70%]" />
                          <Skeleton className="h-4 w-[40%]" />
                        </div>
                        <Skeleton className="h-16 w-16 sm:h-20 sm:w-20 rounded-md shrink-0" />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // State 1: No nutritionist assigned
  if (!userProfile?.assignedNutritionistId) {
    return (
      <Card className="max-w-2xl mx-auto mt-8">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
            <Stethoscope className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle>{t("patientPlan.noNutritionist.title")}</CardTitle>
          <CardDescription>
            {t("patientPlan.noNutritionist.description")}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // State 2: Has nutritionist but no active plan
  if (!activePlan) {
    return (
      <Card className="max-w-2xl mx-auto mt-8">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
            <CalendarIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle>{t("patientPlan.noPlan.title")}</CardTitle>
          <CardDescription>
            {t("patientPlan.noPlan.description")}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // State 3: Has active plan - show it
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{activePlan.name}</CardTitle>
          {activePlan.description && (
            <CardDescription>{activePlan.description}</CardDescription>
          )}
          <div className="flex gap-2 text-sm text-muted-foreground">
            <span>
              {t("patientPlan.start")}: {new Date(activePlan.startDate).toLocaleDateString()}
            </span>
            {activePlan.endDate && (
              <>
                <span>•</span>
                <span>
                  {t("patientPlan.end")}: {new Date(activePlan.endDate).toLocaleDateString()}
                </span>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={today} className="w-full">
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-4 md:grid-cols-7 h-auto gap-1">
              {DAYS.map(({ key, label }) => (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="capitalize text-xs sm:text-sm px-2 py-2 sm:px-3 sm:py-2.5"
                >
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
            {DAYS.map(({ key, label }) => (
              <TabsContent
                key={key}
                value={key}
                className="mt-4 space-y-4"
              >
                {activePlan.weekStructure[key].length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {t("patientPlan.noMealsForDay").replace("{day}", label.toLowerCase())}
                  </p>
                ) : (
                  activePlan.weekStructure[key].map((slot, index) => (
                    <Card
                      key={index}
                      className="cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() =>
                        slot.mealItem && setSelectedMeal({ slot, day: label })
                      }
                    >
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="secondary">
                                {MEAL_TYPE_LABELS[slot.mealType]}
                              </Badge>
                              {slot.mealItem?.recommendedTime && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {slot.mealItem.recommendedTime}
                                </div>
                              )}
                            </div>
                            <CardTitle className="text-lg">
                              {slot.mealItem?.title || t("patientPlan.freeSlot")}
                            </CardTitle>
                            {slot.mealItem?.portionInfo && (
                              <CardDescription className="text-xs">
                                {t("patientPlan.portion")}: {slot.mealItem.portionInfo}
                              </CardDescription>
                            )}
                          </div>
                          {slot.mealItem?.photoUrl && (
                            <div className="relative w-20 h-20 rounded-md overflow-hidden shrink-0">
                              <Image
                                src={slot.mealItem.photoUrl}
                                alt={slot.mealItem.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      {slot.mealItem && (
                        <CardContent className="pt-0">
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {slot.mealItem.description}
                          </p>
                          {slot.notes && (
                            <p className="text-sm text-primary mt-2 italic">
                              {t("patientPlan.nutritionistNotes")}: {slot.notes}
                            </p>
                          )}
                          <div className="flex gap-2 mt-3">
                            {slot.mealItem.photoUrl && (
                              <Badge variant="outline" className="text-xs">
                                <ImageIcon className="h-3 w-3 mr-1" />
                                {t("patientPlan.photo")}
                              </Badge>
                            )}
                            {slot.mealItem.videoUrl && (
                              <Badge variant="outline" className="text-xs">
                                <Video className="h-3 w-3 mr-1" />
                                {t("patientPlan.video")}
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Meal Detail Dialog */}
      <Dialog
        open={!!selectedMeal}
        onOpenChange={(open) => !open && setSelectedMeal(null)}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] grid-rows-[auto,1fr] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>{selectedMeal?.slot.mealItem?.title}</DialogTitle>
            <DialogDescription>
              {selectedMeal?.day} •{" "}
              {selectedMeal?.slot.mealType &&
                MEAL_TYPE_LABELS[selectedMeal.slot.mealType]}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-full px-6 pb-6">
            <div className="space-y-4">
              {selectedMeal?.slot.mealItem?.photoUrl && (
                <div className="relative w-full h-64 rounded-lg overflow-hidden">
                  <Image
                    src={selectedMeal.slot.mealItem.photoUrl}
                    alt={selectedMeal.slot.mealItem.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              {selectedMeal?.slot.mealItem?.videoUrl && (
                <div className="space-y-2">
                  <h3 className="font-semibold">{t("patientPlan.preparationVideo")}</h3>
                  <div className="aspect-video rounded-lg overflow-hidden bg-secondary">
                    <iframe
                      src={selectedMeal.slot.mealItem.videoUrl.replace(
                        "watch?v=",
                        "embed/"
                      )}
                      className="w-full h-full"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <h3 className="font-semibold">{t("patientPlan.recipe")}</h3>
                <p className="text-sm whitespace-pre-wrap">
                  {selectedMeal?.slot.mealItem?.description}
                </p>
              </div>

              {selectedMeal?.slot.mealItem?.portionInfo && (
                <div className="space-y-2">
                  <h3 className="font-semibold">{t("patientPlan.recommendedPortion")}</h3>
                  <p className="text-sm">
                    {selectedMeal.slot.mealItem.portionInfo}
                  </p>
                </div>
              )}

              {selectedMeal?.slot.mealItem?.recommendedTime && (
                <div className="space-y-2">
                  <h3 className="font-semibold">{t("patientPlan.recommendedTime")}</h3>
                  <p className="text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {selectedMeal.slot.mealItem.recommendedTime}
                  </p>
                </div>
              )}

              {selectedMeal?.slot.notes && (
                <div className="space-y-2">
                  <h3 className="font-semibold">{t("patientPlan.nutritionistNotes")}</h3>
                  <p className="text-sm text-primary italic">
                    {selectedMeal.slot.notes}
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
