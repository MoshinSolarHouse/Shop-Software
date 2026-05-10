import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import { getUserFromRequest, hasPermission, canAccessShop } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const shopId = req.nextUrl.searchParams.get('shopId');
    if (!shopId) return NextResponse.json({ success: false, message: 'shopId required' }, { status: 400 });
    if (!canAccessShop(user, shopId)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    const products = await Product.find({ shopId, isActive: true }).populate('categoryId').sort({ name: 1 });
    return NextResponse.json({ success: true, data: products });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(user, 'products', 'create')) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    await connectDB();
    const body = await req.json();
    if (!canAccessShop(user, body.shopId)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    const product = await Product.create(body);
    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
