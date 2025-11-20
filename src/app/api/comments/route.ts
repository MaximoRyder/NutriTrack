import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Comment, Meal, Notification, User } from "@/lib/models";
import connectDB from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const mealId = searchParams.get("mealId");
    if (!mealId)
      return NextResponse.json({ error: "mealId requerido" }, { status: 400 });
    await connectDB();
    const comments = await Comment.find({ mealId }).sort({ timestamp: 1 });
    return NextResponse.json(
      comments.map((c) => ({
        id: c._id.toString(),
        mealId: c.mealId.toString(),
        authorId: c.authorId.toString(),
        authorName: c.authorName,
        text: c.text,
        timestamp: c.timestamp.toISOString(),
      }))
    );
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    const body = await request.json();
    const { mealId, text } = body;
    if (!mealId || !text)
      return NextResponse.json({ error: "Campos faltantes" }, { status: 400 });
    await connectDB();
    const authorId = (session.user as any).id;
    const authorName = (session.user as any).name || "Usuario";
    const comment = await Comment.create({
      mealId,
      authorId,
      authorName,
      text,
      timestamp: new Date(),
    });

    // Crear notificación si el autor es nutritionist y el meal pertenece a un paciente distinto
    const meal = await Meal.findById(mealId);
    if (meal) {
      const patientUser = await User.findById(meal.userId);
      if (
        patientUser &&
        (session.user as any).role === "nutritionist" &&
        patientUser._id.toString() !== authorId
      ) {
        await Notification.create({
          userId: patientUser._id,
          mealId: meal._id,
          commentId: comment._id,
          fromId: authorId,
          fromName: authorName,
          textPreview: text.slice(0, 80),
          createdAt: new Date(),
          read: false,
          type: "meal-comment",
        });
      }
    }

    return NextResponse.json({
      id: comment._id.toString(),
      mealId: comment.mealId.toString(),
      authorId: comment.authorId.toString(),
      authorName: comment.authorName,
      text: comment.text,
      timestamp: comment.timestamp.toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
