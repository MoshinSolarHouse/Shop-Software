import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Purchase from '@/lib/models/Purchase';
import Payment from '@/lib/models/Payment';
import { getUserFromRequest, canAccessShop } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await req.json().catch(() => ({}));
    const amount = Number(body.amount || 0);
    const method = body.method || 'cash';

    if (amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid payment amount' },
        { status: 400 }
      );
    }

    const purchase = await Purchase.findById(params.id);

    if (!purchase) {
      return NextResponse.json(
        { success: false, message: 'Purchase not found' },
        { status: 404 }
      );
    }

    if (!canAccessShop(user, purchase.shopId)) {
      return NextResponse.json(
        { success: false, message: 'Forbidden' },
        { status: 403 }
      );
    }

    // update payment
    purchase.paidAmount = (purchase.paidAmount || 0) + amount;
    purchase.dueAmount = purchase.totalAmount - purchase.paidAmount;
    purchase.status = purchase.dueAmount <= 0 ? 'paid' : 'unpaid';

    await purchase.save();

    // create payment record
    await Payment.create({
      shopId: purchase.shopId,
      partyId: purchase.supplierId,
      partyType: 'supplier',
      referenceType: 'purchase',
      referenceId: purchase._id,
      amount,
      method,
      date: new Date(),
      createdBy: user.userId,
    });

    return NextResponse.json({
      success: true,
      data: purchase,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}