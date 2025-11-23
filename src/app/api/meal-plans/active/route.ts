import clientPromise from "@/lib/mongodb-client";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json(
        { error: "Patient ID is required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("nutritrack");

    // Get user profile
    const userProfile = await db
      .collection("users")
      .findOne({ email: session.user.email });

    if (!userProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Authorization: patient can only see their own, nutritionist can see their patients'
    if (userProfile.role === "patient") {
      if (userProfile._id.toString() !== patientId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (userProfile.role === "nutritionist") {
      const patient = await db
        .collection("users")
        .findOne({ _id: new ObjectId(patientId) });
      
      // Convert both to strings for comparison
      const nutritionistIdStr = userProfile._id.toString();
      const patientNutritionistId = patient?.assignedNutritionistId?.toString();
      
      if (!patient || patientNutritionistId !== nutritionistIdStr) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Get active meal plan
    const activePlan = await db
      .collection("mealPlans")
      .findOne({ patientId, isActive: true });

    if (!activePlan) {
      return NextResponse.json({ activePlan: null });
    }

    return NextResponse.json({
      activePlan: {
        id: activePlan._id.toString(),
        patientId: activePlan.patientId,
        nutritionistId: activePlan.nutritionistId,
        templateId: activePlan.templateId,
        name: activePlan.name,
        description: activePlan.description,
        startDate: activePlan.startDate,
        endDate: activePlan.endDate,
        weekStructure: activePlan.weekStructure,
        isActive: activePlan.isActive,
        createdAt: activePlan.createdAt,
        updatedAt: activePlan.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching active meal plan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
