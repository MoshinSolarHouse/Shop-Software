import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Shop from '@/lib/models/Shop';
import { getUserFromRequest, hasPermission } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    await connectDB();
    let shops;
    if (user.role === 'super-admin') {
      shops = await Shop.find().sort({ createdAt: 1 });
    } else {
      shops = await Shop.find({ _id: { $in: user.shopIds } }).sort({ createdAt: 1 });
    }
    return NextResponse.json({ success: true, data: shops });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(user, 'shops', 'create')) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    await connectDB();
    const body = await req.json();
    const shop = await Shop.create(body);
    return NextResponse.json({ success: true, data: shop }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
