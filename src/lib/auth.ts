import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from '@/lib/prisma';

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

// Verify required environment variables
if (!process.env.GOOGLE_CLIENT_ID) {
  throw new Error('GOOGLE_CLIENT_ID is not set');
}
if (!process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error('GOOGLE_CLIENT_SECRET is not set');
}
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET is not set');
}
if (!process.env.NEXTAUTH_URL) {
  throw new Error('NEXTAUTH_URL is not set');
}

export const {
  handlers: { GET, POST },
  auth,
} = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'select_account consent',
        },
      },
    }),
  ],
  debug: true,
  callbacks: {
    async signIn({ user, account: _account, profile: _profile }) {
      if (!user.email) return false;
      const existingUser = await prisma.user.findUnique({ where: { email: user.email } });
      if (!existingUser) {
        await prisma.user.create({
          data: {
            email: user.email,
            name: user.name || '',
            image: user.image || null,
          },
        });
      }
      return true;
    },
    session({ session }) {
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allow sign out to go to the root
      if (url === '/' || url === baseUrl) return baseUrl;
      // Allow relative URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      // Allow URLs from the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET,
}); 