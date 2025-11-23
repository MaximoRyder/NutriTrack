import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { User } from "@/lib/models";
import connectDB from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    await connectDB();

    // Get current user's profile
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: user._id.toString(),
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      photoUrl: user.photoUrl,
      createdAt: user.createdAt,
      assignedNutritionistId: user.assignedNutritionistId?.toString() || null,
      goalWeightKg: user.goalWeightKg,
      currentWeightKg: user.currentWeightKg,
      heightCm: user.heightCm,
      activityLevel: user.activityLevel,
      dietaryPreferences: user.dietaryPreferences,
      healthConditions: user.healthConditions,
      subscriptionStatus: user.subscriptionStatus || null,
      invitationCode: user.invitationCode || null,
      specialty: user.specialty || null,
      dateOfBirth: user.dateOfBirth || null,
      bodyMeasurements: user.bodyMeasurements || null,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message },
      { status: 500 }
    );
  }
}
