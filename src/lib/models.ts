import mongoose, { Document, Schema, model, models } from "mongoose";
import type { UserRole } from "./types";

export interface IUser extends Document {
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
  createdAt: Date;
  photoUrl?: string;
  dateOfBirth?: Date;
  // Patient fields
  assignedNutritionistId?: mongoose.Types.ObjectId;
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
  bodyFatPercentage?: number;
  visceralFatPercentage?: number;
  muscleMassPercentage?: number;
  // Nutritionist fields
  subscriptionStatus?: "active" | "inactive" | "trial" | "pending";
  invitationCode?: string;
  specialty?: string;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  displayName: { type: String, required: true },
  role: {
    type: String,
    enum: ["patient", "nutritionist", "admin"],
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
  photoUrl: String,
  dateOfBirth: Date,
  assignedNutritionistId: { type: Schema.Types.ObjectId, ref: "User" },
  goalWeightKg: Number,
  currentWeightKg: Number,
  heightCm: Number,
  activityLevel: {
    type: String,
    enum: ["sedentary", "light", "moderate", "active", "very_active"],
  },
  dietaryPreferences: {
    type: String,
    enum: ["omnivore", "vegetarian", "vegan", "pescetarian"],
  },
  healthConditions: String,
  bodyMeasurements: {
    waist: Number,
    hips: Number,
    chest: Number,
  },
  bodyFatPercentage: Number,
  visceralFatPercentage: Number,
  muscleMassPercentage: Number,
  subscriptionStatus: {
    type: String,
    enum: ["active", "inactive", "trial", "pending"],
  },
  invitationCode: String,
  specialty: String,
});

export const User = models.User || model<IUser>("User", UserSchema);

export interface IMeal extends Document {
  userId: mongoose.Types.ObjectId;
  mealType: "breakfast" | "lunch" | "snack" | "dinner" | "other";
  name: string;
  description?: string;
  timestamp: Date;
  photoUrl: string;
  portionSize?: "small" | "medium" | "large" | "half";
}

const MealSchema = new Schema<IMeal>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  mealType: {
    type: String,
    enum: ["breakfast", "lunch", "snack", "dinner", "other"],
    required: true,
  },
  name: { type: String, required: true },
  description: String,
  timestamp: { type: Date, required: true },
  photoUrl: { type: String, required: true },
  portionSize: { type: String, enum: ["small", "medium", "large", "half"] },
});

export const Meal = models.Meal || model<IMeal>("Meal", MealSchema);

export interface IComment extends Document {
  mealId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  authorName: string;
  text: string;
  timestamp: Date;
}

const CommentSchema = new Schema<IComment>({
  mealId: { type: Schema.Types.ObjectId, ref: "Meal", required: true },
  authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  authorName: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

export const Comment =
  models.Comment || model<IComment>("Comment", CommentSchema);

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  mealId: mongoose.Types.ObjectId;
  commentId: mongoose.Types.ObjectId;
  fromId: mongoose.Types.ObjectId;
  fromName: string;
  textPreview: string;
  createdAt: Date;
  read: boolean;
  type: "meal-comment";
}

const NotificationSchema = new Schema<INotification>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  mealId: { type: Schema.Types.ObjectId, ref: "Meal", required: true },
  commentId: { type: Schema.Types.ObjectId, ref: "Comment", required: true },
  fromId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  fromName: { type: String, required: true },
  textPreview: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
  type: { type: String, enum: ["meal-comment"], required: true },
});

export const Notification =
  models.Notification ||
  model<INotification>("Notification", NotificationSchema);

export interface IWeightLog extends Document {
  userId: mongoose.Types.ObjectId;
  date: Date;
  weightKg: number;
}

const WeightLogSchema = new Schema<IWeightLog>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, required: true },
  weightKg: { type: Number, required: true },
});

export const WeightLog =
  models.WeightLog || model<IWeightLog>("WeightLog", WeightLogSchema);

export interface IWaterLog extends Document {
  userId: mongoose.Types.ObjectId;
  date: Date;
  quantityMl: number;
}

const WaterLogSchema = new Schema<IWaterLog>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, required: true },
  quantityMl: { type: Number, required: true },
});

export const WaterLog =
  models.WaterLog || model<IWaterLog>("WaterLog", WaterLogSchema);

export interface IActivityLog extends Document {
  userId: mongoose.Types.ObjectId;
  activityType: string;
  durationMinutes: number;
  intensity?: "low" | "medium" | "high";
  date: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  activityType: { type: String, required: true },
  durationMinutes: { type: Number, required: true },
  intensity: { type: String, enum: ["low", "medium", "high"] },
  date: { type: Date, required: true },
});

export const ActivityLog =
  models.ActivityLog || model<IActivityLog>("ActivityLog", ActivityLogSchema);

export interface IMealPlan extends Document {
  userId: mongoose.Types.ObjectId;
  authorNutritionistId: mongoose.Types.ObjectId;
  title: string;
  startDate: Date;
  planData: string;
}

const MealPlanSchema = new Schema<IMealPlan>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  authorNutritionistId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: { type: String, required: true },
  startDate: { type: Date, required: true },
  planData: { type: String, required: true },
});

export const MealPlan =
  models.MealPlan || model<IMealPlan>("MealPlan", MealPlanSchema);

export interface ISnippet extends Document {
  userId: mongoose.Types.ObjectId;
  shortcut: string;
  text: string;
}

const SnippetSchema = new Schema<ISnippet>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  shortcut: { type: String, required: true },
  text: { type: String, required: true },
});

export const Snippet =
  models.Snippet || model<ISnippet>("Snippet", SnippetSchema);

export interface IAvailability extends Document {
  nutritionistId: mongoose.Types.ObjectId;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  slotDuration: number; // minutes
}

const AvailabilitySchema = new Schema<IAvailability>({
  nutritionistId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  slotDuration: { type: Number, required: true },
});

export const Availability =
  models.Availability || model<IAvailability>("Availability", AvailabilitySchema);

export interface IAppointment extends Document {
  nutritionistId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  date: Date;
  duration: number; // minutes
  status: "pending" | "confirmed" | "cancelled" | "completed";
  type: "initial" | "followup" | "checkup";
  notes?: string;
  createdAt: Date;
}

const AppointmentSchema = new Schema<IAppointment>({
  nutritionistId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  patientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, required: true },
  duration: { type: Number, required: true },
  status: {
    type: String,
    enum: ["pending", "confirmed", "cancelled", "completed"],
    default: "pending",
  },
  type: {
    type: String,
    enum: ["initial", "followup", "checkup"],
    required: true,
  },
  notes: String,
  createdAt: { type: Date, default: Date.now },
});

export const Appointment =
  models.Appointment || model<IAppointment>("Appointment", AppointmentSchema);

export interface IPatientRecord extends Document {
  patientId: mongoose.Types.ObjectId;
  nutritionistId: mongoose.Types.ObjectId;
  date: Date;
  weightKg: number;
  heightCm: number;
  bodyFatPercentage?: number;
  visceralFatPercentage?: number;
  muscleMassPercentage?: number;
  notes?: string;
  createdAt: Date;
}

const PatientRecordSchema = new Schema<IPatientRecord>({
  patientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  nutritionistId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, required: true },
  weightKg: { type: Number, required: true },
  heightCm: { type: Number, required: true },
  bodyFatPercentage: Number,
  visceralFatPercentage: Number,
  muscleMassPercentage: Number,
  notes: String,
  createdAt: { type: Date, default: Date.now },
});

export const PatientRecord =
  models.PatientRecord ||
  model<IPatientRecord>("PatientRecord", PatientRecordSchema);
