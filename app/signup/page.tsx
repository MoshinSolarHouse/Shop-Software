'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Store } from 'lucide-react';
import Link from 'next/link';

export default function SignupPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !password) { toast.error('Please fill in all fields'); return; }
    if (password !== confirmPassword) { toast.error('Passwords do not match'); return; }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ name, email, password, role: 'admin' }),
      });
      const data = await res.json();
      if (!data.success) { toast.error(data.message || 'Signup failed'); setLoading(false); return; }
      const { error } = await login(email, password);
      if (error) { toast.error(error); }
      else { toast.success('Account created!'); router.push('/dashboard'); }
    } catch (err: any) { toast.error(err.message); }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-green-600 mb-3">
            <Store className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-sm font-semibold text-gray-900">BizManager</h1>
          <p className="text-xs text-gray-500 mt-1">Multi-Shop Business Management</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Create your account</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Name</label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="text-sm h-9" /></div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Email</label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="text-sm h-9" /></div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Password</label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" className="text-sm h-9" /></div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Confirm Password</label><Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat password" className="text-sm h-9" /></div>
            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white text-sm h-9" disabled={loading}>
              {loading ? 'Creating...' : 'Create Account'}
            </Button>
          </form>
          <p className="text-xs text-gray-500 mt-4 text-center">
            Already have an account? <Link href="/login" className="text-green-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
