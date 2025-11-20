import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import { WeightLog } from '@/lib/models';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || (session.user as any).id;
    await connectDB();
    const logs = await WeightLog.find({ userId }).sort({ date: 1 }).limit(100);
    return NextResponse.json(logs.map(l => ({ id: l._id.toString(), userId: l.userId.toString(), date: l.date.toISOString(), weightKg: l.weightKg })));
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    const body = await request.json();
    const { date, weightKg, userId } = body;
    if (!date || !weightKg) return NextResponse.json({ error: 'Campos faltantes' }, { status: 400 });
    await connectDB();
    const log = await WeightLog.create({ userId: userId || (session.user as any).id, date: new Date(date), weightKg });
    return NextResponse.json({ id: log._id.toString(), userId: log.userId.toString(), date: log.date.toISOString(), weightKg: log.weightKg });
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
