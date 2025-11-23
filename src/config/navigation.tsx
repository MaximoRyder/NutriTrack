import {
    Activity,
    AreaChart,
    BookCopy,
    BookTemplate,
    Calendar,
    LayoutDashboard,
    Shield,
    Stethoscope,
    Users,
    Utensils
} from "lucide-react";

export const getNavigation = (t: (key: string) => string) => {
  const patientNav = [
    { name: t("sidebar.overview"), href: "/overview", icon: LayoutDashboard },
    { name: t("sidebar.foodJournal"), href: "/journal", icon: Calendar },
    { name: t("sidebar.activityLog"), href: "/activities", icon: Activity },
    { name: t("sidebar.myProgress"), href: "/progress", icon: AreaChart },
    { name: t("sidebar.mealPlan"), href: "/plan", icon: BookCopy },
    {
      name: t("sidebar.myNutritionist"),
      href: "/nutritionist",
      icon: Stethoscope,
    },
  ];

  const nutritionistNav = [
    { name: t("sidebar.overview"), href: "/overview", icon: LayoutDashboard },
    { name: t("sidebar.myPatients"), href: "/patients", icon: Users },
    { name: t("sidebar.mealItems"), href: "/meal-items", icon: Utensils },
    { name: t("sidebar.mealTemplates"), href: "/meal-plan-templates", icon: BookTemplate },
  ];

  const adminNav = [
    { name: t("sidebar.overview"), href: "/overview", icon: LayoutDashboard },
    { name: t("sidebar.userManagement"), href: "/admin", icon: Shield },
  ];

  return { patientNav, nutritionistNav, adminNav };
};
