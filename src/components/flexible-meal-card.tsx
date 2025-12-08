"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DayMealSlot } from "@/lib/types";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

interface FlexibleMealCardProps {
    slot: DayMealSlot;
    onClick?: () => void;
}

const GROUP_COLORS: Record<string, string> = {
    "Proteína": "#FF6B6B",
    "Carbohidratos": "#FFE66D",
    "Grasas": "#1A535C",
    "Verduras/Hortalizas": "#4ECDC4",
    "Frutas": "#FF9F1C",
    "Lácteos": "#2EC4B6",
    "Otro": "#A2D2FF",
};

export function FlexibleMealCard({ slot, onClick }: FlexibleMealCardProps) {
    if (!slot.isFlexible || !slot.components) return null;

    // Prepare chart data
    const chartData = slot.components.map(c => ({
        name: c.group,
        value: c.percentage || 0,
        fill: GROUP_COLORS[c.group] || "#8884d8",
        description: c.description
    })).filter(d => d.value > 0);

    const totalPercentage = chartData.reduce((sum, d) => sum + d.value, 0);

    if (totalPercentage < 100) {
        chartData.push({
            name: "Libre",
            value: 100 - totalPercentage,
            fill: "#e5e7eb", // Gray-200
            description: "No asignado"
        });
    }

    return (
        <Card
            className="cursor-pointer hover:bg-accent/50 transition-colors h-full"
            onClick={onClick}
        >
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                Flexible
                            </Badge>
                        </div>
                        <CardTitle className="text-lg">
                            {slot.customName || "Comida Flexible"}
                        </CardTitle>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-4">
                    {/* Pie Chart Mini */}
                    <div className="w-16 h-16 shrink-0 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={0}
                                    outerRadius={30}
                                    paddingAngle={0}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Summary List */}
                    <div className="flex-1 space-y-1">
                        {slot.components.slice(0, 3).map((comp, idx) => (
                            <div key={idx} className="flex items-center text-xs gap-2">
                                <div
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: GROUP_COLORS[comp.group] || "#8884d8" }}
                                />
                                <span className="font-medium text-muted-foreground w-8 text-right">
                                    {comp.percentage}%
                                </span>
                                <span className="truncate flex-1">
                                    {comp.group}
                                </span>
                            </div>
                        ))}
                        {slot.components.length > 3 && (
                            <p className="text-xs text-muted-foreground pl-4">
                                + {slot.components.length - 3} más...
                            </p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
