import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Shop from '@/lib/models/Shop';
import { getUserFromRequest, hasPermission, canAccessShop } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(user, 'shops', 'update')) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    await connectDB();
    const body = await req.json();
    const updated = await Shop.findByIdAndUpdate(params.id, body, { new: true });
    if (!updated) return NextResponse.json({ success: false, message: 'Shop not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
