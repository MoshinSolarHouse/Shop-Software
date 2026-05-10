import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/User';
import { signToken, DEFAULT_PERMISSIONS } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ success: false, message: 'Email and password required' }, { status: 400 });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.isActive) {
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }
    const perms = user.permissions && Object.keys(user.permissions).length > 0
      ? user.permissions
      : DEFAULT_PERMISSIONS[user.role] || {};
    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      shopIds: user.shopIds.map((id: any) => id.toString()),
      permissions: perms,
    });
    return NextResponse.json({
      success: true,
      data: {
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role, shopIds: user.shopIds, permissions: perms },
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
