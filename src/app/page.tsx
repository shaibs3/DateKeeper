import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export default async function RootPage() {
  const session = await auth();

  if (session?.user) {
    redirect('/home');
  }

  // Public landing or sign-in page for unauthenticated users
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to Birthday Buddy!</h1>
        <p className="text-lg text-gray-600 mb-8">Sign in to start tracking your important dates.</p>
        <a href="/auth/signin" className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition-colors">Sign In</a>
      </div>
    </main>
  );
}
