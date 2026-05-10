import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Sale from '@/lib/models/Sale';
import Product from '@/lib/models/Product';
import Customer from '@/lib/models/Customer';
import { getUserFromRequest, hasPermission, canAccessShop } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const shopId = req.nextUrl.searchParams.get('shopId');
    const dateFrom = req.nextUrl.searchParams.get('dateFrom');
    const dateTo = req.nextUrl.searchParams.get('dateTo');
    if (!shopId) return NextResponse.json({ success: false, message: 'shopId required' }, { status: 400 });
    if (!canAccessShop(user, shopId)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    const filter: any = { shopId };
    if (dateFrom) filter.date = { ...filter.date, $gte: dateFrom };
    if (dateTo) filter.date = { ...filter.date, $lte: dateTo };
    const sales = await Sale.find(filter).populate('customerId items.productId').sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: sales });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(user, 'sales', 'create')) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    await connectDB();
    const body = await req.json();
    if (!canAccessShop(user, body.shopId)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    body.createdBy = user.userId;
    const sale = await Sale.create(body);
    // Update product stock
    for (const item of body.items) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.qty } });
    }
    // Update customer due
    if (body.customerId && body.dueAmount > 0) {
      await Customer.findByIdAndUpdate(body.customerId, { $inc: { totalDue: body.dueAmount } });
    }
    return NextResponse.json({ success: true, data: sale }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
