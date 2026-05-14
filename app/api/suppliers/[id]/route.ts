import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Supplier from '@/lib/models/Supplier';
import { getUserFromRequest, hasPermission, canAccessShop } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    
    await connectDB();
    const supplier = await Supplier.findById(params.id);
    
    if (!supplier) return NextResponse.json({ success: false, message: 'Supplier not found' }, { status: 404 });
    if (!canAccessShop(user, supplier.shopId.toString())) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    
    return NextResponse.json({ success: true, data: supplier });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(user, 'suppliers', 'update')) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    
    await connectDB();
    const supplier = await Supplier.findById(params.id);
    
    if (!supplier) return NextResponse.json({ success: false, message: 'Supplier not found' }, { status: 404 });
    if (!canAccessShop(user, supplier.shopId.toString())) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    
    const body = await req.json();
    const updated = await Supplier.findByIdAndUpdate(params.id, { name: body.name, phone: body.phone, address: body.address }, { new: true });
    
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(user, 'suppliers', 'delete')) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    
    await connectDB();
    const supplier = await Supplier.findById(params.id);
    
    if (!supplier) return NextResponse.json({ success: false, message: 'Supplier not found' }, { status: 404 });
    if (!canAccessShop(user, supplier.shopId.toString())) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    
    await Supplier.findByIdAndDelete(params.id);
    
    return NextResponse.json({ success: true, message: 'Supplier deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
