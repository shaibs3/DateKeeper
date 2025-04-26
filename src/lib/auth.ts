import Google from 'next-auth/providers/google';
import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

// Only import Prisma if we have a database URL
const prismaConfig = process.env.DATABASE_URL
  ? {
      adapter: (await import('@auth/prisma-adapter')).PrismaAdapter(
        (await import('@/lib/prisma')).prisma
      ),
    }
  : {};

export const {
  handlers: { GET, POST },
  auth,
} = NextAuth({
  ...prismaConfig,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signin',
    error: '/auth/signin',
  },
}); 