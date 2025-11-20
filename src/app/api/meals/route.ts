import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Meal } from "@/lib/models";
import connectDB from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || (session.user as any).id;
    const id = searchParams.get("id");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    await connectDB();
    if (id) {
      const meal = await Meal.findById(id);
      if (!meal)
        return NextResponse.json({ error: "No encontrado" }, { status: 404 });
      return NextResponse.json({
        id: meal._id.toString(),
        userId: meal.userId.toString(),
        mealType: meal.mealType,
        name: meal.name,
        description: meal.description,
        timestamp: meal.timestamp.toISOString(),
        photoUrl: meal.photoUrl,
        portionSize: meal.portionSize,
      });
    }

    const query: any = { userId };
    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const meals = await Meal.find(query).sort({ timestamp: -1 });

    return NextResponse.json(
      meals.map((m) => ({
        id: m._id.toString(),
        userId: m.userId.toString(),
        mealType: m.mealType,
        name: m.name,
        description: m.description,
        timestamp: m.timestamp.toISOString(),
        photoUrl: m.photoUrl,
        portionSize: m.portionSize,
      }))
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();
    await connectDB();

    const meal = await Meal.create({
      ...body,
      userId: (session.user as any).id,
      timestamp: new Date(body.timestamp),
    });

    return NextResponse.json({
      id: meal._id.toString(),
      userId: meal.userId.toString(),
      mealType: meal.mealType,
      name: meal.name,
      description: meal.description,
      timestamp: meal.timestamp.toISOString(),
      photoUrl: meal.photoUrl,
      portionSize: meal.portionSize,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id)
      return NextResponse.json({ error: "id requerido" }, { status: 400 });
    const body = await request.json();
    await connectDB();
    const updated = await Meal.findOneAndUpdate(
      { _id: id, userId: (session.user as any).id },
      { $set: { ...body, timestamp: new Date(body.timestamp) } },
      { new: true }
    );
    if (!updated)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id)
      return NextResponse.json({ error: "id requerido" }, { status: 400 });
    await connectDB();
    const deleted = await Meal.findOneAndDelete({
      _id: id,
      userId: (session.user as any).id,
    });
    if (!deleted)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
