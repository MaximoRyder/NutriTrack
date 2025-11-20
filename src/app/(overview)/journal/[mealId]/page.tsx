"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { addComment, useComments, useUser } from "@/lib/data-hooks";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import type { Comment, Meal } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";

export default function MealDetailPage() {
  const params = useParams();
  const mealId = params.mealId as string;
  const searchParams = useSearchParams();
  const { user } = useUser();
  const { t } = useTranslation();
  const [reply, setReply] = useState("");

  // Meal doc
  const { data: meal, isLoading: isLoadingMeal } = useSWR<Meal>(
    user ? `/api/meals?id=${mealId}` : null,
    async (url: string) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    }
  );

  // Comments
  const {
    comments,
    isLoading: isLoadingComments,
    mutate,
  } = useComments(mealId);

  // Mark notification as read if coming via bell with a commentId (handled earlier) - placeholder here.

  const handleSendReply = async () => {
    if (!reply.trim()) return;
    await addComment({ mealId, text: reply });
    setReply("");
    mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/journal">
            <ArrowLeft className="h-4 w-4 mr-1" />{" "}
            {t("general.back") || "Volver"}
          </Link>
        </Button>
        {searchParams.get("fromNotification") && (
          <span className="text-xs rounded bg-primary/10 px-2 py-1 text-primary">
            Notificación
          </span>
        )}
      </div>
      <Card>
        {isLoadingMeal && <Skeleton className="h-64 w-full" />}
        {meal && (
          <>
            <CardHeader>
              <CardTitle>{meal.name}</CardTitle>
              <CardDescription className="capitalize">
                {meal.mealType}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative h-64 w-full overflow-hidden rounded-md">
                <Image
                  src={meal.photoUrl}
                  alt={meal.name}
                  fill
                  className="object-cover"
                />
              </div>
              {meal.description && (
                <p className="text-muted-foreground">{meal.description}</p>
              )}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Comentarios</h3>
                {isLoadingComments && <Skeleton className="h-10 w-full" />}
                {comments &&
                  comments.map((c: Comment) => (
                    <div
                      key={c.id}
                      className="rounded-lg bg-secondary p-3 text-sm"
                    >
                      <p className="font-semibold">
                        {c.authorName}{" "}
                        <span className="ml-2 text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(c.timestamp), {
                            addSuffix: true,
                          })}
                        </span>
                      </p>
                      <p className="text-foreground/80">{c.text}</p>
                    </div>
                  ))}
                <div className="flex gap-2 pt-2">
                  <Textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Escribe una respuesta..."
                    className="h-20"
                  />
                  <Button onClick={handleSendReply}>
                    {t("patientDetail.send") || "Enviar"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
