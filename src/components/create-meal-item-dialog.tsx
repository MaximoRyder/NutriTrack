"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import type { MealItem } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { UploadCloud, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const MAX_TITLE_LENGTH = 50;
const MAX_DESC_LENGTH = 200;

interface CreateMealItemDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Partial<MealItem>) => Promise<void>;
  mealItemToEdit?: MealItem | null;
}

export function CreateMealItemDialog({
  isOpen,
  onOpenChange,
  onSave,
  mealItemToEdit,
}: CreateMealItemDialogProps) {
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);
  const isEditing = !!mealItemToEdit;

  const formSchema = z.object({
    title: z
      .string()
      .min(1, t("mealLibrary.validation.titleRequired"))
      .max(MAX_TITLE_LENGTH, t("mealLibrary.validation.maxLength", { max: MAX_TITLE_LENGTH })),
    description: z
      .string()
      .min(1, t("mealLibrary.validation.descriptionRequired"))
      .max(MAX_DESC_LENGTH, t("mealLibrary.validation.maxLength", { max: MAX_DESC_LENGTH })),
    mealType: z.enum(["breakfast", "lunch", "dinner", "snack", "other"]),
    photoUrl: z.string().optional(),
    videoUrl: z.string().url(t("validation.urlInvalid")).optional().or(z.literal("")),
    portionInfo: z.string().optional(),
    recommendedTime: z.string().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      mealType: "breakfast",
      photoUrl: "",
      videoUrl: "",
      portionInfo: "",
      recommendedTime: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (mealItemToEdit) {
        form.reset({
          title: mealItemToEdit.title,
          description: mealItemToEdit.description,
          mealType: mealItemToEdit.mealType,
          photoUrl: mealItemToEdit.photoUrl || "",
          videoUrl: mealItemToEdit.videoUrl || "",
          portionInfo: mealItemToEdit.portionInfo || "",
          recommendedTime: mealItemToEdit.recommendedTime || "",
        });
      } else {
        form.reset({
          title: "",
          description: "",
          mealType: "breakfast",
          photoUrl: "",
          videoUrl: "",
          portionInfo: "",
          recommendedTime: "",
        });
      }
    }
  }, [isOpen, mealItemToEdit, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSaving(true);
    try {
      await onSave(values);
      form.reset();
    } catch (error) {
      console.error("Error saving meal item:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, you would upload the file to a storage service here
      // For now, we'll just create a fake URL
      const fakeUrl = URL.createObjectURL(file);
      form.setValue("photoUrl", fakeUrl);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl grid-rows-[auto,1fr,auto] max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>
            {isEditing ? t("mealLibrary.dialog.editTitle") : t("mealLibrary.dialog.createTitle")}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? t("mealLibrary.dialog.editDesc")
              : t("mealLibrary.dialog.createDesc")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col h-full overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="photoUrl"
                    render={() => (
                      <FormItem>
                        <FormLabel>{t("mealLibrary.form.photoLabel")}</FormLabel>
                        <FormControl>
                          <div
                            className="relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted bg-secondary/50 p-6 text-center transition-colors hover:border-primary"
                            onClick={() =>
                              document.getElementById("photo-upload")?.click()
                            }
                          >
                            {form.watch("photoUrl") ? (
                              <div className="relative aspect-video w-full overflow-hidden rounded-md">
                                <Image
                                  src={form.watch("photoUrl") || ""}
                                  alt="Preview"
                                  fill
                                  className="object-cover"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-1 top-1 h-6 w-6 rounded-full bg-background/80 hover:bg-background"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    form.setValue("photoUrl", "");
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-2 text-muted-foreground">
                                <UploadCloud className="mx-auto h-10 w-10" />
                                <p className="text-sm">
                                  {t("mealLibrary.form.uploadPrompt")}
                                </p>
                              </div>
                            )}
                            <Input
                              id="photo-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleImageUpload}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("mealLibrary.form.titleLabel")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t("mealLibrary.form.titlePlaceholder")}
                            {...field}
                            maxLength={MAX_TITLE_LENGTH}
                          />
                        </FormControl>
                        <div className="text-xs text-right text-muted-foreground">
                          {field.value.length}/{MAX_TITLE_LENGTH}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="mealType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("mealLibrary.form.typeLabel")}</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t("addMeal.selectType")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="breakfast">{t("addMeal.breakfast")}</SelectItem>
                              <SelectItem value="lunch">{t("addMeal.lunch")}</SelectItem>
                              <SelectItem value="dinner">{t("addMeal.dinner")}</SelectItem>
                              <SelectItem value="snack">{t("addMeal.snack")}</SelectItem>
                              <SelectItem value="other">{t("addMeal.other")}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="recommendedTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("mealLibrary.form.recommendedTimeLabel")}</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("mealLibrary.form.descriptionLabel")}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t("mealLibrary.form.descriptionPlaceholder")}
                            {...field}
                            maxLength={MAX_DESC_LENGTH}
                            rows={6}
                            className="resize-none"
                          />
                        </FormControl>
                        <div className="text-xs text-right text-muted-foreground">
                          {field.value.length}/{MAX_DESC_LENGTH}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="portionInfo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("mealLibrary.form.portionLabel")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t("mealLibrary.form.portionPlaceholder")}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="videoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("mealLibrary.form.videoLabel")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://youtube.com/watch?v=..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="p-6 pt-4 border-t">
              <Button type="submit" disabled={isSaving}>
                {isSaving
                  ? t("mealLibrary.form.saving")
                  : isEditing
                  ? t("general.save")
                  : t("mealLibrary.createMeal")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
