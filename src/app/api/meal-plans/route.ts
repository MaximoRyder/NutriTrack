import clientPromise from "@/lib/mongodb-client";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");
    const nutritionistId = searchParams.get("nutritionistId");

    const client = await clientPromise;
    const db = client.db("nutritrack");

    // Get user profile
    const userProfile = await db
      .collection("users")
      .findOne({ email: session.user.email });

    if (!userProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Build query based on role and params
    const query: any = {};
    
    if (patientId) {
      query.patientId = patientId;
      // Authorization check for patient
      if (userProfile.role === "patient" && userProfile._id.toString() !== patientId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    
    if (nutritionistId) {
      query.nutritionistId = nutritionistId;
      // Authorization check for nutritionist
      if (userProfile.role === "nutritionist" && userProfile._id.toString() !== nutritionistId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const mealPlans = await db
      .collection("mealPlans")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    const formattedPlans = mealPlans.map((plan) => ({
      id: plan._id.toString(),
      patientId: plan.patientId,
      nutritionistId: plan.nutritionistId,
      templateId: plan.templateId,
      name: plan.name,
      description: plan.description,
      startDate: plan.startDate,
      endDate: plan.endDate,
      weekStructure: plan.weekStructure,
      isActive: plan.isActive,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    }));

    return NextResponse.json(formattedPlans);
  } catch (error) {
    console.error("Error fetching meal plans:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("nutritrack");

    // Get user profile to check role
    const userProfile = await db
      .collection("users")
      .findOne({ email: session.user.email });

    if (!userProfile || userProfile.role !== "nutritionist") {
      return NextResponse.json(
        { error: "Only nutritionists can create meal plans" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      patientId,
      templateId,
      name,
      description,
      startDate,
      endDate,
      weekStructure,
      isActive,
    } = body;

    // Validation
    if (!patientId || !name || !startDate || !weekStructure) {
      return NextResponse.json(
        { error: "PatientId, name, startDate, and weekStructure are required" },
        { status: 400 }
      );
    }

    // Validate patient is assigned to this nutritionist
    const patient = await db
      .collection("users")
      .findOne({ _id: new ObjectId(patientId) });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Convert both to strings for proper comparison
    const nutritionistIdStr = userProfile._id.toString();
    const patientNutritionistId = patient.assignedNutritionistId?.toString();

    if (patientNutritionistId !== nutritionistIdStr) {
      return NextResponse.json(
        { error: "You can only create plans for your assigned patients" },
        { status: 403 }
      );
    }

    // If marking as active, deactivate other plans for this patient
    if (isActive) {
      await db
        .collection("mealPlans")
        .updateMany(
          { patientId, isActive: true },
          { $set: { isActive: false, updatedAt: new Date().toISOString() } }
        );
    }

    // Denormalize meal item data for performance
    const denormalizedWeekStructure: any = {};
    for (const day of Object.keys(weekStructure)) {
      denormalizedWeekStructure[day] = [];
      for (const slot of weekStructure[day]) {
          const denormalizedSlot: any = {
          mealItemId: slot.mealItemId,
          mealType: slot.mealType,
          notes: slot.notes || null,
          isFlexible: slot.isFlexible,
          customName: slot.customName,
          components: slot.components,
        };

        // If there's a meal item, fetch and denormalize its data
        if (slot.mealItemId) {
          const mealItem = await db
            .collection("mealItems")
            .findOne({ _id: new ObjectId(slot.mealItemId) });

          if (mealItem) {
            denormalizedSlot.mealItem = {
              title: mealItem.title,
              description: mealItem.description,
              photoUrl: mealItem.photoUrl || null,
              videoUrl: mealItem.videoUrl || null,
              portionInfo: mealItem.portionInfo || null,
              recommendedTime: mealItem.recommendedTime || null,
            };
          }
        }

        denormalizedWeekStructure[day].push(denormalizedSlot);
      }
    }

    const now = new Date().toISOString();
    const newMealPlan = {
      patientId,
      nutritionistId: userProfile._id.toString(),
      templateId: templateId || null,
      name,
      description: description || null,
      startDate,
      endDate: endDate || null,
      weekStructure: denormalizedWeekStructure,
      isActive: isActive || false,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection("mealPlans").insertOne(newMealPlan);

    return NextResponse.json({
      id: result.insertedId.toString(),
      ...newMealPlan,
    });
  } catch (error) {
    console.error("Error creating meal plan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Meal plan ID is required" },
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

    // Check ownership
    const mealPlan = await db
      .collection("mealPlans")
      .findOne({ _id: new ObjectId(id) });

    if (!mealPlan) {
      return NextResponse.json(
        { error: "Meal plan not found" },
        { status: 404 }
      );
    }

    if (mealPlan.nutritionistId !== userProfile._id.toString()) {
      return NextResponse.json(
        { error: "You can only edit your own meal plans" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // If marking as active, deactivate other plans for this patient
    if (body.isActive === true && !mealPlan.isActive) {
      await db
        .collection("mealPlans")
        .updateMany(
          { patientId: mealPlan.patientId, isActive: true, _id: { $ne: new ObjectId(id) } },
          { $set: { isActive: false, updatedAt: new Date().toISOString() } }
        );
    }

    const updateData: any = {
      ...body,
      updatedAt: new Date().toISOString(),
    };

    // Remove fields that shouldn't be updated
    delete updateData.id;
    delete updateData.patientId;
    delete updateData.nutritionistId;
    delete updateData.createdAt;

    await db
      .collection("mealPlans")
      .updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    const updated = await db
      .collection("mealPlans")
      .findOne({ _id: new ObjectId(id) });

    return NextResponse.json({
      id: updated!._id.toString(),
      patientId: updated!.patientId,
      nutritionistId: updated!.nutritionistId,
      templateId: updated!.templateId,
      name: updated!.name,
      description: updated!.description,
      startDate: updated!.startDate,
      endDate: updated!.endDate,
      weekStructure: updated!.weekStructure,
      isActive: updated!.isActive,
      createdAt: updated!.createdAt,
      updatedAt: updated!.updatedAt,
    });
  } catch (error) {
    console.error("Error updating meal plan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Meal plan ID is required" },
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

    // Check ownership
    const mealPlan = await db
      .collection("mealPlans")
      .findOne({ _id: new ObjectId(id) });

    if (!mealPlan) {
      return NextResponse.json(
        { error: "Meal plan not found" },
        { status: 404 }
      );
    }

    if (mealPlan.nutritionistId !== userProfile._id.toString()) {
      return NextResponse.json(
        { error: "You can only delete your own meal plans" },
        { status: 403 }
      );
    }

    await db.collection("mealPlans").deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting meal plan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
