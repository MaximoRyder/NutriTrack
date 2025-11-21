"use client";

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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useActivityLogs, useUser } from "@/lib/data-hooks";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import { format } from "date-fns";
import { enUS, es, pt } from "date-fns/locale";
import { Edit, Flame, MoreVertical, PlusCircle, Trash2 } from "lucide-react";
import { useState } from "react";

export default function ActivitiesPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const { t, locale } = useTranslation();
  const { user } = useUser();
  const userId = (user as any)?.id;

  // Get the appropriate date-fns locale
  const dateLocale = locale === 'es' ? es : locale === 'pt' ? pt : enUS;

  // Helper function to translate activity type
  const getActivityTypeTranslation = (activityType: string) => {
    const activityMap: { [key: string]: string } = {
      'Running': t('quickLog.activities.running'),
      'Walking': t('quickLog.activities.walking'),
      'Cycling': t('quickLog.activities.cycling'),
      'Swimming': t('quickLog.activities.swimming'),
      'Gym': t('quickLog.activities.gym'),
      'Yoga': t('quickLog.activities.yoga'),
    };
    return activityMap[activityType] || activityType;
  };

  // Helper function to translate intensity
  const getIntensityTranslation = (intensity: string) => {
    const intensityMap: { [key: string]: string } = {
      'low': t('quickLog.intensities.low'),
      'medium': t('quickLog.intensities.medium'),
      'high': t('quickLog.intensities.high'),
    };
    return intensityMap[intensity] || intensity;
  };

  const {
    activityLogs,
    isLoading: isLoadingActivities,
    mutate,
  } = useActivityLogs(userId, date);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [activityToEdit, setActivityToEdit] = useState<any | null>(null);
  const [activityToDelete, setActivityToDelete] = useState<any | null>(null);

  // Form state
  const [activityType, setActivityType] = useState("");
  const [customActivityName, setCustomActivityName] = useState("");
  const [duration, setDuration] = useState("");
  const [intensity, setIntensity] = useState("medium");
  const [time, setTime] = useState(format(new Date(), "HH:mm"));
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenAddDialog = () => {
    setActivityToEdit(null);
    setActivityType("");
    setCustomActivityName("");
    setDuration("");
    setIntensity("medium");
    setTime(format(new Date(), "HH:mm"));
    setIsAddDialogOpen(true);
  };

  const handleOpenEditDialog = (activity: any) => {
    setActivityToEdit(activity);
    // Check if it's a standard activity or custom
    const standardActivities = ["Running", "Walking", "Cycling", "Swimming", "Gym", "Yoga"];
    if (standardActivities.includes(activity.activityType)) {
      setActivityType(activity.activityType);
      setCustomActivityName("");
    } else {
      setActivityType("Other");
      setCustomActivityName(activity.activityType);
    }
    setDuration(activity.durationMinutes.toString());
    setIntensity(activity.intensity || "medium");
    setTime(format(new Date(activity.date), "HH:mm", { locale: dateLocale }));
    setIsAddDialogOpen(true);
  };

  const handleOpenDeleteDialog = (activity: any) => {
    setActivityToDelete(activity);
  };

  const handleDeleteActivity = async () => {
    if (!activityToDelete) return;
    await fetch(`/api/activities?id=${activityToDelete.id}`, { method: "DELETE" });
    setActivityToDelete(null);
    mutate();
  };

  const handleSaveActivity = async () => {
    if (!activityType || !duration) return;
    setIsSaving(true);
    try {
      const [hours, minutes] = time.split(":").map(Number);
      const activityDate = date ? new Date(date) : new Date();
      activityDate.setHours(hours, minutes, 0, 0);

      const payload = {
        userId,
        date: activityDate.toISOString(),
        activityType: activityType === "Other" ? customActivityName : activityType,
        durationMinutes: parseInt(duration),
        intensity,
      };

      if (activityToEdit) {
        await fetch(`/api/activities?id=${activityToEdit.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/activities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      setIsAddDialogOpen(false);
      mutate();
    } catch (error) {
      console.error("Failed to save activity log", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {activityToEdit ? t("quickLog.logActivity") : t("quickLog.logActivity")}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="type">{t("quickLog.activityType")}</Label>
              <Select value={activityType} onValueChange={setActivityType}>
                <SelectTrigger>
                  <SelectValue placeholder={t("quickLog.selectActivity")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Running">{t("quickLog.activities.running")}</SelectItem>
                  <SelectItem value="Walking">{t("quickLog.activities.walking")}</SelectItem>
                  <SelectItem value="Cycling">{t("quickLog.activities.cycling")}</SelectItem>
                  <SelectItem value="Swimming">{t("quickLog.activities.swimming")}</SelectItem>
                  <SelectItem value="Gym">{t("quickLog.activities.gym")}</SelectItem>
                  <SelectItem value="Yoga">{t("quickLog.activities.yoga")}</SelectItem>
                  <SelectItem value="Other">{t("quickLog.activities.other")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {activityType === "Other" && (
              <div className="grid gap-2">
                <Label htmlFor="customActivity">{t("quickLog.customActivity")}</Label>
                <Input
                  id="customActivity"
                  placeholder={t("quickLog.customActivityPlaceholder")}
                  value={customActivityName}
                  onChange={(e) => setCustomActivityName(e.target.value.slice(0, 30))}
                  maxLength={30}
                />
                <div className="text-xs text-muted-foreground text-left">
                  {customActivityName.length} / 30
                </div>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="duration">{t("quickLog.duration")}</Label>
              <Input
                id="duration"
                type="number"
                placeholder="30"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="time">{t("quickLog.time")}</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="intensity">{t("quickLog.intensity")}</Label>
              <Select value={intensity} onValueChange={setIntensity}>
                <SelectTrigger>
                  <SelectValue placeholder={t("quickLog.selectIntensity")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{t("quickLog.intensities.low")}</SelectItem>
                  <SelectItem value="medium">{t("quickLog.intensities.medium")}</SelectItem>
                  <SelectItem value="high">{t("quickLog.intensities.high")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              {t("general.cancel")}
            </Button>
            <Button
              onClick={handleSaveActivity}
              disabled={
                isSaving ||
                !activityType ||
                !duration ||
                (activityType === "Other" && !customActivityName)
              }
            >
              {isSaving ? "Saving..." : t("general.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!activityToDelete}
        onOpenChange={(isOpen) => !isOpen && setActivityToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("activities.delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("activities.delete.description", {
                activityName: activityToDelete ? getActivityTypeTranslation(activityToDelete.activityType) : "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("activities.delete.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteActivity}>
              {t("activities.delete.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
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
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle>
                  {t("activities.title", {
                    date: date ? format(date, "PPP", { locale: dateLocale }) : t("general.na"),
                  })}
                </CardTitle>
                <CardDescription>
                  {activityLogs
                    ? t(
                        activityLogs.length === 1
                          ? "activities.description"
                          : "activities.description_plural",
                        { count: activityLogs.length }
                      )
                    : t("quickLog.noActivity")}
                </CardDescription>
              </div>
              <Button
                size="sm"
                className="w-full sm:w-auto sm:ml-auto gap-1"
                onClick={handleOpenAddDialog}
              >
                {t("quickLog.logActivity")}
                <PlusCircle className="h-4 w-4" />
              </Button>
            </CardHeader>
          </Card>

          {isLoadingActivities && (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          )}

          {!isLoadingActivities && activityLogs && activityLogs.length > 0
            ? activityLogs.map((activity: any) => (
                <Card key={activity.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-3 rounded-full">
                          <Flame className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{getActivityTypeTranslation(activity.activityType)}</CardTitle>
                          <CardDescription className="capitalize">
                            {getIntensityTranslation(activity.intensity)} • {format(new Date(activity.date), "p", { locale: dateLocale })} •{" "}
                            {activity.durationMinutes}m
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-2xl font-bold">{activity.durationMinutes}m</div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenEditDialog(activity)}>
                              <Edit className="mr-2 h-4 w-4" />
                              <span>{t("journal.edit")}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleOpenDeleteDialog(activity)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>{t("journal.deleteAction")}</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            : !isLoadingActivities && (
                <div className="text-center text-muted-foreground py-10">
                  <p>{t("quickLog.noActivity")}</p>
                  <p className="text-sm mt-2">{t("journal.placeholder")}</p>
                </div>
              )}
        </div>
      </div>
    </>
  );
}
