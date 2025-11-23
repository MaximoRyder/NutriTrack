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
    const nutritionistId = searchParams.get("nutritionistId");

    const client = await clientPromise;
    const db = client.db("nutritrack");

    // Build query
    const query: any = {};
    if (nutritionistId) {
      query.nutritionistId = nutritionistId;
    }

    const templates = await db
      .collection("mealPlanTemplates")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    const formattedTemplates = templates.map((template) => ({
      id: template._id.toString(),
      nutritionistId: template.nutritionistId,
      name: template.name,
      description: template.description,
      weekStructure: template.weekStructure,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    }));

    return NextResponse.json(formattedTemplates);
  } catch (error) {
    console.error("Error fetching meal plan templates:", error);
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
        { error: "Only nutritionists can create meal plan templates" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, weekStructure } = body;

    // Validation
    if (!name || !weekStructure) {
      return NextResponse.json(
        { error: "Name and weekStructure are required" },
        { status: 400 }
      );
    }

    // Validate weekStructure has all days
    const requiredDays = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];
    for (const day of requiredDays) {
      if (!weekStructure[day] || !Array.isArray(weekStructure[day])) {
        return NextResponse.json(
          { error: `weekStructure must include ${day} as an array` },
          { status: 400 }
        );
      }
    }

    const now = new Date().toISOString();
    const newTemplate = {
      nutritionistId: userProfile._id.toString(),
      name,
      description: description || null,
      weekStructure,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db
      .collection("mealPlanTemplates")
      .insertOne(newTemplate);

    return NextResponse.json({
      id: result.insertedId.toString(),
      ...newTemplate,
    });
  } catch (error) {
    console.error("Error creating meal plan template:", error);
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
        { error: "Template ID is required" },
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
    const template = await db
      .collection("mealPlanTemplates")
      .findOne({ _id: new ObjectId(id) });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    if (template.nutritionistId !== userProfile._id.toString()) {
      return NextResponse.json(
        { error: "You can only edit your own templates" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updateData: any = {
      ...body,
      updatedAt: new Date().toISOString(),
    };

    // Remove fields that shouldn't be updated
    delete updateData.id;
    delete updateData.nutritionistId;
    delete updateData.createdAt;

    await db
      .collection("mealPlanTemplates")
      .updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    const updated = await db
      .collection("mealPlanTemplates")
      .findOne({ _id: new ObjectId(id) });

    return NextResponse.json({
      id: updated!._id.toString(),
      nutritionistId: updated!.nutritionistId,
      name: updated!.name,
      description: updated!.description,
      weekStructure: updated!.weekStructure,
      createdAt: updated!.createdAt,
      updatedAt: updated!.updatedAt,
    });
  } catch (error) {
    console.error("Error updating meal plan template:", error);
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
        { error: "Template ID is required" },
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
    const template = await db
      .collection("mealPlanTemplates")
      .findOne({ _id: new ObjectId(id) });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    if (template.nutritionistId !== userProfile._id.toString()) {
      return NextResponse.json(
        { error: "You can only delete your own templates" },
        { status: 403 }
      );
    }

    await db
      .collection("mealPlanTemplates")
      .deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting meal plan template:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
