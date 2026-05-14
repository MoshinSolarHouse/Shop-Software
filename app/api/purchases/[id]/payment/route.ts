import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Purchase from '@/lib/models/Purchase';
import Payment from '@/lib/models/Payment';
import { getUserFromRequest, hasPermission, canAccessShop } from '@/lib/auth';

/**
 * Record a payment for an existing purchase
 * Supports partial payments, full payments, and "pay later" tracking
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(user, 'purchases', 'update')) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    
    await connectDB();
    const purchase = await Purchase.findById(params.id);
    
    if (!purchase) return NextResponse.json({ success: false, message: 'Purchase not found' }, { status: 404 });
    if (!canAccessShop(user, purchase.shopId.toString())) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    
    const body = await req.json();
    const paymentAmount = Number(body.amount) || 0;
    const paymentDate = body.date || new Date().toISOString().split('T')[0];
    const paymentMethod = body.method || 'cash';
    const notes = body.notes || '';
    
    if (paymentAmount <= 0) {
      return NextResponse.json({ success: false, message: 'Payment amount must be greater than 0' }, { status: 400 });
    }
    
    // Check if payment exceeds remaining due
    const remainingDue = purchase.dueAmount;
    if (paymentAmount > remainingDue) {
      return NextResponse.json({
        success: false,
        message: `Payment amount (${paymentAmount}) exceeds remaining due (${remainingDue})`,
      }, { status: 400 });
    }
    
    // Update purchase: increment paidAmount and update dueAmount
    const newPaidAmount = purchase.paidAmount + paymentAmount;
    const newDueAmount = purchase.totalAmount - newPaidAmount;
    const newStatus = newDueAmount <= 0 ? 'paid' : 'unpaid';
    
    const updated = await Purchase.findByIdAndUpdate(
      params.id,
      {
        paidAmount: newPaidAmount,
        dueAmount: newDueAmount,
        status: newStatus,
      },
      { new: true }
    ).populate('supplierId items.productId');
    
    // Create payment record
    const payment = await Payment.create({
      shopId: purchase.shopId,
      partyId: purchase.supplierId,
      partyType: 'supplier',
      referenceType: 'purchase',
      referenceId: purchase._id,
      amount: paymentAmount,
      method: paymentMethod,
      date: paymentDate,
      notes: notes || `Payment for purchase ${purchase.referenceNo || purchase._id}`,
      createdBy: user.userId,
    });
    
    return NextResponse.json({
      success: true,
      data: updated,
      payment,
      summary: {
        totalAmount: purchase.totalAmount,
        previousPaidAmount: purchase.paidAmount,
        paymentAmount,
        newPaidAmount,
        newDueAmount,
        status: newStatus,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

/**
 * Get all payments for a purchase
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    
    await connectDB();
    const purchase = await Purchase.findById(params.id);
    
    if (!purchase) return NextResponse.json({ success: false, message: 'Purchase not found' }, { status: 404 });
    if (!canAccessShop(user, purchase.shopId.toString())) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    
    // Fetch all payments for this purchase
    const payments = await Payment.find({
      referenceId: params.id,
      referenceType: 'purchase',
    }).sort({ createdAt: 1 });
    
    return NextResponse.json({
      success: true,
      data: payments,
      summary: {
        totalAmount: purchase.totalAmount,
        totalPaid: purchase.paidAmount,
        remainingDue: purchase.dueAmount,
        status: purchase.status,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
