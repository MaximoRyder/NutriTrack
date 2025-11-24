"use client";

import { AvatarCropDialog } from "@/components/avatar-crop-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import React from "react";
import { UseFormReturn } from "react-hook-form";

interface ProfileCardProps {
    profileForm: UseFormReturn<any>;
    userProfile: any;
    handleProfileSubmit: (values: any) => Promise<void>;
    mutateProfile: () => void;
}

export function ProfileCard({
    profileForm,
    userProfile,
    handleProfileSubmit,
    mutateProfile,
}: ProfileCardProps) {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [isAvatarDialogOpen, setAvatarDialogOpen] = React.useState(false);

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>{t("settings.profile")}</CardTitle>
                    <CardDescription>{t("settings.profileDesc")}</CardDescription>
                </CardHeader>
                <Form {...profileForm}>
                    <form
                        onSubmit={profileForm.handleSubmit(handleProfileSubmit)}
                        className="space-y-0"
                    >
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-20 w-20">
                                    <AvatarImage src={profileForm.watch("photoUrl") || ""} />
                                    <AvatarFallback>
                                        {userProfile.displayName?.charAt(0) || "U"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setAvatarDialogOpen(true)}
                                    >
                                        {t("settings.uploadPhoto")}
                                    </Button>
                                    <FormField
                                        control={profileForm.control}
                                        name="photoUrl"
                                        render={({ field }) => (
                                            <FormItem className="hidden">
                                                <FormControl>
                                                    <Input type="hidden" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                            <FormField
                                control={profileForm.control}
                                name="displayName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("settings.displayName")}</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div>
                                <Label>{t("settings.email")}</Label>
                                <Input value={userProfile.email} readOnly disabled />
                            </div>
                            {userProfile.role === "nutritionist" && (
                                <div className="flex items-center gap-2 text-sm">
                                    <span>
                                        {t("settings.invitationCode", {
                                            code: userProfile.invitationCode || t("general.na"),
                                        })}
                                    </span>
                                    {userProfile.invitationCode && (
                                        <Badge variant="secondary">
                                            {userProfile.invitationCode}
                                        </Badge>
                                    )}
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="border-t px-6 py-4">
                            <Button
                                type="submit"
                                disabled={profileForm.formState.isSubmitting}
                            >
                                {t("settings.save")}
                            </Button>
                        </CardFooter>
                    </form>
                </Form>
            </Card>

            <AvatarCropDialog
                isOpen={isAvatarDialogOpen}
                onOpenChange={setAvatarDialogOpen}
                onCropped={async (url) => {
                    if (!userProfile) return;

                    profileForm.setValue("photoUrl", url, { shouldDirty: false });

                    const res = await fetch("/api/users", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            id: userProfile.id,
                            photoUrl: url,
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
                }}
            />
        </>
    );
}
