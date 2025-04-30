'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { FcGoogle } from 'react-icons/fc';

export default function SignIn() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push('/home');
    }
  }, [session, router]);

  const handleGoogleSignIn = async () => {
    try {
      await signIn('google', { callbackUrl: '/home' });
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center">
        <div className="mb-6 flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mb-2">
            <span className="text-3xl font-bold text-white">BB</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Sign in to BirthdayBuddy</h2>
          <p className="text-gray-500 text-sm">Welcome back! Please sign in to continue.</p>
        </div>
        <button
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg border border-gray-200 bg-white shadow hover:shadow-md transition-all font-semibold text-gray-700 text-base mb-4"
        >
          <FcGoogle className="text-2xl" />
          Sign in with Google
        </button>
        {/* Optionally, add more providers or a divider here */}
      </div>
    </div>
  );
} 