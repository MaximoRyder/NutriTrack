"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { addActivityLog, addWaterLog, useActivityLogs, useWaterLogs } from "@/lib/data-hooks";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import { format } from "date-fns";
import { Activity, Droplets, Flame, Minus, Plus } from "lucide-react";
import { useState } from "react";

interface QuickLogCardProps {
  patientId: string;
  date: Date;
}

export function QuickLogCard({ patientId, date }: QuickLogCardProps) {
  const { t } = useTranslation();

  // Water Logic
  const { waterLogs, mutate: mutateWater } = useWaterLogs(patientId, date);
  const totalWater = waterLogs?.reduce((acc: number, log: any) => acc + log.quantityMl, 0) || 0;
  const waterGoal = 2000; // Default goal
  const waterProgress = Math.min((totalWater / waterGoal) * 100, 100);
  const [isAddingWater, setIsAddingWater] = useState(false);

  const handleAddWater = async (amount: number) => {
    setIsAddingWater(true);
    try {
      // Create a date object for the selected date
      const logDate = new Date(date);
      // If it's today, keep current time, otherwise set to noon to avoid timezone issues
      if (logDate.toDateString() === new Date().toDateString()) {
        logDate.setHours(new Date().getHours(), new Date().getMinutes());
      } else {
        logDate.setHours(12, 0, 0, 0);
      }

      await addWaterLog({
        userId: patientId,
        date: logDate.toISOString(),
        quantityMl: amount,
      });
      mutateWater();
    } catch (error) {
      console.error("Failed to add water log", error);
    } finally {
      setIsAddingWater(false);
    }
  };

  // Activity Logic
  const { activityLogs, mutate: mutateActivity } = useActivityLogs(patientId, date);
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);
  const [activityType, setActivityType] = useState("");
  const [customActivityName, setCustomActivityName] = useState("");
  const [duration, setDuration] = useState("");
  const [intensity, setIntensity] = useState("medium");
  const [time, setTime] = useState(format(new Date(), "HH:mm"));
  const [isSavingActivity, setIsSavingActivity] = useState(false);

  const handleSaveActivity = async () => {
    if (!activityType || !duration) return;
    setIsSavingActivity(true);
    try {
      const [hours, minutes] = time.split(":").map(Number);
      const activityDate = new Date(date);
      activityDate.setHours(hours, minutes, 0, 0);

      await addActivityLog({
        userId: patientId,
        date: activityDate.toISOString(),
        activityType: activityType === "Other" ? customActivityName : activityType,
        durationMinutes: parseInt(duration),
        intensity,
      });
      mutateActivity();
      setIsActivityDialogOpen(false);
      setActivityType("");
      setCustomActivityName("");
      setDuration("");
      setIntensity("medium");
      setTime(format(new Date(), "HH:mm"));
    } catch (error) {
      console.error("Failed to add activity log", error);
    } finally {
      setIsSavingActivity(false);
    }
  };

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6 pb-2">
        <CardTitle className="text-base sm:text-lg">{t("quickLog.title") || "Quick Log"}</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          {t("quickLog.description") || "Track your daily habits"}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <Tabs defaultValue="water" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="water" className="flex gap-2">
              <Droplets className="h-4 w-4" />
              <span>{t("quickLog.water") || "Water"}</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex gap-2">
              <Activity className="h-4 w-4" />
              <span>{t("quickLog.activity") || "Activity"}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="water" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{totalWater} <span className="text-sm font-normal text-muted-foreground">/ {waterGoal} ml</span></div>
              <div className="text-sm text-muted-foreground">{Math.round(waterProgress)}%</div>
            </div>
            <Progress value={waterProgress} className="h-2" />
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" size="sm" onClick={() => handleAddWater(250)} disabled={isAddingWater}>
                <Plus className="h-3 w-3 mr-1" /> 250ml
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleAddWater(500)} disabled={isAddingWater}>
                <Plus className="h-3 w-3 mr-1" /> 500ml
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleAddWater(750)} disabled={isAddingWater}>
                <Plus className="h-3 w-3 mr-1" /> 750ml
              </Button>
            </div>
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAddWater(-250)}
                disabled={isAddingWater || totalWater <= 0}
                className="text-muted-foreground hover:text-destructive h-8"
              >
                <Minus className="h-3 w-3 mr-1" /> {t("quickLog.remove250") || "Remove 250ml"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <div className="space-y-2">
              {activityLogs && activityLogs.length > 0 ? (
                <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                  {activityLogs.map((log: any) => (
                    <div key={log.id} className="flex items-center justify-between p-2 border rounded-md bg-secondary/20">
                      <div className="flex items-center gap-2">
                        <div className="bg-primary/10 p-1.5 rounded-full">
                          <Flame className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {["Running", "Walking", "Cycling", "Swimming", "Gym", "Yoga"].includes(log.activityType)
                              ? t(`quickLog.activities.${log.activityType.toLowerCase()}` as any)
                              : log.activityType}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {t(`quickLog.intensities.${log.intensity}`)} • {format(new Date(log.date), "p")}
                          </p>
                        </div>
                      </div>
                      <div className="font-bold text-sm">{log.durationMinutes}m</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm border border-dashed rounded-md">
                  {t("quickLog.noActivity") || "No activity logged today"}
                </div>
              )}

              <Dialog open={isActivityDialogOpen} onOpenChange={setIsActivityDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full" size="sm">
                    <Plus className="h-4 w-4 mr-2" /> {t("quickLog.logActivity") || "Log Activity"}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t("quickLog.logActivity") || "Log Activity"}</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="type">{t("quickLog.activityType") || "Activity Type"}</Label>
                      <Select value={activityType} onValueChange={setActivityType}>
                        <SelectTrigger>
                          <SelectValue placeholder={t("quickLog.selectActivity") || "Select activity"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Running">{t("quickLog.activities.running") || "Running"}</SelectItem>
                          <SelectItem value="Walking">{t("quickLog.activities.walking") || "Walking"}</SelectItem>
                          <SelectItem value="Cycling">{t("quickLog.activities.cycling") || "Cycling"}</SelectItem>
                          <SelectItem value="Swimming">{t("quickLog.activities.swimming") || "Swimming"}</SelectItem>
                          <SelectItem value="Gym">{t("quickLog.activities.gym") || "Gym / Weights"}</SelectItem>
                          <SelectItem value="Yoga">{t("quickLog.activities.yoga") || "Yoga"}</SelectItem>
                          <SelectItem value="Other">{t("quickLog.activities.other") || "Other"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {activityType === "Other" && (
                      <div className="grid gap-2">
                        <Label htmlFor="customActivity">{t("quickLog.customActivity") || "Activity Name"}</Label>
                        <Input
                          id="customActivity"
                          placeholder={t("quickLog.customActivityPlaceholder") || "e.g., Boxing"}
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
                      <Label htmlFor="duration">{t("quickLog.duration") || "Duration (minutes)"}</Label>
                      <Input
                        id="duration"
                        type="number"
                        placeholder="30"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="time">{t("quickLog.time") || "Time"}</Label>
                      <Input
                        id="time"
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="intensity">{t("quickLog.intensity") || "Intensity"}</Label>
                      <Select value={intensity} onValueChange={setIntensity}>
                        <SelectTrigger>
                          <SelectValue placeholder={t("quickLog.selectIntensity") || "Select intensity"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">{t("quickLog.intensities.low") || "Low"}</SelectItem>
                          <SelectItem value="medium">{t("quickLog.intensities.medium") || "Medium"}</SelectItem>
                          <SelectItem value="high">{t("quickLog.intensities.high") || "High"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsActivityDialogOpen(false)}>{t("general.cancel") || "Cancel"}</Button>
                    <Button onClick={handleSaveActivity} disabled={isSavingActivity || !activityType || !duration || (activityType === "Other" && !customActivityName)}>
                      {isSavingActivity ? "Saving..." : (t("general.save") || "Save")}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
