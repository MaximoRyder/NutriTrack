"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import { UseFormReturn } from "react-hook-form";

interface SecurityCardProps {
    passwordForm: UseFormReturn<any>;
    handlePasswordSubmit: (values: any) => Promise<void>;
}

export function SecurityCard({
    passwordForm,
    handlePasswordSubmit,
}: SecurityCardProps) {
    const { t } = useTranslation();

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t("settings.security")}</CardTitle>
                <CardDescription>{t("settings.securityDesc")}</CardDescription>
            </CardHeader>
            <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}>
                    <CardContent className="space-y-4">
                        <FormField
                            control={passwordForm.control}
                            name="currentPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("settings.currentPassword")}</FormLabel>
                                    <FormControl>
                                        <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={passwordForm.control}
                            name="newPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("settings.newPassword")}</FormLabel>
                                    <FormControl>
                                        <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={passwordForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("settings.confirmPassword")}</FormLabel>
                                    <FormControl>
                                        <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                    <CardFooter className="border-t px-6 py-4">
                        <Button
                            type="submit"
                            disabled={passwordForm.formState.isSubmitting}
                        >
                            {t("settings.updatePassword")}
                        </Button>
                    </CardFooter>
                </form>
            </Form>
        </Card>
    );
}
