"use client";

import {
  generateMealPlanSuggestions,
  GenerateMealPlanSuggestionsOutput,
} from "@/ai/flows/generate-meal-plan-suggestions";
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
  useWeightLogs,
} from "@/lib/data-hooks";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import { Comment, Meal, WeightLog } from "@/lib/types";
import { format, formatDistanceToNow } from "date-fns";
import {
  Bot,
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
            className="flex items-start gap-3 rounded-lg bg-secondary p-3"
          >
            <Avatar className="h-8 w-8 border">
              <AvatarFallback>
                {comment.authorName ? comment.authorName.charAt(0) : "U"}
              </AvatarFallback>
            </Avatar>
            <div className="w-full">
              <p className="text-sm">
                <span className="font-semibold">{comment.authorName}</span>{" "}
                <span className="text-xs text-muted-foreground ml-2">
                  {formatDistanceToNow(new Date(comment.timestamp), {
                    addSuffix: true,
                  })}
                </span>
              </p>
              <p className="text-sm text-foreground/80">{comment.text}</p>
            </div>
          </div>
        ))}
      <div className="flex gap-2 pt-2">
        <Textarea
          placeholder={t("patientDetail.leaveComment")}
          className="h-16"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <Button onClick={handleAddComment}>{t("patientDetail.send")}</Button>
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
        meals?.map((m) => m.name).join(", ") ||
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

  if (isLoadingPatient) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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

  // This is a placeholder as WaterLog is not fully implemented yet
  const hydrationProgress = 50;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center gap-4 space-y-0">
          <Avatar className="h-16 w-16">
            {/* photoUrl may not be present after migration */}
            <AvatarImage
              src={(patient as any).photoUrl || ""}
              alt={patient.displayName}
            />
            <AvatarFallback>
              {patient.displayName ? patient.displayName.charAt(0) : "P"}
            </AvatarFallback>
          </Avatar>
          <div className="grid gap-1">
            <CardTitle className="text-2xl">{patient.displayName}</CardTitle>
            <CardDescription>{patient.email}</CardDescription>
          </div>
          <div className="flex sm:ml-auto gap-2 w-full sm:w-auto">
            <Button variant="outline" className="flex-1 sm:flex-initial">
              <MessageSquare className="mr-2 h-4 w-4" />{" "}
              {t("patientDetail.chat")}
            </Button>
            <Button className="flex-1 sm:flex-initial">
              <FileText className="mr-2 h-4 w-4" />{" "}
              {t("patientDetail.exportPdf")}
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("patientDetail.weight")}
            </CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {patient.currentWeightKg || t("general.na")} kg
            </div>
            <p className="text-xs text-muted-foreground">
              {t("patientDetail.bmi", { value: bmi })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("patientDetail.goal")}
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
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
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("patientDetail.hydration")}
            </CardTitle>
            <Droplets className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{1500} ml</div>
            <Progress value={hydrationProgress} className="mt-2 h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("patientDetail.activityLevel")}
            </CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {patient.activityLevel
                ? t(`settings.activityLevels.${patient.activityLevel}`)
                : t("general.na")}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("patientDetail.activityLevelDesc")}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("patientDetail.weightProgress")}</CardTitle>
            <CardDescription>
              {t("patientDetail.weightProgressDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={weightChartConfig}
              className="h-[250px] w-full"
            >
              <LineChart data={weightChartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" /> {t("patientDetail.aiSuggestions")}
            </CardTitle>
            <CardDescription>
              {t("patientDetail.aiSuggestionsDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleGenerateSuggestions} disabled={isGenerating}>
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
      <Card>
        <CardHeader>
          <CardTitle>{t("patientDetail.recentMealLog")}</CardTitle>
          <CardDescription>
            {t("patientDetail.recentMealLogDesc", {
              date: date ? format(date, "PPP") : "",
            })}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-6">
          <div className="w-full">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border w-full"
            />
          </div>
          <div className="md:col-span-2 space-y-4">
            {isLoadingMeals && (
              <div className="space-y-4">
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-40 w-full" />
              </div>
            )}
            {!isLoadingMeals && meals && meals.length > 0
              ? (meals as Meal[]).map((meal) => (
                  <div key={meal.id} className="p-4 border rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                      <div className="md:col-span-1 relative h-40 w-full overflow-hidden rounded-md">
                        <Image
                          src={meal.photoUrl}
                          alt={meal.name}
                          fill
                          className="object-cover"
                          data-ai-hint="healthy food"
                        />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-lg">{meal.name}</p>
                            <p className="text-sm text-muted-foreground capitalize">
                              {t(`addMeal.${meal.mealType}` as any)} -{" "}
                              {format(new Date(meal.timestamp), "p")}
                            </p>
                          </div>
                        </div>
                        {meal.description && (
                          <p className="text-sm text-muted-foreground/80">
                            {meal.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <CommentSection mealId={meal.id} />
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
        </CardContent>
      </Card>
    </div>
  );
}
