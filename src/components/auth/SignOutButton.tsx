'use client';

import { signOut } from 'next-auth/react';

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/auth/signin' })}
      className="text-sm text-gray-600 hover:text-gray-900"
    >
      Sign out
    </button>
  );
} 