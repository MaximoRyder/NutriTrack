"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import type { DayMealSlot, FlexibleMealComponent } from "@/lib/types";
import { AlertCircle, Plus, Trash2, X } from "lucide-react";
import { Cell, Pie, PieChart, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

interface FlexibleWeekPlanBuilderProps {
    weekStructure: {
        monday: DayMealSlot[];
        tuesday: DayMealSlot[];
        wednesday: DayMealSlot[];
        thursday: DayMealSlot[];
        friday: DayMealSlot[];
        saturday: DayMealSlot[];
        sunday: DayMealSlot[];
    };
    onChange: (weekStructure: any) => void;
}

const COLORS = [
    "#FF6B6B", // Red (Protein)
    "#4ECDC4", // Teal (Veggies)
    "#FFE66D", // Yellow (Carbs)
    "#1A535C", // Dark Teal (Fats)
    "#FF9F1C", // Orange (Fruit)
    "#2EC4B6", // Cyan (Dairy)
    "#A2D2FF", // Blue (Other)
];

const GROUP_COLORS: Record<string, string> = {
    "Proteína": "#FF6B6B",
    "Carbohidratos": "#FFE66D",
    "Grasas": "#1A535C",
    "Verduras/Hortalizas": "#4ECDC4",
    "Frutas": "#FF9F1C",
    "Lácteos": "#2EC4B6",
    "Otro": "#A2D2FF",
};

export function FlexibleWeekPlanBuilder({
    weekStructure,
    onChange,
}: FlexibleWeekPlanBuilderProps) {
    const { t } = useTranslation();

    const DAYS = [
        { key: "monday", label: t("mealTemplates.builder.days.monday") },
        { key: "tuesday", label: t("mealTemplates.builder.days.tuesday") },
        { key: "wednesday", label: t("mealTemplates.builder.days.wednesday") },
        { key: "thursday", label: t("mealTemplates.builder.days.thursday") },
        { key: "friday", label: t("mealTemplates.builder.days.friday") },
        { key: "saturday", label: t("mealTemplates.builder.days.saturday") },
        { key: "sunday", label: t("mealTemplates.builder.days.sunday") },
    ] as const;

    const MEAL_TYPES = [
        { value: "breakfast", label: t("addMeal.breakfast") },
        { value: "lunch", label: t("addMeal.lunch") },
        { value: "dinner", label: t("addMeal.dinner") },
        { value: "snack", label: t("addMeal.snack") },
        { value: "other", label: t("addMeal.other") },
    ] as const;

    const GROUPS = [
        "Proteína",
        "Carbohidratos",
        "Grasas",
        "Verduras/Hortalizas",
        "Frutas",
        "Lácteos",
        "Otro",
    ];

    const addSlot = (day: string, mealType: string) => {
        const newStructure = { ...weekStructure };
        newStructure[day as keyof typeof weekStructure].push({
            mealItemId: null,
            mealType: mealType as any,
            notes: "",
            isFlexible: true,
            customName: "",
            components: [],
        });
        onChange(newStructure);
    };

    const removeSlot = (day: string, index: number) => {
        const newStructure = { ...weekStructure };
        newStructure[day as keyof typeof weekStructure].splice(index, 1);
        onChange(newStructure);
    };

    const updateSlot = (
        day: string,
        index: number,
        field: string,
        value: any
    ) => {
        const newStructure = { ...weekStructure };
        newStructure[day as keyof typeof weekStructure][index] = {
            ...newStructure[day as keyof typeof weekStructure][index],
            [field]: value,
        };
        onChange(newStructure);
    };

    const addComponent = (day: string, slotIndex: number) => {
        const newStructure = { ...weekStructure };
        const slot = newStructure[day as keyof typeof weekStructure][slotIndex];
        if (!slot.components) slot.components = [];

        // Calculate remaining percentage
        const currentTotal = slot.components.reduce((sum, c) => sum + (c.percentage || 0), 0);
        const remaining = Math.max(0, 100 - currentTotal);

        slot.components.push({
            group: GROUPS[0],
            portion: remaining > 0 ? `${remaining}% ` : "",
            percentage: remaining > 0 ? remaining : undefined,
            description: "",
        });
        onChange(newStructure);
    };

    const updateComponent = (
        day: string,
        slotIndex: number,
        compIndex: number,
        field: keyof FlexibleMealComponent,
        value: string | number
    ) => {
        const newStructure = { ...weekStructure };
        const slot = newStructure[day as keyof typeof weekStructure][slotIndex];
        if (slot.components && slot.components[compIndex]) {
            const component = slot.components[compIndex];
            // Type assertion for dynamic field assignment
            (component as any)[field] = value;

            // Sync portion text with percentage if percentage changes
            if (field === 'percentage') {
                const numValue = Number(value);
                component.portion = `${numValue}% `;
            }
        }
        onChange(newStructure);
    };

    const removeComponent = (day: string, slotIndex: number, compIndex: number) => {
        const newStructure = { ...weekStructure };
        const slot = newStructure[day as keyof typeof weekStructure][slotIndex];
        if (slot.components) {
            slot.components.splice(compIndex, 1);
        }
        onChange(newStructure);
    };

    const getSlotTotalPercentage = (components?: FlexibleMealComponent[]) => {
        return components?.reduce((sum, c) => sum + (c.percentage || 0), 0) || 0;
    };

    return (
        <div className="space-y-6">
            {DAYS.map(({ key, label }) => (
                <Card key={key}>
                    <CardHeader className="pb-3">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-lg">{label}</CardTitle>
                            <Select
                                onValueChange={(mealType) => addSlot(key, mealType)}
                                value=""
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder={t("mealTemplates.builder.addMeal")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {MEAL_TYPES.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            <Plus className="h-4 w-4 inline mr-2" />
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {weekStructure[key as keyof typeof weekStructure].length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                {t("mealTemplates.builder.noMeals")}
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {weekStructure[key as keyof typeof weekStructure].map(
                                    (slot, slotIndex) => {
                                        const totalPercentage = getSlotTotalPercentage(slot.components);
                                        const chartData = slot.components?.map(c => ({
                                            name: c.group,
                                            value: c.percentage || 0,
                                            fill: GROUP_COLORS[c.group] || "#8884d8"
                                        })).filter(d => d.value > 0);

                                        // Add empty placeholder if needed
                                        if (totalPercentage < 100) {
                                            chartData?.push({
                                                name: "Libre",
                                                value: 100 - totalPercentage,
                                                fill: "#e5e7eb" // Gray-200
                                            });
                                        }

                                        return (
                                            <div
                                                key={slotIndex}
                                                className="flex flex-col gap-3 p-4 border rounded-lg bg-card"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline">
                                                            {
                                                                MEAL_TYPES.find((t) => t.value === slot.mealType)
                                                                    ?.label
                                                            }
                                                        </Badge>
                                                        <Input
                                                            className="h-8 w-[200px]"
                                                            placeholder={t("mealTemplates.builder.customName")}
                                                            value={slot.customName || ""}
                                                            onChange={(e) =>
                                                                updateSlot(key, slotIndex, "customName", e.target.value)
                                                            }
                                                        />
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeSlot(key, slotIndex)}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>

                                                <div className="flex gap-4">
                                                    {/* Inputs Section */}
                                                    <div className="flex-1 space-y-2 pl-2 border-l-2 ml-1">
                                                        {slot.components?.map((comp, compIndex) => {
                                                            // Calculate Max Allowed for this input
                                                            const otherSum = (slot.components?.reduce((sum, c, i) => i !== compIndex ? sum + (c.percentage || 0) : sum, 0) || 0);
                                                            const maxAllowed = 100 - otherSum;

                                                            return (
                                                                <div key={compIndex} className="flex gap-2 items-start">
                                                                    <div className="w-[160px] shrink-0">
                                                                        <Select
                                                                            value={comp.group}
                                                                            onValueChange={(val) => updateComponent(key, slotIndex, compIndex, "group", val)}
                                                                        >
                                                                            <SelectTrigger className="h-8">
                                                                                <SelectValue placeholder="Grupo" />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                {GROUPS.map((g) => (
                                                                                    <SelectItem key={g} value={g}>{g}</SelectItem>
                                                                                ))}
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>
                                                                    <div className="w-[70px] shrink-0">
                                                                        <TooltipProvider>
                                                                            <Tooltip>
                                                                                <TooltipTrigger asChild>
                                                                                    <div className="relative">
                                                                                        <Input
                                                                                            type="number"
                                                                                            min={0}
                                                                                            max={maxAllowed}
                                                                                            className={`h-8 pr-6 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${comp.percentage && comp.percentage > maxAllowed ? "border-destructive text-destructive" : ""}`}
                                                                                            placeholder="%"
                                                                                            value={comp.percentage || ""}
                                                                                            onChange={(e) => {
                                                                                                let val = parseInt(e.target.value) || 0;
                                                                                                if (val < 0) val = 0;
                                                                                                if (val > maxAllowed) val = maxAllowed;
                                                                                                updateComponent(key, slotIndex, compIndex, "percentage", val);
                                                                                            }}
                                                                                        />
                                                                                        <span className="absolute right-2 top-1.5 text-xs text-muted-foreground">%</span>
                                                                                    </div>
                                                                                </TooltipTrigger>
                                                                                <TooltipContent>
                                                                                    <p>Máximo permitido: {maxAllowed}%</p>
                                                                                </TooltipContent>
                                                                            </Tooltip>
                                                                        </TooltipProvider>
                                                                    </div>
                                                                    <div className="flex-1 min-w-[120px]">
                                                                        <Input
                                                                            className="h-8"
                                                                            placeholder="Descripción (ej. Carnes magras)"
                                                                            value={comp.description}
                                                                            onChange={(e) => updateComponent(key, slotIndex, compIndex, "description", e.target.value)}
                                                                        />
                                                                    </div>
                                                                    <div className="shrink-0">
                                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeComponent(key, slotIndex, compIndex)}>
                                                                            <Trash2 className="h-3 w-3" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                        <Button
                                                            variant="link"
                                                            size="sm"
                                                            className="px-0 text-muted-foreground"
                                                            onClick={() => addComponent(key, slotIndex)}
                                                            disabled={totalPercentage >= 100}
                                                        >
                                                            <Plus className="h-3 w-3 mr-1" />
                                                            Agregar grupo/ingrediente
                                                        </Button>
                                                        {totalPercentage > 100 && (
                                                            <div className="flex items-center text-destructive text-xs mt-1">
                                                                <AlertCircle className="h-3 w-3 mr-1" />
                                                                El total supera el 100%
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Chart Section */}
                                                    <div className="w-[120px] h-[120px] shrink-0 flex items-center justify-center bg-gray-50 rounded-full border">
                                                        {(!chartData || chartData.length === 0 || chartData.every(d => d.value === 0)) ? (
                                                            <span className="text-xs text-muted-foreground text-center">Plato vacío</span>
                                                        ) : (
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                <PieChart>
                                                                    <Pie
                                                                        data={chartData}
                                                                        cx="50%"
                                                                        cy="50%"
                                                                        innerRadius={0}
                                                                        outerRadius={50}
                                                                        paddingAngle={0}
                                                                        dataKey="value"
                                                                        stroke="none"
                                                                    >
                                                                        {chartData.map((entry, index) => (
                                                                            <Cell key={`cell - ${index} `} fill={entry.fill} />
                                                                        ))}
                                                                    </Pie>
                                                                    <RechartsTooltip
                                                                        formatter={(value: number) => `${value}% `}
                                                                        contentStyle={{ fontSize: '12px', padding: '4px' }}
                                                                    />
                                                                </PieChart>
                                                            </ResponsiveContainer>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))
            }
        </div >
    );
}
