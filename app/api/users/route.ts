import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/User';
import { getUserFromRequest, hasPermission, DEFAULT_PERMISSIONS } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(user, 'users', 'read')) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    await connectDB();
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: users });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = getUserFromRequest(req);
    if (!currentUser) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    if (!hasPermission(currentUser, 'users', 'create')) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    await connectDB();
    const body = await req.json();
    const { name, email, password, role, shopIds, permissions } = body;
    if (!name || !email || !password) {
      return NextResponse.json({ success: false, message: 'Name, email, password required' }, { status: 400 });
    }
    if (currentUser.role === 'admin' && role === 'super-admin') {
      return NextResponse.json({ success: false, message: 'Cannot create super-admin' }, { status: 403 });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return NextResponse.json({ success: false, message: 'Email already exists' }, { status: 400 });
    const perms = permissions && Object.keys(permissions).length > 0
      ? permissions
      : DEFAULT_PERMISSIONS[role] || {};
    const newUser = await User.create({ name, email: email.toLowerCase(), password, role: role || 'sales-man', shopIds: shopIds || [], permissions: perms });
    return NextResponse.json({ success: true, data: newUser }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
