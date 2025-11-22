"use client";

import { AddMealDialog } from "@/components/add-meal-dialog";
import { MealDetailDialog } from "@/components/meal-detail-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { addMeal, useMealsByDate, useUser } from "@/lib/data-hooks";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import type { Meal } from "@/lib/types";
import { format } from "date-fns";
import { enUS, es, pt } from "date-fns/locale";
import { Edit, MoreVertical, PlusCircle, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function JournalPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const { t, locale } = useTranslation();
  const { user } = useUser();
  const router = useRouter();
  const [isAddMealDialogOpen, setAddMealDialogOpen] = useState(false);
  const [mealToEdit, setMealToEdit] = useState<Meal | null>(null);
  const [mealToDelete, setMealToDelete] = useState<Meal | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);

  // Get the appropriate date-fns locale
  const dateLocale = locale === 'es' ? es : locale === 'pt' ? pt : enUS;

  const {
    meals: selectedMeals,
    isLoading: isLoadingMeals,
    mutate,
  } = useMealsByDate(date);

  const handleOpenEditDialog = (meal: Meal) => {
    setMealToEdit(meal);
    setAddMealDialogOpen(true);
  };

  const handleOpenDeleteDialog = (meal: Meal) => {
    setMealToDelete(meal);
  };

  const handleDeleteMeal = async () => {
    if (!mealToDelete) return;
    // TODO: implement DELETE /api/meals?id=...
    await fetch(`/api/meals?id=${mealToDelete.id}`, { method: "DELETE" });
    setMealToDelete(null);
    mutate();
  };

  const handleDialogClose = () => {
    setAddMealDialogOpen(false);
    // Give a small delay to prevent the dialog from flashing with old data
    setTimeout(() => setMealToEdit(null), 150);
  };

  const handleMealSubmit = async (
    mealData: Omit<Meal, "id" | "timestamp"> & { mealTime?: string }
  ) => {
    const mealDate = date ? new Date(date) : new Date();
    if (mealData.mealTime) {
      const [hours, minutes] = mealData.mealTime.split(":");
      mealDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    }
    const { mealTime, ...rest } = mealData;
    const payload = { ...rest, timestamp: mealDate.toISOString() };
    if (mealToEdit) {
      await fetch(`/api/meals?id=${mealToEdit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await addMeal(payload);
    }
    handleDialogClose();
    mutate();
  };

  return (
    <>
      <AddMealDialog
        isOpen={isAddMealDialogOpen}
        onOpenChange={handleDialogClose}
        onAddMeal={handleMealSubmit}
        mealToEdit={mealToEdit}
      />
      <AlertDialog
        open={!!mealToDelete}
        onOpenChange={(isOpen) => !isOpen && setMealToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("journal.delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("journal.delete.description", {
                mealName: mealToDelete?.name || "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("journal.delete.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMeal}>
              {t("journal.delete.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-0 sm:p-2">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                locale={dateLocale}
                className="w-full"
              />
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle>
                  {t("journal.title", {
                    date: date ? format(date, "PPP", { locale: dateLocale }) : t("general.na"),
                  })}
                </CardTitle>
                <CardDescription>
                  {selectedMeals && selectedMeals.length > 0
                    ? t(
                        selectedMeals.length === 1
                          ? "journal.description"
                          : "journal.description_plural",
                        { count: selectedMeals.length }
                      )
                    : t("journal.noMeals")}
                </CardDescription>
              </div>
              <Button
                size="sm"
                className="w-full sm:w-auto sm:ml-auto gap-1"
                onClick={() => setAddMealDialogOpen(true)}
              >
                {t("dashboard.addMeal")}
                <PlusCircle className="h-4 w-4" />
              </Button>
            </CardHeader>
          </Card>

          {isLoadingMeals && (
            <div className="space-y-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          )}

          {!isLoadingMeals && selectedMeals && selectedMeals.length > 0
            ? selectedMeals.map((meal) => (
                <Card
                  key={meal.id}
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => setSelectedMeal(meal)}
                >
                  <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-start">
                    <div className="relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-md bg-secondary/30 mx-auto sm:mx-0">
                      <Image
                        src={meal.photoUrl}
                        alt={meal.name}
                        fill
                        className="object-contain"
                        data-ai-hint="healthy food"
                      />
                    </div>
                    <div className="flex-1 space-y-2 w-full">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl">{meal.name}</CardTitle>
                          <CardDescription className="capitalize">
                            {t(`addMeal.${meal.mealType}` as any)} -{" "}
                            {format(new Date(meal.timestamp), "p")}
                          </CardDescription>
                        </div>
                        <div className="flex items-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditDialog(meal);
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                <span>{t("journal.edit")}</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenDeleteDialog(meal);
                                }}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>{t("journal.deleteAction")}</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      {meal.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {meal.description}
                        </p>
                      )}
                    </div>
                  </CardContent>
                  </Card>
                ))
            : !isLoadingMeals && (
                <div className="text-center text-muted-foreground py-10">
                  <p>{t("journal.noMeals")}</p>
                  <p className="text-sm mt-2">{t("journal.placeholder")}</p>
                </div>
              )}
        </div>
      </div>

      {/* Meal Detail Dialog */}
      <MealDetailDialog
        meal={selectedMeal}
        open={!!selectedMeal}
        onOpenChange={(open) => !open && setSelectedMeal(null)}
      />
    </>
  );
}

