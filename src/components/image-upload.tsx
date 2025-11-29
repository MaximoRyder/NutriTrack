"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import {
    compressImage,
    MAX_FILE_SIZE_MB,
    validateFileSize,
} from "@/lib/image-utils";
import { cn } from "@/lib/utils";
import { Loader2, UploadCloud, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";

interface ImageUploadProps {
    value?: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    className?: string;
}

export function ImageUpload({
    value,
    onChange,
    disabled,
    className,
}: ImageUploadProps) {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size
        if (!validateFileSize(file)) {
            toast({
                variant: "destructive",
                title: t("availability.fileTooLarge").replace(
                    "{max}",
                    MAX_FILE_SIZE_MB.toString()
                ),
            });
            // Reset input so user can select the same file again if they want (though it will fail again)
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
            return;
        }

        try {
            setIsProcessing(true);
            const compressedImage = await compressImage(file);
            onChange(compressedImage);
        } catch (error) {
            console.error("Image processing error:", error);
            toast({
                variant: "destructive",
                title: t("availability.imageProcessError"),
            });
        } finally {
            setIsProcessing(false);
            // Reset input
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange("");
    };

    const handleClick = () => {
        if (!disabled && !isProcessing) {
            fileInputRef.current?.click();
        }
    };

    return (
        <div className={cn("w-full", className)}>
            <div
                onClick={handleClick}
                className={cn(
                    "relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted bg-secondary/50 p-6 text-center transition-colors hover:border-primary",
                    (disabled || isProcessing) && "cursor-not-allowed opacity-50",
                    value && "border-primary bg-secondary/20"
                )}
            >
                <Input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={disabled || isProcessing}
                />

                {isProcessing ? (
                    <div className="flex flex-col items-center justify-center py-4">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p className="mt-2 text-sm text-muted-foreground">
                            {t("availability.processing")}
                        </p>
                    </div>
                ) : value ? (
                    <div className="relative w-full">
                        <div className="relative mx-auto h-48 w-full max-w-md overflow-hidden rounded-md">
                            <Image
                                src={value}
                                alt="Preview"
                                fill
                                className="object-contain"
                            />
                        </div>
                        <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -right-2 -top-2 h-6 w-6 rounded-full shadow-sm"
                            onClick={handleRemove}
                            disabled={disabled}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-2 text-muted-foreground py-4">
                        <div className="flex justify-center">
                            <div className="rounded-full bg-background p-3 shadow-sm">
                                <UploadCloud className="h-6 w-6" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium">
                                {t("addMeal.uploadPrompt")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                JPG, PNG, WEBP (Max {MAX_FILE_SIZE_MB}MB)
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
