// Type definitions for NutriTrack application
// MongoDB-based architecture with NextAuth

export type UserRole = "patient" | "nutritionist" | "admin";

export interface UserProfile {
  id: string; // MongoDB _id converted to string
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string; // ISO String
  photoUrl?: string;
  dateOfBirth?: string; // ISO String for date

  // Patient-specific fields
  assignedNutritionistId?: string;
  goalWeightKg?: number;
  currentWeightKg?: number;
  heightCm?: number;
  activityLevel?: "sedentary" | "light" | "moderate" | "active" | "very_active";
  dietaryPreferences?: "omnivore" | "vegetarian" | "vegan" | "pescetarian";
  healthConditions?: string;
  bodyMeasurements?: {
    waist?: number;
    hips?: number;
    chest?: number;
  };

  // Nutritionist-specific fields
  subscriptionStatus?: "active" | "inactive" | "trial" | "pending";
  invitationCode?: string;
  specialty?: string;
}

export interface Meal {
  id: string;
  userId: string; // Denormalized for rules, but path is king
  mealType: "breakfast" | "lunch" | "snack" | "dinner" | "other";
  name: string;
  description?: string;
  timestamp: string; // ISO String for exact time
  photoUrl: string;
  portionSize?: "small" | "medium" | "large" | "half";
}

export interface Comment {
  id: string;
  authorId: string; // UID of patient or nutritionist
  authorName: string; // Denormalized for easy display
  text: string;
  timestamp: string; // ISO String
}

export interface WeightLog {
  id: string;
  userId: string;
  date: string; // ISO String
  weightKg: number;
}

export interface WaterLog {
  id: string;
  userId: string;
  date: string; // ISO String
  quantityMl: number;
}

export interface ActivityLog {
  id: string;
  userId: string;
  activityType: string;
  durationMinutes: number;
  intensity?: "low" | "medium" | "high";
  date: string; // ISO String
}

export interface MealItem {
  id: string;
  _id?: string;
  nutritionistId: string;
  title: string;
  description: string;
  photoUrl?: string;
  videoUrl?: string;
  mealType: "breakfast" | "lunch" | "snack" | "dinner" | "other";
  portionInfo?: string;
  recommendedTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DayMealSlot {
  mealItemId: string | null;
  mealType: "breakfast" | "lunch" | "snack" | "dinner" | "other";
  notes?: string;
}

export interface MealPlanTemplate {
  id: string;
  nutritionistId: string;
  name: string;
  description?: string;
  weekStructure: {
    monday: DayMealSlot[];
    tuesday: DayMealSlot[];
    wednesday: DayMealSlot[];
    thursday: DayMealSlot[];
    friday: DayMealSlot[];
    saturday: DayMealSlot[];
    sunday: DayMealSlot[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface AssignedDayMealSlot extends DayMealSlot {
  mealItem?: {
    title: string;
    description: string;
    photoUrl?: string;
    videoUrl?: string;
    portionInfo?: string;
    recommendedTime?: string;
  };
}

export interface MealPlan {
  id: string;
  patientId: string;
  nutritionistId: string;
  templateId?: string;
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  weekStructure: {
    monday: AssignedDayMealSlot[];
    tuesday: AssignedDayMealSlot[];
    wednesday: AssignedDayMealSlot[];
    thursday: AssignedDayMealSlot[];
    friday: AssignedDayMealSlot[];
    saturday: AssignedDayMealSlot[];
    sunday: AssignedDayMealSlot[];
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Snippet {
  id: string;
  userId: string; // The nutritionist who owns this
  shortcut: string;
  text: string;
}

// Notification triggered when a nutritionist comments on a patient's meal
export interface Notification {
  id: string;
  userId: string; // Patient who will receive it
  mealId: string;
  commentId: string;
  fromId: string; // Nutritionist UID
  fromName: string; // Denormalized
  textPreview: string; // Short preview of comment
  createdAt: string; // ISO
  read: boolean;
  type: "meal-comment";
}
