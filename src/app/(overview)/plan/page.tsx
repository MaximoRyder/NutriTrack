'use client';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/lib/i18n/i18n-provider';

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
    title: t('plan.data.title'),
    author: t('plan.data.author'),
    days: {
      monday: [
        {
          mealType: t('plan.data.mealTypes.breakfast'),
          name: t('plan.data.days.monday.0.name'),
          details: t('plan.data.days.monday.0.details'),
        },
        {
          mealType: t('plan.data.mealTypes.lunch'),
          name: t('plan.data.days.monday.1.name'),
          details: t('plan.data.days.monday.1.details'),
        },
        {
          mealType: t('plan.data.mealTypes.dinner'),
          name: t('plan.data.days.monday.2.name'),
          details: t('plan.data.days.monday.2.details'),
        },
      ],
      tuesday: [
        {
          mealType: t('plan.data.mealTypes.breakfast'),
          name: t('plan.data.days.tuesday.0.name'),
          details: t('plan.data.days.tuesday.0.details'),
        },
        {
          mealType: t('plan.data.mealTypes.lunch'),
          name: t('plan.data.days.tuesday.1.name'),
          details: t('plan.data.days.tuesday.1.details'),
        },
        {
          mealType: t('plan.data.mealTypes.dinner'),
          name: t('plan.data.days.tuesday.2.name'),
          details: t('plan.data.days.tuesday.2.details'),
        },
      ],
      wednesday: [
        {
          mealType: t('plan.data.mealTypes.breakfast'),
          name: t('plan.data.days.wednesday.0.name'),
          details: t('plan.data.days.wednesday.0.details'),
        },
        {
          mealType: t('plan.data.mealTypes.lunch'),
          name: t('plan.data.days.wednesday.1.name'),
          details: t('plan.data.days.wednesday.1.details'),
        },
        {
          mealType: t('plan.data.mealTypes.dinner'),
          name: t('plan.data.days.wednesday.2.name'),
          details: t('plan.data.days.wednesday.2.details'),
        },
      ],
      thursday: [
        {
          mealType: t('plan.data.mealTypes.breakfast'),
          name: t('plan.data.days.thursday.0.name'),
          details: t('plan.data.days.thursday.0.details'),
        },
        {
          mealType: t('plan.data.mealTypes.lunch'),
          name: t('plan.data.days.thursday.1.name'),
          details: t('plan.data.days.thursday.1.details'),
        },
        {
          mealType: t('plan.data.mealTypes.dinner'),
          name: t('plan.data.days.thursday.2.name'),
          details: t('plan.data.days.thursday.2.details'),
        },
      ],
      friday: [
        {
          mealType: t('plan.data.mealTypes.breakfast'),
          name: t('plan.data.days.friday.0.name'),
          details: t('plan.data.days.friday.0.details'),
        },
        {
          mealType: t('plan.data.mealTypes.lunch'),
          name: t('plan.data.days.friday.1.name'),
          details: t('plan.data.days.friday.1.details'),
        },
        {
          mealType: t('plan.data.mealTypes.dinner'),
          name: t('plan.data.days.friday.2.name'),
          details: t('plan.data.days.friday.2.details'),
        },
      ],
      saturday: [
        {
          mealType: t('plan.data.mealTypes.breakfast'),
          name: t('plan.data.days.saturday.0.name'),
          details: t('plan.data.days.saturday.0.details'),
        },
        {
          mealType: t('plan.data.mealTypes.lunch'),
          name: t('plan.data.days.saturday.1.name'),
          details: t('plan.data.days.saturday.1.details'),
        },
        {
          mealType: t('plan.data.mealTypes.dinner'),
          name: t('plan.data.days.saturday.2.name'),
          details: t('plan.data.days.saturday.2.details'),
        },
      ],
      sunday: [
        {
          mealType: t('plan.data.mealTypes.breakfast'),
          name: t('plan.data.days.sunday.0.name'),
          details: t('plan.data.days.sunday.0.details'),
        },
        {
          mealType: t('plan-data.mealTypes.lunch'),
          name: t('plan.data.days.sunday.1.name'),
          details: t('plan.data.days.sunday.1.details'),
        },
        {
          mealType: t('plan.data.mealTypes.dinner'),
          name: t('plan.data.days.sunday.2.name'),
          details: t('plan.data.days.sunday.2.details'),
        },
      ],
    },
  };

  const dayKeys: (keyof typeof mealPlan.days)[] = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ];
  const today = new Date()
    .toLocaleDateString('en-US', { weekday: 'long' })
    .toLowerCase() as keyof typeof mealPlan.days;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {t('plan.title', { planTitle: '' })}{' '}
          <span className="text-primary">{mealPlan.title}</span>
        </CardTitle>
        <CardDescription>
          {t('plan.description', { author: mealPlan.author })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={today} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 md:grid-cols-7">
            {dayKeys.map((day) => (
              <TabsTrigger key={day} value={day} className="capitalize">
                {t(`plan.data.dayNames.${day}`)}
              </TabsTrigger>
            ))}
          </TabsList>
          {dayKeys.map((day) => (
            <TabsContent key={day} value={day} className="mt-4 space-y-4">
              {mealPlan.days[day].map((meal) => (
                <div key={meal.name} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-lg">{meal.name}</h3>
                    <Badge>{meal.mealType}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
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

    