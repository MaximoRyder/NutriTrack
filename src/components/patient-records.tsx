"use client";

import { Button } from "@/components/ui/button";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { addPatientRecord, usePatientRecords, useUser } from "@/lib/data-hooks";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import { format } from "date-fns";
import { enUS, es, pt } from "date-fns/locale";
import { Activity, Plus, Ruler, Scale } from "lucide-react";
import { useState } from "react";

interface PatientRecordsProps {
  patientId: string;
}

export function PatientRecords({ patientId }: PatientRecordsProps) {
  const { t, locale } = useTranslation();
  const { user } = useUser();
  const { toast } = useToast();
  const { records, isLoading, mutate } = usePatientRecords(patientId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get the appropriate date-fns locale
  const dateLocale = locale === 'es' ? es : locale === 'pt' ? pt : enUS;

  // Form state
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [visceralFat, setVisceralFat] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !patientId) return;

    setIsSubmitting(true);
    try {
      await addPatientRecord({
        patientId,
        nutritionistId: (user as any).id,
        date: new Date(),
        weightKg: parseFloat(weight),
        heightCm: parseFloat(height),
        bodyFatPercentage: bodyFat ? parseFloat(bodyFat) : undefined,
        visceralFatPercentage: visceralFat ? parseFloat(visceralFat) : undefined,
        notes,
      });

      toast({
        title: t("settings.success"),
        description: t("records.addSuccess"),
      });

      setIsDialogOpen(false);
      resetForm();
      mutate();
    } catch (error) {
      console.error("Error adding record:", error);
      toast({
        variant: "destructive",
        title: t("settings.error"),
        description: t("records.addError"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setWeight("");
    setHeight("");
    setBodyFat("");
    setVisceralFat("");
    setNotes("");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{t("records.title")}</CardTitle>
          <CardDescription>{t("records.description")}</CardDescription>
        </div>

        {(user as any)?.role === "nutritionist" && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                {t("records.addRecord")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>{t("records.addRecord")}</DialogTitle>
                  <DialogDescription>
                    {t("records.addRecordDesc")}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="weight">{t("records.weight")} (kg)</Label>
                      <Input
                        id="weight"
                        type="number"
                        step="0.1"
                        required
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        placeholder="0.0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="height">{t("records.height")} (cm)</Label>
                      <Input
                        id="height"
                        type="number"
                        step="1"
                        required
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bodyFat">{t("records.bodyFat")} (%)</Label>
                      <Input
                        id="bodyFat"
                        type="number"
                        step="0.1"
                        value={bodyFat}
                        onChange={(e) => setBodyFat(e.target.value)}
                        placeholder="0.0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="visceralFat">
                        {t("records.visceralFat")} (%)
                      </Label>
                      <Input
                        id="visceralFat"
                        type="number"
                        step="0.1"
                        value={visceralFat}
                        onChange={(e) => setVisceralFat(e.target.value)}
                        placeholder="0.0"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">{t("records.notes")}</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={t("records.notesPlaceholder")}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? t("general.saving") : t("general.save")}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4"
              >
                <div className="space-y-2 w-full sm:w-1/3">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-16 w-full mt-2" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full sm:w-auto">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="flex flex-col items-center p-2 gap-2">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : records && records.length > 0 ? (
            records.map((record: any) => (
              <div
                key={record._id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4"
              >
                <div className="space-y-1">
                  <div className="font-medium">
                    {format(new Date(record.date), "PPP", { locale: dateLocale })}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t("records.recordedBy")} {record.nutritionistId?.displayName}
                  </div>
                  {record.notes && (
                    <div className="text-sm mt-2 bg-secondary/50 p-2 rounded">
                      {record.notes}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div className="flex flex-col items-center p-2 bg-secondary/20 rounded">
                    <Scale className="h-4 w-4 mb-1 text-muted-foreground" />
                    <span className="font-semibold">{record.weightKg} kg</span>
                    <span className="text-xs text-muted-foreground">
                      {t("records.weight")}
                    </span>
                  </div>
                  <div className="flex flex-col items-center p-2 bg-secondary/20 rounded">
                    <Ruler className="h-4 w-4 mb-1 text-muted-foreground" />
                    <span className="font-semibold">{record.heightCm} cm</span>
                    <span className="text-xs text-muted-foreground">
                      {t("records.height")}
                    </span>
                  </div>
                  <div className="flex flex-col items-center p-2 bg-secondary/20 rounded">
                    <Activity className="h-4 w-4 mb-1 text-muted-foreground" />
                    <span className="font-semibold">
                      {record.bodyFatPercentage || "-"}%
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t("records.bodyFatShort")}
                    </span>
                  </div>
                  <div className="flex flex-col items-center p-2 bg-secondary/20 rounded">
                    <Activity className="h-4 w-4 mb-1 text-muted-foreground" />
                    <span className="font-semibold">
                      {record.visceralFatPercentage || "-"}%
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t("records.visceralFatShort")}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {t("records.noRecords")}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
