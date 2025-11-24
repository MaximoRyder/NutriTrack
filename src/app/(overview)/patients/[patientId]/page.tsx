"use client";

import {
    generateMealPlanSuggestions,
    GenerateMealPlanSuggestionsOutput,
} from "@/ai/flows/generate-meal-plan-suggestions";
import { AssignMealPlanDialog } from "@/components/assign-meal-plan-dialog";
import { PatientRecords } from "@/components/patient-records";
import { QuickLogCard } from "@/components/quick-log-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
    addComment,
    useComments,
    usePatientMealsByDate,
    useUserProfile,
    useWaterLogs,
    useWeightLogs,
} from "@/lib/data-hooks";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import { Comment, Meal, WeightLog } from "@/lib/types";
import { format, formatDistanceToNow } from "date-fns";
import {
    Bot,
    CalendarPlus,
    Droplets,
    FileText,
    MessageSquare,
    Scale,
    Target,
    UploadCloud,
} from "lucide-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

const weightChartConfig = {
  weight: { label: "Weight (kg)", color: "hsl(var(--primary))" },
};

function CommentSection({ mealId }: { mealId: string }) {
  const { t } = useTranslation();
  const [newComment, setNewComment] = useState("");
  const { comments, isLoading, mutate } = useComments(mealId);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      await addComment({ mealId, text: newComment });
      setNewComment("");
      mutate();
    } catch (e) {
      console.error("Error adding comment", e);
    }
  };

  return (
    <div className="mt-4 space-y-3">
      {isLoading && <Skeleton className="h-10 w-full" />}
      {comments &&
        comments.map((comment: Comment) => (
          <div
            key={comment.id}
            className="flex items-start gap-2 sm:gap-3 rounded-lg bg-secondary p-2 sm:p-3"
          >
            <Avatar className="h-7 w-7 sm:h-8 sm:w-8 border">
              <AvatarFallback>
                {comment.authorName ? comment.authorName.charAt(0) : "U"}
              </AvatarFallback>
            </Avatar>
            <div className="w-full">
              <p className="text-xs sm:text-sm">
                <span className="font-semibold">{comment.authorName}</span>{" "}
                <span className="text-xs text-muted-foreground ml-1 sm:ml-2">
                  {formatDistanceToNow(new Date(comment.timestamp), {
                    addSuffix: true,
                  })}
                </span>
              </p>
              <p className="text-xs sm:text-sm text-foreground/80">
                {comment.text}
              </p>
            </div>
          </div>
        ))}
      <div className="flex flex-col sm:flex-row gap-2 pt-2">
        <Textarea
          placeholder={t("patientDetail.leaveComment")}
          className="h-16 text-sm flex-1"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <Button onClick={handleAddComment} size="sm" className="sm:self-start">
          {t("patientDetail.send")}
        </Button>
      </div>
    </div>
  );
}

export default function PatientDetailPage() {
  const params = useParams();
  const patientId = params.patientId as string;
  const { t } = useTranslation();
  const [date, setDate] = useState<Date | undefined>(new Date());

  const [aiSuggestions, setAiSuggestions] =
    useState<GenerateMealPlanSuggestionsOutput | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isAssignPlanDialogOpen, setIsAssignPlanDialogOpen] = useState(false);

  // Profile
  const { profile: patient, isLoading: isLoadingPatient } =
    useUserProfile(patientId);

  // Meals for date
  const { meals, isLoading: isLoadingMeals } = usePatientMealsByDate(
    patientId,
    date
  );

  // Weight logs
  const { weightLogs, isLoading: isLoadingWeightLogs } =
    useWeightLogs(patientId);

  // Water logs (for stats card)
  const { waterLogs } = useWaterLogs(patientId, new Date()); // Always show today's water in stats? Or selected date? Let's use today for "Current Status"
  const totalWaterToday = waterLogs?.reduce((acc: any, log: any) => acc + log.quantityMl, 0) || 0;
  const hydrationProgress = Math.min((totalWaterToday / 2000) * 100, 100);

  const weightChartData = useMemo(() => {
    if (!weightLogs) return [];
    return (weightLogs as WeightLog[]).map((log) => ({
      date: log.date,
      weight: log.weightKg,
    }));
  }, [weightLogs]);

  const handleGenerateSuggestions = async () => {
    if (!patient) return;
    setIsGenerating(true);
    setAiSuggestions(null);
    try {
      const patientFoodLog =
        meals?.map((m: Meal) => m.name).join(", ") ||
        t("patientDetail.noRecentMeals");
      const patientGoals = `Goal weight: ${
        patient.goalWeightKg
      }kg, current weight: ${patient.currentWeightKg}kg. Dietary preferences: ${
        patient.dietaryPreferences || "none"
      }. Health conditions: ${patient.healthConditions || "none"}.`;

      const result = await generateMealPlanSuggestions({
        patientId: patient.id,
        patientFoodLog,
        patientGoals,
      });
      setAiSuggestions(result);
    } catch (error) {
      console.error("Error generating suggestions:", error);
      // You could show a toast message here
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportPdf = async () => {
    if (!patient) return;
    setIsExportingPdf(true);
    try {
      const response = await fetch(`/api/patients/${patientId}/export-pdf`);
      if (!response.ok) throw new Error("Failed to generate PDF");

      const html = await response.text();
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(html);
        newWindow.document.close();
        // Wait a bit for content to load, then trigger print dialog
        setTimeout(() => {
          newWindow.print();
        }, 250);
      }
    } catch (error) {
      console.error("Error exporting PDF:", error);
    } finally {
      setIsExportingPdf(false);
    }
  };

  if (isLoadingPatient) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full" />
        <div className="grid gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!patient) {
    return (
      <Card>
        <CardContent>
          <p>{t("patientDetail.notFound")}</p>
        </CardContent>
      </Card>
    );
  }

  const bmi =
    patient.currentWeightKg && patient.heightCm
      ? (patient.currentWeightKg / (patient.heightCm / 100) ** 2).toFixed(1)
      : t("general.na");

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <Avatar className="h-12 w-12 sm:h-14 sm:w-14 shrink-0">
                {/* photoUrl may not be present after migration */}
                <AvatarImage
                  src={(patient as any).photoUrl || ""}
                  alt={patient.displayName}
                />
                <AvatarFallback>
                  {patient.displayName ? patient.displayName.charAt(0) : "P"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base sm:text-xl truncate">
                  {patient.displayName}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm truncate">
                  {patient.email}
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:flex-1"
                onClick={() => setIsAssignPlanDialogOpen(true)}
              >
                <CalendarPlus className="mr-2 h-4 w-4" />
                Asignar Plan
              </Button>
              <Button variant="outline" size="sm" className="w-full sm:flex-1">
                <MessageSquare className="mr-2 h-4 w-4" />
                {t("patientDetail.chat")}
              </Button>
              <Button
                size="sm"
                className="w-full sm:flex-1"
                onClick={handleExportPdf}
                disabled={isExportingPdf}
              >
                <FileText className="mr-2 h-4 w-4" />
                {isExportingPdf
                  ? t("patientDetail.exporting")
                  : t("patientDetail.exportPdf")}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* SECCIÓN 1: STATS CARDS */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              {t("patientDetail.weight")}
            </CardTitle>
            <Scale className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-lg sm:text-xl font-bold">
              {patient.currentWeightKg || t("general.na")} kg
            </div>
            <p className="text-xs text-muted-foreground">
              {t("patientDetail.bmi", { value: bmi })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              {t("patientDetail.goal")}
            </CardTitle>
            <Target className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-lg sm:text-xl font-bold">
              {patient.goalWeightKg || t("general.na")} kg
            </div>
            {patient.currentWeightKg && patient.goalWeightKg && (
              <p className="text-xs text-muted-foreground">
                {t("patientDetail.toGo", {
                  value: Math.abs(
                    patient.currentWeightKg - patient.goalWeightKg
                  ).toFixed(1),
                })}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              {t("patientDetail.hydration")}
            </CardTitle>
            <Droplets className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-lg sm:text-xl font-bold">{totalWaterToday} ml</div>
            <Progress value={hydrationProgress} className="mt-2 h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              {t("patientDetail.activityLevel")}
            </CardTitle>
            <Scale className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-base sm:text-lg font-bold capitalize truncate">
              {patient.activityLevel
                ? t(`settings.activityLevels.${patient.activityLevel}`)
                : t("general.na")}
            </div>
            <p className="text-xs text-muted-foreground hidden sm:block">
              {t("patientDetail.activityLevelDesc")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* SECCIÓN 1.5: PATIENT RECORDS */}
      <PatientRecords patientId={patientId} />

      {/* SECCIÓN 2: CHART, QUICK LOG, AI */}
      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">
              {t("patientDetail.weightProgress")}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {t("patientDetail.weightProgressDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-2 sm:p-4 lg:p-6 pt-0">
            <ChartContainer
              config={weightChartConfig}
              className="h-[200px] sm:h-[250px] w-full"
            >
              <LineChart data={weightChartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: 10 }}
                  tickFormatter={(val) => format(new Date(val), "MMM d")}
                />
                <YAxis domain={["dataMin - 2", "dataMax + 2"]} hide />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
                <Line
                  dataKey="weight"
                  type="monotone"
                  stroke="var(--color-weight)"
                  strokeWidth={2}
                  dot={true}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
        
        <div className="lg:col-span-1">
          <QuickLogCard patientId={patientId} />
        </div>

        <Card className="lg:col-span-1">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Bot className="h-4 w-4 sm:h-5 sm:w-5" />{" "}
              {t("patientDetail.aiSuggestions")}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {t("patientDetail.aiSuggestionsDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
            <Button onClick={handleGenerateSuggestions} disabled={isGenerating} className="w-full">
              {isGenerating
                ? t("patientDetail.generating")
                : t("patientDetail.generate")}
            </Button>
            {isGenerating && <Skeleton className="h-24 w-full" />}
            {aiSuggestions && (
              <div className="prose prose-sm text-sm text-muted-foreground rounded-lg border bg-secondary p-4">
                <p className="font-semibold text-foreground">
                  {t("patientDetail.aiIdeas")}
                </p>
                <ul className="list-disc pl-5">
                  {aiSuggestions.mealPlanSuggestions
                    .split("\n")
                    .map(
                      (item, index) =>
                        item.replace("- ", "").trim() && (
                          <li key={index}>{item.replace("- ", "")}</li>
                        )
                    )}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* SECCIÓN 3: MEAL LOG */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">
            {t("patientDetail.recentMealLog")}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {t("patientDetail.recentMealLogDesc", {
              date: date ? format(date, "PPP") : "",
            })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="w-full lg:w-[30%] lg:shrink-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border w-full max-w-full"
              />
            </div>
            <div className="flex-1 space-y-3 min-w-0">
              {isLoadingMeals && (
                <div className="space-y-4">
                  <Skeleton className="h-40 w-full" />
                  <Skeleton className="h-40 w-full" />
                </div>
              )}
              {!isLoadingMeals && meals && meals.length > 0
                ? (meals as Meal[]).map((meal) => (
                    <div
                      key={meal.id}
                      className="border rounded-lg overflow-hidden"
                    >
                      <div className="flex flex-col sm:flex-row">
                        <div className="relative h-40 sm:h-32 sm:w-32 md:w-40 md:h-40 shrink-0">
                          <Image
                            src={meal.photoUrl}
                            alt={meal.name}
                            fill
                            className="object-cover"
                            data-ai-hint="healthy food"
                          />
                        </div>
                        <div className="flex-1 p-3 sm:p-4 space-y-2 min-w-0">
                          <div>
                            <p className="font-semibold text-sm sm:text-base">
                              {meal.name}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {t(`addMeal.${meal.mealType}` as any)} -{" "}
                              {format(new Date(meal.timestamp), "p")}
                            </p>
                          </div>
                          {meal.description && (
                            <p className="text-xs sm:text-sm text-muted-foreground/80">
                              {meal.description}
                            </p>
                          )}
                          <CommentSection mealId={meal.id} />
                        </div>
                      </div>
                    </div>
                  ))
                : !isLoadingMeals && (
                    <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-10 border-2 border-dashed rounded-lg">
                      <UploadCloud className="h-12 w-12 mb-4" />
                      <p>{t("journal.noMeals")}</p>
                      <p className="text-sm mt-1">
                        {t("patientDetail.selectDate")}
                      </p>
                    </div>
                  )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assign Meal Plan Dialog */}
      {patient && (
        <AssignMealPlanDialog
          isOpen={isAssignPlanDialogOpen}
          onOpenChange={setIsAssignPlanDialogOpen}
          patient={patient}
          onSuccess={() => {
            console.log("Meal plan assigned successfully");
          }}
        />
      )}
    </div>
  );
}
