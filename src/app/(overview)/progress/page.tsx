
'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Line, LineChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "@/lib/i18n/i18n-provider";

const weightData = [
  { date: '2024-06-01', weight: 85.0 }, { date: '2024-06-08', weight: 84.5 },
  { date: '2024-06-15', weight: 84.0 }, { date: '2024-06-22', weight: 83.0 },
  { date: '2024-06-29', weight: 82.5 }, { date: '2024-07-06', weight: 82.0 },
  { date: '2024-07-13', weight: 81.5 },
];
const chartConfig = {
  weight: { label: 'Weight (kg)', color: 'hsl(var(--primary))' },
  waist: { label: 'Waist (cm)', color: 'hsl(var(--chart-2))' },
  hips: { label: 'Hips (cm)', color: 'hsl(var(--chart-3))' },
  water: { label: 'Water (ml)', color: 'hsl(var(--chart-1))' },
};

const measurementsData = [
  { date: '2024-06-01', waist: 95, hips: 105, chest: 100 },
  { date: '2024-07-01', waist: 92, hips: 103, chest: 99 },
];

const waterData = [
  { date: 'Sun', goal: 2000, drank: 1500 }, { date: 'Mon', goal: 2000, drank: 1800 },
  { date: 'Tue', goal: 2000, drank: 2100 }, { date: 'Wed', goal: 2000, drank: 1900 },
  { date: 'Thu', goal: 2000, drank: 2200 }, { date: 'Fri', goal: 2000, drank: 1700 },
  { date: 'Sat', goal: 2000, drank: 2000 },
];

export default function ProgressPage() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('progress.title')}</CardTitle>
          <CardDescription>{t('progress.description')}</CardDescription>
        </CardHeader>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>{t('progress.weightTracking')}</CardTitle>
          <CardDescription>{t('progress.weightTrackingDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <LineChart data={weightData}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(val) => format(new Date(val), 'MMM d')} />
              <YAxis domain={['dataMin - 2', 'dataMax + 2']} hide/>
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Line dataKey="weight" type="monotone" stroke="var(--color-weight)" strokeWidth={3} dot={{r: 5, fill: 'var(--color-weight)'}} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
            <CardHeader>
            <CardTitle>{t('progress.bodyMeasurements')}</CardTitle>
            <CardDescription>{t('progress.bodyMeasurementsDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
                 <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <BarChart data={measurementsData}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(val) => format(new Date(val), 'MMM yyyy')} />
                        <YAxis hide/>
                        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                        <Bar dataKey="waist" fill="var(--color-waist)" radius={4} />
                        <Bar dataKey="hips" fill="var(--color-hips)" radius={4} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
         <Card>
            <CardHeader>
            <CardTitle>{t('progress.weeklyHydration')}</CardTitle>
            <CardDescription>{t('progress.weeklyHydrationDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {waterData.map(day => (
                    <div key={day.date}>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium">{day.date}</span>
                            <span className="text-muted-foreground">{day.drank}ml / {day.goal}ml</span>
                        </div>
                        <Progress value={(day.drank / day.goal) * 100} />
                    </div>
                ))}
            </CardContent>
        </Card>
      </div>

    </div>
  )
}

    
