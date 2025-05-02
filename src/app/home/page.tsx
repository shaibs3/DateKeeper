import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import HomeClient from './HomeClient';

export default async function HomePage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/');
  }

  return <HomeClient />;
} 