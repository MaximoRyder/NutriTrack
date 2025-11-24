"use client";
import { PatientRecords } from "@/components/patient-records";
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
import { usePatientRecords, useUser, useWaterLogsRange } from "@/lib/data-hooks";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import { endOfDay, format, isSameDay, startOfDay, subDays } from "date-fns";
import { enUS, es, pt } from "date-fns/locale";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

const chartConfig = {
  weight: { label: "Weight (kg)", color: "hsl(var(--primary))" },
  waist: { label: "Waist (cm)", color: "hsl(var(--chart-2))" },
  hips: { label: "Hips (cm)", color: "hsl(var(--chart-3))" },
  water: { label: "Water (ml)", color: "hsl(var(--chart-1))" },
};

export default function ProgressPage() {
  const { t, locale } = useTranslation();
  const { user } = useUser();
  const { records } = usePatientRecords((user as any)?.id);

  // Get the appropriate date-fns locale
  const dateLocale = locale === 'es' ? es : locale === 'pt' ? pt : enUS;

  const today = useMemo(() => new Date(), []);
  const lastWeekStart = useMemo(() => startOfDay(subDays(today, 6)), [today]);
  const lastWeekEnd = useMemo(() => endOfDay(today), [today]);

  const { waterLogs } = useWaterLogsRange(
    (user as any)?.id,
    lastWeekStart,
    lastWeekEnd
  );

  const weightData = useMemo(() => {
    if (!records) return [];
    return records
      .map((record: any) => ({
        date: record.date,
        weight: record.weightKg,
      }))
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [records]);

  const measurementsData = useMemo(() => {
    if (!records) return [];
    return records
      .map((record: any) => ({
        date: record.date,
        waist: record.waistCm || 0, // Assuming waistCm exists or fallback
        hips: record.hipsCm || 0,   // Assuming hipsCm exists or fallback
        bodyFat: record.bodyFatPercentage,
        visceralFat: record.visceralFatPercentage,
      }))
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [records]);

  const waterData = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = subDays(today, 6 - i);
      const dayLogs = waterLogs?.filter((log: any) =>
        isSameDay(new Date(log.date), date)
      ) || [];

      const totalDrank = dayLogs.reduce((acc: number, log: any) => acc + log.quantityMl, 0);

      days.push({
        date: format(date, "EEE", { locale: dateLocale }), // Mon, Tue, etc.
        fullDate: date,
        goal: 2000, // Hardcoded goal for now, could be from user profile
        drank: totalDrank
      });
    }
    return days;
  }, [waterLogs, today, dateLocale]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("progress.title")}</CardTitle>
          <CardDescription>{t("progress.description")}</CardDescription>
        </CardHeader>
      </Card>

      {user && <PatientRecords patientId={(user as any).id} />}

      <Card className="overflow-hidden">
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <CardTitle className="text-sm sm:text-base md:text-lg">
            {t("progress.weightTracking")}
          </CardTitle>
          <CardDescription className="text-xs">
            {t("progress.weightTrackingDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-1 sm:p-2 md:p-4 lg:p-6 pt-0">
          <ChartContainer
            config={chartConfig}
            className="h-[180px] sm:h-[220px] md:h-[250px] lg:h-[300px] w-full"
          >
            <LineChart data={weightData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={4}
                tick={{ fontSize: 9 }}
                tickFormatter={(val) => format(new Date(val), "MMM d", { locale: dateLocale })}
              />
              <YAxis domain={["dataMin - 2", "dataMax + 2"]} hide />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return format(new Date(value), "P", { locale: dateLocale });
                    }}
                  />
                }
              />
              <Line
                dataKey="weight"
                type="monotone"
                stroke="var(--color-weight)"
                strokeWidth={2}
                dot={{ r: 3, fill: "var(--color-weight)" }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6 overflow-hidden">
        <Card className="overflow-hidden">
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="text-sm sm:text-base md:text-lg">
              {t("progress.bodyMeasurements")}
            </CardTitle>
            <CardDescription className="text-xs">
              {t("progress.bodyMeasurementsDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-1 sm:p-2 md:p-4 lg:p-6 pt-0">
            <ChartContainer
              config={chartConfig}
              className="h-[180px] sm:h-[220px] md:h-[250px] lg:h-[300px] w-full"
            >
              <BarChart data={measurementsData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={4}
                  tick={{ fontSize: 9 }}
                  tickFormatter={(val) => format(new Date(val), "MMM yyyy", { locale: dateLocale })}
                />
                <YAxis hide />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => {
                        return format(new Date(value), "P", { locale: dateLocale });
                      }}
                      valueFormatter={(value) => `${value}%`}
                    />
                  }
                />
                <Bar dataKey="bodyFat" fill="var(--color-waist)" radius={4} name={t("records.bodyFat")} />
                <Bar dataKey="visceralFat" fill="var(--color-hips)" radius={4} name={t("records.visceralFat")} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="text-sm sm:text-base md:text-lg">
              {t("progress.weeklyHydration")}
            </CardTitle>
            <CardDescription className="text-xs">
              {t("progress.weeklyHydrationDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-3 md:space-y-4 p-3 sm:p-4 md:p-6 pt-0">
            {waterData.map((day) => (
              <div key={day.date}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium">{day.date}</span>
                  <span className="text-muted-foreground">
                    {day.drank}ml / {day.goal}ml
                  </span>
                </div>
                <Progress value={(day.drank / day.goal) * 100} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
