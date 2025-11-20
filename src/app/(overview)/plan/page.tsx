"use client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n/i18n-provider";

type Meal = {
  mealType: string;
  name: string;
  details: string;
};

type MealPlanData = {
  title: string;
  author: string;
  days: Record<string, Meal[]>;
};

export default function PlanPage() {
  const { t } = useTranslation();

  // Dynamically build the meal plan from translations
  const mealPlan: MealPlanData = {
    title: t("plan.data.title"),
    author: t("plan.data.author"),
    days: {
      monday: [
        {
          mealType: t("plan.data.mealTypes.breakfast"),
          name: t("plan.data.days.monday.0.name"),
          details: t("plan.data.days.monday.0.details"),
        },
        {
          mealType: t("plan.data.mealTypes.lunch"),
          name: t("plan.data.days.monday.1.name"),
          details: t("plan.data.days.monday.1.details"),
        },
        {
          mealType: t("plan.data.mealTypes.dinner"),
          name: t("plan.data.days.monday.2.name"),
          details: t("plan.data.days.monday.2.details"),
        },
      ],
      tuesday: [
        {
          mealType: t("plan.data.mealTypes.breakfast"),
          name: t("plan.data.days.tuesday.0.name"),
          details: t("plan.data.days.tuesday.0.details"),
        },
        {
          mealType: t("plan.data.mealTypes.lunch"),
          name: t("plan.data.days.tuesday.1.name"),
          details: t("plan.data.days.tuesday.1.details"),
        },
        {
          mealType: t("plan.data.mealTypes.dinner"),
          name: t("plan.data.days.tuesday.2.name"),
          details: t("plan.data.days.tuesday.2.details"),
        },
      ],
      wednesday: [
        {
          mealType: t("plan.data.mealTypes.breakfast"),
          name: t("plan.data.days.wednesday.0.name"),
          details: t("plan.data.days.wednesday.0.details"),
        },
        {
          mealType: t("plan.data.mealTypes.lunch"),
          name: t("plan.data.days.wednesday.1.name"),
          details: t("plan.data.days.wednesday.1.details"),
        },
        {
          mealType: t("plan.data.mealTypes.dinner"),
          name: t("plan.data.days.wednesday.2.name"),
          details: t("plan.data.days.wednesday.2.details"),
        },
      ],
      thursday: [
        {
          mealType: t("plan.data.mealTypes.breakfast"),
          name: t("plan.data.days.thursday.0.name"),
          details: t("plan.data.days.thursday.0.details"),
        },
        {
          mealType: t("plan.data.mealTypes.lunch"),
          name: t("plan.data.days.thursday.1.name"),
          details: t("plan.data.days.thursday.1.details"),
        },
        {
          mealType: t("plan.data.mealTypes.dinner"),
          name: t("plan.data.days.thursday.2.name"),
          details: t("plan.data.days.thursday.2.details"),
        },
      ],
      friday: [
        {
          mealType: t("plan.data.mealTypes.breakfast"),
          name: t("plan.data.days.friday.0.name"),
          details: t("plan.data.days.friday.0.details"),
        },
        {
          mealType: t("plan.data.mealTypes.lunch"),
          name: t("plan.data.days.friday.1.name"),
          details: t("plan.data.days.friday.1.details"),
        },
        {
          mealType: t("plan.data.mealTypes.dinner"),
          name: t("plan.data.days.friday.2.name"),
          details: t("plan.data.days.friday.2.details"),
        },
      ],
      saturday: [
        {
          mealType: t("plan.data.mealTypes.breakfast"),
          name: t("plan.data.days.saturday.0.name"),
          details: t("plan.data.days.saturday.0.details"),
        },
        {
          mealType: t("plan.data.mealTypes.lunch"),
          name: t("plan.data.days.saturday.1.name"),
          details: t("plan.data.days.saturday.1.details"),
        },
        {
          mealType: t("plan.data.mealTypes.dinner"),
          name: t("plan.data.days.saturday.2.name"),
          details: t("plan.data.days.saturday.2.details"),
        },
      ],
      sunday: [
        {
          mealType: t("plan.data.mealTypes.breakfast"),
          name: t("plan.data.days.sunday.0.name"),
          details: t("plan.data.days.sunday.0.details"),
        },
        {
          mealType: t("plan.data.mealTypes.lunch"),
          name: t("plan.data.days.sunday.1.name"),
          details: t("plan.data.days.sunday.1.details"),
        },
        {
          mealType: t("plan.data.mealTypes.dinner"),
          name: t("plan.data.days.sunday.2.name"),
          details: t("plan.data.days.sunday.2.details"),
        },
      ],
    },
  };

  const dayKeys: (keyof typeof mealPlan.days)[] = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];
  const today = new Date()
    .toLocaleDateString("en-US", { weekday: "long" })
    .toLowerCase() as keyof typeof mealPlan.days;

  return (
    <Card>
      <CardHeader className="p-3 sm:p-4 md:p-6">
        <CardTitle className="text-sm sm:text-base md:text-lg">
          {t("plan.title", { planTitle: "" })}{" "}
          <span className="text-primary break-words">{mealPlan.title}</span>
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          {t("plan.description", { author: mealPlan.author })}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-2 sm:p-4 md:p-6 pt-0">
        <Tabs defaultValue={today} className="w-full">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-4 md:grid-cols-7 h-auto gap-1">
            {dayKeys.map((day) => (
              <TabsTrigger
                key={day}
                value={day}
                className="capitalize text-xs sm:text-sm px-2 py-2 sm:px-3 sm:py-2.5 whitespace-nowrap overflow-hidden text-ellipsis"
              >
                {t(`plan.data.dayNames.${day}`)}
              </TabsTrigger>
            ))}
          </TabsList>
          {dayKeys.map((day) => (
            <TabsContent
              key={day}
              value={day}
              className="mt-3 sm:mt-4 space-y-3 sm:space-y-4"
            >
              {mealPlan.days[day].map((meal) => (
                <div key={meal.name} className="p-3 sm:p-4 border rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
                    <h3 className="font-semibold text-sm sm:text-base md:text-lg break-words pr-2">
                      {meal.name}
                    </h3>
                    <Badge className="self-start sm:self-auto shrink-0 text-xs">
                      {meal.mealType}
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-2 break-words">
                    {meal.details}
                  </p>
                </div>
              ))}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
