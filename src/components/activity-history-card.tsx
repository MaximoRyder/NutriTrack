"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useActivityLogs } from "@/lib/data-hooks";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import { format } from "date-fns";
import { Edit2, Flame, Trash2, UploadCloud } from "lucide-react";
import { useState } from "react";

interface ActivityHistoryCardProps {
  patientId: string;
}

export function ActivityHistoryCard({ patientId }: ActivityHistoryCardProps) {
  const { t } = useTranslation();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const { activityLogs, mutate } = useActivityLogs(patientId, date);
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<any>(null);
  const [activityType, setActivityType] = useState("");
  const [customActivityName, setCustomActivityName] = useState("");
  const [duration, setDuration] = useState("");
  const [intensity, setIntensity] = useState("medium");
  const [time, setTime] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleEdit = (log: any) => {
    setEditingLog(log);
    setActivityType(log.activityType); // Note: Logic to detect "Other" might be needed if we strictly validate against list
    // Simple check if it's a standard activity
    const standardActivities = ["Running", "Walking", "Cycling", "Swimming", "Gym", "Yoga"];
    if (standardActivities.includes(log.activityType)) {
      setActivityType(log.activityType);
      setCustomActivityName("");
    } else {
      setActivityType("Other");
      setCustomActivityName(log.activityType);
    }
    setDuration(log.durationMinutes.toString());
    setIntensity(log.intensity);
    setTime(format(new Date(log.date), "HH:mm"));
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("general.confirmDelete") || "Are you sure?")) return;
    try {
      await fetch(`/api/activities?id=${id}`, { method: "DELETE" });
      mutate();
    } catch (error) {
      console.error("Failed to delete activity", error);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingLog || !activityType || !duration) return;
    setIsSaving(true);
    try {
      const [hours, minutes] = time.split(":").map(Number);
      const activityDate = new Date(date || new Date());
      activityDate.setHours(hours, minutes, 0, 0);

      await fetch(`/api/activities?id=${editingLog.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: activityDate.toISOString(),
          activityType: activityType === "Other" ? customActivityName : activityType,
          durationMinutes: parseInt(duration),
          intensity,
        }),
      });
      mutate();
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Failed to update activity", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-base sm:text-lg">{t("quickLog.activityHistory") || "Activity History"}</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          {t("quickLog.activityHistoryDesc") || "View and manage your daily activities"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="w-full lg:w-auto lg:shrink-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border w-full max-w-full"
            />
          </div>
          <div className="flex-1 space-y-3 min-w-0">
            {activityLogs && activityLogs.length > 0 ? (
              activityLogs.map((log: any) => (
                <div key={log.id} className="flex items-center justify-between p-3 border rounded-md bg-secondary/20">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Flame className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{log.activityType}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {log.intensity} • {format(new Date(log.date), "p")} • {log.durationMinutes}m
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(log)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(log.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-10 border-2 border-dashed rounded-lg">
                <UploadCloud className="h-12 w-12 mb-4" />
                <p>{t("quickLog.noActivity") || "No activity logged"}</p>
                <p className="text-sm mt-1">{t("patientDetail.selectDate") || "Select a date to view history"}</p>
              </div>
            )}
          </div>
        </div>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("quickLog.editActivity") || "Edit Activity"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-type">{t("quickLog.activityType") || "Activity Type"}</Label>
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
                  <Label htmlFor="edit-customActivity">{t("quickLog.customActivity") || "Activity Name"}</Label>
                  <Input
                    id="edit-customActivity"
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
                <Label htmlFor="edit-duration">{t("quickLog.duration") || "Duration (minutes)"}</Label>
                <Input 
                  id="edit-duration" 
                  type="number" 
                  value={duration} 
                  onChange={(e) => setDuration(e.target.value)} 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-time">{t("quickLog.time") || "Time"}</Label>
                <Input 
                  id="edit-time" 
                  type="time" 
                  value={time} 
                  onChange={(e) => setTime(e.target.value)} 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-intensity">{t("quickLog.intensity") || "Intensity"}</Label>
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
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>{t("general.cancel") || "Cancel"}</Button>
              <Button onClick={handleSaveEdit} disabled={isSaving || !activityType || !duration || (activityType === "Other" && !customActivityName)}>
                {isSaving ? "Saving..." : (t("general.save") || "Save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
