'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  const getErrorMessage = (errorType: string | null) => {
    switch (errorType) {
      case 'UserNotRegistered':
        return {
          title: 'Account Not Found',
          message: 'No account found with this email address. Please sign up first.',
          actionText: 'Sign Up',
          actionUrl: '/auth/signup',
          secondaryActionText: 'Back to Sign In',
          secondaryActionUrl: '/auth/signin',
        };
      case 'UserAlreadyExists':
        return {
          title: 'Account Already Exists',
          message: 'An account with this email already exists. Please sign in instead.',
          actionText: 'Sign In',
          actionUrl: '/auth/signin',
          secondaryActionText: 'Back to Sign Up',
          secondaryActionUrl: '/auth/signup',
        };
      default:
        return {
          title: 'Authentication Error',
          message: `An error occurred during authentication: ${errorType || 'Unknown error'}`,
          actionText: 'Return to Sign In',
          actionUrl: '/auth/signin',
        };
    }
  };

  const errorInfo = getErrorMessage(error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {errorInfo.title}
          </h2>
          <div className="mt-4 p-4 bg-red-50 rounded-md">
            <p className="text-sm text-red-700">
              {errorInfo.message}
            </p>
            {errorDescription && (
              <p className="mt-2 text-sm text-red-700">
                Details: {errorDescription}
              </p>
            )}
          </div>
        </div>
        <div className="mt-8 space-y-3">
          <a
            href={errorInfo.actionUrl}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {errorInfo.actionText}
          </a>
          {errorInfo.secondaryActionText && (
            <a
              href={errorInfo.secondaryActionUrl}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {errorInfo.secondaryActionText}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthError() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthErrorContent />
    </Suspense>
  );
} 