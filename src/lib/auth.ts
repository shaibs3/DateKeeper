import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from '@/lib/prisma';
import { config, validateEnvironment } from '@/lib/config';

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

// Validate environment variables on startup
validateEnvironment();

export const {
  handlers: { GET, POST },
  auth,
} = NextAuth({
  providers: [
    GoogleProvider({
      clientId: config.auth.google.clientId,
      clientSecret: config.auth.google.clientSecret,
      authorization: {
        params: {
          prompt: 'select_account consent',
        },
      },
    }),
  ],
  debug: config.features.debugMode,
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
  secret: config.auth.secret,
}); 