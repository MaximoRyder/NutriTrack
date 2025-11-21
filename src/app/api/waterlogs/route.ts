import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { WaterLog } from '@/lib/models';
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

    const logs = await WaterLog.find(query).sort({ date: 1 });
    return NextResponse.json(logs.map(l => ({ 
      id: l._id.toString(), 
      userId: l.userId.toString(), 
      date: l.date.toISOString(), 
      quantityMl: l.quantityMl 
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
    const { date, quantityMl, userId } = body;
    
    if (!date || !quantityMl) return NextResponse.json({ error: 'Campos faltantes' }, { status: 400 });
    
    await connectDB();
    
    // Allow nutritionists to log for patients if userId is provided, otherwise log for self
    const targetUserId = userId || (session.user as any).id;

    const log = await WaterLog.create({ 
      userId: targetUserId, 
      date: new Date(date), 
      quantityMl 
    });
    
    return NextResponse.json({ 
      id: log._id.toString(), 
      userId: log.userId.toString(), 
      date: log.date.toISOString(), 
      quantityMl: log.quantityMl 
    });
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
