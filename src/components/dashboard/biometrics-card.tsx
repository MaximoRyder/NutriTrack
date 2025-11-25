import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import { UserProfile } from "@/lib/types";
import { Activity, Minus, Target, TrendingDown, TrendingUp } from "lucide-react";

interface BiometricsCardProps {
    userProfile: UserProfile;
    className?: string;
}

export function BiometricsCard({ userProfile, className }: BiometricsCardProps) {
    const { t } = useTranslation();

    const calculateBmi = (weight?: number, height?: number) => {
        if (!weight || !height) return undefined;
        const heightM = height / 100;
        return Number((weight / (heightM * heightM)).toFixed(1));
    };

    const bmi = calculateBmi(userProfile.currentWeightKg, userProfile.heightCm);

    const metrics = [
        {
            key: "weight",
            label: t("dashboard.currentWeight"),
            value: userProfile.currentWeightKg,
            goal: userProfile.goalWeightKg,
            goalLabel: t("dashboard.goal"),
            unit: "kg",
            color: "bg-primary",
        },
        {
            key: "bmi",
            label: "BMI",
            value: bmi,
            goal: undefined,
            goalLabel: undefined,
            unit: "",
            color: "bg-green-500",
        },
        {
            key: "bodyFat",
            label: t("dashboard.bodyFat"),
            value: userProfile.bodyFatPercentage,
            goal: userProfile.goalBodyFatPercentage,
            goalLabel: t("dashboard.bodyFatGoal"),
            unit: "%",
            color: "bg-blue-500",
        },
        {
            key: "visceralFat",
            label: t("dashboard.visceralFat"),
            value: userProfile.visceralFatPercentage,
            goal: userProfile.goalVisceralFatPercentage,
            goalLabel: t("dashboard.visceralFatGoal"),
            unit: "%",
            color: "bg-orange-500",
        },
        {
            key: "muscleMass",
            label: t("dashboard.muscleMass"),
            value: userProfile.muscleMassPercentage,
            goal: userProfile.goalMuscleMassPercentage,
            goalLabel: t("dashboard.muscleMassGoal"),
            unit: "%",
            color: "bg-purple-500",
        },
    ];

    const getStatusIcon = (current: number, goal?: number) => {
        if (!goal) return <Minus className="h-4 w-4 text-gray-400" />;
        if (current === goal) return <Target className="h-4 w-4 text-green-500" />;
        return current > goal ? <TrendingDown className="h-4 w-4 text-red-500" /> : <TrendingUp className="h-4 w-4 text-green-500" />;
    };

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    {t("dashboard.bodyComposition")}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
                    {metrics.map((metric) => (
                        <div key={metric.key} className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-muted-foreground">
                                    {metric.label}
                                </span>
                                {metric.goal && (
                                    <span className="text-xs text-muted-foreground">
                                        {t("dashboard.goal", { value: metric.goal, unit: metric.unit })}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-end justify-between">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-bold">
                                        {metric.value ?? "--"}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                        {metric.unit}
                                    </span>
                                </div>
                                {metric.value !== undefined && metric.goal !== undefined && (
                                    <div className="mb-1">
                                        {getStatusIcon(metric.value, metric.goal)}
                                    </div>
                                )}
                            </div>
                            {metric.value !== undefined && (
                                <Progress value={metric.value} className="h-2" indicatorClassName={metric.color} />
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
