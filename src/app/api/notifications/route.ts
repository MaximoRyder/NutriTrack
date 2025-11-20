import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import { Notification } from '@/lib/models';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const readParam = searchParams.get('read');
    const filter: any = { userId: (session.user as any).id };
    if (readParam === 'false') filter.read = false;
    await connectDB();
    const notifications = await Notification.find(filter).sort({ createdAt: -1 }).limit(50);
    return NextResponse.json(notifications.map(n => ({
      id: n._id.toString(),
      mealId: n.mealId.toString(),
      commentId: n.commentId.toString(),
      fromId: n.fromId.toString(),
      fromName: n.fromName,
      textPreview: n.textPreview,
      createdAt: n.createdAt.toISOString(),
      read: n.read,
      type: n.type,
    })));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });
    const body = await request.json();
    await connectDB();
    const updated = await Notification.findOneAndUpdate({ _id: id, userId: (session.user as any).id }, { $set: body }, { new: true });
    if (!updated) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
