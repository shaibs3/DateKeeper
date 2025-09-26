'use client';

import { signOut } from 'next-auth/react';
import { clientLogger } from '@/lib/clientLogger';

export default function SignOutButton() {
  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      clientLogger.error('Sign out error', error);
    }
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
    >
      Sign Out
    </button>
  );
}
