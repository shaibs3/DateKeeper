'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import SignOutButton from './auth/SignOutButton';

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-gray-900">
            Remindr
          </Link>
          <div className="flex items-center space-x-4">
            {session ? (
              <>
                <span className="text-sm text-gray-600">{session.user?.name}</span>
                <SignOutButton />
              </>
            ) : (
              <Link href="/auth/signin" className="text-sm text-gray-600 hover:text-gray-900">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
