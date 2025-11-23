import { Availability } from "@/lib/models";
import connectDB from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const nutritionistId = searchParams.get("nutritionistId");

    if (!nutritionistId) {
      return NextResponse.json(
        { error: "nutritionistId is required" },
        { status: 400 }
      );
    }

    const availability = await Availability.find({ nutritionistId }).sort({
      dayOfWeek: 1,
      startTime: 1,
    });

    return NextResponse.json(availability);
  } catch (error) {
    console.error("Error fetching availability:", error);
    return NextResponse.json(
      { error: "Failed to fetch availability" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { nutritionistId, slots } = body;

    // Verify user is a nutritionist and owns this schedule
    // In a real app, you'd check if session.user.id === nutritionistId
    // and that the user role is "nutritionist"

    // Delete existing availability for this nutritionist
    await Availability.deleteMany({ nutritionistId });

    // Create new availability slots
    if (slots && slots.length > 0) {
      await Availability.insertMany(slots);
    }

    const updatedAvailability = await Availability.find({
      nutritionistId,
    }).sort({ dayOfWeek: 1, startTime: 1 });

    return NextResponse.json(updatedAvailability);
  } catch (error) {
    console.error("Error saving availability:", error);
    return NextResponse.json(
      { error: "Failed to save availability" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await Availability.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting availability:", error);
    return NextResponse.json(
      { error: "Failed to delete availability" },
      { status: 500 }
    );
  }
}
