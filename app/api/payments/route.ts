import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Payment from '@/lib/models/Payment';
import Sale from '@/lib/models/Sale';
import Customer from '@/lib/models/Customer';
import { getUserFromRequest, hasPermission, canAccessShop } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const shopId = req.nextUrl.searchParams.get('shopId');
    const referenceId = req.nextUrl.searchParams.get('referenceId');
    const partyId = req.nextUrl.searchParams.get('partyId');
    if (!shopId) return NextResponse.json({ success: false, message: 'shopId required' }, { status: 400 });
    const filter: any = { shopId };
    if (referenceId) filter.referenceId = referenceId;
    if (partyId) filter.partyId = partyId;
    const payments = await Payment.find(filter).sort({ date: -1 });
    return NextResponse.json({ success: true, data: payments });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(user, 'payments', 'create')) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    await connectDB();
    const body = await req.json();
    if (!canAccessShop(user, body.shopId)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    body.createdBy = user.userId;
    const payment = await Payment.create(body);
    // Update sale received/due
    if (body.referenceType === 'sale') {
      const sale = await Sale.findById(body.referenceId);
      if (sale) {
        const newReceived = sale.receivedAmount + body.amount;
        const newDue = sale.totalAmount - newReceived;
        await Sale.findByIdAndUpdate(body.referenceId, { receivedAmount: newReceived, dueAmount: Math.max(0, newDue) });
        if (sale.customerId) {
          await Customer.findByIdAndUpdate(sale.customerId, { $inc: { totalDue: -body.amount } });
        }
      }
    }
    return NextResponse.json({ success: true, data: payment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
