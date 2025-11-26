"use client";
import { useSession } from "next-auth/react";
import useSWR from "swr";

const fetcher = async (url: string, options?: RequestInit) => {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export function useUser() {
  const { data: session, status } = useSession();
  return {
    user: (session?.user as any) || null,
    isUserLoading: status === "loading",
  };
}

export function useMealsByDate(date: Date | undefined) {
  const { user } = useUser();
  const start = date ? new Date(date) : null;
  const end = date ? new Date(date) : null;
  if (start) {
    start.setHours(0, 0, 0, 0);
  }
  if (end) {
    end.setHours(23, 59, 59, 999);
  }
  const shouldFetch = !!user && !!date;
  const { data, error, mutate } = useSWR(
    shouldFetch
      ? `/api/meals?startDate=${start!.toISOString()}&endDate=${end!.toISOString()}`
      : null,
    fetcher
  );
  return {
    meals: data || [],
    isLoading: shouldFetch && !data && !error,
    error,
    mutate,
  };
}

export async function addMeal(payload: any) {
  const res = await fetch("/api/meals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function useComments(mealId: string) {
  const { user } = useUser();
  const { data, error, mutate } = useSWR(
    user && mealId ? `/api/comments?mealId=${mealId}` : null,
    fetcher
  );
  return { comments: data || [], isLoading: !data && !error, error, mutate };
}

export async function addComment(payload: any) {
  const res = await fetch("/api/comments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

import useSWRInfinite from "swr/infinite";

export function useNotifications() {
  const { user } = useUser();
  const limit = 15;

  const getKey = (pageIndex: number, previousPageData: any) => {
    if (!user) return null;
    if (previousPageData && !previousPageData.length) return null; // reached the end
    return `/api/notifications?page=${pageIndex + 1}&limit=${limit}`;
  };

  const { data, error, size, setSize, mutate, isValidating } = useSWRInfinite(
    getKey,
    fetcher,
    { refreshInterval: 10000 }
  );

  const notifications = data ? [].concat(...data) : [];
  const isLoadingInitialData = !data && !error;
  const isLoadingMore =
    isLoadingInitialData ||
    (size > 0 && data && typeof data[size - 1] === "undefined");
  const isEmpty = data?.[0]?.length === 0;
  const isReachingEnd =
    isEmpty || (data && data[data.length - 1]?.length < limit);

  return {
    notifications,
    isLoading: isLoadingInitialData,
    isLoadingMore,
    isReachingEnd,
    size,
    setSize,
    error,
    mutate,
  };
}

export async function markNotificationRead(id: string) {
  const res = await fetch(`/api/notifications?id=${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ read: true }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// User profile hook (by id)
export function useUserProfile(id: string | null | undefined) {
  const shouldFetch = !!id;
  const { data, error, mutate } = useSWR(
    shouldFetch ? `/api/users?id=${id}` : null,
    fetcher
  );
  return {
    profile: data || null,
    isLoading: shouldFetch && !data && !error,
    error,
    mutate,
  };
}

// Patient meals by date (nutritionist view)
export function usePatientMealsByDate(
  patientId: string | undefined,
  date: Date | undefined
) {
  const start = date ? new Date(date) : null;
  const end = date ? new Date(date) : null;
  if (start) start.setHours(0, 0, 0, 0);
  if (end) end.setHours(23, 59, 59, 999);
  const shouldFetch = !!patientId && !!date;
  const { data, error, mutate } = useSWR(
    shouldFetch
      ? `/api/meals?userId=${patientId}&startDate=${start!.toISOString()}&endDate=${end!.toISOString()}`
      : null,
    fetcher
  );
  return {
    meals: data || [],
    isLoading: shouldFetch && !data && !error,
    error,
    mutate,
  };
}

// Weight logs
export function useWeightLogs(userId: string | undefined) {
  const { data, error, mutate } = useSWR(
    userId ? `/api/weightlogs?userId=${userId}` : null,
    fetcher
  );
  return { weightLogs: data || [], isLoading: !data && !error, error, mutate };
}

export async function addWeightLog(payload: {
  date: string;
  weightKg: number;
  userId?: string;
}) {
  const res = await fetch("/api/weightlogs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Water logs
export function useWaterLogs(userId: string | undefined, date: Date | undefined) {
  const start = date ? new Date(date) : null;
  const end = date ? new Date(date) : null;
  if (start) start.setHours(0, 0, 0, 0);
  if (end) end.setHours(23, 59, 59, 999);
  
  const shouldFetch = !!userId && !!date;
  const { data, error, mutate } = useSWR(
    shouldFetch 
      ? `/api/waterlogs?userId=${userId}&startDate=${start!.toISOString()}&endDate=${end!.toISOString()}` 
      : null,
    fetcher
  );
  return { waterLogs: data || [], isLoading: shouldFetch && !data && !error, error, mutate };
}

export function useWaterLogsRange(userId: string | undefined, startDate: Date | undefined, endDate: Date | undefined) {
  const shouldFetch = !!userId && !!startDate && !!endDate;
  const { data, error, mutate } = useSWR(
    shouldFetch 
      ? `/api/waterlogs?userId=${userId}&startDate=${startDate!.toISOString()}&endDate=${endDate!.toISOString()}` 
      : null,
    fetcher
  );
  return { waterLogs: data || [], isLoading: shouldFetch && !data && !error, error, mutate };
}

export async function addWaterLog(payload: {
  date: string;
  quantityMl: number;
  userId: string;
}) {
  const res = await fetch("/api/waterlogs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Activity logs
export function useActivityLogs(userId: string | undefined, date: Date | undefined) {
  const start = date ? new Date(date) : null;
  const end = date ? new Date(date) : null;
  if (start) start.setHours(0, 0, 0, 0);
  if (end) end.setHours(23, 59, 59, 999);

  const shouldFetch = !!userId && !!date;
  const { data, error, mutate } = useSWR(
    shouldFetch
      ? `/api/activities?userId=${userId}&startDate=${start!.toISOString()}&endDate=${end!.toISOString()}`
      : null,
    fetcher
  );
  return { activityLogs: data || [], isLoading: shouldFetch && !data && !error, error, mutate };
}

export async function addActivityLog(payload: {
  date: string;
  activityType: string;
  durationMinutes: number;
  intensity?: string;
  userId: string;
}) {
  const res = await fetch("/api/activities", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Patient records
export function usePatientRecords(patientId: string | undefined) {
  const { data, error, mutate } = useSWR(
    patientId ? `/api/patient-records?patientId=${patientId}` : null,
    fetcher
  );
  return { records: data || [], isLoading: !data && !error, error, mutate };
}

export async function addPatientRecord(payload: {
  patientId: string;
  nutritionistId: string;
  date: Date;
  weightKg?: number;
  // heightCm?: number;
  bodyFatPercentage?: number;
  visceralFatPercentage?: number;
  muscleMassPercentage?: number;
  chestCm?: number;
  waistCm?: number;
  hipsCm?: number;
  notes?: string;
}) {
  const res = await fetch("/api/patient-records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updatePatientRecord(payload: {
  _id: string;
  date?: Date;
  weightKg?: number;
  bodyFatPercentage?: number;
  visceralFatPercentage?: number;
  muscleMassPercentage?: number;
  chestCm?: number;
  waistCm?: number;
  hipsCm?: number;
  notes?: string;
}) {
  const res = await fetch("/api/patient-records", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// List patients for nutritionist
export function usePatients() {
  const { user } = useUser();
  const { data, error, mutate } = useSWR(
    user && (user as any).role === "nutritionist" ? "/api/users" : null,
    fetcher
  );
  return { patients: data || [], isLoading: !data && !error, error, mutate };
}
