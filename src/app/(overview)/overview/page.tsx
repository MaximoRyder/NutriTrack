"use client";

import { AddMealDialog } from "@/components/add-meal-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePatients, useUser, useUserProfile } from "@/lib/data-hooks";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import type { Meal } from "@/lib/types";
import { format } from "date-fns";
import {
  ArrowUpRight,
  BookOpen,
  Droplets,
  PlusCircle,
  Scale,
  Stethoscope,
  Users,
  Utensils,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import useSWR from "swr";

const weightChartData = [
  { date: "2024-06-01", weight: 85 },
  { date: "2024-06-08", weight: 84.5 },
  { date: "2024-06-15", weight: 84 },
  { date: "2024-06-22", weight: 83 },
  { date: "2024-06-29", weight: 82.5 },
];

const weightChartConfig = {
  weight: {
    label: "Weight (kg)",
    color: "hsl(var(--primary))",
  },
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const [isAddMealDialogOpen, setAddMealDialogOpen] = useState(false);
  const { t } = useTranslation();

  const { profile: userProfile, isLoading: isProfileLoading } = useUserProfile(
    (user as any)?.id
  );

  // Patient queries
  const { data: recentMeals, isLoading: isLoadingMeals } = useSWR<Meal[]>(
    userProfile?.role === "patient" && user
      ? `/api/meals?userId=${(user as any).id}&limit=5`
      : null,
    fetcher
  );

  // Nutritionist queries
  const { patients, isLoading: isLoadingPatients } = usePatients();

  // Admin queries
  const { data: allUsers, isLoading: isLoadingAllUsers } = useSWR<any[]>(
    userProfile?.role === "admin" ? "/api/users" : null,
    fetcher
  );

  const { data: allMeals, isLoading: isLoadingAllMeals } = useSWR<Meal[]>(
    userProfile?.role === "admin" ? "/api/meals" : null,
    fetcher
  );

  // Admin stats
  const adminStats = useMemo(() => {
    if (!allUsers)
      return { total: 0, patients: 0, nutritionists: 0, admins: 0, pending: 0 };
    return {
      total: allUsers.length,
      patients: allUsers.filter((u) => u.role === "patient").length,
      nutritionists: allUsers.filter((u) => u.role === "nutritionist").length,
      admins: allUsers.filter((u) => u.role === "admin").length,
      pending: allUsers.filter(
        (u) => u.role === "nutritionist" && u.subscriptionStatus === "pending"
      ).length,
    };
  }, [allUsers]);

  const handleAddMeal = async (
    mealData: Omit<Meal, "id" | "timestamp" | "userId">
  ) => {
    if (!user) return;
    const response = await fetch("/api/meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...mealData,
        userId: (user as any).id,
        timestamp: new Date().toISOString(),
      }),
    });
    if (response.ok) {
      setAddMealDialogOpen(false);
    }
  };

  if (isUserLoading || isProfileLoading) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <p>{t("general.loading")}</p>
      </div>
    );
  }

  // Admin Dashboard
  if (userProfile?.role === "admin") {
    const isLoading = isLoadingAllUsers || isLoadingAllMeals;
    return (
      <div className="grid gap-4 md:gap-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {t("admin.title")}
          </h2>
          <p className="text-muted-foreground">{t("admin.description")}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("admin.totalUsers")}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-1/4" />
              ) : (
                <div className="text-2xl font-bold">{adminStats.total}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("admin.totalNutritionists")}
              </CardTitle>
              <Stethoscope className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-1/4" />
              ) : (
                <div className="text-2xl font-bold">
                  {adminStats.nutritionists}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {t("admin.pendingApproval", { count: adminStats.pending })}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("admin.totalPatients")}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-1/4" />
              ) : (
                <div className="text-2xl font-bold">{adminStats.patients}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("admin.mealsLogged")}
              </CardTitle>
              <Utensils className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-1/4" />
              ) : (
                <div className="text-2xl font-bold">
                  {allMeals?.length ?? 0}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Nutritionist Dashboard
  if (userProfile?.role === "nutritionist") {
    return (
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>{t("patients.title")}</CardTitle>
              <CardDescription>
                {t("dashboard.nutritionistPatientDesc")}
              </CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="/patients">
                {t("dashboard.viewAll")}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("patients.patient")}</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    {t("patients.status")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("general.na")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingPatients ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-8 w-48" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-24" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-8 w-8 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : patients && patients.length > 0 ? (
                  patients.slice(0, 5).map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell>
                        <Link
                          href={`/patients/${patient.id}`}
                          className="flex items-center gap-3 hover:underline"
                        >
                          <Avatar className="h-9 w-9">
                            <AvatarImage
                              src={patient.photoUrl}
                              alt={patient.displayName}
                            />
                            <AvatarFallback>
                              {patient.displayName
                                ? patient.displayName.charAt(0)
                                : "P"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="font-medium">
                            {patient.displayName}
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {t("general.na")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/patients/${patient.id}`}>
                          <Button variant="outline" size="sm">
                            {t("patients.viewDetails")}
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">
                      {t("dashboard.noPatients")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.quickStats")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-8">
            <div className="flex items-center gap-4">
              <Users className="h-8 w-8 text-muted-foreground" />
              <div className="grid gap-1">
                <p className="text-sm font-medium leading-none">
                  {t("dashboard.totalPatients")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isLoadingPatients ? (
                    <Skeleton className="h-5 w-5" />
                  ) : (
                    patients?.length || 0
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Patient Dashboard
  return (
    <>
      <AddMealDialog
        isOpen={isAddMealDialogOpen}
        onOpenChange={setAddMealDialogOpen}
        onAddMeal={handleAddMeal}
      />
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.currentWeight")}
            </CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userProfile?.currentWeightKg || t("general.na")} kg
            </div>
            <p className="text-xs text-muted-foreground">
              {t("dashboard.goal", {
                value: userProfile?.goalWeightKg || t("general.na"),
              })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.dailyHydration")}
            </CardTitle>
            <Droplets className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1500 ml</div>
            <p className="text-xs text-muted-foreground">
              {t("dashboard.hydrationGoal", { value: 2000 })}
            </p>
            <Progress value={75} className="mt-2 h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.activeMealPlan")}
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">
              {t("dashboard.week1Detox")}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("dashboard.assignedBy", { name: "Dr. Salas" })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.quickStats")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t("dashboard.quickStatsDesc")}
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>{t("dashboard.recentMeals")}</CardTitle>
              <CardDescription>
                {t("dashboard.recentMealsDesc")}
              </CardDescription>
            </div>
            <Button
              size="sm"
              className="ml-auto gap-1"
              onClick={() => setAddMealDialogOpen(true)}
            >
              {t("dashboard.addMeal")}
              <PlusCircle className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("dashboard.meal")}</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    {t("dashboard.type")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("dashboard.time")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingMeals && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">
                      {t("dashboard.loadingMeals")}
                    </TableCell>
                  </TableRow>
                )}
                {recentMeals && recentMeals.length > 0
                  ? recentMeals.map((meal) => (
                      <TableRow key={meal.id}>
                        <TableCell>
                          <div className="font-medium">{meal.name}</div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell capitalize">
                          {meal.mealType}
                        </TableCell>
                        <TableCell className="text-right">
                          {format(new Date(meal.timestamp), "p")}
                        </TableCell>
                      </TableRow>
                    ))
                  : !isLoadingMeals && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center">
                          {t("dashboard.noRecentMeals")}
                        </TableCell>
                      </TableRow>
                    )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.weightProgress")}</CardTitle>
            <CardDescription>
              {t("dashboard.weightProgressDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={weightChartConfig}
              className="h-[200px] w-full"
            >
              <BarChart accessibilityLayer data={weightChartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="weight" fill="var(--color-weight)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
