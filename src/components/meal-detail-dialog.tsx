"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { addComment, useComments } from "@/lib/data-hooks";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import type { Comment, Meal } from "@/lib/types";
import { format, formatDistanceToNow } from "date-fns";
import { enUS, es, pt } from "date-fns/locale";
import { AlignLeft, Clock, Scale, Utensils, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface MealDetailDialogProps {
  meal: Meal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (meal: Meal) => void;
  onDelete?: (meal: Meal) => void;
}

export function MealDetailDialog({
  meal,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: MealDetailDialogProps) {
  const { t, locale } = useTranslation();
  const [reply, setReply] = useState("");
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Get the appropriate date-fns locale
  const dateLocale = locale === 'es' ? es : locale === 'pt' ? pt : enUS;

  // Helper function to translate meal type
  const getMealTypeTranslation = (mealType: string) => {
    const mealTypeMap: { [key: string]: string } = {
      'breakfast': t('addMeal.breakfast'),
      'lunch': t('addMeal.lunch'),
      'dinner': t('addMeal.dinner'),
      'snack': t('addMeal.snack'),
      'other': t('addMeal.other'),
    };
    return mealTypeMap[mealType.toLowerCase()] || mealType;
  };

  // Comments
  const {
    comments,
    isLoading: isLoadingComments,
    mutate,
  } = useComments(meal?.id || "");

  const handleSendReply = async () => {
    if (!reply.trim() || !meal) return;
    await addComment({ mealId: meal.id, text: reply });
    setReply("");
    mutate();
  };

  if (!meal) return null;

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{meal.name}</DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column: Image */}
          <div 
            className="relative aspect-square w-full overflow-hidden rounded-md bg-secondary/30 cursor-zoom-in"
            onClick={() => setIsLightboxOpen(true)}
          >
            <Image
              src={meal.photoUrl}
              alt={meal.name}
              fill
              className="object-contain"
            />
          </div>

          {/* Right Column: Details */}
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center text-muted-foreground mb-1">
                <Utensils className="h-4 w-4 mr-2" />
                <span className="text-xs font-medium uppercase tracking-wider">{t("addMeal.type") || "Type"}</span>
              </div>
              <p className="font-medium capitalize">{getMealTypeTranslation(meal.mealType)}</p>
            </div>

            {meal.portionSize && (
              <div className="space-y-1">
                <div className="flex items-center text-muted-foreground mb-1">
                  <Scale className="h-4 w-4 mr-2" />
                  <span className="text-xs font-medium uppercase tracking-wider">{t("addMeal.portionSize") || "Portion"}</span>
                </div>
                <p className="font-medium capitalize">{t(`addMeal.${meal.portionSize}`) || meal.portionSize}</p>
              </div>
            )}

            <div className="space-y-1">
              <div className="flex items-center text-muted-foreground mb-1">
                <Clock className="h-4 w-4 mr-2" />
                <span className="text-xs font-medium uppercase tracking-wider">{t("addMeal.time") || "Time"}</span>
              </div>
              <p className="font-medium">
                {format(new Date(meal.timestamp), "PPp", { locale: dateLocale })}
              </p>
            </div>

            {meal.description && (
              <div className="space-y-1">
                <div className="flex items-center text-muted-foreground mb-1">
                  <AlignLeft className="h-4 w-4 mr-2" />
                  <span className="text-xs font-medium uppercase tracking-wider">{t("addMeal.descriptionField") || "Description"}</span>
                </div>
                <p className="text-sm leading-relaxed">{meal.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Comments Section */}
        <div className="space-y-3 pt-4 border-t mt-4">
            <h3 className="text-sm font-semibold">
              {t("general.comments") || "Comentarios"}
            </h3>
            
            {isLoadingComments && <Skeleton className="h-10 w-full" />}
            
            {comments && comments.length > 0 && (
              <div className="space-y-2">
                {comments.map((c: Comment) => (
                  <div
                    key={c.id}
                    className="rounded-lg bg-secondary p-3 text-sm"
                  >
                    <p className="font-semibold">
                      {c.authorName}{" "}
                      <span className="ml-2 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(c.timestamp), {
                          addSuffix: true,
                          locale: dateLocale,
                        })}
                      </span>
                    </p>
                    <p className="text-foreground/80">{c.text}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Add Comment */}
            <div className="flex gap-2 pt-2">
              <Textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder={t("patientDetail.leaveComment") || "Escribe una respuesta..."}
                className="min-h-[40px] resize-none"
                rows={1}
              />
              <Button onClick={handleSendReply} className="h-[40px]">
                {t("patientDetail.send") || "Enviar"}
              </Button>
            </div>
          </div>

      </DialogContent>
    </Dialog>

    {isLightboxOpen && (
        <div 
            className="fixed inset-0 z-[500] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4"
            onClick={() => setIsLightboxOpen(false)}
        >
            <div 
                className="relative h-full w-full max-h-[90vh] max-w-[90vw]"
                onClick={(e) => e.stopPropagation()}
            >
                <Image
                    src={meal.photoUrl}
                    alt={meal.name}
                    fill
                    className="object-contain"
                />
            </div>
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full z-50"
                onClick={(e) => {
                    e.stopPropagation();
                    setIsLightboxOpen(false);
                }}
            >
                <X className="h-8 w-8" />
                <span className="sr-only">Close</span>
            </Button>
        </div>
    )}
    </>
  );
}
