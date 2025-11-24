"use client";

import { useTranslation } from "@/lib/i18n/i18n-provider";
import React from "react";

interface BmiGaugeProps {
  bmi: number | null;
  className?: string;
}

// BMI segments based on WHO ranges (simplified)
const segments = [
  { key: "underweight", min: 0, max: 18.5, color: "#3b82f6" }, // blue
  { key: "normal", min: 18.5, max: 25, color: "#10b981" }, // green
  { key: "overweight", min: 25, max: 30, color: "#f59e0b" }, // amber
  { key: "obese", min: 30, max: 35, color: "#f97316" }, // orange
  { key: "obeseSevere", min: 35, max: 50, color: "#ef4444" }, // red
];

function clamp(val: number, min: number, max: number) {
  return Math.min(Math.max(val, min), max);
}

export const BmiGauge: React.FC<BmiGaugeProps> = ({ bmi, className }) => {
  const { t } = useTranslation();
  if (bmi == null) return null;

  const minBmi = segments[0].min;
  const maxBmi = segments[segments.length - 1].max;
  const clamped = clamp(bmi, minBmi, maxBmi);

  // Map BMI to angle across 180 degrees (semi-circle)
  const angle = ((clamped - minBmi) / (maxBmi - minBmi)) * 180; // 0 (left) to 180 (right)

  // Determine category
  const category =
    segments.find((s) => bmi >= s.min && bmi < s.max) ||
    segments[segments.length - 1];

  // Needle position using basic trigonometry on radius
  const radius = 90;
  const centerX = 100;
  const centerY = 100;
  const needleAngleRad = ((180 - angle) * Math.PI) / 180; // invert for left->right sweep
  const needleLength = 70;
  const needleX = centerX - needleLength * Math.cos(needleAngleRad);
  const needleY = centerY - needleLength * Math.sin(needleAngleRad);

  // Build segment paths (simple colored arcs)
  const arcPaths = segments.map((seg, idx) => {
    const startAngle = ((seg.min - minBmi) / (maxBmi - minBmi)) * 180;
    const endAngle = ((seg.max - minBmi) / (maxBmi - minBmi)) * 180;
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
    const startRad = ((180 - startAngle) * Math.PI) / 180;
    const endRad = ((180 - endAngle) * Math.PI) / 180;
    const x1 = centerX - radius * Math.cos(startRad);
    const y1 = centerY - radius * Math.sin(startRad);
    const x2 = centerX - radius * Math.cos(endRad);
    const y2 = centerY - radius * Math.sin(endRad);
    return (
      <path
        key={seg.key}
        d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${x2} ${y2}`}
        stroke={seg.color}
        strokeWidth={18}
        fill="none"
        strokeLinecap="round"
      />
    );
  });

  return (
    <div className={className}>
      <div className="relative mx-auto w-[200px] h-[120px]">
        <svg width={200} height={120} viewBox="0 0 200 120">
          {arcPaths}
          {/* Needle */}
          <line
            x1={centerX}
            y1={centerY}
            x2={needleX}
            y2={needleY}
            stroke="hsl(var(--foreground))"
            strokeWidth={4}
            strokeLinecap="round"
          />
          <circle cx={centerX} cy={centerY} r={6} fill="hsl(var(--foreground))" />
          {/* Labels (top) */}
          {segments.map((seg) => {
            const mid = seg.min + (seg.max - seg.min) / 2;
            const midAngle = ((mid - minBmi) / (maxBmi - minBmi)) * 180;
            const midRad = ((180 - midAngle) * Math.PI) / 180;
            const lx = centerX - (radius + 26) * Math.cos(midRad);
            const ly = centerY - (radius + 26) * Math.sin(midRad);
            return (
              <text
                key={seg.key + "label"}
                x={lx}
                y={ly}
                fontSize={10}
                textAnchor="middle"
                fill="hsl(var(--muted-foreground))"
              >
                {t(`settings.bmiCategories.${seg.key}`)}
              </text>
            );
          })}
        </svg>
      </div>
      <p className="mt-2 text-sm text-muted-foreground text-center">
        {t("settings.bmiCategories." + category.key)}
      </p>
    </div>
  );
};
