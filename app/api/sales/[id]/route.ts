import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Sale from '@/lib/models/Sale';
import { getUserFromRequest, hasPermission } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const sale = await Sale.findById(params.id).populate('customerId items.productId');
    if (!sale) return NextResponse.json({ success: false, message: 'Sale not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: sale });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
