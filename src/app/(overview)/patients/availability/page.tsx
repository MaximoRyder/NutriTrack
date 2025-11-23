"use client";

import { AvailabilityManager } from "@/components/availability-manager";
import { useUser, useUserProfile } from "@/lib/data-hooks";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import { useRouter } from "next/navigation";

export default function AvailabilityPage() {
    const { user, isUserLoading } = useUser();
    const { profile: userProfile, isLoading: isProfileLoading } = useUserProfile(
        (user as any)?.id
    );
    const { t } = useTranslation();
    const router = useRouter();

    const isLoading = isUserLoading || isProfileLoading;

    if (isLoading) {
        return (
            <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
                <p>{t("general.loading")}</p>
            </div>
        );
    }

    // Redirect non-nutritionists
    if (userProfile?.role !== "nutritionist") {
        router.push("/overview");
        return null;
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">
                    {t("availability.title")}
                </h2>
                <p className="text-muted-foreground">{t("availability.description")}</p>
            </div>

            <AvailabilityManager nutritionistId={userProfile.id} />
        </div>
    );
}
