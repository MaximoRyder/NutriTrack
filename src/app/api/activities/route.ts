import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ActivityLog } from '@/lib/models';
import connectDB from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || (session.user as any).id;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    await connectDB();
    
    let query: any = { userId };
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const logs = await ActivityLog.find(query).sort({ date: -1 }); // Newest first for activities usually
    return NextResponse.json(logs.map(l => ({ 
      id: l._id.toString(), 
      userId: l.userId.toString(), 
      activityType: l.activityType,
      durationMinutes: l.durationMinutes,
      intensity: l.intensity,
      date: l.date.toISOString()
    })));
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    
    const body = await request.json();
    const { date, activityType, durationMinutes, intensity, userId } = body;
    
    if (!date || !activityType || !durationMinutes) return NextResponse.json({ error: 'Campos faltantes' }, { status: 400 });
    
    await connectDB();
    
    const targetUserId = userId || (session.user as any).id;

    const log = await ActivityLog.create({ 
      userId: targetUserId, 
      date: new Date(date), 
      activityType,
      durationMinutes,
      intensity
    });
    
    return NextResponse.json({ 
      id: log._id.toString(), 
      userId: log.userId.toString(), 
      date: log.date.toISOString(), 
      activityType: log.activityType,
      durationMinutes: log.durationMinutes,
      intensity: log.intensity
    });
  } catch (e:any) {
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
    
    const updated = await ActivityLog.findOneAndUpdate(
      { _id: id, userId: (session.user as any).id },
      { $set: { ...body, date: new Date(body.date) } },
      { new: true }
    );
    
    if (!updated) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    
    return NextResponse.json({ success: true });
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });
    
    await connectDB();
    
    const deleted = await ActivityLog.findOneAndDelete({
      _id: id,
      userId: (session.user as any).id
    });
    
    if (!deleted) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    
    return NextResponse.json({ success: true });
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
