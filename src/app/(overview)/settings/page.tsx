"use client";

import { BmiGauge } from "@/components/bmi-gauge";
import { PersonalDataCard } from "@/components/settings/personal-data-card";
import { PreferencesCard } from "@/components/settings/preferences-card";
import { ProfileCard } from "@/components/settings/profile-card";
import { SecurityCard } from "@/components/settings/security-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useUser, useUserProfile } from "@/lib/data-hooks";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTheme } from "next-themes";
import React, { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

export default function SettingsPage() {
  const { user, isUserLoading } = useUser();
  const {
    profile: userProfile,
    isLoading: isProfileLoading,
    mutate: mutateProfile,
  } = useUserProfile((user as any)?.id);
  const { t, locale, setLocale } = useTranslation();
  const { setTheme, theme } = useTheme();
  const { toast } = useToast();

  const [isAvatarDialogOpen, setAvatarDialogOpen] = React.useState(
    false as boolean
  );

  const profileSchema = useMemo(
    () =>
      z.object({
        displayName: z.string().min(1, t("validation.required")),
        photoUrl: z.string().optional(),
      }),
    [t]
  );

  const patientSchema = useMemo(
    () =>
      z.object({
        dateOfBirth: z.string().optional(),
        heightCm: z.coerce
          .number()
          .positive(t("validation.positiveNumber"))
          .optional(),
        currentWeightKg: z.coerce
          .number()
          .positive(t("validation.positiveNumber"))
          .optional(),
        goalWeightKg: z.coerce
          .number()
          .positive(t("validation.positiveNumber"))
          .optional(),
        activityLevel: z
          .enum(["sedentary", "light", "moderate", "active", "very_active"])
          .optional(),
        dietaryPreferences: z
          .enum(["omnivore", "vegetarian", "vegan", "pescetarian"])
          .optional(),
        healthConditions: z.string().optional(),
        bodyMeasurements: z
          .object({
            waist: z.coerce
              .number()
              .positive(t("validation.positiveNumber"))
              .optional(),
            hips: z.coerce
              .number()
              .positive(t("validation.positiveNumber"))
              .optional(),
            chest: z.coerce
              .number()
              .positive(t("validation.positiveNumber"))
              .optional(),
          })
          .optional(),
      }),
    [t]
  );

  const passwordSchema = useMemo(
    () =>
      z
        .object({
          currentPassword: z.string().min(6, t("validation.passwordMin")),
          newPassword: z.string().min(6, t("validation.passwordMin")),
          confirmPassword: z.string().min(6, t("validation.passwordMin")),
        })
        .refine((vals) => vals.newPassword === vals.confirmPassword, {
          message: t("validation.passwordsMatch"),
          path: ["confirmPassword"],
        }),
    [t]
  );

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: "",
      photoUrl: "",
    },
  });
  const patientForm = useForm<z.infer<typeof patientSchema>>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      dateOfBirth: "",
      heightCm: undefined,
      currentWeightKg: undefined,
      goalWeightKg: undefined,
      activityLevel: undefined,
      dietaryPreferences: undefined,
      healthConditions: "",
      bodyMeasurements: {
        waist: undefined,
        hips: undefined,
        chest: undefined,
      },
    },
  });
  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (userProfile) {
      // Preserve dirty fields (like displayName if the user is editing it)
      const currentDisplayName = profileForm.getValues("displayName");
      const isDisplayNameDirty = profileForm.getFieldState("displayName").isDirty;

      profileForm.reset({
        displayName: isDisplayNameDirty ? currentDisplayName : userProfile.displayName || "",
        photoUrl: userProfile.photoUrl || "",
      });

      if (userProfile.role === "patient") {
        patientForm.reset({
          dateOfBirth: userProfile.dateOfBirth
            ? new Date(userProfile.dateOfBirth).toISOString().slice(0, 10)
            : "",
          heightCm: userProfile.heightCm,
          currentWeightKg: userProfile.currentWeightKg,
          goalWeightKg: userProfile.goalWeightKg,
          activityLevel: userProfile.activityLevel,
          dietaryPreferences: userProfile.dietaryPreferences,
          healthConditions: userProfile.healthConditions || "",
          bodyMeasurements: userProfile.bodyMeasurements || {
            waist: undefined,
            hips: undefined,
            chest: undefined,
          },
        });
      }
    }
  }, [userProfile, profileForm, patientForm]);

  const calculatedBMI = useMemo(() => {
    if (userProfile?.currentWeightKg && userProfile?.heightCm) {
      const h = userProfile.heightCm / 100;
      return (userProfile.currentWeightKg / (h * h)).toFixed(1);
    }
    return null;
  }, [userProfile]);

  const handleProfileSubmit = async (values: z.infer<typeof profileSchema>) => {
    if (!userProfile) return;
    const res = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: userProfile.id,
        displayName: values.displayName,
        photoUrl: values.photoUrl,
      }),
    });
    if (res.ok) {
      mutateProfile();
      toast({
        title: t("settings.success"),
        description: t("settings.profileUpdated"),
      });
    } else {
      toast({
        variant: "destructive",
        title: t("settings.error"),
        description: await res.text(),
      });
    }
  };

  const handlePatientSubmit = async (values: z.infer<typeof patientSchema>) => {
    if (!userProfile) return;
    const payload: any = { id: userProfile.id };
    Object.entries(values).forEach(([k, v]) => {
      if (v !== undefined && v !== "") (payload as any)[k] = v;
    });
    // bodyMeasurements nested
    if (values.bodyMeasurements)
      payload.bodyMeasurements = values.bodyMeasurements;
    const res = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      mutateProfile();
      toast({
        title: t("settings.success"),
        description: t("settings.personalDataUpdated"),
      });
    } else {
      toast({
        variant: "destructive",
        title: t("settings.error"),
        description: await res.text(),
      });
    }
  };

  const handlePasswordSubmit = async (
    values: z.infer<typeof passwordSchema>
  ) => {
    if (!userProfile) return;
    const res = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: userProfile.id,
        currentPassword: values.currentPassword,
        password: values.newPassword,
      }),
    });
    if (res.ok) {
      passwordForm.reset();
      toast({
        title: t("settings.success"),
        description: t("settings.passwordUpdated"),
      });
    } else {
      toast({
        variant: "destructive",
        title: t("settings.error"),
        description: await res.text(),
      });
    }
  };

  const isLoading = isUserLoading || isProfileLoading;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          {t("settings.title")}
        </h2>
        <p className="text-muted-foreground">{t("settings.description")}</p>
      </div>
      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full max-w-md" style={{ gridTemplateColumns: userProfile.role === "patient" ? "1fr 1fr" : "1fr" }}>
            <TabsTrigger value="general">General Settings</TabsTrigger>
            {userProfile.role === "patient" && (
              <TabsTrigger value="personal">Personal Data</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="general" className="space-y-6 mt-6">
            <PreferencesCard />

            <ProfileCard
              profileForm={profileForm}
              userProfile={userProfile}
              handleProfileSubmit={handleProfileSubmit}
              mutateProfile={mutateProfile}
            />

            <SecurityCard
              passwordForm={passwordForm}
              handlePasswordSubmit={handlePasswordSubmit}
            />
          </TabsContent>

          {userProfile.role === "patient" && (
            <TabsContent value="personal" className="space-y-6 mt-6">
              <PersonalDataCard
                patientForm={patientForm}
                handlePatientSubmit={handlePatientSubmit}
              />

              {calculatedBMI && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t("settings.calculatedBmi")}</CardTitle>
                    <CardDescription>{t("settings.bmiDesc")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{calculatedBMI}</div>
                    <div className="mt-4">
                      {/* @ts-expect-error client component */}
                      <BmiGauge bmi={Number(calculatedBMI)} />
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}
        </Tabs>
      )}
    </div>
  );
}
