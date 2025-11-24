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
import { useUser } from "@/lib/data-hooks";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import { format } from "date-fns";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Line,
    LineChart,
    XAxis,
    YAxis,
} from "recharts";

const weightData = [
  { date: "2024-06-01", weight: 85.0 },
  { date: "2024-06-08", weight: 84.5 },
  { date: "2024-06-15", weight: 84.0 },
  { date: "2024-06-22", weight: 83.0 },
  { date: "2024-06-29", weight: 82.5 },
  { date: "2024-07-06", weight: 82.0 },
  { date: "2024-07-13", weight: 81.5 },
];
const chartConfig = {
  weight: { label: "Weight (kg)", color: "hsl(var(--primary))" },
  waist: { label: "Waist (cm)", color: "hsl(var(--chart-2))" },
  hips: { label: "Hips (cm)", color: "hsl(var(--chart-3))" },
  water: { label: "Water (ml)", color: "hsl(var(--chart-1))" },
};

const measurementsData = [
  { date: "2024-06-01", waist: 95, hips: 105, chest: 100 },
  { date: "2024-07-01", waist: 92, hips: 103, chest: 99 },
];

const waterData = [
  { date: "Sun", goal: 2000, drank: 1500 },
  { date: "Mon", goal: 2000, drank: 1800 },
  { date: "Tue", goal: 2000, drank: 2100 },
  { date: "Wed", goal: 2000, drank: 1900 },
  { date: "Thu", goal: 2000, drank: 2200 },
  { date: "Fri", goal: 2000, drank: 1700 },
  { date: "Sat", goal: 2000, drank: 2000 },
];

export default function ProgressPage() {
  const { t } = useTranslation();
  const { user } = useUser();
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
                tickFormatter={(val) => format(new Date(val), "MMM d")}
              />
              <YAxis domain={["dataMin - 2", "dataMax + 2"]} hide />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
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

      <div className="grid md:grid-cols-2 gap-6">
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
                  tickFormatter={(val) => format(new Date(val), "MMM yyyy")}
                />
                <YAxis hide />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
                <Bar dataKey="waist" fill="var(--color-waist)" radius={4} />
                <Bar dataKey="hips" fill="var(--color-hips)" radius={4} />
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
