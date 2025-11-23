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
    const mealType = searchParams.get("mealType");

    const client = await clientPromise;
    const db = client.db("nutritrack");

    // Build query
    const query: any = {};
    if (nutritionistId) {
      query.nutritionistId = nutritionistId;
    }
    if (mealType) {
      query.mealType = mealType;
    }

    const mealItems = await db
      .collection("mealItems")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    const formattedItems = mealItems.map((item) => ({
      id: item._id.toString(),
      nutritionistId: item.nutritionistId,
      title: item.title,
      description: item.description,
      photoUrl: item.photoUrl,
      videoUrl: item.videoUrl,
      mealType: item.mealType,
      portionInfo: item.portionInfo,
      recommendedTime: item.recommendedTime,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    return NextResponse.json(formattedItems);
  } catch (error) {
    console.error("Error fetching meal items:", error);
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
        { error: "Only nutritionists can create meal items" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      photoUrl,
      videoUrl,
      mealType,
      portionInfo,
      recommendedTime,
    } = body;

    // Validation
    if (!title || !description || !mealType) {
      return NextResponse.json(
        { error: "Title, description, and mealType are required" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const newMealItem = {
      nutritionistId: userProfile._id.toString(),
      title,
      description,
      photoUrl: photoUrl || null,
      videoUrl: videoUrl || null,
      mealType,
      portionInfo: portionInfo || null,
      recommendedTime: recommendedTime || null,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection("mealItems").insertOne(newMealItem);

    return NextResponse.json({
      id: result.insertedId.toString(),
      ...newMealItem,
    });
  } catch (error) {
    console.error("Error creating meal item:", error);
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
        { error: "Meal item ID is required" },
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
    const mealItem = await db
      .collection("mealItems")
      .findOne({ _id: new ObjectId(id) });

    if (!mealItem) {
      return NextResponse.json(
        { error: "Meal item not found" },
        { status: 404 }
      );
    }

    if (mealItem.nutritionistId !== userProfile._id.toString()) {
      return NextResponse.json(
        { error: "You can only edit your own meal items" },
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
      .collection("mealItems")
      .updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    const updated = await db
      .collection("mealItems")
      .findOne({ _id: new ObjectId(id) });

    return NextResponse.json({
      id: updated!._id.toString(),
      nutritionistId: updated!.nutritionistId,
      title: updated!.title,
      description: updated!.description,
      photoUrl: updated!.photoUrl,
      videoUrl: updated!.videoUrl,
      mealType: updated!.mealType,
      portionInfo: updated!.portionInfo,
      recommendedTime: updated!.recommendedTime,
      createdAt: updated!.createdAt,
      updatedAt: updated!.updatedAt,
    });
  } catch (error) {
    console.error("Error updating meal item:", error);
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
        { error: "Meal item ID is required" },
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
    const mealItem = await db
      .collection("mealItems")
      .findOne({ _id: new ObjectId(id) });

    if (!mealItem) {
      return NextResponse.json(
        { error: "Meal item not found" },
        { status: 404 }
      );
    }

    if (mealItem.nutritionistId !== userProfile._id.toString()) {
      return NextResponse.json(
        { error: "You can only delete your own meal items" },
        { status: 403 }
      );
    }

    // Check if meal item is used in any active meal plans
    const usedInPlans = await db.collection("mealPlans").findOne({
      isActive: true,
      $or: [
        { "weekStructure.monday.mealItemId": id },
        { "weekStructure.tuesday.mealItemId": id },
        { "weekStructure.wednesday.mealItemId": id },
        { "weekStructure.thursday.mealItemId": id },
        { "weekStructure.friday.mealItemId": id },
        { "weekStructure.saturday.mealItemId": id },
        { "weekStructure.sunday.mealItemId": id },
      ],
    });

    if (usedInPlans) {
      return NextResponse.json(
        {
          error:
            "Cannot delete meal item that is used in active meal plans",
        },
        { status: 400 }
      );
    }

    await db.collection("mealItems").deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting meal item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
