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
    if (!hasPermission(user, 'reports', 'read')) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    await connectDB();
    const shopId = req.nextUrl.searchParams.get('shopId');
    const type = req.nextUrl.searchParams.get('type') || 'sales';
    const dateFrom = req.nextUrl.searchParams.get('dateFrom');
    const dateTo = req.nextUrl.searchParams.get('dateTo');
    if (!shopId) return NextResponse.json({ success: false, message: 'shopId required' }, { status: 400 });
    if (!canAccessShop(user, shopId)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    const filter: any = { shopId };
    if (dateFrom) filter.date = { ...filter.date, $gte: dateFrom };
    if (dateTo) filter.date = { ...filter.date, $lte: dateTo };
    if (type === 'sales') {
      const sales = await Sale.find(filter).populate('customerId').sort({ date: -1 });
      return NextResponse.json({ success: true, data: sales });
    } else if (type === 'profit') {
      const sales = await Sale.find(filter).populate('items.productId');
      const profitData = sales.map((sale: any) => {
        let totalCost = 0;
        let totalRevenue = 0;
        sale.items.forEach((item: any) => {
          const costPrice = item.productId?.costPrice || 0;
          totalCost += costPrice * item.qty;
          totalRevenue += item.unitPrice * item.qty;
        });
        return { date: sale.date, revenue: totalRevenue, cost: totalCost, profit: totalRevenue - totalCost, saleId: sale._id };
      });
      return NextResponse.json({ success: true, data: profitData });
    } else if (type === 'customer-dues') {
      const customers = await Customer.find({ shopId, totalDue: { $gt: 0 } }).sort({ totalDue: -1 });
      return NextResponse.json({ success: true, data: customers });
    }
    return NextResponse.json({ success: false, message: 'Invalid report type' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
