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
import { formatDistanceToNow } from "date-fns";
import { enUS, es, pt } from "date-fns/locale";
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div>
            <DialogTitle className="text-2xl">{meal.name}</DialogTitle>
            <p className="text-sm text-muted-foreground capitalize mt-1">
              {getMealTypeTranslation(meal.mealType)}
            </p>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Meal Image */}
          <div className="relative h-64 w-full overflow-hidden rounded-md">
            <Image
              src={meal.photoUrl}
              alt={meal.name}
              fill
              className="object-cover"
            />
          </div>

          {/* Meal Description */}
          {meal.description && (
            <p className="text-muted-foreground">{meal.description}</p>
          )}

          {/* Comments Section */}
          <div className="space-y-3 pt-4 border-t">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
