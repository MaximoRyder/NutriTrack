"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import type { DayMealSlot, MealItem } from "@/lib/types";
import { Plus, X } from "lucide-react";
import { Badge } from "./ui/badge";

interface WeekPlanBuilderProps {
  mealItems: MealItem[];
  weekStructure: {
    monday: DayMealSlot[];
    tuesday: DayMealSlot[];
    wednesday: DayMealSlot[];
    thursday: DayMealSlot[];
    friday: DayMealSlot[];
    saturday: DayMealSlot[];
    sunday: DayMealSlot[];
  };
  onChange: (weekStructure: any) => void;
}

export function WeekPlanBuilder({
  mealItems,
  weekStructure,
  onChange,
}: WeekPlanBuilderProps) {
  const { t } = useTranslation();

  const DAYS = [
    { key: "monday", label: t("mealTemplates.builder.days.monday") },
    { key: "tuesday", label: t("mealTemplates.builder.days.tuesday") },
    { key: "wednesday", label: t("mealTemplates.builder.days.wednesday") },
    { key: "thursday", label: t("mealTemplates.builder.days.thursday") },
    { key: "friday", label: t("mealTemplates.builder.days.friday") },
    { key: "saturday", label: t("mealTemplates.builder.days.saturday") },
    { key: "sunday", label: t("mealTemplates.builder.days.sunday") },
  ] as const;

  const MEAL_TYPES = [
    { value: "breakfast", label: t("addMeal.breakfast") },
    { value: "lunch", label: t("addMeal.lunch") },
    { value: "dinner", label: t("addMeal.dinner") },
    { value: "snack", label: t("addMeal.snack") },
    { value: "other", label: t("addMeal.other") },
  ] as const;

  const addSlot = (day: string, mealType: string) => {
    const newStructure = { ...weekStructure };
    newStructure[day as keyof typeof weekStructure].push({
      mealItemId: null,
      mealType: mealType as any,
      notes: "",
    });
    onChange(newStructure);
  };

  const removeSlot = (day: string, index: number) => {
    const newStructure = { ...weekStructure };
    newStructure[day as keyof typeof weekStructure].splice(index, 1);
    onChange(newStructure);
  };

  const updateSlot = (
    day: string,
    index: number,
    field: string,
    value: any
  ) => {
    const newStructure = { ...weekStructure };
    newStructure[day as keyof typeof weekStructure][index] = {
      ...newStructure[day as keyof typeof weekStructure][index],
      [field]: value,
    };
    onChange(newStructure);
  };

  const getMealItemById = (id: string | null) => {
    if (!id) return null;
    return mealItems.find((item) => item.id === id);
  };

  return (
    <div className="space-y-6">
      {DAYS.map(({ key, label }) => (
        <Card key={key}>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">{label}</CardTitle>
              <Select
                onValueChange={(mealType) => addSlot(key, mealType)}
                value=""
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t("mealTemplates.builder.addMeal")} />
                </SelectTrigger>
                <SelectContent>
                  {MEAL_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <Plus className="h-4 w-4 inline mr-2" />
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {weekStructure[key as keyof typeof weekStructure].length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t("mealTemplates.builder.noMeals")}
              </p>
            ) : (
              <div className="space-y-3">
                {weekStructure[key as keyof typeof weekStructure].map(
                  (slot, index) => {
                    const mealItem = getMealItemById(slot.mealItemId);
                    return (
                      <div
                        key={index}
                        className="flex gap-3 items-start p-3 border rounded-lg"
                      >
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {
                                MEAL_TYPES.find((t) => t.value === slot.mealType)
                                  ?.label
                              }
                            </Badge>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">
                              {t("mealTemplates.builder.mealLabel")}
                            </Label>
                            <Select
                              value={slot.mealItemId || "empty"}
                              onValueChange={(value) =>
                                updateSlot(
                                  key,
                                  index,
                                  "mealItemId",
                                  value === "empty" ? null : value
                                )
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={t("mealTemplates.builder.freeSlot")} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="empty">
                                  {t("mealTemplates.builder.freeSlot")}
                                </SelectItem>
                                {mealItems
                                  .filter((item) => item.mealType === slot.mealType)
                                  .map((item) => (
                                    <SelectItem key={item.id} value={item.id}>
                                      {item.title}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>
                          {mealItem && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {mealItem.description}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSlot(key, index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
