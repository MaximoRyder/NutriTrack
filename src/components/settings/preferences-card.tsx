"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import { useTheme } from "next-themes";

export function PreferencesCard() {
    const { t, locale, setLocale } = useTranslation();
    const { setTheme, theme } = useTheme();

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t("settings.preferences")}</CardTitle>
                <CardDescription>{t("settings.preferencesDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>{t("settings.language")}</Label>
                    <Select
                        value={locale}
                        onValueChange={(value: any) => setLocale(value)}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="en">{t("languages.en")}</SelectItem>
                            <SelectItem value="es">{t("languages.es")}</SelectItem>
                            <SelectItem value="pt">{t("languages.pt")}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>{t("settings.theme")}</Label>
                    <Select
                        value={theme}
                        onValueChange={(value) => setTheme(value)}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="light">{t("settings.themeLight")}</SelectItem>
                            <SelectItem value="dark">{t("settings.themeDark")}</SelectItem>
                            <SelectItem value="system">{t("settings.themeSystem")}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
        </Card>
    );
}
