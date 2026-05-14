import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Supplier from '@/lib/models/Supplier';
import Purchase from '@/lib/models/Purchase';
import Payment from '@/lib/models/Payment';
import { getUserFromRequest, canAccessShop } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    
    await connectDB();
    const supplier = await Supplier.findById(params.id);
    
    if (!supplier) return NextResponse.json({ success: false, message: 'Supplier not found' }, { status: 404 });
    if (!canAccessShop(user, supplier.shopId.toString())) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    
    // Fetch all purchases for this supplier
    const purchases = await Purchase.find({ supplierId: params.id }).sort({ date: 1, createdAt: 1 });
    
    // Fetch all payments for this supplier
    const payments = await Payment.find({ 
      partyId: params.id, 
      partyType: 'supplier',
      referenceType: 'purchase' 
    }).sort({ date: 1, createdAt: 1 });
    
    // Build ledger entries in chronological order
    const ledgerEntries: any[] = [];
    let runningBalance = 0;
    
    // Add purchase entries (debit - supplier owes money)
    purchases.forEach(purchase => {
      ledgerEntries.push({
        date: purchase.date,
        type: 'Purchase',
        description: `Purchase ${purchase.referenceNo || purchase._id}`,
        debit: purchase.totalAmount,
        credit: 0,
        referenceId: purchase._id,
        createdAt: purchase.createdAt,
      });
    });
    
    // Add payment entries (credit - reduction in amount owed)
    payments.forEach(payment => {
      ledgerEntries.push({
        date: payment.date,
        type: 'Payment',
        description: `Payment - ${payment.method}`,
        debit: 0,
        credit: payment.amount,
        referenceId: payment._id,
        createdAt: payment.createdAt,
      });
    });
    
    // Sort by date and createdAt
    ledgerEntries.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) return dateA - dateB;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
    
    // Calculate running balance for each entry
    const ledgerWithBalance = ledgerEntries.map(entry => {
      runningBalance += entry.debit - entry.credit;
      return {
        ...entry,
        balance: runningBalance,
      };
    });
    
    // Calculate totals
    const totalPurchases = purchases.reduce((sum, p) => sum + p.totalAmount, 0);
    const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
    const balance = totalPurchases - totalPayments;
    
    return NextResponse.json({ 
      success: true, 
      data: {
        supplier,
        ledger: ledgerWithBalance,
        summary: {
          totalPurchases,
          totalPayments,
          balance,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
