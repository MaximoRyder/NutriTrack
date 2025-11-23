"use client";

import { CreateMealItemDialog } from "@/components/create-meal-item-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import type { MealItem } from "@/lib/types";
import { Clock, Edit2, Image as ImageIcon, Plus, Search, Trash2, Video } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function MealItemsPage() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const [mealItems, setMealItems] = useState<MealItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MealItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [mealTypeFilter, setMealTypeFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<MealItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<MealItem | null>(null);

  useEffect(() => {
    fetchMealItems();
  }, []);

  useEffect(() => {
    filterItems();
  }, [searchQuery, mealTypeFilter, mealItems]);

  const fetchMealItems = async () => {
    try {
      const response = await fetch("/api/meal-items");
      if (response.ok) {
        const data = await response.json();
        setMealItems(data);
      }
    } catch (error) {
      console.error("Error fetching meal items:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = [...mealItems];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query)
      );
    }

    if (mealTypeFilter !== "all") {
      filtered = filtered.filter((item) => item.mealType === mealTypeFilter);
    }

    setFilteredItems(filtered);
  };

  const handleCreateMealItem = async (data: Partial<MealItem>) => {
    try {
      const response = await fetch("/api/meal-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        fetchMealItems();
        setIsDialogOpen(false);
      }
    } catch (error) {
      console.error("Error creating meal item:", error);
    }
  };

  const handleUpdateMealItem = async (data: Partial<MealItem>) => {
    if (!itemToEdit) return;

    try {
      const response = await fetch(`/api/meal-items?id=${itemToEdit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        fetchMealItems();
        setIsDialogOpen(false);
        setItemToEdit(null);
      }
    } catch (error) {
      console.error("Error updating meal item:", error);
    }
  };

  const handleDeleteMealItem = async () => {
    if (!itemToDelete) return;

    try {
      const response = await fetch(`/api/meal-items?id=${itemToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchMealItems();
        setItemToDelete(null);
      } else {
        const error = await response.json();
        alert(error.error || t("mealLibrary.deleteError"));
      }
    } catch (error) {
      console.error("Error deleting meal item:", error);
      alert(t("mealLibrary.deleteError"));
    }
  };

  const getMealTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      breakfast: t("addMeal.breakfast"),
      lunch: t("addMeal.lunch"),
      dinner: t("addMeal.dinner"),
      snack: t("addMeal.snack"),
      other: t("addMeal.other"),
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t("mealLibrary.title")}</h1>
          <p className="text-muted-foreground">
            {t("mealLibrary.subtitle")}
          </p>
        </div>
        <Button
          onClick={() => {
            setItemToEdit(null);
            setIsDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("mealLibrary.createMeal")}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("mealLibrary.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={mealTypeFilter} onValueChange={setMealTypeFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder={t("mealLibrary.filterType")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("mealLibrary.filterAll")}</SelectItem>
            <SelectItem value="breakfast">{t("addMeal.breakfast")}</SelectItem>
            <SelectItem value="lunch">{t("addMeal.lunch")}</SelectItem>
            <SelectItem value="dinner">{t("addMeal.dinner")}</SelectItem>
            <SelectItem value="snack">{t("addMeal.snack")}</SelectItem>
            <SelectItem value="other">{t("addMeal.other")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Meal Items Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t("mealLibrary.loading")}</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              {searchQuery || mealTypeFilter !== "all"
                ? t("mealLibrary.noResults")
                : t("mealLibrary.emptyState")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <Card key={item.id} className="overflow-hidden flex flex-col">
              <div className="relative aspect-video bg-muted">
                {item.photoUrl ? (
                  <Image
                    src={item.photoUrl}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <ImageIcon className="h-10 w-10" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="shadow-sm">
                    {getMealTypeLabel(item.mealType)}
                  </Badge>
                </div>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="line-clamp-1" title={item.title}>
                  {item.title}
                </CardTitle>
                <CardDescription className="line-clamp-2" title={item.description}>
                  {item.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 pb-4">
                <div className="space-y-2 text-sm text-muted-foreground">
                  {item.recommendedTime && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {item.recommendedTime}
                    </div>
                  )}
                  <CardDescription className="space-y-1">
                    {item.portionInfo && (
                      <div className="flex items-center gap-1 text-xs">
                        <span className="font-medium">{t("mealLibrary.portionLabel")}</span>
                        {item.portionInfo}
                      </div>
                    )}
                  </CardDescription>
                </div>

                <div className="flex gap-2 mt-3">
                  {item.photoUrl && (
                    <Badge variant="outline" className="text-xs">
                      <ImageIcon className="h-3 w-3 mr-1" />
                      {t("mealLibrary.photoBadge")}
                    </Badge>
                  )}
                  {item.videoUrl && (
                    <Badge variant="outline" className="text-xs">
                      <Video className="h-3 w-3 mr-1" />
                      {t("mealLibrary.videoBadge")}
                    </Badge>
                  )}
                </div>
              </CardContent>
              <div className="p-4 pt-0 mt-auto flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setItemToEdit(item);
                    setIsDialogOpen(true);
                  }}
                >
                  <Edit2 className="h-4 w-4 mr-1" />
                  {t("mealLibrary.editButton")}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setItemToDelete(item)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CreateMealItemDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={itemToEdit ? handleUpdateMealItem : handleCreateMealItem}
        mealItemToEdit={itemToEdit}
      />

      <AlertDialog
        open={!!itemToDelete}
        onOpenChange={(open) => !open && setItemToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("mealLibrary.deleteDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("mealLibrary.deleteDialog.description").replace("{title}", itemToDelete?.title || "")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("mealLibrary.deleteDialog.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMealItem}>
              {t("mealLibrary.deleteDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
